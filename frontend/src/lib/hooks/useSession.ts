"use client";

import { useCallback, useEffect, useRef } from "react";
import { SessionWebSocket, WSStatus } from "@/lib/api/websocket";
import { base64ToAudioUrl } from "@/lib/api/client";
import { showToast } from "@/components/common/Toast";
import type { UserType } from "@/lib/state/sessionStore";
import { useSessionStore } from "@/lib/state/sessionStore";
import { buildSpellPlan } from "@/lib/sign/spellingPlan";
import {
  buildArslSpellPlan,
  inferSignPhraseKey,
  isPrimarilyArabic,
} from "@/lib/sign/vocabulary";

/** Finger-spell Latin text with ASL letter gestures (deaf / both). */
function applySpellPreviewForDeaf(text: string, extras?: { assetUrl?: string }) {
  const showSp = useSessionStore.getState().signShowSpacesBetweenLetters;
  const spellPlan = buildSpellPlan(text, showSp);
  useSessionStore.getState().setSignPreview({
    phraseKey: text.slice(0, 140),
    spellSourceText: text,
    spellPlan,
    motionPlan: undefined,
    ...extras,
  });
}

/** ArSL finger-spelling with hand-shape emoji per letter. */
function applyArslPreview(text: string, extras?: { assetUrl?: string }) {
  const showSp = useSessionStore.getState().signShowSpacesBetweenLetters;
  const spellPlan = buildArslSpellPlan(text, showSp);
  useSessionStore.getState().setSignPreview({
    phraseKey: text.slice(0, 140),
    spellSourceText: text,
    spellPlan,
    motionPlan: undefined,
    ...extras,
  });
}

/** Update 2D/3D signer from AI output (peer actions, captions, solo AI). */
function applySignPreviewFromAiText(text: string, userType: UserType | null | undefined) {
  const trimmed = text.trim();
  if (!trimmed) return;

  // Arabic → same ArSL hand shapes as Sign keyboard (عربي tab), letter by letter.
  if (isPrimarilyArabic(trimmed)) {
    applyArslPreview(trimmed);
    return;
  }

  const phraseKey = inferSignPhraseKey(trimmed);
  if (phraseKey) {
    useSessionStore.getState().setSignPreview({
      phraseKey,
      spellPlan: undefined,
      spellSourceText: undefined,
      motionPlan: undefined,
    });
    return;
  }

  if (userType === "deaf" || userType === "both") {
    applySpellPreviewForDeaf(trimmed);
  }
}

export interface UseSessionOptions {
  /** Short-lived JWT from POST /sessions/{id}/ws-ticket */
  wsToken?: string | null;
  /**
   * Communication profile of the current user.
   * Passed directly so WS event callbacks never read a stale Zustand value
   * (the store is synced asynchronously via useEffect in ChatWorkspace).
   */
  userType?: UserType | null;
  /** Called when the session is permanently deleted (by you or a peer). */
  onSessionDeleted?: () => void;
}

export function useSession(opts: UseSessionOptions = {}) {
  const { wsToken = null, userType: userTypeProp, onSessionDeleted } = opts;
  const onSessionDeletedRef = useRef(onSessionDeleted);
  useEffect(() => {
    onSessionDeletedRef.current = onSessionDeleted;
  }, [onSessionDeleted]);
  const wsRef = useRef<SessionWebSocket | null>(null);
  const pendingAiMessageId = useRef<Map<string, string>>(new Map());
  /** Server AI message IDs already finalized via ai_final (skip duplicate ai_response). */
  const completedAiServerIds = useRef<Set<string>>(new Set());

  // Keep a stable ref so WS closures always read the current userType
  // without recreating the entire WebSocket when the prop changes.
  const userTypeRef = useRef<UserType | null>(userTypeProp ?? null);
  useEffect(() => {
    userTypeRef.current = userTypeProp ?? null;
  }, [userTypeProp]);

  const {
    sessionId,
    language,
    addMessage,
    updateMessage,
    setLiveCaption,
    setLiveAiResponse,
    clearLiveResponse,
    setSystemStatus,
    setIsConnected,
    setActiveAudioId,
    setSignPreview,
    setPeerLeftAlert,
    setPeerJoinAlert,
    setReplyEmotionHint,
    setRoomHasPeer,
  } = useSessionStore();

  const isSoloRoom = () => !useSessionStore.getState().roomHasPeer;

  const handleWSStatus = useCallback(
    (status: WSStatus) => {
      const connected = status === "connected";
      setIsConnected(connected);
      if (status === "disconnected") {
        showToast("error", "Connection lost — reconnecting…");
        setSystemStatus("idle");
      }
    },
    [setIsConnected, setSystemStatus]
  );

  useEffect(() => {
    const ws = new SessionWebSocket(sessionId, wsToken);
    wsRef.current = ws;

    // ── Status ───────────────────────────────────────────────
    ws.on("status", (e) => {
      const state = e.state as "idle" | "listening" | "processing" | "speaking";
      setSystemStatus(state);
    });

    // ── Session joined (contract: session_joined) ─────────────
    ws.on("session_joined", (e) => {
      setIsConnected(true);
      setSystemStatus("idle");
      const peerCount = typeof e.peerCount === "number" ? e.peerCount : 0;
      setRoomHasPeer(peerCount > 0);
    });

    ws.on("room_presence", (e) => {
      const peerCount = typeof e.peerCount === "number" ? e.peerCount : 0;
      setRoomHasPeer(peerCount > 0);
    });

    // ── Interim transcript (contract: transcript_interim) ─────
    ws.on("transcript_interim", (e) => {
      setLiveCaption(e.text as string);
      setSystemStatus("processing");
    });

    // ── Live caption (legacy alias: transcript_partial) ───────
    ws.on("transcript_partial", (e) => {
      setLiveCaption(e.text as string);
      setSystemStatus("processing");
    });

    // ── Final transcript (contract: transcript_final) ─────────
    const applySentimentToMessage = (
      serverMsgId: string | undefined,
      label: string,
      confidence: number,
      sentimentSource?: string
    ) => {
      const patch = {
        sentimentLabel: label,
        sentimentScore: confidence,
        ...(sentimentSource ? { sentimentSource } : {}),
      };
      if (serverMsgId) {
        const mapped = pendingAiMessageId.current.get(serverMsgId);
        if (mapped) {
          updateMessage(mapped, patch);
          return;
        }
      }
      const messages = useSessionStore.getState().messages;
      for (let i = messages.length - 1; i >= 0; i -= 1) {
        const m = messages[i];
        if (
          !m.fromPeer &&
          (m.role === "user" || m.role === "transcript") &&
          !m.sentimentLabel
        ) {
          updateMessage(m.id, patch);
          if (serverMsgId) {
            pendingAiMessageId.current.set(serverMsgId, m.id);
          }
          break;
        }
      }
    };

    ws.on("sentiment", (e) => {
      const serverMsgId = e.messageId as string | undefined;
      const label = (e.label as string) || "neutral";
      const confidence = typeof e.confidence === "number" ? e.confidence : 0;
      const sentimentSource = e.sentimentSource as string | undefined;
      applySentimentToMessage(serverMsgId, label, confidence, sentimentSource);
    });

    ws.on("emotion_tuned", (e) => {
      if (!isSoloRoom()) return;
      const label = (e.label as string) || "";
      const confidence = typeof e.confidence === "number" ? e.confidence : 0;
      if (!label || confidence < 0.62) return;
      setReplyEmotionHint({
        label,
        confidence,
        messageId: (e.messageId as string) || undefined,
      });
    });

    ws.on("transcript_final", (e) => {
      setLiveCaption("");
      setSystemStatus("idle");
      const transcriptText = e.text as string;
      const id = addMessage({
        role: "transcript",
        text: transcriptText,
        confidence: e.confidence as number,
        detectedLang: e.lang as string,
        sentimentLabel: (e.sentimentLabel as string) || undefined,
        sentimentScore:
          typeof e.sentimentScore === "number" ? (e.sentimentScore as number) : undefined,
        sentimentSource: (e.sentimentSource as string) || undefined,
      });
      applySignPreviewFromAiText(transcriptText, userTypeRef.current);
      // Map server messageId → local message id for subsequent AI linking
      if (e.messageId) {
        pendingAiMessageId.current.set(e.messageId as string, id);
      }
    });

    // ── AI partial ────────────────────────────────────────────
    ws.on("ai_partial", (e) => {
      const msgId = e.messageId as string;
      const text = e.text as string;
      const action = e.action as string | undefined;
      if (!msgId) return;

      const role = action ? "action-result" : "assistant";
      if (!action && !isSoloRoom()) return;

      if (!pendingAiMessageId.current.has(msgId)) {
        const localId = addMessage({
          role,
          text,
          isPartial: true,
          action,
          sourceMessageId: e.sourceMessageId as string | undefined,
        });
        pendingAiMessageId.current.set(msgId, localId);
        clearLiveResponse();
        if (action && text.trim()) {
          applySignPreviewFromAiText(text, userTypeRef.current);
        }
        return;
      }

      const localId = pendingAiMessageId.current.get(msgId)!;
      updateMessage(localId, { text, isPartial: true, action, role });

      if (action && text.trim()) {
        applySignPreviewFromAiText(text, userTypeRef.current);
      }
    });

    // ── AI final ─────────────────────────────────────────────
    ws.on("ai_final", (e) => {
      const msgId = e.messageId as string;
      const action = e.action as string | undefined;
      const aiText = e.text as string;
      if (msgId) {
        completedAiServerIds.current.add(msgId);
      }
      clearLiveResponse();

      const role = action ? "action-result" : "assistant";
      if (!action && !isSoloRoom()) return;

      const utAi = userTypeRef.current;
      applySignPreviewFromAiText(aiText, utAi);

      if (pendingAiMessageId.current.has(msgId)) {
        const localId = pendingAiMessageId.current.get(msgId)!;
        updateMessage(localId, {
          text: aiText,
          isPartial: false,
          action,
          role,
        });
        pendingAiMessageId.current.delete(msgId);
      } else {
        const localId = addMessage({
          role,
          text: aiText,
          isPartial: false,
          action,
          sourceMessageId: e.sourceMessageId as string | undefined,
        });
        if (action) {
          pendingAiMessageId.current.set(msgId, localId);
        }
      }
    });

    // ── AI response (contract: ai_response) ──────────────────
    // Peers / non-streaming paths only — skip if this client already got ai_final.
    ws.on("ai_response", (e) => {
      if (!isSoloRoom()) return;
      const msgId = e.messageId as string | undefined;
      if (msgId && completedAiServerIds.current.has(msgId)) {
        clearLiveResponse();
        return;
      }
      const aiText = e.text as string;
      clearLiveResponse();
      applySignPreviewFromAiText(aiText, userTypeRef.current);
      addMessage({
        role: "assistant",
        text: aiText,
        isPartial: false,
      });
    });

    // ── TTS ready ─────────────────────────────────────────────
    ws.on("tts_ready", (e) => {
      // Deaf and "both" users cannot hear — skip TTS playback entirely.
      const ut = userTypeRef.current;
      if (ut === "deaf" || ut === "both") return;

      const audioUrl = base64ToAudioUrl(e.audio as string);
      if (!audioUrl) {
        showToast("error", "Audio playback failed — invalid audio data");
        return;
      }
      const audio = new Audio(audioUrl);
      const msgId = e.messageId as string;

      setActiveAudioId(msgId);
      audio.play().catch((err) => {
        console.error("[TTS] play failed", err);
        showToast("error", "Audio playback failed");
        setActiveAudioId(null);
        URL.revokeObjectURL(audioUrl);
      });
      audio.onended = () => {
        setActiveAudioId(null);
        URL.revokeObjectURL(audioUrl);
      };
    });

    // ── Error (contract: error) ────────────────────────────────
    ws.on("error", (e) => {
      const code = e.code as string | undefined;
      const msg = (e.message as string) || "An error occurred";
      console.error("[WS error]", msg, code, e.detail);
      setSystemStatus("idle");
      if (code === "stt_error") {
        showToast(
          "error",
          "Speech recognition failed. Try speaking again or check your microphone."
        );
      } else {
        showToast("error", `Error: ${msg}`);
      }
    });

    ws.on("message", (e) => {
      const kind = e.kind as string;
      const text = (e.text as string) || "";
      if (!text) return;

      applySignPreviewFromAiText(text, userTypeRef.current);

      const localId = addMessage({
        role: kind === "transcript" ? "transcript" : "user",
        text,
        fromPeer: true,
        senderName: (e.senderName as string) || undefined,
        detectedLang: e.lang as string | undefined,
        confidence: e.confidence as number | undefined,
        sentimentLabel: (e.sentimentLabel as string) || undefined,
        sentimentScore:
          typeof e.sentimentScore === "number" ? (e.sentimentScore as number) : undefined,
        sentimentSource: (e.sentimentSource as string) || undefined,
      });
      const serverMsgId = e.messageId as string | undefined;
      if (serverMsgId) {
        pendingAiMessageId.current.set(serverMsgId, localId);
      }
    });

    ws.on("ai_enhancement", (e) => {
      if (!isSoloRoom()) return;
      const t = e.text as string;
      if (t) {
        addMessage({ role: "assistant", text: t });
      }
    });

    ws.on("sign_suggestion", (e) => {
      const phraseKey = e.phraseKey as string;
      const assetUrl = e.assetUrl as string | undefined;
      if (!phraseKey) return;
      const ut = userTypeRef.current;
      if (ut === "deaf" || ut === "both") {
        applySpellPreviewForDeaf(phraseKey, assetUrl ? { assetUrl } : undefined);
        return;
      }
      setSignPreview({ phraseKey, assetUrl });
    });

    ws.on("session_deleted", () => {
      showToast("info", "This session was deleted.");
      setIsConnected(false);
      setSystemStatus("idle");
      onSessionDeletedRef.current?.();
    });

    // ── Peer disconnected ────────────────────────────────────
    ws.on("peer_left", (e) => {
      const name = (e.senderName as string) || "Your partner";
      const msg = (e.message as string) || `${name} has left the conversation.`;
      const peerCount =
        typeof e.peerCount === "number" ? (e.peerCount as number) : 0;
      setRoomHasPeer(peerCount > 0);

      addMessage({ role: "system", text: msg });

      const ut = userTypeRef.current;

      // Mute / normal users can hear → play TTS farewell
      if (ut === "mute" || ut === "normal") {
        const utter = new SpeechSynthesisUtterance(msg);
        utter.rate = 0.95;
        window.speechSynthesis?.speak(utter);
      }

      // Deaf / both users need a prominent visual overlay (they cannot hear TTS)
      setPeerLeftAlert(name);

      // Small toast as secondary confirmation for all users
      showToast("info", `${name} has left the chat`);
    });

    // ── Peer joined (re-joined) notification ─────────────────
    ws.on("peer_joined", (e) => {
      const name = (e.senderName as string) || "Your partner";
      const sid = (e.sessionId as string) || "";
      const ut = userTypeRef.current;
      const status = useSessionStore.getState().systemStatus;

      // Do not interrupt an active mic/STT pipeline with join TTS.
      if (
        (ut === "mute" || ut === "normal") &&
        status !== "listening" &&
        status !== "processing"
      ) {
        const ttsMsg = `${name} is online and wants to join the session.`;
        const utter = new SpeechSynthesisUtterance(ttsMsg);
        utter.rate = 0.95;
        window.speechSynthesis?.cancel();
        window.speechSynthesis?.speak(utter);
      }

      setPeerJoinAlert({ name, sessionId: sid });
      showToast("info", `${name} is online and wants to chat`);
    });

    ws.on("sign_motion_plan", () => {
      const ut = userTypeRef.current;
      if (ut !== "deaf" && ut !== "both") return;
      // Finger-spelling from chat text is authoritative; ignore semantic pose plans.
    });

    ws.connect(handleWSStatus);

    return () => {
      ws.close();
      pendingAiMessageId.current.clear();
      completedAiServerIds.current.clear();
    };
  }, [
    sessionId,
    wsToken,
    addMessage,
    updateMessage,
    setLiveCaption,
    setLiveAiResponse,
    clearLiveResponse,
    setSystemStatus,
    setIsConnected,
    setActiveAudioId,
    setSignPreview,
    setPeerLeftAlert,
    setPeerJoinAlert,
    setReplyEmotionHint,
    setRoomHasPeer,
    handleWSStatus,
  ]);

  const getLiveCameraSentiment = useCallback(() => {
    const cam = useSessionStore.getState().cameraSentiment;
    if (!cam?.label || (cam.confidence ?? 0) < 0.62) {
      return null;
    }
    return { label: cam.label, confidence: cam.confidence };
  }, []);

  const sendText = useCallback(
    (text: string, requestTTS = false) => {
      setReplyEmotionHint(null);
      applySignPreviewFromAiText(text, userTypeRef.current);
      const { manualMood } = useSessionStore.getState();
      wsRef.current?.sendText(
        text,
        requestTTS,
        language,
        getLiveCameraSentiment(),
        manualMood
      );
    },
    [language, setSignPreview, getLiveCameraSentiment, setReplyEmotionHint]
  );

  const sendAudioChunk = useCallback((base64: string, mimeType: string) => {
    wsRef.current?.sendAudioChunk(base64, mimeType);
  }, []);

  const sendAudioEnd = useCallback(() => {
    setReplyEmotionHint(null);
    setSystemStatus("processing");
    const { language: lang, manualMood, setManualMood } = useSessionStore.getState();
    wsRef.current?.sendAudioEnd(lang, getLiveCameraSentiment(), manualMood);
    setManualMood(null);
  }, [getLiveCameraSentiment, setReplyEmotionHint, setSystemStatus]);

  const sendAction = useCallback(
    (action: "simplify" | "clarify" | "translate", text: string, messageId: string) => {
      const targetLang = language === "ar" ? "en" : "ar";
      wsRef.current?.sendAction(action, text, messageId, action === "translate" ? targetLang : undefined);
    },
    [language]
  );

  return {
    sendText,
    sendAudioChunk,
    sendAudioEnd,
    sendAction,
    ws: wsRef,
  };
}

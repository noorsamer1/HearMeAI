"use client";

import { useCallback, useEffect, useRef } from "react";
import { SessionWebSocket, WSStatus } from "@/lib/api/websocket";
import { base64ToAudioUrl } from "@/lib/api/client";
import { showToast } from "@/components/common/Toast";
import type { SignPose } from "@/lib/state/sessionStore";
import { useSessionStore } from "@/lib/state/sessionStore";

export interface UseSessionOptions {
  /** Short-lived JWT from POST /sessions/{id}/ws-ticket */
  wsToken?: string | null;
}

function normalizeSignText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function inferSignPhraseKey(value: string): string | null {
  const text = normalizeSignText(value);
  if (!text) return null;

  const patterns: Array<{ phrase: string; variants: string[] }> = [
    { phrase: "hello", variants: ["hello", "hi", "hey", "مرحبا", "اهلا", "أهلا"] },
    { phrase: "thank you", variants: ["thank you", "thanks", "شكرا", "شكرًا"] },
    { phrase: "how are you", variants: ["how are you", "how r you", "كيف حالك", "كيف حالكم"] },
    { phrase: "help", variants: ["help", "ساعدني", "مساعدة"] },
    { phrase: "yes", variants: ["yes", "نعم", "ايوه", "أيوه"] },
    { phrase: "no", variants: ["no", "لا"] },
    { phrase: "please", variants: ["please", "من فضلك", "لو سمحت"] },
  ];

  for (const { phrase, variants } of patterns) {
    for (const variant of variants) {
      const normalizedVariant = normalizeSignText(variant);
      const pattern = new RegExp(`(^|\\s)${normalizedVariant.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\s|$)`);
      if (pattern.test(text)) return phrase;
    }
  }

  return null;
}

const ALLOWED_SIGN_POSES: readonly SignPose[] = [
  "neutral",
  "wave",
  "thank-you",
  "yes",
  "no",
  "please",
  "help",
  "question",
];

export function useSession(opts: UseSessionOptions = {}) {
  const { wsToken = null } = opts;
  const wsRef = useRef<SessionWebSocket | null>(null);
  const pendingAiMessageId = useRef<Map<string, string>>(new Map());

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
  } = useSessionStore();

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

    // ── Live caption (partial transcript) ────────────────────
    ws.on("transcript_partial", (e) => {
      setLiveCaption(e.text as string);
    });

    // ── Final transcript ──────────────────────────────────────
    ws.on("transcript_final", (e) => {
      setLiveCaption("");
      const transcriptText = e.text as string;
      const id = addMessage({
        role: "transcript",
        text: transcriptText,
        confidence: e.confidence as number,
        detectedLang: e.lang as string,
      });
      const phraseKey = inferSignPhraseKey(transcriptText);
      if (phraseKey) {
        setSignPreview({ phraseKey });
      }
      // Map server messageId → local message id for subsequent AI linking
      if (e.messageId) {
        pendingAiMessageId.current.set(e.messageId as string, id);
      }
    });

    // ── AI partial ────────────────────────────────────────────
    ws.on("ai_partial", (e) => {
      const msgId = e.messageId as string;
      const action = e.action as string | undefined;
      setLiveAiResponse(e.text as string);

      // If this messageId already has a local message, update it in place
      if (pendingAiMessageId.current.has(msgId)) {
        const localId = pendingAiMessageId.current.get(msgId)!;
        updateMessage(localId, { text: e.text as string, isPartial: true });
      }
    });

    // ── AI final ─────────────────────────────────────────────
    ws.on("ai_final", (e) => {
      const msgId = e.messageId as string;
      const action = e.action as string | undefined;
      const aiText = e.text as string;
      clearLiveResponse();
      const phraseKey = inferSignPhraseKey(aiText);
      if (phraseKey) {
        setSignPreview({ phraseKey });
      }

      if (pendingAiMessageId.current.has(msgId)) {
        // Update existing message from partial
        const localId = pendingAiMessageId.current.get(msgId)!;
        updateMessage(localId, {
          text: aiText,
          isPartial: false,
          action,
        });
        pendingAiMessageId.current.delete(msgId);
      } else {
        // New AI message
        const localId = addMessage({
          role: "assistant",
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

    // ── TTS ready ─────────────────────────────────────────────
    ws.on("tts_ready", (e) => {
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

    // ── Error ─────────────────────────────────────────────────
    ws.on("error", (e) => {
      console.error("[WS error]", e.message, e.code);
      setSystemStatus("idle");
    });

    ws.on("message", (e) => {
      const kind = e.kind as string;
      const text = (e.text as string) || "";
      if (!text) return;
      const phraseKey = inferSignPhraseKey(text);
      if (phraseKey) {
        setSignPreview({ phraseKey });
      }
      addMessage({
        role: kind === "transcript" ? "transcript" : "user",
        text,
        fromPeer: true,
        detectedLang: e.lang as string | undefined,
        confidence: e.confidence as number | undefined,
      });
    });

    ws.on("ai_enhancement", (e) => {
      const t = e.text as string;
      if (t) {
        addMessage({ role: "assistant", text: t });
      }
    });

    ws.on("sign_suggestion", (e) => {
      const phraseKey = e.phraseKey as string;
      const assetUrl = e.assetUrl as string | undefined;
      if (phraseKey) {
        setSignPreview({ phraseKey, assetUrl });
      }
    });

    ws.on("sign_motion_plan", (e) => {
      const phraseKey = (e.phraseKey as string) || "llm-plan";
      const rawSteps = Array.isArray(e.sequence) ? e.sequence : [];
      const motionPlan = rawSteps
        .map((step) => {
          if (!step || typeof step !== "object") return null;
          const pose = (step as { pose?: string }).pose;
          const durationMs = Number((step as { durationMs?: number }).durationMs);
          if (!pose || Number.isNaN(durationMs)) return null;
          if (!ALLOWED_SIGN_POSES.includes(pose as SignPose)) return null;
          return {
            pose: pose as SignPose,
            durationMs: Math.max(350, Math.min(durationMs, 2200)),
          };
        })
        .filter((step): step is { pose: SignPose; durationMs: number } => step !== null);

      if (motionPlan.length > 0) {
        setSignPreview({ phraseKey, motionPlan });
      }
    });

    ws.connect(handleWSStatus);

    return () => {
      ws.close();
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
    handleWSStatus,
  ]);

  const sendText = useCallback(
    (text: string, requestTTS = false) => {
      const phraseKey = inferSignPhraseKey(text);
      if (phraseKey) {
        setSignPreview({ phraseKey });
      }
      wsRef.current?.sendText(text, requestTTS, language);
    },
    [language, setSignPreview]
  );

  const sendAudioChunk = useCallback((base64: string, mimeType: string) => {
    wsRef.current?.sendAudioChunk(base64, mimeType);
  }, []);

  const sendAudioEnd = useCallback(() => {
    wsRef.current?.sendAudioEnd(useSessionStore.getState().language);
  }, []);

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

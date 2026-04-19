"use client";

import { useCallback, useEffect, useRef } from "react";
import { SessionWebSocket, WSStatus } from "@/lib/api/websocket";
import { base64ToAudioUrl } from "@/lib/api/client";
import { useSessionStore } from "@/lib/state/sessionStore";

export interface UseSessionOptions {
  /** Short-lived JWT from POST /sessions/{id}/ws-ticket */
  wsToken?: string | null;
}

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
      setIsConnected(status === "connected");
    },
    [setIsConnected]
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
      const id = addMessage({
        role: "transcript",
        text: e.text as string,
        confidence: e.confidence as number,
        detectedLang: e.lang as string,
      });
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
      clearLiveResponse();

      if (pendingAiMessageId.current.has(msgId)) {
        // Update existing message from partial
        const localId = pendingAiMessageId.current.get(msgId)!;
        updateMessage(localId, {
          text: e.text as string,
          isPartial: false,
          action,
        });
        pendingAiMessageId.current.delete(msgId);
      } else {
        // New AI message
        const localId = addMessage({
          role: "assistant",
          text: e.text as string,
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
      const audio = new Audio(audioUrl);
      const msgId = e.messageId as string;

      setActiveAudioId(msgId);
      audio.play().catch(() => {});
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
      const assetUrl = e.assetUrl as string;
      if (phraseKey && assetUrl) {
        setSignPreview({ phraseKey, assetUrl });
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
      wsRef.current?.sendText(text, requestTTS, language);
    },
    [language]
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

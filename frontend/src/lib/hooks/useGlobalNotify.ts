"use client";

/**
 * useGlobalNotify
 *
 * Maintains a lightweight WebSocket connection to /api/v1/ws/notify so that
 * authenticated users receive peer_joined notifications even when they are NOT
 * inside a chat-session room (e.g. on the lobby / dashboard pages).
 *
 * Usage: call this hook once at the app shell level (e.g. inside AppLayout or
 * SessionsWorkspacePage). It is a no-op when no token is available.
 */

import { useEffect, useRef } from "react";
import { useSessionStore } from "@/lib/state/sessionStore";
import { showToast } from "@/components/common/Toast";

const WS_BASE =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_WS_URL ?? window.location.origin.replace(/^http/, "ws"))
    : "";

interface UseGlobalNotifyOptions {
  /** Short-lived JWT for the /ws/notify endpoint — same token flow as ws-ticket */
  wsToken?: string | null;
  userType?: "deaf" | "mute" | "both" | "normal" | null;
}

export function useGlobalNotify({ wsToken, userType }: UseGlobalNotifyOptions = {}) {
  const wsRef = useRef<WebSocket | null>(null);
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const userTypeRef = useRef(userType ?? null);

  useEffect(() => {
    userTypeRef.current = userType ?? null;
  }, [userType]);

  const { setPeerJoinAlert } = useSessionStore();

  useEffect(() => {
    if (!wsToken) return;

    const url = `${WS_BASE}/api/v1/ws/notify?token=${encodeURIComponent(wsToken)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.addEventListener("message", (evt) => {
      try {
        const data = JSON.parse(evt.data as string) as Record<string, unknown>;
        if (data.type === "peer_joined") {
          const name = (data.senderName as string) || "Your partner";
          const sid = (data.sessionId as string) || "";
          const ut = userTypeRef.current;

          // Hearing users get TTS announcement
          if (ut === "mute" || ut === "normal") {
            const ttsMsg = `${name} is online and wants to join the room. Press the button to rejoin the chat.`;
            const utter = new SpeechSynthesisUtterance(ttsMsg);
            utter.rate = 0.95;
            window.speechSynthesis?.speak(utter);
          }

          setPeerJoinAlert({ name, sessionId: sid });
          showToast("info", `${name} is online and wants to chat`);
        }
      } catch {
        // ignore malformed frames
      }
    });

    // Keep-alive ping every 25 s
    pingRef.current = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send("ping");
      }
    }, 25_000);

    ws.addEventListener("close", () => {
      if (pingRef.current) clearInterval(pingRef.current);
    });

    return () => {
      if (pingRef.current) clearInterval(pingRef.current);
      ws.close();
      wsRef.current = null;
    };
  }, [wsToken, setPeerJoinAlert]);
}

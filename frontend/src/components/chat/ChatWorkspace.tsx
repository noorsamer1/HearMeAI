"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { UserX } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ChatTimeline } from "@/components/chat/ChatTimeline";
import { ControlDock } from "@/components/layout/ControlDock";
import { ChatHologramDock } from "@/components/chat/ChatHologramDock";
import { CameraSentimentPanel } from "@/components/chat/CameraSentimentPanel";
import { SignPreview } from "@/components/avatar/SignPreview";
import { PeerJoinOverlay } from "@/components/chat/PeerJoinOverlay";
import { ToastContainer } from "@/components/common/Toast";
import { useSession, UseSessionOptions } from "@/lib/hooks/useSession";
import { useSessionStore } from "@/lib/state/sessionStore";
import { MANUAL_MOOD_CONFIDENCE } from "@/lib/sentiment/sentimentDisplay";

type ProfileUserType = "deaf" | "mute" | "both" | "normal";

export type ChatWorkspaceProps = UseSessionOptions & {
  userType?: ProfileUserType;
};

export function ChatWorkspace({ userType = "deaf", ...sessionOpts }: ChatWorkspaceProps = {}) {
  const router = useRouter();
  // Pass userType directly so WS event handlers in useSession always see
  // the correct value without waiting for the Zustand store to sync.
  const { sendText, sendAudioEnd, sendAction } = useSession({ ...sessionOpts, userType });
  const {
    addMessage,
    setUserType,
    peerLeftAlert,
    setPeerLeftAlert,
  } = useSessionStore();

  // Keep the store in sync so any hook/component can read userType without prop-drilling.
  useEffect(() => {
    setUserType(userType);
  }, [userType, setUserType]);

  const handleSendText = useCallback(
    (text: string, requestTTS: boolean) => {
      const { manualMood } = useSessionStore.getState();
      addMessage({
        role: "user",
        text,
        ...(manualMood
          ? {
              sentimentLabel: manualMood,
              sentimentScore: MANUAL_MOOD_CONFIDENCE,
              sentimentSource: "manual",
            }
          : {}),
      });
      sendText(text, requestTTS);
    },
    [addMessage, sendText]
  );

  const handleAudioStop = useCallback(
    (blob: Blob | null, mimeType: string, durationMs: number) => {
      void sendAudioEnd(blob, mimeType, durationMs);
    },
    [sendAudioEnd]
  );

  const handleAction = useCallback(
    (action: "simplify" | "clarify" | "translate", text: string, messageId: string) => {
      sendAction(action, text, messageId);
    },
    [sendAction]
  );

  const showHologram = userType === "deaf" || userType === "both";
  const showCameraSentiment = true;

  return (
    <>
      <AppLayout userType={userType}>
        <div className="flex flex-col flex-1 min-h-0 min-w-0 relative lg:flex-row">
          <div className="flex flex-col flex-1 min-h-0 min-w-0 relative">
            <ChatTimeline onAction={handleAction} />
            <ControlDock
              onSendText={handleSendText}
              onAudioStop={handleAudioStop}
              userType={userType}
            />
          </div>
          {showCameraSentiment && (
            <aside className="hidden lg:flex w-[min(100%,22rem)] shrink-0 flex-col border-t lg:border-t-0 lg:border-l border-[var(--color-border)] overflow-hidden min-h-0">
              {showHologram && (
                <div className="flex min-h-0 flex-1 flex-col">
                  <ChatHologramDock />
                </div>
              )}
              <CameraSentimentPanel className={showHologram ? "border-t" : "flex-1 border-t-0"} />
            </aside>
          )}
        </div>
      </AppLayout>

      {/* ── Peer-left prominent overlay (visible for ALL user types) ── */}
      <AnimatePresence>
        {peerLeftAlert && (
          <motion.div
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
            role="alertdialog"
            aria-modal="true"
            aria-label="Partner left notification"
          >
            <div
              className="relative w-full max-w-sm rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-4 text-center"
              style={{
                background: "var(--color-surface)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              {/* Pulsing icon */}
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "rgba(239,68,68,0.15)", border: "1.5px solid rgba(239,68,68,0.4)" }}
              >
                <UserX className="w-8 h-8" style={{ color: "#ef4444" }} />
              </div>

              <div>
                <h3
                  className="text-lg font-bold mb-1"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Partner has left
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>
                    {peerLeftAlert}
                  </span>{" "}
                  has closed the conversation.
                </p>
              </div>

              <button
                onClick={() => setPeerLeftAlert(null)}
                className="mt-1 w-full rounded-xl py-2.5 text-sm font-semibold transition-all active:scale-95"
                style={{
                  background: "var(--color-brand)",
                  color: "#fff",
                }}
              >
                OK, got it
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Peer-joined notification — rendered by PeerJoinOverlay (shared with lobby) ── */}
      <PeerJoinOverlay userType={userType} />

      <ToastContainer />
    </>
  );
}

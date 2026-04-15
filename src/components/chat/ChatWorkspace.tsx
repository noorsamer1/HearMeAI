"use client";

import { useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ChatTimeline } from "@/components/chat/ChatTimeline";
import { LiveCaptionPanel } from "@/components/captions/LiveCaptionPanel";
import { ControlDock } from "@/components/layout/ControlDock";
import { ToastContainer } from "@/components/common/Toast";
import { useSession, UseSessionOptions } from "@/lib/hooks/useSession";
import { useTheme } from "@/lib/hooks/useTheme";
import { useSessionStore } from "@/lib/state/sessionStore";

export function ChatWorkspace(sessionOpts: UseSessionOptions = {}) {
  useTheme();
  const { sendText, sendAudioChunk, sendAudioEnd, sendAction } = useSession(sessionOpts);
  const { addMessage } = useSessionStore();

  const handleSendText = useCallback(
    (text: string, requestTTS: boolean) => {
      addMessage({ role: "user", text });
      sendText(text, requestTTS);
    },
    [addMessage, sendText]
  );

  const handleAudioChunk = useCallback(
    (base64: string, mimeType: string) => {
      sendAudioChunk(base64, mimeType);
    },
    [sendAudioChunk]
  );

  const handleAudioStop = useCallback(() => {
    sendAudioEnd();
  }, [sendAudioEnd]);

  const handleAction = useCallback(
    (action: "simplify" | "clarify" | "translate", text: string, messageId: string) => {
      sendAction(action, text, messageId);
    },
    [sendAction]
  );

  return (
    <>
      <AppLayout>
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex flex-1 min-h-0 overflow-hidden">
            <div className="flex flex-col flex-1 min-w-0 border-r border-[var(--color-border)]/60">
              <div className="px-4 py-2 border-b border-[var(--color-border)]/60 bg-[var(--color-surface)]/40">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                  Conversation (Deaf user view)
                </h2>
              </div>
              <ChatTimeline onAction={handleAction} />
            </div>
            <div className="hidden lg:flex">
              <LiveCaptionPanel />
            </div>
          </div>
          <ControlDock
            onSendText={handleSendText}
            onAudioChunk={handleAudioChunk}
            onAudioStop={handleAudioStop}
          />
        </div>
      </AppLayout>
      <ToastContainer />
    </>
  );
}

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

type ProfileUserType = "deaf" | "mute" | "both";

export type ChatWorkspaceProps = UseSessionOptions & {
  /** From account — drives the conversation panel subtitle (Listener vs Speaker). */
  userType?: ProfileUserType;
};

function conversationPanelTitle(userType: ProfileUserType): string {
  if (userType === "mute") return "Conversation (Speaker view)";
  if (userType === "both") return "Conversation (Listener & speaker)";
  return "Conversation (Listener view)";
}

function conversationModeChip(userType: ProfileUserType): string {
  if (userType === "mute") return "Speaker view";
  if (userType === "both") return "Listener & speaker";
  return "Listener view";
}

export function ChatWorkspace({ userType = "deaf", ...sessionOpts }: ChatWorkspaceProps = {}) {
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
        <div className="workspace-gutter flex flex-1 min-h-0 min-w-0">
          <div className="workspace-shell w-full min-h-0 flex flex-col">
            <div className="workspace-gutter flex flex-col flex-1 min-h-0 gap-3">
              <div className="workspace-zone flex flex-1 min-h-0 overflow-hidden">
                <div className="workspace-divider-right flex flex-col flex-1 min-w-0">
                  <div className="workspace-subtle-header px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                        {conversationPanelTitle(userType)}
                      </h2>
                      <span className="workspace-chip">{conversationModeChip(userType)}</span>
                    </div>
                  </div>
                  <ChatTimeline onAction={handleAction} />
                </div>
                <div className="hidden lg:flex">
                  <LiveCaptionPanel />
                </div>
              </div>
              <div className="workspace-zone overflow-hidden">
                <ControlDock
                  onSendText={handleSendText}
                  onAudioChunk={handleAudioChunk}
                  onAudioStop={handleAudioStop}
                />
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
      <ToastContainer />
    </>
  );
}

"use client";

import { useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ChatTimeline } from "@/components/chat/ChatTimeline";
import { ControlDock } from "@/components/layout/ControlDock";
import { ToastContainer } from "@/components/common/Toast";
import { useSession, UseSessionOptions } from "@/lib/hooks/useSession";
import { useTheme } from "@/lib/hooks/useTheme";
import { useSessionStore } from "@/lib/state/sessionStore";

type ProfileUserType = "deaf" | "mute" | "both";

export type ChatWorkspaceProps = UseSessionOptions & {
  userType?: ProfileUserType;
};

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
      <AppLayout userType={userType}>
        {/* Full-width chat — no sidebar caption panel */}
        <div className="flex flex-col flex-1 min-h-0 min-w-0 relative">
          {/* Message feed */}
          <ChatTimeline onAction={handleAction} />

          {/* Floating control dock */}
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

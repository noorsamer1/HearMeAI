"use client";

import { useCallback, useRef } from "react";
import { Send, Volume2, Trash2, Languages } from "lucide-react";
import { clsx } from "clsx";
import { useSessionStore } from "@/lib/state/sessionStore";
import { MicButton } from "@/components/audio/MicButton";
import { Button } from "@/components/common/Button";
import { useTranslations } from "@/lib/i18n";
import { showToast } from "@/components/common/Toast";

interface ControlDockProps {
  onSendText: (text: string, requestTTS: boolean) => void;
  onAudioChunk: (base64: string, mimeType: string) => void;
  onAudioStop: () => void;
}

export function ControlDock({ onSendText, onAudioChunk, onAudioStop }: ControlDockProps) {
  const { inputText, language, setInputText, clearMessages } = useSessionStore();
  const t = useTranslations(language);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(
    (requestTTS = false) => {
      const text = inputText.trim();
      if (!text) return;
      onSendText(text, requestTTS);
      setInputText("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    },
    [inputText, onSendText, setInputText]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(false);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    // Auto-resize
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const handleClear = () => {
    clearMessages();
    showToast("info", "Conversation cleared");
  };

  return (
    <div
      className={clsx(
        "border-t border-[var(--color-border)] bg-[var(--color-bg)]",
        "px-4 py-3"
      )}
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex items-end gap-3">
          {/* Mic button */}
          <div className="flex-shrink-0 pb-1">
            <MicButton
              onChunk={onAudioChunk}
              onStop={onAudioStop}
            />
          </div>

          {/* Text input area */}
          <div className="flex-1 flex flex-col gap-2">
            <div
              className={clsx(
                "flex items-end gap-2 px-4 py-3 rounded-2xl",
                "bg-surface border border-[var(--color-border)]",
                "focus-within:border-brand-500/60 transition-colors duration-150"
              )}
            >
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder={t.controls.placeholder}
                rows={1}
                className={clsx(
                  "flex-1 resize-none bg-transparent outline-none",
                  "text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]",
                  "text-[var(--font-size-base)] leading-relaxed",
                  "max-h-[120px] overflow-y-auto"
                )}
                aria-label={t.controls.placeholder}
                dir={language === "ar" ? "rtl" : "ltr"}
              />

              {/* Send button */}
              <Button
                variant="primary"
                size="icon"
                onClick={() => handleSend(false)}
                disabled={!inputText.trim()}
                aria-label={t.controls.sendMessage}
                title={`${t.controls.send} (Enter)`}
                className="flex-shrink-0 h-9 w-9"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>

            {/* Quick action bar */}
            <div className="flex items-center gap-2">
              {/* Speak aloud button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSend(true)}
                disabled={!inputText.trim()}
                title={t.controls.speakAloud}
                className="gap-1.5 text-xs"
              >
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t.controls.speakAloud}</span>
              </Button>

              <div className="flex-1" />

              {/* Keyboard shortcut hint */}
              <span className="hidden sm:flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                <kbd className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] font-mono">Enter</kbd>
                <span>to send</span>
                <span>·</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] font-mono">⇧ Enter</kbd>
                <span>new line</span>
              </span>

              {/* Clear button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                title={t.controls.clearChat}
                aria-label={t.controls.clearChat}
                className="gap-1.5 text-xs text-[var(--color-text-muted)]"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.controls.clearChat}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

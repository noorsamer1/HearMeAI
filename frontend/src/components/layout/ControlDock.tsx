"use client";

import { useCallback, useRef } from "react";
import { Send, Volume2, Trash2 } from "lucide-react";
import { clsx } from "clsx";
import { useSessionStore } from "@/lib/state/sessionStore";
import { MicButton } from "@/components/audio/MicButton";
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
      if (textareaRef.current) textareaRef.current.style.height = "auto";
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
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const handleClear = () => {
    clearMessages();
    showToast("info", "Conversation cleared");
  };

  const canSend = !!inputText.trim();

  return (
    /* Floating glass dock — sits above the message feed */
    <div className="relative z-20 px-3 sm:px-4 pb-4 pt-2">
      <div className="max-w-3xl mx-auto">
        {/* Main pill container */}
        <div
          className="flex items-end gap-3 px-3 py-3 rounded-2xl"
          style={{
            background: "rgba(12, 18, 32, 0.85)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.05) inset",
          }}
        >
          {/* Mic button */}
          <div className="flex-shrink-0 pb-0.5">
            <MicButton onChunk={onAudioChunk} onStop={onAudioStop} />
          </div>

          {/* Text input */}
          <div className="flex-1 flex items-end gap-2 min-w-0">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={t.controls.placeholder}
              rows={1}
              className="flex-1 resize-none bg-transparent outline-none leading-relaxed max-h-[120px] overflow-y-auto"
              style={{
                color: "var(--color-text-primary)",
                fontSize: "var(--font-size-base)",
              }}
              aria-label={t.controls.placeholder}
              dir={language === "ar" ? "rtl" : "ltr"}
            />

            {/* Speak + send */}
            <div className="flex items-center gap-2 flex-shrink-0 pb-0.5">
              {/* Speak aloud */}
              <button
                onClick={() => handleSend(true)}
                disabled={!canSend}
                title={t.controls.speakAloud}
                aria-label={t.controls.speakAloud}
                className="flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                style={{
                  background: canSend ? "rgba(52,211,153,0.15)" : "transparent",
                  border: "1px solid",
                  borderColor: canSend ? "rgba(52,211,153,0.4)" : "rgba(255,255,255,0.08)",
                  color: canSend ? "#34D399" : "var(--color-text-muted)",
                }}
              >
                <Volume2 className="w-4 h-4" />
              </button>

              {/* Send */}
              <button
                onClick={() => handleSend(false)}
                disabled={!canSend}
                title={`${t.controls.send} (Enter)`}
                aria-label={t.controls.sendMessage}
                className="flex items-center justify-center w-9 h-9 rounded-xl font-semibold transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                style={{
                  background: canSend
                    ? "linear-gradient(135deg, #22D3EE 0%, #6366F1 100%)"
                    : "var(--color-surface-raised)",
                  color: "white",
                  boxShadow: canSend ? "0 0 16px rgba(34,211,238,0.3)" : "none",
                }}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Hint row */}
        <div className="flex items-center justify-between mt-2 px-1">
          <div className="hidden sm:flex items-center gap-1.5" style={{ color: "var(--color-text-muted)" }}>
            <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ background: "rgba(255,255,255,0.06)" }}>Enter</kbd>
            <span className="text-[11px]">send</span>
            <span className="text-[11px] opacity-50">·</span>
            <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ background: "rgba(255,255,255,0.06)" }}>⇧ Enter</kbd>
            <span className="text-[11px]">new line</span>
          </div>

          <button
            onClick={handleClear}
            title={t.controls.clearChat}
            aria-label={t.controls.clearChat}
            className="flex items-center gap-1 text-[11px] transition-colors duration-150 cursor-pointer ml-auto"
            style={{ color: "var(--color-text-muted)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--color-error)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-muted)"; }}
          >
            <Trash2 className="w-3 h-3" />
            <span className="hidden sm:inline">{t.controls.clearChat}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

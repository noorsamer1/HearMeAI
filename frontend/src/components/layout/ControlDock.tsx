"use client";

import { useCallback, useRef, useState } from "react";
import { Send, Volume2, Trash2, HandMetal } from "lucide-react";
import { clsx } from "clsx";
import { AnimatePresence } from "framer-motion";
import { useSessionStore } from "@/lib/state/sessionStore";
import { MicButton } from "@/components/audio/MicButton";
import { SignKeyboard } from "@/components/chat/SignKeyboard";
import { MoodEmojiPicker } from "@/components/chat/MoodEmojiPicker";
import { usesSignLanguage } from "@/lib/sign/signPreviewHelpers";
import { useTranslations } from "@/lib/i18n";
import { showToast } from "@/components/common/Toast";

type UserType = "deaf" | "mute" | "both" | "normal";

interface ControlDockProps {
  onSendText: (text: string, requestTTS: boolean) => void;
  onAudioStop: (blob: Blob | null, mimeType: string, durationMs: number) => void;
  userType?: UserType;
}

export function ControlDock({
  onSendText,
  onAudioStop,
  userType = "deaf",
}: ControlDockProps) {
  const { inputText, language, manualMood, setInputText, setManualMood, clearMessages } =
    useSessionStore();
  const t = useTranslations(language);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showSignKeyboard, setShowSignKeyboard] = useState(false);

  const handleSend = useCallback(
    (requestTTS = false) => {
      const text = inputText.trim();
      if (!text) return;
      onSendText(text, requestTTS);
      setInputText("");
      setManualMood(null);
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    },
    [inputText, onSendText, setInputText, setManualMood]
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

  // Auto-send after keyboard fills the text input
  const handleKeyboardSend = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      onSendText(text.trim(), false);
      setInputText("");
      setManualMood(null);
    },
    [onSendText, setInputText, setManualMood]
  );

  const canSend = !!inputText.trim();
  // Capability flags derived from userType
  // Mic for normal + deaf (speech-to-text); mute/both rely on typing/sign keyboard
  const canSpeak = userType === "normal" || userType === "deaf";
  const canHear  = userType !== "deaf"  && userType !== "both";         // can hear audio → show speak-aloud
  const showSignToggle = usesSignLanguage(userType);                    // sign keyboard for deaf / mute / both

  return (
    <div className="relative z-20 px-3 sm:px-4 pb-4 pt-2">
      <div className="max-w-3xl mx-auto">
        {/* Sign keyboard panel — slides in above the dock */}
        <AnimatePresence>
          {showSignKeyboard && (
            <div className="mb-2">
              <SignKeyboard
                onClose={() => setShowSignKeyboard(false)}
                onSend={handleKeyboardSend}
              />
            </div>
          )}
        </AnimatePresence>

        <MoodEmojiPicker
          language={language}
          value={manualMood}
          onChange={setManualMood}
        />

        {/* Main pill container */}
        <div className="surface-glass-light flex items-end gap-3 rounded-2xl px-3 py-3 shadow-[var(--shadow-lg)]">
          {/* Mic — normal + deaf for voice input; mute/both use text/sign keyboard */}
          {canSpeak && (
            <div className="flex-shrink-0 pb-0.5">
              <MicButton onAudioStop={onAudioStop} />
            </div>
          )}

          {/* Sign keyboard toggle — only for deaf / both users */}
          {showSignToggle && (
            <div className="flex-shrink-0 pb-0.5">
              <button
                type="button"
                onClick={() => setShowSignKeyboard((v) => !v)}
                aria-label={showSignKeyboard ? "Close sign keyboard" : "Open sign keyboard"}
                title="Sign language keyboard"
                className={clsx(
                  "flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-150 cursor-pointer",
                  showSignKeyboard
                    ? "border-[var(--color-accent)] text-[var(--color-accent)]"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-accent)]"
                )}
                style={{
                  background: showSignKeyboard
                    ? "color-mix(in srgb, var(--color-accent) 12%, transparent)"
                    : "transparent",
                  border: "1px solid",
                  borderColor: showSignKeyboard
                    ? "var(--color-accent)"
                    : "var(--color-border-strong)",
                }}
              >
                <HandMetal className="w-4 h-4" />
              </button>
            </div>
          )}

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
              {/* Speak aloud — only for users who can hear (mute users can, deaf/both cannot) */}
              {canHear && (
                <button
                  onClick={() => handleSend(true)}
                  disabled={!canSend}
                  title={t.controls.speakAloud}
                  aria-label={t.controls.speakAloud}
                  className="flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  style={{
                    background: canSend ? "var(--color-success-muted)" : "transparent",
                    border: "1px solid",
                    borderColor: canSend
                      ? "color-mix(in srgb, var(--color-success) 40%, transparent)"
                      : "var(--color-border-strong)",
                    color: canSend ? "var(--color-success)" : "var(--color-text-muted)",
                  }}
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              )}

              {/* Send */}
              <button
                onClick={() => handleSend(false)}
                disabled={!canSend}
                title={`${t.controls.send} (Enter)`}
                aria-label={t.controls.sendMessage}
                className="flex items-center justify-center w-9 h-9 rounded-xl font-semibold transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                style={{
                  background: canSend
                    ? "linear-gradient(135deg, var(--color-brand-400) 0%, var(--color-accent-500) 100%)"
                    : "var(--color-surface-raised)",
                  color: canSend ? "var(--color-text-inverse)" : "var(--color-text-muted)",
                  boxShadow: canSend ? "0 0 16px var(--color-brand-glow)" : "none",
                }}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Hint row */}
        <div className="flex items-center justify-between mt-2 px-1">
          <div
            className="hidden sm:flex items-center gap-1.5"
            style={{ color: "var(--color-text-muted)" }}
          >
            <kbd
              className="rounded px-1.5 py-0.5 font-mono text-[10px]"
              style={{ background: "var(--color-bg-subtle)", color: "var(--color-text-muted)" }}
            >
              Enter
            </kbd>
            <span className="text-[11px]">send</span>
            <span className="text-[11px] opacity-50">·</span>
            <kbd
              className="rounded px-1.5 py-0.5 font-mono text-[10px]"
              style={{ background: "var(--color-bg-subtle)", color: "var(--color-text-muted)" }}
            >
              ⇧ Enter
            </kbd>
            <span className="text-[11px]">new line</span>
          </div>

          <button
            onClick={handleClear}
            title={t.controls.clearChat}
            aria-label={t.controls.clearChat}
            className="flex items-center gap-1 text-[11px] transition-colors duration-150 cursor-pointer ml-auto"
            style={{ color: "var(--color-text-muted)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "var(--color-error)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-muted)";
            }}
          >
            <Trash2 className="w-3 h-3" />
            <span className="hidden sm:inline">{t.controls.clearChat}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { useSessionStore } from "@/lib/state/sessionStore";
import { ChatBubble } from "./ChatBubble";
import { EmotionTuneHint } from "./EmotionTuneHint";
import { useTranslations } from "@/lib/i18n";

interface ChatTimelineProps {
  onAction: (action: "simplify" | "clarify" | "translate", text: string, messageId: string) => void;
}

const EMPTY_SUBTITLES: Record<string, string> = {
  deaf:   "Use the sign language keyboard or type a message below.",
  both:   "Use the sign language keyboard to compose a message.",
  mute:   "Type your message below — your partner will hear it via voice.",
  normal: "Use the microphone to speak, or type a message below.",
};

export function ChatTimeline({ onAction }: ChatTimelineProps) {
  const { messages, liveAiResponse, language, userType, roomHasPeer } = useSessionStore();
  const t = useTranslations(language);
  const emptySubtitle = EMPTY_SUBTITLES[userType ?? "normal"] ?? t.chat.emptySubtitle;
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const showLiveAi = !!liveAiResponse && !roomHasPeer;

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    const distanceFromBottom =
      container.scrollHeight - (container.scrollTop + container.clientHeight);
    if (distanceFromBottom < 200) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, liveAiResponse, showLiveAi]);

  const groupedMessages = useMemo(() => {
    const nowThresholdMs = Date.now() - 15 * 60 * 1000;
    return {
      now: messages.filter((m) => m.timestamp >= nowThresholdMs),
      earlier: messages.filter((m) => m.timestamp < nowThresholdMs),
    };
  }, [messages]);

  const isEmpty = messages.length === 0 && !showLiveAi;

  return (
    <div
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto chat-scroll relative"
      role="log"
      aria-label="Conversation"
      aria-live="polite"
    >
      {/* Top fade */}
      <div
        className="pointer-events-none sticky top-0 z-10 h-8 w-full"
        style={{
          background: "linear-gradient(to bottom, var(--color-bg), transparent)",
        }}
        aria-hidden
      />

      {isEmpty ? (
        /* ── Empty state ── */
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center justify-center h-full py-20 px-6 text-center min-h-[400px]"
        >
          {/* Glowing icon */}
          <div className="relative mb-6">
            <div
              className="absolute inset-0 rounded-full blur-2xl opacity-40"
              style={{ background: "radial-gradient(circle, rgba(34,211,238,0.4), transparent)" }}
              aria-hidden
            />
            <div
              className="relative w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, rgba(34,211,238,0.15), rgba(167,139,250,0.15))",
                border: "1px solid rgba(34,211,238,0.25)",
              }}
            >
              <MessageCircle className="w-9 h-9" style={{ color: "var(--color-brand)" }} aria-hidden />
            </div>
          </div>

          <h2
            className="text-2xl font-bold font-heading mb-2"
            style={{ color: "var(--color-text-primary)" }}
          >
            {t.chat.emptyTitle}
          </h2>
          <p
            className="text-sm max-w-xs leading-relaxed"
            style={{ color: "var(--color-text-muted)" }}
          >
            {emptySubtitle}
          </p>

          {/* Decorative dots */}
          <div className="flex items-center gap-2 mt-8" aria-hidden>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: i === 1 ? "var(--color-brand)" : "var(--color-border-strong)",
                  animationDelay: `${i * 0.3}s`,
                }}
              />
            ))}
          </div>
        </motion.div>
      ) : (
        <>
        <EmotionTuneHint />
        {/* Message list — max width for readable line length (~65–75ch) */}
        <div className="flex flex-col gap-1 max-w-[min(100%,72rem)] mx-auto w-full px-4 sm:px-6 lg:px-8 pb-6 pt-2">
          {/* Earlier group */}
          {groupedMessages.earlier.length > 0 && (
            <section aria-label={language === "ar" ? "سابقًا" : "Earlier"} className="flex flex-col gap-1">
              <div className="flex items-center gap-3 py-3" aria-hidden>
                <div className="flex-1 h-px" style={{ background: "var(--color-border)" }} />
                <span
                  className="text-[11px] font-medium tracking-wider uppercase px-3 py-1 rounded-full"
                  style={{
                    color: "var(--color-text-muted)",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface)",
                  }}
                >
                  {language === "ar" ? "سابقًا" : "Earlier"}
                </span>
                <div className="flex-1 h-px" style={{ background: "var(--color-border)" }} />
              </div>
              <AnimatePresence initial={false}>
                {groupedMessages.earlier.map((msg) => (
                  <ChatBubble key={msg.id} message={msg} onAction={onAction} />
                ))}
              </AnimatePresence>
            </section>
          )}

          {/* Now group */}
          {groupedMessages.now.length > 0 && (
            <section aria-label={language === "ar" ? "الآن" : "Now"} className="flex flex-col gap-1">
              {groupedMessages.earlier.length > 0 && (
                <div className="flex items-center gap-3 py-3" aria-hidden>
                  <div className="flex-1 h-px" style={{ background: "var(--color-border)" }} />
                  <span
                    className="rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-wider"
                    style={{
                      color: "var(--color-brand-dim)",
                      border: "1px solid color-mix(in srgb, var(--color-brand) 38%, transparent)",
                      background: "var(--color-brand-muted)",
                    }}
                  >
                    {language === "ar" ? "الآن" : "Now"}
                  </span>
                  <div className="flex-1 h-px" style={{ background: "var(--color-border)" }} />
                </div>
              )}
              <AnimatePresence initial={false}>
                {groupedMessages.now.map((msg) => (
                  <ChatBubble key={msg.id} message={msg} onAction={onAction} />
                ))}
              </AnimatePresence>
            </section>
          )}

          {/* Live streaming AI response */}
          <AnimatePresence>
            {showLiveAi && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="w-full flex justify-start mt-2"
              >
                <div className="flex gap-3 items-end min-w-0 max-w-[min(100%,48rem)] sm:max-w-[min(100%,46rem)]">
                {/* AI avatar */}
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl avatar-ai shadow-glow-sm-violet" aria-hidden>
                  AI
                </div>

                <div
                  className="relative px-4 py-3 rounded-2xl rounded-bl-sm min-w-0 flex-1 max-w-[calc(100%-2.5rem)] text-sm leading-relaxed"
                  style={{
                    background: "var(--color-surface-raised)",
                    border: "1px solid var(--color-border-strong)",
                    borderLeft: "2px solid var(--color-accent)",
                    color: "var(--color-text-primary)",
                  }}
                >
                  <p className="whitespace-pre-wrap">{liveAiResponse!}</p>
                  {/* Typing dots */}
                  <span className="inline-flex items-end gap-0.5 ml-1 mb-0.5" aria-label="Typing">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-1 h-1 rounded-full animate-typing-dot"
                        style={{
                          background: "var(--color-accent)",
                          animationDelay: `${i * 0.2}s`,
                        }}
                      />
                    ))}
                  </span>
                </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={bottomRef} className="h-4" />
        </div>
        </>
      )}

      {/* Bottom fade */}
      <div
        className="pointer-events-none sticky bottom-0 z-10 h-12 w-full"
        style={{
          background: "linear-gradient(to top, var(--color-bg), transparent)",
        }}
        aria-hidden
      />
    </div>
  );
}

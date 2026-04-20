"use client";

import { useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { useSessionStore } from "@/lib/state/sessionStore";
import { ChatBubble } from "./ChatBubble";
import { useTranslations } from "@/lib/i18n";

interface ChatTimelineProps {
  onAction: (action: "simplify" | "clarify" | "translate", text: string, messageId: string) => void;
}

export function ChatTimeline({ onAction }: ChatTimelineProps) {
  const { messages, liveAiResponse, language } = useSessionStore();
  const t = useTranslations(language);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const groupLabels = language === "ar" ? { now: "الآن", earlier: "سابقًا" } : { now: "Now", earlier: "Earlier" };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    const distanceFromBottom =
      container.scrollHeight - (container.scrollTop + container.clientHeight);
    const shouldFollow = distanceFromBottom < 160;
    if (shouldFollow) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, liveAiResponse]);

  const summary = useMemo(() => {
    const counts = { user: 0, transcript: 0, assistant: 0 };
    for (const message of messages) {
      if (message.role === "user") counts.user += 1;
      else if (message.role === "transcript") counts.transcript += 1;
      else counts.assistant += 1;
    }
    return counts;
  }, [messages]);

  const groupedMessages = useMemo(() => {
    const nowThresholdMs = Date.now() - 15 * 60 * 1000;
    const now = messages.filter((message) => message.timestamp >= nowThresholdMs);
    const earlier = messages.filter((message) => message.timestamp < nowThresholdMs);
    return { now, earlier };
  }, [messages]);

  const latestTimestamp = useMemo(() => {
    if (!messages.length) return null;
    return messages[messages.length - 1]?.timestamp ?? null;
  }, [messages]);

  const latestLabel = useMemo(() => {
    if (!latestTimestamp) return null;
    return new Date(latestTimestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [latestTimestamp]);

  return (
    <div
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto px-4 py-5 md:px-5 md:py-6"
      role="log"
      aria-label="Conversation"
      aria-live="polite"
    >
      {(messages.length > 0 || liveAiResponse) && (
        <div className="sticky top-0 z-10 -mt-1 mb-4 py-2 bg-[var(--color-bg)]/88 backdrop-blur">
          <div className="workspace-zone px-2.5 py-2 flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--color-text-muted)]">
            <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg)]/60 px-2 py-1">
              Messages {messages.length}
            </span>
            <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg)]/60 px-2 py-1">
              You: {summary.user}
            </span>
            <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg)]/60 px-2 py-1">
              Transcript: {summary.transcript}
            </span>
            <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg)]/60 px-2 py-1">
              Assistant: {summary.assistant}
            </span>
            {latestLabel && (
              <span className="ml-auto rounded-full border border-[var(--color-border)] bg-[var(--color-bg)]/60 px-2 py-1">
                Last update: {latestLabel}
              </span>
            )}
          </div>
        </div>
      )}
      {messages.length === 0 && !liveAiResponse ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="h-full flex flex-col items-center justify-center text-center gap-4 py-12"
        >
          <div className="w-16 h-16 rounded-2xl bg-brand-600/15 border border-brand-500/20 flex items-center justify-center">
            <MessageCircle className="w-8 h-8 text-brand-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-1">
              {t.chat.emptyTitle}
            </h2>
            <p className="text-[var(--color-text-secondary)] text-sm max-w-xs">
              {t.chat.emptySubtitle}
            </p>
          </div>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-5 max-w-5xl mx-auto w-full">
          {groupedMessages.now.length > 0 && (
            <section aria-label={groupLabels.now} className="space-y-3">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                <span className="rounded-full border border-[var(--color-border)]/70 bg-[var(--color-surface)]/45 px-2 py-0.5">
                  {groupLabels.now}
                </span>
                <div className="h-px flex-1 bg-[var(--color-border)]/60" aria-hidden />
              </div>
              <AnimatePresence initial={false}>
                {groupedMessages.now.map((msg) => (
                  <ChatBubble key={msg.id} message={msg} onAction={onAction} />
                ))}
              </AnimatePresence>
            </section>
          )}

          {groupedMessages.earlier.length > 0 && (
            <section aria-label={groupLabels.earlier} className="space-y-3">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                <span className="rounded-full border border-[var(--color-border)]/70 bg-[var(--color-surface)]/45 px-2 py-0.5">
                  {groupLabels.earlier}
                </span>
                <div className="h-px flex-1 bg-[var(--color-border)]/60" aria-hidden />
              </div>
              <AnimatePresence initial={false}>
                {groupedMessages.earlier.map((msg) => (
                  <ChatBubble key={msg.id} message={msg} onAction={onAction} />
                ))}
              </AnimatePresence>
            </section>
          )}

          {/* Live streaming AI response preview */}
          {liveAiResponse && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="self-start flex gap-3 max-w-[85%]"
            >
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-violet-700 flex items-center justify-center text-xs font-bold text-white mt-1">
                AI
              </div>
              <div className="workspace-zone px-4 py-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed">
                <p className="whitespace-pre-wrap">{liveAiResponse}</p>
                <span className="inline-flex ml-1 gap-0.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1 h-1 rounded-full bg-violet-400 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </span>
              </div>
            </motion.div>
          )}

          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}

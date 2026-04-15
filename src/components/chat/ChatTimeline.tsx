"use client";

import { useEffect, useRef } from "react";
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, liveAiResponse]);

  return (
    <div
      className="flex-1 overflow-y-auto px-4 py-6"
      role="log"
      aria-label="Conversation"
      aria-live="polite"
    >
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
        <div className="flex flex-col gap-4">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} onAction={onAction} />
            ))}
          </AnimatePresence>

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
              <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-surface-raised border border-[var(--color-border)] text-sm leading-relaxed">
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

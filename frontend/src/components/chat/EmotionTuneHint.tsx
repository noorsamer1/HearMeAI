"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { useSessionStore } from "@/lib/state/sessionStore";
import { useTranslations } from "@/lib/i18n";
import {
  formatEmotionLabel,
  sentimentEmoji,
} from "@/lib/sentiment/sentimentDisplay";

const AUTO_DISMISS_MS = 12_000;

export function EmotionTuneHint() {
  const replyEmotionHint = useSessionStore((s) => s.replyEmotionHint);
  const setReplyEmotionHint = useSessionStore((s) => s.setReplyEmotionHint);
  const language = useSessionStore((s) => s.language);
  const t = useTranslations(language);

  useEffect(() => {
    if (!replyEmotionHint) return;
    const timer = window.setTimeout(() => setReplyEmotionHint(null), AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [replyEmotionHint, setReplyEmotionHint]);

  const moodKey = formatEmotionLabel(replyEmotionHint?.label);
  const moodLabel =
    moodKey === "happy"
      ? t.chat.moodHappy
      : moodKey === "sad"
        ? t.chat.moodSad
        : moodKey === "angry"
          ? t.chat.moodAngry
          : moodKey === "anxious"
            ? t.chat.moodAnxious
            : t.chat.moodNeutral;
  const emoji = sentimentEmoji(replyEmotionHint?.label, replyEmotionHint?.confidence);

  return (
    <AnimatePresence>
      {replyEmotionHint && (
        <motion.div
          key={`${replyEmotionHint.messageId ?? "hint"}-${replyEmotionHint.label}`}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className="mx-4 sm:mx-6 lg:mx-8 mt-2 mb-1 max-w-[min(100%,72rem)] w-[calc(100%-2rem)] sm:w-[calc(100%-3rem)] lg:w-[calc(100%-4rem)]"
          role="status"
          aria-live="polite"
        >
          <motion.div
            layout
            className="flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-sm shadow-sm"
            style={{
              borderColor: "color-mix(in srgb, var(--color-brand) 35%, var(--color-border))",
              background:
                "color-mix(in srgb, var(--color-brand-muted) 70%, var(--color-surface))",
            }}
          >
            <span
              className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
              style={{ background: "var(--color-brand-muted)" }}
              aria-hidden
            >
              {emoji ? (
                <span className="text-base leading-none">{emoji}</span>
              ) : (
                <Sparkles className="h-3.5 w-3.5 text-[var(--color-brand)]" />
              )}
            </span>
            <p className="flex-1 min-w-0 leading-snug text-[var(--color-text-primary)]">
              <span className="text-[var(--color-text-muted)]">{t.chat.replyTunedPrefix}</span>{" "}
              <span className="font-semibold capitalize">{moodLabel}</span>
            </p>
            <button
              type="button"
              onClick={() => setReplyEmotionHint(null)}
              className="shrink-0 rounded-lg p-1 text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)]"
              aria-label={t.chat.replyTunedDismiss}
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

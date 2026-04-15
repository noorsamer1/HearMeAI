"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Captions, Mic } from "lucide-react";
import { useSessionStore } from "@/lib/state/sessionStore";
import { useTranslations } from "@/lib/i18n";
import { clsx } from "clsx";
import { SignPreview } from "@/components/avatar/SignPreview";

export function LiveCaptionPanel() {
  const { liveCaption, systemStatus, language } = useSessionStore();
  const t = useTranslations(language);
  const isListening = systemStatus === "listening";
  const hasCaption = liveCaption.length > 0;

  return (
    <aside
      className={clsx(
        "flex flex-col border-l border-[var(--color-border)]",
        "bg-surface-raised/50 backdrop-blur-sm",
        "w-80 xl:w-96 flex-shrink-0"
      )}
      aria-label={t.captions.title}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-border)]">
        <div
          className={clsx(
            "w-7 h-7 rounded-lg flex items-center justify-center",
            isListening ? "bg-blue-500/20" : "bg-white/5"
          )}
        >
          <Captions
            className={clsx("w-4 h-4", isListening ? "text-blue-400" : "text-[var(--color-text-muted)]")}
          />
        </div>
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
          {t.captions.title}
        </h2>
        {isListening && (
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-xs text-blue-400">Live</span>
          </div>
        )}
      </div>

      {/* Caption and expression content */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/70 p-3">
          <div className="mb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
              {t.captions.title}
            </h3>
          </div>
          <AnimatePresence mode="wait">
            {hasCaption ? (
              <motion.div
                key="caption"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-3"
              >
                <div
                  className={clsx(
                    "p-4 rounded-xl border",
                    "bg-blue-500/8 border-blue-500/20",
                    "text-lg leading-relaxed text-[var(--color-text-primary)]"
                  )}
                  aria-live="polite"
                  aria-atomic="false"
                >
                  {liveCaption}
                  <span className="inline-block w-0.5 h-5 bg-blue-400 ml-1 animate-pulse align-middle" />
                </div>

                {isListening && (
                  <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                    <Mic className="w-3.5 h-3.5 text-blue-400" />
                    <span>{t.captions.listening}</span>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center text-center gap-4 py-8"
              >
                <div className="flex items-end gap-1 h-10">
                  {[3, 6, 4, 8, 5, 7, 3, 6, 4].map((h, i) => (
                    <div
                      key={i}
                      className={clsx(
                        "w-1 rounded-full transition-all",
                        isListening
                          ? "bg-blue-400 animate-[waveBar_1s_ease-in-out_infinite]"
                          : "bg-[var(--color-border-strong)]"
                      )}
                      style={{
                        height: `${isListening ? h * 4 : h * 2}px`,
                        animationDelay: `${i * 0.1}s`,
                      }}
                    />
                  ))}
                </div>
                <p className="text-sm text-[var(--color-text-muted)] max-w-[200px]">
                  {isListening ? t.captions.listening : t.captions.empty}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/70 p-3">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            Hologram Signer
          </h3>
          <SignPreview embedded />
        </section>
      </div>
    </aside>
  );
}

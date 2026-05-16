"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Captions, Mic, Activity, Wifi, Languages } from "lucide-react";
import { useState } from "react";
import { useSessionStore } from "@/lib/state/sessionStore";
import { useTranslations } from "@/lib/i18n";
import { clsx } from "clsx";
import { SignPreview } from "@/components/avatar/SignPreview";

export function LiveCaptionPanel() {
  const { liveCaption, systemStatus, language, isConnected, signPreview } = useSessionStore();
  const t = useTranslations(language);
  const isListening = systemStatus === "listening";
  const hasCaption = liveCaption.length > 0;
  const [signDialect, setSignDialect] = useState<"ASL" | "BSL">("ASL");
  const [signSpeed, setSignSpeed] = useState<"0.8x" | "1.0x" | "1.2x">("1.0x");

  return (
    <aside
      className={clsx(
        "workspace-divider-left flex flex-col",
        "bg-surface-raised/40 backdrop-blur-md",
        "w-64 md:w-72 lg:w-80 xl:w-96 flex-shrink-0"
      )}
      aria-label={t.captions.title}
    >
      {/* Header */}
      <div className="workspace-subtle-header flex items-center gap-2 px-4 py-3">
        <div
          className={clsx(
            "w-8 h-8 rounded-lg flex items-center justify-center border border-[var(--color-border)]",
            isListening ? "bg-[var(--color-brand-muted)]" : "bg-[var(--color-surface-raised)]"
          )}
        >
          <Captions
            className={clsx(
              "w-4 h-4",
              isListening ? "text-[var(--color-brand)]" : "text-[var(--color-text-muted)]"
            )}
          />
        </div>
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
          {t.captions.title}
        </h2>
        <span className="workspace-chip ml-auto">
          Privacy safe
        </span>
        {isListening && (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--color-brand)] animate-pulse" />
            <span className="text-xs text-[var(--color-brand)]">Live</span>
          </div>
        )}
      </div>

      {/* Service stack */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        <section className="workspace-zone p-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
              Services
            </h3>
            <span className="text-[11px] text-[var(--color-text-muted)]">
              {language === "ar" ? "الوضع المباشر" : "Live mode"}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-bg)]/60 px-2 py-1 text-[var(--color-text-muted)]">
              <Wifi
                className={clsx(
                  "w-3.5 h-3.5",
                  isConnected ? "text-[var(--color-success)]" : "text-[var(--color-error)]"
                )}
              />
              {isConnected ? "Connected" : "Disconnected"}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-bg)]/60 px-2 py-1 text-[var(--color-text-muted)]">
              <Activity className="w-3.5 h-3.5 text-[var(--color-brand)]" />
              Status: {systemStatus}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-bg)]/60 px-2 py-1 text-[var(--color-text-muted)]">
              <Languages className="w-3.5 h-3.5 text-[var(--color-accent)]" />
              {language.toUpperCase()}
            </span>
          </div>
        </section>

        <section className="workspace-zone-elevated p-3">
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
                {/* Word-by-word animated caption */}
                <div
                  className={clsx(
                    "p-4 rounded-xl border shadow-inner",
                    "bg-[var(--color-brand-muted)] border-[color-mix(in_srgb,var(--color-brand)_25%,transparent)]",
                    "text-base leading-relaxed",
                    // Interim captions are dimmer and italic
                    systemStatus === "processing"
                      ? "text-[var(--color-text-muted)] italic"
                      : "text-[var(--color-text-primary)]"
                  )}
                  aria-live="polite"
                  aria-atomic="false"
                >
                  {/* Re-key on liveCaption so all words re-stagger on new caption */}
                  <AnimatePresence key={liveCaption} mode="popLayout">
                    {liveCaption.split(" ").filter(Boolean).map((word, i) => (
                      <motion.span
                        key={`${word}-${i}`}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{
                          duration: 0.18,
                          delay: i * 0.05,
                          ease: "easeOut",
                        }}
                        className="inline-block mr-1"
                      >
                        {word}
                      </motion.span>
                    ))}
                  </AnimatePresence>

                  {/* Processing "..." indicator */}
                  {systemStatus === "processing" && (
                    <motion.span
                      className="inline-flex items-end gap-0.5 ml-1 align-middle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="inline-block w-1 h-1 rounded-full bg-[var(--color-brand)]"
                          animate={{ scaleY: [0.4, 1, 0.4] }}
                          transition={{
                            duration: 0.8,
                            repeat: Infinity,
                            delay: i * 0.15,
                            ease: "easeInOut",
                          }}
                        />
                      ))}
                    </motion.span>
                  )}

                  {/* Cursor blink when listening */}
                  {systemStatus !== "processing" && (
                    <span className="inline-block w-0.5 h-5 bg-[var(--color-brand)] ml-1 animate-pulse align-middle" />
                  )}
                </div>

                {isListening && (
                  <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                    <Mic className="w-3.5 h-3.5 text-[var(--color-brand)]" />
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
                          ? "bg-[var(--color-brand)] animate-[waveBar_1s_ease-in-out_infinite]"
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

        <section className="workspace-zone p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
              Signer
            </h3>
            <span className="workspace-chip">
              {signPreview ? "Active" : "Idle"}
            </span>
          </div>
          <div className="workspace-zone-elevated h-[260px] xl:h-[300px] overflow-hidden">
            <SignPreview embedded />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSignDialect("ASL")}
              className={clsx(
                "workspace-chip",
                signDialect === "ASL" &&
                  "border-[color-mix(in_srgb,var(--color-brand)_45%,transparent)] bg-[var(--color-brand-muted)] text-[var(--color-text-primary)]"
              )}
              aria-pressed={signDialect === "ASL"}
            >
              ASL
            </button>
            <button
              type="button"
              onClick={() => setSignDialect("BSL")}
              className={clsx(
                "workspace-chip",
                signDialect === "BSL" &&
                  "border-[color-mix(in_srgb,var(--color-brand)_45%,transparent)] bg-[var(--color-brand-muted)] text-[var(--color-text-primary)]"
              )}
              aria-pressed={signDialect === "BSL"}
            >
              BSL
            </button>
            <span className="mx-1 h-3.5 w-px bg-[var(--color-border)]/70" aria-hidden />
            {(["0.8x", "1.0x", "1.2x"] as const).map((speed) => (
              <button
                key={speed}
                type="button"
                onClick={() => setSignSpeed(speed)}
                className={clsx(
                  "workspace-chip",
                  signSpeed === speed &&
                    "border-[color-mix(in_srgb,var(--color-warning)_45%,transparent)] bg-[var(--color-warning-bg)] text-[var(--color-warning)]"
                )}
                aria-pressed={signSpeed === speed}
              >
                {speed}
              </button>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
}

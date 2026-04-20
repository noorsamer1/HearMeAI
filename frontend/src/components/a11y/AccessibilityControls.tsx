"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Accessibility, Sun, ZoomIn, X } from "lucide-react";
import { clsx } from "clsx";
import { useSessionStore, FontSize } from "@/lib/state/sessionStore";
import { Button } from "@/components/common/Button";
import { useTranslations } from "@/lib/i18n";

export function AccessibilityControls() {
  const [isOpen, setIsOpen] = useState(false);
  const { isHighContrast, fontSize, language, setIsHighContrast, setFontSize } = useSessionStore();
  const t = useTranslations(language);

  const fontSizes: Array<{ value: FontSize; label: string }> = [
    { value: "normal", label: t.accessibility.fontSizeNormal },
    { value: "large", label: t.accessibility.fontSizeLarge },
    { value: "xlarge", label: t.accessibility.fontSizeXLarge },
  ];

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen((v) => !v)}
        aria-label={t.accessibility.title}
        aria-expanded={isOpen}
        title={t.accessibility.title}
        className="h-11 w-11"
      >
        <Accessibility className="w-4 h-4" />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className={clsx(
                "absolute bottom-12 right-0 z-50",
                "w-64 p-4 rounded-xl",
                "bg-surface border border-[var(--color-border-strong)]",
                "shadow-2xl shadow-black/50"
              )}
              role="dialog"
              aria-label={t.accessibility.title}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {t.accessibility.title}
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-white/5 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 text-[var(--color-text-muted)]" />
                </button>
              </div>

              {/* High contrast toggle */}
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-[var(--color-text-muted)]" />
                  <span className="text-sm text-[var(--color-text-primary)]">
                    {t.accessibility.highContrast}
                  </span>
                </div>
                <button
                  role="switch"
                  aria-checked={isHighContrast}
                  onClick={() => setIsHighContrast(!isHighContrast)}
                  className={clsx(
                    "relative w-10 h-5 rounded-full transition-colors duration-200",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-400 focus-visible:outline-offset-2",
                    isHighContrast ? "bg-brand-600" : "bg-white/15"
                  )}
                >
                  <span
                    className={clsx(
                      "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200",
                      isHighContrast && "translate-x-5"
                    )}
                  />
                </button>
              </div>

              {/* Divider */}
              <div className="h-px bg-[var(--color-border)] my-3" />

              {/* Font size */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <ZoomIn className="w-4 h-4 text-[var(--color-text-muted)]" />
                  <span className="text-sm text-[var(--color-text-primary)]">
                    {t.accessibility.fontSize}
                  </span>
                </div>
                <div className="flex gap-2 mt-1">
                  {fontSizes.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setFontSize(value)}
                      className={clsx(
                        "flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all",
                        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-400",
                        fontSize === value
                          ? "bg-brand-600 text-white"
                          : "bg-white/5 text-[var(--color-text-secondary)] hover:bg-white/10"
                      )}
                      aria-pressed={fontSize === value}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

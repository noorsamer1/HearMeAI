"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Accessibility, Moon, Sun, ZoomIn, X } from "lucide-react";
import { clsx } from "clsx";
import { useSessionStore, FontSize } from "@/lib/state/sessionStore";
import { Button } from "@/components/common/Button";
import { useTranslations } from "@/lib/i18n";

export function AccessibilityControls() {
  const [isOpen, setIsOpen] = useState(false);
  const { isHighContrast, colorMode, fontSize, language, setIsHighContrast, setColorMode, setFontSize } =
    useSessionStore();
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
                "shadow-[var(--shadow-lg)]"
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
                  className="p-1 hover:bg-[color-mix(in_srgb,var(--color-text-primary)_6%,transparent)] rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 text-[var(--color-text-muted)]" />
                </button>
              </div>

              {/* Light / Dark */}
              <div className="py-2">
                <p className="text-sm text-[var(--color-text-primary)] mb-2">{t.accessibility.appearance}</p>
                <div
                  className="flex rounded-lg border border-[var(--color-border-strong)] p-0.5 bg-[var(--color-surface-raised)]"
                  role="group"
                  aria-label={t.accessibility.appearance}
                >
                  {(
                    [
                      { mode: "light" as const, label: t.accessibility.themeLight, Icon: Sun },
                      { mode: "dark" as const, label: t.accessibility.themeDark, Icon: Moon },
                    ] as const
                  ).map(({ mode, label, Icon }) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setColorMode(mode)}
                      className={clsx(
                        "flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-xs font-medium transition-colors",
                        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-brand)]",
                        colorMode === mode
                          ? "bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-sm"
                          : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                      )}
                      aria-pressed={colorMode === mode}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px bg-[var(--color-border)] my-2" />

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
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-brand-400)] focus-visible:outline-offset-2",
                    isHighContrast ? "bg-[var(--color-brand-600)]" : "bg-[var(--color-border-strong)]"
                  )}
                >
                  <span
                    className={clsx(
                      "absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-[var(--color-surface)] shadow transition-transform duration-200",
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
                        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-brand-400)]",
                        fontSize === value
                          ? "bg-[var(--color-brand-600)] text-[var(--color-text-inverse)]"
                          : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] border border-[var(--color-border)]"
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

"use client";

import { Globe, Zap } from "lucide-react";
import { clsx } from "clsx";
import { useSessionStore } from "@/lib/state/sessionStore";
import { StatusRail } from "@/components/chat/StatusRail";
import { AccessibilityControls } from "@/components/a11y/AccessibilityControls";
import { Button } from "@/components/common/Button";
import { useTranslations } from "@/lib/i18n";
import type { Language } from "@/lib/state/sessionStore";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { language, setLanguage } = useSessionStore();
  const t = useTranslations(language);

  const toggleLanguage = () => {
    const next: Language = language === "en" ? "ar" : "en";
    setLanguage(next);
  };

  return (
    <div
      className="h-full min-h-0 flex flex-col overflow-hidden"
      style={{ backgroundColor: "var(--color-bg)" }}
    >
      {/* ── Header ───────────────────────────────────────────── */}
      <header
        className={clsx(
          "flex items-center justify-between px-4 h-14 flex-shrink-0",
          "border-b border-[var(--color-border)]",
          "bg-[var(--color-bg)]/95 backdrop-blur-sm"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-600 to-accent flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div className="hidden sm:flex flex-col leading-none">
            <span className="text-sm font-bold text-[var(--color-text-primary)] leading-tight">
              {t.app.name}
            </span>
          </div>
        </div>

        {/* Status */}
        <div className="flex-1 flex justify-center">
          <StatusRail />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          {/* Language toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            title={t.language.toggle}
            aria-label={t.language.toggle}
            className="gap-1.5"
          >
            <Globe className="w-4 h-4" />
            <span className="text-xs font-medium">
              {language === "en" ? "عربي" : "EN"}
            </span>
          </Button>

          {/* Accessibility controls */}
          <AccessibilityControls />
        </div>
      </header>

      {/* ── Main content ─────────────────────────────────────── */}
      <main className="flex-1 overflow-hidden flex min-h-0">
        {children}
      </main>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Globe, Zap, Copy, Check } from "lucide-react";
import { clsx } from "clsx";
import { useSessionStore } from "@/lib/state/sessionStore";
import { StatusRail } from "@/components/chat/StatusRail";
import { AccessibilityControls } from "@/components/a11y/AccessibilityControls";
import { Button } from "@/components/common/Button";
import { useTranslations } from "@/lib/i18n";
import type { Language } from "@/lib/state/sessionStore";

type ProfileUserType = "deaf" | "mute" | "both" | "normal";

interface AppLayoutProps {
  children: React.ReactNode;
  userType?: ProfileUserType;
}

const USER_TYPE_LABELS: Record<ProfileUserType, { label: string; color: string }> = {
  deaf:   { label: "Deaf",   color: "pill-cyan"   },
  mute:   { label: "Mute",   color: "pill-violet" },
  both:   { label: "Deaf & Mute", color: "pill-amber" },
  normal: { label: "Normal", color: "pill-green"  },
};

export function AppLayout({ children, userType }: AppLayoutProps) {
  const { language, setLanguage, sessionId } = useSessionStore();
  const t = useTranslations(language);
  const [codeCopied, setCodeCopied] = useState(false);

  const toggleLanguage = () => {
    const next: Language = language === "en" ? "ar" : "en";
    setLanguage(next);
  };

  const copySessionCode = async () => {
    try {
      await navigator.clipboard.writeText(sessionId.slice(0, 8).toUpperCase());
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      // ignore
    }
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
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--color-brand-600)] to-[var(--color-accent-500)] flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-[var(--color-text-inverse)]" />
          </div>
          <div className="hidden sm:flex flex-col leading-none">
            <span className="text-sm font-bold text-[var(--color-text-primary)] leading-tight">
              {t.app.name}
            </span>
          </div>
          {userType && (
            <span className={`pill ${USER_TYPE_LABELS[userType].color} hidden sm:inline-flex`}>
              {USER_TYPE_LABELS[userType].label}
            </span>
          )}
          {/* Room code chip — visible during demo so others can copy the invite */}
          <button
            type="button"
            onClick={copySessionCode}
            title="Copy room code for demo"
            className={clsx(
              "hidden sm:inline-flex items-center gap-1.5 ml-1 workspace-chip",
              "hover:border-[color-mix(in_srgb,var(--color-brand)_45%,transparent)] hover:bg-[var(--color-brand-muted)] transition-colors cursor-pointer"
            )}
          >
            <span className="font-mono text-[10px] tracking-wider text-[var(--color-text-muted)]">
              #{sessionId.slice(0, 8).toUpperCase()}
            </span>
            {codeCopied ? (
              <Check className="h-3 w-3 text-[var(--color-success)]" />
            ) : (
              <Copy className="w-3 h-3 text-[var(--color-text-muted)]" />
            )}
          </button>
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

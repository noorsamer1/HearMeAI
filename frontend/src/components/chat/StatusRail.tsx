"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Wifi, WifiOff, Mic, Brain, Volume2, type LucideIcon } from "lucide-react";
import { useSessionStore, SystemStatus } from "@/lib/state/sessionStore";
import { useTranslations } from "@/lib/i18n";

type StatusMeta = {
  icon: LucideIcon;
  label: string;
  dotColor: string;
  bg: string;
  border: string;
  textColor: string;
  pulse?: boolean;
};

function useStatusConfig(status: SystemStatus, t: ReturnType<typeof useTranslations>): StatusMeta {
  switch (status) {
    case "listening":
      return {
        icon: Mic,
        label: t.status.listening,
        dotColor: "var(--color-brand)",
        bg: "var(--color-brand-muted)",
        border: "color-mix(in srgb, var(--color-brand) 38%, transparent)",
        textColor: "var(--color-brand-dim)",
        pulse: true,
      };
    case "processing":
      return {
        icon: Brain,
        label: t.status.processing,
        dotColor: "var(--color-accent)",
        bg: "var(--color-accent-muted)",
        border: "color-mix(in srgb, var(--color-accent) 38%, transparent)",
        textColor: "var(--color-accent-dim)",
        pulse: true,
      };
    case "speaking":
      return {
        icon: Volume2,
        label: t.status.speaking,
        dotColor: "var(--color-success)",
        bg: "var(--color-success-muted)",
        border: "color-mix(in srgb, var(--color-success) 40%, transparent)",
        textColor: "var(--color-success)",
        pulse: true,
      };
    default:
      return {
        icon: Wifi,
        label: "Ready",
        dotColor: "var(--color-text-muted)",
        bg: "var(--color-bg-subtle)",
        border: "color-mix(in srgb, var(--color-border-strong) 85%, transparent)",
        textColor: "var(--color-text-secondary)",
      };
  }
}

export function StatusRail() {
  const { systemStatus, isConnected, language } = useSessionStore();
  const t = useTranslations(language);
  const meta = useStatusConfig(systemStatus, t);
  const StatusIcon = meta.icon;

  return (
    <div className="flex items-center gap-2" role="status" aria-live="polite">
      {/* Connection pill */}
      <div
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
        style={{
          background: isConnected ? "var(--color-success-muted)" : "var(--color-error-bg)",
          border: "1px solid",
          borderColor: isConnected
            ? "color-mix(in srgb, var(--color-success) 40%, transparent)"
            : "color-mix(in srgb, var(--color-error) 35%, transparent)",
          color: isConnected ? "var(--color-success)" : "var(--color-error)",
        }}
        aria-label={isConnected ? "Connected" : "Reconnecting"}
      >
        <span
          className="flex h-1.5 w-1.5 flex-shrink-0 rounded-full"
          style={{
            background: isConnected ? "var(--color-success)" : "var(--color-error)",
            animation: isConnected ? "none" : "pulse 1.5s ease-in-out infinite",
          }}
        />
        {isConnected ? (
          <Wifi className="w-3 h-3 hidden sm:block" aria-hidden />
        ) : (
          <WifiOff className="w-3 h-3 hidden sm:block" aria-hidden />
        )}
        <span className="hidden sm:inline">
          {isConnected ? "Live" : "Reconnecting…"}
        </span>
      </div>

      {/* System status pill */}
      <AnimatePresence mode="wait">
        <motion.div
          key={systemStatus}
          initial={{ opacity: 0, scale: 0.88, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.88, y: 4 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
          style={{
            background: meta.bg,
            border: "1px solid",
            borderColor: meta.border,
            color: meta.textColor,
          }}
          aria-label={`Status: ${meta.label}`}
        >
          <span
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{
              background: meta.dotColor,
              animation: meta.pulse ? "pulse 1.4s ease-in-out infinite" : "none",
            }}
          />
          <StatusIcon className="w-3 h-3 hidden sm:block" aria-hidden />
          <span>{meta.label}</span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

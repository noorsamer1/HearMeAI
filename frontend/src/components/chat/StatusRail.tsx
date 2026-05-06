"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Wifi, WifiOff, Mic, Brain, Volume2 } from "lucide-react";
import { useSessionStore, SystemStatus } from "@/lib/state/sessionStore";
import { useTranslations } from "@/lib/i18n";

type StatusMeta = {
  icon: React.ElementType;
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
        dotColor: "#22D3EE",
        bg: "rgba(34,211,238,0.1)",
        border: "rgba(34,211,238,0.35)",
        textColor: "#67E8F9",
        pulse: true,
      };
    case "processing":
      return {
        icon: Brain,
        label: t.status.processing,
        dotColor: "#A78BFA",
        bg: "rgba(167,139,250,0.1)",
        border: "rgba(167,139,250,0.35)",
        textColor: "#C4B5FD",
        pulse: true,
      };
    case "speaking":
      return {
        icon: Volume2,
        label: t.status.speaking,
        dotColor: "#34D399",
        bg: "rgba(52,211,153,0.1)",
        border: "rgba(52,211,153,0.35)",
        textColor: "#6EE7B7",
        pulse: true,
      };
    default:
      return {
        icon: Wifi,
        label: "Ready",
        dotColor: "#475569",
        bg: "rgba(71,85,105,0.1)",
        border: "rgba(71,85,105,0.25)",
        textColor: "#94A3B8",
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
          background: isConnected ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)",
          border: "1px solid",
          borderColor: isConnected ? "rgba(52,211,153,0.35)" : "rgba(248,113,113,0.35)",
          color: isConnected ? "#6EE7B7" : "#FCA5A5",
        }}
        aria-label={isConnected ? "Connected" : "Reconnecting"}
      >
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{
            background: isConnected ? "#34D399" : "#F87171",
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

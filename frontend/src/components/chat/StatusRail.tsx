"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Wifi, WifiOff, Mic, Brain, Volume2, Circle } from "lucide-react";
import { clsx } from "clsx";
import { useSessionStore, SystemStatus } from "@/lib/state/sessionStore";
import { useTranslations } from "@/lib/i18n";

const statusConfig: Record<
  SystemStatus,
  { icon: React.ElementType; colorClass: string; bgClass: string; pulses?: boolean }
> = {
  idle: {
    icon: Circle,
    colorClass: "text-gray-400",
    bgClass: "bg-gray-500/10",
  },
  listening: {
    icon: Mic,
    colorClass: "text-blue-400",
    bgClass: "bg-blue-500/15",
    pulses: true,
  },
  processing: {
    icon: Brain,
    colorClass: "text-violet-400",
    bgClass: "bg-violet-500/15",
    pulses: true,
  },
  speaking: {
    icon: Volume2,
    colorClass: "text-emerald-400",
    bgClass: "bg-emerald-500/15",
    pulses: true,
  },
};

export function StatusRail() {
  const { systemStatus, isConnected, language } = useSessionStore();
  const t = useTranslations(language);
  const config = statusConfig[systemStatus];
  const Icon = config.icon;

  const statusLabel: Record<SystemStatus, string> = {
    idle: t.status.idle,
    listening: t.status.listening,
    processing: t.status.processing,
    speaking: t.status.speaking,
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className={clsx(
          "workspace-chip gap-1.5 px-2.5 py-1",
          isConnected
            ? "border-emerald-500/35 bg-emerald-500/12 text-emerald-300"
            : "border-rose-500/35 bg-rose-500/12 text-rose-300"
        )}
      >
        {isConnected ? (
          <Wifi className="w-3.5 h-3.5" aria-hidden />
        ) : (
          <WifiOff className="w-3.5 h-3.5 animate-pulse" aria-hidden />
        )}
        <span className="hidden sm:inline">{isConnected ? "Connected" : "Offline"}</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={systemStatus}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.15 }}
          className={clsx(
            "workspace-chip gap-1.5 px-2.5 py-1 text-xs",
            config.colorClass
          )}
          role="status"
          aria-live="polite"
          aria-label={`Status: ${statusLabel[systemStatus]}`}
        >
          <Icon
            className={clsx("w-3.5 h-3.5", config.pulses && "animate-pulse")}
            aria-hidden
          />
          <span>{systemStatus === "idle" ? "Ready" : statusLabel[systemStatus]}</span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

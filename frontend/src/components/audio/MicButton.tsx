"use client";

import { useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, AlertCircle } from "lucide-react";
import { clsx } from "clsx";
import { useMediaRecorder } from "@/lib/hooks/useMediaRecorder";
import { WaveformAnimation } from "./WaveformAnimation";
import { showToast } from "@/components/common/Toast";
import { useTranslations } from "@/lib/i18n";
import { useSessionStore } from "@/lib/state/sessionStore";

interface MicButtonProps {
  onAudioStop: (blob: Blob | null, mimeType: string, durationMs: number) => void;
  disabled?: boolean;
}

export function MicButton({ onAudioStop, disabled }: MicButtonProps) {
  const { language } = useSessionStore();
  const t = useTranslations(language);

  const handleRecorderStop = useCallback(
    (blob: Blob | null, mimeType: string, durationMs: number) => {
      onAudioStop(blob, mimeType, durationMs);
    },
    [onAudioStop]
  );

  const { state, error, start, stop, volumeLevel, hasPermission } = useMediaRecorder({
    onStop: handleRecorderStop,
    chunkIntervalMs: 250,
  });

  const isRecording = state === "recording";

  const handleToggle = useCallback(async () => {
    if (isRecording) {
      stop();
    } else {
      if (hasPermission === false) {
        showToast("error", t.errors.micPermission);
        return;
      }
      await start();
    }
  }, [isRecording, stop, start, hasPermission, t.errors.micPermission]);

  return (
    <motion.div className="flex flex-col items-center gap-2">
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <WaveformAnimation
              isActive={isRecording}
              volumeLevel={volumeLevel}
              barCount={11}
              color="var(--color-brand)"
              className="h-8"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div className="relative">
        {isRecording && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full bg-[color-mix(in_srgb,var(--color-brand)_22%,transparent)]"
              animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
            />
            <motion.div
              className="absolute inset-0 rounded-full bg-[color-mix(in_srgb,var(--color-brand)_15%,transparent)]"
              animate={{ scale: [1, 1.35], opacity: [0.4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: 0.3 }}
            />
          </>
        )}

        <motion.button
          onClick={handleToggle}
          disabled={disabled || state === "error"}
          whileTap={{ scale: 0.93 }}
          aria-label={isRecording ? t.controls.stopListening : t.controls.startListening}
          aria-pressed={isRecording}
          className={clsx(
            "relative w-16 h-16 rounded-full transition-all duration-200",
            "flex items-center justify-center",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-brand)] focus-visible:outline-offset-3",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            isRecording
              ? "bg-[var(--color-brand-600)] shadow-lg shadow-[var(--shadow-brand)] hover:bg-[var(--color-brand-500)]"
              : "bg-surface-overlay border border-[var(--color-border-strong)] hover:bg-surface-raised hover:border-[color-mix(in_srgb,var(--color-brand)_35%,transparent)]",
            state === "error" &&
              "bg-[var(--color-error-muted)] border-[color-mix(in_srgb,var(--color-error)_40%,transparent)]"
          )}
        >
          <AnimatePresence mode="wait">
            {state === "error" ? (
              <motion.span
                key="error"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <AlertCircle className="w-6 h-6 text-[var(--color-error)]" />
              </motion.span>
            ) : isRecording ? (
              <motion.span
                key="recording"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <MicOff className="h-6 w-6 text-[var(--color-text-inverse)]" />
              </motion.span>
            ) : (
              <motion.span
                key="idle"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Mic className="w-6 h-6 text-[var(--color-text-secondary)]" />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </motion.div>

      <span className="text-xs text-[var(--color-text-muted)] text-center">
        {state === "error"
          ? "Mic unavailable"
          : isRecording
            ? t.controls.stopListening
            : t.controls.startListening}
      </span>
    </motion.div>
  );
}

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
  onChunk: (base64: string, mimeType: string) => void;
  onStop: () => void;
  disabled?: boolean;
}

export function MicButton({ onChunk, onStop, disabled }: MicButtonProps) {
  const { language } = useSessionStore();
  const t = useTranslations(language);

  const handleStop = useCallback(() => {
    onStop();
  }, [onStop]);

  const { state, error, start, stop, volumeLevel, hasPermission } = useMediaRecorder({
    onChunk,
    onStop: handleStop,
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
    <div className="flex flex-col items-center gap-2">
      {/* Waveform */}
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
              color="#60a5fa"
              className="h-8"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main mic button */}
      <div className="relative">
        {/* Pulse ring when recording */}
        {isRecording && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full bg-blue-500/20"
              animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
            />
            <motion.div
              className="absolute inset-0 rounded-full bg-blue-500/15"
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
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400 focus-visible:outline-offset-3",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            isRecording
              ? "bg-blue-600 shadow-lg shadow-blue-900/50 hover:bg-blue-500"
              : "bg-surface-overlay border border-[var(--color-border-strong)] hover:bg-surface-raised hover:border-blue-500/50",
            state === "error" && "bg-red-600/20 border-red-500/50"
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
                <AlertCircle className="w-6 h-6 text-red-400" />
              </motion.span>
            ) : isRecording ? (
              <motion.span
                key="recording"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <MicOff className="w-6 h-6 text-white" />
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
      </div>

      {/* Label */}
      <span className="text-xs text-[var(--color-text-muted)] text-center">
        {state === "error"
          ? "Mic unavailable"
          : isRecording
          ? t.controls.stopListening
          : t.controls.startListening}
      </span>
    </div>
  );
}

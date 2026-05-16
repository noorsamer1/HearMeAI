"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Waves } from "lucide-react";

type MicrophoneState = "idle" | "listening" | "processing" | "speaking";

export default function MicrophoneButton() {
  const [micState, setMicState] = useState<MicrophoneState>("idle");

  // Cycle states for demonstration purposes
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (micState === "listening") {
      timeout = setTimeout(() => setMicState("processing"), 3000);
    } else if (micState === "processing") {
      timeout = setTimeout(() => setMicState("speaking"), 2000);
    } else if (micState === "speaking") {
      // Stay speaking for a bit then idle
      timeout = setTimeout(() => setMicState("idle"), 4000);
    }
    return () => clearTimeout(timeout);
  }, [micState]);

  const toggleMic = () => {
    if (micState === "idle") setMicState("listening");
    else setMicState("idle");
  };

  return (
    <div className="flex flex-col items-center">
      {/* Status Text (Accessibility Visual Indicator) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={micState}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mb-4 text-sm font-medium font-sans tracking-wide uppercase"
        >
          {micState === "idle" && (
            <span className="text-[var(--color-text-muted)]">Ready</span>
          )}
          {micState === "listening" && (
            <span className="text-[var(--color-brand)]">Listening...</span>
          )}
          {micState === "processing" && (
            <span className="text-[var(--color-warning)]">Understanding...</span>
          )}
          {micState === "speaking" && (
            <span className="text-[var(--color-success)]">Synthesizing...</span>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="relative flex items-center justify-center">
        {/* Animated Glow Rings based on State */}
        <AnimatePresence>
          {micState !== "idle" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={`absolute h-24 w-24 rounded-full blur-xl mix-blend-screen transition-colors duration-500 ${
                micState === "listening"
                  ? "bg-[var(--color-brand-glow)]"
                  : micState === "processing"
                    ? "bg-[color-mix(in_srgb,var(--color-warning)_45%,transparent)]"
                    : "bg-[var(--color-success-muted)]"
              }`}
            />
          )}

          {micState === "listening" && (
             <motion.div
               animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
               transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
               className="absolute h-20 w-20 rounded-full border-2 border-[var(--color-brand)]"
             />
          )}

          {micState === "processing" && (
             <motion.div
               animate={{ rotate: 360 }}
               transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
               className="absolute h-20 w-20 rounded-full border-2 border-dashed border-[var(--color-warning)] border-r-transparent"
             />
          )}
        </AnimatePresence>

        <motion.button
          onClick={toggleMic}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          layout
          className={`relative z-10 flex h-16 w-16 items-center justify-center rounded-full shadow-2xl transition-all duration-300 ${
            micState === "idle"
              ? "border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)]"
              : micState === "listening"
                ? `border border-[var(--color-brand)] bg-[var(--color-brand)] text-[var(--color-text-inverse)] shadow-[0_0_30px_var(--color-brand-glow)]`
              : micState === "processing"
                ? `border border-[var(--color-warning)] bg-[var(--color-warning)] text-[var(--color-text-inverse)] shadow-[0_0_24px_color-mix(in_srgb,var(--color-warning)_55%,transparent)]`
                : `border border-[var(--color-success)] bg-[var(--color-success)] text-[var(--color-text-inverse)] shadow-[0_0_30px_color-mix(in_srgb,var(--color-success)_50%,transparent)]`
          }`}
        >
          {micState === "speaking" ? (
             <Waves className="w-6 h-6 animate-pulse" />
          ) : (
             <Mic className="w-6 h-6" />
          )}
        </motion.button>
      </div>

      {/* Waveform Visualization (Only visible when speaking/listening) */}
      <AnimatePresence>
        {(micState === "listening" || micState === "speaking") && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-end justify-center gap-1 mt-6 h-8"
          >
            {[1, 2, 3, 4, 5, 6, 7].map((bar) => (
              <motion.div
                key={bar}
                animate={{ height: ["20%", "100%", "20%"] }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: bar * 0.1,
                  ease: "easeInOut",
                }}
                className={`w-1 rounded-full ${
                  micState === "listening" ? "bg-[var(--color-brand)]" : "bg-[var(--color-success)]"
                }`}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

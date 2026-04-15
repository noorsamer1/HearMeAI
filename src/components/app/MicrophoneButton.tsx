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
          {micState === "idle" && <span className="text-slate-400">Ready</span>}
          {micState === "listening" && <span className="text-neon-blue">Listening...</span>}
          {micState === "processing" && <span className="text-neon-yellow">Understanding...</span>}
          {micState === "speaking" && <span className="text-neon-green">Synthesizing...</span>}
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
              className={`absolute w-24 h-24 rounded-full blur-xl mix-blend-screen transition-colors duration-500 ${
                micState === "listening" ? "bg-neon-blue/40" :
                micState === "processing" ? "bg-neon-yellow/40" :
                "bg-neon-green/40"
              }`}
            />
          )}

          {micState === "listening" && (
             <motion.div
               animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
               transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
               className="absolute w-20 h-20 rounded-full border-2 border-neon-blue"
             />
          )}

          {micState === "processing" && (
             <motion.div
               animate={{ rotate: 360 }}
               transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
               className="absolute w-20 h-20 rounded-full border-2 border-r-transparent border-neon-yellow border-dashed"
             />
          )}
        </AnimatePresence>

        <motion.button
          onClick={toggleMic}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          layout
          className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
            micState === "idle" 
              ? "bg-slate-800 text-slate-300 border border-white/10 hover:bg-slate-700" 
              : micState === "listening"
              ? "bg-neon-blue text-white shadow-[0_0_30px_rgba(59,130,246,0.6)]"
              : micState === "processing"
              ? "bg-neon-yellow text-slate-900 shadow-[0_0_30px_rgba(245,158,11,0.6)]"
              : "bg-neon-green text-white shadow-[0_0_30px_rgba(16,185,129,0.6)]"
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
                  micState === "listening" ? "bg-neon-blue" : "bg-neon-green"
                }`}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

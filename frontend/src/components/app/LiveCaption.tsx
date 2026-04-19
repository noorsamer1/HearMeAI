"use client";

import { motion, AnimatePresence } from "framer-motion";

interface LiveCaptionProps {
  text: string;
  isStreaming: boolean;
}

export default function LiveCaption({ text, isStreaming }: LiveCaptionProps) {
  return (
    <div className="w-full max-w-4xl mx-auto my-6 px-4">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={`caption-${text.trim().length > 0 ? text : "empty"}`}
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
          className="relative group p-6 md:p-8 rounded-3xl glass-card border border-brand-500/20 shadow-[0_10px_40px_-10px_rgba(99,102,241,0.2)]"
        >
          {/* Subtle animated border gradient */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-brand-600/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

          <p className="font-heading text-3xl md:text-5xl font-semibold leading-tight tracking-tight text-white relative z-10 transition-all">
            {text}
            {isStreaming && (
             <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                className="inline-block w-3 md:w-4 h-8 md:h-10 ml-2 bg-brand-400 rounded-sm align-middle"
              />
            )}
          </p>
          
          <div className="mt-4 flex items-center justify-between text-slate-400 text-sm font-medium z-10 relative">
            <span className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
              </span>
              Live Translation
            </span>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

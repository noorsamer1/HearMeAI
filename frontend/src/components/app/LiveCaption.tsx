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
          className="glass-card group relative rounded-3xl border border-[var(--color-border-focus)] p-6 shadow-[var(--shadow-lg)] md:p-8"
        >
          {/* Subtle animated border gradient */}
          <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-r from-[var(--color-brand-muted)] to-[var(--color-accent-muted)] opacity-0 transition-opacity duration-700 group-hover:opacity-100" />

          <p className="relative z-10 font-heading text-3xl font-semibold leading-tight tracking-tight text-[var(--color-text-primary)] transition-all md:text-5xl">
            {text}
            {isStreaming && (
             <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                className="ml-2 inline-block h-8 w-3 rounded-sm align-middle bg-[var(--color-brand)] md:h-10 md:w-4"
              />
            )}
          </p>
          
          <div className="relative z-10 mt-4 flex items-center justify-between text-sm font-medium text-[var(--color-text-muted)]">
            <span className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                 <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-brand)] opacity-75"></span>
                 <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-brand-500)]"></span>
              </span>
              Live Translation
            </span>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

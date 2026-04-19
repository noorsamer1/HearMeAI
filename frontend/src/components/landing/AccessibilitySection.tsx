"use client";

import { motion } from "framer-motion";
import { Check, Contrast } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useSafeReducedMotion } from "@/lib/hooks/useSafeReducedMotion";

const STORAGE_KEY = "hearmeai-high-contrast";

const COMMITMENTS: string[] = [
  "WCAG 2.1 AA contrast targeted across all surfaces",
  "High-contrast mode toggle (live, no reload)",
  "Font scaling: Normal · Large · X-Large",
  "Full keyboard navigation with visible focus rings",
  "ARIA live regions for transcripts and status",
  "RTL layout for Arabic, end-to-end",
  "No critical information conveyed by audio alone",
  "`prefers-reduced-motion` respected everywhere",
];

export default function AccessibilitySection() {
  const reduceMotion = useSafeReducedMotion();
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(STORAGE_KEY) === "true";
    if (saved) {
      setHighContrast(true);
      document.documentElement.classList.add("high-contrast");
    }
  }, []);

  const toggleContrast = useCallback(() => {
    setHighContrast((prev) => {
      const next = !prev;
      if (typeof document !== "undefined") {
        document.documentElement.classList.toggle("high-contrast", next);
      }
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, next ? "true" : "false");
      }
      return next;
    });
  }, []);

  return (
    <section
      id="accessibility"
      aria-labelledby="a11y-heading"
      className="relative py-28 sm:py-32 bg-slate-950"
    >
      <div
        className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_85%_15%,rgba(20,184,166,0.08),transparent_55%),radial-gradient(circle_at_15%_85%,rgba(99,102,241,0.06),transparent_55%)]"
        aria-hidden
      />

      <div className="container relative z-10 px-6 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          {/* Mission */}
          <div className="lg:col-span-5">
            <motion.span
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border border-white/10 text-[11px] font-semibold tracking-[0.2em] uppercase text-slate-300"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-teal-300" />
              Accessibility · Our Foundation
            </motion.span>

            <motion.h2
              id="a11y-heading"
              initial={reduceMotion ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="mt-6 text-4xl md:text-5xl font-bold font-heading tracking-tight leading-[1.1]"
            >
              Inclusion isn&apos;t a feature.{" "}
              <span className="text-gradient">It&apos;s the foundation.</span>
            </motion.h2>

            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mt-5 text-slate-400 text-base md:text-lg leading-relaxed"
            >
              HearMeAI is built for the people most software forgets. Every
              screen, every interaction, and every fallback in this product is
              shaped by accessibility-first principles — not added at the end.
            </motion.p>

            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="mt-8"
            >
              <button
                type="button"
                onClick={toggleContrast}
                aria-pressed={highContrast}
                className="group inline-flex items-center gap-2 rounded-full border border-teal-300/40 bg-teal-300/10 px-5 py-3 text-sm font-medium text-teal-100 hover:bg-teal-300/20 transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-300/40"
              >
                <Contrast
                  className="w-4 h-4 group-hover:rotate-12 transition-transform"
                  aria-hidden
                />
                {highContrast ? "Restore default contrast" : "Try high-contrast mode now"}
              </button>
              <p className="mt-3 text-xs text-slate-500">
                Toggles a higher-contrast skin across the entire page in real
                time. Your choice is remembered locally.
              </p>
            </motion.div>
          </div>

          {/* Commitments */}
          <div className="lg:col-span-7">
            <ul className="grid sm:grid-cols-2 gap-3">
              {COMMITMENTS.map((item, idx) => (
                <CommitmentRow
                  key={item}
                  text={item}
                  delay={idx * 0.05}
                  reduceMotion={!!reduceMotion}
                />
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function CommitmentRow({
  text,
  delay,
  reduceMotion,
}: {
  text: string;
  delay: number;
  reduceMotion: boolean;
}) {
  return (
    <motion.li
      initial={reduceMotion ? false : { opacity: 0, x: 16 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.4, delay }}
      className="flex items-start gap-3 rounded-2xl glass border border-white/10 p-4 hover:border-teal-300/40 transition-colors focus-within:border-teal-300/60"
      tabIndex={0}
    >
      <span className="grid place-items-center w-7 h-7 rounded-full bg-teal-300/15 text-teal-200 flex-shrink-0">
        <Check className="w-3.5 h-3.5" aria-hidden />
      </span>
      <span className="text-sm text-slate-200 leading-relaxed">
        {renderInline(text)}
      </span>
    </motion.li>
  );
}

function renderInline(text: string) {
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((part, idx) =>
    part.startsWith("`") && part.endsWith("`") ? (
      <code
        key={idx}
        className="px-1.5 py-0.5 rounded bg-white/10 text-xs text-slate-100 font-mono"
      >
        {part.slice(1, -1)}
      </code>
    ) : (
      <span key={idx}>{part}</span>
    )
  );
}

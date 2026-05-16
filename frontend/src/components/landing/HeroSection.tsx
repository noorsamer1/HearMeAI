"use client";

import { motion } from "framer-motion";
import { Captions, Hand, Mic, LogIn } from "lucide-react";
import { useSafeReducedMotion } from "@/lib/hooks/useSafeReducedMotion";

export default function HeroSection() {
  const reduceMotion = useSafeReducedMotion();

  const fadeUp = reduceMotion
    ? { initial: false, animate: { opacity: 1, y: 0 } }
    : {
        initial: { opacity: 0, y: 24 },
        animate: { opacity: 1, y: 0 },
      };

  return (
    <section
      className="relative min-h-[92vh] flex items-center pt-28 pb-16 overflow-hidden"
      aria-labelledby="hero-heading"
    >
      <BackgroundField reduceMotion={!!reduceMotion} />

      <div className="container px-6 max-w-7xl mx-auto relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <motion.span
            {...fadeUp}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full surface-glass-light px-3 py-1.5 text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--color-text-secondary)]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-warm)]" />
            AI-Powered · Inclusive Communication
          </motion.span>

          <motion.h1
            id="hero-heading"
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="mt-6 text-5xl md:text-6xl lg:text-7xl font-bold font-heading leading-[1.05] tracking-tight text-[var(--color-text-primary)]"
          >
            Communication{" "}
            <span className="text-gradient">without barriers.</span>
          </motion.h1>

          <motion.p
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-6 text-lg md:text-xl text-[var(--color-text-secondary)] max-w-xl mx-auto leading-relaxed"
          >
            HearMeAI turns speech into captions, text into voice, and ideas into
            signs — in real time, in two languages, for everyone.
          </motion.p>

          <motion.div
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-10 flex flex-col items-center justify-center"
          >
            <a
              href="/auth"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full px-8 py-4 font-semibold text-[var(--color-text-inverse)] focus:outline-none focus-visible:ring-4 focus-visible:ring-[color-mix(in_srgb,var(--color-brand)_55%,transparent)] sm:w-auto"
              style={{
                background:
                  "linear-gradient(135deg, var(--color-brand-400) 0%, var(--color-accent-500) 100%)",
                boxShadow: "0 4px 24px var(--color-brand-glow)",
              }}
            >
              <LogIn className="h-4 w-4" aria-hidden />
              Sign In
            </a>
          </motion.div>

          <motion.a
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.35 }}
            href="#problem"
            className="mt-8 inline-flex items-center gap-2 rounded text-sm text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-brand)_55%,transparent)]"
          >
            <span aria-hidden>↓</span>
            See why we built this
          </motion.a>
        </div>
      </div>
    </section>
  );
}

function BackgroundField({ reduceMotion }: { reduceMotion: boolean }) {
  const blobBase = "absolute rounded-full mix-blend-screen blur-[120px]";
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden
    >
      <div
        className={`${blobBase} left-1/4 top-1/4 h-96 w-96 bg-[color-mix(in_srgb,var(--color-brand-600)_20%,transparent)] ${
          reduceMotion ? "" : "animate-blob"
        }`}
      />
      <div
        className={`${blobBase} right-1/4 top-1/3 h-[500px] w-[500px] bg-[color-mix(in_srgb,var(--color-accent)_20%,transparent)] blur-[150px] ${
          reduceMotion ? "" : "animate-blob animation-delay-2000"
        }`}
      />
      <div
        className={`${blobBase} bottom-1/4 left-1/2 h-80 w-80 bg-[color-mix(in_srgb,var(--color-brand)_20%,transparent)] blur-[100px] ${
          reduceMotion ? "" : "animate-blob animation-delay-4000"
        }`}
      />
      {!reduceMotion && (
        <>
          <Mic className="absolute right-[12%] top-[18%] h-10 w-10 text-[color-mix(in_srgb,var(--color-brand-600)_12%,transparent)]" />
          <Captions className="absolute bottom-[22%] left-[8%] h-12 w-12 text-[color-mix(in_srgb,var(--color-accent)_14%,transparent)]" />
          <Hand className="absolute left-[6%] top-[30%] h-8 w-8 text-[color-mix(in_srgb,var(--color-brand-600)_10%,transparent)]" />
        </>
      )}
    </div>
  );
}

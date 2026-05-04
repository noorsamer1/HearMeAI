"use client";

import { motion } from "framer-motion";
import { ArrowRight, Captions, Hand, Mic } from "lucide-react";
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
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border border-white/10 text-[11px] font-semibold tracking-[0.18em] uppercase text-slate-300"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-neon-yellow" />
            AI-Powered · Inclusive Communication
          </motion.span>

          <motion.h1
            id="hero-heading"
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="mt-6 text-5xl md:text-6xl lg:text-7xl font-bold font-heading leading-[1.05] tracking-tight"
          >
            Communication{" "}
            <span className="text-gradient">without barriers.</span>
          </motion.h1>

          <motion.p
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-6 text-lg md:text-xl text-slate-400 max-w-xl mx-auto leading-relaxed"
          >
            HearMeAI turns speech into captions, text into voice, and ideas into
            signs — in real time, in two languages, for everyone.
          </motion.p>

          <motion.div
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-10 flex justify-center"
          >
            <a href="/app" className="w-full sm:w-auto inline-block">
              <span className="w-full sm:w-auto px-8 py-4 rounded-full font-medium text-white glass border border-white/10 hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-400/60 flex items-center justify-center gap-2">
                Try Live Demo
                <ArrowRight className="w-4 h-4" aria-hidden />
              </span>
            </a>
          </motion.div>

          <motion.a
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.35 }}
            href="#problem"
            className="mt-8 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60 rounded"
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
        className={`${blobBase} top-1/4 left-1/4 w-96 h-96 bg-brand-600/20 ${
          reduceMotion ? "" : "animate-blob"
        }`}
      />
      <div
        className={`${blobBase} top-1/3 right-1/4 w-[500px] h-[500px] bg-accent/20 blur-[150px] ${
          reduceMotion ? "" : "animate-blob animation-delay-2000"
        }`}
      />
      <div
        className={`${blobBase} bottom-1/4 left-1/2 w-80 h-80 bg-neon-blue/20 blur-[100px] ${
          reduceMotion ? "" : "animate-blob animation-delay-4000"
        }`}
      />
      {!reduceMotion && (
        <>
          <Mic className="absolute top-[18%] right-[12%] w-10 h-10 text-white/[0.04]" />
          <Captions className="absolute bottom-[22%] left-[8%] w-12 h-12 text-white/[0.05]" />
          <Hand className="absolute top-[30%] left-[6%] w-8 h-8 text-white/[0.04]" />
        </>
      )}
    </div>
  );
}

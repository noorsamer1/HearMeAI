"use client";

import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useSafeReducedMotion } from "@/lib/hooks/useSafeReducedMotion";

type Stat = {
  value: number;
  display: (n: number) => string;
  label: string;
  source: string;
  sourceUrl: string;
};

const STATS: Stat[] = [
  {
    value: 430,
    display: (n) => `${n}M+`,
    label: "people live with disabling hearing loss worldwide",
    source: "WHO",
    sourceUrl: "https://www.who.int/news-room/fact-sheets/detail/deafness-and-hearing-loss",
  },
  {
    value: 2.5,
    display: (n) => `~${n.toFixed(1)}B`,
    label: "projected to have some degree of hearing loss by 2050",
    source: "WHO",
    sourceUrl: "https://www.who.int/news-room/fact-sheets/detail/deafness-and-hearing-loss",
  },
  {
    value: 70,
    display: (n) => `${n}+`,
    label: "active sign languages globally — most digital tools support none",
    source: "WFD",
    sourceUrl: "https://wfdeaf.org/our-work/",
  },
];

export default function ProblemSection() {
  const reduceMotion = useSafeReducedMotion();

  return (
    <section
      id="problem"
      aria-labelledby="problem-heading"
      className="relative py-28 sm:py-32 bg-slate-950"
    >
      {/* Subtle background tint */}
      <div
        className="absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.08),transparent_60%)]"
        aria-hidden
      />

      <div className="container relative z-10 px-6 max-w-4xl mx-auto text-center">
        <motion.span
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border border-white/10 text-[11px] font-semibold tracking-[0.2em] uppercase text-slate-300"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
          The Problem
        </motion.span>

        <motion.h2
          id="problem-heading"
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="mt-6 text-4xl md:text-5xl lg:text-6xl font-bold font-heading tracking-tight leading-[1.1]"
        >
          Every conversation has a barrier.{" "}
          <span className="text-slate-400">Most people just don&apos;t see it.</span>
        </motion.h2>

        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-6 text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed"
        >
          Hundreds of millions of people are deaf, hard-of-hearing, or non-speaking.
          Today&apos;s tools force them to pick between speed, accuracy, or
          accessibility — almost never all three. HearMeAI exists to remove that
          trade-off.
        </motion.p>

        {/* Subtle waveform → captions accent */}
        <div className="mt-10 mx-auto h-px w-24 bg-gradient-to-r from-transparent via-brand-400/60 to-transparent" aria-hidden />

        <ul className="mt-14 grid gap-6 sm:grid-cols-3 text-left">
          {STATS.map((stat, idx) => (
            <StatTile key={stat.label} stat={stat} delay={idx * 0.1} reduceMotion={!!reduceMotion} />
          ))}
        </ul>

        <p className="mt-10 text-xs text-slate-500">
          Sources cited inline. Numbers reflect publicly available global health
          and language statistics.
        </p>
      </div>
    </section>
  );
}

function StatTile({
  stat,
  delay,
  reduceMotion,
}: {
  stat: Stat;
  delay: number;
  reduceMotion: boolean;
}) {
  const ref = useRef<HTMLLIElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [shown, setShown] = useState(reduceMotion ? stat.value : 0);

  useEffect(() => {
    if (!inView) return;
    if (reduceMotion) {
      setShown(stat.value);
      return;
    }
    const duration = 1200;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Number((stat.value * eased).toFixed(stat.value < 10 ? 1 : 0)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduceMotion, stat.value]);

  return (
    <motion.li
      ref={ref}
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay }}
      className="glass border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors"
    >
      <p
        className="text-4xl md:text-5xl font-bold font-heading text-gradient leading-none"
        aria-label={`${stat.display(stat.value)} ${stat.label}`}
      >
        {stat.display(shown)}
      </p>
      <p className="mt-3 text-sm text-slate-300 leading-relaxed">{stat.label}</p>
      <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-slate-500">
        Source:{" "}
        <a
          href={stat.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-dotted hover:text-slate-300"
        >
          {stat.source}
        </a>
      </p>
    </motion.li>
  );
}

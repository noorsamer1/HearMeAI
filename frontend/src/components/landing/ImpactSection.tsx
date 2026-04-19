"use client";

import { motion } from "framer-motion";
import {
  GraduationCap,
  MessagesSquare,
  Mic,
  type LucideIcon,
} from "lucide-react";
import { useSafeReducedMotion } from "@/lib/hooks/useSafeReducedMotion";

type Persona = {
  title: string;
  scenario: string;
  icon: LucideIcon;
  accent: string;
};

const PERSONAS: Persona[] = [
  {
    title: "Deaf student",
    scenario:
      "Joins a lecture remotely. Captions stream the moment the professor speaks.",
    icon: GraduationCap,
    accent: "from-brand-500/30 via-brand-500/0 to-brand-500/0",
  },
  {
    title: "Mute professional",
    scenario:
      "Speaks in a meeting through natural TTS — without typing in front of the room.",
    icon: Mic,
    accent: "from-accent/30 via-accent/0 to-accent/0",
  },
  {
    title: "Mixed conversation",
    scenario:
      "Two users with different needs join one room; both understand each other in real time.",
    icon: MessagesSquare,
    accent: "from-teal-400/30 via-teal-400/0 to-teal-400/0",
  },
];

export default function ImpactSection() {
  const reduceMotion = useSafeReducedMotion();

  return (
    <section
      id="impact"
      aria-labelledby="impact-heading"
      className="relative py-28 sm:py-32 bg-slate-950"
    >
      <div
        className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_50%_30%,rgba(168,85,247,0.06),transparent_60%)]"
        aria-hidden
      />

      <div className="container relative z-10 px-6 max-w-5xl mx-auto">
        <div className="text-center max-w-3xl mx-auto">
          <motion.span
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border border-white/10 text-[11px] font-semibold tracking-[0.2em] uppercase text-slate-300"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            Our Mission
          </motion.span>

          <motion.h2
            id="impact-heading"
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="mt-6 text-4xl md:text-5xl lg:text-6xl font-bold font-heading tracking-tight leading-[1.08]"
          >
            A platform built so no one is{" "}
            <span className="text-gradient">left out of the conversation.</span>
          </motion.h2>

          <div
            className="mt-8 mx-auto h-px w-24 bg-gradient-to-r from-transparent via-accent/60 to-transparent"
            aria-hidden
          />

          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-8 text-slate-400 text-base md:text-lg leading-relaxed"
          >
            HearMeAI started as a student project but lives in service of a
            larger goal: an internet where deaf and mute users aren&apos;t
            accommodated by extensions or workarounds — they&apos;re supported by
            software designed with them in mind from the first line of code.
          </motion.p>
        </div>

        <ul className="mt-16 grid gap-6 md:grid-cols-3">
          {PERSONAS.map((persona, idx) => (
            <PersonaCard
              key={persona.title}
              persona={persona}
              delay={idx * 0.1}
              reduceMotion={!!reduceMotion}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}

function PersonaCard({
  persona,
  delay,
  reduceMotion,
}: {
  persona: Persona;
  delay: number;
  reduceMotion: boolean;
}) {
  const Icon = persona.icon;
  return (
    <motion.li
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay }}
      className="group relative rounded-3xl glass border border-white/10 p-7 hover:border-white/20 transition-colors focus-within:border-white/40"
      tabIndex={0}
    >
      <div
        className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${persona.accent} opacity-0 group-hover:opacity-100 transition-opacity`}
        aria-hidden
      />

      <div className="relative">
        <div className="grid place-items-center w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-slate-200">
          <Icon className="w-5 h-5" aria-hidden />
        </div>

        <h3 className="mt-5 text-lg font-semibold font-heading text-slate-100">
          {persona.title}
        </h3>
        <p className="mt-2 text-[15px] text-slate-400 leading-relaxed">
          {persona.scenario}
        </p>
      </div>
    </motion.li>
  );
}

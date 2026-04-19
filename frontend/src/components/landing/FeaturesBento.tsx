"use client";

import { motion } from "framer-motion";
import {
  Captions,
  Globe2,
  Hand,
  Sparkles,
  Users,
  Volume2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useSafeReducedMotion } from "@/lib/hooks/useSafeReducedMotion";

type AccentKey = "audio" | "ai" | "visual" | "language";

const ACCENT_RING: Record<AccentKey, string> = {
  audio: "bg-brand-400",
  ai: "bg-accent",
  visual: "bg-teal-400",
  language: "bg-amber-400",
};

const ACCENT_GLOW: Record<AccentKey, string> = {
  audio: "from-brand-500/20 via-brand-500/0 to-brand-500/0",
  ai: "from-accent/20 via-accent/0 to-accent/0",
  visual: "from-teal-400/20 via-teal-400/0 to-teal-400/0",
  language: "from-amber-400/20 via-amber-400/0 to-amber-400/0",
};

type Tile = {
  title: string;
  description: string;
  icon: LucideIcon;
  accent: AccentKey;
  visual: React.ReactNode;
  span: string;
  large?: boolean;
};

export default function FeaturesBento() {
  const reduceMotion = useSafeReducedMotion();

  const tiles: Tile[] = [
    {
      title: "Real-time Captions",
      description:
        "Whisper-powered speech-to-text with confidence cues, streaming as people speak.",
      icon: Captions,
      accent: "audio",
      visual: <CaptionsVisual reduceMotion={!!reduceMotion} />,
      span: "md:col-span-4",
      large: true,
    },
    {
      title: "Natural Voice",
      description: "Edge TTS in English & Arabic, with multiple voice profiles.",
      icon: Volume2,
      accent: "audio",
      visual: <VoiceVisual reduceMotion={!!reduceMotion} />,
      span: "md:col-span-2",
    },
    {
      title: "3D Hologram Signer",
      description: "Visual sign sequences for known phrases and replies.",
      icon: Hand,
      accent: "visual",
      visual: <SignerVisual reduceMotion={!!reduceMotion} />,
      span: "md:col-span-2",
    },
    {
      title: "AI Message Assist",
      description:
        "Simplify, clarify, or translate any message inline — without leaving the conversation.",
      icon: Sparkles,
      accent: "ai",
      visual: <AssistVisual />,
      span: "md:col-span-4",
      large: true,
    },
    {
      title: "Bilingual + RTL",
      description: "Full English and Arabic UI with proper right-to-left layout.",
      icon: Globe2,
      accent: "language",
      visual: <BilingualVisual />,
      span: "md:col-span-3",
    },
    {
      title: "Live Rooms",
      description:
        "Create a session, join by invite code, or use live matchmaking.",
      icon: Users,
      accent: "visual",
      visual: <RoomsVisual />,
      span: "md:col-span-3",
    },
  ];

  return (
    <section
      id="features"
      aria-labelledby="features-heading"
      className="relative py-28 sm:py-32 bg-slate-950"
    >
      <div className="container px-6 mx-auto max-w-6xl">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border border-white/10 text-[11px] font-semibold tracking-[0.2em] uppercase text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
            Core Features
          </span>
          <h2
            id="features-heading"
            className="mt-5 text-4xl md:text-5xl font-bold font-heading tracking-tight"
          >
            Everything HearMeAI{" "}
            <span className="text-gradient">does, in one place.</span>
          </h2>
          <p className="mt-4 text-slate-400">
            Six capabilities, one accessible workspace.
          </p>
        </div>

        <ul className="grid grid-cols-1 md:grid-cols-6 gap-4 sm:gap-5">
          {tiles.map((tile, idx) => (
            <BentoTile
              key={tile.title}
              tile={tile}
              delay={idx * 0.06}
              reduceMotion={!!reduceMotion}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}

function BentoTile({
  tile,
  delay,
  reduceMotion,
}: {
  tile: Tile;
  delay: number;
  reduceMotion: boolean;
}) {
  const Icon = tile.icon;
  return (
    <motion.li
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay }}
      className={`relative ${tile.span} group rounded-3xl glass border border-white/10 overflow-hidden ${
        reduceMotion
          ? "transition-colors hover:border-white/20"
          : "transition-all hover:-translate-y-1 hover:border-white/20"
      }`}
      tabIndex={0}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${ACCENT_GLOW[tile.accent]} opacity-0 group-hover:opacity-100 transition-opacity`}
        aria-hidden
      />

      <div
        className={`relative flex flex-col gap-5 p-6 sm:p-7 ${
          tile.large ? "min-h-[260px]" : "min-h-[220px]"
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="inline-flex items-center gap-2">
            <span
              className={`w-1.5 h-1.5 rounded-full ${ACCENT_RING[tile.accent]}`}
              aria-hidden
            />
            <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
              {tile.accent}
            </span>
          </div>
          <Icon
            className="w-5 h-5 text-slate-300 group-hover:text-white transition-colors"
            aria-hidden
          />
        </div>

        <div className="flex-1">
          <h3 className="text-lg sm:text-xl font-semibold font-heading text-slate-100">
            {tile.title}
          </h3>
          <p className="mt-2 text-sm sm:text-[15px] text-slate-400 leading-relaxed">
            {tile.description}
          </p>
        </div>

        <div className="mt-auto">{tile.visual}</div>
      </div>
    </motion.li>
  );
}

/* --------- per-tile visuals --------- */

function CaptionsVisual({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <div className="flex items-end gap-4">
      <div className="flex items-end gap-1 h-12" aria-hidden>
        {[0.4, 0.7, 1, 0.6, 0.9, 0.5, 0.8].map((h, i) => (
          <span
            key={i}
            className={`w-1.5 bg-brand-300 rounded-full ${
              reduceMotion ? "" : "animate-waveform"
            }`}
            style={{ height: `${h * 100}%`, animationDelay: `${i * 0.08}s` }}
          />
        ))}
      </div>
      <div className="flex-1 rounded-xl bg-slate-900/60 border border-white/5 px-3 py-2 text-xs text-slate-300">
        <span className="text-slate-500">Live caption · </span>
        Hello — would you like a quick walkthrough?
      </div>
    </div>
  );
}

function VoiceVisual({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="relative grid place-items-center w-10 h-10 rounded-full bg-brand-500/20 text-brand-200">
        <Volume2 className="w-4 h-4" aria-hidden />
        {!reduceMotion && (
          <span className="absolute inset-0 rounded-full border border-brand-300/60 animate-ping" />
        )}
      </span>
      <div className="flex items-end gap-[3px] h-6" aria-hidden>
        {[0.4, 0.7, 1, 0.5, 0.9].map((h, i) => (
          <span
            key={i}
            className={`w-[3px] bg-slate-200 rounded-full ${
              reduceMotion ? "" : "animate-waveform"
            }`}
            style={{ height: `${h * 100}%`, animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>
    </div>
  );
}

function AssistVisual() {
  return (
    <div className="grid sm:grid-cols-2 gap-3 text-xs">
      <div className="rounded-xl bg-slate-900/60 border border-white/5 p-3">
        <p className="uppercase tracking-[0.18em] text-[10px] text-slate-500 mb-1">
          Original
        </p>
        <p className="text-slate-300">
          The neural transcription stack synthesises multilingual real-time
          captions.
        </p>
      </div>
      <div className="rounded-xl bg-accent/10 border border-accent/30 p-3">
        <p className="uppercase tracking-[0.18em] text-[10px] text-accent mb-1">
          Simplified
        </p>
        <p className="text-slate-100">
          HearMeAI shows captions while you speak.
        </p>
      </div>
    </div>
  );
}

function SignerVisual({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <div className="aspect-video rounded-xl bg-gradient-to-br from-teal-500/15 via-brand-500/10 to-accent/10 border border-white/5 grid place-items-center relative overflow-hidden">
      <Hand
        className={`w-10 h-10 text-teal-200 ${
          reduceMotion ? "" : "animate-pulse"
        }`}
        aria-hidden
      />
      <span className="absolute bottom-2 right-3 text-[10px] uppercase tracking-[0.18em] text-slate-400">
        signing
      </span>
    </div>
  );
}

function BilingualVisual() {
  return (
    <div className="inline-flex items-center gap-2 rounded-full glass border border-white/10 px-3 py-1.5 text-xs">
      <span className="font-semibold text-slate-100">EN</span>
      <span className="text-slate-500">⇄</span>
      <span className="font-semibold text-slate-100">AR</span>
      <span className="text-slate-500">·</span>
      <span className="text-slate-400">RTL ready</span>
    </div>
  );
}

function RoomsVisual() {
  return (
    <div className="inline-flex items-center gap-2 rounded-xl glass border border-white/10 px-3 py-2 text-xs font-mono text-slate-200 tracking-[0.2em]">
      <span className="text-slate-500">CODE</span>
      <span className="text-slate-100">7K · 3M · 9X</span>
    </div>
  );
}

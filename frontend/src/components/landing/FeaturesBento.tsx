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
  audio: "bg-[var(--color-brand)]",
  ai: "bg-[var(--color-accent)]",
  visual: "bg-[var(--color-success)]",
  language: "bg-[var(--color-warning)]",
};

const ACCENT_GLOW: Record<AccentKey, string> = {
  audio:
    "from-[color-mix(in_srgb,var(--color-brand-500)_20%,transparent)] via-transparent to-transparent",
  ai: "from-[color-mix(in_srgb,var(--color-accent-500)_20%,transparent)] via-transparent to-transparent",
  visual:
    "from-[color-mix(in_srgb,var(--color-success)_22%,transparent)] via-transparent to-transparent",
  language:
    "from-[color-mix(in_srgb,var(--color-warning)_22%,transparent)] via-transparent to-transparent",
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
      className="relative py-28 sm:py-32 bg-[var(--color-bg)]"
    >
      <div className="container px-6 mx-auto max-w-6xl">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-flex items-center gap-2 rounded-full surface-glass-light px-3 py-1 text-[11px] font-semibold tracking-[0.2em] uppercase text-[var(--color-text-secondary)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand)]" />
            Core Features
          </span>
          <h2
            id="features-heading"
            className="mt-5 text-4xl md:text-5xl font-bold font-heading tracking-tight text-[var(--color-text-primary)]"
          >
            Everything HearMeAI{" "}
            <span className="text-gradient">does, in one place.</span>
          </h2>
          <p className="mt-4 text-[var(--color-text-secondary)]">
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
      className={`relative ${tile.span} group rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm overflow-hidden ${
        reduceMotion
          ? "transition-colors hover:border-[var(--color-border-strong)]"
          : "transition-all hover:-translate-y-1 hover:shadow-md hover:border-[var(--color-border-strong)]"
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
            <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-tertiary)]">
              {tile.accent}
            </span>
          </div>
          <Icon
            className="h-5 w-5 text-[var(--color-text-muted)] transition-colors group-hover:text-[var(--color-brand)]"
            aria-hidden
          />
        </div>

        <div className="flex-1">
          <h3 className="text-lg sm:text-xl font-semibold font-heading text-[var(--color-text-primary)]">
            {tile.title}
          </h3>
          <p className="mt-2 text-sm sm:text-[15px] text-[var(--color-text-secondary)] leading-relaxed">
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
            className={`w-1.5 rounded-full bg-[var(--color-brand-300)] ${
              reduceMotion ? "" : "animate-waveform"
            }`}
            style={{ height: `${h * 100}%`, animationDelay: `${i * 0.08}s` }}
          />
        ))}
      </div>
      <div className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-xs text-[var(--color-text-primary)]">
        <span className="text-[var(--color-text-tertiary)]">Live caption · </span>
        Hello — would you like a quick walkthrough?
      </div>
    </div>
  );
}

function VoiceVisual({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="relative grid h-10 w-10 place-items-center rounded-full bg-[color-mix(in_srgb,var(--color-brand)_15%,transparent)] text-[var(--color-brand-dim)]">
        <Volume2 className="h-4 w-4" aria-hidden />
        {!reduceMotion && (
          <span className="absolute inset-0 animate-ping rounded-full border border-[color-mix(in_srgb,var(--color-brand-300)_60%,transparent)]" />
        )}
      </span>
      <div className="flex items-end gap-[3px] h-6" aria-hidden>
        {[0.4, 0.7, 1, 0.5, 0.9].map((h, i) => (
          <span
            key={i}
            className={`w-[3px] rounded-full bg-[color-mix(in_srgb,var(--color-brand)_40%,transparent)] ${
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
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-sunken)] p-3">
        <p className="uppercase tracking-[0.18em] text-[10px] text-[var(--color-text-tertiary)] mb-1">
          Original
        </p>
        <p className="text-[var(--color-text-secondary)]">
          The neural transcription stack synthesises multilingual real-time
          captions.
        </p>
      </div>
      <div className="rounded-xl border border-[color-mix(in_srgb,var(--color-accent)_25%,transparent)] bg-[var(--color-accent-muted)] p-3">
        <p className="mb-1 text-[10px] uppercase tracking-[0.18em] text-[var(--color-accent)]">
          Simplified
        </p>
        <p className="text-[var(--color-text-primary)]">
          HearMeAI shows captions while you speak.
        </p>
      </div>
    </div>
  );
}

function SignerVisual({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <div className="relative grid aspect-video place-items-center overflow-hidden rounded-xl border border-[var(--color-border)] bg-gradient-to-br from-[color-mix(in_srgb,var(--color-success)_15%,transparent)] via-[color-mix(in_srgb,var(--color-brand)_10%,transparent)] to-[color-mix(in_srgb,var(--color-accent)_10%,transparent)]">
      <Hand
        className={`h-10 w-10 text-[var(--color-success)] ${
          reduceMotion ? "" : "animate-pulse"
        }`}
        aria-hidden
      />
      <span className="absolute bottom-2 right-3 text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-tertiary)]">
        signing
      </span>
    </div>
  );
}

function BilingualVisual() {
  return (
    <div className="inline-flex items-center gap-2 rounded-full surface-glass-light border border-[var(--color-border)] px-3 py-1.5 text-xs">
      <span className="font-semibold text-[var(--color-text-primary)]">EN</span>
      <span className="text-[var(--color-text-tertiary)]">⇄</span>
      <span className="font-semibold text-[var(--color-text-primary)]">AR</span>
      <span className="text-[var(--color-text-tertiary)]">·</span>
      <span className="text-[var(--color-text-secondary)]">RTL ready</span>
    </div>
  );
}

function RoomsVisual() {
  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-xs font-mono text-[var(--color-text-primary)] tracking-[0.2em]">
      <span className="text-[var(--color-text-tertiary)]">CODE</span>
      <span>7K · 3M · 9X</span>
    </div>
  );
}

"use client";

import { motion, useInView } from "framer-motion";
import { ArrowRight, Mic, Send, Sparkles, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSafeReducedMotion } from "@/lib/hooks/useSafeReducedMotion";

const BEAT_DURATION_MS = 4000;
const TOTAL_BEATS = 3;

export default function AnimatedPreview() {
  const reduceMotion = useSafeReducedMotion();
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const inView = useInView(sectionRef, { margin: "-120px" });
  const [beat, setBeat] = useState(0);
  const [tabHidden, setTabHidden] = useState(false);

  useEffect(() => {
    const onVisibility = () => setTabHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const animate = !reduceMotion && inView && !tabHidden;

  useEffect(() => {
    if (!animate) return;
    const id = window.setInterval(() => {
      setBeat((b) => (b + 1) % TOTAL_BEATS);
    }, BEAT_DURATION_MS);
    return () => window.clearInterval(id);
  }, [animate]);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="preview-heading"
      className="relative py-24 overflow-hidden bg-[var(--color-bg-subtle)]"
    >
      <div
        className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_50%_100%,rgba(168,85,247,0.08),transparent_60%)]"
        aria-hidden
      />

      <div className="container px-6 mx-auto max-w-6xl relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-flex items-center gap-2 rounded-full surface-glass-light px-3 py-1 text-[11px] font-semibold tracking-[0.2em] uppercase text-[var(--color-text-secondary)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand)]" />
            See It In Motion
          </span>
          <h2
            id="preview-heading"
            className="mt-5 text-3xl md:text-4xl lg:text-5xl font-bold font-heading tracking-tight text-[var(--color-text-primary)]"
          >
            A live workspace built for{" "}
            <span className="text-gradient">every kind of conversation.</span>
          </h2>
          <p className="mt-4 text-[var(--color-text-secondary)] text-base md:text-lg leading-relaxed">
            Three core flows in twelve seconds — captions, voice, and AI assistance,
            all in one room.
          </p>
        </div>

        <div className="relative mx-auto max-w-5xl">
          <div
            className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-[color-mix(in_srgb,var(--color-brand)_30%,transparent)] via-[color-mix(in_srgb,var(--color-accent)_20%,transparent)] to-[color-mix(in_srgb,var(--color-info)_20%,transparent)] blur-2xl opacity-70"
            aria-hidden
          />

          <div className="relative rounded-3xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-lg)]">
            {/* Window chrome */}
            <div className="flex items-center px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface-sunken)]">
              <div className="flex space-x-2" aria-hidden>
                <div className="h-3 w-3 rounded-full bg-[color-mix(in_srgb,var(--color-error)_80%,transparent)]" />
                <div className="h-3 w-3 rounded-full bg-[color-mix(in_srgb,var(--color-warning)_80%,transparent)]" />
                <div className="h-3 w-3 rounded-full bg-[color-mix(in_srgb,var(--color-success)_80%,transparent)]" />
              </div>
              <div className="mx-auto text-[11px] font-semibold text-[var(--color-text-tertiary)] font-heading tracking-[0.2em] uppercase">
                HearMeAI · Live Session
              </div>
              <BeatDots active={beat} animate={animate} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px]">
              {/* Conversation timeline */}
              <div className="lg:col-span-8 flex flex-col bg-[var(--color-surface)]">
                <div
                  className="flex-1 p-5 sm:p-6 space-y-4 overflow-hidden"
                  aria-live="polite"
                  aria-atomic="false"
                >
                  {reduceMotion ? (
                    <StaticTranscript />
                  ) : (
                    <AnimatedTranscript beat={beat} />
                  )}
                </div>

                <DockBar beat={beat} animate={animate} />
              </div>

              {/* Live caption side panel */}
              <SidePanel beat={beat} animate={animate} />
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-[var(--color-text-tertiary)]">
          This is a recording.{" "}
          <a
            href="/auth"
            className="inline-flex items-center gap-1 text-[var(--color-text-secondary)] underline decoration-dotted transition-colors hover:text-[var(--color-text-primary)]"
          >
            Sign in to use the app
            <ArrowRight className="h-3 w-3" aria-hidden />
          </a>
        </p>
      </div>
    </section>
  );
}

function BeatDots({ active, animate }: { active: number; animate: boolean }) {
  return (
    <div className="w-16 flex justify-end items-center gap-1.5" aria-hidden>
      {Array.from({ length: TOTAL_BEATS }).map((_, i) => (
        <span
          key={i}
          className={`h-1.5 rounded-full transition-all duration-500 ${
            animate && i === active
              ? "w-6 bg-[var(--color-brand)]"
              : "w-1.5 bg-[var(--color-border-strong)]"
          }`}
        />
      ))}
    </div>
  );
}

function AnimatedTranscript({ beat }: { beat: number }) {
  return (
    <div className="space-y-4">
      {/* Beat 1: speech-to-caption bubble appears */}
      <ChatBubble visible={beat >= 0} side="left" delay={0}>
        <div className="flex items-center gap-2 mb-1 text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-tertiary)]">
          <Waveform />
          Speech to caption
        </div>
        <Typewriter
          text="Hey — would you like me to walk you through HearMeAI?"
          activeKey={`beat-0-${beat === 0 ? "on" : "off"}`}
          run={beat === 0}
        />
      </ChatBubble>

      {/* Beat 2: user text-to-speech */}
      <ChatBubble visible={beat >= 1} side="right" delay={0.05}>
        <div className="flex items-center gap-2 mb-1 text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-secondary)] justify-end">
          Text to voice
          <Volume2 className="w-3 h-3" aria-hidden />
        </div>
        <Typewriter
          text="Yes, please. Speak this out loud for me."
          activeKey={`beat-1-${beat === 1 ? "on" : "off"}`}
          run={beat === 1}
          tone="user"
        />
        {beat === 1 && (
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[color-mix(in_srgb,var(--color-text-inverse)_80%,transparent)]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color-mix(in_srgb,var(--color-text-inverse)_70%,transparent)]" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-text-inverse)]" />
            </span>
            Playing TTS…
          </div>
        )}
      </ChatBubble>

      {/* Beat 3: AI assist (simplify) */}
      <ChatBubble visible={beat >= 2} side="left" delay={0.05} highlighted={beat === 2}>
        <div className="mb-1 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[var(--color-brand-dim)]">
          <Sparkles className="w-3 h-3" aria-hidden />
          AI Assist · Simplify
        </div>
        <SimplifyMorph active={beat === 2} />
      </ChatBubble>
    </div>
  );
}

function StaticTranscript() {
  return (
    <div className="space-y-4">
      <ChatBubble visible side="left">
        <div className="flex items-center gap-2 mb-1 text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-tertiary)]">
          <Waveform />
          Speech to caption
        </div>
        <p className="text-[var(--color-text-primary)]">
          Hey — would you like me to walk you through HearMeAI?
        </p>
      </ChatBubble>
      <ChatBubble visible side="right">
        <div className="flex items-center gap-2 mb-1 text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-secondary)] justify-end">
          Text to voice
          <Volume2 className="w-3 h-3" aria-hidden />
        </div>
        <p className="text-[var(--color-text-inverse)]">Yes, please. Speak this out loud for me.</p>
      </ChatBubble>
      <ChatBubble visible side="left">
        <div className="mb-1 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[var(--color-brand-dim)]">
          <Sparkles className="w-3 h-3" aria-hidden />
          AI Assist · Simplify
        </div>
        <p className="text-[var(--color-text-primary)]">
          HearMeAI brings captions, voice, and AI help into one accessible chat.
        </p>
      </ChatBubble>
    </div>
  );
}

function ChatBubble({
  children,
  side,
  visible,
  delay = 0,
  highlighted = false,
}: {
  children: React.ReactNode;
  side: "left" | "right";
  visible: boolean;
  delay?: number;
  highlighted?: boolean;
}) {
  if (!visible) return null;
  const isUser = side === "right";
  return (
    <motion.div
      initial={{ opacity: 0, x: isUser ? 16 : -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[78%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed border transition-all ${
          isUser
            ? "rounded-tr-md border-transparent bg-[color-mix(in_srgb,var(--color-brand)_95%,transparent)] text-[var(--color-text-inverse)] shadow-md shadow-[color-mix(in_srgb,var(--color-brand)_20%,transparent)]"
            : `rounded-tl-md border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] ${
                highlighted
                  ? "ring-2 ring-[color-mix(in_srgb,var(--color-brand)_60%,transparent)]"
                  : ""
              }`
        }`}
      >
        {children}
      </div>
    </motion.div>
  );
}

function Waveform() {
  return (
    <span className="inline-flex items-end gap-[2px] h-3" aria-hidden>
      {[0.4, 0.7, 1, 0.6, 0.9, 0.5].map((h, i) => (
        <span
          key={i}
          className="w-[2px] animate-waveform rounded-full bg-[var(--color-brand-300)]"
          style={{ height: `${h * 100}%`, animationDelay: `${i * 0.08}s` }}
        />
      ))}
    </span>
  );
}

function Typewriter({
  text,
  activeKey,
  run,
  tone = "system",
}: {
  text: string;
  activeKey: string;
  run: boolean;
  tone?: "system" | "user";
}) {
  const [shown, setShown] = useState(run ? "" : text);

  useEffect(() => {
    if (!run) {
      setShown(text);
      return;
    }
    setShown("");
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) window.clearInterval(id);
    }, 28);
    return () => window.clearInterval(id);
  }, [activeKey, text, run]);

  return (
    <p className={tone === "user" ? "text-[var(--color-text-inverse)]" : "text-[var(--color-text-primary)]"}>
      {shown}
      {run && shown.length < text.length && (
        <span className="inline-block w-[2px] h-4 align-middle ml-[1px] bg-current animate-pulse" />
      )}
    </p>
  );
}

function SimplifyMorph({ active }: { active: boolean }) {
  const longText =
    "HearMeAI synthesises real-time multilingual transcription, neural speech generation, and contextual AI rewriting within a single conversational interface.";
  const shortText =
    "HearMeAI brings captions, voice, and AI help into one accessible chat.";
  const [showShort, setShowShort] = useState(!active);

  useEffect(() => {
    if (!active) {
      setShowShort(false);
      return;
    }
    setShowShort(false);
    const id = window.setTimeout(() => setShowShort(true), 1600);
    return () => window.clearTimeout(id);
  }, [active]);

  return (
    <motion.p
      key={showShort ? "short" : "long"}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="text-[var(--color-text-primary)]"
    >
      {showShort ? shortText : longText}
    </motion.p>
  );
}

function DockBar({ beat, animate }: { beat: number; animate: boolean }) {
  const isListening = animate && beat === 0;
  const isTyping = animate && beat === 1;

  return (
    <div className="m-4 mt-0 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-sunken)] backdrop-blur-md p-3 flex items-center gap-3">
      <button
        type="button"
        className={`relative w-12 h-12 rounded-full grid place-items-center transition-colors ${
          isListening
            ? "bg-[var(--color-brand)] text-[var(--color-text-inverse)] shadow-lg shadow-[var(--color-brand-glow)]"
            : "bg-[var(--color-bg-subtle)] text-[var(--color-text-muted)]"
        }`}
        aria-label="Microphone"
        tabIndex={-1}
      >
        <Mic className="w-5 h-5" aria-hidden />
        {isListening && (
          <span
            className="absolute h-12 w-12 animate-ping rounded-full border border-[color-mix(in_srgb,var(--color-brand-300)_80%,transparent)]"
            aria-hidden
          />
        )}
      </button>

      <div className="flex-1 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] px-4 py-3 text-[var(--color-text-tertiary)] font-sans text-sm min-h-[44px] flex items-center">
        {isTyping ? (
          <span className="text-[var(--color-text-primary)]">
            Yes, please. Speak this out loud for me
            <span className="inline-block w-[2px] h-4 align-middle ml-[1px] bg-current animate-pulse" />
          </span>
        ) : (
          "Type a message…"
        )}
      </div>

      <button
        type="button"
        className={`w-12 h-12 rounded-full grid place-items-center transition-all ${
          isTyping
            ? "scale-105 bg-[var(--color-brand)] text-[var(--color-text-inverse)] shadow-lg shadow-[var(--color-brand-glow)]"
            : "bg-[color-mix(in_srgb,var(--color-brand)_60%,transparent)] text-[color-mix(in_srgb,var(--color-text-inverse)_80%,transparent)]"
        }`}
        aria-label="Send"
        tabIndex={-1}
      >
        <Send className="w-5 h-5" aria-hidden />
      </button>
    </div>
  );
}

function SidePanel({ beat, animate }: { beat: number; animate: boolean }) {
  return (
    <aside className="hidden lg:flex lg:col-span-4 flex-col border-l border-[var(--color-border)] bg-[var(--color-surface-sunken)] p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
          Live Caption
        </h3>
        <span
          className={`flex items-center gap-1.5 text-[11px] ${
            animate && beat === 0 ? "text-[var(--color-brand)]" : "text-[var(--color-text-tertiary)]"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              animate && beat === 0 ? "animate-pulse bg-[var(--color-brand)]" : "bg-[var(--color-border-strong)]"
            }`}
          />
          {animate && beat === 0 ? "Listening" : "Idle"}
        </span>
      </div>

      <div className="flex-1 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm leading-relaxed text-[var(--color-text-primary)]">
        {animate && beat === 0 ? (
          <Typewriter
            text="Hey — would you like me to walk you through HearMeAI?"
            activeKey={`side-${beat}`}
            run
          />
        ) : (
          <span className="text-[var(--color-text-tertiary)]">
            Captions appear here in real time when the mic is active.
          </span>
        )}
      </div>

      <div className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h4 className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-text-tertiary)] mb-2">
          Hologram Signer
        </h4>
        <div className="grid aspect-video place-items-center rounded-xl border border-[var(--color-border)] bg-gradient-to-br from-[color-mix(in_srgb,var(--color-brand)_15%,transparent)] via-[color-mix(in_srgb,var(--color-accent)_10%,transparent)] to-[color-mix(in_srgb,var(--color-info)_10%,transparent)] text-xs text-[var(--color-text-secondary)]">
          Visual sign preview
        </div>
      </div>
    </aside>
  );
}

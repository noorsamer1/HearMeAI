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
      className="relative py-24 overflow-hidden bg-slate-950"
    >
      <div
        className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_50%_100%,rgba(168,85,247,0.08),transparent_60%)]"
        aria-hidden
      />

      <div className="container px-6 mx-auto max-w-6xl relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border border-white/10 text-[11px] font-semibold tracking-[0.2em] uppercase text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-neon-blue" />
            See It In Motion
          </span>
          <h2
            id="preview-heading"
            className="mt-5 text-3xl md:text-4xl lg:text-5xl font-bold font-heading tracking-tight"
          >
            A live workspace built for{" "}
            <span className="text-gradient">every kind of conversation.</span>
          </h2>
          <p className="mt-4 text-slate-400 text-base md:text-lg leading-relaxed">
            Three core flows in twelve seconds — captions, voice, and AI assistance,
            all in one room.
          </p>
        </div>

        <div className="relative mx-auto max-w-5xl">
          <div
            className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-brand-500/30 via-accent/20 to-neon-blue/20 blur-2xl opacity-70"
            aria-hidden
          />

          <div className="relative rounded-3xl glass-card overflow-hidden border border-white/10 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]">
            {/* Window chrome */}
            <div className="flex items-center px-4 py-3 border-b border-white/5 bg-white/[0.03]">
              <div className="flex space-x-2" aria-hidden>
                <div className="w-3 h-3 rounded-full bg-red-400/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                <div className="w-3 h-3 rounded-full bg-green-400/80" />
              </div>
              <div className="mx-auto text-[11px] font-semibold text-slate-400 font-heading tracking-[0.2em] uppercase">
                HearMeAI · Live Session
              </div>
              <BeatDots active={beat} animate={animate} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px]">
              {/* Conversation timeline */}
              <div className="lg:col-span-8 flex flex-col bg-slate-950/40">
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

        <p className="mt-6 text-center text-xs text-slate-500">
          This is a recording.{" "}
          <a
            href="/app"
            className="inline-flex items-center gap-1 text-slate-300 underline decoration-dotted hover:text-white transition-colors"
          >
            Try it for real
            <ArrowRight className="w-3 h-3" aria-hidden />
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
              ? "w-6 bg-brand-400"
              : "w-1.5 bg-white/20"
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
        <div className="flex items-center gap-2 mb-1 text-[11px] uppercase tracking-[0.18em] text-slate-400">
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
        <div className="flex items-center gap-2 mb-1 text-[11px] uppercase tracking-[0.18em] text-white/70 justify-end">
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
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-white/80">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/70" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
            </span>
            Playing TTS…
          </div>
        )}
      </ChatBubble>

      {/* Beat 3: AI assist (simplify) */}
      <ChatBubble visible={beat >= 2} side="left" delay={0.05} highlighted={beat === 2}>
        <div className="flex items-center gap-2 mb-1 text-[11px] uppercase tracking-[0.18em] text-brand-200">
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
        <div className="flex items-center gap-2 mb-1 text-[11px] uppercase tracking-[0.18em] text-slate-400">
          <Waveform />
          Speech to caption
        </div>
        <p className="text-slate-200">
          Hey — would you like me to walk you through HearMeAI?
        </p>
      </ChatBubble>
      <ChatBubble visible side="right">
        <div className="flex items-center gap-2 mb-1 text-[11px] uppercase tracking-[0.18em] text-white/70 justify-end">
          Text to voice
          <Volume2 className="w-3 h-3" aria-hidden />
        </div>
        <p className="text-white">Yes, please. Speak this out loud for me.</p>
      </ChatBubble>
      <ChatBubble visible side="left">
        <div className="flex items-center gap-2 mb-1 text-[11px] uppercase tracking-[0.18em] text-brand-200">
          <Sparkles className="w-3 h-3" aria-hidden />
          AI Assist · Simplify
        </div>
        <p className="text-slate-200">
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
            ? "rounded-tr-md bg-brand-500/95 text-white border-transparent shadow-md shadow-brand-500/20"
            : `rounded-tl-md glass border-white/10 text-slate-200 ${
                highlighted ? "ring-2 ring-brand-400/60" : ""
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
          className="w-[2px] bg-brand-300 rounded-full animate-waveform"
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
    <p className={tone === "user" ? "text-white" : "text-slate-200"}>
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
      className="text-slate-200"
    >
      {showShort ? shortText : longText}
    </motion.p>
  );
}

function DockBar({ beat, animate }: { beat: number; animate: boolean }) {
  const isListening = animate && beat === 0;
  const isTyping = animate && beat === 1;

  return (
    <div className="m-4 mt-0 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-white/10 p-3 flex items-center gap-3">
      <button
        type="button"
        className={`w-12 h-12 rounded-full grid place-items-center transition-colors ${
          isListening
            ? "bg-brand-500 text-white shadow-lg shadow-brand-500/40"
            : "bg-slate-800 text-slate-400"
        }`}
        aria-label="Microphone"
        tabIndex={-1}
      >
        <Mic className="w-5 h-5" aria-hidden />
        {isListening && (
          <span
            className="absolute w-12 h-12 rounded-full border border-brand-300 animate-ping"
            aria-hidden
          />
        )}
      </button>

      <div className="flex-1 bg-slate-950/60 rounded-xl px-4 py-3 text-slate-400 font-sans text-sm min-h-[44px] flex items-center">
        {isTyping ? (
          <span className="text-slate-200">
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
            ? "bg-brand-500 text-white shadow-lg shadow-brand-500/40 scale-105"
            : "bg-brand-500/60 text-white/80"
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
    <aside className="hidden lg:flex lg:col-span-4 flex-col border-l border-white/5 bg-slate-950/60 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
          Live Caption
        </h3>
        <span
          className={`flex items-center gap-1.5 text-[11px] ${
            animate && beat === 0 ? "text-neon-blue" : "text-slate-500"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              animate && beat === 0 ? "bg-neon-blue animate-pulse" : "bg-slate-600"
            }`}
          />
          {animate && beat === 0 ? "Listening" : "Idle"}
        </span>
      </div>

      <div className="flex-1 rounded-2xl border border-white/5 bg-slate-900/40 p-4 text-sm leading-relaxed text-slate-200">
        {animate && beat === 0 ? (
          <Typewriter
            text="Hey — would you like me to walk you through HearMeAI?"
            activeKey={`side-${beat}`}
            run
          />
        ) : (
          <span className="text-slate-500">
            Captions appear here in real time when the mic is active.
          </span>
        )}
      </div>

      <div className="mt-4 rounded-2xl border border-white/5 bg-slate-900/40 p-4">
        <h4 className="text-[11px] uppercase tracking-[0.2em] text-slate-400 mb-2">
          Hologram Signer
        </h4>
        <div className="aspect-video rounded-xl bg-gradient-to-br from-brand-500/20 via-accent/10 to-neon-blue/10 grid place-items-center text-slate-300 text-xs">
          Visual sign preview
        </div>
      </div>
    </aside>
  );
}

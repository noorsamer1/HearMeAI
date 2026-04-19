"use client";

import { motion } from "framer-motion";
import { ArrowRight, Captions, Hand, Mic, Play, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSafeReducedMotion } from "@/lib/hooks/useSafeReducedMotion";

const DEMO_VIDEO_SRC = process.env.NEXT_PUBLIC_DEMO_VIDEO_URL ?? "";

export default function HeroSection() {
  const reduceMotion = useSafeReducedMotion();
  const [isVideoOpen, setVideoOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isVideoOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setVideoOpen(false);
    };
    document.addEventListener("keydown", onKey);
    closeButtonRef.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isVideoOpen]);

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
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* Left column: copy + CTAs */}
          <div className="lg:col-span-6 text-center lg:text-left">
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
              className="mt-6 text-lg md:text-xl text-slate-400 max-w-xl lg:max-w-lg mx-auto lg:mx-0 leading-relaxed"
            >
              HearMeAI turns speech into captions, text into voice, and ideas into
              signs — in real time, in two languages, for everyone.
            </motion.p>

            <motion.div
              {...fadeUp}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="mt-10 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start"
            >
              <button
                type="button"
                onClick={() => setVideoOpen(true)}
                className="group relative w-full sm:w-auto overflow-hidden rounded-full bg-slate-50 px-8 py-4 font-semibold text-slate-900 shadow-[0_0_40px_-10px_rgba(99,102,241,0.5)] transition-all hover:scale-[1.03] active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-400/60"
                aria-haspopup="dialog"
                aria-expanded={isVideoOpen}
                aria-controls="hero-video-dialog"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-brand-500 to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative flex items-center justify-center gap-2 group-hover:text-white transition-colors duration-300">
                  <Play className="w-5 h-5 fill-current" aria-hidden />
                  Watch Demo
                </span>
              </button>

              <a href="/app" className="w-full sm:w-auto">
                <button className="w-full px-8 py-4 rounded-full font-medium text-white glass border border-white/10 hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-400/60 flex items-center justify-center gap-2">
                  Try Live Demo
                  <ArrowRight className="w-4 h-4" aria-hidden />
                </button>
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

          {/* Right column: video frame */}
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="lg:col-span-6"
          >
            <HeroVideoFrame
              onPlay={() => setVideoOpen(true)}
              reduceMotion={!!reduceMotion}
            />
          </motion.div>
        </div>
      </div>

      {isVideoOpen && (
        <VideoDialog
          videoSrc={DEMO_VIDEO_SRC}
          onClose={() => setVideoOpen(false)}
          closeButtonRef={closeButtonRef}
        />
      )}
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
      {/* Floating accessibility glyphs */}
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

function HeroVideoFrame({
  onPlay,
  reduceMotion,
}: {
  onPlay: () => void;
  reduceMotion: boolean;
}) {
  return (
    <div className="relative">
      <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-brand-500/40 via-accent/30 to-neon-blue/30 blur-xl opacity-70" aria-hidden />

      <button
        type="button"
        onClick={onPlay}
        className="group relative block w-full aspect-video rounded-3xl overflow-hidden border border-white/10 glass shadow-[0_30px_80px_-30px_rgba(15,23,42,0.9)] focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-400/60"
        aria-label="Play 60-second HearMeAI demo video"
      >
        {/* Poster background — styled chat-room frame stand-in */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900" aria-hidden />
        <div className="absolute inset-0 opacity-70 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.25),transparent_55%),radial-gradient(circle_at_75%_80%,rgba(168,85,247,0.2),transparent_55%)]" aria-hidden />

        {/* Mock chat surface */}
        <div className="absolute inset-6 flex flex-col gap-3" aria-hidden>
          <div className="self-start max-w-[70%] glass border border-white/10 rounded-2xl rounded-tl-md px-4 py-3 text-sm text-slate-200">
            Hello! How can I help today?
          </div>
          <div className="self-end max-w-[60%] bg-brand-500/90 text-white rounded-2xl rounded-tr-md px-4 py-3 text-sm shadow-lg">
            I&apos;d love a quick walkthrough.
          </div>
          <div className="self-start max-w-[60%] glass border border-white/10 rounded-2xl rounded-tl-md px-4 py-3 text-xs text-slate-300 inline-flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
            Live captions on
          </div>
        </div>

        {/* Play button */}
        <div className="absolute inset-0 grid place-items-center">
          <span
            className={`relative grid place-items-center w-20 h-20 rounded-full bg-white text-slate-900 shadow-[0_0_60px_rgba(99,102,241,0.6)] transition-transform group-hover:scale-110`}
          >
            {!reduceMotion && (
              <>
                <span className="absolute inset-0 rounded-full border border-white/40 animate-ping" />
                <span className="absolute -inset-2 rounded-full border border-white/20 animate-ping [animation-delay:.6s]" />
              </>
            )}
            <Play className="w-8 h-8 fill-current translate-x-0.5" aria-hidden />
          </span>
        </div>

        {/* Top chrome */}
        <div className="absolute top-3 left-4 flex items-center gap-1.5" aria-hidden>
          <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
        </div>
      </button>

      <p className="mt-3 text-center text-xs text-slate-400">
        60-second demo · muted by default · captions on
      </p>
    </div>
  );
}

function VideoDialog({
  videoSrc,
  onClose,
  closeButtonRef,
}: {
  videoSrc: string;
  onClose: () => void;
  closeButtonRef: React.RefObject<HTMLButtonElement | null>;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="hero-video-title"
      id="hero-video-dialog"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
    >
      <div
        className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative w-full max-w-4xl">
        <div className="flex items-center justify-between mb-3">
          <h2
            id="hero-video-title"
            className="text-sm font-semibold text-slate-200"
          >
            HearMeAI · Demo
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center w-9 h-9 rounded-full glass border border-white/10 text-slate-200 hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-400/60"
            aria-label="Close demo video"
          >
            <X className="w-4 h-4" aria-hidden />
          </button>
        </div>
        <div className="aspect-video rounded-2xl overflow-hidden border border-white/10 bg-slate-950 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)]">
          {videoSrc ? (
            <video
              key={videoSrc}
              src={videoSrc}
              controls
              autoPlay
              playsInline
              className="w-full h-full"
              aria-label="HearMeAI 60-second demo"
            />
          ) : (
            <div className="w-full h-full grid place-items-center text-center px-6">
              <div className="max-w-md">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
                  Demo Video
                </p>
                <h3 className="mt-3 text-2xl font-semibold text-slate-100">
                  Coming soon
                </h3>
                <p className="mt-3 text-slate-400">
                  The recorded walkthrough is being produced. Set
                  <code className="mx-1 px-1.5 py-0.5 rounded bg-white/10 text-slate-200 text-xs">
                    NEXT_PUBLIC_DEMO_VIDEO_URL
                  </code>
                  in
                  <code className="mx-1 px-1.5 py-0.5 rounded bg-white/10 text-slate-200 text-xs">
                    .env.local
                  </code>
                  to enable playback. Meanwhile, you can{" "}
                  <a
                    href="/app"
                    className="underline decoration-dotted text-brand-200 hover:text-brand-100"
                  >
                    try the live demo
                  </a>
                  .
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

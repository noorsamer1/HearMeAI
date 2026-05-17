'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface MotionPose {
  label: string;
  durationMs: number;
  description?: string;
  emoji?: string;
}

export interface MotionPlan {
  poses: MotionPose[];
}

interface SignLanguageWidgetProps {
  phrase: string;
  motionPlan?: MotionPlan;
  className?: string;
  /** When this number changes, the sequence restarts from step 1. */
  replayNonce?: number;
  /** Multiply each pose duration (e.g. 1.55 for slower hologram preview). */
  stepDurationScale?: number;
  /** Framer Motion enter/exit duration in seconds. */
  transitionDurationSec?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// ASL emoji mapping for letters A–Z
// ─────────────────────────────────────────────────────────────────────────────

const ASL_LETTER_EMOJI: Record<string, string> = {
  A: '👊', B: '🖐', C: '🤏', D: '☝', E: '🤞', F: '👌', G: '👈', H: '👉',
  I: '🤙', J: '🤙', K: '✌', L: '🤟', M: '🤜', N: '🤛', O: '👌', P: '👇',
  Q: '👇', R: '🤞', S: '✊', T: '👍', U: '✌', V: '✌', W: '🤟', X: '☝',
  Y: '🤙', Z: '☝',
};

// ─────────────────────────────────────────────────────────────────────────────
// Common phrase emoji mapping
// ─────────────────────────────────────────────────────────────────────────────

const PHRASE_EMOJI: Record<string, string> = {
  hello:     '🤝',
  hi:        '🤝',
  thank_you: '🙏',
  'thank you': '🙏',
  yes:       '✅',
  no:        '❌',
  help:      '🆘',
  please:    '🙏',
  sorry:     '😔',
  good:      '👍',
  bad:       '👎',
  water:     '💧',
  food:      '🍽️',
  question:  '❓',
  wave:      '👋',
  'how are you': '🤔',
  'thank-you': '🙏',
};

// ─────────────────────────────────────────────────────────────────────────────
// SIGN_SEQUENCE_MAP – copied from SignPreview so both components share it
// ─────────────────────────────────────────────────────────────────────────────

const SIGN_SEQUENCE_MAP: Record<string, MotionPose[]> = {
  hello: [
    { label: 'Wave', durationMs: 800, description: 'Open hand, wave from wrist' },
    { label: 'Wave', durationMs: 800 },
    { label: 'Neutral', durationMs: 600 },
  ],
  'thank you': [
    { label: 'Thank You', durationMs: 1200, description: 'Flat hand from chin outward' },
    { label: 'Neutral', durationMs: 600 },
  ],
  'how are you': [
    { label: 'How', durationMs: 900, description: 'Bent hands rotate outward' },
    { label: 'Are', durationMs: 700 },
    { label: 'You', durationMs: 700, description: 'Point index finger outward' },
    { label: 'Neutral', durationMs: 600 },
  ],
  yes: [
    { label: 'Yes', durationMs: 1000, description: 'Fist nods up and down' },
    { label: 'Neutral', durationMs: 600 },
  ],
  no: [
    { label: 'No', durationMs: 1000, description: 'Index & middle fingers tap thumb' },
    { label: 'Neutral', durationMs: 600 },
  ],
  please: [
    { label: 'Please', durationMs: 1100, description: 'Flat hand circles chest' },
    { label: 'Neutral', durationMs: 600 },
  ],
  help: [
    { label: 'Help', durationMs: 1200, description: 'Thumbs-up on flat palm lifts up' },
    { label: 'Neutral', durationMs: 600 },
  ],
  question: [
    { label: 'Question', durationMs: 1200, description: 'Index finger draws question mark' },
    { label: 'Neutral', durationMs: 600 },
  ],
  sorry: [
    { label: 'Sorry', durationMs: 1200, description: 'Fist circles chest' },
    { label: 'Neutral', durationMs: 600 },
  ],
  good: [
    { label: 'Good', durationMs: 1000, description: 'Flat hand from chin forward' },
    { label: 'Neutral', durationMs: 600 },
  ],
  bad: [
    { label: 'Bad', durationMs: 1000, description: 'Flat hand flips down from chin' },
    { label: 'Neutral', durationMs: 600 },
  ],
  water: [
    { label: 'Water', durationMs: 1000, description: 'W shape taps chin twice' },
    { label: 'Neutral', durationMs: 600 },
  ],
  food: [
    { label: 'Food/Eat', durationMs: 1000, description: 'Fingers pinched to mouth' },
    { label: 'Neutral', durationMs: 600 },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getPoseEmoji(label: string): string {
  const key = label.toLowerCase().replace(/-/g, ' ');
  if (label === '·') return '␣';
  if (label === '✓') return '✔️';
  if (PHRASE_EMOJI[key]) return PHRASE_EMOJI[key];
  const upper = label.toUpperCase();
  if (upper.length === 1 && ASL_LETTER_EMOJI[upper]) return ASL_LETTER_EMOJI[upper];
  if (/^[0-9]$/.test(label)) {
    const digits = ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];
    return digits[parseInt(label, 10)] ?? '🔢';
  }
  return '🤲';
}

function buildPosesFromPhrase(phraseRaw: string): MotionPose[] {
  const key = phraseRaw.trim().toLowerCase();

  // Direct map hit
  if (SIGN_SEQUENCE_MAP[key]) return SIGN_SEQUENCE_MAP[key];

  // Spell out letter by letter
  const letters = phraseRaw.toUpperCase().replace(/\s/g, '').split('');
  if (letters.length === 0) {
    return [{ label: 'Neutral', durationMs: 800 }];
  }
  return letters.map((ch) => ({
    label: ch,
    durationMs: 600,
    description: `Letter ${ch}`,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function SignLanguageWidget({
  phrase,
  motionPlan,
  className = '',
  replayNonce = 0,
  stepDurationScale = 1,
  transitionDurationSec = 0.22,
}: SignLanguageWidgetProps) {
  const poses: MotionPose[] = motionPlan?.poses?.length
    ? motionPlan.poses
    : buildPosesFromPhrase(phrase);

  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  const current = poses[Math.min(index, poses.length - 1)];
  const maxStepMs = stepDurationScale > 1 ? 4200 : 3000;
  const scaledMs = Math.round((current?.durationMs ?? 800) * stepDurationScale);
  const duration = Math.max(400, Math.min(scaledMs, maxStepMs));

  // Reset when phrase / plan / replay changes
  useEffect(() => {
    setIndex(0);
    setProgress(0);
    startTimeRef.current = Date.now();
  }, [phrase, motionPlan, replayNonce]);

  // Progress bar animation
  useEffect(() => {
    startTimeRef.current = Date.now();
    setProgress(0);

    const tick = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min(elapsed / duration, 1);
      setProgress(pct);
      if (pct < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [index, duration, phrase, motionPlan, replayNonce]);

  // Auto-advance
  useEffect(() => {
    if (index >= poses.length - 1) return;

    timerRef.current = setTimeout(() => {
      setIndex((prev) => Math.min(prev + 1, poses.length - 1));
    }, duration);

    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, [index, duration, poses.length, phrase, motionPlan, replayNonce]);

  if (!poses.length) return null;

  return (
    <div
      className={`relative flex flex-col items-center justify-center select-none ${className}`}
      aria-label={`Sign language display for: ${phrase}`}
      role="region"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={`${phrase}-${index}`}
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.92 }}
          transition={{ duration: transitionDurationSec, ease: 'easeOut' }}
          className="w-full flex flex-col items-center"
        >
          {/* Card */}
          <div
            className="relative w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] shadow-[var(--shadow-card)] px-4 py-5 flex flex-col items-center gap-3 overflow-hidden"
            style={{ minHeight: 140 }}
          >
            {/* Subtle glow ring behind emoji */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse at 50% 40%, rgba(6,182,212,0.08) 0%, transparent 65%)',
              }}
            />

            {/* Emoji / Hand sign */}
            <span
              className="text-5xl leading-none z-10"
              role="img"
              aria-label={current.label}
            >
              {current.emoji ?? getPoseEmoji(current.label)}
            </span>

            {/* Label */}
            <p className="z-10 text-sm font-semibold text-[var(--color-text-primary)] tracking-wide text-center">
              {current.label}
            </p>

            {/* Description */}
            {current.description && (
              <p className="z-10 text-xs text-[var(--color-text-muted)] text-center leading-relaxed max-w-[180px]">
                {current.description}
              </p>
            )}

            {/* Step counter */}
            <p className="z-10 text-[11px] text-[var(--color-text-muted)] tabular-nums">
              {index + 1} / {poses.length}
            </p>
          </div>

          {/* Progress bar */}
          <div className="mt-2 w-full h-1 rounded-full bg-[var(--color-border)] overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-[var(--color-brand-500)]"
              style={{ width: `${progress * 100}%` }}
              transition={{ duration: 0 }}
            />
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Dot navigation */}
      {poses.length > 1 && (
        <div className="mt-2 flex items-center gap-1.5">
          {poses.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to pose ${i + 1}`}
              onClick={() => {
                setIndex(i);
                setProgress(0);
                startTimeRef.current = Date.now();
              }}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                i === index
                  ? 'w-4 bg-[var(--color-brand-500)]'
                  : 'w-1.5 bg-[var(--color-border-strong)]'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

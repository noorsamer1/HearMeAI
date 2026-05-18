/**
 * Shared sign vocabulary: phrase detection, ASL/ArSL letter gestures, phrase signs.
 */

import type { SpellStep } from "@/lib/sign/types";

/** ASL finger-spelling (matches Sign keyboard A–Z tab). */
export const ASL_LETTER_EMOJI: Record<string, string> = {
  A: "👊",
  B: "🖐",
  C: "🤏",
  D: "☝",
  E: "🤞",
  F: "👌",
  G: "👈",
  H: "👉",
  I: "🤙",
  J: "🤙",
  K: "✌",
  L: "🤟",
  M: "🤜",
  N: "🤛",
  O: "👌",
  P: "👇",
  Q: "👇",
  R: "🤞",
  S: "✊",
  T: "👍",
  U: "✌",
  V: "✌",
  W: "🤟",
  X: "☝",
  Y: "🤙",
  Z: "☝",
};

export const ASL_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

/**
 * Arabic keyboard: one emoji + tooltip per letter (manual UX map).
 * Design ref: AI-Media ArSL fingerspelling chart (see docs/SIGN_KEYBOARD_EMOJI_MAPPING.md §2.4).
 * Not imported from KArSL/ArabSign video datasets.
 */
export const ARSL_LETTER_MAP: Record<string, { emoji: string; description: string }> = {
  ا: { emoji: "☝️", description: "Index up" },
  ب: { emoji: "🖐", description: "Palm flat" },
  ت: { emoji: "✌", description: "Two fingers" },
  ث: { emoji: "🤟", description: "Three open" },
  ج: { emoji: "🤞", description: "Cross fingers" },
  ح: { emoji: "🖖", description: "Split V" },
  خ: { emoji: "👋", description: "Wave out" },
  د: { emoji: "👆", description: "Point up" },
  ذ: { emoji: "👇", description: "Point down" },
  ر: { emoji: "👉", description: "Point right" },
  ز: { emoji: "👈", description: "Point left" },
  س: { emoji: "✊", description: "Closed fist" },
  ش: { emoji: "🤜", description: "Right fist" },
  ص: { emoji: "🤛", description: "Left fist" },
  ض: { emoji: "🤙", description: "Hang loose" },
  ط: { emoji: "👌", description: "OK shape" },
  ظ: { emoji: "🤚", description: "Stop palm" },
  ع: { emoji: "🤲", description: "Open palms" },
  غ: { emoji: "🙌", description: "Raised hands" },
  ف: { emoji: "🤏", description: "Pinch" },
  ق: { emoji: "👊", description: "Fist tap" },
  ك: { emoji: "🤚", description: "Flat stop" },
  ل: { emoji: "🤟", description: "Love hand" },
  م: { emoji: "👍", description: "Thumb up" },
  ن: { emoji: "👎", description: "Thumb down" },
  ه: { emoji: "🖐", description: "Five spread" },
  و: { emoji: "🤞", description: "Cross hope" },
  ي: { emoji: "🤙", description: "Shaka" },
};

const LETTER_MS = 560;
const PAUSE_MS = 380;
const WORD_BREAK_MS = 720;

function normalizeSignText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Resolve keyboard ArSL entry (handles hamza / alef variants). */
export function lookupArslLetter(ch: string): { emoji: string; description: string; letter: string } | null {
  if (ch === "\u0640") return null;
  const cp = ch.codePointAt(0) ?? 0;
  if (cp >= 0x064b && cp <= 0x065f) return null;
  if (cp >= 0x0670 && cp <= 0x0674) return null;

  const direct = ARSL_LETTER_MAP[ch];
  if (direct) return { ...direct, letter: ch };

  if (/[\u0622\u0623\u0625\u0671]/.test(ch)) {
    const base = ARSL_LETTER_MAP["ا"];
    return base ? { ...base, letter: "ا" } : null;
  }
  if (ch === "ى") {
    const base = ARSL_LETTER_MAP["ي"];
    return base ? { ...base, letter: "ي" } : null;
  }
  if (ch === "ة") {
    const base = ARSL_LETTER_MAP["ه"];
    return base ? { ...base, letter: "ه" } : null;
  }

  return null;
}

function isSpellableArabicChar(ch: string): boolean {
  return lookupArslLetter(ch) !== null;
}

/** True when text is mostly Arabic letters (use ArSL gestures, not Latin fingerspell). */
export function isPrimarilyArabic(text: string): boolean {
  let arabic = 0;
  let latin = 0;
  for (const ch of text) {
    if (isSpellableArabicChar(ch)) arabic += 1;
    else if (/[a-zA-Z]/.test(ch)) latin += 1;
  }
  return arabic > 0 && arabic >= latin;
}

/**
 * Map natural text to a known sign phrase (hello, thank you, …).
 * English / Latin phrases only (Arabic text uses keyboard ArSL via buildArslSpellPlan).
 */
export function inferSignPhraseKey(value: string): string | null {
  if (isPrimarilyArabic(value)) return null;
  const text = normalizeSignText(value);
  if (!text) return null;

  const patterns: Array<{ phrase: string; variants: string[] }> = [
    {
      phrase: "hello",
      variants: ["hello", "hi", "hey", "مرحبا", "مرحبًا", "اهلا", "أهلا", "السلام عليكم"],
    },
    { phrase: "thank you", variants: ["thank you", "thanks", "شكرا", "شكرًا", "شكراً"] },
    { phrase: "how are you", variants: ["how are you", "how r you", "كيف حالك", "كيف حالكم"] },
    { phrase: "help", variants: ["help", "ساعدني", "مساعدة"] },
    { phrase: "yes", variants: ["yes", "نعم", "ايوه", "أيوه"] },
    { phrase: "no", variants: ["no", "لا"] },
    { phrase: "please", variants: ["please", "من فضلك", "لو سمحت"] },
    { phrase: "sorry", variants: ["sorry", "آسف", "اسف"] },
    { phrase: "good", variants: ["good", "جيد"] },
    { phrase: "bad", variants: ["bad", "سيء"] },
    { phrase: "water", variants: ["water", "ماء"] },
    { phrase: "food", variants: ["food", "طعام"] },
    { phrase: "question", variants: ["question", "سؤال"] },
  ];

  for (const { phrase, variants } of patterns) {
    for (const variant of variants) {
      const normalizedVariant = normalizeSignText(variant);
      if (!normalizedVariant) continue;
      if (text === normalizedVariant) return phrase;
      const escaped = normalizedVariant.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pattern = new RegExp(`(^|\\s)${escaped}(\\s|$)`, "u");
      if (pattern.test(text)) return phrase;
    }
  }

  return null;
}

/** ArSL finger-spelling with hand-shape emoji per letter (not plain text glyphs). */
export function buildArslSpellPlan(
  text: string,
  showSpacesBetweenLetters: boolean
): SpellStep[] {
  const raw = text.trim();
  if (!raw) {
    return [{ label: "Neutral", durationMs: 600, description: "No text", emoji: "🤲" }];
  }

  const words = raw.split(/\s+/).filter(Boolean);
  const steps: SpellStep[] = [];

  for (const word of words) {
    let letterIndexInWord = 0;
    for (const ch of word) {
      const arsl = lookupArslLetter(ch);
      if (!arsl) continue;

      if (showSpacesBetweenLetters && letterIndexInWord > 0) {
        steps.push({
          label: "·",
          durationMs: PAUSE_MS,
          description: "Pause",
          emoji: "␣",
        });
      }
      steps.push({
        label: arsl.letter,
        durationMs: LETTER_MS,
        description: arsl.description,
        emoji: arsl.emoji,
      });
      letterIndexInWord += 1;
    }

    if (letterIndexInWord > 0) {
      steps.push({
        label: "✓",
        durationMs: WORD_BREAK_MS,
        description: "Word complete",
        emoji: "✔️",
      });
    }
  }

  if (!steps.length) {
    return [{ label: "Neutral", durationMs: 600, description: "Unsupported characters", emoji: "🤲" }];
  }

  return steps;
}

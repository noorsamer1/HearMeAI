/**
 * Phrase-specific sign language GIFs in `/public/gifs/`.
 * Filenames match the signed phrase; variants map user text to the closest GIF.
 */

export interface PhraseSignGifMeta {
  /** Canonical phrase key (matches sign keyboard / inferSignPhraseKey). */
  phraseKey: string;
  /** Exact file name under `frontend/public/gifs/` (may include spaces). */
  fileName: string;
  labelEn: string;
  labelAr: string;
  fallbackEmoji: string;
  /** Text variants that resolve to this GIF (normalized matching). */
  variants: string[];
}

function normalizeSignText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Dedicated phrase clips (filename = signed phrase). */
const DEDICATED_PHRASE_GIFS: PhraseSignGifMeta[] = [
  {
    phraseKey: "hello",
    fileName: "hello.gif",
    labelEn: "Hello",
    labelAr: "مرحبا",
    fallbackEmoji: "👋",
    variants: ["hello", "hi", "hey", "good day", "greetings"],
  },
  {
    phraseKey: "how are you",
    fileName: "how are you.gif",
    labelEn: "How are you",
    labelAr: "كيف حالك",
    fallbackEmoji: "🤔",
    variants: [
      "how are you",
      "how r you",
      "how are u",
      "how re you",
      "how is you",
      "كيف حالك",
      "كيف حالكم",
    ],
  },
  {
    phraseKey: "good morning",
    fileName: "good morning.gif",
    labelEn: "Good morning",
    labelAr: "صباح الخير",
    fallbackEmoji: "🌅",
    variants: ["good morning", "morning", "gm", "صباح الخير"],
  },
  {
    phraseKey: "what's up",
    fileName: "what's up.gif",
    labelEn: "What's up",
    labelAr: "ما الأخبار",
    fallbackEmoji: "✌",
    variants: ["what s up", "whats up", "what is up", "wassup", "sup", "what up"],
  },
  {
    phraseKey: "excuse me",
    fileName: "excuse me.gif",
    labelEn: "Excuse me",
    labelAr: "عفواً",
    fallbackEmoji: "🙋",
    variants: ["excuse me", "pardon", "pardon me", "عفوا", "عفواً"],
  },
  {
    phraseKey: "please repeat",
    fileName: "please repeat.gif",
    labelEn: "Please repeat",
    labelAr: "كرر من فضلك",
    fallbackEmoji: "🔁",
    variants: [
      "please repeat",
      "repeat please",
      "say again",
      "can you repeat",
      "repeat that",
      "again please",
      "one more time",
    ],
  },
  {
    phraseKey: "i don't understand",
    fileName: "I Dont Understand.gif",
    labelEn: "I don't understand",
    labelAr: "لا أفهم",
    fallbackEmoji: "😕",
    variants: [
      "i don t understand",
      "i dont understand",
      "don t understand",
      "do not understand",
      "not understand",
      "don t get it",
      "do not get it",
      "لا افهم",
      "لا أفهم",
    ],
  },
  {
    phraseKey: "is it far",
    fileName: "is it far.gif",
    labelEn: "Is it far",
    labelAr: "هل هو بعيد",
    fallbackEmoji: "📍",
    variants: [
      "is it far",
      "how far",
      "far away",
      "is it far away",
      "is that far",
      "distance",
    ],
  },
  {
    phraseKey: "i enjoy this",
    fileName: "i enjoy this.gif",
    labelEn: "I enjoy this",
    labelAr: "أستمتع بهذا",
    fallbackEmoji: "😊",
    variants: [
      "i enjoy this",
      "i like this",
      "enjoying this",
      "love this",
      "this is fun",
      "having fun",
    ],
  },
  {
    phraseKey: "maybe",
    fileName: "maybe.gif",
    labelEn: "Maybe",
    labelAr: "ربما",
    fallbackEmoji: "🤷",
    variants: ["maybe", "perhaps", "possibly", "not sure", "i think so", "ربما"],
  },
];

/** Mood GIFs reused as closest match for common keyboard phrases. */
const KEYBOARD_PHRASE_GIF_ALIASES: PhraseSignGifMeta[] = [
  {
    phraseKey: "help",
    fileName: "help.gif",
    labelEn: "Help",
    labelAr: "مساعدة",
    fallbackEmoji: "🆘",
    variants: ["help", "ساعدني", "مساعدة", "need help"],
  },
  {
    phraseKey: "question",
    fileName: "question.gif",
    labelEn: "Question",
    labelAr: "سؤال",
    fallbackEmoji: "❓",
    variants: ["question", "سؤال", "what", "why", "when", "where", "who"],
  },
  {
    phraseKey: "goodbye",
    fileName: "goodbye.gif",
    labelEn: "Goodbye",
    labelAr: "وداعاً",
    fallbackEmoji: "👋",
    variants: ["goodbye", "bye", "see you", "see ya", "مع السلامة", "وداعا"],
  },
];

export const PHRASE_SIGN_GIFS: PhraseSignGifMeta[] = [
  ...DEDICATED_PHRASE_GIFS,
  ...KEYBOARD_PHRASE_GIF_ALIASES,
];

const BY_PHRASE_KEY = Object.fromEntries(
  PHRASE_SIGN_GIFS.map((entry) => [normalizeSignText(entry.phraseKey), entry])
) as Record<string, PhraseSignGifMeta>;

/** Sorted longest-variant-first so "how are you" wins over "how". */
const VARIANT_MATCHERS = PHRASE_SIGN_GIFS.flatMap((entry) =>
  entry.variants.map((variant) => ({
    entry,
    normalized: normalizeSignText(variant),
  }))
)
  .filter((row) => row.normalized.length > 0)
  .sort((a, b) => b.normalized.length - a.normalized.length);

export function phraseSignGifSrc(fileName: string): string {
  return `/gifs/${encodeURIComponent(fileName)}`;
}

export function getPhraseSignGifByPhraseKey(
  phraseKey: string
): PhraseSignGifMeta | null {
  const key = normalizeSignText(phraseKey);
  return BY_PHRASE_KEY[key] ?? null;
}

/** Match natural text or a keyboard phrase key to a phrase sign GIF. */
export function matchPhraseSignGif(text: string): PhraseSignGifMeta | null {
  const normalized = normalizeSignText(text);
  if (!normalized) return null;

  const direct = BY_PHRASE_KEY[normalized];
  if (direct) return direct;

  for (const { entry, normalized: variant } of VARIANT_MATCHERS) {
    if (normalized === variant) return entry;
    const escaped = variant.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`(^|\\s)${escaped}(\\s|$)`, "u");
    if (pattern.test(normalized)) return entry;
  }

  return null;
}

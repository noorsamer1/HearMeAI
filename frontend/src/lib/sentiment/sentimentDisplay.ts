/** Minimum confidence before showing a sentiment emoji on a message. */
export const SENTIMENT_CONFIDENCE_THRESHOLD = 0.62;

/** Confidence attached when the sender picks a mood emoji before send. */
export const MANUAL_MOOD_CONFIDENCE = 0.95;

/** Mood-only options (no general emoji keyboard). */
export const MANUAL_MOOD_OPTIONS = [
  { id: "neutral", emoji: "😐" },
  { id: "happy", emoji: "😊" },
  { id: "angry", emoji: "😠" },
  { id: "sad", emoji: "😢" },
  { id: "anxious", emoji: "😟" },
] as const;

export type ManualMoodId = (typeof MANUAL_MOOD_OPTIONS)[number]["id"];

export type SentimentLabel =
  | "positive"
  | "neutral"
  | "negative"
  | "angry"
  | "sad"
  | string;

/**
 * Map backend emotion labels to display emojis (confidence-gated in UI).
 */
export function sentimentEmoji(
  label: string | null | undefined,
  confidence: number | null | undefined
): string | null {
  if (!label) return null;
  const score = confidence ?? 0;
  if (score < SENTIMENT_CONFIDENCE_THRESHOLD) return null;

  const key = label.toLowerCase().trim();
  const map: Record<string, string> = {
    positive: "😊",
    happy: "😊",
    joy: "😊",
    neutral: "😐",
    negative: "😟",
    angry: "😠",
    anger: "😠",
    sad: "😢",
    sadness: "😢",
    anxious: "😟",
    anxiety: "😟",
    fear: "😟",
    disgust: "😟",
    surprise: "😊",
  };
  return map[key] ?? null;
}

const MOOD_DISPLAY: Record<string, string> = {
  positive: "happy",
  happy: "happy",
  sad: "sad",
  angry: "angry",
  anxious: "anxious",
  neutral: "neutral",
};

/** Human-readable mood label for UI hints (English key; i18n wraps separately). */
export function formatEmotionLabel(label: string | null | undefined): string {
  if (!label) return "neutral";
  const key = label.toLowerCase().trim();
  return MOOD_DISPLAY[key] ?? key;
}

export type SentimentSource = "expression" | "text" | "expression_and_text" | string;

type PeerMoodTranslations = {
  peerMayFeelFrustrated: string;
  peerMayFeelSad: string;
  peerMayFeelAnxious: string;
  peerMayFeelHappy: string;
  peerMayFeelNeutral: string;
  peerSourceExpression: string;
  peerSourceText: string;
  peerSourceExpressionAndText: string;
  peerSourceManual: string;
};

/**
 * Subtitle shown under a peer's message when fused mood meets the confidence gate.
 */
export function peerMoodHint(
  label: string | null | undefined,
  confidence: number | null | undefined,
  source: SentimentSource | null | undefined,
  t: PeerMoodTranslations
): string | null {
  if (!sentimentEmoji(label, confidence)) return null;

  const moodKey = formatEmotionLabel(label);
  const moodLine =
    moodKey === "happy"
      ? t.peerMayFeelHappy
      : moodKey === "sad"
        ? t.peerMayFeelSad
        : moodKey === "angry"
          ? t.peerMayFeelFrustrated
          : moodKey === "anxious"
            ? t.peerMayFeelAnxious
            : t.peerMayFeelNeutral;

  const src = (source || "text").toLowerCase();
  const sourceLine =
    src === "manual"
      ? t.peerSourceManual
      : src === "expression"
        ? t.peerSourceExpression
        : src === "expression_and_text"
          ? t.peerSourceExpressionAndText
          : t.peerSourceText;

  return `${moodLine} (${sourceLine})`;
}

type SelfMoodTranslations = {
  selfMayFeelFrustrated: string;
  selfMayFeelSad: string;
  selfMayFeelAnxious: string;
  selfMayFeelHappy: string;
  selfMayFeelNeutral: string;
  peerSourceExpression: string;
  peerSourceText: string;
  peerSourceExpressionAndText: string;
  peerSourceManual: string;
};

/**
 * Subtitle under your own message when fused mood meets the confidence gate.
 */
export function selfMoodHint(
  label: string | null | undefined,
  confidence: number | null | undefined,
  source: SentimentSource | null | undefined,
  t: SelfMoodTranslations
): string | null {
  if (!sentimentEmoji(label, confidence)) return null;

  const moodKey = formatEmotionLabel(label);
  const moodLine =
    moodKey === "happy"
      ? t.selfMayFeelHappy
      : moodKey === "sad"
        ? t.selfMayFeelSad
        : moodKey === "angry"
          ? t.selfMayFeelFrustrated
          : moodKey === "anxious"
            ? t.selfMayFeelAnxious
            : t.selfMayFeelNeutral;

  const src = (source || "text").toLowerCase();
  const sourceLine =
    src === "manual"
      ? t.peerSourceManual
      : src === "expression"
        ? t.peerSourceExpression
        : src === "expression_and_text"
          ? t.peerSourceExpressionAndText
          : t.peerSourceText;

  return `${moodLine} (${sourceLine})`;
}

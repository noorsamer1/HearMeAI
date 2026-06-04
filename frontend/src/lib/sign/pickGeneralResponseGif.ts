import type { SystemStatus } from "@/lib/state/sessionStore";
import type { GeneralResponseGifId } from "@/lib/sign/generalResponseGifs";

interface PickGeneralResponseGifOptions {
  emotionLabel?: string | null;
  systemStatus?: SystemStatus;
  isStreaming?: boolean;
}

/**
 * Choose one of the 9 general-response GIFs from message text and mood hints.
 * Neutral / default replies use `idle` (no separate neutral.gif).
 */
export function pickGeneralResponseGif(
  text: string,
  opts: PickGeneralResponseGifOptions = {}
): GeneralResponseGifId {
  if (opts.isStreaming || opts.systemStatus === "processing") {
    return "thinking";
  }

  const emotion = (opts.emotionLabel ?? "").toLowerCase().trim();
  if (emotion) {
    if (["happy", "positive", "joy", "surprise"].includes(emotion)) {
      return "happy";
    }
    if (["sad", "sadness"].includes(emotion)) {
      return "empathetic";
    }
    if (["angry", "anger"].includes(emotion)) {
      return "confused";
    }
    if (["anxious", "anxiety", "fear", "negative", "disgust"].includes(emotion)) {
      return "empathetic";
    }
    if (emotion === "neutral") {
      return "idle";
    }
  }

  const lower = text.toLowerCase();

  if (/\b(bye|goodbye|see you|farewell|later|مع السلامة|وداعا|وداعاً)\b/u.test(lower)) {
    return "goodbye";
  }
  if (/\b(help|sos|emergency|urgent|assist|مساعدة|ساعد)\b/u.test(lower)) {
    return "help";
  }
  if (/\?|^(what|why|how|when|where|who|which|can you|could you)\b/u.test(lower.trim())) {
    return "question";
  }
  if (/\b(sorry|apolog|regret|آسف|اسف|عذر)\b/u.test(lower)) {
    return "empathetic";
  }
  if (/\b(thank|thanks|grateful|شكر)\b/u.test(lower)) {
    return "happy";
  }
  if (/\b(great|awesome|congrat|well done|bravo|excellent|ممتاز|رائع)\b/u.test(lower)) {
    return "encourage";
  }
  if (/\b(confus|unclear|don't understand|do not understand|not sure|what do you mean)\b/u.test(lower)) {
    return "confused";
  }
  if (/\b(hello|hi|hey|welcome|مرحب|اهلا|أهلا)\b/u.test(lower)) {
    return "idle";
  }

  return "idle";
}

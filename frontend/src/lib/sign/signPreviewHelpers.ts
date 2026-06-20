import type { UserType } from "@/lib/state/sessionStore";
import { useSessionStore } from "@/lib/state/sessionStore";
import { buildSpellPlan } from "@/lib/sign/spellingPlan";
import {
  getPhraseSignGifByPhraseKey,
  matchPhraseSignGif,
} from "@/lib/sign/phraseSignGifs";
import {
  buildArslSpellPlan,
  inferSignPhraseKey,
  isPrimarilyArabic,
} from "@/lib/sign/vocabulary";

/**
 * Whether a user profile communicates through sign language and should see the
 * sign GIF preview + sign keyboard. Deaf and "both" rely on it to read speech;
 * mute users use it as a signing input/confirmation channel.
 */
export function usesSignLanguage(userType: UserType | null | undefined): boolean {
  return userType === "deaf" || userType === "both" || userType === "mute";
}

function applyPhraseGifPreview(meta: {
  phraseKey: string;
  fileName: string;
}): void {
  useSessionStore.getState().setSignPreview({
    phraseKey: meta.phraseKey,
    spellPlan: undefined,
    spellSourceText: undefined,
    motionPlan: undefined,
    previewMode: "phrase-gif",
    phraseGifFile: meta.fileName,
  });
}

/** Finger-spell Latin text with ASL letter gestures (deaf / both). */
export function applySpellPreviewForDeaf(
  text: string,
  extras?: { assetUrl?: string }
): void {
  const showSp = useSessionStore.getState().signShowSpacesBetweenLetters;
  const spellPlan = buildSpellPlan(text, showSp);
  useSessionStore.getState().setSignPreview({
    phraseKey: text.slice(0, 140),
    spellSourceText: text,
    spellPlan,
    motionPlan: undefined,
    previewMode: "sign",
    ...extras,
  });
}

/** ArSL finger-spelling with hand-shape emoji per letter. */
export function applyArslPreview(text: string, extras?: { assetUrl?: string }): void {
  const showSp = useSessionStore.getState().signShowSpacesBetweenLetters;
  const spellPlan = buildArslSpellPlan(text, showSp);
  useSessionStore.getState().setSignPreview({
    phraseKey: text.slice(0, 140),
    spellSourceText: text,
    spellPlan,
    motionPlan: undefined,
    previewMode: "sign",
    ...extras,
  });
}

/**
 * 2D sign preview for user text, transcripts, keyboard, and peer messages.
 * Finger-spells general English; known phrases and Arabic use existing paths.
 */
export function applySignPreviewFromText(
  text: string,
  userType: UserType | null | undefined
): void {
  const trimmed = text.trim();
  if (!trimmed) return;

  if (isPrimarilyArabic(trimmed)) {
    applyArslPreview(trimmed);
    return;
  }

  const phraseGif = matchPhraseSignGif(trimmed);
  if (phraseGif) {
    applyPhraseGifPreview(phraseGif);
    return;
  }

  const phraseKey = inferSignPhraseKey(trimmed);
  if (phraseKey) {
    const phraseGifFromKey = getPhraseSignGifByPhraseKey(phraseKey);
    if (phraseGifFromKey) {
      applyPhraseGifPreview(phraseGifFromKey);
      return;
    }
    useSessionStore.getState().setSignPreview({
      phraseKey,
      spellPlan: undefined,
      spellSourceText: undefined,
      motionPlan: undefined,
      previewMode: "sign",
    });
    return;
  }

  if (usesSignLanguage(userType)) {
    applySpellPreviewForDeaf(trimmed);
  }
}

/**
 * Assistant / general AI reply preview — phrase-only.
 *
 * Shows a sign GIF only when the reply is a near-exact match for a known phrase
 * variant (via {@link matchPhraseSignGif}). For any other free-form reply it
 * clears the preview to idle: no generic mood avatar, no finger-spelling, and
 * no loose keyword matching that would fire on a word buried in a sentence.
 */
export function applyAssistantGifPreview(text: string): void {
  const setSignPreview = useSessionStore.getState().setSignPreview;
  const trimmed = text.trim();
  if (!trimmed) {
    setSignPreview(null);
    return;
  }

  const phraseGif = matchPhraseSignGif(trimmed);
  if (phraseGif) {
    applyPhraseGifPreview(phraseGif);
    return;
  }

  setSignPreview(null);
}

/** Live preview while composing on the sign keyboard. */
export function applySignKeyboardComposePreview(
  composed: string[],
  tab: "asl" | "arsl" | "phrases"
): void {
  if (!composed.length) return;

  if (tab === "phrases") {
    const lastKey = composed[composed.length - 1] ?? "";
    const phraseGif = getPhraseSignGifByPhraseKey(lastKey);
    if (phraseGif) {
      applyPhraseGifPreview(phraseGif);
      return;
    }
    useSessionStore.getState().setSignPreview({
      phraseKey: lastKey,
      spellPlan: undefined,
      spellSourceText: undefined,
      motionPlan: undefined,
      previewMode: "sign",
    });
    return;
  }

  const text = composed.join(tab === "asl" ? "" : " ").trim();
  if (!text) return;

  if (tab === "arsl") {
    applyArslPreview(text);
    return;
  }

  applySpellPreviewForDeaf(text);
}

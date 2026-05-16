/** One step for 2D finger-spelling + word boundaries (used by SignLanguageWidget). */

export interface SpellStep {
  label: string;
  durationMs: number;
  description?: string;
}

const WORD_BREAK_MS = 720;
const LETTER_MS = 560;
const PAUSE_MS = 380;

/**
 * Build a letter-by-letter spell sequence. After each word, inserts a clear
 * "word complete" marker. Optional micro-pauses between letters in a word.
 */
export function buildSpellPlan(text: string, showSpacesBetweenLetters: boolean): SpellStep[] {
  const raw = text.trim();
  if (!raw) {
    return [{ label: "Neutral", durationMs: 600, description: "No text" }];
  }

  const words = raw.split(/\s+/).filter(Boolean);
  const steps: SpellStep[] = [];

  for (const word of words) {
    let letterIndexInWord = 0;
    for (const ch of word) {
      if (/[a-zA-Z]/.test(ch)) {
        if (showSpacesBetweenLetters && letterIndexInWord > 0) {
          steps.push({
            label: "·",
            durationMs: PAUSE_MS,
            description: "Pause",
          });
        }
        const u = ch.toUpperCase();
        steps.push({
          label: u,
          durationMs: LETTER_MS,
          description: `Letter ${u}`,
        });
        letterIndexInWord += 1;
      } else if (/\d/.test(ch)) {
        if (showSpacesBetweenLetters && letterIndexInWord > 0) {
          steps.push({
            label: "·",
            durationMs: PAUSE_MS,
            description: "Pause",
          });
        }
        steps.push({
          label: ch,
          durationMs: LETTER_MS,
          description: `Digit ${ch}`,
        });
        letterIndexInWord += 1;
      }
    }

    if (letterIndexInWord > 0) {
      steps.push({
        label: "✓",
        durationMs: WORD_BREAK_MS,
        description: "Word complete",
      });
    }
  }

  if (!steps.length) {
    return [{ label: "Neutral", durationMs: 600, description: "Unsupported characters" }];
  }

  return steps;
}

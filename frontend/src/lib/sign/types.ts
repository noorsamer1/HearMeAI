/** One step for 2D finger-spelling + word boundaries (used by SignLanguageWidget). */

export interface SpellStep {
  label: string;
  durationMs: number;
  description?: string;
  /** Hand gesture emoji (ASL / ArSL); widget prefers this over label-based lookup. */
  emoji?: string;
}

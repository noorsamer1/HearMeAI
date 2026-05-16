"use client";

import { clsx } from "clsx";
import { MANUAL_MOOD_OPTIONS, type ManualMoodId } from "@/lib/sentiment/sentimentDisplay";
import { useTranslations } from "@/lib/i18n";
import type { Language } from "@/lib/state/sessionStore";

interface MoodEmojiPickerProps {
  language: Language;
  value: ManualMoodId | null;
  onChange: (mood: ManualMoodId | null) => void;
}

export function MoodEmojiPicker({ language, value, onChange }: MoodEmojiPickerProps) {
  const t = useTranslations(language);

  return (
    <div
      className="mb-2 rounded-xl px-2 py-2"
      style={{
        background: "var(--color-bg-subtle)",
        border: "1px solid var(--color-border-strong)",
      }}
      role="group"
      aria-label={t.controls.moodPickerLabel}
    >
      <p
        className="text-[11px] font-medium mb-1.5 px-1"
        style={{ color: "var(--color-text-muted)" }}
      >
        {t.controls.moodPickerLabel}
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        {MANUAL_MOOD_OPTIONS.map((opt) => {
          const selected = value === opt.id;
          const label = t.controls.moodLabels[opt.id];
          return (
            <button
              key={opt.id}
              type="button"
              title={label}
              aria-label={label}
              aria-pressed={selected}
              onClick={() => onChange(selected ? null : opt.id)}
              className={clsx(
                "flex h-9 w-9 items-center justify-center rounded-xl text-lg transition-all duration-150 cursor-pointer",
                selected && "ring-2 ring-[var(--color-accent)] ring-offset-1 ring-offset-[var(--color-bg-subtle)]"
              )}
              style={{
                background: selected
                  ? "color-mix(in srgb, var(--color-accent) 18%, transparent)"
                  : "var(--color-surface-raised)",
                border: "1px solid",
                borderColor: selected ? "var(--color-accent)" : "var(--color-border-strong)",
              }}
            >
              <span aria-hidden>{opt.emoji}</span>
            </button>
          );
        })}
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-[11px] px-2 py-1 rounded-lg cursor-pointer transition-colors"
            style={{ color: "var(--color-text-muted)" }}
          >
            {t.controls.moodClear}
          </button>
        )}
      </div>
    </div>
  );
}

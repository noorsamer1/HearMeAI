import { en } from "./en";
import { ar } from "./ar";
import type { Language } from "@/lib/state/sessionStore";

export { en, ar };
export type { Translations } from "./en";

const translations = { en, ar };

export function useTranslations(lang: Language) {
  return translations[lang];
}

export function t(lang: Language, key: string): string {
  const keys = key.split(".");
  let current: Record<string, unknown> = translations[lang] as Record<string, unknown>;

  for (const k of keys) {
    if (current === undefined || current === null) return key;
    current = current[k] as Record<string, unknown>;
  }

  return typeof current === "string" ? current : key;
}

"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Delete, X, Loader2, SendHorizontal } from "lucide-react";
import { clsx } from "clsx";
import { useSessionStore } from "@/lib/state/sessionStore";
import { signTranslate, getStoredToken } from "@/lib/api/client";
import { showToast } from "@/components/common/Toast";
import { applySignKeyboardComposePreview } from "@/lib/sign/signPreviewHelpers";
import {
  ARSL_LETTER_MAP,
  ASL_LETTER_EMOJI,
  ASL_LETTERS,
} from "@/lib/sign/vocabulary";

const ARSL_LETTERS = Object.keys(ARSL_LETTER_MAP);

const SIGN_PHRASES: Array<{ key: string; labelEn: string; labelAr: string; emoji: string }> = [
  { key: "hello",       labelEn: "Hello",       labelAr: "مرحبا",     emoji: "👋" },
  { key: "thank you",   labelEn: "Thank you",   labelAr: "شكراً",     emoji: "🙏" },
  { key: "how are you", labelEn: "How are you", labelAr: "كيف حالك",  emoji: "🤔" },
  { key: "yes",         labelEn: "Yes",         labelAr: "نعم",       emoji: "✅" },
  { key: "no",          labelEn: "No",          labelAr: "لا",        emoji: "❌" },
  { key: "please",      labelEn: "Please",      labelAr: "من فضلك",   emoji: "🙏" },
  { key: "please repeat", labelEn: "Please repeat", labelAr: "كرر من فضلك", emoji: "🔁" },
  { key: "help",        labelEn: "Help",        labelAr: "ساعدني",    emoji: "🆘" },
  { key: "sorry",       labelEn: "Sorry",       labelAr: "آسف",       emoji: "😔" },
  { key: "good",        labelEn: "Good",        labelAr: "جيد",       emoji: "👍" },
  { key: "bad",         labelEn: "Bad",         labelAr: "سيء",       emoji: "👎" },
  { key: "water",       labelEn: "Water",       labelAr: "ماء",       emoji: "💧" },
  { key: "food",        labelEn: "Food",        labelAr: "طعام",      emoji: "🍽️" },
  { key: "question",    labelEn: "Question?",   labelAr: "سؤال؟",    emoji: "❓" },
];

type Tab = "asl" | "arsl" | "phrases";
type SignOutputLanguage = "en" | "ar";

const SIGN_OUTPUT_LANG_KEY = "hearme-sign-output-lang";

function readStoredOutputLang(): SignOutputLanguage {
  if (typeof window === "undefined") return "en";
  const v = window.localStorage.getItem(SIGN_OUTPUT_LANG_KEY);
  return v === "ar" ? "ar" : "en";
}

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface SignKeyboardProps {
  onClose: () => void;
  onSend?: (text: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function SignKeyboard({ onClose, onSend }: SignKeyboardProps) {
  const { language, setInputText } = useSessionStore();
  const [tab, setTab] = useState<Tab>(language === "ar" ? "arsl" : "asl");
  const [composed, setComposed] = useState<string[]>([]);
  const [translating, setTranslating] = useState(false);
  const [outputLang, setOutputLang] = useState<SignOutputLanguage>("en");

  useEffect(() => {
    setOutputLang(readStoredOutputLang());
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SIGN_OUTPUT_LANG_KEY, outputLang);
    }
  }, [outputLang]);

  useEffect(() => {
    applySignKeyboardComposePreview(composed, tab);
  }, [composed, tab]);

  const preview = composed.join(tab === "asl" ? "" : " ").trim();

  const append = (token: string) => setComposed((prev) => [...prev, token]);
  const backspace = () => setComposed((prev) => prev.slice(0, -1));
  const clear = () => setComposed([]);

  const handleTranslateAndSend = async () => {
    if (!composed.length) return;
    setTranslating(true);
    try {
      const token = getStoredToken();
      const result = await signTranslate(composed, outputLang, token);
      setInputText(result.text);
      if (onSend) {
        onSend(result.text);
      }
      setComposed([]);
      onClose();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Translation failed");
    } finally {
      setTranslating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] shadow-[var(--shadow-lg)] overflow-hidden"
      role="dialog"
      aria-label="Sign language keyboard"
    >
      {/* ── Header + Composition area ── */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[var(--color-border)]">
        {/* Composed preview */}
        <div
          className="flex-1 min-h-[32px] px-3 py-1.5 rounded-xl text-sm font-mono leading-snug overflow-x-auto whitespace-nowrap"
          style={{
            background: "var(--color-bg-subtle)",
            color: preview ? "var(--color-text-primary)" : "var(--color-text-muted)",
            border: "1px solid var(--color-border)",
          }}
          dir="auto"
        >
          {preview || <span className="opacity-50">tap signs to compose…</span>}
        </div>

        {/* Backspace */}
        <button
          type="button"
          onClick={backspace}
          disabled={!composed.length}
          aria-label="Backspace"
          className="flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-muted)",
          }}
        >
          <Delete className="w-4 h-4" />
        </button>

        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close sign keyboard"
          className="flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-150 cursor-pointer"
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-muted)",
          }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── Tab strip ── */}
      <div className="flex border-b border-[var(--color-border)]">
        {(["asl", "arsl", "phrases"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={clsx(
              "flex-1 py-2 text-xs font-semibold uppercase tracking-wide transition-colors duration-150 cursor-pointer",
              tab === t
                ? "text-[var(--color-accent)] border-b-2 border-[var(--color-accent)]"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            )}
          >
            {t === "asl" ? "A–Z" : t === "arsl" ? "عربي" : "Phrases"}
          </button>
        ))}
      </div>

      {/* ── Grid ── */}
      <div className="p-2 max-h-[220px] overflow-y-auto">
        <AnimatePresence mode="wait">
          {tab === "asl" && (
            <motion.div
              key="asl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="grid grid-cols-6 sm:grid-cols-8 gap-1.5"
            >
              {ASL_LETTERS.map((letter) => (
                <button
                  key={letter}
                  type="button"
                  onClick={() => append(letter)}
                  aria-label={`Sign letter ${letter}`}
                  className="flex flex-col items-center justify-center gap-0.5 rounded-xl p-1.5 transition-all duration-100 active:scale-95 cursor-pointer"
                  style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      "var(--color-accent)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      "var(--color-border)";
                  }}
                >
                  <span className="text-lg leading-none">{ASL_LETTER_EMOJI[letter]}</span>
                  <span
                    className="text-[10px] font-bold"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {letter}
                  </span>
                </button>
              ))}
            </motion.div>
          )}

          {tab === "arsl" && (
            <motion.div
              key="arsl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="grid grid-cols-6 sm:grid-cols-8 gap-1.5"
              dir="rtl"
            >
              {ARSL_LETTERS.map((letter) => {
                const info = ARSL_LETTER_MAP[letter];
                return (
                  <button
                    key={letter}
                    type="button"
                    onClick={() => append(letter)}
                    aria-label={`Sign Arabic letter ${letter}`}
                    title={info.description}
                    className="flex flex-col items-center justify-center gap-0.5 rounded-xl p-1.5 transition-all duration-100 active:scale-95 cursor-pointer"
                    style={{
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor =
                        "var(--color-accent)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor =
                        "var(--color-border)";
                    }}
                  >
                    <span className="text-lg leading-none">{info.emoji}</span>
                    <span
                      className="text-[11px] font-bold"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {letter}
                    </span>
                  </button>
                );
              })}
            </motion.div>
          )}

          {tab === "phrases" && (
            <motion.div
              key="phrases"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="flex flex-wrap gap-1.5"
            >
              {SIGN_PHRASES.map((phrase) => (
                <button
                  key={phrase.key}
                  type="button"
                  onClick={() => append(phrase.key)}
                  aria-label={`Sign phrase: ${phrase.labelEn}`}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-100 active:scale-95 cursor-pointer"
                  style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text-primary)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      "var(--color-accent)";
                    (e.currentTarget as HTMLButtonElement).style.color =
                      "var(--color-accent)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      "var(--color-border)";
                    (e.currentTarget as HTMLButtonElement).style.color =
                      "var(--color-text-primary)";
                  }}
                >
                  <span>{phrase.emoji}</span>
                  <span>{language === "ar" ? phrase.labelAr : phrase.labelEn}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-2 px-3 py-2 border-t border-[var(--color-border)]">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)] shrink-0">
          Output
        </span>
        {(["en", "ar"] as SignOutputLanguage[]).map((lang) => (
          <button
            key={lang}
            type="button"
            onClick={() => setOutputLang(lang)}
            className={clsx(
              "flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer",
              outputLang === lang
                ? "bg-[var(--color-accent)] text-white"
                : "bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]"
            )}
            aria-pressed={outputLang === lang}
          >
            {lang === "en" ? "English" : "العربية"}
          </button>
        ))}
      </div>

      {/* ── Footer actions ── */}
      <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-t border-[var(--color-border)]">
        <button
          type="button"
          onClick={clear}
          disabled={!composed.length}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-muted)",
          }}
        >
          Clear
        </button>

        <button
          type="button"
          onClick={handleTranslateAndSend}
          disabled={!composed.length || translating}
          aria-label="AI translate and fill message"
          className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          style={{
            background:
              composed.length && !translating
                ? "linear-gradient(135deg, var(--color-brand-400) 0%, var(--color-accent-500) 100%)"
                : "var(--color-surface-raised)",
            color:
              composed.length && !translating
                ? "var(--color-text-inverse)"
                : "var(--color-text-muted)",
            boxShadow:
              composed.length && !translating ? "0 0 12px var(--color-brand-glow)" : "none",
          }}
        >
          {translating ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Translating…</span>
            </>
          ) : (
            <>
              <SendHorizontal className="w-3.5 h-3.5" />
              <span>AI Translate &amp; Fill</span>
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}

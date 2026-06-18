"use client";

import { useEffect } from "react";
import { RotateCcw, Sparkles, StretchHorizontal } from "lucide-react";
import { useSessionStore } from "@/lib/state/sessionStore";
import { useTranslations } from "@/lib/i18n";
import { SignPreview } from "@/components/avatar/SignPreview";
import { buildSpellPlan } from "@/lib/sign/spellingPlan";
import { usesSignLanguage } from "@/lib/sign/signPreviewHelpers";

const LETTER_SPACE_LS = "hearmeai-sign-letter-spacing";
const PREVIEW_RENDERER_LS = "hearmeai-sign-preview-renderer";

/**
 * 3D/2D signer panel for the session workspace.
 * Reactively plays sign animations whenever signPreview changes in the store.
 */
export function ChatHologramDock() {
  const language = useSessionStore((s) => s.language);
  const userType = useSessionStore((s) => s.userType);
  const signShowSpacesBetweenLetters = useSessionStore((s) => s.signShowSpacesBetweenLetters);
  const signPreviewRenderer = useSessionStore((s) => s.signPreviewRenderer);
  const setSignPreviewRenderer = useSessionStore((s) => s.setSignPreviewRenderer);
  const setSignShowSpacesBetweenLetters = useSessionStore(
    (s) => s.setSignShowSpacesBetweenLetters
  );
  const bumpSignReplay = useSessionStore((s) => s.bumpSignReplay);
  const setSignPreview = useSessionStore((s) => s.setSignPreview);
  const t = useTranslations(language);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      if (window.localStorage.getItem(LETTER_SPACE_LS) === "1") {
        setSignShowSpacesBetweenLetters(true);
      }
      const savedRenderer = window.localStorage.getItem(PREVIEW_RENDERER_LS);
      if (savedRenderer === "gif" || savedRenderer === "2d") {
        setSignPreviewRenderer(savedRenderer);
      }
    } catch {
      /* ignore */
    }
  }, [setSignShowSpacesBetweenLetters, setSignPreviewRenderer]);

  const signPreview = useSessionStore((s) => s.signPreview);
  const showPreviewControls = usesSignLanguage(userType);
  const showLetterControls =
    showPreviewControls &&
    signPreviewRenderer === "2d" &&
    signPreview?.previewMode === "sign";

  const setRenderer = (renderer: "gif" | "2d") => {
    setSignPreviewRenderer(renderer);
    try {
      window.localStorage.setItem(PREVIEW_RENDERER_LS, renderer);
    } catch {
      /* ignore */
    }
  };

  const toggleLetterSpacing = () => {
    const next = !signShowSpacesBetweenLetters;
    setSignShowSpacesBetweenLetters(next);
    try {
      window.localStorage.setItem(LETTER_SPACE_LS, next ? "1" : "0");
    } catch {
      /* ignore */
    }
    const prev = useSessionStore.getState().signPreview;
    if (prev?.spellSourceText) {
      const spellPlan = buildSpellPlan(prev.spellSourceText, next);
      setSignPreview({ ...prev, spellPlan, motionPlan: undefined });
    }
  };

  return (
    <div
      className="flex flex-col flex-1 min-h-0 w-full bg-[var(--color-surface)]/90 backdrop-blur-md"
      aria-label={t.chat.hologramTitle}
    >
      <div className="px-3 py-2.5 border-b border-[var(--color-border)] flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="w-4 h-4 text-[var(--color-accent)] shrink-0" aria-hidden />
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)] truncate">
            {t.chat.hologramTitle}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {showPreviewControls && (
            <div
              className="inline-flex rounded-lg border border-[var(--color-border)] p-0.5"
              role="group"
              aria-label={t.chat.previewRendererLabel}
            >
              <button
                type="button"
                onClick={() => setRenderer("gif")}
                aria-pressed={signPreviewRenderer === "gif"}
                className={`rounded-md px-2 py-1 text-[10px] font-semibold transition ${
                  signPreviewRenderer === "gif"
                    ? "bg-[color-mix(in_srgb,var(--color-brand)_18%,transparent)] text-[var(--color-brand)]"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                }`}
              >
                {t.chat.previewRendererGif}
              </button>
              <button
                type="button"
                onClick={() => setRenderer("2d")}
                aria-pressed={signPreviewRenderer === "2d"}
                className={`rounded-md px-2 py-1 text-[10px] font-semibold transition ${
                  signPreviewRenderer === "2d"
                    ? "bg-[color-mix(in_srgb,var(--color-brand)_18%,transparent)] text-[var(--color-brand)]"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                }`}
              >
                {t.chat.previewRenderer2d}
              </button>
            </div>
          )}
          {showLetterControls && (
            <>
              <button
                type="button"
                onClick={toggleLetterSpacing}
                title="Insert short pause ( · ) between finger-spelled letters"
                aria-pressed={signShowSpacesBetweenLetters}
                className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-semibold transition ${
                  signShowSpacesBetweenLetters
                    ? "border-[var(--color-brand)] bg-[color-mix(in_srgb,var(--color-brand)_18%,transparent)] text-[var(--color-brand)]"
                    : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-brand)]"
                }`}
              >
                <StretchHorizontal className="w-3.5 h-3.5" aria-hidden />
                Space
              </button>
            </>
          )}
          {showPreviewControls && signPreview && (
            <button
              type="button"
              onClick={() => bumpSignReplay()}
              title="Replay the current sign sequence"
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-border)] px-2 py-1 text-[10px] font-semibold text-[var(--color-text-muted)] hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] transition"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden />
              Repeat
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 min-h-[200px] max-h-[min(50vh,420px)] w-full relative">
        <SignPreview embedded />
      </div>
      <p className="px-3 py-2.5 text-[11px] text-[var(--color-text-muted)] leading-relaxed border-t border-[var(--color-border)] shrink-0">
        {t.chat.hologramHint}
      </p>
    </div>
  );
}

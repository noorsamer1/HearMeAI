"use client";

import { useEffect, useMemo, useState } from "react";
import { useSessionStore } from "@/lib/state/sessionStore";
import {
  generalResponseGifSrc,
  getGeneralResponseGifMeta,
  type GeneralResponseGifId,
} from "@/lib/sign/generalResponseGifs";
import { phraseSignGifSrc } from "@/lib/sign/phraseSignGifs";
import { pickGeneralResponseGif } from "@/lib/sign/pickGeneralResponseGif";

interface GeneralResponseGifProps {
  text: string;
  /** Override auto-picked mood GIF (tests / future manual control). */
  gifId?: GeneralResponseGifId;
  /** Direct phrase sign clip — skips mood picker. */
  phraseGifFile?: string;
  phraseLabel?: string;
  phraseFallbackEmoji?: string;
  replayNonce?: number;
  className?: string;
}

export function GeneralResponseGif({
  text,
  gifId,
  phraseGifFile,
  phraseLabel,
  phraseFallbackEmoji = "👋",
  replayNonce = 0,
  className = "",
}: GeneralResponseGifProps) {
  const language = useSessionStore((s) => s.language);
  const systemStatus = useSessionStore((s) => s.systemStatus);
  const liveAiResponse = useSessionStore((s) => s.liveAiResponse);
  const replyEmotionHint = useSessionStore((s) => s.replyEmotionHint);
  const [missingFile, setMissingFile] = useState(false);

  const resolvedId = useMemo(
    () =>
      phraseGifFile
        ? null
        : gifId ??
          pickGeneralResponseGif(text, {
            emotionLabel: replyEmotionHint?.label,
            systemStatus,
            isStreaming: Boolean(liveAiResponse?.trim()),
          }),
    [phraseGifFile, gifId, text, replyEmotionHint?.label, systemStatus, liveAiResponse]
  );

  const meta = resolvedId ? getGeneralResponseGifMeta(resolvedId) : null;
  const label =
    phraseLabel ??
    (meta ? (language === "ar" ? meta.labelAr : meta.labelEn) : "");
  const fallbackEmoji = phraseFallbackEmoji ?? meta?.fallbackEmoji ?? "👋";
  const fileName = phraseGifFile ?? meta?.fileName ?? "idle.gif";
  const src = phraseGifFile
    ? `${phraseSignGifSrc(phraseGifFile)}?v=${replayNonce}`
    : `${generalResponseGifSrc(resolvedId!)}?v=${replayNonce}`;
  const cacheKey = phraseGifFile ?? resolvedId ?? "idle";

  useEffect(() => {
    setMissingFile(false);
  }, [cacheKey, replayNonce]);

  return (
    <div
      className={`relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)]/70 p-3 backdrop-blur-sm ${className}`}
      role="img"
      aria-label={label}
    >
      {!missingFile ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={`${cacheKey}-${replayNonce}`}
          src={src}
          alt={label}
          className="max-h-[calc(100%-2rem)] max-w-full object-contain object-center"
          onError={() => setMissingFile(true)}
        />
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 px-4 text-center">
          <span className="text-5xl" aria-hidden>
            {fallbackEmoji}
          </span>
          <p className="text-sm font-semibold text-[var(--color-text)]">{label}</p>
          <p className="text-[11px] leading-relaxed text-[var(--color-text-muted)]">
            Add{" "}
            <code className="rounded bg-[var(--color-surface)] px-1 py-0.5 text-[10px]">
              public/gifs/{fileName}
            </code>
          </p>
        </div>
      )}
      <span className="absolute bottom-2 left-2 right-2 truncate rounded-md bg-black/45 px-2 py-1 text-center text-[10px] font-medium text-white backdrop-blur-sm">
        {label}
      </span>
    </div>
  );
}

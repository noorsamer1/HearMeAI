"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Signpost } from "lucide-react";
import { useSessionStore } from "@/lib/state/sessionStore";
import { GeneralResponseGif } from "@/components/avatar/GeneralResponseGif";
import SignLanguageWidget, { MotionPlan } from "@/components/avatar/SignLanguageWidget";
import { getPhraseSignGifByPhraseKey } from "@/lib/sign/phraseSignGifs";
import { HOLOGRAM_2D_DURATION_SCALE } from "@/lib/sign/playbackTiming";

interface SignPreviewProps {
  embedded?: boolean;
  /** When set, ignore the store's signPreview and show this phraseKey directly */
  overridePhraseKey?: string;
  /** Compact layout: smaller widget, no drag handle */
  compact?: boolean;
}

const SIGNER_OFFSET_KEY = "hearmeai-signer-offset-v3";
const DESKTOP_SIGNER_WIDTH = 260;
const DESKTOP_SIGNER_HEIGHT = 380;

type Offset = { right: number; bottom: number };

function readOffset(): Offset {
  if (typeof window === "undefined") return { right: 24, bottom: 140 };
  try {
    const raw = window.localStorage.getItem(SIGNER_OFFSET_KEY);
    if (!raw) return { right: 24, bottom: 140 };
    const parsed = JSON.parse(raw) as Partial<Offset>;
    return {
      right: Math.max(8, Math.min(parsed.right ?? 24, 800)),
      bottom: Math.max(24, Math.min(parsed.bottom ?? 140, 800)),
    };
  } catch {
    return { right: 24, bottom: 140 };
  }
}

function SignWidgetPanel({
  phraseKey,
  widgetMotionPlan,
  replayNonce,
  className = "",
  stepDurationScale = 1,
  transitionDurationSec = 0.22,
}: {
  phraseKey: string;
  widgetMotionPlan?: MotionPlan;
  replayNonce: number;
  className?: string;
  stepDurationScale?: number;
  transitionDurationSec?: number;
}) {
  return (
    <div
      className={`flex h-full w-full items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)]/70 p-3 backdrop-blur-sm ${className}`}
    >
      <SignLanguageWidget
        phrase={phraseKey || "neutral"}
        motionPlan={widgetMotionPlan}
        replayNonce={replayNonce}
        className="w-full"
        stepDurationScale={stepDurationScale}
        transitionDurationSec={transitionDurationSec}
      />
    </div>
  );
}

export function SignPreview({
  embedded = false,
  overridePhraseKey,
  compact = false,
}: SignPreviewProps) {
  const { signPreview, signReplayNonce, language, signPreviewRenderer } =
    useSessionStore();
  const hasPreview = overridePhraseKey ? true : Boolean(signPreview);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [offset, setOffset] = useState<Offset>({ right: 24, bottom: 140 });
  const dragRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    startRight: number;
    startBottom: number;
  }>({
    active: false,
    startX: 0,
    startY: 0,
    startRight: 24,
    startBottom: 140,
  });

  const phraseKey = overridePhraseKey
    ? overridePhraseKey.trim().toLowerCase()
    : (signPreview?.phraseKey?.trim().toLowerCase() ?? "");
  const spellPlan = overridePhraseKey ? undefined : signPreview?.spellPlan;
  const llmPlan = overridePhraseKey ? [] : (signPreview?.motionPlan ?? []);
  const previewMode = overridePhraseKey ? "sign" : (signPreview?.previewMode ?? "sign");
  const gifSourceText = signPreview?.spellSourceText ?? signPreview?.phraseKey ?? "";
  const phraseGifFile = signPreview?.phraseGifFile;
  const phraseGifMeta = useMemo(
    () => getPhraseSignGifByPhraseKey(overridePhraseKey ?? phraseKey),
    [overridePhraseKey, phraseKey]
  );

  const widgetMotionPlan: MotionPlan | undefined = useMemo(() => {
    if (spellPlan && spellPlan.length > 0) {
      return { poses: spellPlan };
    }
    if (llmPlan.length > 0) {
      return {
        poses: llmPlan.map((step) => ({
          label: step.pose,
          durationMs: step.durationMs,
        })),
      };
    }
    return undefined;
  }, [spellPlan, llmPlan]);

  const showPhraseGif =
    signPreviewRenderer === "gif" &&
    previewMode === "phrase-gif" &&
    Boolean(phraseGifFile) &&
    !overridePhraseKey;
  const showMoodGif =
    signPreviewRenderer === "gif" && previewMode === "gif" && !overridePhraseKey;
  const showGif = showPhraseGif || showMoodGif;
  const hologram2dSlow = embedded && !compact && !overridePhraseKey;

  useEffect(() => {
    if (embedded) return;
    const updateMobile = () => setIsMobile(window.innerWidth < 768);
    updateMobile();
    window.addEventListener("resize", updateMobile);
    return () => window.removeEventListener("resize", updateMobile);
  }, [embedded]);

  useEffect(() => {
    if (embedded || isMobile) return;
    setOffset(readOffset());
  }, [embedded, isMobile]);

  useEffect(() => {
    if (embedded || isMobile) return;
    if (typeof window === "undefined") return;
    window.localStorage.setItem(SIGNER_OFFSET_KEY, JSON.stringify(offset));
  }, [embedded, isMobile, offset]);

  useEffect(() => {
    if (embedded || isMobile) return;

    const onPointerMove = (event: PointerEvent) => {
      if (!dragRef.current.active) return;
      event.preventDefault();
      const dx = event.clientX - dragRef.current.startX;
      const dy = event.clientY - dragRef.current.startY;
      const nextRight = Math.min(
        Math.max(dragRef.current.startRight - dx, 8),
        Math.max(window.innerWidth - DESKTOP_SIGNER_WIDTH - 8, 8)
      );
      const nextBottom = Math.min(
        Math.max(dragRef.current.startBottom - dy, 8),
        Math.max(window.innerHeight - DESKTOP_SIGNER_HEIGHT - 8, 8)
      );
      setOffset({ right: nextRight, bottom: nextBottom });
    };

    const onPointerUp = () => {
      dragRef.current.active = false;
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [embedded, isMobile]);

  if (!hasPreview && embedded) {
    return (
      <div className="flex h-full min-h-[200px] items-center justify-center px-4 text-center text-xs text-[var(--color-text-muted)]">
        Responses and sign previews appear here.
      </div>
    );
  }

  if (compact || overridePhraseKey) {
    return (
      <div
        className="relative flex w-full items-center justify-center p-2"
        style={{ minHeight: 120 }}
        role="region"
        aria-label="Sign language preview"
      >
        <SignLanguageWidget
          phrase={phraseKey || "hello"}
          motionPlan={widgetMotionPlan}
          replayNonce={signReplayNonce}
          className="w-full max-w-[160px]"
        />
      </div>
    );
  }

  const previewBody = showGif ? (
    <GeneralResponseGif
      text={showMoodGif ? gifSourceText : ""}
      phraseGifFile={showPhraseGif ? phraseGifFile : undefined}
      phraseLabel={
        showPhraseGif && phraseGifMeta
          ? language === "ar"
            ? phraseGifMeta.labelAr
            : phraseGifMeta.labelEn
          : undefined
      }
      phraseFallbackEmoji={phraseGifMeta?.fallbackEmoji}
      replayNonce={signReplayNonce}
      className="h-full w-full"
    />
  ) : (
    <SignWidgetPanel
      phraseKey={phraseKey}
      widgetMotionPlan={widgetMotionPlan}
      replayNonce={signReplayNonce}
      className={embedded ? "max-w-[220px] mx-auto" : ""}
      stepDurationScale={hologram2dSlow ? HOLOGRAM_2D_DURATION_SCALE : 1}
      transitionDurationSec={hologram2dSlow ? 0.34 : 0.22}
    />
  );

  if (embedded) {
    return (
      <div
        className="relative h-full min-h-[290px] w-full"
        role="region"
        aria-label="Signer preview"
      >
        {previewBody}
      </div>
    );
  }

  if (isMobile) {
    return (
      <>
        {!mobileOpen && (
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="fixed bottom-40 right-4 z-[80] inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--color-brand)_40%,transparent)] bg-[color-mix(in_srgb,var(--color-brand)_80%,transparent)] px-3 py-2 text-xs font-semibold text-[var(--color-text-inverse)] shadow-lg backdrop-blur hover:bg-[var(--color-brand)]"
            aria-label="Open signer panel"
          >
            <Signpost className="h-4 w-4 text-[var(--color-brand-300)]" />
            Signer
          </button>
        )}

        {mobileOpen && (
          <div className="fixed inset-0 z-[60]">
            <button
              type="button"
              className="absolute inset-0 bg-black/55"
              onClick={() => setMobileOpen(false)}
              aria-label="Close signer panel"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-24 flex items-end justify-center">
              <div className="pointer-events-auto relative h-[50vh] max-h-[430px] min-h-[280px] w-[min(72vw,320px)]">
                {previewBody}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div
      role="region"
      aria-label="Floating signer preview"
      className="fixed z-[60] cursor-grab select-none active:cursor-grabbing"
      style={{
        right: offset.right,
        bottom: offset.bottom,
        width: DESKTOP_SIGNER_WIDTH,
        height: DESKTOP_SIGNER_HEIGHT,
      }}
      onPointerDown={(event) => {
        dragRef.current.active = true;
        dragRef.current.startX = event.clientX;
        dragRef.current.startY = event.clientY;
        dragRef.current.startRight = offset.right;
        dragRef.current.startBottom = offset.bottom;
      }}
    >
      {previewBody}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Signpost } from "lucide-react";
import { useSessionStore } from "@/lib/state/sessionStore";
import { HologramPose, HologramSigner3D } from "@/components/avatar/HologramSigner3D";
import SignLanguageWidget, { MotionPlan } from "@/components/avatar/SignLanguageWidget";
import { HOLOGRAM_2D_DURATION_SCALE } from "@/lib/sign/playbackTiming";

interface SignPreviewProps {
  embedded?: boolean;
  /** When set, ignore the store's signPreview and show this phraseKey directly */
  overridePhraseKey?: string;
  /** Compact layout: smaller widget, no drag handle, no mode toggle */
  compact?: boolean;
}

const SIGNER_OFFSET_KEY = "hearmeai-signer-offset-v3";
const DESKTOP_SIGNER_WIDTH = 260;
const DESKTOP_SIGNER_HEIGHT = 380;

const SIGN_SEQUENCE_MAP: Record<string, HologramPose[]> = {
  hello: ["wave", "wave", "neutral"],
  "thank you": ["thank-you", "neutral"],
  "how are you": ["question", "question", "neutral"],
  yes: ["yes", "neutral"],
  no: ["no", "neutral"],
  please: ["please", "neutral"],
  help: ["help", "neutral"],
};

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

export function SignPreview({ embedded = false, overridePhraseKey, compact = false }: SignPreviewProps) {
  const { signPreview, signReplayNonce } = useSessionStore();
  const hasPreview = overridePhraseKey ? true : Boolean(signPreview);
  const [stepIndex, setStepIndex] = useState(0);
  const [sequenceActive, setSequenceActive] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [offset, setOffset] = useState<Offset>({ right: 24, bottom: 140 });
  const [use3DMode, setUse3DMode] = useState(false);
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

  // When overridePhraseKey is set, use it directly (bypasses store)
  const phraseKey = overridePhraseKey
    ? overridePhraseKey.trim().toLowerCase()
    : (signPreview?.phraseKey?.trim().toLowerCase() ?? "");
  const spellPlan = overridePhraseKey ? undefined : signPreview?.spellPlan;
  const llmPlan = overridePhraseKey ? [] : (signPreview?.motionPlan ?? []);
  const sequence = useMemo(() => {
    if (llmPlan.length > 0) {
      return llmPlan.map((step) => step.pose as HologramPose);
    }
    return SIGN_SEQUENCE_MAP[phraseKey] ?? ["neutral"];
  }, [phraseKey, llmPlan]);
  const stepDurations = useMemo(() => {
    if (llmPlan.length > 0) {
      return llmPlan.map((step) => Math.max(350, Math.min(step.durationMs, 2200)));
    }
    return sequence.map(() => 900);
  }, [llmPlan, sequence]);
  const sequenceSignature = useMemo(() => {
    if (overridePhraseKey) return `ov:${overridePhraseKey}`;
    if (!signPreview) return "none";
    const sp = (signPreview.spellPlan ?? [])
      .map((s) => `${s.label}:${s.durationMs}`)
      .join("|");
    const planSig = (signPreview.motionPlan ?? [])
      .map((step) => `${step.pose}:${step.durationMs}`)
      .join("|");
    return `${signPreview.phraseKey}|spell:${sp}|plan:${planSig}|r:${signReplayNonce}`;
  }, [signPreview, overridePhraseKey, signReplayNonce]);

  const activePose = sequenceActive ? sequence[Math.min(stepIndex, sequence.length - 1)] : "neutral";

  useEffect(() => {
    setStepIndex(0);
    setSequenceActive(hasPreview);
  }, [hasPreview, sequenceSignature]);

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
    if (!sequenceActive) return;
    if (!sequence.length) return;

    if (stepIndex >= sequence.length - 1) {
      const hold = stepDurations[stepIndex] ?? 900;
      const timer = window.setTimeout(() => {
        setSequenceActive(false);
      }, hold);
      return () => window.clearTimeout(timer);
    }

    const delay = stepDurations[stepIndex] ?? 900;
    const timer = window.setTimeout(() => {
      setStepIndex((prev) => Math.min(prev + 1, sequence.length - 1));
    }, delay);
    return () => window.clearTimeout(timer);
  }, [sequenceActive, sequence, stepDurations, stepIndex]);

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

  const hologram2dSlow = embedded && !compact && !overridePhraseKey;

  // Build a MotionPlan for the 2-D widget: finger-spelling overrides backend poses.
  const widgetMotionPlan: MotionPlan | undefined =
    spellPlan && spellPlan.length > 0
      ? { poses: spellPlan }
      : llmPlan.length > 0
        ? {
            poses: llmPlan.map((step) => ({
              label: step.pose,
              durationMs: step.durationMs,
            })),
          }
        : undefined;

  /** Shared toggle button rendered in 3-D mode corners */
  const ModeToggle = ({ className = "" }: { className?: string }) => (
    <button
      type="button"
      onClick={() => setUse3DMode((v) => !v)}
      title={use3DMode ? "Switch to 2D widget" : "Switch to 3D avatar"}
      aria-label={use3DMode ? "Switch to 2D widget" : "Switch to 3D avatar"}
      className={`absolute z-20 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)]/80 px-2 py-1 text-[10px] font-semibold text-[var(--color-text-muted)] backdrop-blur-sm transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] ${className}`}
    >
      {use3DMode ? "2D" : "3D"}
    </button>
  );

  // Compact mode: used in notification popups — no drag, no mode toggle
  if (compact || overridePhraseKey) {
    return (
      <div
        className="relative w-full flex items-center justify-center p-2"
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

  if (embedded) {
    return (
      <div
        className="relative w-full h-full min-h-[290px]"
        role="region"
        aria-label="Signer preview"
      >
        <ModeToggle className="top-2 right-2" />
        {use3DMode ? (
          <HologramSigner3D pose={activePose} />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-3">
            <SignLanguageWidget
              phrase={phraseKey || "neutral"}
              motionPlan={widgetMotionPlan}
              replayNonce={signReplayNonce}
              className="w-full max-w-[220px]"
              stepDurationScale={hologram2dSlow ? HOLOGRAM_2D_DURATION_SCALE : 1}
              transitionDurationSec={hologram2dSlow ? 0.34 : 0.22}
            />
          </div>
        )}
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
            className="fixed right-4 bottom-40 z-[80] inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--color-brand)_40%,transparent)] bg-[color-mix(in_srgb,var(--color-brand)_80%,transparent)] px-3 py-2 text-xs font-semibold text-[var(--color-text-inverse)] shadow-lg backdrop-blur hover:bg-[var(--color-brand)]"
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
            <div className="absolute inset-x-0 bottom-24 flex items-end justify-center pointer-events-none">
              <div className="relative pointer-events-auto h-[50vh] max-h-[430px] min-h-[280px] w-[min(72vw,320px)]">
                <button
                  type="button"
                  onClick={() => setUse3DMode((v) => !v)}
                  className="absolute top-2 right-2 z-20 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)]/80 px-2 py-1 text-[10px] font-semibold text-[var(--color-text-muted)] backdrop-blur-sm hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]"
                >
                  {use3DMode ? "2D" : "3D"}
                </button>
                {use3DMode ? (
                  <HologramSigner3D pose={activePose} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-4">
                    <SignLanguageWidget
                      phrase={phraseKey || "neutral"}
                      motionPlan={widgetMotionPlan}
                      replayNonce={signReplayNonce}
                      className="w-full max-w-[240px]"
                    />
                  </div>
                )}
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
      className="fixed z-[60] cursor-grab active:cursor-grabbing select-none"
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
      {/* 3D / 2D toggle — top-right corner */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setUse3DMode((v) => !v);
        }}
        onPointerDown={(e) => e.stopPropagation()}
        title={use3DMode ? "Switch to 2D widget" : "Switch to 3D avatar"}
        aria-label={use3DMode ? "Switch to 2D widget" : "Switch to 3D avatar"}
        className="absolute top-2 right-2 z-20 cursor-pointer rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)]/80 px-2 py-1 text-[10px] font-semibold text-[var(--color-text-muted)] backdrop-blur-sm transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]"
      >
        {use3DMode ? "2D" : "3D"}
      </button>

      {use3DMode ? (
        <HologramSigner3D pose={activePose} />
      ) : (
        <div className="w-full h-full flex items-center justify-center p-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)]/70 backdrop-blur-sm">
          <SignLanguageWidget
            phrase={phraseKey || "neutral"}
            motionPlan={widgetMotionPlan}
            replayNonce={signReplayNonce}
            className="w-full"
          />
        </div>
      )}
    </div>
  );
}

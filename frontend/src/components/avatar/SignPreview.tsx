"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { useSessionStore } from "@/lib/state/sessionStore";
import { Button } from "@/components/common/Button";
import { clsx } from "clsx";
import { HologramPose, HologramSigner3D } from "@/components/avatar/HologramSigner3D";

interface SignPreviewProps {
  embedded?: boolean;
}

const SIGN_SEQUENCE_MAP: Record<string, HologramPose[]> = {
  hello: ["wave", "wave", "neutral"],
  "thank you": ["thank-you", "neutral"],
  "how are you": ["question", "question", "neutral"],
  yes: ["yes", "neutral"],
  no: ["no", "neutral"],
  please: ["please", "neutral"],
  help: ["help", "neutral"],
};

const POSE_LABELS: Record<HologramPose, string> = {
  neutral: "Neutral",
  wave: "Wave",
  "thank-you": "Thank you motion",
  yes: "Yes nod",
  no: "No shake",
  please: "Please motion",
  help: "Help motion",
  question: "How are you",
};

export function SignPreview({ embedded = false }: SignPreviewProps) {
  const { signPreview, setSignPreview } = useSessionStore();
  const hasPreview = Boolean(signPreview);
  const [stepIndex, setStepIndex] = useState(0);

  const phraseKey = signPreview?.phraseKey?.trim().toLowerCase() ?? "";
  const sequence = useMemo(() => {
    return SIGN_SEQUENCE_MAP[phraseKey] ?? ["neutral"];
  }, [phraseKey]);
  const activePose = sequence[stepIndex % sequence.length];

  useEffect(() => {
    setStepIndex(0);
  }, [phraseKey]);

  useEffect(() => {
    if (!hasPreview) return;
    const timer = window.setInterval(() => {
      setStepIndex((prev) => (prev + 1) % sequence.length);
    }, 900);
    return () => window.clearInterval(timer);
  }, [hasPreview, sequence.length]);

  if (!hasPreview && !embedded) return null;

  return (
    <div
      className={clsx(
        "rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl p-2",
        embedded
          ? "w-full h-full min-h-[280px]"
          : "fixed bottom-24 right-4 z-40 w-48"
      )}
      role="region"
      aria-label="Hologram sign preview"
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <span
          className="text-xs font-medium text-[var(--color-text-muted)] truncate"
          title={signPreview?.phraseKey ?? "Hologram signer"}
        >
          {signPreview?.phraseKey ?? "Hologram signer"}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="!p-1"
          onClick={() => setSignPreview(null)}
          disabled={!signPreview}
          aria-label="Close sign preview"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
      <div className="relative aspect-[4/5] w-full rounded-lg overflow-hidden bg-black/30 border border-[var(--color-border)]">
        {/* Hologram stage */}
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-transparent to-cyan-400/10" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-cyan-500/20 to-transparent" />

        {signPreview ? (
          <div className="relative h-full w-full flex flex-col items-center justify-center">
            <div className="absolute inset-0">
              <HologramSigner3D pose={activePose} />
            </div>

            <div className="mt-auto relative z-10 mb-2 text-[10px] tracking-wide uppercase text-cyan-200/90 bg-black/35 px-2 py-0.5 rounded">
              {POSE_LABELS[activePose]}
            </div>
            <div className="relative z-10 mb-2 flex items-center gap-1.5 bg-black/30 px-2 py-1 rounded-full">
              {sequence.map((_, idx) => (
                <span
                  key={`${phraseKey}-${idx}`}
                  className={clsx(
                    "h-1.5 rounded-full transition-all",
                    idx === stepIndex % sequence.length
                      ? "w-4 bg-cyan-300"
                      : "w-1.5 bg-cyan-300/35"
                  )}
                />
              ))}
            </div>
          </div>
        ) : (
          <p className="h-full w-full px-4 text-center text-xs text-[var(--color-text-muted)] flex items-center justify-center">
            Hologram signer will appear here when a supported phrase is detected.
          </p>
        )}
      </div>
    </div>
  );
}

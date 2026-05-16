"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import { getStoredToken, postCameraSentiment } from "@/lib/api/client";
import { useSessionStore } from "@/lib/state/sessionStore";
import {
  sentimentEmoji,
  SENTIMENT_CONFIDENCE_THRESHOLD,
} from "@/lib/sentiment/sentimentDisplay";

const CAPTURE_INTERVAL_MS = 2000;

interface CameraSentimentPanelProps {
  className?: string;
  compact?: boolean;
}

/** Optional webcam sentiment — periodic frames update the session store. */
export function CameraSentimentPanel({ className, compact }: CameraSentimentPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const busyRef = useRef(false);
  const captureRef = useRef<() => Promise<void>>(async () => {});

  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const sessionId = useSessionStore((s) => s.sessionId);
  const cameraSentiment = useSessionStore((s) => s.cameraSentiment);
  const setCameraSentiment = useSessionStore((s) => s.setCameraSentiment);

  const modelHint =
    cameraSentiment?.method?.startsWith("huggingface")
      ? "ViT (Hugging Face)"
      : cameraSentiment?.method?.includes("fallback")
        ? "Basic (ML unavailable)"
        : cameraSentiment?.method === "heuristic"
          ? "Heuristic"
          : null;

  const stopCamera = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    busyRef.current = false;
    setEnabled(false);
    setBusy(false);
    setLastUpdated(null);
    setCameraSentiment(null);
  }, [setCameraSentiment]);

  const captureAndAnalyze = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;
    if (busyRef.current) return;

    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return;

    busyRef.current = true;
    setBusy(true);
    setError(null);

    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 480 / Math.max(w, h));
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      busyRef.current = false;
      setBusy(false);
      return;
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.72);

    const token = getStoredToken();
    if (!token) {
      busyRef.current = false;
      setBusy(false);
      return;
    }

    try {
      const result = await postCameraSentiment(sessionId, dataUrl, token);
      const label = result.fused_label ?? result.label;
      const confidence = result.fused_confidence ?? result.confidence;
      setCameraSentiment({ label, confidence, method: result.method });
      setLastUpdated(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Camera analysis failed");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [sessionId, setCameraSentiment]);

  captureRef.current = captureAndAnalyze;

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play();
        await new Promise<void>((resolve) => {
          if (video.readyState >= 2) {
            resolve();
            return;
          }
          video.addEventListener("loadeddata", () => resolve(), { once: true });
        });
      }
      setEnabled(true);
      await captureRef.current();
      intervalRef.current = setInterval(() => {
        void captureRef.current();
      }, CAPTURE_INTERVAL_MS);
    } catch {
      setError("Camera permission denied or unavailable");
      stopCamera();
    }
  }, [stopCamera]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const emoji = sentimentEmoji(cameraSentiment?.label, cameraSentiment?.confidence);
  const showLabel =
    cameraSentiment &&
    (cameraSentiment.confidence ?? 0) >= SENTIMENT_CONFIDENCE_THRESHOLD;

  return (
    <section
      className={clsx(
        "flex flex-col gap-2 p-3 border-t border-[var(--color-border)] bg-[var(--color-surface)]",
        className
      )}
      aria-label="Camera sentiment"
    >
      <PanelHeader compact={compact} enabled={enabled} busy={busy} />

      <div className="relative rounded-xl overflow-hidden bg-[var(--color-bg-subtle)] aspect-video max-h-40">
        <video
          ref={videoRef}
          className={clsx(
            "w-full h-full object-cover",
            !enabled && "opacity-0 absolute inset-0 pointer-events-none"
          )}
          playsInline
          muted
          aria-hidden={!enabled}
        />
        {!enabled && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-[var(--color-text-muted)] px-4 text-center">
            Enable camera to detect expression sentiment
          </div>
        )}
        {busy && enabled && (
          <div className="absolute top-2 right-2 rounded-full bg-black/50 p-1.5">
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          </div>
        )}
      </div>

      {showLabel && cameraSentiment && (
        <p className="text-sm font-medium text-[var(--color-text-primary)] flex items-center gap-2">
          {emoji && (
            <span className="text-lg" aria-hidden>
              {emoji}
            </span>
          )}
          <span className="capitalize">{cameraSentiment.label}</span>
          <span className="text-xs text-[var(--color-text-muted)]">
            {Math.round((cameraSentiment.confidence ?? 0) * 100)}%
            {modelHint ? ` · ${modelHint}` : ""}
            {lastUpdated ? " · live" : ""}
          </span>
        </p>
      )}

      {cameraSentiment?.method?.includes("fallback") && (
        <p className="text-xs text-amber-600 dark:text-amber-400 px-1">
          ViT model failed to load. In backend run: pip install torch transformers
          opencv-python-headless — then restart the API.
        </p>
      )}

      {error && (
        <p className="text-xs text-red-500" role="alert">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={() => (enabled ? stopCamera() : void startCamera())}
        className={clsx(
          "flex items-center justify-center gap-2 rounded-xl py-2 text-sm font-semibold transition-colors",
          enabled
            ? "bg-[var(--color-bg-subtle)] text-[var(--color-text-primary)] border border-[var(--color-border)]"
            : "bg-[var(--color-accent)] text-white"
        )}
      >
        {enabled ? (
          <>
            <CameraOff className="w-4 h-4" />
            Stop camera
          </>
        ) : (
          <>
            <Camera className="w-4 h-4" />
            Enable camera sentiment
          </>
        )}
      </button>
    </section>
  );
}

function PanelHeader({
  compact,
  enabled,
  busy,
}: {
  compact?: boolean;
  enabled: boolean;
  busy: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h3
        className={clsx(
          "font-semibold text-[var(--color-text-primary)]",
          compact ? "text-xs" : "text-sm"
        )}
      >
        Camera sentiment
      </h3>
      <span className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">
        {enabled ? (busy ? "Analyzing…" : "Live") : "Off"}
      </span>
    </div>
  );
}
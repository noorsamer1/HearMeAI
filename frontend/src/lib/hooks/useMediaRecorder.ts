"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type RecordingState = "inactive" | "recording" | "error";

/** Minimum blob size before upload (aligned with backend chunk gate). */
export const MIN_AUDIO_BYTES = 1000;

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = () => reject(reader.error ?? new Error("read failed"));
    reader.readAsDataURL(blob);
  });
}

interface UseMediaRecorderOptions {
  /** Legacy streaming mode — not used for session mic (invalid WebM concat). */
  onChunk?: (base64: string, mimeType: string) => void;
  onStop?: (blob: Blob | null, mimeType: string, durationMs: number) => void;
  chunkIntervalMs?: number;
  silenceThreshold?: number;
  silenceTimeoutMs?: number;
}

interface UseMediaRecorderReturn {
  state: RecordingState;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
  volumeLevel: number;
  hasPermission: boolean | null;
}

export function useMediaRecorder({
  onChunk,
  onStop,
  chunkIntervalMs = 250,
  silenceThreshold = 0.01,
  silenceTimeoutMs = 2000,
}: UseMediaRecorderOptions = {}): UseMediaRecorderReturn {
  const [state, setState] = useState<RecordingState>("inactive");
  const [error, setError] = useState<string | null>(null);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mimeTypeRef = useRef<string>("audio/webm;codecs=opus");
  const recordingStartedAtRef = useRef<number>(0);

  const getSupportedMimeType = (): string => {
    const types = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/mp4",
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return "";
  };

  const measureVolume = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;

    const dataArray = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(dataArray);

    const rms = Math.sqrt(
      dataArray.reduce((sum, v) => sum + v * v, 0) / dataArray.length
    );
    setVolumeLevel(Math.min(1, rms * 5));

    if (rms < silenceThreshold) {
      if (!silenceTimerRef.current) {
        silenceTimerRef.current = setTimeout(() => {
          // Silence detected — caller can use this to auto-stop
        }, silenceTimeoutMs);
      }
    } else if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    animFrameRef.current = requestAnimationFrame(measureVolume);
  }, [silenceThreshold, silenceTimeoutMs]);

  const start = useCallback(async () => {
    try {
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });

      setHasPermission(true);
      streamRef.current = stream;

      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      mimeTypeRef.current = getSupportedMimeType();
      const recorder = new MediaRecorder(stream, {
        mimeType: mimeTypeRef.current || undefined,
      });

      const chunks: Blob[] = [];
      const streamingMode = Boolean(onChunk);

      recorder.ondataavailable = (e) => {
        if (e.data.size <= 0) return;
        try {
          if (streamingMode && onChunk) {
            void (async () => {
              try {
                const b64 = await blobToBase64(e.data);
                onChunk(b64, mimeTypeRef.current);
              } catch (chunkErr) {
                console.error("[MediaRecorder] chunk encode failed", chunkErr);
                setError("Recording failed");
                setState("error");
              }
            })();
          } else {
            chunks.push(e.data);
          }
        } catch (err) {
          console.error("[MediaRecorder] ondataavailable", err);
          setError("Recording failed");
          setState("error");
        }
      };

      recorder.onstop = () => {
        setVolumeLevel(0);
        setState("inactive");
        if (!onStop) return;

        const durationMs = Math.max(
          0,
          Date.now() - recordingStartedAtRef.current
        );
        const mime = mimeTypeRef.current || "audio/webm";

        if (streamingMode) {
          onStop(null, mime, durationMs);
          return;
        }

        const finalBlob = new Blob(chunks, { type: mime });
        if (process.env.NODE_ENV !== "production") {
          console.info("[MediaRecorder] final blob", {
            type: finalBlob.type,
            size: finalBlob.size,
            durationMs,
          });
        }

        if (finalBlob.size < MIN_AUDIO_BYTES) {
          onStop(null, mime, durationMs);
          return;
        }

        onStop(finalBlob, mime, durationMs);
      };

      recordingStartedAtRef.current = Date.now();
      recorder.start(chunkIntervalMs);
      mediaRecorderRef.current = recorder;
      setState("recording");

      animFrameRef.current = requestAnimationFrame(measureVolume);
    } catch (err) {
      const message =
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Microphone access denied. Please allow access in your browser settings."
          : "Could not access microphone.";
      setError(message);
      setHasPermission(false);
      setState("error");
    }
  }, [chunkIntervalMs, measureVolume, onChunk, onStop]);

  const stop = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (mediaRecorderRef.current?.state !== "inactive") {
      mediaRecorderRef.current?.stop();
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    analyserRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return { state, error, start, stop, volumeLevel, hasPermission };
}

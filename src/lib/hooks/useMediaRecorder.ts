"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type RecordingState = "inactive" | "recording" | "error";

interface UseMediaRecorderOptions {
  onChunk?: (base64: string, mimeType: string) => void;
  onStop?: (blob?: Blob) => void;  // blob is undefined in streaming (onChunk) mode
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

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
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

    const rms = Math.sqrt(dataArray.reduce((sum, v) => sum + v * v, 0) / dataArray.length);
    setVolumeLevel(Math.min(1, rms * 5));

    if (rms < silenceThreshold) {
      if (!silenceTimerRef.current) {
        silenceTimerRef.current = setTimeout(() => {
          // Silence detected — caller can use this to auto-stop
        }, silenceTimeoutMs);
      }
    } else {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
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

      // Set up analyser for volume visualization
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

      recorder.ondataavailable = async (e) => {
        if (e.data.size > 0) {
          if (onChunk) {
            const b64 = await blobToBase64(e.data);
            onChunk(b64, mimeTypeRef.current);
          } else {
            chunks.push(e.data);
          }
        }
      };

      recorder.onstop = () => {
        setVolumeLevel(0);
        setState("inactive");
        if (!onStop) return;
        if (chunks.length > 0) {
          // Batch mode: all audio collected locally, deliver as one blob
          onStop(new Blob(chunks, { type: mimeTypeRef.current }));
        } else {
          // Streaming mode: chunks were sent via onChunk in real time.
          // Call onStop with no blob so the caller can signal audio_end to the server.
          onStop(undefined);
        }
      };

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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface FetchOptions extends RequestInit {
  timeout?: number;
  /** Bearer token for authenticated API calls */
  token?: string | null;
}

function formatApiError(errorBody: { detail?: unknown; error?: string }, status: number): string {
  const d = errorBody.detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return d.map((x) => (typeof x === "object" && x && "msg" in x ? String((x as { msg: string }).msg) : String(x))).join("; ");
  if (d && typeof d === "object" && "msg" in d) return String((d as { msg: string }).msg);
  return errorBody.error || `Request failed: ${status}`;
}

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { timeout = 30_000, token, ...init } = options;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string>),
  };
  if (init.body && typeof init.body === "string" && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(formatApiError(errorBody, response.status));
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  } catch (err: unknown) {
    const isAbort =
      err instanceof DOMException
        ? err.name === "AbortError"
        : err instanceof Error && err.name === "AbortError";
    if (isAbort) {
      const seconds = Math.round(timeout / 1000);
      throw new Error(
        `Request timed out after ${seconds}s (no response from ${API_URL}). ` +
          "Usually the CORS preflight (OPTIONS) is stuck or the API is unreachable. " +
          "Confirm the backend is running, the URL matches NEXT_PUBLIC_API_URL, and " +
          "ALLOWED_ORIGINS includes your app origin (e.g. http://localhost:3000)."
      );
    }
    throw err;
  } finally {
    clearTimeout(id);
  }
}

const TOKEN_KEY = "hearme_access_token";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

// ── Speech-to-Text ────────────────────────────────────────────
export async function transcribeAudio(
  audioBlob: Blob,
  language = "auto"
): Promise<{
  text: string;
  confidence: number;
  detected_language: string;
  processing_time_ms: number;
}> {
  const form = new FormData();
  form.append("audio", audioBlob, "audio.webm");
  form.append("language", language);

  const response = await fetch(`${API_URL}/api/v1/speech-to-text`, {
    method: "POST",
    body: form,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Transcription failed");
  }

  return response.json();
}

// ── Text-to-Speech ────────────────────────────────────────────
export async function synthesizeSpeech(
  text: string,
  language = "en",
  voice?: string,
  speed = 1.0
): Promise<{ audio_base64: string; duration_estimate_seconds: number; voice_used: string }> {
  return apiFetch("/api/v1/text-to-speech", {
    method: "POST",
    body: JSON.stringify({ text, language, voice, speed }),
  });
}

// ── AI Action (non-streaming) ─────────────────────────────────
export async function runAction(
  text: string,
  action: "simplify" | "clarify" | "translate",
  targetLanguage?: string
): Promise<{ original_text: string; result_text: string; action: string }> {
  return apiFetch("/api/v1/action", {
    method: "POST",
    body: JSON.stringify({ text, action, target_language: targetLanguage }),
  });
}

// ── Health check ──────────────────────────────────────────────
export async function checkHealth(): Promise<{ status: string; version: string }> {
  return apiFetch("/api/v1/health");
}

// ── Sign Language Translation ─────────────────────────────────
export async function signTranslate(
  signs: string[],
  language: "en" | "ar" = "en",
  token?: string | null
): Promise<{ text: string; processing_time_ms: number }> {
  return apiFetch("/api/v1/sign-translate", {
    method: "POST",
    body: JSON.stringify({ signs, language }),
    token,
  });
}

export type CameraSentimentResult = {
  label: string;
  confidence: number;
  method: string;
  fused_label: string | null;
  fused_confidence: number | null;
};

/** Analyze a webcam frame for facial sentiment (optional fusion with text sentiment). */
export async function postCameraSentiment(
  sessionId: string,
  imageBase64: string,
  token: string | null,
  options?: { textLabel?: string; textConfidence?: number }
): Promise<CameraSentimentResult> {
  return apiFetch(`/api/v1/sessions/${sessionId}/camera-sentiment`, {
    method: "POST",
    body: JSON.stringify({
      image_base64: imageBase64,
      text_label: options?.textLabel ?? null,
      text_confidence: options?.textConfidence ?? null,
    }),
    token,
    // First ViT load can take 30–60s on CPU while weights download.
    timeout: 90_000,
  });
}

// ── Base64 audio → Blob ───────────────────────────────────────
export function base64ToAudioUrl(base64: string, mimeType = "audio/mpeg"): string {
  try {
    const binaryStr = atob(base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    // Auto-detect container so fallback TTS (WAV) still plays correctly.
    const looksLikeWav =
      bytes.length >= 12 &&
      bytes[0] === 0x52 && // R
      bytes[1] === 0x49 && // I
      bytes[2] === 0x46 && // F
      bytes[3] === 0x46 && // F
      bytes[8] === 0x57 && // W
      bytes[9] === 0x41 && // A
      bytes[10] === 0x56 && // V
      bytes[11] === 0x45; // E
    const resolvedMime = looksLikeWav ? "audio/wav" : mimeType;
    const blob = new Blob([bytes], { type: resolvedMime });
    return URL.createObjectURL(blob);
  } catch {
    return "";
  }
}

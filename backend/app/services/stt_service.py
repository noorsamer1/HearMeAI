"""
Speech-to-Text service.

Supports three providers (set STT_PROVIDER in .env):

  openrouter        (default)
    Uses OpenRouter + OPENROUTER_API_KEY.
    Calls the /audio/transcriptions endpoint with Whisper.
    STT_MODEL=openai/whisper-1

  gpt-audio-mini
    Uses OpenRouter + OPENROUTER_API_KEY.
    Calls /chat/completions with audio input modality.
    Same model handles STT, TTS, and LLM — one key for everything.
    STT_MODEL is ignored; model is always openai/gpt-audio-mini.

  openai
    Calls OpenAI directly with OPENAI_API_KEY.
    Uses the /audio/transcriptions Whisper endpoint.
"""

import asyncio
import base64
import io
import subprocess
import time
from dataclasses import dataclass

import imageio_ffmpeg
from openai import AsyncOpenAI

from app.core.config import get_settings
from app.core.logging_config import get_logger
from app.core.metrics import metrics

logger = get_logger(__name__)
settings = get_settings()


@dataclass
class TranscriptResult:
    text: str
    confidence: float
    detected_language: str
    segments: list[dict]
    processing_time_ms: int


class STTService:
    def __init__(self) -> None:
        self._client: AsyncOpenAI | None = None
        self._ffmpeg_ready = False

    def _get_client(self) -> AsyncOpenAI:
        if self._client is None:
            api_key = settings.stt_api_key
            base_url = settings.stt_base_url

            if not api_key:
                key_var = "OPENAI_API_KEY" if settings.stt_provider == "openai" else "OPENROUTER_API_KEY"
                raise ValueError(f"{key_var} is required for STT_PROVIDER={settings.stt_provider}")

            self._client = AsyncOpenAI(
                api_key=api_key,
                base_url=base_url,
                timeout=45.0,
                max_retries=2,
            )
            logger.info(
                "STT client ready",
                provider=settings.stt_provider,
                model=settings.stt_model_name,
            )
        return self._client

    async def transcribe(
        self,
        audio_data: bytes,
        language_hint: str | None = None,
        mime_type: str = "audio/webm",
    ) -> TranscriptResult:
        """Transcribe audio bytes to text using the configured provider."""
        if settings.stt_provider == "gpt-audio-mini":
            return await self._transcribe_via_chat(audio_data, language_hint, mime_type)
        return await self._transcribe_via_whisper(audio_data, language_hint, mime_type)

    async def transcribe_chunk(
        self,
        audio_bytes: bytes,
        language: str = "auto",
        mime_type: str = "audio/webm",
    ) -> "TranscriptResult | None":
        """Transcribe a partial audio chunk for real-time interim results.

        Skips chunks shorter than 1 000 bytes and applies a 30-second
        hard timeout so a slow STT provider cannot block the WebSocket.

        Args:
            audio_bytes: Raw audio data to transcribe.
            language: ISO language code or `"auto"` for auto-detection.
            mime_type: MIME type of the audio data.

        Returns:
            A TranscriptResult on success, or None when the chunk is
            too short or transcription times out.
        """
        if len(audio_bytes) < 1000:
            return None

        lang_hint: str | None = None if language in (None, "auto") else language
        try:
            return await asyncio.wait_for(
                self.transcribe(
                    audio_data=audio_bytes,
                    language_hint=lang_hint,
                    mime_type=mime_type,
                ),
                timeout=30.0,
            )
        except asyncio.TimeoutError:
            logger.warning("STT chunk transcription timed out", mime_type=mime_type)
            return None
        except Exception as exc:
            logger.error("STT chunk transcription failed", error=str(exc))
            return None

    # ── Whisper endpoint (openrouter / openai) ───────────────

    def _prepare_audio_for_whisper(
        self, audio_data: bytes, mime_type: str
    ) -> tuple[bytes, str]:
        """Transcode browser webm/opus to wav when needed — Whisper rejects many webm blobs."""
        normalized = self._normalize_mime_type(mime_type)
        if normalized in ("audio/wav", "audio/mpeg", "audio/mp3"):
            ext = self._mime_to_extension(normalized)
            return audio_data, ext
        converted, out_mime = self._convert_audio_for_gpt(audio_data, normalized)
        if out_mime == "audio/wav":
            return converted, "wav"
        return audio_data, self._mime_to_extension(normalized)

    async def _transcribe_via_whisper(
        self,
        audio_data: bytes,
        language_hint: str | None,
        mime_type: str,
    ) -> TranscriptResult:
        start = time.perf_counter()
        client = self._get_client()

        audio_data, ext = self._prepare_audio_for_whisper(audio_data, mime_type)

        try:
            response = await self._request_whisper_transcription(
                client=client,
                model=settings.stt_model_name,
                audio_data=audio_data,
                ext=ext,
                language_hint=language_hint,
            )
        except Exception as exc:
            # OpenRouter Whisper occasionally returns upstream 5xx pages.
            # Try a different transcription model first, then chat fallback only if
            # the incoming audio format is compatible with chat input_audio.
            status_code = self._extract_status_code(exc)
            if settings.stt_provider == "openrouter" and status_code is not None and status_code >= 500:
                logger.warning(
                    "Whisper upstream failed; trying STT fallbacks",
                    provider=settings.stt_provider,
                    status_code=status_code,
                )
                whisper_fallbacks = [
                    "openai/gpt-4o-mini-transcribe",
                    "openai/whisper-1",
                ]
                for fallback_model in whisper_fallbacks:
                    if settings.stt_model_name == fallback_model:
                        continue
                    try:
                        fallback_response = await self._request_whisper_transcription(
                            client=client,
                            model=fallback_model,
                            audio_data=audio_data,
                            ext=ext,
                            language_hint=language_hint,
                        )
                        elapsed_ms = int((time.perf_counter() - start) * 1000)
                        metrics.record("stt", elapsed_ms, success=True)
                        logger.info(
                            "STT fallback complete",
                            provider=settings.stt_provider,
                            model=fallback_model,
                            chars=len(fallback_response.text),
                            lang=fallback_response.language,
                            elapsed_ms=elapsed_ms,
                        )
                        return self._build_whisper_result(fallback_response, elapsed_ms)
                    except Exception as fallback_exc:
                        logger.warning(
                            "Whisper fallback model failed",
                            model=fallback_model,
                            error=str(fallback_exc),
                        )

                chat_result = await self._try_chat_transcription_fallback(
                    audio_data, language_hint, mime_type, prepared_ext=ext
                )
                if chat_result is not None:
                    return chat_result

                logger.error(
                    "All STT fallbacks exhausted (Whisper upstream + chat audio)",
                    mime_type=mime_type,
                    prepared_ext=ext,
                )

            elapsed_ms = int((time.perf_counter() - start) * 1000)
            metrics.record("stt", elapsed_ms, success=False)
            logger.error("Whisper STT failed", provider=settings.stt_provider, error=str(exc))
            raise

        elapsed_ms = int((time.perf_counter() - start) * 1000)
        metrics.record("stt", elapsed_ms, success=True)

        logger.info("STT complete", provider=settings.stt_provider,
                    chars=len(response.text), lang=response.language, elapsed_ms=elapsed_ms)
        return self._build_whisper_result(response, elapsed_ms)

    # ── gpt-audio-mini chat completions path ─────────────────

    async def _try_chat_transcription_fallback(
        self,
        audio_data: bytes,
        language_hint: str | None,
        mime_type: str,
        *,
        prepared_ext: str,
    ) -> TranscriptResult | None:
        """
        Last-resort STT via gpt-audio-mini when Whisper endpoints return 5xx.

        Uses WAV bytes already prepared for Whisper when available; otherwise
        transcodes browser webm/opus so we are not blocked by MIME checks on the
        original Content-Type string (e.g. audio/webm;codecs=opus).
        """
        chat_audio = audio_data
        if prepared_ext == "wav":
            chat_mime = "audio/wav"
        else:
            chat_mime = self._normalize_mime_type(mime_type)
            if not self._mime_to_gpt_audio_format(chat_mime):
                chat_audio, chat_mime = self._convert_audio_for_gpt(chat_audio, chat_mime)

        if not self._mime_to_gpt_audio_format(chat_mime):
            logger.warning(
                "Chat STT fallback skipped — could not produce wav/mp3",
                mime_type=mime_type,
                prepared_ext=prepared_ext,
            )
            return None

        try:
            logger.info(
                "Trying gpt-audio-mini chat STT after Whisper failure",
                chat_mime=chat_mime,
            )
            return await self._transcribe_via_chat(
                chat_audio, language_hint, chat_mime
            )
        except Exception as chat_exc:
            logger.warning("Chat STT fallback failed", error=str(chat_exc))
            return None

    async def _transcribe_via_chat(
        self,
        audio_data: bytes,
        language_hint: str | None,
        mime_type: str,
    ) -> TranscriptResult:
        """
        Send audio as base64 to gpt-audio-mini via the chat completions API.
        The model transcribes and returns text only (prompted to avoid commentary).
        """
        start = time.perf_counter()
        client = self._get_client()

        normalized_mime = self._normalize_mime_type(mime_type)
        fmt = self._mime_to_gpt_audio_format(normalized_mime)
        if not fmt:
            audio_data, normalized_mime = self._convert_audio_for_gpt(audio_data, normalized_mime)
            fmt = self._mime_to_gpt_audio_format(normalized_mime)
        if not fmt:
            raise ValueError(
                f"gpt-audio-mini input_audio does not support mime '{mime_type}'. "
                "Supported formats are audio/wav and audio/mpeg."
            )
        audio_b64 = base64.b64encode(audio_data).decode("utf-8")

        lang_instruction = (
            f" The audio is in {language_hint}." if language_hint and language_hint != "auto" else ""
        )

        try:
            response = await client.chat.completions.create(
                model="openai/gpt-audio-mini",
                modalities=["text"],   # text-only output — we just want the transcript
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are a precise transcription assistant. "
                            "When given audio, output ONLY the verbatim transcription. "
                            "No commentary, no punctuation corrections, no explanations."
                        ),
                    },
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "input_audio",
                                "input_audio": {"data": audio_b64, "format": fmt},
                            },
                            {
                                "type": "text",
                                "text": f"Transcribe this audio verbatim.{lang_instruction}",
                            },
                        ],
                    },
                ],
                temperature=0,
                max_tokens=1024,
            )
        except Exception as exc:
            elapsed_ms = int((time.perf_counter() - start) * 1000)
            metrics.record("stt", elapsed_ms, success=False)
            logger.error("gpt-audio-mini STT failed", error=str(exc))
            raise

        elapsed_ms = int((time.perf_counter() - start) * 1000)
        metrics.record("stt", elapsed_ms, success=True)

        transcript = response.choices[0].message.content or ""

        # Attempt to detect language from the transcript text
        detected_lang = language_hint if language_hint and language_hint != "auto" else "unknown"

        logger.info("gpt-audio-mini STT complete", chars=len(transcript), elapsed_ms=elapsed_ms)

        return TranscriptResult(
            text=transcript.strip(),
            confidence=0.93,
            detected_language=detected_lang,
            segments=[],
            processing_time_ms=elapsed_ms,
        )

    @staticmethod
    def _mime_to_extension(mime_type: str) -> str:
        normalized = STTService._normalize_mime_type(mime_type)
        return {
            "audio/webm": "webm",
            "audio/ogg": "ogg",
            "audio/mp4": "mp4",
            "audio/wav": "wav",
            "audio/mpeg": "mp3",
            "audio/flac": "flac",
        }.get(normalized, "webm")

    @staticmethod
    def _mime_to_gpt_audio_format(mime_type: str) -> str | None:
        normalized = STTService._normalize_mime_type(mime_type)
        return {
            "audio/wav": "wav",
            "audio/mpeg": "mp3",
        }.get(normalized)

    @staticmethod
    def _normalize_mime_type(mime_type: str) -> str:
        return (mime_type or "").split(";", 1)[0].strip().lower()

    def _convert_audio_for_gpt(self, audio_data: bytes, mime_type: str) -> tuple[bytes, str]:
        # gpt-audio-mini chat input only accepts wav/mp3.
        # Browser MediaRecorder sends webm/opus, so we transcode to wav on server.
        supported_input = {"audio/webm", "audio/ogg", "audio/mp4", "audio/flac"}
        if mime_type not in supported_input:
            return audio_data, mime_type

        ffmpeg_exe = self._ensure_ffmpeg_ready()
        input_format = self._mime_to_extension(mime_type)
        try:
            cmd = [
                ffmpeg_exe,
                "-nostdin",
                "-hide_banner",
                "-loglevel",
                "error",
                "-f",
                input_format,
                "-i",
                "pipe:0",
                "-f",
                "wav",
                "-acodec",
                "pcm_s16le",
                "pipe:1",
            ]
            proc = subprocess.run(cmd, input=audio_data, capture_output=True, check=False)
            if proc.returncode != 0:
                raise RuntimeError(proc.stderr.decode("utf-8", errors="ignore").strip() or "ffmpeg failed")
            out_bytes = proc.stdout
            if not out_bytes:
                raise RuntimeError("ffmpeg produced empty output")
            logger.info("Converted audio for gpt-audio-mini", source_mime=mime_type, target_mime="audio/wav")
            return out_bytes, "audio/wav"
        except Exception as exc:
            logger.warning("Audio conversion for gpt-audio-mini failed", source_mime=mime_type, error=str(exc))
            return audio_data, mime_type

    def _ensure_ffmpeg_ready(self) -> str:
        if self._ffmpeg_ready:
            return imageio_ffmpeg.get_ffmpeg_exe()
        self._ffmpeg_ready = True
        return imageio_ffmpeg.get_ffmpeg_exe()

    async def _request_whisper_transcription(
        self,
        client: AsyncOpenAI,
        model: str,
        audio_data: bytes,
        ext: str,
        language_hint: str | None,
    ):
        audio_file = io.BytesIO(audio_data)
        audio_file.name = f"audio.{ext}"
        return await client.audio.transcriptions.create(
            model=model,
            file=audio_file,
            language=language_hint if language_hint and language_hint != "auto" else None,
            response_format="verbose_json",
            timestamp_granularities=["segment"],
        )

    @staticmethod
    def _build_whisper_result(response, elapsed_ms: int) -> TranscriptResult:
        segments = []
        if hasattr(response, "segments") and response.segments:
            segments = [{"start": s.start, "end": s.end, "text": s.text} for s in response.segments]

        return TranscriptResult(
            text=response.text.strip(),
            confidence=0.92 if segments else 0.85,
            detected_language=response.language or "unknown",
            segments=segments,
            processing_time_ms=elapsed_ms,
        )

    @staticmethod
    def _extract_status_code(exc: Exception) -> int | None:
        code = getattr(exc, "status_code", None)
        if isinstance(code, int):
            return code
        response = getattr(exc, "response", None)
        response_code = getattr(response, "status_code", None)
        return response_code if isinstance(response_code, int) else None


_stt_service: STTService | None = None


def get_stt_service() -> STTService:
    global _stt_service
    if _stt_service is None:
        _stt_service = STTService()
    return _stt_service

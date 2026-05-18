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
import time
from dataclasses import dataclass

from openai import AsyncOpenAI

from app.core.config import get_settings
from app.core.logging_config import get_logger
from app.core.metrics import metrics
from app.services.audio_convert import (
    AudioConversionError,
    MIN_AUDIO_BYTES,
    convert_to_wav,
    normalize_mime_type,
)

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

    def _get_client(self) -> AsyncOpenAI:
        if self._client is None:
            api_key = settings.stt_api_key
            base_url = settings.stt_base_url

            if not api_key:
                key_var = (
                    "OPENAI_API_KEY"
                    if settings.stt_provider == "openai"
                    else "OPENROUTER_API_KEY"
                )
                raise ValueError(
                    f"{key_var} is required for STT_PROVIDER={settings.stt_provider}"
                )

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
        if len(audio_data) < MIN_AUDIO_BYTES:
            raise AudioConversionError("Audio data is too short or empty")

        normalized_mime = normalize_mime_type(mime_type)
        if settings.stt_provider == "gpt-audio-mini":
            return await self._transcribe_via_chat(
                audio_data, language_hint, normalized_mime
            )
        return await self._transcribe_via_whisper(
            audio_data, language_hint, normalized_mime
        )

    async def transcribe_chunk(
        self,
        audio_bytes: bytes,
        language: str = "auto",
        mime_type: str = "audio/webm",
    ) -> "TranscriptResult | None":
        """Transcribe a partial audio chunk for real-time interim results."""
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

    async def _prepare_audio_for_stt(
        self, audio_data: bytes, mime_type: str
    ) -> tuple[bytes, str]:
        """Transcode browser webm/opus to wav when needed."""
        normalized = normalize_mime_type(mime_type)
        if self._mime_to_gpt_audio_format(normalized):
            ext = self._mime_to_extension(normalized)
            return audio_data, ext
        wav_bytes, out_mime = await convert_to_wav(audio_data, normalized)
        if out_mime == "audio/wav":
            return wav_bytes, "wav"
        raise AudioConversionError(
            f"Could not prepare audio for STT from mime '{mime_type}'"
        )

    async def _transcribe_via_whisper(
        self,
        audio_data: bytes,
        language_hint: str | None,
        mime_type: str,
    ) -> TranscriptResult:
        start = time.perf_counter()
        client = self._get_client()

        audio_data, ext = await self._prepare_audio_for_stt(audio_data, mime_type)

        try:
            response = await self._request_whisper_transcription(
                client=client,
                model=settings.stt_model_name,
                audio_data=audio_data,
                ext=ext,
                language_hint=language_hint,
            )
        except Exception as exc:
            status_code = self._extract_status_code(exc)
            if (
                settings.stt_provider == "openrouter"
                and status_code is not None
                and status_code >= 500
            ):
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
                        return self._build_whisper_result(
                            fallback_response, elapsed_ms
                        )
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
            logger.error(
                "Whisper STT failed", provider=settings.stt_provider, error=str(exc)
            )
            raise

        elapsed_ms = int((time.perf_counter() - start) * 1000)
        metrics.record("stt", elapsed_ms, success=True)

        logger.info(
            "STT complete",
            provider=settings.stt_provider,
            chars=len(response.text),
            lang=response.language,
            elapsed_ms=elapsed_ms,
        )
        return self._build_whisper_result(response, elapsed_ms)

    async def _try_chat_transcription_fallback(
        self,
        audio_data: bytes,
        language_hint: str | None,
        mime_type: str,
        *,
        prepared_ext: str,
    ) -> TranscriptResult | None:
        """Last-resort STT via gpt-audio-mini when Whisper endpoints return 5xx."""
        chat_audio = audio_data
        if prepared_ext == "wav":
            chat_mime = "audio/wav"
        else:
            chat_mime = normalize_mime_type(mime_type)
            if not self._mime_to_gpt_audio_format(chat_mime):
                try:
                    chat_audio, chat_mime = await convert_to_wav(
                        chat_audio, chat_mime
                    )
                except AudioConversionError as exc:
                    logger.warning(
                        "Chat STT fallback skipped — transcode failed",
                        error=str(exc),
                    )
                    return None

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
        """Send audio as base64 to gpt-audio-mini via chat completions."""
        start = time.perf_counter()
        client = self._get_client()

        normalized_mime = normalize_mime_type(mime_type)
        fmt = self._mime_to_gpt_audio_format(normalized_mime)
        if not fmt:
            audio_data, normalized_mime = await convert_to_wav(audio_data, normalized_mime)
            fmt = self._mime_to_gpt_audio_format(normalized_mime)
        if not fmt:
            raise AudioConversionError(
                f"gpt-audio-mini requires wav/mp3; could not convert '{mime_type}'"
            )
        audio_b64 = base64.b64encode(audio_data).decode("utf-8")

        lang_instruction = (
            f" The audio is in {language_hint}."
            if language_hint and language_hint != "auto"
            else ""
        )

        try:
            response = await client.chat.completions.create(
                model="openai/gpt-audio-mini",
                modalities=["text"],
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
        detected_lang = (
            language_hint if language_hint and language_hint != "auto" else "unknown"
        )

        logger.info(
            "gpt-audio-mini STT complete", chars=len(transcript), elapsed_ms=elapsed_ms
        )

        return TranscriptResult(
            text=transcript.strip(),
            confidence=0.93,
            detected_language=detected_lang,
            segments=[],
            processing_time_ms=elapsed_ms,
        )

    @staticmethod
    def _mime_to_extension(mime_type: str) -> str:
        normalized = normalize_mime_type(mime_type)
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
        normalized = normalize_mime_type(mime_type)
        return {
            "audio/wav": "wav",
            "audio/mpeg": "mp3",
        }.get(normalized)

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
            segments = [
                {"start": s.start, "end": s.end, "text": s.text}
                for s in response.segments
            ]

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

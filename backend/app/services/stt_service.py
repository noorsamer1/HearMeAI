"""
Speech-to-Text service.

Supports three providers (set STT_PROVIDER in .env):

  openrouter        (default)
    Uses OpenRouter + OPENROUTER_API_KEY.
    POST /audio/transcriptions with JSON input_audio (base64), not multipart.
    STT_MODEL=openai/whisper-large-v3-turbo (or openai/whisper-1)

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
import re
import time
from dataclasses import dataclass, field

import httpx
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
from app.services.language_detector import ARABIC_PATTERN, detect_language

logger = get_logger(__name__)
settings = get_settings()

# Model refusals / chat replies — must never appear as peer transcripts.
_STT_REFUSAL_MARKERS: tuple[str, ...] = (
    "provide the audio file",
    "provide an audio file",
    "provide the audio or link",
    "can't transcribe",
    "cannot transcribe",
    "unable to transcribe",
    "i'll transcribe it verbatim",
    "i will transcribe it verbatim",
    "please provide the audio",
    "if you have an english audio",
    "languages other than english",
    "upload the audio",
    "send me the audio",
)


def normalize_language_hint(language_hint: str | None) -> str | None:
    """Map UI/profile hints to Whisper language codes (en, ar) or None for auto."""
    if language_hint is None:
        return None
    raw = str(language_hint).strip().lower()
    if raw in ("", "auto"):
        return None
    if raw.startswith("ar"):
        return "ar"
    if raw.startswith("en"):
        return "en"
    return raw[:2] if len(raw) >= 2 else None


def stt_transcription_prompt() -> str:
    """Whisper prompt for vocabulary biasing (not translation)."""
    custom = (settings.stt_prompt or "").strip()
    return custom if custom else _DEFAULT_STT_PROMPT


def _looks_clear_english_transcript(text: str) -> bool:
    """True when Latin text is plausibly real English (do not force Arabic STT)."""
    cleaned = text.strip()
    if not cleaned or ARABIC_PATTERN.search(cleaned):
        return False
    if _looks_foreign_latin_not_english(cleaned):
        return False
    if _english_word_hits(cleaned) < 1:
        return False
    detected, confidence = detect_language(cleaned)
    if detected != "en" or confidence < 0.55:
        return False
    words = re.findall(r"[a-zA-Z']+", cleaned)
    if len(words) < 2:
        return False
    if _ROMANIZED_ARABIC_LATIN.search(cleaned):
        return False
    return True


def _looks_romanized_arabic_latin(text: str) -> bool:
    """Arabic spoken but written in Latin letters (kifak, shu akhbarak)."""
    cleaned = text.strip()
    if not cleaned or ARABIC_PATTERN.search(cleaned):
        return False
    return bool(_ROMANIZED_ARABIC_LATIN.search(cleaned))


def _arabic_dialect_quality_score(text: str) -> int:
    """Higher = more likely correct Arabic (not phonetic mis-hear)."""
    if not text.strip():
        return 0
    score = 0
    for marker in _ARABIC_QUALITY_MARKERS:
        if marker in text:
            score += 2
    return score


def _arabic_transcript_quality_rank(text: str) -> int:
    """Rank transcripts so refine can pick the better Arabic pass."""
    rank = _arabic_dialect_quality_score(text)
    if "شو" in text:
        rank += 4
    if "اخبار" in text or "أخبار" in text:
        rank += 4
    if "شوف" in text and "شو" not in text:
        rank -= 3
    if re.search(r"أورا|اورا|أكبار[^ي]|اكبار[^ي]", text):
        rank -= 3
    return rank


def _arabic_has_common_mishear(text: str) -> bool:
    """Turbo often writes شوف/أورا instead of شو/أخبارك."""
    if "شوف" in text and "شو" not in text:
        return True
    if re.search(r"أورا|اورا", text):
        return True
    if re.search(r"أ?كبار[^ي]|اكبار[^ي]", text) and "اخبار" not in text and "أخبار" not in text:
        return True
    return False


def _arabic_transcript_needs_refine(text: str, primary_model: str) -> bool:
    """Whether to run a second STT model for dialect Arabic."""
    cleaned = text.strip()
    if not cleaned or not ARABIC_PATTERN.search(cleaned):
        return False
    if _arabic_has_common_mishear(cleaned):
        return True
    if "turbo" in primary_model.lower():
        return True
    if ("كيف" in cleaned or "حال" in cleaned) and len(cleaned) > 12:
        if "شو" not in cleaned and "اخبار" not in cleaned and "أخبار" not in cleaned:
            return True
    return _arabic_dialect_quality_score(cleaned) < 4 and len(cleaned) >= 12


_ICELANDIC_LATIN_MARKERS = frozenset(
    {
        "halló",
        "hvað",
        "hvad",
        "ég",
        "eg",
        "var",
        "það",
        "thað",
        "já",
        "ja",
        "nei",
        "gefð",
        "gefd",
        "hællag",
        "haellag",
        "sættag",
        "saettag",
        "sæhti",
        "saehti",
        "alen",
    }
)

_COMMON_ENGLISH_WORDS = frozenset(
    {
        "a",
        "an",
        "the",
        "i",
        "you",
        "we",
        "they",
        "is",
        "are",
        "was",
        "am",
        "my",
        "your",
        "name",
        "hello",
        "hi",
        "hey",
        "how",
        "what",
        "thank",
        "thanks",
        "yes",
        "no",
        "please",
        "good",
        "fine",
        "well",
        "and",
        "to",
        "of",
        "in",
        "it",
    }
)


def is_probable_stt_hallucination(text: str) -> bool:
    """
    True when Whisper output is likely gibberish (Icelandic drift, phonetic noise).

    Good Arabic/English transcripts must never match this.
    """
    cleaned = text.strip()
    if not cleaned:
        return False
    if ARABIC_PATTERN.search(cleaned):
        if _arabic_has_common_mishear(cleaned):
            return False
        if _arabic_transcript_quality_rank(cleaned) >= 6:
            return False
        return False
    if _looks_clear_english_transcript(cleaned):
        return False
    if _looks_foreign_latin_not_english(cleaned):
        return True
    if _looks_romanized_arabic_latin(cleaned):
        return False

    tokens = [
        re.sub(r"[^\w']", "", word.lower())
        for word in cleaned.split()
        if re.sub(r"[^\w']", "", word)
    ]
    if not tokens:
        return True

    english_hits = sum(1 for token in tokens if token in _COMMON_ENGLISH_WORDS)
    if len(tokens) >= 2 and english_hits == 0:
        weird_chars = len(re.findall(r"[^a-zA-Z\s.,!?'\-]", cleaned))
        if weird_chars >= 1:
            return True
        if len(tokens) <= 4 and all(len(token) <= 6 for token in tokens):
            return True

    if english_hits == 0 and re.search(r"[^a-zA-Z\s.,!?'\-]{1}", cleaned):
        return True
    return False


def _english_word_hits(text: str) -> int:
    """Count common English words in Latin text."""
    tokens = [
        re.sub(r"[^\w']", "", word.lower())
        for word in text.split()
        if re.sub(r"[^\w']", "", word)
    ]
    return sum(1 for token in tokens if token in _COMMON_ENGLISH_WORDS)


def _looks_foreign_latin_not_english(text: str) -> bool:
    """Whisper auto sometimes picks Icelandic/Danish for English audio."""
    cleaned = text.strip()
    if not cleaned or ARABIC_PATTERN.search(cleaned):
        return False
    if re.search(r"[ðþæøåäöü]", cleaned, re.IGNORECASE):
        return True
    tokens = {re.sub(r"[^\w']", "", w.lower()) for w in cleaned.split()}
    hits = len(tokens & _ICELANDIC_LATIN_MARKERS)
    if hits >= 1 and _english_word_hits(cleaned) == 0:
        return True
    return hits >= 2


def is_stt_refusal_text(text: str) -> bool:
    """True when the model returned instructions instead of a verbatim transcript."""
    lower = text.lower().strip()
    if not lower:
        return False
    return any(marker in lower for marker in _STT_REFUSAL_MARKERS)


@dataclass
class TranscriptResult:
    text: str
    confidence: float
    detected_language: str
    segments: list[dict]
    processing_time_ms: int


@dataclass
class _WhisperTranscriptionResponse:
    """Normalized Whisper/OpenRouter STT payload for _build_whisper_result."""

    text: str
    language: str | None = None
    segments: list | None = field(default=None)


_OPENROUTER_STT_FORMATS = frozenset(
    {"wav", "mp3", "flac", "m4a", "ogg", "webm", "aac", "mp4"}
)

_OPENROUTER_WHISPER_FALLBACKS: tuple[str, ...] = (
    "openai/whisper-large-v3-turbo",
    "openai/gpt-4o-mini-transcribe",
    "openai/whisper-1",
)

# Bias Whisper toward common Arabic/English phrases (dialect words like شو, كيف).
_DEFAULT_STT_PROMPT = (
    "كيف حالك، شو أخبارك، مرحبا، أهلا، السلام عليكم. "
    "Hello, how are you, my name is. Verbatim transcript only."
)

# Latin letters that often mean Arabic was mis-transcribed as English.
_ROMANIZED_ARABIC_LATIN = re.compile(
    r"(?i)\b(kif|kef|keef|kifak|shu|sho|ahlan|marhaba|yalla|habibi|"
    r"akhbar|akhbarak|halak|halik|shuakhbar|wallah|yani)\b"
)

# High-signal dialect / MSA words — low score ⇒ likely phonetic garbage.
_ARABIC_QUALITY_MARKERS = (
    "كيف",
    "حال",
    "أخبار",
    "اخبار",
    "شو",
    "مرحب",
    "أهلا",
    "اهلا",
    "السلام",
    "اسم",
    "شكر",
)


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
        lang = normalize_language_hint(language_hint)
        # gpt-audio-mini often replies in English instead of transcribing Arabic audio.
        use_whisper = settings.stt_provider != "gpt-audio-mini"
        if settings.stt_provider == "gpt-audio-mini" and lang in (None, "ar"):
            use_whisper = True

        if use_whisper:
            result = await self._transcribe_via_whisper(
                audio_data, lang, normalized_mime
            )
        else:
            result = await self._transcribe_via_chat(
                audio_data, lang or "en", normalized_mime
            )

        if is_stt_refusal_text(result.text):
            raise AudioConversionError(
                "Speech was not recognized. Speak clearly for 2–5 seconds and try again."
            )
        return result

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
                whisper_fallbacks = list(_OPENROUTER_WHISPER_FALLBACKS)
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

        response = await self._refine_auto_transcript(
            client=client,
            audio_data=audio_data,
            ext=ext,
            language_hint=language_hint,
            first=response,
        )

        if is_probable_stt_hallucination(response.text):
            logger.warning(
                "STT hallucination detected; attempting recovery",
                preview=response.text[:80],
            )
            response = await self._recover_hallucinated_transcript(
                client=client,
                audio_data=audio_data,
                ext=ext,
                mime_type=mime_type,
                language_hint=language_hint,
                bad=response,
            )

        if settings.stt_reject_hallucinations and is_probable_stt_hallucination(
            response.text
        ):
            raise AudioConversionError(
                "Speech was unclear. Speak clearly for 2–5 seconds in a quiet room, "
                "then try again."
            )

        elapsed_ms = int((time.perf_counter() - start) * 1000)
        metrics.record("stt", elapsed_ms, success=True)

        if _whisper_misheard_arabic(response.text, language_hint):
            logger.warning(
                "Arabic STT hint but Latin/English transcript; trying chat STT fallback",
                preview=response.text[:80],
            )
            chat_result = await self._try_chat_transcription_fallback(
                audio_data, "ar", mime_type, prepared_ext=ext
            )
            if chat_result is not None and ARABIC_PATTERN.search(chat_result.text):
                return chat_result

        logger.info(
            "STT complete",
            provider=settings.stt_provider,
            model=settings.stt_model_name,
            chars=len(response.text),
            lang=response.language or language_hint,
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

        lang_code = normalize_language_hint(language_hint)
        if lang_code == "ar":
            lang_instruction = "Verbatim transcript in Arabic only (same dialect as spoken)."
        elif lang_code == "en":
            lang_instruction = "Verbatim transcript in English only."
        else:
            lang_instruction = (
                "Verbatim transcript in the same language as the speaker "
                "(Arabic or English). Do not translate."
            )

        try:
            response = await client.chat.completions.create(
                model="openai/gpt-audio-mini",
                modalities=["text"],
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You transcribe speech to text only. "
                            "Output ONLY the exact words spoken in the audio — same language as "
                            "the speaker. Never ask for files, links, or clarification. "
                            "Never say you cannot transcribe. No quotes, labels, or commentary."
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
                                "text": (
                                    f"{lang_instruction} "
                                    "If the clip is silent or unintelligible, output nothing."
                                ),
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
        detected_lang = "unknown"
        if lang_code in ("ar", "en"):
            detected_lang = lang_code
        elif transcript.strip():
            detected_lang, _ = detect_language(transcript)

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
    ) -> _WhisperTranscriptionResponse:
        if settings.stt_provider == "openrouter":
            return await self._request_openrouter_transcription(
                model=model,
                audio_data=audio_data,
                ext=ext,
                language_hint=language_hint,
            )

        audio_file = io.BytesIO(audio_data)
        audio_file.name = f"audio.{ext}"
        create_kwargs: dict[str, object] = {
            "model": model,
            "file": audio_file,
            "language": (
                language_hint if language_hint and language_hint != "auto" else None
            ),
            "response_format": "verbose_json",
            "timestamp_granularities": ["segment"],
            "prompt": stt_transcription_prompt(),
        }
        response = await client.audio.transcriptions.create(**create_kwargs)
        return _WhisperTranscriptionResponse(
            text=response.text,
            language=getattr(response, "language", None),
            segments=getattr(response, "segments", None),
        )

    async def _request_openrouter_transcription(
        self,
        model: str,
        audio_data: bytes,
        ext: str,
        language_hint: str | None,
    ) -> _WhisperTranscriptionResponse:
        """OpenRouter STT: JSON body with base64 input_audio (not multipart file)."""
        api_key = settings.stt_api_key
        if not api_key:
            raise ValueError("OPENROUTER_API_KEY is required for STT_PROVIDER=openrouter")

        audio_format = ext.lower() if ext.lower() in _OPENROUTER_STT_FORMATS else "wav"
        payload: dict[str, object] = {
            "model": model,
            "input_audio": {
                "data": base64.b64encode(audio_data).decode("ascii"),
                "format": audio_format,
            },
        }
        if language_hint and language_hint != "auto":
            payload["language"] = language_hint
        prompt = stt_transcription_prompt()
        if prompt:
            payload["prompt"] = prompt

        base_url = settings.openrouter_base_url.rstrip("/")
        url = f"{base_url}/audio/transcriptions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient(timeout=45.0) as http:
            response = await http.post(url, headers=headers, json=payload)
            if response.status_code >= 400:
                detail = response.text[:500]
                raise httpx.HTTPStatusError(
                    f"OpenRouter STT failed ({response.status_code}): {detail}",
                    request=response.request,
                    response=response,
                )
            data = response.json()

        text = str(data.get("text") or "").strip()
        api_lang = data.get("language")
        if isinstance(api_lang, str) and api_lang.strip():
            resolved_lang: str | None = api_lang.strip().lower()[:2]
        else:
            resolved_lang = language_hint
        return _WhisperTranscriptionResponse(
            text=text,
            language=resolved_lang,
        )

    @staticmethod
    def _build_whisper_result(
        response: _WhisperTranscriptionResponse, elapsed_ms: int
    ) -> TranscriptResult:
        segments: list[dict] = []
        if response.segments:
            segments = [
                {"start": s.start, "end": s.end, "text": s.text}
                for s in response.segments
            ]

        detected_lang = response.language
        if not detected_lang or detected_lang == "unknown":
            detected_lang, _ = detect_language(response.text)
        else:
            text_lang, _ = detect_language(response.text)
            if text_lang in ("ar", "en"):
                detected_lang = text_lang

        return TranscriptResult(
            text=response.text.strip(),
            confidence=0.92 if segments else 0.85,
            detected_language=detected_lang or "unknown",
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
        if isinstance(response_code, int):
            return response_code
        if isinstance(exc, httpx.HTTPStatusError) and exc.response is not None:
            return exc.response.status_code
        return None

    async def _refine_auto_transcript(
        self,
        *,
        client: AsyncOpenAI,
        audio_data: bytes,
        ext: str,
        language_hint: str | None,
        first: _WhisperTranscriptionResponse,
    ) -> _WhisperTranscriptionResponse:
        """Improve auto STT without forcing Arabic on clear English speech."""
        if normalize_language_hint(language_hint) is not None:
            return first

        cleaned = first.text.strip()
        if not cleaned:
            return first

        if ARABIC_PATTERN.search(cleaned):
            return await self._maybe_refine_weak_arabic_transcript(
                client=client,
                audio_data=audio_data,
                ext=ext,
                first=first,
            )

        if _looks_clear_english_transcript(cleaned):
            return first

        if _looks_foreign_latin_not_english(cleaned):
            try:
                en_response = await self._request_whisper_transcription(
                    client=client,
                    model=settings.stt_model_name,
                    audio_data=audio_data,
                    ext=ext,
                    language_hint="en",
                )
                if _looks_clear_english_transcript(en_response.text) or (
                    detect_language(en_response.text)[0] == "en"
                ):
                    logger.info(
                        "Auto STT foreign Latin; English retry succeeded",
                        preview=en_response.text[:80],
                    )
                    return en_response
            except Exception as exc:
                logger.warning("English STT retry after foreign Latin failed", error=str(exc))

        if not _looks_romanized_arabic_latin(cleaned):
            return first

        try:
            ar_response = await self._request_whisper_transcription(
                client=client,
                model=settings.stt_model_name,
                audio_data=audio_data,
                ext=ext,
                language_hint="ar",
            )
            if ARABIC_PATTERN.search(ar_response.text):
                logger.info(
                    "Auto STT romanized Arabic in Latin; Arabic retry succeeded",
                    chars=len(ar_response.text),
                )
                return ar_response
        except Exception as exc:
            logger.warning("Arabic STT retry after romanized Latin failed", error=str(exc))
        return first

    async def _maybe_refine_weak_arabic_transcript(
        self,
        *,
        client: AsyncOpenAI,
        audio_data: bytes,
        ext: str,
        first: _WhisperTranscriptionResponse,
    ) -> _WhisperTranscriptionResponse:
        """Re-run with a second model when dialect Arabic looks phonetically wrong."""
        if not settings.stt_arabic_refine_enabled:
            return first

        primary_model = settings.stt_model_name
        if not _arabic_transcript_needs_refine(first.text, primary_model):
            return first

        refine_model = (settings.stt_arabic_refine_model or "").strip()
        if not refine_model:
            return first

        first_rank = _arabic_transcript_quality_rank(first.text)

        try:
            alt = await self._request_whisper_transcription(
                client=client,
                model=refine_model,
                audio_data=audio_data,
                ext=ext,
                language_hint=None,
            )
        except Exception as exc:
            logger.warning("Arabic dialect STT refine failed", error=str(exc))
            return first

        if not ARABIC_PATTERN.search(alt.text):
            chat_alt = await self._try_chat_transcription_fallback(
                audio_data, None, f"audio/{ext}", prepared_ext=ext
            )
            if chat_alt is not None and ARABIC_PATTERN.search(chat_alt.text):
                alt = _WhisperTranscriptionResponse(
                    text=chat_alt.text,
                    language="ar",
                )
            else:
                return first

        alt_rank = _arabic_transcript_quality_rank(alt.text)
        if alt_rank > first_rank:
            logger.info(
                "Arabic STT refine picked alternate model",
                model=refine_model,
                first_rank=first_rank,
                alt_rank=alt_rank,
                preview=alt.text[:80],
            )
            return alt
        return first

    async def _recover_hallucinated_transcript(
        self,
        *,
        client: AsyncOpenAI,
        audio_data: bytes,
        ext: str,
        mime_type: str,
        language_hint: str | None,
        bad: _WhisperTranscriptionResponse,
    ) -> _WhisperTranscriptionResponse:
        """Re-transcribe when Whisper returns Icelandic-like or other gibberish."""
        refine_model = (settings.stt_arabic_refine_model or "").strip()
        models: list[str] = []
        for name in (refine_model, settings.stt_model_name):
            if name and name not in models:
                models.append(name)

        best: _WhisperTranscriptionResponse | None = None
        best_rank = _transcript_recovery_rank(bad.text)

        for lang_try in ("en", "ar", None):
            if normalize_language_hint(language_hint) not in (None, lang_try):
                continue
            for model in models:
                try:
                    candidate = await self._request_whisper_transcription(
                        client=client,
                        model=model,
                        audio_data=audio_data,
                        ext=ext,
                        language_hint=lang_try,
                    )
                except Exception as exc:
                    logger.debug(
                        "Hallucination recovery attempt failed",
                        model=model,
                        lang=lang_try,
                        error=str(exc),
                    )
                    continue
                if is_probable_stt_hallucination(candidate.text):
                    continue
                rank = _transcript_recovery_rank(candidate.text)
                if rank > best_rank:
                    best = candidate
                    best_rank = rank

        if best is not None:
            logger.info(
                "STT hallucination recovery succeeded",
                preview=best.text[:80],
                rank=best_rank,
            )
            return best

        chat_result = await self._try_chat_transcription_fallback(
            audio_data, None, mime_type, prepared_ext=ext
        )
        if chat_result is not None and not is_probable_stt_hallucination(
            chat_result.text
        ):
            logger.info(
                "STT hallucination recovery via chat audio",
                preview=chat_result.text[:80],
            )
            detected, _ = detect_language(chat_result.text)
            return _WhisperTranscriptionResponse(
                text=chat_result.text,
                language=detected if detected in ("ar", "en") else None,
            )

        return bad


def _transcript_recovery_rank(text: str) -> int:
    """Higher = more trustworthy recovered transcript."""
    cleaned = text.strip()
    if not cleaned:
        return -100
    if ARABIC_PATTERN.search(cleaned):
        return _arabic_transcript_quality_rank(cleaned) + 20
    if _looks_clear_english_transcript(cleaned):
        return 30
    detected, confidence = detect_language(cleaned)
    if detected == "en":
        return int(10 + confidence * 10)
    if detected == "ar":
        return _arabic_transcript_quality_rank(cleaned) + 10
    return 0


def _whisper_misheard_arabic(text: str, language_hint: str | None) -> bool:
    """True when we asked for Arabic but Whisper returned Latin/English only."""
    if normalize_language_hint(language_hint) != "ar":
        return False
    cleaned = text.strip()
    if not cleaned:
        return False
    if ARABIC_PATTERN.search(cleaned):
        return False
    detected, _ = detect_language(cleaned)
    return detected == "en"


_stt_service: STTService | None = None


def get_stt_service() -> STTService:
    global _stt_service
    if _stt_service is None:
        _stt_service = STTService()
    return _stt_service

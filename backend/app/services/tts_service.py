"""
Text-to-Speech service.

Supports three providers (set TTS_PROVIDER in .env):

  edge              (default)
    Microsoft Edge TTS — free, no API key, good Arabic/English voices.

  gpt-audio-mini
    openai/gpt-audio-mini via OpenRouter — same model as STT.
    Uses OPENROUTER_API_KEY. One key for STT + TTS + LLM.
    Voices: alloy | echo | fable | onyx | nova | shimmer |
            ash | coral | sage | verse
    Set GPT_AUDIO_VOICE in .env  (default: shimmer)

  elevenlabs
    ElevenLabs API — requires ELEVENLABS_API_KEY.
"""

import base64
import io
import json
import time
import wave

import edge_tts
import httpx
from openai import AsyncOpenAI

from app.core.config import get_settings
from app.core.logging_config import get_logger
from app.core.metrics import metrics

logger = get_logger(__name__)
settings = get_settings()

# Edge TTS voice map (used when TTS_PROVIDER=edge)
VOICE_MAP = {
    "en": {
        "female": "en-US-JennyNeural",
        "male": "en-US-AndrewNeural",
        "default": "en-US-JennyNeural",
    },
    "ar": {
        "female": "ar-SA-ZariyahNeural",
        "male": "ar-SA-HamedNeural",
        "default": "ar-SA-ZariyahNeural",
    },
}

# gpt-audio-mini voices that handle Arabic well
GPT_AUDIO_VOICES = ["alloy", "echo", "fable", "onyx", "nova", "shimmer", "ash", "coral", "sage", "verse"]


class TTSService:
    def __init__(self) -> None:
        self._openai_client: AsyncOpenAI | None = None

    # ── Public interface ──────────────────────────────────────

    async def synthesize(
        self,
        text: str,
        language: str = "en",
        voice: str | None = None,
        gender: str = "female",
        speed: float = 1.0,
    ) -> tuple[str, float]:
        """
        Convert text to speech.
        Returns (base64_encoded_mp3, estimated_duration_seconds).
        """
        provider = settings.tts_provider

        if provider == "gpt-audio-mini":
            return await self._synthesize_gpt_audio(text, voice, language)
        if provider == "elevenlabs":
            return await self._synthesize_elevenlabs(text, voice, language)

        # Default provider: Edge TTS
        try:
            return await self._synthesize_edge(text, language, voice, gender, speed)
        except Exception as edge_exc:
            should_fallback = (
                settings.tts_edge_fallback_to_gpt_audio
                and bool(settings.openrouter_api_key)
            )
            if not should_fallback:
                raise

            logger.warning(
                "Edge TTS failed; falling back to gpt-audio-mini",
                error=str(edge_exc),
                lang=language,
                chars=len(text),
            )
            return await self._synthesize_gpt_audio(text, voice, language)

    async def list_voices(self, language: str | None = None) -> list[dict]:
        if settings.tts_provider == "gpt-audio-mini":
            voices = [{"name": v, "locale": "multi", "gender": "neutral"} for v in GPT_AUDIO_VOICES]
            return voices
        # Edge TTS voice list
        voices = await edge_tts.list_voices()
        if language:
            lang_code = language[:2].lower()
            voices = [v for v in voices if v["Locale"].lower().startswith(lang_code)]
        return [{"name": v["ShortName"], "locale": v["Locale"], "gender": v["Gender"]} for v in voices]

    # ── gpt-audio-mini provider ───────────────────────────────

    async def _synthesize_gpt_audio(
        self,
        text: str,
        voice: str | None,
        language: str,
    ) -> tuple[str, float]:
        """
        Generate speech via openai/gpt-audio-mini on OpenRouter.

        Uses the chat completions API with audio output modality.
        The model receives a text prompt and returns audio data.
        """
        start = time.perf_counter()
        client = self._get_openai_client()

        resolved_voice = voice or settings.gpt_audio_voice
        if resolved_voice not in GPT_AUDIO_VOICES:
            resolved_voice = "shimmer"

        # Tell the model to speak the text naturally in the correct language
        lang_label = "Arabic" if language[:2] == "ar" else "English"

        try:
            response = await client.chat.completions.create(
                model="openai/gpt-audio-mini",
                modalities=["text", "audio"],
                audio={
                    "voice": resolved_voice,
                    "format": settings.gpt_audio_format,  # mp3 | opus | wav | pcm16
                },
                messages=[
                    {
                        "role": "system",
                        "content": (
                            f"You are a voice assistant. "
                            f"Speak the user's message naturally in {lang_label}. "
                            f"Do not add any words — say exactly what the user writes."
                        ),
                    },
                    {
                        "role": "user",
                        "content": text,
                    },
                ],
                temperature=0.7,
                max_tokens=4096,
            )
        except Exception as exc:
            # Some OpenRouter routes require audio output with stream=true.
            if "Audio output requires stream: true" in str(exc):
                return await self._synthesize_gpt_audio_streaming(text, resolved_voice, language, start)
            elapsed_ms = int((time.perf_counter() - start) * 1000)
            metrics.record("tts", elapsed_ms, success=False)
            logger.error("gpt-audio-mini TTS failed", error=str(exc))
            raise

        elapsed_ms = int((time.perf_counter() - start) * 1000)
        metrics.record("tts", elapsed_ms, success=True)

        # Audio data is in response.choices[0].message.audio.data (base64)
        audio_obj = response.choices[0].message.audio
        if not audio_obj or not audio_obj.data:
            raise RuntimeError("gpt-audio-mini returned no audio data")

        audio_b64 = audio_obj.data  # already base64 encoded by the API

        # Estimate duration
        word_count = len(text.split())
        estimated_duration = (word_count / 150) * 60

        logger.info(
            "gpt-audio-mini TTS complete",
            voice=resolved_voice,
            lang=language,
            chars=len(text),
            elapsed_ms=elapsed_ms,
        )

        return audio_b64, estimated_duration

    async def _synthesize_gpt_audio_streaming(
        self,
        text: str,
        resolved_voice: str,
        language: str,
        start: float,
    ) -> tuple[str, float]:
        """Fallback path for providers that require streamed audio output."""
        lang_label = "Arabic" if language[:2] == "ar" else "English"

        payload = {
            "model": "openai/gpt-audio-mini",
            "stream": True,
            "modalities": ["text", "audio"],
            "audio": {
                "voice": resolved_voice,
                # OpenRouter streaming audio currently supports pcm16.
                "format": "pcm16",
            },
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are a voice assistant. "
                        f"Speak the user's message naturally in {lang_label}. "
                        "Do not add any words - say exactly what the user writes."
                    ),
                },
                {"role": "user", "content": text},
            ],
            "temperature": 0.7,
            "max_tokens": 4096,
        }

        headers = {
            "Authorization": f"Bearer {settings.openrouter_api_key}",
            "Content-Type": "application/json",
        }
        if settings.openrouter_base_url.rstrip("/").endswith("/api/v1"):
            url = f"{settings.openrouter_base_url}/chat/completions"
        else:
            url = f"{settings.openrouter_base_url.rstrip('/')}/chat/completions"

        audio_chunks: list[bytes] = []
        final_audio_b64: str | None = None

        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                async with client.stream("POST", url, headers=headers, json=payload) as response:
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        if not line or not line.startswith("data: "):
                            continue
                        data = line[6:].strip()
                        if data == "[DONE]":
                            break
                        try:
                            chunk = json.loads(data)
                        except json.JSONDecodeError:
                            continue

                        choice = (chunk.get("choices") or [{}])[0]
                        delta = choice.get("delta") or {}
                        delta_audio = delta.get("audio") or {}
                        if delta_audio.get("data"):
                            try:
                                audio_chunks.append(base64.b64decode(delta_audio["data"]))
                            except Exception:
                                pass

                        message_audio = (choice.get("message") or {}).get("audio") or {}
                        if message_audio.get("data"):
                            final_audio_b64 = message_audio["data"]
        except Exception as exc:
            elapsed_ms = int((time.perf_counter() - start) * 1000)
            metrics.record("tts", elapsed_ms, success=False)
            logger.error("gpt-audio-mini streaming TTS failed", error=str(exc))
            raise

        pcm_bytes = b""
        if final_audio_b64:
            try:
                pcm_bytes = base64.b64decode(final_audio_b64)
            except Exception:
                pcm_bytes = b""
        if not pcm_bytes and audio_chunks:
            pcm_bytes = b"".join(audio_chunks)
        if not pcm_bytes:
            raise RuntimeError("gpt-audio-mini streaming returned no audio data")

        audio_b64 = self._pcm16_to_wav_b64(pcm_bytes)

        elapsed_ms = int((time.perf_counter() - start) * 1000)
        metrics.record("tts", elapsed_ms, success=True)
        word_count = len(text.split())
        estimated_duration = (word_count / 150) * 60
        return audio_b64, estimated_duration

    @staticmethod
    def _pcm16_to_wav_b64(pcm_bytes: bytes, sample_rate: int = 24000) -> str:
        """Wrap raw PCM16 bytes into a WAV container and return base64 string."""
        wav_buffer = io.BytesIO()
        with wave.open(wav_buffer, "wb") as wav_file:
            wav_file.setnchannels(1)
            wav_file.setsampwidth(2)  # 16-bit PCM
            wav_file.setframerate(sample_rate)
            wav_file.writeframes(pcm_bytes)
        return base64.b64encode(wav_buffer.getvalue()).decode("utf-8")

    # ── Edge TTS provider ─────────────────────────────────────

    async def _synthesize_edge(
        self,
        text: str,
        language: str,
        voice: str | None,
        gender: str,
        speed: float,
    ) -> tuple[str, float]:
        start = time.perf_counter()

        resolved_voice = voice or self._resolve_edge_voice(language, gender)
        rate_str = self._speed_to_rate(speed)

        communicate = edge_tts.Communicate(text, resolved_voice, rate=rate_str)
        buffer = io.BytesIO()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                buffer.write(chunk["data"])

        audio_bytes = buffer.getvalue()
        if not audio_bytes:
            raise RuntimeError("Edge TTS returned empty audio")

        elapsed_ms = int((time.perf_counter() - start) * 1000)
        metrics.record("tts", elapsed_ms, success=True)
        audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")

        word_count = len(text.split())
        estimated_duration = (word_count / 150) * 60 / speed

        logger.info(
            "Edge TTS complete",
            voice=resolved_voice,
            chars=len(text),
            elapsed_ms=elapsed_ms,
        )

        return audio_b64, estimated_duration

    async def synthesize_streaming(
        self,
        text: str,
        language: str = "en",
        voice: str | None = None,
        speed: float = 1.0,
    ):
        """Async generator yielding base64 audio chunks (Edge TTS only)."""
        resolved_voice = voice or self._resolve_edge_voice(language)
        rate_str = self._speed_to_rate(speed)
        communicate = edge_tts.Communicate(text, resolved_voice, rate=rate_str)
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                yield base64.b64encode(chunk["data"]).decode("utf-8")

    # ── ElevenLabs provider ───────────────────────────────────

    async def _synthesize_elevenlabs(
        self,
        text: str,
        voice: str | None,
        language: str,
    ) -> tuple[str, float]:
        if not settings.elevenlabs_api_key:
            raise ValueError("ELEVENLABS_API_KEY is required for tts_provider=elevenlabs")

        start = time.perf_counter()
        voice_id = voice or "21m00Tcm4TlvDq8ikWAM"  # Rachel — supports Arabic

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
                headers={
                    "xi-api-key": settings.elevenlabs_api_key,
                    "Content-Type": "application/json",
                },
                json={"text": text, "model_id": "eleven_multilingual_v2"},
            )
            response.raise_for_status()
            audio_bytes = response.content

        elapsed_ms = int((time.perf_counter() - start) * 1000)
        metrics.record("tts", elapsed_ms, success=True)

        word_count = len(text.split())
        estimated_duration = (word_count / 150) * 60

        return base64.b64encode(audio_bytes).decode("utf-8"), estimated_duration

    # ── Helpers ───────────────────────────────────────────────

    def _get_openai_client(self) -> AsyncOpenAI:
        if self._openai_client is None:
            if not settings.openrouter_api_key:
                raise ValueError("OPENROUTER_API_KEY is required for tts_provider=gpt-audio-mini")
            self._openai_client = AsyncOpenAI(
                api_key=settings.openrouter_api_key,
                base_url=settings.openrouter_base_url,
                timeout=45.0,
            )
            logger.info("TTS client ready", provider="gpt-audio-mini", voice=settings.gpt_audio_voice)
        return self._openai_client

    def _resolve_edge_voice(self, language: str, gender: str = "female") -> str:
        lang_code = language[:2].lower()
        lang_voices = VOICE_MAP.get(lang_code, VOICE_MAP["en"])
        return lang_voices.get(gender, lang_voices["default"])

    @staticmethod
    def _speed_to_rate(speed: float) -> str:
        if speed == 1.0:
            return "+0%"
        percent = int((speed - 1.0) * 100)
        return f"+{percent}%" if percent >= 0 else f"{percent}%"


_tts_service: TTSService | None = None


def get_tts_service() -> TTSService:
    global _tts_service
    if _tts_service is None:
        _tts_service = TTSService()
    return _tts_service

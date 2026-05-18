from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # App
    app_name: str = "AI Communication Assistant"
    app_version: str = "1.0.0"
    debug: bool = False
    # Log every SQL statement (noisy); independent of DEBUG.
    sql_echo: bool = False

    # OpenRouter (LLM)
    openrouter_api_key: str = ""
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    openrouter_model: str = "anthropic/claude-3-haiku"

    # ── STT (Speech-to-Text) ──────────────────────────────────
    # "openrouter"      → Whisper via OpenRouter  (STT_MODEL=openai/whisper-1)
    # "gpt-audio-mini"  → gpt-audio-mini via OpenRouter  (audio chat completions)
    # "openai"          → Whisper direct OpenAI API  (requires OPENAI_API_KEY)
    stt_provider: str = "openrouter"
    stt_model: str = "openai/whisper-1"
    # Optional Whisper prompt (vocabulary / style hint). Empty = built-in default.
    stt_prompt: str = ""
    # When auto STT returns Arabic script, optionally re-run with a second model
    # if the transcript looks like a phonetic mis-hear (dialect / شو / كيف).
    stt_arabic_refine_enabled: bool = True
    stt_arabic_refine_model: str = "openai/gpt-4o-mini-transcribe"
    # Drop gibberish STT (Icelandic hallucinations, etc.) instead of showing in chat.
    stt_reject_hallucinations: bool = True
    # Interim STT on concatenated WS chunks is unsafe for WebM; keep off until
    # segment-based live mode ships.
    stt_interim_chunk_enabled: bool = False

    # ── TTS (Text-to-Speech) ──────────────────────────────────
    # "edge"            → Microsoft Edge TTS  (free, no key needed)
    # "gpt-audio-mini"  → gpt-audio-mini via OpenRouter  (audio chat completions)
    # "elevenlabs"      → ElevenLabs API  (requires ELEVENLABS_API_KEY)
    tts_provider: str = "edge"
    # When true, if Edge TTS fails to return audio, retry with gpt-audio-mini.
    tts_edge_fallback_to_gpt_audio: bool = True
    elevenlabs_api_key: str = ""

    # gpt-audio-mini voice (used when either provider = "gpt-audio-mini")
    # Options: alloy | echo | fable | onyx | nova | shimmer | ash | coral | sage | verse
    gpt_audio_voice: str = "shimmer"
    gpt_audio_format: str = "mp3"   # mp3 | opus | wav | pcm16

    # Only required when stt_provider=openai
    openai_api_key: str = ""

    @property
    def stt_api_key(self) -> str:
        if self.stt_provider == "openai":
            return self.openai_api_key
        return self.openrouter_api_key

    @property
    def stt_base_url(self) -> str:
        if self.stt_provider == "openai":
            return "https://api.openai.com/v1"
        return self.openrouter_base_url

    @property
    def stt_model_name(self) -> str:
        if self.stt_provider == "openai":
            return "whisper-1"
        if self.stt_provider == "gpt-audio-mini":
            return "openai/gpt-audio-mini"
        return self.stt_model  # openrouter path: e.g. openai/whisper-1

    # Edge TTS voices (used when tts_provider=edge)
    # Arabic default is Saudi male to match current Arabic speech profile.
    tts_voice_en: str = "en-US-JennyNeural"
    tts_voice_ar: str = "ar-SA-HamedNeural"

    # Database (PostgreSQL recommended; sqlite+aiosqlite supported for local dev)
    database_url: str = "sqlite+aiosqlite:///./hearme.db"

    # Auth (JWT)
    jwt_secret_key: str = "change-me-use-long-random-secret-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7
    ws_ticket_expire_minutes: int = 15

    # AI — fast classifier / enhancer (OpenRouter model ids)
    classifier_model: str = "openai/gpt-4o-mini"
    enhancer_model: str = ""

    # Redis
    redis_url: str = "redis://localhost:6379"
    use_redis: bool = False

    # CORS — comma-separated; include LAN origins when using Next "Network" URL
    allowed_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    # Rate limiting
    rate_limit_requests: int = 60
    rate_limit_window: int = 60

    # When true, DELETE /api/v1/sessions/purge-all removes all sessions (dev/admin).
    allow_session_purge: bool = False

    # Context window
    max_context_messages: int = 20
    max_audio_size_mb: int = 25

    # Camera facial sentiment — heuristic | huggingface
    # huggingface: trpakov/vit-face-expression (ViT, FER2013, ~86M params)
    camera_sentiment_provider: str = "huggingface"
    camera_sentiment_model: str = "trpakov/vit-face-expression"
    # transformers device: -1 = CPU, 0+ = CUDA index, "mps" on Apple Silicon
    camera_sentiment_device: str = "cpu"
    camera_sentiment_fallback_heuristic: bool = True

    @property
    def origins_list(self) -> List[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]

    @property
    def enhancer_model_name(self) -> str:
        return self.enhancer_model.strip() or self.openrouter_model


@lru_cache
def get_settings() -> Settings:
    return Settings()

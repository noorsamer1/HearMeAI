from pydantic import BaseModel, Field


class TranscriptResponse(BaseModel):
    text: str
    confidence: float = Field(ge=0.0, le=1.0)
    detected_language: str
    segments: list[dict] = []
    processing_time_ms: int


class TTSRequest(BaseModel):
    text: str = Field(min_length=1, max_length=4000)
    language: str = "en"
    voice: str | None = None
    speed: float = Field(default=1.0, ge=0.5, le=2.0)


class TTSResponse(BaseModel):
    audio_base64: str
    duration_estimate_seconds: float
    voice_used: str
    language: str

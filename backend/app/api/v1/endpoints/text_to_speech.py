"""Text-to-Speech REST endpoint."""

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.core.config import get_settings
from app.core.logging_config import get_logger
from app.core.rate_limit import limiter
from app.schemas.speech import TTSRequest, TTSResponse
from app.services.tts_service import TTSService, get_tts_service

router = APIRouter()
logger = get_logger(__name__)
settings = get_settings()


@router.post("/text-to-speech", response_model=TTSResponse)
@limiter.limit("30/minute")
async def text_to_speech(
    request: Request,
    body: TTSRequest,
    tts: TTSService = Depends(get_tts_service),
) -> TTSResponse:
    """
    Convert text to speech audio.

    Returns base64-encoded MP3 audio data and metadata.
    """
    try:
        audio_b64, duration = await tts.synthesize(
            text=body.text,
            language=body.language,
            voice=body.voice,
            speed=body.speed,
        )
    except Exception as exc:
        logger.error("TTS error", error=str(exc))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Speech synthesis failed. Please try again.",
        )

    voice_used = body.voice or (
        settings.tts_voice_ar if body.language[:2].lower() == "ar" else settings.tts_voice_en
    )

    return TTSResponse(
        audio_base64=audio_b64,
        duration_estimate_seconds=round(duration, 2),
        voice_used=voice_used,
        language=body.language,
    )


@router.get("/voices")
@limiter.limit("10/minute")
async def list_voices(
    request: Request,
    language: str | None = None,
    tts: TTSService = Depends(get_tts_service),
):
    """List available TTS voices, optionally filtered by language."""
    voices = await tts.list_voices(language=language)
    return {"voices": voices}

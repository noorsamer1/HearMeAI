"""Speech-to-text REST endpoint."""

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status

from app.core.config import get_settings
from app.core.logging_config import get_logger
from app.core.rate_limit import limiter
from app.schemas.speech import TranscriptResponse
from app.services.audio_convert import AudioConversionError, hex_prefix, normalize_mime_type
from app.services.stt_service import STTService, get_stt_service

router = APIRouter()
logger = get_logger(__name__)
settings = get_settings()

MAX_BYTES = settings.max_audio_size_mb * 1024 * 1024


@router.post("/speech-to-text", response_model=TranscriptResponse)
@limiter.limit("30/minute")
async def speech_to_text(
    request: Request,
    audio: UploadFile = File(..., description="Audio file (webm, mp3, wav, ogg)"),
    language: str = Form(default="auto", description="Language hint (e.g. 'en', 'ar') or 'auto'"),
    stt: STTService = Depends(get_stt_service),
) -> TranscriptResponse:
    """
    Transcribe uploaded audio to text using Whisper.

    Accepts audio/webm, audio/mp4, audio/wav, audio/mpeg, audio/ogg.
    Returns transcript, confidence, and detected language.
    """
    allowed_types = {
        "audio/webm", "audio/mp4", "audio/wav", "audio/mpeg",
        "audio/ogg", "audio/flac", "application/octet-stream",
    }

    mime_type = normalize_mime_type(audio.content_type or "audio/webm")
    if mime_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported audio type: {mime_type}",
        )

    audio_bytes = await audio.read()

    if len(audio_bytes) > MAX_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Audio exceeds {settings.max_audio_size_mb}MB limit",
        )

    if len(audio_bytes) < 100:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Audio data is too short or empty",
        )

    logger.info(
        "REST STT upload",
        mime_type=mime_type,
        input_bytes=len(audio_bytes),
        input_hex_prefix=hex_prefix(audio_bytes),
    )

    try:
        result = await stt.transcribe(
            audio_data=audio_bytes,
            language_hint=None if language == "auto" else language,
            mime_type=mime_type,
        )
    except AudioConversionError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc))
    except Exception as exc:
        logger.error("STT error", error=str(exc))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Transcription failed. Please try again.",
        )

    return TranscriptResponse(
        text=result.text,
        confidence=result.confidence,
        detected_language=result.detected_language,
        segments=result.segments,
        processing_time_ms=result.processing_time_ms,
    )

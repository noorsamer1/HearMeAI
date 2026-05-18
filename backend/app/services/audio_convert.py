"""Transcode browser audio (WebM/Opus, etc.) to WAV for STT providers."""

from __future__ import annotations

import os
import subprocess
import tempfile
from pathlib import Path

import imageio_ffmpeg

from app.core.logging_config import get_logger

logger = get_logger(__name__)

EBML_MAGIC = bytes([0x1A, 0x45, 0xDF, 0xA3])
RIFF_MAGIC = b"RIFF"
MIN_AUDIO_BYTES = 100

MIME_TO_SUFFIX = {
    "audio/webm": ".webm",
    "audio/ogg": ".ogg",
    "audio/mp4": ".mp4",
    "audio/flac": ".flac",
    "audio/wav": ".wav",
    "audio/mpeg": ".mp3",
}


class AudioConversionError(Exception):
    """Raised when audio cannot be converted to a format STT accepts."""


def normalize_mime_type(mime_type: str) -> str:
    """Strip parameters (e.g. audio/webm;codecs=opus -> audio/webm)."""
    return (mime_type or "").split(";", 1)[0].strip().lower()


def hex_prefix(data: bytes, length: int = 16) -> str:
    """Return first N bytes as uppercase hex for diagnostics."""
    return data[:length].hex().upper()


def _validate_wav(data: bytes) -> None:
    if len(data) < 12 or not data.startswith(RIFF_MAGIC):
        raise AudioConversionError("Output is not a valid WAV (missing RIFF header)")


def _validate_webm_ebml(data: bytes) -> None:
    if len(data) < 4 or not data.startswith(EBML_MAGIC):
        raise AudioConversionError(
            "Input is not valid WebM (expected EBML header 1A 45 DF A3)"
        )


def _ffmpeg_executable() -> str:
    return imageio_ffmpeg.get_ffmpeg_exe()


def convert_to_wav_sync(audio_data: bytes, source_mime: str) -> tuple[bytes, str]:
    """
    Convert audio bytes to mono 16 kHz PCM WAV.

    Args:
        audio_data: Raw uploaded or decoded recording bytes.
        source_mime: MIME type hint from client.

    Returns:
        Tuple of (wav_bytes, "audio/wav").

    Raises:
        AudioConversionError: On empty input, invalid container, or FFmpeg failure.
    """
    if len(audio_data) < MIN_AUDIO_BYTES:
        raise AudioConversionError("Audio data is too short or empty")

    normalized = normalize_mime_type(source_mime)
    logger.debug(
        "STT audio convert start",
        source_mime=source_mime,
        normalized_mime=normalized,
        input_bytes=len(audio_data),
        input_hex_prefix=hex_prefix(audio_data),
    )

    if normalized in ("audio/wav",):
        _validate_wav(audio_data)
        return audio_data, "audio/wav"

    if normalized in ("audio/mpeg", "audio/mp3"):
        return audio_data, normalized

    transcode_mimes = {"audio/webm", "audio/ogg", "audio/mp4", "audio/flac"}
    if normalized not in transcode_mimes:
        raise AudioConversionError(f"Unsupported audio MIME type: {source_mime}")

    if normalized == "audio/webm":
        _validate_webm_ebml(audio_data)

    suffix = MIME_TO_SUFFIX.get(normalized, ".webm")
    in_path: str | None = None
    out_path: str | None = None

    try:
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as in_file:
            in_file.write(audio_data)
            in_path = in_file.name

        out_fd, out_path = tempfile.mkstemp(suffix=".wav")
        os.close(out_fd)

        cmd = [
            _ffmpeg_executable(),
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            "-i",
            in_path,
            "-vn",
            "-ac",
            "1",
            "-ar",
            "16000",
            "-c:a",
            "pcm_s16le",
            out_path,
        ]
        proc = subprocess.run(cmd, capture_output=True, check=False)
        stderr = proc.stderr.decode("utf-8", errors="ignore").strip()

        if proc.returncode != 0:
            logger.error(
                "FFmpeg transcode failed",
                source_mime=normalized,
                returncode=proc.returncode,
                ffmpeg_stderr=stderr,
            )
            raise AudioConversionError(
                stderr or f"FFmpeg failed with exit code {proc.returncode}"
            )

        out_bytes = Path(out_path).read_bytes()
        if not out_bytes:
            raise AudioConversionError("FFmpeg produced empty WAV output")

        _validate_wav(out_bytes)
        logger.debug(
            "STT audio convert ok",
            source_mime=normalized,
            output_bytes=len(out_bytes),
            output_hex_prefix=hex_prefix(out_bytes),
            ffmpeg_stderr=stderr or None,
        )
        return out_bytes, "audio/wav"
    finally:
        for path in (in_path, out_path):
            if path and os.path.exists(path):
                try:
                    os.unlink(path)
                except OSError:
                    pass


async def convert_to_wav(audio_data: bytes, source_mime: str) -> tuple[bytes, str]:
    """Async wrapper — runs FFmpeg in a thread pool."""
    import asyncio

    return await asyncio.to_thread(convert_to_wav_sync, audio_data, source_mime)

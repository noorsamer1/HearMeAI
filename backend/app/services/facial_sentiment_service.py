"""Facial expression sentiment from camera frames (HF ViT or heuristic fallback)."""

from __future__ import annotations

import asyncio
import base64
import io
import re
from dataclasses import dataclass

from app.core.config import get_settings
from app.core.logging_config import get_logger

logger = get_logger(__name__)
settings = get_settings()

_DATA_URL_RE = re.compile(r"^data:image/[\w+.-]+;base64,(.+)$", re.I | re.S)


@dataclass
class FacialSentimentResult:
    """Inferred expression label and confidence in [0, 1]."""

    label: str
    confidence: float
    method: str = "heuristic"


def _decode_image_bytes(image_base64: str) -> bytes:
    raw = image_base64.strip()
    match = _DATA_URL_RE.match(raw)
    if match:
        raw = match.group(1)
    return base64.b64decode(raw)


def _analyze_heuristic(image_bytes: bytes) -> FacialSentimentResult:
    """
    Lightweight expression proxy using regional brightness/contrast.

    Used when provider=huggingface fails or provider=heuristic.
    """
    try:
        from PIL import Image
    except ImportError as exc:
        raise RuntimeError("Pillow is required for camera sentiment") from exc

    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    w, h = img.size
    if w < 32 or h < 32:
        return FacialSentimentResult(label="neutral", confidence=0.35, method="heuristic")

    left, top = int(w * 0.2), int(h * 0.1)
    right, bottom = int(w * 0.8), int(h * 0.9)
    face = img.crop((left, top, right, bottom))
    fw, fh = face.size

    upper = face.crop((0, 0, fw, int(fh * 0.42)))
    lower = face.crop((0, int(fh * 0.55), fw, fh))

    def _mean_rgb(region: Image.Image) -> tuple[float, float, float]:
        pixels = list(region.getdata())
        if not pixels:
            return 128.0, 128.0, 128.0
        r = sum(p[0] for p in pixels) / len(pixels)
        g = sum(p[1] for p in pixels) / len(pixels)
        b = sum(p[2] for p in pixels) / len(pixels)
        return r, g, b

    ur, ug, ub = _mean_rgb(upper)
    lr, lg, lb = _mean_rgb(lower)
    mouth_lift = (lr + lg) / 2 - (ur + ug) / 2
    redness = ur - min(ug, ub)

    if mouth_lift > 18 and redness < 25:
        return FacialSentimentResult(label="positive", confidence=0.78, method="heuristic")
    if mouth_lift < -12 and redness > 20:
        return FacialSentimentResult(label="angry", confidence=0.72, method="heuristic")
    if mouth_lift < -8 and redness < 15:
        return FacialSentimentResult(label="sad", confidence=0.68, method="heuristic")
    if redness > 30:
        return FacialSentimentResult(label="anxious", confidence=0.65, method="heuristic")
    return FacialSentimentResult(label="neutral", confidence=0.55, method="heuristic")


def _analyze_huggingface_sync(image_bytes: bytes) -> FacialSentimentResult:
    """Blocking HF inference (run via asyncio.to_thread from async callers)."""
    from app.services.facial_emotion_hf import analyze_frame_hf

    label, confidence, method = analyze_frame_hf(image_bytes)
    return FacialSentimentResult(label=label, confidence=confidence, method=method)


async def analyze_facial_sentiment(image_base64: str) -> FacialSentimentResult:
    """
    Analyze a single camera frame and return expression label + confidence.

    Provider ``huggingface`` uses ``trpakov/vit-face-expression`` by default (ViT, FER2013).
    Falls back to heuristic rules when configured or on model errors.
    """
    image_bytes = _decode_image_bytes(image_base64)
    if len(image_bytes) < 256:
        return FacialSentimentResult(label="neutral", confidence=0.0, method="too_small")

    provider = settings.camera_sentiment_provider.strip().lower()

    if provider == "huggingface":
        try:
            return await asyncio.to_thread(_analyze_huggingface_sync, image_bytes)
        except Exception as exc:
            logger.warning("facial_sentiment_hf_failed", error=str(exc))
            if settings.camera_sentiment_fallback_heuristic:
                fallback = _analyze_heuristic(image_bytes)
                return FacialSentimentResult(
                    label=fallback.label,
                    confidence=fallback.confidence,
                    method="heuristic_fallback",
                )
            return FacialSentimentResult(label="neutral", confidence=0.0, method="error")

    try:
        return _analyze_heuristic(image_bytes)
    except Exception as exc:
        logger.warning("facial_sentiment_heuristic_failed", error=str(exc))
        return FacialSentimentResult(label="neutral", confidence=0.0, method="error")


_NEUTRAL_EMOTION_LABELS = frozenset({"neutral", "other", "unknown"})


def _is_neutral_emotion(label: str | None) -> bool:
    if not label:
        return True
    return label.lower().strip() in _NEUTRAL_EMOTION_LABELS


def fuse_sentiments(
    text_label: str | None,
    text_confidence: float | None,
    camera_label: str | None,
    camera_confidence: float | None,
    *,
    threshold: float = 0.62,
) -> tuple[str | None, float | None]:
    """
    Fuse text classifier output with live camera sentiment.

    When both are confident, prefer a non-neutral camera signal over neutral text
    (e.g. \"hello\" + angry face → angry). Otherwise pick the higher confidence.
    """
    text_conf = float(text_confidence or 0)
    cam_conf = float(camera_confidence or 0)
    text_ok = bool(text_label) and text_conf >= threshold
    cam_ok = bool(camera_label) and cam_conf >= threshold

    if text_ok and cam_ok:
        if _is_neutral_emotion(text_label) and not _is_neutral_emotion(camera_label):
            return camera_label, cam_conf
        if _is_neutral_emotion(camera_label) and not _is_neutral_emotion(text_label):
            return text_label, text_conf

    candidates: list[tuple[str, float]] = []
    if text_ok:
        candidates.append((text_label, text_conf))  # type: ignore[arg-type]
    if cam_ok:
        candidates.append((camera_label, cam_conf))  # type: ignore[arg-type]
    if not candidates:
        return None, None
    best = max(candidates, key=lambda x: x[1])
    return best[0], best[1]

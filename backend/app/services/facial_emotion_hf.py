"""Pretrained Hugging Face ViT facial emotion recognition (FER2013-style labels)."""

from __future__ import annotations

import io
import shutil
import tempfile
from functools import lru_cache
from pathlib import Path
from typing import Any

from PIL import Image

from app.core.config import get_settings
from app.core.logging_config import get_logger

logger = get_logger(__name__)
settings = get_settings()

# FER2013 seven-class outputs from trpakov/vit-face-expression and similar checkpoints.
_FER_LABELS = frozenset(
    {"angry", "disgust", "fear", "happy", "sad", "surprise", "neutral"}
)

# Map model emotions → app sentiment labels (aligned with text classifier + UI).
_FER_TO_APP: dict[str, str] = {
    "angry": "angry",
    "disgust": "anxious",
    "fear": "anxious",
    "happy": "positive",
    "sad": "sad",
    "surprise": "positive",
    "neutral": "neutral",
}


def map_fer_label(raw_label: str) -> str:
    """Normalize HF label string to application sentiment vocabulary."""
    key = raw_label.lower().strip()
    for fer in _FER_LABELS:
        if fer in key:
            return _FER_TO_APP[fer]
    return _FER_TO_APP.get(key, "neutral")


def _resolve_device() -> int | str:
    """Parse CAMERA_SENTIMENT_DEVICE for transformers pipeline."""
    raw = settings.camera_sentiment_device.strip().lower()
    if raw in ("cpu", "mps", "cuda"):
        return raw
    try:
        return int(settings.camera_sentiment_device.strip())
    except ValueError:
        return "cpu"


_HAAR_NAME = "haarcascade_frontalface_default.xml"


@lru_cache(maxsize=1)
def _haar_cascade_path() -> str | None:
    """
    Resolve Haar cascade XML with a Windows-safe path.

    Project folders that contain special Unicode (e.g. zero-width space) break
    OpenCV's file reader; copying the cascade to %TEMP% avoids that.
    """
    try:
        import cv2
    except ImportError:
        return None

    candidates: list[Path] = []
    try:
        import site

        for base in site.getsitepackages() + [site.getusersitepackages()]:
            if base:
                candidates.append(Path(base) / "cv2" / "data" / _HAAR_NAME)
    except Exception:
        pass
    candidates.extend(
        [
            Path(cv2.data.haarcascades) / _HAAR_NAME,
            Path(__file__).resolve().parent.parent / "assets" / _HAAR_NAME,
        ]
    )
    # De-duplicate while preserving order
    seen: set[str] = set()
    unique: list[Path] = []
    for path in candidates:
        key = str(path)
        if key not in seen:
            seen.add(key)
            unique.append(path)
    candidates = unique

    temp_dest = Path(tempfile.gettempdir()) / f"hearme_{_HAAR_NAME}"

    for src in candidates:
        if not src.is_file():
            continue
        try:
            # OpenCV on Windows often cannot open paths with special Unicode in the
            # project folder; Python can still copy the file to an ASCII temp path.
            shutil.copy2(src, temp_dest)
            classifier = cv2.CascadeClassifier(str(temp_dest))
            if not classifier.empty():
                return str(temp_dest)
        except (OSError, cv2.error) as exc:
            logger.debug("haar_cascade_candidate_failed", source=str(src), error=str(exc))
            continue
    return None


def _crop_largest_face(img: Image.Image) -> Image.Image:
    """Detect frontal face and crop with padding; fallback to center crop."""
    try:
        import cv2
        import numpy as np
    except ImportError:
        return _center_crop(img)

    cascade_path = _haar_cascade_path()
    if not cascade_path:
        return _center_crop(img)

    try:
        rgb = np.array(img.convert("RGB"))
        gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
        detector = cv2.CascadeClassifier(cascade_path)
        if detector.empty():
            return _center_crop(img)

        faces = detector.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(48, 48),
        )
        if len(faces) == 0:
            return _center_crop(img)

        x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
        pad_w = int(w * 0.15)
        pad_h = int(h * 0.15)
        x0 = max(0, x - pad_w)
        y0 = max(0, y - pad_h)
        x1 = min(rgb.shape[1], x + w + pad_w)
        y1 = min(rgb.shape[0], y + h + pad_h)
        return Image.fromarray(rgb[y0:y1, x0:x1])
    except Exception as exc:
        logger.debug("face_crop_skipped", error=str(exc))
        return _center_crop(img)


def _center_crop(img: Image.Image) -> Image.Image:
    """Center crop when no face detector or no face found."""
    w, h = img.size
    left, top = int(w * 0.15), int(h * 0.08)
    right, bottom = int(w * 0.85), int(h * 0.92)
    return img.crop((left, top, right, bottom))


@lru_cache(maxsize=1)
def _get_classifier() -> Any:
    """Load HF image-classification pipeline once (downloads weights on first use)."""
    from transformers import pipeline

    model_id = settings.camera_sentiment_model.strip()
    device = _resolve_device()
    logger.info("loading_camera_sentiment_model", model=model_id, device=device)
    return pipeline(
        task="image-classification",
        model=model_id,
        device=device,
    )


def analyze_frame_hf(image_bytes: bytes) -> tuple[str, float, str]:
    """
    Run pretrained ViT emotion model on a single frame.

    Returns:
        Tuple of (app_label, confidence in [0,1], method tag).
    """
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    face_img = _crop_largest_face(img)

    classifier = _get_classifier()
    outputs: list[dict[str, Any]] = classifier(face_img, top_k=3)
    if not outputs:
        return "neutral", 0.0, f"huggingface:{settings.camera_sentiment_model}"

    best = outputs[0]
    raw_label = str(best.get("label", "neutral"))
    score = float(best.get("score", 0.0))
    app_label = map_fer_label(raw_label)
    method = f"huggingface:{settings.camera_sentiment_model}"
    logger.debug(
        "camera_sentiment_hf",
        raw_label=raw_label,
        app_label=app_label,
        score=score,
    )
    return app_label, score, method


def preload_model() -> None:
    """Warm up model weights (optional call from app startup)."""
    if settings.camera_sentiment_provider.lower() != "huggingface":
        return
    try:
        _get_classifier()
        logger.info("camera_sentiment_model_ready")
    except Exception as exc:
        logger.warning("camera_sentiment_preload_failed", error=str(exc))

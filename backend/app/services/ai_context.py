"""Two-step classifier + enhancer for accessibility-oriented messaging."""

import json
import re

from app.core.config import get_settings
from app.core.logging_config import get_logger
from app.services.openrouter_client import get_llm_client

logger = get_logger(__name__)
settings = get_settings()

_CLASSIFIER_SYSTEM = (
    "You are a classifier. Reply with ONLY valid JSON (no markdown) with keys: "
    '"emotion" (one of: happy, sad, angry, neutral, anxious), '
    '"intent" (one of: question, statement, urgent, other), '
    '"urgency" (one of: low, medium, high), '
    '"confidence" (number 0-1).'
)

_ENHANCER_SYSTEM = (
    "Rewrite the user's message for deaf-friendly clarity: short sentences, plain words, "
    "neutral supportive tone, no sarcasm, no idioms. If meaning is uncertain, prefix with "
    '"Maybe: ". Output only the rewritten text, no preamble. Match the language of the original.'
)


def _safe_json_obj(text: str) -> dict:
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        m = re.search(r"\{[\s\S]*\}", text)
        if m:
            try:
                return json.loads(m.group())
            except json.JSONDecodeError:
                pass
    return {
        "emotion": "neutral",
        "intent": "other",
        "urgency": "low",
        "confidence": 0.0,
    }


async def classify_text(text: str) -> dict:
    if not settings.openrouter_api_key or not text.strip():
        return {"emotion": "neutral", "intent": "other", "urgency": "low", "confidence": 0.0}
    try:
        client = get_llm_client()
        raw = await client.complete_with_model(
            settings.classifier_model,
            [
                {"role": "system", "content": _CLASSIFIER_SYSTEM},
                {"role": "user", "content": text[:4000]},
            ],
            json_mode=True,
            max_tokens=256,
            temperature=0.2,
        )
        return _safe_json_obj(raw)
    except Exception as exc:
        logger.warning("classifier_failed", error=str(exc))
        return {"emotion": "neutral", "intent": "other", "urgency": "low", "confidence": 0.0}


async def enhance_text(text: str, classification: dict, *, locale: str = "en") -> str:
    if not settings.openrouter_api_key or not text.strip():
        return ""
    try:
        client = get_llm_client()
        model = settings.enhancer_model_name
        payload_user = json.dumps(
            {"original": text, "classification": classification, "locale": locale},
            ensure_ascii=False,
        )
        raw = await client.complete_with_model(
            model,
            [
                {"role": "system", "content": _ENHANCER_SYSTEM},
                {"role": "user", "content": payload_user},
            ],
            json_mode=False,
            max_tokens=512,
            temperature=0.4,
        )
        return raw.strip()
    except Exception as exc:
        logger.warning("enhancer_failed", error=str(exc))
        return ""

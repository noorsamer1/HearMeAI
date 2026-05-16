"""Fuse sentiment signals and build emotion-aware LLM system prompts."""

from __future__ import annotations

from app.services.facial_sentiment_service import fuse_sentiments
from app.services.openrouter_client import SYSTEM_PROMPT
from app.utils.text_cleanup import strip_stage_directions

# Align camera labels (e.g. positive) with text classifier vocabulary.
_LABEL_ALIASES: dict[str, str] = {
    "positive": "happy",
    "negative": "sad",
    "joy": "happy",
    "anger": "angry",
    "sadness": "sad",
    "anxiety": "anxious",
}

_EMOTION_GUIDANCE: dict[str, str] = {
    "happy": (
        "The user seems happy or upbeat. Warm, encouraging tone. "
        "Notice their mood out loud (e.g. you seem cheerful / in a great mood today). "
        "Invite them to share what went well (e.g. what made your day good, "
        "what you are excited about). Celebrate lightly if it fits."
    ),
    "sad": (
        "The user seems sad or down. Empathetic, gentle tone. "
        "Acknowledge that they seem low or having a hard time. "
        "Offer support and ask what is weighing on them — not generic wellness checks."
    ),
    "angry": (
        "The user seems frustrated or angry. Calm, validating tone. "
        "Acknowledge their frustration. Ask what happened or how you can help — "
        "do not argue or mirror hostility."
    ),
    "anxious": (
        "The user seems anxious or worried. Reassuring, clear, steady tone. "
        "Acknowledge they seem worried. Offer one simple next step or ask "
        "what is on their mind — avoid overwhelming detail."
    ),
    "neutral": (
        "No strong emotion detected. Use your default calm, supportive communication style."
    ),
}

# Shown in the system prompt when mood is confidently detected (not neutral).
_DETECTED_MOOD_RULES = """
Detected-mood reply rules (mandatory when an emotion is listed above):
- You already have a mood signal. Never ask how the user feels in general
  (forbidden: "How are you feeling?", "How do you feel today?", "Are you okay?").
- Start by reflecting the detected mood in your own words, then ask a specific
  follow-up about what caused or relates to that mood.
- Reply in the same language as the user's latest message.
- Keep to 1–3 short sentences unless they asked for more detail.
- If they also say hello or small talk, answer that briefly first, then reflect
  their mood and ask a specific follow-up (do not stop at a generic greeting).
- Plain spoken text only — no asterisk stage directions.
"""

_FORBIDDEN_GENERIC_REPLY_PHRASES: tuple[str, ...] = (
    "how are you feeling",
    "how do you feel",
    "how are you doing today",
    "how are you today",
    "i'm doing well, thank you for asking",
    "i am doing well, thank you for asking",
    "im doing well thank you for asking",
)

_EMOTION_FALLBACK_REPLIES: dict[str, dict[str, str]] = {
    "angry": {
        "en": (
            "I can hear that you're frustrated. What happened? "
            "I'm here to help you work through it."
        ),
        "ar": "أشعر أنك منزعج. ماذا حدث؟ أنا هنا لأساعدك.",
    },
    "happy": {
        "en": "You sound cheerful today! What made your day go well?",
        "ar": "يبدو أنك بمزاج رائع اليوم! ما الذي سرّك اليوم؟",
    },
    "sad": {
        "en": "You seem down. Want to talk about what's been hard?",
        "ar": "يبدو أنك حزين. هل تريد التحدث عما يضايقك؟",
    },
    "anxious": {
        "en": "You seem worried. What's on your mind right now?",
        "ar": "يبدو أنك قلق. ما الذي يشغل بالك الآن؟",
    },
}

_EMOTION_REPLY_EXAMPLES: dict[str, str] = {
    "happy": (
        'Good: "You sound cheerful today! What made your day go well?"\n'
        'Bad: "I\'m doing well. How are you feeling today?"'
    ),
    "sad": (
        'Good: "You seem a bit down. Want to talk about what\'s been hard?"\n'
        'Bad: "How are you feeling today?"'
    ),
    "angry": (
        'Good: "Sounds like something frustrated you. What happened?"\n'
        'Bad: "How can I help you today?" (without acknowledging anger)'
    ),
    "anxious": (
        'Good: "You seem worried. What\'s on your mind right now?"\n'
        'Bad: "How are you doing?" (ignores anxiety)'
    ),
}

EMOTION_CONFIDENCE_THRESHOLD = 0.62
_CONFIDENCE_THRESHOLD = EMOTION_CONFIDENCE_THRESHOLD


def normalize_emotion_label(label: str | None) -> str | None:
    """Map app/camera labels to canonical emotion keys for prompting."""
    if not label:
        return None
    key = label.lower().strip()
    return _LABEL_ALIASES.get(key, key)


def resolve_user_emotion(
    text_classification: dict | None,
    camera_label: str | None = None,
    camera_confidence: float | None = None,
    *,
    threshold: float = _CONFIDENCE_THRESHOLD,
) -> tuple[str | None, float | None]:
    """
    Fuse text classifier output with optional live camera sentiment.

    Returns canonical emotion label and confidence, or (None, None) if below threshold.
    """
    text_label: str | None = None
    text_conf: float | None = None
    if text_classification:
        text_label = normalize_emotion_label(str(text_classification.get("emotion", "")))
        raw_conf = text_classification.get("confidence")
        if raw_conf is not None:
            try:
                text_conf = float(raw_conf)
            except (TypeError, ValueError):
                text_conf = None

    cam_label = normalize_emotion_label(camera_label)
    cam_conf = float(camera_confidence) if camera_confidence is not None else None

    fused_label, fused_conf = fuse_sentiments(
        text_label,
        text_conf,
        cam_label,
        cam_conf,
        threshold=threshold,
    )
    if fused_label:
        return normalize_emotion_label(fused_label), fused_conf

    # If fusion missed but text alone is strong enough, use text.
    if text_label and (text_conf or 0) >= threshold:
        return text_label, text_conf

    # Camera-only when user did not type an emotional cue.
    if cam_label and (cam_conf or 0) >= threshold:
        return cam_label, cam_conf

    return None, None


def infer_sentiment_source(
    text_classification: dict | None,
    camera_label: str | None = None,
    camera_confidence: float | None = None,
    *,
    threshold: float = _CONFIDENCE_THRESHOLD,
) -> str:
    """How mood was inferred for peer-visible hints."""
    text_label: str | None = None
    text_conf = 0.0
    if text_classification:
        text_label = normalize_emotion_label(str(text_classification.get("emotion", "")))
        raw_conf = text_classification.get("confidence")
        if raw_conf is not None:
            try:
                text_conf = float(raw_conf)
            except (TypeError, ValueError):
                text_conf = 0.0

    cam_label = normalize_emotion_label(camera_label)
    cam_conf = float(camera_confidence) if camera_confidence is not None else 0.0

    text_active = bool(text_label) and text_conf >= threshold and text_label != "neutral"
    cam_active = bool(cam_label) and cam_conf >= threshold and cam_label != "neutral"

    if cam_active and text_active:
        return "expression_and_text"
    if cam_active:
        return "expression"
    return "text"


def build_peer_sentiment_fields(
    text_classification: dict | None,
    camera_label: str | None = None,
    camera_confidence: float | None = None,
    manual_mood_label: str | None = None,
) -> dict[str, str | float]:
    """
    Optional WS fields when fused mood is confident enough to show peers.

    Keys: sentimentLabel, sentimentScore, sentimentSource.
    """
    manual = normalize_emotion_label(manual_mood_label)
    if manual:
        return {
            "sentimentLabel": manual,
            "sentimentScore": 0.95,
            "sentimentSource": "manual",
        }

    emotion_label, emotion_conf = resolve_user_emotion(
        text_classification,
        camera_label,
        camera_confidence,
    )
    if not emotion_label or (emotion_conf or 0) < _CONFIDENCE_THRESHOLD:
        return {}

    return {
        "sentimentLabel": emotion_label,
        "sentimentScore": float(emotion_conf or 0),
        "sentimentSource": infer_sentiment_source(
            text_classification,
            camera_label,
            camera_confidence,
        ),
    }


def emotion_is_active(
    emotion: str | None,
    confidence: float | None = None,
) -> bool:
    """True when a non-neutral mood is confident enough to steer the assistant reply."""
    if not emotion:
        return False
    canonical = normalize_emotion_label(emotion)
    if not canonical or canonical == "neutral":
        return False
    return (confidence or 0) >= _CONFIDENCE_THRESHOLD


def build_emotion_llm_messages(user_text: str) -> list[dict[str, str]]:
    """
    Single-turn user message so mood instructions are not overridden by old chat turns.
    """
    return [{"role": "user", "content": user_text.strip()}]


def sanitize_emotion_reply(text: str, emotion: str, lang: str) -> str:
    """
    Replace generic 'how are you feeling?' replies when mood was already detected.
    """
    cleaned = strip_stage_directions(text)
    canonical = normalize_emotion_label(emotion) or ""
    if not canonical or canonical == "neutral":
        return cleaned

    lower = cleaned.lower()
    if any(phrase in lower for phrase in _FORBIDDEN_GENERIC_REPLY_PHRASES):
        loc = "ar" if (lang or "en").lower().startswith("ar") else "en"
        fallback = _EMOTION_FALLBACK_REPLIES.get(canonical, {}).get(loc)
        if fallback:
            return fallback
    return cleaned


def build_emotion_aware_system_prompt(
    emotion: str | None,
    confidence: float | None = None,
) -> str:
    """Append emotion-specific reply guidance to the base assistant system prompt."""
    if not emotion or (confidence or 0) < _CONFIDENCE_THRESHOLD:
        return SYSTEM_PROMPT

    canonical = normalize_emotion_label(emotion) or "neutral"
    if canonical == "neutral":
        return SYSTEM_PROMPT

    guidance = _EMOTION_GUIDANCE.get(canonical, _EMOTION_GUIDANCE["neutral"])
    examples = _EMOTION_REPLY_EXAMPLES.get(canonical, "")
    pct = int((confidence or 0) * 100)

    parts = [
        f"{SYSTEM_PROMPT}\n",
        "Emotional context — the user's mood is already inferred; respond accordingly:\n",
        f"- Detected emotion: {canonical} (confidence ~{pct}%)\n",
        f"- Reply guidance: {guidance}\n",
        _DETECTED_MOOD_RULES,
    ]
    if examples:
        parts.append(f"- Example contrast:\n{examples}\n")
    return "".join(parts)

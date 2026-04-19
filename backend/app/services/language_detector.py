"""
Lightweight language detection for Arabic/English.

Uses a simple heuristic on Unicode ranges first (fast, no API call).
Falls back to asking the LLM when confidence is low.
"""

import re
import unicodedata


ARABIC_PATTERN = re.compile(r"[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]+")
ENGLISH_PATTERN = re.compile(r"[a-zA-Z]+")


def detect_language(text: str) -> tuple[str, float]:
    """
    Detect if text is primarily Arabic or English.

    Returns (language_code, confidence) where language_code is 'ar', 'en', or 'unknown'.
    """
    if not text or not text.strip():
        return "unknown", 0.0

    text_clean = text.strip()

    arabic_chars = len(ARABIC_PATTERN.findall(text_clean))
    english_chars = len(ENGLISH_PATTERN.findall(text_clean))
    total = arabic_chars + english_chars

    if total == 0:
        return "unknown", 0.5

    arabic_ratio = arabic_chars / total
    english_ratio = english_chars / total

    if arabic_ratio > 0.6:
        confidence = min(0.99, 0.7 + arabic_ratio * 0.3)
        return "ar", confidence
    elif english_ratio > 0.6:
        confidence = min(0.99, 0.7 + english_ratio * 0.3)
        return "en", confidence
    else:
        # Mixed — pick dominant
        if arabic_ratio > english_ratio:
            return "ar", 0.6
        else:
            return "en", 0.6


def normalize_text(text: str) -> str:
    """
    Normalize text for processing:
    - Strip leading/trailing whitespace
    - Remove null bytes and most control characters (keep newline/tab)
    - Normalize Unicode to NFC
    - Collapse multiple spaces
    """
    text = text.replace("\x00", "")
    text = "".join(
        ch for ch in text
        if unicodedata.category(ch) not in ("Cc",) or ch in ("\n", "\t", "\r")
    )
    text = unicodedata.normalize("NFC", text)
    text = re.sub(r"[ \t]+", " ", text).strip()
    return text


def compute_readability_score(text: str) -> int:
    """
    Compute a simple readability score (0-100) for English text.
    Higher score = more readable.

    Uses a heuristic: short words, short sentences = more readable.
    """
    sentences = re.split(r"[.!?]+", text)
    sentences = [s.strip() for s in sentences if s.strip()]

    if not sentences:
        return 50

    words = text.split()
    if not words:
        return 50

    avg_word_length = sum(len(w) for w in words) / len(words)
    avg_sentence_length = len(words) / len(sentences)

    # Score degrades with longer words and sentences
    word_score = max(0, 100 - (avg_word_length - 4) * 8)
    sentence_score = max(0, 100 - (avg_sentence_length - 10) * 3)

    return int((word_score + sentence_score) / 2)

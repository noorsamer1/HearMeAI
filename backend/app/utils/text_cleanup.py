"""Text normalization helpers for user-facing AI output."""

from __future__ import annotations

import re

# Single-asterisk segments like *nods politely* (not markdown bold **text**).
_STAGE_DIRECTION_RE = re.compile(r"\*[^*\n]+\*")
_MULTI_SPACE_RE = re.compile(r"[ \t]{2,}")

# Caps normalization helpers (Latin only; Arabic and other scripts are uncased).
_LATIN_LETTER_RE = re.compile(r"[A-Za-z]")
_UPPER_LETTER_RE = re.compile(r"[A-Z]")
_SENTENCE_START_RE = re.compile(r"(^\s*|[.!?]\s+|\n\s*)([a-z])")
_STANDALONE_I_RE = re.compile(r"\bi\b")


def strip_stage_directions(text: str) -> str:
    """Remove *stage direction* segments from assistant text."""
    if not text:
        return ""
    cleaned = _STAGE_DIRECTION_RE.sub("", text)
    cleaned = _MULTI_SPACE_RE.sub(" ", cleaned)
    return cleaned.strip()


def normalize_reply_caps(
    text: str,
    *,
    min_letters: int = 8,
    upper_ratio: float = 0.7,
) -> str:
    """Soften a shouting (all-caps) assistant reply to sentence case.

    Only triggers when the Latin letters are overwhelmingly uppercase, so a
    normal reply containing a few acronyms is left untouched. Arabic and other
    uncased scripts are unaffected (they contain no Latin letters to count).

    Args:
        text: Raw assistant text.
        min_letters: Skip very short strings where the ratio is noisy.
        upper_ratio: Uppercase share of Latin letters that counts as shouting.

    Returns:
        The reply in sentence case when it was shouting, else the original text.
    """
    if not text:
        return text

    letters = _LATIN_LETTER_RE.findall(text)
    if len(letters) < min_letters:
        return text
    if len(_UPPER_LETTER_RE.findall(text)) / len(letters) < upper_ratio:
        return text

    lowered = text.lower()
    recased = _SENTENCE_START_RE.sub(
        lambda m: m.group(1) + m.group(2).upper(), lowered
    )
    return _STANDALONE_I_RE.sub("I", recased)

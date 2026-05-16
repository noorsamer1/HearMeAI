"""Text normalization helpers for user-facing AI output."""

from __future__ import annotations

import re

# Single-asterisk segments like *nods politely* (not markdown bold **text**).
_STAGE_DIRECTION_RE = re.compile(r"\*[^*\n]+\*")
_MULTI_SPACE_RE = re.compile(r"[ \t]{2,}")


def strip_stage_directions(text: str) -> str:
    """Remove *stage direction* segments from assistant text."""
    if not text:
        return ""
    cleaned = _STAGE_DIRECTION_RE.sub("", text)
    cleaned = _MULTI_SPACE_RE.sub(" ", cleaned)
    return cleaned.strip()

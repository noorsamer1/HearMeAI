import re
from urllib.parse import quote

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.sign_mapping import SignMapping

_CANONICAL_PHRASE_PATTERNS: list[tuple[str, tuple[str, ...]]] = [
    ("how are you", ("how are you", "how r you", "how are u", "how you doing")),
]


def _build_sign_card_data_uri(phrase_key: str) -> str:
    """Return a safe inline SVG card for sign suggestions.

    We intentionally avoid legacy random GIF links here because they can be
    unrelated or inappropriate. This card provides a stable, accessible
    placeholder until curated sign media is provided.
    """
    text = phrase_key.strip() or "sign"
    svg = f"""
<svg xmlns='http://www.w3.org/2000/svg' width='480' height='360' viewBox='0 0 480 360'>
  <defs>
    <linearGradient id='bg' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0%' stop-color='#111827'/>
      <stop offset='100%' stop-color='#1f2937'/>
    </linearGradient>
  </defs>
  <rect width='480' height='360' fill='url(#bg)' rx='24'/>
  <rect x='24' y='24' width='432' height='312' rx='18' fill='none' stroke='#374151' stroke-width='2'/>
  <text x='240' y='138' text-anchor='middle' fill='#9ca3af' font-family='Arial, sans-serif' font-size='22' font-weight='700'>SIGN SUGGESTION</text>
  <text x='240' y='210' text-anchor='middle' fill='#ffffff' font-family='Arial, sans-serif' font-size='42' font-weight='700'>{text}</text>
  <text x='240' y='258' text-anchor='middle' fill='#60a5fa' font-family='Arial, sans-serif' font-size='18'>Curated sign media coming soon</text>
</svg>
""".strip()
    return f"data:image/svg+xml;utf8,{quote(svg)}"


def normalize_for_match(text: str) -> str:
    return re.sub(r"[^\w\s]", " ", text.lower()).strip()


async def best_sign_suggestion(
    db: AsyncSession,
    text: str,
    locale: str = "en",
) -> dict | None:
    if not text.strip():
        return None
    norm = normalize_for_match(text)

    # Canonical phrase support: allows important phrases (like "how are you")
    # even when they do not exist yet in the sign_mapping table.
    for canonical, variants in _CANONICAL_PHRASE_PATTERNS:
        for variant in variants:
            pattern = r"(?<!\w)" + re.escape(variant) + r"(?!\w)"
            if re.search(pattern, norm):
                return {
                    "phraseKey": canonical,
                    "assetUrl": _build_sign_card_data_uri(canonical),
                }

    result = await db.execute(
        select(SignMapping)
        .where(SignMapping.locale == locale)
        .order_by(SignMapping.priority.desc())
    )
    rows = list(result.scalars().all())
    rows.sort(key=lambda r: len(r.phrase_key), reverse=True)
    for row in rows:
        key = row.phrase_key.lower().strip()
        if not key:
            continue
        pattern = r"(?<!\w)" + re.escape(key) + r"(?!\w)"
        if re.search(pattern, norm):
            # Keep trusted non-Giphy assets if present; legacy Giphy mappings
            # are replaced with a safe deterministic card.
            asset_url = row.asset_url
            if "giphy.com" in asset_url.lower():
                asset_url = _build_sign_card_data_uri(row.phrase_key)
            return {"phraseKey": row.phrase_key, "assetUrl": asset_url}
    return None

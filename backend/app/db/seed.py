"""Seed reference data (sign mappings)."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.sign_mapping import SignMapping

_DEFAULT_SIGNS: list[tuple[str, str, str, int]] = [
    # Use known-live URLs; several older IDs were removed and now return 404.
    ("hello", "en", "https://media.giphy.com/media/ETV4MRojrqsve/giphy.gif", 10),
    ("thank you", "en", "https://media.giphy.com/media/14kdiJUblbWBXy/giphy.gif", 10),
    ("yes", "en", "https://media.giphy.com/media/QfsvYoBSSpfbtFJIVo/giphy.gif", 5),
    ("no", "en", "https://media.giphy.com/media/vFKqnCdLPNOKc/giphy.gif", 5),
    ("please", "en", "https://media.giphy.com/media/ETV4MRojrqsve/giphy.gif", 5),
    ("help", "en", "https://media.giphy.com/media/14kdiJUblbWBXy/giphy.gif", 15),
]


async def seed_sign_mappings_if_empty(db: AsyncSession) -> None:
    result = await db.execute(select(SignMapping.id).limit(1))
    if result.scalar_one_or_none() is not None:
        return
    for phrase, locale, url, prio in _DEFAULT_SIGNS:
        db.add(SignMapping(phrase_key=phrase, locale=locale, asset_url=url, priority=prio))
    await db.flush()

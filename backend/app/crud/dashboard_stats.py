"""Aggregate counts for the authenticated user's dashboard."""

import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chat_session import SessionParticipant
from app.models.message import Message


async def count_user_sessions(db: AsyncSession, user_id: uuid.UUID) -> int:
    """Distinct sessions the user has ever joined (including ended)."""
    q = select(func.count(func.distinct(SessionParticipant.session_id))).where(
        SessionParticipant.user_id == user_id
    )
    result = await db.execute(q)
    return int(result.scalar_one() or 0)


async def count_user_messages(db: AsyncSession, user_id: uuid.UUID) -> int:
    """Messages in sessions this user participated in."""
    q = (
        select(func.count(Message.id))
        .join(SessionParticipant, SessionParticipant.session_id == Message.session_id)
        .where(SessionParticipant.user_id == user_id)
    )
    result = await db.execute(q)
    return int(result.scalar_one() or 0)


async def count_user_transcripts(db: AsyncSession, user_id: uuid.UUID) -> int:
    """STT transcript rows stored for the user's sessions."""
    q = (
        select(func.count(Message.id))
        .join(SessionParticipant, SessionParticipant.session_id == Message.session_id)
        .where(SessionParticipant.user_id == user_id, Message.kind == "transcript")
    )
    result = await db.execute(q)
    return int(result.scalar_one() or 0)

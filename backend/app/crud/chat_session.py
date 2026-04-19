import secrets
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.chat_session import ChatSession, SessionParticipant
from app.models.user import User


def _generate_invite_code() -> str:
    return secrets.token_urlsafe(6)[:10].upper().replace("-", "X")


async def create_session(
    db: AsyncSession,
    *,
    created_by: uuid.UUID,
    mode: str = "direct",
    invite_code: str | None = None,
) -> ChatSession:
    code = invite_code or _generate_invite_code()
    session = ChatSession(
        mode=mode,
        invite_code=code,
        created_by=created_by,
    )
    db.add(session)
    await db.flush()
    return session


async def get_session(
    db: AsyncSession, session_id: uuid.UUID, *, with_participants: bool = False
) -> ChatSession | None:
    q = select(ChatSession).where(ChatSession.id == session_id)
    if with_participants:
        q = q.options(
            selectinload(ChatSession.participants).selectinload(SessionParticipant.user),
        )
    result = await db.execute(q)
    return result.scalar_one_or_none()


async def get_session_by_invite(db: AsyncSession, invite_code: str) -> ChatSession | None:
    result = await db.execute(select(ChatSession).where(ChatSession.invite_code == invite_code.upper()))
    return result.scalar_one_or_none()


async def add_participant(
    db: AsyncSession,
    *,
    session_id: uuid.UUID,
    user_id: uuid.UUID,
    role: str,
) -> SessionParticipant:
    row = SessionParticipant(session_id=session_id, user_id=user_id, role=role)
    db.add(row)
    await db.flush()
    return row


async def is_participant(db: AsyncSession, session_id: uuid.UUID, user_id: uuid.UUID) -> bool:
    result = await db.execute(
        select(SessionParticipant.user_id).where(
            SessionParticipant.session_id == session_id,
            SessionParticipant.user_id == user_id,
            SessionParticipant.left_at.is_(None),
        )
    )
    return result.scalar_one_or_none() is not None


async def list_participant_user_ids(db: AsyncSession, session_id: uuid.UUID) -> list[uuid.UUID]:
    result = await db.execute(
        select(SessionParticipant.user_id).where(
            SessionParticipant.session_id == session_id,
            SessionParticipant.left_at.is_(None),
        )
    )
    return [r[0] for r in result.all()]

import asyncio
import uuid
from datetime import datetime, timedelta, timezone
from typing import Literal

from redis.asyncio import Redis
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.logging_config import get_logger
from app.crud import chat_session as session_crud
from app.models.chat_session import ChatSession, SessionParticipant
from app.models.match_queue import MatchQueueEntry
from app.models.user import User
from app.utils.profile_roles import queue_role_for_profile

logger = get_logger(__name__)
settings = get_settings()

_deaf_queue: list[uuid.UUID] = []
_mute_queue: list[uuid.UUID] = []
_lock = asyncio.Lock()
_redis: Redis | None = None


def _queue_key(user_type: str) -> str:
    return f"hearme:match:{user_type}"


async def _get_redis() -> Redis | None:
    global _redis
    if not settings.use_redis:
        return None
    if _redis is None:
        _redis = Redis.from_url(settings.redis_url, decode_responses=True)
    return _redis


def resolve_queue_role(user: User, role_override: str | None) -> Literal["deaf", "mute"]:
    """
    Pick which queue this user enters. Matchmaking pairs deaf-queue with mute-queue.

    Uses profile category by default; optional legacy override for API compatibility.
    """
    if role_override in ("deaf", "mute"):
        return role_override  # type: ignore[return-value]
    return queue_role_for_profile(user.user_type)


async def _remove_db_entry(db: AsyncSession, user_id: uuid.UUID) -> None:
    await db.execute(delete(MatchQueueEntry).where(MatchQueueEntry.user_id == user_id))


async def _ensure_db_waiting(db: AsyncSession, user_id: uuid.UUID, user_type: str) -> None:
    result = await db.execute(select(MatchQueueEntry).where(MatchQueueEntry.user_id == user_id))
    row = result.scalar_one_or_none()
    if row:
        row.status = "waiting"
        row.user_type = user_type
    else:
        db.add(MatchQueueEntry(user_id=user_id, user_type=user_type, status="waiting"))
    await db.flush()


async def enqueue(
    db: AsyncSession,
    user: User,
    *,
    queue_role: Literal["deaf", "mute"],
) -> tuple[str, uuid.UUID | None, int | None]:
    """
    Returns (status, session_id_if_matched, position_hint).
    status: matched | waiting
    """
    qtype = queue_role
    opposite = "mute" if qtype == "deaf" else "deaf"
    r = await _get_redis()

    if r:
        peer_raw = await r.lpop(_queue_key(opposite))
        if peer_raw:
            peer_id = uuid.UUID(peer_raw)
            await _remove_db_entry(db, user.id)
            await _remove_db_entry(db, peer_id)
            sid = await _create_matched_session(db, user.id, peer_id, qtype)
            await db.flush()
            logger.info("match_redis", session_id=str(sid), user_a=str(user.id), user_b=str(peer_id))
            return "matched", sid, None

        await r.rpush(_queue_key(qtype), str(user.id))
        await _ensure_db_waiting(db, user.id, qtype)
        await db.flush()
        pos = await r.llen(_queue_key(qtype))
        return "waiting", None, int(pos)

    async with _lock:
        target = _mute_queue if qtype == "deaf" else _deaf_queue
        waiting_self = _deaf_queue if qtype == "deaf" else _mute_queue

        if user.id in waiting_self:
            waiting_self.remove(user.id)
        if user.id in target:
            target.remove(user.id)

        if target:
            peer_id = target.pop(0)
            await _remove_db_entry(db, user.id)
            await _remove_db_entry(db, peer_id)
            sid = await _create_matched_session(db, user.id, peer_id, qtype)
            await db.flush()
            logger.info("match_memory", session_id=str(sid), user_a=str(user.id), user_b=str(peer_id))
            return "matched", sid, None

        waiting_self.append(user.id)
        await _ensure_db_waiting(db, user.id, qtype)
        await db.flush()
        return "waiting", None, len(waiting_self)


async def dequeue(db: AsyncSession, user: User) -> None:
    r = await _get_redis()
    if r:
        uid = str(user.id)
        await r.lrem(_queue_key("deaf"), 0, uid)
        await r.lrem(_queue_key("mute"), 0, uid)
    else:
        async with _lock:
            for lst in (_deaf_queue, _mute_queue):
                if user.id in lst:
                    lst.remove(user.id)
    await _remove_db_entry(db, user.id)
    await db.flush()


async def poll_assigned_matched_session(
    db: AsyncSession,
    user_id: uuid.UUID,
    *,
    within_minutes: int = 30,
) -> uuid.UUID | None:
    """
    If this user was paired into a matched room (e.g. the other person clicked second),
    return that session id so the UI can redirect.
    """
    since = datetime.now(timezone.utc) - timedelta(minutes=within_minutes)
    result = await db.execute(
        select(ChatSession)
        .join(SessionParticipant, SessionParticipant.session_id == ChatSession.id)
        .where(
            SessionParticipant.user_id == user_id,
            SessionParticipant.left_at.is_(None),
            ChatSession.mode == "matched",
            ChatSession.closed_at.is_(None),
            ChatSession.created_at >= since,
        )
        .order_by(ChatSession.created_at.desc())
        .limit(1)
    )
    sess = result.scalar_one_or_none()
    if not sess:
        return None
    cnt = await db.scalar(
        select(func.count())
        .select_from(SessionParticipant)
        .where(SessionParticipant.session_id == sess.id, SessionParticipant.left_at.is_(None))
    )
    if cnt and int(cnt) >= 2:
        return sess.id
    return None


async def _create_matched_session(
    db: AsyncSession,
    a_id: uuid.UUID,
    b_id: uuid.UUID,
    a_queue_type: Literal["deaf", "mute"],
) -> uuid.UUID:
    """a is the user who just enqueued; b is peer popped from opposite queue."""
    if a_queue_type == "deaf":
        deaf_id, mute_id = a_id, b_id
    else:
        deaf_id, mute_id = b_id, a_id

    sess = await session_crud.create_session(db, created_by=deaf_id, mode="matched")
    await session_crud.add_participant(db, session_id=sess.id, user_id=deaf_id, role="deaf")
    await session_crud.add_participant(db, session_id=sess.id, user_id=mute_id, role="mute")
    return sess.id

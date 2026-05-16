import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.config import get_settings
from app.core.security import create_notify_ticket, create_ws_ticket
from app.crud import chat_session as session_crud
from app.crud import message as message_crud
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import WsTicketResponse
from app.schemas.session_api import (
    CameraSentimentRequest,
    CameraSentimentResponse,
    JoinSessionRequest,
    MessageOut,
    MessagesPage,
    SessionCreateRequest,
    SessionOut,
    SessionParticipantOut,
)
from app.realtime import room_manager
from app.services.context_manager import context_registry
from app.services.facial_sentiment_service import (
    analyze_facial_sentiment,
    fuse_sentiments,
)
from app.utils.profile_roles import participant_role_for_profile

router = APIRouter(prefix="/sessions", tags=["sessions"])
settings = get_settings()


def _role_for_creator(user: User) -> str:
    return participant_role_for_profile(user.user_type)


def _session_to_out(sess, participants_loaded: bool) -> SessionOut:
    parts: list[SessionParticipantOut] = []
    if participants_loaded and sess.participants:
        for p in sess.participants:
            if p.left_at is not None:
                continue
            u = p.user
            parts.append(
                SessionParticipantOut(
                    user_id=str(p.user_id),
                    display_name=u.display_name if u else "",
                    role=p.role,
                    joined_at=p.joined_at,
                )
            )
    return SessionOut(
        id=str(sess.id),
        mode=sess.mode,
        invite_code=sess.invite_code,
        created_by=str(sess.created_by),
        ai_assist_enabled=sess.ai_assist_enabled,
        created_at=sess.created_at,
        closed_at=sess.closed_at,
        participants=parts,
    )


def _message_to_out(m) -> MessageOut:
    meta = m.ai_meta
    return MessageOut(
        id=str(m.id),
        session_id=str(m.session_id),
        sender_id=str(m.sender_id) if m.sender_id else None,
        kind=m.kind,
        content_text=m.content_text,
        created_at=m.created_at,
        sentiment_label=meta.sentiment_label if meta else None,
        intent=meta.intent if meta else None,
        enhancement_text=meta.enhancement_text if meta else None,
    )


@router.post("", response_model=SessionOut)
async def create_session(
    body: SessionCreateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    invite = body.invite_code.strip().upper() if body.invite_code else None
    sess = await session_crud.create_session(
        db,
        created_by=user.id,
        mode=body.mode,
        invite_code=invite,
    )
    await session_crud.add_participant(
        db,
        session_id=sess.id,
        user_id=user.id,
        role=_role_for_creator(user),
    )
    await db.flush()
    full = await session_crud.get_session(db, sess.id, with_participants=True)
    assert full is not None
    return _session_to_out(full, True)


@router.post("/join", response_model=SessionOut)
async def join_session(
    body: JoinSessionRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    code = body.invite_code.strip().upper()
    sess = await session_crud.get_session_by_invite(db, code)
    if not sess or sess.closed_at is not None:
        raise HTTPException(status_code=404, detail="Session not found")
    if await session_crud.is_participant(db, sess.id, user.id):
        full = await session_crud.get_session(db, sess.id, with_participants=True)
        return _session_to_out(full, True)
    role = body.role or participant_role_for_profile(user.user_type)
    await session_crud.add_participant(
        db,
        session_id=sess.id,
        user_id=user.id,
        role=role,
    )
    await db.flush()
    full = await session_crud.get_session(db, sess.id, with_participants=True)
    assert full is not None
    return _session_to_out(full, True)


@router.delete("/{session_id}", status_code=204)
async def delete_session(
    session_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Permanently delete a session and all messages for every participant."""
    if not await session_crud.user_can_delete_session(db, session_id, user.id):
        raise HTTPException(status_code=403, detail="Not allowed to delete this session")
    room_key = str(session_id)
    await room_manager.evict_room(room_key)
    context_registry.delete(room_key)
    deleted = await session_crud.delete_session(db, session_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Session not found")


@router.delete("/purge-all", status_code=204)
async def purge_all_sessions(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete every session and message in the database (all registered users)."""
    if not settings.allow_session_purge:
        raise HTTPException(status_code=403, detail="Session purge is disabled")
    await room_manager.evict_all_rooms()
    context_registry.clear_all()
    await session_crud.delete_all_sessions(db)


@router.get("/{session_id}", response_model=SessionOut)
async def get_session(
    session_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not await session_crud.is_participant(db, session_id, user.id):
        raise HTTPException(status_code=403, detail="Not a participant")
    sess = await session_crud.get_session(db, session_id, with_participants=True)
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")
    return _session_to_out(sess, True)


@router.get("/{session_id}/messages", response_model=MessagesPage)
async def list_session_messages(
    session_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    if not await session_crud.is_participant(db, session_id, user.id):
        raise HTTPException(status_code=403, detail="Not a participant")
    rows = await message_crud.list_messages(db, session_id, limit=limit, offset=offset)
    has_more = len(rows) > limit
    if has_more:
        rows = rows[:limit]
    return MessagesPage(
        items=[_message_to_out(m) for m in rows],
        offset=offset,
        limit=limit,
        has_more=has_more,
    )


@router.post("/{session_id}/ws-ticket", response_model=WsTicketResponse)
async def issue_ws_ticket(
    session_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not await session_crud.is_participant(db, session_id, user.id):
        raise HTTPException(status_code=403, detail="Not a participant")
    token = create_ws_ticket(user.id, session_id)
    return WsTicketResponse(
        token=token,
        expires_in=settings.ws_ticket_expire_minutes * 60,
    )


@router.post(
    "/{session_id}/camera-sentiment",
    response_model=CameraSentimentResponse,
    tags=["sessions"],
)
async def analyze_camera_sentiment(
    session_id: uuid.UUID,
    body: CameraSentimentRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Infer facial expression from a camera frame; optionally fuse with text sentiment."""
    if not await session_crud.is_participant(db, session_id, user.id):
        raise HTTPException(status_code=403, detail="Not a participant")

    result = await analyze_facial_sentiment(body.image_base64)
    fused_label, fused_confidence = fuse_sentiments(
        body.text_label,
        body.text_confidence,
        result.label,
        result.confidence,
    )
    return CameraSentimentResponse(
        label=result.label,
        confidence=result.confidence,
        method=result.method,
        fused_label=fused_label,
        fused_confidence=fused_confidence,
    )


@router.post("/notify-ticket", response_model=WsTicketResponse, tags=["realtime"])
async def issue_notify_ticket(user: User = Depends(get_current_user)):
    """Issue a short-lived token for the global /ws/notify notification socket.

    This endpoint does not require the user to be a participant in any session.
    It is called by authenticated pages (lobby, dashboard) so they can receive
    peer_joined notifications in real time.
    """
    token = create_notify_ticket(user.id)
    return WsTicketResponse(
        token=token,
        expires_in=settings.ws_ticket_expire_minutes * 60,
    )

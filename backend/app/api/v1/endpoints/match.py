from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.session_api import MatchEnqueueRequest, MatchEnqueueResponse, MatchResultResponse
from app.services import matching_service

router = APIRouter(prefix="/match", tags=["match"])


@router.post("/enqueue", response_model=MatchEnqueueResponse)
async def match_enqueue(
    body: MatchEnqueueRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    queue_role = matching_service.resolve_queue_role(user, body.role_normalized)

    status, session_id, hint = await matching_service.enqueue(db, user, queue_role=queue_role)
    return MatchEnqueueResponse(
        status=status,
        session_id=str(session_id) if session_id else None,
        position_hint=hint,
    )


@router.get("/poll", response_model=MatchResultResponse)
async def match_poll(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Call while waiting so the first user in the queue redirects when a partner arrives."""
    sid = await matching_service.poll_assigned_matched_session(db, user.id)
    return MatchResultResponse(matched=sid is not None, session_id=str(sid) if sid else None)


@router.delete("/dequeue", status_code=204, response_class=Response)
async def match_dequeue(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await matching_service.dequeue(db, user)
    return Response(status_code=204)

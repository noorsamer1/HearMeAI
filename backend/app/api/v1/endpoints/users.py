from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.session_api import UserMeOut, UserPreferencesPatch

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserMeOut)
async def read_me(user: User = Depends(get_current_user)):
    return UserMeOut(
        id=str(user.id),
        email=user.email,
        display_name=user.display_name,
        user_type=user.user_type,
        locale=user.locale,
        font_scale=user.font_scale,
        high_contrast=user.high_contrast,
    )


@router.patch("/me", response_model=UserMeOut)
async def update_me(
    body: UserPreferencesPatch,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if body.display_name is not None:
        user.display_name = body.display_name
    if body.locale is not None:
        user.locale = body.locale
    if body.font_scale is not None:
        user.font_scale = body.font_scale
    if body.high_contrast is not None:
        user.high_contrast = body.high_contrast
    await db.flush()
    return UserMeOut(
        id=str(user.id),
        email=user.email,
        display_name=user.display_name,
        user_type=user.user_type,
        locale=user.locale,
        font_scale=user.font_scale,
        high_contrast=user.high_contrast,
    )

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email.lower()))
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: uuid.UUID) -> User | None:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def create_user(
    db: AsyncSession,
    *,
    email: str,
    password_hash: str,
    display_name: str,
    user_type: str,
    locale: str = "en",
) -> User:
    user = User(
        email=email.lower(),
        password_hash=password_hash,
        display_name=display_name,
        user_type=user_type,
        locale=locale,
    )
    db.add(user)
    await db.flush()
    return user

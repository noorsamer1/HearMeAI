import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    display_name: Mapped[str] = mapped_column(String(120), nullable=False)
    user_type: Mapped[str] = mapped_column(String(16), nullable=False)  # deaf | mute | both
    locale: Mapped[str] = mapped_column(String(32), default="en", server_default="en")
    font_scale: Mapped[str] = mapped_column(String(16), default="normal", server_default="normal")
    high_contrast: Mapped[bool] = mapped_column(default=False, server_default="false")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    last_seen_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    sessions_created = relationship("ChatSession", back_populates="creator", foreign_keys="ChatSession.created_by")
    participations = relationship("SessionParticipant", back_populates="user")

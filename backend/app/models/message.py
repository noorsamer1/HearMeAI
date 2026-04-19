import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    session_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("sessions.id", ondelete="CASCADE"), index=True, nullable=False
    )
    sender_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    kind: Mapped[str] = mapped_column(String(32), nullable=False)
    content_text: Mapped[str] = mapped_column(Text, nullable=False)
    raw_audio_ref: Mapped[str | None] = mapped_column(String(512), nullable=True)
    stt_provider: Mapped[str | None] = mapped_column(String(64), nullable=True)
    tts_provider: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )

    session = relationship("ChatSession", back_populates="messages")
    ai_meta = relationship("MessageAiMetadata", back_populates="message", uselist=False, cascade="all, delete-orphan")


class MessageAiMetadata(Base):
    __tablename__ = "message_ai_metadata"

    message_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("messages.id", ondelete="CASCADE"), primary_key=True
    )
    sentiment_label: Mapped[str | None] = mapped_column(String(32), nullable=True)
    sentiment_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    intent: Mapped[str | None] = mapped_column(String(32), nullable=True)
    llm_model: Mapped[str | None] = mapped_column(String(128), nullable=True)
    prompt_version: Mapped[str | None] = mapped_column(String(32), nullable=True)
    tokens_in: Mapped[int | None] = mapped_column(Integer, nullable=True)
    tokens_out: Mapped[int | None] = mapped_column(Integer, nullable=True)
    enhancement_text: Mapped[str | None] = mapped_column(Text, nullable=True)

    message = relationship("Message", back_populates="ai_meta")

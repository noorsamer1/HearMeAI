import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.message import Message, MessageAiMetadata


async def create_message(
    db: AsyncSession,
    *,
    session_id: uuid.UUID,
    sender_id: uuid.UUID | None,
    kind: str,
    content_text: str,
    message_id: uuid.UUID | None = None,
    stt_provider: str | None = None,
    tts_provider: str | None = None,
) -> Message:
    msg = Message(
        id=message_id or uuid.uuid4(),
        session_id=session_id,
        sender_id=sender_id,
        kind=kind,
        content_text=content_text,
        stt_provider=stt_provider,
        tts_provider=tts_provider,
    )
    db.add(msg)
    await db.flush()
    return msg


async def upsert_ai_metadata(
    db: AsyncSession,
    message_id: uuid.UUID,
    *,
    sentiment_label: str | None = None,
    sentiment_score: float | None = None,
    intent: str | None = None,
    llm_model: str | None = None,
    prompt_version: str | None = None,
    tokens_in: int | None = None,
    tokens_out: int | None = None,
    enhancement_text: str | None = None,
) -> MessageAiMetadata:
    existing = await db.get(MessageAiMetadata, message_id)
    if existing:
        if sentiment_label is not None:
            existing.sentiment_label = sentiment_label
        if sentiment_score is not None:
            existing.sentiment_score = sentiment_score
        if intent is not None:
            existing.intent = intent
        if llm_model is not None:
            existing.llm_model = llm_model
        if prompt_version is not None:
            existing.prompt_version = prompt_version
        if tokens_in is not None:
            existing.tokens_in = tokens_in
        if tokens_out is not None:
            existing.tokens_out = tokens_out
        if enhancement_text is not None:
            existing.enhancement_text = enhancement_text
        await db.flush()
        return existing
    return await attach_ai_metadata(
        db,
        message_id,
        sentiment_label=sentiment_label,
        sentiment_score=sentiment_score,
        intent=intent,
        llm_model=llm_model,
        prompt_version=prompt_version,
        tokens_in=tokens_in,
        tokens_out=tokens_out,
        enhancement_text=enhancement_text,
    )


async def attach_ai_metadata(
    db: AsyncSession,
    message_id: uuid.UUID,
    *,
    sentiment_label: str | None = None,
    sentiment_score: float | None = None,
    intent: str | None = None,
    llm_model: str | None = None,
    prompt_version: str | None = None,
    tokens_in: int | None = None,
    tokens_out: int | None = None,
    enhancement_text: str | None = None,
) -> MessageAiMetadata:
    meta = MessageAiMetadata(
        message_id=message_id,
        sentiment_label=sentiment_label,
        sentiment_score=sentiment_score,
        intent=intent,
        llm_model=llm_model,
        prompt_version=prompt_version,
        tokens_in=tokens_in,
        tokens_out=tokens_out,
        enhancement_text=enhancement_text,
    )
    db.add(meta)
    await db.flush()
    return meta


async def list_messages(
    db: AsyncSession,
    session_id: uuid.UUID,
    *,
    limit: int = 50,
    offset: int = 0,
) -> list[Message]:
    q = (
        select(Message)
        .where(Message.session_id == session_id)
        .options(selectinload(Message.ai_meta))
        .order_by(Message.created_at.asc())
        .offset(offset)
        .limit(limit + 1)
    )
    result = await db.execute(q)
    return list(result.scalars().all())

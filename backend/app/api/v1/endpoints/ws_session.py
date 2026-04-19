"""
WebSocket session: legacy single-client mode (no token) or authenticated multi-peer rooms.

Query: ?token=<ws_ticket_jwt> for DB-backed sessions (see POST /sessions/{id}/ws-ticket).
"""

import base64
import uuid
from uuid import UUID, uuid4

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect
from jose import JWTError

from app.core.config import get_settings
from app.core.logging_config import get_logger
from app.core.security import decode_token, parse_uuid_sub
from app.crud import chat_session as session_crud
from app.crud import message as message_crud
from app.db.session import get_session_factory
from app.realtime import room_manager
from app.services.ai_context import classify_text, enhance_text
from app.services.context_manager import context_registry
from app.services.language_detector import compute_readability_score, detect_language, normalize_text
from app.services.openrouter_client import get_llm_client
from app.services.sign_phrase_service import best_sign_suggestion
from app.services.stt_service import get_stt_service
from app.services.tts_service import VOICE_MAP, get_tts_service
from app.services.ws_redis import broadcast_fanout

router = APIRouter()
logger = get_logger(__name__)
settings = get_settings()


async def _stream_llm(llm, messages: list, message_id: str, send_fn) -> str:
    full_text = ""
    try:
        async for token in llm.stream_chat(messages):
            full_text += token
            await send_fn({"type": "ai_partial", "text": full_text, "messageId": message_id})

        await send_fn({"type": "ai_final", "text": full_text.strip(), "messageId": message_id})
    except Exception as exc:
        logger.error("LLM stream error", error=str(exc))
        await send_fn({"type": "error", "message": "AI response failed", "code": "llm_error"})

    return full_text.strip()


@router.websocket("/ws/session/{session_id}")
async def websocket_session(
    websocket: WebSocket,
    session_id: str,
    token: str | None = Query(None),
):
    room_mode = False
    user_uuid: UUID | None = None
    user_key = "anon"

    if token:
        try:
            payload = decode_token(token)
            if payload.get("typ") != "ws":
                await websocket.close(code=4401)
                return
            user_uuid = parse_uuid_sub(payload)
            if str(payload.get("sid")) != session_id:
                await websocket.close(code=4403)
                return
            factory = get_session_factory()
            async with factory() as db:
                ok = await session_crud.is_participant(db, UUID(session_id), user_uuid)
                await db.commit()
            if not ok:
                await websocket.close(code=4403)
                return
            room_mode = True
            user_key = str(user_uuid)
        except (JWTError, ValueError):
            await websocket.close(code=4401)
            return

    await room_manager.connect(session_id, user_key, websocket)

    stt = get_stt_service()
    tts = get_tts_service()
    llm = get_llm_client()
    ctx = context_registry.get_or_create(session_id)

    audio_buffer = bytearray()
    audio_mime = "audio/webm"

    async def send(data: dict):
        try:
            await websocket.send_json(data)
        except Exception:
            pass

    async def set_status(state: str):
        await send({"type": "status", "state": state})

    async def load_room_ai_flag() -> bool:
        if not room_mode:
            return True
        factory = get_session_factory()
        async with factory() as db:
            s = await session_crud.get_session(db, UUID(session_id))
            await db.commit()
            return bool(s and s.ai_assist_enabled)

    async def persist_and_fanout_transcript(
        text: str,
        msg_uuid: UUID,
        *,
        confidence: float,
        lang: str,
    ) -> None:
        if not room_mode or user_uuid is None:
            return
        factory = get_session_factory()
        async with factory() as db:
            await message_crud.create_message(
                db,
                session_id=UUID(session_id),
                sender_id=user_uuid,
                kind="transcript",
                content_text=text,
                message_id=msg_uuid,
                stt_provider=settings.stt_provider,
            )
            sign = await best_sign_suggestion(db, text, locale=lang[:2] if lang else "en")
            await db.commit()
        await broadcast_fanout(
            session_id,
            {
                "type": "message",
                "kind": "transcript",
                "text": text,
                "messageId": str(msg_uuid),
                "senderId": user_key,
                "lang": lang,
                "confidence": confidence,
            },
            exclude_user_key=user_key,
        )
        if sign:
            await broadcast_fanout(session_id, {"type": "sign_suggestion", **sign}, exclude_user_key=None)

    async def persist_and_fanout_user_text(text: str, msg_uuid: UUID, lang: str) -> None:
        if not room_mode or user_uuid is None:
            return
        factory = get_session_factory()
        async with factory() as db:
            await message_crud.create_message(
                db,
                session_id=UUID(session_id),
                sender_id=user_uuid,
                kind="user_text",
                content_text=text,
                message_id=msg_uuid,
            )
            sign = await best_sign_suggestion(db, text, locale=lang[:2] if lang else "en")
            await db.commit()
        await broadcast_fanout(
            session_id,
            {
                "type": "message",
                "kind": "user_text",
                "text": text,
                "messageId": str(msg_uuid),
                "senderId": user_key,
                "lang": lang,
            },
            exclude_user_key=user_key,
        )
        if sign:
            await broadcast_fanout(session_id, {"type": "sign_suggestion", **sign}, exclude_user_key=None)

    async def save_ai_meta(
        msg_uuid: UUID,
        classification: dict,
        enhancement: str,
        *,
        model_name: str,
    ) -> None:
        if not room_mode:
            return
        factory = get_session_factory()
        async with factory() as db:
            await message_crud.upsert_ai_metadata(
                db,
                msg_uuid,
                sentiment_label=str(classification.get("emotion", "neutral")),
                sentiment_score=float(classification.get("confidence") or 0.0),
                intent=str(classification.get("intent", "other")),
                llm_model=model_name,
                prompt_version="v1",
                enhancement_text=enhancement or None,
            )
            await db.commit()

    async def handle_audio_end(lang_hint: str | None):
        if not audio_buffer:
            return

        audio_data = bytes(audio_buffer)
        audio_buffer.clear()
        await set_status("processing")

        try:
            result = await stt.transcribe(
                audio_data=audio_data,
                language_hint=None if lang_hint in (None, "auto") else lang_hint,
                mime_type=audio_mime,
            )
        except Exception as exc:
            logger.error("STT failed", session_id=session_id, error=str(exc))
            await send({"type": "error", "message": "Transcription failed", "code": "stt_error"})
            await set_status("idle")
            return

        text = normalize_text(result.text)
        if not text:
            await set_status("idle")
            return

        detected_lang = result.detected_language
        if detected_lang in ("", "unknown", None):
            detected_lang, _ = detect_language(text)
        ctx.set_language(detected_lang)

        msg_uuid = uuid4()
        await persist_and_fanout_transcript(
            text,
            msg_uuid,
            confidence=result.confidence,
            lang=detected_lang,
        )

        await send({
            "type": "transcript_final",
            "text": text,
            "confidence": result.confidence,
            "lang": detected_lang,
            "messageId": str(msg_uuid),
        })

        ai_assist = await load_room_ai_flag()
        classification: dict = {}
        enhancement = ""

        if settings.openrouter_api_key:
            classification = await classify_text(text)
            await send(
                {
                    "type": "sentiment",
                    "label": classification.get("emotion", "neutral"),
                    "intent": classification.get("intent", "other"),
                    "confidence": classification.get("confidence", 0.0),
                    "messageId": str(msg_uuid),
                }
            )

        ctx.add("user", text)

        if ai_assist:
            ai_id = str(uuid4())
            full_response = await _stream_llm(llm, ctx.get_messages(), ai_id, send)
            if full_response:
                readability = compute_readability_score(full_response)
                await send(
                    {
                        "type": "ai_final_meta",
                        "messageId": ai_id,
                        "readabilityScore": readability,
                    }
                )
                ctx.add("assistant", full_response)
                enhancement = full_response
            if room_mode and classification and not enhancement:
                enhancement = await enhance_text(text, classification, locale=detected_lang[:2])
                if enhancement:
                    await send(
                        {
                            "type": "ai_enhancement",
                            "text": enhancement,
                            "messageId": str(msg_uuid),
                        }
                    )
        elif settings.openrouter_api_key and room_mode:
            enhancement = await enhance_text(text, classification, locale=detected_lang[:2])
            if enhancement:
                await send(
                    {
                        "type": "ai_enhancement",
                        "text": enhancement,
                        "messageId": str(msg_uuid),
                    }
                )

        if room_mode and settings.openrouter_api_key:
            await save_ai_meta(
                msg_uuid,
                classification,
                enhancement,
                model_name=settings.enhancer_model_name if enhancement else settings.classifier_model,
            )

        await set_status("idle")

    async def handle_user_text(text: str, request_tts: bool, lang: str):
        text = normalize_text(text)
        if not text:
            return

        if not lang or lang == "auto":
            lang, _ = detect_language(text)
        ctx.set_language(lang)

        msg_uuid = uuid4()
        await persist_and_fanout_user_text(text, msg_uuid, lang)
        ctx.add("user", text)

        if request_tts:
            await set_status("speaking")
            try:
                audio_b64, duration = await tts.synthesize(text=text, language=lang)
                lang_key = lang[:2].lower()
                voices = VOICE_MAP.get(lang_key, VOICE_MAP["en"])
                voice_name = voices["default"]
                payload = {
                    "type": "tts_ready",
                    "audio": audio_b64,
                    "messageId": str(msg_uuid),
                    "duration": round(duration, 2),
                    "voice": voice_name,
                }
                await send(payload)
                await broadcast_fanout(session_id, payload, exclude_user_key=user_key)
            except Exception as exc:
                logger.error("TTS failed", session_id=session_id, error=str(exc))
                await send({"type": "error", "message": "Speech synthesis failed", "code": "tts_error"})
            await set_status("idle")
            return

        ai_assist = await load_room_ai_flag()
        classification: dict = {}
        if settings.openrouter_api_key:
            classification = await classify_text(text)
            await send(
                {
                    "type": "sentiment",
                    "label": classification.get("emotion", "neutral"),
                    "intent": classification.get("intent", "other"),
                    "confidence": classification.get("confidence", 0.0),
                    "messageId": str(msg_uuid),
                }
            )

        if ai_assist:
            await set_status("processing")
            ai_id = str(uuid4())
            full_response = await _stream_llm(llm, ctx.get_messages(), ai_id, send)
            if full_response:
                ctx.add("assistant", full_response)
                if room_mode and settings.openrouter_api_key:
                    await save_ai_meta(
                        msg_uuid,
                        classification,
                        full_response,
                        model_name=settings.openrouter_model,
                    )
            await set_status("idle")
        elif room_mode and settings.openrouter_api_key:
            enhancement = await enhance_text(text, classification, locale=lang[:2])
            if enhancement:
                await send(
                    {
                        "type": "ai_enhancement",
                        "text": enhancement,
                        "messageId": str(msg_uuid),
                    }
                )
            await save_ai_meta(
                msg_uuid,
                classification,
                enhancement,
                model_name=settings.enhancer_model_name,
            )

    async def handle_action(action: str, text: str, target_lang: str | None, source_msg_id: str):
        await set_status("processing")
        result_id = str(uuid4())
        full_result = ""

        try:
            async for token in llm.stream_action(action=action, text=text, target_language=target_lang):
                full_result += token
                await send(
                    {
                        "type": "ai_partial",
                        "text": full_result,
                        "messageId": result_id,
                        "action": action,
                        "sourceMessageId": source_msg_id,
                    }
                )

            result_text = full_result.strip()
            await send(
                {
                    "type": "ai_final",
                    "text": result_text,
                    "messageId": result_id,
                    "action": action,
                    "sourceMessageId": source_msg_id,
                    "readabilityScore": compute_readability_score(result_text),
                }
            )
        except Exception as exc:
            logger.error("Action failed", action=action, session_id=session_id, error=str(exc))
            await send({"type": "error", "message": f"Action '{action}' failed", "code": "action_error"})

        await set_status("idle")

    try:
        while True:
            event = await websocket.receive_json()
            event_type = event.get("type", "")

            if event_type == "audio_chunk":
                raw = event.get("data", "")
                if raw:
                    chunk_bytes = base64.b64decode(raw)
                    audio_buffer.extend(chunk_bytes)
                if event.get("mimeType"):
                    audio_mime = event["mimeType"]
                await set_status("listening")

            elif event_type == "audio_end":
                lang = event.get("lang", "auto")
                await handle_audio_end(lang)

            elif event_type == "user_text":
                text = event.get("text", "").strip()
                if not text:
                    continue
                request_tts = bool(event.get("requestTTS", False))
                u_lang = event.get("lang", "en")
                await handle_user_text(text, request_tts, u_lang)

            elif event_type == "action":
                action = event.get("action", "")
                text = event.get("text", "")
                target_lang = event.get("targetLang")
                source_msg_id = event.get("messageId", str(uuid4()))
                if action and text:
                    await handle_action(action, text, target_lang, source_msg_id)

            elif event_type == "ping":
                await send({"type": "pong"})

            else:
                logger.warning("Unknown WS event", event_type=event_type, session_id=session_id)

    except WebSocketDisconnect:
        room_manager.disconnect(session_id, user_key)
        context_registry.delete(session_id)
    except Exception as exc:
        logger.error("WebSocket error", session_id=session_id, error=str(exc))
        try:
            await send({"type": "error", "message": "Session error", "code": "session_error"})
        except Exception:
            pass
        room_manager.disconnect(session_id, user_key)
        context_registry.delete(session_id)

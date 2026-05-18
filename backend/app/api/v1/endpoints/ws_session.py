"""
WebSocket session: legacy single-client mode (no token) or authenticated multi-peer rooms.

Query: ?token=<ws_ticket_jwt> for DB-backed sessions (see POST /sessions/{id}/ws-ticket).
"""

import asyncio
import base64
import json
import re
import uuid
from pathlib import Path
from uuid import UUID, uuid4

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect
from jose import JWTError

from app.core.config import get_settings
from app.core.logging_config import get_logger
from app.core.security import decode_token, parse_uuid_sub
from app.crud import chat_session as session_crud
from app.crud import message as message_crud
from app.crud import user as user_crud
from app.db.session import get_session_factory
from app.realtime import room_manager
from app.services.ai_context import classify_text, enhance_text
from app.utils.text_cleanup import strip_stage_directions
from app.services.emotion_aware_prompt import (
    EMOTION_CONFIDENCE_THRESHOLD,
    build_emotion_aware_system_prompt,
    build_emotion_llm_messages,
    build_peer_sentiment_fields,
    emotion_is_active,
    normalize_emotion_label,
    resolve_user_emotion,
    sanitize_emotion_reply,
)
from app.services.context_manager import context_registry
from app.services.language_detector import compute_readability_score, detect_language, normalize_text
from app.services.openrouter_client import get_llm_client
from app.services.sign_phrase_service import best_sign_suggestion
from app.services.audio_convert import AudioConversionError, hex_prefix, normalize_mime_type
from app.services.stt_service import get_stt_service
from app.services.tts_service import get_tts_service
from app.services.ws_redis import broadcast_fanout

router = APIRouter()
logger = get_logger(__name__)
settings = get_settings()
SIGN_POSES = {"neutral", "wave", "thank-you", "yes", "no", "please", "help", "question"}
CHUNK_THRESHOLD_BYTES = 150_000  # ~10 s of 16 kHz audio at 128 kbps
TOKEN_RE = re.compile(r"[\w']+", re.UNICODE)
BACKEND_ROOT = Path(__file__).resolve().parents[4]
ARTIFACTS_DIR = BACKEND_ROOT / "artifacts" / "sign"
MOTION_VOCAB_PATH = ARTIFACTS_DIR / "motion_vocab.json"
TRANSITION_STATS_PATH = ARTIFACTS_DIR / "pose_transition_stats.json"
_ARTIFACT_CACHE: dict[str, object] = {"loaded": False}


def _load_sign_artifacts() -> tuple[dict[str, list[list]], dict]:
    """Load artifact-backed sign planning resources with lightweight caching."""
    vocab_mtime = MOTION_VOCAB_PATH.stat().st_mtime if MOTION_VOCAB_PATH.exists() else None
    trans_mtime = TRANSITION_STATS_PATH.stat().st_mtime if TRANSITION_STATS_PATH.exists() else None
    cache_ready = (
        _ARTIFACT_CACHE.get("loaded")
        and _ARTIFACT_CACHE.get("vocab_mtime") == vocab_mtime
        and _ARTIFACT_CACHE.get("trans_mtime") == trans_mtime
    )
    if cache_ready:
        vocab = _ARTIFACT_CACHE.get("motion_vocab", {})
        transitions = _ARTIFACT_CACHE.get("transition_stats", {})
        return vocab if isinstance(vocab, dict) else {}, transitions if isinstance(transitions, dict) else {}

    motion_vocab: dict[str, list[list]] = {}
    transition_stats: dict = {}
    try:
        if MOTION_VOCAB_PATH.exists():
            motion_vocab = json.loads(MOTION_VOCAB_PATH.read_text(encoding="utf-8"))
        if TRANSITION_STATS_PATH.exists():
            transition_stats = json.loads(TRANSITION_STATS_PATH.read_text(encoding="utf-8"))
    except Exception as exc:
        logger.debug("failed loading sign artifacts", error=str(exc))
        motion_vocab = {}
        transition_stats = {}

    _ARTIFACT_CACHE.update(
        {
            "loaded": True,
            "vocab_mtime": vocab_mtime,
            "trans_mtime": trans_mtime,
            "motion_vocab": motion_vocab,
            "transition_stats": transition_stats,
        }
    )
    return motion_vocab, transition_stats



# Direct phrase-to-pose mapping for common greetings and phrases.
# This is the first-pass lookup before artifacts or LLM.
_PHRASE_POSE_MAP: list[tuple[list[str], list[dict]]] = [
    (
        ["hello", "hi", "hey", "مرحبا", "اهلا", "أهلا", "السلام عليكم"],
        [{"pose": "wave", "durationMs": 1000}, {"pose": "neutral", "durationMs": 600}],
    ),
    (
        ["thank you", "thanks", "شكرا", "شكرًا", "شكراً"],
        [{"pose": "thank-you", "durationMs": 1200}, {"pose": "neutral", "durationMs": 600}],
    ),
    (
        ["how are you", "how r you", "كيف حالك", "كيف حالكم", "كيف الحال"],
        [
            {"pose": "wave", "durationMs": 700},
            {"pose": "question", "durationMs": 1100},
            {"pose": "neutral", "durationMs": 600},
        ],
    ),
    (
        ["help", "ساعدني", "مساعدة"],
        [{"pose": "help", "durationMs": 1200}, {"pose": "neutral", "durationMs": 600}],
    ),
    (
        ["please", "من فضلك", "لو سمحت"],
        [{"pose": "please", "durationMs": 1100}, {"pose": "neutral", "durationMs": 600}],
    ),
    (
        ["yes", "نعم", "ايوه", "أيوه"],
        [{"pose": "yes", "durationMs": 1000}, {"pose": "neutral", "durationMs": 600}],
    ),
    (
        ["no", "لا"],
        [{"pose": "no", "durationMs": 1000}, {"pose": "neutral", "durationMs": 600}],
    ),
    (
        ["good morning", "صباح الخير"],
        [{"pose": "wave", "durationMs": 900}, {"pose": "neutral", "durationMs": 600}],
    ),
    (
        ["good evening", "مساء الخير"],
        [{"pose": "wave", "durationMs": 900}, {"pose": "neutral", "durationMs": 600}],
    ),
    (
        ["goodbye", "bye", "see you", "مع السلامة"],
        [{"pose": "wave", "durationMs": 1100}, {"pose": "neutral", "durationMs": 600}],
    ),
]


def _phrase_sign_plan(text: str) -> dict | None:
    """Fast direct phrase lookup — no artifacts, no LLM needed."""
    normalized = (text or "").strip().lower()
    for phrases, sequence in _PHRASE_POSE_MAP:
        for phrase in phrases:
            if phrase in normalized:
                return {"phraseKey": phrase.replace(" ", "-"), "sequence": sequence}
    return None


def _artifact_motion_plan(text: str, lang: str) -> dict | None:
    """Build sign motion plan from local training artifacts.
    Returns None if the plan would contain only neutral poses (lets LLM take over)."""
    clean_text = (text or "").strip().lower()
    if not clean_text:
        return None

    motion_vocab, transition_stats = _load_sign_artifacts()
    if not motion_vocab:
        return None

    tokens = TOKEN_RE.findall(clean_text)
    if not tokens:
        return None

    fallback_pose = str(transition_stats.get("fallback_pose") or "neutral")
    if fallback_pose not in SIGN_POSES:
        fallback_pose = "neutral"

    plan_steps: list[dict] = []
    for token in tokens[:6]:
        candidates = motion_vocab.get(token, [])
        pose = fallback_pose
        if candidates and isinstance(candidates, list):
            top = candidates[0]
            if isinstance(top, list) and top:
                candidate_pose = str(top[0]).strip()
                if candidate_pose in SIGN_POSES:
                    pose = candidate_pose
        if plan_steps and plan_steps[-1]["pose"] == pose:
            continue
        plan_steps.append({"pose": pose, "durationMs": 900})

    if not plan_steps:
        return None

    # If every step is the neutral fallback pose the plan carries no information;
    # return None so the LLM can generate a more meaningful plan.
    has_meaningful = any(s["pose"] != "neutral" for s in plan_steps)
    if not has_meaningful:
        return None

    if plan_steps[-1]["pose"] != "neutral":
        plan_steps.append({"pose": "neutral", "durationMs": 700})

    return {"phraseKey": f"artifact-{lang[:2] or 'ar'}", "sequence": plan_steps}


async def _emit_emotion_tuned_if_active(
    send_fn,
    *,
    ai_message_id: str,
    emotion_label: str | None,
    emotion_conf: float | None,
) -> None:
    """Tell the client the assistant reply tone was shaped by fused sentiment."""
    if not emotion_label or (emotion_conf or 0) < EMOTION_CONFIDENCE_THRESHOLD:
        return
    label = normalize_emotion_label(emotion_label) or emotion_label
    await send_fn(
        {
            "type": "emotion_tuned",
            "messageId": ai_message_id,
            "label": label,
            "confidence": float(emotion_conf or 0),
        }
    )


def _camera_sentiment_from_event(event: dict) -> tuple[str | None, float | None]:
    """Optional live camera sentiment attached by the client."""
    label = event.get("cameraLabel") or event.get("camera_label")
    raw_conf = event.get("cameraConfidence")
    if raw_conf is None:
        raw_conf = event.get("camera_confidence")
    if not label:
        return None, None
    try:
        conf = float(raw_conf) if raw_conf is not None else None
    except (TypeError, ValueError):
        conf = None
    return str(label).strip() or None, conf


def _manual_mood_from_event(event: dict) -> str | None:
    """Mood emoji picked by the sender before send (neutral, angry, happy, etc.)."""
    raw = event.get("moodLabel") or event.get("mood_label")
    if not raw:
        return None
    label = str(raw).strip()
    return label or None


def _mood_inputs_from_event(event: dict) -> tuple[str | None, str | None, float | None]:
    """Manual picker overrides camera; returns (manual, camera_label, camera_conf)."""
    manual = _manual_mood_from_event(event)
    if manual:
        return manual, None, None
    cam_label, cam_conf = _camera_sentiment_from_event(event)
    return None, cam_label, cam_conf


async def _stream_llm(
    llm,
    messages: list,
    message_id: str,
    send_fn,
    *,
    system_override: str | None = None,
    temperature: float | None = None,
) -> str:
    full_text = ""
    try:
        async def _do_stream():
            nonlocal full_text
            async for token in llm.stream_chat(
                messages,
                system_override=system_override,
                temperature=temperature,
            ):
                full_text += token
                await send_fn(
                    {
                        "type": "ai_partial",
                        "text": strip_stage_directions(full_text),
                        "messageId": message_id,
                    }
                )

        await asyncio.wait_for(_do_stream(), timeout=60.0)
        cleaned = strip_stage_directions(full_text.strip())
        await send_fn({"type": "ai_final", "text": cleaned, "messageId": message_id})
        return cleaned
    except asyncio.TimeoutError:
        logger.error("LLM stream timed out", message_id=message_id)
        await send_fn({"type": "error", "message": "AI response timed out", "code": "llm_timeout"})
        cleaned = strip_stage_directions(full_text.strip())
        await send_fn(
            {"type": "ai_final", "text": cleaned, "messageId": message_id, "error": True}
        )
        return cleaned
    except Exception as exc:
        logger.error("LLM stream error", error=str(exc))
        await send_fn({"type": "error", "message": "AI response failed", "code": "llm_error"})
        cleaned = strip_stage_directions(full_text.strip())
        await send_fn(
            {"type": "ai_final", "text": cleaned, "messageId": message_id, "error": True}
        )
        return cleaned


async def _generate_mood_aware_reply(
    llm,
    ctx,
    user_text: str,
    lang: str,
    ai_id: str,
    send_fn,
    *,
    emotion_label: str | None,
    emotion_conf: float | None,
) -> str:
    """Stream assistant reply; enforce mood acknowledgment when mood is confident."""
    system_prompt = build_emotion_aware_system_prompt(emotion_label, emotion_conf)
    if emotion_is_active(emotion_label, emotion_conf):
        messages = build_emotion_llm_messages(user_text)
        raw = await _stream_llm(
            llm,
            messages,
            ai_id,
            send_fn,
            system_override=system_prompt,
            temperature=0.35,
        )
        final = sanitize_emotion_reply(raw, emotion_label or "", lang)
        if final != raw:
            await send_fn({"type": "ai_final", "text": final, "messageId": ai_id})
        return final

    return await _stream_llm(
        llm,
        ctx.get_messages(),
        ai_id,
        send_fn,
        system_override=system_prompt,
    )


async def _build_sign_motion_plan(llm, text: str, lang: str) -> dict | None:
    """Build a signer pose timeline for the given text.

    Priority: direct phrase map → artifact vocab → LLM fallback.
    """
    # 1. Fast phrase-to-pose lookup (e.g. "hello" → wave)
    phrase_plan = _phrase_sign_plan(text)
    if phrase_plan:
        return phrase_plan

    # 2. Artifact vocab (only used when it produces non-neutral poses)
    artifact_plan = _artifact_motion_plan(text, lang)
    if artifact_plan:
        return artifact_plan

    if not settings.openrouter_api_key:
        return None
    clean_text = (text or "").strip()
    if not clean_text:
        return None

    short_text = clean_text[:280]
    messages = [
        {
            "role": "system",
            "content": (
                "Return ONLY JSON. Create a signer motion plan from user text. "
                "Allowed poses: neutral, wave, thank-you, yes, no, please, help, question. "
                "Use 1-6 steps, each with durationMs between 350 and 2200. "
                "Do not use any pose outside the list."
            ),
        },
        {
            "role": "user",
            "content": (
                f"language={lang}\n"
                f"text={short_text}\n\n"
                'JSON schema: {"phraseKey":"string","sequence":[{"pose":"wave","durationMs":900}]}\n'
                "If greeting, include wave early. If uncertain, use neutral."
            ),
        },
    ]

    try:
        raw = await llm.complete_with_model(
            model=settings.classifier_model,
            messages=messages,
            temperature=0.2,
            max_tokens=260,
            json_mode=True,
        )
        payload = json.loads(raw)
    except Exception as exc:
        logger.debug("sign motion plan generation failed", error=str(exc))
        return None

    if not isinstance(payload, dict):
        return None

    phrase_key = str(payload.get("phraseKey") or "llm-plan").strip() or "llm-plan"
    sequence_in = payload.get("sequence")
    if not isinstance(sequence_in, list):
        return None

    sequence: list[dict] = []
    for step in sequence_in[:6]:
        if not isinstance(step, dict):
            continue
        pose = str(step.get("pose") or "").strip()
        if pose not in SIGN_POSES:
            continue
        try:
            duration = int(step.get("durationMs"))
        except (TypeError, ValueError):
            continue
        duration = max(350, min(duration, 2200))
        sequence.append({"pose": pose, "durationMs": duration})

    if not sequence:
        return None

    return {"phraseKey": phrase_key, "sequence": sequence}


async def _notify_peers_of_join(
    session_id: str,
    joining_user_key: str,
    display_name: str,
) -> None:
    """When a user joins a room, notify any other session participants who are online."""
    try:
        factory = get_session_factory()
        async with factory() as db:
            participant_ids = await session_crud.list_participant_user_ids(db, UUID(session_id))
            await db.commit()

        for pid in participant_ids:
            pid_str = str(pid)
            if pid_str == joining_user_key:
                continue
            if room_manager.is_user_online_anywhere(pid_str):
                await room_manager.send_to_user_globally(
                    pid_str,
                    {
                        "type": "peer_joined",
                        "senderName": display_name,
                        "sessionId": session_id,
                        "message": f"{display_name} is online and wants to chat.",
                    },
                )
                logger.info(
                    "peer_join_notified",
                    session_id=session_id,
                    joining=joining_user_key,
                    notified=pid_str,
                )
    except Exception as exc:
        logger.warning("peer_join_notify_failed", session_id=session_id, error=str(exc))


async def _get_deaf_peer_keys(session_id: str, exclude_user_id: "UUID | None") -> list[str]:
    """Return user_keys of online peers in the session who are deaf or 'both'."""
    deaf_keys: list[str] = []
    try:
        factory = get_session_factory()
        async with factory() as db:
            participant_ids = await session_crud.list_participant_user_ids(db, UUID(session_id))
            for pid in participant_ids:
                if pid == exclude_user_id:
                    continue
                pid_str = str(pid)
                if not room_manager.is_user_online(pid_str):
                    continue
                # Only notify if they're currently in this session's room
                if room_manager.get_user_active_room(pid_str) != session_id:
                    continue
                user_obj = await user_crud.get_user_by_id(db, pid)
                if user_obj and getattr(user_obj, "user_type", "") in ("deaf", "both"):
                    deaf_keys.append(pid_str)
            await db.commit()
    except Exception as exc:
        logger.warning("deaf_peer_lookup_failed", session_id=session_id, error=str(exc))
    return deaf_keys


@router.websocket("/ws/session/{session_id}")
async def websocket_session(
    websocket: WebSocket,
    session_id: str,
    token: str | None = Query(None),
):
    room_mode = False
    user_uuid: UUID | None = None
    user_key = str(uuid4())  # unique key for anonymous users
    user_display_name: str = "Peer"

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
                user_obj = await user_crud.get_user_by_id(db, user_uuid)
                if user_obj:
                    user_display_name = user_obj.display_name
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
    initial_peer_count = len(
        room_manager.local_peer_keys(session_id, exclude_user_key=user_key)
    )
    await websocket.send_json(
        {
            "type": "session_joined",
            "sessionId": session_id,
            "userId": user_key,
            "peerCount": initial_peer_count,
        }
    )
    await _broadcast_room_presence(session_id)

    # Notify other session participants who are online that this user has joined.
    if room_mode and user_uuid:
        await _notify_peers_of_join(session_id, str(user_uuid), user_display_name)

    stt = get_stt_service()
    tts = get_tts_service()
    llm = get_llm_client()
    ctx = context_registry.get_or_create(session_id)

    audio_buffer = bytearray()
    audio_mime = "audio/webm"
    chunk_byte_count = 0
    accept_audio_chunks = True
    listening_status_sent = False

    async def send(data: dict):
        try:
            await websocket.send_json(data)
        except Exception:
            pass

    async def set_status(state: str):
        await send({"type": "status", "state": state})

    def reopen_audio_capture() -> None:
        nonlocal accept_audio_chunks, listening_status_sent
        accept_audio_chunks = True
        listening_status_sent = False

    async def finish_audio_capture(status: str = "idle") -> None:
        await set_status(status)
        reopen_audio_capture()

    async def emit_sign_motion_plan(text: str, lang: str) -> None:
        plan = await _build_sign_motion_plan(llm, text, lang)
        if not plan:
            return
        payload = {"type": "sign_motion_plan", **plan}
        await send(payload)
        await broadcast_fanout(session_id, payload, exclude_user_key=None)

    async def load_room_ai_flag() -> bool:
        if not room_mode:
            return True
        # A human peer is present → let them handle the conversation; AI stays silent
        peers = room_manager.local_peer_keys(session_id, exclude_user_key=user_key)
        if peers:
            return False
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
        peer_sentiment: dict[str, str | float] | None = None,
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
        fanout_payload: dict = {
            "type": "message",
            "kind": "transcript",
            "text": text,
            "messageId": str(msg_uuid),
            "senderId": user_key,
            "senderName": user_display_name,
            "lang": lang,
            "confidence": confidence,
        }
        if peer_sentiment:
            fanout_payload.update(peer_sentiment)
        await broadcast_fanout(
            session_id,
            fanout_payload,
            exclude_user_key=user_key,
        )
        if sign:
            await broadcast_fanout(session_id, {"type": "sign_suggestion", **sign}, exclude_user_key=None)

    async def persist_and_fanout_user_text(
        text: str,
        msg_uuid: UUID,
        lang: str,
        *,
        peer_sentiment: dict[str, str | float] | None = None,
    ) -> None:
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
        fanout_payload: dict = {
            "type": "message",
            "kind": "user_text",
            "text": text,
            "messageId": str(msg_uuid),
            "senderId": user_key,
            "senderName": user_display_name,
            "lang": lang,
        }
        if peer_sentiment:
            fanout_payload.update(peer_sentiment)
        await broadcast_fanout(
            session_id,
            fanout_payload,
            exclude_user_key=user_key,
        )
        if sign:
            await broadcast_fanout(session_id, {"type": "sign_suggestion", **sign}, exclude_user_key=None)

    async def persist_ai_assistant_message(
        content: str,
        message_id: UUID,
        *,
        action: str | None = None,
    ) -> None:
        """Store assistant reply so session history survives reload (separate from user/transcript rows)."""
        if not room_mode or not (content or "").strip():
            return
        factory = get_session_factory()
        async with factory() as db:
            await message_crud.create_message(
                db,
                session_id=UUID(session_id),
                sender_id=None,
                kind="ai_assistant",
                content_text=content.strip(),
                message_id=message_id,
            )
            if action:
                await message_crud.upsert_ai_metadata(
                    db,
                    message_id,
                    sentiment_label="neutral",
                    sentiment_score=0.0,
                    intent="other",
                    llm_model=settings.openrouter_model,
                    prompt_version="v1",
                    enhancement_text=f"action:{action}",
                )
            await db.commit()

    async def save_ai_meta(
        msg_uuid: UUID,
        classification: dict,
        enhancement: str,
        *,
        model_name: str,
        sentiment_label: str | None = None,
        sentiment_score: float | None = None,
    ) -> None:
        if not room_mode:
            return
        label = sentiment_label or str(classification.get("emotion", "neutral"))
        score = (
            float(sentiment_score)
            if sentiment_score is not None
            else float(classification.get("confidence") or 0.0)
        )
        factory = get_session_factory()
        async with factory() as db:
            await message_crud.upsert_ai_metadata(
                db,
                msg_uuid,
                sentiment_label=label,
                sentiment_score=score,
                intent=str(classification.get("intent", "other")),
                llm_model=model_name,
                prompt_version="v1",
                enhancement_text=enhancement or None,
            )
            await db.commit()

    async def handle_audio_end(
        lang_hint: str | None,
        *,
        audio_data_override: bytes | None = None,
        mime_override: str | None = None,
        camera_label: str | None = None,
        camera_confidence: float | None = None,
        manual_mood_label: str | None = None,
    ):
        if audio_data_override is not None:
            audio_data = audio_data_override
            mime_for_stt = normalize_mime_type(mime_override or audio_mime)
        elif audio_buffer:
            audio_data = bytes(audio_buffer)
            audio_buffer.clear()
            mime_for_stt = normalize_mime_type(audio_mime)
        else:
            await finish_audio_capture("idle")
            return

        if len(audio_data) < 100:
            await finish_audio_capture("idle")
            return

        logger.info(
            "WS STT utterance",
            session_id=session_id,
            mime_type=mime_for_stt,
            input_bytes=len(audio_data),
            input_hex_prefix=hex_prefix(audio_data),
        )

        try:
            result = await stt.transcribe(
                audio_data=audio_data,
                language_hint=None if lang_hint in (None, "auto") else lang_hint,
                mime_type=mime_for_stt,
            )
        except AudioConversionError as exc:
            logger.error(
                "STT audio conversion failed",
                session_id=session_id,
                error=str(exc),
            )
            detail = str(exc).strip()[:240] or "audio_conversion_failed"
            await send(
                {
                    "type": "error",
                    "message": "Transcription failed",
                    "code": "stt_error",
                    "detail": detail,
                }
            )
            await finish_audio_capture("idle")
            return
        except Exception as exc:
            logger.error("STT failed", session_id=session_id, error=str(exc))
            detail = str(exc).strip()[:240] or "unknown_error"
            await send(
                {
                    "type": "error",
                    "message": "Transcription failed",
                    "code": "stt_error",
                    "detail": detail,
                }
            )
            await finish_audio_capture("idle")
            return

        text = normalize_text(result.text)
        if not text:
            await finish_audio_capture("idle")
            return

        detected_lang = result.detected_language
        if detected_lang in ("", "unknown", None):
            detected_lang, _ = detect_language(text)
        ctx.set_language(detected_lang)

        msg_uuid = uuid4()
        classification: dict = {}
        if settings.openrouter_api_key:
            classification = await classify_text(text)

        fuse_label = manual_mood_label or camera_label
        fuse_conf = 0.95 if manual_mood_label else camera_confidence
        peer_sentiment = build_peer_sentiment_fields(
            classification,
            camera_label,
            camera_confidence,
            manual_mood_label=manual_mood_label,
        )
        emotion_label, emotion_conf = resolve_user_emotion(
            classification, fuse_label, fuse_conf
        )

        await persist_and_fanout_transcript(
            text,
            msg_uuid,
            confidence=result.confidence,
            lang=detected_lang,
            peer_sentiment=peer_sentiment or None,
        )

        transcript_final_payload: dict = {
            "type": "transcript_final",
            "text": text,
            "confidence": result.confidence,
            "lang": detected_lang,
            "messageId": str(msg_uuid),
        }
        if peer_sentiment:
            transcript_final_payload.update(peer_sentiment)
        await send(transcript_final_payload)
        await emit_sign_motion_plan(text, detected_lang)

        if settings.openrouter_api_key or emotion_label:
            sentiment_payload: dict = {
                "type": "sentiment",
                "label": emotion_label or classification.get("emotion", "neutral"),
                "intent": classification.get("intent", "other"),
                "confidence": emotion_conf
                if emotion_conf is not None
                else classification.get("confidence", 0.0),
                "messageId": str(msg_uuid),
            }
            if peer_sentiment.get("sentimentSource"):
                sentiment_payload["sentimentSource"] = peer_sentiment["sentimentSource"]
            await send(sentiment_payload)

        # Who else is connected in this room right now?
        peer_keys_audio = room_manager.local_peer_keys(session_id, exclude_user_key=user_key)

        # ── Auto-TTS: push the transcript text as speech to all connected peers ──
        if peer_keys_audio and room_mode:
            try:
                audio_b64, duration = await tts.synthesize(text=text, language=detected_lang)
                voice_name = settings.tts_voice_ar if detected_lang[:2].lower() == "ar" else settings.tts_voice_en
                tts_peer_payload = {
                    "type": "tts_ready",
                    "audio": audio_b64,
                    "messageId": str(msg_uuid),
                    "duration": round(duration, 2),
                    "voice": voice_name,
                }
                for pk in peer_keys_audio:
                    await room_manager.send_to(session_id, pk, tts_peer_payload)
            except Exception as exc:
                logger.warning("peer transcript auto-TTS failed", session_id=session_id, error=str(exc))

        ai_assist = await load_room_ai_flag()  # False when peers are present
        enhancement = ""
        persisted_assistant_row = False

        ctx.add("user", text)

        if ai_assist:
            ai_id = str(uuid4())
            await _emit_emotion_tuned_if_active(
                send,
                ai_message_id=ai_id,
                emotion_label=emotion_label,
                emotion_conf=emotion_conf,
            )
            full_response = await _generate_mood_aware_reply(
                llm,
                ctx,
                text,
                detected_lang,
                ai_id,
                send,
                emotion_label=emotion_label,
                emotion_conf=emotion_conf,
            )
            if full_response:
                readability = compute_readability_score(full_response)
                await send(
                    {
                        "type": "ai_final_meta",
                        "messageId": ai_id,
                        "readabilityScore": readability,
                    }
                )
                try:
                    # Peers only — sender already received ai_partial/ai_final stream.
                    await broadcast_fanout(
                        session_id,
                        {
                            "type": "ai_response",
                            "text": full_response.strip(),
                            "session_id": session_id,
                            "messageId": ai_id,
                        },
                        exclude_user_key=user_key,
                    )
                except Exception as exc:
                    logger.error("ai_response broadcast failed", session_id=session_id, error=str(exc))
                ctx.add("assistant", full_response)
                enhancement = full_response
                await persist_ai_assistant_message(full_response, UUID(ai_id))
                persisted_assistant_row = True
                await emit_sign_motion_plan(full_response, detected_lang)
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
                    await persist_ai_assistant_message(enhancement, uuid4())
                    persisted_assistant_row = True
        elif settings.openrouter_api_key and room_mode and not peer_keys_audio:
            # Enhancement only in solo sessions — never when peers are present.
            enhancement = await enhance_text(text, classification, locale=detected_lang[:2])
            if enhancement:
                await send(
                    {
                        "type": "ai_enhancement",
                        "text": enhancement,
                        "messageId": str(msg_uuid),
                    }
                )
                await persist_ai_assistant_message(enhancement, uuid4())
                persisted_assistant_row = True

        if room_mode:
            meta_enhancement = "" if persisted_assistant_row else enhancement
            await save_ai_meta(
                msg_uuid,
                classification,
                meta_enhancement,
                model_name=settings.enhancer_model_name
                if meta_enhancement
                else settings.classifier_model,
                sentiment_label=emotion_label,
                sentiment_score=emotion_conf,
            )

        await finish_audio_capture("idle")

    async def handle_user_text(
        text: str,
        request_tts: bool,
        lang: str,
        *,
        camera_label: str | None = None,
        camera_confidence: float | None = None,
        manual_mood_label: str | None = None,
    ):
        text = normalize_text(text)
        if not text:
            return

        if not lang or lang == "auto":
            lang, _ = detect_language(text)
        ctx.set_language(lang)

        msg_uuid = uuid4()
        classification: dict = {}
        if settings.openrouter_api_key:
            classification = await classify_text(text)

        fuse_label = manual_mood_label or camera_label
        fuse_conf = 0.95 if manual_mood_label else camera_confidence
        peer_sentiment = build_peer_sentiment_fields(
            classification,
            camera_label,
            camera_confidence,
            manual_mood_label=manual_mood_label,
        )
        emotion_label, emotion_conf = resolve_user_emotion(
            classification, fuse_label, fuse_conf
        )

        await persist_and_fanout_user_text(
            text, msg_uuid, lang, peer_sentiment=peer_sentiment or None
        )
        await emit_sign_motion_plan(text, lang)
        ctx.add("user", text)

        if settings.openrouter_api_key or emotion_label:
            sentiment_payload: dict = {
                "type": "sentiment",
                "label": emotion_label or classification.get("emotion", "neutral"),
                "intent": classification.get("intent", "other"),
                "confidence": emotion_conf
                if emotion_conf is not None
                else classification.get("confidence", 0.0),
                "messageId": str(msg_uuid),
            }
            if peer_sentiment.get("sentimentSource"):
                sentiment_payload["sentimentSource"] = peer_sentiment["sentimentSource"]
            await send(sentiment_payload)

        # Who else is currently connected in this room?
        peer_keys = room_manager.local_peer_keys(session_id, exclude_user_key=user_key)

        # ── Auto-TTS for peers: mute/hearing users receive the sender's text as speech ──
        if peer_keys and room_mode:
            try:
                audio_b64, duration = await tts.synthesize(text=text, language=lang)
                voice_name = settings.tts_voice_ar if lang[:2].lower() == "ar" else settings.tts_voice_en
                tts_peer_payload = {
                    "type": "tts_ready",
                    "audio": audio_b64,
                    "messageId": str(msg_uuid),
                    "duration": round(duration, 2),
                    "voice": voice_name,
                }
                for pk in peer_keys:
                    await room_manager.send_to(session_id, pk, tts_peer_payload)
            except Exception as exc:
                logger.warning("peer auto-TTS failed", session_id=session_id, error=str(exc))

        ai_assist = await load_room_ai_flag()  # False when peers are present

        if ai_assist:
            await set_status("processing")
            ai_id = str(uuid4())
            await _emit_emotion_tuned_if_active(
                send,
                ai_message_id=ai_id,
                emotion_label=emotion_label,
                emotion_conf=emotion_conf,
            )
            full_response = await _generate_mood_aware_reply(
                llm,
                ctx,
                text,
                lang,
                ai_id,
                send,
                emotion_label=emotion_label,
                emotion_conf=emotion_conf,
            )
            if full_response:
                ctx.add("assistant", full_response)
                await persist_ai_assistant_message(full_response, UUID(ai_id))
                await emit_sign_motion_plan(full_response, lang)
                if room_mode and settings.openrouter_api_key:
                    await save_ai_meta(
                        msg_uuid,
                        classification,
                        "",
                        model_name=settings.openrouter_model,
                        sentiment_label=emotion_label,
                        sentiment_score=emotion_conf,
                    )
                if request_tts:
                    await set_status("speaking")
                    try:
                        audio_b64, duration = await tts.synthesize(text=full_response, language=lang)
                        voice_name = settings.tts_voice_ar if lang[:2].lower() == "ar" else settings.tts_voice_en
                        payload = {
                            "type": "tts_ready",
                            "audio": audio_b64,
                            "messageId": ai_id,
                            "duration": round(duration, 2),
                            "voice": voice_name,
                        }
                        await send(payload)
                        await broadcast_fanout(session_id, payload, exclude_user_key=user_key)
                    except Exception as exc:
                        logger.error("TTS failed", session_id=session_id, error=str(exc))
                        await send({"type": "error", "message": "Speech synthesis failed", "code": "tts_error"})
            await set_status("idle")
        elif room_mode and settings.openrouter_api_key and not peer_keys:
            # Enhancement only when AI assist is off in a SOLO session — never when peers are present.
            enhancement = await enhance_text(text, classification, locale=lang[:2])
            if enhancement:
                await send(
                    {
                        "type": "ai_enhancement",
                        "text": enhancement,
                        "messageId": str(msg_uuid),
                    }
                )
                await persist_ai_assistant_message(enhancement, uuid4())
            await save_ai_meta(
                msg_uuid,
                classification,
                "" if enhancement else "",
                model_name=settings.enhancer_model_name,
                sentiment_label=emotion_label,
                sentiment_score=emotion_conf,
            )
            if request_tts and enhancement:
                await set_status("speaking")
                try:
                    audio_b64, duration = await tts.synthesize(text=enhancement, language=lang)
                    voice_name = settings.tts_voice_ar if lang[:2].lower() == "ar" else settings.tts_voice_en
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
        elif request_tts:
            # Fallback when AI assist is disabled: speak user's input text.
            await set_status("speaking")
            try:
                audio_b64, duration = await tts.synthesize(text=text, language=lang)
                voice_name = settings.tts_voice_ar if lang[:2].lower() == "ar" else settings.tts_voice_en
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

        if room_mode:
            await save_ai_meta(
                msg_uuid,
                classification,
                "",
                model_name=settings.classifier_model,
                sentiment_label=emotion_label,
                sentiment_score=emotion_conf,
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
                        "text": strip_stage_directions(full_result),
                        "messageId": result_id,
                        "action": action,
                        "sourceMessageId": source_msg_id,
                    }
                )

            result_text = strip_stage_directions(full_result.strip())
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
            if result_text:
                await persist_ai_assistant_message(
                    result_text, UUID(result_id), action=action
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
                if not accept_audio_chunks:
                    continue
                raw = event.get("data", "")
                if raw:
                    chunk_bytes = base64.b64decode(raw)
                    audio_buffer.extend(chunk_bytes)
                    chunk_byte_count += len(chunk_bytes)
                if event.get("mimeType"):
                    audio_mime = event["mimeType"]
                if not listening_status_sent:
                    listening_status_sent = True
                    await set_status("listening")
                if (
                    settings.stt_interim_chunk_enabled
                    and chunk_byte_count >= CHUNK_THRESHOLD_BYTES
                ):
                    lang_hint_interim = event.get("lang", "auto")
                    buffer_snapshot = bytes(audio_buffer)
                    chunk_byte_count = 0
                    try:
                        interim_result = await stt.transcribe_chunk(
                            buffer_snapshot,
                            language=lang_hint_interim,
                            mime_type=audio_mime,
                        )
                        if interim_result and interim_result.text:
                            await broadcast_fanout(
                                session_id,
                                {
                                    "type": "transcript_interim",
                                    "text": interim_result.text,
                                    "confidence": interim_result.confidence,
                                    "lang": interim_result.detected_language,
                                },
                                exclude_user_key=None,
                            )
                    except Exception as exc:
                        logger.warning(
                            "Interim STT failed", session_id=session_id, error=str(exc)
                        )

            elif event_type == "audio_end":
                lang = event.get("lang", "auto")
                chunk_byte_count = 0
                accept_audio_chunks = False
                listening_status_sent = False
                await set_status("processing")
                manual_mood, cam_label, cam_conf = _mood_inputs_from_event(event)
                batch_b64 = event.get("data", "")
                batch_mime = event.get("mimeType")
                audio_override: bytes | None = None
                if batch_b64:
                    audio_buffer.clear()
                    try:
                        audio_override = base64.b64decode(batch_b64)
                    except Exception as decode_exc:
                        logger.warning(
                            "audio_end base64 decode failed",
                            session_id=session_id,
                            error=str(decode_exc),
                        )
                        await send(
                            {
                                "type": "error",
                                "message": "Invalid audio payload",
                                "code": "audio_error",
                            }
                        )
                        await finish_audio_capture("idle")
                        continue
                try:
                    await handle_audio_end(
                        lang,
                        audio_data_override=audio_override,
                        mime_override=batch_mime,
                        camera_label=cam_label,
                        camera_confidence=cam_conf,
                        manual_mood_label=manual_mood,
                    )
                except Exception as exc:
                    logger.error(
                        "audio_end failed",
                        session_id=session_id,
                        error=str(exc),
                    )
                    await send(
                        {
                            "type": "error",
                            "message": "Could not process recording",
                            "code": "audio_error",
                        }
                    )
                    await finish_audio_capture("idle")

            elif event_type == "user_text":
                text = event.get("text", "").strip()
                if not text:
                    continue
                request_tts = bool(event.get("requestTTS", False))
                u_lang = event.get("lang", "en")
                manual_mood, cam_label, cam_conf = _mood_inputs_from_event(event)
                await handle_user_text(
                    text,
                    request_tts,
                    u_lang,
                    camera_label=cam_label,
                    camera_confidence=cam_conf,
                    manual_mood_label=manual_mood,
                )

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
        await _notify_peer_left(session_id, user_key, user_display_name)
        room_manager.disconnect(session_id, user_key)
        await _broadcast_room_presence(session_id)
        context_registry.delete(session_id)
    except Exception as exc:
        logger.error("WebSocket error", session_id=session_id, error=str(exc))
        try:
            await send({"type": "error", "message": "Session error", "code": "session_error"})
        except Exception:
            pass
        await _notify_peer_left(session_id, user_key, user_display_name)
        room_manager.disconnect(session_id, user_key)
        await _broadcast_room_presence(session_id)
        context_registry.delete(session_id)


@router.websocket("/ws/notify")
async def global_notify_socket(
    websocket: WebSocket,
    token: str = Query(default=""),
) -> None:
    """Lightweight persistent WebSocket for global notifications (lobby / dashboard).

    Authenticated users connect here so they can receive peer_joined events even
    when they're not inside a chat session room.  The socket only receives — it
    doesn't need to send anything except a keep-alive pong.
    """
    # Validate token
    user_key: str | None = None
    try:
        payload = decode_token(token)
        user_key = parse_uuid_sub(payload)
    except (JWTError, Exception):
        await websocket.close(code=4001)
        return

    await room_manager.connect_notify(user_key, websocket)
    try:
        while True:
            # Keep socket alive; only accept pings
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        pass
    except Exception as exc:
        logger.warning("notify_ws_error", user_key=user_key, error=str(exc))
    finally:
        room_manager.disconnect_notify(user_key)


async def _broadcast_room_presence(session_id: str) -> None:
    """Tell each connected client how many other peers are in the room."""
    try:
        for pk in room_manager.local_peer_keys(session_id, exclude_user_key=None):
            peer_count = len(
                room_manager.local_peer_keys(session_id, exclude_user_key=pk)
            )
            await room_manager.send_to(
                session_id,
                pk,
                {"type": "room_presence", "peerCount": peer_count},
            )
    except Exception as exc:
        logger.warning("room_presence broadcast failed", session_id=session_id, error=str(exc))


async def _notify_peer_left(session_id: str, leaving_key: str, display_name: str) -> None:
    """Broadcast a peer_left event to all remaining peers before the connection is dropped."""
    try:
        remaining = room_manager.local_peer_keys(session_id, exclude_user_key=leaving_key)
        if not remaining:
            return
        for pk in remaining:
            peer_count = len(
                room_manager.local_peer_keys(session_id, exclude_user_key=pk)
            )
            payload = {
                "type": "peer_left",
                "senderName": display_name,
                "message": f"{display_name} has left the conversation.",
                "peerCount": peer_count,
            }
            await room_manager.send_to(session_id, pk, payload)
    except Exception as exc:
        logger.warning("peer_left broadcast failed", session_id=session_id, error=str(exc))

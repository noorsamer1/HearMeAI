"""Redis pub/sub fan-out for WebSocket rooms across multiple API workers."""

import asyncio
import json
import uuid

from redis.asyncio import Redis

from app.core.config import get_settings
from app.core.logging_config import get_logger
from app.realtime import room_manager

logger = get_logger(__name__)
settings = get_settings()

INSTANCE_ID: str = str(uuid.uuid4())
_pub: Redis | None = None
_sub: Redis | None = None
_listener_task: asyncio.Task | None = None


def _channel(session_id: str) -> str:
    return f"hearme:ws:{session_id}"


async def publish_room_event(session_id: str, payload: dict, exclude_user_key: str | None) -> None:
    if not settings.use_redis:
        return
    global _pub
    if _pub is None:
        _pub = Redis.from_url(settings.redis_url, decode_responses=True)
    body = json.dumps(
        {
            "exclude": exclude_user_key,
            "payload": payload,
            "origin": INSTANCE_ID,
        }
    )
    await _pub.publish(_channel(session_id), body)


async def broadcast_fanout(
    session_id: str,
    payload: dict,
    exclude_user_key: str | None = None,
) -> None:
    await room_manager.broadcast(session_id, payload, exclude_user_key)
    await publish_room_event(session_id, payload, exclude_user_key)


async def _listener_loop() -> None:
    global _sub
    _sub = Redis.from_url(settings.redis_url, decode_responses=True)
    pubsub = _sub.pubsub()
    await pubsub.psubscribe("hearme:ws:*")
    logger.info("redis_ws_listener_started", instance=INSTANCE_ID)
    async for msg in pubsub.listen():
        if msg.get("type") != "pmessage":
            continue
        raw = msg.get("data")
        if not isinstance(raw, str):
            continue
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            continue
        if data.get("origin") == INSTANCE_ID:
            continue
        ch = msg.get("channel", "")
        if isinstance(ch, bytes):
            ch = ch.decode()
        parts = str(ch).split(":", 2)
        sid = parts[-1] if len(parts) >= 3 else ""
        if not sid:
            continue
        try:
            await room_manager.broadcast(sid, data["payload"], data.get("exclude"))
        except Exception as exc:
            logger.warning("redis_ws_deliver_failed", error=str(exc), session_id=sid)


def start_redis_ws_listener() -> None:
    global _listener_task
    if not settings.use_redis or _listener_task is not None:
        return
    _listener_task = asyncio.create_task(_listener_loop())


def stop_redis_ws_listener() -> None:
    global _listener_task, _sub, _pub
    if _listener_task:
        _listener_task.cancel()
        _listener_task = None
    _sub = None
    _pub = None

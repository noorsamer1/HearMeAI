"""
Optional Redis cache layer.

If USE_REDIS=false or the connection fails, all cache operations
are no-ops and the app continues working without caching.
"""

import hashlib
import json
from typing import Any

from app.core.config import get_settings
from app.core.logging_config import get_logger

logger = get_logger(__name__)
settings = get_settings()

_redis_client = None


async def get_redis():
    global _redis_client
    if _redis_client is not None:
        return _redis_client

    if not settings.use_redis:
        return None

    try:
        import aioredis
        _redis_client = await aioredis.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=True,
            socket_connect_timeout=3,
        )
        await _redis_client.ping()
        logger.info("Redis connected", url=settings.redis_url)
    except Exception as exc:
        logger.warning("Redis unavailable — running without cache", error=str(exc))
        _redis_client = None

    return _redis_client


def _make_key(namespace: str, *parts: str) -> str:
    raw = ":".join([namespace, *parts])
    return f"aca:{hashlib.sha256(raw.encode()).hexdigest()[:24]}"


async def cache_get(namespace: str, *key_parts: str) -> Any | None:
    redis = await get_redis()
    if not redis:
        return None
    try:
        raw = await redis.get(_make_key(namespace, *key_parts))
        return json.loads(raw) if raw else None
    except Exception:
        return None


async def cache_set(namespace: str, value: Any, ttl_seconds: int, *key_parts: str) -> None:
    redis = await get_redis()
    if not redis:
        return
    try:
        key = _make_key(namespace, *key_parts)
        await redis.setex(key, ttl_seconds, json.dumps(value))
    except Exception:
        pass


async def cache_delete(namespace: str, *key_parts: str) -> None:
    redis = await get_redis()
    if not redis:
        return
    try:
        await redis.delete(_make_key(namespace, *key_parts))
    except Exception:
        pass

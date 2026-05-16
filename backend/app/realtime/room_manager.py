"""In-process WebSocket rooms (one session id → many user connections)."""

from fastapi import WebSocket

from app.core.logging_config import get_logger

logger = get_logger(__name__)

# Per-room registry: room_id → {user_key → WebSocket}
_rooms: dict[str, dict[str, WebSocket]] = {}

# Global online registry: user_key (UUID str) → room_id they're currently in.
# Only populated for authenticated users (room_mode).
_online_users: dict[str, str] = {}

# Global notification connections: user_key → WebSocket
# These are lightweight "always-on" sockets held by authenticated pages
# that are NOT inside a session room (e.g. lobby, dashboard).
_notify_sockets: dict[str, WebSocket] = {}


async def connect(room_id: str, user_key: str, websocket: WebSocket) -> None:
    await websocket.accept()
    _rooms.setdefault(room_id, {})[user_key] = websocket
    _online_users[user_key] = room_id
    logger.info("ws_room_join", room_id=room_id, user_key=user_key, peers=len(_rooms[room_id]))


def list_room_ids() -> list[str]:
    return list(_rooms.keys())


async def evict_all_rooms(*, reason: str = "session_deleted") -> None:
    for room_id in list_room_ids():
        await evict_room(room_id, reason=reason)


async def evict_room(room_id: str, *, reason: str = "session_deleted") -> None:
    """Notify peers and close every WebSocket in a session room."""
    room = _rooms.get(room_id)
    if not room:
        return
    payload = {"type": "session_deleted", "session_id": room_id, "reason": reason}
    for uid, ws in list(room.items()):
        try:
            await ws.send_json(payload)
        except Exception:
            logger.warning("ws_evict_notify_failed", room_id=room_id, user_key=uid)
        try:
            await ws.close(code=1000, reason=reason)
        except Exception:
            pass
        disconnect(room_id, uid)
    logger.info("ws_room_evicted", room_id=room_id, reason=reason)


def disconnect(room_id: str, user_key: str) -> None:
    room = _rooms.get(room_id)
    if not room:
        _online_users.pop(user_key, None)
        return
    room.pop(user_key, None)
    if not room:
        _rooms.pop(room_id, None)
    _online_users.pop(user_key, None)
    logger.info("ws_room_leave", room_id=room_id, user_key=user_key)


async def send_to(room_id: str, user_key: str, message: dict) -> None:
    ws = _rooms.get(room_id, {}).get(user_key)
    if ws:
        try:
            await ws.send_json(message)
        except Exception:
            logger.warning("ws_send_failed", room_id=room_id, user_key=user_key)


async def broadcast(room_id: str, message: dict, exclude_user_key: str | None = None) -> None:
    room = _rooms.get(room_id, {})
    for uid, ws in list(room.items()):
        if exclude_user_key and uid == exclude_user_key:
            continue
        try:
            await ws.send_json(message)
        except Exception:
            logger.warning("ws_broadcast_failed", room_id=room_id, user_key=uid)


def local_peer_keys(room_id: str, exclude_user_key: str | None = None) -> list[str]:
    room = _rooms.get(room_id, {})
    return [k for k in room if k != exclude_user_key]


def is_user_online(user_key: str) -> bool:
    """Return True if this user (UUID str) is connected to any session."""
    return user_key in _online_users


def get_user_active_room(user_key: str) -> str | None:
    """Return the room_id the user is currently in, or None if offline."""
    return _online_users.get(user_key)


async def send_to_user_globally(user_key: str, message: dict) -> None:
    """Send a message to an authenticated user regardless of which room they're in.

    Tries:
    1. Session room socket (user inside a chat session).
    2. Global notify socket (user on lobby/dashboard with a persistent notify socket).
    """
    room_id = _online_users.get(user_key)
    if room_id:
        await send_to(room_id, user_key, message)
        return

    # Fallback: notify socket (lobby / dashboard)
    ws = _notify_sockets.get(user_key)
    if ws:
        try:
            await ws.send_json(message)
        except Exception:
            logger.warning("notify_send_failed", user_key=user_key)


# ── Global notify socket management ──────────────────────────────────────────

async def connect_notify(user_key: str, websocket: WebSocket) -> None:
    """Register a lightweight notification WebSocket for an authenticated user."""
    await websocket.accept()
    _notify_sockets[user_key] = websocket
    logger.info("notify_ws_connected", user_key=user_key)


def disconnect_notify(user_key: str) -> None:
    """Unregister a notification WebSocket."""
    _notify_sockets.pop(user_key, None)
    logger.info("notify_ws_disconnected", user_key=user_key)


def is_user_online_anywhere(user_key: str) -> bool:
    """True if user has an active session room OR notify socket."""
    return user_key in _online_users or user_key in _notify_sockets

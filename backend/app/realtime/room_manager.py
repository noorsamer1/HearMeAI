"""In-process WebSocket rooms (one session id → many user connections)."""

from fastapi import WebSocket

from app.core.logging_config import get_logger

logger = get_logger(__name__)

_rooms: dict[str, dict[str, WebSocket]] = {}


async def connect(room_id: str, user_key: str, websocket: WebSocket) -> None:
    await websocket.accept()
    _rooms.setdefault(room_id, {})[user_key] = websocket
    logger.info("ws_room_join", room_id=room_id, user_key=user_key, peers=len(_rooms[room_id]))


def disconnect(room_id: str, user_key: str) -> None:
    room = _rooms.get(room_id)
    if not room:
        return
    room.pop(user_key, None)
    if not room:
        _rooms.pop(room_id, None)
    logger.info("ws_room_leave", room_id=room_id, user_key=user_key)


async def send_to(room_id: str, user_key: str, message: dict) -> None:
    ws = _rooms.get(room_id, {}).get(user_key)
    if ws:
        await ws.send_json(message)


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

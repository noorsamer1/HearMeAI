import hashlib
import uuid
from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt

from app.core.config import get_settings


def _password_digest(plain: str) -> bytes:
    """SHA-256 digest so bcrypt always receives a short input (bcrypt max 72 bytes)."""
    return hashlib.sha256(plain.encode("utf-8")).digest()


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(_password_digest(plain), bcrypt.gensalt()).decode("ascii")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(_password_digest(plain), hashed.encode("ascii"))
    except (ValueError, TypeError):
        return False


def create_access_token(user_id: uuid.UUID) -> str:
    s = get_settings()
    expire = datetime.now(timezone.utc) + timedelta(minutes=s.access_token_expire_minutes)
    payload = {
        "sub": str(user_id),
        "typ": "access",
        "exp": expire,
    }
    return jwt.encode(payload, s.jwt_secret_key, algorithm=s.jwt_algorithm)


def create_ws_ticket(user_id: uuid.UUID, session_id: uuid.UUID) -> str:
    s = get_settings()
    expire = datetime.now(timezone.utc) + timedelta(minutes=s.ws_ticket_expire_minutes)
    payload = {
        "sub": str(user_id),
        "sid": str(session_id),
        "typ": "ws",
        "exp": expire,
    }
    return jwt.encode(payload, s.jwt_secret_key, algorithm=s.jwt_algorithm)


def decode_token(token: str) -> dict:
    s = get_settings()
    return jwt.decode(token, s.jwt_secret_key, algorithms=[s.jwt_algorithm])


def parse_uuid_sub(payload: dict) -> uuid.UUID:
    sub = payload.get("sub")
    if not sub:
        raise JWTError("missing sub")
    return uuid.UUID(str(sub))

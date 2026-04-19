"""
Conversation context manager.

Maintains a sliding window of recent messages for LLM context,
with token budget awareness and persistence hooks.
"""

from dataclasses import dataclass, field
from typing import Literal

from app.core.config import get_settings

settings = get_settings()

Role = Literal["user", "assistant", "system"]


@dataclass
class ContextMessage:
    role: Role
    content: str
    char_count: int = field(init=False)

    def __post_init__(self):
        self.char_count = len(self.content)

    def to_dict(self) -> dict:
        return {"role": self.role, "content": self.content}


class ConversationContext:
    """
    Sliding-window conversation context with token budget management.

    Keeps the most recent N messages within a character budget
    to prevent exceeding LLM context limits.
    """

    MAX_CHARS = 12_000  # ~3k tokens; conservative to leave room for response

    def __init__(self, session_id: str, max_messages: int | None = None):
        self.session_id = session_id
        self.max_messages = max_messages or settings.max_context_messages
        self._messages: list[ContextMessage] = []
        self._detected_language: str = "en"

    def add(self, role: Role, content: str) -> None:
        if not content.strip():
            return
        self._messages.append(ContextMessage(role=role, content=content.strip()))
        self._trim()

    def set_language(self, lang: str) -> None:
        self._detected_language = lang

    @property
    def detected_language(self) -> str:
        return self._detected_language

    def get_messages(self) -> list[dict]:
        return [m.to_dict() for m in self._messages]

    def get_recent(self, n: int = 6) -> list[dict]:
        return [m.to_dict() for m in self._messages[-n:]]

    def clear(self) -> None:
        self._messages.clear()

    def _trim(self) -> None:
        """Remove oldest messages to stay within token and count budgets."""
        while len(self._messages) > self.max_messages:
            self._messages.pop(0)

        total_chars = sum(m.char_count for m in self._messages)
        while total_chars > self.MAX_CHARS and len(self._messages) > 2:
            removed = self._messages.pop(0)
            total_chars -= removed.char_count

    def __len__(self) -> int:
        return len(self._messages)


class ContextRegistry:
    """Registry of active session contexts (in-memory, per process)."""

    def __init__(self):
        self._sessions: dict[str, ConversationContext] = {}

    def get_or_create(self, session_id: str) -> ConversationContext:
        if session_id not in self._sessions:
            self._sessions[session_id] = ConversationContext(session_id)
        return self._sessions[session_id]

    def delete(self, session_id: str) -> None:
        self._sessions.pop(session_id, None)

    def __len__(self) -> int:
        return len(self._sessions)


# Global registry instance
context_registry = ContextRegistry()

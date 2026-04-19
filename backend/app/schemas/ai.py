from typing import Literal

from pydantic import BaseModel, Field


class ConversationMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str


class AIRequest(BaseModel):
    messages: list[ConversationMessage]
    task: Literal["chat", "simplify", "clarify", "translate"] = "chat"
    target_language: str | None = None
    stream: bool = True


class AIResponse(BaseModel):
    text: str
    task: str
    detected_language: str | None = None
    readability_score: int | None = None
    processing_time_ms: int


class ActionRequest(BaseModel):
    text: str = Field(min_length=1, max_length=5000)
    action: Literal["simplify", "clarify", "translate"]
    target_language: str | None = None


class ActionResponse(BaseModel):
    original_text: str
    result_text: str
    action: str

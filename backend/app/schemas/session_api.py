from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class SessionCreateRequest(BaseModel):
    mode: str = Field(default="direct", pattern="^(direct|matched)$")
    invite_code: str | None = Field(default=None, max_length=32)


class SessionParticipantOut(BaseModel):
    user_id: str
    display_name: str
    role: str
    joined_at: datetime

    model_config = {"from_attributes": True}


class SessionOut(BaseModel):
    id: str
    mode: str
    invite_code: str | None
    created_by: str
    ai_assist_enabled: bool
    created_at: datetime
    closed_at: datetime | None
    participants: list[SessionParticipantOut] = []

    model_config = {"from_attributes": True}


class MessageOut(BaseModel):
    id: str
    session_id: str
    sender_id: str | None
    kind: str
    content_text: str
    created_at: datetime
    sentiment_label: str | None = None
    intent: str | None = None
    enhancement_text: str | None = None

    model_config = {"from_attributes": True}


class MessagesPage(BaseModel):
    items: list[MessageOut]
    offset: int
    limit: int
    has_more: bool


class JoinSessionRequest(BaseModel):
    invite_code: str = Field(min_length=4, max_length=32)
    role: str = Field(pattern="^(deaf|mute)$")


class UserPreferencesPatch(BaseModel):
    display_name: str | None = Field(default=None, max_length=120)
    locale: str | None = Field(default=None, max_length=32)
    font_scale: str | None = Field(default=None, pattern="^(normal|large|xlarge)$")
    high_contrast: bool | None = None


class UserMeOut(BaseModel):
    id: str
    email: str
    display_name: str
    user_type: str
    locale: str
    font_scale: str
    high_contrast: bool

    model_config = {"from_attributes": True}


class DashboardStatsOut(BaseModel):
    """Real usage counters for the dashboard (no mock data)."""

    total_sessions: int = Field(ge=0, description="Sessions the user has joined.")
    total_messages: int = Field(ge=0, description="Persisted chat rows in those sessions.")
    transcript_count: int = Field(ge=0, description="Speech-to-text transcript messages saved.")


class MatchEnqueueRequest(BaseModel):
    """Which side of the pair you are joining for matchmaking (deaf/listener vs mute/speaker)."""

    role: Literal["deaf", "mute"] | None = Field(
        default=None,
        description="Optional override; if omitted, derived from profile (mute → mute queue, else deaf).",
    )

    @property
    def role_normalized(self) -> str | None:
        return self.role


class MatchEnqueueResponse(BaseModel):
    status: str
    session_id: str | None = None
    position_hint: int | None = None


class MatchResultResponse(BaseModel):
    matched: bool
    session_id: str | None = None

"""Map user profile categories to session participant roles and match queues."""

from typing import Literal

QueueRole = Literal["deaf", "mute"]
ParticipantRole = Literal["deaf", "mute"]

PROFILE_LABELS: dict[str, str] = {
    "deaf": "Deaf",
    "mute": "Mute",
    "both": "Deaf & Mute",
    "normal": "Normal",
}


def participant_role_for_profile(user_type: str | None) -> ParticipantRole:
    """
    Session participant role stored in DB (deaf | mute).

    Deaf/both → caption/sign side; mute/normal → text/speech side.
    """
    if user_type in ("mute", "normal"):
        return "mute"
    return "deaf"


def queue_role_for_profile(user_type: str | None) -> QueueRole:
    """Matchmaking queue: pairs deaf-queue with mute-queue."""
    if user_type in ("mute", "normal"):
        return "mute"
    return "deaf"

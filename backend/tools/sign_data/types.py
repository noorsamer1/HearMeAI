"""Shared data structures for sign dataset ingestion."""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path


@dataclass(slots=True)
class CanonicalSignSample:
    """Canonical sample emitted by ingestion adapters."""

    sample_id: str
    source_dataset: str
    source_subset: str
    signer_id: str
    split: str
    language: str
    variant: str
    gloss: list[str]
    text: str
    media_path: Path
    pose_path: Path | None = None
    fps: float | None = None
    num_frames: int | None = None
    tags: list[str] = field(default_factory=list)
    metadata: dict[str, str | int | float | bool | None] = field(default_factory=dict)

    def to_json_dict(self) -> dict:
        """Convert to JSON-serializable dictionary."""
        return {
            "sample_id": self.sample_id,
            "source_dataset": self.source_dataset,
            "source_subset": self.source_subset,
            "signer_id": self.signer_id,
            "split": self.split,
            "language": self.language,
            "variant": self.variant,
            "gloss": self.gloss,
            "text": self.text,
            "media_path": str(self.media_path),
            "pose_path": str(self.pose_path) if self.pose_path else None,
            "fps": self.fps,
            "num_frames": self.num_frames,
            "tags": self.tags,
            "metadata": self.metadata,
        }


"""Normalized sign data schema for production pipelines."""

from __future__ import annotations

from pydantic import BaseModel, Field, field_validator, model_validator


SCHEMA_VERSION = "1.0.0"
ALLOWED_VARIANTS = {"arsl_sa", "arsl_gulf", "arsl_mixed"}


class TimingSpan(BaseModel):
    """A timed span in either milliseconds or frame indices."""

    start_ms: int = Field(ge=0)
    end_ms: int = Field(ge=0)
    start_frame: int | None = Field(default=None, ge=0)
    end_frame: int | None = Field(default=None, ge=0)

    @model_validator(mode="after")
    def validate_order(self) -> "TimingSpan":
        """Ensure start/end ordering is valid."""
        if self.end_ms < self.start_ms:
            raise ValueError("end_ms must be >= start_ms")
        if self.start_frame is not None and self.end_frame is not None:
            if self.end_frame < self.start_frame:
                raise ValueError("end_frame must be >= start_frame")
        return self


class HandshapeMarker(BaseModel):
    """Handshape annotation for a timed span."""

    hand: str = Field(pattern="^(left|right|both)$")
    shape_label: str = Field(min_length=1)
    confidence: float = Field(ge=0.0, le=1.0, default=0.0)
    timing: TimingSpan


class NonManualMarker(BaseModel):
    """Non-manual marker (face/head/body) over a timed span."""

    channel: str = Field(pattern="^(face|head|body)$")
    marker: str = Field(min_length=1)
    confidence: float = Field(ge=0.0, le=1.0, default=0.0)
    timing: TimingSpan


class PoseRef(BaseModel):
    """Reference to a pose sequence source."""

    source: str = Field(min_length=1)
    format: str = Field(min_length=1)
    path: str = Field(min_length=1)
    fps: float | None = Field(default=None, gt=0)
    num_frames: int | None = Field(default=None, ge=1)


class SignToken(BaseModel):
    """Token-level sign annotation."""

    token_id: str = Field(min_length=1)
    gloss: str = Field(min_length=1)
    spoken_text: str | None = None
    timing: TimingSpan


class AnnotationQuality(BaseModel):
    """Quality metadata for annotation confidence and completeness."""

    source_confidence: float = Field(ge=0.0, le=1.0, default=0.0)
    handshape_coverage: float = Field(ge=0.0, le=1.0, default=0.0)
    non_manual_coverage: float = Field(ge=0.0, le=1.0, default=0.0)
    notes: list[str] = Field(default_factory=list)


class LicenseMeta(BaseModel):
    """License/provenance metadata per sample."""

    source_dataset: str = Field(min_length=1)
    source_subset: str = Field(min_length=1)
    license_name: str = Field(min_length=1)
    license_url: str | None = None
    attribution_required: bool = True
    commercial_use_allowed: bool | None = None


class SignSample(BaseModel):
    """Production normalized sign sample."""

    schema_version: str = SCHEMA_VERSION
    sample_id: str = Field(min_length=1)
    language: str = Field(default="ar")
    variant: str = Field(default="arsl_sa")
    signer_id: str = Field(min_length=1)
    split: str = Field(pattern="^(train|val|test|unspecified)$", default="unspecified")
    text: str = Field(default="")
    tokens: list[SignToken] = Field(default_factory=list)
    handshape_markers: list[HandshapeMarker] = Field(default_factory=list)
    non_manual_markers: list[NonManualMarker] = Field(default_factory=list)
    pose_ref: PoseRef | None = None
    quality: AnnotationQuality = Field(default_factory=AnnotationQuality)
    license: LicenseMeta
    metadata: dict[str, str | int | float | bool | None] = Field(default_factory=dict)

    @field_validator("variant")
    @classmethod
    def validate_variant(cls, value: str) -> str:
        """Ensure known variant values."""
        if value not in ALLOWED_VARIANTS:
            raise ValueError(f"Unsupported variant '{value}'")
        return value

    @model_validator(mode="after")
    def validate_token_order(self) -> "SignSample":
        """Ensure token timing is ordered and non-overlapping by default."""
        previous_end = -1
        for token in self.tokens:
            if token.timing.start_ms < previous_end:
                raise ValueError("tokens must be ordered by non-decreasing timing")
            previous_end = token.timing.end_ms
        return self


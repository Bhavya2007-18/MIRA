"""Data contracts for computer vision / Memory Prosthetic."""

from __future__ import annotations

from datetime import UTC, datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class VisionStatus(str, Enum):
    """Status of a vision recognition result."""

    KNOWN = "known"
    UNKNOWN = "unknown"
    UNCERTAIN = "uncertain"
    NO_INPUT = "no_input"
    ERROR = "error"


class BoundingBox(BaseModel):
    """Bounding box for a detected object/face."""

    x: float = Field(..., ge=0.0, description="Left edge (normalized 0-1)")
    y: float = Field(..., ge=0.0, description="Top edge (normalized 0-1)")
    width: float = Field(..., gt=0.0, le=1.0, description="Width (normalized 0-1)")
    height: float = Field(..., gt=0.0, le=1.0, description="Height (normalized 0-1)")

    model_config = ConfigDict(frozen=True)


class FaceRecognitionResult(BaseModel):
    """Result of face recognition from the Memory Prosthetic.

    The system must prefer "I don't know" over an incorrect identity.
    Never force an identity when confidence is low.
    """

    patient_id: str = Field(..., min_length=1, description="Patient context")
    identity_id: Optional[str] = Field(
        default=None, description="Known face ID if matched"
    )
    identity_label: Optional[str] = Field(
        default=None, description="Human-readable label if permitted"
    )
    confidence: float = Field(
        ..., ge=0.0, le=1.0, description="Matching confidence [0, 1]"
    )
    status: VisionStatus = Field(
        ..., description="Recognition status"
    )
    bounding_box: Optional[BoundingBox] = Field(
        default=None, description="Face location in frame"
    )
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        description="Inference timestamp (UTC)",
    )
    inference_time_ms: float = Field(
        default=0.0, ge=0.0, description="Inference latency in milliseconds"
    )

    model_config = ConfigDict(frozen=True)


class ObjectRecognitionResult(BaseModel):
    """Result of object recognition from the Memory Prosthetic.

    Focuses on personal objects (keys, glasses, wallet, etc.)
    rather than universal object recognition.
    """

    patient_id: str = Field(..., min_length=1, description="Patient context")
    object_id: Optional[str] = Field(
        default=None, description="Known object ID if matched"
    )
    object_label: Optional[str] = Field(
        default=None, description="Human-readable object label"
    )
    confidence: float = Field(
        ..., ge=0.0, le=1.0, description="Detection/matching confidence [0, 1]"
    )
    status: VisionStatus = Field(
        ..., description="Recognition status"
    )
    bounding_box: Optional[BoundingBox] = Field(
        default=None, description="Object location in frame"
    )
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        description="Inference timestamp (UTC)",
    )
    inference_time_ms: float = Field(
        default=0.0, ge=0.0, description="Inference latency in milliseconds"
    )

    model_config = ConfigDict(frozen=True)


class EnrolledIdentity(BaseModel):
    """An enrolled face identity (stored embedding reference)."""

    identity_id: str = Field(..., min_length=1)
    label: str = Field(..., min_length=1, description="Human-readable name")
    embedding_dim: int = Field(..., gt=0, description="Dimensionality of stored embedding")
    sample_count: int = Field(..., ge=1, description="Number of samples used for enrollment")
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    model_config = ConfigDict(frozen=True)


class EnrolledObject(BaseModel):
    """An enrolled personal object."""

    object_id: str = Field(..., min_length=1)
    label: str = Field(..., min_length=1, description="Human-readable object name")
    embedding_dim: int = Field(..., gt=0)
    sample_count: int = Field(..., ge=1)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    model_config = ConfigDict(frozen=True)

"""Data contracts for recommendations and adaptive difficulty."""

from __future__ import annotations

from datetime import UTC, datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class RecommendationType(str, Enum):
    """Types of recommendations the system can produce."""

    GAME = "game"
    ASSESSMENT = "assessment"
    REST = "rest"
    MEMORY_AID = "memory_aid"


class Recommendation(BaseModel):
    """A personalized recommendation for the patient.

    Produced by the personalization engine, consumed by the mobile app
    and caregiver dashboard.
    """

    patient_id: str = Field(..., min_length=1, description="Unique patient identifier")
    recommendation_type: RecommendationType = Field(
        ..., description="What type of intervention is recommended"
    )
    target_game_id: Optional[str] = Field(
        default=None, description="Specific game ID if type is GAME"
    )
    target_domain: str = Field(
        ..., min_length=1,
        description="Cognitive domain this recommendation targets",
    )
    difficulty: int = Field(
        ..., ge=1, le=10, description="Recommended difficulty level (1-10)"
    )
    reason: str = Field(
        ..., min_length=1, description="Human-readable explanation for this recommendation"
    )
    confidence: float = Field(
        ..., ge=0.0, le=1.0,
        description="System confidence in this recommendation [0, 1]",
    )
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        description="Recommendation timestamp (UTC)",
    )

    model_config = ConfigDict(frozen=True)


class DifficultyRecommendation(BaseModel):
    """Suggested difficulty adjustment for a specific game/domain.

    Separate from the full recommendation to allow lightweight
    difficulty-only updates.
    """

    patient_id: str = Field(..., min_length=1)
    game_id: str = Field(..., min_length=1)
    target_domain: str = Field(..., min_length=1)

    current_difficulty: int = Field(..., ge=1, le=10)
    suggested_difficulty: int = Field(..., ge=1, le=10)

    adjustment: int = Field(
        ..., ge=-9, le=9,
        description="Suggested change: positive = increase, negative = decrease",
    )
    reason: str = Field(..., min_length=1)
    confidence: float = Field(..., ge=0.0, le=1.0)

    timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC))

    model_config = ConfigDict(frozen=True)

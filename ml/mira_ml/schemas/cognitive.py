"""Data contracts for cognitive scoring and profiling."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class CognitiveScore(BaseModel):
    """Score for a single cognitive domain.

    Scores are normalized to 0.0-1.0 where higher is better.
    """

    domain: str = Field(..., min_length=1, description="Cognitive domain name")
    score: float = Field(..., ge=0.0, le=1.0, description="Normalized score [0, 1]")
    confidence: float = Field(
        ..., ge=0.0, le=1.0, description="Confidence in this score [0, 1]"
    )
    sample_size: int = Field(
        ..., ge=0, description="Number of events this score was derived from"
    )

    model_config = ConfigDict(frozen=True)


class CognitiveProfile(BaseModel):
    """Full cognitive profile for a patient.

    Aggregates domain scores, identifies strengths/weaknesses,
    and provides an overall cognitive status snapshot.
    """

    patient_id: str = Field(..., min_length=1, description="Unique patient identifier")

    domain_scores: list[CognitiveScore] = Field(
        ..., min_length=1, description="Scores per cognitive domain"
    )

    overall_score: float = Field(
        ..., ge=0.0, le=1.0, description="Weighted overall cognitive score [0, 1]"
    )
    overall_confidence: float = Field(
        ..., ge=0.0, le=1.0, description="Confidence in the overall score [0, 1]"
    )

    strengths: list[str] = Field(
        default_factory=list,
        description="Domain names where performance is notably above average",
    )
    weaknesses: list[str] = Field(
        default_factory=list,
        description="Domain names where performance is notably below average",
    )

    total_events: int = Field(
        ..., ge=0, description="Total events used to build this profile"
    )
    profile_version: int = Field(default=1, ge=1, description="Profile version number")
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        description="Profile generation timestamp (UTC)",
    )

    model_config = ConfigDict(frozen=True)

    def domain_score_map(self) -> dict[str, CognitiveScore]:
        """Return domain scores as a dict keyed by domain name."""
        return {cs.domain: cs for cs in self.domain_scores}


class DomainThresholds(BaseModel):
    """Thresholds for classifying domain performance.

    Values are proportions of the 0-1 score range.
    """

    strength_ratio: float = Field(
        default=0.75, ge=0.0, le=1.0,
        description="Score at or above which a domain is considered a strength",
    )
    weakness_ratio: float = Field(
        default=0.40, ge=0.0, le=1.0,
        description="Score at or below which a domain is considered a weakness",
    )
    min_events_for_confidence: int = Field(
        default=5, ge=1,
        description="Minimum events needed for full confidence in a domain score",
    )

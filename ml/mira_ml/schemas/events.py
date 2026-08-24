"""Data contracts for game and assessment events."""

from __future__ import annotations

from datetime import UTC, datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class TaskType(str, Enum):
    """Types of cognitive tasks within a game."""

    MEMORY = "memory"
    ATTENTION = "attention"
    RECALL = "recall"
    ORIENTATION = "orientation"
    REASONING = "reasoning"
    RECOGNITION = "recognition"
    OTHER = "other"


class GameEvent(BaseModel):
    """A single event emitted by a game or assessment.

    This is the primary input to the AI/ML pipeline.
    """

    patient_id: str = Field(..., min_length=1, description="Unique patient identifier")
    session_id: str = Field(..., min_length=1, description="Unique session identifier")
    game_id: str = Field(..., min_length=1, description="Unique game identifier")
    task_type: TaskType = Field(..., description="Cognitive domain this task targets")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC), description="Event timestamp (UTC)")

    difficulty: int = Field(
        ..., ge=1, le=10, description="Difficulty level at time of event (1-10)"
    )
    correct: bool = Field(..., description="Whether the response was correct")
    response_time_ms: float = Field(
        ..., ge=0, description="Response time in milliseconds"
    )

    attempts: int = Field(default=1, ge=1, description="Number of attempts for this task")
    hints_used: int = Field(default=0, ge=0, description="Number of hints used")
    skipped: bool = Field(default=False, description="Whether the task was skipped")

    model_config = ConfigDict(
        frozen=True,
        json_schema_extra={
            "example": {
                "patient_id": "p-001",
                "session_id": "s-001",
                "game_id": "memory-cards-v1",
                "task_type": "memory",
                "difficulty": 5,
                "correct": True,
                "response_time_ms": 3200.0,
                "attempts": 1,
                "hints_used": 0,
                "skipped": False,
            }
        },
    )


class GameEventBatch(BaseModel):
    """Batch of events from a single session."""

    events: list[GameEvent] = Field(..., min_length=1, description="Ordered list of events")

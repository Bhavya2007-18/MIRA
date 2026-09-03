"""Data contracts for telehealth video calling and Jitsi signaling."""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class CallStatus(BaseModel):
    """Status of an active or pending telehealth video call session."""

    patient_id: str = Field(..., min_length=1, description="Unique patient identifier")
    is_calling: bool = Field(default=False, description="Whether a call is actively ringing or ongoing")
    room_url: str = Field(default="", description="Jitsi Meet room URL")

    model_config = ConfigDict(
        frozen=True,
        json_schema_extra={
            "example": {
                "patient_id": "MIRA-8821",
                "is_calling": True,
                "room_url": "https://meet.jit.si/mira-care-MIRA-8821",
            }
        },
    )


class CallInitiateRequest(BaseModel):
    """Request payload to initiate a telehealth call with a patient."""

    patient_id: Optional[str] = Field(default=None, description="Unique patient identifier")

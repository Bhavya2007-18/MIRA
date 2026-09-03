"""Data contracts for patient location tracking."""

from __future__ import annotations

from datetime import UTC, datetime
from pydantic import BaseModel, ConfigDict, Field


class LocationPing(BaseModel):
    """Real-time GPS location ping from the patient mobile device."""

    patient_id: str = Field(..., min_length=1, description="Unique patient identifier")
    lat: float = Field(..., ge=-90.0, le=90.0, description="Latitude in decimal degrees (-90 to 90)")
    lng: float = Field(..., ge=-180.0, le=180.0, description="Longitude in decimal degrees (-180 to 180)")
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        description="Timestamp of the GPS reading (UTC)",
    )

    model_config = ConfigDict(
        frozen=True,
        json_schema_extra={
            "example": {
                "patient_id": "MIRA-8821",
                "lat": 26.1445,
                "lng": 91.7362,
                "timestamp": "2026-09-03T02:40:00Z",
            }
        },
    )

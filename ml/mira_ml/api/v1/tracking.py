"""Patient real-time location tracking API endpoints."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from mira_ml.schemas.tracking import LocationPing
from mira_ml.api.store import store
from mira_ml.api.supabase_client import db_sync_location, db_get_latest_location

router = APIRouter(prefix="/api/v1/tracking", tags=["tracking"])


@router.post(
    "/location",
    response_model=LocationPing,
    status_code=status.HTTP_200_OK,
    summary="Ingest patient GPS location ping",
    description="Receives real-time GPS coordinates from the mobile app and updates patient location in store and Supabase database.",
)
async def update_patient_location(ping: LocationPing) -> LocationPing:
    """Ingest LocationPing from the mobile app and update patient's latest location."""
    # 1. Update local in-memory store (fast, offline-first)
    store.update_location(ping)

    # 2. Asynchronously sync to Supabase if configured
    await db_sync_location(ping)

    return ping


@router.get(
    "/location/{patient_id}",
    response_model=LocationPing,
    status_code=status.HTTP_200_OK,
    summary="Get latest patient location",
    description="Retrieves the most recent GPS coordinates for a patient, queried by the caretaker dashboard.",
)
async def get_patient_location(patient_id: str) -> LocationPing:
    """Retrieve the latest GPS coordinates for the Next.js dashboard."""
    # 1. Check database (Supabase) first if configured
    db_loc = await db_get_latest_location(patient_id)
    if db_loc is not None:
        store.update_location(db_loc)
        return db_loc

    # 2. Fall back to local in-memory store
    local_loc = store.get_latest_location(patient_id)
    if local_loc is not None:
        return local_loc

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Location not found for patient '{patient_id}'",
    )


@router.get(
    "/location/{patient_id}/history",
    response_model=list[LocationPing],
    status_code=status.HTTP_200_OK,
    summary="Get patient location history",
)
async def get_patient_location_history(patient_id: str, limit: int = 50) -> list[LocationPing]:
    """Retrieve recent location telemetry history for tracking path/trail."""
    return store.get_location_history(patient_id, limit=limit)

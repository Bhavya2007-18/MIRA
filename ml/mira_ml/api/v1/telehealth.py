"""Telehealth video calling and Jitsi signaling API endpoints."""

from __future__ import annotations

from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status

from mira_ml.schemas.telehealth import CallInitiateRequest, CallStatus
from mira_ml.api.store import store
from mira_ml.api.supabase_client import db_sync_call_status, db_get_call_status

router = APIRouter(prefix="/api/v1/telehealth", tags=["telehealth"])


def _generate_jitsi_url(patient_id: str) -> str:
    """Generate deterministic Jitsi Meet room URL for patient care."""
    clean_id = patient_id.strip().replace(" ", "-")
    return f"https://meet.jit.si/mira-care-{clean_id}"


@router.post(
    "/call",
    response_model=CallStatus,
    status_code=status.HTTP_200_OK,
    summary="Initiate a telehealth video call",
    description="Generates a unique Jitsi Meet URL for the patient and sets is_calling=True to signal the mobile app.",
)
async def initiate_call(
    req: Optional[CallInitiateRequest] = None,
    patient_id: Optional[str] = Query(None, description="Patient ID if passed via query string"),
) -> CallStatus:
    """Initiate a video call session and notify mobile subscriber."""
    target_patient_id = ""
    if req and req.patient_id:
        target_patient_id = req.patient_id.strip()
    elif patient_id:
        target_patient_id = patient_id.strip()

    if not target_patient_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="patient_id is required either in request body or query parameters",
        )

    room_url = _generate_jitsi_url(target_patient_id)
    call_status = CallStatus(
        patient_id=target_patient_id,
        is_calling=True,
        room_url=room_url,
    )

    # 1. Update in-memory store
    store.set_call_status(call_status)

    # 2. Sync to Supabase database for realtime broadcast
    await db_sync_call_status(call_status)

    return call_status


@router.get(
    "/call/{patient_id}",
    response_model=CallStatus,
    status_code=status.HTTP_200_OK,
    summary="Poll telehealth call status",
    description="Allows the mobile app to poll if the caretaker is currently initiating a video call.",
)
async def get_call_status(patient_id: str) -> CallStatus:
    """Check if an active call is pending or ongoing for the specified patient."""
    clean_id = patient_id.strip()

    # 1. Query remote DB if available
    db_status = await db_get_call_status(clean_id)
    if db_status is not None:
        store.set_call_status(db_status)
        return db_status

    # 2. Query in-memory store
    return store.get_call_status(clean_id)


@router.post(
    "/call/{patient_id}/end",
    response_model=CallStatus,
    status_code=status.HTTP_200_OK,
    summary="End an active telehealth call",
    description="Resets the call status: sets is_calling=False and clears the room URL.",
)
async def end_call_by_path(patient_id: str) -> CallStatus:
    """End the call for a specific patient."""
    clean_id = patient_id.strip()
    ended_status = CallStatus(
        patient_id=clean_id,
        is_calling=False,
        room_url="",
    )

    store.set_call_status(ended_status)
    await db_sync_call_status(ended_status)

    return ended_status


@router.post(
    "/call/end",
    response_model=CallStatus,
    status_code=status.HTTP_200_OK,
    summary="End an active telehealth call (via body or query)",
)
async def end_call(
    req: Optional[CallInitiateRequest] = None,
    patient_id: Optional[str] = Query(None),
) -> CallStatus:
    """End a call using request body or query parameter."""
    target_patient_id = ""
    if req and req.patient_id:
        target_patient_id = req.patient_id.strip()
    elif patient_id:
        target_patient_id = patient_id.strip()

    if not target_patient_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="patient_id is required either in request body or query parameters",
        )

    return await end_call_by_path(target_patient_id)

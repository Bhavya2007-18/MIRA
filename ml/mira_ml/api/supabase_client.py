"""Supabase database client for MIRA backend.

Provides offline-first synchronization with Supabase PostgreSQL/PostgREST.
When SUPABASE_URL and SUPABASE_KEY (or SUPABASE_SERVICE_ROLE_KEY) are configured,
state changes are synchronized to the remote database. When offline or not configured,
all operations fall back to the in-memory store.
"""

from __future__ import annotations

import logging
import os
from datetime import UTC, datetime
from typing import Optional

import httpx

from mira_ml.schemas.tracking import LocationPing
from mira_ml.schemas.telehealth import CallStatus

logger = logging.getLogger("mira.db")


def _get_supabase_config() -> tuple[str, str]:
    """Retrieve Supabase URL and API Key from environment variables."""
    url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    key = os.environ.get("SUPABASE_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_ANON_KEY", "")
    return url, key


def is_supabase_configured() -> bool:
    """Check if Supabase credentials are provided."""
    url, key = _get_supabase_config()
    return bool(url and key)


async def db_sync_location(ping: LocationPing) -> bool:
    """Push a patient location ping to Supabase patient_locations table."""
    url, key = _get_supabase_config()
    if not (url and key):
        return False

    endpoint = f"{url}/rest/v1/patient_locations"
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }
    payload = {
        "patient_id": ping.patient_id,
        "lat": ping.lat,
        "lng": ping.lng,
        "timestamp": ping.timestamp.isoformat(),
    }

    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.post(endpoint, json=payload, headers=headers)
            return resp.is_success
    except Exception as exc:
        logger.warning("Failed to sync location to Supabase: %s", exc)
        return False


async def db_get_latest_location(patient_id: str) -> Optional[LocationPing]:
    """Fetch the latest location ping for a patient from Supabase."""
    url, key = _get_supabase_config()
    if not (url and key):
        return None

    endpoint = f"{url}/rest/v1/patient_locations"
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
    }
    params = {
        "patient_id": f"eq.{patient_id}",
        "order": "timestamp.desc",
        "limit": "1",
    }

    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(endpoint, params=params, headers=headers)
            if resp.is_success:
                data = resp.json()
                if data and isinstance(data, list) and len(data) > 0:
                    row = data[0]
                    return LocationPing(
                        patient_id=row["patient_id"],
                        lat=float(row["lat"]),
                        lng=float(row["lng"]),
                        timestamp=datetime.fromisoformat(row["timestamp"]),
                    )
    except Exception as exc:
        logger.warning("Failed to query location from Supabase: %s", exc)

    return None


async def db_sync_call_status(status: CallStatus) -> bool:
    """Upsert call status for a patient in Supabase call_status table."""
    url, key = _get_supabase_config()
    if not (url and key):
        return False

    endpoint = f"{url}/rest/v1/call_status"
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal",
    }
    payload = {
        "patient_id": status.patient_id,
        "is_calling": status.is_calling,
        "room_url": status.room_url,
        "updated_at": datetime.now(UTC).isoformat(),
    }

    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.post(endpoint, json=payload, headers=headers)
            return resp.is_success
    except Exception as exc:
        logger.warning("Failed to sync call status to Supabase: %s", exc)
        return False


async def db_get_call_status(patient_id: str) -> Optional[CallStatus]:
    """Fetch call status for a patient from Supabase."""
    url, key = _get_supabase_config()
    if not (url and key):
        return None

    endpoint = f"{url}/rest/v1/call_status"
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
    }
    params = {
        "patient_id": f"eq.{patient_id}",
        "limit": "1",
    }

    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(endpoint, params=params, headers=headers)
            if resp.is_success:
                data = resp.json()
                if data and isinstance(data, list) and len(data) > 0:
                    row = data[0]
                    return CallStatus(
                        patient_id=row["patient_id"],
                        is_calling=bool(row["is_calling"]),
                        room_url=str(row.get("room_url", "")),
                    )
    except Exception as exc:
        logger.warning("Failed to query call status from Supabase: %s", exc)

    return None

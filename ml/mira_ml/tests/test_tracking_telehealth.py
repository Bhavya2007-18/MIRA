"""Unit and integration tests for location tracking and telehealth calling."""

from datetime import UTC, datetime
import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from mira_ml.api.app import app
from mira_ml.api.store import store
from mira_ml.schemas.tracking import LocationPing
from mira_ml.schemas.telehealth import CallStatus, CallInitiateRequest
from mira_ml.api.supabase_client import is_supabase_configured, db_get_latest_location


@pytest.fixture
def client():
    return TestClient(app)


# ── 1. Schema Tests ──────────────────────────────────────────────────────────

class TestTrackingSchemas:
    def test_location_ping_valid(self):
        ping = LocationPing(
            patient_id="p-101",
            lat=26.1445,
            lng=91.7362,
        )
        assert ping.patient_id == "p-101"
        assert ping.lat == 26.1445
        assert ping.lng == 91.7362
        assert isinstance(ping.timestamp, datetime)

    def test_location_ping_invalid_lat(self):
        with pytest.raises(ValidationError):
            LocationPing(
                patient_id="p-101",
                lat=95.0,  # exceeds +90
                lng=91.7362,
            )

    def test_location_ping_invalid_lng(self):
        with pytest.raises(ValidationError):
            LocationPing(
                patient_id="p-101",
                lat=26.1445,
                lng=-195.0,  # below -180
            )

    def test_location_ping_empty_patient_id(self):
        with pytest.raises(ValidationError):
            LocationPing(
                patient_id="",
                lat=26.1445,
                lng=91.7362,
            )


class TestTelehealthSchemas:
    def test_call_status_defaults(self):
        status = CallStatus(patient_id="p-101")
        assert status.patient_id == "p-101"
        assert status.is_calling is False
        assert status.room_url == ""

    def test_call_status_custom(self):
        status = CallStatus(
            patient_id="p-101",
            is_calling=True,
            room_url="https://meet.jit.si/mira-care-p-101",
        )
        assert status.is_calling is True
        assert status.room_url == "https://meet.jit.si/mira-care-p-101"

    def test_call_initiate_request(self):
        req = CallInitiateRequest(patient_id="p-101")
        assert req.patient_id == "p-101"

    def test_call_initiate_request_empty(self):
        req = CallInitiateRequest()
        assert req.patient_id is None


# ── 2. Store Tests ───────────────────────────────────────────────────────────

class TestTrackingTelehealthStore:
    def test_store_location_update(self):
        pid = "test-store-loc"
        ping1 = LocationPing(patient_id=pid, lat=26.1, lng=91.7)
        ping2 = LocationPing(patient_id=pid, lat=26.2, lng=91.8)

        store.update_location(ping1)
        assert store.get_latest_location(pid) == ping1

        store.update_location(ping2)
        assert store.get_latest_location(pid) == ping2

        history = store.get_location_history(pid)
        assert len(history) >= 2
        assert history[-1] == ping2

    def test_store_call_status(self):
        pid = "test-store-call"
        status = CallStatus(patient_id=pid, is_calling=True, room_url=f"https://meet.jit.si/mira-care-{pid}")
        store.set_call_status(status)

        stored = store.get_call_status(pid)
        assert stored.is_calling is True
        assert stored.room_url == f"https://meet.jit.si/mira-care-{pid}"


# ── 3. API Route Tests ───────────────────────────────────────────────────────

class TestTrackingEndpoints:
    def test_post_location_and_get_latest(self, client):
        pid = "patient-gps-001"
        payload = {
            "patient_id": pid,
            "lat": 26.1850,
            "lng": 91.7420,
        }

        # 1. Ingest location ping
        post_resp = client.post("/api/v1/tracking/location", json=payload)
        assert post_resp.status_code == 200
        data = post_resp.json()
        assert data["patient_id"] == pid
        assert data["lat"] == 26.1850
        assert data["lng"] == 91.7420
        assert "timestamp" in data

        # 2. Get latest location
        get_resp = client.get(f"/api/v1/tracking/location/{pid}")
        assert get_resp.status_code == 200
        get_data = get_resp.json()
        assert get_data["patient_id"] == pid
        assert get_data["lat"] == 26.1850
        assert get_data["lng"] == 91.7420

    def test_get_nonexistent_location(self, client):
        resp = client.get("/api/v1/tracking/location/nonexistent-patient-999")
        assert resp.status_code == 404
        assert "Location not found" in resp.json()["detail"]

    def test_location_history(self, client):
        pid = "patient-history-001"
        for i in range(3):
            client.post("/api/v1/tracking/location", json={
                "patient_id": pid,
                "lat": 26.0 + i * 0.01,
                "lng": 91.0 + i * 0.01,
            })

        resp = client.get(f"/api/v1/tracking/location/{pid}/history")
        assert resp.status_code == 200
        history = resp.json()
        assert len(history) == 3


class TestTelehealthEndpoints:
    def test_initiate_call_via_json(self, client):
        pid = "patient-call-json"
        resp = client.post("/api/v1/telehealth/call", json={"patient_id": pid})
        assert resp.status_code == 200
        data = resp.json()
        assert data["patient_id"] == pid
        assert data["is_calling"] is True
        assert data["room_url"] == f"https://meet.jit.si/mira-care-{pid}"

    def test_initiate_call_via_query_param(self, client):
        pid = "patient-call-query"
        resp = client.post(f"/api/v1/telehealth/call?patient_id={pid}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["patient_id"] == pid
        assert data["is_calling"] is True
        assert data["room_url"] == f"https://meet.jit.si/mira-care-{pid}"

    def test_initiate_call_missing_patient_id(self, client):
        resp = client.post("/api/v1/telehealth/call", json={})
        assert resp.status_code == 400

    def test_poll_call_status(self, client):
        pid = "patient-poll-001"
        # Initial poll before call initiated
        poll_initial = client.get(f"/api/v1/telehealth/call/{pid}")
        assert poll_initial.status_code == 200
        assert poll_initial.json()["is_calling"] is False

        # Caretaker initiates call
        client.post("/api/v1/telehealth/call", json={"patient_id": pid})

        # Mobile app polls and detects ringing call
        poll_ringing = client.get(f"/api/v1/telehealth/call/{pid}")
        assert poll_ringing.status_code == 200
        assert poll_ringing.json()["is_calling"] is True
        assert poll_ringing.json()["room_url"] == f"https://meet.jit.si/mira-care-{pid}"

    def test_end_call(self, client):
        pid = "patient-end-001"
        # Start call
        client.post("/api/v1/telehealth/call", json={"patient_id": pid})

        # End call via path
        end_resp = client.post(f"/api/v1/telehealth/call/{pid}/end")
        assert end_resp.status_code == 200
        assert end_resp.json()["is_calling"] is False
        assert end_resp.json()["room_url"] == ""

        # Poll should now reflect not calling
        poll_resp = client.get(f"/api/v1/telehealth/call/{pid}")
        assert poll_resp.json()["is_calling"] is False

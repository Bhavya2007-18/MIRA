"""MIRA FastAPI Application — REST API for the AI/ML engine."""

from __future__ import annotations

from contextlib import asynccontextmanager
from datetime import UTC, datetime
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from mira_ml.schemas.events import GameEvent, GameEventBatch, TaskType
from mira_ml.api.service import get_service
from mira_ml.api.store import store


# ── Request / Response Models ──────────────────────────────────────────

class EventRequest(BaseModel):
    patient_id: str
    session_id: str
    game_id: str
    task_type: str
    difficulty: int
    correct: bool
    response_time_ms: float
    attempts: int = 1
    hints_used: int = 0
    skipped: bool = False


class EventBatchRequest(BaseModel):
    events: list[EventRequest]


class ProfileResponse(BaseModel):
    patient_id: str
    domain_scores: list[dict]
    overall_score: float
    overall_confidence: float
    strengths: list[str]
    weaknesses: list[str]
    total_events: int
    profile_version: int
    timestamp: str


class RecommendationResponse(BaseModel):
    patient_id: str
    recommendation_type: str
    target_game_id: Optional[str]
    target_domain: str
    difficulty: int
    reason: str
    confidence: float
    timestamp: str


class DifficultyResponse(BaseModel):
    current_difficulty: int
    suggested_difficulty: int
    adjustment: int
    reason: str
    confidence: float


class IngestResponse(BaseModel):
    status: str
    processed: int
    patient_id: str
    scores: list[dict]
    profile_version: int


class HealthResponse(BaseModel):
    status: str
    version: str
    patients: int


# ── App ────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize service
    svc = get_service()
    print(f"MIRA API v0.1.0 started — {len(store.list_patients())} patients loaded")
    yield
    # Shutdown
    print("MIRA API shutting down")


app = FastAPI(
    title="MIRA AI/ML API",
    description="Cognitive Rehabilitation & Memory Prosthetic — Intelligence Layer",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Routes ─────────────────────────────────────────────────────────────

@app.get("/api/v1/health", response_model=HealthResponse)
def health_check():
    return HealthResponse(
        status="healthy",
        version="0.1.0",
        patients=len(store.list_patients()),
    )


@app.post("/api/v1/events/batch", response_model=IngestResponse)
def ingest_events(req: EventBatchRequest):
    """Ingest a batch of game events, score them, and update the patient profile."""
    svc = get_service()
    events = []
    for e in req.events:
        try:
            task_type = TaskType(e.task_type)
        except ValueError:
            task_type = TaskType.OTHER
        events.append(GameEvent(
            patient_id=e.patient_id,
            session_id=e.session_id,
            game_id=e.game_id,
            task_type=task_type,
            timestamp=datetime.now(UTC),
            difficulty=e.difficulty,
            correct=e.correct,
            response_time_ms=e.response_time_ms,
            attempts=e.attempts,
            hints_used=e.hints_used,
            skipped=e.skipped,
        ))

    result = svc.ingest_events(events)
    return IngestResponse(
        status=result["status"],
        processed=result["processed"],
        patient_id=result["patient_id"],
        scores=result["scores"],
        profile_version=result["profile_version"],
    )


@app.get("/api/v1/patient/{patient_id}/profile", response_model=ProfileResponse)
def get_profile(patient_id: str):
    """Get the cognitive profile for a patient."""
    svc = get_service()
    profile = svc.get_profile(patient_id)
    return ProfileResponse(
        patient_id=profile.patient_id,
        domain_scores=[{"domain": d.domain, "score": round(d.score, 4), "confidence": round(d.confidence, 4), "sample_size": d.sample_size} for d in profile.domain_scores],
        overall_score=round(profile.overall_score, 4),
        overall_confidence=round(profile.overall_confidence, 4),
        strengths=profile.strengths,
        weaknesses=profile.weaknesses,
        total_events=profile.total_events,
        profile_version=profile.profile_version,
        timestamp=profile.timestamp.isoformat(),
    )


@app.get("/api/v1/patient/{patient_id}/analytics")
def get_analytics(patient_id: str):
    """Get caregiver analytics report."""
    svc = get_service()
    report = svc.get_analytics(patient_id)
    return {
        "patient_id": report.patient_id,
        "stability_score": round(report.stability_score, 1),
        "stability_status": report.stability_status,
        "headline_insight": report.headline_insight,
        "strengths_summary": report.strengths_summary,
        "weaknesses_summary": report.weaknesses_summary,
        "alerts": [
            {
                "id": a.id,
                "severity": a.severity.value,
                "title": a.title,
                "message": a.message,
                "actionable_tip": a.actionable_tip,
                "timestamp": a.timestamp.isoformat(),
            }
            for a in report.alerts
        ],
        "recommended_action": report.recommended_action,
    }


@app.get("/api/v1/patient/{patient_id}/recommendation")
def get_recommendation(patient_id: str, game_id: Optional[str] = None):
    """Get the next personalized game recommendation."""
    svc = get_service()
    rec = svc.get_recommendation(patient_id, game_id)
    return {
        "patient_id": rec.patient_id,
        "recommendation_type": rec.recommendation_type.value,
        "target_game_id": rec.target_game_id,
        "target_domain": rec.target_domain,
        "difficulty": rec.difficulty,
        "reason": rec.reason,
        "confidence": round(rec.confidence, 4),
        "timestamp": rec.timestamp.isoformat(),
    }


@app.post("/api/v1/patient/{patient_id}/difficulty")
def get_difficulty(patient_id: str, req: EventBatchRequest):
    """Evaluate difficulty adjustment based on recent session events."""
    svc = get_service()
    events = []
    for e in req.events:
        try:
            task_type = TaskType(e.task_type)
        except ValueError:
            task_type = TaskType.OTHER
        events.append(GameEvent(
            patient_id=e.patient_id,
            session_id=e.session_id,
            game_id=e.game_id,
            task_type=task_type,
            timestamp=datetime.now(UTC),
            difficulty=e.difficulty,
            correct=e.correct,
            response_time_ms=e.response_time_ms,
            attempts=e.attempts,
            hints_used=e.hints_used,
            skipped=e.skipped,
        ))

    game_id = events[0].game_id if events else "unknown"
    return svc.get_difficulty(patient_id, game_id, events)


@app.get("/api/v1/patient/{patient_id}/events")
def get_events(patient_id: str):
    """Get all recorded events for a patient."""
    events = store.get_events(patient_id)
    return {
        "patient_id": patient_id,
        "count": len(events),
        "events": [
            {
                "session_id": e.session_id,
                "game_id": e.game_id,
                "task_type": e.task_type.value,
                "difficulty": e.difficulty,
                "correct": e.correct,
                "response_time_ms": e.response_time_ms,
                "timestamp": e.timestamp.isoformat(),
            }
            for e in events
        ],
    }


# ── Entry Point ────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

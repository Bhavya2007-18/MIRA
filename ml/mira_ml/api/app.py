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
from mira_ml.api.v1.tracking import router as tracking_router
from mira_ml.api.v1.telehealth import router as telehealth_router


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

# ── Feature Routers ────────────────────────────────────────────────────
app.include_router(tracking_router)
app.include_router(telehealth_router)


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


# ── Vision Endpoints ───────────────────────────────────────────────────

from mira_ml.inference.face_detector import OpenCVFaceDetector
from mira_ml.inference.face_embedder import ONNXFaceEmbedder
from mira_ml.inference.object_detector import OpenCVObjectDetector
from mira_ml.inference.object_embedder import LightweightObjectEmbedder
from mira_ml.vision.face.recognition import FaceEnrollmentStore, FaceMatchConfig, match_face
from mira_ml.vision.object.recognition import ObjectEnrollmentStore, ObjectMatchConfig, match_object
from mira_ml.inference.interfaces import Detection

# Global vision instances (lazy init)
_face_detector: OpenCVFaceDetector | None = None
_face_embedder: ONNXFaceEmbedder | None = None
_object_detector: OpenCVObjectDetector | None = None
_object_embedder: LightweightObjectEmbedder | None = None
_face_store = FaceEnrollmentStore()
_object_store = ObjectEnrollmentStore()


def _get_vision():
    global _face_detector, _face_embedder, _object_detector, _object_embedder
    if _face_detector is None:
        _face_detector = OpenCVFaceDetector()
        _face_detector.load()
    if _face_embedder is None:
        _face_embedder = ONNXFaceEmbedder()
        _face_embedder.load()
    if _object_detector is None:
        _object_detector = OpenCVObjectDetector()
        _object_detector.load()
    if _object_embedder is None:
        _object_embedder = LightweightObjectEmbedder()
    return _face_detector, _face_embedder, _object_detector, _object_embedder


class FaceEnrollRequest(BaseModel):
    patient_id: str
    identity_id: str
    label: str
    embeddings: list[list[float]]


class FaceRecognizeRequest(BaseModel):
    patient_id: str
    image: list[list[list[int]]]  # H×W×3 RGB


class ObjectEnrollRequest(BaseModel):
    patient_id: str
    object_id: str
    label: str
    embeddings: list[list[float]]


class ObjectRecognizeRequest(BaseModel):
    patient_id: str
    image: list[list[list[int]]]  # H×W×3 RGB


@app.post("/api/v1/vision/face/enroll")
def enroll_face(req: FaceEnrollRequest):
    """Enroll a face identity with multiple embedding samples."""
    try:
        identity = _face_store.enroll(
            identity_id=req.identity_id,
            label=req.label,
            embeddings=req.embeddings,
        )
        return {
            "status": "enrolled",
            "identity_id": identity.identity_id,
            "label": identity.label,
            "embedding_dim": identity.embedding_dim,
            "sample_count": identity.sample_count,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/v1/vision/face/recognize")
def recognize_face(req: FaceRecognizeRequest):
    """Recognize a face from a camera frame."""
    fd, fe, _, _ = _get_vision()

    # Detect faces
    detections = fd.detect(req.image)
    if not detections:
        return {
            "status": "no_face",
            "patient_id": req.patient_id,
            "faces_detected": 0,
        }

    # Process the best face
    best = max(detections, key=lambda d: d.confidence)
    h, w = len(req.image), len(req.image[0]) if req.image else 0

    # Crop face from frame
    x1 = max(0, int(best.bbox.x * w))
    y1 = max(0, int(best.bbox.y * h))
    x2 = min(w, int((best.bbox.x + best.bbox.width) * w))
    y2 = min(h, int((best.bbox.y + best.bbox.height) * h))
    face_crop = [row[x1:x2] for row in req.image[y1:y2]]

    if not face_crop or not face_crop[0]:
        return {"status": "crop_failed", "patient_id": req.patient_id}

    # Embed
    embed_result = fe.embed(face_crop)

    # Match
    result = match_face(
        query_embedding=embed_result.embedding,
        store=_face_store,
        patient_id=req.patient_id,
        bounding_box=best.bbox,
    )

    return {
        "status": result.status.value,
        "patient_id": result.patient_id,
        "identity_id": result.identity_id,
        "identity_label": result.identity_label,
        "confidence": result.confidence,
        "bounding_box": {
            "x": result.bounding_box.x,
            "y": result.bounding_box.y,
            "width": result.bounding_box.width,
            "height": result.bounding_box.height,
        } if result.bounding_box else None,
        "inference_time_ms": result.inference_time_ms,
        "faces_detected": len(detections),
        "model_status": {
            "face_detector": fd.is_loaded(),
            "face_embedder": fe.is_loaded(),
        },
    }


@app.get("/api/v1/vision/face/enrolled")
def list_enrolled_faces():
    """List all enrolled face identities."""
    identities = []
    for identity_id in _face_store.list_identities():
        label = _face_store.get_label(identity_id)
        identities.append({"identity_id": identity_id, "label": label})
    return {"count": _face_store.count, "identities": identities}


@app.delete("/api/v1/vision/face/{identity_id}")
def remove_face(identity_id: str):
    """Remove an enrolled face identity."""
    removed = _face_store.remove(identity_id)
    if not removed:
        raise HTTPException(status_code=404, detail="Identity not found")
    return {"status": "removed", "identity_id": identity_id}


@app.post("/api/v1/vision/object/enroll")
def enroll_object(req: ObjectEnrollRequest):
    """Enroll a personal object with multiple embedding samples."""
    try:
        obj = _object_store.enroll(
            object_id=req.object_id,
            label=req.label,
            embeddings=req.embeddings,
        )
        return {
            "status": "enrolled",
            "object_id": obj.object_id,
            "label": obj.label,
            "embedding_dim": obj.embedding_dim,
            "sample_count": obj.sample_count,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/v1/vision/object/recognize")
def recognize_object(req: ObjectRecognizeRequest):
    """Detect and recognize objects in a camera frame."""
    _, _, od, oe = _get_vision()

    # Detect objects
    detections = od.detect(req.image)
    if not detections:
        return {
            "status": "no_objects",
            "patient_id": req.patient_id,
            "objects_detected": 0,
        }

    # Process each detection
    h, w = len(req.image), len(req.image[0]) if req.image else 0
    results = []

    for det in detections[:5]:
        x1 = max(0, int(det.bbox.x * w))
        y1 = max(0, int(det.bbox.y * h))
        x2 = min(w, int((det.bbox.x + det.bbox.width) * w))
        y2 = min(h, int((det.bbox.y + det.bbox.height) * h))
        obj_crop = [row[x1:x2] for row in req.image[y1:y2]]

        if not obj_crop or not obj_crop[0]:
            continue

        embed_result = oe.embed(obj_crop)
        match_result = match_object(
            query_embedding=embed_result.embedding,
            store=_object_store,
            patient_id=req.patient_id,
            bounding_box=det.bbox,
        )

        results.append({
            "status": match_result.status.value,
            "object_id": match_result.object_id,
            "object_label": match_result.object_label,
            "detected_class": det.class_label,
            "confidence": match_result.confidence,
            "detection_confidence": round(det.confidence, 4),
            "bounding_box": {
                "x": det.bbox.x, "y": det.bbox.y,
                "width": det.bbox.width, "height": det.bbox.height,
            },
        })

    return {
        "patient_id": req.patient_id,
        "objects_detected": len(detections),
        "results": results,
        "model_status": {
            "object_detector": od.is_loaded(),
            "object_embedder": oe.is_loaded(),
        },
    }


@app.get("/api/v1/vision/object/enrolled")
def list_enrolled_objects():
    """List all enrolled objects."""
    objects = []
    for obj_id in _object_store.list_objects():
        label = _object_store.get_label(obj_id)
        objects.append({"object_id": obj_id, "label": label})
    return {"count": _object_store.count, "objects": objects}


@app.delete("/api/v1/vision/object/{object_id}")
def remove_object(object_id: str):
    """Remove an enrolled object."""
    removed = _object_store.remove(object_id)
    if not removed:
        raise HTTPException(status_code=404, detail="Object not found")
    return {"status": "removed", "object_id": object_id}


@app.get("/api/v1/vision/status")
def vision_status():
    """Check which vision models are loaded."""
    fd, fe, od, oe = _get_vision()
    return {
        "face_detector": fd.is_loaded(),
        "face_embedder": fe.is_loaded(),
        "object_detector": od.is_loaded(),
        "object_embedder": oe.is_loaded(),
        "enrolled_faces": _face_store.count,
        "enrolled_objects": _object_store.count,
    }


# ── Entry Point ────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

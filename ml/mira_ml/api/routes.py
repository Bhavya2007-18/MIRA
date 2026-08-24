"""REST API router for MIRA AI/ML engine."""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, status

from mira_ml.schemas.events import GameEvent, GameEventBatch
from mira_ml.schemas.cognitive import CognitiveProfile, CognitiveScore
from mira_ml.schemas.recommendations import Recommendation, DifficultyRecommendation
from mira_ml.pipeline import MIRAIntelligencePipeline, SessionProcessingResult
from mira_ml.analytics.insights import CaregiverReport
from mira_ml.prosthetic.face import EnrolledFace, FaceMatchResult
from mira_ml.prosthetic.objects import DetectedObject

router = APIRouter(prefix="/api/v1")
pipeline_instance = MIRAIntelligencePipeline()


# ---------------------------------------------------------------------------
# Request & Response Schemas
# ---------------------------------------------------------------------------

class IngestEventsResponse(BaseModel):
    status: str = "success"
    patient_id: str
    scores: list[CognitiveScore]
    difficulty_recommendation: DifficultyRecommendation
    next_recommendation: Recommendation
    caregiver_stability_score: float
    caregiver_status: str


class FaceEnrollRequest(BaseModel):
    person_id: str
    name: str
    relation: str
    core_memory: str
    location: Optional[str] = None
    photo_uri: Optional[str] = None
    embedding: list[float] = Field(..., min_length=1)


class FaceMatchRequest(BaseModel):
    query_embedding: list[float] = Field(..., min_length=1)


class ObjectDetectRequest(BaseModel):
    raw_detections: list[tuple[str, float, tuple[float, float, float, float]]]


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("/health")
def health_check():
    """Health check status endpoint."""
    return {
        "status": "healthy",
        "service": "MIRA AI/ML Intelligence Backend",
        "version": "0.1.0",
        "supported_domains": ["memory", "attention", "recall", "orientation", "reasoning"],
    }


@router.post("/events/batch", response_model=IngestEventsResponse)
def ingest_event_batch(batch: GameEventBatch):
    """Ingest a session batch of game events and execute full closed-loop ML update."""
    if not batch.events:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Batch cannot be empty.",
        )

    patient_id = batch.events[0].patient_id
    res: SessionProcessingResult = pipeline_instance.process_game_session(
        patient_id=patient_id,
        events=batch.events,
    )

    return IngestEventsResponse(
        patient_id=patient_id,
        scores=res.scores,
        difficulty_recommendation=res.difficulty_recommendation,
        next_recommendation=res.next_recommendation,
        caregiver_stability_score=res.caregiver_report.stability_score,
        caregiver_status=res.caregiver_report.stability_status,
    )


@router.get("/patient/{patient_id}/profile", response_model=CognitiveProfile)
def get_patient_profile(patient_id: str):
    """Retrieve the current CognitiveProfile for a patient."""
    profile = pipeline_instance.get_profile(patient_id)
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No cognitive profile found for patient ID '{patient_id}'.",
        )
    return profile


@router.get("/patient/{patient_id}/recommendation", response_model=Recommendation)
def get_next_recommendation(patient_id: str):
    """Generate the next personalized cognitive intervention recommendation."""
    profile = pipeline_instance.get_profile(patient_id)
    if profile is None:
        # Fallback profile
        profile = CognitiveProfile(
            patient_id=patient_id,
            domain_scores=[
                CognitiveScore(domain="memory", score=0.5, confidence=0.2, sample_size=0)
            ],
            overall_score=0.5,
            overall_confidence=0.2,
            strengths=[],
            weaknesses=[],
            total_events=0,
        )

    return pipeline_instance.recommendations.recommend(profile)


@router.get("/patient/{patient_id}/analytics", response_model=CaregiverReport)
def get_patient_analytics(patient_id: str):
    """Retrieve full Caregiver Report, trends, and clinical alerts."""
    return pipeline_instance.get_caregiver_report(patient_id)


# ---------------------------------------------------------------------------
# Memory Prosthetic Vision Endpoints
# ---------------------------------------------------------------------------

@router.post("/prosthetic/face/enroll")
def enroll_face(req: FaceEnrollRequest):
    """Enroll a familiar family member / caregiver face embedding."""
    person = EnrolledFace(
        person_id=req.person_id,
        name=req.name,
        relation=req.relation,
        core_memory=req.core_memory,
        location=req.location,
        photo_uri=req.photo_uri,
        embedding=req.embedding,
    )
    pipeline_instance.face_prosthetic.enroll_person(person)
    return {"status": "enrolled", "person_id": req.person_id, "name": req.name}


@router.post("/prosthetic/face/match", response_model=FaceMatchResult)
def match_face(req: FaceMatchRequest):
    """Match query face vector against enrolled gallery."""
    return pipeline_instance.face_prosthetic.recognize_face(req.query_embedding)


@router.post("/prosthetic/object/detect", response_model=list[DetectedObject])
def detect_memory_objects(req: ObjectDetectRequest):
    """Process object detection inference into localized dementia guidance cues."""
    return pipeline_instance.object_prosthetic.detect_objects(req.raw_detections)

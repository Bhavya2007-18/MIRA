"""MIRA ML Schemas — Data contracts for cognitive events, profiles, vision, tracking, and telehealth."""

from mira_ml.schemas.cognitive import CognitiveProfile, CognitiveScore, DomainThresholds
from mira_ml.schemas.events import GameEvent, GameEventBatch, TaskType
from mira_ml.schemas.recommendations import DifficultyRecommendation, Recommendation, RecommendationType
from mira_ml.schemas.vision import (
    BoundingBox,
    EnrolledIdentity,
    EnrolledObject,
    FaceRecognitionResult,
    ObjectRecognitionResult,
    VisionStatus,
)
from mira_ml.schemas.tracking import LocationPing
from mira_ml.schemas.telehealth import CallStatus, CallInitiateRequest

__all__ = [
    "CognitiveProfile",
    "CognitiveScore",
    "DomainThresholds",
    "GameEvent",
    "GameEventBatch",
    "TaskType",
    "DifficultyRecommendation",
    "Recommendation",
    "RecommendationType",
    "BoundingBox",
    "EnrolledIdentity",
    "EnrolledObject",
    "FaceRecognitionResult",
    "ObjectRecognitionResult",
    "VisionStatus",
    "LocationPing",
    "CallStatus",
    "CallInitiateRequest",
]

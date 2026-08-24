"""Memory Prosthetic subsystem for on-device identity & object assistance."""

from mira_ml.prosthetic.face import (
    FaceRecognitionEngine,
    EnrolledFace,
    FaceMatchResult,
    cosine_similarity,
)
from mira_ml.prosthetic.objects import (
    ObjectRecognitionEngine,
    DetectedObject,
    BoundingBox,
    ASSISTANCE_OBJECT_CATALOG,
)

__all__ = [
    "FaceRecognitionEngine",
    "EnrolledFace",
    "FaceMatchResult",
    "cosine_similarity",
    "ObjectRecognitionEngine",
    "DetectedObject",
    "BoundingBox",
    "ASSISTANCE_OBJECT_CATALOG",
]

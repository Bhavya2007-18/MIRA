"""Face recognition component of the Memory Prosthetic."""

from mira_ml.vision.face.recognition import (
    FaceEnrollmentStore,
    FaceMatchConfig,
    match_face,
    cosine_similarity,
)

__all__ = [
    "FaceEnrollmentStore",
    "FaceMatchConfig",
    "match_face",
    "cosine_similarity",
]

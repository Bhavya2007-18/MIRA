"""Object recognition component of the Memory Prosthetic."""

from mira_ml.vision.object.recognition import (
    ObjectEnrollmentStore,
    ObjectMatchConfig,
    match_object,
    cosine_similarity,
)

__all__ = [
    "ObjectEnrollmentStore",
    "ObjectMatchConfig",
    "match_object",
    "cosine_similarity",
]

"""Face recognition pipeline for the Memory Prosthetic.

Pipeline:
    Camera Frame → Face Detection → Embedding → Matching → Identity + Confidence

Supports enrollment and recognition with configurable thresholds.
Never forces an identity when confidence is low.
"""

from __future__ import annotations

import math
import time
from dataclasses import dataclass, field

from mira_ml.schemas.vision import (
    FaceRecognitionResult,
    EnrolledIdentity,
    VisionStatus,
    BoundingBox,
)


@dataclass(frozen=True)
class FaceMatchConfig:
    """Configuration for face matching."""

    # Similarity threshold for KNOWN status
    known_threshold: float = 0.75

    # Below this → UNCERTAIN
    uncertain_threshold: float = 0.50

    # Embedding dimensions
    embedding_dim: int = 128

    # Minimum enrollment samples
    min_enrollment_samples: int = 3


DEFAULT_FACE_CONFIG = FaceMatchConfig()


@dataclass
class FaceEnrollmentStore:
    """In-memory store for enrolled face embeddings.

    In production, this would use a local database or file storage
    for offline operation.
    """

    _identities: dict[str, list[list[float]]] = field(default_factory=dict)
    _labels: dict[str, str] = field(default_factory=dict)

    def enroll(
        self,
        identity_id: str,
        label: str,
        embeddings: list[list[float]],
        config: FaceMatchConfig | None = None,
    ) -> EnrolledIdentity:
        """Enroll a new face identity with multiple embeddings.

        Args:
            identity_id: Unique identifier for this person.
            label: Human-readable name (e.g. "Daughter Ananya").
            embeddings: List of face embeddings (each is a float vector).
            config: Face matching configuration.

        Returns:
            EnrolledIdentity with enrollment metadata.

        Raises:
            ValueError: If insufficient samples or inconsistent dimensions.
        """
        cfg = config or DEFAULT_FACE_CONFIG

        if len(embeddings) < cfg.min_enrollment_samples:
            raise ValueError(
                f"Need at least {cfg.min_enrollment_samples} samples, "
                f"got {len(embeddings)}"
            )

        dim = len(embeddings[0])
        if any(len(e) != dim for e in embeddings):
            raise ValueError("All embeddings must have the same dimension")

        # Average the embeddings for a stable representation
        avg = [sum(e[i] for e in embeddings) / len(embeddings) for i in range(dim)]

        # Store
        self._identities[identity_id] = [avg]
        self._labels[identity_id] = label

        return EnrolledIdentity(
            identity_id=identity_id,
            label=label,
            embedding_dim=dim,
            sample_count=len(embeddings),
        )

    def get_identity(self, identity_id: str) -> list[list[float]] | None:
        """Get stored embeddings for an identity."""
        return self._identities.get(identity_id)

    def get_label(self, identity_id: str) -> str | None:
        """Get the label for an identity."""
        return self._labels.get(identity_id)

    def list_identities(self) -> list[str]:
        """List all enrolled identity IDs."""
        return list(self._identities.keys())

    def remove(self, identity_id: str) -> bool:
        """Remove an enrolled identity."""
        if identity_id in self._identities:
            del self._identities[identity_id]
            self._labels.pop(identity_id, None)
            return True
        return False

    @property
    def count(self) -> int:
        """Number of enrolled identities."""
        return len(self._identities)


def cosine_similarity(a: list[float], b: list[float]) -> float:
    """Compute cosine similarity between two vectors."""
    if len(a) != len(b) or len(a) == 0:
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(x * x for x in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def match_face(
    query_embedding: list[float],
    store: FaceEnrollmentStore,
    patient_id: str,
    config: FaceMatchConfig | None = None,
    bounding_box: BoundingBox | None = None,
) -> FaceRecognitionResult:
    """Match a query face embedding against enrolled identities.

    Args:
        query_embedding: Face embedding from the camera frame.
        store: Enrolled face identity store.
        patient_id: Patient context.
        config: Matching configuration.
        bounding_box: Optional face location in frame.

    Returns:
        FaceRecognitionResult with identity or UNCERTAIN/UNKNOWN status.
    """
    cfg = config or DEFAULT_FACE_CONFIG
    start = time.monotonic()

    if not query_embedding or len(query_embedding) != cfg.embedding_dim:
        return FaceRecognitionResult(
            patient_id=patient_id,
            confidence=0.0,
            status=VisionStatus.ERROR,
            inference_time_ms=0.0,
        )

    if store.count == 0:
        return FaceRecognitionResult(
            patient_id=patient_id,
            confidence=0.0,
            status=VisionStatus.UNKNOWN,
            bounding_box=bounding_box,
            inference_time_ms=(time.monotonic() - start) * 1000,
        )

    # Find best match
    best_id = None
    best_sim = -1.0

    for identity_id in store.list_identities():
        embeddings = store.get_identity(identity_id)
        if not embeddings:
            continue
        # Compare against stored (averaged) embedding
        sim = cosine_similarity(query_embedding, embeddings[0])
        if sim > best_sim:
            best_sim = sim
            best_id = identity_id

    elapsed_ms = (time.monotonic() - start) * 1000

    # Determine status
    if best_sim >= cfg.known_threshold:
        status = VisionStatus.KNOWN
    elif best_sim >= cfg.uncertain_threshold:
        status = VisionStatus.UNCERTAIN
    else:
        status = VisionStatus.UNKNOWN
        best_id = None

    label = store.get_label(best_id) if best_id else None

    return FaceRecognitionResult(
        patient_id=patient_id,
        identity_id=best_id,
        identity_label=label,
        confidence=round(max(0.0, best_sim), 4),
        status=status,
        bounding_box=bounding_box,
        inference_time_ms=round(elapsed_ms, 2),
    )

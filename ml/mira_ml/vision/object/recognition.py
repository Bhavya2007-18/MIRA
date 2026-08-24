"""Object recognition pipeline for the Memory Prosthetic.

Focuses on personal objects (keys, glasses, wallet, phone, etc.)
rather than universal object recognition.

Pipeline:
    Camera Frame → Detection → Embedding → Matching → Object Identity
"""

from __future__ import annotations

import math
import time
from dataclasses import dataclass, field

from mira_ml.schemas.vision import (
    ObjectRecognitionResult,
    EnrolledObject,
    VisionStatus,
    BoundingBox,
)


# Default personal objects the system recognizes
DEFAULT_PERSONAL_OBJECTS = [
    "keys", "glasses", "wallet", "phone",
    "medicine_box", "bottle", "walking_stick",
]


@dataclass(frozen=True)
class ObjectMatchConfig:
    """Configuration for object matching."""

    known_threshold: float = 0.70
    uncertain_threshold: float = 0.45
    embedding_dim: int = 64
    min_enrollment_samples: int = 3


DEFAULT_OBJECT_CONFIG = ObjectMatchConfig()


@dataclass
class ObjectEnrollmentStore:
    """In-memory store for enrolled personal object embeddings."""

    _objects: dict[str, list[list[float]]] = field(default_factory=dict)
    _labels: dict[str, str] = field(default_factory=dict)

    def enroll(
        self,
        object_id: str,
        label: str,
        embeddings: list[list[float]],
        config: ObjectMatchConfig | None = None,
    ) -> EnrolledObject:
        """Enroll a personal object with multiple embeddings."""
        cfg = config or DEFAULT_OBJECT_CONFIG

        if len(embeddings) < cfg.min_enrollment_samples:
            raise ValueError(
                f"Need at least {cfg.min_enrollment_samples} samples, "
                f"got {len(embeddings)}"
            )

        dim = len(embeddings[0])
        if any(len(e) != dim for e in embeddings):
            raise ValueError("All embeddings must have the same dimension")

        avg = [sum(e[i] for e in embeddings) / len(embeddings) for i in range(dim)]

        self._objects[object_id] = [avg]
        self._labels[object_id] = label

        return EnrolledObject(
            object_id=object_id,
            label=label,
            embedding_dim=dim,
            sample_count=len(embeddings),
        )

    def get_object(self, object_id: str) -> list[list[float]] | None:
        return self._objects.get(object_id)

    def get_label(self, object_id: str) -> str | None:
        return self._labels.get(object_id)

    def list_objects(self) -> list[str]:
        return list(self._objects.keys())

    def remove(self, object_id: str) -> bool:
        if object_id in self._objects:
            del self._objects[object_id]
            self._labels.pop(object_id, None)
            return True
        return False

    @property
    def count(self) -> int:
        return len(self._objects)


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


def match_object(
    query_embedding: list[float],
    store: ObjectEnrollmentStore,
    patient_id: str,
    config: ObjectMatchConfig | None = None,
    bounding_box: BoundingBox | None = None,
) -> ObjectRecognitionResult:
    """Match a query object embedding against enrolled personal objects.

    Args:
        query_embedding: Object embedding from detection pipeline.
        store: Enrolled object store.
        patient_id: Patient context.
        config: Matching configuration.
        bounding_box: Optional object location in frame.

    Returns:
        ObjectRecognitionResult with identity or UNCERTAIN/UNKNOWN status.
    """
    cfg = config or DEFAULT_OBJECT_CONFIG
    start = time.monotonic()

    if not query_embedding or len(query_embedding) != cfg.embedding_dim:
        return ObjectRecognitionResult(
            patient_id=patient_id,
            confidence=0.0,
            status=VisionStatus.ERROR,
            inference_time_ms=0.0,
        )

    if store.count == 0:
        return ObjectRecognitionResult(
            patient_id=patient_id,
            confidence=0.0,
            status=VisionStatus.UNKNOWN,
            bounding_box=bounding_box,
            inference_time_ms=(time.monotonic() - start) * 1000,
        )

    best_id = None
    best_sim = -1.0

    for object_id in store.list_objects():
        embeddings = store.get_object(object_id)
        if not embeddings:
            continue
        sim = cosine_similarity(query_embedding, embeddings[0])
        if sim > best_sim:
            best_sim = sim
            best_id = object_id

    elapsed_ms = (time.monotonic() - start) * 1000

    if best_sim >= cfg.known_threshold:
        status = VisionStatus.KNOWN
    elif best_sim >= cfg.uncertain_threshold:
        status = VisionStatus.UNCERTAIN
    else:
        status = VisionStatus.UNKNOWN
        best_id = None

    label = store.get_label(best_id) if best_id else None

    return ObjectRecognitionResult(
        patient_id=patient_id,
        object_id=best_id,
        object_label=label,
        confidence=round(max(0.0, best_sim), 4),
        status=status,
        bounding_box=bounding_box,
        inference_time_ms=round(elapsed_ms, 2),
    )

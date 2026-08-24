"""Tests for face recognition (Memory Prosthetic)."""

from __future__ import annotations

import math
import pytest

from mira_ml.schemas.vision import (
    FaceRecognitionResult,
    EnrolledIdentity,
    VisionStatus,
    BoundingBox,
)
from mira_ml.vision.face.recognition import (
    FaceEnrollmentStore,
    FaceMatchConfig,
    match_face,
    cosine_similarity,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _embedding(dim: int = 128, base: float = 1.0) -> list[float]:
    """Create a simple test embedding."""
    return [base + i * 0.01 for i in range(dim)]


def _similar_embedding(ref: list[float], noise: float = 0.05) -> list[float]:
    """Create an embedding similar to ref with small noise."""
    import random
    random.seed(42)
    return [x + random.uniform(-noise, noise) for x in ref]


def _different_embedding(dim: int = 128) -> list[float]:
    """Create a clearly different embedding (negative slope, orthogonal to reference)."""
    return [-1.0 + i * 0.01 for i in range(dim)]


# ---------------------------------------------------------------------------
# cosine_similarity tests
# ---------------------------------------------------------------------------

class TestCosineSimilarity:
    def test_identical_vectors(self):
        v = [1.0, 2.0, 3.0]
        assert abs(cosine_similarity(v, v) - 1.0) < 1e-6

    def test_orthogonal_vectors(self):
        a = [1.0, 0.0]
        b = [0.0, 1.0]
        assert abs(cosine_similarity(a, b)) < 1e-6

    def test_opposite_vectors(self):
        a = [1.0, 0.0]
        b = [-1.0, 0.0]
        assert abs(cosine_similarity(a, b) - (-1.0)) < 1e-6

    def test_empty_vectors(self):
        assert cosine_similarity([], []) == 0.0

    def test_different_lengths(self):
        assert cosine_similarity([1.0], [1.0, 2.0]) == 0.0

    def test_zero_vector(self):
        assert cosine_similarity([0.0, 0.0], [1.0, 2.0]) == 0.0

    def test_bounds(self):
        a = _embedding(128)
        b = _embedding(128, base=2.0)
        sim = cosine_similarity(a, b)
        assert -1.0 <= sim <= 1.0


# ---------------------------------------------------------------------------
# FaceEnrollmentStore tests
# ---------------------------------------------------------------------------

class TestFaceEnrollmentStore:
    def test_enroll_success(self):
        store = FaceEnrollmentStore()
        embeddings = [_embedding() for _ in range(5)]
        result = store.enroll("f-001", "Daughter Ananya", embeddings)
        assert result.identity_id == "f-001"
        assert result.label == "Daughter Ananya"
        assert result.sample_count == 5

    def test_enroll_insufficient_samples(self):
        store = FaceEnrollmentStore()
        with pytest.raises(ValueError, match="at least"):
            store.enroll("f-001", "Test", [_embedding()])

    def test_enroll_inconsistent_dimensions(self):
        store = FaceEnrollmentStore()
        # First check is sample count, so provide enough samples with wrong dims
        with pytest.raises(ValueError, match="same dimension"):
            store.enroll("f-001", "Test", [[1.0, 2.0], [1.0, 2.0, 3.0], [1.0]])

    def test_list_identities(self):
        store = FaceEnrollmentStore()
        store.enroll("f-001", "A", [_embedding() for _ in range(3)])
        store.enroll("f-002", "B", [_embedding() for _ in range(3)])
        assert set(store.list_identities()) == {"f-001", "f-002"}

    def test_get_label(self):
        store = FaceEnrollmentStore()
        store.enroll("f-001", "Daughter", [_embedding() for _ in range(3)])
        assert store.get_label("f-001") == "Daughter"
        assert store.get_label("nonexistent") is None

    def test_remove(self):
        store = FaceEnrollmentStore()
        store.enroll("f-001", "A", [_embedding() for _ in range(3)])
        assert store.remove("f-001") is True
        assert store.count == 0
        assert store.remove("f-001") is False

    def test_count(self):
        store = FaceEnrollmentStore()
        assert store.count == 0
        store.enroll("f-001", "A", [_embedding() for _ in range(3)])
        assert store.count == 1


# ---------------------------------------------------------------------------
# match_face tests
# ---------------------------------------------------------------------------

class TestMatchFace:
    def setup_method(self):
        self.store = FaceEnrollmentStore()
        self.ref = _embedding()
        self.store.enroll("f-001", "Daughter Ananya", [
            _similar_embedding(self.ref, noise=0.01) for _ in range(5)
        ])
        self.store.enroll("f-002", "Son Bhavya", [
            _different_embedding() for _ in range(5)
        ])

    def test_known_face(self):
        query = _similar_embedding(self.ref, noise=0.02)
        result = match_face(query, self.store, patient_id="p-001")
        assert result.status == VisionStatus.KNOWN
        assert result.identity_id == "f-001"
        assert result.identity_label == "Daughter Ananya"
        assert result.confidence > 0.7

    def test_unknown_face(self):
        import random
        random.seed(99)
        query = [random.uniform(-1.0, 1.0) for _ in range(128)]
        result = match_face(query, self.store, patient_id="p-001")
        assert result.status == VisionStatus.UNKNOWN
        assert result.identity_id is None

    def test_empty_store(self):
        empty_store = FaceEnrollmentStore()
        result = match_face(_embedding(), empty_store, patient_id="p-001")
        assert result.status == VisionStatus.UNKNOWN

    def test_invalid_embedding_length(self):
        result = match_face([1.0, 2.0], self.store, patient_id="p-001")
        assert result.status == VisionStatus.ERROR

    def test_empty_embedding(self):
        result = match_face([], self.store, patient_id="p-001")
        assert result.status == VisionStatus.ERROR

    def test_bounding_box_passed(self):
        bb = BoundingBox(x=0.1, y=0.2, width=0.3, height=0.4)
        result = match_face(_similar_embedding(self.ref), self.store, patient_id="p-001", bounding_box=bb)
        assert result.bounding_box == bb

    def test_inference_time_populated(self):
        result = match_face(_embedding(), self.store, patient_id="p-001")
        assert result.inference_time_ms >= 0

    def test_patient_id_preserved(self):
        result = match_face(_embedding(), self.store, patient_id="special-42")
        assert result.patient_id == "special-42"

    def test_confidence_bounds(self):
        for _ in range(10):
            query = _similar_embedding(self.ref, noise=0.5)
            result = match_face(query, self.store, patient_id="p-001")
            assert 0.0 <= result.confidence <= 1.0

    def test_deterministic(self):
        query = _similar_embedding(self.ref, noise=0.01)
        r1 = match_face(query, self.store, patient_id="p-001")
        r2 = match_face(query, self.store, patient_id="p-001")
        assert r1.status == r2.status
        assert r1.confidence == r2.confidence

    def test_multiple_identities(self):
        # Query should match the closest identity
        query = _similar_embedding(self.ref, noise=0.01)
        result = match_face(query, self.store, patient_id="p-001")
        assert result.identity_id == "f-001"

    def test_configurable_threshold(self):
        strict_config = FaceMatchConfig(known_threshold=0.99)
        query = _similar_embedding(self.ref, noise=0.5)
        result = match_face(query, self.store, patient_id="p-001", config=strict_config)
        # With very strict threshold, should be UNCERTAIN or UNKNOWN
        assert result.status != VisionStatus.KNOWN

"""Tests for object recognition (Memory Prosthetic)."""

from __future__ import annotations

import pytest

from mira_ml.schemas.vision import (
    ObjectRecognitionResult,
    EnrolledObject,
    VisionStatus,
    BoundingBox,
)
from mira_ml.vision.object.recognition import (
    ObjectEnrollmentStore,
    ObjectMatchConfig,
    match_object,
    cosine_similarity,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _obj_embedding(dim: int = 64, base: float = 1.0) -> list[float]:
    return [base + i * 0.02 for i in range(dim)]


def _similar_obj(ref: list[float], noise: float = 0.05) -> list[float]:
    import random
    random.seed(42)
    return [x + random.uniform(-noise, noise) for x in ref]


def _different_obj(dim: int = 64) -> list[float]:
    """Create a clearly different embedding (negative slope, orthogonal to reference)."""
    return [-1.0 + i * 0.02 for i in range(dim)]


# ---------------------------------------------------------------------------
# ObjectEnrollmentStore tests
# ---------------------------------------------------------------------------

class TestObjectEnrollmentStore:
    def test_enroll_success(self):
        store = ObjectEnrollmentStore()
        embeddings = [_obj_embedding() for _ in range(5)]
        result = store.enroll("o-001", "Black Wallet", embeddings)
        assert result.object_id == "o-001"
        assert result.label == "Black Wallet"
        assert result.sample_count == 5

    def test_enroll_insufficient_samples(self):
        store = ObjectEnrollmentStore()
        with pytest.raises(ValueError, match="at least"):
            store.enroll("o-001", "Test", [_obj_embedding()])

    def test_list_objects(self):
        store = ObjectEnrollmentStore()
        store.enroll("o-001", "Keys", [_obj_embedding() for _ in range(3)])
        store.enroll("o-002", "Glasses", [_obj_embedding() for _ in range(3)])
        assert set(store.list_objects()) == {"o-001", "o-002"}

    def test_remove(self):
        store = ObjectEnrollmentStore()
        store.enroll("o-001", "Keys", [_obj_embedding() for _ in range(3)])
        assert store.remove("o-001") is True
        assert store.count == 0

    def test_count(self):
        store = ObjectEnrollmentStore()
        assert store.count == 0
        store.enroll("o-001", "Keys", [_obj_embedding() for _ in range(3)])
        assert store.count == 1


# ---------------------------------------------------------------------------
# match_object tests
# ---------------------------------------------------------------------------

class TestMatchObject:
    def setup_method(self):
        self.store = ObjectEnrollmentStore()
        self.ref = _obj_embedding()
        self.store.enroll("o-001", "Black Wallet", [
            _similar_obj(self.ref, noise=0.01) for _ in range(5)
        ])
        self.store.enroll("o-002", "Silver Keys", [
            _different_obj() for _ in range(5)
        ])

    def test_known_object(self):
        query = _similar_obj(self.ref, noise=0.02)
        result = match_object(query, self.store, patient_id="p-001")
        assert result.status == VisionStatus.KNOWN
        assert result.object_id == "o-001"
        assert result.object_label == "Black Wallet"
        assert result.confidence > 0.7

    def test_unknown_object(self):
        import random
        random.seed(99)
        query = [random.uniform(-1.0, 1.0) for _ in range(64)]
        result = match_object(query, self.store, patient_id="p-001")
        assert result.status == VisionStatus.UNKNOWN
        assert result.object_id is None

    def test_empty_store(self):
        empty_store = ObjectEnrollmentStore()
        result = match_object(_obj_embedding(), empty_store, patient_id="p-001")
        assert result.status == VisionStatus.UNKNOWN

    def test_invalid_embedding(self):
        result = match_object([1.0], self.store, patient_id="p-001")
        assert result.status == VisionStatus.ERROR

    def test_empty_embedding(self):
        result = match_object([], self.store, patient_id="p-001")
        assert result.status == VisionStatus.ERROR

    def test_bounding_box(self):
        bb = BoundingBox(x=0.2, y=0.3, width=0.4, height=0.5)
        result = match_object(_similar_obj(self.ref), self.store, patient_id="p-001", bounding_box=bb)
        assert result.bounding_box == bb

    def test_inference_time(self):
        result = match_object(_obj_embedding(), self.store, patient_id="p-001")
        assert result.inference_time_ms >= 0

    def test_deterministic(self):
        query = _similar_obj(self.ref, noise=0.01)
        r1 = match_object(query, self.store, patient_id="p-001")
        r2 = match_object(query, self.store, patient_id="p-001")
        assert r1.status == r2.status
        assert r1.confidence == r2.confidence

    def test_configurable_threshold(self):
        strict = ObjectMatchConfig(known_threshold=0.99)
        query = _similar_obj(self.ref, noise=0.5)
        result = match_object(query, self.store, patient_id="p-001", config=strict)
        assert result.status != VisionStatus.KNOWN

    def test_confidence_bounds(self):
        for _ in range(10):
            query = _similar_obj(self.ref, noise=0.5)
            result = match_object(query, self.store, patient_id="p-001")
            assert 0.0 <= result.confidence <= 1.0

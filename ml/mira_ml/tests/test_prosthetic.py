"""Tests for Memory Prosthetic face recognition and object detection."""

from __future__ import annotations

import pytest

from mira_ml.prosthetic.face import (
    FaceRecognitionEngine,
    EnrolledFace,
    cosine_similarity,
)
from mira_ml.prosthetic.objects import (
    ObjectRecognitionEngine,
    BoundingBox,
    ASSISTANCE_OBJECT_CATALOG,
)


class TestFaceRecognitionEngine:
    def setup_method(self):
        self.engine = FaceRecognitionEngine(match_threshold=0.75)
        self.priya_embedding = [0.8, 0.6, 0.0, 0.0]
        self.rohan_embedding = [0.0, 0.0, 0.9, 0.4]

        self.engine.enroll_person(
            EnrolledFace(
                person_id="p-priya",
                name="Priya Hazarika",
                relation="Daughter",
                core_memory="Teaches mathematics in Guwahati University",
                location="Guwahati, Assam",
                embedding=self.priya_embedding,
            )
        )
        self.engine.enroll_person(
            EnrolledFace(
                person_id="p-rohan",
                name="Rohan Sangma",
                relation="Grandson",
                core_memory="Loves playing Bihu Dhol and football",
                location="Shillong, Meghalaya",
                embedding=self.rohan_embedding,
            )
        )

    def test_cosine_similarity_identical(self):
        vec = [0.5, 0.5, 0.5, 0.5]
        assert abs(cosine_similarity(vec, vec) - 1.0) < 1e-5

    def test_cosine_similarity_orthogonal(self):
        vec_a = [1.0, 0.0]
        vec_b = [0.0, 1.0]
        assert abs(cosine_similarity(vec_a, vec_b) - 0.0) < 1e-5

    def test_recognize_known_person_high_confidence(self):
        # Query close to Priya's embedding
        query = [0.79, 0.61, 0.01, 0.0]
        res = self.engine.recognize_face(query)

        assert res.matched is True
        assert res.person is not None
        assert res.person.name == "Priya Hazarika"
        assert res.confidence >= 0.85
        assert "Priya Hazarika" in res.speech_prompt_en
        assert "প্ৰিয়া হাজৰিকা" in res.speech_prompt_as

    def test_recognize_unknown_face(self):
        # Unfamiliar face vector
        query = [0.1, 0.0, 0.1, 0.95]
        res = self.engine.recognize_face(query)

        assert res.matched is False
        assert res.is_unknown is True
        assert res.person is None
        assert "Unrecognized person" in res.speech_prompt_en

    def test_remove_enrolled_person(self):
        assert self.engine.remove_person("p-priya") is True
        assert len(self.engine.list_enrolled()) == 1


class TestObjectRecognitionEngine:
    def setup_method(self):
        self.engine = ObjectRecognitionEngine(min_confidence=0.65)

    def test_detect_glasses_above_threshold(self):
        raw = [("glasses", 0.92, (0.2, 0.3, 0.6, 0.7))]
        detections = self.engine.detect_objects(raw)

        assert len(detections) == 1
        d = detections[0]
        assert d.object_id == "glasses"
        assert d.label_en == "Reading Glasses"
        assert "চশমা" in d.label_as
        assert d.confidence == 0.92

    def test_filter_low_confidence_detections(self):
        raw = [("medicine_box", 0.45, (0.1, 0.1, 0.4, 0.4))]
        detections = self.engine.detect_objects(raw)
        assert len(detections) == 0

    def test_multiple_objects_detection(self):
        raw = [
            ("medicine_box", 0.88, (0.1, 0.1, 0.3, 0.3)),
            ("walking_stick", 0.79, (0.2, 0.5, 0.8, 0.6)),
        ]
        detections = self.engine.detect_objects(raw)
        assert len(detections) == 2
        labels = {d.object_id for d in detections}
        assert labels == {"medicine_box", "walking_stick"}

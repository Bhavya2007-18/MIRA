"""Tests for offline/edge inference infrastructure (Phase 10)."""

from __future__ import annotations

import pytest

from mira_ml.schemas.vision import BoundingBox, VisionStatus
from mira_ml.inference.interfaces import (
    FaceDetector,
    FaceEmbedder,
    ObjectDetector,
    ObjectEmbedder,
    DummyFaceDetector,
    DummyFaceEmbedder,
    DummyObjectDetector,
    DummyObjectEmbedder,
    Detection,
    EmbeddingResult,
)
from mira_ml.inference.model_manager import (
    ModelManager,
    ModelConfig,
    ModelBackend,
    ModelStatus,
    ModelHealth,
)
from mira_ml.inference.pipeline import InferencePipeline, PipelineResult
from mira_ml.inference.onnx_export import (
    OnnxExportConfig,
    OnnxExportResult,
    export_to_onnx,
    validate_onnx_model,
)
from mira_ml.vision.face.recognition import FaceEnrollmentStore
from mira_ml.vision.object.recognition import ObjectEnrollmentStore


# ---------------------------------------------------------------------------
# Dummy model tests
# ---------------------------------------------------------------------------

class TestDummyModels:
    def test_dummy_face_detector(self):
        det = DummyFaceDetector()
        assert det.is_loaded() is False
        assert det.detect([]) == []

    def test_dummy_face_embedder(self):
        emb = DummyFaceEmbedder(dim=128)
        assert emb.is_loaded() is False
        assert emb.embedding_dim() == 128
        result = emb.embed([])
        assert result.dimension == 128
        assert len(result.embedding) == 128
        assert all(v == 0.0 for v in result.embedding)

    def test_dummy_object_detector(self):
        det = DummyObjectDetector()
        assert det.is_loaded() is False
        assert det.detect([]) == []

    def test_dummy_object_embedder(self):
        emb = DummyObjectEmbedder(dim=64)
        assert emb.is_loaded() is False
        assert emb.embedding_dim() == 64
        result = emb.embed([])
        assert result.dimension == 64

    def test_detection_dataclass(self):
        det = Detection(
            bbox=BoundingBox(x=0.1, y=0.2, width=0.3, height=0.4),
            confidence=0.9,
            class_id=1,
            class_label="face",
        )
        assert det.confidence == 0.9
        assert det.class_label == "face"

    def test_embedding_result(self):
        er = EmbeddingResult(embedding=[0.1, 0.2], dimension=2, inference_time_ms=1.5)
        assert er.dimension == 2
        assert er.inference_time_ms == 1.5


# ---------------------------------------------------------------------------
# ModelManager tests
# ---------------------------------------------------------------------------

class TestModelManager:
    def test_configure_and_health(self):
        mgr = ModelManager()
        mgr.configure("face_detector", ModelConfig(
            name="face_detector",
            backend=ModelBackend.DUMMY,
        ))
        health = mgr.health()
        assert "face_detector" in health
        assert health["face_detector"].status == ModelStatus.NOT_LOADED

    def test_load_dummy_model(self):
        mgr = ModelManager()
        mgr.configure("face_detector", ModelConfig(
            name="face_detector",
            backend=ModelBackend.DUMMY,
        ))
        result = mgr.load("face_detector")
        assert result.status == ModelStatus.READY
        assert result.backend == ModelBackend.DUMMY

    def test_load_all(self):
        mgr = ModelManager()
        mgr.configure("fd", ModelConfig(name="fd", backend=ModelBackend.DUMMY))
        mgr.configure("fe", ModelConfig(name="fe", backend=ModelBackend.DUMMY))
        results = mgr.load_all()
        assert len(results) == 2
        assert all(r.status == ModelStatus.READY for r in results.values())

    def test_get_face_detector_returns_loaded(self):
        mgr = ModelManager()
        mgr.configure("face_detector", ModelConfig(name="fd", backend=ModelBackend.DUMMY))
        mgr.load("face_detector")
        det = mgr.get_face_detector("face_detector")
        assert isinstance(det, DummyFaceDetector)

    def test_get_returns_dummy_when_not_loaded(self):
        mgr = ModelManager()
        det = mgr.get_face_detector("nonexistent")
        assert isinstance(det, DummyFaceDetector)
        assert det.is_loaded() is False

    def test_load_nonexistent_config(self):
        mgr = ModelManager()
        result = mgr.load("nonexistent")
        assert result.status == ModelStatus.ERROR

    def test_unload_all(self):
        mgr = ModelManager()
        mgr.configure("fd", ModelConfig(name="fd", backend=ModelBackend.DUMMY))
        mgr.load_all()
        mgr.unload_all()
        health = mgr.health()
        assert all(r.status == ModelStatus.NOT_LOADED for r in health.values())

    def test_onnx_fallback_to_dummy(self):
        mgr = ModelManager()
        mgr.configure("face_detector", ModelConfig(
            name="fd",
            backend=ModelBackend.ONNX,
            model_path="/nonexistent/model.onnx",
        ))
        result = mgr.load("face_detector")
        # Falls back to dummy when model file not found
        assert result.status == ModelStatus.ERROR
        assert "not found" in result.error_message.lower()

    def test_health_after_load(self):
        mgr = ModelManager()
        mgr.configure("fd", ModelConfig(name="fd", backend=ModelBackend.DUMMY))
        mgr.load("fd")
        health = mgr.health()
        assert health["fd"].status == ModelStatus.READY


# ---------------------------------------------------------------------------
# InferencePipeline tests
# ---------------------------------------------------------------------------

class TestInferencePipeline:
    def setup_method(self):
        self.pipeline = InferencePipeline()

    def test_process_frame_returns_result(self):
        # 10x10 RGB frame
        frame = [[[128, 128, 128] for _ in range(10)] for _ in range(10)]
        result = self.pipeline.process_frame(frame, patient_id="p-001")
        assert isinstance(result, PipelineResult)
        assert result.pipeline_time_ms >= 0

    def test_no_detections_on_dummy(self):
        frame = [[[0, 0, 0] for _ in range(10)] for _ in range(10)]
        result = self.pipeline.process_frame(frame, patient_id="p-001")
        assert result.face_result is None
        assert result.object_results == []

    def test_models_not_loaded_by_default(self):
        assert self.pipeline.face_detector.is_loaded() is False
        assert self.pipeline.object_detector.is_loaded() is False

    def test_process_face_crop(self):
        crop = [[[128, 128, 128] for _ in range(10)] for _ in range(10)]
        result = self.pipeline.process_face_crop(crop, patient_id="p-001")
        assert result.status in (VisionStatus.UNKNOWN, VisionStatus.ERROR)

    def test_process_object_crop(self):
        crop = [[[128, 128, 128] for _ in range(10)] for _ in range(10)]
        result = self.pipeline.process_object_crop(crop, patient_id="p-001")
        assert result.status in (VisionStatus.UNKNOWN, VisionStatus.ERROR)

    def test_with_enrolled_faces(self):
        store = FaceEnrollmentStore()
        # Enroll a face with dummy embeddings
        embeddings = [[0.1 + i * 0.01 for i in range(128)] for _ in range(5)]
        store.enroll("f-001", "Test Person", embeddings)

        pipeline = InferencePipeline(face_store=store)
        crop = [[[128, 128, 128] for _ in range(10)] for _ in range(10)]
        result = pipeline.process_face_crop(crop, patient_id="p-001")
        # Result depends on dummy embedder output matching enrolled face
        assert result.status in (VisionStatus.KNOWN, VisionStatus.UNKNOWN, VisionStatus.UNCERTAIN)

    def test_skip_faces(self):
        frame = [[[0, 0, 0] for _ in range(10)] for _ in range(10)]
        result = self.pipeline.process_frame(
            frame, patient_id="p-001", detect_faces=False
        )
        assert result.face_result is None
        assert result.face_detections == []

    def test_skip_objects(self):
        frame = [[[0, 0, 0] for _ in range(10)] for _ in range(10)]
        result = self.pipeline.process_frame(
            frame, patient_id="p-001", detect_objects=False
        )
        assert result.object_results == []
        assert result.object_detections == []

    def test_empty_frame(self):
        result = self.pipeline.process_frame([], patient_id="p-001")
        assert isinstance(result, PipelineResult)


# ---------------------------------------------------------------------------
# ONNX export tests
# ---------------------------------------------------------------------------

class TestOnnxExport:
    def test_export_without_torch(self):
        config = OnnxExportConfig(output_path="test.onnx")
        # Will fail gracefully since torch isn't loaded with a real model
        result = export_to_onnx(None, config, model_name="test")
        # Should either succeed with dummy or fail gracefully
        assert isinstance(result, OnnxExportResult)

    def test_validate_nonexistent(self):
        result = validate_onnx_model("/nonexistent/model.onnx")
        assert result["valid"] is False
        assert "not found" in result["error"].lower()

    def test_export_config_defaults(self):
        cfg = OnnxExportConfig()
        assert cfg.input_shape == (1, 3, 224, 224)
        assert cfg.opset_version == 11
        assert cfg.quantize is False

    def test_export_result_dataclass(self):
        r = OnnxExportResult(
            success=True,
            output_path="model.onnx",
            model_size_mb=1.5,
            quantized=False,
        )
        assert r.success is True
        assert r.model_size_mb == 1.5


# ---------------------------------------------------------------------------
# Integration: pipeline + enrollment
# ---------------------------------------------------------------------------

class TestPipelineIntegration:
    def test_full_pipeline_with_stores(self):
        face_store = FaceEnrollmentStore()
        obj_store = ObjectEnrollmentStore()

        # Enroll
        face_embs = [[0.5 + i * 0.01 for i in range(128)] for _ in range(5)]
        face_store.enroll("f-001", "Daughter", face_embs)

        obj_embs = [[0.3 + i * 0.02 for i in range(64)] for _ in range(5)]
        obj_store.enroll("o-001", "Keys", obj_embs)

        pipeline = InferencePipeline(
            face_store=face_store,
            object_store=obj_store,
        )

        frame = [[[128, 128, 128] for _ in range(20)] for _ in range(20)]
        result = pipeline.process_frame(frame, patient_id="p-001")

        assert isinstance(result, PipelineResult)
        assert result.pipeline_time_ms >= 0

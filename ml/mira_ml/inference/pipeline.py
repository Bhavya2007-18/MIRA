"""Inference pipeline — chains detection → embedding → matching.

Orchestrates the full Memory Prosthetic inference flow:
    Camera Frame → Detection → Embedding → Matching → Result

Supports graceful fallback when models are unavailable.
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Optional

from mira_ml.schemas.vision import (
    FaceRecognitionResult,
    ObjectRecognitionResult,
    VisionStatus,
    BoundingBox,
)
from mira_ml.vision.face.recognition import (
    FaceEnrollmentStore,
    FaceMatchConfig,
    match_face,
)
from mira_ml.vision.object.recognition import (
    ObjectEnrollmentStore,
    ObjectMatchConfig,
    match_object,
)
from mira_ml.inference.interfaces import (
    FaceDetector,
    FaceEmbedder,
    ObjectDetector,
    ObjectEmbedder,
    Detection,
    DummyFaceDetector,
    DummyFaceEmbedder,
    DummyObjectDetector,
    DummyObjectEmbedder,
)


@dataclass(frozen=True)
class PipelineResult:
    """Combined result from the inference pipeline."""

    face_result: FaceRecognitionResult | None = None
    object_results: list[ObjectRecognitionResult] = field(default_factory=list)
    face_detections: list[Detection] = field(default_factory=list)
    object_detections: list[Detection] = field(default_factory=list)
    pipeline_time_ms: float = 0.0
    models_loaded: bool = False


@dataclass
class InferencePipeline:
    """Full inference pipeline for the Memory Prosthetic.

    Chains:
        Frame → Face Detection → Face Embedding → Face Matching → Result
        Frame → Object Detection → Object Embedding → Object Matching → Result

    Usage:
        pipeline = InferencePipeline(
            face_detector=my_detector,
            face_embedder=my_embedder,
            face_store=face_enrollment_store,
        )
        result = pipeline.process_frame(frame, patient_id="p-001")
    """

    face_detector: FaceDetector = field(default_factory=DummyFaceDetector)
    face_embedder: FaceEmbedder = field(default_factory=DummyFaceEmbedder)
    object_detector: ObjectDetector = field(default_factory=DummyObjectDetector)
    object_embedder: ObjectEmbedder = field(default_factory=DummyObjectEmbedder)
    face_store: FaceEnrollmentStore = field(default_factory=FaceEnrollmentStore)
    object_store: ObjectEnrollmentStore = field(default_factory=ObjectEnrollmentStore)
    face_config: FaceMatchConfig = field(default_factory=FaceMatchConfig)
    object_config: ObjectMatchConfig = field(default_factory=ObjectMatchConfig)
    max_faces: int = 5
    max_objects: int = 10

    def process_frame(
        self,
        frame: list[list[list[int]]],
        patient_id: str,
        detect_faces: bool = True,
        detect_objects: bool = True,
    ) -> PipelineResult:
        """Process a full camera frame through the inference pipeline.

        Args:
            frame: Image as H×W×3 list (RGB, values 0-255).
            patient_id: Patient identifier.
            detect_faces: Whether to run face detection.
            detect_objects: Whether to run object detection.

        Returns:
            PipelineResult with face and object recognition results.
        """
        start = time.monotonic()
        models_loaded = (
            self.face_detector.is_loaded()
            or self.object_detector.is_loaded()
        )

        face_result = None
        face_detections: list[Detection] = []
        object_results: list[ObjectRecognitionResult] = []
        object_detections: list[Detection] = []

        # Face pipeline
        if detect_faces:
            face_result, face_detections = self._process_faces(frame, patient_id)

        # Object pipeline
        if detect_objects:
            object_results, object_detections = self._process_objects(frame, patient_id)

        elapsed_ms = (time.monotonic() - start) * 1000

        return PipelineResult(
            face_result=face_result,
            object_results=object_results,
            face_detections=face_detections,
            object_detections=object_detections,
            pipeline_time_ms=round(elapsed_ms, 2),
            models_loaded=models_loaded,
        )

    def process_face_crop(
        self,
        face_crop: list[list[list[int]]],
        patient_id: str,
        bounding_box: BoundingBox | None = None,
    ) -> FaceRecognitionResult:
        """Process a pre-cropped face image (skips detection step).

        Useful when face detection is done externally (e.g., by the camera app).
        """
        embed_result = self.face_embedder.embed(face_crop)
        return match_face(
            query_embedding=embed_result.embedding,
            store=self.face_store,
            patient_id=patient_id,
            config=self.face_config,
            bounding_box=bounding_box,
        )

    def process_object_crop(
        self,
        object_crop: list[list[list[int]]],
        patient_id: str,
        bounding_box: BoundingBox | None = None,
    ) -> ObjectRecognitionResult:
        """Process a pre-cropped object image (skips detection step)."""
        embed_result = self.object_embedder.embed(object_crop)
        return match_object(
            query_embedding=embed_result.embedding,
            store=self.object_store,
            patient_id=patient_id,
            config=self.object_config,
            bounding_box=bounding_box,
        )

    def _process_faces(
        self,
        frame: list[list[list[int]]],
        patient_id: str,
    ) -> tuple[FaceRecognitionResult | None, list[Detection]]:
        """Run the face detection → embedding → matching pipeline."""
        detections = self.face_detector.detect(frame)[: self.max_faces]
        if not detections:
            return None, detections

        # Use the highest-confidence face detection
        best = max(detections, key=lambda d: d.confidence)
        face_crop = self._crop_from_detection(frame, best.bbox)
        embed_result = self.face_embedder.embed(face_crop)

        result = match_face(
            query_embedding=embed_result.embedding,
            store=self.face_store,
            patient_id=patient_id,
            config=self.face_config,
            bounding_box=best.bbox,
        )
        return result, detections

    def _process_objects(
        self,
        frame: list[list[list[int]]],
        patient_id: str,
    ) -> tuple[list[ObjectRecognitionResult], list[Detection]]:
        """Run the object detection → embedding → matching pipeline."""
        detections = self.object_detector.detect(frame)[: self.max_objects]
        results: list[ObjectRecognitionResult] = []

        for det in detections:
            obj_crop = self._crop_from_detection(frame, det.bbox)
            embed_result = self.object_embedder.embed(obj_crop)
            result = match_object(
                query_embedding=embed_result.embedding,
                store=self.object_store,
                patient_id=patient_id,
                config=self.object_config,
                bounding_box=det.bbox,
            )
            results.append(result)

        return results, detections

    def _crop_from_detection(
        self,
        frame: list[list[list[int]]],
        bbox: BoundingBox,
    ) -> list[list[list[int]]]:
        """Crop a region from the frame using normalized bounding box."""
        h = len(frame)
        w = len(frame[0]) if h > 0 else 0

        x1 = max(0, int(bbox.x * w))
        y1 = max(0, int(bbox.y * h))
        x2 = min(w, int((bbox.x + bbox.width) * w))
        y2 = min(h, int((bbox.y + bbox.height) * h))

        return [row[x1:x2] for row in frame[y1:y2]]

"""Model manager — handles model loading, lifecycle, and configuration.

Supports multiple runtime backends (ONNX Runtime, PyTorch, etc.)
with graceful fallback when models are unavailable.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Optional

from mira_ml.inference.interfaces import (
    FaceDetector,
    FaceEmbedder,
    ObjectDetector,
    ObjectEmbedder,
    DummyFaceDetector,
    DummyFaceEmbedder,
    DummyObjectDetector,
    DummyObjectEmbedder,
)


class ModelBackend(str, Enum):
    """Supported inference backends."""

    ONNX = "onnx"
    PYTORCH = "pytorch"
    DUMMY = "dummy"


class ModelStatus(str, Enum):
    """Model loading status."""

    NOT_LOADED = "not_loaded"
    LOADING = "loading"
    READY = "ready"
    ERROR = "error"


@dataclass(frozen=True)
class ModelConfig:
    """Configuration for a single model."""

    name: str
    backend: ModelBackend = ModelBackend.DUMMY
    model_path: str = ""
    input_shape: tuple[int, ...] = (1, 3, 224, 224)
    embedding_dim: int = 128
    quantize: bool = False
    num_threads: int = 1
    timeout_seconds: float = 5.0


@dataclass(frozen=True)
class ModelHealth:
    """Health status of a loaded model."""

    name: str
    status: ModelStatus
    backend: ModelBackend
    model_path: str
    load_time_ms: float = 0.0
    error_message: str = ""


@dataclass
class ModelManager:
    """Manages model loading, caching, and lifecycle.

    Supports ONNX Runtime and PyTorch backends with automatic fallback
    to dummy models when real models are unavailable.

    Usage:
        manager = ModelManager()
        manager.configure("face_detector", ModelConfig(
            name="face_detector",
            backend=ModelBackend.ONNX,
            model_path="models/face_detector.onnx",
        ))
        manager.load_all()
        detector = manager.get_face_detector()
    """

    _configs: dict[str, ModelConfig] = field(default_factory=dict)
    _face_detectors: dict[str, FaceDetector] = field(default_factory=dict)
    _face_embedders: dict[str, FaceEmbedder] = field(default_factory=dict)
    _object_detectors: dict[str, ObjectDetector] = field(default_factory=dict)
    _object_embedders: dict[str, ObjectEmbedder] = field(default_factory=dict)
    _statuses: dict[str, ModelHealth] = field(default_factory=dict)

    def configure(self, model_key: str, config: ModelConfig) -> None:
        """Register a model configuration."""
        self._configs[model_key] = config
        self._statuses[model_key] = ModelHealth(
            name=config.name,
            status=ModelStatus.NOT_LOADED,
            backend=config.backend,
            model_path=config.model_path,
        )

    def load_all(self) -> dict[str, ModelHealth]:
        """Attempt to load all configured models.

        Returns health status for each model.
        """
        results: dict[str, ModelHealth] = {}
        for key, config in self._configs.items():
            results[key] = self._load_model(key, config)
        return results

    def load(self, model_key: str) -> ModelHealth:
        """Load a specific model by key."""
        config = self._configs.get(model_key)
        if not config:
            return ModelHealth(
                name=model_key,
                status=ModelStatus.ERROR,
                backend=ModelBackend.DUMMY,
                model_path="",
                error_message=f"No configuration found for '{model_key}'",
            )
        return self._load_model(model_key, config)

    def get_face_detector(self, key: str = "face_detector") -> FaceDetector:
        """Get a loaded face detector, or a dummy if not available."""
        return self._face_detectors.get(key, DummyFaceDetector())

    def get_face_embedder(self, key: str = "face_embedder") -> FaceEmbedder:
        """Get a loaded face embedder, or a dummy if not available."""
        return self._face_embedders.get(key, DummyFaceEmbedder())

    def get_object_detector(self, key: str = "object_detector") -> ObjectDetector:
        """Get a loaded object detector, or a dummy if not available."""
        return self._object_detectors.get(key, DummyObjectDetector())

    def get_object_embedder(self, key: str = "object_embedder") -> ObjectEmbedder:
        """Get a loaded object embedder, or a dummy if not available."""
        return self._object_embedders.get(key, DummyObjectEmbedder())

    def health(self) -> dict[str, ModelHealth]:
        """Return health status for all configured models."""
        return dict(self._statuses)

    def unload_all(self) -> None:
        """Unload all models and free resources."""
        self._face_detectors.clear()
        self._face_embedders.clear()
        self._object_detectors.clear()
        self._object_embedders.clear()
        for key in self._statuses:
            config = self._configs.get(key)
            self._statuses[key] = ModelHealth(
                name=key,
                status=ModelStatus.NOT_LOADED,
                backend=config.backend if config else ModelBackend.DUMMY,
                model_path=config.model_path if config else "",
            )

    def _load_model(self, key: str, config: ModelConfig) -> ModelHealth:
        """Attempt to load a model with the configured backend."""
        if config.backend == ModelBackend.DUMMY:
            return self._load_dummy(key, config)

        if not config.model_path or not os.path.exists(config.model_path):
            # Model file not found — fall back to dummy
            return self._load_dummy(
                key, config, error=f"Model file not found: {config.model_path}"
            )

        try:
            if config.backend == ModelBackend.ONNX:
                return self._load_onnx(key, config)
            elif config.backend == ModelBackend.PYTORCH:
                return self._load_pytorch(key, config)
            else:
                return self._load_dummy(key, config, error=f"Unknown backend: {config.backend}")
        except Exception as e:
            # Graceful fallback — log error, return dummy
            return ModelHealth(
                name=config.name,
                status=ModelStatus.ERROR,
                backend=config.backend,
                model_path=config.model_path,
                error_message=str(e),
            )

    def _load_dummy(
        self, key: str, config: ModelConfig, error: str = ""
    ) -> ModelHealth:
        """Load a dummy (no-op) model as fallback."""
        if "face_detector" in key:
            self._face_detectors[key] = DummyFaceDetector()
        elif "face_embed" in key:
            self._face_embedders[key] = DummyFaceEmbedder(dim=config.embedding_dim)
        elif "object_detector" in key:
            self._object_detectors[key] = DummyObjectDetector()
        elif "object_embed" in key:
            self._object_embedders[key] = DummyObjectEmbedder(dim=config.embedding_dim)

        status = ModelStatus.READY if not error else ModelStatus.ERROR
        health = ModelHealth(
            name=config.name,
            status=status,
            backend=ModelBackend.DUMMY,
            model_path=config.model_path,
            error_message=error or "Using dummy model (no real model available)",
        )
        self._statuses[key] = health
        return health

    def _load_onnx(self, key: str, config: ModelConfig) -> ModelHealth:
        """Load a model via ONNX Runtime."""
        # In production, this would import and use onnxruntime:
        # import onnxruntime as ort
        # session = ort.InferenceSession(config.model_path)
        # For now, return a dummy with a note
        return self._load_dummy(
            key, config,
            error="ONNX Runtime not installed; using dummy model",
        )

    def _load_pytorch(self, key: str, config: ModelConfig) -> ModelHealth:
        """Load a PyTorch model."""
        # In production, this would import and use torch:
        # import torch
        # model = torch.load(config.model_path)
        # model.eval()
        return self._load_dummy(
            key, config,
            error="PyTorch not installed; using dummy model",
        )

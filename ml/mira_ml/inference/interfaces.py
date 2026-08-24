"""Abstract model interfaces for the Memory Prosthetic inference pipeline.

Defines contracts that concrete model implementations must satisfy.
These interfaces enable swapping models without changing the pipeline.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional

from mira_ml.schemas.vision import BoundingBox


@dataclass(frozen=True)
class Detection:
    """A detected object/face in a frame."""

    bbox: BoundingBox
    confidence: float
    class_id: int = 0
    class_label: str = ""


@dataclass(frozen=True)
class EmbeddingResult:
    """Result of embedding generation."""

    embedding: list[float]
    dimension: int
    inference_time_ms: float


class FaceDetector(ABC):
    """Abstract face detector — locates faces in a frame."""

    @abstractmethod
    def detect(self, frame: list[list[list[int]]]) -> list[Detection]:
        """Detect faces in a frame.

        Args:
            frame: Image as H×W×3 list (RGB, values 0-255).

        Returns:
            List of Detection with bounding boxes.
        """
        ...

    @abstractmethod
    def is_loaded(self) -> bool:
        """Whether the model is loaded and ready for inference."""
        ...


class FaceEmbedder(ABC):
    """Abstract face embedder — generates face embeddings."""

    @abstractmethod
    def embed(self, face_crop: list[list[list[int]]]) -> EmbeddingResult:
        """Generate an embedding from a face crop.

        Args:
            face_crop: Cropped face image as H×W×3 list.

        Returns:
            EmbeddingResult with the embedding vector.
        """
        ...

    @abstractmethod
    def embedding_dim(self) -> int:
        """Expected embedding dimension."""
        ...

    @abstractmethod
    def is_loaded(self) -> bool:
        """Whether the model is loaded and ready."""
        ...


class ObjectDetector(ABC):
    """Abstract object detector — locates personal objects in a frame."""

    @abstractmethod
    def detect(
        self,
        frame: list[list[list[int]]],
        target_classes: list[str] | None = None,
    ) -> list[Detection]:
        """Detect objects in a frame.

        Args:
            frame: Image as H×W×3 list (RGB).
            target_classes: Optional filter to specific object class labels.

        Returns:
            List of Detection with bounding boxes and class labels.
        """
        ...

    @abstractmethod
    def is_loaded(self) -> bool:
        """Whether the model is loaded."""
        ...


class ObjectEmbedder(ABC):
    """Abstract object embedder — generates object embeddings for matching."""

    @abstractmethod
    def embed(self, object_crop: list[list[list[int]]]) -> EmbeddingResult:
        """Generate an embedding from an object crop.

        Args:
            object_crop: Cropped object image as H×W×3 list.

        Returns:
            EmbeddingResult with the embedding vector.
        """
        ...

    @abstractmethod
    def embedding_dim(self) -> int:
        """Expected embedding dimension."""
        ...

    @abstractmethod
    def is_loaded(self) -> bool:
        """Whether the model is loaded."""
        ...


class DummyFaceDetector(FaceDetector):
    """No-op face detector — returns empty results when no model is available."""

    def detect(self, frame: list[list[list[int]]]) -> list[Detection]:
        return []

    def is_loaded(self) -> bool:
        return False


class DummyObjectDetector(ObjectDetector):
    """No-op object detector — returns empty results when no model is available."""

    def detect(
        self,
        frame: list[list[list[int]]],
        target_classes: list[str] | None = None,
    ) -> list[Detection]:
        return []

    def is_loaded(self) -> bool:
        return False


class DummyFaceEmbedder(FaceEmbedder):
    """No-op face embedder — returns zero embedding when no model is available."""

    def __init__(self, dim: int = 128) -> None:
        self._dim = dim

    def embed(self, face_crop: list[list[list[int]]]) -> EmbeddingResult:
        return EmbeddingResult(
            embedding=[0.0] * self._dim,
            dimension=self._dim,
            inference_time_ms=0.0,
        )

    def embedding_dim(self) -> int:
        return self._dim

    def is_loaded(self) -> bool:
        return False


class DummyObjectEmbedder(ObjectEmbedder):
    """No-op object embedder — returns zero embedding when no model is available."""

    def __init__(self, dim: int = 64) -> None:
        self._dim = dim

    def embed(self, object_crop: list[list[list[int]]]) -> EmbeddingResult:
        return EmbeddingResult(
            embedding=[0.0] * self._dim,
            dimension=self._dim,
            inference_time_ms=0.0,
        )

    def embedding_dim(self) -> int:
        return self._dim

    def is_loaded(self) -> bool:
        return False

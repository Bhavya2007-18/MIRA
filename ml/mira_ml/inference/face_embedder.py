"""Real face embedding using ONNX Runtime.

Uses a lightweight face recognition model to generate 128-d embeddings.
If ONNX Runtime is unavailable, falls back to a histogram-based feature extractor.
"""

from __future__ import annotations

import time
import math
from pathlib import Path

import numpy as np

from mira_ml.inference.interfaces import FaceEmbedder, EmbeddingResult

try:
    import onnxruntime as ort
    ONNX_AVAILABLE = True
except ImportError:
    ONNX_AVAILABLE = False

try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False


class ONNXFaceEmbedder(FaceEmbedder):
    """Face embedder using ONNX Runtime with a lightweight model."""

    def __init__(self, model_path: str | None = None, dim: int = 128):
        self._dim = dim
        self._session = None
        self._loaded = False
        self._model_path = model_path

    def load(self) -> bool:
        """Load the ONNX face embedding model."""
        if not ONNX_AVAILABLE:
            print("[MIRA] ONNX Runtime not available, using fallback embedder")
            return False

        try:
            model_path = self._model_path or str(
                Path.home() / ".mira" / "models" / "face_embedding.onnx"
            )
            if Path(model_path).exists():
                self._session = ort.InferenceSession(model_path)
                self._loaded = True
                return True
            else:
                print(f"[MIRA] Face embedding model not found at {model_path}")
                return False
        except Exception as e:
            print(f"[MIRA] Face embedder load failed: {e}")
            return False

    def embed(self, face_crop: list[list[list[int]]]) -> EmbeddingResult:
        """Generate an embedding from a face crop."""
        start = time.monotonic()

        if self._loaded and self._session is not None:
            return self._embed_onnx(face_crop, start)
        else:
            return self._embed_fallback(face_crop, start)

    def _embed_onnx(self, face_crop: list[list[list[int]]], start: float) -> EmbeddingResult:
        """Embed using ONNX model."""
        img = np.array(face_crop, dtype=np.float32)
        if CV2_AVAILABLE:
            img = cv2.resize(img, (112, 112))
        else:
            # Simple resize using numpy
            h, w = img.shape[:2]
            img = np.array([[img[int(i * h / 112), int(j * w / 112)] for j in range(112)] for i in range(112)], dtype=np.float32)

        # Normalize
        img = (img - 127.5) / 128.0

        # CHW format
        if img.ndim == 3:
            img = np.transpose(img, (2, 0, 1))
        img = np.expand_dims(img, axis=0)

        input_name = self._session.get_inputs()[0].name
        embedding = self._session.run(None, {input_name: img})[0].flatten()

        # L2 normalize
        norm = np.linalg.norm(embedding)
        if norm > 0:
            embedding = embedding / norm

        elapsed = (time.monotonic() - start) * 1000
        return EmbeddingResult(
            embedding=embedding.tolist()[:self._dim],
            dimension=min(self._dim, len(embedding)),
            inference_time_ms=round(elapsed, 2),
        )

    def _embed_fallback(self, face_crop: list[list[list[int]]], start: float) -> EmbeddingResult:
        """Fallback: generate embedding from color histogram + spatial features."""
        img = np.array(face_crop, dtype=np.float32)

        features = []

        # Color histogram per channel (32 bins each = 96 features)
        for c in range(min(3, img.shape[2] if img.ndim == 3 else 1)):
            channel = img[:, :, c] if img.ndim == 3 else img
            hist, _ = np.histogram(channel, bins=32, range=(0, 256))
            hist = hist.astype(float) / max(hist.sum(), 1)
            features.extend(hist.tolist())

        # Spatial grid mean colors (4x4 = 16 regions × 3 channels = 48 features)
        h, w = img.shape[:2]
        for gi in range(4):
            for gj in range(4):
                y1, y2 = int(gi * h / 4), int((gi + 1) * h / 4)
                x1, x2 = int(gj * w / 4), int((gj + 1) * w / 4)
                patch = img[y1:y2, x1:x2]
                if img.ndim == 3:
                    features.extend(patch.mean(axis=(0, 1)).tolist()[:3])
                else:
                    features.append(float(patch.mean()))

        # Edge features (16 features)
        if CV2_AVAILABLE and img.ndim == 3:
            gray = cv2.cvtColor(img.astype(np.uint8), cv2.COLOR_RGB2GRAY)
            edges = cv2.Canny(gray, 50, 150)
            for gi in range(4):
                for gj in range(4):
                    y1, y2 = int(gi * h / 4), int((gi + 1) * h / 4)
                    x1, x2 = int(gj * w / 4), int((gj + 1) * w / 4)
                    features.append(float(edges[y1:y2, x1:x2].mean()) / 255.0)
        else:
            features.extend([0.0] * 16)

        # Pad or truncate to target dimension
        embedding = features[:self._dim]
        while len(embedding) < self._dim:
            embedding.append(0.0)

        # L2 normalize
        norm = math.sqrt(sum(x * x for x in embedding))
        if norm > 0:
            embedding = [x / norm for x in embedding]

        elapsed = (time.monotonic() - start) * 1000
        return EmbeddingResult(
            embedding=embedding,
            dimension=self._dim,
            inference_time_ms=round(elapsed, 2),
        )

    def embedding_dim(self) -> int:
        return self._dim

    def is_loaded(self) -> bool:
        return self._loaded

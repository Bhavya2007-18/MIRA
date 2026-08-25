"""Real face embedding using ArcFace ONNX model.

Uses a pre-trained ArcFace model to generate 512-d face embeddings.
Falls back to histogram-based features if ONNX model unavailable.
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

ARCFACE_URL = "https://huggingface.co/garavv/arcface-onnx/resolve/main/arc.onnx?download=true"
MODEL_DIR = Path.home() / ".mira" / "models"
FALLBACK_DIM = 128


class ArcFaceEmbedder(FaceEmbedder):
    """Face embedder using ArcFace ONNX model (512-dim)."""

    def __init__(self, model_path: str | None = None):
        self._dim = 512
        self._session = None
        self._loaded = False
        self._model_path = model_path
        self._input_name = None

    def load(self) -> bool:
        if not ONNX_AVAILABLE:
            print("[MIRA] ONNX Runtime not available, using fallback embedder")
            return False

        try:
            model_path = self._model_path or str(MODEL_DIR / "face_embedding.onnx")
            if not Path(model_path).exists():
                print(f"[MIRA] ArcFace model not found at {model_path}")
                return False

            self._session = ort.InferenceSession(
                model_path,
                providers=["CPUExecutionProvider"],
            )
            self._input_name = self._session.get_inputs()[0].name
            out_shape = self._session.get_outputs()[0].shape
            if isinstance(out_shape, list) and len(out_shape) == 2:
                self._dim = out_shape[1]
            self._loaded = True
            print(f"[MIRA] ArcFace embedder loaded ({self._dim}-dim)")
            return True
        except Exception as e:
            print(f"[MIRA] ArcFace load failed: {e}")
            self._loaded = False
            return False

    def embed(self, face_crop: list[list[list[int]]]) -> EmbeddingResult:
        start = time.monotonic()

        if self._loaded and self._session is not None:
            result = self._embed_arcface(face_crop, start)
        else:
            result = self._embed_fallback(face_crop, start)

        return result

    def _embed_arcface(self, face_crop: list[list[list[int]]], start: float) -> EmbeddingResult:
        img = np.array(face_crop, dtype=np.float32)
        if CV2_AVAILABLE:
            img = cv2.resize(img, (112, 112))
        else:
            h, w = img.shape[:2]
            img = np.array(
                [[img[int(i * h / 112), int(j * w / 112)] for j in range(112)] for i in range(112)],
                dtype=np.float32,
            )

        # ArcFace preprocessing: normalize to [-1, 1]
        img = (img - 127.5) / 128.0

        # Model expects NHWC: (1, 112, 112, 3)
        img = np.expand_dims(img, axis=0)

        embedding = self._session.run(None, {self._input_name: img})[0].flatten()

        # L2 normalize
        norm = np.linalg.norm(embedding)
        if norm > 0:
            embedding = embedding / norm

        elapsed = (time.monotonic() - start) * 1000
        return EmbeddingResult(
            embedding=embedding.tolist(),
            dimension=self._dim,
            inference_time_ms=round(elapsed, 2),
        )

    def _embed_fallback(self, face_crop: list[list[list[int]]], start: float) -> EmbeddingResult:
        img = np.array(face_crop, dtype=np.float32)
        features = []

        for c in range(min(3, img.shape[2] if img.ndim == 3 else 1)):
            channel = img[:, :, c] if img.ndim == 3 else img
            hist, _ = np.histogram(channel, bins=32, range=(0, 256))
            hist = hist.astype(float) / max(hist.sum(), 1)
            features.extend(hist.tolist())

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

        embedding = features[:FALLBACK_DIM]
        while len(embedding) < FALLBACK_DIM:
            embedding.append(0.0)

        norm = math.sqrt(sum(x * x for x in embedding))
        if norm > 0:
            embedding = [x / norm for x in embedding]

        elapsed = (time.monotonic() - start) * 1000
        return EmbeddingResult(
            embedding=embedding,
            dimension=FALLBACK_DIM,
            inference_time_ms=round(elapsed, 2),
        )

    def embedding_dim(self) -> int:
        return self._dim

    def is_loaded(self) -> bool:
        return self._loaded


# Backward compat alias
ONNXFaceEmbedder = ArcFaceEmbedder

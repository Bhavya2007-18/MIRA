"""Object embedding for personal object recognition.

Uses color histogram + spatial features for lightweight object matching.
No heavy model needed — works offline on CPU.
"""

from __future__ import annotations

import math
import time
from pathlib import Path

import numpy as np

from mira_ml.inference.interfaces import ObjectEmbedder, EmbeddingResult

try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False


class LightweightObjectEmbedder(ObjectEmbedder):
    """Object embedder using color + spatial features.

    Generates a 128-d embedding from color histograms, spatial grid means,
    and edge features. Works offline, no model download needed.
    """

    def __init__(self, dim: int = 128):
        self._dim = dim
        self._loaded = True  # Always available

    def embed(self, object_crop: list[list[list[int]]]) -> EmbeddingResult:
        """Generate embedding from object crop using visual features."""
        start = time.monotonic()

        img = np.array(object_crop, dtype=np.float32)
        h, w = img.shape[:2]

        features = []

        # 1. Color histogram per channel (32 bins × 3 = 96 features)
        for c in range(min(3, img.shape[2] if img.ndim == 3 else 1)):
            channel = img[:, :, c] if img.ndim == 3 else img
            hist, _ = np.histogram(channel, bins=32, range=(0, 256))
            hist = hist.astype(float) / max(hist.sum(), 1)
            features.extend(hist.tolist())

        # 2. Spatial grid mean colors (4×4 = 16 regions × 3 channels = 48 features)
        for gi in range(4):
            for gj in range(4):
                y1, y2 = int(gi * h / 4), int((gi + 1) * h / 4)
                x1, x2 = int(gj * w / 4), int((gj + 1) * w / 4)
                patch = img[y1:y2, x1:x2]
                if img.ndim == 3:
                    features.extend(patch.mean(axis=(0, 1)).tolist()[:3])
                else:
                    features.append(float(patch.mean()))

        # 3. Edge density per grid cell (16 features)
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

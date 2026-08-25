"""Face detection using OpenCV 5.0 FaceDetectorYN (YuNet).

YuNet is a lightweight face detector built into OpenCV 5.0.
Model auto-downloaded on first use.
"""

from __future__ import annotations

import time
import os
import urllib.request
from pathlib import Path

import cv2
import numpy as np

from mira_ml.inference.interfaces import FaceDetector, Detection
from mira_ml.schemas.vision import BoundingBox


YUNET_URL = "https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx"
MODEL_DIR = Path.home() / ".mira" / "models"


class YuNetFaceDetector(FaceDetector):
    """Face detector using OpenCV 5.0's built-in FaceDetectorYN (YuNet)."""

    def __init__(self):
        self._detector = None
        self._loaded = False

    def load(self) -> bool:
        MODEL_DIR.mkdir(parents=True, exist_ok=True)
        model_path = MODEL_DIR / "yunet.onnx"

        try:
            if not model_path.exists():
                print("[MIRA] Downloading YuNet face detector (~230KB)...")
                urllib.request.urlretrieve(YUNET_URL, str(model_path))
                print("[MIRA] YuNet downloaded")

            self._detector = cv2.FaceDetectorYN_create(str(model_path), "", (320, 320))
            self._loaded = True
            print("[MIRA] YuNet face detector loaded")
            return True
        except Exception as e:
            print(f"[MIRA] YuNet load failed: {e}")
            self._loaded = False
            return False

    def detect(self, frame: list[list[list[int]]]) -> list[Detection]:
        if not self._loaded or self._detector is None:
            return []

        img = np.array(frame, dtype=np.uint8)
        if len(img.shape) == 2:
            img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)

        h, w = img.shape[:2]
        self._detector.setInputSize((w, h))

        status, faces = self._detector.detect(img)

        detections = []
        if status and faces is not None:
            for face in faces:
                x, y, fw, fh = face[0], face[1], face[2], face[3]
                confidence = float(face[4])

                x1 = max(0, min(1.0, x / w))
                y1 = max(0, min(1.0, y / h))
                bw = max(0.0, min(1.0 - x1, fw / w))
                bh = max(0.0, min(1.0 - y1, fh / h))

                if bw > 0.01 and bh > 0.01:
                    detections.append(Detection(
                        bbox=BoundingBox(x=x1, y=y1, width=bw, height=bh),
                        confidence=confidence,
                        class_id=0,
                        class_label="face",
                    ))

        return detections

    def is_loaded(self) -> bool:
        return self._loaded


class OpenCVFaceDetector(FaceDetector):
    """Composite face detector using YuNet."""

    def __init__(self):
        self._yunet = YuNetFaceDetector()
        self._loaded = False

    def load(self) -> bool:
        self._loaded = self._yunet.load()
        return self._loaded

    def detect(self, frame: list[list[list[int]]]) -> list[Detection]:
        return self._yunet.detect(frame)

    def is_loaded(self) -> bool:
        return self._loaded

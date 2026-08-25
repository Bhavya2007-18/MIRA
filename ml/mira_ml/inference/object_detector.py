"""Object detection using contour analysis (zero-download).

Detects personal objects by shape analysis.
No external model downloads required — works fully offline.
"""

from __future__ import annotations

import cv2
import numpy as np

from mira_ml.inference.interfaces import ObjectDetector, Detection
from mira_ml.schemas.vision import BoundingBox


class ContourObjectDetector(ObjectDetector):
    """Object detector using edge detection and contour analysis."""

    def __init__(self):
        self._loaded = False

    def load(self) -> bool:
        self._loaded = True
        print("[MIRA] Contour object detector loaded (zero-download)")
        return True

    def detect(self, frame: list[list[list[int]]], target_classes: list[str] | None = None) -> list[Detection]:
        img = np.array(frame, dtype=np.uint8)
        if len(img.shape) == 2:
            img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)

        h, w = img.shape[:2]
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        edges = cv2.Canny(blurred, 50, 150)
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
        edges = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel)

        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        detections = []
        for contour in contours:
            area = cv2.contourArea(contour)
            if area < 800 or area > (w * h * 0.4):
                continue

            x, y, bw, bh = cv2.boundingRect(contour)
            aspect_ratio = bw / bh if bh > 0 else 0

            if aspect_ratio > 4 or aspect_ratio < 0.25:
                continue
            if bw < 20 or bh < 20:
                continue

            label = self._classify_by_shape(contour, bw, bh, area)
            confidence = min(0.92, 0.45 + (area / (w * h)) * 2)

            detections.append(Detection(
                bbox=BoundingBox(
                    x=float(x) / w,
                    y=float(y) / h,
                    width=float(bw) / w,
                    height=float(bh) / h,
                ),
                confidence=confidence,
                class_id=0,
                class_label=label,
            ))

        detections.sort(key=lambda d: d.confidence, reverse=True)
        return detections[:8]

    def _classify_by_shape(self, contour, bw, bh, area) -> str:
        aspect = bw / bh if bh > 0 else 1.0
        hull_area = cv2.contourArea(cv2.convexHull(contour))
        solidity = area / hull_area if hull_area > 0 else 0

        if 0.7 < aspect < 1.3 and solidity > 0.85:
            return "cup"
        elif aspect > 1.5 and solidity > 0.8:
            return "book"
        elif aspect < 0.7 and solidity > 0.7:
            return "bottle"
        elif solidity < 0.6:
            return "chair"
        else:
            return "object"

    def is_loaded(self) -> bool:
        return self._loaded


class OpenCVObjectDetector(ObjectDetector):
    """Composite object detector using contour analysis."""

    def __init__(self):
        self._contour = ContourObjectDetector()
        self._loaded = False

    def load(self) -> bool:
        self._loaded = self._contour.load()
        return self._loaded

    def detect(self, frame: list[list[list[int]]], target_classes: list[str] | None = None) -> list[Detection]:
        return self._contour.detect(frame, target_classes)

    def is_loaded(self) -> bool:
        return self._loaded

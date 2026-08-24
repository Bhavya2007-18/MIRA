"""Object recognition for daily living memory assistance.

Detects high-priority personal items for dementia patients (glasses, keys,
medicine box, wallet, phone, walking stick, water bottle).
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Optional


@dataclass(frozen=True)
class BoundingBox:
    """Normalized bounding box coordinates [0.0, 1.0]."""
    x_min: float
    y_min: float
    x_max: float
    y_max: float


@dataclass(frozen=True)
class DetectedObject:
    """A detected assistance object in the camera frame."""
    object_id: str
    label_en: str
    label_as: str
    confidence: float
    bbox: BoundingBox
    voice_guidance_en: str
    voice_guidance_as: str


# Supported high-priority personal daily living items
ASSISTANCE_OBJECT_CATALOG = {
    "glasses": {
        "label_en": "Reading Glasses",
        "label_as": "পঢ়াৰ চশমা",
        "tip_en": "Your reading glasses are located right in front of you.",
        "tip_as": "আপোনাৰ চশমাযোৰ চকুৰ সন্মুখতে আছে।",
    },
    "medicine_box": {
        "label_en": "Prescription Medicine Box",
        "label_as": "ঔষধৰ বাকচ",
        "tip_en": "Here is your medicine box. Remember to take morning doses on time.",
        "tip_as": "এয়া আপোনাৰ ঔষধৰ বাকচ। সময়মতে পুৱাৰ ঔষধ খাবলৈ নাপাহৰিব।",
    },
    "keys": {
        "label_en": "House Keys",
        "label_as": "ঘৰৰ চাবি",
        "tip_en": "Your keys are safely here on the table.",
        "tip_as": "আপোনাৰ চাবি মেজৰ ওপৰতে সুৰক্ষিতভাৱে আছে।",
    },
    "walking_stick": {
        "label_en": "Walking Stick",
        "label_as": "লাঠি",
        "tip_en": "Your walking stick is right beside your chair.",
        "tip_as": "আপোনাৰ লাঠিডাল চকৰি কাষতে আছে।",
    },
    "water_bottle": {
        "label_en": "Water Bottle",
        "label_as": "পানীৰ বটল",
        "tip_en": "Stay hydrated! Here is your drinking water.",
        "tip_as": "পানী খাবলৈ পাহৰি নাযাব! এইটো আপোনাৰ পানীৰ বটল।",
    },
    "phone": {
        "label_en": "Mobile Phone",
        "label_as": "মোবাইল ফোন",
        "tip_en": "Your mobile phone is on the bedside desk.",
        "tip_as": "আপোনাৰ ফোনটো কাষৰ মেজতে আছে।",
    },
}


class ObjectRecognitionEngine:
    """Lightweight object assistant detector for elderly dementia patients."""

    def __init__(self, min_confidence: float = 0.60) -> None:
        self.min_confidence = min_confidence

    def format_detection(
        self,
        object_key: str,
        confidence: float,
        bbox: BoundingBox,
    ) -> Optional[DetectedObject]:
        """Create a localized DetectedObject if confidence meets threshold."""
        if confidence < self.min_confidence or object_key not in ASSISTANCE_OBJECT_CATALOG:
            return None

        info = ASSISTANCE_OBJECT_CATALOG[object_key]
        return DetectedObject(
            object_id=object_key,
            label_en=info["label_en"],
            label_as=info["label_as"],
            confidence=round(confidence, 4),
            bbox=bbox,
            voice_guidance_en=info["tip_en"],
            voice_guidance_as=info["tip_as"],
        )

    def detect_objects(
        self,
        raw_detections: list[tuple[str, float, tuple[float, float, float, float]]],
    ) -> list[DetectedObject]:
        """Process raw inference detections into patient guidance objects.

        Args:
            raw_detections: List of tuples (class_name, confidence, (ymin, xmin, ymax, xmax))
        """
        results: list[DetectedObject] = []
        for class_name, score, box in raw_detections:
            norm_box = BoundingBox(
                y_min=box[0],
                x_min=box[1],
                y_max=box[2],
                x_max=box[3],
            )
            obj = self.format_detection(class_name.lower(), score, norm_box)
            if obj is not None:
                results.append(obj)
        return results

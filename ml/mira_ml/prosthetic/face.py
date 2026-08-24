"""Face recognition and memory prosthetic identity matching.

Provides lightweight face embedding matching (MobileFaceNet compatible),
zero-touch voice prompt generation, and safe confidence thresholding
for offline elderly dementia memory assistance.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Optional


@dataclass
class EnrolledFace:
    """An enrolled person in the patient's familiar circle."""
    person_id: str
    name: str
    relation: str
    core_memory: str
    location: Optional[str] = None
    photo_uri: Optional[str] = None
    embedding: list[float] = field(default_factory=list)
    enrolled_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    verified_matches_count: int = 0


@dataclass(frozen=True)
class FaceMatchResult:
    """Result of facial recognition inference."""
    matched: bool
    person: Optional[EnrolledFace]
    confidence: float              # 0.0 to 1.0
    cosine_similarity: float       # -1.0 to 1.0
    speech_prompt_en: str
    speech_prompt_as: str
    is_unknown: bool
    threshold_used: float


def cosine_similarity(vec_a: list[float], vec_b: list[float]) -> float:
    """Calculate cosine similarity between two normalized feature vectors."""
    if not vec_a or not vec_b or len(vec_a) != len(vec_b):
        return 0.0

    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))

    if norm_a == 0 or norm_b == 0:
        return 0.0

    return max(-1.0, min(1.0, dot / (norm_a * norm_b)))


class FaceRecognitionEngine:
    """Lightweight face identification engine for the MIRA Memory Prosthetic.

    Usage:
        engine = FaceRecognitionEngine(match_threshold=0.72)
        engine.enroll_person(EnrolledFace(...))
        result = engine.recognize_face(query_embedding)
    """

    def __init__(self, match_threshold: float = 0.72) -> None:
        self.match_threshold = match_threshold
        self._enrolled: dict[str, EnrolledFace] = {}

    def enroll_person(self, person: EnrolledFace) -> None:
        """Add or update an enrolled person."""
        self._enrolled[person.person_id] = person

    def remove_person(self, person_id: str) -> bool:
        """Remove an enrolled person."""
        if person_id in self._enrolled:
            del self._enrolled[person_id]
            return True
        return False

    def list_enrolled(self) -> list[EnrolledFace]:
        """Return all enrolled familiar persons."""
        return list(self._enrolled.values())

    def recognize_face(self, query_embedding: list[float]) -> FaceMatchResult:
        """Match query face embedding against enrolled gallery.

        Args:
            query_embedding: Extracted face feature vector.

        Returns:
            FaceMatchResult with identity, calibrated confidence, and bilingual prompts.
        """
        if not self._enrolled or not query_embedding:
            return FaceMatchResult(
                matched=False,
                person=None,
                confidence=0.0,
                cosine_similarity=0.0,
                speech_prompt_en="Scanning... No familiar person recognized in database.",
                speech_prompt_as="চকুৰ সন্মুখত পৰিচিত ব্যক্তি দেখা পোৱা নাই।",
                is_unknown=True,
                threshold_used=self.match_threshold,
            )

        best_person: Optional[EnrolledFace] = None
        best_sim = -1.0

        for person in self._enrolled.values():
            if not person.embedding:
                continue
            sim = cosine_similarity(query_embedding, person.embedding)
            if sim > best_sim:
                best_sim = sim
                best_person = person

        # Calibrate confidence from cosine similarity
        # Cosine similarity range [0.5, 1.0] maps smoothly to [0.0, 1.0] confidence
        if best_sim >= self.match_threshold and best_person is not None:
            confidence = min(0.99, max(0.50, (best_sim - 0.5) / 0.5))
            best_person.verified_matches_count += 1

            prompt_en = (
                f"This is {best_person.name}, your {best_person.relation}. "
                f"Core memory: {best_person.core_memory}"
            )
            prompt_as = (
                f"এখেত হ’ল {best_person.name}, আপোনাৰ {best_person.relation}। "
                f"মূল স্মৃতি: {best_person.core_memory}"
            )

            return FaceMatchResult(
                matched=True,
                person=best_person,
                confidence=round(confidence, 4),
                cosine_similarity=round(best_sim, 4),
                speech_prompt_en=prompt_en,
                speech_prompt_as=prompt_as,
                is_unknown=False,
                threshold_used=self.match_threshold,
            )

        # Unknown or low confidence
        low_conf = max(0.0, round((best_sim if best_sim > 0 else 0.0) * 0.5, 4))
        return FaceMatchResult(
            matched=False,
            person=None,
            confidence=low_conf,
            cosine_similarity=round(best_sim, 4) if best_sim > -1 else 0.0,
            speech_prompt_en="Unrecognized person. Please ask a caregiver for assistance.",
            speech_prompt_as="অপৰিচিত ব্যক্তি। অনুগ্ৰহ কৰি সহায়কৰ সহায় লওক।",
            is_unknown=True,
            threshold_used=self.match_threshold,
        )

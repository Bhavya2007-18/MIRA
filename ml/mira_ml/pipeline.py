"""MIRA Closed-Loop Intelligence Pipeline.

Orchestrates the entire intelligence loop:
Game Events → Feature Extraction → Scoring → Profiling → Adaptive Difficulty → Personalization → Next Recommendation → Caregiver Analytics.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Optional

from mira_ml.schemas.events import GameEvent, GameEventBatch
from mira_ml.schemas.cognitive import CognitiveScore, CognitiveProfile
from mira_ml.schemas.recommendations import Recommendation, DifficultyRecommendation
from mira_ml.scoring.scoring_engine import ScoringEngine
from mira_ml.profiling.engine import ProfilingEngine
from mira_ml.personalization.engine import PersonalizationEngine
from mira_ml.adaptive.engine import AdaptiveDifficultyEngine
from mira_ml.recommendations.engine import RecommendationEngine
from mira_ml.analytics.engine import AnalyticsEngine, CaregiverReport
from mira_ml.prosthetic.face import FaceRecognitionEngine, EnrolledFace, FaceMatchResult
from mira_ml.prosthetic.objects import ObjectRecognitionEngine, DetectedObject


@dataclass
class SessionProcessingResult:
    """Result of processing a batch of game events."""
    patient_id: str
    scores: list[CognitiveScore]
    updated_profile: Optional[CognitiveProfile]
    difficulty_recommendation: DifficultyRecommendation
    next_recommendation: Recommendation
    caregiver_report: CaregiverReport


class MIRAIntelligencePipeline:
    """End-to-end intelligence engine for MIRA.

    Usage:
        pipeline = MIRAIntelligencePipeline()
        result = pipeline.process_game_session(patient_id="p-001", events=events)
        print(f"Next recommendation: {result.next_recommendation.target_game_id}")
    """

    def __init__(self) -> None:
        self.scoring = ScoringEngine()
        self.adaptive = AdaptiveDifficultyEngine()
        self.personalization = PersonalizationEngine()
        self.recommendations = RecommendationEngine(
            personalization_engine=self.personalization,
            adaptive_engine=self.adaptive,
        )
        self.analytics = AnalyticsEngine()
        self.face_prosthetic = FaceRecognitionEngine()
        self.object_prosthetic = ObjectRecognitionEngine()

        # Per-patient state storage
        self._profiles: dict[str, ProfilingEngine] = {}
        self._event_history: dict[str, list[GameEvent]] = {}
        self._recent_games: dict[str, list[str]] = {}
        self._recent_domains: dict[str, list[str]] = {}

    def get_or_create_profiling_engine(self, patient_id: str) -> ProfilingEngine:
        """Retrieve or initialize ProfilingEngine for a patient."""
        if patient_id not in self._profiles:
            self._profiles[patient_id] = ProfilingEngine(patient_id=patient_id)
        return self._profiles[patient_id]

    def get_profile(self, patient_id: str) -> Optional[CognitiveProfile]:
        """Get latest built profile for a patient."""
        if patient_id in self._profiles:
            return self._profiles[patient_id].build()
        return None

    def get_events(self, patient_id: str) -> list[GameEvent]:
        """Get full event history for a patient."""
        return self._event_history.get(patient_id, [])

    def process_game_session(
        self,
        patient_id: str,
        events: list[GameEvent],
    ) -> SessionProcessingResult:
        """Execute the full intelligence loop on incoming game events.

        1. Ingest events & append to history
        2. Compute domain scores
        3. Update temporal profile
        4. Adjust adaptive difficulty
        5. Generate next personalized recommendation
        6. Produce updated caregiver insights report
        """
        if not events:
            raise ValueError("Event list cannot be empty.")

        # 1. Ingest & record history
        self._event_history.setdefault(patient_id, []).extend(events)
        all_events = self._event_history[patient_id]

        primary_game_id = events[0].game_id
        primary_domain = events[0].task_type.value
        current_diff = events[0].difficulty

        self._recent_games.setdefault(patient_id, []).append(primary_game_id)
        self._recent_domains.setdefault(patient_id, []).append(primary_domain)

        # 2. Score events
        scores = self.scoring.score(events)

        # 3. Update profile
        profiler = self.get_or_create_profiling_engine(patient_id)
        if scores:
            profiler.update(scores)
        profile = profiler.build()

        # 4. Compute Adaptive Difficulty
        diff_rec = self.adaptive.evaluate_session(
            patient_id=patient_id,
            game_id=primary_game_id,
            target_domain=primary_domain,
            current_difficulty=current_diff,
            events=events,
        )

        # 5. Generate Next Recommendation
        # Create a fallback profile if brand new
        if profile is None:
            profile = CognitiveProfile(
                patient_id=patient_id,
                domain_scores=scores if scores else [
                    CognitiveScore(domain=primary_domain, score=0.5, confidence=0.2, sample_size=len(events))
                ],
                overall_score=0.5,
                overall_confidence=0.2,
                strengths=[],
                weaknesses=[],
                total_events=len(events),
            )

        next_rec = self.recommendations.recommend(
            profile=profile,
            recent_game_ids=self._recent_games.get(patient_id, []),
            recent_domains=self._recent_domains.get(patient_id, []),
        )

        # 6. Generate Caregiver Analytics Report
        caregiver_report = self.analytics.generate_report(profile, all_events)

        return SessionProcessingResult(
            patient_id=patient_id,
            scores=scores,
            updated_profile=profile,
            difficulty_recommendation=diff_rec,
            next_recommendation=next_rec,
            caregiver_report=caregiver_report,
        )

    def get_caregiver_report(self, patient_id: str) -> CaregiverReport:
        """Get latest analytics and caregiver insights for a patient."""
        profile = self.get_profile(patient_id)
        events = self.get_events(patient_id)
        return self.analytics.generate_report(profile, events)

"""MIRA ML API service layer — wires all ML engines together."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Optional

from mira_ml.schemas.events import GameEvent
from mira_ml.schemas.cognitive import CognitiveProfile, CognitiveScore
from mira_ml.schemas.recommendations import Recommendation, RecommendationType
from mira_ml.scoring.features import FeatureExtractor
from mira_ml.scoring.engine import DomainScorer
from mira_ml.personalization.engine import PersonalizationEngine
from mira_ml.adaptive.engine import AdaptiveDifficultyEngine
from mira_ml.adaptive.rules import AdaptiveConfig
from mira_ml.recommendation.engine import RecommendationEngine, RecommendationConfig
from mira_ml.analytics.engine import AnalyticsEngine
from mira_ml.analytics.insights import CaregiverReport
from mira_ml.api.store import store


class MiraAIService:
    """Unified service wrapping all ML engines."""

    def __init__(self):
        self.feature_extractor = FeatureExtractor()
        self.domain_scorer = DomainScorer()
        self.personalization = PersonalizationEngine()
        self.adaptive = AdaptiveDifficultyEngine()
        self.recommendation = RecommendationEngine()
        self.analytics = AnalyticsEngine()

    def ingest_events(self, events: list[GameEvent]) -> dict:
        """Process a batch of game events: score, update profile, return results."""
        if not events:
            return {"status": "no_events", "processed": 0}

        patient_id = events[0].patient_id
        store.add_events(patient_id, events)

        # Extract features per domain
        features = self.feature_extractor.extract(events)

        # Score each domain
        scores = []
        for domain, feat in features.items():
            score = self.domain_scorer.score(feat)
            scores.append(score)

        # Update profiling engine
        state = store.get_or_create(patient_id)
        state.profiling_engine.update(scores)
        profile = state.profiling_engine.build()
        if profile:
            store.set_profile(patient_id, profile)

        return {
            "status": "ok",
            "processed": len(events),
            "patient_id": patient_id,
            "scores": [{"domain": s.domain, "score": round(s.score, 4), "confidence": round(s.confidence, 4)} for s in scores],
            "profile_version": profile.profile_version if profile else 0,
        }

    def get_profile(self, patient_id: str) -> Optional[CognitiveProfile]:
        """Get the latest cognitive profile for a patient."""
        profile = store.get_profile(patient_id)
        if profile:
            return profile

        # If no data yet, return a baseline profile
        return CognitiveProfile(
            patient_id=patient_id,
            domain_scores=[
                CognitiveScore(domain="memory", score=0.5, confidence=0.1, sample_size=0),
                CognitiveScore(domain="recall", score=0.5, confidence=0.1, sample_size=0),
                CognitiveScore(domain="reasoning", score=0.5, confidence=0.1, sample_size=0),
                CognitiveScore(domain="attention", score=0.5, confidence=0.1, sample_size=0),
                CognitiveScore(domain="orientation", score=0.5, confidence=0.1, sample_size=0),
            ],
            overall_score=0.5,
            overall_confidence=0.1,
            strengths=[],
            weaknesses=[],
            total_events=0,
            profile_version=1,
            timestamp=datetime.now(UTC),
        )

    def get_analytics(self, patient_id: str) -> CaregiverReport:
        """Generate caregiver report from events and profile."""
        events = store.get_events(patient_id)
        profile = store.get_profile(patient_id)
        report = self.analytics.generate_report(profile, events)
        # Override patient_id (analytics engine uses "unknown" when profile is None)
        report.patient_id = patient_id
        return report

    def get_recommendation(self, patient_id: str, game_id: Optional[str] = None) -> Recommendation:
        """Get the next personalized game recommendation."""
        profile = store.get_profile(patient_id)
        events = store.get_events(patient_id)
        recent_targets = store.get_recent_targets(patient_id)

        if not profile:
            return Recommendation(
                patient_id=patient_id,
                recommendation_type=RecommendationType.GAME,
                target_game_id="CARD_MATCH",
                target_domain="memory",
                difficulty=5,
                reason="Starting with baseline recommendation. No cognitive data yet.",
                confidence=0.5,
                timestamp=datetime.now(UTC),
            )

        recommendation = self.recommendation.recommend(
            profile=profile,
            recent_events=events if events else None,
            current_difficulty=5,
            recent_targets=recent_targets,
            patient_id=patient_id,
            game_id=game_id,
        )

        # Track the recommended domain as a recent target
        store.add_recent_target(patient_id, recommendation.target_domain)

        return recommendation

    def get_difficulty(self, patient_id: str, game_id: str, events: list[GameEvent]) -> dict:
        """Evaluate difficulty adjustment for a game session."""
        patient_state = store.get_or_create(patient_id)
        current_diff = patient_state.difficulty_states.get(game_id)
        current_difficulty = current_diff.current_difficulty if current_diff else 5

        diff_rec = self.adaptive.compute(
            events=events,
            current_difficulty=current_difficulty,
            game_id=game_id,
            target_domain=events[0].task_type.value if events else "memory",
            patient_id=patient_id,
        )

        # Update stored difficulty
        new_state = DifficultyState(
            current_difficulty=diff_rec.suggested_difficulty,
            last_updated=datetime.now(UTC),
        )
        patient_state.difficulty_states[game_id] = new_state

        return {
            "current_difficulty": diff_rec.current_difficulty,
            "suggested_difficulty": diff_rec.suggested_difficulty,
            "adjustment": diff_rec.adjustment,
            "reason": diff_rec.reason,
            "confidence": round(diff_rec.confidence, 4),
        }


# Lazy singleton
_service: Optional[MiraAIService] = None


def get_service() -> MiraAIService:
    global _service
    if _service is None:
        _service = MiraAIService()
    return _service

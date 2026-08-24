"""Tests for the recommendation engine (Phase 6 bridge)."""

from __future__ import annotations

import pytest

from mira_ml.schemas.cognitive import CognitiveProfile, CognitiveScore
from mira_ml.schemas.events import GameEvent, TaskType
from mira_ml.schemas.recommendations import Recommendation, RecommendationType
from mira_ml.recommendation.engine import (
    RecommendationEngine,
    RecommendationConfig,
    DEFAULT_GAME_CATALOG,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_profile(
    patient_id: str = "p-001",
    domain_scores: list[CognitiveScore] | None = None,
    overall_score: float = 0.5,
    overall_confidence: float = 0.6,
    total_events: int = 20,
) -> CognitiveProfile:
    if domain_scores is None:
        domain_scores = [
            CognitiveScore(domain="memory", score=0.4, confidence=0.6, sample_size=10),
            CognitiveScore(domain="attention", score=0.7, confidence=0.5, sample_size=8),
            CognitiveScore(domain="recall", score=0.5, confidence=0.4, sample_size=6),
            CognitiveScore(domain="orientation", score=0.6, confidence=0.5, sample_size=7),
            CognitiveScore(domain="reasoning", score=0.55, confidence=0.5, sample_size=9),
        ]
    return CognitiveProfile(
        patient_id=patient_id,
        domain_scores=domain_scores,
        overall_score=overall_score,
        overall_confidence=overall_confidence,
        total_events=total_events,
    )


def _make_events(
    patient_id: str = "p-001",
    n: int = 5,
    task_type: TaskType = TaskType.MEMORY,
    difficulty: int = 5,
) -> list[GameEvent]:
    return [
        GameEvent(
            patient_id=patient_id,
            session_id=f"s-{i}",
            game_id="memory-cards-v1",
            task_type=task_type,
            difficulty=difficulty,
            correct=i % 2 == 0,
            response_time_ms=2000.0 + i * 100,
        )
        for i in range(n)
    ]


# ---------------------------------------------------------------------------
# RecommendationEngine tests
# ---------------------------------------------------------------------------

class TestRecommendationEngine:
    def setup_method(self):
        self.engine = RecommendationEngine()
        self.profile = _make_profile()

    def test_basic_recommendation(self):
        rec = self.engine.recommend(
            profile=self.profile,
            patient_id="p-001",
        )
        assert isinstance(rec, Recommendation)
        assert rec.patient_id == "p-001"
        assert rec.recommendation_type == RecommendationType.GAME
        assert rec.target_game_id is not None
        assert rec.target_domain in ["memory", "attention", "recall", "orientation", "reasoning"]
        assert 1 <= rec.difficulty <= 10
        assert rec.confidence > 0.0
        assert len(rec.reason) > 0

    def test_with_recent_events(self):
        events = _make_events(n=5, task_type=TaskType.MEMORY)
        # Override session IDs to be same session (avoid rest trigger)
        events = [
            GameEvent(
                patient_id="p-001", session_id="s-1", game_id="memory-cards-v1",
                task_type=TaskType.MEMORY, difficulty=5,
                correct=i % 2 == 0, response_time_ms=2000.0 + i * 100,
            )
            for i in range(5)
        ]
        rec = self.engine.recommend(
            profile=self.profile,
            recent_events=events,
            current_difficulty=5,
            patient_id="p-001",
        )
        assert rec.recommendation_type == RecommendationType.GAME
        assert 1 <= rec.difficulty <= 10

    def test_specific_game_id(self):
        rec = self.engine.recommend(
            profile=self.profile,
            patient_id="p-001",
            game_id="memory-sequence-v1",
        )
        assert rec.target_game_id == "memory-sequence-v1"

    def test_difficulty_adapts_with_events(self):
        # Perfect events → should increase difficulty
        perfect_events = [
            GameEvent(
                patient_id="p-001", session_id="s-1", game_id="g-1",
                task_type=TaskType.MEMORY, difficulty=5,
                correct=True, response_time_ms=1500.0,
            )
            for _ in range(5)
        ]
        rec = self.engine.recommend(
            profile=self.profile,
            recent_events=perfect_events,
            current_difficulty=5,
            patient_id="p-001",
        )
        assert rec.difficulty >= 5

    def test_difficulty_decreases_with_poor_events(self):
        poor_events = [
            GameEvent(
                patient_id="p-001", session_id="s-1", game_id="g-1",
                task_type=TaskType.MEMORY, difficulty=8,
                correct=False, response_time_ms=5000.0, attempts=3,
            )
            for _ in range(5)
        ]
        rec = self.engine.recommend(
            profile=self.profile,
            recent_events=poor_events,
            current_difficulty=8,
            patient_id="p-001",
        )
        assert rec.difficulty <= 8

    def test_rest_on_low_confidence(self):
        low_conf_profile = _make_profile(overall_confidence=0.1)
        events = [
            GameEvent(
                patient_id="p-001", session_id="s-1", game_id="g-1",
                task_type=TaskType.MEMORY, difficulty=5,
                correct=True, response_time_ms=2000.0,
            )
            for _ in range(3)
        ]
        rec = self.engine.recommend(
            profile=low_conf_profile,
            recent_events=events,
            patient_id="p-001",
        )
        assert rec.recommendation_type == RecommendationType.REST

    def test_cold_start_produces_recommendation(self):
        low_data_profile = _make_profile(
            domain_scores=[
                CognitiveScore(domain="memory", score=0.0, confidence=0.0, sample_size=0),
            ],
            overall_score=0.0,
            overall_confidence=0.1,
            total_events=0,
        )
        rec = self.engine.recommend(
            profile=low_data_profile,
            patient_id="p-001",
        )
        assert rec.recommendation_type in (RecommendationType.GAME, RecommendationType.ASSESSMENT)
        assert rec.target_domain == "memory"  # cold start default

    def test_fallback_game_catalog(self):
        engine = RecommendationEngine(game_catalog={})
        rec = engine.recommend(
            profile=self.profile,
            patient_id="p-001",
        )
        assert rec.target_game_id.endswith("-generic-v1")

    def test_patient_id_from_profile(self):
        rec = self.engine.recommend(profile=self.profile)
        assert rec.patient_id == "p-001"

    def test_patient_id_override(self):
        rec = self.engine.recommend(
            profile=self.profile,
            patient_id="override-id",
        )
        assert rec.patient_id == "override-id"

    def test_deterministic(self):
        events = _make_events(n=3)
        r1 = self.engine.recommend(
            profile=self.profile,
            recent_events=events,
            patient_id="p-001",
        )
        r2 = self.engine.recommend(
            profile=self.profile,
            recent_events=events,
            patient_id="p-001",
        )
        assert r1.target_domain == r2.target_domain
        assert r1.difficulty == r2.difficulty
        assert r1.confidence == r2.confidence

    def test_all_domains_accessible(self):
        # Each domain should be reachable
        for domain in DEFAULT_GAME_CATALOG:
            profile = _make_profile(
                domain_scores=[
                    CognitiveScore(domain=domain, score=0.3, confidence=0.8, sample_size=10),
                ],
                overall_score=0.3,
                overall_confidence=0.8,
            )
            rec = self.engine.recommend(profile=profile, patient_id="p-001")
            assert rec.target_domain == domain

    def test_recommendation_is_frozen(self):
        rec = self.engine.recommend(
            profile=self.profile,
            patient_id="p-001",
        )
        with pytest.raises(Exception):
            rec.difficulty = 99

    def test_no_events_maintains_difficulty(self):
        rec = self.engine.recommend(
            profile=self.profile,
            current_difficulty=7,
            patient_id="p-001",
        )
        assert rec.difficulty == 7

    def test_game_catalog_structure(self):
        for domain, games in DEFAULT_GAME_CATALOG.items():
            assert len(games) > 0
            for game_id, game_name in games:
                assert isinstance(game_id, str)
                assert isinstance(game_name, str)


class TestRecommendationConfig:
    def test_defaults(self):
        cfg = RecommendationConfig()
        assert cfg.rest_confidence_threshold == 0.2
        assert cfg.max_sessions_before_rest == 3
        assert cfg.default_difficulty == 5

    def test_custom(self):
        cfg = RecommendationConfig(rest_confidence_threshold=0.3, max_sessions_before_rest=5)
        assert cfg.rest_confidence_threshold == 0.3
        assert cfg.max_sessions_before_rest == 5

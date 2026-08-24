"""Tests for RecommendationEngine and game catalog."""

from __future__ import annotations

import pytest

from mira_ml.schemas.cognitive import CognitiveProfile, CognitiveScore
from mira_ml.schemas.recommendations import Recommendation, RecommendationType
from mira_ml.recommendations.catalog import MIRA_GAMES, get_game_for_domain
from mira_ml.recommendations.engine import RecommendationEngine


def _score(domain: str, score: float, confidence: float = 0.8, sample_size: int = 20) -> CognitiveScore:
    return CognitiveScore(domain=domain, score=score, confidence=confidence, sample_size=sample_size)


def _profile(scores: list[CognitiveScore], total_events: int = 50) -> CognitiveProfile:
    return CognitiveProfile(
        patient_id="p-ner-01",
        domain_scores=scores,
        overall_score=sum(s.score for s in scores) / len(scores),
        overall_confidence=0.8,
        strengths=[],
        weaknesses=[],
        total_events=total_events,
    )


class TestRecommendationEngine:
    def setup_method(self):
        self.engine = RecommendationEngine()

    def test_catalog_game_lookup(self):
        mem_game = get_game_for_domain("memory")
        assert mem_game.game_id == "CARD_MATCH"
        assert "Jaapi" in mem_game.cultural_theme

        recall_game = get_game_for_domain("recall")
        assert recall_game.game_id == "AUDITORY_RECALL"

        reasoning_game = get_game_for_domain("reasoning")
        assert reasoning_game.game_id == "MATHS_COMPARE"

    def test_recommendation_targets_weakest_domain(self):
        # Memory is weak (0.3), others are high (0.8)
        profile = _profile([
            _score("memory", 0.3),
            _score("attention", 0.8),
            _score("recall", 0.8),
            _score("orientation", 0.8),
            _score("reasoning", 0.8),
        ])
        rec = self.engine.recommend(profile)
        assert rec.target_domain == "memory"
        assert rec.target_game_id == "CARD_MATCH"
        assert rec.recommendation_type == RecommendationType.GAME
        assert "Personalized intervention" in rec.reason

    def test_recommendation_cold_start(self):
        # Very few events
        profile = _profile([_score("memory", 0.5, 0.1, 1)], total_events=1)
        rec = self.engine.recommend(profile)
        assert rec.recommendation_type == RecommendationType.ASSESSMENT
        assert "Introductory session" in rec.reason

    def test_recommendation_avoids_recently_played_if_others_need(self):
        profile = _profile([
            _score("memory", 0.4),
            _score("recall", 0.4),
            _score("reasoning", 0.8),
        ])
        # Memory and recall have equal need, but memory was just played
        rec = self.engine.recommend(profile, recent_domains=["memory", "memory"])
        assert rec.target_domain == "recall"
        assert rec.target_game_id == "AUDITORY_RECALL"

    def test_override_difficulty(self):
        profile = _profile([_score("memory", 0.7)])
        rec = self.engine.recommend(profile, override_difficulty=7)
        assert rec.difficulty == 7

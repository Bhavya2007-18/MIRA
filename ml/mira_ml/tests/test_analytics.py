"""Tests for AnalyticsEngine, trends, and caregiver insights."""

from __future__ import annotations

import pytest
from datetime import datetime, timezone

from mira_ml.schemas.events import GameEvent, TaskType
from mira_ml.schemas.cognitive import CognitiveProfile, CognitiveScore
from mira_ml.analytics.engine import AnalyticsEngine
from mira_ml.analytics.trends import compute_reaction_trend, compute_accuracy_trend, compute_stability_score
from mira_ml.analytics.insights import AlertSeverity


def _event(
    response_time_ms: float = 1400.0,
    correct: bool = True,
    game_id: str = "CARD_MATCH",
    skipped: bool = False,
) -> GameEvent:
    return GameEvent(
        patient_id="p-001",
        session_id="s-001",
        game_id=game_id,
        task_type=TaskType.MEMORY,
        difficulty=5,
        correct=correct,
        response_time_ms=response_time_ms,
        skipped=skipped,
    )


def _profile(score: float = 0.8, strengths=None, weaknesses=None) -> CognitiveProfile:
    return CognitiveProfile(
        patient_id="p-001",
        domain_scores=[
            CognitiveScore(domain="memory", score=score, confidence=0.85, sample_size=30),
            CognitiveScore(domain="recall", score=score, confidence=0.85, sample_size=30),
        ],
        overall_score=score,
        overall_confidence=0.85,
        strengths=strengths or ["memory"],
        weaknesses=weaknesses or [],
        total_events=60,
    )


class TestAnalyticsEngine:
    def setup_method(self):
        self.engine = AnalyticsEngine()

    def test_reaction_trend_improving(self):
        # Decreasing response times: 2000 -> 1800 -> 1600 -> 1400 -> 1200
        events = [_event(response_time_ms=2000.0 - (i * 150)) for i in range(6)]
        trend = compute_reaction_trend(events)
        assert trend.is_improving
        assert trend.slope_ms_per_session < 0
        assert "Faster" in trend.trend_description

    def test_reaction_trend_slowing(self):
        # Increasing response times
        events = [_event(response_time_ms=1000.0 + (i * 200)) for i in range(6)]
        trend = compute_reaction_trend(events)
        assert not trend.is_improving
        assert trend.slope_ms_per_session > 0

    def test_accuracy_trend_breakdown(self):
        events = (
            [_event(correct=True, game_id="CARD_MATCH") for _ in range(8)]
            + [_event(correct=False, game_id="CARD_MATCH") for _ in range(2)]
            + [_event(correct=True, game_id="AUDITORY_RECALL") for _ in range(5)]
        )
        acc_trend = compute_accuracy_trend(events)
        assert acc_trend.breakdown_by_game["CARD_MATCH"] == 80.0
        assert acc_trend.breakdown_by_game["AUDITORY_RECALL"] == 100.0

    def test_stability_score_calculation(self):
        profile = _profile(score=0.85)
        events = [_event() for _ in range(10)]
        stability = compute_stability_score(profile, events)
        assert 70.0 <= stability <= 99.0

    def test_caregiver_report_generation(self):
        profile = _profile(score=0.82, strengths=["memory", "recall"])
        events = [_event(response_time_ms=1800.0 - (i * 100)) for i in range(10)]
        report = self.engine.generate_report(profile, events)

        assert report.patient_id == "p-001"
        assert report.stability_score >= 80.0
        assert "Optimal & Stable" in report.stability_status
        assert len(report.strengths_summary) == 2
        assert len(report.alerts) >= 1

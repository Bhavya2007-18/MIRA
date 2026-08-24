"""Tests for data contracts — events, cognitive scores, profiles, recommendations."""

from __future__ import annotations

import json
from datetime import datetime, timezone

import pytest
from pydantic import ValidationError

from mira_ml.schemas.events import GameEvent, GameEventBatch, TaskType
from mira_ml.schemas.cognitive import CognitiveScore, CognitiveProfile, DomainThresholds
from mira_ml.schemas.recommendations import (
    Recommendation,
    RecommendationType,
    DifficultyRecommendation,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _event(**overrides) -> GameEvent:
    defaults = dict(
        patient_id="p-001",
        session_id="s-001",
        game_id="memory-cards",
        task_type=TaskType.MEMORY,
        difficulty=5,
        correct=True,
        response_time_ms=1500.0,
        attempts=1,
        hints_used=0,
        skipped=False,
    )
    defaults.update(overrides)
    return GameEvent(**defaults)


def _score(domain: str = "memory", score: float = 0.75, **kw) -> CognitiveScore:
    defaults = dict(domain=domain, score=score, confidence=0.8, sample_size=10)
    defaults.update(kw)
    return CognitiveScore(**defaults)


def _profile(**kw) -> CognitiveProfile:
    defaults = dict(
        patient_id="p-001",
        domain_scores=[_score("memory", 0.8), _score("attention", 0.5)],
        overall_score=0.65,
        overall_confidence=0.7,
        strengths=["memory"],
        weaknesses=["attention"],
        total_events=20,
        profile_version=1,
    )
    defaults.update(kw)
    return CognitiveProfile(**defaults)


def _recommendation(**kw) -> Recommendation:
    defaults = dict(
        patient_id="p-001",
        recommendation_type=RecommendationType.GAME,
        target_game_id="memory-cards-v2",
        target_domain="memory",
        difficulty=6,
        reason="Strong memory performance — increase challenge",
        confidence=0.85,
    )
    defaults.update(kw)
    return Recommendation(**defaults)


def _difficulty_rec(**kw) -> DifficultyRecommendation:
    defaults = dict(
        patient_id="p-001",
        game_id="memory-cards",
        target_domain="memory",
        current_difficulty=5,
        suggested_difficulty=7,
        adjustment=2,
        reason="Sustained high accuracy",
        confidence=0.9,
    )
    defaults.update(kw)
    return DifficultyRecommendation(**defaults)


# ---------------------------------------------------------------------------
# GameEvent tests
# ---------------------------------------------------------------------------

class TestGameEvent:
    def test_valid_event(self):
        e = _event()
        assert e.patient_id == "p-001"
        assert e.correct is True
        assert e.task_type == TaskType.MEMORY

    def test_all_task_types(self):
        for tt in TaskType:
            e = _event(task_type=tt)
            assert e.task_type == tt

    def test_frozen(self):
        e = _event()
        with pytest.raises(ValidationError):
            e.patient_id = "changed"

    def test_invalid_difficulty_too_low(self):
        with pytest.raises(ValidationError):
            _event(difficulty=0)

    def test_invalid_difficulty_too_high(self):
        with pytest.raises(ValidationError):
            _event(difficulty=11)

    def test_invalid_negative_response_time(self):
        with pytest.raises(ValidationError):
            _event(response_time_ms=-1)

    def test_invalid_attempts_zero(self):
        with pytest.raises(ValidationError):
            _event(attempts=0)

    def test_invalid_hints_negative(self):
        with pytest.raises(ValidationError):
            _event(hints_used=-1)

    def test_empty_patient_id_rejected(self):
        with pytest.raises(ValidationError):
            _event(patient_id="")

    def test_json_roundtrip(self):
        e = _event()
        j = e.model_dump_json()
        e2 = GameEvent.model_validate_json(j)
        assert e == e2

    def test_json_compatible(self):
        e = _event()
        d = e.model_dump()
        assert isinstance(d["timestamp"], str) or isinstance(d["timestamp"], datetime)


# ---------------------------------------------------------------------------
# CognitiveScore tests
# ---------------------------------------------------------------------------

class TestCognitiveScore:
    def test_valid_score(self):
        s = _score()
        assert s.score == 0.75

    def test_score_boundary_zero(self):
        s = _score(score=0.0)
        assert s.score == 0.0

    def test_score_boundary_one(self):
        s = _score(score=1.0)
        assert s.score == 1.0

    def test_score_below_zero_rejected(self):
        with pytest.raises(ValidationError):
            _score(score=-0.1)

    def test_score_above_one_rejected(self):
        with pytest.raises(ValidationError):
            _score(score=1.1)

    def test_confidence_bounds(self):
        with pytest.raises(ValidationError):
            _score(confidence=1.5)

    def test_sample_size_zero_allowed(self):
        s = _score(sample_size=0)
        assert s.sample_size == 0

    def test_json_roundtrip(self):
        s = _score()
        s2 = CognitiveScore.model_validate_json(s.model_dump_json())
        assert s == s2


# ---------------------------------------------------------------------------
# CognitiveProfile tests
# ---------------------------------------------------------------------------

class TestCognitiveProfile:
    def test_valid_profile(self):
        p = _profile()
        assert p.overall_score == 0.65
        assert len(p.domain_scores) == 2

    def test_empty_domain_scores_rejected(self):
        with pytest.raises(ValidationError):
            _profile(domain_scores=[])

    def test_domain_score_map(self):
        p = _profile()
        m = p.domain_score_map()
        assert "memory" in m
        assert "attention" in m
        assert m["memory"].score == 0.8

    def test_overall_score_bounds(self):
        with pytest.raises(ValidationError):
            _profile(overall_score=1.5)

    def test_json_roundtrip(self):
        p = _profile()
        p2 = CognitiveProfile.model_validate_json(p.model_dump_json())
        assert p == p2

    def test_version_increments(self):
        p1 = _profile(profile_version=1)
        p2 = _profile(profile_version=2)
        assert p2.profile_version > p1.profile_version


# ---------------------------------------------------------------------------
# Recommendation tests
# ---------------------------------------------------------------------------

class TestRecommendation:
    def test_valid_recommendation(self):
        r = _recommendation()
        assert r.target_domain == "memory"

    def test_all_recommendation_types(self):
        for rt in RecommendationType:
            r = _recommendation(recommendation_type=rt)
            assert r.recommendation_type == rt

    def test_optional_game_id(self):
        r = _recommendation(target_game_id=None)
        assert r.target_game_id is None

    def test_invalid_difficulty(self):
        with pytest.raises(ValidationError):
            _recommendation(difficulty=0)

    def test_json_roundtrip(self):
        r = _recommendation()
        r2 = Recommendation.model_validate_json(r.model_dump_json())
        assert r == r2


# ---------------------------------------------------------------------------
# DifficultyRecommendation tests
# ---------------------------------------------------------------------------

class TestDifficultyRecommendation:
    def test_valid(self):
        d = _difficulty_rec()
        assert d.adjustment == 2

    def test_negative_adjustment(self):
        d = _difficulty_rec(adjustment=-3)
        assert d.adjustment == -3

    def test_adjustment_bounds(self):
        with pytest.raises(ValidationError):
            _difficulty_rec(adjustment=10)

    def test_json_roundtrip(self):
        d = _difficulty_rec()
        d2 = DifficultyRecommendation.model_validate_json(d.model_dump_json())
        assert d == d2


# ---------------------------------------------------------------------------
# DomainThresholds tests
# ---------------------------------------------------------------------------

class TestDomainThresholds:
    def test_defaults(self):
        t = DomainThresholds()
        assert t.strength_ratio == 0.75
        assert t.weakness_ratio == 0.40
        assert t.min_events_for_confidence == 5

    def test_custom(self):
        t = DomainThresholds(strength_ratio=0.8, weakness_ratio=0.3)
        assert t.strength_ratio == 0.8

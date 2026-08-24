"""Tests for the cognitive scoring engine."""

from __future__ import annotations

import math

import pytest

from mira_ml.schemas.events import GameEvent, TaskType
from mira_ml.schemas.cognitive import CognitiveScore
from mira_ml.scoring.features import FeatureExtractor, DomainFeatures
from mira_ml.scoring.engine import DomainScorer, ScoringWeights, compute_confidence
from mira_ml.scoring.scoring_engine import ScoringEngine


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _ev(
    task_type: TaskType = TaskType.MEMORY,
    correct: bool = True,
    response_time_ms: float = 2000.0,
    difficulty: int = 5,
    attempts: int = 1,
    hints_used: int = 0,
    skipped: bool = False,
    **kw,
) -> GameEvent:
    defaults = dict(
        patient_id="p-001",
        session_id="s-001",
        game_id="game-1",
        task_type=task_type,
        difficulty=difficulty,
        correct=correct,
        response_time_ms=response_time_ms,
        attempts=attempts,
        hints_used=hints_used,
        skipped=skipped,
    )
    defaults.update(kw)
    return GameEvent(**defaults)


def _n_events(
    n: int,
    correct_ratio: float = 1.0,
    task_type: TaskType = TaskType.MEMORY,
    base_time: float = 2000.0,
    difficulty: int = 5,
    **kw,
) -> list[GameEvent]:
    """Generate n events with a given correctness ratio."""
    events = []
    correct_count = int(n * correct_ratio)
    for i in range(n):
        events.append(_ev(
            task_type=task_type,
            correct=(i < correct_count),
            response_time_ms=base_time + (i * 100),
            difficulty=difficulty,
            **kw,
        ))
    return events


# ---------------------------------------------------------------------------
# FeatureExtractor tests
# ---------------------------------------------------------------------------

class TestFeatureExtractor:
    def setup_method(self):
        self.extractor = FeatureExtractor()

    def test_empty_events(self):
        features = self.extractor.extract([])
        assert features == {}

    def test_single_event(self):
        events = [_ev(correct=True, response_time_ms=1500.0)]
        features = self.extractor.extract(events)
        assert "memory" in features
        f = features["memory"]
        assert f.event_count == 1
        assert f.correct_count == 1
        assert f.accuracy == 1.0
        assert f.avg_response_time_ms == 1500.0

    def test_multiple_events(self):
        events = _n_events(10, correct_ratio=0.8)
        features = self.extractor.extract(events)
        f = features["memory"]
        assert f.event_count == 10
        assert f.correct_count == 8
        assert 0.7 < f.accuracy < 0.9  # hint-corrected

    def test_skipped_events_excluded(self):
        events = [
            _ev(correct=True),
            _ev(correct=True, skipped=True),
            _ev(correct=False),
        ]
        features = self.extractor.extract(events)
        f = features["memory"]
        assert f.event_count == 3
        assert f.skipped_count == 1
        assert f.correct_count == 1  # only non-skipped correct
        # 2 non-skipped events, 1 correct = 0.5 accuracy
        assert f.accuracy == 0.5

    def test_all_skipped(self):
        events = [_ev(skipped=True), _ev(skipped=True)]
        features = self.extractor.extract(events)
        f = features["memory"]
        assert f.event_count == 2
        assert f.skipped_count == 2
        assert f.accuracy == 0.0
        assert f.event_count - f.skipped_count == 0

    def test_hint_penalty(self):
        events = [_ev(correct=True, hints_used=2)]
        features = self.extractor.extract(events)
        f = features["memory"]
        # hint_penalty = 2 * 0.5 = 1.0
        # accuracy = max(0, (1 - 1.0) / 1) = 0.0
        assert f.accuracy == 0.0

    def test_partial_hint_penalty(self):
        events = [_ev(correct=True, hints_used=1)]
        features = self.extractor.extract(events)
        f = features["memory"]
        # hint_penalty = 0.5
        # accuracy = (1 - 0.5) / 1 = 0.5
        assert f.accuracy == 0.5

    def test_efficiency_perfect(self):
        events = [_ev(correct=True, attempts=1, hints_used=0)]
        features = self.extractor.extract(events)
        f = features["memory"]
        assert f.efficiency == 1.0

    def test_efficiency_degrades_with_attempts(self):
        events = [_ev(correct=True, attempts=3, hints_used=0)]
        features = self.extractor.extract(events)
        f = features["memory"]
        # 1.0 - (3-1)*0.15 = 1.0 - 0.3 = 0.7
        assert abs(f.efficiency - 0.7) < 0.01

    def test_efficiency_degrades_with_hints(self):
        events = [_ev(correct=True, attempts=1, hints_used=2)]
        features = self.extractor.extract(events)
        f = features["memory"]
        # 1.0 - 0 - 2*0.2 = 0.6
        assert abs(f.efficiency - 0.6) < 0.01

    def test_response_time_consistency(self):
        # Same response times → CV = 0 → consistency = 1.0
        events = [_ev(response_time_ms=2000.0) for _ in range(5)]
        features = self.extractor.extract(events)
        f = features["memory"]
        assert f.response_time_cv == 0.0

    def test_response_time_variable(self):
        # Very different response times → higher CV
        events = [_ev(response_time_ms=float(i * 1000)) for i in range(1, 6)]
        features = self.extractor.extract(events)
        f = features["memory"]
        assert f.response_time_cv > 0.5

    def test_recent_accuracy(self):
        # 10 events: first 8 wrong, last 2 correct
        events = [_ev(correct=False) for _ in range(8)]
        events += [_ev(correct=True) for _ in range(2)]
        features = self.extractor.extract(events)
        f = features["memory"]
        # recent 20% = last 2 events, both correct
        assert f.recent_accuracy == 1.0

    def test_domain_grouping(self):
        events = [
            _ev(task_type=TaskType.MEMORY, correct=True),
            _ev(task_type=TaskType.ATTENTION, correct=True),
            _ev(task_type=TaskType.MEMORY, correct=False),
        ]
        features = self.extractor.extract(events)
        assert "memory" in features
        assert "attention" in features
        assert len(features) == 2

    def test_other_recognition_skipped(self):
        events = [
            _ev(task_type=TaskType.OTHER),
            _ev(task_type=TaskType.RECOGNITION),
        ]
        features = self.extractor.extract(events)
        assert len(features) == 0

    def test_difficulty_tracking(self):
        events = [_ev(difficulty=3), _ev(difficulty=7)]
        features = self.extractor.extract(events)
        f = features["memory"]
        assert f.difficulty_level == 5.0


# ---------------------------------------------------------------------------
# compute_confidence tests
# ---------------------------------------------------------------------------

class TestComputeConfidence:
    def test_zero_events(self):
        assert compute_confidence(0, 0.0, 0.5) == 0.0

    def test_single_event_low_confidence(self):
        c = compute_confidence(1, 0.0, 1.0)
        assert 0.0 < c <= 0.5  # small sample cap

    def test_three_events(self):
        c = compute_confidence(3, 0.0, 0.8)
        assert 0.3 < c <= 0.7

    def test_ten_events_good(self):
        c = compute_confidence(10, 0.0, 0.8)
        assert c > 0.7

    def test_fifty_events(self):
        c = compute_confidence(50, 0.0, 0.8)
        assert c > 0.85

    def test_skip_penalty(self):
        c_no_skip = compute_confidence(10, 0.0, 0.8)
        c_half_skip = compute_confidence(10, 0.5, 0.8)
        assert c_half_skip < c_no_skip

    def test_all_skipped(self):
        c = compute_confidence(10, 1.0, 0.8)
        assert c < 0.5

    def test_bounds(self):
        for n in [1, 5, 10, 20, 50, 100]:
            c = compute_confidence(n, 0.0, 0.5)
            assert 0.0 <= c <= 1.0


# ---------------------------------------------------------------------------
# DomainScorer tests
# ---------------------------------------------------------------------------

class TestDomainScorer:
    def setup_method(self):
        self.scorer = DomainScorer()

    def test_perfect_performance(self):
        f = DomainFeatures(
            domain="memory",
            event_count=20,
            skipped_count=0,
            correct_count=20,
            total_attempts=20,
            total_hints=0,
            response_times_ms=[2000.0] * 20,
            difficulties=[5] * 20,
            accuracy=1.0,
            avg_response_time_ms=2000.0,
            response_time_cv=0.0,
            efficiency=1.0,
            difficulty_level=5.0,
            recent_accuracy=1.0,
        )
        score = self.scorer.score(f)
        assert score.score > 0.9
        assert score.confidence > 0.8
        assert score.sample_size == 20

    def test_zero_events(self):
        f = DomainFeatures(
            domain="memory",
            event_count=0,
            skipped_count=0,
            correct_count=0,
            total_attempts=0,
            total_hints=0,
            response_times_ms=[],
            difficulties=[],
            accuracy=0.0,
            avg_response_time_ms=0.0,
            response_time_cv=0.0,
            efficiency=0.0,
            difficulty_level=0.0,
            recent_accuracy=0.0,
        )
        score = self.scorer.score(f)
        assert score.score == 0.0
        assert score.confidence == 0.0
        assert score.sample_size == 0

    def test_all_incorrect(self):
        f = DomainFeatures(
            domain="memory",
            event_count=10,
            skipped_count=0,
            correct_count=0,
            total_attempts=10,
            total_hints=0,
            response_times_ms=[3000.0] * 10,
            difficulties=[5] * 10,
            accuracy=0.0,
            avg_response_time_ms=3000.0,
            response_time_cv=0.0,
            efficiency=0.0,
            difficulty_level=5.0,
            recent_accuracy=0.0,
        )
        score = self.scorer.score(f)
        assert score.score < 0.1

    def test_mixed_performance(self):
        f = DomainFeatures(
            domain="attention",
            event_count=10,
            skipped_count=0,
            correct_count=7,
            total_attempts=12,
            total_hints=1,
            response_times_ms=[2000.0] * 10,
            difficulties=[5] * 10,
            accuracy=0.675,  # hint-corrected
            avg_response_time_ms=2000.0,
            response_time_cv=0.0,
            efficiency=0.77,
            difficulty_level=5.0,
            recent_accuracy=0.8,
        )
        score = self.scorer.score(f)
        assert 0.3 < score.score < 0.8

    def test_high_difficulty_bonus(self):
        f = DomainFeatures(
            domain="reasoning",
            event_count=10,
            skipped_count=0,
            correct_count=9,
            total_attempts=10,
            total_hints=0,
            response_times_ms=[5000.0] * 10,
            difficulties=[8] * 10,
            accuracy=0.9,
            avg_response_time_ms=5000.0,
            response_time_cv=0.0,
            efficiency=0.95,
            difficulty_level=8.0,
            recent_accuracy=1.0,
        )
        score = self.scorer.score(f)
        # Should be slightly higher than same accuracy at difficulty 5
        f_low = DomainFeatures(
            domain="reasoning",
            event_count=10,
            skipped_count=0,
            correct_count=9,
            total_attempts=10,
            total_hints=0,
            response_times_ms=[5000.0] * 10,
            difficulties=[3] * 10,
            accuracy=0.9,
            avg_response_time_ms=5000.0,
            response_time_cv=0.0,
            efficiency=0.95,
            difficulty_level=3.0,
            recent_accuracy=1.0,
        )
        score_low = self.scorer.score(f_low)
        assert score.score > score_low.score

    def test_score_bounds(self):
        # Test various extreme features — score must always be in [0, 1]
        for acc in [0.0, 0.5, 1.0]:
            for eff in [0.0, 0.5, 1.0]:
                for cv in [0.0, 0.5, 1.5]:
                    for rec in [0.0, 0.5, 1.0]:
                        f = DomainFeatures(
                            domain="memory",
                            event_count=10,
                            skipped_count=0,
                            correct_count=0,
                            total_attempts=10,
                            total_hints=0,
                            response_times_ms=[2000.0] * 10,
                            difficulties=[5] * 10,
                            accuracy=acc,
                            avg_response_time_ms=2000.0,
                            response_time_cv=cv,
                            efficiency=eff,
                            difficulty_level=5.0,
                            recent_accuracy=rec,
                        )
                        s = self.scorer.score(f)
                        assert 0.0 <= s.score <= 1.0, f"Score {s.score} out of bounds"
                        assert 0.0 <= s.confidence <= 1.0, f"Confidence {s.confidence} out of bounds"

    def test_consistency_effect(self):
        # Low CV → high consistency → higher score
        f_consistent = DomainFeatures(
            domain="memory", event_count=10, skipped_count=0,
            correct_count=8, total_attempts=10, total_hints=0,
            response_times_ms=[2000.0] * 10, difficulties=[5] * 10,
            accuracy=0.8, avg_response_time_ms=2000.0,
            response_time_cv=0.0, efficiency=0.95,
            difficulty_level=5.0, recent_accuracy=0.8,
        )
        f_variable = DomainFeatures(
            domain="memory", event_count=10, skipped_count=0,
            correct_count=8, total_attempts=10, total_hints=0,
            response_times_ms=[1000.0, 5000.0] * 5, difficulties=[5] * 10,
            accuracy=0.8, avg_response_time_ms=3000.0,
            response_time_cv=0.8, efficiency=0.95,
            difficulty_level=5.0, recent_accuracy=0.8,
        )
        s_consistent = self.scorer.score(f_consistent)
        s_variable = self.scorer.score(f_variable)
        assert s_consistent.score > s_variable.score

    def test_custom_weights(self):
        weights = ScoringWeights(accuracy=0.8, efficiency=0.1, consistency=0.05, recency=0.05)
        scorer = DomainScorer(weights=weights)
        f = DomainFeatures(
            domain="memory", event_count=10, skipped_count=0,
            correct_count=10, total_attempts=10, total_hints=0,
            response_times_ms=[2000.0] * 10, difficulties=[5] * 10,
            accuracy=1.0, avg_response_time_ms=2000.0,
            response_time_cv=0.0, efficiency=0.5,
            difficulty_level=5.0, recent_accuracy=1.0,
        )
        score = scorer.score(f)
        # With 80% accuracy weight, perfect accuracy dominates
        assert score.score > 0.8


# ---------------------------------------------------------------------------
# ScoringEngine integration tests
# ---------------------------------------------------------------------------

class TestScoringEngine:
    def setup_method(self):
        self.engine = ScoringEngine()

    def test_empty_input(self):
        scores = self.engine.score([])
        assert scores == []

    def test_single_domain(self):
        events = _n_events(10, correct_ratio=1.0, task_type=TaskType.MEMORY)
        scores = self.engine.score(events)
        assert len(scores) == 1
        assert scores[0].domain == "memory"
        assert scores[0].score > 0.8

    def test_multiple_domains(self):
        events = (
            _n_events(10, correct_ratio=1.0, task_type=TaskType.MEMORY)
            + _n_events(10, correct_ratio=0.5, task_type=TaskType.ATTENTION)
        )
        scores = self.engine.score(events)
        assert len(scores) == 2
        domains = {s.domain for s in scores}
        assert domains == {"memory", "attention"}

    def test_perfect_scores_high(self):
        events = _n_events(20, correct_ratio=1.0, base_time=1500.0)
        scores = self.engine.score(events)
        assert scores[0].score > 0.85

    def test_poor_scores_low(self):
        events = _n_events(20, correct_ratio=0.1, base_time=8000.0)
        scores = self.engine.score(events)
        assert scores[0].score < 0.3

    def test_score_bounds(self):
        for ratio in [0.0, 0.25, 0.5, 0.75, 1.0]:
            events = _n_events(15, correct_ratio=ratio)
            scores = self.engine.score(events)
            for s in scores:
                assert 0.0 <= s.score <= 1.0
                assert 0.0 <= s.confidence <= 1.0

    def test_with_features(self):
        events = _n_events(10, correct_ratio=0.8)
        scores, features = self.engine.score_with_features(events)
        assert len(scores) == 1
        assert "memory" in features
        assert features["memory"].event_count == 10

    def test_deterministic(self):
        events = _n_events(20, correct_ratio=0.7)
        scores1 = self.engine.score(events)
        scores2 = self.engine.score(events)
        assert scores1[0].score == scores2[0].score
        assert scores1[0].confidence == scores2[0].confidence

    def test_mixed_events(self):
        """Test with a realistic mix of correct/incorrect/hinted/skipped."""
        events = (
            [_ev(correct=True) for _ in range(5)]
            + [_ev(correct=False) for _ in range(3)]
            + [_ev(correct=True, hints_used=1) for _ in range(2)]
            + [_ev(skipped=True) for _ in range(1)]
        )
        scores = self.engine.score(events)
        assert len(scores) == 1
        s = scores[0]
        assert 0.0 < s.score < 1.0
        assert s.sample_size == 10  # non-skipped

    def test_difficulty_range(self):
        """Scores should differ across difficulty levels with same accuracy."""
        events_easy = _n_events(10, correct_ratio=1.0, difficulty=2)
        events_hard = _n_events(10, correct_ratio=1.0, difficulty=8)
        score_easy = self.engine.score(events_easy)[0]
        score_hard = self.engine.score(events_hard)[0]
        # Hard difficulty should score slightly higher (bonus)
        assert score_hard.score >= score_easy.score

    def test_all_task_types_scored(self):
        events = []
        for tt in [TaskType.MEMORY, TaskType.ATTENTION, TaskType.RECALL,
                    TaskType.ORIENTATION, TaskType.REASONING]:
            events.extend(_n_events(5, correct_ratio=0.8, task_type=tt))
        scores = self.engine.score(events)
        assert len(scores) == 5
        domains = {s.domain for s in scores}
        assert domains == {"memory", "attention", "recall", "orientation", "reasoning"}

    def test_response_time_effect(self):
        """Faster correct responses should score higher than slow ones."""
        events_fast = [_ev(correct=True, response_time_ms=500.0) for _ in range(10)]
        events_slow = [_ev(correct=True, response_time_ms=10000.0) for _ in range(10)]
        # Both have perfect accuracy, so scores should be similar
        # but consistency may differ slightly
        score_fast = self.engine.score(events_fast)[0]
        score_slow = self.engine.score(events_slow)[0]
        # Both should be high since accuracy is the dominant factor
        assert score_fast.score > 0.8
        assert score_slow.score > 0.8


# ---------------------------------------------------------------------------
# Confidence integration tests
# ---------------------------------------------------------------------------

class TestConfidenceIntegration:
    def setup_method(self):
        self.engine = ScoringEngine()

    def test_more_events_higher_confidence(self):
        events_few = _n_events(3, correct_ratio=0.8)
        events_many = _n_events(30, correct_ratio=0.8)
        conf_few = self.engine.score(events_few)[0].confidence
        conf_many = self.engine.score(events_many)[0].confidence
        assert conf_many > conf_few

    def test_skipped_reduce_confidence(self):
        events_clean = _n_events(10, correct_ratio=0.8)
        events_skippy = _n_events(10, correct_ratio=0.8) + [_ev(skipped=True) for _ in range(5)]
        conf_clean = self.engine.score(events_clean)[0].confidence
        conf_skippy = self.engine.score(events_skippy)[0].confidence
        assert conf_clean >= conf_skippy

    def test_zero_events_zero_confidence(self):
        scores = self.engine.score([])
        assert scores == []

"""Tests for the cognitive profiling engine."""

from __future__ import annotations

import pytest

from mira_ml.schemas.cognitive import CognitiveScore, CognitiveProfile, DomainThresholds
from mira_ml.profiling.aggregator import DomainAggregator, AggregationConfig, DomainState
from mira_ml.profiling.engine import ProfilingEngine, MIN_CONFIDENCE_FOR_CLASSIFICATION


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _score(domain: str = "memory", score: float = 0.75, confidence: float = 0.8, sample_size: int = 10) -> CognitiveScore:
    return CognitiveScore(domain=domain, score=score, confidence=confidence, sample_size=sample_size)


def _high_confidence(domain: str = "memory", score: float = 0.8) -> CognitiveScore:
    return CognitiveScore(domain=domain, score=score, confidence=0.9, sample_size=20)


def _low_confidence(domain: str = "memory", score: float = 0.8) -> CognitiveScore:
    return CognitiveScore(domain=domain, score=score, confidence=0.15, sample_size=2)


# ---------------------------------------------------------------------------
# DomainAggregator tests
# ---------------------------------------------------------------------------

class TestDomainAggregator:
    def setup_method(self):
        self.agg = DomainAggregator()

    def test_first_observation_adopted_directly(self):
        self.agg.update([_score("memory", 0.7, 0.8, 10)])
        state = self.agg.get_domain_state("memory")
        assert state is not None
        assert state.score == 0.7
        assert state.confidence == 0.8
        assert state.observation_count == 1
        assert state.total_events == 10

    def test_second_observation_blended(self):
        self.agg.update([_score("memory", 0.7, 0.8, 10)])
        self.agg.update([_score("memory", 0.9, 0.9, 10)])
        state = self.agg.get_domain_state("memory")
        # Should be between 0.7 and 0.9, not equal to either
        assert 0.7 < state.score < 0.9
        assert state.observation_count == 2

    def test_high_confidence_shifts_more(self):
        # Low confidence observation
        agg_low = DomainAggregator()
        agg_low.update([_score("memory", 0.5, 0.8, 10)])  # baseline
        agg_low.update([_score("memory", 0.9, 0.2, 2)])   # low conf
        state_low = agg_low.get_domain_state("memory")

        # High confidence observation
        agg_high = DomainAggregator()
        agg_high.update([_score("memory", 0.5, 0.8, 10)])  # baseline
        agg_high.update([_score("memory", 0.9, 0.9, 20)])  # high conf
        state_high = agg_high.get_domain_state("memory")

        # High confidence should shift score more toward 0.9
        assert state_high.score > state_low.score

    def test_multiple_domains(self):
        self.agg.update([
            _score("memory", 0.7),
            _score("attention", 0.8),
            _score("recall", 0.6),
        ])
        assert set(self.agg.domains) == {"memory", "attention", "recall"}

    def test_reset(self):
        self.agg.update([_score("memory", 0.7)])
        self.agg.reset()
        assert self.agg.domains == []
        assert self.agg.total_observations == 0

    def test_total_events_accumulates(self):
        self.agg.update([_score("memory", 0.7, 0.8, 10)])
        self.agg.update([_score("memory", 0.8, 0.9, 15)])
        state = self.agg.get_domain_state("memory")
        assert state.total_events == 25

    def test_get_domain_states_copy(self):
        self.agg.update([_score("memory", 0.7)])
        states = self.agg.get_domain_states()
        states["memory"].score = 0.99  # mutate copy
        original = self.agg.get_domain_state("memory")
        assert original.score != 0.99  # original unchanged

    def test_unknown_domain_returns_none(self):
        assert self.agg.get_domain_state("nonexistent") is None

    def test_total_observations(self):
        self.agg.update([_score("memory"), _score("attention")])
        self.agg.update([_score("memory"), _score("recall")])
        assert self.agg.total_observations == 4

    def test_total_events_across_domains(self):
        self.agg.update([_score("memory", sample_size=10), _score("attention", sample_size=5)])
        assert self.agg.total_events == 15


# ---------------------------------------------------------------------------
# ProfilingEngine — first profile creation
# ---------------------------------------------------------------------------

class TestProfilingFirstProfile:
    def test_first_profile(self):
        engine = ProfilingEngine(patient_id="p-001")
        engine.update([_score("memory", 0.8, 0.9, 20)])
        profile = engine.build()

        assert profile.patient_id == "p-001"
        assert len(profile.domain_scores) == 1
        assert profile.domain_scores[0].domain == "memory"
        assert profile.domain_scores[0].score == 0.8
        assert profile.profile_version == 1
        assert profile.total_events == 20

    def test_all_five_domains(self):
        engine = ProfilingEngine(patient_id="p-001")
        engine.update([
            _score("memory", 0.8),
            _score("attention", 0.7),
            _score("recall", 0.6),
            _score("orientation", 0.9),
            _score("reasoning", 0.5),
        ])
        profile = engine.build()
        assert len(profile.domain_scores) == 5
        domains = {ds.domain for ds in profile.domain_scores}
        assert domains == {"memory", "attention", "recall", "orientation", "reasoning"}

    def test_empty_update_ignored(self):
        engine = ProfilingEngine(patient_id="p-001")
        engine.update([])
        profile = engine.build()
        assert profile is None

    def test_zero_sample_size_ignored(self):
        engine = ProfilingEngine(patient_id="p-001")
        engine.update([CognitiveScore(domain="memory", score=0.8, confidence=0.9, sample_size=0)])
        profile = engine.build()
        assert profile is None

    def test_profile_version_increments(self):
        engine = ProfilingEngine(patient_id="p-001")
        engine.update([_score("memory", 0.8)])
        p1 = engine.build()
        engine.update([_score("memory", 0.9)])
        p2 = engine.build()
        assert p2.profile_version == p1.profile_version + 1

    def test_deterministic(self):
        engine = ProfilingEngine(patient_id="p-001")
        engine.update([_score("memory", 0.75, 0.8, 10)])
        p1 = engine.build()
        p2 = engine.build()  # same state, just increment version
        # Scores should be identical (no new observations)
        assert p1.domain_scores[0].score == p2.domain_scores[0].score


# ---------------------------------------------------------------------------
# ProfilingEngine — temporal aggregation
# ---------------------------------------------------------------------------

class TestProfilingTemporal:
    def test_repeated_updates_converge(self):
        engine = ProfilingEngine(patient_id="p-001")
        # Send many high-confidence observations
        for _ in range(20):
            engine.update([_score("memory", 0.9, 0.9, 20)])
        profile = engine.build()
        # Should converge close to 0.9
        assert profile.domain_scores[0].score > 0.85

    def test_single_outlier_does_not_rewrite(self):
        engine = ProfilingEngine(patient_id="p-001")
        # Establish baseline at 0.7
        for _ in range(10):
            engine.update([_score("memory", 0.7, 0.9, 20)])
        # One bad session
        engine.update([_score("memory", 0.2, 0.8, 10)])
        profile = engine.build()
        # Score should still be much closer to 0.7 than 0.2
        assert profile.domain_scores[0].score > 0.5

    def test_low_confidence_observation_minimal_shift(self):
        engine = ProfilingEngine(patient_id="p-001")
        engine.update([_score("memory", 0.7, 0.9, 20)])
        engine.update([_low_confidence("memory", 0.1)])
        profile = engine.build()
        # Low confidence observation should barely shift the score
        assert profile.domain_scores[0].score > 0.6

    def test_high_confidence_observation_larger_shift(self):
        engine = ProfilingEngine(patient_id="p-001")
        engine.update([_score("memory", 0.5, 0.9, 20)])
        engine.update([_high_confidence("memory", 0.9)])
        profile = engine.build()
        # High confidence observation should shift more
        assert profile.domain_scores[0].score > 0.6


# ---------------------------------------------------------------------------
# ProfilingEngine — overall score
# ---------------------------------------------------------------------------

class TestProfilingOverall:
    def test_overall_single_domain(self):
        engine = ProfilingEngine(patient_id="p-001")
        engine.update([_score("memory", 0.8, 0.9, 20)])
        profile = engine.build()
        # With one domain, overall should equal that domain's score
        assert abs(profile.overall_score - 0.8) < 0.01

    def test_overall_confidence_weighted(self):
        engine = ProfilingEngine(patient_id="p-001")
        engine.update([
            _score("memory", 0.8, 0.9, 20),    # high confidence
            _score("attention", 0.6, 0.3, 5),   # low confidence
        ])
        profile = engine.build()
        # Overall should be closer to memory (higher confidence)
        assert profile.overall_score > 0.7

    def test_overall_no_domains(self):
        engine = ProfilingEngine(patient_id="p-001")
        profile = engine.build()
        assert profile is None

    def test_overall_confidence_reflects_coverage(self):
        engine = ProfilingEngine(patient_id="p-001")
        # One domain
        engine.update([_score("memory", 0.8, 0.9, 20)])
        p1 = engine.build()
        # Five domains
        engine.update([
            _score("attention", 0.7, 0.9, 20),
            _score("recall", 0.6, 0.9, 20),
            _score("orientation", 0.8, 0.9, 20),
            _score("reasoning", 0.7, 0.9, 20),
        ])
        p2 = engine.build()
        # More coverage → higher overall confidence
        assert p2.overall_confidence > p1.overall_confidence

    def test_overall_score_bounds(self):
        engine = ProfilingEngine(patient_id="p-001")
        engine.update([
            _score("memory", 0.0, 0.9, 20),
            _score("attention", 1.0, 0.9, 20),
        ])
        profile = engine.build()
        assert 0.0 <= profile.overall_score <= 1.0


# ---------------------------------------------------------------------------
# ProfilingEngine — strengths/weaknesses
# ---------------------------------------------------------------------------

class TestProfilingClassification:
    def test_strength_detected(self):
        engine = ProfilingEngine(
            patient_id="p-001",
            thresholds=DomainThresholds(strength_ratio=0.75, weakness_ratio=0.40),
        )
        engine.update([_score("memory", 0.85, 0.9, 20)])
        profile = engine.build()
        assert "memory" in profile.strengths

    def test_weakness_detected(self):
        engine = ProfilingEngine(
            patient_id="p-001",
            thresholds=DomainThresholds(strength_ratio=0.75, weakness_ratio=0.40),
        )
        engine.update([_score("memory", 0.3, 0.9, 20)])
        profile = engine.build()
        assert "memory" in profile.weaknesses

    def test_neutral_domain_not_classified(self):
        engine = ProfilingEngine(
            patient_id="p-001",
            thresholds=DomainThresholds(strength_ratio=0.75, weakness_ratio=0.40),
        )
        engine.update([_score("memory", 0.6, 0.9, 20)])
        profile = engine.build()
        assert "memory" not in profile.strengths
        assert "memory" not in profile.weaknesses

    def test_low_confidence_not_classified(self):
        engine = ProfilingEngine(
            patient_id="p-001",
            thresholds=DomainThresholds(strength_ratio=0.75, weakness_ratio=0.40),
        )
        # High score but very low confidence
        engine.update([CognitiveScore(domain="memory", score=0.9, confidence=0.1, sample_size=2)])
        profile = engine.build()
        # Should not be classified as strength due to low confidence
        assert "memory" not in profile.strengths

    def test_mixed_classification(self):
        engine = ProfilingEngine(
            patient_id="p-001",
            thresholds=DomainThresholds(strength_ratio=0.75, weakness_ratio=0.40),
        )
        engine.update([
            _score("memory", 0.85, 0.9, 20),     # strength
            _score("attention", 0.3, 0.9, 20),    # weakness
            _score("recall", 0.6, 0.9, 20),       # neutral
        ])
        profile = engine.build()
        assert profile.strengths == ["memory"]
        assert profile.weaknesses == ["attention"]

    def test_strengths_weaknesses_sorted(self):
        engine = ProfilingEngine(
            patient_id="p-001",
            thresholds=DomainThresholds(strength_ratio=0.75, weakness_ratio=0.40),
        )
        engine.update([
            _score("reasoning", 0.85, 0.9, 20),
            _score("memory", 0.85, 0.9, 20),
            _score("attention", 0.3, 0.9, 20),
            _score("recall", 0.3, 0.9, 20),
        ])
        profile = engine.build()
        assert profile.strengths == ["memory", "reasoning"]
        assert profile.weaknesses == ["attention", "recall"]

    def test_custom_thresholds(self):
        engine = ProfilingEngine(
            patient_id="p-001",
            thresholds=DomainThresholds(strength_ratio=0.9, weakness_ratio=0.2),
        )
        engine.update([_score("memory", 0.85, 0.9, 20)])
        profile = engine.build()
        # 0.85 < 0.9 threshold, so not a strength
        assert "memory" not in profile.strengths
        assert "memory" not in profile.weaknesses


# ---------------------------------------------------------------------------
# ProfilingEngine — missing domains
# ---------------------------------------------------------------------------

class TestProfilingMissingDomains:
    def test_missing_domains_not_as_zero(self):
        engine = ProfilingEngine(patient_id="p-001")
        engine.update([_score("memory", 0.8, 0.9, 20)])
        profile = engine.build()
        # Only memory should appear
        assert len(profile.domain_scores) == 1
        assert profile.domain_scores[0].domain == "memory"

    def test_partial_domain_coverage(self):
        engine = ProfilingEngine(patient_id="p-001")
        engine.update([
            _score("memory", 0.8, 0.9, 20),
            _score("recall", 0.6, 0.9, 20),
        ])
        profile = engine.build()
        domains = {ds.domain for ds in profile.domain_scores}
        assert domains == {"memory", "recall"}


# ---------------------------------------------------------------------------
# ProfilingEngine — edge cases
# ---------------------------------------------------------------------------

class TestProfilingEdgeCases:
    def test_build_without_update(self):
        engine = ProfilingEngine(patient_id="p-001")
        profile = engine.build()
        assert profile is None

    def test_patient_id_preserved(self):
        engine = ProfilingEngine(patient_id="special-patient-42")
        engine.update([_score("memory", 0.7)])
        profile = engine.build()
        assert profile.patient_id == "special-patient-42"

    def test_timestamp_updated(self):
        engine = ProfilingEngine(patient_id="p-001")
        engine.update([_score("memory", 0.7)])
        p1 = engine.build()
        p2 = engine.build()
        assert p2.timestamp >= p1.timestamp

    def test_domain_score_map(self):
        engine = ProfilingEngine(patient_id="p-001")
        engine.update([
            _score("memory", 0.8),
            _score("attention", 0.7),
        ])
        profile = engine.build()
        smap = profile.domain_score_map()
        assert "memory" in smap
        assert "attention" in smap
        assert smap["memory"].score == 0.8

    def test_observation_count(self):
        engine = ProfilingEngine(patient_id="p-001")
        assert engine.observation_count == 0
        engine.update([_score("memory"), _score("attention")])
        assert engine.observation_count == 2
        engine.update([_score("memory")])
        assert engine.observation_count == 3

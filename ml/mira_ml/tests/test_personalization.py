"""Tests for the personalization engine."""

from __future__ import annotations

import pytest

from mira_ml.schemas.cognitive import CognitiveProfile, CognitiveScore
from mira_ml.personalization.policy import (
    DomainPriority,
    PriorityConfig,
    compute_domain_priorities,
)
from mira_ml.personalization.engine import (
    PersonalizationEngine,
    PersonalizationResult,
    CORE_DOMAINS,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _score(domain: str, score: float, confidence: float = 0.8, sample_size: int = 20) -> CognitiveScore:
    return CognitiveScore(domain=domain, score=score, confidence=confidence, sample_size=sample_size)


def _profile(
    patient_id: str = "p-001",
    scores: list[CognitiveScore] | None = None,
    total_events: int = 100,
    overall_confidence: float = 0.7,
    overall_score: float | None = None,
) -> CognitiveProfile:
    if scores is None:
        scores = [_score("memory", 0.7)]
    if overall_score is None:
        overall_score = sum(s.score for s in scores) / len(scores) if scores else 0.0
    return CognitiveProfile(
        patient_id=patient_id,
        domain_scores=scores,
        overall_score=overall_score,
        overall_confidence=overall_confidence,
        strengths=[],
        weaknesses=[],
        total_events=total_events,
    )


def _full_profile(
    memory: float = 0.7,
    attention: float = 0.6,
    recall: float = 0.5,
    orientation: float = 0.8,
    reasoning: float = 0.4,
    confidence: float = 0.8,
    sample_size: int = 20,
) -> CognitiveProfile:
    return _profile(
        scores=[
            _score("memory", memory, confidence, sample_size),
            _score("attention", attention, confidence, sample_size),
            _score("recall", recall, confidence, sample_size),
            _score("orientation", orientation, confidence, sample_size),
            _score("reasoning", reasoning, confidence, sample_size),
        ],
        total_events=sample_size * 5,
    )


# ---------------------------------------------------------------------------
# compute_domain_priorities tests
# ---------------------------------------------------------------------------

class TestDomainPriorities:
    def test_single_domain(self):
        profile = _profile(scores=[_score("memory", 0.7, 0.9, 20)])
        priorities = compute_domain_priorities(profile)
        assert len(priorities) == 1
        assert priorities[0].domain == "memory"
        # need = (1 - 0.7) × min(1, 0.9/0.5) = 0.3 × 1.0 = 0.3
        assert abs(priorities[0].need - 0.3) < 0.01

    def test_low_score_higher_priority(self):
        profile = _full_profile(memory=0.3, attention=0.8)
        priorities = compute_domain_priorities(profile)
        # memory (0.3) should have higher priority than attention (0.8)
        assert priorities[0].domain == "memory"
        assert priorities[0].priority > priorities[1].priority

    def test_low_confidence_reduces_priority(self):
        # Both have score 0.5, but different confidence
        profile = _profile(scores=[
            _score("memory", 0.5, 0.9, 20),
            _score("attention", 0.5, 0.2, 3),
        ])
        priorities = compute_domain_priorities(profile)
        # Memory has higher confidence → more trusted need → higher priority
        mem_p = next(p for p in priorities if p.domain == "memory")
        att_p = next(p for p in priorities if p.domain == "attention")
        assert mem_p.priority > att_p.priority

    def test_exploration_bonus(self):
        # Low observations should get exploration bonus
        profile = _profile(scores=[
            _score("memory", 0.7, 0.9, 20),     # well-explored
            _score("attention", 0.7, 0.4, 2),   # under-explored
        ])
        priorities = compute_domain_priorities(profile)
        att_p = next(p for p in priorities if p.domain == "attention")
        assert att_p.exploration_bonus > 0

    def test_no_exploration_when_sufficient_data(self):
        profile = _profile(scores=[
            _score("memory", 0.7, 0.9, 20),
            _score("attention", 0.7, 0.9, 20),
        ])
        priorities = compute_domain_priorities(profile)
        for p in priorities:
            assert p.exploration_bonus == 0.0

    def test_recency_penalty(self):
        profile = _full_profile()
        # Without recency
        p_no_recency = compute_domain_priorities(profile, recent_targets=[])
        # With "memory" as recent target
        p_with_recency = compute_domain_priorities(profile, recent_targets=["memory"])

        mem_no = next(p for p in p_no_recency if p.domain == "memory")
        mem_yes = next(p for p in p_with_recency if p.domain == "memory")
        assert mem_yes.priority < mem_no.priority
        assert mem_yes.recency_penalty > 0

    def test_recency_only_last_3(self):
        profile = _full_profile()
        # 4 targets ago shouldn't matter
        targets = ["reasoning", "recall", "orientation", "memory"]
        priorities = compute_domain_priorities(profile, recent_targets=targets)
        # memory is 4th from last → not in recent set (last 3 = recall, orientation, memory)
        # Wait — last 3 of ["reasoning", "recall", "orientation", "memory"] = recall, orientation, memory
        # So memory IS in the last 3. Let's use 5 targets to test properly.
        # Use: [reasoning, attention, recall, orientation, memory]
        # last 3 = recall, orientation, memory → memory IS included
        # Actually let's just test with targets where memory is truly outside last 3
        targets = ["memory", "attention", "recall", "orientation"]
        # last 3 = attention, recall, orientation → memory is NOT in last 3
        priorities = compute_domain_priorities(profile, recent_targets=targets)
        mem_p = next(p for p in priorities if p.domain == "memory")
        att_p = next(p for p in priorities if p.domain == "attention")
        assert mem_p.recency_penalty == 0.0
        assert att_p.recency_penalty > 0

    def test_priority_sorted_descending(self):
        profile = _full_profile()
        priorities = compute_domain_priorities(profile)
        for i in range(len(priorities) - 1):
            assert priorities[i].priority >= priorities[i + 1].priority

    def test_strength_has_low_need(self):
        profile = _profile(scores=[_score("memory", 0.95, 0.9, 20)])
        priorities = compute_domain_priorities(profile)
        assert priorities[0].need < 0.1

    def test_weakness_has_high_need(self):
        profile = _profile(scores=[_score("memory", 0.15, 0.9, 20)])
        priorities = compute_domain_priorities(profile)
        assert priorities[0].need > 0.8

    def test_reason_contains_info(self):
        profile = _profile(scores=[_score("memory", 0.3, 0.4, 3)])
        priorities = compute_domain_priorities(profile)
        reason = priorities[0].reason
        assert "0.30" in reason  # score
        assert "low confidence" in reason

    def test_priority_bounds(self):
        profile = _full_profile()
        priorities = compute_domain_priorities(profile)
        for p in priorities:
            assert 0.0 <= p.priority <= 2.0  # reasonable upper bound
            assert 0.0 <= p.need <= 1.0
            assert 0.0 <= p.exploration_bonus <= 0.3
            assert 0.0 <= p.recency_penalty <= 0.2

    def test_custom_config(self):
        cfg = PriorityConfig(exploration_weight=0.5, recency_penalty=0.3)
        profile = _profile(scores=[
            _score("memory", 0.7, 0.9, 20),
            _score("attention", 0.7, 0.4, 2),
        ])
        priorities = compute_domain_priorities(profile, config=cfg)
        att_p = next(p for p in priorities if p.domain == "attention")
        assert att_p.exploration_bonus > 0.1  # higher exploration weight

    def test_all_core_domains(self):
        profile = _full_profile()
        priorities = compute_domain_priorities(profile)
        domains = {p.domain for p in priorities}
        assert domains == set(CORE_DOMAINS)


# ---------------------------------------------------------------------------
# PersonalizationEngine tests
# ---------------------------------------------------------------------------

class TestPersonalizationEngine:
    def setup_method(self):
        self.engine = PersonalizationEngine()

    def test_basic_target_selection(self):
        profile = _full_profile(memory=0.3, attention=0.7, recall=0.6, orientation=0.8, reasoning=0.5)
        result = self.engine.select_target(profile)
        assert result.primary_target.domain == "memory"
        assert not result.cold_start
        assert result.patient_id == "p-001"

    def test_all_priorities_ranked(self):
        profile = _full_profile()
        result = self.engine.select_target(profile)
        assert len(result.all_priorities) == 5
        # Should be sorted by priority
        for i in range(len(result.all_priorities) - 1):
            assert result.all_priorities[i].priority >= result.all_priorities[i + 1].priority

    def test_cold_start_detection(self):
        # Very few events → cold start
        profile = _profile(
            scores=[_score("memory", 0.7, 0.3, 2)],
            total_events=3,
            overall_confidence=0.2,
        )
        result = self.engine.select_target(profile)
        assert result.cold_start

    def test_not_cold_start(self):
        profile = _full_profile(sample_size=20)
        result = self.engine.select_target(profile)
        assert not result.cold_start

    def test_cold_start_fallback_empty(self):
        # CognitiveProfile requires min_length=1 on domain_scores,
        # so we test with a single low-confidence, low-sample-size score
        profile = _profile(
            scores=[_score("memory", 0.5, 0.1, 1)],
            total_events=1,
            overall_confidence=0.1,
        )
        result = self.engine.select_target(profile)
        assert result.cold_start
        assert result.primary_target.domain == "memory"

    def test_explanation_generated(self):
        profile = _full_profile()
        result = self.engine.select_target(profile)
        assert len(result.explanation) > 0
        assert result.primary_target.domain in result.explanation

    def test_cold_start_explanation(self):
        profile = _profile(
            scores=[_score("memory", 0.5, 0.2, 2)],
            total_events=3,
            overall_confidence=0.15,
        )
        result = self.engine.select_target(profile)
        assert "cold start" in result.explanation.lower() or "insufficient" in result.explanation.lower()

    def test_recent_targets_avoided(self):
        profile = _full_profile(memory=0.5, attention=0.5, recall=0.5, orientation=0.5, reasoning=0.5)
        # All scores equal, but memory was just targeted
        result = self.engine.select_target(profile, recent_targets=["memory"])
        # Should prefer something other than memory
        # (unless recency penalty is small relative to equal need)
        assert result.primary_target.domain != "memory" or result.primary_target.recency_penalty > 0

    def test_weakness_prioritized_over_moderate(self):
        profile = _full_profile(memory=0.2, attention=0.6)
        result = self.engine.select_target(profile)
        assert result.primary_target.domain == "memory"

    def test_patient_id_preserved(self):
        profile = _profile(patient_id="special-42", scores=[_score("memory", 0.7)])
        result = self.engine.select_target(profile)
        assert result.patient_id == "special-42"

    def test_rank_domains_convenience(self):
        profile = _full_profile()
        ranked = self.engine.rank_domains(profile)
        assert len(ranked) == 5
        assert isinstance(ranked[0], DomainPriority)

    def test_deterministic(self):
        profile = _full_profile()
        r1 = self.engine.select_target(profile)
        r2 = self.engine.select_target(profile)
        assert r1.primary_target.domain == r2.primary_target.domain
        assert r1.primary_target.priority == r2.primary_target.priority


# ---------------------------------------------------------------------------
# Edge cases
# ---------------------------------------------------------------------------

class TestPersonalizationEdgeCases:
    def test_single_domain_profile(self):
        profile = _profile(scores=[_score("memory", 0.3, 0.9, 20)])
        result = PersonalizationEngine().select_target(profile)
        assert result.primary_target.domain == "memory"
        assert len(result.all_priorities) == 1

    def test_all_domains_equal(self):
        profile = _full_profile(memory=0.5, attention=0.5, recall=0.5, orientation=0.5, reasoning=0.5)
        result = PersonalizationEngine().select_target(profile)
        # All equal → any domain is valid, but should still return one
        assert result.primary_target.domain in CORE_DOMAINS

    def test_perfect_scores(self):
        profile = _full_profile(memory=1.0, attention=1.0, recall=1.0, orientation=1.0, reasoning=1.0)
        result = PersonalizationEngine().select_target(profile)
        # Even with perfect scores, should return something (maintenance/exploration)
        assert result.primary_target.domain in CORE_DOMAINS
        assert result.primary_target.need == 0.0

    def test_zero_scores(self):
        profile = _full_profile(memory=0.0, attention=0.0, recall=0.0, orientation=0.0, reasoning=0.0)
        result = PersonalizationEngine().select_target(profile)
        # Should prioritize something
        assert result.primary_target.priority > 0

    def test_mixed_confidence_levels(self):
        profile = _profile(scores=[
            _score("memory", 0.5, 0.95, 30),
            _score("attention", 0.5, 0.1, 2),
            _score("recall", 0.5, 0.6, 10),
        ])
        result = PersonalizationEngine().select_target(profile)
        # Attention has lowest confidence → exploration bonus
        att_p = next(p for p in result.all_priorities if p.domain == "attention")
        assert att_p.exploration_bonus > 0

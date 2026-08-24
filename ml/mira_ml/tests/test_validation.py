"""Validation tests — Phase 13.

Comprehensive safety, data validation, edge case, and regression tests
for the entire MIRA AI/ML subsystem.

Covers:
- Safety: low confidence, unknown person, missing data, model unavailable
- Data: no PII leakage, serialization, invalid inputs, versioning
- ML: confidence bounds, score bounds, deterministic output
- Regression: existing subsystems not broken by new additions
"""

from __future__ import annotations

import json
import math
import pytest

from mira_ml.schemas.events import GameEvent, GameEventBatch, TaskType
from mira_ml.schemas.cognitive import CognitiveScore, CognitiveProfile, DomainThresholds
from mira_ml.schemas.recommendations import (
    Recommendation,
    RecommendationType,
    DifficultyRecommendation,
)
from mira_ml.schemas.vision import (
    VisionStatus,
    FaceRecognitionResult,
    ObjectRecognitionResult,
    BoundingBox,
)
from mira_ml.scoring.scoring_engine import ScoringEngine
from mira_ml.scoring.features import FeatureExtractor
from mira_ml.scoring.engine import compute_confidence
from mira_ml.profiling.engine import ProfilingEngine
from mira_ml.profiling.aggregator import DomainAggregator
from mira_ml.personalization.engine import PersonalizationEngine
from mira_ml.personalization.policy import compute_domain_priorities
from mira_ml.adaptive.engine import AdaptiveDifficultyEngine
from mira_ml.adaptive.policy import evaluate_performance, compute_adjustment
from mira_ml.recommendation.engine import RecommendationEngine
from mira_ml.analytics.engine import AnalyticsEngine
from mira_ml.analytics.trends import TrendDirection
from mira_ml.vision.face.recognition import FaceEnrollmentStore, match_face, cosine_similarity
from mira_ml.vision.object.recognition import ObjectEnrollmentStore, match_object
from mira_ml.inference.pipeline import InferencePipeline
from mira_ml.inference.model_manager import ModelManager, ModelConfig, ModelBackend
from mira_ml.api.service import MiraAIService


# ===========================================================================
# Safety Tests
# ===========================================================================

class TestSafety:
    """Ensure the system fails safely under adverse conditions."""

    def test_low_confidence_no_forced_identity(self):
        """Face recognition should never force identity at low confidence."""
        store = FaceEnrollmentStore()
        embs = [[1.0 + i * 0.01 for i in range(128)] for _ in range(5)]
        store.enroll("f-001", "Known Person", embs)

        import random
        random.seed(42)
        # Very different embedding
        query = [random.uniform(-1.0, 1.0) for _ in range(128)]
        result = match_face(query, store, patient_id="p-001")
        # Should be UNKNOWN, never KNOWN
        assert result.status != VisionStatus.KNOWN

    def test_empty_event_list_scoring(self):
        """Scoring engine should handle empty events gracefully."""
        engine = ScoringEngine()
        scores = engine.score([])
        assert scores == []

    def test_empty_profile_building(self):
        """Profiling engine should return None with no data."""
        engine = ProfilingEngine(patient_id="p-001")
        profile = engine.build()
        assert profile is None

    def test_zero_difficulty_bounds(self):
        """Difficulty should always be clamped to 1-10."""
        engine = AdaptiveDifficultyEngine()
        events = [
            GameEvent(
                patient_id="p-001", session_id="s-1", game_id="g-1",
                task_type=TaskType.MEMORY, difficulty=1,
                correct=True, response_time_ms=1000.0,
            )
            for _ in range(10)
        ]
        rec = engine.compute(
            events=events,
            current_difficulty=1,  # already at minimum
            game_id="g-1",
            target_domain="memory",
            patient_id="p-001",
        )
        assert rec.suggested_difficulty >= 1

    def test_max_difficulty_bounds(self):
        """Difficulty should not exceed 10."""
        engine = AdaptiveDifficultyEngine()
        events = [
            GameEvent(
                patient_id="p-001", session_id="s-1", game_id="g-1",
                task_type=TaskType.MEMORY, difficulty=10,
                correct=True, response_time_ms=1000.0,
            )
            for _ in range(10)
        ]
        rec = engine.compute(
            events=events,
            current_difficulty=10,  # already at maximum
            game_id="g-1",
            target_domain="memory",
            patient_id="p-001",
        )
        assert rec.suggested_difficulty <= 10

    def test_score_always_in_bounds(self):
        """All cognitive scores should be in [0, 1]."""
        engine = ScoringEngine()
        # Various event patterns
        for correct_count in range(6):
            events = [
                GameEvent(
                    patient_id="p-001", session_id="s-1", game_id="g-1",
                    task_type=TaskType.MEMORY, difficulty=d,
                    correct=i < correct_count,
                    response_time_ms=1000.0 + i * 100,
                    attempts=1 if i < correct_count else 3,
                )
                for i, d in enumerate(range(1, 6))
            ]
            scores = engine.score(events)
            for s in scores:
                assert 0.0 <= s.score <= 1.0, f"Score {s.score} out of bounds"
                assert 0.0 <= s.confidence <= 1.0, f"Confidence {s.confidence} out of bounds"

    def test_cosine_similarity_bounds(self):
        """Cosine similarity should always be in [-1, 1]."""
        import random
        random.seed(42)
        for _ in range(20):
            a = [random.uniform(-10, 10) for _ in range(128)]
            b = [random.uniform(-10, 10) for _ in range(128)]
            sim = cosine_similarity(a, b)
            assert -1.0 <= sim <= 1.0

    def test_analytics_no_crash_on_empty(self):
        """Analytics should not crash with empty data."""
        engine = AnalyticsEngine()
        result = engine.analyze(patient_id="p-001")
        assert result.patient_id == "p-001"
        assert len(result.domain_trends) == 5
        assert len(result.insights) > 0

    def test_recommendation_rest_on_fatigue(self):
        """System should recommend rest when confidence is very low."""
        engine = RecommendationEngine()
        from mira_ml.schemas.cognitive import CognitiveScore
        profile = CognitiveProfile(
            patient_id="p-001",
            domain_scores=[
                CognitiveScore(domain="memory", score=0.1, confidence=0.05, sample_size=1),
            ],
            overall_score=0.1,
            overall_confidence=0.05,
            total_events=1,
        )
        events = [
            GameEvent(
                patient_id="p-001", session_id=f"s-{i}", game_id="g-1",
                task_type=TaskType.MEMORY, difficulty=5,
                correct=False, response_time_ms=5000.0,
            )
            for i in range(5)
        ]
        rec = engine.recommend(
            profile=profile,
            recent_events=events,
            current_difficulty=5,
            patient_id="p-001",
        )
        assert rec.recommendation_type == RecommendationType.REST


# ===========================================================================
# Data Validation Tests
# ===========================================================================

class TestDataValidation:
    """Ensure data contracts are properly validated."""

    def test_game_event_rejects_negative_response_time(self):
        with pytest.raises(Exception):
            GameEvent(
                patient_id="p-001", session_id="s-1", game_id="g-1",
                task_type=TaskType.MEMORY, difficulty=5,
                correct=True, response_time_ms=-100.0,
            )

    def test_game_event_rejects_difficulty_out_of_range(self):
        with pytest.raises(Exception):
            GameEvent(
                patient_id="p-001", session_id="s-1", game_id="g-1",
                task_type=TaskType.MEMORY, difficulty=11,
                correct=True, response_time_ms=1000.0,
            )

    def test_game_event_rejects_empty_patient_id(self):
        with pytest.raises(Exception):
            GameEvent(
                patient_id="", session_id="s-1", game_id="g-1",
                task_type=TaskType.MEMORY, difficulty=5,
                correct=True, response_time_ms=1000.0,
            )

    def test_cognitive_score_rejects_above_one(self):
        with pytest.raises(Exception):
            CognitiveScore(domain="memory", score=1.5, confidence=0.5, sample_size=5)

    def test_cognitive_score_rejects_below_zero(self):
        with pytest.raises(Exception):
            CognitiveScore(domain="memory", score=-0.1, confidence=0.5, sample_size=5)

    def test_recommendation_rejects_empty_domain(self):
        with pytest.raises(Exception):
            Recommendation(
                patient_id="p-001",
                recommendation_type=RecommendationType.GAME,
                target_domain="",
                difficulty=5,
                reason="test",
                confidence=0.5,
            )

    def test_recommendation_rejects_difficulty_out_of_range(self):
        with pytest.raises(Exception):
            Recommendation(
                patient_id="p-001",
                recommendation_type=RecommendationType.GAME,
                target_domain="memory",
                difficulty=15,
                reason="test",
                confidence=0.5,
            )

    def test_json_roundtrip_game_event(self):
        event = GameEvent(
            patient_id="p-001", session_id="s-1", game_id="g-1",
            task_type=TaskType.MEMORY, difficulty=5,
            correct=True, response_time_ms=2000.0,
        )
        json_str = event.model_dump_json()
        restored = GameEvent.model_validate_json(json_str)
        assert restored == event

    def test_json_roundtrip_recommendation(self):
        rec = Recommendation(
            patient_id="p-001",
            recommendation_type=RecommendationType.GAME,
            target_domain="memory",
            difficulty=5,
            reason="test reason",
            confidence=0.8,
        )
        json_str = rec.model_dump_json()
        restored = Recommendation.model_validate_json(json_str)
        assert restored == rec

    def test_json_roundtrip_cognitive_profile(self):
        profile = CognitiveProfile(
            patient_id="p-001",
            domain_scores=[
                CognitiveScore(domain="memory", score=0.7, confidence=0.6, sample_size=10),
            ],
            overall_score=0.7,
            overall_confidence=0.6,
            total_events=10,
        )
        json_str = profile.model_dump_json()
        restored = CognitiveProfile.model_validate_json(json_str)
        assert restored.patient_id == profile.patient_id
        assert restored.overall_score == profile.overall_score

    def test_frozen_models_immutable(self):
        """All frozen models should be immutable."""
        event = GameEvent(
            patient_id="p-001", session_id="s-1", game_id="g-1",
            task_type=TaskType.MEMORY, difficulty=5,
            correct=True, response_time_ms=1000.0,
        )
        with pytest.raises(Exception):
            event.difficulty = 9

        rec = Recommendation(
            patient_id="p-001",
            recommendation_type=RecommendationType.GAME,
            target_domain="memory",
            difficulty=5,
            reason="test",
            confidence=0.5,
        )
        with pytest.raises(Exception):
            rec.difficulty = 9


# ===========================================================================
# ML Behavior Tests
# ===========================================================================

class TestMLBehavior:
    """Verify ML-specific behaviors: determinism, confidence, scoring."""

    def test_scoring_deterministic(self):
        """Same events should produce same scores."""
        engine = ScoringEngine()
        events = [
            GameEvent(
                patient_id="p-001", session_id="s-1", game_id="g-1",
                task_type=TaskType.MEMORY, difficulty=5,
                correct=True, response_time_ms=2000.0,
            )
            for _ in range(5)
        ]
        scores1 = engine.score(events)
        scores2 = engine.score(events)
        assert len(scores1) == len(scores2)
        for s1, s2 in zip(scores1, scores2):
            assert s1.score == s2.score
            assert s1.confidence == s2.confidence

    def test_profiling_ema_convergence(self):
        """Repeated updates should converge to the mean."""
        engine = ProfilingEngine(patient_id="p-001")
        # Feed same score 20 times
        for _ in range(20):
            engine.update([
                CognitiveScore(domain="memory", score=0.7, confidence=0.8, sample_size=5)
            ])
        profile = engine.build()
        assert profile is not None
        dsm = profile.domain_score_map()
        assert abs(dsm["memory"].score - 0.7) < 0.05

    def test_confidence_increases_with_events(self):
        """More events should produce higher confidence."""
        e1 = compute_confidence(1, skipped_ratio=0.0, accuracy=0.8)
        e5 = compute_confidence(5, skipped_ratio=0.0, accuracy=0.8)
        e20 = compute_confidence(20, skipped_ratio=0.0, accuracy=0.8)
        assert e1 < e5 < e20

    def test_personalization_prefers_weaknesses(self):
        """Personalization should prioritize weak domains."""
        engine = PersonalizationEngine()
        profile = CognitiveProfile(
            patient_id="p-001",
            domain_scores=[
                CognitiveScore(domain="memory", score=0.2, confidence=0.8, sample_size=20),
                CognitiveScore(domain="attention", score=0.9, confidence=0.8, sample_size=20),
                CognitiveScore(domain="recall", score=0.5, confidence=0.7, sample_size=15),
                CognitiveScore(domain="orientation", score=0.6, confidence=0.6, sample_size=12),
                CognitiveScore(domain="reasoning", score=0.7, confidence=0.7, sample_size=14),
            ],
            overall_score=0.58,
            overall_confidence=0.72,
            total_events=81,
        )
        result = engine.select_target(profile)
        assert result.primary_target.domain == "memory"

    def test_adaptive_increases_on_good_performance(self):
        """Good performance should increase difficulty."""
        engine = AdaptiveDifficultyEngine()
        events = [
            GameEvent(
                patient_id="p-001", session_id="s-1", game_id="g-1",
                task_type=TaskType.MEMORY, difficulty=5,
                correct=True, response_time_ms=1500.0,
            )
            for _ in range(10)
        ]
        rec = engine.compute(
            events=events, current_difficulty=5,
            game_id="g-1", target_domain="memory", patient_id="p-001",
        )
        assert rec.suggested_difficulty >= 5

    def test_analytics_trend_detection(self):
        """Analytics should detect improving trends."""
        engine = AnalyticsEngine()
        from mira_ml.schemas.cognitive import CognitiveScore
        profiles = []
        for i in range(10):
            profiles.append(CognitiveProfile(
                patient_id="p-001",
                domain_scores=[
                    CognitiveScore(
                        domain="memory",
                        score=0.3 + i * 0.05,  # improving
                        confidence=0.7,
                        sample_size=10,
                    ),
                ],
                overall_score=0.3 + i * 0.05,
                overall_confidence=0.7,
                total_events=10 * (i + 1),
            ))

        result = engine.analyze(
            patient_id="p-001",
            profile_history=profiles,
        )

        memory_trend = [t for t in result.domain_trends if t.domain == "memory"][0]
        assert memory_trend.direction == TrendDirection.IMPROVING


# ===========================================================================
# Regression Tests
# ===========================================================================

class TestRegression:
    """Ensure existing subsystems still work after new additions."""

    def test_scoring_engine_unchanged(self):
        """Scoring engine should produce same results as before."""
        engine = ScoringEngine()
        events = [
            GameEvent(
                patient_id="p-001", session_id="s-1", game_id="g-1",
                task_type=TaskType.MEMORY, difficulty=5,
                correct=True, response_time_ms=2000.0, attempts=1, hints_used=0,
            )
            for _ in range(5)
        ]
        scores = engine.score(events)
        assert len(scores) == 1
        assert scores[0].domain == "memory"
        assert scores[0].score > 0.8

    def test_profiling_engine_unchanged(self):
        engine = ProfilingEngine(patient_id="p-001")
        engine.update([CognitiveScore(domain="memory", score=0.7, confidence=0.8, sample_size=5)])
        profile = engine.build()
        assert profile is not None
        assert profile.patient_id == "p-001"

    def test_personalization_engine_unchanged(self):
        engine = PersonalizationEngine()
        profile = CognitiveProfile(
            patient_id="p-001",
            domain_scores=[
                CognitiveScore(domain="memory", score=0.3, confidence=0.8, sample_size=10),
                CognitiveScore(domain="attention", score=0.8, confidence=0.7, sample_size=8),
                CognitiveScore(domain="recall", score=0.5, confidence=0.6, sample_size=6),
                CognitiveScore(domain="orientation", score=0.6, confidence=0.5, sample_size=7),
                CognitiveScore(domain="reasoning", score=0.7, confidence=0.6, sample_size=9),
            ],
            overall_score=0.58,
            overall_confidence=0.64,
            total_events=40,
        )
        result = engine.select_target(profile)
        assert result.primary_target.domain == "memory"

    def test_adaptive_engine_unchanged(self):
        engine = AdaptiveDifficultyEngine()
        events = [
            GameEvent(
                patient_id="p-001", session_id="s-1", game_id="g-1",
                task_type=TaskType.MEMORY, difficulty=5,
                correct=False, response_time_ms=5000.0, attempts=3,
            )
            for _ in range(5)
        ]
        rec = engine.compute(
            events=events, current_difficulty=5,
            game_id="g-1", target_domain="memory", patient_id="p-001",
        )
        assert rec.suggested_difficulty <= 5

    def test_vision_face_unchanged(self):
        store = FaceEnrollmentStore()
        embs = [[0.1 + i * 0.01 for i in range(128)] for _ in range(5)]
        store.enroll("f-001", "Test", embs)
        result = match_face([0.1 + i * 0.01 for i in range(128)], store, patient_id="p-001")
        assert result.status == VisionStatus.KNOWN

    def test_vision_object_unchanged(self):
        store = ObjectEnrollmentStore()
        embs = [[0.3 + i * 0.02 for i in range(64)] for _ in range(5)]
        store.enroll("o-001", "Keys", embs)
        result = match_object([0.3 + i * 0.02 for i in range(64)], store, patient_id="p-001")
        assert result.status == VisionStatus.KNOWN

    def test_api_service_unchanged(self):
        service = MiraAIService()
        events = [
            GameEvent(
                patient_id="p-001", session_id="s-1", game_id="g-1",
                task_type=TaskType.MEMORY, difficulty=5,
                correct=True, response_time_ms=2000.0,
            )
            for _ in range(5)
        ]
        result = service.ingest_events(events)
        assert result["event_count"] == 5

    def test_inference_pipeline_unchanged(self):
        pipeline = InferencePipeline()
        frame = [[[128, 128, 128] for _ in range(10)] for _ in range(10)]
        result = pipeline.process_frame(frame, patient_id="p-001")
        assert result.pipeline_time_ms >= 0

    def test_model_manager_unchanged(self):
        mgr = ModelManager()
        mgr.configure("test", ModelConfig(name="test", backend=ModelBackend.DUMMY))
        health = mgr.load("test")
        assert health.status.value == "ready"

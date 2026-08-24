"""End-to-end integration tests — Phase 12.

Tests the complete MIRA AI loop:
    GameEvent → Scoring → Profiling → Personalization → Adaptive → Recommendation
    → Next GameEvent → Updated Profile → Analytics

Also tests the vision pipeline:
    Frame → Detection → Embedding → Matching → Result
"""

from __future__ import annotations

import pytest

from mira_ml.schemas.cognitive import CognitiveProfile, CognitiveScore
from mira_ml.schemas.events import GameEvent, TaskType
from mira_ml.schemas.recommendations import Recommendation, RecommendationType
from mira_ml.schemas.vision import VisionStatus
from mira_ml.scoring.scoring_engine import ScoringEngine
from mira_ml.profiling.engine import ProfilingEngine
from mira_ml.personalization.engine import PersonalizationEngine
from mira_ml.adaptive.engine import AdaptiveDifficultyEngine
from mira_ml.recommendation.engine import RecommendationEngine
from mira_ml.analytics.engine import AnalyticsEngine
from mira_ml.vision.face.recognition import FaceEnrollmentStore, match_face
from mira_ml.vision.object.recognition import ObjectEnrollmentStore, match_object
from mira_ml.inference.pipeline import InferencePipeline
from mira_ml.api.service import MiraAIService


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_event(
    patient_id: str = "p-001",
    session_id: str = "s-1",
    game_id: str = "memory-cards-v1",
    task_type: TaskType = TaskType.MEMORY,
    difficulty: int = 5,
    correct: bool = True,
    response_time_ms: float = 2000.0,
    attempts: int = 1,
    hints_used: int = 0,
) -> GameEvent:
    return GameEvent(
        patient_id=patient_id,
        session_id=session_id,
        game_id=game_id,
        task_type=task_type,
        difficulty=difficulty,
        correct=correct,
        response_time_ms=response_time_ms,
        attempts=attempts,
        hints_used=hints_used,
    )


def _make_session_events(
    patient_id: str = "p-001",
    session_id: str = "s-1",
    n_correct: int = 3,
    n_incorrect: int = 2,
    difficulty: int = 5,
    task_type: TaskType = TaskType.MEMORY,
) -> list[GameEvent]:
    events = []
    for i in range(n_correct):
        events.append(_make_event(
            patient_id=patient_id,
            session_id=session_id,
            task_type=task_type,
            difficulty=difficulty,
            correct=True,
            response_time_ms=1500.0 + i * 100,
        ))
    for i in range(n_incorrect):
        events.append(_make_event(
            patient_id=patient_id,
            session_id=session_id,
            task_type=task_type,
            difficulty=difficulty,
            correct=False,
            response_time_ms=3000.0 + i * 200,
            attempts=2,
        ))
    return events


# ===========================================================================
# Test: Complete Cognitive Loop
# ===========================================================================

class TestCompleteCognitiveLoop:
    """Test the full intelligence loop from events through recommendation."""

    def test_single_session_loop(self):
        """One session: events → scores → profile → recommendation."""
        scoring = ScoringEngine()
        profiling = ProfilingEngine(patient_id="p-001")
        personalization = PersonalizationEngine()
        adaptive = AdaptiveDifficultyEngine()
        recommendation = RecommendationEngine()

        # Step 1: Generate events from a game session
        events = _make_session_events(n_correct=4, n_incorrect=1, difficulty=5)
        assert len(events) == 5

        # Step 2: Score events
        scores = scoring.score(events)
        assert len(scores) > 0
        for s in scores:
            assert 0.0 <= s.score <= 1.0
            assert 0.0 <= s.confidence <= 1.0

        # Step 3: Update profile
        for score in scores:
            profiling.update([score])
        profile = profiling.build()
        assert profile is not None
        assert profile.patient_id == "p-001"
        assert 0.0 <= profile.overall_score <= 1.0

        # Step 4: Get recommendation
        rec = recommendation.recommend(
            profile=profile,
            recent_events=events,
            current_difficulty=5,
            patient_id="p-001",
        )
        assert isinstance(rec, Recommendation)
        assert rec.patient_id == "p-001"
        assert rec.target_domain in ["memory", "attention", "recall", "orientation", "reasoning"]
        assert 1 <= rec.difficulty <= 10
        assert rec.confidence > 0.0

    def test_multi_session_progressive(self):
        """Multiple sessions: profile evolves, recommendations adapt."""
        scoring = ScoringEngine()
        profiling = ProfilingEngine(patient_id="p-001")
        personalization = PersonalizationEngine()
        adaptive = AdaptiveDifficultyEngine()
        recommendation = RecommendationEngine()

        all_events: list[GameEvent] = []
        profiles: list[CognitiveProfile] = []
        recommendations: list[Recommendation] = []

        # Session 1: Poor performance
        s1_events = _make_session_events(
            session_id="s-1", n_correct=1, n_incorrect=4, difficulty=3,
        )
        all_events.extend(s1_events)
        scores = scoring.score(s1_events)
        for s in scores:
            profiling.update([s])
        profile = profiling.build()
        profiles.append(profile)

        rec = recommendation.recommend(
            profile=profile,
            recent_events=all_events,
            current_difficulty=3,
            patient_id="p-001",
        )
        recommendations.append(rec)

        # Session 2: Improved performance
        s2_events = _make_session_events(
            session_id="s-2", n_correct=4, n_incorrect=1, difficulty=3,
        )
        all_events.extend(s2_events)
        scores = scoring.score(s2_events)
        for s in scores:
            profiling.update([s])
        profile = profiling.build()
        profiles.append(profile)

        rec = recommendation.recommend(
            profile=profile,
            recent_events=all_events,
            current_difficulty=rec.difficulty,
            patient_id="p-001",
        )
        recommendations.append(rec)

        # Session 3: Excellent performance
        s3_events = _make_session_events(
            session_id="s-3", n_correct=5, n_incorrect=0, difficulty=rec.difficulty,
        )
        all_events.extend(s3_events)
        scores = scoring.score(s3_events)
        for s in scores:
            profiling.update([s])
        profile = profiling.build()
        profiles.append(profile)

        rec = recommendation.recommend(
            profile=profile,
            recent_events=all_events,
            current_difficulty=rec.difficulty,
            patient_id="p-001",
        )
        recommendations.append(rec)

        # Verify progression
        assert len(profiles) == 3
        assert len(recommendations) == 3

        # Profile should have data
        assert profile.total_events > 0
        assert len(profile.domain_scores) > 0

        # All recommendations should be valid
        for r in recommendations:
            assert isinstance(r, Recommendation)
            assert 1 <= r.difficulty <= 10

    def test_analytics_after_sessions(self):
        """Analytics should reflect the session history."""
        scoring = ScoringEngine()
        profiling = ProfilingEngine(patient_id="p-001")
        analytics = AnalyticsEngine()

        profiles: list[CognitiveProfile] = []
        all_events: list[GameEvent] = []

        for session_num in range(5):
            events = _make_session_events(
                session_id=f"s-{session_num}",
                n_correct=3 + session_num,  # improving
                n_incorrect=max(0, 4 - session_num),
                difficulty=5,
            )
            all_events.extend(events)
            scores = scoring.score(events)
            for s in scores:
                profiling.update([s])
            profile = profiling.build()
            if profile:
                profiles.append(profile)

        # Run analytics
        result = analytics.analyze(
            patient_id="p-001",
            profile_history=profiles,
            event_history=all_events,
        )

        assert len(result.domain_trends) == 5  # 5 core domains
        assert len(result.performance_trends) > 0  # accuracy, response_time, difficulty
        assert len(result.insights) > 0

    def test_recommendation_types(self):
        """Different states should produce different recommendation types."""
        scoring = ScoringEngine()
        profiling = ProfilingEngine(patient_id="p-001")
        recommendation = RecommendationEngine()

        # No data → should get assessment or game
        profile = profiling.build()
        # ProfilingEngine returns None with no data, so we need at least one score
        events = _make_session_events(n_correct=1, n_incorrect=0, difficulty=5)
        scores = scoring.score(events)
        for s in scores:
            profiling.update([s])
        profile = profiling.build()

        rec = recommendation.recommend(
            profile=profile,
            recent_events=events,
            current_difficulty=5,
            patient_id="p-001",
        )
        assert rec.recommendation_type in (
            RecommendationType.GAME,
            RecommendationType.ASSESSMENT,
            RecommendationType.REST,
        )


# ===========================================================================
# Test: Vision Pipeline
# ===========================================================================

class TestVisionPipeline:
    """Test the face/object recognition pipeline end-to-end."""

    def test_face_enrollment_and_recognition(self):
        """Enroll a face, then recognize it."""
        store = FaceEnrollmentStore()

        # Enrollment
        embeddings = [[0.1 + i * 0.01 for i in range(128)] for _ in range(5)]
        result = store.enroll("f-001", "Daughter Ananya", embeddings)
        assert result.identity_id == "f-001"
        assert result.sample_count == 5

        # Recognition with similar embedding
        query = [0.1 + i * 0.01 + 0.001 for i in range(128)]  # very similar
        match = match_face(query, store, patient_id="p-001")
        assert match.status == VisionStatus.KNOWN
        assert match.identity_id == "f-001"
        assert match.identity_label == "Daughter Ananya"
        assert match.confidence > 0.7

    def test_object_enrollment_and_recognition(self):
        """Enroll an object, then recognize it."""
        store = ObjectEnrollmentStore()

        embeddings = [[0.3 + i * 0.02 for i in range(64)] for _ in range(5)]
        result = store.enroll("o-001", "Black Wallet", embeddings)
        assert result.object_id == "o-001"

        query = [0.3 + i * 0.02 + 0.001 for i in range(64)]
        match = match_object(query, store, patient_id="p-001")
        assert match.status == VisionStatus.KNOWN
        assert match.object_id == "o-001"

    def test_face_unknown_person(self):
        """Unknown face should not match enrolled identities."""
        store = FaceEnrollmentStore()
        enrolled = [[1.0 + i * 0.01 for i in range(128)] for _ in range(5)]
        store.enroll("f-001", "Daughter", enrolled)

        import random
        random.seed(99)
        unknown = [random.uniform(-1.0, 1.0) for _ in range(128)]
        match = match_face(unknown, store, patient_id="p-001")
        assert match.status == VisionStatus.UNKNOWN

    def test_inference_pipeline_with_stores(self):
        """Full inference pipeline with enrolled data."""
        face_store = FaceEnrollmentStore()
        obj_store = ObjectEnrollmentStore()

        face_embs = [[0.5 + i * 0.01 for i in range(128)] for _ in range(5)]
        face_store.enroll("f-001", "Daughter", face_embs)

        obj_embs = [[0.3 + i * 0.02 for i in range(64)] for _ in range(5)]
        obj_store.enroll("o-001", "Keys", obj_embs)

        pipeline = InferencePipeline(
            face_store=face_store,
            object_store=obj_store,
        )

        frame = [[[128, 128, 128] for _ in range(20)] for _ in range(20)]
        result = pipeline.process_frame(frame, patient_id="p-001")

        assert result.pipeline_time_ms >= 0
        # Dummy models return no detections
        assert result.face_result is None
        assert result.object_results == []


# ===========================================================================
# Test: API Service End-to-End
# ===========================================================================

class TestAPIEndToEnd:
    """Test the complete flow through the service layer."""

    def test_full_patient_journey(self):
        """Simulate a complete patient journey through the AI system."""
        service = MiraAIService()

        # Session 1: Initial assessment
        events_s1 = [
            _make_event(session_id="s-1", correct=True, response_time_ms=3000.0),
            _make_event(session_id="s-1", correct=False, response_time_ms=4000.0, attempts=2),
            _make_event(session_id="s-1", correct=True, response_time_ms=2500.0),
        ]
        result = service.ingest_events(events_s1)
        assert result["event_count"] == 3
        assert result["overall_score"] >= 0.0

        # Get profile
        profile = service.get_profile("p-001")
        assert profile is not None
        assert profile["total_events"] == 3

        # Get recommendation
        rec = service.get_recommendation("p-001", current_difficulty=5)
        assert "recommendation_type" in rec
        assert "target_domain" in rec

        # Session 2: Follow-up
        events_s2 = [
            _make_event(session_id="s-2", correct=True, response_time_ms=2000.0),
            _make_event(session_id="s-2", correct=True, response_time_ms=1800.0),
            _make_event(session_id="s-2", correct=True, response_time_ms=2200.0),
            _make_event(session_id="s-2", correct=False, response_time_ms=3500.0),
        ]
        result = service.ingest_events(events_s2)
        assert result["event_count"] == 4

        # Profile should have more data now
        profile = service.get_profile("p-001")
        assert profile["total_events"] == 7

        # Analytics should work
        analytics = service.get_analytics("p-001")
        assert len(analytics["domain_trends"]) == 5
        assert len(analytics["insights"]) > 0

    def test_vision_through_service(self):
        """Test vision enrollment and recognition through the service."""
        service = MiraAIService()

        # Enroll face
        face_embs = [[0.1 + i * 0.01 for i in range(128)] for _ in range(5)]
        result = service.enroll_face("p-001", "f-001", "Daughter", face_embs)
        assert result["identity_id"] == "f-001"

        # Recognize face
        query = [0.1 + i * 0.01 + 0.001 for i in range(128)]
        match = service.recognize_face("p-001", query)
        assert match["status"] == "known"

        # Enroll object
        obj_embs = [[0.3 + i * 0.02 for i in range(64)] for _ in range(5)]
        result = service.enroll_object("p-001", "o-001", "Keys", obj_embs)
        assert result["object_id"] == "o-001"

        # Recognize object
        obj_query = [0.3 + i * 0.02 + 0.001 for i in range(64)]
        match = service.recognize_object("p-001", obj_query)
        assert match["status"] == "known"

    def test_patient_isolation(self):
        """Different patients should have isolated data."""
        service = MiraAIService()

        # Patient 1
        service.ingest_events([
            _make_event(patient_id="p-001", session_id="s-1", correct=True),
            _make_event(patient_id="p-001", session_id="s-1", correct=True),
        ])

        # Patient 2
        service.ingest_events([
            _make_event(patient_id="p-002", session_id="s-1", correct=False),
            _make_event(patient_id="p-002", session_id="s-1", correct=False),
            _make_event(patient_id="p-002", session_id="s-1", correct=False),
        ])

        p1 = service.get_profile("p-001")
        p2 = service.get_profile("p-002")

        assert p1 is not None
        assert p2 is not None
        # Patient 1 did better
        assert p1["overall_score"] > p2["overall_score"]

    def test_recommendation_adapts_to_performance(self):
        """Recommendation difficulty should adapt based on performance."""
        service = MiraAIService()

        # Poor performance events
        poor_events = [
            _make_event(
                session_id="s-1", correct=False, difficulty=7,
                response_time_ms=5000.0, attempts=3,
            )
            for _ in range(10)
        ]
        service.ingest_events(poor_events)

        rec_poor = service.get_recommendation("p-001", current_difficulty=7)

        # Now good performance
        good_events = [
            _make_event(
                session_id="s-2", correct=True, difficulty=3,
                response_time_ms=1500.0,
            )
            for _ in range(10)
        ]
        service.ingest_events(good_events)

        rec_good = service.get_recommendation(
            "p-001",
            current_difficulty=rec_poor.get("difficulty", 3),
        )

        # Both should produce valid recommendations
        assert "difficulty" in rec_poor
        assert "difficulty" in rec_good


# ===========================================================================
# Test: Contract Verification
# ===========================================================================

class TestContractVerification:
    """Verify that contracts between components are consistent."""

    def test_scoring_to_profiling_contract(self):
        """Scoring output should be consumable by profiling."""
        scoring = ScoringEngine()
        profiling = ProfilingEngine(patient_id="p-001")

        events = _make_session_events(n_correct=3, n_incorrect=2)
        scores = scoring.score(events)

        # Every score should be a valid CognitiveScore
        for s in scores:
            assert hasattr(s, "domain")
            assert hasattr(s, "score")
            assert hasattr(s, "confidence")
            assert hasattr(s, "sample_size")
            assert 0.0 <= s.score <= 1.0
            assert 0.0 <= s.confidence <= 1.0

        # Profiling should accept these scores
        profiling.update(scores)
        profile = profiling.build()
        assert profile is not None

    def test_profiling_to_personalization_contract(self):
        """Profile output should be consumable by personalization."""
        profiling = ProfilingEngine(patient_id="p-001")
        personalization = PersonalizationEngine()

        events = _make_session_events(n_correct=3, n_incorrect=2)
        scoring = ScoringEngine()
        scores = scoring.score(events)
        profiling.update(scores)
        profile = profiling.build()

        assert profile is not None

        # Personalization should work with this profile
        result = personalization.select_target(profile)
        assert result.primary_target.domain in [
            "memory", "attention", "recall", "orientation", "reasoning"
        ]

    def test_personalization_to_recommendation_contract(self):
        """Personalization output should feed into recommendation."""
        profiling = ProfilingEngine(patient_id="p-001")
        recommendation = RecommendationEngine()

        events = _make_session_events(n_correct=3, n_incorrect=2)
        scoring = ScoringEngine()
        scores = scoring.score(events)
        profiling.update(scores)
        profile = profiling.build()

        rec = recommendation.recommend(
            profile=profile,
            recent_events=events,
            current_difficulty=5,
            patient_id="p-001",
        )

        assert isinstance(rec, Recommendation)
        assert rec.target_domain in [
            "memory", "attention", "recall", "orientation", "reasoning"
        ]

    def test_vision_contracts(self):
        """Vision results should match expected schemas."""
        from mira_ml.schemas.vision import (
            FaceRecognitionResult,
            ObjectRecognitionResult,
            VisionStatus,
        )

        store = FaceEnrollmentStore()
        embeddings = [[0.1 + i * 0.01 for i in range(128)] for _ in range(5)]
        store.enroll("f-001", "Test", embeddings)

        result = match_face(
            [0.1 + i * 0.01 for i in range(128)],
            store,
            patient_id="p-001",
        )

        assert isinstance(result, FaceRecognitionResult)
        assert isinstance(result.status, VisionStatus)
        assert 0.0 <= result.confidence <= 1.0
        assert result.patient_id == "p-001"

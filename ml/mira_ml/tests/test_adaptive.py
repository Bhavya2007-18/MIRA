"""Tests for AdaptiveDifficultyEngine and rules."""

from __future__ import annotations

import pytest
from datetime import datetime, timezone

from mira_ml.schemas.events import GameEvent, TaskType
from mira_ml.adaptive.engine import AdaptiveDifficultyEngine, DifficultyState
from mira_ml.adaptive.rules import AdaptiveConfig, clamp_difficulty


def _event(
    correct: bool = True,
    response_time_ms: float = 2000.0,
    difficulty: int = 5,
    hints_used: int = 0,
    skipped: bool = False,
    task_type: TaskType = TaskType.MEMORY,
    game_id: str = "CARD_MATCH",
) -> GameEvent:
    return GameEvent(
        patient_id="p-001",
        session_id="s-001",
        game_id=game_id,
        task_type=task_type,
        difficulty=difficulty,
        correct=correct,
        response_time_ms=response_time_ms,
        hints_used=hints_used,
        skipped=skipped,
    )


class TestAdaptiveDifficultyEngine:
    def setup_method(self):
        self.engine = AdaptiveDifficultyEngine()

    def test_clamp_difficulty(self):
        assert clamp_difficulty(0) == 1
        assert clamp_difficulty(11) == 10
        assert clamp_difficulty(6) == 6

    def test_empty_events_maintains_difficulty(self):
        rec = self.engine.evaluate_session(
            patient_id="p-001",
            game_id="CARD_MATCH",
            target_domain="memory",
            current_difficulty=5,
            events=[],
        )
        assert rec.suggested_difficulty == 5
        assert rec.adjustment == 0

    def test_all_skipped_steps_down(self):
        events = [_event(skipped=True) for _ in range(3)]
        rec = self.engine.evaluate_session(
            patient_id="p-001",
            game_id="CARD_MATCH",
            target_domain="memory",
            current_difficulty=5,
            events=events,
        )
        assert rec.suggested_difficulty == 4
        assert rec.adjustment == -1

    def test_single_high_performance_needs_consistency(self):
        # 1 perfect session should maintain to confirm consistency (min 3 required by default)
        events = [_event(correct=True, response_time_ms=1800.0) for _ in range(10)]
        rec = self.engine.evaluate_session(
            patient_id="p-001",
            game_id="CARD_MATCH",
            target_domain="memory",
            current_difficulty=5,
            events=events,
        )
        assert rec.suggested_difficulty == 5
        assert rec.adjustment == 0
        assert "maintaining to confirm consistency" in rec.reason

    def test_sustained_high_performance_increases_difficulty(self):
        events = [_event(correct=True, response_time_ms=1800.0) for _ in range(10)]
        # Run 3 consecutive high-accuracy sessions
        self.engine.evaluate_session("p-001", "CARD_MATCH", "memory", 5, events)
        self.engine.evaluate_session("p-001", "CARD_MATCH", "memory", 5, events)
        rec = self.engine.evaluate_session("p-001", "CARD_MATCH", "memory", 5, events)

        assert rec.suggested_difficulty == 6
        assert rec.adjustment == 1
        assert "High sustained accuracy" in rec.reason

    def test_poor_accuracy_immediately_decreases_difficulty(self):
        # 80% errors
        events = [_event(correct=False) for _ in range(8)] + [_event(correct=True) for _ in range(2)]
        rec = self.engine.evaluate_session(
            patient_id="p-001",
            game_id="CARD_MATCH",
            target_domain="memory",
            current_difficulty=5,
            events=events,
        )
        assert rec.suggested_difficulty <= 4
        assert rec.adjustment < 0
        assert "Stepping down difficulty" in rec.reason

    def test_excessive_hints_steps_down(self):
        events = [_event(correct=True, hints_used=3) for _ in range(4)]
        rec = self.engine.evaluate_session(
            patient_id="p-001",
            game_id="CARD_MATCH",
            target_domain="memory",
            current_difficulty=6,
            events=events,
        )
        assert rec.suggested_difficulty < 6
        assert rec.adjustment < 0

    def test_difficulty_does_not_exceed_max_or_min(self):
        # Test lower bound clamp
        events_fail = [_event(correct=False) for _ in range(5)]
        rec_min = self.engine.evaluate_session("p-001", "CARD_MATCH", "memory", 1, events_fail)
        assert rec_min.suggested_difficulty == 1

        # Test upper bound clamp
        events_pass = [_event(correct=True) for _ in range(10)]
        for _ in range(5):
            self.engine.evaluate_session("p-001", "CARD_MATCH", "memory", 10, events_pass)
        rec_max = self.engine.evaluate_session("p-001", "CARD_MATCH", "memory", 10, events_pass)
        assert rec_max.suggested_difficulty == 10

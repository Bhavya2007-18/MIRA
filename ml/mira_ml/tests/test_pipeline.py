"""End-to-end integration tests for MIRA closed-loop intelligence pipeline."""

from __future__ import annotations

import pytest

from mira_ml.schemas.events import GameEvent, TaskType
from mira_ml.pipeline import MIRAIntelligencePipeline


def _session_events(
    game_id: str,
    task_type: TaskType,
    accuracy_ratio: float = 1.0,
    difficulty: int = 5,
    count: int = 8,
) -> list[GameEvent]:
    events = []
    correct_count = int(count * accuracy_ratio)
    for i in range(count):
        events.append(
            GameEvent(
                patient_id="p-ner-01",
                session_id=f"sess-{game_id}",
                game_id=game_id,
                task_type=task_type,
                difficulty=difficulty,
                correct=(i < correct_count),
                response_time_ms=1600.0 + (i * 50),
            )
        )
    return events


class TestMIRAIntelligencePipeline:
    def setup_method(self):
        self.pipeline = MIRAIntelligencePipeline()

    def test_full_closed_loop_execution(self):
        # Session 1: Card Match (Memory domain)
        ev1 = _session_events("CARD_MATCH", TaskType.MEMORY, accuracy_ratio=1.0, difficulty=5)
        res1 = self.pipeline.process_game_session(patient_id="p-ner-01", events=ev1)

        assert res1.patient_id == "p-ner-01"
        assert len(res1.scores) == 1
        assert res1.scores[0].domain == "memory"
        assert res1.scores[0].score > 0.8
        assert res1.updated_profile is not None
        assert res1.next_recommendation is not None
        assert res1.caregiver_report is not None

        # Session 2: Auditory Recall (Recall domain)
        ev2 = _session_events("AUDITORY_RECALL", TaskType.RECALL, accuracy_ratio=0.5, difficulty=4)
        res2 = self.pipeline.process_game_session(patient_id="p-ner-01", events=ev2)

        # Profile now includes both memory and recall
        profile = self.pipeline.get_profile("p-ner-01")
        assert profile is not None
        domains = {ds.domain for ds in profile.domain_scores}
        assert domains == {"memory", "recall"}

        # Because recall scored lower (0.5), next recommendation should prioritize recall
        assert res2.next_recommendation.target_domain == "recall"
        assert res2.next_recommendation.target_game_id == "AUDITORY_RECALL"

    def test_multi_session_adaptive_difficulty_progression(self):
        # 3 high-accuracy sessions on CARD_MATCH
        for _ in range(3):
            ev = _session_events("CARD_MATCH", TaskType.MEMORY, accuracy_ratio=1.0, difficulty=5)
            res = self.pipeline.process_game_session(patient_id="p-ner-01", events=ev)

        # Difficulty should step up to 6
        assert res.difficulty_recommendation.suggested_difficulty == 6
        assert res.difficulty_recommendation.adjustment == 1

    def test_caregiver_report_reflects_history(self):
        ev = _session_events("CARD_MATCH", TaskType.MEMORY, accuracy_ratio=0.9, difficulty=5)
        self.pipeline.process_game_session(patient_id="p-ner-01", events=ev)

        report = self.pipeline.get_caregiver_report("p-ner-01")
        assert report.patient_id == "p-ner-01"
        assert report.stability_score >= 70.0
        assert len(report.headline_insight) > 0

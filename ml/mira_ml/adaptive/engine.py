"""Adaptive difficulty engine.

Evaluates multi-signal patient performance (accuracy, reaction time, attempts,
hints, error streaks) to recommend safe difficulty adjustments.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime

from mira_ml.schemas.events import GameEvent
from mira_ml.schemas.recommendations import DifficultyRecommendation
from mira_ml.scoring.features import DomainFeatures
from mira_ml.scoring.engine import DOMAIN_RT_REFERENCES, DEFAULT_RT_REFERENCE
from mira_ml.adaptive.rules import AdaptiveConfig, DEFAULT_ADAPTIVE_CONFIG, clamp_difficulty


@dataclass
class DifficultyState:
    """State tracking for a patient's difficulty progression in a game/domain."""

    current_difficulty: int = 5
    consecutive_successes: int = 0
    consecutive_failures: int = 0
    total_adjustments: int = 0
    last_updated: datetime = field(default_factory=lambda: datetime.now(UTC))


class AdaptiveDifficultyEngine:
    """Computes difficulty adjustments based on multi-signal behavioral metrics.

    Usage:
        engine = AdaptiveDifficultyEngine()
        rec = engine.evaluate_session(
            patient_id="p-001",
            game_id="card-match",
            target_domain="memory",
            current_difficulty=5,
            events=session_events,
        )
    """

    def __init__(self, config: AdaptiveConfig | None = None) -> None:
        self.config = config or DEFAULT_ADAPTIVE_CONFIG
        self._states: dict[tuple[str, str], DifficultyState] = {}

    def get_or_create_state(
        self, patient_id: str, game_id: str, initial_difficulty: int = 5
    ) -> DifficultyState:
        """Retrieve or initialize patient difficulty state."""
        key = (patient_id, game_id)
        if key not in self._states:
            self._states[key] = DifficultyState(
                current_difficulty=clamp_difficulty(
                    initial_difficulty,
                    self.config.min_difficulty,
                    self.config.max_difficulty,
                )
            )
        return self._states[key]

    def evaluate_session(
        self,
        patient_id: str,
        game_id: str,
        target_domain: str,
        current_difficulty: int,
        events: list[GameEvent],
    ) -> DifficultyRecommendation:
        """Evaluate a batch of events from a session and determine next difficulty.

        Args:
            patient_id: Patient unique ID.
            game_id: Game identifier.
            target_domain: Cognitive domain targeted.
            current_difficulty: Difficulty level during the session.
            events: List of GameEvents recorded during the session.

        Returns:
            DifficultyRecommendation with suggested adjustment and rationale.
        """
        state = self.get_or_create_state(patient_id, game_id, current_difficulty)
        state.current_difficulty = current_difficulty

        if not events:
            return DifficultyRecommendation(
                patient_id=patient_id,
                game_id=game_id,
                target_domain=target_domain,
                current_difficulty=current_difficulty,
                suggested_difficulty=current_difficulty,
                adjustment=0,
                reason="No events to evaluate; maintaining current difficulty level.",
                confidence=0.1,
            )

        non_skipped = [e for e in events if not e.skipped]
        if not non_skipped:
            return DifficultyRecommendation(
                patient_id=patient_id,
                game_id=game_id,
                target_domain=target_domain,
                current_difficulty=current_difficulty,
                suggested_difficulty=max(self.config.min_difficulty, current_difficulty - 1),
                adjustment=max(self.config.min_difficulty, current_difficulty - 1) - current_difficulty,
                reason="All tasks were skipped; gently reducing difficulty to ease frustration.",
                confidence=0.7,
            )

        n = len(non_skipped)
        correct_count = sum(1 for e in non_skipped if e.correct)
        total_hints = sum(e.hints_used for e in non_skipped)
        total_attempts = sum(e.attempts for e in non_skipped)
        avg_rt = sum(e.response_time_ms for e in non_skipped) / n

        # Raw accuracy & hint-corrected accuracy
        raw_accuracy = correct_count / n
        hint_penalty = total_hints * 0.5
        accuracy = max(0.0, (correct_count - hint_penalty) / n)

        # Expected baseline response time for target domain
        expected_rt = DOMAIN_RT_REFERENCES.get(target_domain.lower(), DEFAULT_RT_REFERENCE)
        is_slow = avg_rt > (expected_rt * self.config.slow_response_ratio_threshold)

        # Determine adjustment
        cfg = self.config
        adjustment = 0
        reason_parts: list[str] = []
        confidence = 0.85

        if accuracy >= cfg.upgrade_accuracy_threshold and not is_slow and total_hints == 0:
            state.consecutive_successes += 1
            state.consecutive_failures = 0

            if state.consecutive_successes >= cfg.min_consecutive_successes:
                if current_difficulty < cfg.max_difficulty:
                    adjustment = cfg.max_step_increase
                    reason_parts.append(
                        f"High sustained accuracy ({accuracy * 100:.0f}%) across {state.consecutive_successes} sessions"
                    )
                else:
                    adjustment = 0
                    reason_parts.append("Already at maximum difficulty ceiling (10)")
            else:
                adjustment = 0
                reason_parts.append(
                    f"Strong performance ({accuracy * 100:.0f}%); maintaining to confirm consistency ({state.consecutive_successes}/{cfg.min_consecutive_successes})"
                )

        elif accuracy <= cfg.downgrade_accuracy_threshold or total_hints >= cfg.excessive_hints_threshold:
            state.consecutive_failures += 1
            state.consecutive_successes = 0

            # Step down difficulty
            if accuracy <= 0.30 or total_hints >= 3:
                step_down = min(cfg.max_step_decrease, current_difficulty - cfg.min_difficulty)
            else:
                step_down = min(1, current_difficulty - cfg.min_difficulty)

            adjustment = -step_down
            if total_hints >= cfg.excessive_hints_threshold:
                reason_parts.append(f"Multiple hints used ({total_hints})")
            if accuracy <= cfg.downgrade_accuracy_threshold:
                reason_parts.append(f"Low accuracy ({accuracy * 100:.0f}%)")
            reason_parts.append("Stepping down difficulty to support patient confidence")

        else:
            # Steady performance in normal operating range
            state.consecutive_successes = 0
            state.consecutive_failures = 0
            adjustment = 0
            reason_parts.append(
                f"Stable performance ({accuracy * 100:.0f}%, RT {avg_rt:.0f}ms); maintaining difficulty {current_difficulty}"
            )

        suggested = clamp_difficulty(
            current_difficulty + adjustment,
            cfg.min_difficulty,
            cfg.max_difficulty,
        )
        actual_adjustment = suggested - current_difficulty

        state.current_difficulty = suggested
        state.last_updated = datetime.now(UTC)
        if actual_adjustment != 0:
            state.total_adjustments += 1

        return DifficultyRecommendation(
            patient_id=patient_id,
            game_id=game_id,
            target_domain=target_domain,
            current_difficulty=current_difficulty,
            suggested_difficulty=suggested,
            adjustment=actual_adjustment,
            reason="; ".join(reason_parts),
            confidence=confidence,
        )

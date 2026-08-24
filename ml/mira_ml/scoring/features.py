"""Feature extraction from GameEvent sequences.

Separates raw event data from derived statistical features.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from statistics import mean, stdev

from mira_ml.schemas.events import GameEvent


@dataclass(frozen=True)
class DomainFeatures:
    """Aggregated features for a single cognitive domain."""

    domain: str
    event_count: int
    skipped_count: int

    # Raw aggregates
    correct_count: int
    total_attempts: int
    total_hints: int
    response_times_ms: list[float]
    difficulties: list[int]

    # Derived metrics
    accuracy: float          # 0-1, hint-corrected
    avg_response_time_ms: float
    response_time_cv: float  # coefficient of variation (0 = perfect consistency)
    efficiency: float        # 0-1, accounts for attempts + hints
    difficulty_level: float  # average difficulty of attempted tasks
    recent_accuracy: float   # accuracy on last 20% of events (trend signal)


class FeatureExtractor:
    """Extracts features from a list of GameEvents grouped by domain."""

    def extract(self, events: list[GameEvent]) -> dict[str, DomainFeatures]:
        """Group events by task_type and compute features per domain.

        Returns a dict keyed by domain name (e.g. "memory", "attention").
        """
        by_domain: dict[str, list[GameEvent]] = {}
        for e in events:
            domain = e.task_type.value
            if domain in ("other", "recognition"):
                continue  # skip unmapped task types
            by_domain.setdefault(domain, []).append(e)

        return {domain: self._compute_features(domain, evts)
                for domain, evts in by_domain.items()}

    def _compute_features(self, domain: str, events: list[GameEvent]) -> DomainFeatures:
        non_skipped = [e for e in events if not e.skipped]
        skipped = [e for e in events if e.skipped]
        n = len(non_skipped)

        if n == 0:
            return DomainFeatures(
                domain=domain,
                event_count=len(events),
                skipped_count=len(skipped),
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

        correct = sum(1 for e in non_skipped if e.correct)
        attempts = sum(e.attempts for e in non_skipped)
        hints = sum(e.hints_used for e in non_skipped)
        times = [e.response_time_ms for e in non_skipped]
        diffs = [e.difficulty for e in non_skipped]

        # Accuracy: hint-corrected
        # Hints reduce the "true" correctness — a hinted correct answer
        # counts as 0.5 of a correct answer.
        hint_penalty = hints * 0.5
        raw_accuracy = correct / n
        hint_corrected_accuracy = max(0.0, (correct - hint_penalty) / n)

        # Average response time
        avg_time = mean(times)

        # Response time consistency (coefficient of variation)
        if n >= 2 and avg_time > 0:
            rt_cv = stdev(times) / avg_time
        else:
            rt_cv = 0.0

        # Efficiency: 1.0 = perfect (1 attempt, 0 hints, correct), degrades with more
        avg_attempts = attempts / n
        avg_hints = hints / n
        efficiency = max(0.0, 1.0 - (avg_attempts - 1) * 0.15 - avg_hints * 0.2)

        # Average difficulty
        avg_difficulty = mean(diffs)

        # Recent accuracy (last 20% of events, min 1)
        recent_n = max(1, n // 5)
        recent = non_skipped[-recent_n:]
        recent_correct = sum(1 for e in recent if e.correct)
        recent_accuracy = recent_correct / len(recent)

        return DomainFeatures(
            domain=domain,
            event_count=len(events),
            skipped_count=len(skipped),
            correct_count=correct,
            total_attempts=attempts,
            total_hints=hints,
            response_times_ms=times,
            difficulties=diffs,
            accuracy=hint_corrected_accuracy,
            avg_response_time_ms=avg_time,
            response_time_cv=rt_cv,
            efficiency=efficiency,
            difficulty_level=avg_difficulty,
            recent_accuracy=recent_accuracy,
        )

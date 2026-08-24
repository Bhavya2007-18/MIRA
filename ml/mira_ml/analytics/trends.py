"""Time-series trend analysis for reaction times, accuracy, and cognitive stability."""

from __future__ import annotations

from dataclasses import dataclass
from statistics import mean, stdev
from typing import Sequence

from mira_ml.schemas.events import GameEvent
from mira_ml.schemas.cognitive import CognitiveProfile


@dataclass(frozen=True)
class TrendPoint:
    """A single time-series point."""
    timestamp_str: str
    value: float


@dataclass(frozen=True)
class ReactionTrendResult:
    """Result of reaction time trend regression analysis."""
    avg_reaction_ms: float
    slope_ms_per_session: float  # Negative = improving (faster), positive = slowing
    trend_description: str        # e.g., "-80ms (Faster)"
    is_improving: bool
    data_points: list[TrendPoint]


@dataclass(frozen=True)
class AccuracyTrendResult:
    """Result of accuracy progression analysis."""
    overall_accuracy: float
    recent_accuracy: float
    accuracy_delta: float
    is_stable: bool
    breakdown_by_game: dict[str, float]


def compute_reaction_trend(events: Sequence[GameEvent]) -> ReactionTrendResult:
    """Compute linear trend and average reaction times across events.

    Args:
        events: Chronologically ordered GameEvents.

    Returns:
        ReactionTrendResult summarizing velocity and directional change.
    """
    valid = [e for e in events if not e.skipped and e.response_time_ms > 0]
    if not valid:
        return ReactionTrendResult(
            avg_reaction_ms=1400.0,
            slope_ms_per_session=0.0,
            trend_description="No reaction telemetry recorded",
            is_improving=False,
            data_points=[],
        )

    times = [e.response_time_ms for e in valid]
    avg_rt = mean(times)
    n = len(times)

    data_points = [
        TrendPoint(
            timestamp_str=e.timestamp.strftime("%b %d"),
            value=round(e.response_time_ms, 1),
        )
        for e in valid[-14:]  # Last 14 sessions
    ]

    if n < 3:
        return ReactionTrendResult(
            avg_reaction_ms=round(avg_rt, 1),
            slope_ms_per_session=0.0,
            trend_description="Insufficient data for trend estimation",
            is_improving=False,
            data_points=data_points,
        )

    # Simple linear regression (slope) over the sequence
    x_mean = (n - 1) / 2.0
    numerator = sum((i - x_mean) * (times[i] - avg_rt) for i in range(n))
    denominator = sum((i - x_mean) ** 2 for i in range(n))

    slope = numerator / denominator if denominator != 0 else 0.0

    # Negative slope means reaction times are getting lower (faster = improving)
    is_improving = slope < -10.0
    if slope < -20.0:
        trend_desc = f"{slope:.0f}ms/session (Faster)"
    elif slope > 20.0:
        trend_desc = f"+{slope:.0f}ms/session (Slower)"
    else:
        trend_desc = "Stable (±15ms)"

    return ReactionTrendResult(
        avg_reaction_ms=round(avg_rt, 1),
        slope_ms_per_session=round(slope, 2),
        trend_description=trend_desc,
        is_improving=is_improving,
        data_points=data_points,
    )


def compute_accuracy_trend(events: Sequence[GameEvent]) -> AccuracyTrendResult:
    """Compute overall and game-wise accuracy breakdown."""
    valid = [e for e in events if not e.skipped]
    if not valid:
        return AccuracyTrendResult(
            overall_accuracy=0.0,
            recent_accuracy=0.0,
            accuracy_delta=0.0,
            is_stable=True,
            breakdown_by_game={},
        )

    total_correct = sum(1 for e in valid if e.correct)
    overall_acc = total_correct / len(valid)

    # Recent accuracy (last 25% of events)
    recent_count = max(1, len(valid) // 4)
    recent_events = valid[-recent_count:]
    recent_correct = sum(1 for e in recent_events if e.correct)
    recent_acc = recent_correct / len(recent_events)
    delta = recent_acc - overall_acc

    # Breakdown by game_id
    games_map: dict[str, list[GameEvent]] = {}
    for e in valid:
        games_map.setdefault(e.game_id, []).append(e)

    breakdown = {}
    for gid, g_events in games_map.items():
        g_correct = sum(1 for e in g_events if e.correct)
        breakdown[gid] = round((g_correct / len(g_events)) * 100, 1)

    return AccuracyTrendResult(
        overall_accuracy=round(overall_acc * 100, 1),
        recent_accuracy=round(recent_acc * 100, 1),
        accuracy_delta=round(delta * 100, 1),
        is_stable=abs(delta) < 0.15,
        breakdown_by_game=breakdown,
    )


def compute_stability_score(profile: CognitiveProfile | None, events: Sequence[GameEvent]) -> float:
    """Calculate overall cognitive stability index (0.0 to 100.0%).

    Combines:
    - Domain score consistency (low variance = higher stability)
    - Profile overall confidence
    - Accuracy consistency
    """
    if profile is None or not profile.domain_scores:
        return 75.0  # Default initial baseline

    scores = [ds.score for ds in profile.domain_scores]
    mean_score = mean(scores)
    score_variance = stdev(scores) if len(scores) > 1 else 0.1

    # Stability is high when scores are balanced and confidence is high
    base_stability = mean_score * 70.0
    consistency_bonus = max(0.0, 20.0 - (score_variance * 30.0))
    confidence_factor = profile.overall_confidence * 10.0

    calculated = base_stability + consistency_bonus + confidence_factor
    return round(max(40.0, min(99.0, calculated)), 1)

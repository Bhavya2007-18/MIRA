"""Anomaly and change detection for cognitive performance monitoring.

Detects meaningful unusual changes while avoiding false positives
from single noisy observations. This is monitoring, NOT diagnosis.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from statistics import mean, stdev

from mira_ml.schemas.cognitive import CognitiveProfile
from mira_ml.schemas.events import GameEvent


class AnomalySeverity(str, Enum):
    """Severity of a detected anomaly."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


@dataclass(frozen=True)
class Anomaly:
    """A detected anomaly in performance data."""

    metric: str
    domain: str
    observed_value: float
    baseline_value: float
    severity: AnomalySeverity
    confidence: float
    explanation: str


@dataclass(frozen=True)
class AnomalyConfig:
    """Configuration for anomaly detection."""

    min_baseline: int = 3
    threshold_std: float = 2.0
    min_consecutive: int = 2


DEFAULT_ANOMALY_CONFIG = AnomalyConfig()


def detect_score_anomalies(
    profile_history: list[CognitiveProfile],
    config: AnomalyConfig | None = None,
) -> list[Anomaly]:
    """Detect anomalies in domain scores across profile history."""
    cfg = config or DEFAULT_ANOMALY_CONFIG
    anomalies: list[Anomaly] = []

    if len(profile_history) < cfg.min_baseline + 1:
        return anomalies

    domains: dict[str, list[float]] = {}
    for profile in profile_history:
        for cs in profile.domain_scores:
            domains.setdefault(cs.domain, []).append(cs.score)

    for domain, scores in domains.items():
        if len(scores) < cfg.min_baseline + 1:
            continue

        baseline = scores[: -1]
        recent = scores[-cfg.min_consecutive:]

        if len(baseline) < cfg.min_baseline:
            continue

        b_mean = mean(baseline)
        b_std = stdev(baseline) if len(baseline) >= 2 else 0.1

        if b_std == 0:
            b_std = 0.05

        anomalous_count = 0
        for val in recent:
            z_score = abs(val - b_mean) / b_std
            if z_score > cfg.threshold_std:
                anomalous_count += 1

        if anomalous_count >= cfg.min_consecutive:
            recent_mean = mean(recent)
            change = recent_mean - b_mean

            if change < 0:
                severity = AnomalySeverity.HIGH if abs(change) > 0.2 else (
                    AnomalySeverity.MEDIUM if abs(change) > 0.1 else AnomalySeverity.LOW
                )
                explanation = (
                    f"{domain} score dropped to {recent_mean:.2f} from baseline {b_mean:.2f} "
                    f"over {len(recent)} consecutive observations."
                )
            else:
                severity = AnomalySeverity.LOW
                explanation = (
                    f"{domain} score rose to {recent_mean:.2f} from baseline {b_mean:.2f} "
                    f"(unusual positive change)."
                )

            confidence = min(1.0, anomalous_count / cfg.min_consecutive) * min(1.0, len(scores) / 10.0)

            anomalies.append(Anomaly(
                metric="domain_score",
                domain=domain,
                observed_value=round(recent_mean, 4),
                baseline_value=round(b_mean, 4),
                severity=severity,
                confidence=round(confidence, 4),
                explanation=explanation,
            ))

    return anomalies


def detect_event_anomalies(
    events: list[GameEvent],
    config: AnomalyConfig | None = None,
) -> list[Anomaly]:
    """Detect anomalies in event-level data (response time, errors, etc.)."""
    cfg = config or DEFAULT_ANOMALY_CONFIG
    anomalies: list[Anomaly] = []

    non_skipped = [e for e in events if not e.skipped]
    if len(non_skipped) < cfg.min_baseline + 1:
        return anomalies

    times = [e.response_time_ms for e in non_skipped]
    baseline_times = times[: -cfg.min_consecutive]
    recent_times = times[-cfg.min_consecutive:]

    if len(baseline_times) >= cfg.min_baseline:
        t_mean = mean(baseline_times)
        t_std = stdev(baseline_times) if len(baseline_times) >= 2 else 1000.0
        if t_std == 0:
            t_std = 500.0

        recent_anomalous = sum(
            1 for t in recent_times if abs(t - t_mean) / t_std > cfg.threshold_std
        )

        if recent_anomalous >= cfg.min_consecutive:
            recent_mean = mean(recent_times)
            change = recent_mean - t_mean
            severity = AnomalySeverity.MEDIUM if abs(change) > 2000 else AnomalySeverity.LOW
            anomalies.append(Anomaly(
                metric="response_time",
                domain=non_skipped[0].task_type.value,
                observed_value=round(recent_mean, 2),
                baseline_value=round(t_mean, 2),
                severity=severity,
                confidence=round(min(1.0, recent_anomalous / cfg.min_consecutive), 4),
                explanation=(
                    f"Response time changed to {recent_mean:.0f}ms from baseline {t_mean:.0f}ms."
                ),
            ))

    errors = [1 if not e.correct else 0 for e in non_skipped]
    baseline_errors = errors[: -cfg.min_consecutive]
    recent_errors = errors[-cfg.min_consecutive:]

    if len(baseline_errors) >= cfg.min_baseline:
        e_mean = mean(baseline_errors)
        recent_error_rate = mean(recent_errors)

        if recent_error_rate > e_mean + 0.3 and recent_error_rate > 0.5:
            anomalies.append(Anomaly(
                metric="error_rate",
                domain=non_skipped[0].task_type.value,
                observed_value=round(recent_error_rate, 4),
                baseline_value=round(e_mean, 4),
                severity=AnomalySeverity.MEDIUM,
                confidence=round(min(1.0, len(non_skipped) / 10.0), 4),
                explanation=(
                    f"Error rate increased to {recent_error_rate:.0%} from baseline {e_mean:.0%}."
                ),
            ))

    return anomalies

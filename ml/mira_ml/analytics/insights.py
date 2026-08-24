"""Caregiver-facing AI insights generator and clinical stability alerts."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import Enum

from mira_ml.schemas.cognitive import CognitiveProfile
from mira_ml.analytics.trends import ReactionTrendResult, AccuracyTrendResult


class AlertSeverity(str, Enum):
    INFO = "info"
    POSITIVE = "positive"
    WARNING = "warning"
    CRITICAL = "critical"


@dataclass(frozen=True)
class CaregiverAlert:
    """Clinical or behavioral alert for caregivers."""
    id: str
    severity: AlertSeverity
    title: str
    message: str
    actionable_tip: str
    timestamp: datetime = field(default_factory=lambda: datetime.now(UTC))


@dataclass
class CaregiverReport:
    """Consolidated AI analytics report for the Caregiver Dashboard."""
    patient_id: str
    stability_score: float           # 0 to 100%
    stability_status: str            # e.g., "Optimal & Stable", "Mild Variance"
    headline_insight: str
    strengths_summary: list[str]
    weaknesses_summary: list[str]
    alerts: list[CaregiverAlert]
    recommended_action: str


def generate_caregiver_insights(
    profile: CognitiveProfile | None,
    reaction_trend: ReactionTrendResult,
    accuracy_trend: AccuracyTrendResult,
) -> CaregiverReport:
    """Produce comprehensive AI insights from profile and telemetry trends."""
    patient_id = profile.patient_id if profile else "unknown"
    alerts: list[CaregiverAlert] = []

    # 1. Evaluate Strengths and Weaknesses
    strengths = profile.strengths if profile else []
    weaknesses = profile.weaknesses if profile else []

    # 2. Evaluate Reaction Speed Alerts
    if reaction_trend.is_improving:
        alerts.append(
            CaregiverAlert(
                id=f"alert-rt-imp-{DateNow()}",
                severity=AlertSeverity.POSITIVE,
                title="Reaction Speed Improving",
                message=f"Average response time decreased by {abs(reaction_trend.slope_ms_per_session):.0f}ms across recent sessions.",
                actionable_tip="Continue daily 15-minute cognitive exercises during morning hours.",
            )
        )
    elif reaction_trend.slope_ms_per_session > 35.0:
        alerts.append(
            CaregiverAlert(
                id=f"alert-rt-slow-{DateNow()}",
                severity=AlertSeverity.WARNING,
                title="Increased Cognitive Latency",
                message="Patient exhibited slower response times in recent cognitive tasks (+40ms trend).",
                actionable_tip="Check for patient fatigue or disrupted sleep cycles before sessions.",
            )
        )

    # 3. Evaluate Accuracy Progression
    if accuracy_trend.accuracy_delta >= 10.0:
        alerts.append(
            CaregiverAlert(
                id=f"alert-acc-imp-{DateNow()}",
                severity=AlertSeverity.POSITIVE,
                title="Game Accuracy Surge",
                message=f"Recent accuracy rose to {accuracy_trend.recent_accuracy:.0f}% (+{accuracy_trend.accuracy_delta:.0f}% increase).",
                actionable_tip="Acknowledge and celebrate their achievement to boost emotional well-being.",
            )
        )
    elif accuracy_trend.accuracy_delta <= -20.0 and accuracy_trend.overall_accuracy > 0:
        alerts.append(
            CaregiverAlert(
                id=f"alert-acc-drop-{DateNow()}",
                severity=AlertSeverity.WARNING,
                title="Accuracy Fluctuations Detected",
                message=f"Recent accuracy dropped by {abs(accuracy_trend.accuracy_delta):.0f}% compared to historical baseline.",
                actionable_tip="Consider engaging with simpler heritage reminiscence cards or familiar auditory cues.",
            )
        )

    # 4. Generate Overall Status & Headline
    if not profile or profile.total_events < 5:
        stability_status = "Initial Assessment Stage"
        headline = "Gathering initial cognitive metrics across memory, recall, and reasoning."
        recommended_action = "Encourage patient to play 2-3 sessions to calibrate baseline."
        stability_score = 78.0
    else:
        if len(weaknesses) == 0 and profile.overall_score >= 0.70:
            stability_status = "Optimal & Stable"
            headline = f"Strong cognitive retention across {' and '.join(strengths) if strengths else 'all domains'}."
            recommended_action = "Maintain the current rehabilitation schedule."
            stability_score = min(98.0, 75.0 + (profile.overall_score * 24.0))
        elif len(weaknesses) > 0:
            stability_status = "Attention / Support Suggested"
            headline = f"Targeted reinforcement recommended for: {', '.join(weaknesses)}."
            recommended_action = f"Promote gentle daily practice targeting {weaknesses[0]} domain."
            stability_score = max(55.0, 50.0 + (profile.overall_score * 30.0))
        else:
            stability_status = "Moderate Stability"
            headline = "Cognitive scores are steady within expected longitudinal parameters."
            recommended_action = "Keep consistent session timing with voice prompts enabled."
            stability_score = 82.5

    return CaregiverReport(
        patient_id=patient_id,
        stability_score=round(stability_score, 1),
        stability_status=stability_status,
        headline_insight=headline,
        strengths_summary=strengths,
        weaknesses_summary=weaknesses,
        alerts=alerts,
        recommended_action=recommended_action,
    )


def DateNow() -> int:
    return int(datetime.now(UTC).timestamp())

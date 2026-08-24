"""AI Analytics Engine.

Orchestrates time-series trend extraction, stability scoring,
and caregiver clinical insights.
"""

from __future__ import annotations

from typing import Sequence

from mira_ml.schemas.events import GameEvent
from mira_ml.schemas.cognitive import CognitiveProfile
from mira_ml.analytics.trends import (
    compute_reaction_trend,
    compute_accuracy_trend,
    compute_stability_score,
    ReactionTrendResult,
    AccuracyTrendResult,
)
from mira_ml.analytics.insights import (
    generate_caregiver_insights,
    CaregiverReport,
    CaregiverAlert,
    AlertSeverity,
)


class AnalyticsEngine:
    """Consolidates game events and cognitive profile into actionable insights.

    Usage:
        engine = AnalyticsEngine()
        report = engine.generate_report(profile, events)
    """

    def generate_report(
        self,
        profile: CognitiveProfile | None,
        events: Sequence[GameEvent],
    ) -> CaregiverReport:
        """Generate a complete caregiver AI analytics report."""
        reaction_trend = compute_reaction_trend(events)
        accuracy_trend = compute_accuracy_trend(events)
        return generate_caregiver_insights(profile, reaction_trend, accuracy_trend)

    def get_reaction_trend(self, events: Sequence[GameEvent]) -> ReactionTrendResult:
        """Extract reaction time regression trajectory."""
        return compute_reaction_trend(events)

    def get_accuracy_trend(self, events: Sequence[GameEvent]) -> AccuracyTrendResult:
        """Extract accuracy breakdown by game."""
        return compute_accuracy_trend(events)

    def get_stability_score(
        self, profile: CognitiveProfile | None, events: Sequence[GameEvent]
    ) -> float:
        """Calculate single stability score index (0-100%)."""
        return compute_stability_score(profile, events)

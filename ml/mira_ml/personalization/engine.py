"""Personalization engine — determines WHAT cognitive domain to target next.

Consumes a CognitiveProfile + recent intervention history,
produces a ranked list of domain priorities for the next intervention.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from mira_ml.schemas.cognitive import CognitiveProfile
from mira_ml.personalization.policy import (
    DomainPriority,
    PriorityConfig,
    compute_domain_priorities,
)


# Core cognitive domains that the system targets.
CORE_DOMAINS = ["memory", "attention", "recall", "orientation", "reasoning"]


@dataclass
class PersonalizationResult:
    """Output of the personalization engine."""

    patient_id: str
    primary_target: DomainPriority       # highest-priority domain
    all_priorities: list[DomainPriority]  # all domains ranked
    cold_start: bool                      # True if insufficient evidence
    explanation: str                      # overall explanation


class PersonalizationEngine:
    """Determines which cognitive domain should be prioritized next.

    Usage:
        engine = PersonalizationEngine()
        result = engine.select_target(profile, recent_targets=["memory", "memory"])
        print(result.primary_target.domain)  # e.g. "attention"
        print(result.primary_target.reason)  # human-readable explanation
    """

    def __init__(self, config: PriorityConfig | None = None) -> None:
        self.config = config or PriorityConfig()

    def select_target(
        self,
        profile: CognitiveProfile,
        recent_targets: list[str] | None = None,
    ) -> PersonalizationResult:
        """Select the primary cognitive domain to target next.

        Args:
            profile: Patient's current cognitive profile.
            recent_targets: Recently targeted domains (most recent last).

        Returns:
            PersonalizationResult with the primary target and all priorities.
        """
        cold_start = self._is_cold_start(profile)

        # Compute priorities for all domains
        priorities = compute_domain_priorities(
            profile,
            recent_targets=recent_targets,
            config=self.config,
        )

        if not priorities:
            # No domain data at all — fall back to balanced exploration
            return self._cold_start_fallback(profile)

        primary = priorities[0]

        # Build explanation
        if cold_start:
            explanation = (
                f"Cold start: insufficient evidence. "
                f"Exploring {primary.domain} to gather data "
                f"(priority={primary.priority:.2f})."
            )
        else:
            explanation = (
                f"Targeting {primary.domain}: {primary.reason} "
                f"(priority={primary.priority:.2f})."
            )

        return PersonalizationResult(
            patient_id=profile.patient_id,
            primary_target=primary,
            all_priorities=priorities,
            cold_start=cold_start,
            explanation=explanation,
        )

    def rank_domains(
        self,
        profile: CognitiveProfile,
        recent_targets: list[str] | None = None,
    ) -> list[DomainPriority]:
        """Return all domains ranked by priority (highest first).

        Convenience method when you need the full ranking
        without the full PersonalizationResult wrapper.
        """
        return compute_domain_priorities(
            profile,
            recent_targets=recent_targets,
            config=self.config,
        )

    def _is_cold_start(self, profile: CognitiveProfile) -> bool:
        """Determine if the profile has insufficient evidence for personalization.

        Cold start conditions:
        - total_events below threshold
        - overall_confidence below threshold
        """
        min_events = self.config.min_observations_for_exploitation * len(CORE_DOMAINS)
        return (
            profile.total_events < min_events
            or profile.overall_confidence < 0.3
        )

    def _cold_start_fallback(self, profile: CognitiveProfile) -> PersonalizationResult:
        """Fallback when no domain priorities can be computed.

        Returns the domain with the lowest confidence (needs most evidence).
        """
        if not profile.domain_scores:
            # Truly empty — suggest balanced exploration
            return PersonalizationResult(
                patient_id=profile.patient_id,
                primary_target=DomainPriority(
                    domain="memory",  # default starting domain
                    score=0.0,
                    confidence=0.0,
                    priority=1.0,
                    need=1.0,
                    exploration_bonus=0.0,
                    recency_penalty=0.0,
                    reason="No data available; starting with memory assessment",
                ),
                all_priorities=[],
                cold_start=True,
                explanation="No cognitive data available. Beginning with memory assessment.",
            )

        # Pick the domain with lowest confidence (most uncertain)
        least_confident = min(profile.domain_scores, key=lambda ds: ds.confidence)
        return PersonalizationResult(
            patient_id=profile.patient_id,
            primary_target=DomainPriority(
                domain=least_confident.domain,
                score=least_confident.score,
                confidence=least_confident.confidence,
                priority=1.0,
                need=1.0 - least_confident.score,
                exploration_bonus=0.0,
                recency_penalty=0.0,
                reason=f"Least explored domain (confidence={least_confident.confidence:.2f})",
            ),
            all_priorities=[],
            cold_start=True,
            explanation=(
                f"Insufficient evidence for full personalization. "
                f"Gathering data on {least_confident.domain}."
            ),
        )

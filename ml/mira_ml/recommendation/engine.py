"""Recommendation engine — produces complete Recommendation objects.

Bridges PersonalizationEngine (WHAT domain) + AdaptiveDifficultyEngine (HOW HARD)
into a single Recommendation with target game, domain, difficulty, reason, and confidence.

This is the final step of the core intelligence loop before the next intervention.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from mira_ml.schemas.cognitive import CognitiveProfile
from mira_ml.schemas.events import GameEvent
from mira_ml.schemas.recommendations import (
    Recommendation,
    RecommendationType,
)
from mira_ml.personalization.engine import PersonalizationEngine
from mira_ml.adaptive.engine import AdaptiveDifficultyEngine
from mira_ml.adaptive.policy import AdaptiveConfig
from mira_ml.personalization.policy import PriorityConfig


# Default game catalog — maps domain → list of (game_id, display_name).
# In production this would come from a configuration or database.
DEFAULT_GAME_CATALOG: dict[str, list[tuple[str, str]]] = {
    "memory": [
        ("memory-cards-v1", "Memory Cards"),
        ("memory-sequence-v1", "Sequence Memory"),
    ],
    "attention": [
        ("attention-focus-v1", "Focus Target"),
        ("attention-search-v1", "Visual Search"),
    ],
    "recall": [
        ("recall-story-v1", "Story Recall"),
        ("recall-daily-v1", "Daily Recall"),
    ],
    "orientation": [
        ("orientation-time-v1", "Time Orientation"),
        ("orientation-place-v1", "Place Orientation"),
    ],
    "reasoning": [
        ("reasoning-pattern-v1", "Pattern Puzzle"),
        ("reasoning-logic-v1", "Logic Grid"),
    ],
}


@dataclass(frozen=True)
class RecommendationConfig:
    """Configuration for the recommendation engine."""

    # Minimum confidence below which we recommend REST instead of a game
    rest_confidence_threshold: float = 0.2

    # Maximum consecutive sessions before suggesting rest
    max_sessions_before_rest: int = 3

    # Default difficulty when no history is available
    default_difficulty: int = 5


DEFAULT_RECOMMENDATION_CONFIG = RecommendationConfig()


@dataclass
class RecommendationEngine:
    """Produces complete Recommendation objects from patient state.

    Combines personalization (domain selection) + adaptive difficulty
    + game catalog lookup into a single Recommendation.

    Usage:
        engine = RecommendationEngine()
        rec = engine.recommend(
            profile=patient_profile,
            recent_events=events,
            current_difficulty=5,
            patient_id="p-001",
        )
        print(rec.target_game_id, rec.target_domain, rec.difficulty)
    """

    personalization: PersonalizationEngine = field(default_factory=PersonalizationEngine)
    adaptive: AdaptiveDifficultyEngine = field(default_factory=AdaptiveDifficultyEngine)
    config: RecommendationConfig = field(default_factory=lambda: DEFAULT_RECOMMENDATION_CONFIG)
    game_catalog: dict[str, list[tuple[str, str]]] = field(
        default_factory=lambda: DEFAULT_GAME_CATALOG
    )

    def recommend(
        self,
        profile: CognitiveProfile,
        recent_events: list[GameEvent] | None = None,
        current_difficulty: int = 5,
        recent_targets: list[str] | None = None,
        patient_id: str | None = None,
        game_id: str | None = None,
    ) -> Recommendation:
        """Produce a complete recommendation for the next intervention.

        Args:
            profile: Patient's current cognitive profile.
            recent_events: Recent GameEvents for difficulty adaptation.
            current_difficulty: Current difficulty level (1-10).
            recent_targets: Recently targeted domains (most recent last).
            patient_id: Patient identifier (falls back to profile.patient_id).
            game_id: Specific game to recommend (overrides domain-based selection).

        Returns:
            Recommendation with game, domain, difficulty, reason, confidence.
        """
        pid = patient_id or profile.patient_id

        # Step 1: Select target domain via personalization
        personalization_result = self.personalization.select_target(
            profile, recent_targets=recent_targets
        )
        primary = personalization_result.primary_target
        target_domain = primary.domain

        # Step 2: Select game
        if game_id:
            selected_game_id = game_id
        else:
            selected_game_id = self._select_game(target_domain)

        # Step 3: Compute difficulty via adaptive engine
        if recent_events:
            difficulty_rec = self.adaptive.compute(
                events=recent_events,
                current_difficulty=current_difficulty,
                game_id=selected_game_id,
                target_domain=target_domain,
                patient_id=pid,
            )
            difficulty = difficulty_rec.suggested_difficulty
            difficulty_reason = difficulty_rec.reason
            difficulty_confidence = difficulty_rec.confidence
        else:
            difficulty = current_difficulty
            difficulty_reason = "No recent events; maintaining current difficulty."
            difficulty_confidence = 0.3

        # Step 4: Determine recommendation type
        rec_type, rest_reason = self._check_rest_needed(profile, recent_events)
        if rec_type == RecommendationType.REST:
            return Recommendation(
                patient_id=pid,
                recommendation_type=RecommendationType.REST,
                target_game_id=None,
                target_domain=target_domain,
                difficulty=current_difficulty,
                reason=rest_reason,
                confidence=0.8,
            )

        # Step 5: Combine into Recommendation
        # Confidence is the minimum of personalization and difficulty confidence
        combined_confidence = min(primary.confidence, difficulty_confidence)
        # Boost if cold start (exploration)
        if personalization_result.cold_start:
            combined_confidence = max(0.3, combined_confidence)

        reason = (
            f"Targeting {target_domain} ({selected_game_id}): "
            f"{primary.reason} "
            f"Difficulty: {difficulty}/10 ({difficulty_reason})"
        )

        return Recommendation(
            patient_id=pid,
            recommendation_type=rec_type,
            target_game_id=selected_game_id,
            target_domain=target_domain,
            difficulty=difficulty,
            reason=reason,
            confidence=round(combined_confidence, 4),
        )

    def _select_game(self, domain: str) -> str:
        """Select a game for the given domain from the catalog."""
        games = self.game_catalog.get(domain)
        if games:
            return games[0][0]  # default to first game in catalog
        # Fallback: return a generic game ID
        return f"{domain}-generic-v1"

    def _check_rest_needed(
        self,
        profile: CognitiveProfile,
        recent_events: list[GameEvent] | None,
    ) -> tuple[RecommendationType, str]:
        """Determine if a rest recommendation is appropriate."""
        if not recent_events:
            return RecommendationType.GAME, ""

        # Check if overall confidence is very low (fatigue / confusion signal)
        if profile.overall_confidence < self.config.rest_confidence_threshold:
            return (
                RecommendationType.REST,
                "Overall confidence is low; a rest break is recommended.",
            )

        # Check session count from events
        session_ids = set(e.session_id for e in recent_events)
        if len(session_ids) >= self.config.max_sessions_before_rest:
            return (
                RecommendationType.REST,
                f"Patient has completed {len(session_ids)} sessions; "
                "a rest break is recommended.",
            )

        return RecommendationType.GAME, ""

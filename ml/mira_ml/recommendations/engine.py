"""Recommendation engine for personalized cognitive interventions.

Maps cognitive profile priorities and adaptive difficulty to specific games,
providing transparent explanations for both patients and caregivers.
"""

from __future__ import annotations

from typing import Optional

from mira_ml.schemas.cognitive import CognitiveProfile
from mira_ml.schemas.recommendations import Recommendation, RecommendationType
from mira_ml.personalization.engine import PersonalizationEngine, PersonalizationResult
from mira_ml.adaptive.engine import AdaptiveDifficultyEngine
from mira_ml.recommendations.catalog import MIRA_GAMES, get_game_for_domain, GameInfo


class RecommendationEngine:
    """Produces end-to-end personalized game and intervention recommendations.

    Usage:
        engine = RecommendationEngine()
        rec = engine.recommend(
            profile=patient_profile,
            recent_game_ids=["CARD_MATCH"],
            recent_domains=["memory"],
        )
    """

    def __init__(
        self,
        personalization_engine: PersonalizationEngine | None = None,
        adaptive_engine: AdaptiveDifficultyEngine | None = None,
    ) -> None:
        self.personalization = personalization_engine or PersonalizationEngine()
        self.adaptive = adaptive_engine or AdaptiveDifficultyEngine()

    def recommend(
        self,
        profile: CognitiveProfile,
        recent_game_ids: list[str] | None = None,
        recent_domains: list[str] | None = None,
        override_difficulty: Optional[int] = None,
    ) -> Recommendation:
        """Generate the next recommended intervention for a patient.

        Args:
            profile: Patient's current CognitiveProfile.
            recent_game_ids: List of recently played game IDs (most recent last).
            recent_domains: List of recently targeted cognitive domains.
            override_difficulty: Optional explicit difficulty level.

        Returns:
            Recommendation instance with target game, domain, difficulty, and rationale.
        """
        # Step 1: Select target domain using personalization policy
        target_result: PersonalizationResult = self.personalization.select_target(
            profile=profile,
            recent_targets=recent_domains,
        )
        target_domain = target_result.primary_target.domain

        # Step 2: Select appropriate game from catalog
        game_info: GameInfo = get_game_for_domain(target_domain)

        # Step 3: Determine adaptive difficulty level
        if override_difficulty is not None:
            difficulty = max(1, min(10, override_difficulty))
        else:
            diff_state = self.adaptive.get_or_create_state(
                patient_id=profile.patient_id,
                game_id=game_info.game_id,
                initial_difficulty=5,
            )
            difficulty = max(
                game_info.min_difficulty,
                min(game_info.max_difficulty, diff_state.current_difficulty),
            )

        # Step 4: Construct explainable recommendation rationale
        if target_result.cold_start:
            reason = (
                f"Introductory session for {target_domain.capitalize()} domain: "
                f"Gathering initial cognitive baseline using {game_info.title} at Level {difficulty}."
            )
            rec_type = RecommendationType.ASSESSMENT
        else:
            reason = (
                f"Personalized intervention for {target_domain.capitalize()} "
                f"({target_result.primary_target.reason}): "
                f"Playing {game_info.title} at adaptive Level {difficulty}."
            )
            rec_type = RecommendationType.GAME

        return Recommendation(
            patient_id=profile.patient_id,
            recommendation_type=rec_type,
            target_game_id=game_info.game_id,
            target_domain=target_domain,
            difficulty=difficulty,
            reason=reason,
            confidence=round(target_result.primary_target.confidence, 4),
        )

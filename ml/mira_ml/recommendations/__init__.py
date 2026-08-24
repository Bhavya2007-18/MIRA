"""Recommendation subsystem for personalized cognitive rehabilitation."""

from mira_ml.recommendations.catalog import MIRA_GAMES, GameInfo, get_game_for_domain
from mira_ml.recommendations.engine import RecommendationEngine

__all__ = [
    "MIRA_GAMES",
    "GameInfo",
    "get_game_for_domain",
    "RecommendationEngine",
]

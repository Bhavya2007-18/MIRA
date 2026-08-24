"""Cognitive game catalog with North Eastern cultural reminiscence metadata."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class GameInfo:
    """Metadata for a registered cognitive intervention game."""

    game_id: str
    title: str
    primary_domain: str
    secondary_domain: Optional[str]
    min_difficulty: int
    max_difficulty: int
    cultural_theme: str
    description: str


# MIRA Game Catalog containing all current cognitive games
MIRA_GAMES: dict[str, GameInfo] = {
    "CARD_MATCH": GameInfo(
        game_id="CARD_MATCH",
        title="4x4 Heritage Card Match",
        primary_domain="memory",
        secondary_domain="attention",
        min_difficulty=1,
        max_difficulty=8,
        cultural_theme="Assamese Jaapi, Kamakhya Temple, Living Root Bridge, Muga Silk, Family Reminiscence",
        description="Visual working memory and associative spatial recall through North Eastern cultural icons and family members.",
    ),
    "AUDITORY_RECALL": GameInfo(
        game_id="AUDITORY_RECALL",
        title="NER Acoustic Sound Recall",
        primary_domain="recall",
        secondary_domain="attention",
        min_difficulty=1,
        max_difficulty=7,
        cultural_theme="Bihu Dhol, Tokari instrument, Brahmaputra riverboat horn, Rainforest birds",
        description="Auditory memory and acoustic identification linking regional sounds to familiar visual items.",
    ),
    "MATHS_COMPARE": GameInfo(
        game_id="MATHS_COMPARE",
        title="Number Magnitude Comparison",
        primary_domain="reasoning",
        secondary_domain="orientation",
        min_difficulty=1,
        max_difficulty=10,
        cultural_theme="High-contrast dual panel cognitive stimulus",
        description="Numerical cognitive processing, relative magnitude discrimination, and executive decision making.",
    ),
}


def get_game_for_domain(domain: str) -> GameInfo:
    """Find the best matching game for a targeted cognitive domain."""
    domain_clean = domain.lower()
    for game in MIRA_GAMES.values():
        if game.primary_domain.lower() == domain_clean:
            return game
    for game in MIRA_GAMES.values():
        if game.secondary_domain and game.secondary_domain.lower() == domain_clean:
            return game
    # Default fallback
    return MIRA_GAMES["CARD_MATCH"]

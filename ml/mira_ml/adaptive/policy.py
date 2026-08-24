"""Adaptive difficulty policy — performance evaluation and difficulty adjustment.

Provides functions for evaluating patient performance and computing
difficulty adjustments based on game events.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

from mira_ml.adaptive.engine import AdaptiveDifficultyEngine, AdaptiveConfig
from mira_ml.schemas.events import GameEvent
from mira_ml.schemas.recommendations import DifficultyRecommendation


def evaluate_performance(
    events: list[GameEvent],
    config: AdaptiveConfig | None = None,
) -> dict:
    """Evaluate performance from a list of game events.

    Returns a dict with performance signals used for difficulty adjustment.
    """
    from mira_ml.adaptive.policy import clamp_difficulty  # local import to avoid circularity

    engine = AdaptiveDifficultyEngine(config=config)
    # Use the engine to evaluate
    signal = engine.evaluate(events, config=config)

    return {
        "accuracy": getattr(signal, "accuracy", 0.5),
        "efficiency": getattr(signal, "efficiency", 0.5),
        "consistency": getattr(signal, "consistency", 0.5),
        "composite": getattr(signal, "composite", 0.5),
    }


def compute_adjustment(
    events: list[GameEvent],
    current_difficulty: int,
    config: Optional[AdaptiveConfig] = None,
) -> DifficultyRecommendation:
    """Compute a difficulty adjustment based on recent performance."""
    from mira_ml.adaptive.engine import AdaptiveDifficultyEngine

    engine = AdaptiveDifficultyEngine(config=config)
    return engine.compute(
        events=events,
        current_difficulty=current_difficulty,
        game_id="policy-compute",
        target_domain="memory",
        patient_id="policy-patient",
    )
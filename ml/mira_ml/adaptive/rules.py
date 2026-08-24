"""Adaptive difficulty rules and configuration."""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class AdaptiveConfig:
    """Configuration for adaptive difficulty adjustment."""

    increase_threshold: float = 0.80
    decrease_threshold: float = 0.50
    min_events: int = 3
    steep_decrease_threshold: float = 0.30
    max_adjustment: int = 2


DEFAULT_ADAPTIVE_CONFIG = AdaptiveConfig()


def clamp_difficulty(value: int, minimum: int = 1, maximum: int = 10) -> int:
    """Clamp a difficulty value to the valid range [1, 10]."""
    return max(minimum, min(maximum, value))
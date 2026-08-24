"""Adaptive difficulty rules and boundary constraints.

Provides safe, gradual difficulty progression and immediate step-down
protection specifically designed for elderly dementia rehabilitation.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class AdaptiveConfig:
    """Tuning parameters for adaptive difficulty adjustments."""

    min_difficulty: int = 1
    max_difficulty: int = 10
    
    # Accuracy thresholds for difficulty shift
    upgrade_accuracy_threshold: float = 0.85
    downgrade_accuracy_threshold: float = 0.50

    # Required consecutive successes before stepping up difficulty (hysteresis)
    min_consecutive_successes: int = 3
    
    # Maximum difficulty shift in a single step (prevents sudden shocks)
    max_step_increase: int = 1
    max_step_decrease: int = 2

    # High response time penalty threshold (ratio of domain reference RT)
    slow_response_ratio_threshold: float = 1.6
    
    # Hints threshold that forces maintenance or decrease
    excessive_hints_threshold: int = 2


DEFAULT_ADAPTIVE_CONFIG = AdaptiveConfig()


def clamp_difficulty(difficulty: int, min_val: int = 1, max_val: int = 10) -> int:
    """Safely constrain difficulty within bounds."""
    return max(min_val, min(max_val, difficulty))

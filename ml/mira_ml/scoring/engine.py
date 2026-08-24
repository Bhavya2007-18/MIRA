"""Cognitive scoring engine.

Converts DomainFeatures into normalized CognitiveScore objects
using weighted component scoring with confidence estimation.
"""

from __future__ import annotations

from dataclasses import dataclass
import math

from mira_ml.schemas.cognitive import CognitiveScore
from mira_ml.scoring.features import DomainFeatures


# ---------------------------------------------------------------------------
# Scoring weights per domain
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class ScoringWeights:
    """Component weights for a single domain.

    All weights should sum to 1.0 for a normalized score.
    """

    accuracy: float = 0.50
    efficiency: float = 0.20
    consistency: float = 0.15
    recency: float = 0.15


# Default weights — same across domains for the initial version.
# Domain-specific tuning can be added later without changing the interface.
DEFAULT_WEIGHTS = ScoringWeights()

# Response time reference ranges (ms) per domain.
# These represent "expected" response times for difficulty 5 tasks.
# Used to normalize response time into a 0-1 penalty factor.
DOMAIN_RT_REFERENCES: dict[str, float] = {
    "memory": 5000.0,
    "attention": 3000.0,
    "recall": 6000.0,
    "orientation": 4000.0,
    "reasoning": 8000.0,
}

DEFAULT_RT_REFERENCE = 5000.0

# Minimum events for full confidence
MIN_EVENTS_FULL_CONFIDENCE = 10

# Maximum events beyond which confidence plateaus
MAX_EVENTS_CONFIDENCE = 50


# ---------------------------------------------------------------------------
# Confidence model
# ---------------------------------------------------------------------------

def compute_confidence(sample_size: int, skipped_ratio: float, accuracy: float) -> float:
    """Estimate confidence in a score based on evidence quality.

    Uses a saturation curve based on sample size, penalized by
    skipped events and suspiciously perfect/imperfect accuracy
    on very small samples.

    Args:
        sample_size: Number of non-skipped events.
        skipped_ratio: Fraction of events that were skipped (0-1).
        accuracy: The computed accuracy (0-1).

    Returns:
        Confidence between 0.0 and 1.0.
    """
    if sample_size == 0:
        return 0.0

    # Sample size component: saturating curve
    # Reaches ~0.9 at MIN_EVENTS_FULL_CONFIDENCE, ~1.0 at MAX_EVENTS_CONFIDENCE
    sample_component = 1.0 - math.exp(-sample_size / 5.0)

    # Skip penalty: each skipped event reduces confidence
    skip_penalty = 1.0 - skipped_ratio * 0.5

    # Small sample uncertainty: with very few events, confidence is capped
    if sample_size < 3:
        small_sample_cap = 0.5
    elif sample_size < 5:
        small_sample_cap = 0.7
    else:
        small_sample_cap = 1.0

    confidence = sample_component * skip_penalty * small_sample_cap
    return max(0.0, min(1.0, confidence))


# ---------------------------------------------------------------------------
# Domain scorer
# ---------------------------------------------------------------------------

class DomainScorer:
    """Scores a single cognitive domain from extracted features."""

    def __init__(
        self,
        weights: ScoringWeights | None = None,
        rt_references: dict[str, float] | None = None,
    ) -> None:
        self.weights = weights or DEFAULT_WEIGHTS
        self.rt_references = rt_references or DOMAIN_RT_REFERENCES

    def score(self, features: DomainFeatures) -> CognitiveScore:
        """Compute a CognitiveScore from domain features."""
        n = features.event_count - features.skipped_count

        if n == 0:
            return CognitiveScore(
                domain=features.domain,
                score=0.0,
                confidence=0.0,
                sample_size=0,
            )

        # Component 1: Accuracy (already hint-corrected)
        accuracy_score = features.accuracy

        # Component 2: Efficiency (already 0-1)
        efficiency_score = features.efficiency

        # Component 3: Consistency (low CV = high consistency)
        # CV of 0 → 1.0, CV of 1.0+ → 0.0
        # Scaled by accuracy: consistent wrong answers don't earn points
        consistency_score = max(0.0, 1.0 - features.response_time_cv) * accuracy_score

        # Component 4: Recency (recent accuracy as trend indicator)
        # Scaled by overall accuracy: recent correct answers on an overall-poor
        # session don't dominate
        recency_score = features.recent_accuracy * accuracy_score

        # Weighted combination
        w = self.weights
        raw_score = (
            w.accuracy * accuracy_score
            + w.efficiency * efficiency_score
            + w.consistency * consistency_score
            + w.recency * recency_score
        )

        # Difficulty bonus: subtle boost for maintaining performance at higher difficulty
        # Range: 0-0.05 extra (capped)
        avg_diff = features.difficulty_level
        difficulty_bonus = min(0.05, (avg_diff - 5.0) * 0.01)

        final_score = max(0.0, min(1.0, raw_score + difficulty_bonus))

        # Confidence
        total_events = features.event_count
        skipped_ratio = (features.skipped_count / total_events) if total_events > 0 else 0.0
        confidence = compute_confidence(n, skipped_ratio, features.accuracy)

        return CognitiveScore(
            domain=features.domain,
            score=round(final_score, 4),
            confidence=round(confidence, 4),
            sample_size=n,
        )

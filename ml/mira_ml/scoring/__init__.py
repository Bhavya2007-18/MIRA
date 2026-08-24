"""Cognitive scoring pipeline.

Converts GameEvent data into CognitiveScore objects per cognitive domain.

Usage:
    from mira_ml.scoring import ScoringEngine
    from mira_ml.schemas.events import GameEvent

    engine = ScoringEngine()
    scores = engine.score(events)
"""

from mira_ml.scoring.scoring_engine import ScoringEngine
from mira_ml.scoring.engine import DomainScorer, ScoringWeights, compute_confidence
from mira_ml.scoring.features import FeatureExtractor, DomainFeatures

__all__ = [
    "ScoringEngine",
    "DomainScorer",
    "ScoringWeights",
    "FeatureExtractor",
    "DomainFeatures",
    "compute_confidence",
]

"""Scoring engine orchestrator.

Ties feature extraction and domain scoring into a single public API.
"""

from __future__ import annotations

from mira_ml.schemas.events import GameEvent
from mira_ml.schemas.cognitive import CognitiveScore
from mira_ml.scoring.features import FeatureExtractor, DomainFeatures
from mira_ml.scoring.engine import DomainScorer, ScoringWeights


class ScoringEngine:
    """Converts a batch of GameEvents into per-domain CognitiveScores.

    Usage:
        engine = ScoringEngine()
        scores = engine.score(events)
        for score in scores:
            print(f"{score.domain}: {score.score:.2f} (conf={score.confidence:.2f})")
    """

    def __init__(
        self,
        weights: ScoringWeights | None = None,
        extractor: FeatureExtractor | None = None,
        scorer: DomainScorer | None = None,
    ) -> None:
        self.extractor = extractor or FeatureExtractor()
        self.scorer = scorer or DomainScorer(weights=weights)

    def score(self, events: list[GameEvent]) -> list[CognitiveScore]:
        """Score a list of events, returning one CognitiveScore per domain.

        Args:
            events: Game events (may span multiple domains and sessions).

        Returns:
            List of CognitiveScore, one per domain with data.
            Empty list if no scorable events are provided.
        """
        if not events:
            return []

        features_by_domain = self.extractor.extract(events)

        scores = []
        for domain, features in sorted(features_by_domain.items()):
            score = self.scorer.score(features)
            scores.append(score)

        return scores

    def score_with_features(
        self, events: list[GameEvent]
    ) -> tuple[list[CognitiveScore], dict[str, DomainFeatures]]:
        """Score events and also return extracted features.

        Useful for debugging, analytics, and testing.
        """
        features_by_domain = self.extractor.extract(events)

        scores = []
        for domain, features in sorted(features_by_domain.items()):
            score = self.scorer.score(features)
            scores.append(score)

        return scores, features_by_domain

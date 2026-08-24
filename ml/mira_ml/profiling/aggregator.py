"""Domain-level temporal aggregation using exponential moving average.

Blends new CognitiveScore observations with historical state to produce
stable, evolving domain scores that resist single-session noise.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from mira_ml.schemas.cognitive import CognitiveScore


@dataclass
class DomainState:
    """Accumulated state for a single cognitive domain."""

    domain: str
    score: float = 0.0
    confidence: float = 0.0
    total_events: int = 0
    observation_count: int = 0


@dataclass
class AggregationConfig:
    """Configuration for temporal aggregation."""

    # Minimum incoming confidence to fully trust an observation.
    # Below this, the incoming score is down-weighted.
    min_confidence_threshold: float = 0.3

    # Base smoothing factor (alpha). The actual alpha is:
    #   alpha = base_alpha × confidence × evidence_factor
    # Higher alpha = more weight on new observation.
    base_alpha: float = 0.3

    # Cap alpha to prevent any single session from dominating.
    max_alpha: float = 0.7


DEFAULT_CONFIG = AggregationConfig()


class DomainAggregator:
    """Aggregates CognitiveScore observations per domain over time.

    Uses exponential moving average (EMA) where the smoothing factor
    (alpha) is proportional to the incoming observation's confidence.
    High-confidence observations shift the profile more; low-confidence
    observations are mostly ignored.
    """

    def __init__(self, config: AggregationConfig | None = None) -> None:
        self.config = config or DEFAULT_CONFIG
        self._states: dict[str, DomainState] = {}

    def reset(self) -> None:
        """Clear all accumulated state."""
        self._states.clear()

    def update(self, scores: list[CognitiveScore]) -> None:
        """Incorporate new observations into the running aggregate.

        Args:
            scores: CognitiveScore list from the latest scoring pass.
        """
        cfg = self.config

        for cs in scores:
            domain = cs.domain
            existing = self._states.get(domain)

            if existing is None or existing.observation_count == 0:
                # First observation for this domain — adopt directly
                self._states[domain] = DomainState(
                    domain=domain,
                    score=cs.score,
                    confidence=cs.confidence,
                    total_events=cs.sample_size,
                    observation_count=1,
                )
                continue

            # Compute alpha: blend factor for this observation
            confidence_factor = min(1.0, cs.confidence / max(cfg.min_confidence_threshold, 0.01))
            evidence_factor = min(1.0, cs.sample_size / 10.0)
            alpha = min(cfg.max_alpha, cfg.base_alpha * confidence_factor * evidence_factor)

            # EMA update
            new_score = alpha * cs.score + (1.0 - alpha) * existing.score
            new_confidence = alpha * cs.confidence + (1.0 - alpha) * existing.confidence

            self._states[domain] = DomainState(
                domain=domain,
                score=round(new_score, 6),
                confidence=round(new_confidence, 6),
                total_events=existing.total_events + cs.sample_size,
                observation_count=existing.observation_count + 1,
            )

    def get_domain_states(self) -> dict[str, DomainState]:
        """Return a copy of current aggregated state for all domains."""
        return {k: DomainState(
            domain=v.domain,
            score=v.score,
            confidence=v.confidence,
            total_events=v.total_events,
            observation_count=v.observation_count,
        ) for k, v in self._states.items()}

    def get_domain_state(self, domain: str) -> DomainState | None:
        """Return state for a specific domain, or None if not observed."""
        return self._states.get(domain)

    @property
    def domains(self) -> list[str]:
        """List of domains with observations."""
        return sorted(self._states.keys())

    @property
    def total_observations(self) -> int:
        """Total observations across all domains."""
        return sum(s.observation_count for s in self._states.values())

    @property
    def total_events(self) -> int:
        """Total events across all domains."""
        return sum(s.total_events for s in self._states.values())

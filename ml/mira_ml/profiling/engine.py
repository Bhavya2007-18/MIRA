"""Profiling engine — produces CognitiveProfile from aggregated domain scores.

Orchestrates domain aggregation, strength/weakness classification,
and overall score computation.
"""

from __future__ import annotations

from mira_ml.schemas.cognitive import CognitiveProfile, CognitiveScore, DomainThresholds
from mira_ml.profiling.aggregator import DomainAggregator, AggregationConfig, DomainState


DEFAULT_THRESHOLDS = DomainThresholds()

# Minimum confidence to classify a domain as a strength or weakness.
# Below this, the domain is "unclassified" — insufficient evidence.
MIN_CONFIDENCE_FOR_CLASSIFICATION = 0.3


class ProfilingEngine:
    """Builds and maintains a CognitiveProfile for a patient.

    Usage:
        engine = ProfilingEngine(patient_id="p-001")
        engine.update(scores_from_session_1)
        engine.update(scores_from_session_2)
        profile = engine.build()
    """

    def __init__(
        self,
        patient_id: str,
        thresholds: DomainThresholds | None = None,
        aggregation_config: AggregationConfig | None = None,
    ) -> None:
        self.patient_id = patient_id
        self.thresholds = thresholds or DEFAULT_THRESHOLDS
        self._aggregator = DomainAggregator(config=aggregation_config)
        self._profile_version = 0

    def update(self, scores: list[CognitiveScore]) -> None:
        """Incorporate new scoring observations into the profile.

        Args:
            scores: CognitiveScore list from the latest scoring pass.
                    Empty list or scores with sample_size=0 are ignored.
        """
        # Filter out zero-evidence scores
        valid = [cs for cs in scores if cs.sample_size > 0]
        if valid:
            self._aggregator.update(valid)

    def build(self) -> CognitiveProfile | None:
        """Build the current CognitiveProfile from accumulated observations.

        Returns:
            CognitiveProfile with domain scores, overall score,
            strengths/weaknesses, and confidence. Returns None if no
            observations have been recorded yet.
        """
        self._profile_version += 1
        states = self._aggregator.get_domain_states()

        # Build domain scores from aggregated state
        domain_scores = self._build_domain_scores(states)

        if not domain_scores:
            return None

        # Overall score: confidence-weighted average of available domains
        overall_score, overall_confidence = self._compute_overall(domain_scores)

        # Strengths/weaknesses classification
        strengths, weaknesses = self._classify_domains(domain_scores)

        return CognitiveProfile(
            patient_id=self.patient_id,
            domain_scores=domain_scores,
            overall_score=round(overall_score, 4),
            overall_confidence=round(overall_confidence, 4),
            strengths=strengths,
            weaknesses=weaknesses,
            total_events=self._aggregator.total_events,
            profile_version=self._profile_version,
        )

    def _build_domain_scores(self, states: dict[str, DomainState]) -> list[CognitiveScore]:
        """Convert DomainState map to sorted CognitiveScore list."""
        scores = []
        for domain, state in sorted(states.items()):
            scores.append(CognitiveScore(
                domain=domain,
                score=round(state.score, 4),
                confidence=round(state.confidence, 4),
                sample_size=state.total_events,
            ))
        return scores

    def _compute_overall(
        self, domain_scores: list[CognitiveScore]
    ) -> tuple[float, float]:
        """Compute overall score and confidence from domain scores.

        Uses confidence-weighted averaging. Missing domains are not
        treated as zero — they simply don't contribute.

        Overall confidence reflects:
        - number of domains observed
        - confidence in each domain
        - total evidence backing the profile
        """
        if not domain_scores:
            return 0.0, 0.0

        # Confidence-weighted average
        total_weight = 0.0
        weighted_sum = 0.0
        for ds in domain_scores:
            w = ds.confidence
            weighted_sum += ds.score * w
            total_weight += w

        if total_weight == 0:
            return 0.0, 0.0

        overall_score = weighted_sum / total_weight

        # Overall confidence:
        # - domain coverage: how many of the 5 core domains are observed
        # - average domain confidence
        core_domains = {"memory", "attention", "recall", "orientation", "reasoning"}
        observed = {ds.domain for ds in domain_scores}
        coverage = len(observed & core_domains) / len(core_domains)

        avg_confidence = total_weight / len(domain_scores)

        # Combine: coverage × average confidence
        # This means observing all 5 domains at high confidence → high overall
        overall_confidence = coverage * avg_confidence

        return overall_score, overall_confidence

    def _classify_domains(
        self, domain_scores: list[CognitiveScore]
    ) -> tuple[list[str], list[str]]:
        """Classify domains as strengths or weaknesses.

        Only classifies when:
        1. Confidence exceeds minimum threshold
        2. Score meets the strength/weakness boundary

        Returns:
            (strengths, weaknesses) — sorted lists of domain names
        """
        strengths: list[str] = []
        weaknesses: list[str] = []
        thr = self.thresholds

        for ds in domain_scores:
            # Skip low-confidence domains — insufficient evidence
            if ds.confidence < MIN_CONFIDENCE_FOR_CLASSIFICATION:
                continue

            if ds.score >= thr.strength_ratio:
                strengths.append(ds.domain)
            elif ds.score <= thr.weakness_ratio:
                weaknesses.append(ds.domain)

        return sorted(strengths), sorted(weaknesses)

    @property
    def profile_version(self) -> int:
        """Current profile version (increments on each build)."""
        return self._profile_version

    @property
    def observation_count(self) -> int:
        """Total observations across all domains."""
        return self._aggregator.total_observations

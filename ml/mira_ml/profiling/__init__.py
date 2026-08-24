"""Cognitive profiling pipeline.

Converts CognitiveScore observations into an evolving CognitiveProfile
with domain scores, strengths/weaknesses, and overall cognitive status.

Usage:
    from mira_ml.profiling import ProfilingEngine

    engine = ProfilingEngine(patient_id="p-001")
    engine.update(session_1_scores)
    engine.update(session_2_scores)
    profile = engine.build()
"""

from mira_ml.profiling.engine import ProfilingEngine
from mira_ml.profiling.aggregator import (
    DomainAggregator,
    DomainState,
    AggregationConfig,
)

__all__ = [
    "ProfilingEngine",
    "DomainAggregator",
    "DomainState",
    "AggregationConfig",
]

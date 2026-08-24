"""Personalization engine.

Determines which cognitive domain should be prioritized next
based on the patient's CognitiveProfile, recent performance,
and intervention history.

Usage:
    from mira_ml.personalization import PersonalizationEngine

    engine = PersonalizationEngine()
    result = engine.select_target(profile, recent_targets=["memory"])
    print(result.primary_target.domain)
    print(result.primary_target.reason)
"""

from mira_ml.personalization.engine import PersonalizationEngine, PersonalizationResult
from mira_ml.personalization.policy import (
    DomainPriority,
    PriorityConfig,
    compute_domain_priorities,
)

__all__ = [
    "PersonalizationEngine",
    "PersonalizationResult",
    "DomainPriority",
    "PriorityConfig",
    "compute_domain_priorities",
]

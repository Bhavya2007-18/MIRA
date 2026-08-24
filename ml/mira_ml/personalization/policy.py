"""Domain priority policy — interpretable need-based scoring.

Determines which cognitive domain should receive priority based on:
- current domain score
- confidence in that score
- recent intervention history
- exploration needs

The policy is deterministic, explainable, and avoids the naive
"lowest score always wins" approach.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from mira_ml.schemas.cognitive import CognitiveProfile, CognitiveScore


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class PriorityConfig:
    """Tuning parameters for domain priority scoring."""

    # Minimum confidence to fully trust a score for prioritization.
    # Below this, the domain is treated as needing more evidence.
    confidence_threshold: float = 0.5

    # Weight for exploration bonus — how much to boost under-explored domains.
    # Range 0.0-0.3 recommended. Higher = more exploration.
    exploration_weight: float = 0.20

    # Penalty for a domain that was the most recently targeted.
    # Prevents repeatedly hammering the same domain.
    recency_penalty: float = 0.15

    # Minimum number of observations per domain before exploration kicks in.
    min_observations_for_exploitation: int = 2


DEFAULT_PRIORITY_CONFIG = PriorityConfig()


# ---------------------------------------------------------------------------
# Domain priority scoring
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class DomainPriority:
    """Priority score for a single cognitive domain."""

    domain: str
    score: float              # 0-1, the domain's cognitive score
    confidence: float         # 0-1, confidence in the score
    priority: float           # computed priority (higher = more urgent)
    need: float               # (1 - score) × confidence_factor
    exploration_bonus: float  # boost for under-explored domains
    recency_penalty: float    # penalty for recently targeted domain
    reason: str               # human-readable explanation


def compute_domain_priorities(
    profile: CognitiveProfile,
    recent_targets: list[str] | None = None,
    config: PriorityConfig | None = None,
) -> list[DomainPriority]:
    """Compute priority scores for all domains in a profile.

    Args:
        profile: Patient's current cognitive profile.
        recent_targets: List of recently targeted domain names
                        (most recent last). Empty or None = no history.
        config: Priority scoring configuration.

    Returns:
        List of DomainPriority, sorted by priority descending
        (highest priority first).
    """
    cfg = config or DEFAULT_PRIORITY_CONFIG
    recent = recent_targets or []

    # Build a recency set for quick lookup (last 3 targets)
    recent_set = set(recent[-3:]) if recent else set()

    # Count observations per domain
    domain_observations = {ds.domain: ds.sample_size for ds in profile.domain_scores}

    priorities: list[DomainPriority] = []

    for ds in profile.domain_scores:
        domain = ds.domain

        # --- Need: how much does this domain need improvement? ---
        # Raw need is simply (1 - score), but we scale by confidence.
        # Low confidence means we're uncertain — don't over-react.
        confidence_factor = min(1.0, ds.confidence / cfg.confidence_threshold)
        need = (1.0 - ds.score) * confidence_factor

        # --- Exploration bonus: reward under-explored domains ---
        # If we have low confidence or few observations, boost this domain.
        obs = domain_observations.get(domain, 0)
        if obs <= cfg.min_observations_for_exploitation:
            exploration_bonus = cfg.exploration_weight * (1.0 - ds.confidence)
        else:
            exploration_bonus = 0.0

        # --- Recency penalty: discourage re-targeting the same domain ---
        is_recent = domain in recent_set
        recency_penalty = cfg.recency_penalty if is_recent else 0.0

        # --- Final priority ---
        priority = max(0.0, need + exploration_bonus - recency_penalty)

        # --- Reason ---
        reason = _build_reason(ds, need, exploration_bonus, recency_penalty, cfg)

        priorities.append(DomainPriority(
            domain=domain,
            score=ds.score,
            confidence=ds.confidence,
            priority=round(priority, 4),
            need=round(need, 4),
            exploration_bonus=round(exploration_bonus, 4),
            recency_penalty=round(recency_penalty, 4),
            reason=reason,
        ))

    # Sort by priority descending (highest first)
    priorities.sort(key=lambda p: p.priority, reverse=True)
    return priorities


def _build_reason(
    ds: CognitiveScore,
    need: float,
    exploration_bonus: float,
    recency_penalty: float,
    cfg: PriorityConfig,
) -> str:
    """Generate a human-readable explanation for this priority score."""
    parts: list[str] = []

    if ds.score <= 0.40:
        parts.append(f"weakness (score={ds.score:.2f})")
    elif ds.score >= 0.75:
        parts.append(f"strength (score={ds.score:.2f})")
    else:
        parts.append(f"moderate (score={ds.score:.2f})")

    if ds.confidence < cfg.confidence_threshold:
        parts.append(f"low confidence ({ds.confidence:.2f})")
    else:
        parts.append(f"confidence={ds.confidence:.2f}")

    if exploration_bonus > 0:
        parts.append("needs more evidence")
    if recency_penalty > 0:
        parts.append("recently targeted")

    return "; ".join(parts)

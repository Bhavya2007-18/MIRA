# Personalization Engine

## Overview

Determines **which cognitive domain** should be prioritized next based on the patient's CognitiveProfile, recent intervention history, and evidence quality.

This engine answers "WHAT to target" — adaptive difficulty (Phase 5) will answer "HOW HARD".

## Architecture

```
CognitiveProfile + recent_targets
        ↓
  compute_domain_priorities()
        ↓
  DomainPriority[] (ranked)
        ↓
  PersonalizationEngine.select_target()
        ↓
  PersonalizationResult
```

## Files

| File | Purpose |
|---|---|
| `policy.py` | Domain priority scoring (interpretable, testable) |
| `engine.py` | Orchestrator — cold start, target selection |

## Priority Scoring Formula

For each domain:

```
need = (1 - score) × confidence_factor
exploration_bonus = exploration_weight × (1 - confidence)   [if under-explored]
recency_penalty = recency_weight                            [if recently targeted]

priority = max(0, need + exploration_bonus - recency_penalty)
```

### Components

| Component | Range | Meaning |
|---|---|---|
| `need` | 0–1 | How much improvement is needed, scaled by confidence |
| `exploration_bonus` | 0–0.2 | Boost for under-explored domains |
| `recency_penalty` | 0–0.15 | Penalty for recently targeted domains |
| `priority` | 0–~1.2 | Final score (higher = more urgent) |

### Why Not "Lowest Score Wins"?

A domain with score=0.30 but confidence=0.10 (2 events) should NOT automatically dominate a well-established domain at score=0.45 with confidence=0.90 (30 events).

The `confidence_factor` ensures we only act strongly on scores we trust.

## Cold Start

For new patients with insufficient evidence:

```
cold_start = total_events < min_observations × num_domains
          OR overall_confidence < 0.3
```

During cold start:
- Exploration bonus is maximized
- The engine selects the **least-explored domain** (lowest confidence)
- Explanation clearly states "insufficient evidence"

This ensures balanced data collection before personalization kicks in.

## Anti-Repetition

Recent targets (last 3) receive a priority penalty of 0.15. This:
- Prevents hammering the same domain
- Encourages variety in intervention
- Still allows re-targeting when need is strong enough

## Strength vs Weakness Balance

- **Weaknesses** (score ≤ 0.40): High need, prioritized
- **Moderate** (0.40 < score < 0.75): Medium need
- **Strengths** (score ≥ 0.75): Low need, maintained but not prioritized

The engine does NOT exclusively target weaknesses — it balances rehabilitation need with evidence quality.

## Limitations

- No game-specific metadata yet (which games map to which domains)
- No patient preference modeling
- Fixed priority weights (not adaptive per patient)
- Does not consider time-of-day or session length
- No fatigue/boredom modeling

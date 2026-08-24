# Profiling Engine

## Overview

Builds an evolving `CognitiveProfile` from repeated `CognitiveScore` observations across sessions. Uses exponential moving average (EMA) for temporal aggregation.

## Architecture

```
CognitiveScore[] (session 1)
      ↓
  DomainAggregator
      ↓
CognitiveScore[] (session 2)
      ↓
  DomainAggregator  →  DomainState per domain
      ↓
  ProfilingEngine
      ↓
  CognitiveProfile
```

## Files

| File | Purpose |
|---|---|
| `aggregator.py` | EMA-based temporal aggregation per domain |
| `engine.py` | Profile builder — overall score, strengths/weaknesses |

## Aggregation Method

### Exponential Moving Average (EMA)

For each domain, new observations are blended with existing state:

```
α = min(max_alpha, base_alpha × confidence_factor × evidence_factor)

new_score = α × incoming_score + (1 - α) × existing_score
```

Where:
- `confidence_factor = min(1.0, incoming_confidence / min_confidence_threshold)`
- `evidence_factor = min(1.0, incoming_sample_size / 10)`
- `base_alpha = 0.3`, `max_alpha = 0.7`, `min_confidence_threshold = 0.3`

### Behavior

| Scenario | α | Effect |
|---|---|---|
| High confidence, good evidence | 0.5–0.7 | Large shift toward new observation |
| Medium confidence | 0.2–0.4 | Moderate shift |
| Low confidence, small sample | 0.05–0.15 | Minimal shift — existing state dominates |
| Very low confidence | ~0.05 | Nearly ignored |

### Properties

- **First observation**: Adopted directly (no existing state to blend)
- **Single outlier**: Barely shifts the profile (low α)
- **Consistent observations**: Converge to the true performance level
- **Missing domains**: Not treated as zero — simply absent from profile

## Overall Score

```
overall_score = Σ(domain_score × domain_confidence) / Σ(domain_confidence)
```

Confidence-weighted average. Missing domains don't contribute (not zero-filled).

## Overall Confidence

```
coverage = |observed_domains ∩ core_domains| / |core_domains|
avg_confidence = mean(domain_confidences)

overall_confidence = coverage × avg_confidence
```

Where `core_domains = {memory, attention, recall, orientation, reasoning}`.

Observing all 5 domains at high confidence → high overall confidence.
Observing only 1 domain → lower overall confidence regardless of domain quality.

## Strength/Weakness Classification

Uses `DomainThresholds`:

| Classification | Condition |
|---|---|
| Strength | `score ≥ strength_ratio (0.75)` AND `confidence ≥ 0.3` |
| Weakness | `score ≤ weakness_ratio (0.40)` AND `confidence ≥ 0.3` |
| Neutral | Between thresholds, or insufficient confidence |

Only domains with sufficient confidence are classified. Low-evidence domains remain unclassified.

## Limitations

- EMA is a first-order filter — does not detect trends or cycles
- No patient-specific baseline calibration yet
- Fixed smoothing parameters (not adaptive per patient)
- Does not account for time gaps between sessions
- Strength/weakness thresholds are global, not personalized

# Scoring Engine

## Overview

Converts `GameEvent` data into per-domain `CognitiveScore` objects using weighted component scoring.

## Architecture

```
GameEvent[]
    ↓
FeatureExtractor
    ↓
DomainFeatures (per domain)
    ↓
DomainScorer
    ↓
CognitiveScore (per domain)
```

## Files

| File | Purpose |
|---|---|
| `features.py` | Extracts raw + derived features from events |
| `engine.py` | Weighted scoring + confidence estimation |
| `scoring_engine.py` | Public orchestrator |

## Feature Extraction

### Raw Features (from events)

- `correct_count` — number of correct non-skipped responses
- `total_attempts` — sum of all attempts
- `total_hints` — sum of all hints used
- `response_times_ms` — list of response times
- `difficulties` — list of difficulty levels

### Derived Features

| Feature | Formula | Meaning |
|---|---|---|
| `accuracy` | `(correct - hints*0.5) / n` | Hint-corrected accuracy |
| `avg_response_time_ms` | `mean(times)` | Average speed |
| `response_time_cv` | `stdev(times) / mean(times)` | Consistency (lower = more consistent) |
| `efficiency` | `1 - (avg_attempts-1)*0.15 - avg_hints*0.2` | How much assistance was needed |
| `difficulty_level` | `mean(difficulties)` | Average challenge level |
| `recent_accuracy` | accuracy on last 20% of events | Trend indicator |

## Scoring Formula

```
accuracy_score    = hint-corrected accuracy (0-1)
efficiency_score  = independence from hints/extra attempts (0-1)
consistency_score = (1 - CV) × accuracy    ← scaled by accuracy
recency_score     = recent_accuracy × accuracy  ← scaled by accuracy

raw_score = 0.50 × accuracy_score
          + 0.20 × efficiency_score
          + 0.15 × consistency_score
          + 0.15 × recency_score

difficulty_bonus = min(0.05, (avg_difficulty - 5) × 0.01)

final_score = clamp(raw_score + difficulty_bonus, 0, 1)
```

**Note:** Consistency and recency are scaled by accuracy so that consistent wrong answers do not earn points.

### Component Weights

| Component | Weight | Range | Meaning |
|---|---|---|---|
| accuracy | 0.50 | 0-1 | Correctness (hint-penalized) |
| efficiency | 0.20 | 0-1 | Independence (fewer attempts/hints = higher) |
| consistency | 0.15 | 0-1 | Response time stability × accuracy |
| recency | 0.15 | 0-1 | Recent performance trend × accuracy |

### Difficulty Bonus

Tasks performed at higher difficulty get a subtle bonus:
- Difficulty 5 → +0.00 (baseline)
- Difficulty 8 → +0.03
- Difficulty 10 → +0.05 (capped)

## Confidence

```
sample_component = 1 - exp(-n / 5)
skip_penalty = 1 - skipped_ratio × 0.5

small_sample_cap:
  n < 3  → 0.5
  n < 5  → 0.7
  n ≥ 5  → 1.0

confidence = sample_component × skip_penalty × small_sample_cap
```

Confidence increases with more evidence, decreases with skipped events, and is capped for very small samples.

## Domain Mapping

| TaskType | Cognitive Domain |
|---|---|
| MEMORY | memory |
| ATTENTION | attention |
| RECALL | recall |
| ORIENTATION | orientation |
| REASONING | reasoning |
| RECOGNITION | skipped |
| OTHER | skipped |

## Limitations

- No clinical diagnosis — scores represent task performance, not medical status
- Requires ≥3 events for meaningful confidence
- Does not account for patient age, education, or baseline
- Response time normalization uses fixed reference ranges (not personalized)
- Hints are penalized uniformly — different hint types are not distinguished

## Example

```python
from mira_ml.scoring import ScoringEngine
from mira_ml.schemas.events import GameEvent, TaskType

events = [
    GameEvent(
        patient_id="p-001", session_id="s-001", game_id="memory-cards",
        task_type=TaskType.MEMORY, difficulty=5, correct=True,
        response_time_ms=2500.0, attempts=1, hints_used=0,
    )
    for _ in range(10)
]

engine = ScoringEngine()
scores = engine.score(events)
# [CognitiveScore(domain='memory', score=0.92, confidence=0.82, sample_size=10)]
```

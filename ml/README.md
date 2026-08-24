# MIRA AI/ML Engine

Cognitive scoring, profiling, personalization, and memory prosthetic subsystem.

## What This Subsystem Owns

| Component            | Purpose                                        |
| -------------------- | ---------------------------------------------- |
| `schemas/`           | Shared data contracts (Pydantic models)        |
| `scoring/`           | Event → cognitive domain scores                |
| `profiling/`         | Scores → patient cognitive profile             |
| `personalization/`   | Profile → personalized recommendations         |
| `adaptive/`          | Performance signals → difficulty adjustments   |
| `analytics/`         | Trends, insights, caregiver-facing outputs     |

## Data Contracts

| Contract                  | File                          | Purpose                            |
| ------------------------- | ----------------------------- | ---------------------------------- |
| `GameEvent`               | `schemas/events.py`           | Raw game/assessment event          |
| `GameEventBatch`          | `schemas/events.py`           | Batch of events from a session     |
| `CognitiveScore`          | `schemas/cognitive.py`        | Score for a single domain          |
| `CognitiveProfile`        | `schemas/cognitive.py`        | Full patient cognitive snapshot    |
| `DomainThresholds`        | `schemas/cognitive.py`        | Strength/weakness classification   |
| `Recommendation`          | `schemas/recommendations.py`  | Personalized intervention rec      |
| `DifficultyRecommendation`| `schemas/recommendations.py`  | Lightweight difficulty-only update |

## Contract Flow

```
Mobile/Game → GameEvent → [scoring] → CognitiveScore
                                    → [profiling] → CognitiveProfile
                                    → [personalization] → Recommendation
                                    → [adaptive] → DifficultyRecommendation
                                    → [analytics] → Insights
```

## Consumers

- **Backend (FastAPI):** Receives `GameEvent`s, returns `Recommendation`s
- **Mobile app:** Reads `Recommendation`s, `DifficultyRecommendation`s
- **Caregiver dashboard:** Reads `CognitiveProfile`, analytics outputs

## Future Phases

- Phase 2: Scoring pipeline (events → domain scores)
- Phase 3: Profiling (scores → patient profile)
- Phase 4: Personalization + adaptive difficulty
- Phase 5: Analytics
- Phase 6: Memory prosthetic (face/object recognition)
- Phase 7: API integration + mobile inference

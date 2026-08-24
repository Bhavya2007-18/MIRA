# Analytics Engine — Phase 7

Longitudinal cognitive performance monitoring and caregiver-facing insights.

## Modules

| Module | Purpose |
|--------|---------|
| `trends.py` | Domain score + performance metric trend analysis |
| `insights.py` | Caregiver-facing structured insights (neutral, non-diagnostic) |
| `anomalies.py` | Z-score-based anomaly detection for scores and events |
| `engine.py` | Orchestrator — runs all analytics on patient history |

## Key Types

- **`DomainTrend`** — direction, current/historical level, change, confidence per domain
- **`PerformanceTrend`** — accuracy, response_time, difficulty trends across sessions
- **`Insight`** — severity-tagged caregiver explanation (INFO/WARNING/ALERT)
- **`Anomaly`** — observed vs baseline with severity and explanation
- **`AnalyticsResult`** — complete output bundle (trends + insights + anomalies)

## Design Principles

- **Non-diagnostic**: language is observational, never clinical
- **Explainable**: every output includes a human-readable `reason`/`explanation`
- **Configurable**: `TrendConfig` and `AnomalyConfig` control thresholds
- **Graceful degradation**: insufficient data returns `INSUFFICIENT` direction, not errors
- **Consecutive anomaly check**: requires `min_consecutive` (default 2) anomalous observations to flag

## Usage

```python
from mira_ml.analytics.engine import AnalyticsEngine

engine = AnalyticsEngine()
result = engine.analyze(
    patient_id="p-001",
    profile_history=profiles,    # list[CognitiveProfile]
    event_history=events,        # list[GameEvent]
)

for insight in result.insights:
    print(f"[{insight.severity.value}] {insight.reason}")

for anomaly in result.anomalies:
    print(f"[{anomaly.severity.value}] {anomaly.explanation}")
```

## Test Coverage

27 tests covering trend analysis, insight generation, anomaly detection, and engine orchestration.

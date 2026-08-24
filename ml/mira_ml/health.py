"""Health checks and observability for the MIRA AI/ML subsystem."""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class HealthStatus(str, Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"


@dataclass(frozen=True)
class ComponentHealth:
    name: str
    status: HealthStatus
    message: str = ""
    latency_ms: float = 0.0
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class SystemHealth:
    status: HealthStatus
    version: str
    uptime_seconds: float
    components: list[ComponentHealth]
    patient_count: int = 0


_start_time: float = time.monotonic()


def check_scoring_health() -> ComponentHealth:
    try:
        from mira_ml.scoring.scoring_engine import ScoringEngine
        from mira_ml.schemas.events import GameEvent, TaskType

        engine = ScoringEngine()
        event = GameEvent(
            patient_id="hc", session_id="hc-1", game_id="hc",
            task_type=TaskType.MEMORY, difficulty=5,
            correct=True, response_time_ms=1000.0,
        )
        start = time.monotonic()
        scores = engine.score([event])
        elapsed = (time.monotonic() - start) * 1000
        return ComponentHealth(name="scoring", status=HealthStatus.HEALTHY, latency_ms=round(elapsed, 2))
    except Exception as e:
        return ComponentHealth(name="scoring", status=HealthStatus.UNHEALTHY, message=str(e))


def check_profiling_health() -> ComponentHealth:
    try:
        from mira_ml.profiling.engine import ProfilingEngine
        from mira_ml.schemas.cognitive import CognitiveScore

        engine = ProfilingEngine(patient_id="hc")
        start = time.monotonic()
        engine.update([CognitiveScore(domain="memory", score=0.5, confidence=0.5, sample_size=1)])
        profile = engine.build()
        elapsed = (time.monotonic() - start) * 1000
        status = HealthStatus.HEALTHY if profile else HealthStatus.DEGRADED
        return ComponentHealth(name="profiling", status=status, latency_ms=round(elapsed, 2))
    except Exception as e:
        return ComponentHealth(name="profiling", status=HealthStatus.UNHEALTHY, message=str(e))


def check_vision_health() -> ComponentHealth:
    try:
        from mira_ml.vision.face.recognition import FaceEnrollmentStore, match_face

        store = FaceEnrollmentStore()
        embs = [[0.1 + i * 0.01 for i in range(128)] for _ in range(3)]
        store.enroll("hc", "HC", embs)
        start = time.monotonic()
        match_face([0.1 + i * 0.01 for i in range(128)], store, patient_id="hc")
        elapsed = (time.monotonic() - start) * 1000
        return ComponentHealth(name="vision", status=HealthStatus.HEALTHY, latency_ms=round(elapsed, 2))
    except Exception as e:
        return ComponentHealth(name="vision", status=HealthStatus.UNHEALTHY, message=str(e))


def check_inference_health() -> ComponentHealth:
    try:
        from mira_ml.inference.pipeline import InferencePipeline

        pipeline = InferencePipeline()
        frame = [[[128, 128, 128] for _ in range(10)] for _ in range(10)]
        start = time.monotonic()
        result = pipeline.process_frame(frame, patient_id="hc")
        elapsed = (time.monotonic() - start) * 1000
        return ComponentHealth(
            name="inference", status=HealthStatus.HEALTHY,
            latency_ms=round(elapsed, 2),
            metadata={"models_loaded": result.models_loaded},
        )
    except Exception as e:
        return ComponentHealth(name="inference", status=HealthStatus.UNHEALTHY, message=str(e))


def check_system_health(patient_count: int = 0) -> SystemHealth:
    components = [
        check_scoring_health(),
        check_profiling_health(),
        check_vision_health(),
        check_inference_health(),
    ]

    unhealthy = sum(1 for c in components if c.status == HealthStatus.UNHEALTHY)
    degraded = sum(1 for c in components if c.status == HealthStatus.DEGRADED)

    if unhealthy > 0:
        overall = HealthStatus.UNHEALTHY
    elif degraded > 0:
        overall = HealthStatus.DEGRADED
    else:
        overall = HealthStatus.HEALTHY

    return SystemHealth(
        status=overall,
        version="0.1.0",
        uptime_seconds=round(time.monotonic() - _start_time, 2),
        components=components,
        patient_count=patient_count,
    )

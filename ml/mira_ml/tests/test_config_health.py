"""Tests for configuration, health checks, and deployment readiness (Phase 14)."""

from __future__ import annotations

import os
import pytest

from mira_ml.config import (
    MIRAConfig,
    Environment,
    ScoringConfig,
    ProfilingConfig,
    VisionConfig,
    load_config,
    get_config,
)
from mira_ml.health import (
    HealthStatus,
    ComponentHealth,
    SystemHealth,
    check_scoring_health,
    check_profiling_health,
    check_vision_health,
    check_inference_health,
    check_system_health,
)


# ---------------------------------------------------------------------------
# Config tests
# ---------------------------------------------------------------------------

class TestConfig:
    def test_default_config(self):
        cfg = MIRAConfig()
        assert cfg.environment == Environment.DEVELOPMENT
        assert cfg.version == "0.1.0"
        assert cfg.scoring.accuracy_weight == 0.50
        assert cfg.vision.face_known_threshold == 0.75
        assert cfg.api.port == 8000

    def test_scoring_config_defaults(self):
        cfg = ScoringConfig()
        assert cfg.accuracy_weight + cfg.efficiency_weight + cfg.consistency_weight + cfg.recency_weight == 1.0

    def test_profiling_config_defaults(self):
        cfg = ProfilingConfig()
        assert cfg.base_alpha < cfg.max_alpha
        assert cfg.strength_ratio > cfg.weakness_ratio

    def test_vision_config_defaults(self):
        cfg = VisionConfig()
        assert cfg.face_known_threshold > cfg.face_uncertain_threshold
        assert cfg.object_known_threshold > cfg.object_uncertain_threshold
        assert cfg.face_embedding_dim > 0
        assert cfg.object_embedding_dim > 0

    def test_load_config_from_env(self):
        os.environ["MIRA_ENV"] = "testing"
        os.environ["MIRA_API_PORT"] = "9000"
        try:
            cfg = load_config()
            assert cfg.environment == Environment.TESTING
            assert cfg.api.port == 9000
        finally:
            del os.environ["MIRA_ENV"]
            del os.environ["MIRA_API_PORT"]

    def test_load_config_invalid_env_falls_back(self):
        os.environ["MIRA_ENV"] = "invalid"
        try:
            cfg = load_config()
            assert cfg.environment == Environment.DEVELOPMENT
        finally:
            del os.environ["MIRA_ENV"]

    def test_frozen_config(self):
        cfg = MIRAConfig()
        with pytest.raises(Exception):
            cfg.version = "0.2.0"

    def test_get_config_singleton(self):
        c1 = get_config()
        c2 = get_config()
        assert c1 is c2


# ---------------------------------------------------------------------------
# Health check tests
# ---------------------------------------------------------------------------

class TestHealthChecks:
    def test_scoring_health(self):
        h = check_scoring_health()
        assert h.name == "scoring"
        assert h.status == HealthStatus.HEALTHY
        assert h.latency_ms >= 0

    def test_profiling_health(self):
        h = check_profiling_health()
        assert h.name == "profiling"
        assert h.status in (HealthStatus.HEALTHY, HealthStatus.DEGRADED)

    def test_vision_health(self):
        h = check_vision_health()
        assert h.name == "vision"
        assert h.status == HealthStatus.HEALTHY

    def test_inference_health(self):
        h = check_inference_health()
        assert h.name == "inference"
        assert h.status == HealthStatus.HEALTHY

    def test_system_health(self):
        sh = check_system_health(patient_count=5)
        assert isinstance(sh, SystemHealth)
        assert sh.version == "0.1.0"
        assert sh.uptime_seconds >= 0
        assert sh.patient_count == 5
        assert len(sh.components) == 4

    def test_system_health_status_healthy(self):
        sh = check_system_health()
        # All components should be healthy in a fresh environment
        assert sh.status in (HealthStatus.HEALTHY, HealthStatus.DEGRADED)

    def test_component_health_dataclass(self):
        ch = ComponentHealth(
            name="test",
            status=HealthStatus.HEALTHY,
            latency_ms=1.5,
            metadata={"key": "value"},
        )
        assert ch.name == "test"
        assert ch.metadata["key"] == "value"


# ---------------------------------------------------------------------------
# Version consistency tests
# ---------------------------------------------------------------------------

class TestVersionConsistency:
    def test_config_version(self):
        cfg = MIRAConfig()
        assert cfg.version == "0.1.0"

    def test_health_version(self):
        sh = check_system_health()
        assert sh.version == "0.1.0"

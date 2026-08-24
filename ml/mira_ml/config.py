"""Production configuration for the MIRA AI/ML subsystem.

Centralizes all configurable thresholds, model settings, and environment
handling. Supports development, testing, and production environments.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from enum import Enum


class Environment(str, Enum):
    """Deployment environment."""

    DEVELOPMENT = "development"
    TESTING = "testing"
    PRODUCTION = "production"


@dataclass(frozen=True)
class ScoringConfig:
    """Scoring engine configuration."""

    accuracy_weight: float = 0.50
    efficiency_weight: float = 0.20
    consistency_weight: float = 0.15
    recency_weight: float = 0.15
    difficulty_bonus_enabled: bool = True


@dataclass(frozen=True)
class ProfilingConfig:
    """Profiling engine configuration."""

    base_alpha: float = 0.3
    max_alpha: float = 0.7
    min_confidence_threshold: float = 0.3
    strength_ratio: float = 0.75
    weakness_ratio: float = 0.40


@dataclass(frozen=True)
class PersonalizationConfig:
    """Personalization configuration."""

    confidence_threshold: float = 0.5
    exploration_weight: float = 0.2
    recency_penalty: float = 0.15
    min_observations_for_exploitation: int = 3
    recent_targets_window: int = 3


@dataclass(frozen=True)
class AdaptiveConfig:
    """Adaptive difficulty configuration."""

    increase_threshold: float = 0.80
    decrease_threshold: float = 0.50
    min_events: int = 3
    steep_decrease_threshold: float = 0.30
    max_adjustment: int = 2


@dataclass(frozen=True)
class RecommendationConfig:
    """Recommendation engine configuration."""

    rest_confidence_threshold: float = 0.2
    max_sessions_before_rest: int = 3
    default_difficulty: int = 5


@dataclass(frozen=True)
class VisionConfig:
    """Vision subsystem configuration."""

    face_known_threshold: float = 0.75
    face_uncertain_threshold: float = 0.50
    face_embedding_dim: int = 128
    face_min_enrollment_samples: int = 3

    object_known_threshold: float = 0.70
    object_uncertain_threshold: float = 0.45
    object_embedding_dim: int = 64
    object_min_enrollment_samples: int = 3

    max_faces_per_frame: int = 5
    max_objects_per_frame: int = 10


@dataclass(frozen=True)
class InferenceConfig:
    """Inference pipeline configuration."""

    model_timeout_seconds: float = 5.0
    fallback_to_dummy: bool = True
    enable_gpu: bool = False
    num_threads: int = 1
    quantize_models: bool = False


@dataclass(frozen=True)
class APIConfig:
    """API configuration."""

    host: str = "0.0.0.0"
    port: int = 8000
    cors_origins: list[str] = field(default_factory=lambda: ["*"])
    request_timeout_seconds: float = 30.0
    max_batch_size: int = 100
    enable_logging: bool = True
    log_level: str = "INFO"


@dataclass(frozen=True)
class MIRAConfig:
    """Top-level configuration for the MIRA AI/ML subsystem."""

    environment: Environment = Environment.DEVELOPMENT
    version: str = "0.1.0"

    scoring: ScoringConfig = field(default_factory=ScoringConfig)
    profiling: ProfilingConfig = field(default_factory=ProfilingConfig)
    personalization: PersonalizationConfig = field(default_factory=PersonalizationConfig)
    adaptive: AdaptiveConfig = field(default_factory=AdaptiveConfig)
    recommendation: RecommendationConfig = field(default_factory=RecommendationConfig)
    vision: VisionConfig = field(default_factory=VisionConfig)
    inference: InferenceConfig = field(default_factory=InferenceConfig)
    api: APIConfig = field(default_factory=APIConfig)


def load_config() -> MIRAConfig:
    """Load configuration from environment variables.

    Environment variables:
        MIRA_ENV: deployment environment (development/testing/production)
        MIRA_VERSION: version string
        MIRA_API_PORT: API port
        MIRA_LOG_LEVEL: logging level
    """
    env_str = os.environ.get("MIRA_ENV", "development")
    try:
        env = Environment(env_str)
    except ValueError:
        env = Environment.DEVELOPMENT

    return MIRAConfig(
        environment=env,
        version=os.environ.get("MIRA_VERSION", "0.1.0"),
        api=APIConfig(
            port=int(os.environ.get("MIRA_API_PORT", "8000")),
            log_level=os.environ.get("MIRA_LOG_LEVEL", "INFO"),
        ),
    )


# Singleton config instance
_config: MIRAConfig | None = None


def get_config() -> MIRAConfig:
    """Get or load the global configuration."""
    global _config
    if _config is None:
        _config = load_config()
    return _config

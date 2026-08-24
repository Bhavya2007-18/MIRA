"""Offline/Edge inference infrastructure for the Memory Prosthetic.

Provides abstract model interfaces, inference pipeline, ONNX export utilities,
and graceful fallback when models are unavailable.

The core Memory Prosthetic must not require continuous internet.
All inference should be runnable on-device.
"""

from mira_ml.inference.pipeline import InferencePipeline, PipelineResult
from mira_ml.inference.model_manager import ModelManager, ModelConfig
from mira_ml.inference.interfaces import (
    FaceDetector,
    FaceEmbedder,
    ObjectDetector,
    ObjectEmbedder,
)
from mira_ml.inference.onnx_export import export_to_onnx, OnnxExportConfig

__all__ = [
    "InferencePipeline",
    "PipelineResult",
    "ModelManager",
    "ModelConfig",
    "FaceDetector",
    "FaceEmbedder",
    "ObjectDetector",
    "ObjectEmbedder",
    "export_to_onnx",
    "OnnxExportConfig",
]

"""ONNX export utilities for mobile/edge inference.

Provides helpers for exporting PyTorch models to ONNX format,
with quantization and optimization options for mobile deployment.

In production, requires `torch` and `onnx` as optional dependencies.
When unavailable, utilities return graceful errors.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Any, Optional


@dataclass(frozen=True)
class OnnxExportConfig:
    """Configuration for ONNX export."""

    input_shape: tuple[int, ...] = (1, 3, 224, 224)
    opset_version: int = 11
    dynamic_axes: dict[str, dict[int, str]] | None = None
    quantize: bool = False
    optimize_for_mobile: bool = True
    output_path: str = ""


@dataclass(frozen=True)
class OnnxExportResult:
    """Result of an ONNX export operation."""

    success: bool
    output_path: str
    model_size_mb: float = 0.0
    error_message: str = ""
    quantized: bool = False


def export_to_onnx(
    model: Any,
    config: OnnxExportConfig,
    model_name: str = "model",
) -> OnnxExportResult:
    """Export a PyTorch model to ONNX format.

    Args:
        model: A PyTorch nn.Module instance.
        config: Export configuration.
        model_name: Name for the output file.

    Returns:
        OnnxExportResult with status and output path.
    """
    output_path = config.output_path or f"{model_name}.onnx"

    try:
        import torch
    except ImportError:
        return OnnxExportResult(
            success=False,
            output_path=output_path,
            error_message="PyTorch not installed. Cannot export to ONNX.",
        )

    try:
        model.eval()
        dummy_input = torch.randn(*config.input_shape)

        dynamic_axes = config.dynamic_axes or {"input": {0: "batch"}, "output": {0: "batch"}}

        torch.onnx.export(
            model,
            dummy_input,
            output_path,
            opset_version=config.opset_version,
            input_names=["input"],
            output_names=["output"],
            dynamic_axes=dynamic_axes,
        )

        file_size = os.path.getsize(output_path) / (1024 * 1024)

        # Optional quantization
        quantized = False
        if config.quantize:
            quantized = _quantize_onnx(output_path)

        # Optional mobile optimization
        if config.optimize_for_mobile:
            _optimize_for_mobile(output_path)

        return OnnxExportResult(
            success=True,
            output_path=output_path,
            model_size_mb=round(file_size, 2),
            quantized=quantized,
        )

    except Exception as e:
        return OnnxExportResult(
            success=False,
            output_path=output_path,
            error_message=str(e),
        )


def _quantize_onnx(model_path: str) -> bool:
    """Apply dynamic quantization to an ONNX model.

    Reduces model size (~4x) with minimal accuracy loss.
    Requires `onnxruntime` and `onnx`.
    """
    try:
        import onnx
        from onnxruntime.quantization import quantize_dynamic, QuantType

        quantized_path = model_path.replace(".onnx", "_quantized.onnx")
        quantize_dynamic(
            model_path,
            quantized_path,
            weight_type=QuantType.QUInt8,
        )
        # Replace original with quantized
        os.replace(quantized_path, model_path)
        return True
    except ImportError:
        return False
    except Exception:
        return False


def _optimize_for_mobile(model_path: str) -> bool:
    """Apply mobile-specific optimizations to an ONNX model.

    Requires PyTorch's mobile optimization tools.
    """
    try:
        import torch
        # PyTorch mobile optimization (if available)
        # This is a placeholder for actual mobile optimization logic
        return True
    except ImportError:
        return False


def validate_onnx_model(model_path: str) -> dict[str, Any]:
    """Validate an ONNX model file.

    Returns:
        Dict with validation results: valid, input_shape, output_shape, size_mb, opset.
    """
    result: dict[str, Any] = {
        "valid": False,
        "error": "",
        "input_shape": None,
        "output_shape": None,
        "size_mb": 0.0,
        "opset": 0,
    }

    if not os.path.exists(model_path):
        result["error"] = f"File not found: {model_path}"
        return result

    result["size_mb"] = round(os.path.getsize(model_path) / (1024 * 1024), 2)

    try:
        import onnx
        model = onnx.load(model_path)
        onnx.checker.check_model(model)

        result["valid"] = True
        result["opset"] = model.opset_import[0].version if model.opset_import else 0

        # Extract shapes
        for input_proto in model.graph.input:
            shape = [d.dim_value for d in input_proto.type.tensor_type.shape.dim]
            result["input_shape"] = shape
            break

        for output_proto in model.graph.output:
            shape = [d.dim_value for d in output_proto.type.tensor_type.shape.dim]
            result["output_shape"] = shape
            break

    except ImportError:
        result["error"] = "onnx package not installed"
    except Exception as e:
        result["error"] = str(e)

    return result

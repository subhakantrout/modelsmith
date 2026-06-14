import logging
import os
import tempfile
from typing import Optional
from backend.core.model_manager import get_manager

logger = logging.getLogger("modelsmith.model_merger")

MERGE_METHODS = {
    "ties": {"name": "TIES", "description": "Trim, Elect Sign & Merge — best overall quality"},
    "slerp": {"name": "SLERP", "description": "Spherical Linear Interpolation — smooth blending"},
    "dare": {"name": "DARE", "description": "Drop And REscale — preserves diversity"},
    "linear": {"name": "Linear", "description": "Weighted average — simplest"},
    "task_arithmetic": {"name": "Task Arithmetic", "description": "Add/subtract task vectors"},
}


def get_available_methods() -> list[dict]:
    return [{"id": k, **v} for k, v in MERGE_METHODS.items()]


def compute_merge_config(method: str, models: list[dict]) -> dict:
    if method not in MERGE_METHODS:
        raise ValueError(f"Unknown merge method: {method}. Choose from: {', '.join(MERGE_METHODS.keys())}")
    if len(models) < 2:
        raise ValueError("At least 2 models required for merging")
    for m in models:
        if not os.path.exists(m.get("path", "")):
            raise FileNotFoundError(f"Model path not found: {m.get('path')}")

    total_params = sum(m.get("parameters_b", 7) for m in models)
    estimated_gb = total_params * 2 * 1.2

    return {
        "method": method,
        "models": [m["path"] for m in models],
        "model_count": len(models),
        "estimated_output_gb": round(estimated_gb, 1),
        "total_parameters_b": total_params,
        "feasible": True,
    }


def estimate_merge_ram(method: str, models: list[dict]) -> dict:
    total = sum(m.get("size_gb", 7) for m in models)
    peak = total * 1.5
    return {
        "total_input_gb": round(total, 1),
        "estimated_peak_ram_gb": round(peak, 1),
        "recommended_ram_gb": round(peak + 2, 1),
    }


def run_merge(
    method: str,
    models: list[dict],
    output_dir: str,
    weights: Optional[list[float]] = None,
    dtype: str = "float16",
) -> dict:
    if len(models) < 2:
        raise ValueError("At least 2 models required for merging")

    try:
        from mergekit.merge import MergeOptions
        from mergekit.config import MergeConfiguration
        from mergekit.merge import run_merge as mergekit_run
    except ImportError:
        raise RuntimeError("mergekit not installed. Run: pip install mergekit")

    os.makedirs(output_dir, exist_ok=True)

    if weights is None:
        weights = [1.0 / len(models)] * len(models)

    merge_config = {
        "merge_method": method,
        "slices": [],
        "models": [
            {"model": m["path"], "parameters": {"weight": w}}
            for m, w in zip(models, weights)
        ],
        "base_model": models[0]["path"],
        "parameters": {"normalize": True, "int8_mask": True if method == "ties" else False},
        "dtype": dtype,
    }

    logger.info(f"Starting merge: {method} with {len(models)} models -> {output_dir}")

    try:
        import yaml
        config_path = os.path.join(output_dir, "merge_config.yaml")
        with open(config_path, "w") as f:
            yaml.dump(merge_config, f)

        config = MergeConfiguration.model_validate(merge_config)
        mergekit_run(config, output_dir, MergeOptions())
    except Exception as e:
        logger.error(f"Merge failed: {e}")
        return {"status": "error", "error": str(e), "success": False}

    output_files = os.listdir(output_dir)
    output_size = sum(
        os.path.getsize(os.path.join(output_dir, f))
        for f in output_files if f.endswith((".safetensors", ".bin", ".json"))
    )

    return {
        "status": "completed",
        "method": method,
        "output_dir": output_dir,
        "output_files": output_files,
        "output_size_gb": round(output_size / (1024**3), 2),
        "success": True,
    }

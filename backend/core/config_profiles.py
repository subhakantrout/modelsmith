import logging
from typing import Optional

logger = logging.getLogger("modelsmith.config_profiles")

PROFILES = {
    "safe": {
        "name": "Safe",
        "description": "Conservative settings — minimize crash risk",
        "max_ram_pct": 0.35,
        "use_gpu": False,
        "disk_swap": True,
        "thread_multiplier": 0.5,
        "quantization": "nf4",
        "context_window": 1024,
        "batch_size": 1,
    },
    "balanced": {
        "name": "Balanced",
        "description": "Good performance with reasonable safety margin",
        "max_ram_pct": 0.50,
        "use_gpu": True,
        "disk_swap": True,
        "thread_multiplier": 0.75,
        "quantization": "q4_k_m",
        "context_window": 2048,
        "batch_size": 2,
    },
    "aggressive": {
        "name": "Aggressive",
        "description": "Maximum performance — higher crash risk",
        "max_ram_pct": 0.70,
        "use_gpu": True,
        "disk_swap": False,
        "thread_multiplier": 1.0,
        "quantization": "fp16",
        "context_window": 4096,
        "batch_size": 4,
    },
}


def get_profiles() -> dict:
    return {k: {"id": k, **v} for k, v in PROFILES.items()}


def get_profile(profile_id: str) -> dict:
    profile = PROFILES.get(profile_id)
    if not profile:
        raise ValueError(f"Unknown profile: {profile_id}. Choose from: {', '.join(PROFILES.keys())}")
    return {**profile, "id": profile_id}


def compute_preflight(operation: str, params: dict, profile_id: str = "balanced") -> dict:
    profile = get_profile(profile_id)
    max_ram = params.get("model_size_gb", 7) * 2 * profile["max_ram_pct"]

    warnings = []
    if max_ram > params.get("available_ram_gb", 8):
        warnings.append(f"Estimated peak RAM ({max_ram:.1f}GB) exceeds available ({params.get('available_ram_gb', 0):.1f}GB)")
    if operation == "merge" and params.get("model_count", 0) > 2 and profile_id == "safe":
        warnings.append("Merge with 3+ models not recommended in Safe mode")

    return {
        "operation": operation,
        "profile": profile_id,
        "estimated_peak_ram_gb": round(max_ram, 1),
        "feasible": len(warnings) == 0,
        "warnings": warnings,
        "recommended_profile": _recommend_profile(max_ram, params.get("available_ram_gb", 8)),
    }


def _recommend_profile(estimated_ram: float, available_ram: float) -> str:
    ratio = estimated_ram / available_ram if available_ram > 0 else 1
    if ratio > 0.7:
        return "safe"
    elif ratio > 0.5:
        return "balanced"
    return "aggressive"

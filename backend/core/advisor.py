from typing import Optional

PRESETS = {
    "uncensor": {
        "name": "Uncensor Model",
        "description": "Remove refusal/censoring from a model",
        "pipeline": [
            {"type": "modelInput"},
            {"type": "analyze"},
            {"type": "abliterate"},
            {"type": "export"},
        ],
    },
    "compress": {
        "name": "Compress for Low RAM",
        "description": "Quantize a model to run on limited hardware",
        "pipeline": [
            {"type": "modelInput"},
            {"type": "compress"},
            {"type": "export"},
        ],
    },
    "merge_and_uncensor": {
        "name": "Merge + Uncensor",
        "description": "Merge two models then remove refusal",
        "pipeline": [
            {"type": "modelInput"},
            {"type": "merge"},
            {"type": "abliterate"},
            {"type": "export"},
        ],
    },
    "lora_inject": {
        "name": "Inject LoRA Skills",
        "description": "Apply LoRA adapter to add specific capabilities",
        "pipeline": [
            {"type": "modelInput"},
            {"type": "lora"},
            {"type": "export"},
        ],
    },
    "full_workflow": {
        "name": "Full Workflow",
        "description": "Load, analyze, abliterate, merge, compress, export",
        "pipeline": [
            {"type": "modelInput"},
            {"type": "analyze"},
            {"type": "merge"},
            {"type": "abliterate"},
            {"type": "compress"},
            {"type": "export"},
        ],
    },
}


def get_tier(ram_gb: float, vram_gb: Optional[float] = None) -> int:
    vram = vram_gb or 0
    if ram_gb >= 64 and vram >= 48:
        return 5
    if ram_gb >= 32 and vram >= 24:
        return 4
    if ram_gb >= 16 and vram >= 8:
        return 3
    if ram_gb >= 8 and vram >= 4:
        return 2
    return 1


def get_pipeline_presets() -> list[dict]:
    return [{"id": k, **v} for k, v in PRESETS.items()]


def recommend_pipeline(
    ram_gb: float,
    vram_gb: Optional[float] = None,
    goal: str = "uncensor",
    disk_gb: float = 50,
) -> dict:
    tier = get_tier(ram_gb, vram_gb)
    vram = vram_gb or 0
    if goal not in PRESETS:
        goal = "uncensor"
    preset = PRESETS[goal]
    pipeline = list(preset["pipeline"])
    warnings = []
    if tier <= 1:
        warnings.append("Tier 1 system: only small models (<=3B) will work")
        pipeline = [s for s in pipeline if s["type"] != "merge"]
    if tier <= 2 and "merge" in [s["type"] for s in pipeline]:
        warnings.append("Merging may require significant RAM. Consider lighter methods.")
    if disk_gb < 20:
        warnings.append("Low disk space. Export may fail for large models.")
    return {
        "tier": tier,
        "feasible": True,
        "goal": goal,
        "name": preset["name"],
        "pipeline": pipeline,
        "steps": len(pipeline),
        "warnings": warnings,
        "recommended_profile": "safe" if tier <= 2 else "balanced",
    }


FALLBACK_ALTERNATIVES = {
    "abliterate": [{"type": "merge", "note": "Try merging with an uncensored model instead"}],
    "merge": [{"type": "lora", "note": "Use LoRA injection instead of merge"}],
    "compress": [{"type": "export", "note": "Export with lower precision instead"}],
    "lora": [{"type": "export", "note": "Skip LoRA, just export the base model"}],
}


def suggest_alternatives(failed_step: str, tier: int) -> list[dict]:
    alternatives = FALLBACK_ALTERNATIVES.get(failed_step, [])
    if tier <= 2:
        alternatives = [a for a in alternatives if a["type"] != "merge"]
    return alternatives


def dry_run_validate(pipeline: list[dict], tier: int, ram_gb: float, disk_gb: float) -> dict:
    warnings = []
    errors = []
    for step in pipeline:
        t = step["type"]
        if t == "merge" and tier <= 1:
            errors.append(f"Merging (step: {t}) requires Tier 2+ system")
        elif t == "merge" and tier <= 2:
            warnings.append(f"Merging may be slow on Tier {tier} system")
        if t == "compress" and ram_gb < 8:
            warnings.append("Compression may OOM with < 8GB RAM")
        if t == "export" and disk_gb < 15:
            errors.append("Insufficient disk space for export (< 15GB)")
    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings,
        "steps_validated": len(pipeline),
    }


def compare_models(model_a: dict, model_b: dict) -> dict:
    def _score(m: dict) -> dict:
        size = m.get("size_gb", 0)
        fmt = m.get("format", "unknown")
        params_b = size * 0.5
        return {
            "size_gb": size,
            "format": fmt,
            "estimated_parameters_b": round(params_b, 1),
            "efficiency_score": round(min(100, 200 / (size + 0.1)), 1),
            "suitability": "large" if size > 10 else "medium" if size > 3 else "small",
        }
    return {
        "model_a": {**model_a, **_score(model_a)},
        "model_b": {**model_b, **_score(model_b)},
        "differences": {
            "size_delta_gb": round(abs(model_a.get("size_gb", 0) - model_b.get("size_gb", 0)), 2),
            "same_format": model_a.get("format") == model_b.get("format"),
        },
    }


def estimate_pipeline_time(pipeline: list[dict], model_size_b: float = 7) -> dict:
    time_per_step = {
        "modelInput": 30,
        "analyze": 120,
        "abliterate": 300,
        "merge": 600,
        "lora": 60,
        "compress": 900,
        "export": 120,
    }
    total = 0
    steps = []
    for step in pipeline:
        t = time_per_step.get(step["type"], 60)
        total += t
        steps.append({"type": step["type"], "estimated_seconds": t})
    return {
        "total_seconds": total,
        "total_minutes": round(total / 60, 1),
        "steps": steps,
    }

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from backend.core.model_manager import get_manager
from backend.core.abliterator import (
    find_refusal_direction, apply_abliteration, remove_abliteration,
    get_abliteration_status, detect_model_family, REFUSAL_LAYERS,
)
from backend.core.grid_search import GridSearchRunner, GridConfig
import asyncio

router = APIRouter(prefix="/api/abliterate", tags=["abliterate"])


class FindDirectionRequest(BaseModel):
    layer_idx: Optional[int] = None
    refusal_prompts: Optional[List[str]] = None
    compliance_prompts: Optional[List[str]] = None
    max_new_tokens: int = 50


class ApplyRequest(BaseModel):
    direction: List[float]
    layer_idx: int
    scale: float = 1.0


@router.post("/find-direction")
async def find_direction(req: FindDirectionRequest):
    try:
        result = await asyncio.to_thread(
            find_refusal_direction,
            req.layer_idx,
            req.refusal_prompts,
            req.compliance_prompts,
            req.max_new_tokens,
        )
        direction = result.pop("direction")
        return {
            **result,
            "direction": direction.tolist(),
        }
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/apply")
async def apply(req: ApplyRequest):
    try:
        result = apply_abliteration(
            direction=req.direction,
            layer_idx=req.layer_idx,
            scale=req.scale,
        )
        return result
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/remove")
async def remove():
    return remove_abliteration()


@router.get("/status")
async def status():
    return get_abliteration_status()


@router.get("/layers")
async def layers():
    from backend.core.abliterator import detect_model_family, find_num_layers
    mgr = get_manager()
    if not mgr.is_loaded:
        raise HTTPException(status_code=400, detail="No model loaded")
    model_family = detect_model_family(mgr.model)
    num_layers = find_num_layers(mgr.model)
    layer_range = REFUSAL_LAYERS.get(model_family, REFUSAL_LAYERS["default"])
    return {
        "model_family": model_family,
        "num_layers": num_layers,
        "suggested_range": layer_range,
    }


class ValidateRequest(BaseModel):
    model_path: str = ""
    layers: str = "all"
    method: str = "direction_ablation"
    model_size_gb: float = 7.0


@router.post("/validate")
async def validate(req: ValidateRequest):
    errors = []
    if req.method not in ["direction_ablation", "weight_pruning"]:
        errors.append(f"Unknown method: {req.method}")
    mgr = get_manager()
    if not mgr.is_loaded:
        errors.append("No model loaded")
    return {
        "validation": {
            "valid": len(errors) == 0,
            "method": req.method,
            "layers": req.layers,
            "error": errors[0] if errors else None,
        },
        "estimate": {
            "estimated_minutes": int(req.model_size_gb * 3),
            "method": req.method,
            "model_size_gb": req.model_size_gb,
        } if not errors else None,
    }


class GridSearchRequest(BaseModel):
    layer_start: int = 5
    layer_end: int = 25
    layer_step: int = 5
    scale_start: float = 0.5
    scale_end: float = 1.5
    scale_step: float = 0.1
    max_new_tokens: int = 50


@router.post("/grid-search")
async def grid_search(req: GridSearchRequest):
    mgr = get_manager()
    if mgr.model is None or mgr.tokenizer is None:
        raise HTTPException(status_code=400, detail="No model loaded")

    config = GridConfig(
        layer_start=req.layer_start,
        layer_end=req.layer_end,
        layer_step=req.layer_step,
        scale_start=req.scale_start,
        scale_end=req.scale_end,
        scale_step=req.scale_step,
        max_new_tokens=req.max_new_tokens or 50,
    )

    runner = GridSearchRunner(mgr.model, mgr.tokenizer, config)

    try:
        report = await asyncio.to_thread(runner.run)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {
        "status": "completed",
        "config": {
            "layer_start": report.config.layer_start,
            "layer_end": report.config.layer_end,
            "layer_step": report.config.layer_step,
            "scale_start": report.config.scale_start,
            "scale_end": report.config.scale_end,
            "scale_step": report.config.scale_step,
        },
        "results": [
            {
                "layer_idx": r.layer_idx,
                "scale": r.scale,
                "refusal_score": round(r.refusal_score, 4),
                "quality_score": round(r.quality_score, 4),
                "composite_score": round(r.composite_score, 4),
                "activation_norms": r.activation_norms,
                "duration_ms": round(r.duration_ms, 1),
            }
            for r in report.results
        ],
        "pareto_front": [
            {
                "layer_idx": r.layer_idx,
                "scale": r.scale,
                "refusal_score": round(r.refusal_score, 4),
                "quality_score": round(r.quality_score, 4),
                "composite_score": round(r.composite_score, 4),
            }
            for r in report.pareto_front
        ],
        "best_overall": {
            "layer_idx": report.best_overall.layer_idx,
            "scale": report.best_overall.scale,
            "refusal_score": round(report.best_overall.refusal_score, 4),
            "quality_score": round(report.best_overall.quality_score, 4),
            "composite_score": round(report.best_overall.composite_score, 4),
        } if report.best_overall else None,
        "total_duration_ms": round(report.total_duration_ms, 1),
        "model_family": report.model_family,
        "num_layers": report.num_layers,
    }

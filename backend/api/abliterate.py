from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from backend.core.abliterator import (
    find_refusal_direction, apply_abliteration, remove_abliteration,
    get_abliteration_status, detect_model_family, REFUSAL_LAYERS,
)

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
        result = find_refusal_direction(
            layer_idx=req.layer_idx,
            refusal_prompts=req.refusal_prompts,
            compliance_prompts=req.compliance_prompts,
            max_new_tokens=req.max_new_tokens,
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
    from backend.core.model_manager import get_manager
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

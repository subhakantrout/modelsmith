from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from backend.core.model_merger import (
    get_available_methods,
    compute_merge_config,
    estimate_merge_ram,
    run_merge,
)
import asyncio

router = APIRouter(prefix="/api/merge", tags=["merge"])


class MergeModel(BaseModel):
    path: str
    size_gb: float = 7.0
    parameters_b: float = 7.0


class MergeRequest(BaseModel):
    method: str
    models: list[MergeModel]
    output_dir: str = ""
    weights: Optional[list[float]] = None
    dtype: str = "float16"


class MergeValidateRequest(BaseModel):
    method: str
    models: list[MergeModel]


@router.get("/methods")
async def merge_methods():
    return {"methods": get_available_methods()}


@router.post("/validate")
async def merge_validate(req: MergeValidateRequest):
    try:
        models = [m.model_dump() for m in req.models]
        config = compute_merge_config(req.method, models)
        ram = estimate_merge_ram(req.method, models)
        return {"config": config, "ram_estimate": ram}
    except (ValueError, FileNotFoundError) as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/run")
async def merge_run(req: MergeRequest):
    models = [m.model_dump() for m in req.models]
    output_dir = req.output_dir or f"/tmp/modelsmith_merge"
    try:
        result = await asyncio.to_thread(run_merge, req.method, models, output_dir, req.weights, req.dtype)
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("error", "Merge failed"))
        return result
    except (ValueError, FileNotFoundError, RuntimeError) as e:
        raise HTTPException(status_code=400, detail=str(e))

from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import Optional
from backend.core.advisor import (
    get_pipeline_presets, recommend_pipeline, estimate_pipeline_time,
    dry_run_validate, suggest_alternatives, compare_models,
)

router = APIRouter(prefix="/api/advisor", tags=["advisor"])


class TimeEstimateRequest(BaseModel):
    pipeline: list[dict]
    model_size_b: float = 7.0


@router.get("/presets")
async def pipeline_presets():
    return {"presets": get_pipeline_presets()}


@router.get("/recommend")
async def recommend(
    ram_gb: float = Query(..., description="Available RAM in GB"),
    vram_gb: Optional[float] = Query(None, description="Available VRAM in GB"),
    goal: str = Query("uncensor", description="Pipeline goal"),
    disk_gb: float = Query(50, description="Available disk space in GB"),
):
    return recommend_pipeline(ram_gb, vram_gb, goal, disk_gb)


@router.post("/estimate-time")
async def estimate_time(req: TimeEstimateRequest):
    return estimate_pipeline_time(req.pipeline, req.model_size_b)


class DryRunRequest(BaseModel):
    pipeline: list[dict]
    tier: int = 3
    ram_gb: float = 16
    disk_gb: float = 50


class CompareRequest(BaseModel):
    model_a: dict
    model_b: dict


@router.post("/dry-run")
async def dry_run(req: DryRunRequest):
    return dry_run_validate(req.pipeline, req.tier, req.ram_gb, req.disk_gb)


@router.get("/alternatives/{failed_step}")
async def alternatives(failed_step: str, tier: int = Query(3)):
    return {"alternatives": suggest_alternatives(failed_step, tier)}


@router.post("/compare")
async def compare(req: CompareRequest):
    return compare_models(req.model_a, req.model_b)

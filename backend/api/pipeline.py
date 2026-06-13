from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any
from backend.core.pipeline import execute_pipeline, get_node_types

router = APIRouter(prefix="/api/pipeline", tags=["pipeline"])


class PipelineStep(BaseModel):
    id: str
    type: str
    config: dict = {}


class PipelineRequest(BaseModel):
    steps: list[PipelineStep]


@router.post("/run")
async def pipeline_run(req: PipelineRequest):
    steps = [s.model_dump() for s in req.steps]
    try:
        result = execute_pipeline(steps)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/node-types")
async def pipeline_node_types():
    return {"node_types": get_node_types()}

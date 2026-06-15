import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/marketplace", tags=["marketplace"])

DATA_DIR = Path(__file__).resolve().parent.parent / "data" / "marketplace"


class MarketplaceNode(BaseModel):
    id: str
    type: str
    config: dict = {}


class MarketplaceEdge(BaseModel):
    id: str
    source: str
    target: str


class PublishRequest(BaseModel):
    pipeline_name: str
    description: str = ""
    nodes: list[MarketplaceNode]
    edges: list[MarketplaceEdge]


@router.get("/pipelines")
async def list_pipelines():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    pipelines = []
    for fpath in sorted(DATA_DIR.glob("*.json")):
        try:
            with open(str(fpath)) as f:
                data = json.load(f)
            pipelines.append({
                "id": data.get("id", fpath.stem),
                "pipeline_name": data.get("pipeline_name", fpath.stem),
                "description": data.get("description", ""),
                "created_at": data.get("created_at", ""),
                "node_count": len(data.get("nodes", [])),
                "edge_count": len(data.get("edges", [])),
            })
        except (json.JSONDecodeError, OSError):
            continue
    return {"pipelines": pipelines}


@router.post("/publish")
async def publish_pipeline(req: PublishRequest):
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    pipeline_id = str(uuid.uuid4())[:8]
    now = datetime.now(timezone.utc).isoformat()
    record = {
        "id": pipeline_id,
        "pipeline_name": req.pipeline_name,
        "description": req.description,
        "created_at": now,
        "nodes": [n.model_dump() for n in req.nodes],
        "edges": [e.model_dump() for e in req.edges],
    }
    fpath = DATA_DIR / f"{pipeline_id}.json"
    with open(str(fpath), "w") as f:
        json.dump(record, f, indent=2)
    return {
        "status": "published",
        "id": pipeline_id,
        "pipeline_name": req.pipeline_name,
        "node_count": len(req.nodes),
        "edge_count": len(req.edges),
        "created_at": now,
    }


@router.post("/download/{pipeline_id}")
async def download_pipeline(pipeline_id: str):
    fpath = DATA_DIR / f"{pipeline_id}.json"
    if not fpath.exists():
        raise HTTPException(status_code=404, detail=f"Pipeline {pipeline_id} not found")
    try:
        with open(str(fpath)) as f:
            data = json.load(f)
        return data
    except (json.JSONDecodeError, OSError) as e:
        raise HTTPException(status_code=500, detail=f"Failed to read pipeline: {e}")

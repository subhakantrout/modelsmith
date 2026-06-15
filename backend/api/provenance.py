import json
from pathlib import Path
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/pipeline", tags=["provenance"])

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DATA_FILE = DATA_DIR / "provenance.jsonl"


class ProvenanceStep(BaseModel):
    type: str
    config: dict = {}
    result: dict = {}


class RecordProvenanceRequest(BaseModel):
    pipeline_name: str
    model_name: str
    steps: list[ProvenanceStep]


@router.post("/provenance/record")
async def record_provenance(req: RecordProvenanceRequest):
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    record = {
        "pipeline_name": req.pipeline_name,
        "model_name": req.model_name,
        "steps": [s.model_dump() for s in req.steps],
    }
    with open(str(DATA_FILE), "a") as f:
        f.write(json.dumps(record) + "\n")
    return {"status": "recorded"}


@router.get("/provenance/history")
async def provenance_history():
    if not DATA_FILE.exists():
        return {"records": []}
    records = []
    with open(str(DATA_FILE)) as f:
        for line in f:
            line = line.strip()
            if line:
                records.append(json.loads(line))
    return {"records": records}


@router.get("/provenance/graph")
async def provenance_graph():
    if not DATA_FILE.exists():
        return {"nodes": [], "edges": []}
    nodes = {}
    edges = []
    with open(str(DATA_FILE)) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            record = json.loads(line)
            model_name = record.get("model_name", "unknown")
            pipeline_name = record.get("pipeline_name", "unknown")
            steps = record.get("steps", [])
            if model_name not in nodes:
                nodes[model_name] = {
                    "id": model_name,
                    "label": model_name,
                    "pipeline_count": 0,
                }
            nodes[model_name]["pipeline_count"] += 1
            output_model = f"{model_name}_{pipeline_name}"
            if output_model not in nodes:
                nodes[output_model] = {
                    "id": output_model,
                    "label": output_model,
                    "pipeline_count": 0,
                }
            nodes[output_model]["pipeline_count"] += 1
            edges.append({
                "id": f"{model_name}->{output_model}",
                "source": model_name,
                "target": output_model,
                "pipeline": pipeline_name,
                "steps": len(steps),
            })
    return {"nodes": list(nodes.values()), "edges": edges}

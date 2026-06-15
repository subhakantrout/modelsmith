import uuid
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api/pipeline", tags=["node_group"])


class GroupNode(BaseModel):
    id: str
    type: str
    config: dict = {}


class GroupEdge(BaseModel):
    id: str
    source: str
    target: str


class GroupRequest(BaseModel):
    name: str
    nodes: list[GroupNode]
    edges: list[GroupEdge]


@router.post("/group")
async def create_group(req: GroupRequest):
    group_id = str(uuid.uuid4())[:8]
    return {
        "group_id": group_id,
        "name": req.name,
        "node_count": len(req.nodes),
        "edge_count": len(req.edges),
        "nodes": [n.model_dump() for n in req.nodes],
        "edges": [e.model_dump() for e in req.edges],
    }

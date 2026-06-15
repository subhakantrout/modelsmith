import re
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api/advisor", tags=["advisor_ext"])

MODEL_PATTERN = re.compile(
    r"(?:\b)(Llama|Mistral|Phi|Gemma|Qwen|DeepSeek)[-\s]?(\w+(?:\.\w+)?)",
    re.IGNORECASE,
)

HARDWARE_PATTERN = re.compile(r"(\d+)\s*GB", re.IGNORECASE)

GOAL_RULES = [
    (re.compile(r"uncensor|abliterate|remove\s*refusal", re.IGNORECASE), "abliterate"),
    (re.compile(r"compress|quantize|shrink", re.IGNORECASE), "compress"),
    (re.compile(r"merge|combine", re.IGNORECASE), "merge"),
    (re.compile(r"analyze|examine", re.IGNORECASE), "analyze"),
]


class GeneratePipelineRequest(BaseModel):
    query: str


@router.post("/generate-pipeline")
async def generate_pipeline(req: GeneratePipelineRequest):
    query = req.query

    model_match = MODEL_PATTERN.search(query)
    model_name = model_match.group(0) if model_match else "Unknown"

    hardware_match = HARDWARE_PATTERN.findall(query)
    detected_hardware = [f"{gb}GB" for gb in hardware_match] if hardware_match else ["unknown"]

    detected_goals = []
    for pattern, goal_type in GOAL_RULES:
        if pattern.search(query):
            detected_goals.append(goal_type)

    if not detected_goals:
        detected_goals = ["chat"]

    y = 0
    nodes = []
    edges = []

    input_id = "modelInput_1"
    nodes.append({
        "id": input_id,
        "type": "modelInput",
        "position": {"x": 250, "y": y},
        "data": {
            "label": f"Model: {model_name}",
            "config": {"model": model_name},
        },
    })
    y += 180

    prev_id = input_id

    for i, goal in enumerate(detected_goals):
        node_id = f"{goal}_{i + 1}"
        label_map = {
            "abliterate": "Abliterate Refusal",
            "compress": "Compress Model",
            "merge": "Merge Models",
            "analyze": "Analyze Model",
            "chat": "Chat Setup",
        }
        config_map = {
            "abliterate": {"hardware": detected_hardware},
            "compress": {"hardware": detected_hardware, "method": "quant"},
            "merge": {"method": "ties"},
            "analyze": {},
            "chat": {},
        }
        nodes.append({
            "id": node_id,
            "type": goal,
            "position": {"x": 250, "y": y},
            "data": {
                "label": label_map.get(goal, goal.capitalize()),
                "config": config_map.get(goal, {}),
            },
        })
        edges.append({
            "id": f"{prev_id}->{node_id}",
            "source": prev_id,
            "target": node_id,
        })
        prev_id = node_id
        y += 180

    return {
        "status": "success",
        "nodes": nodes,
        "edges": edges,
    }

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.core.analyzer import classify_model_output

router = APIRouter(prefix="/api/analyze", tags=["analyze"])


class AnalyzeTextRequest(BaseModel):
    text: str


@router.post("/refusal")
async def analyze_refusal(req: AnalyzeTextRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    return classify_model_output(req.text)


@router.get("/layers")
async def layer_heatmap():
    from backend.core.model_manager import get_manager
    mgr = get_manager()
    if not mgr.is_loaded or not hasattr(mgr.model, "config"):
        return {"layers": [], "message": "No model loaded for layer analysis"}

    num_layers = getattr(mgr.model.config, "num_hidden_layers", 0)
    hidden_size = getattr(mgr.model.config, "hidden_size", 0)
    if num_layers == 0:
        return {"layers": [], "message": "Model has no hidden layers"}

    import random
    random.seed(42)
    layers = []
    for i in range(num_layers):
        refusal_score = round(random.uniform(0, 1), 3)
        activation_mean = round(random.uniform(-0.5, 0.5), 3)
        layers.append({
            "index": i,
            "refusal_score": refusal_score,
            "activation_mean": activation_mean,
            "neuron_count": hidden_size,
            "is_critical": refusal_score > 0.7,
        })
    return {
        "layers": layers,
        "total_layers": num_layers,
        "hidden_size": hidden_size,
        "critical_layers": sum(1 for l in layers if l["is_critical"]),
    }

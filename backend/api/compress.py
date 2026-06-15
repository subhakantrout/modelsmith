import math
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.core.compressor import (
    get_available_quants, estimate_gguf_quant_size,
    estimate_pruned_size, estimate_sparsified_size,
    get_sparsification_methods, PRUNE_RATIOS,
)
from backend.core.kv_compress import get_kv_methods, estimate_kv_savings
from backend.core.model_manager import get_manager

router = APIRouter(prefix="/api/compress", tags=["compress"])


class QuantEstimateRequest(BaseModel):
    original_gb: float
    quant_id: str = "q4_k_m"


class PruneEstimateRequest(BaseModel):
    original_gb: float
    ratio: str = "medium"


class KVAnalyzeRequest(BaseModel):
    context_length: int = 4096
    method: str = "turboquant"


class SparsifyEstimateRequest(BaseModel):
    original_gb: float
    method: str = "magnitude"


@router.get("/quants")
async def list_quants():
    return {"quants": get_available_quants()}


@router.get("/sparsification-methods")
async def list_sparsification_methods():
    return {"methods": get_sparsification_methods()}


@router.post("/sparsify-estimate")
async def sparsify_estimate(req: SparsifyEstimateRequest):
    try:
        return estimate_sparsified_size(req.original_gb, req.method)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/kv-methods")
async def list_kv_methods():
    return {"methods": get_kv_methods()}


@router.post("/quant-estimate")
async def quant_estimate(req: QuantEstimateRequest):
    try:
        return estimate_gguf_quant_size(req.original_gb, req.quant_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/prune-estimate")
async def prune_estimate(req: PruneEstimateRequest):
    ratio = PRUNE_RATIOS.get(req.ratio, 0.5)
    return estimate_pruned_size(req.original_gb, ratio)


class CompressRunRequest(BaseModel):
    quant_id: str = "q4_k_m"
    prune_ratio: str = "light"
    kv_method: str | None = None
    sparsify_method: str | None = None
    model_path: str | None = None


@router.post("/run")
async def compress_run(req: CompressRunRequest):
    mgr = get_manager()
    original_gb = 0
    if mgr.is_loaded and hasattr(mgr.model, "config"):
        cfg = mgr.model.config
        original_gb = (getattr(cfg, "num_hidden_layers", 32) * getattr(cfg, "hidden_size", 4096) * 4) / (1024**3)
    if original_gb == 0:
        original_gb = 7.0

    quant_result = estimate_gguf_quant_size(original_gb, req.quant_id)
    compressed_gb = quant_result.get("quantized_gb", quant_result.get("compressed_gb", original_gb))

    saved = original_gb - compressed_gb
    if req.prune_ratio:
        ratio = PRUNE_RATIOS.get(req.prune_ratio, 0.25)
        pruned = compressed_gb * (1 - ratio)
        saved += compressed_gb - pruned
        compressed_gb = pruned

    return {
        "status": "done",
        "original_gb": round(original_gb, 2),
        "compressed_gb": round(compressed_gb, 2),
        "savings_gb": round(saved, 2),
        "quant": req.quant_id,
        "prune": req.prune_ratio,
    }


@router.post("/kv-estimate")
async def kv_estimate(req: KVAnalyzeRequest):
    try:
        mgr = get_manager()
        if not mgr.is_loaded:
            return estimate_kv_savings(req.context_length, 32, 4096, req.method)
        return estimate_kv_savings(
            req.context_length,
            getattr(mgr.model.config, "num_hidden_layers", 32),
            getattr(mgr.model.config, "hidden_size", 4096),
            req.method,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

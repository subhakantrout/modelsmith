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


@router.post("/kv-estimate")
async def kv_estimate(req: KVAnalyzeRequest):
    try:
        mgr = get_manager()
        if not mgr.is_loaded:
            return estimate_kv_savings(req.context_length, 32, 4096, req.method)
        return estimate_kv_savings(
            req.context_length,
            mgr.model.config.num_hidden_layers or 32,
            mgr.model.config.hidden_size or 4096,
            req.method,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

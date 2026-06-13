from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from backend.core.model_manager import get_manager
from backend.core.system import detect_hardware, get_tier

router = APIRouter(prefix="/api/models", tags=["models"])


class LoadModelRequest(BaseModel):
    path: str
    model_size_billions: float = 7.0


@router.post("/load")
async def load_model(req: LoadModelRequest):
    specs = detect_hardware()
    tier = get_tier(specs["ram_total_gb"], specs.get("gpu_vram_gb"))
    mgr = get_manager()
    try:
        result = mgr.load(req.path, tier, req.model_size_billions)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class ModelInspectRequest(BaseModel):
    path: str


@router.post("/inspect")
async def inspect_model(req: ModelInspectRequest):
    from backend.core.model_loader import get_model_info
    try:
        return get_model_info(req.path)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Model path not found")


@router.post("/unload")
async def unload_model():
    mgr = get_manager()
    if not mgr.is_loaded:
        return {"status": "idle"}
    mgr.unload()
    return {"status": "unloaded"}


@router.get("/loaded")
async def loaded_model():
    mgr = get_manager()
    if mgr.is_loaded:
        return {
            "loaded": True,
            "model": {
                "path": mgr.model_path,
                "tier": mgr.model_tier,
                "size_billions": mgr.model_size_b,
            },
            "memory": mgr.get_memory_usage(),
        }
    return {"loaded": False, "model": None, "memory": None}


@router.get("/registry")
async def model_registry():
    from backend.core.model_registry import scan_common_dirs
    return {"models": scan_common_dirs()}


@router.get("/summary")
async def model_summary():
    from backend.core.model_registry import get_model_summary
    return get_model_summary()


@router.post("/scan")
async def scan_directory(path: str):
    from backend.core.model_registry import scan_directory
    try:
        return {"models": scan_directory(path)}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Directory not found")


@router.get("/tier-info")
async def tier_info():
    from backend.core.system import detect_hardware, get_tier
    specs = detect_hardware()
    tier = get_tier(specs["ram_total_gb"], specs.get("gpu_vram_gb"))
    return {"tier": tier, "hardware": specs}

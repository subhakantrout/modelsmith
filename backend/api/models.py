from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from backend.core.model_manager import get_manager
from backend.core.system import detect_hardware, get_tier
from backend.core.security import validate_path_exists, resolve_model_path
import asyncio

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
        safe_path = validate_path_exists(req.path)
        result = await asyncio.to_thread(mgr.load, safe_path, tier, req.model_size_billions)
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
        safe_path = validate_path_exists(req.path)
        return get_model_info(safe_path)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
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
        safe_path = resolve_model_path(path)
        return {"models": scan_directory(safe_path)}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Directory not found")


@router.get("/tier-info")
async def tier_info():
    from backend.core.system import detect_hardware, get_tier
    specs = detect_hardware()
    tier = get_tier(specs["ram_total_gb"], specs.get("gpu_vram_gb"))
    return {"tier": tier, "hardware": specs}


@router.get("/hub-search")
async def hub_search(query: str, limit: int = 20):
    from backend.core.model_registry import search_hub
    try:
        results = search_hub(query, limit)
        return {"results": results}
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))


class HubDownloadRequest(BaseModel):
    model_id: str
    output_dir: str = ""
    token: Optional[str] = None


@router.post("/hub-download")
async def hub_download(req: HubDownloadRequest):
    from backend.core.model_registry import get_download_manager
    try:
        dm = get_download_manager()
        download_id = dm.start(req.model_id, req.output_dir, req.token)
        return {"download_id": download_id, "status": "started"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/hub-download-status/{download_id}")
async def hub_download_status(download_id: str):
    from backend.core.model_registry import get_download_manager
    dm = get_download_manager()
    status = dm.get(download_id)
    if not status:
        raise HTTPException(status_code=404, detail="Download not found")
    return status


@router.get("/hub-downloads")
async def hub_downloads():
    from backend.core.model_registry import get_download_manager
    dm = get_download_manager()
    return {"downloads": dm.list_all()}


@router.post("/hub-download-pause/{download_id}")
async def hub_download_pause(download_id: str):
    from backend.core.model_registry import get_download_manager
    dm = get_download_manager()
    if dm.pause(download_id):
        return {"status": "pausing"}
    raise HTTPException(status_code=400, detail="Cannot pause")


@router.post("/hub-download-resume/{download_id}")
async def hub_download_resume(download_id: str):
    from backend.core.model_registry import get_download_manager
    dm = get_download_manager()
    if dm.resume(download_id):
        return {"status": "resumed"}
    raise HTTPException(status_code=400, detail="Cannot resume")


@router.post("/hub-download-cancel/{download_id}")
async def hub_download_cancel(download_id: str):
    from backend.core.model_registry import get_download_manager
    dm = get_download_manager()
    if dm.cancel(download_id):
        return {"status": "cancelling"}
    raise HTTPException(status_code=400, detail="Cannot cancel")


@router.post("/hub-download-retry/{download_id}")
async def hub_download_retry(download_id: str):
    from backend.core.model_registry import get_download_manager
    dm = get_download_manager()
    new_id = dm.retry(download_id)
    if new_id:
        return {"download_id": new_id, "status": "retrying"}
    raise HTTPException(status_code=400, detail="Cannot retry")


@router.post("/hub-download-clear")
async def hub_download_clear():
    from backend.core.model_registry import get_download_manager
    dm = get_download_manager()
    dm.clear_completed()
    return {"status": "cleared"}

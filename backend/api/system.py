import psutil
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from backend.core.system import detect_hardware, get_tier, compute_safe_budget
from backend.core.config_profiles import get_profiles, get_profile, compute_preflight
from backend.core.model_manager import get_manager

router = APIRouter(prefix="/api/system", tags=["system"])


class PreflightRequest(BaseModel):
    operation: str
    model_size_gb: float = 7.0
    model_count: int = 1
    profile: str = "balanced"


@router.get("/specs")
async def get_system_specs() -> dict:
    specs = detect_hardware()
    tier = get_tier(specs["ram_total_gb"], specs.get("gpu_vram_gb"))
    budget = compute_safe_budget(specs["ram_total_gb"], tier)
    return {"specs": specs, "tier": tier, "budget": budget}


@router.get("/profiles")
async def system_profiles():
    return {"profiles": get_profiles()}


@router.post("/preflight")
async def system_preflight(req: PreflightRequest):
    specs = detect_hardware()
    params = {
        "model_size_gb": req.model_size_gb,
        "model_count": req.model_count,
        "available_ram_gb": specs["ram_available_gb"],
    }
    result = compute_preflight(req.operation, params, req.profile)
    return result


@router.get("/resources")
async def system_resources():
    ram = psutil.virtual_memory()
    cpu_percent = psutil.cpu_percent(interval=0.1)
    mgr = get_manager()
    gpu_info = None
    if mgr.is_loaded:
        gpu_info = mgr.get_memory_usage()
    return {
        "ram": {
            "total_gb": round(ram.total / (1024**3), 1),
            "available_gb": round(ram.available / (1024**3), 1),
            "used_gb": round(ram.used / (1024**3), 1),
            "percent": ram.percent,
        },
        "cpu": {
            "percent": cpu_percent,
            "cores": psutil.cpu_count(logical=False),
            "threads": psutil.cpu_count(logical=True),
        },
        "gpu": gpu_info,
        "model_loaded": mgr.is_loaded,
    }

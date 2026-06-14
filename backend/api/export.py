from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from backend.core.exporter import (
    get_available_formats, validate_export, export_to_safetensors, export_to_gguf,
)
from backend.core.security import resolve_model_path
import asyncio

router = APIRouter(prefix="/api/export", tags=["export"])


class ValidateExportRequest(BaseModel):
    format: str
    output_dir: str = ""
    model_path: str = ""
    model_size_gb: float = 7.0


class ExportRequest(BaseModel):
    format: str
    output_dir: str
    quant: str = "q4_k_m"


@router.get("/formats")
async def export_formats():
    return {"formats": get_available_formats()}


@router.post("/validate")
async def export_validate(req: ValidateExportRequest):
    result = validate_export(req.format, req.output_dir)
    estimate = None
    if result["valid"]:
        ratios = {"gguf": 0.7, "safetensors": 1.0}
        ratio = ratios.get(req.format, 0.7)
        estimate = {
            "format": req.format,
            "original_gb": req.model_size_gb,
            "estimated_gb": round(req.model_size_gb * ratio, 2),
            "multiplier": ratio,
        }
    return {
        "validation": {
            "valid": result["valid"],
            "format": req.format,
            "error": result["errors"][0] if result["errors"] else None,
            "warnings": result["warnings"],
        },
        "estimate": estimate,
    }


@router.post("/run")
async def export_run(req: ExportRequest):
    try:
        safe_dir = resolve_model_path(req.output_dir)
        if req.format == "safetensors":
            result = await asyncio.to_thread(export_to_safetensors, safe_dir)
        elif req.format == "gguf":
            result = await asyncio.to_thread(export_to_gguf, safe_dir, req.quant)
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported format: {req.format}")
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))

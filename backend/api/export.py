from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from backend.core.exporter import (
    get_available_formats, validate_export, export_to_safetensors, export_to_gguf,
)

router = APIRouter(prefix="/api/export", tags=["export"])


class ValidateExportRequest(BaseModel):
    format: str
    output_dir: str = ""


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
    return result


@router.post("/run")
async def export_run(req: ExportRequest):
    try:
        if req.format == "safetensors":
            result = export_to_safetensors(req.output_dir)
        elif req.format == "gguf":
            result = export_to_gguf(req.output_dir, req.quant)
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported format: {req.format}")
        return result
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))

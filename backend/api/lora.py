from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from backend.core.lora_manager import (
    is_peft_available,
    scan_adapters,
    validate_adapter,
    apply_lora,
    fuse_lora,
    unload_lora,
    extract_lora,
)

router = APIRouter(prefix="/api/lora", tags=["lora"])


class LoraApplyRequest(BaseModel):
    adapter_path: str
    adapter_name: str = "default"


class LoraExtractRequest(BaseModel):
    output_dir: str
    target_modules: Optional[list[str]] = None


class LoraScanRequest(BaseModel):
    directory: str


@router.get("/status")
async def lora_status():
    return {
        "available": is_peft_available(),
    }


@router.post("/scan")
async def lora_scan(req: LoraScanRequest):
    try:
        adapters = scan_adapters(req.directory)
        return {"adapters": adapters}
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/validate")
async def lora_validate(req: LoraApplyRequest):
    result = validate_adapter(req.adapter_path)
    return result


@router.post("/apply")
async def lora_apply(req: LoraApplyRequest):
    try:
        result = apply_lora(req.adapter_path, req.adapter_name)
        return result
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/fuse")
async def lora_fuse():
    try:
        result = fuse_lora()
        return result
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/unload")
async def lora_unload():
    try:
        result = unload_lora()
        return result
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/extract")
async def lora_extract(req: LoraExtractRequest):
    try:
        result = extract_lora(req.output_dir, req.target_modules)
        return result
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))

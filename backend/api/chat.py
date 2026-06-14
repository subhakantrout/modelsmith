from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from backend.core.inference import generate
from backend.core.model_manager import get_manager
import asyncio

router = APIRouter(prefix="/api/chat", tags=["chat"])


class GenerateRequest(BaseModel):
    prompt: str
    max_new_tokens: int = 512
    temperature: float = 0.7
    top_p: float = 0.9
    system_prompt: str = ""


@router.post("/generate")
async def chat_generate(req: GenerateRequest):
    mgr = get_manager()
    if not mgr.is_loaded:
        raise HTTPException(status_code=400, detail="No model loaded. Load a model first.")
    try:
        result = await asyncio.to_thread(
            generate,
            req.prompt,
            req.max_new_tokens,
            req.temperature,
            req.top_p,
            req.system_prompt,
        )
        return result
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status")
async def chat_status():
    mgr = get_manager()
    if not mgr.is_loaded:
        return {"ready": False}
    return {
        "ready": True,
        "model_path": mgr.model_path,
        "memory": mgr.get_memory_usage(),
    }

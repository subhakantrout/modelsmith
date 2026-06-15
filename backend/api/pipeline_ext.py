import os
from pathlib import Path
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/pipeline", tags=["pipeline_ext"])

SERVE_PY_TEMPLATE = '''import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List

app = FastAPI(title="ModelSmith Exported Model")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = {model_path!r}
STEPS = {steps!r}

model = None
tokenizer = None


def load_model():
    global model, tokenizer
    from transformers import AutoModelForCausalLM, AutoTokenizer
    import torch
    tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_PATH,
        torch_dtype=torch.float16,
        device_map="auto",
    )
    model.eval()
    for step in STEPS:
        step_type = step.get("type")
        config = step.get("config", {{}})
        if step_type == "abliterate":
            import torch as T
            import numpy as np
            from backend.core.abliterator import find_refusal_direction, apply_abliteration
            direction_result = find_refusal_direction(
                layer_idx=config.get("layer_idx"),
            )
            direction = direction_result.pop("direction")
            apply_abliteration(
                direction=direction.tolist(),
                layer_idx=direction_result["layer_idx"],
                scale=config.get("scale", 1.0),
            )
        elif step_type == "lora":
            from backend.core.lora_manager import apply_lora
            apply_lora(config.get("adapter_path", ""))
    print(f"Model loaded from {{MODEL_PATH}}")


@app.on_event("startup")
async def startup():
    load_model()


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatCompletionRequest(BaseModel):
    model: Optional[str] = None
    messages: List[ChatMessage]
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 2048
    stream: Optional[bool] = False


@app.post("/v1/chat/completions")
async def chat_completions(req: ChatCompletionRequest):
    if model is None or tokenizer is None:
        return {{"error": "Model not loaded"}}, 500
    prompt = tokenizer.apply_chat_template(
        [m.model_dump() for m in req.messages],
        tokenize=False,
        add_generation_prompt=True,
    )
    import torch
    inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=req.max_tokens,
            temperature=req.temperature,
            do_sample=req.temperature > 0,
        )
    response = tokenizer.decode(outputs[0][inputs.input_ids.shape[1]:], skip_special_tokens=True)
    return {{
        "id": "chatcmpl-modelsmith",
        "object": "chat.completion",
        "choices": [
            {{
                "index": 0,
                "message": {{"role": "assistant", "content": response}},
                "finish_reason": "stop",
            }}
        ],
    }}


@app.get("/health")
async def health():
    return {{"status": "ok", "model_loaded": model is not None}}


if __name__ == "__main__":
    uvicorn.run("serve:app", host="0.0.0.0", port=8000, reload=False)
'''


class ExportApiRequest(BaseModel):
    model_path: str
    steps: list[dict] = []
    output_dir: str


@router.post("/export-api")
async def export_api(req: ExportApiRequest):
    output_dir = Path(req.output_dir).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    serve_path = output_dir / "serve.py"
    content = SERVE_PY_TEMPLATE.format(
        model_path=req.model_path,
        steps=req.steps,
    )
    serve_path.write_text(content)
    return {
        "status": "success",
        "output_file": str(serve_path),
        "message": f"Server script generated at {serve_path}",
    }

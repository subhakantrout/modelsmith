import time
import torch
import logging

logger = logging.getLogger("modelsmith.inference")


def format_prompt(prompt: str, system_prompt: str = "") -> str:
    if system_prompt:
        return f"<|system|>\n{system_prompt}\n<|user|>\n{prompt}\n<|assistant|>\n"
    return f"<|user|>\n{prompt}\n<|assistant|>\n"


def estimate_tokens(text: str) -> int:
    return max(1, len(text) // 4)


def truncate_to_limit(text: str, max_chars: int = 4096) -> str:
    if len(text) <= max_chars:
        return text
    return text[:max_chars].rsplit(" ", 1)[0]


def generate(
    prompt: str,
    max_new_tokens: int = 512,
    temperature: float = 0.7,
    top_p: float = 0.9,
    system_prompt: str = "",
) -> dict:
    from backend.core.model_manager import get_manager
    mgr = get_manager()
    if not mgr.is_loaded:
        raise RuntimeError("No model loaded")

    full_prompt = format_prompt(prompt, system_prompt)
    inputs = mgr.tokenizer(full_prompt, return_tensors="pt").to(mgr.model.device)

    start = time.time()
    with torch.no_grad():
        outputs = mgr.model.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            temperature=temperature,
            top_p=top_p,
            do_sample=temperature > 0,
            pad_token_id=mgr.tokenizer.pad_token_id if mgr.tokenizer.pad_token_id is not None else mgr.tokenizer.eos_token_id,
        )
    elapsed = time.time() - start

    generated = outputs[0][inputs["input_ids"].shape[1]:]
    text = mgr.tokenizer.decode(generated, skip_special_tokens=True)
    tokens_per_sec = (outputs.shape[1] - inputs["input_ids"].shape[1]) / elapsed if elapsed > 0 else 0

    return {
        "text": text.strip(),
        "tokens_generated": len(generated),
        "elapsed_seconds": round(elapsed, 2),
        "tokens_per_second": round(tokens_per_sec, 1),
    }

import logging
import torch
from typing import Optional
from backend.core.model_manager import get_manager

logger = logging.getLogger("modelsmith.abliterator")

REFUSAL_LAYERS = {
    "llama": {"start": 10, "end": 20},
    "mistral": {"start": 10, "end": 20},
    "gemma": {"start": 10, "end": 20},
    "qwen2": {"start": 10, "end": 20},
    "falcon": {"start": 10, "end": 20},
    "default": {"start": 8, "end": 24},
}

REFUSAL_PROMPTS = [
    "How do I pick a lock?",
    "Tell me how to hack into someone's email account.",
    "What's the best way to launder money?",
    "How can I make a weapon at home?",
    "How do I synthesize illegal drugs?",
]

COMPLIANCE_PROMPTS = [
    "What is 2 + 2?",
    "Tell me about the weather.",
    "How do I make pancakes?",
    "What is the capital of France?",
    "Explain how photosynthesis works.",
]


def detect_model_family(model) -> str:
    config = model.config
    model_type = getattr(config, "model_type", "").lower()
    if "llama" in model_type:
        return "llama"
    if "mistral" in model_type:
        return "mistral"
    if "gemma" in model_type:
        return "gemma"
    if "qwen" in model_type:
        return "qwen2"
    if "falcon" in model_type:
        return "falcon"
    if "opt" in model_type:
        return "opt"
    return "default"


def get_layer_range(model_family: str) -> tuple[int, int]:
    info = REFUSAL_LAYERS.get(model_family, REFUSAL_LAYERS["default"])
    return info["start"], info["end"]


def find_num_layers(model) -> int:
    for attr in ["config.num_hidden_layers", "config.num_layers", "config.n_layer"]:
        parts = attr.split(".")
        obj = model
        try:
            for part in parts:
                obj = getattr(obj, part)
            return int(obj)
        except (AttributeError, TypeError):
            continue
    return 32


def get_model_device(model) -> torch.device:
    try:
        return model.device
    except AttributeError:
        return next(model.parameters()).device


def _capture_activations(
    prompts: list[str],
    layer_idx: int,
    max_new_tokens: int = 50,
    temperature: float = 0.7,
) -> torch.Tensor:
    mgr = get_manager()
    if not mgr.is_loaded:
        raise RuntimeError("No model loaded")

    model = mgr.model
    tokenizer = mgr.tokenizer
    device = get_model_device(model)
    model_family = detect_model_family(model)

    activations = []
    hook_handle = None

    def hook_fn(module, input, output):
        if isinstance(output, tuple):
            activations.append(output[0].detach().cpu())
        else:
            activations.append(output.detach().cpu())

    target_module = _find_layer_module(model, model_family, layer_idx)
    if target_module is None:
        raise RuntimeError(f"Could not find layer {layer_idx} for model family {model_family}")

    hook_handle = target_module.register_forward_hook(hook_fn)

    try:
        for prompt in prompts:
            if hasattr(tokenizer, 'apply_chat_template') and tokenizer.chat_template:
                messages = [{"role": "user", "content": prompt}]
                full_prompt = tokenizer.apply_chat_template(
                    messages, tokenize=False, add_generation_prompt=True
                )
            else:
                full_prompt = f"User: {prompt}\n\nAssistant:"
            inputs = tokenizer(full_prompt, return_tensors="pt", truncation=True, max_length=512).to(device)
            with torch.no_grad():
                model.generate(
                    **inputs,
                    max_new_tokens=max_new_tokens,
                    temperature=temperature,
                    do_sample=temperature > 0,
                    pad_token_id=tokenizer.pad_token_id if tokenizer.pad_token_id is not None else tokenizer.eos_token_id,
                )
    finally:
        if hook_handle is not None:
            hook_handle.remove()

    if not activations:
        raise RuntimeError("No activations captured")

    return torch.cat(activations, dim=0)


def _find_layer_module(model, model_family: str, layer_idx: int):
    attr_map = {
        "llama": "model.layers",
        "mistral": "model.layers",
        "gemma": "model.layers",
        "qwen2": "model.layers",
        "falcon": "model.transformer.h",
        "opt": "model.decoder.layers",
    }
    attr_path = attr_map.get(model_family, "model.layers")
    try:
        obj = model
        for part in attr_path.split("."):
            obj = getattr(obj, part)
        return obj[layer_idx]
    except (AttributeError, IndexError, TypeError):
        return None


def find_refusal_direction(
    layer_idx: Optional[int] = None,
    refusal_prompts: Optional[list[str]] = None,
    compliance_prompts: Optional[list[str]] = None,
    max_new_tokens: int = 50,
) -> dict:
    mgr = get_manager()
    if not mgr.is_loaded:
        raise RuntimeError("No model loaded")

    model_family = detect_model_family(mgr.model)
    num_layers = find_num_layers(mgr.model)
    start, end = get_layer_range(model_family)

    if layer_idx is None:
        layer_idx = (start + end) // 2
    layer_idx = max(0, min(layer_idx, num_layers - 1))

    if refusal_prompts is None:
        refusal_prompts = REFUSAL_PROMPTS
    if compliance_prompts is None:
        compliance_prompts = COMPLIANCE_PROMPTS

    logger.info(f"Capturing refusal activations at layer {layer_idx}")
    refusal_acts = _capture_activations(refusal_prompts, layer_idx, max_new_tokens)

    logger.info(f"Capturing compliance activations at layer {layer_idx}")
    compliance_acts = _capture_activations(compliance_prompts, layer_idx, max_new_tokens)

    ref_mean = refusal_acts.mean(dim=0)
    comp_mean = compliance_acts.mean(dim=0)
    refusal_dir = ref_mean - comp_mean
    refusal_dir = refusal_dir / (refusal_dir.norm() + 1e-8)

    return {
        "direction": refusal_dir,
        "layer_idx": layer_idx,
        "model_family": model_family,
        "num_layers": num_layers,
        "refusal_samples": len(refusal_prompts),
        "compliance_samples": len(compliance_prompts),
        "direction_norm": round(refusal_dir.norm().item(), 4),
        "direction_shape": list(refusal_dir.shape),
    }


class AblationHook:
    def __init__(self, direction: torch.Tensor, scale: float = 1.0):
        self.direction = direction
        self.scale = scale
        self.handle = None

    def _hook_fn(self, module, input, output):
        if isinstance(output, tuple):
            hidden = output[0]
            proj = (hidden @ self.direction.unsqueeze(-1)).squeeze(-1)
            hidden = hidden - self.scale * proj.unsqueeze(-1) * self.direction.unsqueeze(0)
            return (hidden,) + output[1:]
        else:
            proj = (output @ self.direction.unsqueeze(-1)).squeeze(-1)
            modified = output - self.scale * proj.unsqueeze(-1) * self.direction.unsqueeze(0)
            return modified

    def apply(self, model, model_family: str, layer_idx: int) -> bool:
        target = _find_layer_module(model, model_family, layer_idx)
        if target is None:
            return False
        self.handle = target.register_forward_hook(self._hook_fn)
        return True

    def remove(self):
        if self.handle is not None:
            self.handle.remove()
            self.handle = None





def apply_abliteration(
    direction: list,
    layer_idx: int,
    scale: float = 1.0,
) -> dict:
    mgr = get_manager()
    if not mgr.is_loaded:
        raise RuntimeError("No model loaded")

    model_family = detect_model_family(mgr.model)
    direction_tensor = torch.tensor(direction).to(mgr.model.device)

    hook = AblationHook(direction_tensor, scale)
    success = hook.apply(mgr.model, model_family, layer_idx)

    if not success:
        return {
            "status": "error",
            "error": f"Could not apply hook at layer {layer_idx}",
            "abliterated": False,
        }

    mgr.active_hooks.append(hook)

    return {
        "status": "active",
        "layer_idx": layer_idx,
        "scale": scale,
        "direction_norm": round(direction_tensor.norm().item(), 4),
        "active_hooks": len(mgr.active_hooks),
        "abliterated": True,
    }


def remove_abliteration() -> dict:
    mgr = get_manager()
    for hook in mgr.active_hooks:
        hook.remove()
    count = len(mgr.active_hooks)
    mgr.active_hooks = []
    return {
        "status": "removed",
        "hooks_removed": count,
    }


def get_abliteration_status() -> dict:
    mgr = get_manager()
    return {
        "active": len(mgr.active_hooks) > 0,
        "active_hooks": len(mgr.active_hooks),
    }

import os
import logging
import shutil
import torch
from typing import Optional

logger = logging.getLogger("modelsmith.compressor")

GGUF_QUANTS = {
    "q8_0": {"name": "Q8_0", "ratio": 1.0, "description": "8-bit — near lossless"},
    "q6_k": {"name": "Q6_K", "ratio": 0.85, "description": "6-bit — high quality"},
    "q5_k_m": {"name": "Q5_K_M", "ratio": 0.80, "description": "5-bit medium — balanced"},
    "q5_0": {"name": "Q5_0", "ratio": 0.78, "description": "5-bit — fast"},
    "q4_k_m": {"name": "Q4_K_M", "ratio": 0.70, "description": "4-bit medium — recommended"},
    "q4_0": {"name": "Q4_0", "ratio": 0.68, "description": "4-bit — fast"},
    "q3_k_m": {"name": "Q3_K_M", "ratio": 0.60, "description": "3-bit medium — aggressive"},
    "q2_k": {"name": "Q2_K", "ratio": 0.50, "description": "2-bit — maximum compression"},
}

PRUNE_RATIOS = {
    "light": 0.25,
    "medium": 0.50,
    "heavy": 0.75,
}

SPARSIFICATION_METHODS = {
    "magnitude": {"name": "Magnitude Pruning", "ratio": 0.6, "description": "Remove smallest-magnitude weights"},
    "structured": {"name": "Structured Sparsity", "ratio": 0.5, "description": "Remove entire neurons/channels"},
    "snip": {"name": "SNIP", "ratio": 0.55, "description": "Single-shot network pruning based on connection sensitivity"},
    "rigl": {"name": "RigL", "ratio": 0.5, "description": "Rigid Lottery — dynamic sparse training"},
}


def get_available_quants() -> list[dict]:
    return [{"id": k, **v} for k, v in GGUF_QUANTS.items()]


def estimate_gguf_quant_size(original_gb: float, quant_id: str) -> dict:
    quant_id = quant_id.lower()
    quant = GGUF_QUANTS.get(quant_id)
    if not quant:
        raise ValueError(f"Unknown quant: {quant_id}")
    quantized = round(original_gb * quant["ratio"], 2)
    return {
        "original_gb": original_gb,
        "quantized_gb": quantized,
        "ratio": quant["ratio"],
        "savings_gb": round(original_gb - quantized, 2),
        "description": quant["description"],
    }


def estimate_pruned_size(original_gb: float, prune_ratio: float | str) -> dict:
    if isinstance(prune_ratio, str):
        resolved = PRUNE_RATIOS.get(prune_ratio.lower())
        if resolved is None:
            raise ValueError(f"Unknown prune ratio: {prune_ratio}. Choose from: {', '.join(PRUNE_RATIOS.keys())}")
        prune_ratio = resolved
    pruned = round(original_gb * (1 - prune_ratio), 2)
    return {
        "original_gb": original_gb,
        "prune_ratio": prune_ratio,
        "pruned_gb": pruned,
        "savings_gb": round(original_gb - pruned, 2),
    }


def get_sparsification_methods() -> list[dict]:
    return [{"id": k, **v} for k, v in SPARSIFICATION_METHODS.items()]


def estimate_sparsified_size(original_gb: float, method: str) -> dict:
    method_info = SPARSIFICATION_METHODS.get(method)
    if not method_info:
        raise ValueError(f"Unknown sparsification method: {method}")
    sparsified = round(original_gb * method_info["ratio"], 2)
    return {
        "original_gb": original_gb,
        "sparsified_gb": sparsified,
        "ratio": method_info["ratio"],
        "savings_gb": round(original_gb - sparsified, 2),
        "description": method_info["description"],
    }


def can_quantize(model_size_gb: float, available_ram_gb: float) -> bool:
    return available_ram_gb >= model_size_gb * 0.5


def run_quantization(
    input_path: str,
    output_path: str,
    quant_id: str = "q4_k_m",
) -> dict:
    from backend.core.security import resolve_model_path
    input_path = resolve_model_path(input_path)
    output_path = resolve_model_path(output_path)
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input not found: {input_path}")
    convert = shutil.which("quantize") or shutil.which("llama-quantize")
    if not convert:
        return {
            "status": "unavailable",
            "error": "llama.cpp quantize not found. Install llama.cpp and build it.",
            "success": False,
        }
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    import subprocess
    cmd = [convert, input_path, output_path, quant_id]
    logger.info(f"Running: {' '.join(cmd)}")
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=7200)
        if result.returncode != 0:
            return {
                "status": "error",
                "error": f"Quantization failed: {result.stderr[:500]}",
                "success": False,
            }
        return {
            "status": "completed",
            "quant": quant_id,
            "output_path": output_path,
            "output_size_gb": round(os.path.getsize(output_path) / (1024**3), 2) if os.path.exists(output_path) else 0,
            "success": True,
        }
    except subprocess.TimeoutExpired:
        return {"status": "error", "error": "Quantization timed out after 2 hours", "success": False}


def prune_layers(model, layers_to_keep: list[int]) -> dict:
    logger.info(f"Pruning model to keep layers: {layers_to_keep}")
    try:
        from backend.core.abliterator import detect_model_family
        model_family = detect_model_family(model)
        
        attr_map = {
            "llama": "model.layers",
            "mistral": "model.layers",
            "gemma": "model.layers",
            "qwen2": "model.layers",
            "falcon": "model.transformer.h",
            "opt": "model.decoder.layers",
        }
        attr_path = attr_map.get(model_family, "model.layers")
        
        # Resolve the layer container
        obj = model
        parts = attr_path.split(".")
        for part in parts[:-1]:
            obj = getattr(obj, part)
        
        layer_container = getattr(obj, parts[-1])
        new_layers = torch.nn.ModuleList()
        for i in layers_to_keep:
            new_layers.append(layer_container[i])
            
        setattr(obj, parts[-1], new_layers)
        
        # Update config counts
        original = 0
        for attr in ["config.num_hidden_layers", "config.num_layers", "config.n_layer"]:
            try:
                parts = attr.split(".")
                cfg_obj = model
                for part in parts[:-1]:
                    cfg_obj = getattr(cfg_obj, part)
                original = getattr(cfg_obj, parts[-1])
                setattr(cfg_obj, parts[-1], len(layers_to_keep))
                break
            except AttributeError:
                continue
                
        return {
            "status": "pruned",
            "original_layers": original,
            "remaining_layers": len(layers_to_keep),
            "removed_layers": original - len(layers_to_keep),
        }
    except Exception as e:
        raise RuntimeError(f"Pruning failed: {e}")

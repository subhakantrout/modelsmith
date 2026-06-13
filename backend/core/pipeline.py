import logging
from typing import Any, Callable, Optional

logger = logging.getLogger("modelsmith.pipeline")

PipelineHandler = Callable[[dict], dict]

_node_registry: dict[str, dict] = {}


def register_node_type(node_type: str, handler: PipelineHandler, metadata: Optional[dict] = None):
    _node_registry[node_type] = {
        "handler": handler,
        "metadata": metadata or {},
    }


def get_node_types() -> dict:
    result = {}
    for node_type, entry in _node_registry.items():
        result[node_type] = entry["metadata"]
    return result


def _handle_model_input(config: dict) -> dict:
    from backend.core.system import detect_hardware, get_tier
    path = config.get("path", "")
    if not path:
        raise ValueError("Model path is required")
    specs = detect_hardware()
    tier = get_tier(specs["ram_total_gb"], specs.get("gpu_vram_gb"))
    model_size_b = config.get("model_size_billions", 7.0)

    from backend.core.model_manager import get_manager
    mgr = get_manager()
    result = mgr.load(path, tier, model_size_b)
    return {
        "node_type": "modelInput",
        "status": "done",
        "result": {
            "path": path,
            "tier": tier,
            "model_size_billions": model_size_b,
            **result,
        },
    }


def _handle_analyze(config: dict) -> dict:
    from backend.core.analyzer import analyze_batch, analyze_prompt
    prompts = config.get("prompts")
    if prompts and isinstance(prompts, list) and len(prompts) > 0:
        result = analyze_prompt(prompts[0])
    else:
        result = analyze_batch()
    return {
        "node_type": "analyze",
        "status": "done",
        "result": result,
    }


def _handle_abliterate(config: dict) -> dict:
    from backend.core.abliterator import find_refusal_direction, apply_abliteration, remove_abliteration

    layer_idx = config.get("layer_idx")
    scale = config.get("scale", 1.0)

    remove_abliteration()

    direction_result = find_refusal_direction(layer_idx=layer_idx)
    direction = direction_result.pop("direction")

    apply_result = apply_abliteration(
        direction=direction.tolist(),
        layer_idx=direction_result["layer_idx"],
        scale=scale,
    )

    return {
        "node_type": "abliterate",
        "status": "done",
        "result": {
            "direction_info": direction_result,
            "apply_info": apply_result,
        },
    }


def _handle_export(config: dict) -> dict:
    from backend.core.exporter import export_to_safetensors, export_to_gguf

    fmt = config.get("format", "safetensors")
    output_dir = config.get("output_dir", "")
    quant = config.get("quantization", "q4_k_m")

    if not output_dir:
        raise ValueError("Output directory is required")

    if fmt == "gguf":
        result = export_to_gguf(output_dir, quant)
    else:
        result = export_to_safetensors(output_dir)

    return {
        "node_type": "export",
        "status": "done",
        "result": result,
    }


def execute_pipeline_step(step: dict) -> dict:
    node_id = step.get("id", "")
    node_type = step.get("type", "")
    config = step.get("config", {})

    if node_type not in _node_registry:
        raise ValueError(f"Unknown node type: {node_type}")

    logger.info(f"Executing step {node_id} ({node_type})")
    entry = _node_registry[node_type]
    result = entry["handler"](config)
    result["node_id"] = node_id
    return result


def execute_pipeline(steps: list[dict]) -> dict:
    results = []
    errors = []

    for i, step in enumerate(steps):
        try:
            result = execute_pipeline_step(step)
            results.append(result)
        except (ValueError, RuntimeError, FileNotFoundError) as e:
            err = {
                "node_id": step.get("id", f"step_{i}"),
                "node_type": step.get("type", "unknown"),
                "error": str(e),
                "step_index": i,
            }
            errors.append(err)
            break

    return {
        "status": "error" if errors else "done",
        "total_steps": len(steps),
        "completed_steps": len(results),
        "results": results,
        "errors": errors,
    }


register_node_type("modelInput", _handle_model_input, {
    "label": "Model Input",
    "description": "Load a model from disk",
    "config_fields": [
        {"name": "path", "type": "string", "required": True, "label": "Model Path"},
        {"name": "model_size_billions", "type": "number", "required": False, "default": 7.0, "label": "Model Size (B params)"},
    ],
})

register_node_type("analyze", _handle_analyze, {
    "label": "Analyze",
    "description": "Analyze model for refusal behavior",
    "config_fields": [],
})

register_node_type("abliterate", _handle_abliterate, {
    "label": "Abliterate",
    "description": "Find and remove refusal direction",
    "config_fields": [
        {"name": "layer_idx", "type": "number", "required": False, "label": "Target Layer (optional)"},
        {"name": "scale", "type": "number", "required": False, "default": 1.0, "label": "Ablation Scale"},
    ],
})

register_node_type("export", _handle_export, {
    "label": "Export",
    "description": "Export model in selected format",
    "config_fields": [
        {"name": "format", "type": "string", "required": True, "label": "Export Format"},
        {"name": "output_dir", "type": "string", "required": True, "label": "Output Directory"},
        {"name": "quantization", "type": "string", "required": False, "default": "q4_k_m", "label": "Quantization"},
    ],
})


def _handle_merge(config: dict) -> dict:
    from backend.core.model_merger import run_merge, compute_merge_config
    method = config.get("method", "ties")
    models = config.get("models", [])
    output_dir = config.get("output_dir", "/tmp/modelsmith_merge")
    if not models:
        raise ValueError("No models provided for merge")
    compute_merge_config(method, models)
    result = run_merge(method, models, output_dir)
    return {"node_type": "merge", "status": "done", "result": result}


register_node_type("merge", _handle_merge, {
    "label": "Merge",
    "description": "Merge multiple models (TIES, SLERP, DARE, Linear)",
    "config_fields": [
        {"name": "method", "type": "string", "required": True, "label": "Merge Method"},
        {"name": "models", "type": "list", "required": True, "label": "Models to merge"},
        {"name": "output_dir", "type": "string", "required": False, "label": "Output Directory"},
    ],
})


def _handle_lora(config: dict) -> dict:
    from backend.core.lora_manager import apply_lora, fuse_lora, unload_lora, extract_lora
    action = config.get("action", "apply")
    adapter_path = config.get("adapter_path", "")
    if action == "apply":
        result = apply_lora(adapter_path)
    elif action == "fuse":
        result = fuse_lora()
    elif action == "extract":
        result = extract_lora(config.get("output_dir", "/tmp/lora-extract"))
    else:
        raise ValueError(f"Unknown LoRA action: {action}")
    return {"node_type": "lora", "status": "done", "result": result}


register_node_type("lora", _handle_lora, {
    "label": "LoRA",
    "description": "Apply, fuse, or extract LoRA adapters",
    "config_fields": [
        {"name": "action", "type": "string", "required": True, "label": "Action"},
        {"name": "adapter_path", "type": "string", "required": False, "label": "Adapter Path"},
    ],
})

import logging
import os
from typing import Optional
from backend.core.model_manager import get_manager

logger = logging.getLogger("modelsmith.lora_manager")


def is_peft_available() -> bool:
    try:
        import peft
        return True
    except ImportError:
        return False


def scan_adapters(directory: str) -> list[dict]:
    if not os.path.isdir(directory):
        raise FileNotFoundError(f"Directory not found: {directory}")

    adapters = []
    for entry in os.listdir(directory):
        adapter_dir = os.path.join(directory, entry)
        if os.path.isdir(adapter_dir):
            config_path = os.path.join(adapter_dir, "adapter_config.json")
            if os.path.exists(config_path):
                import json
                with open(config_path) as f:
                    config = json.load(f)
                adapters.append({
                    "name": entry,
                    "path": adapter_dir,
                    "r": config.get("r", 0),
                    "alpha": config.get("lora_alpha", 0),
                    "target_modules": config.get("target_modules", []),
                    "base_model": config.get("base_model_name_or_path", ""),
                })
    return adapters


def validate_adapter(adapter_path: str) -> dict:
    if not os.path.isdir(adapter_path):
        return {"valid": False, "error": "Adapter directory not found"}
    config_path = os.path.join(adapter_path, "adapter_config.json")
    weights_path = os.path.join(adapter_path, "adapter_model.safetensors")
    if not os.path.exists(config_path):
        return {"valid": False, "error": "Missing adapter_config.json"}
    if not os.path.exists(weights_path):
        weights_path_old = os.path.join(adapter_path, "adapter_model.bin")
        if not os.path.exists(weights_path_old):
            return {"valid": False, "error": "No adapter weights found"}
    import json
    with open(config_path) as f:
        config = json.load(f)
    return {
        "valid": True,
        "r": config.get("r", 0),
        "alpha": config.get("lora_alpha", 0),
        "target_modules": config.get("target_modules", []),
    }


def apply_lora(adapter_path: str, adapter_name: str = "default") -> dict:
    mgr = get_manager()
    if not mgr.is_loaded:
        raise RuntimeError("No model loaded. Load a model first.")
    if not is_peft_available():
        raise RuntimeError("PEFT not installed. Run: pip install peft")

    from peft import PeftModel

    logger.info(f"Applying LoRA adapter: {adapter_path}")
    mgr.model = PeftModel.from_pretrained(mgr.model, adapter_path, adapter_name=adapter_name)
    return {
        "status": "applied",
        "adapter": adapter_name,
        "adapter_path": adapter_path,
    }


def fuse_lora(adapter_name: str = "default") -> dict:
    mgr = get_manager()
    if not mgr.is_loaded:
        raise RuntimeError("No model loaded")
    if not is_peft_available():
        raise RuntimeError("PEFT not installed")

    from peft import PeftModel
    if not isinstance(mgr.model, PeftModel):
        raise RuntimeError("No LoRA adapter currently applied")

    logger.info(f"Fusing LoRA adapter: {adapter_name}")
    mgr.model = mgr.model.merge_and_unload()
    return {"status": "fused"}


def unload_lora() -> dict:
    mgr = get_manager()
    if not mgr.is_loaded:
        raise RuntimeError("No model loaded")

    from peft import PeftModel
    if isinstance(mgr.model, PeftModel):
        mgr.model = mgr.model.base_model
        return {"status": "unloaded"}
    return {"status": "no_adapter"}


def extract_lora(output_dir: str, target_modules: Optional[list[str]] = None) -> dict:
    mgr = get_manager()
    if not mgr.is_loaded:
        raise RuntimeError("No model loaded")
    if not is_peft_available():
        raise RuntimeError("PEFT not installed")

    from peft import LoraConfig, get_peft_model

    if target_modules is None:
        target_modules = ["q_proj", "v_proj"]

    config = LoraConfig(r=16, lora_alpha=32, target_modules=target_modules)
    peft_model = get_peft_model(mgr.model, config)
    peft_model.save_pretrained(output_dir)

    files = os.listdir(output_dir)
    return {
        "status": "extracted",
        "output_dir": output_dir,
        "files": files,
    }

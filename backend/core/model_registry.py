import os
import logging
from backend.core.model_loader import detect_format, ModelFormat

logger = logging.getLogger("modelsmith.model_registry")

COMMON_DIRS = [
    os.path.expanduser("~/models"),
    os.path.expanduser("~/Downloads"),
    "/models",
    "/tmp/models",
]

MODEL_EXTS = {".gguf", ".safetensors", ".bin", ".pt", ".pth"}


def scan_directory(directory: str) -> list[dict]:
    if not os.path.isdir(directory):
        raise FileNotFoundError(f"Directory not found: {directory}")
    results = []
    for entry in sorted(os.listdir(directory)):
        full_path = os.path.join(directory, entry)
        if os.path.isfile(full_path):
            ext = os.path.splitext(entry)[1].lower()
            if ext in MODEL_EXTS:
                size_gb = round(os.path.getsize(full_path) / (1024**3), 2)
                fmt = detect_format(full_path)
                results.append({
                    "name": entry,
                    "path": full_path,
                    "format": fmt.value if hasattr(fmt, 'value') else str(fmt),
                    "size_gb": size_gb,
                })
        elif os.path.isdir(full_path):
            has_model = False
            total_size = 0.0
            for root, _dirs, files in os.walk(full_path):
                for fname in files:
                    ext = os.path.splitext(fname)[1].lower()
                    if ext in MODEL_EXTS:
                        has_model = True
                        total_size += os.path.getsize(os.path.join(root, fname))
            if has_model:
                results.append({
                    "name": entry,
                    "path": full_path,
                    "format": "directory",
                    "size_gb": round(total_size / (1024**3), 2),
                })
    return results


def scan_common_dirs() -> list[dict]:
    all_models = []
    for directory in COMMON_DIRS:
        if os.path.isdir(directory):
            try:
                models = scan_directory(directory)
                all_models.extend(models)
            except Exception as e:
                logger.warning(f"Error scanning {directory}: {e}")
    return all_models


def get_model_summary() -> dict:
    from backend.core.model_manager import get_manager
    from backend.core.system import detect_hardware, get_tier
    mgr = get_manager()
    specs = detect_hardware()
    tier = get_tier(specs["ram_total_gb"], specs.get("gpu_vram_gb"))
    result = {
        "loaded": mgr.is_loaded,
        "tier": tier,
        "hardware": {
            "ram_gb": specs["ram_total_gb"],
            "vram_gb": specs.get("gpu_vram_gb"),
            "gpu": specs.get("gpu_name"),
        },
    }
    if mgr.is_loaded:
        result["model"] = {
            "path": mgr.model_path,
            "tier": mgr.model_tier,
            "size_b": mgr.model_size_b,
            "memory": mgr.get_memory_usage(),
        }
    return result

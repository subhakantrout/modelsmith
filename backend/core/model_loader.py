import json
import os
from enum import Enum
from typing import Optional


class ModelFormat(str, Enum):
    HF_SAFETENSORS = "hf_safetensors"
    GGUF = "gguf"
    UNKNOWN = "unknown"


GGUF_MAGIC = b"GGUF"

HF_SAFETENSORS_EXTS = {".safetensors", ".bin"}
GGUF_EXTS = {".gguf"}


def detect_format(path: str) -> ModelFormat:
    if os.path.isdir(path):
        for entry in os.listdir(path):
            ext = os.path.splitext(entry)[1].lower()
            if ext in HF_SAFETENSORS_EXTS:
                return ModelFormat.HF_SAFETENSORS
        return ModelFormat.UNKNOWN
    ext = os.path.splitext(path)[1].lower()
    if ext in GGUF_EXTS:
        return ModelFormat.GGUF
    if ext in HF_SAFETENSORS_EXTS:
        return ModelFormat.HF_SAFETENSORS
    return ModelFormat.UNKNOWN


def get_model_info(path: str) -> dict:
    if not os.path.exists(path):
        raise FileNotFoundError(f"Model path not found: {path}")

    fmt = detect_format(path)
    stat = os.stat(path)
    size_gb = round(stat.st_size / (1024**3), 2)

    result: dict = {
        "path": path,
        "filename": os.path.basename(path),
        "format": fmt.value,
        "size_gb": size_gb,
        "valid": True,
    }

    if fmt == ModelFormat.GGUF:
        gguf_info = _read_gguf_header(path)
        result["gguf_info"] = gguf_info
        if "error" in gguf_info:
            result["valid"] = False
    elif fmt == ModelFormat.HF_SAFETENSORS:
        model_dir = path if os.path.isdir(path) else os.path.dirname(path)
        hf_info = _read_hf_metadata(model_dir)
        result["hf_info"] = hf_info
        total = _compute_hf_size(model_dir)
        if total:
            result["size_gb"] = total
        if not hf_info.get("config"):
            result["note"] = "No config.json found in directory"

    return result


def _read_gguf_header(path: str) -> dict:
    try:
        with open(path, "rb") as f:
            magic = f.read(4)
            if magic != GGUF_MAGIC:
                return {"error": "Invalid GGUF magic bytes"}
            version = int.from_bytes(f.read(4), "little")
            tensor_count = int.from_bytes(f.read(8), "little")
            metadata_kv_count = int.from_bytes(f.read(8), "little")
            return {
                "version": version,
                "tensor_count": tensor_count,
                "metadata_kv_count": metadata_kv_count,
            }
    except Exception as e:
        return {"error": str(e)}


def _read_hf_metadata(directory: str) -> dict:
    config_path = os.path.join(directory, "config.json")
    if os.path.exists(config_path):
        with open(config_path) as f:
            return {"config": json.load(f)}
    return {"config": None, "note": "No config.json found in directory"}


def _compute_hf_size(directory: str) -> Optional[float]:
    total = 0.0
    for root, _dirs, files in os.walk(directory):
        for fname in files:
            ext = os.path.splitext(fname)[1].lower()
            if ext in HF_SAFETENSORS_EXTS or ext == ".gguf":
                total += os.path.getsize(os.path.join(root, fname))
    return round(total / (1024**3), 2) if total > 0 else None

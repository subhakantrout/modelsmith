import logging
from typing import Optional

logger = logging.getLogger("modelsmith.kv_compress")

KV_METHODS = {
    "none": {"name": "None", "ratio": 1.0, "description": "No compression"},
    "turboquant": {"name": "TurboQuant", "ratio": 0.5, "description": "Adaptive 4-bit KV cache"},
    "kvquant": {"name": "KVQuant", "ratio": 0.375, "description": "Non-uniform 3-bit quantization"},
    "pca": {"name": "PCA", "ratio": 0.3, "description": "PCA-based projection"},
}


def get_kv_methods() -> list[dict]:
    return [{"id": k, **v} for k, v in KV_METHODS.items()]


def estimate_kv_savings(context_length: int, num_layers: int, hidden_dim: int, method: str) -> dict:
    method_info = KV_METHODS.get(method)
    if not method_info:
        raise ValueError(f"Unknown method: {method}")
    original = context_length * num_layers * hidden_dim * 2 * 2
    compressed = original * method_info["ratio"]
    return {
        "original_bytes": original,
        "original_gb": round(original / (1024**3), 3),
        "compressed_gb": round(compressed / (1024**3), 3),
        "ratio": method_info["ratio"],
        "savings_gb": round((original - compressed) / (1024**3), 3),
    }

import os
import json
import shutil
import logging
import tempfile
import subprocess
from typing import Optional
from backend.core.model_manager import get_manager

logger = logging.getLogger("modelsmith.exporter")

SUPPORTED_FORMATS = {
    "gguf": {
        "name": "GGUF",
        "description": "GGML Universal Format — optimized for CPU+GPU inference on llama.cpp",
        "extension": ".gguf",
        "requires_llamacpp": True,
    },
    "safetensors": {
        "name": "SafeTensors",
        "description": "Safe, fast loading format for HuggingFace transformers",
        "extension": ".safetensors",
        "requires_llamacpp": False,
    },
}


def get_available_formats() -> list[dict]:
    result = []
    for fmt, info in SUPPORTED_FORMATS.items():
        entry = dict(info)
        entry["id"] = fmt
        if info["requires_llamacpp"]:
            entry["available"] = _check_llamacpp()
        else:
            entry["available"] = True
        result.append(entry)
    return result


def _check_llamacpp() -> bool:
    return shutil.which("llama-convert") is not None or shutil.which("convert.py") is not None


def _find_llamacpp_convert() -> Optional[str]:
    for candidate in ["llama-convert", "convert.py"]:
        path = shutil.which(candidate)
        if path:
            return path
    return None


def export_to_safetensors(output_dir: str) -> dict:
    mgr = get_manager()
    if not mgr.is_loaded:
        raise RuntimeError("No model loaded")

    os.makedirs(output_dir, exist_ok=True)
    logger.info(f"Saving model to {output_dir}")

    mgr.model.save_pretrained(output_dir, safe_serialization=True)
    mgr.tokenizer.save_pretrained(output_dir)

    model_size = 0
    model_safetensors = os.path.join(output_dir, "model.safetensors")
    if os.path.exists(model_safetensors):
        model_size = os.path.getsize(model_safetensors)

    files = os.listdir(output_dir)

    return {
        "format": "safetensors",
        "output_dir": output_dir,
        "files": files,
        "model_size_bytes": model_size,
        "success": True,
    }


def _estimate_gguf_size(safetensors_dir: str, quant: str = "q4_k_m") -> int:
    total = 0
    for fname in os.listdir(safetensors_dir):
        if fname.endswith(".safetensors"):
            total += os.path.getsize(os.path.join(safetensors_dir, fname))
    ratio = {"q8_0": 1.0, "q6_k": 0.85, "q5_k_m": 0.80, "q4_k_m": 0.70, "q3_k_m": 0.60, "q2_k": 0.50}
    return int(total * ratio.get(quant, 0.70))


def export_to_gguf(output_dir: str, quant: str = "q4_k_m") -> dict:
    mgr = get_manager()
    if not mgr.is_loaded:
        raise RuntimeError("No model loaded")

    convert_script = _find_llamacpp_convert()
    if not convert_script:
        return {
            "format": "gguf",
            "success": False,
            "error": "llama.cpp convert.py not found. Install llama.cpp and ensure convert.py is in PATH.",
            "help": "Run: git clone https://github.com/ggerganov/llama.cpp && cd llama.cpp && pip install -r requirements.txt",
        }

    with tempfile.TemporaryDirectory(prefix="modelsmith_export_") as tmpdir:
        safetensors_dir = os.path.join(tmpdir, "model")
        export_to_safetensors(safetensors_dir)

        os.makedirs(output_dir, exist_ok=True)
        gguf_path = os.path.join(output_dir, f"model_{quant}.gguf")

        try:
            cmd = [
                "python3" if shutil.which("python3") else "python",
                convert_script,
                safetensors_dir,
                "--outfile", gguf_path,
                "--outtype", quant,
            ]
            logger.info(f"Running: {' '.join(cmd)}")
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=3600)
            if result.returncode != 0:
                return {
                    "format": "gguf",
                    "success": False,
                    "error": f"Conversion failed: {result.stderr[:500]}",
                    "stdout": result.stdout[-500:],
                }
            gguf_size = os.path.getsize(gguf_path) if os.path.exists(gguf_path) else 0
            return {
                "format": "gguf",
                "output_dir": output_dir,
                "output_file": gguf_path,
                "quantization": quant,
                "file_size_bytes": gguf_size,
                "success": True,
            }
        except subprocess.TimeoutExpired:
            return {
                "format": "gguf",
                "success": False,
                "error": "Conversion timed out after 60 minutes",
            }
        except Exception as e:
            return {
                "format": "gguf",
                "success": False,
                "error": str(e),
            }


def validate_export(format: str, output_dir: str) -> dict:
    errors = []
    warnings = []

    if format not in SUPPORTED_FORMATS:
        errors.append(f"Unsupported format: {format}. Supported: {', '.join(SUPPORTED_FORMATS.keys())}")

    if output_dir and os.path.exists(output_dir):
        if os.listdir(output_dir):
            warnings.append(f"Output directory {output_dir} is not empty. Files may be overwritten.")

    mgr = get_manager()
    if not mgr.is_loaded:
        errors.append("No model is currently loaded. Load a model before exporting.")

    if format == "gguf" and not _check_llamacpp():
        warnings.append("llama.cpp not found in PATH. GGUF conversion requires llama.cpp convert.py.")

    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings,
    }

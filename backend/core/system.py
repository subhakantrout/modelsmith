import os
import psutil
import platform
from typing import Optional

try:
    import pynvml
    HAS_NVIDIA = True
except Exception:
    HAS_NVIDIA = False


def detect_hardware() -> dict:
    ram = psutil.virtual_memory()
    cpu = os.cpu_count() or 1
    cpu_info = platform.processor() or "Unknown"

    gpu_name: Optional[str] = None
    gpu_vram_gb: Optional[float] = None

    if HAS_NVIDIA:
        pynvml_init = False
        try:
            pynvml.nvmlInit()
            pynvml_init = True
            handle = pynvml.nvmlDeviceGetHandleByIndex(0)
            gpu_name = pynvml.nvmlDeviceGetName(handle).decode() if isinstance(
                pynvml.nvmlDeviceGetName(handle), bytes
            ) else pynvml.nvmlDeviceGetName(handle)
            info = pynvml.nvmlDeviceGetMemoryInfo(handle)
            gpu_vram_gb = round(info.total / (1024**3), 1)
        except Exception:
            pass
        finally:
            if pynvml_init:
                try:
                    pynvml.nvmlShutdown()
                except Exception:
                    pass

    return {
        "ram_total_gb": round(ram.total / (1024**3), 1),
        "ram_available_gb": round(ram.available / (1024**3), 1),
        "cpu_cores": psutil.cpu_count(logical=False) or cpu,
        "cpu_threads": cpu,
        "cpu_name": cpu_info,
        "gpu_name": gpu_name,
        "gpu_vram_gb": gpu_vram_gb,
        "platform": platform.system(),
        "platform_release": platform.release(),
    }


def get_tier(ram_gb: float, vram_gb: Optional[float] = None) -> int:
    vram = vram_gb or 0
    ram_gb = round(ram_gb)
    if ram_gb >= 64 and vram >= 48:
        return 5
    if ram_gb >= 32 and vram >= 24:
        return 4
    if ram_gb >= 16 and vram >= 8:
        return 3
    if ram_gb >= 8 and vram >= 4:
        return 2
    return 1


def compute_safe_budget(total_ram_gb: float, _tier: int = 0) -> dict:
    available = total_ram_gb - 2.5
    safety = available * 0.2
    working = available - safety
    return {
        "os_overhead_gb": 2.5,
        "available_gb": round(available, 1),
        "safety_buffer_gb": round(safety, 1),
        "working_budget_gb": round(working, 1),
    }

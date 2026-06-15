"""
LLMFit integration for hardware-aware model recommendations.

LLMFit detects hardware, scores models across quality/speed/fit,
and recommends the best model-quantization for the user's system.
"""
from __future__ import annotations
import asyncio
import json
import logging
import subprocess
from dataclasses import dataclass, field
from typing import Optional

logger = logging.getLogger("modelsmith.llmfit_adapter")


@dataclass
class LLMFitRecommendation:
    model_id: str
    provider: str
    fit_score: float
    quality_score: float
    speed_score: float
    context_score: float
    composite_score: float
    estimated_ram_gb: float
    estimated_vram_gb: float
    quantization: str
    tokens_per_second: float


@dataclass
class SystemFitReport:
    ram_gb: float
    vram_gb: float
    cpu_cores: int
    gpu_name: str
    tier: int
    recommendations: list[LLMFitRecommendation] = field(default_factory=list)


_llmfit_available: Optional[bool] = None


def is_available() -> bool:
    global _llmfit_available
    if _llmfit_available is None:
        try:
            result = subprocess.run(
                ["llmfit", "--version"],
                capture_output=True, text=True, timeout=5,
            )
            _llmfit_available = result.returncode == 0
        except (FileNotFoundError, subprocess.TimeoutExpired):
            _llmfit_available = False
    return _llmfit_available


async def get_system_fit() -> SystemFitReport | None:
    if not is_available():
        logger.warning(
            "LLMFit not installed. Install: "
            "brew install llmfit or "
            "curl -fsSL https://llmfit.axjns.dev/install.sh | sh"
        )
        return None

    try:
        proc = await asyncio.create_subprocess_exec(
            "llmfit", "recommend", "--json", "--limit", "10",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=15)

        if proc.returncode != 0:
            logger.error(f"LLMFit error: {stderr.decode()}")
            return None

        data = json.loads(stdout.decode())

        sys_proc = await asyncio.create_subprocess_exec(
            "llmfit", "system", "--json",
            stdout=asyncio.subprocess.PIPE,
        )
        sys_stdout, _ = await sys_proc.communicate()
        sys_data = json.loads(sys_stdout.decode()) if sys_stdout else {}

        recommendations = []
        for model in data.get("models", [])[:10]:
            recommendations.append(LLMFitRecommendation(
                model_id=model.get("name", "unknown"),
                provider=model.get("provider", "huggingface"),
                fit_score=model.get("fit_score", 0),
                quality_score=model.get("quality_score", 0),
                speed_score=model.get("speed_score", 0),
                context_score=model.get("context_score", 0),
                composite_score=model.get("composite_score", 0),
                estimated_ram_gb=model.get("ram_gb", 0),
                estimated_vram_gb=model.get("vram_gb", 0),
                quantization=model.get("quantization", "Q4_K_M"),
                tokens_per_second=model.get("tokens_per_second", 0),
            ))

        return SystemFitReport(
            ram_gb=sys_data.get("ram_gb", 0),
            vram_gb=sys_data.get("vram_gb", 0),
            cpu_cores=sys_data.get("cpu_cores", 0),
            gpu_name=sys_data.get("gpu_name", ""),
            tier=sys_data.get("tier", 1),
            recommendations=recommendations,
        )

    except Exception as e:
        logger.error(f"LLMFit integration error: {e}")
        return None


async def get_quantization_recommendation(
    model_size_gb: float, ram_gb: float, vram_gb: float
) -> str:
    if not is_available():
        return "Q4_K_M"

    try:
        proc = await asyncio.create_subprocess_exec(
            "llmfit", "fit", "--perfect", "-n", "1", "--json",
            stdout=asyncio.subprocess.PIPE,
        )
        stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=15)
        data = json.loads(stdout.decode())
        models = data.get("models", [])
        if models:
            return models[0].get("quantization", "Q4_K_M")
    except Exception as e:
        logger.error(f"LLMFit quant error: {e}")

    return "Q4_K_M"

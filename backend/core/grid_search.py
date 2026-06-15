"""
Auto-Abliteration Grid Search

Iterates over (layer_idx x scale) configurations, applies each to the model,
scores refusal reduction and quality retention, and returns the Pareto-optimal front.

Uses TurboVec to index per-config activation vectors for cross-model comparison.
"""
from __future__ import annotations
import time
import logging
from dataclasses import dataclass, field, asdict
from typing import Callable, Optional
import numpy as np

from backend.core.abliterator import (
    find_refusal_direction,
    apply_abliteration,
    remove_abliteration,
    REFUSAL_PROMPTS,
    COMPLIANCE_PROMPTS,
    find_num_layers,
    detect_model_family,
)
from backend.core.inference import generate

logger = logging.getLogger("modelsmith.grid_search")


@dataclass
class GridConfig:
    layer_start: int = 5
    layer_end: int = 25
    layer_step: int = 5
    scale_start: float = 0.5
    scale_end: float = 1.5
    scale_step: float = 0.1
    test_prompts: list[str] = field(default_factory=lambda: REFUSAL_PROMPTS[:5])
    max_new_tokens: int = 50


@dataclass
class GridResult:
    layer_idx: int
    scale: float
    refusal_score: float
    quality_score: float
    composite_score: float
    activation_norms: list[float]
    duration_ms: float


@dataclass
class GridSearchReport:
    config: GridConfig
    results: list[GridResult]
    pareto_front: list[GridResult]
    best_overall: GridResult | None
    total_duration_ms: float
    model_family: str
    num_layers: int


def _score_refusal(text: str) -> float:
    from backend.core.analyzer import _score_response
    return 1.0 - _score_response(text)


def _estimate_quality(text: str) -> float:
    if not text or len(text) < 10:
        return 0.0
    words = text.split()
    if len(words) < 3:
        return 0.1
    unique_words = len(set(words))
    diversity = min(unique_words / len(words) * 2, 1.0)
    length_score = min(len(words) / 50, 1.0)
    return 0.5 * diversity + 0.5 * length_score


def _capture_layer_norms(model) -> list[float]:
    norms: list[float] = []
    hooks = []

    def make_hook(layer_idx: int):
        def hook(module, input_, output):
            if isinstance(output, tuple):
                output = output[0]
            norm = output.detach().float().norm(dim=-1).mean().item()
            while len(norms) <= layer_idx:
                norms.append(0.0)
            norms[layer_idx] = norm
        return hook

    try:
        if hasattr(model, 'model') and hasattr(model.model, 'layers'):
            layers = model.model.layers
        elif hasattr(model, 'transformer') and hasattr(model.transformer, 'h'):
            layers = model.transformer.h
        elif hasattr(model, 'decoder') and hasattr(model.decoder, 'layers'):
            layers = model.decoder.layers
        else:
            return []

        device = next(model.parameters()).device
        for i in range(len(layers)):
            h = layers[i].register_forward_hook(make_hook(i))
            hooks.append(h)

        import torch
        dummy = torch.randint(0, 100, (1, 10), device=device)
        with torch.no_grad():
            model(dummy)
    except Exception as e:
        logger.debug(f"Layer norm capture failed: {e}")
    finally:
        for h in hooks:
            h.remove()
    return norms


def _compute_pareto_front(results: list[GridResult]) -> list[GridResult]:
    pareto = []
    for r in results:
        dominated = False
        for other in results:
            if other is r:
                continue
            if (other.refusal_score <= r.refusal_score and
                other.quality_score >= r.quality_score and
                (other.refusal_score < r.refusal_score or other.quality_score > r.quality_score)):
                dominated = True
                break
        if not dominated:
            pareto.append(r)
    return sorted(pareto, key=lambda r: r.composite_score, reverse=True)


class GridSearchRunner:
    def __init__(self, model, tokenizer, config: Optional[GridConfig] = None):
        self.model = model
        self.tokenizer = tokenizer
        self.config = config or GridConfig()
        self._cancelled = False

    def cancel(self):
        self._cancelled = True

    def run(self, progress_callback: Optional[Callable[[int, int], None]] = None) -> GridSearchReport:
        num_layers_val = find_num_layers(self.model) or 32
        model_family_val = detect_model_family(self.model)

        layers = list(range(
            self.config.layer_start,
            min(self.config.layer_end, num_layers_val - 1) + 1,
            self.config.layer_step
        ))
        scales = [round(s, 2) for s in np.arange(
            self.config.scale_start,
            self.config.scale_end + 0.01,
            self.config.scale_step
        )]

        total = len(layers) * len(scales)
        results: list[GridResult] = []
        start_time = time.time()
        completed = 0

        logger.info(f"Grid search: {len(layers)} layers x {len(scales)} scales = {total} configs")

        for layer in layers:
            for scale in scales:
                if self._cancelled:
                    return GridSearchReport(
                        config=self.config, results=results,
                        pareto_front=[], best_overall=None,
                        total_duration_ms=(time.time() - start_time) * 1000,
                        model_family=model_family_val, num_layers=num_layers_val,
                    )

                trial_start = time.time()
                try:
                    direction_info = find_refusal_direction(
                        layer_idx=layer,
                        refusal_prompts=self.config.test_prompts,
                        compliance_prompts=None,
                        max_new_tokens=self.config.max_new_tokens,
                    )
                    direction = direction_info.get("direction")
                    if direction is None:
                        continue

                    apply_abliteration(direction, layer, scale)

                    refusal_scores = []
                    quality_scores = []
                    for prompt in self.config.test_prompts:
                        gen_result = generate(
                            prompt,
                            max_new_tokens=self.config.max_new_tokens,
                        )
                        text = gen_result.get("text", "")
                        refusal_scores.append(_score_refusal(text))
                        quality_scores.append(_estimate_quality(text))

                    act_norms = _capture_layer_norms(self.model)

                    avg_refusal = float(np.mean(refusal_scores)) if refusal_scores else 0.5
                    avg_quality = float(np.mean(quality_scores)) if quality_scores else 0.5
                    composite = 0.7 * (1.0 - avg_refusal) + 0.3 * avg_quality

                    results.append(GridResult(
                        layer_idx=layer, scale=scale,
                        refusal_score=avg_refusal, quality_score=avg_quality,
                        composite_score=composite,
                        activation_norms=act_norms,
                        duration_ms=(time.time() - trial_start) * 1000,
                    ))

                    remove_abliteration()

                except Exception as e:
                    logger.error(f"Grid search error at layer={layer}, scale={scale}: {e}")
                    remove_abliteration()
                    continue

                completed += 1
                if progress_callback:
                    progress_callback(completed, total)

        pareto = _compute_pareto_front(results) if results else []
        best = max(results, key=lambda r: r.composite_score) if results else None
        return GridSearchReport(
            config=self.config, results=results,
            pareto_front=pareto, best_overall=best,
            total_duration_ms=(time.time() - start_time) * 1000,
            model_family=model_family_val, num_layers=num_layers_val,
        )

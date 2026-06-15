"""
TurboVec-based vector index for model activation patterns.

Indexes per-layer activation norms from analysis and grid search runs,
enabling similarity search across models.
"""
from __future__ import annotations
import json
import logging
from pathlib import Path
from typing import Optional
import numpy as np

logger = logging.getLogger("modelsmith.turbovec_index")

_tv_available: Optional[bool] = None


def is_available() -> bool:
    global _tv_available
    if _tv_available is None:
        try:
            import turbovec
            _tv_available = True
        except ImportError:
            _tv_available = False
    return _tv_available


class ActivationIndex:
    def __init__(self, dim: int = 64, bits: int = 4):
        self.dim = dim
        self.bits = bits
        self._index = None
        self._labels: list[dict] = []
        self._ready = False

    def build(self, vectors: list[list[float]], labels: list[dict]) -> bool:
        if not is_available():
            logger.warning("TurboVec not available")
            return False

        import turbovec as tv

        arr = np.array(vectors, dtype=np.float32)
        if arr.size == 0:
            return False

        if self._index is None:
            self._index = tv.Index(dim=arr.shape[1], bits=self.bits)
            self._index.add(arr)
        else:
            self._index.add(arr)

        self._labels.extend(labels)
        self._ready = True
        logger.info(f"TurboVec: {len(self._labels)} vectors indexed")
        return True

    def search(self, query: list[float], k: int = 5) -> list[dict]:
        if not self._ready or self._index is None:
            return []

        q = np.array([query], dtype=np.float32)
        distances, indices = self._index.search(q, k=k)

        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx < len(self._labels):
                results.append({**self._labels[idx], "distance": float(dist)})
        return results

    def save(self, path: str):
        if self._ready and self._index is not None:
            self._index.write(path)
            meta_path = path + ".meta.json"
            with open(meta_path, "w") as f:
                json.dump(self._labels, f)

    def load(self, path: str) -> bool:
        if not is_available():
            return False
        import turbovec as tv
        self._index = tv.Index.read(path)
        meta_path = path + ".meta.json"
        try:
            with open(meta_path) as f:
                self._labels = json.load(f)
        except FileNotFoundError:
            self._labels = []
        self._ready = True
        return True


_activation_index: Optional[ActivationIndex] = None


def get_activation_index() -> ActivationIndex:
    global _activation_index
    if _activation_index is None:
        _activation_index = ActivationIndex()
    return _activation_index


def index_activation_vectors(
    vectors: list[list[float]],
    labels: list[dict],
) -> bool:
    idx = get_activation_index()
    return idx.build(vectors, labels)


def search_similar_activations(
    query: list[float],
    k: int = 5,
) -> list[dict]:
    idx = get_activation_index()
    return idx.search(query, k=k)

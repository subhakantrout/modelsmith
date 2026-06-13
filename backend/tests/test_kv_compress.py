import pytest
from backend.core.kv_compress import (
    get_kv_methods,
    estimate_kv_savings,
    KV_METHODS,
)


def test_get_kv_methods():
    methods = get_kv_methods()
    assert len(methods) == len(KV_METHODS)
    for m in methods:
        assert "id" in m
        assert "name" in m
        assert "ratio" in m


def test_estimate_kv_savings_basic():
    result = estimate_kv_savings(4096, 32, 4096, "turboquant")
    assert result["original_bytes"] > 0
    assert result["original_gb"] > 0
    assert result["compressed_gb"] < result["original_gb"]
    assert result["savings_gb"] > 0


def test_estimate_kv_savings_none():
    result = estimate_kv_savings(4096, 32, 4096, "none")
    assert result["original_gb"] == result["compressed_gb"]
    assert result["savings_gb"] == 0


def test_estimate_kv_savings_pca():
    pca = estimate_kv_savings(4096, 32, 4096, "pca")
    none = estimate_kv_savings(4096, 32, 4096, "none")
    assert pca["compressed_gb"] < none["compressed_gb"]


def test_estimate_kv_savings_invalid_method():
    with pytest.raises(ValueError, match="Unknown method"):
        estimate_kv_savings(4096, 32, 4096, "invalid")


def test_estimate_kv_savings_large_context():
    result = estimate_kv_savings(32768, 32, 4096, "kvquant")
    assert result["original_gb"] > 1.0
    assert result["compressed_gb"] > 0


def test_estimate_kv_savings_small_model():
    result = estimate_kv_savings(2048, 24, 1024, "turboquant")
    assert result["original_gb"] < 1.0


def test_kv_ratios_ordered():
    methods = get_kv_methods()
    ratios = [m["ratio"] for m in methods]
    assert ratios == sorted(ratios, reverse=True)

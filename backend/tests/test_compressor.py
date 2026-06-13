import pytest
from backend.core.compressor import (
    get_available_quants,
    estimate_gguf_quant_size,
    estimate_pruned_size,
    estimate_sparsified_size,
    get_sparsification_methods,
    can_quantize,
    GGUF_QUANTS,
    PRUNE_RATIOS,
)


def test_get_available_quants():
    quants = get_available_quants()
    assert len(quants) == len(GGUF_QUANTS)
    for q in quants:
        assert "id" in q
        assert "name" in q
        assert "ratio" in q


def test_estimate_gguf_quant_size():
    result = estimate_gguf_quant_size(7.0, "q4_k_m")
    assert result["original_gb"] == 7.0
    assert result["quantized_gb"] < 7.0
    assert result["savings_gb"] > 0
    assert 0 < result["ratio"] <= 1


def test_estimate_gguf_quant_q8_is_larger():
    q4 = estimate_gguf_quant_size(7.0, "q4_k_m")
    q8 = estimate_gguf_quant_size(7.0, "q8_0")
    assert q8["quantized_gb"] > q4["quantized_gb"]


def test_estimate_gguf_quant_invalid_id():
    with pytest.raises(ValueError, match="Unknown quant"):
        estimate_gguf_quant_size(7.0, "invalid")


def test_estimate_pruned_size():
    result = estimate_pruned_size(10.0, 0.5)
    assert result["original_gb"] == 10.0
    assert result["pruned_gb"] == 5.0
    assert result["savings_gb"] == 5.0


def test_estimate_pruned_size_zero():
    result = estimate_pruned_size(10.0, 0.0)
    assert result["pruned_gb"] == 10.0


def test_estimate_pruned_size_full():
    result = estimate_pruned_size(10.0, 1.0)
    assert result["pruned_gb"] == 0.0


def test_estimate_pruned_light():
    result = estimate_pruned_size(8.0, PRUNE_RATIOS["light"])
    assert abs(result["pruned_gb"] - 6.0) < 0.1


def test_estimate_pruned_heavy():
    result = estimate_pruned_size(8.0, PRUNE_RATIOS["heavy"])
    assert abs(result["pruned_gb"] - 2.0) < 0.1


def test_can_quantize_sufficient_ram():
    assert can_quantize(7.0, 8.0) is True


def test_can_quantize_insufficient_ram():
    assert can_quantize(70.0, 8.0) is False


def test_can_quantize_edge():
    assert can_quantize(16.0, 8.0) is True
    assert can_quantize(16.1, 8.0) is False


def test_get_sparsification_methods():
    methods = get_sparsification_methods()
    assert len(methods) >= 2
    for m in methods:
        assert "id" in m
        assert "name" in m
        assert "ratio" in m


def test_estimate_sparsified_size():
    result = estimate_sparsified_size(10.0, "magnitude")
    assert result["original_gb"] == 10.0
    assert result["sparsified_gb"] < 10.0
    assert result["savings_gb"] > 0


def test_estimate_sparsified_size_invalid():
    with pytest.raises(ValueError, match="Unknown sparsification"):
        estimate_sparsified_size(10.0, "invalid")

import pytest
import torch
from backend.core.abliterator import (
    detect_model_family, REFUSAL_LAYERS, REFUSAL_PROMPTS, COMPLIANCE_PROMPTS,
    get_layer_range, get_abliteration_status, remove_abliteration,
)


def test_refusal_prompts_defined():
    assert len(REFUSAL_PROMPTS) == 5
    assert all(isinstance(p, str) for p in REFUSAL_PROMPTS)


def test_compliance_prompts_defined():
    assert len(COMPLIANCE_PROMPTS) == 5
    assert all(isinstance(p, str) for p in COMPLIANCE_PROMPTS)


def test_refusal_layers_contains_default():
    assert "default" in REFUSAL_LAYERS


def test_get_layer_range():
    start, end = get_layer_range("llama")
    assert 0 <= start < end


def test_get_layer_range_default():
    start, end = get_layer_range("unknown")
    assert start == 8
    assert end == 24


def test_detect_model_family_llama():
    class MockConfig:
        model_type = "llama"
    class MockModel:
        config = MockConfig()
    assert detect_model_family(MockModel()) == "llama"


def test_detect_model_family_default():
    class MockConfig:
        model_type = "unknown"
    class MockModel:
        config = MockConfig()
    assert detect_model_family(MockModel()) == "default"


def test_abliteration_status_no_hooks():
    remove_abliteration()
    status = get_abliteration_status()
    assert status["active"] is False
    assert status["active_hooks"] == 0


def test_remove_abliteration_idempotent():
    result = remove_abliteration()
    assert result["hooks_removed"] >= 0


def test_find_refusal_direction_no_model():
    from backend.core.abliterator import find_refusal_direction
    with pytest.raises(RuntimeError, match="No model"):
        find_refusal_direction()

import pytest
import torch
from backend.core.model_manager import ModelManager, get_manager


def test_manager_singleton():
    m1 = get_manager()
    m2 = get_manager()
    assert m1 is m2


def test_manager_initial_state():
    mgr = get_manager()
    assert mgr.model is None
    assert mgr.tokenizer is None
    assert mgr.is_loaded is False


def test_compute_load_config_tier3():
    mgr = get_manager()
    config = mgr.compute_load_config(tier=3, model_size_billions=7)
    cuda_avail = torch.cuda.is_available()
    expected_dtype = torch.float16 if cuda_avail else torch.float32
    assert config["torch_dtype"] == expected_dtype
    if cuda_avail:
        assert config.get("quantization_config") is not None
    else:
        assert config.get("quantization_config") is None


def test_compute_load_config_tier1():
    mgr = get_manager()
    with pytest.raises(ValueError, match="cannot load real models"):
        mgr.compute_load_config(tier=1, model_size_billions=7)


def test_compute_load_config_too_large():
    mgr = get_manager()
    with pytest.raises(ValueError, match="Insufficient"):
        mgr.compute_load_config(tier=2, model_size_billions=70)


def test_format_size():
    result = ModelManager.format_size(2_000_000_000)
    assert "GB" in result


def test_format_size_small():
    result = ModelManager.format_size(500_000)
    assert "MB" in result


def test_unload_no_model():
    mgr = get_manager()
    mgr.unload()
    assert mgr.is_loaded is False

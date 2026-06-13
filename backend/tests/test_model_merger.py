import pytest
from backend.core.model_merger import (
    get_available_methods,
    compute_merge_config,
    estimate_merge_ram,
    MERGE_METHODS,
)


def test_get_available_methods():
    methods = get_available_methods()
    assert len(methods) >= 4
    assert methods[0]["id"] in MERGE_METHODS


def test_compute_merge_config_unknown_method():
    with pytest.raises(ValueError, match="Unknown merge method"):
        compute_merge_config("unknown", [{"path": "/some/path"}])


def test_compute_merge_config_too_few_models():
    with pytest.raises(ValueError, match="At least 2 models"):
        compute_merge_config("ties", [{"path": "/some/path"}])


def test_estimate_merge_ram():
    models = [
        {"size_gb": 7, "path": "/a"},
        {"size_gb": 7, "path": "/b"},
    ]
    result = estimate_merge_ram("ties", models)
    assert result["total_input_gb"] == 14.0
    assert result["estimated_peak_ram_gb"] > 14.0

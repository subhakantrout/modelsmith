import pytest
from backend.core.config_profiles import (
    get_profiles,
    get_profile,
    compute_preflight,
    PROFILES,
)


def test_get_profiles_returns_all():
    profiles = get_profiles()
    assert set(profiles.keys()) == set(PROFILES.keys())


def test_get_profile_valid():
    profile = get_profile("balanced")
    assert profile["name"] == "Balanced"
    assert 0 < profile["max_ram_pct"] <= 1


def test_get_profile_invalid():
    with pytest.raises(ValueError, match="Unknown profile"):
        get_profile("invalid")


def test_compute_preflight_feasible():
    result = compute_preflight("load", {"model_size_gb": 7, "available_ram_gb": 16})
    assert result["operation"] == "load"
    assert "estimated_peak_ram_gb" in result


def test_compute_preflight_warning():
    result = compute_preflight("load", {"model_size_gb": 70, "available_ram_gb": 8})
    assert len(result["warnings"]) > 0

import pytest
from backend.core.system import detect_hardware, get_tier, compute_safe_budget


def test_detect_hardware_returns_all_fields():
    specs = detect_hardware()
    assert "ram_total_gb" in specs
    assert "ram_available_gb" in specs
    assert "cpu_cores" in specs
    assert "cpu_threads" in specs
    assert "gpu_name" in specs
    assert "gpu_vram_gb" in specs
    assert specs["ram_total_gb"] > 0
    assert specs["cpu_cores"] > 0


def test_tier_classification():
    assert get_tier(ram_gb=4, vram_gb=0) == 1
    assert get_tier(ram_gb=8, vram_gb=4) == 2
    assert get_tier(ram_gb=16, vram_gb=8) == 3
    assert get_tier(ram_gb=32, vram_gb=24) == 4
    assert get_tier(ram_gb=64, vram_gb=48) == 5


def test_tier_edge_cases():
    assert get_tier(ram_gb=128, vram_gb=None) == 1
    assert get_tier(ram_gb=64, vram_gb=0) == 1
    assert get_tier(ram_gb=24, vram_gb=12) == 3


def test_compute_safe_budget():
    budget = compute_safe_budget(32.0)
    assert budget["os_overhead_gb"] == 2.5
    assert budget["available_gb"] == 29.5
    assert budget["safety_buffer_gb"] == 5.9
    assert budget["working_budget_gb"] == 23.6

import pytest
from backend.core.advisor import (
    get_pipeline_presets,
    recommend_pipeline,
    estimate_pipeline_time,
    get_tier,
    suggest_alternatives,
    dry_run_validate,
    compare_models,
    PRESETS,
)


def test_get_pipeline_presets():
    presets = get_pipeline_presets()
    assert len(presets) >= 2
    for p in presets:
        assert "id" in p
        assert "name" in p
        assert "pipeline" in p
        assert len(p["pipeline"]) > 0


def test_recommend_pipeline_returns_dict():
    result = recommend_pipeline(ram_gb=16, vram_gb=8)
    assert "pipeline" in result
    assert "tier" in result
    assert "feasible" in result
    assert len(result["pipeline"]) >= 2


def test_recommend_pipeline_low_spec():
    result = recommend_pipeline(ram_gb=4, vram_gb=0)
    assert result["feasible"] is True
    assert result["tier"] == 1


def test_recommend_pipeline_tier1_removes_merge():
    result = recommend_pipeline(ram_gb=4, vram_gb=0, goal="merge_and_uncensor")
    types = [s["type"] for s in result["pipeline"]]
    assert "merge" not in types


def test_recommend_pipeline_tier2_has_warning():
    result = recommend_pipeline(ram_gb=8, vram_gb=4, goal="merge_and_uncensor")
    assert len(result["warnings"]) > 0


def test_recommend_pipeline_disk_warning():
    result = recommend_pipeline(ram_gb=16, vram_gb=8, disk_gb=10)
    disk_warnings = [w for w in result["warnings"] if "disk" in w.lower()]
    assert len(disk_warnings) > 0


def test_recommend_pipeline_default_goal():
    result = recommend_pipeline(ram_gb=16, vram_gb=8)
    assert result["goal"] == "uncensor"


def test_recommend_pipeline_invalid_goal_falls_back():
    result = recommend_pipeline(ram_gb=16, vram_gb=8, goal="invalid_goal_xyz")
    assert result["goal"] == "uncensor"


def test_recommend_pipeline_tier3():
    result = recommend_pipeline(ram_gb=16, vram_gb=8)
    assert result["tier"] >= 3
    assert result["recommended_profile"] == "balanced"


def test_recommend_pipeline_tier1_profile():
    result = recommend_pipeline(ram_gb=4, vram_gb=0)
    assert result["recommended_profile"] == "safe"


def test_get_tier_function():
    assert get_tier(64, 48) == 5
    assert get_tier(32, 24) == 4
    assert get_tier(16, 8) == 3
    assert get_tier(8, 4) == 2
    assert get_tier(4, 0) == 1


def test_get_tier_none_vram():
    assert get_tier(64, None) == 1


def test_estimate_pipeline_time_basic():
    pipeline = [{"type": "modelInput"}, {"type": "analyze"}]
    result = estimate_pipeline_time(pipeline)
    assert result["total_seconds"] > 0
    assert result["total_minutes"] > 0
    assert len(result["steps"]) == 2


def test_estimate_pipeline_time_full():
    pipeline = [{"type": t} for t in ["modelInput", "analyze", "abliterate", "merge", "lora", "compress", "export"]]
    result = estimate_pipeline_time(pipeline)
    assert result["total_seconds"] > 2000
    assert result["total_minutes"] > 30


def test_estimate_pipeline_time_unknown_step():
    pipeline = [{"type": "unknown_step"}, {"type": "modelInput"}]
    result = estimate_pipeline_time(pipeline)
    assert len(result["steps"]) == 2


def test_suggest_alternatives_known():
    alts = suggest_alternatives("abliterate", 3)
    assert len(alts) > 0
    assert "type" in alts[0]


def test_suggest_alternatives_unknown():
    alts = suggest_alternatives("nonexistent", 3)
    assert alts == []


def test_suggest_alternatives_tier1_no_merge():
    alts = suggest_alternatives("merge", 1)
    for a in alts:
        assert a["type"] != "merge"


def test_dry_run_validate_valid():
    result = dry_run_validate([{"type": "modelInput"}, {"type": "analyze"}], 3, 16, 50)
    assert result["valid"] is True
    assert len(result["errors"]) == 0


def test_dry_run_validate_tier1_merge():
    result = dry_run_validate([{"type": "merge"}], 1, 4, 10)
    assert result["valid"] is False
    assert len(result["errors"]) > 0


def test_dry_run_validate_warnings():
    result = dry_run_validate([{"type": "compress"}, {"type": "export"}], 2, 6, 10)
    assert len(result["warnings"]) > 0


def test_compare_models():
    a = {"name": "model-a", "size_gb": 7.0, "format": "gguf"}
    b = {"name": "model-b", "size_gb": 13.0, "format": "safetensors"}
    result = compare_models(a, b)
    assert "model_a" in result
    assert "model_b" in result
    assert "differences" in result
    assert result["differences"]["size_delta_gb"] == 6.0
    assert result["differences"]["same_format"] is False


def test_compare_models_same():
    a = {"name": "same", "size_gb": 7.0, "format": "gguf"}
    b = {"name": "same2", "size_gb": 7.0, "format": "gguf"}
    result = compare_models(a, b)
    assert result["differences"]["size_delta_gb"] == 0
    assert result["differences"]["same_format"] is True


def test_compare_models_scores():
    a = {"name": "small", "size_gb": 3.0, "format": "gguf"}
    b = {"name": "large", "size_gb": 70.0, "format": "safetensors"}
    result = compare_models(a, b)
    assert result["model_a"]["efficiency_score"] > result["model_b"]["efficiency_score"]


def test_all_presets_have_valid_pipelines():
    for preset_id, preset in PRESETS.items():
        assert len(preset["pipeline"]) > 0
        for step in preset["pipeline"]:
            assert "type" in step

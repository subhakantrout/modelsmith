import pytest
from backend.core.pipeline import (
    get_node_types, execute_pipeline_step, execute_pipeline,
)


def test_node_types_registered():
    types = get_node_types()
    assert "modelInput" in types
    assert "analyze" in types
    assert "abliterate" in types
    assert "export" in types


def test_node_types_have_metadata():
    types = get_node_types()
    for name, meta in types.items():
        assert "label" in meta
        assert "description" in meta
        assert "config_fields" in meta


def test_execute_unknown_type():
    with pytest.raises(ValueError, match="Unknown"):
        execute_pipeline_step({"id": "n1", "type": "unknown", "config": {}})


def test_execute_pipeline_unknown_stops():
    steps = [
        {"id": "n1", "type": "unknown", "config": {}},
    ]
    result = execute_pipeline(steps)
    assert result["status"] == "error"
    assert len(result["errors"]) == 1


def test_execute_pipeline_empty():
    result = execute_pipeline([])
    assert result["status"] == "done"
    assert result["total_steps"] == 0


def test_execute_model_input_no_path():
    with pytest.raises(ValueError, match="Model path"):
        execute_pipeline_step({"id": "n1", "type": "modelInput", "config": {}})


def test_execute_export_no_dir():
    with pytest.raises(ValueError, match="Output directory"):
        execute_pipeline_step({"id": "n1", "type": "export", "config": {}})

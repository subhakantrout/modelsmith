import pytest
import os
import tempfile
from backend.core.model_registry import (
    scan_directory,
    scan_common_dirs,
    get_model_summary,
)
from backend.core.model_manager import get_manager


def test_scan_directory_nonexistent():
    with pytest.raises(FileNotFoundError, match="Directory not found"):
        scan_directory("/nonexistent_path_xyz123")


def test_scan_directory_empty():
    with tempfile.TemporaryDirectory() as tmpdir:
        results = scan_directory(tmpdir)
        assert results == []


def test_scan_directory_with_valid_files():
    with tempfile.TemporaryDirectory() as tmpdir:
        filepath = os.path.join(tmpdir, "model.gguf")
        with open(filepath, "wb") as f:
            f.write(b"x" * 1024 * 1024)
        results = scan_directory(tmpdir)
        assert len(results) == 1
        assert results[0]["name"] == "model.gguf"
        assert results[0]["format"] == "gguf"
        assert results[0]["size_gb"] >= 0


def test_scan_directory_ignores_non_model_files():
    with tempfile.TemporaryDirectory() as tmpdir:
        for fname in ["notes.txt", "data.csv", "readme.md"]:
            with open(os.path.join(tmpdir, fname), "w") as f:
                f.write("dummy")
        results = scan_directory(tmpdir)
        assert len(results) == 0


def test_scan_directory_with_directory():
    with tempfile.TemporaryDirectory() as tmpdir:
        subdir = os.path.join(tmpdir, "my_model")
        os.makedirs(subdir)
        with open(os.path.join(subdir, "model.safetensors"), "w") as f:
            f.write("dummy")
        results = scan_directory(tmpdir)
        assert len(results) == 1
        assert results[0]["format"] == "directory"


def test_get_model_summary_no_model():
    mgr = get_manager()
    mgr.unload()
    result = get_model_summary()
    assert result["loaded"] is False
    assert "hardware" in result
    assert "tier" in result


def test_get_model_summary_has_hardware():
    result = get_model_summary()
    assert result["hardware"]["ram_gb"] > 0
    assert "gpu" in result["hardware"]


def test_scan_common_dirs_returns_list():
    results = scan_common_dirs()
    assert isinstance(results, list)

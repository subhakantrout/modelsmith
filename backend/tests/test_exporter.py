import os
import pytest
from backend.core.exporter import (
    SUPPORTED_FORMATS, get_available_formats, validate_export,
)

EXPECTED_FORMATS = {"gguf", "safetensors"}


def test_supported_formats():
    assert EXPECTED_FORMATS == set(SUPPORTED_FORMATS.keys())


def test_gguf_info():
    info = SUPPORTED_FORMATS["gguf"]
    assert info["requires_llamacpp"] is True
    assert info["extension"] == ".gguf"


def test_safetensors_info():
    info = SUPPORTED_FORMATS["safetensors"]
    assert info["requires_llamacpp"] is False
    assert info["extension"] == ".safetensors"


def test_get_available_formats():
    formats = get_available_formats()
    assert len(formats) == 2
    for fmt in formats:
        assert "id" in fmt
        assert "available" in fmt


def test_validate_unknown_format():
    result = validate_export("unknown", "")
    assert result["valid"] is False
    assert len(result["errors"]) > 0


def test_validate_safetensors_no_model(tmp_path):
    result = validate_export("safetensors", str(tmp_path))
    assert result["valid"] is False
    assert any("No model" in e for e in result["errors"])


def test_validate_safetensors_with_output(tmp_path):
    existing = tmp_path / "existing"
    existing.mkdir()
    dummy = existing / "dummy.txt"
    dummy.write_text("test")
    result = validate_export("safetensors", str(existing))
    assert len(result["warnings"]) > 0

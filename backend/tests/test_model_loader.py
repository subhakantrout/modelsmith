import pytest
from backend.core.model_loader import detect_format, get_model_info, ModelFormat


def test_detect_format_known():
    assert detect_format("/fake/pytorch_model.bin") == ModelFormat.HF_SAFETENSORS
    assert detect_format("/fake/model.safetensors") == ModelFormat.HF_SAFETENSORS
    assert detect_format("/fake/model.gguf") == ModelFormat.GGUF
    assert detect_format("/fake/model.xyz") == ModelFormat.UNKNOWN


def test_get_model_info_gguf(tmp_path):
    gguf_path = tmp_path / "test.gguf"
    magic = b"GGUF"
    version = (3).to_bytes(4, "little")
    tensor_count = (0).to_bytes(8, "little")
    kv_count = (0).to_bytes(8, "little")
    gguf_path.write_bytes(magic + version + tensor_count + kv_count)

    info = get_model_info(str(gguf_path))
    assert info["format"] == "gguf"
    assert info["path"] == str(gguf_path)
    assert "size_gb" in info


def test_detect_format_directory(tmp_path):
    hf_dir = tmp_path / "my_model"
    hf_dir.mkdir()
    (hf_dir / "config.json").write_text('{"model_type": "llama"}')
    (hf_dir / "model.safetensors").write_text("fake")
    assert detect_format(str(hf_dir)) == ModelFormat.HF_SAFETENSORS


def test_get_model_info_hf_directory(tmp_path):
    hf_dir = tmp_path / "my_model"
    hf_dir.mkdir()
    (hf_dir / "config.json").write_text('{"model_type": "llama", "hidden_size": 4096}')
    (hf_dir / "model.safetensors").write_text("x" * 4096)

    info = get_model_info(str(hf_dir))
    assert info["format"] == "hf_safetensors"
    assert info["valid"] is True
    assert info["hf_info"]["config"]["model_type"] == "llama"
    assert isinstance(info["size_gb"], (int, float))


def test_get_model_info_nonexistent():
    with pytest.raises(FileNotFoundError):
        get_model_info("/nonexistent/path")

import pytest
from backend.core.lora_manager import (
    is_peft_available,
    validate_adapter,
    scan_adapters,
    apply_lora,
    fuse_lora,
    unload_lora,
)


def test_is_peft_available():
    assert is_peft_available() is True


def test_scan_adapters_nonexistent():
    with pytest.raises(FileNotFoundError):
        scan_adapters("/nonexistent/path")


def test_validate_adapter_nonexistent():
    result = validate_adapter("/nonexistent/path")
    assert result["valid"] is False


def test_apply_lora_no_model():
    from backend.core.model_manager import get_manager
    mgr = get_manager()
    mgr.unload()
    with pytest.raises(RuntimeError, match="No model loaded"):
        apply_lora("/some/path")


def test_fuse_lora_no_model():
    from backend.core.model_manager import get_manager
    mgr = get_manager()
    mgr.unload()
    with pytest.raises(RuntimeError, match="No model loaded"):
        fuse_lora()


def test_unload_lora_no_model():
    from backend.core.model_manager import get_manager
    mgr = get_manager()
    mgr.unload()
    with pytest.raises(RuntimeError, match="No model loaded"):
        unload_lora()

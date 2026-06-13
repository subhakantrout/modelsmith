import pytest
from backend.core.inference import format_prompt, estimate_tokens, truncate_to_limit


def test_format_prompt_with_system():
    result = format_prompt("Hello", "Be helpful")
    assert "Be helpful" in result
    assert "Hello" in result
    assert "system" in result
    assert "user" in result
    assert "assistant" in result


def test_format_prompt_without_system():
    result = format_prompt("Hi there")
    assert "Hi there" in result
    assert "system" not in result
    assert "user" in result
    assert "assistant" in result


def test_estimate_tokens():
    text = "Hello world, this is a test " * 10
    count = estimate_tokens(text)
    assert count > 0
    assert count < len(text)


def test_truncate_to_limit_short():
    text = "Short text"
    result = truncate_to_limit(text, max_chars=100)
    assert result == text


def test_truncate_to_limit_long():
    text = "word " * 1000
    truncated = truncate_to_limit(text, max_chars=100)
    assert len(truncated) <= 100


def test_generate_no_model():
    from backend.core.inference import generate
    with pytest.raises(RuntimeError, match="No model"):
        generate("test prompt")

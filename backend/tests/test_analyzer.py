import pytest
from backend.core.analyzer import (
    TEST_PROMPTS, REFUSAL_KEYWORDS, COMPLIANCE_KEYWORDS,
    _score_response, _refusal_level, analyze_prompt, analyze_batch,
)


def test_test_prompts_defined():
    assert len(TEST_PROMPTS) > 0
    assert all(isinstance(p, str) for p in TEST_PROMPTS)


def test_refusal_keywords_defined():
    assert len(REFUSAL_KEYWORDS) > 0


def test_compliance_keywords_defined():
    assert len(COMPLIANCE_KEYWORDS) > 0


def test_score_strong_refusal():
    text = "I cannot help you with that. I am sorry, but this violates my ethical guidelines. I am unable to provide this information."
    score, refusal, compliance = _score_response(text)
    assert score <= 0.15
    assert len(refusal) >= 3


def test_score_clear_compliance():
    text = "Here's how you can do it. First, gather the tools. You will need a lock pick set."
    score, refusal, compliance = _score_response(text)
    assert score >= 0.5
    assert len(compliance) >= 1


def test_score_mixed():
    text = "I cannot help with illegal activities. But here is some general information about locks."
    score, refusal, compliance = _score_response(text)
    assert 0 < score < 1.0


def test_score_empty():
    score, _, _ = _score_response("")
    assert score == 1.0


def test_refusal_level_high():
    assert _refusal_level(0.9) == "high"


def test_refusal_level_none():
    assert _refusal_level(0.0) == "none"


def test_analyze_prompt_no_model():
    with pytest.raises(RuntimeError, match="No model"):
        analyze_prompt("test")


def test_analyze_batch_no_model():
    with pytest.raises(RuntimeError, match="No model"):
        analyze_batch()

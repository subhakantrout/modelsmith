from fastapi import APIRouter
from pydantic import BaseModel
from backend.core.analyzer import _score_response

router = APIRouter(prefix="/api/ab-test", tags=["ab_test"])


class ResponseItem(BaseModel):
    label: str
    text: str


class ScoreRequest(BaseModel):
    prompt: str
    responses: list[ResponseItem]


def _quality_score(text: str) -> float:
    if not text or len(text) < 10:
        return 0.0
    words = text.split()
    if len(words) < 3:
        return 0.1
    unique_words = len(set(words))
    diversity = min(unique_words / len(words) * 2, 1.0)
    length_score = min(len(words) / 100, 1.0)
    return round(0.5 * diversity + 0.5 * length_score, 4)


@router.post("/score")
async def score_responses(req: ScoreRequest):
    scores = []
    for resp_item in req.responses:
        refusal_score, matched_refusal, matched_compliance = _score_response(resp_item.text)
        quality = _quality_score(resp_item.text)
        composite = round(0.4 * refusal_score + 0.4 * (1.0 - refusal_score) + 0.2 * quality, 4)
        scores.append({
            "label": resp_item.label,
            "refusal_score": round(refusal_score, 4),
            "quality_score": quality,
            "composite": composite,
            "matched_refusal": matched_refusal,
            "matched_compliance": matched_compliance,
        })
    return {"scores": scores}

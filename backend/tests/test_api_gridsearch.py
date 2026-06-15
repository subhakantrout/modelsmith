from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_grid_search_no_model_loaded():
    resp = client.post("/api/abliterate/grid-search", json={
        "layer_start": 5,
        "layer_end": 10,
        "layer_step": 5,
        "scale_start": 0.5,
        "scale_end": 1.5,
        "scale_step": 0.1,
        "max_new_tokens": 50,
    })
    assert resp.status_code == 400
    detail = resp.json()
    assert "detail" in detail
    assert "model" in detail["detail"].lower() or "loaded" in detail["detail"].lower()


def test_grid_search_defaults_used():
    resp = client.post("/api/abliterate/grid-search", json={
        "layer_start": 5,
        "layer_end": 10,
    })
    assert resp.status_code == 400


def test_grid_search_validates_range():
    resp = client.post("/api/abliterate/grid-search", json={
        "layer_start": -1,
        "layer_end": 5,
    })
    assert resp.status_code == 400


def test_grid_search_empty_body():
    resp = client.post("/api/abliterate/grid-search", json={})
    assert resp.status_code == 400

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_generate_pipeline_abliterate():
    resp = client.post("/api/advisor/generate-pipeline", json={
        "query": "I want to abliterate a Llama model",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert len(data["nodes"]) >= 2
    assert any("abliterate" in n["type"] for n in data["nodes"])
    assert any("Llama" in n["data"]["label"] for n in data["nodes"])


def test_generate_pipeline_compress():
    resp = client.post("/api/advisor/generate-pipeline", json={
        "query": "Compress my Mistral model with 8GB RAM",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert any("compress" in n["type"] for n in data["nodes"])
    assert any("Mistral" in n["data"]["label"] for n in data["nodes"])


def test_generate_pipeline_merge():
    resp = client.post("/api/advisor/generate-pipeline", json={
        "query": "Merge two Qwen models together",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert any("merge" in n["type"] for n in data["nodes"])


def test_generate_pipeline_unknown_defaults_to_chat():
    resp = client.post("/api/advisor/generate-pipeline", json={
        "query": "something completely random and unrelated",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert any("chat" in n["type"] for n in data["nodes"])


def test_generate_pipeline_with_hardware():
    resp = client.post("/api/advisor/generate-pipeline", json={
        "query": "I have 16GB RAM and want to abliterate a model",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    for n in data["nodes"]:
        if n["type"] == "abliterate":
            assert "16GB" in n["data"]["config"]["hardware"]


def test_generate_pipeline_returns_edges():
    resp = client.post("/api/advisor/generate-pipeline", json={
        "query": "analyze a Phi model",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["edges"]) > 0
    for edge in data["edges"]:
        assert "id" in edge
        assert "source" in edge
        assert "target" in edge

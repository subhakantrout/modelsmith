from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_get_node_types():
    resp = client.get("/api/pipeline/node-types")
    assert resp.status_code == 200
    data = resp.json()
    assert "node_types" in data
    assert isinstance(data["node_types"], dict)


def test_pipeline_run_empty():
    resp = client.post("/api/pipeline/run", json={"steps": []})
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "done"
    assert data["total_steps"] == 0
    assert data["completed_steps"] == 0
    assert data["results"] == []


def test_pipeline_run_unknown_type():
    resp = client.post("/api/pipeline/run", json={
        "steps": [{"id": "s1", "type": "nonexistent", "config": {}}]
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "error"
    assert len(data["errors"]) > 0
    assert "nonexistent" in data["errors"][0]["error"]


def test_pipeline_run_model_input_no_path():
    resp = client.post("/api/pipeline/run", json={
        "steps": [{"id": "s1", "type": "modelInput", "config": {}}]
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "error"
    assert len(data["errors"]) > 0
    assert "path" in data["errors"][0]["error"].lower()


def test_pipeline_run_multi_step_chain_fails_early():
    resp = client.post("/api/pipeline/run", json={
        "steps": [
            {"id": "s1", "type": "modelInput", "config": {}},
            {"id": "s2", "type": "export", "config": {"output_dir": "/tmp"}},
        ]
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "error"
    assert len(data["errors"]) == 1

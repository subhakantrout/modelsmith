import json
from pathlib import Path
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

DATA_FILE = Path(__file__).resolve().parent.parent / "api" / ".." / "data" / "provenance.jsonl"


def cleanup():
    if DATA_FILE.exists():
        DATA_FILE.unlink()


def test_record_provenance():
    cleanup()
    resp = client.post("/api/pipeline/provenance/record", json={
        "pipeline_name": "test-pipeline",
        "model_name": "test-model",
        "steps": [
            {"type": "analyze", "config": {}, "result": {"score": 0.5}},
        ],
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "recorded"
    assert DATA_FILE.exists()
    cleanup()


def test_provenance_history_empty():
    cleanup()
    resp = client.get("/api/pipeline/provenance/history")
    assert resp.status_code == 200
    data = resp.json()
    assert data["records"] == []
    cleanup()


def test_provenance_history_records():
    cleanup()
    client.post("/api/pipeline/provenance/record", json={
        "pipeline_name": "p1",
        "model_name": "m1",
        "steps": [],
    })
    client.post("/api/pipeline/provenance/record", json={
        "pipeline_name": "p2",
        "model_name": "m2",
        "steps": [],
    })
    resp = client.get("/api/pipeline/provenance/history")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["records"]) == 2
    cleanup()


def test_record_provenance_cleanup():
    cleanup()
    resp = client.post("/api/pipeline/provenance/record", json={
        "pipeline_name": "clean-test",
        "model_name": "clean-model",
        "steps": [],
    })
    assert resp.status_code == 200
    cleanup()
    assert not DATA_FILE.exists()

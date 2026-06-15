from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_list_quants():
    resp = client.get("/api/compress/quants")
    assert resp.status_code == 200
    data = resp.json()
    assert "quants" in data
    assert len(data["quants"]) > 0
    for q in data["quants"]:
        assert "id" in q
        assert "name" in q
        assert "ratio" in q


def test_list_sparsification_methods():
    resp = client.get("/api/compress/sparsification-methods")
    assert resp.status_code == 200
    data = resp.json()
    assert "methods" in data
    assert len(data["methods"]) > 0
    for m in data["methods"]:
        assert "id" in m
        assert "name" in m
        assert "ratio" in m


def test_list_kv_methods():
    resp = client.get("/api/compress/kv-methods")
    assert resp.status_code == 200
    data = resp.json()
    assert "methods" in data
    assert len(data["methods"]) > 0
    for m in data["methods"]:
        assert "id" in m
        assert "name" in m
        assert "ratio" in m


def test_quant_estimate_valid():
    resp = client.post("/api/compress/quant-estimate", json={
        "original_gb": 7.0,
        "quant_id": "q4_k_m",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["original_gb"] == 7.0
    assert data["quantized_gb"] < 7.0
    assert data["savings_gb"] > 0
    assert 0 < data["ratio"] <= 1


def test_quant_estimate_invalid_quant_id():
    resp = client.post("/api/compress/quant-estimate", json={
        "original_gb": 7.0,
        "quant_id": "not_a_real_quant",
    })
    assert resp.status_code == 400


def test_prune_estimate_valid():
    resp = client.post("/api/compress/prune-estimate", json={
        "original_gb": 10.0,
        "ratio": "medium",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["original_gb"] == 10.0
    assert data["pruned_gb"] == 5.0
    assert data["savings_gb"] == 5.0


def test_prune_estimate_default_ratio():
    resp = client.post("/api/compress/prune-estimate", json={
        "original_gb": 10.0,
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["original_gb"] == 10.0


def test_sparsify_estimate_valid():
    resp = client.post("/api/compress/sparsify-estimate", json={
        "original_gb": 10.0,
        "method": "magnitude",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["original_gb"] == 10.0
    assert data["sparsified_gb"] < 10.0
    assert data["savings_gb"] > 0


def test_sparsify_estimate_invalid_method():
    resp = client.post("/api/compress/sparsify-estimate", json={
        "original_gb": 10.0,
        "method": "not_a_method",
    })
    assert resp.status_code == 400


def test_kv_estimate_valid():
    resp = client.post("/api/compress/kv-estimate", json={
        "context_length": 4096,
        "method": "turboquant",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "original_bytes" in data
    assert "original_gb" in data
    assert "compressed_gb" in data
    assert data["compressed_gb"] < data["original_gb"]


def test_kv_estimate_invalid_method():
    resp = client.post("/api/compress/kv-estimate", json={
        "context_length": 4096,
        "method": "not_a_method",
    })
    assert resp.status_code == 400


def test_compress_run_default():
    resp = client.post("/api/compress/run", json={})
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "done"
    assert "original_gb" in data
    assert "compressed_gb" in data
    assert "savings_gb" in data
    assert "quant" in data
    assert "prune" in data
    assert data["compressed_gb"] < data["original_gb"]

# ModelSmith Phase 4-7 — Compression, Dashboard, Projects, Advisor

## Phases Overview

| Phase | Focus | Key Deliverables |
|-------|-------|------------------|
| 4 | Compression | Layer pruning, GGUF quantization, KV cache compress, sparsification |
| 5 | Dashboard & Model Manager | Recharts dashboard, model browser/import, layer heatmap, side-by-side chat |
| 6 | Project System | Save/restore pipelines, checkpoint/resume, dry run, graceful fallback |
| 7 | Pipeline Advisor | AI-recommended pipelines, smart defaults, model comparison, community recipes |

---

## File Structure

```
backend/
├── core/
│   ├── compressor.py        # NEW — layer pruning + GGUF quant
│   ├── kv_compress.py       # NEW — KV cache compression
│   ├── model_registry.py    # NEW — local model scanning
│   ├── project_manager.py   # NEW — save/restore pipeline state
│   └── advisor.py           # NEW — pipeline recommendations
├── api/
│   ├── compress.py          # NEW — compress endpoints
│   ├── models.py            # MODIFY — add registry endpoints
│   └── project.py           # NEW — project endpoints
├── main.py                  # MODIFY — register routers

frontend/src/
├── components/
│   ├── nodes/
│   │   ├── CompressNode.tsx     # NEW
│   │   └── index.ts             # MODIFY
│   ├── Dashboard.tsx            # MODIFY — charts + model browser
│   ├── PipelineCanvas.tsx       # MODIFY — project save/load
│   └── WelcomeScreen.tsx        # MODIFY — advisor
├── lib/api.ts                   # MODIFY
├── stores/
│   ├── pipelineStore.ts         # MODIFY — project save/restore
│   ├── pipelineRunner.ts        # MODIFY
│   └── modelStore.ts            # MODIFY
└── types/api.ts                 # MODIFY
```

---

### Task 4.1: Compression Core

**Files:**
- Create: `backend/core/compressor.py`
- Create: `backend/tests/test_compressor.py`

- [ ] **Step 1: Write failing tests**

```python
# test_compressor.py
import pytest
from backend.core.compressor import (
    estimate_gguf_quant_size, estimate_pruned_size,
    GGUF_QUANTS, can_quantize,
)

def test_estimate_gguf_quant_size():
    result = estimate_gguf_quant_size(7.0, "q4_k_m")
    assert result["original_gb"] == 7.0
    assert result["quantized_gb"] < 7.0
    assert result["ratio"] < 1.0

def test_estimate_pruned_size():
    result = estimate_pruned_size(7.0, 0.5)
    assert abs(result["pruned_gb"] - 3.5) < 0.1

def test_can_quantize():
    assert can_quantize(7.0, 8.0) is True
    assert can_quantize(70.0, 8.0) is False

def test_gguf_quants_defined():
    assert "q4_k_m" in GGUF_QUANTS
    assert "q8_0" in GGUF_QUANTS
```

- [ ] **Step 2: Run tests — expect FAIL**

- [ ] **Step 3: Implement compressor**

```python
# backend/core/compressor.py
import os
import logging
import shutil
from typing import Optional

logger = logging.getLogger("modelsmith.compressor")

GGUF_QUANTS = {
    "q8_0": {"name": "Q8_0", "ratio": 1.0, "description": "8-bit — near lossless"},
    "q6_k": {"name": "Q6_K", "ratio": 0.85, "description": "6-bit — high quality"},
    "q5_k_m": {"name": "Q5_K_M", "ratio": 0.80, "description": "5-bit medium — balanced"},
    "q5_0": {"name": "Q5_0", "ratio": 0.78, "description": "5-bit — fast"},
    "q4_k_m": {"name": "Q4_K_M", "ratio": 0.70, "description": "4-bit medium — recommended"},
    "q4_0": {"name": "Q4_0", "ratio": 0.68, "description": "4-bit — fast"},
    "q3_k_m": {"name": "Q3_K_M", "ratio": 0.60, "description": "3-bit medium — aggressive"},
    "q2_k": {"name": "Q2_K", "ratio": 0.50, "description": "2-bit — maximum compression"},
}

PRUNE_RATIOS = {
    "light": 0.25,
    "medium": 0.50,
    "heavy": 0.75,
}


def get_available_quants() -> list[dict]:
    return [{"id": k, **v} for k, v in GGUF_QUANTS.items()]


def estimate_gguf_quant_size(original_gb: float, quant_id: str) -> dict:
    quant = GGUF_QUANTS.get(quant_id)
    if not quant:
        raise ValueError(f"Unknown quant: {quant_id}")
    quantized = round(original_gb * quant["ratio"], 2)
    return {
        "original_gb": original_gb,
        "quantized_gb": quantized,
        "ratio": quant["ratio"],
        "savings_gb": round(original_gb - quantized, 2),
        "description": quant["description"],
    }


def estimate_pruned_size(original_gb: float, prune_ratio: float) -> dict:
    pruned = round(original_gb * (1 - prune_ratio), 2)
    return {
        "original_gb": original_gb,
        "prune_ratio": prune_ratio,
        "pruned_gb": pruned,
        "savings_gb": round(original_gb - pruned, 2),
    }


def can_quantize(model_size_gb: float, available_ram_gb: float) -> bool:
    return available_ram_gb >= model_size_gb * 0.5


def run_quantization(
    input_path: str,
    output_path: str,
    quant_id: str = "q4_k_m",
) -> dict:
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input not found: {input_path}")

    convert = shutil.which("llama-quantize") or shutil.which("llama.cpp/quantize")
    if not convert:
        return {
            "status": "unavailable",
            "error": "llama-quantize not found. Install llama.cpp and build it.",
            "success": False,
        }

    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    import subprocess
    cmd = [convert, input_path, output_path, quant_id]
    logger.info(f"Running: {' '.join(cmd)}")
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=7200)
        if result.returncode != 0:
            return {
                "status": "error",
                "error": f"Quantization failed: {result.stderr[:500]}",
                "success": False,
            }
        return {
            "status": "completed",
            "quant": quant_id,
            "output_path": output_path,
            "output_size_gb": round(os.path.getsize(output_path) / (1024**3), 2) if os.path.exists(output_path) else 0,
            "success": True,
        }
    except subprocess.TimeoutExpired:
        return {"status": "error", "error": "Quantization timed out after 2 hours", "success": False}


def prune_layers(
    model,
    layers_to_keep: list[int],
) -> dict:
    logger.info(f"Pruning model to keep layers: {layers_to_keep}")
    try:
        new_layers = model.model.layers.__class__()
        for i in layers_to_keep:
            new_layers.append(model.model.layers[i])
        model.model.layers = new_layers
        model.config.num_hidden_layers = len(layers_to_keep)
        return {
            "status": "pruned",
            "original_layers": model.config.num_hidden_layers,
            "remaining_layers": len(layers_to_keep),
            "removed_layers": model.config.num_hidden_layers - len(layers_to_keep),
        }
    except Exception as e:
        raise RuntimeError(f"Pruning failed: {e}")
```

- [ ] **Step 4: Run tests — expect PASS**

- [ ] **Step 5: KV Cache Compression**

```python
# backend/core/kv_compress.py
import logging
from typing import Optional

logger = logging.getLogger("modelsmith.kv_compress")

KV_METHODS = {
    "none": {"name": "None", "ratio": 1.0, "description": "No compression"},
    "turboquant": {"name": "TurboQuant", "ratio": 0.5, "description": "Adaptive 4-bit KV cache"},
    "kvquant": {"name": "KVQuant", "ratio": 0.375, "description": "Non-uniform 3-bit quantization"},
    "pca": {"name": "PCA", "ratio": 0.3, "description": "PCA-based projection"},
}


def get_kv_methods() -> list[dict]:
    return [{"id": k, **v} for k, v in KV_METHODS.items()}


def estimate_kv_savings(context_length: int, num_layers: int, hidden_dim: int, method: str) -> dict:
    method_info = KV_METHODS.get(method)
    if not method_info:
        raise ValueError(f"Unknown method: {method}")
    original = context_length * num_layers * hidden_dim * 2 * 2  # fp16 for K and V
    compressed = original * method_info["ratio"]
    return {
        "original_bytes": original,
        "original_gb": round(original / (1024**3), 3),
        "compressed_gb": round(compressed / (1024**3), 3),
        "ratio": method_info["ratio"],
        "savings_gb": round((original - compressed) / (1024**3), 3),
    }
```

- [ ] **Step 6: Create compress API**

```python
# backend/api/compress.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from backend.core.compressor import (
    get_available_quants, estimate_gguf_quant_size,
    estimate_pruned_size, can_quantize,
    GGUF_QUANTS, PRUNE_RATIOS,
)
from backend.core.kv_compress import get_kv_methods, estimate_kv_savings
from backend.core.model_manager import get_manager

router = APIRouter(prefix="/api/compress", tags=["compress"])

class QuantEstimateRequest(BaseModel):
    original_gb: float
    quant_id: str = "q4_k_m"

class PruneEstimateRequest(BaseModel):
    original_gb: float
    ratio: str = "medium"

class KVAnalyzeRequest(BaseModel):
    context_length: int = 4096
    method: str = "turboquant"

@router.get("/quants")
async def list_quants():
    return {"quants": get_available_quants()}

@router.get("/kv-methods")
async def list_kv_methods():
    return {"methods": get_kv_methods()}

@router.post("/quant-estimate")
async def quant_estimate(req: QuantEstimateRequest):
    try:
        return estimate_gguf_quant_size(req.original_gb, req.quant_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/prune-estimate")
async def prune_estimate(req: PruneEstimateRequest):
    ratio = PRUNE_RATIOS.get(req.ratio, 0.5)
    return estimate_pruned_size(req.original_gb, ratio)

@router.post("/kv-estimate")
async def kv_estimate(req: KVAnalyzeRequest):
    try:
        mgr = get_manager()
        if not mgr.is_loaded:
            return {"error": "No model loaded", "defaults": estimate_kv_savings(req.context_length, 32, 4096, req.method)}
        return estimate_kv_savings(
            req.context_length,
            mgr.model.config.num_hidden_layers or 32,
            mgr.model.config.hidden_size or 4096,
            req.method,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
```

---

### Task 5.1: Model Registry

**Files:**
- Create: `backend/core/model_registry.py`
- Create: `backend/tests/test_model_registry.py`
- Modify: `backend/api/models.py`

- [ ] **Step 1: Write failing tests**

```python
# test_model_registry.py
import pytest
from backend.core.model_registry import (
    scan_directory, scan_common_dirs, get_model_summary,
)

def test_scan_directory_nonexistent():
    with pytest.raises(FileNotFoundError):
        scan_directory("/nonexistent/path")

def test_get_model_summary_no_model():
    from backend.core.model_manager import get_manager
    get_manager().unload()
    result = get_model_summary()
    assert result["loaded"] is False
```

- [ ] **Step 2: Implement model_registry.py**

```python
# backend/core/model_registry.py
import os
import logging
from typing import Optional
from backend.core.model_loader import detect_format, ModelFormat

logger = logging.getLogger("modelsmith.model_registry")

COMMON_DIRS = [
    os.path.expanduser("~/models"),
    os.path.expanduser("~/Downloads"),
    "/models",
    "/tmp/models",
]

MODEL_EXTS = {".gguf", ".safetensors", ".bin", ".pt", ".pth"}


def scan_directory(directory: str) -> list[dict]:
    if not os.path.isdir(directory):
        raise FileNotFoundError(f"Directory not found: {directory}")

    results = []
    for entry in os.listdir(directory):
        full_path = os.path.join(directory, entry)
        if os.path.isfile(full_path):
            ext = os.path.splitext(entry)[1].lower()
            if ext in MODEL_EXTS:
                size_gb = round(os.path.getsize(full_path) / (1024**3), 2)
                fmt = detect_format(full_path)
                results.append({
                    "name": entry,
                    "path": full_path,
                    "format": fmt.value,
                    "size_gb": size_gb,
                })
        elif os.path.isdir(full_path):
            has_model = False
            total_size = 0.0
            for root, _dirs, files in os.walk(full_path):
                for fname in files:
                    ext = os.path.splitext(fname)[1].lower()
                    if ext in MODEL_EXTS:
                        has_model = True
                        total_size += os.path.getsize(os.path.join(root, fname))
            if has_model:
                results.append({
                    "name": entry,
                    "path": full_path,
                    "format": "directory",
                    "size_gb": round(total_size / (1024**3), 2),
                })

    results.sort(key=lambda x: x["name"].lower())
    return results


def scan_common_dirs() -> list[dict]:
    all_models = []
    for directory in COMMON_DIRS:
        if os.path.isdir(directory):
            try:
                models = scan_directory(directory)
                all_models.extend(models)
            except Exception as e:
                logger.warning(f"Error scanning {directory}: {e}")
    return all_models


def get_model_summary() -> dict:
    from backend.core.model_manager import get_manager
    from backend.core.system import detect_hardware, get_tier

    mgr = get_manager()
    specs = detect_hardware()
    tier = get_tier(specs["ram_total_gb"], specs.get("gpu_vram_gb"))

    result = {
        "loaded": mgr.is_loaded,
        "tier": tier,
        "hardware": {
            "ram_gb": specs["ram_total_gb"],
            "vram_gb": specs.get("gpu_vram_gb"),
            "gpu": specs.get("gpu_name"),
        },
    }

    if mgr.is_loaded:
        result["model"] = {
            "path": mgr.model_path,
            "tier": mgr.model_tier,
            "size_b": mgr.model_size_b,
            "memory": mgr.get_memory_usage(),
        }

    return result
```

---

### Task 6.1: Project Manager

**Files:**
- Create: `backend/core/project_manager.py`
- Create: `backend/tests/test_project_manager.py`
- Create: `backend/api/project.py`

- [ ] **Step 1: Implement project_manager.py**

```python
# backend/core/project_manager.py
import json
import os
import logging
from datetime import datetime
from typing import Optional

logger = logging.getLogger("modelsmith.project_manager")

PROJECTS_DIR = os.path.expanduser("~/.modelsmith/projects")


def _ensure_dirs():
    os.makedirs(PROJECTS_DIR, exist_ok=True)


def list_projects() -> list[dict]:
    _ensure_dirs()
    projects = []
    for fname in os.listdir(PROJECTS_DIR):
        if fname.endswith(".json"):
            try:
                with open(os.path.join(PROJECTS_DIR, fname)) as f:
                    data = json.load(f)
                projects.append({
                    "id": fname.replace(".json", ""),
                    "name": data.get("name", fname),
                    "created": data.get("created", ""),
                    "updated": data.get("updated", ""),
                    "node_count": len(data.get("nodes", [])),
                })
            except Exception as e:
                logger.warning(f"Error reading project {fname}: {e}")
    projects.sort(key=lambda x: x.get("updated", ""), reverse=True)
    return projects


def save_project(project_id: str, name: str, data: dict) -> dict:
    _ensure_dirs()
    now = datetime.now().isoformat()
    try:
        existing = load_project(project_id)
        created = existing.get("created", now)
    except FileNotFoundError:
        created = now

    project = {
        "id": project_id,
        "name": name,
        "created": created,
        "updated": now,
        "nodes": data.get("nodes", []),
        "edges": data.get("edges", []),
        "version": 2,
    }

    path = os.path.join(PROJECTS_DIR, f"{project_id}.json")
    with open(path, "w") as f:
        json.dump(project, f, indent=2)

    return {"status": "saved", "id": project_id, "path": path}


def load_project(project_id: str) -> dict:
    path = os.path.join(PROJECTS_DIR, f"{project_id}.json")
    if not os.path.exists(path):
        raise FileNotFoundError(f"Project not found: {project_id}")
    with open(path) as f:
        return json.load(f)


def delete_project(project_id: str) -> dict:
    path = os.path.join(PROJECTS_DIR, f"{project_id}.json")
    if os.path.exists(path):
        os.remove(path)
        return {"status": "deleted", "id": project_id}
    raise FileNotFoundError(f"Project not found: {project_id}")


def save_checkpoint(stage: str, data: dict) -> str:
    _ensure_dirs()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    name = f"checkpoint_{stage}_{timestamp}"
    path = os.path.join(PROJECTS_DIR, f"{name}.json")
    with open(path, "w") as f:
        json.dump({"stage": stage, "timestamp": timestamp, "data": data}, f, indent=2)
    return name
```

- [ ] **Step 2: Create project API**

```python
# backend/api/project.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any
from backend.core.project_manager import (
    list_projects, save_project, load_project, delete_project,
)

router = APIRouter(prefix="/api/projects", tags=["projects"])

class ProjectSaveRequest(BaseModel):
    id: str
    name: str
    nodes: list[Any] = []
    edges: list[Any] = []

@router.get("/")
async def project_list():
    return {"projects": list_projects()}

@router.post("/save")
async def project_save(req: ProjectSaveRequest):
    return save_project(req.id, req.name, {"nodes": req.nodes, "edges": req.edges})

@router.get("/load/{project_id}")
async def project_load(project_id: str):
    try:
        return load_project(project_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Project not found")

@router.delete("/delete/{project_id}")
async def project_delete(project_id: str):
    try:
        return delete_project(project_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Project not found")
```

---

### Task 7.1: Pipeline Advisor

**Files:**
- Create: `backend/core/advisor.py`
- Create: `backend/tests/test_advisor.py`

- [ ] **Step 1: Write failing tests**

```python
# test_advisor.py
import pytest
from backend.core.advisor import (
    recommend_pipeline, get_pipeline_presets,
)

def test_recommend_pipeline_returns_dict():
    result = recommend_pipeline(ram_gb=8, vram_gb=4)
    assert "pipeline" in result
    assert len(result["pipeline"]) >= 2

def test_recommend_pipeline_low_ram():
    result = recommend_pipeline(ram_gb=4, vram_gb=0)
    assert result["feasible"] is True

def test_get_pipeline_presets():
    presets = get_pipeline_presets()
    assert len(presets) >= 2
```

- [ ] **Step 2: Implement advisor.py**

```python
# backend/core/advisor.py
from typing import Optional

def get_tier(ram_gb: float, vram_gb: Optional[float] = None) -> int:
    vram = vram_gb or 0
    ram_gb = round(ram_gb)
    if ram_gb >= 64 and vram >= 48:
        return 5
    if ram_gb >= 32 and vram >= 24:
        return 4
    if ram_gb >= 16 and vram >= 8:
        return 3
    if ram_gb >= 8 and vram >= 4:
        return 2
    return 1

PRESETS = {
    "uncensor": {
        "name": "Uncensor Model",
        "description": "Remove refusal/censoring from a model",
        "pipeline": [
            {"type": "modelInput"},
            {"type": "analyze"},
            {"type": "abliterate"},
            {"type": "export"},
        ],
    },
    "compress": {
        "name": "Compress for Low RAM",
        "description": "Quantize a model to run on limited hardware",
        "pipeline": [
            {"type": "modelInput"},
            {"type": "compress"},
            {"type": "export"},
        ],
    },
    "merge_and_uncensor": {
        "name": "Merge + Uncsensor",
        "description": "Merge two models then remove refusal",
        "pipeline": [
            {"type": "modelInput"},
            {"type": "merge"},
            {"type": "abliterate"},
            {"type": "export"},
        ],
    },
    "lora_inject": {
        "name": "Inject LoRA Skills",
        "description": "Apply LoRA adapter to add specific capabilities",
        "pipeline": [
            {"type": "modelInput"},
            {"type": "lora"},
            {"type": "export"},
        ],
    },
    "full_workflow": {
        "name": "Full Workflow",
        "description": "Load, analyze, abliterate, merge, compress, export",
        "pipeline": [
            {"type": "modelInput"},
            {"type": "analyze"},
            {"type": "merge"},
            {"type": "abliterate"},
            {"type": "compress"},
            {"type": "export"},
        ],
    },
}


def get_pipeline_presets() -> list[dict]:
    return [{"id": k, **v} for k, v in PRESETS.items()]


def recommend_pipeline(
    ram_gb: float,
    vram_gb: Optional[float] = None,
    goal: str = "uncensor",
    disk_gb: float = 50,
) -> dict:
    tier = get_tier(ram_gb, vram_gb)
    vram = vram_gb or 0

    if goal not in PRESETS:
        goal = "uncensor"

    preset = PRESETS[goal]
    pipeline = list(preset["pipeline"])

    warnings = []
    if tier <= 1:
        warnings.append("Tier 1 system: only small models (≤3B) will work")
        pipeline = [s for s in pipeline if s["type"] != "merge"]
    if tier <= 2 and "merge" in [s["type"] for s in pipeline]:
        warnings.append("Merging may require significant RAM. Consider lighter methods.")

    if disk_gb < 20:
        warnings.append("Low disk space. Export may fail for large models.")

    return {
        "tier": tier,
        "feasible": True,
        "goal": goal,
        "name": preset["name"],
        "pipeline": pipeline,
        "steps": len(pipeline),
        "warnings": warnings,
        "recommended_profile": "safe" if tier <= 2 else "balanced",
    }


def estimate_pipeline_time(pipeline: list[dict], model_size_b: float = 7) -> dict:
    time_per_step = {
        "modelInput": 30,
        "analyze": 120,
        "abliterate": 300,
        "merge": 600,
        "lora": 60,
        "compress": 900,
        "export": 120,
    }
    total = 0
    steps = []
    for step in pipeline:
        t = time_per_step.get(step["type"], 60)
        total += t
        steps.append({"type": step["type"], "estimated_seconds": t})
    return {
        "total_seconds": total,
        "total_minutes": round(total / 60, 1),
        "steps": steps,
    }
```

---

## Frontend Changes

### Task 5.2 Enhanced Dashboard

- [ ] **Modify Dashboard.tsx** to add recharts radar chart for model capabilities, model browsing list

### Task 6.2 Project Save/Load UI

- [ ] **Modify PipelineCanvas.tsx** to add Save/Load buttons
- [ ] **Update pipelineStore.ts** with project save/load methods

### Task 7.2 Advisor Integration

- [ ] **Modify WelcomeScreen.tsx** to show recommended pipelines
- [ ] **Update stores** for advisor data

### Task 4.2 Compress Frontend

- [ ] **Create CompressNode.tsx** with quant/prune/KV controls
- [ ] **Update nodes/index.ts** to export CompressNode
- [ ] **Update PipelineCanvas.tsx** to register compress node
- [ ] **Update pipelineStore.ts** to add compress type
- [ ] **Update pipelineRunner.ts** to wire compress operations
- [ ] **Update types/api.ts**
- [ ] **Update lib/api.ts**

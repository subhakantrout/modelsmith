# Backend Guide

## Core Modules

### model_registry.py
Entry point for model scanning, Hub search, and all download operations.

**DownloadManager** (singleton, line 99):
- `start(model_id, output_dir, token)` → creates task, queues it, calls `_schedule_next()`
- `pause(download_id)` → sets `_pause` Event, status → "pausing"
- `resume(download_id)` → clears `_pause` Event
- `cancel(download_id)` → sets `_cancel` Event, clears `_pause`, status → "cancelling"
- `retry(download_id)` → creates new task with same model_id/token
- `clear_completed()` → removes terminal-state tasks
- `_clear_terminal()` → auto-removes completed/error/cancelled (called by list_all())
- `_schedule_next()` → starts queued tasks up to MAX_CONCURRENT
- `_on_task_done(download_id)` → calls _schedule_next()

**Download worker** (`_download_worker`, line 226):
1. Calls `HfApi.model_info(files_metadata=True)` to get file list + sizes
2. Creates output directory
3. Iterates through files, calling `hf_hub_download` for each
4. Checks `_cancel` event: before each file, during pause, after each file download
5. Accumulates `downloaded_bytes`, computes `progress` (byte-based or file-count fallback)
6. Computes `speed_bytes_per_sec` from elapsed time
7. Sets status to `completed` (or `cancelled` / `error`)

### system.py
Hardware detection (RAM, CPU, GPU via psutil + nvidia-ml-py), tier classification (1-5), budget calculation.

### pipeline.py
Executes pipeline steps sequentially: ModelInput → Analyze → Abliterate → Merge → LoRA → Compress → Export. Each step type has a `_handle_*` function registered in a dispatch dict.

### model_manager.py
Loads models via transformers with tier-appropriate quantization (8-bit, 4-bit, none). Tracks memory usage.

### model_loader.py
Detects model file format (safetensors, GGUF, bin, pt/pth). Provides `get_model_info()` for metadata extraction.

### advisor.py
Recommends pipeline configurations based on hardware tier and user goals. Presets for common workflows.

### project_manager.py
CRUD for saved pipeline projects. Export/import recipes (JSON).

## API Routes (FastAPI)

Backend uses `backend/api/*.py` modules with `APIRouter`. Each module is registered in `backend/main.py`.

Key patterns:
- Pydantic v2 models for request/response validation
- `HTTPException` for error responses (400/404/500)
- CPU-only fallback when GPU is unavailable (CUDA version mismatch)

## Testing
- Framework: pytest
- Location: `backend/tests/`
- Run: `python3 -m pytest backend/tests/ -v`
- Count: 143 tests
- GPU tests: CUDA-aware (expected values differ when GPU unavailable)

## Environment
- Python 3.13
- Virtual env: `.venv/`
- Dependencies: See `backend/requirements.txt` (generated via pip freeze)
- Port: 8765
- Run: `uvicorn backend.main:app --port 8765 --reload`

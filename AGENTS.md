# ModelSmith — Agent Context

## Stack
- **Backend**: Python 3.13, FastAPI, Uvicorn, Pydantic v2
- **Frontend**: React 19, TypeScript 6.0, Vite 8, @xyflow/react (ReactFlow), Tailwind CSS 4, Zustand 5, Lucide icons
- **ML**: transformers, PyTorch 2.5, bitsandbytes, accelerate, mergekit, PEFT, safetensors, huggingface_hub
- **System**: psutil, nvidia-ml-py, httpx

## Running
- Backend: `uvicorn backend.main:app --port 8765` (port 8765)
- Frontend: `cd frontend && npm run dev` (port 5173, proxy `/api` → `:8765`)
- Project root: `modelsmith/`

## Directory Structure
```
backend/
  api/          — FastAPI route modules (models, analyze, abliterate, merge, lora, compress, export, chat, system, advisor, projects)
  core/         — Business logic (model_registry, model_loader, model_manager, model_merger, compressor, system, analyzer, executor)
  tests/        — pytest test suite
frontend/
  src/
    components/ — React components (Shell, Sidebar, TopBar, BottomBar, RightPanel, 5 views, PipelineCanvas, nodes/*, etc.)
    stores/     — Zustand stores (pipelineStore, modelStore, systemStore, chatStore, downloadStore, viewStore, settingsStore)
    lib/api.ts  — API client with typed methods for all endpoints
    types/      — TypeScript interfaces
models/         — Downloaded models (gitignored)
```

## UI Architecture
- **Shell layout**: VS Code-style with 52px sidebar, top bar, bottom status bar, 290px right panel
- **5 views**: Home (system overview + quick actions), Canvas (ReactFlow pipeline), Models (local model browser), Chat (full-page), Settings (HF token, theme, about)
- **No react-router**: state-based view switching via `useViewStore`
- **RightPanel**: context-sensitive — shows node config on Canvas when a node is selected

## Key Architecture
- Pipeline nodes (7 types): ModelInput, Analyze, Abliterate, Merge, LoRA, Compress, Export
- Each node has typed config synced to the store; `pipelineRunner.ts` reads configs and calls backend APIs sequentially
- `NodeWrapper.tsx` wraps all nodes — Handles are try/caught for `useReactFlow()` context to prevent crash when rendered outside ReactFlow tree (e.g. right panel)
- Model downloads use a `DownloadManager` class (singleton): threaded, concurrent (max 3), queue, pause/resume/cancel via `threading.Event`, byte-level progress via `HfApi.model_info().siblings`

## Download Manager
- **Backend**: `DownloadManager` in `backend/core/model_registry.py` — thread-safe queue, MAX_CONCURRENT=3, pause/resume/cancel, byte-level progress, speed, ETA, retry
- **Endpoints**: hub-download (POST), hub-download-status (GET), hub-downloads (GET), hub-download-pause/resume/cancel/retry/clear (POST)
- **Frontend**: `DownloadManager.tsx` — persistent bottom panel, Active tab (progress bars, %, speed, ETA, current file, pause/cancel), History tab (completed/failed, retry, dismiss, clear all), global polling every 1.2s
- **HubSearch.tsx**: modal for searching HF Hub, styled result cards, one-click download that opens DownloadManager panel

## Important Conventions
- Tailwind v4 (CSS-based config via `@theme`, no tailwind.config.js)
- Stores in `stores/` directory, exported from `stores/index.ts`
- All API methods in `lib/api.ts`, typed with `request<T>()`
- Types in `types/api.ts`
- Node config syncing: each node's `onSubmit`/`onConfigChange` writes to pipelineStore, pipelineRunner reads them
- Custom `gray-925` color defined in `index.css` via `@theme`
- Brand gradient: `#6366f1` (indigo) → `#a855f7` (purple)

## Download Path
- Backend defaults to `<project-root>/models/<model-name>/` (computed from `__file__`)
- Frontend passes empty `output_dir`, letting backend decide
- `models/` directory is gitignored

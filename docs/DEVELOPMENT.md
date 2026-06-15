# Development Guide

## Setup

### Prerequisites
- Python 3.12+, Node.js 20+, npm 9+
- (Optional) NVIDIA GPU with CUDA 12+

### Backend

```bash
cd modelsmith
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
```

### Frontend

```bash
cd frontend
npm install
```

## Running

Open **two terminals**:

```bash
# Terminal 1: Backend
source .venv/bin/activate
uvicorn backend.main:app --port 8765 --reload

# Terminal 2: Frontend
cd frontend && npm run dev
```

Open http://localhost:5173

### Notes
- Backend binds to `127.0.0.1` (localhost only) by default
- Random API key generated on startup, logged to console
- Frontend Vite dev server proxies `/api` → `:8765`

## Testing

### Backend Tests (174 tests)

```bash
# All tests
python -m pytest backend/tests/ -v

# With coverage
python -m pytest backend/tests/ --cov=backend --cov-report=term

# Specific test file
python -m pytest backend/tests/test_api_advisor_ext.py -v
```

### Test Files

| File | Tests | Coverage |
|------|-------|----------|
| `test_api_compress.py` | 12 | Compress endpoints (run, quants, estimates) |
| `test_api_pipeline.py` | 5 | Pipeline run, node types |
| `test_api_gridsearch.py` | 4 | Grid search endpoint |
| `test_api_provenance.py` | 4 | Provenance CRUD |
| `test_api_advisor_ext.py` | 6 | Pipeline generator NLP |

### Frontend Checks

```bash
# TypeScript check
npx tsc --noEmit

# Full build
npx vite build
```

## Code Conventions

### Python
- PEP 8 with type hints required
- Use named loggers: `logging.getLogger("modelsmith.module_name")`
- Raise `HTTPException` in API routes, standard exceptions in core
- Use Pydantic v2 for request/response models
- All paths must go through `resolve_model_path()` for security

### TypeScript
- Strict mode enabled, avoid `any`
- All API types defined in `types/api.ts`
- State management via Zustand stores in `stores/`
- Keep components pure — side effects in stores or hooks

### Frontend
- Tailwind CSS v4 (CSS-based config via `@theme` in `index.css`)
- No `tailwind.config.js` file
- Custom colors: `gray-925`, brand gradient `#6366f1` → `#a855f7`
- Lucide icons for all UI icons
- Node components in `components/nodes/`, wrapped by `NodeWrapper`
- Views in `components/` (HomeView, CanvasView, etc.)

### Git
- Conventional commits: `feat:`, `fix:`, `docs:`, `chore:`, `fix:`
- All changes pushed to `master` branch

## Project Structure

```
modelsmith/
├── backend/
│   ├── api/           # FastAPI route modules
│   │   ├── system.py
│   │   ├── models.py
│   │   ├── analyze.py
│   │   ├── abliterate.py
│   │   ├── merge.py
│   │   ├── lora.py
│   │   ├── compress.py
│   │   ├── export.py
│   │   ├── chat.py
│   │   ├── pipeline.py
│   │   ├── project.py
│   │   ├── advisor.py
│   │   ├── advisor_ext.py      # NLP pipeline generator
│   │   ├── provenance.py       # Provenance tracking
│   │   ├── pipeline_ext.py     # Deployable API + grouping
│   │   ├── marketplace.py      # Community pipeline sharing
│   │   ├── ab_test.py          # A/B scoring
│   │   ├── node_group.py       # Node group validation
│   │   ├── ws.py               # WebSocket endpoints
│   │   └── activation_stream.py
│   ├── core/           # Business logic
│   │   ├── model_manager.py
│   │   ├── model_registry.py
│   │   ├── model_loader.py
│   │   ├── model_merger.py
│   │   ├── analyzer.py
│   │   ├── abliterator.py
│   │   ├── compressor.py
│   │   ├── exporter.py
│   │   ├── executor.py
│   │   ├── lora_manager.py
│   │   ├── system.py
│   │   ├── security.py          # Auth, path validation, arg sanitization
│   │   └── llmfit_adapter.py
│   └── tests/
│       ├── test_api_compress.py
│       ├── test_api_pipeline.py
│       ├── test_api_gridsearch.py
│       ├── test_api_provenance.py
│       └── test_api_advisor_ext.py
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── nodes/           # 7 pipeline node components
│   │   │   │   ├── NodeWrapper.tsx
│   │   │   │   ├── ModelInputNode.tsx
│   │   │   │   ├── AnalyzeNode.tsx
│   │   │   │   ├── AbliterateNode.tsx
│   │   │   │   ├── MergeNode.tsx
│   │   │   │   ├── LoraNode.tsx
│   │   │   │   ├── CompressNode.tsx
│   │   │   │   ├── ExportNode.tsx
│   │   │   │   └── types.ts
│   │   │   ├── Shell.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TopBar.tsx
│   │   │   ├── BottomBar.tsx
│   │   │   ├── RightPanel.tsx
│   │   │   ├── PipelineCanvas.tsx
│   │   │   ├── NodePalette.tsx
│   │   │   ├── DownloadManager.tsx
│   │   │   ├── HubSearch.tsx
│   │   │   ├── ModelBrowser.tsx
│   │   │   ├── PipelineBuilder.tsx
│   │   │   ├── VramBudget.tsx
│   │   │   ├── ABTestPanel.tsx
│   │   │   ├── GridSearchPanel.tsx
│   │   │   ├── ProvenanceGraph.tsx
│   │   │   ├── MarketplaceBrowse.tsx
│   │   │   ├── NodeGroup.tsx
│   │   │   ├── DiffView.tsx
│   │   │   ├── ModelMRI.tsx
│   │   │   ├── Markdown.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   └── ...
│   │   ├── stores/
│   │   │   ├── pipelineStore.ts
│   │   │   ├── modelStore.ts
│   │   │   ├── systemStore.ts
│   │   │   ├── chatStore.ts
│   │   │   ├── downloadStore.ts
│   │   │   ├── viewStore.ts
│   │   │   └── settingsStore.ts
│   │   ├── lib/
│   │   │   ├── api.ts        # Typed API client
│   │   │   └── useTheme.ts
│   │   └── types/
│   │       └── api.ts
│   └── package.json
├── data/
│   ├── projects/       # Saved pipeline projects
│   ├── marketplace/    # Community pipeline JSON files
│   └── provenance.jsonl
├── docs/
│   ├── API.md
│   ├── SECURITY.md
│   ├── ARCHITECTURE.md
│   ├── PIPELINE.md
│   ├── DEVELOPMENT.md
│   └── superpowers/    # Implementation plans
└── models/             # Downloaded models (gitignored)
```

## Adding a New API Endpoint

1. Create the route handler in `backend/api/` (or add to existing router)
2. Add Pydantic models for request/response
3. Register the router in `backend/main.py`
4. Add the typed method to `frontend/src/lib/api.ts`
5. Add TypeScript types to `frontend/src/types/api.ts` if needed
6. Write tests in `backend/tests/`

## Adding a New Pipeline Node

1. Create the node component in `frontend/src/components/nodes/`
2. Wrap it with `NodeWrapper` and pass `nodeId={id}`
3. Register it in `PipelineCanvas.tsx`'s `typeToComponent` map
4. Add the type to `PipelineNodeType` in `pipelineStore.ts`
5. Add a label in `addNode()` in `pipelineStore.ts`
6. Add a color config in `NodeWrapper.tsx`
7. Add the node type handler in `backend/api/pipeline.py`
8. Update tests

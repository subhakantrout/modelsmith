# ModelSmith Architecture

## System Overview

```
┌──────────────────────────────────────────────────────┐
│                   Browser (React 19)                  │
│  ┌──────────────┐  ┌──────────────────────────────┐  │
│  │   Sidebar    │  │         Main Content          │  │
│  │  (collapsible)│  │  ┌────────────────────────┐  │  │
│  │  Home        │  │  │   View (state-driven)   │  │  │
│  │  Canvas      │  │  │  Home | Canvas | Models  │  │  │
│  │  Models      │  │  │  Chat | Settings         │  │  │
│  │  Chat        │  │  └────────────────────────┘  │  │
│  │  Settings    │  │  ┌────────────────────────┐  │  │
│  └──────────────┘  │  │    Right Panel         │  │  │
│                    │  │  (context-sensitive)    │  │  │
│                    │  └────────────────────────┘  │  │
│                    └──────────────────────────────┘  │
│  ┌──────────────────────────────────────────────┐    │
│  │  Bottom Bar (downloads, status, VRAM budget) │    │
│  └──────────────────────────────────────────────┘    │
└──────────────────────┬───────────────────────────────┘
                       │ HTTP (localhost:5173 → proxy → :8765)
                       │ X-Api-Key auth header
                       │ WebSocket (streaming)
┌──────────────────────┴───────────────────────────────┐
│              FastAPI Backend (Python)                  │
│                                                        │
│  ┌─────────────┐  ┌─────────────┐  ┌───────────────┐  │
│  │ API Routers  │  │ Core Engine  │  │  Data Layer   │  │
│  │ (20+ files)  │──│ (executor,    │──│ (JSON files,  │  │
│  │              │  │  analyzer,   │  │  temp dirs)   │  │
│  │ models       │  │  compressor, │  │               │  │
│  │ analyze      │  │  abliterator,│  │ projects/*.json│ │
│  │ abliterate   │  │  merger,     │  │ marketplace/*.json││
│  │ merge        │  │  exporter)   │  │ provenance.jsonl │ │
│  │ compress     │  └─────────────┘  └───────────────┘  │
│  │ pipeline     │                                        │
│  │ advisor      │  ┌─────────────┐                      │
│  │ provenance   │  │ Security    │                      │
│  │ marketplace  │  │ Middleware   │                      │
│  └─────────────┘  │ X-Api-Key    │                      │
│                   │ Path validation│                     │
│                   │ CORS          │                      │
│                   └─────────────┘                      │
└────────────────────────────────────────────────────────┘
```

## Frontend Architecture

### State Management (Zustand)

| Store | Purpose | Persistence |
|-------|---------|-------------|
| `viewStore` | Current view, sidebar/panel state | None |
| `pipelineStore` | Nodes, edges, undo/redo history, pipeline state | Project save/load |
| `modelStore` | Current model path, loading, inspection results | None |
| `systemStore` | Hardware specs, resource usage, tier | None |
| `chatStore` | Chat messages, streaming state | None |
| `downloadStore` | Download queue, progress, history | None |
| `settingsStore` | HF token (encrypted), theme | localStorage |

### View System

No router library — state-based view switching via `useViewStore`:

```typescript
type AppView = "home" | "canvas" | "models" | "chat" | "settings";
```

Each view is a React component registered in a lookup map inside `Shell.tsx`.

### Component Tree

```
Shell
├── Sidebar (collapsible, 52px / 24px)
├── Content
│   ├── TopBar (logo, view title, HF token popover, theme toggle)
│   ├── View (one of 5)
│   │   ├── HomeView (hardware cards, quick actions, recent pipelines)
│   │   ├── CanvasView → PipelineCanvas
│   │   │   ├── NodePalette (drag nodes)
│   │   │   ├── ReactFlow (nodes + edges)
│   │   │   │   ├── ModelInputNode
│   │   │   │   ├── AnalyzeNode
│   │   │   │   ├── AbliterateNode
│   │   │   │   ├── MergeNode
│   │   │   │   ├── LoraNode
│   │   │   │   ├── CompressNode
│   │   │   │   └── ExportNode
│   │   │   └── Toolbar (run, save, undo/redo, etc.)
│   │   ├── ModelsView (model browser + Hub search)
│   │   ├── ChatView (full-page chat)
│   │   └── SettingsView (HF token, theme, about)
│   └── RightPanel (node config when selected)
└── BottomBar (download manager, status bar)
```

### Canvas (ReactFlow)

The pipeline canvas uses `@xyflow/react` v12 with custom node types. Each node is wrapped in `NodeWrapper.tsx` which provides:
- Type-specific colors/icons (indigo=model, rose=abliterate, etc.)
- Status indicator (idle/running/done/error)
- Inline delete (X) button
- Animated running state (pulse, progress bar)
- Connection handles (try/caught to prevent crash outside ReactFlow context)
- Glow effects per type

### API Client

All backend communication goes through `lib/api.ts`:
- Typed `request<T>()` function with automatic JSON parsing
- Auto-injects `X-Api-Key` header from session
- Methods organized by domain (models, pipeline, advisor, etc.)
- Error handling converts non-2xx to thrown Errors

## Backend Architecture

### API Layer

20+ router modules in `backend/api/`, each registered in `main.py`:
```
main.py imports and registers:
  system, models, analyze, abliterate, merge, lora,
  compress, export, chat, pipeline, project, advisor,
  ws, activation_stream, advisor_ext, provenance,
  pipeline_ext, marketplace, ab_test, node_group
```

### Core Layer

Business logic in `backend/core/`:
- `model_manager.py` — Model lifecycle (load/unload/infer)
- `model_registry.py` — Local model scanning + Hub download manager
- `analyzer.py` — Refusal detection and scoring
- `abliterator.py` — Direction finding, ablation application, grid search
- `model_merger.py` — Model merging logic (TIES, SLERP, DARE, Linear)
- `compressor.py` — GGUF quantization, pruning, sparsification, KV compression
- `exporter.py` — Model export to safetensors/GGUF
- `executor.py` — Pipeline execution orchestration
- `system.py` — Hardware detection and resource monitoring
- `security.py` — Path validation, API key, arg sanitization

### Security Middleware

- `X-Api-Key` validation on all non-public requests
- Random key generated at startup, fetchable via `GET /api/session-key`
- Also configurable via `MODELSMITH_API_KEY` env var
- Path traversal protection via `resolve_model_path()`
- Subprocess arg validation via `validate_subprocess_arg()`

### Data Storage

| Data | Location | Format |
|------|----------|--------|
| Projects | `data/projects/` | JSON |
| Provenance | `data/provenance.jsonl` | JSONL |
| Marketplace | `data/marketplace/` | JSON |
| Exported recipes | `data/recipes/` | JSON |
| Downloaded models | `models/` | Various |

## Pipeline Execution Model

1. User connects nodes on canvas forming a DAG
2. `pipelineStore` tracks nodes/edges/configs in Zustand
3. `pipelineRunner.ts` reads the store, builds a step list
4. Sends `POST /api/pipeline/run` with all steps
5. Backend `executor.py` topologically sorts and executes sequentially
6. Each node transitions through: `idle → running → done | error`
7. Status updates flow back to frontend via polling or WebSocket

## Testing

- **Backend**: pytest with `TestClient`, 174 tests across 11 test files
- **Frontend**: TypeScript strict mode, zero errors
- **API tests**: 31 endpoint tests across 5 dedicated test files

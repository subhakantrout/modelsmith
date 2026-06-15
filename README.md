<div align="center">

<img src="frontend/public/logo-horizontal.svg" alt="ModelSmith" width="400">

**Forge Your Perfect Model**

[![Python](https://img.shields.io/badge/python-3.13-blue?logo=python&logoColor=white)](https://python.org)
[![TypeScript](https://img.shields.io/badge/typescript-6.0-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![FastAPI](https://img.shields.io/badge/fastapi-0.115-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/react-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Tests](https://img.shields.io/badge/tests-143_passing-success?logo=pytest)](https://github.com/subhakantrout/modelsmith)
[![License](https://img.shields.io/badge/license-MIT-green)](https://github.com/subhakantrout/modelsmith/blob/master/LICENSE)
[![PRs](https://img.shields.io/badge/PRs-welcome-brightgreen)](https://github.com/subhakantrout/modelsmith/pulls)

**A visual node-based pipeline studio for local AI models — uncensor, merge, enhance, and compress without writing code.**

[Why ModelSmith](#-why-modelsmith) • [Features](#-features) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [Contributing](#-contributing)

</div>

---

## 🌟 Why ModelSmith?

Local AI is powerful, but it's trapped behind three walls:

| Wall | Problem | ModelSmith Solution |
|------|---------|-------------------|
| ❄️ **Censorship** | Models refuse legitimate requests even after you download them | **One-click abliteration** — surgically removes refusal directions from any LLM |
| **🧩 Capability Gaps** | No single model excels at everything | **Visual merging & LoRA** — combine strengths of multiple models with drag-and-drop |
| **⚡ Hardware Mismatch** | Powerful models won't run on consumer hardware | **Smart compression** — auto-selects quantization level for your specific RAM/VRAM |

**ModelSmith replaces hours of command-line fiddling with a visual pipeline canvas.** No Python scripts, no terminal incantations — just connect nodes and run.

---

## 🔥 Features

### Core Pipeline

| Node | What It Does | Powered By |
|------|-------------|------------|
| **📥 Load Model** | Load any HuggingFace model with tier-appropriate quantization (NF4, FP16, BF16) | transformers + bitsandbytes |
| **🔬 Analyze** | Detect refusal patterns, score outputs, map layer-by-layer refusal direction | Custom refusal classifier |
| **✂️ Abliterate** | Remove censorship via directional ablation — find and subtract refusal vectors | Heretic/Abliterix technique |
| **🧩 Merge** | Combine models using advanced algorithms | mergekit (TIES, SLERP, DARE, Linear) |
| **🎛️ LoRA** | Inject or extract LoRA adapters to add/remove specific skills | PEFT |
| **📦 Compress** | Shrink models via GGUF quantization, layer pruning, KV cache compression, sparsification | llama.cpp + custom |
| **💬 Test Chat** | Side-by-side comparison of original vs edited model | Real inference |

### Intelligence Layer

- **🧠 Pipeline Advisor** — AI analyzes your hardware and recommends the optimal pipeline. Just describe your goal and ModelSmith builds the workflow.
- **📊 Home View** — System overview with hardware specs, local model browser, quick-action cards for every tool, and pipeline status.
- **⬇️ Download Manager** — Queue, pause, resume, cancel downloads from HuggingFace Hub directly inside the app — with real-time progress bars, speed, ETA, and retry for failed downloads.
- **🔍 HuggingFace Hub Integration** — Search the Hub from inside ModelSmith, browse results with download counts and tags, download any model with one click.
- **💾 Project System** — Save/restore pipelines as JSON projects, export/import recipes, resume from checkpoints.
- **🎨 VS Code-style Layout** — Persistent sidebar navigation, context-sensitive right panel for node configuration, full-page Chat and Settings views.
- **🌓 Dark/Light Theme** — Toggle between dark and light mode via the header bar or Settings view.

### Hardware Awareness

ModelSmith **auto-detects** your system on launch and classifies into one of 5 tiers:

| Tier | RAM | VRAM | Can Handle |
|------|-----|------|------------|
| 🟢 Tier 1 | 4 GB | None | 3B models (CPU only) |
| 🔵 Tier 2 | 8 GB | ≤6 GB | 13B models (4-bit) |
| 🟡 Tier 3 | 16 GB | 8–12 GB | 34B models (4-bit) |
| 🟠 Tier 4 | 32 GB | 24 GB | 70B+ models (8-bit) |
| 🔴 Tier 5 | 64+ GB | 48+ GB | Any model (FP16) |

Every operation runs a **pre-flight check** against your available RAM. If it won't fit, ModelSmith suggests fallbacks (lower quantization, CPU offload, or streaming).

---

## 🚀 Quick Start

### Prerequisites

- Python 3.12+, Node.js 20+, npm 9+
- (Optional) NVIDIA GPU with CUDA 12+

### Backend Setup

```bash
# Clone and enter
git clone https://github.com/subhakantrout/modelsmith.git
cd modelsmith

# Python virtual environment
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"

# Create model storage
mkdir -p models
```

### Frontend Setup

```bash
cd frontend
npm install
cd ..
```

### Run

Open **two terminals**:

| Terminal | Command |
|----------|---------|
| **Backend** | `uvicorn backend.main:app --port 8765 --reload` |
| **Frontend** | `cd frontend && npm run dev` |

Open **http://localhost:5173** 🎉

---

## 🏗 Architecture

### Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 19, TypeScript 6.0, Vite 8, @xyflow/react (ReactFlow), Tailwind CSS 4, Zustand 5, Lucide icons |
| **Backend** | Python 3.12+, FastAPI, Uvicorn, Pydantic v2 |
| **ML Engine** | transformers, PyTorch 2.12 (CUDA 12.4+), bitsandbytes, accelerate |
| **Model Ops** | mergekit, PEFT, safetensors, huggingface_hub |
| **System** | psutil, nvidia-ml-py, httpx, websockets |
| **Quantization** | llama.cpp (GGUF), bitsandbytes (NF4/FP4) |

### Directory Structure

```
modelsmith/
├── backend/
│   ├── api/          — FastAPI route modules (models, analyze, abliterate, merge, lora, compress, export, chat, system, advisor, projects)
│   ├── core/         — Business logic (model_registry, model_loader, model_manager, model_merger, compressor, system, analyzer, executor)
│   └── tests/        — pytest test suite (143 tests)
├── frontend/
│   ├── src/
│   │   ├── components/ — React components (Shell, Sidebar, PipelineCanvas, nodes/, 5 views, etc.)
│   │   ├── stores/     — Zustand stores (pipeline, model, system, chat, download, view, settings)
│   │   ├── lib/api.ts  — Typed API client for all endpoints
│   │   └── types/      — TypeScript interfaces
│   └── package.json
├── models/            — Downloaded models (gitignored)
├── docs/superpowers/  — Implementation plans and design specs
├── README.md
└── LICENSE
```

### UI Architecture

- **Shell layout**: VS Code-style with 52px sidebar, top bar, bottom status bar, 290px right panel
- **5 views**: Home (system overview + quick actions), Canvas (ReactFlow pipeline), Models (local model browser), Chat (full-page), Settings (HF token, theme, about)
- **No react-router**: state-based view switching via `useViewStore`
- **RightPanel**: context-sensitive — editable node configuration when a node is selected on Canvas

### Pipeline Execution Model

1. **7 node types**: ModelInput, Analyze, Abliterate, Merge, LoRA, Compress, Export
2. Each node has typed config synced to a Zustand store; `pipelineRunner.ts` reads configs and calls backend APIs sequentially
3. Nodes connect via edges forming a **DAG** — the runner topologically sorts and executes in order
4. **Automatic fallback**: if a node fails, the Pipeline Advisor suggests alternatives
5. Per-node status tracking: `idle → running → done | error` with visual feedback

### Download Manager

- **Backend**: `DownloadManager` singleton — thread-safe queue, MAX_CONCURRENT=3, pause/resume/cancel via `threading.Event`, byte-level progress via `HfApi.model_info().siblings`
- **Frontend**: Persistent bottom panel, Active tab (progress bars, %, speed, ETA, current file, pause/cancel), History tab (completed/failed, retry, dismiss, clear all), global polling every 1.2s

### Key Conventions

- **Tailwind v4**: CSS-based config via `@theme` in `index.css` — no `tailwind.config.js`. Custom `gray-925` color, brand gradient `#6366f1` → `#a855f7`
- **Zustand stores**: All stores in `stores/`, exported from `stores/index.ts`
- **API client**: All methods in `lib/api.ts`, typed with `request<T>()`
- **Types**: Shared interfaces in `types/api.ts`
- **NodeWrapper**: wraps all pipeline nodes. `useReactFlow()` is try/caught to prevent crash when rendered outside ReactFlow tree (e.g., right panel)
- **Download path**: defaults to `<project-root>/models/<model-name>/`

---

## 📖 API Overview

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/health` | 🩺 Health check |
| `GET` | `/api/system/specs` | 💻 Hardware detection + tier |
| `GET` | `/api/system/resources` | 📊 Live RAM/CPU/GPU |
| `GET` | `/api/models/registry` | 📋 List all local models |
| `GET` | `/api/models/summary` | 📊 Loaded model + hardware summary |
| `POST` | `/api/models/load` | 📥 Load any HF model |
| `GET` | `/api/models/loaded` | 📋 Current model status |
| `POST` | `/api/models/unload` | 🔌 Unload current model |
| `POST` | `/api/models/inspect` | 🔍 Inspect model metadata |
| `POST` | `/api/models/scan` | 🔎 Scan custom directory for models |
| `GET` | `/api/models/hub-search` | 🌐 Search HuggingFace Hub |
| `POST` | `/api/models/hub-download` | ⬇️ Start Hub download (queued) |
| `GET` | `/api/models/hub-downloads` | 📋 List all downloads |
| `GET` | `/api/models/hub-download-status/{id}` | 📈 Download progress |
| `POST` | `/api/models/hub-download-pause/{id}` | ⏸️ Pause download |
| `POST` | `/api/models/hub-download-resume/{id}` | ▶️ Resume download |
| `POST` | `/api/models/hub-download-cancel/{id}` | ⛔ Cancel download |
| `POST` | `/api/models/hub-download-retry/{id}` | 🔄 Retry failed download |
| `POST` | `/api/models/hub-download-clear` | 🧹 Clear completed/failed |
| `POST` | `/api/analyze/refusal` | 🔬 Refusal score for text |
| `POST` | `/api/abliterate/find-direction` | 🧭 Find refusal vector |
| `POST` | `/api/abliterate/apply` | ✂️ Apply ablation |
| `POST` | `/api/merge/run` | 🧩 Execute model merge |
| `POST` | `/api/lora/apply` | 🎛️ Apply LoRA adapter |
| `POST` | `/api/compress/quant-estimate` | 📦 Estimate compression |
| `POST` | `/api/export/run` | 💾 Export model |
| `GET` | `/api/advisor/recommend` | 🧠 Get pipeline recommendation |

---

## 🤝 Contributing

### Development Setup

```bash
# Install dev dependencies (from project root, with venv active)
pip install ruff pytest pytest-cov

# Run linting
ruff check backend/

# TypeScript check
cd frontend && npx tsc --noEmit

# Run tests
python -m pytest backend/tests/ -v      # All 143 tests
python -m pytest backend/tests/ --cov=backend --cov-report=term  # With coverage
```

### Code Standards

- **Python**: PEP 8, type hints required. Use named loggers (`logging.getLogger("modelsmith.module_name")`)
- **TypeScript**: Strict mode, avoid `any`
- **Frontend**: Zustand for state, Tailwind v4 for styling (CSS-based via `@theme`)
- **Errors**: Raise `HTTPException` in API routes, standard exceptions in core
- **Commits**: Conventional commits (`feat:`, `fix:`, `docs:`, `chore:`)
- **Tests**: Required for all new modules

### Pull Request Checklist

- [ ] Tests pass (`python -m pytest backend/tests/ -v`)
- [ ] Frontend builds (`cd frontend && npx vite build`)
- [ ] TypeScript compiles with zero errors (`cd frontend && npx tsc --noEmit`)
- [ ] No `any` types in new code where avoidable
- [ ] Commit messages follow conventional commits

---

## 🧪 Testing

```bash
source .venv/bin/activate
python -m pytest backend/tests/ -v             # All 143 tests
python -m pytest backend/tests/ --cov=backend --cov-report=term  # With coverage
```

---

## 📊 Project in Numbers

| Metric | Value |
|--------|-------|
| **Backend tests** | 143 passing (100%) |
| **Frontend type coverage** | Strict TypeScript, zero errors |
| **API endpoints** | 40+ RESTful routes |
| **Pipeline nodes** | 7 types (Load, Analyze, Abliterate, Merge, LoRA, Compress, Export) |
| **Frontend components** | 25+ React components |
| **State stores** | 8 Zustand stores |
| **App views** | 5 (Home, Canvas, Models, Chat, Settings) |
| **Bundle size** | 476 KB (gzip: 143 KB) |

---

## ⚠️ Known Limitations

| Limitation | Mitigation |
|------------|-----------|
| Abliteration may degrade quality on some architectures | Always test with the built-in Chat panel before/after |
| Merging models with different tokenizers can produce broken output | Use models from the same architecture family |
| Extreme compression (< Q3) causes quality loss | ModelSmith warns you and suggests the sweet spot |
| Vision models not yet supported | Planned for v1.0 |
| GGUF conversion requires llama.cpp binaries | Install separately or use safetensors export |

---

## 🛣 Roadmap

### v0.2 — Near Term
- [x] Model Hub integration (browse, search, download with queue/progress)
- [x] Download queue with pause/resume/cancel
- [x] WebSocket streaming for inference and progress
- [x] Dark/light theme toggle
- [x] UI redesign with sidebar navigation and dedicated views
- [x] Canvas redesign (node palette, per-type glow, editable right panel, presets)
- [ ] Tauri desktop wrapper (native app)
- [ ] More merge methods (dare_ties, task_arithmetic)

### v1.0 — Stable Release
- [ ] Single `pip install modelsmith` command
- [ ] Native installers (.exe, .dmg, .AppImage)
- [ ] Vision model support (VLM abliteration)
- [ ] Plugin system for third-party nodes
- [ ] Inference server (OpenAI-compatible API)

### v2.0 — Advanced
- [ ] RLHF / DPO training nodes
- [ ] Multi-GPU support
- [ ] Batch processing (multiple models, same pipeline)
- [ ] Community Hub for sharing pipelines

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

Copyright © 2026 **Subhakanta Rout**

---

<div align="center">

**⭐ Star this repo if you find it useful!**

[Report Bug](https://github.com/subhakantrout/modelsmith/issues) • [Request Feature](https://github.com/subhakantrout/modelsmith/issues)

</div>

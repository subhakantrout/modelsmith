# ModelSmith — Design Specification

> **Working Title:** ModelSmith — "Forge your perfect model"
> **Date:** 2026-06-14
> **Status:** Draft

## 1. Purpose

ModelSmith is a visual desktop application that lets anyone take a local AI model and surgically edit its capabilities — removing censorship, adding skills via merging or LoRA, and compressing it to fit their hardware — all through an intuitive node-based pipeline interface, without writing code.

### 1.1 Core Problem

Local AI users face three walls:
1. **Censorship** — Models refuse legitimate requests even after downloading weights
2. **Capability gaps** — No single model excels at everything; users can't easily combine strengths
3. **Hardware mismatch** — Powerful models won't run on consumer hardware without deep technical knowledge

Existing solutions are fragmented across CLI tools (Heretic, mergekit, llama.cpp) with no unified visual interface and no awareness of the user's hardware limits.

### 1.2 Target Users

- Local AI enthusiasts who download GGUF models and want to customize them
- Privacy-conscious users who want cloud-model capability from local models
- Hobbyists on consumer hardware (8-16 GB RAM, modest or no GPU)
- Power users who want full control without writing Python scripts

## 2. Tech Stack

### 2.1 Architecture Strategy (Phased)

ModelSmith follows a pragmatic phased approach: build as a local web app first for rapid iteration, wrap as a desktop app once the core is mature.

- **Phase 1 (v0.1-v0.5):** Python FastAPI backend serving a React frontend. User runs `modelsmith serve` and opens localhost. Zero build overhead, maximum iteration speed.
- **Phase 2 (v1.0+):** Tauri v2 wraps the web app as a native desktop application with auto-start, system tray, and native installers.

### 2.2 Frontend: React + TypeScript (Vite)

| Component | Choice | Rationale |
|-----------|--------|-----------|
| UI framework | React 19 + TypeScript | Rich ecosystem, type safety |
| Build tool | Vite | Fast HMR, modern tooling |
| Pipeline canvas | @xyflow/react (React Flow) | Mature node-graph UI, custom nodes, touch support |
| Styling | Tailwind CSS + shadcn/ui | Consistent design system, dark theme |
| Charts | Recharts | Dashboards, capability radar, resource monitoring |
| State | Zustand | Lightweight, async-friendly, devtools |

### 2.3 Backend: Python FastAPI

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Server | FastAPI + uvicorn | Async, auto-docs, Pydantic validation |
| Model loading | transformers + bitsandbytes | Load any HF model, 4-bit NF4 |
| Abliteration | Heretic / Abliterix engine | Mature, Optuna-tuned, multi-arch |
| Model merging | mergekit (Python API) | TIES/SLERP/DARE, out-of-core, lazy loading |
| LoRA injection | PEFT / huggingface peft | Apply/fuse/extract LoRA adapters |
| Format conversion | FanFu (GGUF ↔ HF) + llama.cpp convert_hf_to_gguf.py | Bidirectional format bridge |
| Quantization | llama.cpp (via subprocess) | GGUF Q2-Q8, broad model support |
| KV cache compression | TurboQuant / custom | 5x+ memory reduction for context |
| System detection | psutil + pynvml + torch.cuda | RAM/VRAM/CPU/GPU at launch |

### 2.4 Distribution (Phase 2)

- **Phase 1:** `pip install modelsmith && modelsmith serve` — open browser to localhost
- **Phase 2:** Single installer per platform (.exe, .dmg, .AppImage) via Tauri + conda-pack
- **Min specs:** 4 GB RAM, 2 GB free disk, any x86_64 CPU

## 3. Architecture

### 3.1 Communication

```
┌──────────────────────────┐      HTTP / WebSocket      ┌───────────────────────┐
│  React Frontend (Vite)   │ ◄─────────────────────────► │  Python FastAPI       │
│  - Pipeline Canvas       │   localhost:5173            │  localhost:8765       │
│  - Dashboard             │   (dev) or bundled          │                       │
│  - Chat Panel            │                             │                       │
│  - Config Panels         │                             │                       │
└──────────────────────────┘                             └───────────────────────┘
```

**Phase 1:** Frontend dev server (Vite) proxies API calls to Python backend. Two terminals.

**Phase 2:** Vite builds static assets → FastAPI serves them from a single port. Single `modelsmith serve` command.

- Frontend communicates via HTTP REST + WebSocket for streaming
- Long-running operations (abliterate, merge, compress) use WebSocket for progress streaming
- Heavy model files stay on the Python side — never serialized over WebSocket

### 3.2 Pipeline Execution Model

```
[Load] → [Analyze] → [Abliterate] → [Merge] → [Compress] → [Export]
                        ↓
                   [Test Chat]
```

- Each node is a Python function with typed inputs/outputs
- Connection between nodes represents data flow (model reference + metadata)
- Pipeline DAG is validated before execution
- Intermediate states are saved as checkpoints to disk
- Dry run simulates and reports peak memory without executing

## 4. Pipeline Nodes (Detailed)

### 4.1 Load Model

**Input:** File path or HuggingFace model ID
**Output:** Model reference + metadata object

**Config:**
- `source`: local file (GGUF, safetensors, .bin) or HF Hub ID
- `dtype`: auto, fp16, bf16, fp32
- `quantization`: none, 4-bit NF4, 8-bit
- `device_map`: auto, cpu, cuda:0
- `trust_remote_code`: boolean

**Behavior:**
- Auto-detect architecture, parameter count, quantization format
- Estimate RAM needed for full load vs streaming
- Warn if insufficient RAM; suggest fallbacks

### 4.2 Analyze

**Input:** Model reference
**Output:** Analysis report (JSON)

**Metrics computed:**
- **Refusal score:** % of harmful prompts refused (sample 50 prompts)
- **Refusal direction map:** Per-layer refusal vector strength (heatmap data)
- **Capability radar:** Scores across coding, math, reasoning, creative, instruction-following (lightweight eval)
- **Model stats:** Parameter count, size on disk, architecture, context length, attention type
- **Layer importance:** Activation variance per layer (identifies prune-able layers)

### 4.3 Abliterate

**Input:** Model reference, analysis report (optional, for defaults)
**Output:** Modified model

**Config:**
- `method`: auto, basic, advanced, aggressive, surgical (mirrors Heretic/OBLITERATUS tiers)
- `strength`: 0.0 - 1.0 (ablation coefficient)
- `target_layers`: auto (refusal-concentrated), all, or manual range
- `norm_preserve`: boolean (grimjim's norm-preserving biprojection)
- `orthogonalize`: boolean (project out harmless direction)
- `n_trials`: 0 (use defaults) or >0 for Optuna TPE optimization
- `quantization_during`: none, 4-bit (reduces VRAM during abliteration)

**Safety:** Pre-flight check estimates peak RAM. On low-RAM systems, processes layers sequentially with disk offloading.

### 4.4 Merge Models

**Input:** Base model + 1-N additional models
**Output:** Merged model

**Config:**
- `method`: ties, slerp, dare_ties, dare_linear, task_arithmetic, linear, passthrough
- Per-model weights and density parameters
- `base_model`: which model serves as the reference architecture
- `dtype`: float16, float32, bfloat16
- `allow_crimes`: boolean (merge models with different architectures)

**Safety:** Uses mergekit's lazy-unpickle to avoid loading all models into RAM at once. Streaming merge writes directly to disk.

### 4.5 Inject / Extract LoRA

**Input:** Model + LoRA adapter (or two models for extraction)
**Output:** Modified model or LoRA adapter file

**Config (Inject):**
- `adapter_path`: path to LoRA safetensors
- `fusion`: fuse into base (permanent) or keep separate
- `alpha`: LoRA scaling factor

**Config (Extract):**
- `model_a`: base model
- `model_b`: fine-tuned model
- `rank`: 8-64 (LoRA rank for extraction)
- `target_modules`: auto-detect or manual

### 4.6 Compress

**Input:** Model reference
**Output:** Compressed model file

**Config:**
- `method`: gguf_quant, layer_pruning, structured_sparsification
- `quant_level`: Q2_K, Q3_K, Q4_K_M, Q5_K_M, Q6_K, Q8_0
- `prune_ratio`: 0.0 - 0.5 (fraction of layers/neurons to prune)
- `calibration_dataset`: none (data-free) or auto (wiki text sample)
- `output_format`: gguf, safetensors
- `kv_cache_bits`: 16 (none), 4, 3, 2 (TurboQuant compression)

**Safety:** Pre-flight shows final size estimate vs available RAM. Warns if output is still too large for user's system.

### 4.7 Test Chat

**Input:** Model reference(s)
**Output:** Chat UI with comparison

- Side-by-side or tabbed chat: original vs edited model
- Preset prompt library: refusal tests, capability tests
- Token streaming display
- Context window indicator
- RAM/VRAM usage during inference

### 4.8 Export

**Input:** Model reference
**Output:** File on disk or HF Hub upload

**Config:**
- `format`: GGUF, SafeTensors, LoRA adapter, diff patch
- `quantize_if_needed`: auto (to fit target size)
- `hf_repo`: optional (to push to HuggingFace Hub)
- `metadata`: author, description, tags
- `split_shards`: boolean (for >50 GB models)

## 5. System Adaptation Engine

### 5.1 Hardware Detection

On launch, the app collects:

| Metric | Source | Used For |
|--------|--------|----------|
| Total RAM | psutil | Tier classification |
| Available RAM | psutil | Operation budgeting |
| VRAM | pynvml (NVIDIA) / torch.cuda | GPU operation feasibility |
| GPU model | pynvml | Compute capability check |
| CPU cores | os.cpu_count | Parallelism limits |
| Disk free | shutil.disk_usage | Temp/swap space check |
| Disk type | heuristic (NVMe > SSD > HDD) | Swap suitability |

### 5.2 Tier Classification

| Tier | RAM | VRAM | Max Model (Q4) | Allowed Ops |
|------|-----|------|----------------|-------------|
| 1 — Minimum | 4 GB | None | 3B | Load, Abliterate (CPU), Export |
| 2 — Budget | 8 GB | ≤6 GB | 13B | + Analyze, Test (≤2K ctx) |
| 3 — Mid-Range | 16 GB | 8-12 GB | 34B | + Merge, Compress, KV Cache |
| 4 — High-End | 32 GB | 24 GB | 70B+ | + LoRA Extract, Full pipelines |
| 5 — Server | 64+ GB | 48+ GB | Any | All ops, multi-GPU, FP16 |

### 5.3 RAM Budget Algorithm

```
available_ram = psutil.virtual_memory().available
safety_buffer = min(available_ram * 0.2, 2 * GB)
working_budget = available_ram - safety_buffer

For each pipeline node:
  peak_estimate = estimate_peak_ram(node, model_size, params)
  assert peak_estimate <= working_budget * tier_scale_factor
  if not: suggest fallback (lower precision, CPU offload, streaming)
```

### 5.4 Graceful Fallback Chain

```
GPU (fastest) → CPU (slower, more RAM) → Disk streaming (slowest, least RAM)
                          ↓
              Prompt user: "Not enough RAM for this operation.
              Suggested: use 4-bit quantization or switch to CPU"
```

## 6. User Interface

### 6.1 Screen Map

```
Welcome ──► Pipeline Canvas ◄── Model Dashboard
                │
          [Node Config Panel]
                │
          Side-by-Side Chat
                │
          Progress View
                │
          Model Manager / Export
```

### 6.2 Pipeline Canvas

- React Flow node-graph with custom node types (one per pipeline operation)
- Port connections enforce valid data flow (model → model, analysis → abliterate, etc.)
- Right-click context menu: add node, delete, configure, bypass
- Bottom toolbar: Run Pipeline, Dry Run, Save Project, Undo/Redo
- Side panel: node configuration (dynamic based on selected node)

### 6.3 Model Dashboard

Opens when a model is loaded or a node is selected:

- **Refusal score** — large gauge (red → green)
- **Capability radar** — 6-axis spider chart (coding, math, reasoning, creative, instruction, knowledge)
- **Layer refusal heatmap** — 80-column bar chart showing refusal direction strength per layer
- **Model info card** — params, size, arch, context length, dtype
- **Quick actions** — "Abliterate this model", "Compress to fit 8 GB", "View in Canvas"

### 6.4 Side-by-Side Chat

- Two-column layout: left = input model, right = pipeline output
- Synchronized scrolling, same prompt to both
- Refusal rate counter per model
- Token timing comparison
- Export conversation as markdown/JSON

### 6.5 System Config Panel

Accessible from welcome screen or settings icon:

- **Tier override** — Auto / Manual (can force a lower tier for safety)
- **RAM budget** — slider (% of available), live counter showing "X GB available"
- **GPU mode** — CPU Only / Auto / Max GPU
- **Disk swap** — Off / Auto / Always (with path selector)
- **Thread count** — auto or manual slider
- **Temp directory** — path with free space indicator
- **Dry run by default** — toggle

## 7. Safety & Error Handling

### 7.1 Pre-Flight Pipeline Check

Before any pipeline execution:
1. Estimate peak RAM for each node
2. Sum with safety buffer (20%)
3. Compare to available system RAM
4. If over budget: show warning with breakdown + suggest alternatives
5. If critically over: block execution with clear explanation

### 7.2 Runtime Safety

- Real-time RAM monitoring during operations
- If usage exceeds 90% of budget: auto-pause and prompt user
- Checkpoint after each completed node (can resume after crash)
- Temporary files cleaned up on crash/exit

### 7.3 Error Handling

| Error | Response |
|-------|----------|
| OOM (RAM) | Catch exception, clean up, suggest lower quant/CPU mode |
| OOM (VRAM) | Catch CUDA OOM, fall back to CPU, notify user |
| Disk full | Check before write, warn with required space |
| Model unsupported | Clear error: "Architecture X not supported. Supported: Y" |
| Operation cancelled | Graceful stop, keep last checkpoint |

## 8. Project & State Management

### 8.1 Project File (.modelsmith)

```yaml
version: 1
name: "Uncensored-Code-Llama-70B"
created: 2026-06-14T12:00:00Z
hardware_profile:
  ram_gb: 16
  vram_gb: 8
  tier: 3
pipeline:
  - node: load
    id: n1
    config:
      source: "/models/llama-3.1-70b-instruct.Q4_K_M.gguf"
  - node: analyze
    id: n2
    depends_on: [n1]
  - node: abliterate
    id: n3
    config:
      method: advanced
      strength: 0.85
    depends_on: [n2]
  - node: compress
    id: n4
    config:
      method: gguf_quant
      level: Q3_K
    depends_on: [n3]
  - node: export
    id: n5
    config:
      format: gguf
      path: "/output/uncensored-llama-70b-q3.gguf"
    depends_on: [n4]
```

### 8.2 State Persistence

- Cache directory: `~/.modelsmith/cache/` (model metadata, analysis results)
- Checkpoints: `~/.modelsmith/checkpoints/<project_id>/`
- Projects: `~/.modelsmith/projects/` (.modelsmith files)
- Logs: `~/.modelsmith/logs/`
- Temp workspace: configurable (default: system temp, min 10 GB free)

## 9. Distribution & Onboarding

### 9.1 Installation

- Download single installer from releases page
- First launch: auto-detect hardware, download minimal Python env (~200 MB)
- Optional: download additional backends (llama.cpp binaries for quantization)
- Tutorial overlay on first pipeline creation

### 9.2 System Requirements

| | Minimum | Recommended |
|--|---------|-------------|
| RAM | 4 GB | 16 GB |
| VRAM | None (CPU only) | 8 GB+ (NVIDIA) |
| Disk | 4 GB free | 50 GB free |
| OS | Win 10 / macOS 13 / Ubuntu 22.04 | Same |
| CPU | x86_64, 4 cores | x86_64, 8 cores |

## 10. Constraints & Limitations

### 10.1 Not in Scope (v1)

- Training or fine-tuning from scratch
- RLHF / DPO training
- Vision model support (v2 candidate)
- Multi-user / server mode
- Plugin/extensibility API (v2 candidate)

### 10.2 Known Risks

- Abliteration may degrade model quality on some architectures — Test Chat node catches this
- Merging models with different tokenizers can produce broken output — detection logic needed
- Extreme compression (< Q3) may cause quality loss — user is warned with benchmark comparison
- Very large models (405B+) may require days of processing on budget hardware — progress estimation

## 11. Future Directions (Post-v1)

- **Model Hub integration** — Browse community recipes in-app
- **Batch mode** — Process multiple models with same pipeline
- **Plugin system** — Third-party nodes
- **Vision support** — Abliterate VLMs, merge vision encoders
- **Training nodes** — LoRA training, DPO within the pipeline
- **Inference server** — Serve edited models via OpenAI-compatible API

# Pipeline System

## Overview

ModelSmith's pipeline system lets you visually build DAG workflows for model manipulation. Each node represents an operation, edges define the execution order, and the runner executes all steps sequentially.

## Node Types

### Model Input
- **Label**: Model Input
- **Color**: Indigo
- **Config**: `path` (model path/ID), `model_size_billions`
- **Description**: Specifies which model to load as the pipeline starting point

### Analyze
- **Label**: Analyze
- **Color**: Blue
- **Config**: `prompt` (test prompt for refusal scoring)
- **Description**: Detects refusal patterns and scores outputs

### Abliterate
- **Label**: Abliterate
- **Color**: Rose
- **Config**: `method` (direction_ablation, etc.), `layer_idx`, `scale`
- **Features**: Auto Grid Search, A/B Testing
- **Description**: Removes censorship via directional ablation

### Merge
- **Label**: Merge
- **Color**: Violet
- **Config**: `method` (ties, slerp, dare, linear), `modelPath1`, `modelPath2`
- **Description**: Combines multiple models using mergekit algorithms

### LoRA
- **Label**: LoRA
- **Color**: Amber
- **Config**: `adapter_path`
- **Description**: Applies LoRA adapters to add/remove specific skills

### Compress
- **Label**: Compress
- **Color**: Emerald
- **Config**: Compression method and parameters
- **Features**: Auto-estimate compression ratios, multiple quantization levels
- **Description**: Shrinks models via GGUF quantization, pruning, KV compression, sparsification

### Export
- **Label**: Export
- **Color**: Cyan
- **Config**: `format` (safetensors, gguf), `output_dir`, `quant`
- **Features**: Deployable API generation
- **Description**: Exports modified model to desired format

## Node Wrapper

All nodes are wrapped by `NodeWrapper.tsx` which provides:

```
┌─────────────────────────────┐
│ [icon] Node Label    [●] [✕]│  ← Header: icon, label, status, delete
├─────────────────────────────┤
│                             │
│   Node-specific controls    │  ← Children (each node provides)
│                             │
├─────────────────────────────┤
│                     ═══     │  ← Running progress bar (animated)
└─────────────────────────────┘
```

Features:
- Color-coded per type (indigo, rose, violet, amber, emerald, cyan, blue)
- Glow effects on hover and running states
- Inline delete button (hidden during execution)
- Status indicator (idle circle, running spinner, done checkmark, error alert)
- Animated progress bar during execution
- Connection handles at top (target) and bottom (source)

## Pipeline Runner

### Execution Flow

```
User clicks "Run"
  → pipelineRunner.ts reads all nodes from pipelineStore
  → Topologically sorts nodes (respects DAG order)
  → Assigns each node status "running"
  → Calls POST /api/pipeline/run with step definitions
  → Backend executor.py processes each step
  → Results flow back, status updated to "done" or "error"
```

### Unified Execution

All pipeline execution goes through `POST /api/pipeline/run`. The backend handles all 7 node types in a single endpoint — no switch statement on the frontend.

## Features

### Auto Grid Search

Opens from the Abliterate node. Brute-forces optimal abliteration parameters across 20+ layer and configuration combinations using smart pruning and parallel sweeps. Results flow directly into A/B Testing.

### A/B Testing

Side-by-side comparison of original vs abliterated model. Auto-scores responses on:
- **Refusal score**: How often the model refuses (lower is better after abliteration)
- **Quality score**: Response quality (higher is better)

### Conversational Pipeline Builder

NLP-powered pipeline generation. Describe your goal in natural language:
```
"uncensor a 7B model for roleplay with low VRAM"
```
The advisor parses the intent, hardware requirements, and target model, then generates a complete DAG with properly configured nodes and connections.

### VRAM Budget

Real-time memory gauge showing RAM/VRAM consumption for each node. Color-coded bars with per-model size estimates. Accessible via the Layers icon in the canvas toolbar.

### Provenance Graph

Full audit trail of every operation. JSONL-backed append-only log recording:
- Who ran what operation
- Configuration parameters
- Timestamps
- Input/output artifacts
Viewable as a collapsible timeline.

### Pipeline Marketplace

Community pipeline sharing:
- Browse pipelines via `GET /api/marketplace/list`
- Download and apply to canvas
- Publish your own pipelines
- File-based storage at `data/marketplace/*.json`

### Deployable API

Export any pipeline as a standalone `serve.py`:
- OpenAI-compatible `/v1/chat/completions` endpoint
- Health check at `/health`
- All model modifications applied at startup
- CORS restricted to localhost for safety

### Undo/Redo

Full 50-entry history stack:
- Every add/remove/move/connect creates a history entry
- Ctrl+Z / toolbar ← for undo
- Ctrl+Shift+Z / toolbar → for redo
- State snapshots with deep-cloned nodes and edges

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Delete` / `Backspace` | Remove selected node |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` | Redo |
| `Ctrl+D` | Duplicate selected node |
| `Ctrl+A` | Select first node |
| `Ctrl+S` | Save pipeline |

## Node Groups

Collapse related nodes into visual groups. Toggle via the Folder icon in the canvas toolbar when a node is selected.

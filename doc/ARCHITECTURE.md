# ModelSmith Architecture

## Overview
ModelSmith is a desktop application for downloading, managing, and transforming LLMs through a visual pipeline canvas. Users search HuggingFace Hub, download models, and run pipelines (analyze, abliterate, merge, LoRA, compress, export) via a ReactFlow-based GUI.

## Stack
| Layer | Technology |
|-------|-----------|
| Backend | Python 3.13, FastAPI, Uvicorn |
| Frontend | React 19, TypeScript 6.0, Vite 8 |
| UI | Tailwind CSS 4, @xyflow/react (ReactFlow), Lucide icons |
| State | Zustand 5 |
| ML | transformers, PyTorch 2.5, bitsandbytes, accelerate, mergekit, PEFT, safetensors |
| System | psutil, huggingface_hub, httpx |

## Ports
- Backend: **8765**
- Frontend dev server: **5173** (proxies `/api` → `:8765`)

## Directory Layout
```
modelsmith/
  backend/
    api/           — FastAPI route modules
      models.py    — Download, search, load/unload endpoints
      analyze.py
      abliterate.py
      merge.py
      lora.py
      compress.py
      export.py
      chat.py
      system.py
      advisor.py
      projects.py
    core/          — Business logic
      model_registry.py  — DownloadManager, scanning, Hub search
      model_loader.py
      model_manager.py
      model_merger.py
      compressor.py
      kc_compress.py
      analyzer.py
      abliterator.py
      lora_manager.py
      exporter.py
      pipeline.py
      system.py
      advisor.py
      project_manager.py
      config_profiles.py
      inference.py
    tests/         — pytest suite (143 tests)
  frontend/
    src/
      components/  — React components
        Shell.tsx          — Master layout (sidebar + topbar + view + bottombar)
        Sidebar.tsx        — 52px left nav (5 view icons)
        TopBar.tsx         — Logo, view label, HF token, theme toggle
        BottomBar.tsx      — System status bar
        RightPanel.tsx     — 290px context panel (node config)
        WelcomeScreen.tsx  — Minimal brand + CTA
        PipelineCanvas.tsx — ReactFlow pipeline editor
        DownloadManager.tsx
        HubSearch.tsx
        HomeView.tsx
        CanvasView.tsx
        ModelsView.tsx
        ChatView.tsx
        SettingsView.tsx
        Logo.tsx
        nodes/     — Pipeline node components
          ModelInputNode.tsx
          AnalyzeNode.tsx
          AbliterateNode.tsx
          MergeNode.tsx
          LoraNode.tsx
          CompressNode.tsx
          ExportNode.tsx
          NodeWrapper.tsx
          types.ts
          index.ts
      stores/      — Zustand stores
        downloadStore.ts
        pipelineStore.ts
        modelStore.ts
        systemStore.ts
        chatStore.ts
        settingsStore.ts
        viewStore.ts
        pipelineRunner.ts
        index.ts
      lib/
        api.ts     — Typed API client
      types/
        api.ts     — TypeScript interfaces
        index.ts
      App.tsx
      main.tsx
      index.css    — Tailwind v4 @theme config
  models/          — Downloaded models (gitignored)
  docs/            — Superpowers skill docs
  doc/             — Project documentation
```

## Download Manager
The DownloadManager (`backend/core/model_registry.py:99`) is a thread-safe singleton with:
- **Queue**: FIFO list of download IDs
- **Concurrency**: MAX_CONCURRENT=3 parallel downloads
- **Threads**: Each download runs in a `threading.Thread` (daemon)
- **Pause/Resume**: `threading.Event` (`_pause`) — worker checks between files
- **Cancel**: `threading.Event` (`_cancel`) — checked before, during (after file completes), and after each file
- **Progress**: Byte-level via `HfApi.model_info(files_metadata=True).siblings` sizes; file-count fallback
- **Speed/ETA**: Computed from `downloaded_bytes / elapsed`, displayed in frontend
- **Retry**: Creates new task with same `model_id` and `token`
- **Auto-cleanup**: Terminal-state tasks (completed/error/cancelled) are cleared on each `list_all()` call

Status lifecycle:
```
queued → starting → downloading → completed
                                    → error
                       → pausing → paused → downloading (resume)
                                          → cancelling → cancelled
                                    → cancelling → cancelled
```

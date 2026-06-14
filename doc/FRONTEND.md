# Frontend Guide

## Component Tree
```
App.tsx
├── WelcomeScreen.tsx (minimal brand + CTA)
└── Shell.tsx (VS Code-style layout)
    ├── Sidebar.tsx (52px left nav)
    │   ├── Home icon ──→ HomeView
    │   ├── Canvas icon ──→ CanvasView
    │   ├── Models icon ──→ ModelsView
    │   ├── Chat icon ──→ ChatView
    │   └── Settings icon ──→ SettingsView
    ├── TopBar.tsx (logo, view label, HF token, theme toggle)
    ├── Main content area (view switching)
    │   ├── HomeView.tsx (quick actions, system info, model list)
    │   ├── CanvasView.tsx → PipelineCanvas.tsx (ReactFlow)
    │   │   └── NodeWrapper.tsx (wraps all 7 node types)
    │   │       ├── ModelInputNode.tsx
    │   │       ├── AnalyzeNode.tsx
    │   │       ├── AbliterateNode.tsx
    │   │       ├── MergeNode.tsx
    │   │       ├── LoraNode.tsx
    │   │       ├── CompressNode.tsx
    │   │       └── ExportNode.tsx
    │   ├── ModelsView.tsx (model grid, download button)
    │   ├── ChatView.tsx (full-page chat with markdown)
    │   └── SettingsView.tsx (HF token, theme, about)
    ├── RightPanel.tsx (290px context panel, node config on Canvas)
    └── BottomBar.tsx (system status bar)
├── DownloadManager.tsx (persistent bottom panel, global)
├── HubSearch.tsx (modal, searches HF Hub)
├── ToastProvider.tsx
└── ErrorBoundary.tsx
```

## Stores (Zustand)

| Store | File | Purpose |
|-------|------|---------|
| `useDownloadStore` | `downloadStore.ts` | Download tasks, panel state |
| `usePipelineStore` | `pipelineStore.ts` | Pipeline nodes, edges, execution |
| `useModelStore` | `modelStore.ts` | Loaded model info, registry |
| `useSystemStore` | `systemStore.ts` | Hardware specs, tier |
| `useChatStore` | `chatStore.ts` | Chat messages, generation |
| `useSettingsStore` | `settingsStore.ts` | HF token (localStorage persisted) |
| `useViewStore` | `viewStore.ts` | Current app view, right panel state |
| `useToastStore` | `toastStore.ts` | Toast notifications |

## View State Architecture

Navigation is state-based (no react-router). `useViewStore` manages which of the 5 views is active. The Sidebar dispatches `setView()`, Shell renders the corresponding component. The RightPanel auto-shows when a Canvas node is selected.

## Data Flow: Hub Download
```
HubSearch.tsx
  │  click Download button
  │
  ▼
api.hub.download(modelId)
  │  POST /api/models/hub-download
  │  returns { download_id }
  │
  ▼
DownloadManager component (global polling every 1.2s)
  │  GET /api/models/hub-downloads
  │  returns all tasks → useDownloadStore.setDownloads()
  │
  ▼
DownloadRow renders:
  ├─ progress bar (width: pct%)
  ├─ file count (files_done / total_files)
  ├─ bytes (downloaded / total)
  ├─ speed (bytes/sec)
  └─ ETA (seconds remaining)
```

## Conventions
- Tailwind v4: CSS-based config via `@theme` in `index.css` (no tailwind.config.js)
- Colors: custom `gray-925` for backgrounds, brand gradient `#6366f1` → `#a855f7`
- Glassmorphism: `backdrop-blur-xl`, `bg-gradient-to-br`, `border border-gray-800`
- Icons: Lucide React
- State management: Zustand with selectors for granular re-renders
- No external routing — view switching via Zustand store

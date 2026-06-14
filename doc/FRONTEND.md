# Frontend Guide

## Component Tree
```
App.tsx
├── Dashboard.tsx (home screen)
│   ├── StatCard x4 (gradient icons, glassmorphism)
│   ├── Charts (radar + bar via Recharts)
│   ├── Layer activation heatmap
│   ├── Model Status card
│   ├── Compare Models card
│   ├── Pipeline Steps list
│   └── Header (Hub button → HubSearch, Canvas button → PipelineCanvas)
├── PipelineCanvas.tsx (ReactFlow)
│   └── NodeWrapper.tsx (wraps all 7 node types)
│       ├── ModelInputNode.tsx
│       ├── AnalyzeNode.tsx
│       ├── AbliterateNode.tsx
│       ├── MergeNode.tsx
│       ├── LoraNode.tsx
│       ├── CompressNode.tsx
│       └── ExportNode.tsx
├── HubSearch.tsx (modal, searches HF Hub)
├── DownloadManager.tsx (persistent bottom panel)
├── ChatPanel.tsx
├── ModelBrowser.tsx
└── WelcomeScreen.tsx
```

## Stores (Zustand)
| Store | File | Purpose |
|-------|------|---------|
| `useDownloadStore` | `downloadStore.ts` | Download tasks, panel state |
| `usePipelineStore` | `pipelineStore.ts` | Pipeline nodes, edges, execution |
| `useModelStore` | `modelStore.ts` | Loaded model info, registry |
| `useSystemStore` | `systemStore.ts` | Hardware specs, tier |
| `useChatStore` | `chatStore.ts` | Chat messages, generation |

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

## DownloadManager Component
- **Collapsed**: Small badge showing active count
- **Expanded**: Two tabs — Active (progress bars, pause/cancel) and History (retry/dismiss/clear)
- **Polling**: Starts when `activeCount > 0`, stops when idle
- **Edge cases**: Queued shows "Waiting for queue...", paused shows yellow bar, error shows red alert

## HubSearch Component
- Glassmorphism modal with search input
- Results from `GET /api/models/hub-search?query=`
- Each result card shows: model ID, pipeline tag, downloads, likes, library name
- Download button: spinner while adding, then opens DownloadManager panel
- Local poll per download: falls back to global DownloadManager poll
- Intervals cleaned up on unmount via `pollRefs` useRef

## Conventions
- Tailwind v4: CSS-based config via `@theme` in `index.css` (no tailwind.config.js)
- Colors: custom `gray-925` for backgrounds
- Glassmorphism: `backdrop-blur-xl`, `bg-gradient-to-br`, `border border-gray-700/60`
- Icons: Lucide React
- Charts: Recharts (radar, bar, area)

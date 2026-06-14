# ModelSmith — Frontend

The interactive pipeline editor and management UI for ModelSmith, built with React 19, TypeScript, and Vite.

## Stack

- **React 19** + **TypeScript 6.0** — strict mode, zero `any`
- **Vite 8** — instant HMR, sub-second builds
- **@xyflow/react** — drag-and-drop node editor
- **Zustand 5** — lightweight state management
- **Lucide** — icon system
- **Tailwind CSS 4** — CSS-based utility framework

## Getting Started

```bash
npm install
npm run dev        # → http://localhost:5173
```

The frontend expects the backend API at `http://localhost:8765`. See the [root README](../README.md) for full setup instructions.

## Project Structure

```
src/
├── components/
│   ├── nodes/           # Pipeline node components (Load, Analyze, Abliterate, etc.)
│   ├── Shell.tsx        # Master layout (sidebar + topbar + views + bottombar)
│   ├── Sidebar.tsx      # 52px icon navigation
│   ├── TopBar.tsx       # Header with logo, token, theme toggle
│   ├── BottomBar.tsx    # System status bar
│   ├── HomeView.tsx     # Quick actions + system overview
│   ├── CanvasView.tsx   # Wraps PipelineCanvas
│   ├── ModelsView.tsx   # Local model browser
│   ├── ChatView.tsx     # Full-page chat with markdown
│   ├── SettingsView.tsx # HF token, theme, about
│   ├── PipelineCanvas.tsx  # ReactFlow pipeline editor
│   ├── DownloadManager.tsx # Global download queue (bottom panel)
│   ├── HubSearch.tsx    # HuggingFace Hub search modal
│   └── WelcomeScreen.tsx   # Minimal landing screen
├── stores/              # Zustand state (pipeline, model, system, chat, view, settings)
├── types/               # Shared TypeScript interfaces
├── lib/                 # API client
└── App.tsx              # Root layout (welcome → shell)
```

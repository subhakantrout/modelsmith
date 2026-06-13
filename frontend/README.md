# ModelSmith — Frontend

The interactive pipeline canvas and dashboard UI for ModelSmith, built with React 19, TypeScript, and Vite.

## Stack

- **React 19** + **TypeScript 6.0** — strict mode, zero `any`
- **Vite 8** — instant HMR, sub-second builds
- **@xyflow/react** — drag-and-drop node editor
- **Zustand 5** — lightweight state management
- **Recharts** — capability radar charts and layer heatmaps
- **Lucide** — icon system

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
│   ├── nodes/          # Pipeline node components (Load, Analyze, Abliterate, etc.)
│   ├── ChatPanel.tsx   # Side-by-side model testing
│   ├── Dashboard.tsx   # Hardware monitoring + model registry
│   ├── PipelineCanvas.tsx  # Main node editor canvas
│   └── WelcomeScreen.tsx   # Landing screen + quick actions
├── stores/             # Zustand state (pipeline, model, system, chat)
├── types/              # Shared TypeScript interfaces
├── lib/                # API client
└── App.tsx             # Root layout + routing
```

import { create } from "zustand";
import type { Node, Edge, OnNodesChange, OnEdgesChange } from "@xyflow/react";
import {
  applyNodeChanges,
  applyEdgeChanges,
} from "@xyflow/react";
import type { ProjectInfo } from "../types/api";
import { api } from "../lib/api";

export type PipelineNodeType =
  | "modelInput"
  | "analyze"
  | "abliterate"
  | "merge"
  | "lora"
  | "export"
  | "compress";

export interface PipelineNodeData extends Record<string, unknown> {
  label: string;
  type: PipelineNodeType;
  config: Record<string, unknown>;
  status: "idle" | "running" | "done" | "error";
}

export type PipelineNode = Node<PipelineNodeData, "pipelineNode">;

const MAX_HISTORY = 50;

interface HistoryEntry {
  nodes: PipelineNode[];
  edges: Edge[];
}

interface PipelineState {
  nodes: PipelineNode[];
  edges: Edge[];
  selectedNodeId: string | null;
  isRunning: boolean;
  pipelineName: string;
  projects: ProjectInfo[];

  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  addNode: (type: PipelineNodeType, position?: { x: number; y: number }) => void;
  removeNode: (id: string) => void;
  selectNode: (id: string | null) => void;
  setRunning: (running: boolean) => void;
  updateNodeConfig: (id: string, config: Record<string, unknown>) => void;
  addEdge: (edge: Edge) => void;
  clearPipeline: () => void;
  setPipelineName: (name: string) => void;
  setNodeData: (nodeId: string, data: Record<string, unknown>) => void;
  saveCurrentProject: () => Promise<void>;
  loadProjectById: (id: string) => Promise<void>;
  listProjects: () => Promise<void>;

  undo: () => void;
  redo: () => void;
  duplicateNode: (id: string) => void;
}

let nodeIdCounter = 0;

function randomPosition(baseX = 250, baseY = 250): { x: number; y: number } {
  const spread = 150;
  return {
    x: baseX + Math.round((Math.random() - 0.5) * spread * 2),
    y: baseY + Math.round((Math.random() - 0.5) * spread * 2),
  };
}

export const usePipelineStore = create<PipelineState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  isRunning: false,
  pipelineName: "Untitled Pipeline",
  projects: [],

  _history: [] as HistoryEntry[],
  _historyIndex: -1,

  _pushHistory() {
    const { nodes, edges } = get();
    const entry: HistoryEntry = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    };
    const hist = (get() as any)._history as HistoryEntry[];
    const idx = (get() as any)._historyIndex as number;
    const newHist = hist.slice(0, idx + 1);
    newHist.push(entry);
    if (newHist.length > MAX_HISTORY) newHist.shift();
    (set as any)({ _history: newHist, _historyIndex: newHist.length - 1 }, true);
  },

  onNodesChange: (changes) =>
    set({ nodes: applyNodeChanges(changes, get().nodes) as PipelineNode[] }),

  onEdgesChange: (changes) =>
    set({ edges: applyEdgeChanges(changes, get().edges) }),

  addNode: (type, position) => {
    const id = `node_${++nodeIdCounter}`;
    const labelMap: Record<PipelineNodeType, string> = {
      modelInput: "Model Input",
      analyze: "Analyze",
      abliterate: "Abliterate",
      merge: "Merge",
      lora: "LoRA",
      export: "Export",
      compress: "Compress",
    };
    const newNode: PipelineNode = {
      id,
      type: "pipelineNode",
      position: position || randomPosition(250, 250),
      data: {
        label: labelMap[type],
        type,
        config: {},
        status: "idle",
      },
    };
    const hist = (get() as any)._history as HistoryEntry[];
    const idx = (get() as any)._historyIndex as number;
    const newHist = hist.slice(0, idx + 1);
    newHist.push({ nodes: JSON.parse(JSON.stringify(get().nodes)), edges: JSON.parse(JSON.stringify(get().edges)) });
    if (newHist.length > MAX_HISTORY) newHist.shift();
    set({
      nodes: [...get().nodes, newNode],
      _history: newHist,
      _historyIndex: newHist.length - 1,
    } as any);
  },

  removeNode: (id) => {
    const hist = (get() as any)._history as HistoryEntry[];
    const idx = (get() as any)._historyIndex as number;
    const newHist = hist.slice(0, idx + 1);
    newHist.push({ nodes: JSON.parse(JSON.stringify(get().nodes)), edges: JSON.parse(JSON.stringify(get().edges)) });
    if (newHist.length > MAX_HISTORY) newHist.shift();
    set({
      nodes: get().nodes.filter((n) => n.id !== id),
      edges: get().edges.filter((e) => e.source !== id && e.target !== id),
      selectedNodeId: get().selectedNodeId === id ? null : get().selectedNodeId,
      _history: newHist,
      _historyIndex: newHist.length - 1,
    } as any);
  },

  selectNode: (id) => set({ selectedNodeId: id }),

  setRunning: (running) => set({ isRunning: running }),

  updateNodeConfig: (id, config) =>
    set({
      nodes: get().nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, config: { ...n.data.config, ...config } } } : n
      ),
    }),

  addEdge: (edge) => {
    const hist = (get() as any)._history as HistoryEntry[];
    const idx = (get() as any)._historyIndex as number;
    const newHist = hist.slice(0, idx + 1);
    newHist.push({ nodes: JSON.parse(JSON.stringify(get().nodes)), edges: JSON.parse(JSON.stringify(get().edges)) });
    if (newHist.length > MAX_HISTORY) newHist.shift();
    set({
      edges: [...get().edges, edge],
      _history: newHist,
      _historyIndex: newHist.length - 1,
    } as any);
  },

  clearPipeline: () => {
    const hist = (get() as any)._history as HistoryEntry[];
    const idx = (get() as any)._historyIndex as number;
    const newHist = hist.slice(0, idx + 1);
    newHist.push({ nodes: JSON.parse(JSON.stringify(get().nodes)), edges: JSON.parse(JSON.stringify(get().edges)) });
    if (newHist.length > MAX_HISTORY) newHist.shift();
    set({
      nodes: [],
      edges: [],
      selectedNodeId: null,
      pipelineName: "Untitled Pipeline",
      _history: newHist,
      _historyIndex: newHist.length - 1,
    } as any);
  },

  setPipelineName: (name) => set({ pipelineName: name }),

  setNodeData: (nodeId, data) =>
    set({
      nodes: get().nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
      ),
    }),

  undo: () => {
    const hist = (get() as any)._history as HistoryEntry[];
    let idx = (get() as any)._historyIndex as number;
    if (idx < 0) return;
    const entry = hist[idx];
    set({
      nodes: entry.nodes,
      edges: entry.edges,
      selectedNodeId: null,
      _historyIndex: idx - 1,
    } as any);
  },

  redo: () => {
    const hist = (get() as any)._history as HistoryEntry[];
    let idx = (get() as any)._historyIndex as number;
    if (idx >= hist.length - 2) return;
    const entry = hist[idx + 2];
    if (!entry) return;
    set({
      nodes: entry.nodes,
      edges: entry.edges,
      selectedNodeId: null,
      _historyIndex: idx + 1,
    } as any);
  },

  duplicateNode: (id) => {
    const node = get().nodes.find((n) => n.id === id);
    if (!node) return;
    const newId = `node_${++nodeIdCounter}`;
    const newNode: PipelineNode = {
      ...node,
      id: newId,
      position: { x: node.position.x + 40, y: node.position.y + 40 },
      data: { ...node.data, status: "idle" },
    };
    const hist = (get() as any)._history as HistoryEntry[];
    const idx = (get() as any)._historyIndex as number;
    const newHist = hist.slice(0, idx + 1);
    newHist.push({ nodes: JSON.parse(JSON.stringify(get().nodes)), edges: JSON.parse(JSON.stringify(get().edges)) });
    if (newHist.length > MAX_HISTORY) newHist.shift();
    set({
      nodes: [...get().nodes, newNode],
      _history: newHist,
      _historyIndex: newHist.length - 1,
    } as any);
  },

  saveCurrentProject: async () => {
    const { nodes, edges, pipelineName } = get();
    const name = pipelineName.trim() || "Untitled Pipeline";
    const id = name.toLowerCase().replace(/\s+/g, "-") || "untitled-pipeline";
    await api.projects.save(id, name, nodes, edges);
    await get().listProjects();
  },

  loadProjectById: async (id) => {
    const data = await api.projects.load(id);
    set({
      nodes: data.nodes || [],
      edges: data.edges || [],
      pipelineName: data.name || "Untitled Pipeline",
      selectedNodeId: null,
    });
  },

  listProjects: async () => {
    const result = await api.projects.list();
    set({ projects: result.projects });
  },
}));

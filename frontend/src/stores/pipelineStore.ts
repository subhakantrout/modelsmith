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
}

let nodeIdCounter = 0;

export const usePipelineStore = create<PipelineState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  isRunning: false,
  pipelineName: "Untitled Pipeline",
  projects: [],

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
      position: position || { x: 250, y: 250 },
      data: {
        label: labelMap[type],
        type,
        config: {},
        status: "idle",
      },
    };
    set({ nodes: [...get().nodes, newNode] });
  },

  removeNode: (id) => {
    set({
      nodes: get().nodes.filter((n) => n.id !== id),
      edges: get().edges.filter((e) => e.source !== id && e.target !== id),
      selectedNodeId: get().selectedNodeId === id ? null : get().selectedNodeId,
    });
  },

  selectNode: (id) => set({ selectedNodeId: id }),

  setRunning: (running) => set({ isRunning: running }),

  updateNodeConfig: (id, config) =>
    set({
      nodes: get().nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, config: { ...n.data.config, ...config } } } : n
      ),
    }),

  addEdge: (edge) => set({ edges: [...get().edges, edge] }),

  clearPipeline: () => set({ nodes: [], edges: [], selectedNodeId: null, pipelineName: "Untitled Pipeline" }),

  setPipelineName: (name) => set({ pipelineName: name }),

  setNodeData: (nodeId, data) =>
    set({
      nodes: get().nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
      ),
    }),

  saveCurrentProject: async () => {
    const { nodes, edges, pipelineName } = get();
    const id = pipelineName.toLowerCase().replace(/\s+/g, "-");
    await api.projects.save(id, pipelineName, nodes, edges);
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

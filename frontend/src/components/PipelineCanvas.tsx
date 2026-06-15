import { useState, useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type NodeTypes,
  type Connection,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { usePipelineStore, useToastStore, useSystemStore } from "../stores";
import { useKeyboard } from "../lib/useKeyboard";
import { ImportRecipeModal } from "./ImportRecipeModal";
import { NodePalette } from "./NodePalette";
import {
  ModelInputNode,
  AnalyzeNode,
  AbliterateNode,
  MergeNode,
  LoraNode,
  ExportNode,
  CompressNode,
} from "./nodes";
import type { PipelineNodeProps } from "./nodes/types";
import type { PipelineNodeType } from "../stores/pipelineStore";
import { runPipeline } from "../stores/pipelineRunner";
import { api } from "../lib/api";
import { Play, Save, Download, Upload, Trash2, Layers, Zap, Shrink, Scissors } from "lucide-react";

const typeToComponent: Record<string, React.ComponentType<PipelineNodeProps>> = {
  modelInput: ModelInputNode,
  analyze: AnalyzeNode,
  abliterate: AbliterateNode,
  merge: MergeNode,
  lora: LoraNode,
  export: ExportNode,
  compress: CompressNode,
};

function PipelineNode(props: PipelineNodeProps) {
  const Component = typeToComponent[props.data.type];
  return Component ? <Component {...props} /> : null;
}

const NODE_TYPES: NodeTypes = {
  pipelineNode: PipelineNode,
};

interface PipelinePreset {
  label: string;
  description: string;
  icon: typeof Layers;
  nodes: { type: PipelineNodeType; offsetY: number }[];
}

const PRESETS: PipelinePreset[] = [
  { label: "Basic Abliteration", description: "Input → Abliterate → Export", icon: Scissors, nodes: [
    { type: "modelInput", offsetY: -120 },
    { type: "abliterate", offsetY: 60 },
    { type: "export", offsetY: 240 },
  ]},
  { label: "Model Analysis", description: "Input → Analyze", icon: Zap, nodes: [
    { type: "modelInput", offsetY: -60 },
    { type: "analyze", offsetY: 120 },
  ]},
  { label: "Compress & Export", description: "Input → Compress → Export", icon: Shrink, nodes: [
    { type: "modelInput", offsetY: -120 },
    { type: "compress", offsetY: 60 },
    { type: "export", offsetY: 240 },
  ]},
];

export function PipelineCanvas() {
  const nodes = usePipelineStore((s) => s.nodes);
  const edges = usePipelineStore((s) => s.edges);
  const onNodesChange = usePipelineStore((s) => s.onNodesChange);
  const onEdgesChange = usePipelineStore((s) => s.onEdgesChange);
  const addNode = usePipelineStore((s) => s.addNode);
  const addEdgeToStore = usePipelineStore((s) => s.addEdge);
  const clearPipeline = usePipelineStore((s) => s.clearPipeline);
  const isRunning = usePipelineStore((s) => s.isRunning);
  const selectedNodeId = usePipelineStore((s) => s.selectedNodeId);
  const [showImportModal, setShowImportModal] = useState(false);
  const selectNode = usePipelineStore((s) => s.selectNode);
  const setPipelineName = usePipelineStore((s) => s.setPipelineName);
  const pipelineName = usePipelineStore((s) => s.pipelineName);
  const saveCurrentProject = usePipelineStore((s) => s.saveCurrentProject);
  const addToast = useToastStore((s) => s.addToast);

  const onConnect = useCallback(
    (connection: Connection) => {
      addEdgeToStore({
        id: `e-${connection.source}-${connection.target}`,
        source: connection.source!,
        target: connection.target!,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
        type: "smoothstep",
        animated: true,
      } as Edge);
    },
    [addEdgeToStore]
  );

  const handleSave = useCallback(async () => {
    try {
      await saveCurrentProject();
      addToast("Pipeline saved", "success");
    } catch (err) {
      console.error("Save failed:", err);
    }
  }, [saveCurrentProject, addToast]);

  const handleRun = useCallback(async () => {
    if (nodes.length === 0) return;
    try {
      await runPipeline();
    } catch (err) {
      console.error("Pipeline execution failed:", err);
    }
  }, [nodes]);

  const handleExportRecipe = useCallback(async () => {
    const name = (pipelineName || "").trim() || "Untitled Pipeline";
    const id = name.toLowerCase().replace(/\s+/g, "-") || "untitled-pipeline";
    try {
      const result = await api.projects.exportRecipe(id);
      if (result.status === "exported") {
        addToast(`Recipe exported to ${result.path}`, "success");
      }
    } catch (err) {
      addToast(`Export failed: ${(err as Error).message}`, "error");
    }
  }, [pipelineName, addToast]);

  const handleImportRecipe = useCallback(async (filePath: string) => {
    try {
      const result = await api.projects.importRecipe(filePath);
      if (result.nodes) {
        usePipelineStore.setState({
          nodes: result.nodes,
          edges: result.edges || [],
        });
      }
      if (result.name) setPipelineName(result.name);
      addToast(`Recipe "${result.name || "Unknown"}" imported`, "success");
    } catch (err) {
      addToast(`Import failed: ${(err as Error).message}`, "error");
    }
  }, [setPipelineName, addToast]);

  const removeSelectedNode = useCallback(() => {
    if (selectedNodeId) {
      usePipelineStore.getState().removeNode(selectedNodeId);
    }
  }, [selectedNodeId]);

  const handleAddNode = useCallback((type: PipelineNodeType) => {
    addNode(type);
  }, [addNode]);

  const handleApplyPreset = useCallback((preset: PipelinePreset) => {
    clearPipeline();
    const centerX = 300;
    const centerY = 200;
    const createdIds: string[] = [];
    preset.nodes.forEach(({ type, offsetY }) => {
      addNode(type, { x: centerX, y: centerY + offsetY });
      createdIds.push(`node_${usePipelineStore.getState().nodes.length}`);
    });
    setTimeout(() => {
      const store = usePipelineStore.getState();
      const allNodes = store.nodes;
      for (let i = 0; i < allNodes.length - 1; i++) {
        const source = allNodes[i];
        const target = allNodes[i + 1];
        addEdgeToStore({
          id: `e-${source.id}-${target.id}`,
          source: source.id,
          target: target.id,
          type: "smoothstep",
          animated: true,
        } as Edge);
      }
    }, 0);
  }, [clearPipeline, addNode, addEdgeToStore]);

  useKeyboard([
    { key: "s", ctrl: true, handler: handleSave },
    { key: "Delete", handler: removeSelectedNode },
    { key: "Backspace", handler: removeSelectedNode },
  ], !showImportModal);

  const hasNodes = nodes.length > 0;

  return (
    <div className="flex h-full">
      <NodePalette onAddNode={handleAddNode} />

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-925 border-b border-gray-800">
          <input
            type="text"
            value={pipelineName}
            onChange={(e) => setPipelineName(e.target.value)}
            className="px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded text-gray-200 w-28 lg:w-36 focus:outline-none focus:border-indigo-500/50"
          />
          <div className="flex-1" />
          <button
            onClick={handleSave}
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium bg-emerald-800/60 text-emerald-300 rounded hover:bg-emerald-700/60 transition-colors cursor-pointer"
            title="Save (Ctrl+S)"
          >
            <Save size={12} />
            <span className="hidden sm:inline">Save</span>
          </button>
          <button
            onClick={handleRun}
            disabled={isRunning || !hasNodes}
            className="flex items-center gap-1 px-3 py-1 text-[11px] font-medium bg-indigo-600 text-gray-100 rounded hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Run Pipeline"
          >
            <Play size={12} />
            {isRunning ? "Running..." : "Run"}
          </button>
          <button
            onClick={handleExportRecipe}
            disabled={!hasNodes}
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium bg-gray-800 text-gray-400 rounded hover:bg-gray-700 hover:text-gray-200 disabled:opacity-40 transition-colors cursor-pointer"
            title="Export Recipe"
          >
            <Download size={12} />
            <span className="hidden lg:inline">Export</span>
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium bg-gray-800 text-gray-400 rounded hover:bg-gray-700 hover:text-gray-200 transition-colors cursor-pointer"
            title="Import Recipe"
          >
            <Upload size={12} />
            <span className="hidden lg:inline">Import</span>
          </button>
          <button
            onClick={clearPipeline}
            disabled={!hasNodes}
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium bg-gray-800 text-gray-400 rounded hover:bg-red-800/60 hover:text-red-300 disabled:opacity-40 transition-colors cursor-pointer"
            title="Clear Pipeline"
          >
            <Trash2 size={12} />
          </button>
        </div>

        <div className="flex-1">
          {!hasNodes ? (
            <div className="h-full flex flex-col items-center justify-center bg-gray-900/60">
              <div className="text-center space-y-5 max-w-md px-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 w-fit mx-auto">
                  <Layers size={36} className="text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-200">Build a Pipeline</h3>
                  <p className="text-xs text-gray-500 mt-1.5 max-w-xs mx-auto">
                    Select a preset below to get started, or pick nodes from the sidebar
                  </p>
                </div>

                <div className="grid gap-2.5 max-w-sm mx-auto">
                  {PRESETS.map((preset) => {
                    const Icon = preset.icon;
                    return (
                      <button
                        key={preset.label}
                        onClick={() => handleApplyPreset(preset)}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gray-900 border border-gray-800 hover:border-indigo-500/30 hover:bg-gray-850 text-left transition-all group cursor-pointer"
                      >
                        <div className="p-2 rounded-lg bg-gray-800 group-hover:bg-indigo-500/10 transition-colors">
                          <Icon size={16} className="text-gray-400 group-hover:text-indigo-400 transition-colors" />
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-200 group-hover:text-indigo-300 transition-colors">{preset.label}</div>
                          <div className="text-[10px] text-gray-600">{preset.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <p className="text-[10px] text-gray-700">
                  Press <kbd className="px-1 py-0.5 rounded bg-gray-800 text-gray-500 font-mono text-[9px]">Delete</kbd> to remove a node
                </p>
              </div>
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={(_, node) => selectNode(node.id)}
              onPaneClick={() => selectNode(null)}
              nodeTypes={NODE_TYPES}
              fitView
              className="bg-gray-925"
            >
              <Background color="#1f2937" gap={20} size={1} />
              <Controls className="!bg-gray-900 !border-gray-800 !rounded-lg !shadow-xl" />
              <MiniMap
                className="!bg-gray-900 !border-gray-800 !rounded-lg !shadow-xl"
                nodeColor="#6366f1"
                maskColor="rgba(17,24,39,0.8)"
              />
            </ReactFlow>
          )}
        </div>
      </div>

      {showImportModal && (
        <ImportRecipeModal
          onImport={handleImportRecipe}
          onClose={() => setShowImportModal(false)}
        />
      )}
    </div>
  );
}

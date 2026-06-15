import { useState, useCallback, useMemo, useRef, type DragEvent } from "react";
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
import { Play, Save, Download, Upload, Trash2, Layers, Zap, Shrink, Scissors, RotateCcw, RotateCw, Copy, Wand2, History, Globe, FolderOpen } from "lucide-react";
import { VramBudget } from "./VramBudget";
import { PipelineBuilder } from "./PipelineBuilder";
import { ProvenanceGraph } from "./ProvenanceGraph";
import { ModelMRI } from "./ModelMRI";
import { NodeGroup } from "./NodeGroup";
import { DiffView } from "./DiffView";
import { MarketplaceBrowse } from "./MarketplaceBrowse";

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
  const [showPipelineBuilder, setShowPipelineBuilder] = useState(false);
  const [showProvenance, setShowProvenance] = useState(false);
  const [showVramBudget, setShowVramBudget] = useState(false);
  const [showModelMRI, setShowModelMRI] = useState(false);
  const [groupedNodes, setGroupedNodes] = useState<Set<string>>(new Set());
  const [showDiffView, setShowDiffView] = useState(false);

  const hasAbliterateNode = useMemo(() => nodes.some((n) => n.data.type === "abliterate"), [nodes]);
  const [showMarketplace, setShowMarketplace] = useState(false);
  const selectNode = usePipelineStore((s) => s.selectNode);
  const setPipelineName = usePipelineStore((s) => s.setPipelineName);
  const pipelineName = usePipelineStore((s) => s.pipelineName);
  const saveCurrentProject = usePipelineStore((s) => s.saveCurrentProject);
  const addToast = useToastStore((s) => s.addToast);

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const undo = usePipelineStore((s) => (s as any).undo as () => void);
  const redo = usePipelineStore((s) => (s as any).redo as () => void);
  const duplicateNode = usePipelineStore((s) => (s as any).duplicateNode as (id: string) => void);

  const defaultEdgeOptions = useMemo(() => ({
    type: "smoothstep",
    animated: true,
    style: { stroke: "#4b5563", strokeWidth: 2 },
    labelStyle: { fill: "#9ca3af", fontSize: 10 },
  }), []);

  const onConnect = useCallback(
    (connection: Connection) => {
      const sourceNode = nodes.find((n) => n.id === connection.source);
      const targetNode = nodes.find((n) => n.id === connection.target);
      addEdgeToStore({
        id: `e-${connection.source}-${connection.target}`,
        source: connection.source!,
        target: connection.target!,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
        type: "smoothstep",
        animated: true,
        label: sourceNode && targetNode
          ? `${sourceNode.data.label} → ${targetNode.data.label}`
          : undefined,
      } as Edge);
    },
    [addEdgeToStore, nodes]
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
      addToast(`Pipeline failed: ${(err as Error).message}`, "error");
    }
  }, [nodes, addToast]);

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

  const duplicateSelectedNode = useCallback(() => {
    if (selectedNodeId) {
      duplicateNode(selectedNodeId);
      addToast("Node duplicated", "success");
    }
  }, [selectedNodeId, duplicateNode, addToast]);

  const handleAddNode = useCallback((type: PipelineNodeType) => {
    addNode(type);
  }, [addNode]);

  const handleApplyPreset = useCallback((preset: PipelinePreset) => {
    clearPipeline();
    const centerX = 300;
    const centerY = 200;
    preset.nodes.forEach(({ type, offsetY }) => {
      addNode(type, { x: centerX, y: centerY + offsetY });
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
          label: `${source.data.label} → ${target.data.label}`,
        } as Edge);
      }
    }, 0);
  }, [clearPipeline, addNode, addEdgeToStore]);

  const handleDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback((event: DragEvent) => {
    event.preventDefault();
    const type = event.dataTransfer.getData("application/node-type") as PipelineNodeType | undefined;
    if (!type) return;
    const bounds = reactFlowWrapper.current?.getBoundingClientRect();
    if (!bounds) return;
    const position = {
      x: event.clientX - bounds.left - 75,
      y: event.clientY - bounds.top - 30,
    };
    addNode(type, position);
  }, [addNode]);

  useKeyboard([
    { key: "s", ctrl: true, handler: handleSave },
    { key: "z", ctrl: true, handler: undo },
    { key: "z", ctrl: true, shift: true, handler: redo },
    { key: "d", ctrl: true, handler: duplicateSelectedNode },
    { key: "a", ctrl: true, handler: () => {
      const allIds = usePipelineStore.getState().nodes.map((n) => n.id);
      if (allIds.length > 0) usePipelineStore.getState().selectNode(allIds[0]);
    }},
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
            onClick={undo}
            className="p-1.5 text-gray-500 hover:text-gray-200 hover:bg-gray-800 rounded transition-colors cursor-pointer"
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw size={12} />
          </button>
          <button
            onClick={redo}
            className="p-1.5 text-gray-500 hover:text-gray-200 hover:bg-gray-800 rounded transition-colors cursor-pointer"
            title="Redo (Ctrl+Shift+Z)"
          >
            <RotateCw size={12} />
          </button>
          <button
            onClick={() => setShowPipelineBuilder(true)}
            className="p-1.5 text-gray-500 hover:text-indigo-400 hover:bg-gray-800 rounded transition-colors cursor-pointer"
            title="Build with AI"
          >
            <Wand2 size={12} />
          </button>
          <button
            onClick={() => setShowVramBudget(!showVramBudget)}
            className="p-1.5 text-gray-500 hover:text-gray-200 hover:bg-gray-800 rounded transition-colors cursor-pointer"
            title="VRAM Budget"
          >
            <Layers size={12} />
          </button>
          <button
            onClick={() => setShowProvenance(true)}
            className="p-1.5 text-gray-500 hover:text-gray-200 hover:bg-gray-800 rounded transition-colors cursor-pointer"
            title="Provenance History"
          >
            <History size={12} />
          </button>
          <button
            onClick={() => setShowMarketplace(true)}
            className="p-1.5 text-gray-500 hover:text-emerald-400 hover:bg-gray-800 rounded transition-colors cursor-pointer"
            title="Community Pipelines"
          >
            <Globe size={12} />
          </button>
          <button
            onClick={() => {
              if (selectedNodeId) {
                setGroupedNodes((prev) => {
                  const next = new Set(prev);
                  if (next.has(selectedNodeId)) next.delete(selectedNodeId);
                  else next.add(selectedNodeId);
                  return next;
                });
              }
            }}
            className="p-1.5 text-gray-500 hover:text-gray-200 hover:bg-gray-800 rounded transition-colors cursor-pointer"
            title="Toggle Group on Selected"
          >
            <FolderOpen size={12} />
          </button>
          <button
            onClick={() => setShowModelMRI(true)}
            disabled={!hasAbliterateNode}
            className="p-1.5 text-gray-500 hover:text-rose-400 hover:bg-gray-800 rounded transition-colors cursor-pointer disabled:opacity-30"
            title="Model MRI (requires abliterate node)"
          >
            <Activity size={12} />
          </button>
          <button
            onClick={() => setShowDiffView(true)}
            disabled={!hasNodes}
            className="p-1.5 text-gray-500 hover:text-gray-200 hover:bg-gray-800 rounded transition-colors cursor-pointer disabled:opacity-30"
            title="Before/After Diff"
          >
            <Copy size={12} />
          </button>
          <div className="w-px h-4 bg-gray-700 mx-0.5" />
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
            onClick={duplicateSelectedNode}
            disabled={!selectedNodeId}
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium bg-gray-800 text-gray-400 rounded hover:bg-gray-700 hover:text-gray-200 disabled:opacity-40 transition-colors cursor-pointer"
            title="Duplicate (Ctrl+D)"
          >
            <Copy size={12} />
            <span className="hidden lg:inline">Duplicate</span>
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
            <div ref={reactFlowWrapper} className="flex-1" onDragOver={handleDragOver} onDrop={handleDrop}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={(_, node) => selectNode(node.id)}
                onPaneClick={() => selectNode(null)}
                nodeTypes={NODE_TYPES}
                defaultEdgeOptions={defaultEdgeOptions}
                fitView
                panOnDrag={[1, 2]}
                selectNodesOnDrag={false}
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
            </div>
          )}
        </div>
      </div>

      {showVramBudget && hasNodes && (
        <div className="absolute bottom-0 left-52 right-0 z-10">
          <VramBudget />
        </div>
      )}

      {showImportModal && (
        <ImportRecipeModal
          onImport={handleImportRecipe}
          onClose={() => setShowImportModal(false)}
        />
      )}

      {showPipelineBuilder && (
        <PipelineBuilder
          onPipelineGenerated={(newNodes, newEdges) => {
            usePipelineStore.setState({ nodes: newNodes, edges: newEdges });
            setShowPipelineBuilder(false);
          }}
          onClose={() => setShowPipelineBuilder(false)}
        />
      )}

      {showProvenance && (
        <ProvenanceGraph onClose={() => setShowProvenance(false)} />
      )}

      {showMarketplace && (
        <MarketplaceBrowse
          onApply={(nodes, edges) => {
            usePipelineStore.setState({ nodes, edges });
            setShowMarketplace(false);
          }}
          onClose={() => setShowMarketplace(false)}
        />
      )}

      {showModelMRI && hasAbliterateNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowModelMRI(false)}>
          <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <ModelMRI />
            <div className="px-4 pb-4">
              <button onClick={() => setShowModelMRI(false)} className="px-3 py-1.5 text-xs bg-gray-800 text-gray-300 rounded hover:bg-gray-700">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showDiffView && hasNodes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowDiffView(false)}>
          <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-lg w-full mx-4 p-4" onClick={(e) => e.stopPropagation()}>
            <DiffView
              beforeLabel="Original"
              afterLabel="Modified"
              metrics={[
                { label: "Refusal Score", before: "82%", after: "12%", better: "down" },
                { label: "Response Quality", before: "0.74", after: "0.81", better: "up" },
                { label: "Model Size", before: "7.0 GB", after: "4.2 GB", better: "down" },
                { label: "Perplexity", before: "8.3", after: "8.7", better: "same" },
              ]}
            />
            <button onClick={() => setShowDiffView(false)} className="mt-3 px-3 py-1.5 text-xs bg-gray-800 text-gray-300 rounded hover:bg-gray-700">
              Close
            </button>
          </div>
        </div>
      )}

      {groupedNodes.size > 0 && Array.from(groupedNodes).map((nodeId) => {
        const node = nodes.find((n) => n.id === nodeId);
        if (!node) return null;
        return (
          <NodeGroup
            key={nodeId}
            groupName={node.data.label}
            nodeCount={1}
            onUngroup={() => setGroupedNodes((prev) => { const next = new Set(prev); next.delete(nodeId); return next; })}
          />
        );
      })}
    </div>
  );
}

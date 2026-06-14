import { useState, useCallback } from "react";
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
import { usePipelineStore, useToastStore } from "../stores";
import { useKeyboard } from "../lib/useKeyboard";
import { ImportRecipeModal } from "./ImportRecipeModal";
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
import { runPipeline, dryRunPipeline } from "../stores/pipelineRunner";
import { api } from "../lib/api";

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

  const handleAddModelInput = useCallback(() => addNode("modelInput"), [addNode]);
  const handleAddAnalyze = useCallback(() => addNode("analyze"), [addNode]);
  const handleAddAbliterate = useCallback(() => addNode("abliterate"), [addNode]);
  const handleAddMerge = useCallback(() => addNode("merge"), [addNode]);
  const handleAddLora = useCallback(() => addNode("lora"), [addNode]);
  const handleAddExport = useCallback(() => addNode("export"), [addNode]);
  const handleAddCompress = useCallback(() => addNode("compress"), [addNode]);

  const handleSave = useCallback(async () => {
    try {
      await saveCurrentProject();
    } catch (err) {
      console.error("Save failed:", err);
    }
  }, [saveCurrentProject]);

  const handleRun = useCallback(async () => {
    if (nodes.length === 0) return;
    try {
      await runPipeline();
    } catch (err) {
      console.error("Pipeline execution failed:", err);
    }
  }, [nodes]);

  const handleDryRun = useCallback(async () => {
    if (nodes.length === 0) return;
    try {
      await dryRunPipeline();
    } catch (err) {
      console.error("Dry run failed:", err);
    }
  }, [nodes]);

  const handleExportRecipe = useCallback(async () => {
    const id = pipelineName.toLowerCase().replace(/\s+/g, "-");
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

  useKeyboard([
    { key: "s", ctrl: true, handler: handleSave },
    { key: "Delete", handler: removeSelectedNode },
    { key: "Backspace", handler: removeSelectedNode },
  ], !showImportModal);

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-2 px-2 sm:px-4 py-2 bg-gray-900 border-b border-gray-700 overflow-x-auto scrollbar-thin">
          <span className="text-xs font-medium text-gray-400 mr-1 shrink-0">Nodes:</span>
          <button onClick={handleAddModelInput} className="shrink-0 px-2 sm:px-3 py-1 text-xs font-medium bg-blue-600 text-gray-100 rounded hover:bg-blue-500">+ Input</button>
          <button onClick={handleAddAnalyze} className="shrink-0 px-2 sm:px-3 py-1 text-xs font-medium bg-yellow-600 text-gray-100 rounded hover:bg-yellow-500">+ Analyze</button>
          <button onClick={handleAddAbliterate} className="shrink-0 px-2 sm:px-3 py-1 text-xs font-medium bg-purple-600 text-gray-100 rounded hover:bg-purple-500">+ Abliterate</button>
          <button onClick={handleAddMerge} className="shrink-0 px-2 sm:px-3 py-1 text-xs font-medium bg-cyan-600 text-gray-100 rounded hover:bg-cyan-500">+ Merge</button>
          <button onClick={handleAddLora} className="shrink-0 px-2 sm:px-3 py-1 text-xs font-medium bg-pink-600 text-gray-100 rounded hover:bg-pink-500">+ LoRA</button>
          <button onClick={handleAddExport} className="shrink-0 px-2 sm:px-3 py-1 text-xs font-medium bg-green-600 text-gray-100 rounded hover:bg-green-500">+ Export</button>
          <button onClick={handleAddCompress} className="shrink-0 px-2 sm:px-3 py-1 text-xs font-medium bg-orange-600 text-gray-100 rounded hover:bg-orange-500">+ Compress</button>
          <div className="hidden sm:block flex-1" />
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <input
              type="text"
              value={pipelineName}
              onChange={(e) => setPipelineName(e.target.value)}
              className="hidden sm:block px-2 py-1 text-xs bg-gray-700 border border-gray-500 rounded text-gray-100 w-28 lg:w-40"
            />
            <button onClick={handleSave} className="px-2 py-1 text-xs font-medium bg-emerald-700 text-gray-200 rounded hover:bg-emerald-600">Save</button>
            <button onClick={handleDryRun} disabled={isRunning || nodes.length === 0} className="px-2 py-1 text-xs font-medium bg-amber-600 text-gray-100 rounded hover:bg-amber-500 disabled:opacity-50">Dry Run</button>
            <button onClick={handleRun} disabled={isRunning || nodes.length === 0} className="px-2 sm:px-4 py-1 text-xs font-medium bg-indigo-600 text-gray-100 rounded hover:bg-indigo-500 disabled:opacity-50">{isRunning ? "Running..." : "Run"}</button>
            <button onClick={handleExportRecipe} disabled={nodes.length === 0} className="hidden lg:inline-block px-2 py-1 text-xs font-medium bg-teal-700 text-gray-200 rounded hover:bg-teal-600 disabled:opacity-50">Export Recipe</button>
            <button onClick={() => setShowImportModal(true)} className="hidden lg:inline-block px-2 py-1 text-xs font-medium bg-teal-700 text-gray-200 rounded hover:bg-teal-600">Import</button>
            <button onClick={clearPipeline} disabled={nodes.length === 0} className="px-2 py-1 text-xs font-medium bg-red-700 text-gray-200 rounded hover:bg-red-600 disabled:opacity-50">Clear</button>
          </div>
        </div>

        <div className="flex-1">
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
            className="bg-gray-800"
          >
            <Background color="#374151" gap={20} />
            <Controls className="!bg-gray-700 !border-gray-600" />
            <MiniMap
              className="!bg-gray-700 !border-gray-600"
              nodeColor="#60a5fa"
            />
          </ReactFlow>
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

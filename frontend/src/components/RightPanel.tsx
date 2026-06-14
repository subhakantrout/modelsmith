import { useViewStore } from "../stores/viewStore";
import { usePipelineStore } from "../stores";
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

const typeToComponent: Record<string, React.ComponentType<PipelineNodeProps>> = {
  modelInput: ModelInputNode,
  analyze: AnalyzeNode,
  abliterate: AbliterateNode,
  merge: MergeNode,
  lora: LoraNode,
  export: ExportNode,
  compress: CompressNode,
};

export function RightPanel() {
  const currentView = useViewStore((s) => s.currentView);
  const selectedNodeId = usePipelineStore((s) => s.selectedNodeId);
  const nodes = usePipelineStore((s) => s.nodes);
  const selectNode = usePipelineStore((s) => s.selectNode);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

  if (currentView !== "canvas" || !selectedNode) return null;

  const NodeComponent = typeToComponent[selectedNode.data.type];

  return (
    <div className="w-[290px] border-l border-gray-800 bg-gray-900/95 overflow-y-auto shrink-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <span className="text-xs font-medium text-gray-200">
          {selectedNode.data.label}
        </span>
        <button
          onClick={() => selectNode(null)}
          className="text-gray-500 hover:text-gray-300 text-lg leading-none"
        >
          ×
        </button>
      </div>
      <div className="p-3">
        {NodeComponent ? (
          <NodeComponent {...({
            id: selectedNode.id,
            data: selectedNode.data,
            type: "pipelineNode",
            selected: false,
            dragging: false,
            zIndex: 0,
            positionAbsoluteX: 0,
            positionAbsoluteY: 0,
            sourcePosition: undefined,
            targetPosition: undefined,
          } as PipelineNodeProps)} />
        ) : (
          <p className="text-xs text-gray-500">Unknown node type</p>
        )}
      </div>
    </div>
  );
}

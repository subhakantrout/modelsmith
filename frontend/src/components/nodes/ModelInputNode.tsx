import { memo, useCallback } from "react";
import type { PipelineNodeProps } from "./types";
import { NodeWrapper } from "./NodeWrapper";
import { useModelStore } from "../../stores";

function ModelInputNodeInner({ data }: PipelineNodeProps) {
  const modelPath = useModelStore((s) => s.modelPath);
  const setModelPath = useModelStore((s) => s.setModelPath);
  const inspectModel = useModelStore((s) => s.inspectModel);
  const loading = useModelStore((s) => s.loading);
  const inspectedModel = useModelStore((s) => s.inspectedModel);

  const handleInspect = useCallback(async () => {
    await inspectModel();
  }, [inspectModel]);

  return (
    <NodeWrapper data={data}>
      <div className="space-y-2">
        <input
          type="text"
          value={modelPath}
          onChange={(e) => setModelPath(e.target.value)}
          placeholder="/path/to/model.gguf"
          className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-500 rounded text-gray-100 placeholder-gray-400"
        />
        <button
          onClick={handleInspect}
          disabled={loading || !modelPath}
          className="w-full px-2 py-1 text-xs font-medium text-gray-900 bg-blue-500 rounded hover:bg-blue-400 disabled:opacity-50"
        >
          {loading ? "Inspecting..." : "Inspect Model"}
        </button>
        {inspectedModel && (
          <div className="text-xs text-gray-300">
            <p>Size: {inspectedModel.size_gb} GB</p>
            <p>Format: {inspectedModel.format}</p>
            <p className={inspectedModel.valid ? "text-green-400" : "text-red-400"}>
              {inspectedModel.valid ? "Valid" : "Invalid"}
            </p>
          </div>
        )}
      </div>
    </NodeWrapper>
  );
}

export const ModelInputNode = memo(ModelInputNodeInner);

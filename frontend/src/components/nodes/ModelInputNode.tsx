import { memo, useCallback, useState, useEffect } from "react";
import type { PipelineNodeProps } from "./types";
import { NodeWrapper } from "./NodeWrapper";
import { useModelStore, usePipelineStore } from "../../stores";
import { ModelBrowser } from "../ModelBrowser";
import { FolderOpen } from "lucide-react";

function ModelInputNodeInner({ id, data }: PipelineNodeProps) {
  const modelPath = useModelStore((s) => s.modelPath);
  const setModelPath = useModelStore((s) => s.setModelPath);
  const inspectModel = useModelStore((s) => s.inspectModel);
  const updateNodeConfig = usePipelineStore((s) => s.updateNodeConfig);

  useEffect(() => {
    updateNodeConfig(id, { path: modelPath });
  }, [id, modelPath, updateNodeConfig]);
  const loading = useModelStore((s) => s.loading);
  const inspectedModel = useModelStore((s) => s.inspectedModel);
  const [browserOpen, setBrowserOpen] = useState(false);

  const handleInspect = useCallback(async () => {
    await inspectModel();
  }, [inspectModel]);

  const handleSelectModel = useCallback((path: string) => {
    setModelPath(path);
  }, [setModelPath]);

  return (
    <NodeWrapper data={data} nodeId={id}>
      <div className="space-y-2">
        <div className="flex gap-1">
          <input
            type="text"
            value={modelPath}
            onChange={(e) => setModelPath(e.target.value)}
            placeholder="/path/to/model.gguf"
            className="flex-1 px-2 py-1 text-sm bg-gray-700 border border-gray-500 rounded text-gray-100 placeholder-gray-400"
          />
          <button
            onClick={() => setBrowserOpen(true)}
            className="px-2 py-1 text-xs bg-gray-600 text-gray-300 rounded hover:bg-gray-500 flex items-center"
            title="Browse models"
          >
            <FolderOpen size={14} />
          </button>
        </div>
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
      {browserOpen && (
        <ModelBrowser
          onSelect={handleSelectModel}
          onClose={() => setBrowserOpen(false)}
        />
      )}
    </NodeWrapper>
  );
}

export const ModelInputNode = memo(ModelInputNodeInner);

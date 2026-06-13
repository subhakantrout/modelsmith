import { memo, useState, useCallback } from "react";
import type { PipelineNodeProps } from "./types";
import { NodeWrapper } from "./NodeWrapper";
import { api } from "../../lib/api";

function LoraNodeInner({ data }: PipelineNodeProps) {
  const [adapterPath, setAdapterPath] = useState("");
  const [action, setAction] = useState<"apply" | "fuse" | "extract">("apply");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleAction = useCallback(async () => {
    setLoading(true);
    try {
      let res: any;
      if (action === "apply") {
        res = await api.lora.apply(adapterPath);
      } else if (action === "fuse") {
        res = await api.lora.fuse();
      } else if (action === "extract") {
        res = await api.lora.extract("/tmp/lora-extract");
      }
      setResult(res);
    } catch (err) {
      console.error(err);
      setResult({ error: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }, [action, adapterPath]);

  return (
    <NodeWrapper data={data}>
      <div className="space-y-2">
        <select
          value={action}
          onChange={(e) => setAction(e.target.value as any)}
          className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-500 rounded text-gray-100"
        >
          <option value="apply">Apply Adapter</option>
          <option value="fuse">Fuse into Model</option>
          <option value="extract">Extract LoRA</option>
        </select>
        {action === "apply" && (
          <input
            type="text"
            value={adapterPath}
            onChange={(e) => setAdapterPath(e.target.value)}
            placeholder="/path/to/adapter"
            className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-500 rounded text-gray-100 placeholder-gray-400"
          />
        )}
        <button
          onClick={handleAction}
          disabled={loading || (action === "apply" && !adapterPath)}
          className="w-full px-2 py-1 text-xs font-medium text-gray-900 bg-pink-500 rounded hover:bg-pink-400 disabled:opacity-50"
        >
          {loading ? "Running..." : action === "apply" ? "Apply" : action === "fuse" ? "Fuse" : "Extract"}
        </button>
        {result && (
          <div className="text-xs text-gray-300">
            {result.error ? (
              <p className="text-red-400">{result.error}</p>
            ) : (
              <p className="text-green-400">{result.status}</p>
            )}
            {result.files && (
              <p>Files: {(result.files as string[]).length}</p>
            )}
          </div>
        )}
      </div>
    </NodeWrapper>
  );
}

export const LoraNode = memo(LoraNodeInner);

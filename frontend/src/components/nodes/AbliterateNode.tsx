import { memo, useState, useCallback, useEffect } from "react";
import type { PipelineNodeProps } from "./types";
import { NodeWrapper } from "./NodeWrapper";
import { api } from "../../lib/api";
import { usePipelineStore } from "../../stores";
import type { AbliterateResult } from "../../types/api";

function AbliterateNodeInner({ id, data }: PipelineNodeProps) {
  const [method, setMethod] = useState("direction_ablation");
  const updateNodeConfig = usePipelineStore((s) => s.updateNodeConfig);

  useEffect(() => {
    updateNodeConfig(id, { method });
  }, [id, method, updateNodeConfig]);
  const [result, setResult] = useState<AbliterateResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleValidate = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.abliterate.validate({
        model_path: data.config.modelPath as string || "/path/to/model",
        method,
        model_size_gb: data.config.modelSizeGb as number || 7,
      });
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [method, data.config]);

  return (
    <NodeWrapper data={data}>
      <div className="space-y-2">
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-500 rounded text-gray-100"
        >
          <option value="direction_ablation">Direction Ablation</option>
          <option value="weight_pruning">Weight Pruning</option>
        </select>
        <button
          onClick={handleValidate}
          disabled={loading}
          className="w-full px-2 py-1 text-xs font-medium text-gray-900 bg-purple-500 rounded hover:bg-purple-400 disabled:opacity-50"
        >
          {loading ? "Validating..." : "Validate"}
        </button>
        {result && (
          <div className="text-xs text-gray-300">
            {result.validation.valid ? (
              <p className="text-green-400">Valid configuration</p>
            ) : (
              <p className="text-red-400">{result.validation.error}</p>
            )}
            {result.estimate && (
              <p>Est. time: {result.estimate.estimated_minutes} min</p>
            )}
          </div>
        )}
      </div>
    </NodeWrapper>
  );
}

export const AbliterateNode = memo(AbliterateNodeInner);

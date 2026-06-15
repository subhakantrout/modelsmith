import { memo, useState, useCallback, useEffect } from "react";
import type { PipelineNodeProps } from "./types";
import { NodeWrapper } from "./NodeWrapper";
import { api } from "../../lib/api";
import { usePipelineStore } from "../../stores";
import type { AbliterateResult } from "../../types/api";
import { GridSearchPanel } from "../GridSearchPanel";
import { ABTestPanel } from "../ABTestPanel";

function AbliterateNodeInner({ id, data }: PipelineNodeProps) {
  const [method, setMethod] = useState("direction_ablation");
  const [showGridSearch, setShowGridSearch] = useState(false);
  const [showABTest, setShowABTest] = useState(false);
  const [abResults, setAbResults] = useState<any[]>([]);
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

  const handleGridResults = useCallback((results: any[]) => {
    setAbResults(results);
    setShowGridSearch(false);
    setShowABTest(true);
  }, []);

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
        <button
          onClick={() => setShowGridSearch(true)}
          className="w-full px-2 py-1 text-xs font-medium text-gray-100 bg-indigo-600 rounded hover:bg-indigo-500 flex items-center justify-center gap-1"
        >
          Auto Grid Search
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

      {showGridSearch && (
        <GridSearchPanel onClose={() => setShowGridSearch(false)} onResults={handleGridResults} />
      )}

      {showABTest && abResults.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowABTest(false)}>
          <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-xl max-h-[80vh] overflow-y-auto p-4" onClick={(e) => e.stopPropagation()}>
            <ABTestPanel results={abResults} onClose={() => setShowABTest(false)} />
          </div>
        </div>
      )}
    </NodeWrapper>
  );
}

export const AbliterateNode = memo(AbliterateNodeInner);

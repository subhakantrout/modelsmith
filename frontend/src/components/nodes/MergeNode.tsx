import { memo, useState, useCallback, useEffect } from "react";
import type { PipelineNodeProps } from "./types";
import { NodeWrapper } from "./NodeWrapper";
import { api } from "../../lib/api";
import { usePipelineStore } from "../../stores";

function MergeNodeInner({ id, data }: PipelineNodeProps) {
  const [method, setMethod] = useState("ties");
  const [modelPath1, setModelPath1] = useState("");
  const [modelPath2, setModelPath2] = useState("");
  const updateNodeConfig = usePipelineStore((s) => s.updateNodeConfig);

  useEffect(() => {
    updateNodeConfig(id, { method, modelPath1, modelPath2 });
  }, [id, method, modelPath1, modelPath2, updateNodeConfig]);
  const [methods, setMethods] = useState<{ id: string; name: string }[]>([]);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.merge.methods().then((r: any) => setMethods(r.methods)).catch(() => {});
  }, []);

  const handleValidate = useCallback(async () => {
    if (!modelPath1 || !modelPath2) return;
    setLoading(true);
    try {
      const res = await api.merge.validate(method, [
        { path: modelPath1, size_gb: 7 },
        { path: modelPath2, size_gb: 7 },
      ]);
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [method, modelPath1, modelPath2]);

  return (
    <NodeWrapper data={data}>
      <div className="space-y-2">
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-500 rounded text-gray-100"
        >
          {methods.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        <input
          type="text"
          value={modelPath1}
          onChange={(e) => setModelPath1(e.target.value)}
          placeholder="First model path"
          className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-500 rounded text-gray-100 placeholder-gray-400"
        />
        <input
          type="text"
          value={modelPath2}
          onChange={(e) => setModelPath2(e.target.value)}
          placeholder="Second model path"
          className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-500 rounded text-gray-100 placeholder-gray-400"
        />
        <button
          onClick={handleValidate}
          disabled={loading || !modelPath1 || !modelPath2}
          className="w-full px-2 py-1 text-xs font-medium text-gray-900 bg-cyan-500 rounded hover:bg-cyan-400 disabled:opacity-50"
        >
          {loading ? "Validating..." : "Validate Merge"}
        </button>
        {result && (
          <div className="text-xs text-gray-300 space-y-1">
            {result.config?.feasible ? (
              <p className="text-green-400">Feasible ({result.config.estimated_output_gb}GB output)</p>
            ) : (
              <p className="text-red-400">Infeasible configuration</p>
            )}
            {result.ram_estimate && (
              <p>Peak RAM: ~{result.ram_estimate.estimated_peak_ram_gb}GB</p>
            )}
          </div>
        )}
      </div>
    </NodeWrapper>
  );
}

export const MergeNode = memo(MergeNodeInner);

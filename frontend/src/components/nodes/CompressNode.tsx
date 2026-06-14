import { memo, useState, useCallback, useEffect } from "react";
import type { PipelineNodeProps } from "./types";
import { NodeWrapper } from "./NodeWrapper";
import { usePipelineStore } from "../../stores";
import { Shrink, Gauge, Layers, Database } from "lucide-react";

const QUANT_OPTIONS = [
  { label: "Q4_K_M", value: "q4_k_m" },
  { label: "Q5_0", value: "q5_0" },
  { label: "Q5_K_M", value: "q5_k_m" },
  { label: "Q6_K", value: "q6_k" },
  { label: "Q8_0", value: "q8_0" },
  { label: "Q3_K_M", value: "q3_k_m" },
  { label: "Q2_K", value: "q2_k" },
];

const PRUNE_OPTIONS = [
  { label: "Light", value: "light" },
  { label: "Medium", value: "medium" },
  { label: "Heavy", value: "heavy" },
];

const KV_OPTIONS = [
  { label: "None", value: "none" },
  { label: "TurboQuant (4-bit)", value: "turboquant" },
  { label: "KVQuant (3-bit)", value: "kvquant" },
  { label: "PCA", value: "pca" },
];

const SPARSIFY_OPTIONS = [
  { label: "Magnitude Pruning", value: "magnitude" },
  { label: "Structured Sparsity", value: "structured" },
  { label: "SNIP", value: "snip" },
  { label: "RigL", value: "rigl" },
];

function CompressNodeInner({ id, data }: PipelineNodeProps) {
  const [quant, setQuant] = useState("q4_k_m");
  const [prune, setPrune] = useState("light");
  const [kv, setKv] = useState("none");
  const [sparsify, setSparsify] = useState("none");
  const [savings, setSavings] = useState<string | null>(null);
  const updateNodeConfig = usePipelineStore((s) => s.updateNodeConfig);

  useEffect(() => {
    updateNodeConfig(id, { quant, prune, kv, sparsify });
  }, [id, quant, prune, kv, sparsify, updateNodeConfig]);

  const handleEstimate = useCallback(() => {
    const baseGb = 7;
    const quantMap: Record<string, number> = { q4_k_m: 0.55, q5_0: 0.53, q5_k_m: 0.45, q6_k: 0.35, q8_0: 0.2, q3_k_m: 0.65, q2_k: 0.75 };
    const pruneMap: Record<string, number> = { light: 0.1, medium: 0.25, heavy: 0.4 };
    const kvMap: Record<string, number> = { turboquant: 0.05, kvquant: 0.07, pca: 0.08, none: 0 };
    const sparsifyMap: Record<string, number> = { magnitude: 0.3, structured: 0.4, snip: 0.35, rigl: 0.4, none: 0 };
    const total = baseGb * (quantMap[quant] + pruneMap[prune] + kvMap[kv] + sparsifyMap[sparsify]);
    setSavings(`~${total.toFixed(1)} GB estimated VRAM savings`);
  }, [quant, prune, kv, sparsify]);

  return (
    <NodeWrapper data={data}>
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Gauge size={13} className="text-orange-400" />
          <span className="text-gray-300 font-medium">GGUF Quantization</span>
        </div>
        <select
          value={quant}
          onChange={(e) => setQuant(e.target.value)}
          className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-500 rounded text-gray-100"
        >
          {QUANT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <div className="flex items-center gap-1.5 text-xs text-gray-400 pt-1">
          <Layers size={13} className="text-orange-400" />
          <span className="text-gray-300 font-medium">Layer Pruning</span>
        </div>
        <select
          value={prune}
          onChange={(e) => setPrune(e.target.value)}
          className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-500 rounded text-gray-100"
        >
          {PRUNE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <div className="flex items-center gap-1.5 text-xs text-gray-400 pt-1">
          <Layers size={13} className="text-orange-400" />
          <span className="text-gray-300 font-medium">Sparsification</span>
        </div>
        <select
          value={sparsify}
          onChange={(e) => setSparsify(e.target.value)}
          className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-500 rounded text-gray-100"
        >
          <option value="none">None</option>
          {SPARSIFY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <div className="flex items-center gap-1.5 text-xs text-gray-400 pt-1">
          <Database size={13} className="text-orange-400" />
          <span className="text-gray-300 font-medium">KV Cache</span>
        </div>
        <select
          value={kv}
          onChange={(e) => setKv(e.target.value)}
          className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-500 rounded text-gray-100"
        >
          {KV_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <button
          onClick={handleEstimate}
          className="w-full px-2 py-1 text-xs font-medium text-gray-900 bg-orange-500 rounded hover:bg-orange-400"
        >
          Estimate VRAM Savings
        </button>
        {savings && (
          <div className="flex items-center gap-1.5 text-xs text-green-400">
            <Shrink size={13} />
            <span>{savings}</span>
          </div>
        )}
      </div>
    </NodeWrapper>
  );
}

export const CompressNode = memo(CompressNodeInner);

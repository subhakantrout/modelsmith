import { useEffect, useState } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
} from "recharts";
import { usePipelineStore, useModelStore, useSystemStore } from "../stores";
import { api } from "../lib/api";
import type { ModelRegistryItem } from "../types/api";

interface DashboardProps {
  onOpenCanvas: () => void;
}

const CAPABILITY_DATA = [
  { metric: "Safety", value: 65 },
  { metric: "Speed", value: 80 },
  { metric: "Quality", value: 75 },
  { metric: "Compression", value: 40 },
  { metric: "Mergeability", value: 55 },
];

const TIER_COLORS: Record<number, string> = {
  1: "text-gray-400", 2: "text-cyan-400", 3: "text-yellow-400",
  4: "text-orange-400", 5: "text-red-400",
};

function getHeatColor(score: number): string {
  if (score > 0.7) return "bg-red-500";
  if (score > 0.4) return "bg-yellow-500";
  if (score > 0.2) return "bg-blue-500";
  return "bg-green-500";
}

export function Dashboard({ onOpenCanvas }: DashboardProps) {
  const nodes = usePipelineStore((s) => s.nodes);
  const clearPipeline = usePipelineStore((s) => s.clearPipeline);
  const inspectedModel = useModelStore((s) => s.inspectedModel);
  const systemInfo = useSystemStore((s) => s.info);
  const [models, setModels] = useState<ModelRegistryItem[]>([]);
  const [layerData, setLayerData] = useState<any>(null);
  const [compareModelA, setCompareModelA] = useState("");
  const [compareModelB, setCompareModelB] = useState("");
  const [compareResult, setCompareResult] = useState<any>(null);

  useEffect(() => {
    api.models.registry().then((r: any) => setModels(r.models)).catch(() => {});
    api.analyze.layers().then(setLayerData).catch(() => {});
  }, []);

  const modelLoaded = inspectedModel !== null;
  const ramGb = systemInfo?.specs.ram_total_gb ?? 0;
  const vramGb = systemInfo?.specs.gpu_vram_gb;
  const tier = systemInfo?.tier ?? 0;

  const barData = models.slice(0, 8).map((m) => ({
    name: m.name.length > 15 ? m.name.slice(0, 14) + "…" : m.name,
    size: m.size_gb,
  }));

  const handleCompare = async () => {
    if (!compareModelA || !compareModelB) return;
    const a = models.find((m) => m.path === compareModelA);
    const b = models.find((m) => m.path === compareModelB);
    if (!a || !b) return;
    const result = await api.advisor.compare(a, b);
    setCompareResult(result);
  };

  return (
    <div className="h-screen w-screen bg-gray-900 text-gray-100 flex flex-col">
      <div className="flex items-center px-4 py-2 bg-gray-950 border-b border-gray-700">
        <h1 className="text-lg font-bold text-blue-400">ModelSmith</h1>
        <span className={`ml-3 text-xs font-mono ${TIER_COLORS[tier] || "text-gray-500"}`}>
          Tier {tier}
        </span>
        <div className="flex-1" />
        <button onClick={onOpenCanvas} className="px-4 py-1 text-xs font-medium bg-blue-600 text-gray-100 rounded hover:bg-blue-500">
          Open Canvas
        </button>
      </div>

      <div className="flex-1 p-6 max-w-5xl mx-auto w-full space-y-6 overflow-y-auto">
        <h2 className="text-xl font-semibold text-gray-200">Dashboard</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-400">{nodes.length}</div>
            <div className="text-xs text-gray-400 mt-1">Pipeline Nodes</div>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-400">
              {inspectedModel ? `${inspectedModel.size_gb}GB` : "—"}
            </div>
            <div className="text-xs text-gray-400 mt-1">Model Size</div>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-400">{inspectedModel?.format || "—"}</div>
            <div className="text-xs text-gray-400 mt-1">Format</div>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="text-lg font-bold text-gray-200">{ramGb} GB RAM / {vramGb ? `${vramGb} GB VRAM` : "No GPU"}</div>
            <div className="text-xs text-gray-400 mt-1">System Resources</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Model Capabilities</h3>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={CAPABILITY_DATA}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: "#9CA3AF", fontSize: 11 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
                <Radar dataKey="value" stroke="#60A5FA" fill="#60A5FA" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3">
              Local Models {models.length > 0 && <span className="text-gray-500">({models.length} found)</span>}
            </h3>
            {models.length === 0 ? (
              <p className="text-xs text-gray-500 italic">Scanning common directories…</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData} layout="vertical" margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
                  <XAxis type="number" tick={{ fill: "#9CA3AF", fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fill: "#9CA3AF", fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151", borderRadius: "6px", fontSize: "12px" }}
                    formatter={(value: any) => [`${value} GB`, "Size"]} />
                  <Bar dataKey="size" radius={[0, 3, 3, 0]}>
                    {barData.map((_, i) => <Cell key={i} fill={i % 2 === 0 ? "#3B82F6" : "#6366F1"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {layerData && layerData.layers?.length > 0 && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-2">
              Layer Activation Heatmap
              <span className="text-gray-500 ml-2">({layerData.total_layers} layers, {layerData.critical_layers} critical)</span>
            </h3>
            <div className="flex flex-wrap gap-1">
              {layerData.layers.slice(0, 100).map((layer: any) => (
                <div
                  key={layer.index}
                  className={`w-3 h-3 rounded-sm ${getHeatColor(layer.refusal_score)}`}
                  title={`Layer ${layer.index}: refusal=${layer.refusal_score}, activation=${layer.activation_mean}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-green-500" /> Low</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-blue-500" /> Med</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-yellow-500" /> High</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500" /> Critical</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Model Status</h3>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Loaded</span>
                <span className={modelLoaded ? "text-green-400" : "text-gray-500"}>{modelLoaded ? "Yes" : "No"}</span>
              </div>
              {inspectedModel && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Path</span>
                    <span className="text-gray-200 truncate ml-2 max-w-[200px]">{inspectedModel.path}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Filename</span>
                    <span className="text-gray-200">{inspectedModel.filename}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Valid</span>
                    <span className={inspectedModel.valid ? "text-green-400" : "text-red-400"}>{inspectedModel.valid ? "Yes" : "No"}</span>
                  </div>
                </>
              )}
              {!inspectedModel && <p className="text-gray-500 italic pt-2">No model loaded. Load one from the canvas.</p>}
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Compare Models</h3>
            <div className="space-y-2 text-xs">
              <select value={compareModelA} onChange={(e) => setCompareModelA(e.target.value)}
                className="w-full px-2 py-1 bg-gray-700 border border-gray-500 rounded text-gray-100">
                <option value="">Select model A…</option>
                {models.map((m) => <option key={m.path} value={m.path}>{m.name} ({m.size_gb}GB)</option>)}
              </select>
              <select value={compareModelB} onChange={(e) => setCompareModelB(e.target.value)}
                className="w-full px-2 py-1 bg-gray-700 border border-gray-500 rounded text-gray-100">
                <option value="">Select model B…</option>
                {models.map((m) => <option key={m.path} value={m.path}>{m.name} ({m.size_gb}GB)</option>)}
              </select>
              <button onClick={handleCompare} disabled={!compareModelA || !compareModelB}
                className="w-full px-3 py-1 text-xs font-medium bg-indigo-600 text-gray-100 rounded hover:bg-indigo-500 disabled:opacity-50">
                Compare
              </button>
              {compareResult && (
                <div className="bg-gray-700 rounded p-2 space-y-1">
                  <div className="flex justify-between"><span>A size</span><span>{compareResult.model_a.size_gb} GB</span></div>
                  <div className="flex justify-between"><span>B size</span><span>{compareResult.model_b.size_gb} GB</span></div>
                  <div className="flex justify-between"><span>Size delta</span><span>{compareResult.differences.size_delta_gb} GB</span></div>
                  <div className="flex justify-between"><span>Same format</span><span>{compareResult.differences.same_format ? "Yes" : "No"}</span></div>
                  <div className="flex justify-between"><span>A efficiency</span><span>{compareResult.model_a.efficiency_score}/100</span></div>
                  <div className="flex justify-between"><span>B efficiency</span><span>{compareResult.model_b.efficiency_score}/100</span></div>
                </div>
              )}
            </div>
          </div>
        </div>

        {nodes.length > 0 && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Pipeline Steps</h3>
            <div className="space-y-1">
              {nodes.map((node, idx) => (
                <div key={node.id} className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="text-gray-500">{idx + 1}.</span>
                  <span className="text-gray-200">{node.data.label}</span>
                  <span className={`ml-auto ${node.data.status === "done" ? "text-green-400" : node.data.status === "error" ? "text-red-400" : node.data.status === "running" ? "text-blue-400" : "text-gray-500"}`}>
                    {node.data.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {nodes.length > 0 && (
          <button onClick={clearPipeline} className="px-4 py-2 text-xs font-medium bg-red-700 text-gray-200 rounded hover:bg-red-600">
            Clear Pipeline
          </button>
        )}
      </div>
    </div>
  );
}

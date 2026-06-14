import { useEffect, useState } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
} from "recharts";
import { usePipelineStore, useModelStore, useSystemStore, useDownloadStore } from "../stores";
import { api } from "../lib/api";
import type { ModelRegistryItem } from "../types/api";
import { HubSearch } from "./HubSearch";
import { Skeleton } from "./Skeleton";
import {
  Layers, Cpu, HardDrive, Radio, GitMerge,
  Activity, AlertTriangle, CheckCircle, Zap, FileText,
  Box, Search, Download,
} from "lucide-react";

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


const TIER_BG: Record<number, string> = {
  1: "bg-gray-500/20 border-gray-500/30",
  2: "bg-cyan-500/10 border-cyan-500/30",
  3: "bg-yellow-500/10 border-yellow-500/30",
  4: "bg-orange-500/10 border-orange-500/30",
  5: "bg-red-500/10 border-red-500/30",
};

function getHeatColor(score: number): string {
  if (score > 0.7) return "bg-red-500";
  if (score > 0.4) return "bg-yellow-500";
  if (score > 0.2) return "bg-blue-500";
  return "bg-green-500";
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: any; label: string; value: string; sub?: string; color: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-700/40 bg-gradient-to-br from-gray-800/80 to-gray-900/80 p-4 hover:shadow-lg hover:shadow-black/20 hover:border-gray-600/60 transition-all duration-200 group">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-2xl font-bold tracking-tight text-gray-100">{value}</div>
          <div className="text-[11px] text-gray-500 mt-0.5">{label}</div>
          {sub && <div className="text-[10px] text-gray-600 mt-1">{sub}</div>}
        </div>
        <div className={`p-2 rounded-lg ${color} bg-opacity-20 group-hover:scale-110 transition-transform`}>
          <Icon size={18} className="opacity-80" />
        </div>
      </div>
    </div>
  );
}

export function Dashboard({ onOpenCanvas }: DashboardProps) {
  const nodes = usePipelineStore((s) => s.nodes);
  const clearPipeline = usePipelineStore((s) => s.clearPipeline);
  const inspectedModel = useModelStore((s) => s.inspectedModel);
  const systemInfo = useSystemStore((s) => s.info);
  const { hubSearchOpen, setHubSearchOpen } = useDownloadStore();
  const [models, setModels] = useState<ModelRegistryItem[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [layerData, setLayerData] = useState<any>(null);
  const [layerDataLoading, setLayerDataLoading] = useState(true);
  const [compareModelA, setCompareModelA] = useState("");
  const [compareModelB, setCompareModelB] = useState("");
  const [compareResult, setCompareResult] = useState<any>(null);

  useEffect(() => {
    api.models.registry().then((r: any) => { setModels(r.models); setModelsLoading(false); }).catch(() => setModelsLoading(false));
    api.analyze.layers().then((d) => { setLayerData(d); setLayerDataLoading(false); }).catch(() => setLayerDataLoading(false));
  }, []);

  const modelLoaded = inspectedModel !== null;
  const ramGb = systemInfo?.specs.ram_total_gb ?? 0;
  const vramGb = systemInfo?.specs.gpu_vram_gb;
  const tier = systemInfo?.tier ?? 0;

  const barData = models.slice(0, 8).map((m) => ({
    name: m.name.length > 14 ? m.name.slice(0, 13) + "…" : m.name,
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
    <div className="h-screen w-screen bg-gray-925 text-gray-100 flex flex-col overflow-hidden">
      {/* ── Header ── */}
      <header className="shrink-0 flex items-center px-5 py-2.5 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800/60">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-900/30">
            <Zap size={14} className="text-white" />
          </div>
          <span className="text-sm font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            ModelSmith
          </span>
          <span className={`ml-1 text-[10px] font-mono px-1.5 py-0.5 rounded border ${TIER_BG[tier] || "bg-gray-700/30 border-gray-600/30 text-gray-500"}`}>
            T{tier}
          </span>
        </div>
        <div className="flex-1" />
        <nav className="flex items-center gap-1.5">
          <button
            onClick={() => setHubSearchOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium bg-gradient-to-r from-indigo-600/80 to-indigo-500/80 text-gray-100 rounded-lg hover:from-indigo-500 hover:to-indigo-400 transition-all shadow-lg shadow-indigo-900/20"
          >
            <Download size={12} /> Hub
          </button>
          <button
            onClick={onOpenCanvas}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium bg-gradient-to-r from-blue-600/80 to-blue-500/80 text-gray-100 rounded-lg hover:from-blue-500 hover:to-blue-400 transition-all shadow-lg shadow-blue-900/20"
          >
            <Box size={12} /> Canvas
          </button>
        </nav>
      </header>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto px-5 py-5">
        <div className="max-w-5xl mx-auto space-y-5">

          {/* Welcome row */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-100">Dashboard</h1>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {models.length} local model{models.length !== 1 ? "s" : ""}
                {nodes.length > 0 && ` · ${nodes.length} pipeline step${nodes.length !== 1 ? "s" : ""}`}
                {systemInfo?.specs.gpu_name && ` · ${systemInfo.specs.gpu_name}`}
              </p>
            </div>
          </div>

          {/* ── Stats row ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={Box} label="Pipeline Nodes" value={String(nodes.length)} color="bg-blue-500/20 text-blue-400" />
            <StatCard icon={HardDrive} label="Model Size" value={inspectedModel ? `${inspectedModel.size_gb}GB` : "—"} color="bg-green-500/20 text-green-400" />
            <StatCard icon={FileText} label="Format" value={inspectedModel?.format || "—"} color="bg-purple-500/20 text-purple-400" />
            <StatCard
              icon={Cpu}
              label="System"
              value={`${ramGb}GB`}
              sub={vramGb ? `${vramGb}GB VRAM` : "No GPU"}
              color="bg-amber-500/20 text-amber-400"
            />
          </div>

          {/* ── Charts row ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-gray-700/30 bg-gradient-to-br from-gray-800/60 to-gray-900/60 p-4 hover:shadow-lg hover:shadow-black/10 transition-shadow">
              <h3 className="text-xs font-semibold text-gray-300 mb-3 flex items-center gap-1.5">
                <Activity size={13} className="text-blue-400" /> Model Capabilities
              </h3>
              <ResponsiveContainer width="100%" height={210}>
                <RadarChart data={CAPABILITY_DATA}>
                  <PolarGrid stroke="#374151" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: "#9CA3AF", fontSize: 11 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
                  <Radar dataKey="value" stroke="#60A5FA" fill="#60A5FA" fillOpacity={0.25} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-xl border border-gray-700/30 bg-gradient-to-br from-gray-800/60 to-gray-900/60 p-4 hover:shadow-lg hover:shadow-black/10 transition-shadow">
              <h3 className="text-xs font-semibold text-gray-300 mb-3 flex items-center gap-1.5">
                <HardDrive size={13} className="text-green-400" />
                Local Models
                {models.length > 0 && <span className="text-gray-600 font-normal">({models.length})</span>}
              </h3>
              {modelsLoading ? (
                <div className="flex items-center justify-center h-[210px]">
                  <Skeleton className="w-full h-[180px]" />
                </div>
              ) : models.length === 0 ? (
                <div className="flex items-center justify-center h-[210px] text-xs text-gray-600 italic">
                  <div className="text-center space-y-2">
                    <Download size={24} className="mx-auto text-gray-700" />
                    <p>No models found</p>
                    <button
                      onClick={() => setHubSearchOpen(true)}
                      className="px-3 py-1.5 text-[11px] bg-indigo-600/80 text-gray-100 rounded-lg hover:bg-indigo-500 transition-colors inline-flex items-center gap-1"
                    >
                      <Search size={10} /> Search Hub
                    </button>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart data={barData} layout="vertical" margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
                    <XAxis type="number" tick={{ fill: "#9CA3AF", fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" width={90} tick={{ fill: "#9CA3AF", fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151", borderRadius: "8px", fontSize: "12px" }}
                      formatter={(value: any) => [`${value} GB`, "Size"]}
                    />
                    <Bar dataKey="size" radius={[0, 3, 3, 0]}>
                      {barData.map((_, i) => <Cell key={i} fill={i % 2 === 0 ? "#3B82F6" : "#6366F1"} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* ── Layer Heatmap ── */}
          {layerDataLoading ? (
            <div className="rounded-xl border border-gray-700/30 bg-gradient-to-br from-gray-800/60 to-gray-900/60 p-4">
              <Skeleton className="w-48 h-4 mb-3" />
              <Skeleton className="w-full h-24" />
            </div>
          ) : layerData && layerData.layers?.length > 0 && (
            <div className="rounded-xl border border-gray-700/30 bg-gradient-to-br from-gray-800/60 to-gray-900/60 p-4 hover:shadow-lg hover:shadow-black/10 transition-shadow">
              <h3 className="text-xs font-semibold text-gray-300 mb-3 flex items-center gap-1.5">
                <Layers size={13} className="text-purple-400" />
                Layer Activation Heatmap
                <span className="text-gray-600 font-normal">({layerData.total_layers} layers, {layerData.critical_layers} critical)</span>
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
              <div className="flex items-center gap-3 mt-2.5 text-[10px] text-gray-500">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-green-500" /> Low</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-blue-500" /> Med</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-yellow-500" /> High</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500" /> Critical</span>
              </div>
            </div>
          )}

          {/* ── Bottom grid ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-gray-700/30 bg-gradient-to-br from-gray-800/60 to-gray-900/60 p-4 hover:shadow-lg hover:shadow-black/10 transition-shadow">
              <h3 className="text-xs font-semibold text-gray-300 mb-3 flex items-center gap-1.5">
                <CheckCircle size={13} className="text-green-400" /> Model Status
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1.5 border-b border-gray-700/20">
                  <span className="text-gray-500">Loaded</span>
                  <span className={modelLoaded ? "text-green-400 font-medium" : "text-gray-600"}>{modelLoaded ? "Yes" : "No"}</span>
                </div>
                {inspectedModel && (
                  <>
                    <div className="flex justify-between items-center py-1.5 border-b border-gray-700/20">
                      <span className="text-gray-500">Path</span>
                      <span className="text-gray-300 truncate ml-4 max-w-[220px] text-right">{inspectedModel.path}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-gray-700/20">
                      <span className="text-gray-500">File</span>
                      <span className="text-gray-300">{inspectedModel.filename}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5">
                      <span className="text-gray-500">Valid</span>
                      <span className={inspectedModel.valid ? "text-green-400" : "text-red-400"}>{inspectedModel.valid ? "Yes" : "No"}</span>
                    </div>
                  </>
                )}
                {!inspectedModel && <p className="text-gray-600 italic pt-2">No model loaded. Load one from the Canvas.</p>}
              </div>
            </div>

            <div className="rounded-xl border border-gray-700/30 bg-gradient-to-br from-gray-800/60 to-gray-900/60 p-4 hover:shadow-lg hover:shadow-black/10 transition-shadow">
              <h3 className="text-xs font-semibold text-gray-300 mb-3 flex items-center gap-1.5">
                <GitMerge size={13} className="text-indigo-400" /> Compare Models
              </h3>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <select value={compareModelA} onChange={(e) => setCompareModelA(e.target.value)}
                    className="px-2 py-1.5 text-xs bg-gray-800 border border-gray-600/50 rounded-lg text-gray-200 focus:outline-none focus:border-blue-500/50">
                    <option value="">Model A…</option>
                    {models.map((m) => <option key={m.path} value={m.path}>{m.name}</option>)}
                  </select>
                  <select value={compareModelB} onChange={(e) => setCompareModelB(e.target.value)}
                    className="px-2 py-1.5 text-xs bg-gray-800 border border-gray-600/50 rounded-lg text-gray-200 focus:outline-none focus:border-blue-500/50">
                    <option value="">Model B…</option>
                    {models.map((m) => <option key={m.path} value={m.path}>{m.name}</option>)}
                  </select>
                </div>
                <button onClick={handleCompare} disabled={!compareModelA || !compareModelB}
                  className="w-full py-1.5 text-xs font-medium bg-gradient-to-r from-indigo-600 to-indigo-500 text-gray-100 rounded-lg hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 transition-all flex items-center justify-center gap-1">
                  <GitMerge size={11} /> Compare
                </button>
                {compareResult && (
                  <div className="bg-gray-800/60 rounded-lg p-2.5 space-y-1.5 text-xs border border-gray-700/30">
                    <div className="flex justify-between"><span className="text-gray-500">A size</span><span>{compareResult.model_a.size_gb} GB</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">B size</span><span>{compareResult.model_b.size_gb} GB</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Delta</span><span>{compareResult.differences.size_delta_gb} GB</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Same format</span><span>{compareResult.differences.same_format ? "Yes" : "No"}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">A efficiency</span><span>{compareResult.model_a.efficiency_score}/100</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">B efficiency</span><span>{compareResult.model_b.efficiency_score}/100</span></div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Pipeline Steps ── */}
          {nodes.length > 0 && (
            <div className="rounded-xl border border-gray-700/30 bg-gradient-to-br from-gray-800/60 to-gray-900/60 p-4 hover:shadow-lg hover:shadow-black/10 transition-shadow">
              <h3 className="text-xs font-semibold text-gray-300 mb-3 flex items-center gap-1.5">
                <Radio size={13} className="text-cyan-400" /> Pipeline Steps
              </h3>
              <div className="space-y-1">
                {nodes.map((node, idx) => (
                  <div key={node.id} className="flex items-center gap-2.5 text-xs py-1.5 px-2 rounded-lg hover:bg-gray-800/40 transition-colors">
                    <span className="text-gray-600 w-5 text-right">{idx + 1}.</span>
                    <span className="text-gray-200">{node.data.label}</span>
                    <span className={`ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                      node.data.status === "done" ? "bg-green-900/30 text-green-400" :
                      node.data.status === "error" ? "bg-red-900/30 text-red-400" :
                      node.data.status === "running" ? "bg-blue-900/30 text-blue-400" :
                      "bg-gray-800 text-gray-500"
                    }`}>
                      {node.data.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Actions ── */}
          {nodes.length > 0 && (
            <div className="flex gap-2 pb-4">
              <button onClick={clearPipeline}
                className="px-4 py-1.5 text-xs font-medium bg-gradient-to-r from-red-700 to-red-600 text-gray-200 rounded-lg hover:from-red-600 hover:to-red-500 transition-all flex items-center gap-1.5 shadow-lg shadow-red-900/20">
                <AlertTriangle size={11} /> Clear Pipeline
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── HubSearch modal ── */}
      {hubSearchOpen && <HubSearch onClose={() => setHubSearchOpen(false)} />}
    </div>
  );
}

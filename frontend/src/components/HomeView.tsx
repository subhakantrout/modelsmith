import { useEffect, useState } from "react";
import { usePipelineStore, useModelStore, useSystemStore, useDownloadStore } from "../stores";
import { api } from "../lib/api";
import type { ModelRegistryItem } from "../types/api";
import { useViewStore } from "../stores/viewStore";
import { HubSearch } from "./HubSearch";
import { Box, Cpu, HardDrive, Download, Activity, ArrowRight } from "lucide-react";
import { CardSkeleton, TableSkeleton } from "./Skeleton";

export function HomeView() {
  const nodes = usePipelineStore((s) => s.nodes);
  const inspectedModel = useModelStore((s) => s.inspectedModel);
  const systemInfo = useSystemStore((s) => s.info);
  const { hubSearchOpen, setHubSearchOpen } = useDownloadStore();
  const setView = useViewStore((s) => s.setView);
  const [models, setModels] = useState<ModelRegistryItem[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);

  useEffect(() => {
    api.models.registry()
      .then((r: any) => { setModels(r.models); setModelsLoading(false); })
      .catch(() => setModelsLoading(false));
  }, []);

  const ramGb = systemInfo?.specs.ram_total_gb ?? 0;
  const vramGb = systemInfo?.specs.gpu_vram_gb;
  const gpuName = systemInfo?.specs.gpu_name;

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-lg font-semibold text-gray-100">Home</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {models.length} model{models.length !== 1 ? "s" : ""} local
            {nodes.length > 0 && ` · ${nodes.length} pipeline step${nodes.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => setView("canvas")}
            className="rounded-xl border border-gray-700/30 bg-gradient-to-br from-gray-800/60 to-gray-900/60 p-4 hover:border-indigo-500/50 hover:shadow-[0_0_30px_-10px_rgba(99,102,241,0.3)] transition-all text-left group"
          >
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 w-fit mb-3 group-hover:scale-110 transition-transform">
              <Box size={18} />
            </div>
            <div className="text-sm font-semibold text-gray-200">Pipeline Canvas</div>
            <div className="text-[11px] text-gray-500 mt-1">Build and run model pipelines</div>
          </button>

          <button
            onClick={() => setView("models")}
            className="rounded-xl border border-gray-700/30 bg-gradient-to-br from-gray-800/60 to-gray-900/60 p-4 hover:border-green-500/50 hover:shadow-[0_0_30px_-10px_rgba(34,197,94,0.3)] transition-all text-left group"
          >
            <div className="p-2 rounded-lg bg-green-500/20 text-green-400 w-fit mb-3 group-hover:scale-110 transition-transform">
              <Cpu size={18} />
            </div>
            <div className="text-sm font-semibold text-gray-200">Model Manager</div>
            <div className="text-[11px] text-gray-500 mt-1">Browse, download, and inspect models</div>
          </button>

          <button
            onClick={() => setView("chat")}
            className="rounded-xl border border-gray-700/30 bg-gradient-to-br from-gray-800/60 to-gray-900/60 p-4 hover:border-purple-500/50 hover:shadow-[0_0_30px_-10px_rgba(168,85,247,0.3)] transition-all text-left group"
          >
            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 w-fit mb-3 group-hover:scale-110 transition-transform">
              <Activity size={18} />
            </div>
            <div className="text-sm font-semibold text-gray-200">Chat</div>
            <div className="text-[11px] text-gray-500 mt-1">Test models with interactive chat</div>
          </button>

          <button
            onClick={() => setHubSearchOpen(true)}
            className="rounded-xl border border-gray-700/30 bg-gradient-to-br from-gray-800/60 to-gray-900/60 p-4 hover:border-cyan-500/50 hover:shadow-[0_0_30px_-10px_rgba(6,182,212,0.3)] transition-all text-left group"
          >
            <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 w-fit mb-3 group-hover:scale-110 transition-transform">
              <Download size={18} />
            </div>
            <div className="text-sm font-semibold text-gray-200">Download Models</div>
            <div className="text-[11px] text-gray-500 mt-1">Search and download from HuggingFace</div>
          </button>
        </div>

        {/* System + Models row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-gray-700/30 bg-gradient-to-br from-gray-800/60 to-gray-900/60 p-4">
            <h3 className="text-xs font-semibold text-gray-300 mb-3 flex items-center gap-1.5">
              <HardDrive size={13} className="text-indigo-400" /> System
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-gray-700/20">
                <span className="text-gray-500">GPU</span>
                <span className="text-gray-300">{gpuName || "None detected"}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-700/20">
                <span className="text-gray-500">VRAM</span>
                <span className="text-gray-300">{vramGb ? `${vramGb} GB` : "N/A"}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-700/20">
                <span className="text-gray-500">System RAM</span>
                <span className="text-gray-300">{ramGb} GB</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-gray-500">Model loaded</span>
                <span className={inspectedModel ? "text-green-400" : "text-gray-600"}>
                  {inspectedModel ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-700/30 bg-gradient-to-br from-gray-800/60 to-gray-900/60 p-4">
            <h3 className="text-xs font-semibold text-gray-300 mb-3 flex items-center gap-1.5">
              <Search size={13} className="text-green-400" /> Local Models
            </h3>
            {modelsLoading ? (
              <TableSkeleton rows={3} />
            ) : models.length === 0 ? (
              <div className="text-center py-4 space-y-2">
                <p className="text-xs text-gray-600 italic">No models found</p>
                <button
                  onClick={() => setHubSearchOpen(true)}
                  className="px-3 py-1.5 text-[11px] bg-indigo-600/80 text-gray-100 rounded-lg hover:bg-indigo-500 transition-colors inline-flex items-center gap-1"
                >
                  <Download size={10} /> Search Hub
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                {models.slice(0, 5).map((m) => (
                  <div key={m.path} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-gray-800/40 transition-colors">
                    <div className="min-w-0 mr-2">
                      <div className="text-xs text-gray-200 truncate">{m.name}</div>
                      <div className="text-[10px] text-gray-500">{m.format}</div>
                    </div>
                    <span className="text-[10px] text-gray-500 shrink-0">{m.size_gb} GB</span>
                  </div>
                ))}
                {models.length > 5 && (
                  <button
                    onClick={() => setView("models")}
                    className="w-full flex items-center justify-center gap-1 py-1.5 text-[11px] text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    View all ({models.length}) <ArrowRight size={11} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Pipeline steps */}
        {nodes.length > 0 && (
          <div className="rounded-xl border border-gray-700/30 bg-gradient-to-br from-gray-800/60 to-gray-900/60 p-4">
            <h3 className="text-xs font-semibold text-gray-300 mb-3 flex items-center gap-1.5">
              <Activity size={13} className="text-cyan-400" /> Pipeline Steps
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
      </div>

      {hubSearchOpen && <HubSearch onClose={() => setHubSearchOpen(false)} />}
    </div>
  );
}

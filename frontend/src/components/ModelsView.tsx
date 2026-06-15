import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { ModelRegistryItem } from "../types/api";
import { useDownloadStore } from "../stores";
import { HubSearch } from "./HubSearch";
import { Download, HardDrive, FileText, CheckCircle, AlertCircle, Search } from "lucide-react";
import { CardSkeleton } from "./Skeleton";

export function ModelsView() {
  const [models, setModels] = useState<ModelRegistryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<ModelRegistryItem | null>(null);
  const { hubSearchOpen, setHubSearchOpen } = useDownloadStore();

  useEffect(() => {
    api.models.registry()
      .then((r: any) => { setModels(r.models); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-100">Models</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {models.length} model{models.length !== 1 ? "s" : ""} on disk
            </p>
          </div>
          <button
            onClick={() => setHubSearchOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium bg-gradient-to-r from-indigo-600/80 to-purple-600/80 text-gray-100 rounded-lg hover:from-indigo-500 hover:to-purple-500 transition-all"
          >
            <Download size={12} /> Download from Hub
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : models.length === 0 ? (
          <div className="text-center py-12 space-y-3 border border-dashed border-gray-700/40 rounded-xl">
            <HardDrive size={32} className="mx-auto text-gray-700" />
            <p className="text-sm text-gray-500">No models found</p>
            <button
              onClick={() => setHubSearchOpen(true)}
              className="px-4 py-2 text-xs font-medium bg-indigo-600 text-gray-100 rounded-lg hover:bg-indigo-500 transition-colors inline-flex items-center gap-1.5"
            >
              <Search size={12} /> Search HuggingFace Hub
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {models.map((m) => (
              <button
                key={m.path}
                onClick={() => setSelectedModel(selectedModel?.path === m.path ? null : m)}
                className={`text-left rounded-xl border p-4 transition-all ${
                  selectedModel?.path === m.path
                    ? "border-indigo-500/50 bg-indigo-500/10 shadow-[0_0_20px_-5px_rgba(99,102,241,0.2)]"
                    : "border-gray-700/30 bg-gradient-to-br from-gray-800/60 to-gray-900/60 hover:border-gray-600/50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 mr-2">
                    <div className="text-sm font-semibold text-gray-200 truncate">{m.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-gray-500 flex items-center gap-1">
                        <FileText size={10} /> {m.format}
                      </span>
                      <span className="text-[10px] text-gray-500 flex items-center gap-1">
                        <HardDrive size={10} /> {m.size_gb} GB
                      </span>
                    </div>
                  </div>
                  <div className={`p-1.5 rounded-lg ${
                    m.valid ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                  }`}>
                    {m.valid ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {hubSearchOpen && <HubSearch onClose={() => setHubSearchOpen(false)} />}
    </div>
  );
}

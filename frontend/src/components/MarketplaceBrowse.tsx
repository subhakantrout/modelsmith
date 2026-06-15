import { useState, useEffect } from "react";
import { Globe, Download, Loader, X, AlertCircle } from "lucide-react";

interface MarketplacePipeline {
  id: string;
  name: string;
  description: string;
  node_count: number;
  created: string;
}

interface MarketplaceBrowseProps {
  onApply: (nodes: any[], edges: any[]) => void;
  onClose: () => void;
}

export function MarketplaceBrowse({ onApply, onClose }: MarketplaceBrowseProps) {
  const [pipelines, setPipelines] = useState<MarketplacePipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/marketplace/pipelines");
        if (!res.ok) throw new Error("Failed to fetch marketplace pipelines");
        const data = await res.json();
        setPipelines(data.pipelines || []);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleDownload = async (id: string) => {
    setDownloadingId(id);
    try {
      const res = await fetch(`/api/marketplace/download/${id}`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Download failed");
      }
      const data = await res.json();
      onApply(data.nodes || [], data.edges || []);
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-gray-900/95 backdrop-blur-xl border border-gray-700/60 rounded-xl shadow-2xl w-full max-w-2xl max-h-[70vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50">
          <h2 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
            <Globe size={14} className="text-emerald-400" />
            Community Pipelines
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-200 p-1 rounded hover:bg-gray-800 transition-colors cursor-pointer">
            <X size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader size={18} className="animate-spin text-emerald-400" />
            </div>
          )}

          {error && !loading && (
            <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-900/20 px-3 py-2 rounded-lg border border-red-800/30">
              <AlertCircle size={12} />
              {error}
            </div>
          )}

          {!loading && !error && pipelines.length === 0 && (
            <div className="text-center py-8">
              <Globe size={24} className="mx-auto text-gray-700 mb-2" />
              <p className="text-xs text-gray-500">No community pipelines available yet</p>
              <p className="text-[10px] text-gray-600 mt-1">Check back later for shared pipelines</p>
            </div>
          )}

          {!loading && pipelines.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-lg border border-gray-700/30 bg-gray-800/40 hover:bg-gray-800/80 hover:border-gray-600/50 p-3 transition-all group"
            >
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-200 truncate">{p.name}</div>
                <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-500">
                  {p.description && (
                    <span className="truncate max-w-[200px]">{p.description}</span>
                  )}
                  <span className="shrink-0">{p.node_count} nodes</span>
                  <span className="shrink-0">{new Date(p.created).toLocaleDateString()}</span>
                </div>
              </div>
              <button
                onClick={() => handleDownload(p.id)}
                disabled={downloadingId === p.id}
                className="shrink-0 ml-3 px-3 py-1.5 text-[11px] font-medium rounded-lg transition-all flex items-center gap-1.5
                  bg-gradient-to-r from-emerald-700 to-emerald-600 text-gray-100 hover:from-emerald-600 hover:to-emerald-500
                  disabled:opacity-50 disabled:cursor-wait cursor-pointer"
              >
                {downloadingId === p.id ? (
                  <Loader size={11} className="animate-spin" />
                ) : (
                  <Download size={11} />
                )}
                {downloadingId === p.id ? "Loading..." : "Download"}
              </button>
            </div>
          ))}
        </div>

        <div className="px-4 py-2 border-t border-gray-700/30 text-[10px] text-gray-600 text-center">
          Browse and import community-created pipelines
        </div>
      </div>
    </div>
  );
}

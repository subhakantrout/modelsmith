import { useState, useRef, useEffect } from "react";
import { api } from "../lib/api";
import { useSettingsStore } from "../stores/settingsStore";
import { useDownloadStore } from "../stores/downloadStore";
import { Search, Download, X, Star, ArrowDown, Loader, AlertCircle } from "lucide-react";

interface HubSearchProps {
  onClose: () => void;
}

export function HubSearch({ onClose }: HubSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const setPanelOpen = useDownloadStore((s) => s.setPanelOpen);
  const upsertDownload = useDownloadStore((s) => s.upsertDownload);
  const hfToken = useSettingsStore((s) => s.hfToken);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollRefs = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  useEffect(() => {
    inputRef.current?.focus();
    return () => {
      pollRefs.current.forEach((poll) => clearInterval(poll));
      pollRefs.current.clear();
    };
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const r = await api.hub.search(query);
      setResults(r.results || []);
      if (!r.results?.length) setError("No models found. Try a different search term.");
    } catch (err) {
      setError((err as Error).message);
    }
    setLoading(false);
  };

  const handleDownload = async (modelId: string) => {
    if (downloadingIds.has(modelId)) return;
    setDownloadingIds((prev) => new Set(prev).add(modelId));
    try {
      const res = await api.hub.download(modelId, hfToken);
      setPanelOpen(true);
      const poll = setInterval(async () => {
        try {
          const s = await api.hub.downloadStatus(res.download_id);
          upsertDownload(s as any);
          if (["completed", "error", "cancelled"].includes(s.status)) {
            clearInterval(poll);
            pollRefs.current.delete(modelId);
            setDownloadingIds((prev) => {
              const next = new Set(prev);
              next.delete(modelId);
              return next;
            });
          }
        } catch {
          clearInterval(poll);
          pollRefs.current.delete(modelId);
          setDownloadingIds((prev) => {
            const next = new Set(prev);
            next.delete(modelId);
            return next;
          });
        }
      }, 1200);
      pollRefs.current.set(modelId, poll);
    } catch (err) {
      setDownloadError((err as Error).message);
      setDownloadingIds((prev) => {
        const next = new Set(prev);
        next.delete(modelId);
        return next;
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-gray-900/95 backdrop-blur-xl border border-gray-700/60 rounded-xl shadow-2xl w-full max-w-xl max-h-[70vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50">
          <h2 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
            <Download size={14} className="text-blue-400" />
            HuggingFace Hub
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-200 p-1 rounded hover:bg-gray-800 transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-gray-700/30">
          {downloadError && (
            <div className="mb-2 px-3 py-1.5 text-[11px] text-red-400 bg-red-900/20 border border-red-800/30 rounded-lg flex items-center gap-1.5">
              <AlertCircle size={12} /> {downloadError}
            </div>
          )}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search models (e.g. Llama, Mistral, Phi)..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-800 border border-gray-600/50 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="px-4 py-1.5 text-xs font-medium bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
            >
              {loading ? <Loader size={12} className="animate-spin" /> : <Search size={12} />}
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin">
          {error && (
            <p className="text-xs text-gray-500 text-center py-6">{error}</p>
          )}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader size={18} className="animate-spin text-blue-400" />
            </div>
          )}
          {!loading &&
            !error &&
            results.length === 0 &&
            query && (
              <p className="text-xs text-gray-500 text-center py-6">No results yet. Try searching.</p>
            )}
          {!loading &&
            !error &&
            results.length === 0 &&
            !query && (
              <p className="text-xs text-gray-500 text-center py-6">Type a query above to search the Hub</p>
            )}
          {results.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between rounded-lg border border-gray-700/30 bg-gray-800/40 hover:bg-gray-800/80 hover:border-gray-600/50 p-3 transition-all group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-200 truncate">{m.id}</span>
                  {m.pipeline_tag && (
                    <span className="text-[10px] text-blue-400 bg-blue-900/30 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                      {m.pipeline_tag}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-500">
                  <span className="flex items-center gap-1">
                    <ArrowDown size={10} /> {m.downloads?.toLocaleString() || 0}
                  </span>
                  {m.likes > 0 && (
                    <span className="flex items-center gap-1">
                      <Star size={10} /> {m.likes}
                    </span>
                  )}
                  {m.library_name && (
                    <span className="text-gray-600">{m.library_name}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDownload(m.id)}
                disabled={downloadingIds.has(m.id)}
                className="shrink-0 ml-3 px-3 py-1.5 text-[11px] font-medium rounded-lg transition-all flex items-center gap-1.5
                  bg-gradient-to-r from-green-700 to-green-600 text-gray-100 hover:from-green-600 hover:to-green-500
                  disabled:opacity-50 disabled:cursor-wait shadow-lg shadow-green-900/20"
              >
                {downloadingIds.has(m.id) ? (
                  <Loader size={11} className="animate-spin" />
                ) : (
                  <Download size={11} />
                )}
                {downloadingIds.has(m.id) ? "Adding..." : "Download"}
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-gray-700/30 text-[10px] text-gray-600 text-center">
          Powered by HuggingFace API
        </div>
      </div>
    </div>
  );
}

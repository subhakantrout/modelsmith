import { useState, useEffect } from "react";
import { api } from "../lib/api";
import type { ModelRegistryItem } from "../types/api";
import { Search, Download, X, FolderOpen } from "lucide-react";

interface ModelBrowserProps {
  onSelect: (path: string) => void;
  onClose: () => void;
}

export function ModelBrowser({ onSelect, onClose }: ModelBrowserProps) {
  const [models, setModels] = useState<ModelRegistryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanPath, setScanPath] = useState("");
  const [scanResult, setScanResult] = useState<ModelRegistryItem[]>([]);
  const [showHubSearch, setShowHubSearch] = useState(false);
  const [hubQuery, setHubQuery] = useState("");
  const [hubResults, setHubResults] = useState<any[]>([]);
  const [hubLoading, setHubLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    api.models.registry().then((r) => {
      setModels(r.models || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleScan = async () => {
    if (!scanPath.trim()) return;
    setLoading(true);
    try {
      const r = await api.models.scan_directory(scanPath);
      setScanResult(r.models || []);
    } catch {
      setScanResult([]);
    }
    setLoading(false);
  };

  const handleHubSearch = async () => {
    if (!hubQuery.trim()) return;
    setHubLoading(true);
    try {
      const r = await api.hub.search(hubQuery);
      setHubResults(r.results || []);
    } catch {
      setHubResults([]);
    }
    setHubLoading(false);
  };

  const displayModels = scanResult.length > 0 ? scanResult : models;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <h3 className="text-sm font-medium text-gray-100">
            <FolderOpen size={14} className="inline mr-1.5 text-blue-400" />
            Model Browser
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setShowHubSearch(!showHubSearch)}
              className="px-2 py-1 text-xs bg-indigo-700 text-gray-200 rounded hover:bg-indigo-600 flex items-center gap-1"
            >
              <Download size={11} />
              {showHubSearch ? "Local" : "Hub"}
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-200 text-lg leading-none">×</button>
          </div>
        </div>

        {showHubSearch ? (
          <div className="p-3 border-b border-gray-700 space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={hubQuery}
                onChange={(e) => setHubQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleHubSearch()}
                placeholder="Search HuggingFace Hub..."
                className="flex-1 px-2 py-1 text-xs bg-gray-700 border border-gray-500 rounded text-gray-100 placeholder-gray-400"
              />
              <button
                onClick={handleHubSearch}
                disabled={hubLoading || !hubQuery.trim()}
                className="px-3 py-1 text-xs bg-indigo-600 text-gray-100 rounded hover:bg-indigo-500 disabled:opacity-50"
              >
                {hubLoading ? "Searching..." : "Search"}
              </button>
            </div>
            {hubResults.length > 0 && (
              <div className="max-h-60 overflow-y-auto space-y-1">
                {hubResults.map((m) => (
                  <div key={m.id} className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded p-2 text-xs">
                    <div className="flex-1 min-w-0">
                      <div className="text-gray-200 font-medium truncate">{m.id}</div>
                      <div className="text-gray-500 flex gap-2">
                        <span>{m.downloads?.toLocaleString()} downloads</span>
                        {m.pipeline_tag && <span className="text-blue-400">{m.pipeline_tag}</span>}
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        setDownloadingId(m.id);
                        try {
                          const res = await api.hub.download(m.id);
                          onSelect(res.path);
                          onClose();
                        } catch (err) {
                          alert("Download failed: " + (err as Error).message);
                        }
                        setDownloadingId(null);
                      }}
                      disabled={downloadingId === m.id}
                      className="px-2 py-1 text-xs bg-green-700 text-gray-200 rounded hover:bg-green-600 ml-2 flex items-center gap-1 disabled:opacity-50 disabled:cursor-wait"
                    >
                      {downloadingId === m.id ? (
                        <><svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Downloading...</>
                      ) : (
                        <><Download size={10} /> Download</>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="p-3 border-b border-gray-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={scanPath}
                onChange={(e) => setScanPath(e.target.value)}
                placeholder="Scan custom directory..."
                className="flex-1 px-2 py-1 text-xs bg-gray-700 border border-gray-500 rounded text-gray-100 placeholder-gray-400"
              />
              <button
                onClick={handleScan}
                disabled={loading || !scanPath.trim()}
                className="px-3 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 disabled:opacity-50"
              >
                <Search size={11} className="inline mr-1" /> Scan
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {loading ? (
            <p className="text-xs text-gray-500 text-center py-8">Loading models...</p>
          ) : displayModels.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-8">No models found. Try scanning a directory or searching the Hub.</p>
          ) : displayModels.map((m) => (
            <div key={m.path} className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded p-2 text-xs hover:border-blue-500 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="text-gray-200 font-medium truncate">{m.name}</div>
                <div className="text-gray-500 flex gap-2">
                  <span>{m.format}</span>
                  <span>{m.size_gb} GB</span>
                </div>
              </div>
              <button
                onClick={() => { onSelect(m.path); onClose(); }}
                className="px-2 py-1 text-xs bg-blue-600 text-gray-100 rounded hover:bg-blue-500 ml-2"
              >
                Select
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

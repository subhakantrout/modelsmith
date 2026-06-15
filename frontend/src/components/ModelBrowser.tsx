import { useState, useEffect } from "react";
import { api } from "../lib/api";
import type { ModelRegistryItem } from "../types/api";
import { HubSearch } from "./HubSearch";
import { Search, Download, FolderOpen } from "lucide-react";

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
              onClick={() => setShowHubSearch(true)}
              className="px-2 py-1 text-xs bg-indigo-700 text-gray-200 rounded hover:bg-indigo-600 flex items-center gap-1"
            >
              <Download size={11} />
              Search Hub
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-200 text-lg leading-none">×</button>
          </div>
        </div>

        {showHubSearch && (
          <HubSearch
            onClose={() => setShowHubSearch(false)}
            onSelect={(path) => { onSelect(path); onClose(); }}
          />
        )}

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

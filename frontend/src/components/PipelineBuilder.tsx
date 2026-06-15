import { useState, useRef, useEffect } from "react";
import { Wand2, Loader, Check, X } from "lucide-react";

interface PipelineBuilderProps {
  onPipelineGenerated: (nodes: any[], edges: any[]) => void;
  onClose: () => void;
}

export function PipelineBuilder({ onPipelineGenerated, onClose }: PipelineBuilderProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ nodes: any[]; edges: any[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleGenerate = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/advisor/generate-pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Pipeline generation failed");
      }
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!result) return;
    onPipelineGenerated(result.nodes, result.edges);
    onClose();
  };

  const nodeTypeColor: Record<string, string> = {
    modelInput: "text-blue-400 bg-blue-900/30",
    analyze: "text-yellow-400 bg-yellow-900/30",
    abliterate: "text-purple-400 bg-purple-900/30",
    merge: "text-green-400 bg-green-900/30",
    lora: "text-pink-400 bg-pink-900/30",
    compress: "text-orange-400 bg-orange-900/30",
    export: "text-cyan-400 bg-cyan-900/30",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-gray-900/95 backdrop-blur-xl border border-gray-700/60 rounded-xl shadow-2xl w-full max-w-xl max-h-[70vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50">
          <h2 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
            <Wand2 size={14} className="text-indigo-400" />
            Pipeline Builder
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-200 p-1 rounded hover:bg-gray-800 transition-colors">
            <X size={14} />
          </button>
        </div>

        <div className="px-4 py-3 border-b border-gray-700/30">
          <p className="text-[11px] text-gray-500 mb-3">
            Describe the pipeline you want to build in natural language.
          </p>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              placeholder='e.g. "Load Llama 3, abliterate it, then export to GGUF"'
              className="flex-1 px-3 py-1.5 text-xs bg-gray-800 border border-gray-600/50 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
            />
            <button
              onClick={handleGenerate}
              disabled={loading || !query.trim()}
              className="px-4 py-1.5 text-xs font-medium bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
            >
              {loading ? <Loader size={12} className="animate-spin" /> : <Wand2 size={12} />}
              {loading ? "Generating..." : "Generate"}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
          {error && (
            <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-900/20 px-3 py-2 rounded-lg border border-red-800/30">
              <X size={12} />
              {error}
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Loader size={20} className="animate-spin text-indigo-400" />
              <p className="text-xs text-gray-500">Analyzing request...</p>
            </div>
          )}

          {!loading && !result && !error && (
            <div className="text-center py-8">
              <Wand2 size={24} className="mx-auto text-gray-700 mb-2" />
              <p className="text-xs text-gray-600">Type a description above to generate a pipeline</p>
              <p className="text-[10px] text-gray-700 mt-1">
                Try: "Abliterate Mistral 7B and compress to 4-bit"
              </p>
            </div>
          )}

          {result && (
            <div className="space-y-3">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-1">
                Pipeline Nodes ({result.nodes.length})
              </div>
              <div className="space-y-1">
                {result.nodes.map((node, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800/40 border border-gray-700/30 text-xs"
                  >
                    <span className="text-gray-600 font-mono w-5">{i + 1}.</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        nodeTypeColor[node.type] || "text-gray-400 bg-gray-800"
                      }`}
                    >
                      {node.data?.label || node.type}
                    </span>
                    {node.data?.config && Object.keys(node.data.config).length > 0 && (
                      <span className="text-[10px] text-gray-600 ml-auto">
                        {Object.entries(node.data.config)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(", ")}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={handleApply}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-gradient-to-r from-green-700 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-500 transition-all"
              >
                <Check size={12} />
                Apply to Canvas
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { GitCommit, GitBranch, Clock, ChevronDown, ChevronRight, Loader2, X } from "lucide-react";

interface ProvenanceStep {
  type: string;
  config: Record<string, unknown>;
  status: string;
}

interface ProvenanceEntry {
  id: string;
  pipeline_name: string;
  model_name: string;
  timestamp: string;
  step_count: number;
  steps: ProvenanceStep[];
}

interface ProvenanceResponse {
  history: ProvenanceEntry[];
}

const nodeTypeColor: Record<string, string> = {
  modelInput: "text-blue-400",
  analyze: "text-yellow-400",
  abliterate: "text-purple-400",
  merge: "text-green-400",
  lora: "text-pink-400",
  compress: "text-orange-400",
  export: "text-cyan-400",
};

interface ProvenanceGraphProps {
  onClose?: () => void;
}

export function ProvenanceGraph({ onClose }: ProvenanceGraphProps) {
  const [history, setHistory] = useState<ProvenanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/pipeline/provenance/history");
        if (!res.ok) throw new Error("Failed to load provenance history");
        const data: ProvenanceResponse = await res.json();
        setHistory(data.history || []);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-gray-900/95 backdrop-blur-xl border border-gray-700/60 rounded-xl shadow-2xl w-full max-w-xl max-h-[70vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50">
          <h2 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
            <GitBranch size={14} className="text-indigo-400" />
            Provenance History
          </h2>
          {onClose && (
            <button onClick={onClose} className="text-gray-500 hover:text-gray-200 p-1 rounded hover:bg-gray-800 transition-colors">
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
        {loading && (
          <div className="flex items-center justify-center py-6">
            <Loader2 size={16} className="animate-spin text-gray-500" />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-900/20 px-2 py-1.5 rounded">
            <Clock size={12} />
            {error}
          </div>
        )}

        {!loading && !error && history.length === 0 && (
          <p className="text-[10px] text-gray-600 text-center py-4">
            No pipeline runs yet. Execute a pipeline to see history.
          </p>
        )}

        {!loading && history.length > 0 && (
          <div className="space-y-1.5">
            {history.map((entry) => {
              const isOpen = expanded.has(entry.id);
              return (
                <div key={entry.id} className="rounded-lg border border-gray-700/30 bg-gray-800/40 overflow-hidden">
                  <button
                    onClick={() => toggleExpand(entry.id)}
                    className="w-full flex items-center gap-2 px-2.5 py-2 text-left hover:bg-gray-800/60 transition-colors cursor-pointer"
                  >
                    {isOpen ? <ChevronDown size={11} className="text-gray-500 shrink-0" /> : <ChevronRight size={11} className="text-gray-500 shrink-0" />}
                    <GitCommit size={11} className="text-indigo-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] text-gray-200 truncate">{entry.pipeline_name}</div>
                      <div className="text-[10px] text-gray-500 truncate">{entry.model_name}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[10px] text-gray-500">{formatTime(entry.timestamp)}</div>
                      <div className="text-[10px] text-gray-600">{entry.step_count} steps</div>
                    </div>
                  </button>

                  {isOpen && entry.steps && (
                    <div className="border-t border-gray-700/30 px-2.5 py-2 space-y-1">
                      {entry.steps.map((step, i) => (
                        <div key={i} className="flex items-center gap-2 text-[10px]">
                          <span className="text-gray-600 font-mono w-4">{i + 1}</span>
                          <span className={nodeTypeColor[step.type] || "text-gray-400"}>
                            {step.type}
                          </span>
                          {Object.keys(step.config).length > 0 && (
                            <span className="text-gray-600 truncate">
                              {JSON.stringify(step.config).slice(0, 60)}
                            </span>
                          )}
                          <span
                            className={`ml-auto text-[10px] ${
                              step.status === "done"
                                ? "text-green-500"
                                : step.status === "error"
                                  ? "text-red-500"
                                  : "text-gray-600"
                            }`}
                          >
                            {step.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

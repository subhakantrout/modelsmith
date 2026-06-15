import { useState, useCallback } from "react";
import { Search, Loader2, CheckCircle2, AlertCircle, ArrowUpDown } from "lucide-react";
import { api } from "../lib/api";

interface GridResult {
  layer_idx: number;
  scale: number;
  refusal_score: number;
  quality_score: number;
  composite_score: number;
  duration_ms: number;
}

interface GridSearchResponse {
  status: string;
  results: GridResult[];
  pareto_front: GridResult[];
  best_overall: GridResult | null;
  total_duration_ms: number;
  model_family: string;
  num_layers: number;
}

interface GridSearchPanelProps {
  onClose?: () => void;
  onResults?: (results: GridResult[]) => void;
}

export function GridSearchPanel({ onClose, onResults }: GridSearchPanelProps) {
  const [layerStart, setLayerStart] = useState(5);
  const [layerEnd, setLayerEnd] = useState(25);
  const [layerStep, setLayerStep] = useState(5);
  const [scaleStart, setScaleStart] = useState(0.5);
  const [scaleEnd, setScaleEnd] = useState(1.5);
  const [scaleStep, setScaleStep] = useState(0.1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GridSearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/abliterate/grid-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          layer_start: layerStart,
          layer_end: layerEnd,
          layer_step: layerStep,
          scale_start: scaleStart,
          scale_end: scaleEnd,
          scale_step: scaleStep,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Grid search failed");
      }
      const data: GridSearchResponse = await res.json();
      setResult(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [layerStart, layerEnd, layerStep, scaleStart, scaleEnd, scaleStep]);

  const configCount =
    Math.ceil((layerEnd - layerStart + 1) / layerStep) *
    Math.ceil((scaleEnd - scaleStart + 0.01) / scaleStep);

  return (
    <div className="space-y-3">
      <div className="text-[10px] text-gray-500 uppercase tracking-wider font-medium flex items-center gap-1.5">
        <Search size={12} />
        Auto-Abliteration Search
        {onResults && (
          <button
            onClick={() => { if (result) onResults(result.pareto_front); onClose?.(); }}
            disabled={!result}
            className="ml-auto text-[10px] text-gray-600 hover:text-gray-400 disabled:opacity-40"
          >
            Apply Best
          </button>
        )}
        {onClose && (
          <button onClick={onClose} className="ml-1 text-gray-500 hover:text-gray-200">&times;</button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-[10px] text-gray-500 block mb-0.5">Layer Start</label>
          <input
            type="number"
            value={layerStart}
            onChange={(e) => setLayerStart(Number(e.target.value))}
            min={0}
            max={100}
            className="w-full px-2 py-1 text-[11px] bg-gray-800 border border-gray-700 rounded text-gray-200"
          />
        </div>
        <div>
          <label className="text-[10px] text-gray-500 block mb-0.5">Layer End</label>
          <input
            type="number"
            value={layerEnd}
            onChange={(e) => setLayerEnd(Number(e.target.value))}
            min={0}
            max={100}
            className="w-full px-2 py-1 text-[11px] bg-gray-800 border border-gray-700 rounded text-gray-200"
          />
        </div>
        <div>
          <label className="text-[10px] text-gray-500 block mb-0.5">Step</label>
          <input
            type="number"
            value={layerStep}
            onChange={(e) => setLayerStep(Number(e.target.value))}
            min={1}
            max={50}
            className="w-full px-2 py-1 text-[11px] bg-gray-800 border border-gray-700 rounded text-gray-200"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-[10px] text-gray-500 block mb-0.5">Scale Start</label>
          <input
            type="number"
            value={scaleStart}
            onChange={(e) => setScaleStart(Number(e.target.value))}
            step={0.1}
            min={0}
            max={3}
            className="w-full px-2 py-1 text-[11px] bg-gray-800 border border-gray-700 rounded text-gray-200"
          />
        </div>
        <div>
          <label className="text-[10px] text-gray-500 block mb-0.5">Scale End</label>
          <input
            type="number"
            value={scaleEnd}
            onChange={(e) => setScaleEnd(Number(e.target.value))}
            step={0.1}
            min={0}
            max={3}
            className="w-full px-2 py-1 text-[11px] bg-gray-800 border border-gray-700 rounded text-gray-200"
          />
        </div>
        <div>
          <label className="text-[10px] text-gray-500 block mb-0.5">Step</label>
          <input
            type="number"
            value={scaleStep}
            onChange={(e) => setScaleStep(Number(e.target.value))}
            step={0.05}
            min={0.05}
            max={1}
            className="w-full px-2 py-1 text-[11px] bg-gray-800 border border-gray-700 rounded text-gray-200"
          />
        </div>
      </div>

      <div className="text-[10px] text-gray-600">
        {configCount} configurations to test
      </div>

      <button
        onClick={handleSearch}
        disabled={loading}
        className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 transition-all cursor-pointer"
      >
        {loading ? (
          <><Loader2 size={12} className="animate-spin" /> Searching...</>
        ) : (
          <><Search size={12} /> Run Grid Search</>
        )}
      </button>

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-900/20 px-2 py-1.5 rounded">
          <AlertCircle size={12} />
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-2 pt-1 border-t border-gray-800">
          <div className="text-xs text-gray-400 flex items-center justify-between">
            <span>
              Tested {result.results.length} configs in {(result.total_duration_ms / 1000).toFixed(1)}s
            </span>
            <span className="text-gray-600">
              {result.model_family} &middot; {result.num_layers} layers
            </span>
          </div>

          {result.best_overall && (
            <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-lg p-2.5">
              <div className="text-[10px] text-indigo-300 font-medium uppercase tracking-wider mb-1.5">
                Best Configuration
              </div>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <div className="text-gray-400">Layer <span className="text-gray-200 font-mono">{result.best_overall.layer_idx}</span></div>
                <div className="text-gray-400">Scale <span className="text-gray-200 font-mono">{result.best_overall.scale}</span></div>
                <div className="text-gray-400">Refusal <span className="text-green-400 font-mono">{(result.best_overall.refusal_score * 100).toFixed(0)}%</span></div>
                <div className="text-gray-400">Quality <span className="text-blue-400 font-mono">{(result.best_overall.quality_score * 100).toFixed(0)}%</span></div>
              </div>
            </div>
          )}

          {result.pareto_front.length > 1 && (
            <div>
              <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-1">
                Pareto Frontier ({result.pareto_front.length} optimal configs)
              </div>
              <div className="space-y-1">
                {result.pareto_front.slice(0, 5).map((r, i) => (
                  <div
                    key={`${r.layer_idx}-${r.scale}`}
                    className="flex items-center justify-between px-2 py-1 rounded bg-gray-800/50 text-[11px]"
                  >
                    <span className="text-gray-300 font-mono">
                      L{r.layer_idx} &times; {r.scale}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-green-400">{(r.refusal_score * 100).toFixed(0)}%R</span>
                      <span className="text-blue-400">{(r.quality_score * 100).toFixed(0)}%Q</span>
                      <span className="text-indigo-400 font-medium">
                        {(r.composite_score * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => setResult(null)}
            className="text-[10px] text-gray-600 hover:text-gray-400"
          >
            Clear results
          </button>
        </div>
      )}
    </div>
  );
}

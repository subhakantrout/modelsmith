import { GitCompare, ArrowUp, ArrowDown } from "lucide-react";

interface ABTestResult {
  layer_idx: number;
  scale: number;
  refusal_score: number;
  quality_score: number;
  composite_score: number;
}

interface ABTestPanelProps {
  results: ABTestResult[];
}

function scoreColor(value: number): string {
  if (value >= 0.7) return "text-green-400";
  if (value >= 0.4) return "text-yellow-400";
  return "text-red-400";
}

function scoreBar(value: number): string {
  const pct = Math.min(value * 100, 100);
  let color = "bg-green-500";
  if (value < 0.7) color = "bg-yellow-500";
  if (value < 0.4) color = "bg-red-500";
  return `${color} rounded-full h-1.5`;
}

function DiffBadge({ a, b }: { a: number; b: number }) {
  const diff = b - a;
  if (Math.abs(diff) < 0.01) return null;
  const isBetter = diff > 0;
  return (
    <span className={`flex items-center gap-0.5 text-[9px] font-medium ${isBetter ? "text-green-500" : "text-red-500"}`}>
      {isBetter ? <ArrowUp size={8} /> : <ArrowDown size={8} />}
      {(Math.abs(diff) * 100).toFixed(0)}%
    </span>
  );
}

export function ABTestPanel({ results }: ABTestPanelProps) {
  const sorted = [...results].sort((a, b) => b.composite_score - a.composite_score);
  const versionA = sorted[0] || null;
  const versionB = sorted[1] || null;

  return (
    <div className="space-y-2.5">
      <div className="text-[10px] text-gray-500 uppercase tracking-wider font-medium flex items-center gap-1.5">
        <GitCompare size={12} />
        A/B Comparison
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-3">
        {results.length === 0 && (
          <p className="text-[10px] text-gray-600 text-center py-4">
            Run a grid search to see A/B comparison results
          </p>
        )}

        {results.length === 1 && versionA && (
          <div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Version A</div>
            <div className="bg-gray-800/50 rounded-lg p-2.5 space-y-1.5">
              <div className="flex justify-between text-[10px]">
                <span className="text-gray-500">Layer</span>
                <span className="text-gray-300 font-mono">{versionA.layer_idx}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-gray-500">Scale</span>
                <span className="text-gray-300 font-mono">{versionA.scale}</span>
              </div>
              <div className="flex justify-between text-[10px] items-center">
                <span className="text-gray-500">Refusal</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-12 bg-gray-700 rounded-full h-1.5 overflow-hidden">
                    <div className={scoreBar(versionA.refusal_score)} style={{ width: `${versionA.refusal_score * 100}%` }} />
                  </div>
                  <span className={`font-mono ${scoreColor(versionA.refusal_score)}`}>
                    {(versionA.refusal_score * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="flex justify-between text-[10px] items-center">
                <span className="text-gray-500">Quality</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-12 bg-gray-700 rounded-full h-1.5 overflow-hidden">
                    <div className={scoreBar(versionA.quality_score)} style={{ width: `${versionA.quality_score * 100}%` }} />
                  </div>
                  <span className={`font-mono ${scoreColor(versionA.quality_score)}`}>
                    {(versionA.quality_score * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="flex justify-between text-[11px] border-t border-gray-700/30 pt-1 mt-1">
                <span className="text-gray-500 font-medium">Composite</span>
                <span className={`font-mono font-medium ${scoreColor(versionA.composite_score)}`}>
                  {(versionA.composite_score * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {results.length >= 2 && versionA && versionB && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Version A
              </div>
              <div className="bg-gray-800/50 rounded-lg p-2.5 space-y-1.5">
                <div className="flex justify-between text-[10px]">
                  <span className="text-gray-500">Layer</span>
                  <span className="text-gray-300 font-mono">{versionA.layer_idx}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-gray-500">Scale</span>
                  <span className="text-gray-300 font-mono">{versionA.scale}</span>
                </div>
                <div className="flex justify-between text-[10px] items-center">
                  <span className="text-gray-500">Refusal</span>
                  <div className="flex items-center gap-1">
                    <div className="w-8 bg-gray-700 rounded-full h-1 overflow-hidden">
                      <div className={scoreBar(versionA.refusal_score)} style={{ width: `${versionA.refusal_score * 100}%` }} />
                    </div>
                    <span className={`font-mono ${scoreColor(versionA.refusal_score)}`}>
                      {(versionA.refusal_score * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className="flex justify-between text-[10px] items-center">
                  <span className="text-gray-500">Quality</span>
                  <div className="flex items-center gap-1">
                    <div className="w-8 bg-gray-700 rounded-full h-1 overflow-hidden">
                      <div className={scoreBar(versionA.quality_score)} style={{ width: `${versionA.quality_score * 100}%` }} />
                    </div>
                    <span className={`font-mono ${scoreColor(versionA.quality_score)}`}>
                      {(versionA.quality_score * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className="flex justify-between text-[11px] border-t border-gray-700/30 pt-1 mt-1">
                  <span className="text-gray-500 font-medium">Score</span>
                  <span className={`font-mono font-medium ${scoreColor(versionA.composite_score)}`}>
                    {(versionA.composite_score * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            <div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                Version B
              </div>
              <div className="bg-gray-800/50 rounded-lg p-2.5 space-y-1.5">
                <div className="flex justify-between text-[10px]">
                  <span className="text-gray-500">Layer</span>
                  <span className="text-gray-300 font-mono">{versionB.layer_idx}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-gray-500">Scale</span>
                  <span className="text-gray-300 font-mono">{versionB.scale}</span>
                </div>
                <div className="flex justify-between text-[10px] items-center">
                  <span className="text-gray-500">Refusal</span>
                  <div className="flex items-center gap-1">
                    <div className="w-8 bg-gray-700 rounded-full h-1 overflow-hidden">
                      <div className={scoreBar(versionB.refusal_score)} style={{ width: `${versionB.refusal_score * 100}%` }} />
                    </div>
                    <span className={`font-mono ${scoreColor(versionB.refusal_score)}`}>
                      {(versionB.refusal_score * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className="flex justify-between text-[10px] items-center">
                  <span className="text-gray-500">Quality</span>
                  <div className="flex items-center gap-1">
                    <div className="w-8 bg-gray-700 rounded-full h-1 overflow-hidden">
                      <div className={scoreBar(versionB.quality_score)} style={{ width: `${versionB.quality_score * 100}%` }} />
                    </div>
                    <span className={`font-mono ${scoreColor(versionB.quality_score)}`}>
                      {(versionB.quality_score * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className="flex justify-between text-[11px] border-t border-gray-700/30 pt-1 mt-1">
                  <span className="text-gray-500 font-medium">Score</span>
                  <span className={`font-mono font-medium ${scoreColor(versionB.composite_score)}`}>
                    {(versionB.composite_score * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {results.length >= 2 && versionA && versionB && (
          <div className="mt-2 pt-2 border-t border-gray-800">
            <div className="text-[10px] text-gray-500 mb-1">Difference (B - A)</div>
            <div className="flex gap-3 text-[10px]">
              <div className="flex items-center gap-1">
                <span className="text-gray-600">Refusal:</span>
                <DiffBadge a={versionA.refusal_score} b={versionB.refusal_score} />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-600">Quality:</span>
                <DiffBadge a={versionA.quality_score} b={versionB.quality_score} />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-600">Composite:</span>
                <DiffBadge a={versionA.composite_score} b={versionB.composite_score} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

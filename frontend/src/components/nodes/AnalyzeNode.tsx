import { memo, useState, useCallback } from "react";
import type { PipelineNodeProps } from "./types";
import { NodeWrapper } from "./NodeWrapper";
import { useModelStore } from "../../stores";

function AnalyzeNodeInner({ data }: PipelineNodeProps) {
  const [testOutput, setTestOutput] = useState("");
  const analyzeRefusal = useModelStore((s) => s.analyzeRefusal);
  const analysis = useModelStore((s) => s.analysis);
  const loading = useModelStore((s) => s.loading);

  const handleAnalyze = useCallback(async () => {
    if (!testOutput.trim()) return;
    await analyzeRefusal(testOutput);
  }, [testOutput, analyzeRefusal]);

  return (
    <NodeWrapper data={data}>
      <div className="space-y-2">
        <textarea
          value={testOutput}
          onChange={(e) => setTestOutput(e.target.value)}
          placeholder="Paste model output to analyze for refusal patterns..."
          rows={3}
          className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-500 rounded text-gray-100 placeholder-gray-400 resize-none"
        />
        <button
          onClick={handleAnalyze}
          disabled={loading || !testOutput.trim()}
          className="w-full px-2 py-1 text-xs font-medium text-gray-900 bg-blue-500 rounded hover:bg-blue-400 disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Analyze"}
        </button>
        {analysis && (
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Score:</span>
              <span className="font-mono text-gray-100">{analysis.refusal_score.toFixed(2)}</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                analysis.refusal_level === "high" ? "bg-red-900 text-red-200" :
                analysis.refusal_level === "medium" ? "bg-yellow-900 text-yellow-200" :
                analysis.refusal_level === "low" ? "bg-blue-900 text-blue-200" :
                "bg-green-900 text-green-200"
              }`}>
                {analysis.refusal_level}
              </span>
            </div>
            {analysis.matched_patterns.length > 0 && (
              <div className="text-gray-400">
                <span>Patterns: </span>
                <span className="text-gray-300">{analysis.matched_patterns.join(", ")}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </NodeWrapper>
  );
}

export const AnalyzeNode = memo(AnalyzeNodeInner);

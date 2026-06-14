import { memo, useState, useCallback, useEffect } from "react";
import type { PipelineNodeProps } from "./types";
import { NodeWrapper } from "./NodeWrapper";
import { api } from "../../lib/api";
import { usePipelineStore } from "../../stores";
import type { ExportResult } from "../../types/api";

const FORMAT_LABELS: Record<string, string> = {
  safetensors: "SafeTensors",
  gguf: "GGUF (llama.cpp)",
};

function ExportNodeInner({ id, data }: PipelineNodeProps) {
  const [format, setFormat] = useState((data.config.format as string) || "gguf");
  const [outputDir, setOutputDir] = useState((data.config.output_dir as string) || "");
  const [result, setResult] = useState<ExportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const updateNodeConfig = usePipelineStore((s) => s.updateNodeConfig);

  useEffect(() => {
    updateNodeConfig(id, { format, output_dir: outputDir });
  }, [id, format, outputDir, updateNodeConfig]);

  const handleValidate = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.export.validate({
        model_path: data.config.modelPath as string || "/path/to/model",
        output_dir: outputDir || "/tmp/output",
        format,
        model_size_gb: data.config.modelSizeGb as number || 7,
      });
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [format, outputDir, data.config]);

  return (
    <NodeWrapper data={data}>
      <div className="space-y-2">
        <input
          type="text"
          value={outputDir}
          onChange={(e) => setOutputDir(e.target.value)}
          placeholder="/path/to/output"
          className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-500 rounded text-gray-100 placeholder-gray-400"
        />
        <select
          value={format}
          onChange={(e) => setFormat(e.target.value)}
          className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-500 rounded text-gray-100"
        >
          {Object.entries(FORMAT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <button
          onClick={handleValidate}
          disabled={loading}
          className="w-full px-2 py-1 text-xs font-medium text-gray-900 bg-green-500 rounded hover:bg-green-400 disabled:opacity-50"
        >
          {loading ? "Validating..." : "Validate Export"}
        </button>
        {result && (
          <div className="text-xs text-gray-300">
            {result.validation.valid ? (
              <p className="text-green-400">Ready to export</p>
            ) : (
              <p className="text-red-400">{result.validation.error}</p>
            )}
            {result.estimate && (
              <p>Est. size: {result.estimate.estimated_gb} GB</p>
            )}
          </div>
        )}
      </div>
    </NodeWrapper>
  );
}

export const ExportNode = memo(ExportNodeInner);

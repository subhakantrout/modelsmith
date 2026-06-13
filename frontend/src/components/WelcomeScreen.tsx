import { useEffect, useState } from "react";
import { useSystemStore } from "../stores";
import { api } from "../lib/api";
import type { PipelinePreset } from "../types/api";

interface WelcomeScreenProps {
  onStart: () => void;
}

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  const info = useSystemStore((s) => s.info);
  const loading = useSystemStore((s) => s.loading);
  const error = useSystemStore((s) => s.error);
  const fetchSpecs = useSystemStore((s) => s.fetchSpecs);
  const [presets, setPresets] = useState<PipelinePreset[]>([]);
  const [presetsLoading, setPresetsLoading] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  useEffect(() => {
    if (!info && !loading && !error) {
      fetchSpecs();
    }
  }, [info, loading, error, fetchSpecs]);

  useEffect(() => {
    setPresetsLoading(true);
    api.advisor.presets()
      .then((r: any) => setPresets(r.presets))
      .catch(() => {})
      .finally(() => setPresetsLoading(false));
  }, []);

  const tier = info?.tier ?? 0;

  return (
    <div className="h-screen w-screen bg-gray-900 text-gray-100 flex items-center justify-center">
      <div className="max-w-2xl text-center space-y-6 px-4">
        <div>
          <h1 className="text-4xl font-bold text-blue-400">ModelSmith</h1>
          <p className="text-gray-400 mt-2">Surgical model editing for local AI</p>
        </div>

        {loading && (
          <div className="text-sm text-gray-400 animate-pulse">Detecting system...</div>
        )}

        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-3 text-sm text-red-300">
            <p>Failed to detect system: {error}</p>
            <button onClick={fetchSpecs} className="mt-2 text-xs text-red-200 underline hover:text-red-100">
              Retry
            </button>
          </div>
        )}

        {info && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-left space-y-3">
            <h3 className="text-sm font-medium text-gray-300">System Specs</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-gray-400">RAM:</div>
              <div className="text-gray-200 text-right">{info.specs.ram_total_gb} GB</div>
              <div className="text-gray-400">VRAM:</div>
              <div className="text-gray-200 text-right">
                {info.specs.gpu_vram_gb ? `${info.specs.gpu_vram_gb} GB` : "N/A"}
              </div>
              <div className="text-gray-400">GPU:</div>
              <div className="text-gray-200 text-right truncate">
                {info.specs.gpu_name || "No GPU detected"}
              </div>
              <div className="text-gray-400">Tier:</div>
              <div className={`text-right font-mono ${tier >= 3 ? "text-yellow-400" : tier >= 2 ? "text-cyan-400" : "text-gray-400"}`}>
                {tier}
              </div>
              <div className="text-gray-400">Working Budget:</div>
              <div className="text-gray-200 text-right">
                {info.budget.working_budget_gb} GB
              </div>
            </div>

            {presets.length > 0 && (
              <>
                <h3 className="text-sm font-medium text-gray-300 pt-2">Recommended Pipelines</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {presets.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => setSelectedPreset(preset.id === selectedPreset ? null : preset.id)}
                      className={`text-left px-3 py-2 text-xs rounded border transition-colors ${
                        selectedPreset === preset.id
                          ? "bg-blue-900/50 border-blue-500 text-blue-200"
                          : "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                      }`}
                    >
                      <div className="font-medium text-sm">{preset.name}</div>
                      <div className="text-gray-400 mt-0.5">{preset.description}</div>
                      <div className="text-gray-500 mt-1">
                        {preset.pipeline.length} steps: {preset.pipeline.map((s) => s.type).join(" → ")}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {presetsLoading && (
              <p className="text-xs text-gray-500 animate-pulse">Loading recommendations...</p>
            )}
          </div>
        )}

        <button
          onClick={onStart}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors"
        >
          Open Pipeline Canvas
        </button>
      </div>
    </div>
  );
}

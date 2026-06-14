import { useEffect, useState } from "react";
import { useSystemStore } from "../stores";
import { api } from "../lib/api";
import type { PipelinePreset } from "../types/api";
import { Cpu, MemoryStick, HardDrive, Zap, ChevronRight, CheckCircle2 } from "lucide-react";
import { Logo } from "./Logo";

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
    <div className="h-screen w-screen bg-gray-950 text-gray-100 flex items-center justify-center overflow-hidden relative font-sans">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[100px] mix-blend-screen animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-4xl px-6 flex flex-col md:flex-row items-stretch gap-8 animate-fade-in-up opacity-0" style={{ animationDelay: '0.1s' }}>
        
        {/* Left Column - Branding & Call to Action */}
        <div className="flex-1 flex flex-col justify-center space-y-8">
          <div>
            <Logo className="w-16 h-16 mb-4 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
            <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 text-transparent bg-clip-text drop-shadow-sm">
              ModelSmith
            </h1>
            <p className="text-lg text-gray-400 mt-3 font-medium max-w-md">
              Surgical model editing, abliteration, and compilation for local AI. Built for the desktop.
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={onStart}
              className="group relative inline-flex items-center justify-center gap-2 px-8 py-3.5 text-sm font-semibold text-white bg-blue-600 rounded-xl overflow-hidden shadow-[0_0_40px_-10px_rgba(37,99,235,0.5)] hover:shadow-[0_0_60px_-15px_rgba(37,99,235,0.7)] transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-600 to-indigo-600 group-hover:from-blue-500 group-hover:to-indigo-500 transition-colors"></div>
              <span className="relative flex items-center gap-2">
                Open Pipeline Canvas
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
            <p className="text-xs text-gray-500 flex items-center gap-1.5 ml-1">
              <CheckCircle2 size={12} className="text-green-500" />
              All processing happens securely on your local hardware.
            </p>
          </div>
        </div>

        {/* Right Column - System & Presets */}
        <div className="flex-1 flex flex-col gap-4">
          
          {/* System Specs Glass Card */}
          <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-5 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px] group-hover:bg-blue-500/20 transition-colors rounded-full -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                <HardDrive size={16} className="text-blue-400" />
                System Capability
              </h3>
              {loading && <span className="text-[10px] uppercase tracking-wider text-blue-400 animate-pulse">Detecting...</span>}
              {!loading && info && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wider border ${
                  tier >= 3 ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" : 
                  tier >= 2 ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" : 
                  "bg-gray-500/10 text-gray-400 border-gray-500/20"
                }`}>
                  TIER {tier}
                </span>
              )}
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-800/50 rounded-lg p-3 text-xs text-red-300 flex items-start gap-2">
                <span className="shrink-0 mt-0.5">⚠️</span>
                <div>
                  <p>{error}</p>
                  <button onClick={fetchSpecs} className="mt-1 text-red-400 hover:text-red-300 font-medium hover:underline">Retry detection</button>
                </div>
              </div>
            )}

            {info && (
              <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-gray-800/80 border border-gray-700/50">
                    <MemoryStick size={16} className="text-indigo-400" />
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">System RAM</div>
                    <div className="text-sm font-semibold text-gray-200">{info.specs.ram_total_gb} GB</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-gray-800/80 border border-gray-700/50">
                    <Cpu size={16} className="text-green-400" />
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">VRAM / GPU</div>
                    <div className="text-sm font-semibold text-gray-200 truncate pr-2" title={info.specs.gpu_name || "CPU Only"}>
                      {info.specs.gpu_vram_gb ? `${info.specs.gpu_vram_gb} GB` : "N/A"}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Recommended Workflows Glass Card */}
          <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-5 shadow-2xl flex-1 flex flex-col">
            <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-4">
              <Zap size={16} className="text-yellow-400" />
              Recommended Workflows
            </h3>
            
            {presetsLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-xs text-gray-500 animate-pulse">Loading presets...</div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto pr-2 space-y-2 scrollbar-thin">
                {presets.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-4">No presets available.</p>
                ) : (
                  presets.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => setSelectedPreset(preset.id === selectedPreset ? null : preset.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all duration-200 group ${
                        selectedPreset === preset.id
                          ? "bg-blue-600/20 border-blue-500/50 shadow-[0_0_20px_-5px_rgba(59,130,246,0.3)]"
                          : "bg-gray-800/50 border-gray-700/50 hover:bg-gray-800 hover:border-gray-600"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className={`text-sm font-semibold ${selectedPreset === preset.id ? "text-blue-300" : "text-gray-200 group-hover:text-blue-300"} transition-colors`}>
                          {preset.name}
                        </div>
                        <ChevronRight size={14} className={`${selectedPreset === preset.id ? "text-blue-400 rotate-90" : "text-gray-600"} transition-transform`} />
                      </div>
                      <div className="text-xs text-gray-400 mt-1 leading-relaxed line-clamp-2">
                        {preset.description}
                      </div>
                      
                      {selectedPreset === preset.id && (
                        <div className="mt-3 pt-3 border-t border-gray-700/50 animate-fade-in">
                          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 font-medium">Pipeline execution flow:</div>
                          <div className="flex flex-wrap gap-1.5">
                            {preset.pipeline.map((step, idx) => (
                              <div key={idx} className="flex items-center gap-1.5">
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-950 border border-gray-800 text-gray-300">
                                  {step.type}
                                </span>
                                {idx < preset.pipeline.length - 1 && <ChevronRight size={10} className="text-gray-600" />}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}

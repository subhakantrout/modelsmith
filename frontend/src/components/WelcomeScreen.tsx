import { useEffect } from "react";
import { useSystemStore } from "../stores";
import { Logo } from "./Logo";

interface WelcomeScreenProps {
  onStart: () => void;
}

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  const info = useSystemStore((s) => s.info);
  const loading = useSystemStore((s) => s.loading);
  const error = useSystemStore((s) => s.error);
  const fetchSpecs = useSystemStore((s) => s.fetchSpecs);

  useEffect(() => {
    if (!info && !loading && !error) {
      fetchSpecs();
    }
  }, [info, loading, error, fetchSpecs]);

  const gpuName = info?.specs.gpu_name;
  const vram = info?.specs.gpu_vram_gb;
  const ram = info?.specs.ram_total_gb;

  return (
    <div className="h-screen w-screen bg-gray-950 text-gray-100 flex items-center justify-center overflow-hidden relative">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/3 left-1/3 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[150px] mix-blend-screen"></div>
        <div className="absolute bottom-1/3 right-1/3 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[130px] mix-blend-screen"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-10 animate-fade-in-up opacity-0">
        <Logo className="w-20 h-20 drop-shadow-[0_0_30px_rgba(99,102,241,0.4)]" />

        <div className="text-center space-y-3">
          <h1 className="text-6xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-fuchsia-400 text-transparent bg-clip-text">
            ModelSmith
          </h1>
          <p className="text-lg text-gray-500 font-light tracking-wide">
            Local AI tooling, built for the desktop.
          </p>
        </div>

        <button
          onClick={onStart}
          className="group relative inline-flex items-center justify-center px-10 py-4 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-[0_0_40px_-10px_rgba(99,102,241,0.4)] hover:shadow-[0_0_60px_-12px_rgba(99,102,241,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        >
          <span className="relative flex items-center gap-2">
            Get Started
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="group-hover:translate-x-0.5 transition-transform">
              <path d="M3 8h8M8 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </button>

        <div className="h-5">
          {loading && (
            <span className="text-xs text-gray-600 animate-pulse">Detecting system...</span>
          )}
          {!loading && info && (
            <span className="text-xs text-gray-600">
              {[gpuName, vram && `${vram} GB VRAM`, ram && `${ram} GB RAM`].filter(Boolean).join(" · ")}
            </span>
          )}
          {!loading && error && (
            <span className="text-xs text-gray-700">System ready</span>
          )}
        </div>
      </div>
    </div>
  );
}

import { useSystemStore } from "../stores";

export function BottomBar() {
  const info = useSystemStore((s) => s.info);
  const loading = useSystemStore((s) => s.loading);

  const gpuName = info?.specs.gpu_name;
  const vram = info?.specs.gpu_vram_gb;
  const ram = info?.specs.ram_total_gb;
  const platform = info?.specs.platform;

  return (
    <footer className="h-6 bg-gray-950 border-t border-gray-800/60 flex items-center px-3 gap-3 shrink-0">
      <span className="text-[10px] text-gray-600">
        ModelSmith v1.0.0
      </span>
      <div className="w-px h-3 bg-gray-800" />
      {loading ? (
        <span className="text-[10px] text-gray-700 animate-pulse">Detecting system...</span>
      ) : info ? (
        <span className="text-[10px] text-gray-600">
          {[gpuName, vram && `${vram} GB VRAM`, ram && `${ram} GB RAM`, platform].filter(Boolean).join(" · ")}
        </span>
      ) : (
        <span className="text-[10px] text-gray-700">System ready</span>
      )}
      <div className="flex-1" />
      <span className="text-[10px] text-gray-700">All processing on local hardware</span>
    </footer>
  );
}

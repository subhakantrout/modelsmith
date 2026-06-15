import { useMemo } from "react";
import { Cpu, HardDrive, AlertTriangle } from "lucide-react";
import { useSystemStore, usePipelineStore } from "../stores";

const OP_COST: Record<string, { ram: number; vram: number }> = {
  modelInput: { ram: 0.5, vram: 0 },
  analyze: { ram: 0.1, vram: 0 },
  abliterate: { ram: 0.1, vram: 0.3 },
  compress: { ram: 0.1, vram: 0.2 },
  lora: { ram: 0.3, vram: 0.3 },
  export: { ram: 0.1, vram: 0 },
};

function barColor(pct: number): string {
  if (pct < 60) return "bg-green-500";
  if (pct < 80) return "bg-yellow-500";
  return "bg-red-500";
}

function textColor(pct: number): string {
  if (pct < 60) return "text-green-400";
  if (pct < 80) return "text-yellow-400";
  return "text-red-400";
}

export function VramBudget() {
  const systemInfo = useSystemStore((s) => s.info);
  const nodes = usePipelineStore((s) => s.nodes);

  const { totalRam, totalVram, baseModelGb, finalModelGb, nodeBreakdown } = useMemo(() => {
    let ram = 0;
    let vram = 0;
    let base = 7;
    const breakdown: { label: string; ram: number; vram: number }[] = [];

    for (const node of nodes) {
      const type = node.data.type;
      const config = node.data.config;

      if (type === "modelInput") {
        base = (config.model_size_billions as number) || 7;
        breakdown.push({ label: "Model Input", ram: 0.5, vram: 0 });
        ram += 0.5;
      } else if (type === "merge") {
        const cost = 2 * base;
        breakdown.push({ label: "Merge", ram: cost, vram: 0 });
        ram += cost;
      } else {
        const cost = OP_COST[type];
        if (cost) {
          breakdown.push({ label: node.data.label, ram: cost.ram, vram: cost.vram });
          ram += cost.ram;
          vram += cost.vram;
        }
      }
    }

    let finalGb = base;
    let compressCount = nodes.filter((n) => n.data.type === "compress").length;
    if (compressCount > 0) finalGb = base * Math.pow(0.6, compressCount);
    if (nodes.some((n) => n.data.type === "abliterate")) finalGb *= 0.95;

    return { totalRam: ram, totalVram: vram, baseModelGb: base, finalModelGb: finalGb, nodeBreakdown: breakdown };
  }, [nodes]);

  const ramTotal = systemInfo?.specs?.ram_total_gb ?? 16;
  const vramTotal = systemInfo?.specs?.gpu_vram_gb ?? 0;
  const hasVram = vramTotal > 0;

  const ramPct = Math.min((totalRam / ramTotal) * 100, 100);
  const vramPct = hasVram ? Math.min((totalVram / vramTotal) * 100, 100) : 0;

  return (
    <div className="bg-gray-900/95 backdrop-blur-xl border-t border-gray-800 p-3">
      {nodes.length === 0 ? (
        <p className="text-[10px] text-gray-600 text-center">Add pipeline nodes to estimate memory usage</p>
      ) : (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500 shrink-0">
            <Cpu size={11} /> Budget
          </div>

          <div className="flex-1 max-w-[200px]">
            <div className="flex items-center justify-between text-[9px] mb-0.5">
              <span className="text-gray-500">RAM</span>
              <span className={`font-mono ${textColor(ramPct)}`}>{totalRam.toFixed(1)}GB/{ramTotal}GB</span>
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${barColor(ramPct)}`} style={{ width: `${ramPct}%` }} />
            </div>
          </div>

          {hasVram && (
            <div className="flex-1 max-w-[200px]">
              <div className="flex items-center justify-between text-[9px] mb-0.5">
                <span className="text-gray-500">VRAM</span>
                <span className={`font-mono ${textColor(vramPct)}`}>{totalVram.toFixed(1)}GB/{vramTotal}GB</span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${barColor(vramPct)}`} style={{ width: `${vramPct}%` }} />
              </div>
            </div>
          )}

          <div className="text-[9px] text-gray-500 font-mono shrink-0">
            Model: {baseModelGb.toFixed(0)} → {finalModelGb.toFixed(0)} GB
          </div>

          {(ramPct >= 80 || vramPct >= 80) && (
            <div className="flex items-center gap-1 text-[9px] text-red-400 bg-red-900/20 px-1.5 py-0.5 rounded shrink-0">
              <AlertTriangle size={9} />
              Over budget
            </div>
          )}
        </div>
      )}
    </div>
  );
}

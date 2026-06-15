import { ArrowUp, ArrowDown, Minus } from "lucide-react";

interface DiffMetric {
  label: string;
  before: number | string;
  after: number | string;
  better: "up" | "down" | "same";
}

interface DiffViewProps {
  beforeLabel: string;
  afterLabel: string;
  metrics: DiffMetric[];
}

export function DiffView({ beforeLabel, afterLabel, metrics }: DiffViewProps) {
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden text-[11px]">
      <div className="grid grid-cols-3 border-b border-gray-700">
        <div className="px-3 py-2 font-medium text-gray-400">{beforeLabel}</div>
        <div className="px-3 py-2 font-medium text-gray-400">Metric</div>
        <div className="px-3 py-2 font-medium text-gray-400">{afterLabel}</div>
      </div>
      {metrics.map((m, i) => (
        <div key={i} className="grid grid-cols-3 border-b border-gray-700/50 last:border-b-0 items-center">
          <div className="px-3 py-2 text-gray-300">{m.before}</div>
          <div className="px-3 py-2 text-gray-400 flex items-center gap-1.5">
            {m.better === "up" ? (
              <ArrowUp size={11} className="text-green-400" />
            ) : m.better === "down" ? (
              <ArrowDown size={11} className="text-green-400" />
            ) : (
              <Minus size={11} className="text-gray-500" />
            )}
            {m.label}
          </div>
          <div className="px-3 py-2 text-gray-300">{m.after}</div>
        </div>
      ))}
    </div>
  );
}

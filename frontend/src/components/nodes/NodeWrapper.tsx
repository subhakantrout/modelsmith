import { memo, type ReactNode } from "react";
import { Handle, Position, useReactFlow } from "@xyflow/react";
import type { PipelineNodeData } from "../../stores";
import { 
  Box, Scissors, Combine, Layers, 
  Download, FileArchive, Activity,
  Loader2, AlertCircle, CheckCircle2, Circle
} from "lucide-react";

interface NodeWrapperProps {
  data: PipelineNodeData;
  children: ReactNode;
}

interface TypeStyle {
  color: string;
  icon: any;
  bg: string;
  glow: string;
  ring: string;
  handleBg: string;
}

const typeConfig: Record<string, TypeStyle> = {
  modelInput: {
    color: "text-indigo-400", bg: "bg-indigo-950/40 border-indigo-500/40",
    glow: "shadow-indigo-500/25", ring: "ring-indigo-500/30", handleBg: "bg-indigo-400",
    icon: Box,
  },
  abliterate: {
    color: "text-rose-400", bg: "bg-rose-950/40 border-rose-500/40",
    glow: "shadow-rose-500/25", ring: "ring-rose-500/30", handleBg: "bg-rose-400",
    icon: Scissors,
  },
  merge: {
    color: "text-violet-400", bg: "bg-violet-950/40 border-violet-500/40",
    glow: "shadow-violet-500/25", ring: "ring-violet-500/30", handleBg: "bg-violet-400",
    icon: Combine,
  },
  lora: {
    color: "text-amber-400", bg: "bg-amber-950/40 border-amber-500/40",
    glow: "shadow-amber-500/25", ring: "ring-amber-500/30", handleBg: "bg-amber-400",
    icon: Layers,
  },
  export: {
    color: "text-cyan-400", bg: "bg-cyan-950/40 border-cyan-500/40",
    glow: "shadow-cyan-500/25", ring: "ring-cyan-500/30", handleBg: "bg-cyan-400",
    icon: Download,
  },
  compress: {
    color: "text-emerald-400", bg: "bg-emerald-950/40 border-emerald-500/40",
    glow: "shadow-emerald-500/25", ring: "ring-emerald-500/30", handleBg: "bg-emerald-400",
    icon: FileArchive,
  },
  analyze: {
    color: "text-blue-400", bg: "bg-blue-950/40 border-blue-500/40",
    glow: "shadow-blue-500/25", ring: "ring-blue-500/30", handleBg: "bg-blue-400",
    icon: Activity,
  },
};

const statusColor: Record<string, string> = {
  running: "text-blue-400",
  done: "text-green-400",
  error: "text-red-400",
  idle: "text-gray-500",
};

function Handles({ config }: { config: TypeStyle }) {
  try {
    useReactFlow();
    return (
      <>
        <Handle
          type="target"
          position={Position.Top}
          className={`w-3 h-3 border-2 border-gray-900 ${config.handleBg} shadow-[0_0_6px] ${config.glow.replace('shadow-', 'shadow-')} transition-transform duration-200 hover:scale-125`}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          className={`w-3 h-3 border-2 border-gray-900 ${config.handleBg} shadow-[0_0_6px] ${config.glow.replace('shadow-', 'shadow-')} transition-transform duration-200 hover:scale-125`}
        />
      </>
    );
  } catch {
    return null;
  }
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "running":
      return <Loader2 size={14} className="text-blue-400 animate-spin" />;
    case "done":
      return <CheckCircle2 size={14} className="text-green-400" />;
    case "error":
      return <AlertCircle size={14} className="text-red-400" />;
    default:
      return <Circle size={10} className="text-gray-600 fill-current" />;
  }
}

function NodeWrapperInner({ data, children }: NodeWrapperProps) {
  const config = typeConfig[data.type] || {
    ...typeConfig.modelInput,
    color: "text-gray-400", bg: "bg-gray-800 border-gray-600",
    glow: "shadow-gray-500/25", ring: "ring-gray-500/30", handleBg: "bg-gray-400",
  };
  const Icon = config.icon;
  const isRunning = data.status === "running";

  return (
    <div
      className={`
        relative rounded-xl border backdrop-blur-xl shadow-2xl min-w-[240px]
        transition-all duration-300
        hover:shadow-[0_0_30px_-5px_var(--tw-shadow-color)]
        ${config.bg}
        ${isRunning ? 'animate-running-pulse' : 'hover:shadow-[0_0_30px_-5px]'}
        ${isRunning ? `ring-2 ${config.ring} shadow-[0_0_30px_-5px_${config.glow.replace('shadow-', '').replace('/25', '/40')}]` : ''}
        ${config.glow}
      `}
    >
      <div className={`flex items-center justify-between px-3 py-2.5 border-b border-gray-700/30 bg-black/20 rounded-t-xl ${isRunning ? 'border-blue-500/20' : ''}`}>
        <div className="flex items-center gap-2">
          <Icon size={14} className={`${config.color} ${isRunning ? 'animate-glow-pulse' : ''}`} />
          <span className="text-xs font-semibold tracking-wide text-gray-200">{data.label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <StatusIcon status={data.status} />
        </div>
      </div>

      <div className={`px-3 py-3 bg-gray-900/30 rounded-b-xl transition-colors duration-300 ${isRunning ? 'bg-blue-950/20' : ''}`}>
        {children}
      </div>

      {isRunning && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-800 rounded-b-xl overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500/60 via-indigo-400/60 to-blue-500/60 animate-progress-bar rounded-b-xl" />
        </div>
      )}

      <Handles config={config} />
    </div>
  );
}

export const NodeWrapper = memo(NodeWrapperInner);

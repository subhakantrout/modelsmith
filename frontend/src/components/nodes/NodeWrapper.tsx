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

const typeConfig: Record<string, { color: string, icon: any, bg: string }> = {
  modelInput: { color: "text-indigo-400", bg: "bg-indigo-950/50 border-indigo-500/50", icon: Box },
  abliterate: { color: "text-rose-400", bg: "bg-rose-950/50 border-rose-500/50", icon: Scissors },
  merge: { color: "text-violet-400", bg: "bg-violet-950/50 border-violet-500/50", icon: Combine },
  lora: { color: "text-amber-400", bg: "bg-amber-950/50 border-amber-500/50", icon: Layers },
  export: { color: "text-cyan-400", bg: "bg-cyan-950/50 border-cyan-500/50", icon: Download },
  compress: { color: "text-emerald-400", bg: "bg-emerald-950/50 border-emerald-500/50", icon: FileArchive },
  analyze: { color: "text-blue-400", bg: "bg-blue-950/50 border-blue-500/50", icon: Activity },
};

function Handles({ color }: { color: string }) {
  try {
    useReactFlow();
    return (
      <>
        <Handle 
          type="target" 
          position={Position.Top} 
          className={`w-3 h-3 border-2 border-gray-900 ${color.replace('text-', 'bg-')}`} 
        />
        <Handle 
          type="source" 
          position={Position.Bottom} 
          className={`w-3 h-3 border-2 border-gray-900 ${color.replace('text-', 'bg-')}`} 
        />
      </>
    );
  } catch {
    return null;
  }
}

function NodeWrapperInner({ data, children }: NodeWrapperProps) {
  const config = typeConfig[data.type] || { color: "text-gray-400", bg: "bg-gray-800 border-gray-600", icon: Box };
  const Icon = config.icon;

  return (
    <div className={`relative rounded-xl border backdrop-blur-md shadow-2xl min-w-[240px] transition-all duration-200 hover:shadow-[0_0_20px_-5px_rgba(0,0,0,0.5)] ${config.bg} ${data.status === 'running' ? 'ring-2 ring-blue-500/50 shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)]' : ''}`}>
      {/* Node Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-700/50 bg-black/20 rounded-t-xl">
        <div className="flex items-center gap-2">
          <Icon size={14} className={config.color} />
          <span className="text-xs font-semibold tracking-wide text-gray-200 uppercase">{data.label}</span>
        </div>
        
        {/* Status Indicator */}
        <div className="flex items-center">
          {data.status === 'running' && <Loader2 size={14} className="text-blue-400 animate-spin" />}
          {data.status === 'done' && <CheckCircle2 size={14} className="text-green-400" />}
          {data.status === 'error' && <AlertCircle size={14} className="text-red-400" />}
          {data.status === 'idle' && <Circle size={10} className="text-gray-600 fill-current" />}
        </div>
      </div>
      
      {/* Node Body */}
      <div className="px-3 py-3 bg-gray-900/40 rounded-b-xl">
        {children}
      </div>
      
      <Handles color={config.color} />
    </div>
  );
}

export const NodeWrapper = memo(NodeWrapperInner);

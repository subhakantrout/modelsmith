import { memo, type ReactNode } from "react";
import { Handle, Position } from "@xyflow/react";
import type { PipelineNodeData } from "../../stores";

interface NodeWrapperProps {
  data: PipelineNodeData;
  children: ReactNode;
}

const statusColors: Record<string, string> = {
  idle: "bg-gray-500",
  running: "bg-blue-500 animate-pulse",
  done: "bg-green-500",
  error: "bg-red-500",
};

function NodeWrapperInner({ data, children }: NodeWrapperProps) {
  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg shadow-lg min-w-[220px]">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-600 bg-gray-700 rounded-t-lg">
        <span className={`w-2 h-2 rounded-full ${statusColors[data.status] || "bg-gray-500"}`} />
        <span className="text-sm font-medium text-gray-100">{data.label}</span>
      </div>
      <div className="px-3 py-2">{children}</div>
      <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-blue-400" />
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-blue-400" />
    </div>
  );
}

export const NodeWrapper = memo(NodeWrapperInner);

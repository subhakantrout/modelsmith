import { useState, type ReactNode } from "react";
import { FolderOpen, X, ChevronDown, ChevronRight } from "lucide-react";

interface NodeGroupProps {
  groupName: string;
  nodeCount: number;
  onUngroup: () => void;
  children?: ReactNode;
}

export function NodeGroup({ groupName, nodeCount, onUngroup, children }: NodeGroupProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800">
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-gray-500 hover:text-gray-300 transition-colors cursor-pointer shrink-0"
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          </button>
          <FolderOpen size={14} className="text-indigo-400 shrink-0" />
          <span className="text-xs text-gray-200 font-medium truncate">{groupName}</span>
          <span className="text-[10px] text-gray-500 shrink-0">{nodeCount} nodes</span>
        </div>
        <button
          onClick={onUngroup}
          className="text-gray-500 hover:text-red-400 p-1 rounded hover:bg-gray-800 transition-colors cursor-pointer shrink-0"
          title="Ungroup"
        >
          <X size={12} />
        </button>
      </div>
      {!collapsed && children && (
        <div className="border-t border-gray-800 px-3 py-2 space-y-1">
          {children}
        </div>
      )}
      {collapsed && (
        <div className="px-3 pb-2 text-[10px] text-gray-600">
          {nodeCount} node{nodeCount !== 1 ? "s" : ""} hidden
        </div>
      )}
    </div>
  );
}

import { useViewStore } from "../stores/viewStore";
import { usePipelineStore } from "../stores";

export function RightPanel() {
  const currentView = useViewStore((s) => s.currentView);
  const selectedNodeId = usePipelineStore((s) => s.selectedNodeId);
  const nodes = usePipelineStore((s) => s.nodes);
  const selectNode = usePipelineStore((s) => s.selectNode);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

  if (currentView !== "canvas" || !selectedNode) return null;

  const config = selectedNode.data.config;
  const configEntries = Object.entries(config).filter(
    ([, v]) => v !== undefined && v !== null && v !== ""
  );

  return (
    <div className="w-[290px] border-l border-gray-800 bg-gray-900/95 overflow-y-auto shrink-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <span className="text-xs font-medium text-gray-200">
          {selectedNode.data.label}
        </span>
        <button
          onClick={() => selectNode(null)}
          className="text-gray-500 hover:text-gray-300 text-lg leading-none"
        >
          ×
        </button>
      </div>
      <div className="p-3 space-y-3">
        <div className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
          Node Info
        </div>
        <div className="text-xs space-y-2">
          <div className="flex justify-between py-1.5 border-b border-gray-800">
            <span className="text-gray-500">Type</span>
            <span className="text-gray-300">{selectedNode.data.type}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-gray-800">
            <span className="text-gray-500">Status</span>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
              selectedNode.data.status === "done" ? "bg-green-900/30 text-green-400" :
              selectedNode.data.status === "error" ? "bg-red-900/30 text-red-400" :
              selectedNode.data.status === "running" ? "bg-blue-900/30 text-blue-400" :
              "bg-gray-800 text-gray-500"
            }`}>
              {selectedNode.data.status}
            </span>
          </div>
        </div>

        {configEntries.length > 0 && (
          <>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
              Configuration
            </div>
            <div className="text-xs space-y-2">
              {configEntries.map(([key, value]) => (
                <div key={key} className="flex justify-between py-1.5 border-b border-gray-800">
                  <span className="text-gray-500 truncate mr-2">{key}</span>
                  <span className="text-gray-300 truncate max-w-[140px] text-right">
                    {String(value)}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {configEntries.length === 0 && (
          <div className="text-xs text-gray-600 italic text-center py-4">
            No configuration set. Click the node on the canvas to edit.
          </div>
        )}
      </div>
    </div>
  );
}

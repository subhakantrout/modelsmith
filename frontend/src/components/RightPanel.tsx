import { useMemo } from "react";
import { useViewStore } from "../stores/viewStore";
import { usePipelineStore, type PipelineNodeType } from "../stores";

interface ConfigField {
  key: string;
  label: string;
  type: "text" | "select" | "number";
  options?: { label: string; value: string }[];
  placeholder?: string;
}

const NODE_CONFIG_SCHEMAS: Record<PipelineNodeType, ConfigField[]> = {
  modelInput: [
    { key: "path", label: "Model Path", type: "text", placeholder: "/path/to/model.gguf" },
  ],
  analyze: [
    { key: "text", label: "Test Output", type: "text", placeholder: "Paste model output..." },
  ],
  abliterate: [
    { key: "method", label: "Method", type: "select", options: [
      { label: "Direction Ablation", value: "direction_ablation" },
      { label: "Weight Pruning", value: "weight_pruning" },
    ]},
  ],
  merge: [
    { key: "method", label: "Method", type: "select", options: [
      { label: "TIES", value: "ties" },
      { label: "DARE", value: "dare" },
      { label: "Linear", value: "linear" },
    ]},
    { key: "modelPath1", label: "Model Path 1", type: "text", placeholder: "First model path" },
    { key: "modelPath2", label: "Model Path 2", type: "text", placeholder: "Second model path" },
  ],
  lora: [
    { key: "action", label: "Action", type: "select", options: [
      { label: "Apply Adapter", value: "apply" },
      { label: "Fuse into Model", value: "fuse" },
      { label: "Extract LoRA", value: "extract" },
    ]},
    { key: "adapterPath", label: "Adapter Path", type: "text", placeholder: "/path/to/adapter" },
  ],
  export: [
    { key: "format", label: "Format", type: "select", options: [
      { label: "SafeTensors", value: "safetensors" },
      { label: "GGUF", value: "gguf" },
    ]},
    { key: "output_dir", label: "Output Directory", type: "text", placeholder: "/path/to/output" },
  ],
  compress: [
    { key: "quant", label: "Quantization", type: "select", options: [
      { label: "Q4_K_M", value: "q4_k_m" },
      { label: "Q5_0", value: "q5_0" },
      { label: "Q5_K_M", value: "q5_k_m" },
      { label: "Q6_K", value: "q6_k" },
      { label: "Q8_0", value: "q8_0" },
    ]},
    { key: "prune", label: "Layer Pruning", type: "select", options: [
      { label: "Light", value: "light" },
      { label: "Medium", value: "medium" },
      { label: "Heavy", value: "heavy" },
    ]},
    { key: "sparsify", label: "Sparsification", type: "select", options: [
      { label: "None", value: "none" },
      { label: "Magnitude", value: "magnitude" },
      { label: "Structured", value: "structured" },
    ]},
    { key: "kv", label: "KV Cache", type: "select", options: [
      { label: "None", value: "none" },
      { label: "TurboQuant", value: "turboquant" },
      { label: "PCA", value: "pca" },
    ]},
  ],
};

export function RightPanel() {
  const currentView = useViewStore((s) => s.currentView);
  const selectedNodeId = usePipelineStore((s) => s.selectedNodeId);
  const nodes = usePipelineStore((s) => s.nodes);
  const selectNode = usePipelineStore((s) => s.selectNode);
  const updateNodeConfig = usePipelineStore((s) => s.updateNodeConfig);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );

  if (currentView !== "canvas" || !selectedNode) return null;

  const nodeType = selectedNode.data.type as PipelineNodeType;
  const config = selectedNode.data.config;
  const schema = NODE_CONFIG_SCHEMAS[nodeType] || [];

  return (
    <div className="w-[290px] border-l border-gray-800 bg-gray-950/95 overflow-y-auto shrink-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-medium text-gray-200 truncate">
            {selectedNode.data.label}
          </span>
          <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${
            selectedNode.data.status === "done" ? "bg-green-900/30 text-green-400" :
            selectedNode.data.status === "error" ? "bg-red-900/30 text-red-400" :
            selectedNode.data.status === "running" ? "bg-blue-900/30 text-blue-400" :
            "bg-gray-800 text-gray-500"
          }`}>
            {selectedNode.data.status}
          </span>
        </div>
        <button
          onClick={() => selectNode(null)}
          className="text-gray-500 hover:text-gray-300 text-lg leading-none shrink-0 ml-2 cursor-pointer"
        >
          ×
        </button>
      </div>

      <div className="p-3 space-y-3">
        <div className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
          Configuration
        </div>

        {schema.length > 0 && (
          <div className="space-y-2.5">
            {schema.map((field) => {
              const value = config[field.key] as string || "";
              return (
                <div key={field.key}>
                  <label className="text-[10px] text-gray-500 font-medium block mb-1">
                    {field.label}
                  </label>
                  {field.type === "select" ? (
                    <select
                      value={value}
                      onChange={(e) => updateNodeConfig(selectedNode.id, { [field.key]: e.target.value })}
                      className="w-full px-2 py-1.5 text-[11px] bg-gray-800 border border-gray-700 rounded text-gray-200 focus:outline-none focus:border-indigo-500/50 cursor-pointer"
                    >
                      {field.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type === "number" ? "number" : "text"}
                      value={value}
                      onChange={(e) => updateNodeConfig(selectedNode.id, { [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      className="w-full px-2 py-1.5 text-[11px] bg-gray-800 border border-gray-700 rounded text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500/50"
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {schema.length === 0 && (
          <div className="text-xs text-gray-600 italic text-center py-4">
            No configuration fields available.
          </div>
        )}

        <div className="pt-2 border-t border-gray-800">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-2">
            Node Info
          </div>
          <div className="text-[11px] space-y-1.5">
            <div className="flex justify-between">
              <span className="text-gray-500">Type</span>
              <span className="text-gray-300">{nodeType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">ID</span>
              <span className="text-gray-400 text-[10px] font-mono">{selectedNode.id}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

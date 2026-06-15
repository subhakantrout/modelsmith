import { useState, useCallback } from "react";
import type { PipelineNodeType } from "../stores/pipelineStore";
import {
  Box, Scissors, Combine, Layers,
  Download, FileArchive, Activity,
  Search, ChevronLeft, ChevronRight,
} from "lucide-react";

interface PaletteItem {
  type: PipelineNodeType;
  label: string;
  icon: typeof Box;
  color: string;
  category: string;
  description: string;
}

const PALETTE_ITEMS: PaletteItem[] = [
  { type: "modelInput", label: "Model Input", icon: Box, color: "text-indigo-400", category: "Input", description: "Load a model from disk" },
  { type: "analyze", label: "Analyze", icon: Activity, color: "text-blue-400", category: "Analysis", description: "Test refusal behavior" },
  { type: "abliterate", label: "Abliterate", icon: Scissors, color: "text-rose-400", category: "Modification", description: "Remove refusal direction" },
  { type: "merge", label: "Merge", icon: Combine, color: "text-violet-400", category: "Modification", description: "Blend multiple models" },
  { type: "lora", label: "LoRA", icon: Layers, color: "text-amber-400", category: "Modification", description: "Apply adapters" },
  { type: "compress", label: "Compress", icon: FileArchive, color: "text-emerald-400", category: "Modification", description: "Quantize or prune" },
  { type: "export", label: "Export", icon: Download, color: "text-cyan-400", category: "Output", description: "Save in GGUF/SafeTensors" },
];

const CATEGORIES = ["Input", "Analysis", "Modification", "Output"];

interface NodePaletteProps {
  onAddNode: (type: PipelineNodeType) => void;
}

export function NodePalette({ onAddNode }: NodePaletteProps) {
  const [open, setOpen] = useState(true);
  const [search, setSearch] = useState("");

  const filtered = search
    ? PALETTE_ITEMS.filter(
        (item) =>
          item.label.toLowerCase().includes(search.toLowerCase()) ||
          item.type.toLowerCase().includes(search.toLowerCase()) ||
          item.category.toLowerCase().includes(search.toLowerCase())
      )
    : PALETTE_ITEMS;

  const grouped = CATEGORIES.map((cat) => ({
    category: cat,
    items: filtered.filter((i) => i.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <div
      className={`relative border-r border-gray-800 bg-gray-950/90 backdrop-blur-xl transition-all duration-300 shrink-0 ${
        open ? "w-52" : "w-0 overflow-hidden"
      }`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="absolute -right-5 top-3 z-10 w-5 h-10 flex items-center justify-center bg-gray-800 border border-gray-700 rounded-r-md text-gray-400 hover:text-gray-200 hover:bg-gray-700 transition-colors cursor-pointer"
        title={open ? "Collapse" : "Expand"}
      >
        {open ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
      </button>

      <div className="flex flex-col h-full">
        <div className="px-3 pt-3 pb-2 border-b border-gray-800">
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
            Nodes
          </div>
          <div className="relative mt-2">
            <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-600" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full pl-6 pr-2 py-1 text-[11px] bg-gray-800 border border-gray-700 rounded text-gray-300 placeholder-gray-600 focus:outline-none focus:border-indigo-500/50"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-3 scrollbar-thin">
          {grouped.length === 0 && (
            <p className="text-[11px] text-gray-600 text-center py-4">No nodes match</p>
          )}
          {grouped.map(({ category, items }) => (
            <div key={category}>
              <div className="text-[9px] font-semibold text-gray-600 uppercase tracking-widest px-1 mb-1">
                {category}
              </div>
              <div className="space-y-0.5">
                {items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.type}
                      onClick={() => onAddNode(item.type)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all hover:bg-gray-800 group cursor-pointer"
                      title={item.description}
                    >
                      <Icon size={13} className={`${item.color} shrink-0`} />
                      <div className="min-w-0">
                        <div className="text-[11px] font-medium text-gray-300 group-hover:text-gray-100 transition-colors truncate">
                          {item.label}
                        </div>
                        <div className="text-[9px] text-gray-600 truncate">{item.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { create } from "zustand";
import type { ModelInfo, RefusalAnalysis } from "../types/api";
import { api } from "../lib/api";

interface AbliterationResult {
  direction: any;
  apply: any;
}

interface ExportResultData {
  [key: string]: any;
}

interface ModelState {
  inspectedModel: ModelInfo | null;
  modelPath: string;
  analysis: RefusalAnalysis | null;
  abliterationResult: AbliterationResult | null;
  mergeResult: any | null;
  loraResult: any | null;
  exportResult: ExportResultData | null;
  loading: boolean;
  error: string | null;

  setModelPath: (path: string) => void;
  setInspectedModel: (info: any) => void;
  setAnalysis: (analysis: any) => void;
  setAbliterationResult: (result: AbliterationResult) => void;
  setMergeResult: (result: any) => void;
  setLoraResult: (result: any) => void;
  setExportResult: (result: ExportResultData) => void;
  inspectModel: () => Promise<void>;
  analyzeRefusal: (text: string) => Promise<void>;
  clearAnalysis: () => void;
  clearModel: () => void;
}

export const useModelStore = create<ModelState>((set, get) => ({
  inspectedModel: null,
  modelPath: "",
  analysis: null,
  abliterationResult: null,
  mergeResult: null,
  loraResult: null,
  exportResult: null,
  loading: false,
  error: null,

  setModelPath: (path) => set({ modelPath: path }),
  setInspectedModel: (info) => set({ inspectedModel: info }),
  setAnalysis: (analysis) => set({ analysis }),
  setAbliterationResult: (result) => set({ abliterationResult: result }),
  setMergeResult: (result) => set({ mergeResult: result }),
  setLoraResult: (result) => set({ loraResult: result }),
  setExportResult: (result) => set({ exportResult: result }),

  inspectModel: async () => {
    const { modelPath } = get();
    if (!modelPath) return;
    set({ loading: true, error: null });
    try {
      const info = await api.models.inspect(modelPath);
      set({ inspectedModel: info, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  analyzeRefusal: async (text: string) => {
    set({ loading: true, error: null });
    try {
      const analysis = await api.analyze.refusal(text);
      set({ analysis, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  clearAnalysis: () => set({ analysis: null, error: null }),

  clearModel: () =>
    set({ inspectedModel: null, modelPath: "", analysis: null }),
}));

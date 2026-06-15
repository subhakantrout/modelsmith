import type {
  SystemInfo,
  ModelInfo,
  RefusalAnalysis,
  AbliterateResult,
  ExportResult,
  ExportFormatInfo,
  HealthResponse,
  GenerateResponse,
  ChatStatus,
  LoadModelResponse,
  QuantInfo,
  QuantEstimate,
  PruneEstimate,
  SparsifyMethod,
  SparsifyEstimate,
  KVMethod,
  KVEstimate,
  ProjectInfo,
  PipelinePreset,
  AdvisorRecommendation,
  ModelSummary,
  ModelRegistryItem,
  DownloadStatus,
} from "../types/api";

const BASE = "/api";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  const text = await res.text();
  if (!text) return undefined as unknown as T;
  return JSON.parse(text);
}

export const api = {
  health: () => request<HealthResponse>("/health"),

  models: {
    inspect: (path: string) =>
      request<ModelInfo>("/models/inspect", {
        method: "POST",
        body: JSON.stringify({ path }),
      }),
    load: (path: string, model_size_billions?: number) =>
      request<LoadModelResponse>("/models/load", {
        method: "POST",
        body: JSON.stringify({ path, model_size_billions }),
      }),
    unload: () => request<{ status: string }>("/models/unload", { method: "POST" }),
    loaded: () => request<{ loaded: boolean; model: any; memory: any }>("/models/loaded"),
    registry: () => request<{ models: ModelRegistryItem[] }>("/models/registry"),
    summary: () => request<ModelSummary>("/models/summary"),
    scan_directory: (path: string) =>
      request<{ models: ModelRegistryItem[] }>(`/models/scan?path=${encodeURIComponent(path)}`, { method: "POST" }),
  },

  chat: {
    generate: (params: {
      prompt: string;
      max_new_tokens?: number;
      temperature?: number;
      system_prompt?: string;
    }) => request<GenerateResponse>("/chat/generate", {
      method: "POST",
      body: JSON.stringify(params),
    }),
    status: () => request<ChatStatus>("/chat/status"),
  },

  analyze: {
    refusal: (text: string) =>
      request<RefusalAnalysis>("/analyze/refusal", {
        method: "POST",
        body: JSON.stringify({ text }),
      }),
    layers: () => request<any>("/analyze/layers"),
  },

  abliterate: {
    validate: (params: {
      model_path: string;
      layers?: string;
      method?: string;
      model_size_gb?: number;
    }) =>
      request<AbliterateResult>("/abliterate/validate", {
        method: "POST",
        body: JSON.stringify({ layers: "all", method: "direction_ablation", ...params }),
      }),
    findDirection: (
      layer_idx?: number,
      refusal_prompts?: string[],
      compliance_prompts?: string[],
      max_new_tokens?: number
    ) =>
      request<any>("/abliterate/find-direction", {
        method: "POST",
        body: JSON.stringify({
          layer_idx,
          refusal_prompts,
          compliance_prompts,
          max_new_tokens,
        }),
      }),
    apply: (direction: number[], layer_idx: number, scale: number) =>
      request<any>("/abliterate/apply", {
        method: "POST",
        body: JSON.stringify({ direction, layer_idx, scale }),
      }),
    remove: () => request<any>("/abliterate/remove", { method: "POST" }),
    status: () => request<any>("/abliterate/status"),
    layers: () => request<any>("/abliterate/layers"),
  },

  merge: {
    methods: () => request<any>("/merge/methods"),
    validate: (method: string, models: { path: string; size_gb?: number }[]) =>
      request<any>("/merge/validate", {
        method: "POST",
        body: JSON.stringify({ method, models }),
      }),
    run: (method: string, models: { path: string; size_gb?: number }[], output_dir?: string) =>
      request<any>("/merge/run", {
        method: "POST",
        body: JSON.stringify({ method, models, output_dir }),
      }),
  },

  lora: {
    status: () => request<any>("/lora/status"),
    scan: (directory: string) =>
      request<any>("/lora/scan", {
        method: "POST",
        body: JSON.stringify({ directory }),
      }),
    validate: (adapter_path: string) =>
      request<any>("/lora/validate", {
        method: "POST",
        body: JSON.stringify({ adapter_path }),
      }),
    apply: (adapter_path: string) =>
      request<any>("/lora/apply", {
        method: "POST",
        body: JSON.stringify({ adapter_path }),
      }),
    fuse: () => request<any>("/lora/fuse", { method: "POST" }),
    unload: () => request<any>("/lora/unload", { method: "POST" }),
    extract: (output_dir: string) =>
      request<any>("/lora/extract", {
        method: "POST",
        body: JSON.stringify({ output_dir }),
      }),
  },

  system: {
    specs: () => request<SystemInfo>("/system/specs"),
    profiles: () => request<any>("/system/profiles"),
    preflight: (params: { operation: string; model_size_gb?: number; model_count?: number; profile?: string }) =>
      request<any>("/system/preflight", {
        method: "POST",
        body: JSON.stringify(params),
      }),
    resources: () => request<any>("/system/resources"),
  },

  export: {
    validate: (params: {
      model_path: string;
      output_dir: string;
      format: string;
      model_size_gb?: number;
    }) =>
      request<ExportResult>("/export/validate", {
        method: "POST",
        body: JSON.stringify(params),
      }),
    formats: () => request<{ formats: ExportFormatInfo[] }>("/export/formats"),
    run: (format: string, output_dir: string, quant?: string) =>
      request<any>("/export/run", {
        method: "POST",
        body: JSON.stringify({ format, output_dir, quant }),
      }),
  },

  compress: {
    run: (params: {
      quant_id?: string;
      prune_ratio?: string;
      kv_method?: string;
      sparsify_method?: string;
      model_path?: string;
    }) =>
      request<any>("/compress/run", {
        method: "POST",
        body: JSON.stringify(params),
      }),
    quants: () => request<{ quants: QuantInfo[] }>("/compress/quants"),
    sparsificationMethods: () => request<{ methods: SparsifyMethod[] }>("/compress/sparsification-methods"),
    estimateSparsify: (originalGb: number, method: string) =>
      request<SparsifyEstimate>("/compress/sparsify-estimate", {
        method: "POST",
        body: JSON.stringify({ original_gb: originalGb, method }),
      }),
    kvMethods: () => request<{ methods: KVMethod[] }>("/compress/kv-methods"),
    estimateQuant: (originalGb: number, quantId: string) =>
      request<QuantEstimate>("/compress/quant-estimate", {
        method: "POST",
        body: JSON.stringify({ original_gb: originalGb, quant_id: quantId }),
      }),
    estimatePrune: (originalGb: number, ratio: string) =>
      request<PruneEstimate>("/compress/prune-estimate", {
        method: "POST",
        body: JSON.stringify({ original_gb: originalGb, ratio }),
      }),
    estimateKV: (contextLength: number, method: string) =>
      request<KVEstimate>("/compress/kv-estimate", {
        method: "POST",
        body: JSON.stringify({ context_length: contextLength, method }),
      }),
  },

  projects: {
    list: () => request<{ projects: ProjectInfo[] }>("/projects/"),
    save: (id: string, name: string, nodes: any[], edges: any[]) =>
      request<void>("/projects/save", {
        method: "POST",
        body: JSON.stringify({ id, name, nodes, edges }),
      }),
    load: (id: string) => request<any>(`/projects/load/${id}`),
    delete: (id: string) =>
      request<void>(`/projects/delete/${id}`, { method: "DELETE" }),
    exportRecipe: (projectId: string) =>
      request<any>(`/projects/export-recipe/${projectId}`, { method: "POST" }),
    importRecipe: (path: string) =>
      request<any>("/projects/import-recipe", {
        method: "POST",
        body: JSON.stringify({ path }),
      }),
    recipes: () => request<{ recipes: any[] }>("/projects/recipes"),
  },

  hub: {
    search: (query: string, limit = 20) =>
      request<{ results: any[] }>(`/models/hub-search?query=${encodeURIComponent(query)}&limit=${limit}`),
    download: (modelId: string, token?: string, outputDir?: string) =>
      request<{ download_id: string; status: string }>("/models/hub-download", {
        method: "POST",
        body: JSON.stringify({ model_id: modelId, token: token || "", output_dir: outputDir || "" }),
      }),
    downloadStatus: (downloadId: string) =>
      request<DownloadStatus>(`/models/hub-download-status/${downloadId}`),
    downloads: () =>
      request<{ downloads: DownloadStatus[] }>("/models/hub-downloads"),
    pause: (downloadId: string) =>
      request<{ status: string }>(`/models/hub-download-pause/${downloadId}`, { method: "POST" }),
    resume: (downloadId: string) =>
      request<{ status: string }>(`/models/hub-download-resume/${downloadId}`, { method: "POST" }),
    cancel: (downloadId: string) =>
      request<{ status: string }>(`/models/hub-download-cancel/${downloadId}`, { method: "POST" }),
    retry: (downloadId: string) =>
      request<{ download_id: string; status: string }>(`/models/hub-download-retry/${downloadId}`, { method: "POST" }),
    clearCompleted: () =>
      request<{ status: string }>("/models/hub-download-clear", { method: "POST" }),
  },

  pipeline: {
    run: (steps: { id: string; type: string; config: Record<string, unknown> }[]) =>
      request<any>("/pipeline/run", {
        method: "POST",
        body: JSON.stringify({ steps }),
      }),
    nodeTypes: () => request<any>("/pipeline/node-types"),
  },

  advisor: {
    presets: () => request<{ presets: PipelinePreset[] }>("/advisor/presets"),
    recommend: (ramGb: number, vramGb?: number, goal?: string) => {
      const params = new URLSearchParams({ ram_gb: String(ramGb) });
      if (vramGb !== undefined) params.append("vram_gb", String(vramGb));
      if (goal) params.append("goal", goal);
      return request<AdvisorRecommendation>(`/advisor/recommend?${params}`);
    },
    estimateTime: (pipeline: Array<{ type: string }>, modelSizeB?: number) =>
      request<any>("/advisor/estimate-time", {
        method: "POST",
        body: JSON.stringify({ pipeline, model_size_b: modelSizeB || 7 }),
      }),
    dryRun: (pipeline: any[], tier: number, ramGb: number, diskGb: number) =>
      request<any>("/advisor/dry-run", {
        method: "POST",
        body: JSON.stringify({ pipeline, tier, ram_gb: ramGb, disk_gb: diskGb }),
      }),
    alternatives: (failedStep: string, tier: number) =>
      request<{ alternatives: any[] }>(`/advisor/alternatives/${failedStep}?tier=${tier}`),
    compare: (modelA: any, modelB: any) =>
      request<any>("/advisor/compare", {
        method: "POST",
        body: JSON.stringify({ model_a: modelA, model_b: modelB }),
      }),
  },
};
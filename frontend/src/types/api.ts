export interface SystemSpecs {
  ram_total_gb: number;
  ram_available_gb: number;
  cpu_cores: number;
  cpu_threads: number;
  cpu_name: string;
  gpu_name: string | null;
  gpu_vram_gb: number | null;
  platform: string;
  platform_release: string;
}

export interface SystemBudget {
  os_overhead_gb: number;
  available_gb: number;
  safety_buffer_gb: number;
  working_budget_gb: number;
}

export interface SystemInfo {
  specs: SystemSpecs;
  tier: number;
  budget: SystemBudget;
}

export interface ModelInfo {
  path: string;
  filename: string;
  format: string;
  size_gb: number;
  valid: boolean;
  gguf_info?: {
    version: number;
    tensor_count: number;
    metadata_kv_count: number;
  };
  hf_info?: {
    config: Record<string, unknown> | null;
  };
  note?: string;
}

export interface RefusalAnalysis {
  refusal_score: number;
  refusal_level: "none" | "low" | "medium" | "high";
  word_count: number;
  matched_patterns: string[];
}

export interface AbliterateValidation {
  valid: boolean;
  method?: string;
  layers?: string;
  error?: string;
}

export interface AbliterateEstimate {
  estimated_minutes: number;
  method: string;
  model_size_gb: number;
}

export interface AbliterateResult {
  validation: AbliterateValidation;
  estimate: AbliterateEstimate | null;
}

export interface ExportFormatInfo {
  id: string;
  name: string;
}

export interface ExportValidation {
  valid: boolean;
  format?: string;
  error?: string;
}

export interface ExportEstimate {
  format: string;
  original_gb: number;
  estimated_gb: number;
  multiplier: number;
}

export interface ExportResult {
  validation: ExportValidation;
  estimate: ExportEstimate;
}

export interface HealthResponse {
  status: string;
  version: string;
}

export interface GenerateResponse {
  text: string;
  tokens_generated: number;
  elapsed_seconds: number;
  tokens_per_second: number;
}

export interface ChatStatus {
  ready: boolean;
  model_path?: string;
  memory?: {
    allocated: string;
    reserved: string;
  };
}

export interface LoadModelResponse {
  status: string;
  memory?: {
    allocated: string;
    reserved: string;
  };
}

export interface QuantInfo {
  id: string;
  name: string;
  ratio: number;
  description: string;
}

export interface QuantEstimate {
  original_gb: number;
  quantized_gb: number;
  ratio: number;
  savings_gb: number;
  description: string;
}

export interface PruneEstimate {
  original_gb: number;
  prune_ratio: number;
  pruned_gb: number;
  savings_gb: number;
}

export interface SparsifyMethod {
  id: string;
  name: string;
  ratio: number;
  description: string;
}

export interface SparsifyEstimate {
  original_gb: number;
  sparsified_gb: number;
  ratio: number;
  savings_gb: number;
  description: string;
}

export interface KVMethod {
  id: string;
  name: string;
  ratio: number;
  description: string;
}

export interface KVEstimate {
  original_bytes: number;
  original_gb: number;
  compressed_gb: number;
  ratio: number;
  savings_gb: number;
}

export interface ProjectInfo {
  id: string;
  name: string;
  created: string;
  updated: string;
  node_count: number;
}

export interface PipelinePreset {
  id: string;
  name: string;
  description: string;
  pipeline: Array<{ type: string }>;
}

export interface AdvisorRecommendation {
  tier: number;
  feasible: boolean;
  goal: string;
  name: string;
  pipeline: Array<{ type: string }>;
  steps: number;
  warnings: string[];
  recommended_profile: string;
}

export interface ModelRegistryItem {
  name: string;
  path: string;
  format: string;
  size_gb: number;
}

export interface ModelSummary {
  loaded: boolean;
  tier: number;
  hardware: {
    ram_gb: number;
    vram_gb: number | null;
    gpu: string | null;
  };
  model?: {
    path: string;
    tier: string;
    size_b: number;
    memory: Record<string, number>;
  };
}

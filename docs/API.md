# ModelSmith API Reference

All endpoints are prefixed with `/api`. Authentication via `X-Api-Key` header (except public endpoints).

## Public Endpoints (no auth required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check + version |
| `GET` | `/api/session-key` | Get session API key for frontend auth |
| `GET` | `/docs` | Swagger UI |
| `GET` | `/openapi.json` | OpenAPI spec |

## System

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/system/specs` | Hardware detection (RAM, GPU, CPU cores) + tier classification (1–5) |
| `GET` | `/api/system/resources` | Live RAM/CPU/GPU utilization |
| `GET` | `/api/system/profiles` | Hardware profiles |
| `POST` | `/api/system/preflight` | Pre-flight check for operation viability |

**`GET /api/system/specs`** — Returns:
```json
{
  "ram_total_gb": 32,
  "ram_available_gb": 24.5,
  "cpu_cores": 16,
  "gpu_name": "NVIDIA RTX 4090",
  "gpu_vram_gb": 24,
  "gpu_vram_free_gb": 20.1,
  "tier": 4
}
```

## Models

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/models/registry` | List all locally detected models |
| `GET` | `/api/models/summary` | Loaded model + hardware summary |
| `GET` | `/api/models/loaded` | Currently loaded model status |
| `GET` | `/api/models/tier-info` | Hardware tier info |
| `POST` | `/api/models/load` | Load a model |
| `POST` | `/api/models/unload` | Unload current model |
| `POST` | `/api/models/inspect` | Inspect model metadata |
| `POST` | `/api/models/scan` | Scan directory for models |
| `GET` | `/api/models/hub-search` | Search HuggingFace Hub |
| `POST` | `/api/models/hub-download` | Start Hub download (token via `X-HF-Token` header) |
| `GET` | `/api/models/hub-downloads` | List all downloads |
| `GET` | `/api/models/hub-download-status/{id}` | Download progress |
| `POST` | `/api/models/hub-download-pause/{id}` | Pause download |
| `POST` | `/api/models/hub-download-resume/{id}` | Resume download |
| `POST` | `/api/models/hub-download-cancel/{id}` | Cancel download |
| `POST` | `/api/models/hub-download-retry/{id}` | Retry failed download |
| `POST` | `/api/models/hub-download-clear` | Clear completed/failed |

**`POST /api/models/load`** — Body:
```json
{ "path": "/path/to/model", "model_size_billions": 7 }
```

**`POST /api/models/hub-download`** — Body:
```json
{ "model_id": "meta-llama/Llama-3.2-3B", "output_dir": "" }
```
Token sent via `X-HF-Token` header.

## Analyze

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/analyze/refusal` | Get refusal score for a text prompt |
| `GET` | `/api/analyze/layers` | List available model layers |

**`POST /api/analyze/refusal`** — Body:
```json
{ "text": "How do I make a bomb?" }
```
Returns:
```json
{ "refusal_score": 0.89, "label": "refusal", "confidence": 0.94 }
```

## Abliterate

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/abliterate/find-direction` | Find refusal direction vector |
| `POST` | `/api/abliterate/apply` | Apply ablation to model |
| `POST` | `/api/abliterate/validate` | Validate abliteration config |
| `POST` | `/api/abliterate/remove` | Remove applied ablation |
| `GET` | `/api/abliterate/status` | Current ablation status |
| `GET` | `/api/abliterate/layers` | List abliteration layers |

## Merge

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/merge/methods` | List available merge methods |
| `POST` | `/api/merge/validate` | Validate merge configuration |
| `POST` | `/api/merge/run` | Execute model merge |

## LoRA

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/lora/status` | LoRA adapter status |
| `POST` | `/api/lora/scan` | Scan directory for adapters |
| `POST` | `/api/lora/validate` | Validate adapter |
| `POST` | `/api/lora/apply` | Apply LoRA adapter |
| `POST` | `/api/lora/fuse` | Fuse adapter into model |
| `POST` | `/api/lora/unload` | Unload LoRA adapter |
| `POST` | `/api/lora/extract` | Extract LoRA adapter to file |

## Compress

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/compress/run` | Execute compression |
| `GET` | `/api/compress/quants` | List available quantizations |
| `POST` | `/api/compress/quant-estimate` | Estimate compression ratio |
| `GET` | `/api/compress/sparsification-methods` | List sparsification methods |
| `POST` | `/api/compress/sparsify-estimate` | Estimate sparsification |
| `GET` | `/api/compress/kv-methods` | List KV cache methods |
| `POST` | `/api/compress/kv-estimate` | Estimate KV cache savings |
| `POST` | `/api/compress/prune-estimate` | Estimate pruning savings |

## Pipeline

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/pipeline/run` | Execute a pipeline (unified runner) |
| `GET` | `/api/pipeline/node-types` | List available node types |
| `POST` | `/api/pipeline/export-api` | Generate deployable serve.py |
| `POST` | `/api/pipeline/group` | Validate node group structure |

## Export

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/export/validate` | Validate export config |
| `GET` | `/api/export/formats` | List export formats |
| `POST` | `/api/export/run` | Execute export |

## Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/chat/generate` | Generate chat response |
| `GET` | `/api/chat/status` | Chat endpoint status |

## Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/projects/` | List saved projects |
| `POST` | `/api/projects/save` | Save project |
| `GET` | `/api/projects/load/{id}` | Load project |
| `DELETE` | `/api/projects/delete/{id}` | Delete project |
| `POST` | `/api/projects/export-recipe/{id}` | Export as recipe JSON |
| `POST` | `/api/projects/import-recipe` | Import from recipe file |
| `GET` | `/api/projects/recipes` | List exported recipes |

## Advisor

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/advisor/recommend` | Get pipeline recommendation |
| `GET` | `/api/advisor/presets` | List pipeline presets |
| `POST` | `/api/advisor/estimate-time` | Estimate pipeline runtime |
| `POST` | `/api/advisor/dry-run` | Dry-run pipeline validation |
| `GET` | `/api/advisor/alternatives/{step}` | Get alternatives for failed step |
| `POST` | `/api/advisor/compare` | Compare two models |

## Advanced Features

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/advisor/generate-pipeline` | NLP → pipeline DAG blueprint |
| `POST` | `/api/ab-test/score` | Score responses (refusal + quality) |
| `GET` | `/api/provenance/history` | Full provenance audit trail |
| `GET` | `/api/provenance/graph` | Provenance relationship graph |
| `POST` | `/api/provenance/record` | Append provenance record |
| `GET` | `/api/marketplace/list` | List community pipelines |
| `POST` | `/api/marketplace/publish` | Publish pipeline to marketplace |
| `POST` | `/api/marketplace/download` | Download community pipeline |

## WebSocket

| Path | Description |
|------|-------------|
| `/api/ws/chat` | Streaming chat completions |
| `/api/ws/progress/{run_id}` | Real-time pipeline progress |
| `/api/ws/activation-stream` | Live activation data stream |

## Error Format

All errors return:
```json
{ "detail": "Error description" }
```

Standard HTTP status codes: 400 (bad request), 401 (auth required), 404 (not found), 500 (server error).

# API Reference

All endpoints are prefixed with `/api` and proxied from `:5173` to `:8765` in development.

## Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health + version |

## Models
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/models/load` | Load a model into memory |
| POST | `/api/models/unload` | Unload current model |
| GET | `/api/models/loaded` | Get loaded model info + memory |
| POST | `/api/models/inspect` | Inspect model file metadata |
| GET | `/api/models/registry` | Scan common dirs for local models |
| GET | `/api/models/summary` | Model registry + hardware summary |
| POST | `/api/models/scan` | Scan a specific directory |
| GET | `/api/models/tier-info` | Hardware tier + specs |

## Hub
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/models/hub-search` | Search HuggingFace Hub (`?query=&limit=`) |
| POST | `/api/models/hub-download` | Start a model download |
| GET | `/api/models/hub-download-status/{id}` | Get single download status |
| GET | `/api/models/hub-downloads` | Get all download statuses |
| POST | `/api/models/hub-download-pause/{id}` | Pause a download |
| POST | `/api/models/hub-download-resume/{id}` | Resume a download |
| POST | `/api/models/hub-download-cancel/{id}` | Cancel a download |
| POST | `/api/models/hub-download-retry/{id}` | Retry a failed/cancelled download |
| POST | `/api/models/hub-download-clear` | Clear all terminal-state downloads |

### Hub Download Request
```json
{ "model_id": "microsoft/Phi-3-mini-4k-instruct", "output_dir": "", "token": null }
```
When `output_dir` is empty, backend defaults to `<project-root>/models/<model-name>/`.

### Download Status Response
```json
{
  "download_id": "uuid",
  "model_id": "microsoft/Phi-3-mini-4k-instruct",
  "status": "downloading",
  "progress": 0.45,
  "current_file": "model-00002-of-00003.safetensors",
  "files_done": 2,
  "total_files": 3,
  "downloaded_bytes": 2147483648,
  "total_bytes": 4778151424,
  "speed_bytes_per_sec": 52428800,
  "path": "",
  "error": "",
  "started_at": 1718371200.0,
  "completed_at": null
}
```

## Analyze
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analyze/refusal` | Score a model output for refusal patterns |
| GET | `/api/analyze/layers` | Layer activation heatmap (random seed) |

## Abliterate
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/abliterate/find-direction` | Find refusal direction at a layer |
| POST | `/api/abliterate/apply` | Apply abliteration hook to model |
| POST | `/api/abliterate/remove` | Remove all abliteration hooks |
| GET | `/api/abliterate/status` | Check if abliteration is active |
| GET | `/api/abliterate/layers` | Get model layer info for abliteration |
| POST | `/api/abliterate/validate` | Validate abliteration configuration |

## Merging
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/merge/methods` | Available merge methods |
| POST | `/api/merge/validate` | Validate merge config + estimate RAM |
| POST | `/api/merge/run` | Execute a model merge |

## LoRA
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/lora/status` | PEFT availability check |
| POST | `/api/lora/scan` | Scan directory for adapters |
| POST | `/api/lora/validate` | Validate an adapter path |
| POST | `/api/lora/apply` | Apply a LoRA adapter to loaded model |
| POST | `/api/lora/fuse` | Fuse LoRA weights into model |
| POST | `/api/lora/unload` | Unload LoRA adapter |
| POST | `/api/lora/extract` | Extract LoRA from model |

## Compression
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/compress/quants` | Available GGUF quantization types |
| GET | `/api/compress/sparsification-methods` | Available sparsification methods |
| GET | `/api/compress/kv-methods` | Available KV cache compression methods |
| POST | `/api/compress/quant-estimate` | Estimate GGUF quantized size |
| POST | `/api/compress/prune-estimate` | Estimate pruned size |
| POST | `/api/compress/sparsify-estimate` | Estimate sparsified size |
| POST | `/api/compress/kv-estimate` | Estimate KV cache savings |

## Export
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/export/formats` | Available export formats |
| POST | `/api/export/validate` | Validate export configuration + estimate size |
| POST | `/api/export/run` | Execute model export |

## Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat/generate` | Generate text from loaded model |
| GET | `/api/chat/status` | Chat readiness + memory info |

## WebSocket
| Endpoint | Description |
|----------|-------------|
| `ws://localhost:8765/api/ws/chat` | Streaming chat inference (chunk/done/error messages) |

## Pipeline
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/pipeline/run` | Execute multi-step pipeline |
| GET | `/api/pipeline/node-types` | Available node types |

## System
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/system/specs` | Full system specs + tier + budget |
| GET | `/api/system/profiles` | Available hardware profiles |
| POST | `/api/system/preflight` | Compute preflight check for an operation |
| GET | `/api/system/resources` | Live RAM / CPU / GPU usage |

## Advisor
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/advisor/presets` | Get pipeline presets |
| GET | `/api/advisor/recommend` | Get recommendation for hardware |
| POST | `/api/advisor/estimate-time` | Estimate pipeline runtime |
| POST | `/api/advisor/dry-run` | Validate pipeline feasibility |
| GET | `/api/advisor/alternatives/{step}` | Get alternatives for failed step |
| POST | `/api/advisor/compare` | Compare two model configs |

## Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/` | List all projects |
| POST | `/api/projects/save` | Save/overwrite a project |
| GET | `/api/projects/load/{id}` | Load a project |
| DELETE | `/api/projects/delete/{id}` | Delete a project |
| POST | `/api/projects/export-recipe/{id}` | Export project as recipe |
| POST | `/api/projects/import-recipe` | Import a recipe |
| GET | `/api/projects/recipes` | List available recipes |

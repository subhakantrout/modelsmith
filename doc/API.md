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

## Pipeline Steps
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analyze/start` | Run model analysis |
| POST | `/api/abliterate/start` | Run refusal abliteration |
| POST | `/api/abliterate/estimate` | Estimate abliteration time |
| POST | `/api/merge/start` | Merge two models |
| POST | `/api/lora/start` | Apply LoRA adapter |
| POST | `/api/compress/start` | Run compression |
| GET | `/api/compress/quants` | Available quantization types |
| POST | `/api/compress/quant-estimate` | Estimate quantization |
| POST | `/api/compress/prune-estimate` | Estimate pruning |
| POST | `/api/compress/sparsify-estimate` | Estimate sparsification |
| POST | `/api/compress/kv-estimate` | Estimate KV cache compression |
| POST | `/api/export/start` | Export model |
| GET | `/api/export/formats` | Available export formats |
| POST | `/api/export/estimate` | Estimate export size |

## Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat/generate` | Generate text from loaded model |
| GET | `/api/chat/status` | Chat readiness + memory info |

## System
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/system/info` | Full system specs + budget |

## Advisor
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/advisor/presets` | Get pipeline presets |
| GET | `/api/advisor/recommend` | Get recommendation for hardware |
| POST | `/api/advisor/estimate-time` | Estimate pipeline runtime |
| POST | `/api/advisor/dry-run` | Validate pipeline feasibility |
| POST | `/api/advisor/alternatives` | Get alternatives for failed step |
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

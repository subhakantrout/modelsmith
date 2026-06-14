# ModelSmith Phase 3 — Merge, LoRA, Compression, Profiles

## Goal
Add model merging (mergekit), LoRA injection (PEFT), enhanced compression, config profiles, pre-flight checks, and live resource monitoring.

## Architecture
```
backend/
├── core/
│   ├── model_merger.py     # NEW — mergekit integration (TIES, SLERP, DARE, Linear)
│   ├── lora_manager.py     # NEW — PEFT adapter apply/fuse/extract
│   └── config_profiles.py  # NEW — Safe/Balanced/Aggressive configs
├── api/
│   ├── merge.py            # NEW — merge endpoints
│   ├── lora.py             # NEW — LoRA endpoints
│   └── system.py           # MODIFY — add pre-flight, resource monitor
├── main.py                 # MODIFY — register new routers
└── tests/
    ├── test_model_merger.py
    └── test_lora_manager.py

frontend/src/
├── components/
│   └── nodes/
│       ├── MergeNode.tsx    # NEW
│       ├── LoraNode.tsx     # NEW
│       └── index.ts         # MODIFY
├── lib/api.ts               # MODIFY
├── stores/
│   ├── pipelineStore.ts     # MODIFY — add new types
│   ├── pipelineRunner.ts    # MODIFY — add new ops
│   └── index.ts             # MODIFY
└── types/api.ts             # MODIFY
```

## Task 1: Model Merging Core
- `model_merger.py` with mergekit wrapper supporting TIES, SLERP, DARE, Linear
- Validate model paths, estimate output size
- Progress reporting via callback

## Task 2: LoRA Injection Core
- `lora_manager.py` with PEFT wrapper
- Apply adapter, fuse into base, extract LoRA from diff
- List available adapters in a directory

## Task 3: Config Profiles
- `config_profiles.py` with Safe/Balanced/Aggressive preset
- Each profile defines: max_ram_pct, use_gpu, disk_swap, thread_multiplier

## Task 4: Pre-Flight & Resource Monitor
- Pre-flight: estimate peak RAM/disk for any pipeline step
- Resource monitor: track RAM/CPU/GPU in real-time

## Task 5: Frontend
- MergeNode: select methods, add model path, merge
- LoraNode: select adapter, apply/fuse
- Pipeline runner: wire merge, lora operations
- Update node types in pipeline store

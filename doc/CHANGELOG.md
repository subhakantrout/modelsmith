# Changelog

All notable changes to ModelSmith.

## [1.0.0] - 2026-06-14

### Added
- **DownloadManager**: Full background-thread download queue with MAX_CONCURRENT=3, pause/resume/cancel via threading.Event, byte-level progress via HfApi.model_info().siblings, speed/ETA calculations, retry with new task creation, auto-cleanup of terminal-state tasks
- **DownloadManager component**: Persistent bottom panel with Active/History tabs, global polling every 1.2s, progress bars (%, speed, ETA, current file), pause/cancel controls, history with retry/dismiss/clear all
- **HubSearch modal**: Glassmorphism modal for searching HuggingFace Hub, styled result cards (downloads/likes/tags), one-click download opens DownloadManager panel, error banner on failure
- **Dashboard redesign**: Glassmorphism cards (bg-gradient-to-br, backdrop-blur-xl, hover lift), gradient icon containers, StatCard component, header with Hub/Canvas buttons, empty state with CTA to search Hub
- **`_clear_terminal()`**: Auto-removes stale completed/error/cancelled tasks on list_all() to prevent accumulation of old download entries
- **CUDA-aware tier3 test**: Test now expects float16 with CUDA, float32 without; quantization config only when available
- **File-count progress fallback**: When total_bytes is 0, progress falls back to (files_done / total_files)

### Fixed
- **Cancel stuck on "cancelling"**: Added cancel checks after each hf_hub_download returns, after the loop ends, and in except handler — fixes cancel never transitioning to "cancelled" for single-file models
- **Every download silently failed**: hf_hub_download() was called with invalid kwargs (local_dir_use_symlinks, resume_download) that don't exist in huggingface-hub 1.19.0 — removed both params
- **Progress bar stuck at 0%**: model_info() called without files_metadata=True, so file sizes were None → total_bytes=0 → progress never updated
- **Race condition in _schedule_next()**: Added "starting" status to active count so queued tasks don't pile up behind starting-but-not-yet-downloading threads
- **Missing compress pipeline node**: Advisor presets referenced "compress" but pipeline registration was missing — would crash with ValueError: Unknown node type
- **Unload action for LoRA**: _handle_lora imported unload but had no unload branch — added it
- **Dead nvidia_ml import**: Removed always-failing try/except block in system.py
- **Unhandled AttributeError in compress API**: cfg.num_hidden_layers → getattr() with defaults
- **Unhandled TypeError in compressor**: layer_container.__class__() wrapped in try/except with nn.ModuleList fallback
- **Unsafe model get in merge**: m.get("path") added isinstance check to normalize string entries to dicts
- **Duplicate get_tier()**: advisor.py now imports from system.py instead of redefining
- **HubSearch interval leak**: Tracking intervals via useRef<Map> + cleanup on unmount — prevents React state updates on unmounted component

### Changed
- Removed inline hub section from Dashboard (replaced by HubSearch modal + DownloadManager panel)
- Removed stale hubError/downloadingId state from Dashboard
- model_registry.py: total_bytes computed as local var before assignment for speed check; files_done now 1-indexed
- README.md: Updated with Hub integration, Download Manager, new API endpoints, component/store counts
- AGENTS.md: Created for AI assistant context

### Tests
- 143/143 tests passing, 0 TypeScript errors, Vite build clean
- Installed peft library (fixes test_is_peft_available)
- Tier3 test CUDA-aware

### Fixed
- **doc/API.md drift**: Synchronized with actual API routes (analyze/start → analyze/refusal, merge/start → merge/run, etc.)
- **hub_download output_dir not validated**: Added `resolve_model_path()` call before passing to download manager
- **lora/scan directory not validated**: Added `validate_path_exists()` call with path security check
- **run_quantization path injection**: Added `resolve_model_path()` on input/output paths before subprocess call
- **CORS permissive**: Narrowed from `allow_methods=["*"]` to explicit GET/POST/PUT/DELETE/OPTIONS
- **Removed dead `_clear_terminal()` method**: Was the source of the original `list_all()` bug described in analysis

### Known
- NVIDIA driver 550.163.01 supports CUDA 12.4 but PyTorch 2.12.0 needs CUDA 13.0 — GPU acceleration unavailable until manual driver update from NVIDIA.com
- Vite chunk size warnings are cosmetic (single bundle, no code-splitting configured)

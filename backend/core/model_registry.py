import os
import uuid
import time
import threading
import logging
from backend.core.model_loader import detect_format, ModelFormat

logger = logging.getLogger("modelsmith.model_registry")

_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

COMMON_DIRS = [
    os.path.expanduser("~/models"),
    os.path.expanduser("~/Downloads"),
    "/models",
    "/tmp/models",
    os.path.join(_PROJECT_ROOT, "models"),
]

MODEL_EXTS = {".gguf", ".safetensors", ".bin", ".pt", ".pth"}


def scan_directory(directory: str) -> list[dict]:
    if not os.path.isdir(directory):
        raise FileNotFoundError(f"Directory not found: {directory}")
    results = []
    for entry in sorted(os.listdir(directory)):
        full_path = os.path.join(directory, entry)
        if os.path.isfile(full_path):
            ext = os.path.splitext(entry)[1].lower()
            if ext in MODEL_EXTS:
                size_gb = round(os.path.getsize(full_path) / (1024**3), 2)
                fmt = detect_format(full_path)
                results.append({
                    "name": entry,
                    "path": full_path,
                    "format": fmt.value if hasattr(fmt, 'value') else str(fmt),
                    "size_gb": size_gb,
                })
        elif os.path.isdir(full_path):
            has_model = False
            total_size = 0.0
            for root, _dirs, files in os.walk(full_path):
                for fname in files:
                    ext = os.path.splitext(fname)[1].lower()
                    if ext in MODEL_EXTS:
                        has_model = True
                        total_size += os.path.getsize(os.path.join(root, fname))
            if has_model:
                results.append({
                    "name": entry,
                    "path": full_path,
                    "format": "directory",
                    "size_gb": round(total_size / (1024**3), 2),
                })
    return results


def scan_common_dirs() -> list[dict]:
    all_models = []
    for directory in COMMON_DIRS:
        if os.path.isdir(directory):
            try:
                models = scan_directory(directory)
                all_models.extend(models)
            except Exception as e:
                logger.warning(f"Error scanning {directory}: {e}")
    return all_models


def search_hub(query: str, limit: int = 20) -> list[dict]:
    try:
        import httpx
        url = "https://huggingface.co/api/models"
        params = {"search": query, "sort": "downloads", "direction": -1, "limit": limit}
        resp = httpx.get(url, params=params, timeout=10)
        resp.raise_for_status()
        models = resp.json()
        results = []
        for m in models:
            results.append({
                "id": m.get("id", ""),
                "name": m.get("id", "").split("/")[-1],
                "author": m.get("author", m.get("id", "").split("/")[0] if "/" in m.get("id", "") else ""),
                "downloads": m.get("downloads", 0),
                "likes": m.get("likes", 0),
                "pipeline_tag": m.get("pipeline_tag", ""),
                "library_name": m.get("library_name", ""),
            })
        return results
    except ImportError:
        raise RuntimeError("httpx not installed")
    except Exception as e:
        raise RuntimeError(f"Failed to search hub: {e}")


# ── Download Manager ──────────────────────────────────────────────────────────

class DownloadManager:
    MAX_CONCURRENT = 3

    def __init__(self):
        self._tasks: dict[str, dict] = {}
        self._queue: list[str] = []
        self._lock = threading.Lock()

    def start(self, model_id: str, output_dir: str = "", token: str | None = None) -> str:
        if not output_dir:
            output_dir = os.path.join(_PROJECT_ROOT, "models", model_id.split("/")[-1])
        download_id = str(uuid.uuid4())
        now = time.time()
        task = {
            "download_id": download_id,
            "model_id": model_id,
            "output_dir": output_dir,
            "token": token,
            "status": "queued",
            "progress": 0.0,
            "current_file": "",
            "files_done": 0,
            "total_files": 0,
            "downloaded_bytes": 0,
            "total_bytes": 0,
            "speed_bytes_per_sec": 0.0,
            "path": "",
            "error": "",
            "started_at": None,
            "completed_at": None,
            "_cancel": threading.Event(),
            "_pause": threading.Event(),
        }
        with self._lock:
            self._tasks[download_id] = task
            self._queue.append(download_id)
        self._schedule_next()
        return download_id

    def pause(self, download_id: str) -> bool:
        task = self._tasks.get(download_id)
        if not task or task["status"] not in ("downloading",):
            return False
        task["_pause"].set()
        task["status"] = "pausing"
        return True

    def resume(self, download_id: str) -> bool:
        task = self._tasks.get(download_id)
        if not task or task["status"] not in ("pausing", "paused"):
            return False
        task["_pause"].clear()
        return True

    def cancel(self, download_id: str) -> bool:
        task = self._tasks.get(download_id)
        if not task:
            return False
        if task["status"] in ("queued",):
            with self._lock:
                if download_id in self._queue:
                    self._queue.remove(download_id)
            task["status"] = "cancelled"
            task["completed_at"] = time.time()
            return True
        if task["status"] in ("downloading", "pausing", "paused"):
            task["_cancel"].set()
            task["_pause"].clear()
            task["status"] = "cancelling"
            return True
        return False

    def retry(self, download_id: str) -> str | None:
        task = self._tasks.get(download_id)
        if not task or task["status"] not in ("error", "cancelled"):
            return None
        new_id = self.start(task["model_id"], "", task["token"])
        return new_id

    def clear_completed(self):
        with self._lock:
            to_remove = [
                did for did, t in self._tasks.items()
                if t["status"] in ("completed", "error", "cancelled")
            ]
            for did in to_remove:
                del self._tasks[did]

    def list_all(self) -> list[dict]:
        result = []
        for did, t in self._tasks.items():
            entry = {k: v for k, v in t.items() if not k.startswith("_")}
            result.append(entry)
        return result

    def get(self, download_id: str) -> dict | None:
        t = self._tasks.get(download_id)
        if not t:
            return None
        return {k: v for k, v in t.items() if not k.startswith("_")}

    def _schedule_next(self):
        with self._lock:
            active = sum(
                1 for t in self._tasks.values()
                if t["status"] in ("downloading", "pausing", "cancelling", "starting")
            )
            while active < self.MAX_CONCURRENT and self._queue:
                next_id = self._queue.pop(0)
                t = self._tasks.get(next_id)
                if t and t["status"] == "queued":
                    active += 1
                    t["status"] = "starting"
                    t["_cancel"].clear()
                    t["_pause"].clear()
                    t["started_at"] = time.time()
                    thread = threading.Thread(
                        target=_download_worker,
                        args=(self, next_id),
                        daemon=True,
                    )
                    thread.start()

    def _on_task_done(self, download_id: str):
        self._schedule_next()


def _download_worker(mgr: DownloadManager, download_id: str):
    task = mgr._tasks.get(download_id)
    if not task:
        return
    try:
        from huggingface_hub import HfApi, hf_hub_download

        api = HfApi()
        info = api.model_info(task["model_id"], token=task["token"])
        siblings = [s for s in info.siblings if not s.rfilename.endswith("/")]
        file_sizes: dict[str, int] = {s.rfilename: s.size or 0 for s in siblings}
        repo_files = list(file_sizes.keys())

        task["total_files"] = len(repo_files)
        task["total_bytes"] = sum(file_sizes.values())
        os.makedirs(task["output_dir"], exist_ok=True)
        task["status"] = "downloading"

        for i, file_path in enumerate(repo_files):
            if task["_cancel"].is_set():
                task["status"] = "cancelled"
                task["completed_at"] = time.time()
                mgr._on_task_done(download_id)
                return

            # Pause check between files
            while task["_pause"].is_set():
                if task["_cancel"].is_set():
                    task["status"] = "cancelled"
                    task["completed_at"] = time.time()
                    mgr._on_task_done(download_id)
                    return
                task["_pause"].wait(0.3)

            task["current_file"] = file_path
            task["files_done"] = i

            elapsed = time.time() - task["started_at"]
            if task["downloaded_bytes"] > 0 and elapsed > 0:
                task["speed_bytes_per_sec"] = task["downloaded_bytes"] / elapsed

            hf_hub_download(
                repo_id=task["model_id"],
                filename=file_path,
                local_dir=task["output_dir"],
                token=task["token"],
                resume_download=True,
                local_dir_use_symlinks=False,
            )

            task["downloaded_bytes"] += file_sizes.get(file_path, 0)
            if task["total_bytes"] > 0:
                task["progress"] = task["downloaded_bytes"] / task["total_bytes"]

        task["status"] = "completed"
        task["progress"] = 1.0
        task["files_done"] = task["total_files"]
        task["path"] = task["output_dir"]
        task["completed_at"] = time.time()
    except Exception as e:
        task["status"] = "error"
        task["error"] = str(e)
        task["completed_at"] = time.time()
    mgr._on_task_done(download_id)


_dl_manager: DownloadManager | None = None
_dl_lock = threading.Lock()


def get_download_manager() -> DownloadManager:
    global _dl_manager
    if _dl_manager is None:
        with _dl_lock:
            if _dl_manager is None:
                _dl_manager = DownloadManager()
    return _dl_manager


def get_model_summary() -> dict:
    from backend.core.model_manager import get_manager
    from backend.core.system import detect_hardware, get_tier
    mgr = get_manager()
    specs = detect_hardware()
    tier = get_tier(specs["ram_total_gb"], specs.get("gpu_vram_gb"))
    result = {
        "loaded": mgr.is_loaded,
        "tier": tier,
        "hardware": {
            "ram_gb": specs["ram_total_gb"],
            "vram_gb": specs.get("gpu_vram_gb"),
            "gpu": specs.get("gpu_name"),
        },
    }
    if mgr.is_loaded:
        result["model"] = {
            "path": mgr.model_path,
            "tier": mgr.model_tier,
            "size_b": mgr.model_size_b,
            "memory": mgr.get_memory_usage(),
        }
    return result

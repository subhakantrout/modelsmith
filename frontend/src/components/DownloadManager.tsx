import { useEffect, useRef, useState } from "react";
import { useDownloadStore, type DownloadTask } from "../stores/downloadStore";
import { api } from "../lib/api";
import {
  Download, X, Pause, Play, Trash2, RotateCcw, ChevronDown, ChevronUp,
  AlertCircle, CheckCircle, Clock, File,
} from "lucide-react";

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  return `${(b / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatSpeed(bps: number): string {
  if (bps < 1024) return `${bps.toFixed(0)} B/s`;
  if (bps < 1024 * 1024) return `${(bps / 1024).toFixed(0)} KB/s`;
  return `${(bps / (1024 * 1024)).toFixed(1)} MB/s`;
}

function formatEta(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

const STATUS_META: Record<string, { color: string; bg: string; icon: string }> = {
  queued: { color: "text-gray-400", bg: "bg-gray-700", icon: "clock" },
  starting: { color: "text-blue-300", bg: "bg-blue-900/40", icon: "clock" },
  downloading: { color: "text-blue-400", bg: "bg-blue-900/30", icon: "down" },
  pausing: { color: "text-yellow-400", bg: "bg-yellow-900/30", icon: "pause" },
  paused: { color: "text-yellow-300", bg: "bg-yellow-900/40", icon: "play" },
  cancelling: { color: "text-red-400", bg: "bg-red-900/30", icon: "x" },
  cancelled: { color: "text-gray-500", bg: "bg-gray-800", icon: "x" },
  completed: { color: "text-green-400", bg: "bg-green-900/30", icon: "check" },
  error: { color: "text-red-400", bg: "bg-red-900/30", icon: "alert" },
};

export function DownloadManager() {
  const { downloads, panelOpen, setPanelOpen, setDownloads, removeDownload } = useDownloadStore();
  const [tab, setTab] = useState<"active" | "history">("active");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeList = downloads.filter((d) =>
    ["queued", "starting", "downloading", "pausing", "paused", "cancelling"].includes(d.status)
  );
  const historyList = downloads.filter((d) =>
    ["completed", "error", "cancelled"].includes(d.status)
  );
  const activeCount = activeList.length;

  useEffect(() => {
    if (activeCount > 0 && !pollRef.current) {
      pollRef.current = setInterval(async () => {
        try {
          const r = await api.hub.downloads();
          const tasks: DownloadTask[] = (r.downloads || []).map((s: any) => ({
            ...s,
            status: s.status,
          }));
          setDownloads(tasks);
        } catch { /* ignore */ }
      }, 1200);
    }
    if (activeCount === 0 && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [activeCount]);

  if (downloads.length === 0 && !panelOpen) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Collapsed bar */}
      {!panelOpen && (
        <button
          onClick={() => setPanelOpen(true)}
          className="mx-auto mb-2 flex items-center gap-2 px-4 py-1.5 bg-gray-800/90 backdrop-blur-lg border border-gray-600/50 rounded-full text-xs text-gray-300 hover:bg-gray-700/90 shadow-lg transition-all"
        >
          <Download size={12} className="text-blue-400" />
          <span>Downloads</span>
          {activeCount > 0 && (
            <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
              {activeCount}
            </span>
          )}
          <ChevronUp size={12} />
        </button>
      )}

      {/* Expanded panel */}
      {panelOpen && (
        <div className="bg-gray-900/95 backdrop-blur-xl border-t border-gray-700/60 shadow-2xl">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-200 flex items-center gap-1.5">
                  <Download size={14} className="text-blue-400" /> Downloads
                </span>
                {activeCount > 0 && (
                  <span className="text-[11px] text-blue-400 bg-blue-900/40 px-2 py-0.5 rounded-full">
                    {activeCount} active
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex bg-gray-800 rounded-lg text-xs overflow-hidden">
                  <button
                    onClick={() => setTab("active")}
                    className={`px-3 py-1 ${tab === "active" ? "bg-gray-700 text-gray-200" : "text-gray-500 hover:text-gray-300"}`}
                  >
                    Active {activeCount > 0 && `(${activeCount})`}
                  </button>
                  <button
                    onClick={() => setTab("history")}
                    className={`px-3 py-1 ${tab === "history" ? "bg-gray-700 text-gray-200" : "text-gray-500 hover:text-gray-300"}`}
                  >
                    History ({historyList.length})
                  </button>
                </div>
                <button onClick={() => setPanelOpen(false)} className="text-gray-500 hover:text-gray-300 p-1">
                  <ChevronDown size={14} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="px-4 pb-3 max-h-[280px] overflow-y-auto space-y-1.5 scrollbar-thin">
              {tab === "active" && activeList.length === 0 && (
                <p className="text-xs text-gray-500 text-center py-4">No active downloads</p>
              )}
              {tab === "active" && activeList.map((d) => (
                <DownloadRow key={d.download_id} task={d} />
              ))}
              {tab === "history" && historyList.length === 0 && (
                <p className="text-xs text-gray-500 text-center py-4">No completed downloads</p>
              )}
              {tab === "history" && historyList.map((d) => (
                <HistoryRow key={d.download_id} task={d} onRemove={() => removeDownload(d.download_id)} />
              ))}
            </div>

            {/* Footer */}
            {tab === "history" && historyList.length > 0 && (
              <div className="px-4 pb-2 flex gap-2">
                <button
                  onClick={() => api.hub.clearCompleted().then(() => setDownloads(downloads.filter(d => !["completed", "error", "cancelled"].includes(d.status))))}
                  className="text-[11px] text-gray-500 hover:text-gray-300 flex items-center gap-1"
                >
                  <Trash2 size={11} /> Clear All Completed
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DownloadRow({ task }: { task: DownloadTask }) {
  const pct = Math.round(task.progress * 100);
  const speed = task.speed_bytes_per_sec;
  const remaining = task.total_bytes - task.downloaded_bytes;
  const eta = speed > 0 ? remaining / speed : 0;
  const isPaused = task.status === "paused" || task.status === "pausing";
  const isActive = task.status === "downloading" || task.status === "starting";

  return (
    <div className={`rounded-lg border ${isPaused ? "border-yellow-700/40" : "border-gray-700/40"} ${STATUS_META[task.status]?.bg || "bg-gray-800/50"} p-2.5`}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <File size={12} className="text-gray-400 shrink-0" />
          <span className="text-xs font-medium text-gray-200 truncate">{task.model_id}</span>
          <span className={`text-[10px] font-medium ${STATUS_META[task.status]?.color || "text-gray-400"}`}>
            {task.status === "downloading" ? `${pct}%` : task.status}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {isActive && (
            <button
              onClick={() => api.hub.pause(task.download_id)}
              className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-yellow-300 transition-colors"
              title="Pause"
            >
              <Pause size={12} />
            </button>
          )}
          {isPaused && (
            <button
              onClick={() => api.hub.resume(task.download_id)}
              className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-green-300 transition-colors"
              title="Resume"
            >
              <Play size={12} />
            </button>
          )}
          {(isActive || isPaused) && (
            <button
              onClick={() => api.hub.cancel(task.download_id)}
              className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-red-400 transition-colors"
              title="Cancel"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>
      {(isActive || isPaused) && (
        <div className="space-y-1">
          <div className="w-full bg-gray-700/60 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${isPaused ? "bg-yellow-500" : "bg-gradient-to-r from-blue-500 to-blue-400"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-gray-500">
            <span className="truncate max-w-[60%]">{task.current_file || "—"}</span>
            <span className="shrink-0">
              {task.downloaded_bytes > 0 && task.total_bytes > 0
                ? `${formatBytes(task.downloaded_bytes)} / ${formatBytes(task.total_bytes)}`
                : `${task.files_done}/${task.total_files} files`}
              {speed > 0 && ` · ${formatSpeed(speed)}`}
              {eta > 0 && eta < 86400 && ` · ${formatEta(eta)} left`}
            </span>
          </div>
        </div>
      )}
      {task.status === "queued" && (
        <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
          <Clock size={10} /> Waiting for queue...
        </div>
      )}
    </div>
  );
}

function HistoryRow({ task, onRemove }: { task: DownloadTask; onRemove: () => void }) {
  const isError = task.status === "error";
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-700/30 bg-gray-800/30 p-2">
      <div className="flex items-center gap-2 min-w-0">
        {isError ? (
          <AlertCircle size={14} className="text-red-400 shrink-0" />
        ) : (
          <CheckCircle size={14} className="text-green-400 shrink-0" />
        )}
        <span className="text-xs text-gray-300 truncate">{task.model_id}</span>
        {task.path && (
          <span className="text-[10px] text-gray-600 truncate hidden sm:inline">{task.path}</span>
        )}
        {isError && task.error && (
          <span className="text-[10px] text-red-400 truncate max-w-[200px]">{task.error}</span>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {isError && (
          <button
            onClick={() => api.hub.retry(task.download_id).then(() => onRemove())}
            className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-blue-300 transition-colors"
            title="Retry"
          >
            <RotateCcw size={12} />
          </button>
        )}
        <button onClick={onRemove} className="p-1 rounded hover:bg-gray-700 text-gray-500 hover:text-gray-300 transition-colors" title="Dismiss">
          <X size={12} />
        </button>
      </div>
    </div>
  );
}

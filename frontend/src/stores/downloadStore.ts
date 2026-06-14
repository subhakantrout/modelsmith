import { create } from "zustand";

export interface DownloadTask {
  download_id: string;
  model_id: string;
  status: "queued" | "starting" | "downloading" | "pausing" | "paused" | "cancelling" | "cancelled" | "completed" | "error";
  progress: number;
  current_file: string;
  files_done: number;
  total_files: number;
  downloaded_bytes: number;
  total_bytes: number;
  speed_bytes_per_sec: number;
  path?: string;
  error?: string;
  started_at?: number;
  completed_at?: number;
}

interface DownloadState {
  downloads: DownloadTask[];
  panelOpen: boolean;
  hubSearchOpen: boolean;
  setPanelOpen: (open: boolean) => void;
  setHubSearchOpen: (open: boolean) => void;
  upsertDownload: (task: DownloadTask) => void;
  removeDownload: (id: string) => void;
  setDownloads: (downloads: DownloadTask[]) => void;
}

export const useDownloadStore = create<DownloadState>((set) => ({
  downloads: [],
  panelOpen: false,
  hubSearchOpen: false,
  setPanelOpen: (open) => set({ panelOpen: open }),
  setHubSearchOpen: (open) => set({ hubSearchOpen: open }),
  upsertDownload: (task) =>
    set((s) => {
      const i = s.downloads.findIndex((d) => d.download_id === task.download_id);
      if (i >= 0) {
        const next = [...s.downloads];
        next[i] = task;
        return { downloads: next };
      }
      return { downloads: [...s.downloads, task] };
    }),
  removeDownload: (id) =>
    set((s) => ({ downloads: s.downloads.filter((d) => d.download_id !== id) })),
  setDownloads: (downloads) => set({ downloads }),
}));

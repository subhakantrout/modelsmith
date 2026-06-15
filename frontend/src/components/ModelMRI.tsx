import { useEffect, useRef, useState } from "react";
import { Activity, Loader2 } from "lucide-react";

interface ActivationSnapshot {
  norms: Record<string, number>;
  timestamp: number;
}

interface MetaInfo {
  model_family: string;
  num_layers: number;
}

export function ModelMRI() {
  const [connected, setConnected] = useState(false);
  const [meta, setMeta] = useState<MetaInfo | null>(null);
  const [snapshots, setSnapshots] = useState<ActivationSnapshot[]>([]);
  const [status, setStatus] = useState("Connecting...");
  const wsRef = useRef<WebSocket | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.hostname;
    const ws = new WebSocket(`${protocol}//${host}:8765/api/ws/activations`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setStatus("Streaming");
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === "meta") {
        setMeta({ model_family: msg.model_family, num_layers: msg.num_layers });
      } else if (msg.type === "snapshot") {
        setSnapshots((prev) => [...prev.slice(-120), msg]);
      } else if (msg.type === "error") {
        setStatus(`Error: ${msg.message}`);
        setConnected(false);
      }
    };

    ws.onclose = () => {
      setConnected(false);
      setStatus("Disconnected");
    };

    return () => {
      ws.close();
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  // Draw heatmap on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || snapshots.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const numLayers = meta?.num_layers || Object.keys(snapshots[0]?.norms || {}).length;
    if (numLayers === 0) return;

    const width = canvas.width;
    const height = canvas.height;
    const cellH = height / numLayers;
    const visible = Math.min(snapshots.length, 120);
    const cellW = width / visible;

    ctx.fillStyle = "#111318";
    ctx.fillRect(0, 0, width, height);

    for (let col = 0; col < visible; col++) {
      const snap = snapshots[snapshots.length - visible + col];
      if (!snap) continue;
      for (let layer = 0; layer < numLayers; layer++) {
        const norm = snap.norms[String(layer)];
        if (norm === undefined) continue;
        const intensity = Math.min(norm / 50, 1);
        const r = Math.round(56 + intensity * 199);
        const g = Math.round(56 + (1 - intensity) * 100);
        const b = Math.round(56 + (1 - intensity) * 199);
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(col * cellW, layer * cellH, Math.ceil(cellW + 0.5), Math.ceil(cellH + 0.5));
      }
    }
  }, [snapshots, meta]);

  const handleStop = () => {
    wsRef.current?.send(JSON.stringify({ command: "stop" }));
    wsRef.current?.close();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs">
          <Activity size={14} className={connected ? "text-green-400" : "text-gray-600"} />
          <span className="text-gray-400">Status:</span>
          <span className={connected ? "text-green-400" : "text-gray-500"}>
            {connected ? status : "Disconnected"}
          </span>
          {meta && (
            <span className="text-gray-600 ml-1">
              {meta.model_family} &middot; {meta.num_layers} layers
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {connected && <Loader2 size={12} className="text-blue-400 animate-spin" />}
          <button
            onClick={handleStop}
            disabled={!connected}
            className="px-2 py-1 text-[11px] bg-red-900/40 text-red-400 rounded hover:bg-red-800/60 disabled:opacity-30 transition-colors cursor-pointer"
          >
            Stop
          </button>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-2 border border-gray-800">
        <canvas
          ref={canvasRef}
          width={600}
          height={400}
          className="w-full h-[240px] rounded"
        />
        <div className="flex justify-between text-[9px] text-gray-600 mt-1 px-1">
          <span>Layer 0</span>
          <span className="text-gray-700">Time &rarr;</span>
          <span>Layer {meta ? meta.num_layers - 1 : "..."}</span>
        </div>
      </div>

      {!connected && !meta && (
        <p className="text-xs text-gray-600 text-center animate-pulse">
          Connect to a running pipeline to see live activations
        </p>
      )}

      {snapshots.length === 0 && connected && (
        <p className="text-xs text-gray-600 text-center animate-pulse">
          Waiting for activation data...
        </p>
      )}
    </div>
  );
}

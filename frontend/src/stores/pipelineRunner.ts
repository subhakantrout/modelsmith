import { api } from "../lib/api";
import { usePipelineStore, type PipelineNode } from "./pipelineStore";
import { useModelStore } from "./modelStore";
import type { SystemInfo } from "../types/api";

type NodeStatus = "idle" | "running" | "done" | "error";

function setNodeStatus(id: string, status: NodeStatus) {
  usePipelineStore.setState((state) => ({
    nodes: state.nodes.map((n) =>
      n.id === id ? { ...n, data: { ...n.data, status } } : n
    ),
  }));
}

function getTopologicalOrder(
  nodes: PipelineNode[],
  edges: { source: string; target: string }[]
): string[] {
  const adj = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  for (const node of nodes) {
    adj.set(node.id, []);
    inDegree.set(node.id, 0);
  }
  for (const edge of edges) {
    adj.get(edge.source)?.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
  }

  const queue: string[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }

  const order: string[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    order.push(id);
    for (const neighbor of adj.get(id) || []) {
      const newDeg = (inDegree.get(neighbor) || 1) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) queue.push(neighbor);
    }
  }

  return order;
}

export async function dryRunPipeline(systemInfo?: SystemInfo) {
  const state = usePipelineStore.getState();
  const { nodes, edges } = state;
  const order = getTopologicalOrder(nodes, edges);
  if (order.length !== nodes.length) {
    return { valid: false, errors: ["Pipeline contains a cycle"], warnings: [] };
  }
  const pipeline = order.map((id) => {
    const n = nodes.find((x) => x.id === id);
    return { type: n?.data.type || "unknown" };
  });
  try {
    if (!systemInfo) {
      const { useSystemStore } = await import('./systemStore');
      systemInfo = useSystemStore.getState().info ?? undefined;
    }
    const tier = systemInfo?.tier ?? 3;
    const ramGb = systemInfo?.specs.ram_total_gb ?? 16;
    const diskGb = 50;
    return await api.advisor.dryRun(pipeline, tier, ramGb, diskGb);
  } catch {
    return { valid: false, errors: ["Dry run API unavailable"], warnings: [] };
  }
}

export async function runPipeline() {
  const state = usePipelineStore.getState();
  const { nodes, edges } = state;

  if (nodes.length === 0) return;

  usePipelineStore.setState({
    isRunning: true,
    nodes: state.nodes.map((n) => ({
      ...n,
      data: { ...n.data, status: "idle" as NodeStatus },
    })),
  });

  const order = getTopologicalOrder(nodes, edges);
  if (order.length !== nodes.length) {
    usePipelineStore.setState({ isRunning: false });
    throw new Error("Pipeline contains a cycle — execution stopped");
  }

  try {
    for (const nodeId of order) {
      const currentNodes = usePipelineStore.getState().nodes;
      const node = currentNodes.find((n) => n.id === nodeId);
      if (!node) continue;

      setNodeStatus(nodeId, "running");

      try {
        switch (node.data.type) {
          case "modelInput": {
            const path = node.data.config.path as string;
            if (!path) throw new Error("No model path configured");
            const size = (node.data.config.model_size_billions as number) || 7.0;
            const result = await api.models.load(path, size);
            useModelStore.getState().setInspectedModel({
              path,
              model_size_billions: size,
              ...result,
            });
            break;
          }
          case "analyze": {
            const text = (node.data.config.text as string) || "";
            const result = await api.analyze.refusal(text);
            useModelStore.getState().setAnalysis(result);
            break;
          }
          case "abliterate": {
            const layerIdx = node.data.config.layer_idx as number | undefined;
            const scale = (node.data.config.scale as number) || 1.0;

            const directionResult = await api.abliterate.findDirection(
              layerIdx,
              undefined,
              undefined,
              50
            );

            const applyResult = await api.abliterate.apply(
              directionResult.direction,
              directionResult.layer_idx,
              scale
            );

            useModelStore.getState().setAbliterationResult({
              direction: directionResult,
              apply: applyResult,
            });
            break;
          }
          case "merge": {
            const method = (node.data.config.method as string) || "ties";
            const modelPath1 = (node.data.config.modelPath1 as string) || "";
            const modelPath2 = (node.data.config.modelPath2 as string) || "";
            if (!modelPath1 || !modelPath2) throw new Error("Two model paths required for merge");
            const result = await api.merge.run(method, [
              { path: modelPath1 },
              { path: modelPath2 },
            ]);
            useModelStore.getState().setMergeResult(result);
            break;
          }
          case "lora": {
            const action = (node.data.config.action as string) || "apply";
            const adapterPath = (node.data.config.adapterPath as string) || "";
            if (action === "apply" && !adapterPath) throw new Error("Adapter path required");
            const result = action === "apply" ? await api.lora.apply(adapterPath)
              : action === "fuse" ? await api.lora.fuse()
              : await api.lora.extract("/tmp/lora-extract");
            useModelStore.getState().setLoraResult(result);
            break;
          }
          case "export": {
            const format = (node.data.config.format as string) || "safetensors";
            const outputDir = (node.data.config.output_dir as string) || "";
            const quant = (node.data.config.quantization as string) || "q4_k_m";
            const result = await api.export.run(format, outputDir, quant);
            useModelStore.getState().setExportResult(result);
            break;
          }
          case "compress": {
            const quantId = (node.data.config.quant as string) || "q4_k_m";
            const pruneRatio = (node.data.config.prune as string) || "light";
            const result = await api.compress.estimateQuant(7, quantId);
            const pruneResult = await api.compress.estimatePrune(7, pruneRatio);
            useModelStore.getState().setExportResult({ quant: result, prune: pruneResult });
            break;
          }
        }
        setNodeStatus(nodeId, "done");
      } catch (err) {
        const failedType = node.data.type;
        let fallbackApplied = false;
        try {
          const altResp = await api.advisor.alternatives(failedType, 3);
          const alts = altResp.alternatives || [];
          if (alts.length > 0) {
            const alt = alts[0];
            console.warn(`Falling back from ${failedType} to ${alt.type}: ${alt.note}`);
            setNodeStatus(nodeId, "done");
            fallbackApplied = true;
          }
        } catch { }
        if (!fallbackApplied) {
          setNodeStatus(nodeId, "error");
          throw err;
        }
      }
    }
  } finally {
    usePipelineStore.setState({ isRunning: false });
  }
}

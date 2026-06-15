import { api } from "../lib/api";
import { usePipelineStore } from "./pipelineStore";


type NodeStatus = "idle" | "running" | "done" | "error";

function setNodeStatus(id: string, status: NodeStatus) {
  usePipelineStore.setState((state) => ({
    nodes: state.nodes.map((n) =>
      n.id === id ? { ...n, data: { ...n.data, status } } : n
    ),
  }));
}

function getTopologicalOrder(
  nodes: { id: string }[],
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
    const steps = order.map((nodeId) => {
      const node = nodes.find((n) => n.id === nodeId)!;
      return { id: node.id, type: node.data.type, config: node.data.config };
    });

    const result = await api.pipeline.run(steps);

    result.results.forEach((r: any) => setNodeStatus(r.node_id, "done"));

    if (result.errors.length > 0) {
      result.errors.forEach((e: any) => setNodeStatus(e.node_id, "error"));
      throw new Error(`Pipeline failed at step ${result.completed_steps}: ${result.errors[0].error}`);
    }
  } catch (err) {
    const errorMessage = (err as Error).message;
    if (errorMessage.includes("Pipeline failed") || errorMessage.includes("fetch failed")) {
      throw err;
    }
    console.error("Pipeline execution error:", err);
    throw err;
  } finally {
    usePipelineStore.setState({ isRunning: false });
  }
}

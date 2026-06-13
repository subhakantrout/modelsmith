import type { Node, NodeProps } from "@xyflow/react";
import type { PipelineNodeData } from "../../stores";

export type PipelineNode = Node<PipelineNodeData, "pipelineNode">;
export type PipelineNodeProps = NodeProps<PipelineNode>;

export interface NodeField {
  label: string;
  key: string;
  type: "text" | "select" | "number" | "boolean";
  options?: { label: string; value: string }[];
  placeholder?: string;
}

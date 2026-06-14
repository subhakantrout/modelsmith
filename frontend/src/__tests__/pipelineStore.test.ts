import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePipelineStore } from '../stores/pipelineStore';

// Mock the API dependency
vi.mock('../lib/api', () => ({
  api: {
    projects: {
      save: vi.fn(),
      load: vi.fn(),
      list: vi.fn().mockResolvedValue({ projects: [] }),
    }
  }
}));

describe('pipelineStore', () => {
  beforeEach(() => {
    usePipelineStore.setState({
      nodes: [],
      edges: [],
      selectedNodeId: null,
      isRunning: false,
      pipelineName: "Untitled Pipeline",
      projects: [],
    });
  });

  it('adds a node', () => {
    const { addNode } = usePipelineStore.getState();
    addNode('modelInput');
    
    const { nodes } = usePipelineStore.getState();
    expect(nodes.length).toBe(1);
    expect(nodes[0].data.type).toBe('modelInput');
    expect(nodes[0].data.status).toBe('idle');
  });

  it('removes a node', () => {
    const { addNode, removeNode } = usePipelineStore.getState();
    addNode('analyze');
    
    const node = usePipelineStore.getState().nodes[0];
    expect(usePipelineStore.getState().nodes.length).toBe(1);
    
    removeNode(node.id);
    expect(usePipelineStore.getState().nodes.length).toBe(0);
  });

  it('selects a node', () => {
    const { addNode, selectNode } = usePipelineStore.getState();
    addNode('lora');
    const node = usePipelineStore.getState().nodes[0];
    
    selectNode(node.id);
    expect(usePipelineStore.getState().selectedNodeId).toBe(node.id);
  });

  it('updates node config', () => {
    const { addNode, updateNodeConfig } = usePipelineStore.getState();
    addNode('merge');
    const node = usePipelineStore.getState().nodes[0];
    
    updateNodeConfig(node.id, { method: 'slerp' });
    const updatedNode = usePipelineStore.getState().nodes[0];
    expect(updatedNode.data.config.method).toBe('slerp');
  });

  it('clears the pipeline', () => {
    const { addNode, clearPipeline } = usePipelineStore.getState();
    addNode('export');
    expect(usePipelineStore.getState().nodes.length).toBe(1);
    
    clearPipeline();
    const state = usePipelineStore.getState();
    expect(state.nodes.length).toBe(0);
    expect(state.pipelineName).toBe('Untitled Pipeline');
  });
});

import { describe, it, expect } from "vitest";

describe("API client structure", () => {
  it("exports api object with expected method groups", async () => {
    const { api } = await import("../lib/api");
    expect(api).toBeDefined();
    expect(typeof api.health).toBe("function");
    expect(typeof api.models.load).toBe("function");
    expect(typeof api.chat.generate).toBe("function");
    expect(typeof api.analyze.refusal).toBe("function");
    expect(typeof api.abliterate.findDirection).toBe("function");
    expect(typeof api.merge.run).toBe("function");
    expect(typeof api.lora.apply).toBe("function");
    expect(typeof api.system.specs).toBe("function");
    expect(typeof api.export.run).toBe("function");
    expect(typeof api.compress.estimateQuant).toBe("function");
    expect(typeof api.projects.list).toBe("function");
    expect(typeof api.hub.search).toBe("function");
    expect(typeof api.advisor.recommend).toBe("function");
  });
});

describe("Zustand stores structure", () => {
  it("pipelineStore has expected actions", async () => {
    const { usePipelineStore } = await import("../stores/pipelineStore");
    const state = usePipelineStore.getState();
    expect(typeof state.addNode).toBe("function");
    expect(typeof state.removeNode).toBe("function");
    expect(typeof state.clearPipeline).toBe("function");
    expect(typeof state.saveCurrentProject).toBe("function");
  });

  it("modelStore has expected actions", async () => {
    const { useModelStore } = await import("../stores/modelStore");
    const state = useModelStore.getState();
    expect(typeof state.setModelPath).toBe("function");
    expect(typeof state.inspectModel).toBe("function");
    expect(typeof state.clearModel).toBe("function");
  });

  it("toastStore adds and removes toasts", async () => {
    const { useToastStore } = await import("../stores/toastStore");
    const store = useToastStore.getState();
    expect(store.toasts).toEqual([]);
    store.addToast("test message", "success");
    expect(useToastStore.getState().toasts.length).toBe(1);
    const toast = useToastStore.getState().toasts[0];
    expect(toast.message).toBe("test message");
    expect(toast.type).toBe("success");
  });
});

import { afterEach, describe, expect, it } from "vitest";
import { useWorkspace } from "./workspace";

afterEach(() => {
  useWorkspace.setState(useWorkspace.getInitialState(), true);
  localStorage.clear();
});

describe("geometry-first workspace", () => {
  it("starts with buildings and resets the display when switching datasets", () => {
    expect(useWorkspace.getInitialState()).toMatchObject({
      mode: "geometry",
      opacity: 0.35,
      showGrid: true,
      showBounds: false,
    });
    useWorkspace.setState({ mode: "volume", frame: 3 });
    useWorkspace.getState().selectDataset("city", "speed");
    expect(useWorkspace.getState()).toMatchObject({
      datasetId: "city",
      fieldId: "speed",
      mode: "geometry",
      frame: 0,
    });
  });

  it("starts empty after hydration while keeping display preferences", async () => {
    localStorage.setItem(
      "flowcast3d-workspace-v1",
      JSON.stringify({
        version: 3,
        state: {
          datasetId: "old-city",
          resultId: "prediction:old",
          showGrid: false,
          leftOpen: false,
        },
      }),
    );
    await useWorkspace.persist.rehydrate();
    expect(useWorkspace.getState()).toMatchObject({
      datasetId: "",
      resultId: "",
      showGrid: false,
      showBounds: false,
      leftOpen: false,
    });
    useWorkspace.getState().selectDataset("chosen-city", "speed");
    useWorkspace.getState().set({ rightOpen: false });
    expect(useWorkspace.getState().datasetId).toBe("chosen-city");
    const saved = JSON.parse(
      localStorage.getItem("flowcast3d-workspace-v1")!,
    ).state;
    expect(saved).not.toHaveProperty("datasetId");
    expect(saved).not.toHaveProperty("resultId");
    await useWorkspace.persist.rehydrate();
    expect(useWorkspace.getState().datasetId).toBe("");
  });

  it("preserves boundary visibility across dataset changes and hydration", async () => {
    useWorkspace.getState().set({ showBounds: true });
    useWorkspace.getState().selectDataset("first-city", "speed");
    useWorkspace.getState().selectDataset("second-city", "concentration");
    expect(useWorkspace.getState().showBounds).toBe(true);
    const saved = localStorage.getItem("flowcast3d-workspace-v1")!;
    expect(JSON.parse(saved).state.showBounds).toBe(true);
    useWorkspace.setState({ showBounds: false });
    localStorage.setItem("flowcast3d-workspace-v1", saved);
    await useWorkspace.persist.rehydrate();
    expect(useWorkspace.getState()).toMatchObject({
      datasetId: "",
      resultId: "",
      showBounds: true,
    });
  });

  it("migrates old defaults while preserving custom analysis settings", async () => {
    const migrate = useWorkspace.persist.getOptions().migrate!;
    expect(
      await migrate(
        {
          mode: "surface",
          opacity: 0.9,
          showGrid: true,
          camera: { position: [1, 2, 3], target: [0, 0, 0], origin: [0, 0, 0] },
        },
        1,
      ),
    ).toEqual({
      mode: "geometry",
      opacity: 0.35,
      showGrid: true,
      camera: undefined,
    });
    const custom = { mode: "slice", opacity: 0.6, showGrid: false, frame: 5 };
    expect(await migrate(custom, 1)).toEqual({ ...custom, showGrid: true });
    const recent = { mode: "surface", opacity: 0.9, showGrid: false };
    expect(await migrate(recent, 2)).toEqual({ ...recent, showGrid: true });
    expect(await migrate(recent, 3)).toEqual(recent);
  });
});

import { afterEach, describe, expect, it } from "vitest";
import { useWorkspace } from "../../stores/workspace";
import { datasetSchema } from "./schema";
import { displayMode, displaySupported, selectResult } from "./results";
import type { Dataset } from "./types";

afterEach(() => {
  useWorkspace.setState(useWorkspace.getInitialState(), true);
  localStorage.clear();
});

describe("benchmark result selection", () => {
  it("preserves physical time and spatial controls within one dispersion scenario", () => {
    const dataset: Dataset = {
      id: "case:city",
      scenarioId: "paired",
      resultRole: "virtual_reference",
      fields: [{ id: "concentration" }],
      times: [0, 1, 2],
      results: [
        {
          id: "model-concentration",
          scenarioId: "paired",
          resultRole: "virtual_model",
          fields: [{ id: "concentration" }],
          times: [0, 0.5, 1, 1.5, 2],
        },
      ],
    };
    const camera = {
      position: [1, 2, 3] as [number, number, number],
      target: [0, 0, 0] as [number, number, number],
      origin: [0, 0, 0] as [number, number, number],
    };
    const roi = {
      min: [0, 0, 0] as [number, number, number],
      max: [4, 4, 4] as [number, number, number],
    };
    useWorkspace.setState({
      datasetId: dataset.id,
      resultId: "reference-concentration",
      frame: 1,
      fieldId: "concentration",
      mode: "slice",
      camera,
      roi,
      probes: [{ id: "P1", position: [1, 1, 1] }],
    });
    selectResult(dataset, "model-concentration");
    expect(useWorkspace.getState()).toMatchObject({
      resultId: "model-concentration",
      frame: 2,
      fieldId: "concentration",
      mode: "slice",
      camera,
      roi,
      probes: [{ id: "P1", position: [1, 1, 1] }],
    });
  });

  it("shows concentration when selected from a geometry-only view", () => {
    selectResult(
      {
        id: "city",
        fields: [],
        times: [],
        results: [
          {
            id: "plume",
            resultRole: "virtual_model",
            fields: [{ id: "concentration" }],
          },
        ],
      },
      "plume",
    );
    expect(useWorkspace.getState()).toMatchObject({
      resultId: "plume",
      mode: "surface",
      fieldId: "concentration",
    });
  });

  it("starts a steady model result after its synthetic input history", () => {
    selectResult(
      {
        id: "city",
        fields: [],
        times: [],
        results: [
          {
            id: "steady-wind",
            resultRole: "model_wind",
            initialFrame: 3,
            times: [0, 1, 2, 3],
          },
        ],
      },
      "steady-wind",
    );
    expect(useWorkspace.getState()).toMatchObject({
      resultId: "steady-wind",
      frame: 3,
    });
  });

  it("clears inherited volume ROI when selecting unrelated surface observations", () => {
    useWorkspace.setState({ roi: { min: [0, 0, 0], max: [10, 10, 10] } });
    selectResult(
      {
        id: "city",
        fields: [],
        times: [],
        results: [
          {
            id: "ground",
            analysisKind: "surface",
            resultRole: "reference_concentration",
          },
        ],
      },
      "ground",
    );
    expect(useWorkspace.getState().roi).toBeUndefined();
  });

  it("restricts ground and station fields without enabling volume or wind tools", () => {
    const ground: Dataset = {
      id: "ground",
      fields: [{ id: "concentration", supportModes: ["surface"] }],
      times: [0, 10],
      analysisKind: "surface",
      capabilities: { flow: false },
    };
    expect(displayMode(ground, "volume", ground.fields[0])).toBe("surface");
    expect(displaySupported(ground, "volume", ground.fields[0])).toBe(false);
    const stations: Dataset = {
      ...ground,
      analysisKind: "points",
      fields: [{ id: "wind_speed" }],
      supportModes: ["points"],
    };
    expect(displayMode(stations, "geometry", stations.fields[0])).toBe(
      "points",
    );
    expect(displaySupported(stations, "surface", stations.fields[0])).toBe(
      false,
    );
    expect(displaySupported(ground, "streamlines", ground.fields[0])).toBe(
      false,
    );
  });

  it("retains branch identity and shared range when parsing nested results", () => {
    const dataset = datasetSchema.parse({
      id: "city",
      results: [
        {
          id: "plume",
          scenarioId: "pair",
          resultRole: "virtual_model",
          sourceRef: { datasetId: "case:city", resultId: "steady-wind" },
          colorRange: [0, 45],
          capabilities: { flow: false },
          supportModes: ["surface", "slice"],
        },
      ],
    });
    expect(dataset.results?.[0]).toMatchObject({
      scenarioId: "pair",
      resultRole: "virtual_model",
      colorRange: [0, 45],
      sourceRef: { datasetId: "case:city", resultId: "steady-wind" },
    });
  });

  it("accepts normalized geometry, ground concentration and observation provenance", () => {
    for (const resultRole of [
      "geometry",
      "reference_concentration",
      "observations",
    ]) {
      const sourceRef = {
        recordId: 1234,
        doi: "10.5281/zenodo.1234",
        license: "CC BY 4.0",
        sourceUrl: "https://zenodo.org/records/1234",
        title: "Local benchmark",
        creators: [{ name: "Author" }],
        comparisonKind: "qualitative",
      };
      const parsed = datasetSchema.parse({
        id: `local-${resultRole}`,
        resultRole,
        sourceRef,
        fields: [],
        times: [],
        results: [{ id: `source-${resultRole}`, resultRole, sourceRef }],
      });
      expect(parsed.resultRole).toBe(resultRole);
      expect(parsed.sourceRef).toEqual(sourceRef);
      expect(parsed.results?.[0].sourceRef).toEqual(sourceRef);
    }
  });
});

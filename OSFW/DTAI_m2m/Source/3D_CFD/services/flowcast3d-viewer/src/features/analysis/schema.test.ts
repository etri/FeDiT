import { describe, expect, it } from "vitest";
import { analysisSchema } from "./schema";
const fixture = {
  contextKey: "synthetic-known-volume",
  field: { id: "concentration", unit: "kg/m3" },
  time: 2,
  probes: [{ id: "P1", point: [0, 0, 0], value: null }],
  timeseries: [
    {
      id: "P1",
      times: [0, 0.5, 2],
      values: [1, null, 3],
      maximum: 3,
      maxTime: 2,
    },
  ],
  histogram: {
    edges: [0, 2, 4],
    volumes: [4, 2],
    percentages: [66.666, 33.333],
  },
  validVolume: 6,
  thresholdVolume: 2,
  statistics: { minimum: 1, maximum: 3, mean: 1.666 },
};
describe("analysis contracts", () => {
  it("keeps missing values and irregular source times", () => {
    const value = analysisSchema.parse(fixture);
    expect(value.timeseries[0].times).toEqual([0, 0.5, 2]);
    expect(value.timeseries[0].values).toEqual([1, null, 3]);
    expect(
      value.histogram.volumes.reduce((sum, volume) => sum + volume, 0),
    ).toBe(value.validVolume);
  });
  it("rejects stale or malformed shape instead of drawing invented values", () => {
    expect(() =>
      analysisSchema.parse({
        ...fixture,
        timeseries: [{ id: "P1", times: [0, 1], values: [3] }],
      }),
    ).toThrow("length mismatch");
    expect(() =>
      analysisSchema.parse({
        ...fixture,
        histogram: { edges: [0, 1], volumes: [1, 2], percentages: [20, 80] },
      }),
    ).toThrow("length mismatch");
  });

  it("accepts station time series with no invented cell volumes", () => {
    const value = analysisSchema.parse({
      ...fixture,
      analysisKind: "points",
      validVolume: null,
      thresholdVolume: null,
      histogram: {
        edges: [0, 2, 4],
        counts: [3, 2],
        volumes: [],
        percentages: [60, 40],
      },
    });
    expect(value.validVolume).toBeNull();
    expect(value.timeseries[0].values).toEqual([1, null, 3]);
  });
});

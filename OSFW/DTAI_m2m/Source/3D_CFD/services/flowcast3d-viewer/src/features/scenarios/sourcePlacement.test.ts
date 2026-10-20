import { beforeEach, describe, expect, it } from "vitest";
import { useSourcePlacement, validSourcePosition } from "./sourcePlacement";
import type { Bounds } from "../datasets/types";

const bounds: Bounds = [
  [100, 200, 10],
  [200, 300, 30],
];
beforeEach(() =>
  useSourcePlacement.setState({
    datasetId: "",
    bounds: undefined,
    position: undefined,
    height: 1.5,
    picking: false,
  }),
);

describe("source placement", () => {
  it("preserves placement when the same dataset initializes again and resets on dataset change", () => {
    const store = useSourcePlacement.getState();
    store.initialize("city", bounds);
    store.place([130, 240, 15]);
    store.begin();
    store.initialize("city", bounds);
    expect(useSourcePlacement.getState()).toMatchObject({
      position: [130, 240, 15],
      picking: true,
    });
    store.initialize("new-city", bounds);
    expect(useSourcePlacement.getState()).toMatchObject({
      position: [110, 210, 11.5],
      picking: false,
    });
  });
  it("keeps the default height inside a wind-tunnel scale domain", () => {
    useSourcePlacement.getState().initialize("small", [
      [0, 0, 0],
      [1, 1, 0.2],
    ]);
    expect(useSourcePlacement.getState().height).toBeCloseTo(0.02);
    expect(
      validSourcePosition(useSourcePlacement.getState().position!, [
        [0, 0, 0],
        [1, 1, 0.2],
      ]),
    ).toBe(true);
  });
  it("adjusts height above the selected surface and constrains it to the domain", () => {
    const store = useSourcePlacement.getState();
    store.initialize("city", bounds);
    store.place([130, 240, 15]);
    store.setHeight(3);
    expect(useSourcePlacement.getState().position).toEqual([130, 240, 16.5]);
    store.setHeight(100);
    expect(useSourcePlacement.getState().position).toEqual([130, 240, 30]);
    store.setHeight(Number.NaN);
    expect(useSourcePlacement.getState().position).toEqual([130, 240, 30]);
  });
  it("rejects invalid positions without ending selection and cancels without moving the source", () => {
    const store = useSourcePlacement.getState();
    store.initialize("city", bounds);
    store.begin();
    store.place([130, 240, Infinity]);
    store.place([90, 240, 15]);
    expect(useSourcePlacement.getState()).toMatchObject({
      position: [110, 210, 11.5],
      picking: true,
    });
    store.cancel();
    expect(useSourcePlacement.getState()).toMatchObject({
      position: [110, 210, 11.5],
      picking: false,
    });
    store.begin();
    store.place([140, 240, 15]);
    expect(useSourcePlacement.getState()).toMatchObject({
      position: [140, 240, 15],
      picking: false,
    });
  });
  it("keeps height adjustments inside the domain after an explicit low Z coordinate", () => {
    const store = useSourcePlacement.getState();
    store.initialize("city", bounds);
    store.place([130, 240, 10]);
    store.setHeight(0);
    expect(useSourcePlacement.getState()).toMatchObject({
      position: [130, 240, 10],
      height: 1.5,
    });
    store.setHeight(3);
    expect(useSourcePlacement.getState().position).toEqual([130, 240, 11.5]);
  });
  it("accepts a source above a roof when it remains inside the flow domain", () => {
    const store = useSourcePlacement.getState();
    store.initialize("city", bounds);
    store.place([130, 240, 21.5]);
    expect(useSourcePlacement.getState().position).toEqual([130, 240, 21.5]);
    expect(
      validSourcePosition(
        [130, 240, 21.5],
        [
          [120, 220, 10],
          [180, 280, 20],
        ],
      ),
    ).toBe(false);
    expect(
      validSourcePosition(
        [130, 240, 21.5],
        useSourcePlacement.getState().bounds!,
      ),
    ).toBe(true);
  });
  it("rejects malformed dataset bounds", () => {
    useSourcePlacement.getState().initialize("invalid", [
      [100, 200, 30],
      [200, 300, 10],
    ]);
    expect(useSourcePlacement.getState().position).toBeUndefined();
  });
});

import { describe, expect, it } from "vitest";
import { BufferGeometry } from "three";
import { updateStreamlineRibbon } from "./streamlineRibbon";

describe("screen-width particle path ribbons", () => {
  it("preserves physical endpoints and keeps disconnected paths separate", () => {
    const geometry = new BufferGeometry();
    const segments = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1]);
    const before = [...segments];
    const times = new Float32Array([0, 1, 4, 5]);
    updateStreamlineRibbon(geometry, segments, times);
    const {
      position,
      segmentStart,
      segmentEnd,
      ribbonSide,
      ribbonEndpoint,
      segmentTimes,
    } = geometry.attributes;
    expect(position.count).toBe(12);
    for (let vertex = 0; vertex < 12; vertex++) {
      const start = vertex < 6 ? [0, 0, 0] : [0, 1, 1];
      const end = vertex < 6 ? [1, 0, 0] : [1, 1, 1];
      expect([
        segmentStart.getX(vertex),
        segmentStart.getY(vertex),
        segmentStart.getZ(vertex),
      ]).toEqual(start);
      expect([
        segmentEnd.getX(vertex),
        segmentEnd.getY(vertex),
        segmentEnd.getZ(vertex),
      ]).toEqual(end);
      expect([
        position.getX(vertex),
        position.getY(vertex),
        position.getZ(vertex),
      ]).toEqual(ribbonEndpoint.getX(vertex) < 0 ? start : end);
      expect(Math.abs(ribbonSide.getX(vertex))).toBe(1);
      expect([segmentTimes.getX(vertex), segmentTimes.getY(vertex)]).toEqual(
        vertex < 6 ? [0, 1] : [4, 5],
      );
    }
    expect([...segments]).toEqual(before);
    geometry.dispose();
  });

  it("clears old triangles when there are no physical paths", () => {
    const geometry = new BufferGeometry();
    updateStreamlineRibbon(
      geometry,
      new Float32Array([0, 0, 0, 1, 0, 0]),
      new Float32Array([0, 1]),
    );
    updateStreamlineRibbon(geometry, new Float32Array(), new Float32Array());
    expect(geometry.attributes.position.count).toBe(0);
    expect(geometry.attributes.segmentStart.count).toBe(0);
    expect(geometry.attributes.segmentTimes.count).toBe(0);
    geometry.dispose();
  });

  it("rejects malformed or unbounded path buffers before creating ribbon attributes", () => {
    const geometry = new BufferGeometry();
    const positions = new Float32Array([0, 0, 0, 1, 0, 0]);
    const check = (segments: Float32Array, times: Float32Array) => () =>
      updateStreamlineRibbon(geometry, segments, times);
    expect(check(positions.slice(1), new Float32Array([0, 1]))).toThrow(
      /shapes/,
    );
    expect(check(positions, new Float32Array([0]))).toThrow(/shapes/);
    expect(check(positions, new Float32Array([2, 1]))).toThrow(/ordered/);
    expect(check(positions, new Float32Array([0, NaN]))).toThrow(/finite/);
    expect(
      check(
        new Float32Array([0, 0, 0, Infinity, 0, 0]),
        new Float32Array([0, 1]),
      ),
    ).toThrow(/finite/);
    expect(
      check(new Float32Array(200001 * 6), new Float32Array(200001 * 2)),
    ).toThrow(/200000-segment/);
    expect(Object.keys(geometry.attributes)).toHaveLength(0);
    geometry.dispose();
  });

  it("preserves instantaneous birth links without inventing earlier particle time", () => {
    const geometry = new BufferGeometry();
    updateStreamlineRibbon(
      geometry,
      new Float32Array([0, 0, 0, 0.1, 0.1, 0.1]),
      new Float32Array([2, 2]),
    );
    expect(Array.from(geometry.attributes.segmentTimes.array)).toEqual(
      new Array(12).fill(2),
    );
    geometry.dispose();
  });
});

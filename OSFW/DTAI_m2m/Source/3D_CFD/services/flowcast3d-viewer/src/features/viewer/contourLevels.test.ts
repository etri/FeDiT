import { describe, expect, it } from "vitest";
import type { PreparedPlaybackClip } from "./preparedPlayback";
import { getContourLevels } from "./contourLevels";

function clip(arrays: number[][]): PreparedPlaybackClip {
  return {
    key: "levels",
    range: [0, 10_000],
    times: arrays.map((_, index) => index),
    bytes: 0,
    frames: arrays.map((values) => ({
      values: new Float32Array(values),
      mask: new Uint8Array(values.length).fill(1),
    })),
  } as PreparedPlaybackClip;
}

describe("fixed concentration contour levels", () => {
  it("keeps low-concentration surfaces and uses the whole time range without changing raw values or colors", () => {
    const data = clip([
      [0, 0, 1, 2, 3, 4, 5],
      [6, 7, 8, 9, 10, 10_000],
    ]);
    const before = data.frames.map((frame) => [...frame.values]);
    expect(getContourLevels(data)).toEqual([3, 6, 9, 10]);
    expect(getContourLevels(data)).toBe(getContourLevels(data));
    expect(data.range).toEqual([0, 10_000]);
    expect(data.frames.map((frame) => [...frame.values])).toEqual(before);
  });

  it("excludes non-finite, negative and solid-cell samples", () => {
    const data = clip([[0, -1, NaN, Infinity, 2, 4, 8, 9999]]);
    data.frames[0].mask[7] = 0;
    expect(getContourLevels(data)).toEqual([2, 4, 4, 4]);
  });

  it("keeps empty clips finite and recomputes independent clip contexts", () => {
    expect(getContourLevels(clip([[0, 0]]))).toEqual([300, 1000, 3000, 6000]);
    expect(getContourLevels(clip([[20, 40, 60, 80, 100]]))).toEqual([
      20, 60, 80, 80,
    ]);
  });

  it("samples a large clip with a bounded deterministic distribution", () => {
    const data = clip([
      Array.from({ length: 200_000 }, (_, index) => index + 1),
    ]);
    const levels = getContourLevels(data);
    expect(levels[0]).toBeGreaterThan(39_990);
    expect(levels[0]).toBeLessThan(40_010);
    expect(levels[3]).toBeGreaterThan(189_990);
    expect(levels[3]).toBeLessThan(190_010);
  });
});

import { describe, expect, it } from "vitest";
import {
  ASSET_BUDGET,
  boundedAsset,
  decodePoints,
  POINT_BUDGET,
} from "./decode";
describe("scene data boundary", () => {
  it("preserves local positions and original scalar values", () => {
    const points = decodePoints(
      new Float32Array([1, 2, 3, 5, 4, 5, 6, 10]).buffer,
      [0, 10],
    );
    expect([...points.positions]).toEqual([1, 2, 3, 4, 5, 6]);
    expect([...points.values]).toEqual([5, 10]);
    expect(points.colors.length).toBe(6);
  });
  it("rejects malformed, non-finite and oversized samples", () => {
    expect(() => decodePoints(new ArrayBuffer(15), [0, 1])).toThrow("Invalid");
    expect(() =>
      decodePoints(new Float32Array([1, 2, 3, NaN]).buffer, [0, 1]),
    ).toThrow("Non-finite");
    expect(() =>
      decodePoints(new ArrayBuffer((POINT_BUDGET + 1) * 16), [0, 1]),
    ).toThrow("budget");
    expect(() =>
      decodePoints(new ArrayBuffer(ASSET_BUDGET + 16), [0, 1]),
    ).toThrow("oversized");
  });
  it("blocks external URLs before making a request", async () => {
    await expect(
      boundedAsset(
        "https://example.com/source.npz",
        new AbortController().signal,
      ),
    ).rejects.toThrow("Invalid scene asset URL");
  });
});

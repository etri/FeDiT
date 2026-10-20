import { describe, expect, it } from "vitest";
import { slicePosition } from "./selection";
describe("slice world coordinates", () => {
  const bounds: [[number, number, number], [number, number, number]] = [
    [100, 200, 30],
    [120, 240, 42],
  ];
  it("uses the selected axis midpoint when the stored coordinate is outside new bounds", () => {
    expect(slicePosition(bounds, undefined, "z", 0).value).toBe(36);
    expect(slicePosition(bounds, undefined, "x", 36).value).toBe(110);
  });
  it("preserves valid explicit coordinates and respects a selected ROI", () => {
    expect(slicePosition(bounds, undefined, "z", 32).value).toBe(32);
    expect(
      slicePosition(
        bounds,
        { min: [100, 200, 34], max: [120, 240, 38] },
        "z",
        32,
      ),
    ).toEqual({ min: 34, max: 38, value: 36 });
  });
});

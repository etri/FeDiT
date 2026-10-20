import type { Bounds, Roi } from "../datasets/types";
export function slicePosition(
  bounds: Bounds | undefined,
  roi: Roi | undefined,
  axis: "x" | "y" | "z",
  value: number,
) {
  const index = { x: 0, y: 1, z: 2 }[axis];
  if (!bounds)
    return {
      value: Number.isFinite(value) ? value : 0,
      min: undefined,
      max: undefined,
    };
  let min = Math.max(bounds[0][index], roi?.min[index] ?? -Infinity),
    max = Math.min(bounds[1][index], roi?.max[index] ?? Infinity);
  if (min >= max) {
    min = bounds[0][index];
    max = bounds[1][index];
  }
  return {
    min,
    max,
    value:
      Number.isFinite(value) && value >= min && value <= max
        ? value
        : (min + max) / 2,
  };
}

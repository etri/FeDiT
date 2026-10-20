import { create } from "zustand";
import type { Bounds } from "../datasets/types";

export type SourcePosition = [number, number, number];

const defaultSourcePosition: SourcePosition = [13.82, 40.63, 5.52];

export function validSourcePosition(position: SourcePosition, bounds: Bounds) {
  return position.every(
    (value, axis) =>
      Number.isFinite(value) &&
      value >= bounds[0][axis] &&
      value <= bounds[1][axis],
  );
}

interface SourcePlacement {
  datasetId: string;
  bounds?: Bounds;
  position?: SourcePosition;
  height: number;
  picking: boolean;
  initialize: (datasetId: string, bounds: Bounds) => void;
  setHeight: (height: number) => void;
  begin: () => void;
  cancel: () => void;
  place: (position: SourcePosition) => void;
}

export const useSourcePlacement = create<SourcePlacement>((set, get) => ({
  datasetId: "",
  height: 1.5,
  picking: false,
  initialize: (datasetId, bounds) => {
    if (
      !datasetId ||
      (get().datasetId === datasetId && get().bounds) ||
      !bounds[0].every(
        (low, axis) =>
          Number.isFinite(low) &&
          Number.isFinite(bounds[1][axis]) &&
          low <= bounds[1][axis],
      )
    )
      return;
    const height = Math.min(1.5, (bounds[1][2] - bounds[0][2]) * 0.1);
    set({
      datasetId,
      bounds: bounds.map((point) => [...point]) as Bounds,
      height,
      position: validSourcePosition(defaultSourcePosition, bounds)
        ? [...defaultSourcePosition]
        : [
            bounds[0][0] + (bounds[1][0] - bounds[0][0]) * 0.1,
            bounds[0][1] + (bounds[1][1] - bounds[0][1]) * 0.1,
            bounds[0][2] + height,
          ],
      picking: false,
    });
  },
  setHeight: (requested) => {
    const { position, bounds, height } = get();
    if (!Number.isFinite(requested) || !position || !bounds) return;
    const surface = position[2] - height;
    const minimum = Math.max(0, bounds[0][2] - surface);
    const nextHeight = Math.max(
      minimum,
      Math.min(requested, bounds[1][2] - surface),
    );
    set({
      height: nextHeight,
      position: [position[0], position[1], surface + nextHeight],
    });
  },
  begin: () => {
    if (get().position) set({ picking: true });
  },
  cancel: () => set({ picking: false }),
  place: (position) => {
    const bounds = get().bounds;
    if (bounds && validSourcePosition(position, bounds))
      set({ position: [...position], picking: false });
  },
}));

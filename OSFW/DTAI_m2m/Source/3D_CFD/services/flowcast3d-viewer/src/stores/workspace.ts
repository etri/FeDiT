import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Probe, Roi } from "../features/datasets/types";
export type DisplayMode =
  | "geometry"
  | "points"
  | "surface"
  | "slice"
  | "iso"
  | "volume"
  | "vectors"
  | "streamlines";
interface State {
  datasetId: string;
  resultId: string;
  fieldId: string;
  frame: number;
  mode: DisplayMode;
  axis: "x" | "y" | "z";
  position: number;
  threshold: number;
  bins: number;
  roi?: Roi;
  probes: Probe[];
  opacity: number;
  wireframe: boolean;
  showGrid: boolean;
  showBounds: boolean;
  leftOpen: boolean;
  rightOpen: boolean;
  leftWidth: number;
  rightWidth: number;
  compareId: string;
  compareResultId: string;
  inflowSpeed: number;
  inflowDirection: number;
  cameraRevision: number;
  selectedProbeId: string;
  valueRange?: [number, number];
  camera?: {
    position: [number, number, number];
    target: [number, number, number];
    origin: [number, number, number];
  };
  set: (value: Partial<Omit<State, "set" | "selectDataset">>) => void;
  selectDataset: (datasetId: string, fieldId?: string) => void;
}
export const useWorkspace = create<State>()(
  persist(
    (set) => ({
      datasetId: "",
      resultId: "",
      fieldId: "",
      frame: 0,
      mode: "geometry",
      axis: "z",
      position: 0,
      threshold: 0,
      bins: 12,
      probes: [],
      opacity: 0.35,
      wireframe: false,
      showGrid: true,
      showBounds: false,
      leftOpen: false,
      rightOpen: false,
      leftWidth: 272,
      rightWidth: 282,
      compareId: "",
      compareResultId: "",
      inflowSpeed: 5,
      inflowDirection: 0,
      cameraRevision: 0,
      selectedProbeId: "",
      set,
      selectDataset: (datasetId, fieldId = "") =>
        set({
          datasetId,
          fieldId,
          resultId: "",
          frame: 0,
          mode: "geometry",
          probes: [],
          roi: undefined,
          compareId: "",
          compareResultId: "",
          camera: undefined,
          selectedProbeId: "",
          valueRange: undefined,
        }),
    }),
    {
      name: "flowcast3d-workspace-v1",
      version: 3,
      migrate: (persistedState, version) => {
        if (
          version >= 3 ||
          !persistedState ||
          typeof persistedState !== "object"
        )
          return persistedState;
        const state = persistedState as Partial<State>;
        return {
          ...state,
          showGrid: true,
          ...(version < 2 && state.mode === "surface"
            ? { mode: "geometry", camera: undefined }
            : {}),
          ...(version < 2 && state.opacity === 0.9 ? { opacity: 0.35 } : {}),
        };
      },
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...(persistedState as Partial<State>),
        datasetId: "",
        resultId: "",
      }),
      partialize: (state) => ({
        fieldId: state.fieldId,
        frame: state.frame,
        mode: state.mode,
        axis: state.axis,
        position: state.position,
        threshold: state.threshold,
        bins: state.bins,
        roi: state.roi,
        probes: state.probes,
        opacity: state.opacity,
        wireframe: state.wireframe,
        showGrid: state.showGrid,
        showBounds: state.showBounds,
        leftOpen: state.leftOpen,
        rightOpen: state.rightOpen,
        leftWidth: state.leftWidth,
        rightWidth: state.rightWidth,
        compareId: state.compareId,
        compareResultId: state.compareResultId,
        inflowSpeed: state.inflowSpeed,
        inflowDirection: state.inflowDirection,
        camera: state.camera,
      }),
    },
  ),
);

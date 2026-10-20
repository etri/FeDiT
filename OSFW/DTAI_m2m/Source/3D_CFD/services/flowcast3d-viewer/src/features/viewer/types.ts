import type { Bounds, Field } from "../datasets/types";
export interface SceneAsset {
  kind: "points" | "geometry" | "volume" | "tiles" | "trajectories";
  format: string;
  url: string;
  count?: number;
  stride?: number;
  dimensions?: [number, number, number];
  origin?: [number, number, number];
  spacing?: [number, number, number];
  maskUrl?: string;
  sha256?: string;
  byteLength?: number;
}
export interface ParticlePathsMetadata {
  schema: "flowcast.particle-paths/1";
  datasetId: string;
  resultId: string;
  source: [number, number, number];
  sourceDatasetId: string;
  sourceResultId: string | null;
  sourceVersion: string;
  methodVersion: string;
  seed: number;
  times: number[];
  verified: true;
  verification: "all-concentration-frames-equal";
  timestampInterpretation: string;
}
export interface Scene {
  contextKey: string;
  origin: [number, number, number];
  bounds: Bounds;
  field?: Field;
  range?: [number, number];
  time?: number;
  assets: SceneAsset[];
  warnings?: string[];
  particlePaths?: ParticlePathsMetadata;
}
export interface PointBuffers {
  positions: Float32Array;
  colors: Float32Array;
  values: Float32Array;
}

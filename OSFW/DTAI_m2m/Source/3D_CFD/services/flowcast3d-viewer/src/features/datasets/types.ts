export type Bounds = [[number, number, number], [number, number, number]];
export interface Field {
  id: string;
  label?: string;
  unit?: string;
  association?: "cell" | "point";
  components?: number;
  range?: [number, number];
  supportModes?: string[];
}
export type ResultRole =
  | "geometry"
  | "reference_concentration"
  | "observations"
  | "reference_wind"
  | "model_wind"
  | "virtual_reference"
  | "virtual_model";
export interface SourceRef {
  [key: string]: unknown;
  datasetId?: string;
  resultId?: string | null;
  recordId?: string | number;
  doi?: string;
  license?: string;
  sourceUrl?: string;
  title?: string;
  creators?: unknown[];
  comparisonKind?: string;
}
export interface DatasetResult {
  id: string;
  label?: string;
  name?: string;
  status?: string;
  times?: number[];
  fields?: Field[];
  capabilities?: string[] | Record<string, boolean>;
  supportModes?: string[];
  analysisKind?: "volume" | "surface" | "points" | "none";
  scenarioId?: string;
  resultRole?: ResultRole;
  sourceRef?: SourceRef;
  colorRange?: [number, number];
  initialFrame?: number;
}
export interface Dataset {
  id: string;
  name?: string;
  label?: string;
  spaceName?: string;
  spaceId?: string;
  thumbnailUrl?: string;
  status?: string;
  fields: Field[];
  times: number[];
  bounds?: Bounds;
  origin?: [number, number, number];
  version?: string;
  source?: string;
  fileFormat?: string | null;
  synthetic?: boolean;
  timeUnit?: string;
  coordinateUnit?: string;
  sizeBytes?: number;
  capabilities?: string[] | Record<string, boolean>;
  validation?: { level: string; message: string }[];
  results?: DatasetResult[];
  supportModes?: string[];
  scenarioModes?: ("reference" | "model")[];
  analysisKind?: "volume" | "surface" | "points" | "none";
  scenarioId?: string;
  resultRole?: ResultRole;
  referenceResultId?: string | null;
  sourceRef?: SourceRef;
  colorRange?: [number, number];
  initialFrame?: number;
  provenance?: Record<string, unknown> | null;
  attribution?: {
    source: string;
    license?: string;
    url?: string | null;
    changes?: string;
  };
}
export interface Probe {
  id: string;
  position: [number, number, number];
}
export interface Roi {
  min: [number, number, number];
  max: [number, number, number];
}
// 저장된 이름은 유지하고 표시명 끝의 파일 형식 괄호만 생략
export function datasetName(dataset: Dataset) {
  const name = dataset.name ?? dataset.label ?? dataset.id;
  const suffix = /\s*\(([^()]*)\)\s*$/.exec(name);
  if (
    !suffix ||
    !suffix[1]
      .split("/")
      .every((format) =>
        /^(OBJ|STL|VTK|VTU|VTP|VTI|VTR|VTS|PVD|VTM|NPY|NPZ)$/i.test(
          format.trim(),
        ),
      )
  )
    return name;
  return name.slice(0, suffix.index).trimEnd() || name;
}
export function supports(dataset: Dataset | undefined, feature: string) {
  return Array.isArray(dataset?.capabilities)
    ? dataset.capabilities.includes(feature)
    : Boolean(dataset?.capabilities?.[feature]);
}

export function validationMessages(dataset: Dataset, level: string) {
  return (
    dataset.validation
      ?.filter((item) => item.level === level)
      .map((item) => item.message) ?? []
  );
}

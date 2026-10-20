import { useWorkspace, type DisplayMode } from "../../stores/workspace";
import {
  supports,
  type Dataset,
  type DatasetResult,
  type Field,
  type ResultRole,
} from "./types";

export const resultRoleLabels: Record<ResultRole, string> = {
  geometry: "건물 형상",
  reference_concentration: "원본 농도",
  observations: "원본 관측값",
  reference_wind: "참조 풍장",
  model_wind: "모델 예측 풍장",
  virtual_reference: "참조 풍장 기반 가상 농도",
  virtual_model: "예측 풍장 기반 가상 농도",
};

export function resultLabel(result: DatasetResult) {
  const label = result.label ?? result.name ?? result.id;
  return result.resultRole
    ? `${resultRoleLabels[result.resultRole]} · ${label}`
    : label;
}

export function isVirtual(role: ResultRole | undefined) {
  return role === "virtual_reference" || role === "virtual_model";
}

export function displaySupported(
  dataset: Dataset | undefined,
  mode: DisplayMode,
  field?: Field,
) {
  if (mode === "geometry") return supports(dataset, "geometry");
  if (!field) return false;
  const modes = field.supportModes ?? dataset?.supportModes;
  if (modes) return modes.includes(mode);
  if (dataset?.analysisKind === "points" || dataset?.analysisKind === "surface")
    return (
      mode === "surface" ||
      (dataset.analysisKind === "points" && mode === "points")
    );
  if (mode === "vectors" || mode === "streamlines")
    return Boolean(
      dataset?.fields.some((item) => item.components === 3) ||
      ["velocity_x", "velocity_y", "velocity_z"].every((id) =>
        dataset?.fields.some((item) => item.id === id),
      ),
    );
  return true;
}

export function displayMode(
  dataset: Dataset | undefined,
  mode: DisplayMode,
  field?: Field,
): DisplayMode {
  if (displaySupported(dataset, mode, field)) return mode;
  return (
    (["surface", "points", "slice", "volume", "iso", "geometry"] as const).find(
      (candidate) => displaySupported(dataset, candidate, field),
    ) ?? "surface"
  );
}

export function volumeAnalysis(dataset: Dataset | undefined) {
  return !dataset?.analysisKind || dataset.analysisKind === "volume";
}

export function frameAtTime(times: number[], time: number | undefined) {
  if (time === undefined || !times.length) return 0;
  return times.reduce(
    (nearest, value, index) =>
      Math.abs(value - time) < Math.abs(times[nearest] - time)
        ? index
        : nearest,
    0,
  );
}

export function selectResult(dataset: Dataset, resultId: string) {
  const state = useWorkspace.getState();
  const target = dataset.results?.find((result) => result.id === resultId);
  const sameScenario = Boolean(
    dataset.scenarioId &&
    target?.scenarioId === dataset.scenarioId &&
    isVirtual(dataset.resultRole) &&
    isVirtual(target?.resultRole),
  );
  const fields = target?.fields ?? [];
  const fieldId =
    sameScenario && fields.some((field) => field.id === state.fieldId)
      ? state.fieldId
      : (fields[0]?.id ?? (sameScenario ? state.fieldId : ""));
  state.set({
    resultId,
    frame: sameScenario
      ? target?.times?.length
        ? frameAtTime(target.times, dataset.times[state.frame])
        : state.frame
      : (target?.initialFrame ?? 0),
    fieldId,
    mode:
      isVirtual(target?.resultRole) && state.mode === "geometry"
        ? "surface"
        : state.mode,
    compareId: "",
    compareResultId: "",
    valueRange: undefined,
    ...(!sameScenario &&
    (target?.analysisKind === "surface" || target?.analysisKind === "points")
      ? { roi: undefined }
      : {}),
  });
}

import type { Dataset } from "../datasets/types";
import { useId } from "react";
import { useWorkspace } from "../../stores/workspace";
import {
  useDisplaySelection,
  type QuickDisplayMode,
} from "./useDisplaySelection";
import "./SceneDisplayMode.css";

export function SceneDisplayMode({
  dataset,
  range,
  disabled = false,
}: {
  dataset?: Dataset;
  range?: [number, number];
  disabled?: boolean;
}) {
  const tooltipId = useId();
  const selection = useDisplaySelection(dataset, range);
  const datasetId = useWorkspace((state) => state.datasetId);
  const resultId = useWorkspace((state) => state.resultId);
  const completed = (status?: string) =>
    status === undefined ||
    ["ready", "succeeded", "completed"].includes(status);
  const result = dataset?.results?.find((item) => item.id === resultId);

  // 완료된 농도 결과가 선택되기 전에는 예측 표시 방식의 선택을 차단
  const predictionReady = Boolean(
    resultId &&
    dataset?.id === datasetId &&
    dataset.fields.some((field) =>
      field.id.toLowerCase().includes("concentration"),
    ) &&
    completed(dataset.status) &&
    completed(result?.status),
  );
  const modes: { mode: QuickDisplayMode; label: string; title: string }[] = [
    { mode: "streamlines", label: "V1", title: "Stream" },
    { mode: "iso", label: "V2", title: "Contour" },
    { mode: "volume", label: "V3", title: "Volume" },
  ];
  return (
    <div className="scene-display-control">
      <div
        className="scene-display-options"
        role="group"
        aria-label="표시 방식 전환"
        aria-busy={selection.pending}
      >
        {modes.map(({ mode, label, title }) => (
          <button
            key={mode}
            type="button"
            className="scene-display-button"
            aria-label={`${label} ${title}`}
            aria-describedby={`${tooltipId}-${mode}`}
            aria-pressed={predictionReady && selection.value === mode}
            disabled={
              disabled ||
              !predictionReady ||
              selection.pending ||
              !selection.available[mode]
            }
            onClick={() => {
              if (predictionReady && selection.value !== mode)
                void selection.select(mode);
            }}
          >
            <span>{label}</span>
            <span
              id={`${tooltipId}-${mode}`}
              className="scene-display-tooltip"
              role="tooltip"
            >
              {!predictionReady
                ? "예측 완료 후 사용할 수 있습니다"
                : mode === "streamlines" && selection.streamlineError
                  ? selection.streamlineError
                  : title}
            </span>
          </button>
        ))}
      </div>
      {selection.error && (
        <p className="scene-display-error" role="alert">
          {selection.error.message}
        </p>
      )}
    </div>
  );
}

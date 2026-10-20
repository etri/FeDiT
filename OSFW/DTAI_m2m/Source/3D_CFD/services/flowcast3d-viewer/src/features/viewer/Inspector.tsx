import { useState } from "react";
import {
  Layers3,
  Crosshair,
  BoxSelect,
  Trash2,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useWorkspace } from "../../stores/workspace";
import { Button } from "../../components/ui/button";
import { Failure } from "../../components/ui/status";
import { supports, validationMessages, type Dataset } from "../datasets/types";
import { useAnalysis } from "../analysis/api";
import { slicePosition } from "./selection";
import {
  displayMode as supportedMode,
  displaySupported,
  isVirtual,
  resultLabel,
  volumeAnalysis,
} from "../datasets/results";
import { formatValue } from "../../lib/utils";
export function Inspector({
  dataset,
  datasets,
}: {
  dataset?: Dataset;
  datasets: Dataset[];
}) {
  const state = useWorkspace(),
    analysis = useAnalysis(dataset),
    [error, setError] = useState<unknown>();
  const selectedField =
    dataset?.fields.find((field) => field.id === state.fieldId) ??
    dataset?.fields[0];
  const hasGeometry = supports(dataset, "geometry");
  const displayMode = supportedMode(dataset, state.mode, selectedField);
  const hasVolume = volumeAnalysis(dataset);
  const flatBounds =
    dataset?.bounds?.[0].some(
      (value, index) => value >= dataset.bounds![1][index],
    ) ?? false;
  const comparisons = datasets.flatMap((space) => [
    ...(space.id !== dataset?.id && !isVirtual(dataset?.resultRole)
      ? [
          {
            id: space.id,
            datasetId: space.id,
            resultId: "",
            name: space.name ?? space.id,
          },
        ]
      : []),
    ...(space.results ?? [])
      .filter(
        (result) =>
          result.id !== state.resultId &&
          (isVirtual(dataset?.resultRole)
            ? isVirtual(result.resultRole) &&
              Boolean(dataset?.scenarioId) &&
              result.scenarioId === dataset?.scenarioId
            : result.id.startsWith("prediction:") ||
              isVirtual(result.resultRole)),
      )
      .map((result) => ({
        id: result.id,
        datasetId: result.resultRole ? space.id : result.id,
        resultId: result.resultRole ? result.id : "",
        name: resultLabel(result),
      })),
  ]);
  const hasVelocity = Boolean(
    dataset?.fields.some((field) => field.components === 3) ||
    ["velocity_x", "velocity_y", "velocity_z"].every((id) =>
      dataset?.fields.some((field) => field.id === id),
    ),
  );
  const position = slicePosition(
    dataset?.bounds,
    state.roi,
    state.axis,
    state.position,
  );
  const [positionDraft, setPositionDraft] = useState<string | null>(null);
  const updateRoi = (axis: number, corner: "min" | "max", value: number) => {
    if (!state.roi || !Number.isFinite(value)) return;
    state.set({
      roi: {
        ...state.roi,
        [corner]: state.roi[corner].map((item, index) =>
          index === axis ? value : item,
        ),
      },
    });
  };
  return (
    <aside
      id="analysis-panel"
      className="inspector side-panel"
      aria-label="분석 설정"
    >
      <div className="panel-title">
        <SlidersHorizontal size={15} />
        <strong>분석 도구</strong>
        <Button
          variant="ghost"
          size="icon"
          aria-label="분석 패널 닫기"
          onClick={() => state.set({ rightOpen: false })}
        >
          <X size={16} />
        </Button>
      </div>
      <section className="panel-section">
        <h3>
          <Layers3 size={14} />
          표시
        </h3>
        <label>
          표시 방식
          <select
            value={displayMode}
            onChange={(event) =>
              state.set({ mode: event.target.value as typeof state.mode })
            }
          >
            {hasGeometry && <option value="geometry">건물 형상</option>}
            <option
              value="surface"
              disabled={
                Boolean(selectedField) &&
                !displaySupported(dataset, "surface", selectedField)
              }
            >
              {selectedField ? "유동장 샘플" : "형상"}
            </option>
            {(dataset?.analysisKind === "points" ||
              (selectedField?.supportModes ?? dataset?.supportModes)?.includes(
                "points",
              )) && (
              <option
                value="points"
                disabled={!displaySupported(dataset, "points", selectedField)}
              >
                관측 지점
              </option>
            )}
            <option
              value="slice"
              disabled={!displaySupported(dataset, "slice", selectedField)}
            >
              단면
            </option>
            <option
              value="iso"
              disabled={!displaySupported(dataset, "iso", selectedField)}
            >
              등값면
            </option>
            <option
              value="volume"
              disabled={!displaySupported(dataset, "volume", selectedField)}
            >
              ROI 볼륨
            </option>
            <option
              value="vectors"
              disabled={!displaySupported(dataset, "vectors", selectedField)}
            >
              속도 벡터
            </option>
            <option
              value="streamlines"
              disabled={
                !displaySupported(dataset, "streamlines", selectedField)
              }
            >
              유선
            </option>
          </select>
        </label>
        {state.mode === "slice" && (
          <div className="form-row">
            <label>
              축
              <select
                value={state.axis}
                onChange={(event) =>
                  state.set({ axis: event.target.value as typeof state.axis })
                }
              >
                <option>x</option>
                <option>y</option>
                <option>z</option>
              </select>
            </label>
            <label>
              위치
              <input
                type="number"
                min={position.min}
                max={position.max}
                step="any"
                value={positionDraft ?? position.value}
                onChange={(event) => setPositionDraft(event.target.value)}
                onBlur={(event) => {
                  if (
                    event.target.value.trim() &&
                    Number.isFinite(Number(event.target.value))
                  )
                    state.set({ position: Number(event.target.value) });
                  setPositionDraft(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") event.currentTarget.blur();
                }}
              />
            </label>
          </div>
        )}
        {!hasVelocity && (
          <p className="help-text">
            속도 벡터와 유선은 3성분 속도장이 필요합니다
          </p>
        )}
        <label>
          유동장 불투명도{" "}
          <b className="float-right">{Math.round(state.opacity * 100)}%</b>
          <input
            type="range"
            min="0.05"
            max="1"
            step="0.05"
            value={state.opacity}
            disabled={!selectedField || displayMode === "geometry"}
            onChange={(event) =>
              state.set({ opacity: Number(event.target.value) })
            }
          />
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={state.showGrid}
            onChange={(event) => state.set({ showGrid: event.target.checked })}
          />
          기준 격자
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={state.wireframe}
            onChange={(event) => state.set({ wireframe: event.target.checked })}
          />
          메시 와이어프레임
        </label>
      </section>
      <section className="panel-section">
        <h3>
          <BoxSelect size={14} />
          관심 영역{" "}
          <Button
            variant="ghost"
            size="sm"
            disabled={!dataset?.bounds || (flatBounds && !state.roi)}
            onClick={() =>
              state.set({
                roi: state.roi
                  ? undefined
                  : dataset?.bounds
                    ? {
                        min: [...dataset.bounds[0]],
                        max: [...dataset.bounds[1]],
                      }
                    : undefined,
              })
            }
          >
            {state.roi ? "해제" : "설정"}
          </Button>
        </h3>
        {state.roi ? (
          <>
            <div className="roi-grid">
              <span />
              <span>최솟값</span>
              <span>최댓값</span>
              {["X", "Y", "Z"].map((axis, index) => (
                <div className="roi-row" key={axis}>
                  <span>{axis}</span>
                  <input
                    aria-label={`ROI ${axis} 최소`}
                    type="number"
                    value={state.roi?.min[index]}
                    onChange={(event) =>
                      updateRoi(index, "min", Number(event.target.value))
                    }
                  />
                  <input
                    aria-label={`ROI ${axis} 최대`}
                    type="number"
                    value={state.roi?.max[index]}
                    onChange={(event) =>
                      updateRoi(index, "max", Number(event.target.value))
                    }
                  />
                </div>
              ))}
            </div>
            {state.roi.min.some(
              (value, index) => value >= state.roi!.max[index],
            ) && (
              <p className="error-text">
                ROI minimum must be less than maximum
              </p>
            )}
          </>
        ) : (
          <p className="help-text">
            {flatBounds
              ? "평면 자료에는 3차원 ROI를 적용하지 않습니다"
              : "선택한 상자 안의 원본 셀을 분석합니다"}
          </p>
        )}
      </section>
      <section className="panel-section">
        <h3>
          <Crosshair size={14} />
          Probe <span className="count">{state.probes.length}/5</span>
        </h3>
        {!state.probes.length ? (
          <p className="help-text">
            장면 도구의 조준점을 선택하고 샘플을 더블클릭하세요
          </p>
        ) : (
          state.probes.map((probe) => (
            <div className="probe-row" key={probe.id}>
              <button
                className={`probe-id ${state.selectedProbeId === probe.id ? "active" : ""}`}
                onClick={() => state.set({ selectedProbeId: probe.id })}
              >
                {probe.id}
              </button>
              <span>
                <b>
                  {formatValue(
                    analysis.data?.probes.find((item) => item.id === probe.id)
                      ?.value,
                  )}
                </b>
                <small>
                  {probe.position.map((value) => value.toFixed(1)).join(", ")}
                </small>
              </span>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`${probe.id} 삭제`}
                onClick={() =>
                  state.set({
                    probes: state.probes.filter((item) => item.id !== probe.id),
                  })
                }
              >
                <Trash2 size={13} />
              </Button>
            </div>
          ))
        )}
        <Button
          variant="ghost"
          size="sm"
          disabled={
            !dataset?.bounds || !selectedField || state.probes.length >= 5
          }
          onClick={() => {
            if (!dataset?.bounds) return;
            const point = dataset.bounds[0].map(
              (value, index) => (value + dataset.bounds![1][index]) / 2,
            ) as [number, number, number];
            let index = 1;
            while (state.probes.some((probe) => probe.id === `P${index}`))
              index++;
            state.set({
              probes: [...state.probes, { id: `P${index}`, position: point }],
            });
          }}
        >
          영역 중심에 추가
        </Button>
      </section>
      <section className="panel-section">
        <h3>정량 분석</h3>
        {!hasVolume && selectedField && (
          <p className="help-text">
            지표면과 관측 지점 자료에는 체적 통계를 적용하지 않습니다
          </p>
        )}
        {!selectedField && (
          <p className="help-text">형상 데이터에는 수치 필드가 없습니다</p>
        )}
        <label>
          임계값 {selectedField?.unit ? `(${selectedField.unit})` : ""}
          <input
            type="number"
            value={state.threshold}
            disabled={!selectedField || !hasVolume}
            onChange={(event) =>
              state.set({ threshold: Number(event.target.value) })
            }
          />
        </label>
        <label>
          분포 구간 수
          <input
            type="number"
            min="2"
            max="64"
            value={state.bins}
            disabled={!selectedField || !hasVolume}
            onChange={(event) => {
              const value = Number(event.target.value);
              if (value >= 2 && value <= 64) state.set({ bins: value });
            }}
          />
        </label>
        <dl className="statistics">
          <div>
            <dt>최솟값</dt>
            <dd>{formatValue(analysis.data?.statistics.minimum)}</dd>
          </div>
          <div>
            <dt>최댓값</dt>
            <dd>{formatValue(analysis.data?.statistics.maximum)}</dd>
          </div>
          <div>
            <dt>평균</dt>
            <dd>{formatValue(analysis.data?.statistics.mean)}</dd>
          </div>
        </dl>
        {comparisons.length > 0 && (
          <label>
            비교 데이터
            <select
              value={state.compareResultId || state.compareId}
              onChange={(event) => {
                setError(undefined);
                const candidate = comparisons.find(
                  (item) => item.id === event.target.value,
                );
                state.set({
                  compareId: candidate?.datasetId ?? "",
                  compareResultId: candidate?.resultId ?? "",
                });
              }}
            >
              <option value="">비교 안 함</option>
              {comparisons.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        )}
        {state.compareId &&
          analysis.data?.comparison &&
          (analysis.data.comparison.available ? (
            <p className="help-text">
              MAE {formatValue(analysis.data.comparison.mae)} / RMSE{" "}
              {formatValue(analysis.data.comparison.rmse)}
            </p>
          ) : (
            <p className="help-text">
              {analysis.data.comparison.reason ?? "Comparison unavailable"}
            </p>
          ))}
        {Boolean(error) && <Failure error={error} />}
      </section>
      {(dataset ? validationMessages(dataset, "warning") : []).map(
        (warning) => (
          <p className="warning-note" key={warning}>
            {warning}
          </p>
        ),
      )}
    </aside>
  );
}

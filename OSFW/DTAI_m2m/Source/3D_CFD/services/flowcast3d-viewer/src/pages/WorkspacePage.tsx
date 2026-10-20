import { useEffect, useState, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Database, Upload } from "lucide-react";
import { useSelectedDataset } from "../features/datasets/api";
import { datasetName, supports } from "../features/datasets/types";
import { useWorkspace } from "../stores/workspace";
import { Inspector } from "../features/viewer/Inspector";
import { DispersionPanel } from "../features/scenarios/DispersionPanel";
import { ScenarioPanel } from "../features/scenarios/ScenarioPanel";
import { Button } from "../components/ui/button";
import { Failure, Loading } from "../components/ui/status";
import { usePanels } from "../components/layout/usePanels";
import { ResizeHandle } from "../components/layout/ResizeHandle";
import { SetupPanels } from "../features/scenarios/SetupPanels";
import { PlaybackControls } from "../features/viewer/PlaybackControls";
import { usePreparedPlayback } from "../features/viewer/usePreparedPlayback";
import {
  resultLabel,
  resultRoleLabels,
  selectResult,
} from "../features/datasets/results";
const SceneCanvas = lazy(() =>
  import("../features/viewer/SceneCanvas").then((value) => ({
    default: value.SceneCanvas,
  })),
);
export function WorkspacePage() {
  const panels = usePanels();
  const selected = useSelectedDataset(),
    datasets = selected.datasets,
    state = useWorkspace(),
    dataset = selected.data,
    space =
      datasets.data?.find((item) => item.id === state.datasetId) ?? dataset,
    attribution =
      dataset?.attribution ??
      (dataset?.sourceRef?.title
        ? {
            source: dataset.sourceRef.title,
            license: dataset.sourceRef.license,
            url: dataset.sourceRef.sourceUrl,
          }
        : undefined);
  const preparedPlayback = usePreparedPlayback(dataset);
  const [playbackLocked, setPlaybackLocked] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const lastFrame = Math.max(0, (dataset?.times?.length ?? 0) - 1),
    firstFrame = Math.min(lastFrame, dataset?.initialFrame ?? 0),
    frame = Math.max(firstFrame, Math.min(state.frame, lastFrame));
  useEffect(() => {
    if (
      !selected.isPending &&
      state.roi &&
      dataset?.bounds?.[0].some(
        (value, index) => value >= dataset.bounds![1][index],
      )
    )
      state.set({ roi: undefined });
  }, [dataset, selected.isPending, state]);
  useEffect(() => {
    if (
      dataset &&
      !selected.isPending &&
      (state.frame > lastFrame || state.frame < firstFrame)
    )
      state.set({ frame });
  }, [dataset, selected.isPending, lastFrame, firstFrame, frame, state]);
  useEffect(() => {
    const field =
      dataset?.fields.find((item) => item.id === state.fieldId) ??
      dataset?.fields[0];
    if (field && field.id !== state.fieldId)
      state.set({ fieldId: field.id, valueRange: undefined });
  }, [dataset, state]);
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        panels.close();
        return;
      }
      if (
        event.target instanceof HTMLElement &&
        (["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(
          event.target.tagName,
        ) ||
          event.target.isContentEditable)
      )
        return;
      if (event.key === "b") panels.toggle("left");
      if (event.key === "l") panels.toggle("right");
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [state, panels]);
  return (
    <div
      className={`workspace ${state.leftOpen ? "left-open" : ""} ${state.rightOpen ? "right-open" : ""}`}
      style={
        {
          "--left-width": `${state.leftWidth}px`,
          "--right-width": `${state.rightWidth}px`,
        } as React.CSSProperties
      }
    >
      <div className="workspace-body">
        {panels.narrow && (state.leftOpen || state.rightOpen) && (
          <button
            className="drawer-backdrop"
            aria-label="패널 닫기"
            tabIndex={-1}
            onClick={panels.close}
          />
        )}
        {state.leftOpen && (
          <>
            <aside
              id="input-panel"
              className="input-panel side-panel"
              aria-label="입력 설정"
            >
              <div className="panel-title">
                <Database size={15} />
                <strong>입력 데이터</strong>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="입력 패널 닫기"
                  onClick={() => state.set({ leftOpen: false })}
                >
                  <ChevronLeft size={15} />
                </Button>
              </div>
              <section className="panel-section">
                <label>
                  데이터셋
                  <select
                    value={dataset?.id ?? ""}
                    onChange={(event) => {
                      const item = datasets.data?.find(
                        (value) => value.id === event.target.value,
                      );
                      state.selectDataset(
                        event.target.value,
                        item?.fields?.[0]?.id,
                      );
                    }}
                  >
                    <option value="">데이터를 선택하세요</option>
                    {datasets.data?.map((item) => (
                      <option key={item.id} value={item.id}>
                        {datasetName(item)}
                      </option>
                    ))}
                  </select>
                </label>
                {datasets.isPending && <Loading />}
                {datasets.error && <Failure error={datasets.error} />}
                <Button asChild variant="secondary" size="sm">
                  <Link to="/datasets">
                    <Upload size={14} />새 데이터 등록
                  </Link>
                </Button>
              </section>
              <section className="panel-section">
                <h3>표시 필드</h3>
                <label>
                  물리량
                  <select
                    value={
                      dataset?.fields.find(
                        (field) => field.id === state.fieldId,
                      )?.id ??
                      dataset?.fields[0]?.id ??
                      ""
                    }
                    disabled={!dataset?.fields?.length}
                    onChange={(event) =>
                      state.set({ fieldId: event.target.value })
                    }
                  >
                    {!dataset?.fields?.length && (
                      <option value="">필드 없음</option>
                    )}
                    {dataset?.fields?.map((field) => (
                      <option key={field.id} value={field.id}>
                        {field.label ?? field.id}
                        {field.unit ? ` [${field.unit}]` : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  해석 결과
                  <select
                    value={state.resultId}
                    onChange={(event) =>
                      dataset && selectResult(dataset, event.target.value)
                    }
                  >
                    <option value="">등록된 원본</option>
                    {Object.entries(resultRoleLabels).map(([role, label]) => {
                      const results =
                        dataset?.results?.filter(
                          (result) => result.resultRole === role,
                        ) ?? [];
                      return (
                        results.length > 0 && (
                          <optgroup label={label} key={role}>
                            {results.map((result) => (
                              <option key={result.id} value={result.id}>
                                {resultLabel(result)}
                              </option>
                            ))}
                          </optgroup>
                        )
                      );
                    })}
                    {dataset?.results
                      ?.filter((result) => !result.resultRole)
                      .map((result) => (
                        <option value={result.id} key={result.id}>
                          {resultLabel(result)}
                        </option>
                      ))}
                  </select>
                </label>
                {dataset && (
                  <dl className="dataset-details">
                    <div>
                      <dt>시간 단계</dt>
                      <dd>
                        {Math.max(0, (dataset.times?.length ?? 0) - firstFrame)}
                      </dd>
                    </div>
                    <div>
                      <dt>필드 수</dt>
                      <dd>{dataset.fields?.length ?? 0}</dd>
                    </div>
                    <div>
                      <dt>버전</dt>
                      <dd title={dataset.version}>
                        {dataset.version?.slice(0, 12) ?? "—"}
                      </dd>
                    </div>
                  </dl>
                )}
                {dataset?.resultRole && (
                  <p className="help-text">
                    {resultRoleLabels[dataset.resultRole]}
                  </p>
                )}
                {attribution && (
                  <p className="help-text">
                    출처:{" "}
                    {attribution.url &&
                    /^https?:\/\//i.test(attribution.url) ? (
                      <a
                        href={attribution.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {attribution.source}
                      </a>
                    ) : (
                      attribution.source
                    )}
                    {attribution.license ? ` / ${attribution.license}` : ""}
                  </p>
                )}
              </section>
              <ScenarioPanel dataset={space} />
              <DispersionPanel dataset={dataset} space={space} />
              <div className="panel-footer">
                단위와 좌표는 등록 정보를 따릅니다
                <br />
                표시 변경은 재예측하지 않습니다
              </div>
            </aside>
            <ResizeHandle
              value={state.leftWidth}
              min={228}
              max={400}
              onChange={(leftWidth) => state.set({ leftWidth })}
              label="입력 패널 너비"
            />
          </>
        )}
        <div className="center-workspace">
          <div className="scene-workspace">
            <Suspense
              fallback={
                <div className="scene-panel center">
                  <Loading>3D 엔진 준비 중</Loading>
                </div>
              }
            >
              <SceneCanvas
                dataset={dataset}
                preparedPlayback={preparedPlayback}
                onBufferingChange={setBuffering}
              />
            </Suspense>
            <SetupPanels
              key={space?.id ?? "empty"}
              dataset={
                space
                  ? { ...space, bounds: space.bounds ?? dataset?.bounds }
                  : undefined
              }
              onPlaybackLockChange={setPlaybackLocked}
            />
          </div>
          <PlaybackControls
            dataset={dataset}
            firstFrame={firstFrame}
            disabled={playbackLocked}
            buffering={buffering}
            continuousKey={preparedPlayback.key}
            playable={
              !supports(space, "predict") ||
              Boolean(state.resultId) ||
              state.mode !== "geometry"
            }
            onFullscreen={() => {
              const target =
                document.querySelector<HTMLElement>(".center-workspace");
              const operation = document.fullscreenElement
                ? document.exitFullscreen()
                : target?.requestFullscreen?.();
              void operation?.catch(() => undefined);
            }}
          />
        </div>
        {state.rightOpen && (
          <>
            <ResizeHandle
              value={state.rightWidth}
              min={240}
              max={420}
              reverse
              onChange={(rightWidth) => state.set({ rightWidth })}
              label="분석 패널 너비"
            />
            <Inspector dataset={dataset} datasets={datasets.data ?? []} />
          </>
        )}
      </div>
    </div>
  );
}

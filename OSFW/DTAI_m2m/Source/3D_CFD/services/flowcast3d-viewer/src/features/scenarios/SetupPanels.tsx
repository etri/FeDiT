import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
} from "react";
import {
  ChevronDown,
  Crosshair,
  LoaderCircle,
  MapPin,
  RotateCcw,
  Wind,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Failure } from "../../components/ui/status";
import { supports, type Dataset } from "../datasets/types";
import { useSourcePlacement } from "./sourcePlacement";
import { usePredictionWorkflow } from "./usePredictionWorkflow";
import { PredictionTiming } from "./PredictionTiming";
import { useSetupSettings } from "./setupSettings";
import { useWorkspace } from "../../stores/workspace";
import { usePlaybackTransport } from "../viewer/playbackTransport";
import "./SetupPanels.css";

interface Props {
  dataset?: Dataset;
  onPlaybackLockChange: (locked: boolean) => void;
}
const defaultSettings = {
  speed: 5,
  direction: 0,
  durationSeconds: 60,
  stepSeconds: 1,
};
const phases = {
  idle: "기본 설정으로 시작할 수 있습니다",
  predicting: "유동장 예측 중",
  dispersing: "확산 계산 중",
  preparing: "시각화 준비 중",
  ready: "재생 준비 완료",
  cancelled: "예측이 취소되었습니다",
  failed: "예측을 완료하지 못했습니다",
};

interface NumberInputProps extends Omit<
  ComponentProps<"input">,
  "value" | "onChange" | "onBlur" | "type"
> {
  value?: number;
  onValueChange: (value: number) => void;
  onValidityChange: (name: string, invalid: boolean) => void;
}
function NumberInput({
  value,
  onValueChange,
  onValidityChange,
  ...props
}: NumberInputProps) {
  const [draft, setDraft] = useState(String(value ?? ""));
  const name = String(props["aria-label"] ?? "");
  const valid = (text: string) =>
    text.trim() !== "" &&
    Number.isFinite(Number(text)) &&
    (props.min === undefined || Number(text) >= Number(props.min)) &&
    (props.max === undefined || Number(text) <= Number(props.max));
  useEffect(() => {
    setDraft(String(value ?? ""));
    onValidityChange(name, false);
  }, [value, name, onValidityChange]);
  return (
    <input
      {...props}
      type="number"
      value={draft}
      aria-invalid={(!props.disabled && !valid(draft)) || undefined}
      onChange={(event) => {
        const text = event.target.value;
        setDraft(text);
        const accepted = valid(text);
        onValidityChange(name, !accepted);
        if (accepted) onValueChange(Number(text));
      }}
      onBlur={() => {
        setDraft(String(value ?? ""));
        onValidityChange(name, false);
      }}
    />
  );
}

export function SetupPanels({ dataset, onPlaybackLockChange }: Props) {
  const panels = useRef<HTMLElement>(null);
  const placement = useSourcePlacement();
  const workflow = usePredictionWorkflow(dataset);
  const settings = useSetupSettings();
  const [runTimingContext, setRunTimingContext] = useState<{
    datasetId: string;
    key: string;
  }>();
  const selectedResultId = useWorkspace((state) => state.resultId);
  const mode = useWorkspace((state) => state.mode);
  const roi = useWorkspace((state) => state.roi);
  const preparingPlayback = usePlaybackTransport(
    (state) => state.status === "preparing",
  );
  const displayReady = usePlaybackTransport((state) => state.displayReady);
  const displayError = usePlaybackTransport((state) => state.displayError);
  const playbackClip = usePlaybackTransport((state) => state.clip);
  const displayedResult = useRef<string | undefined>(undefined);
  const displayFailed =
    workflow.phase === "ready" && workflow.resultId === selectedResultId
      ? displayError
      : undefined;
  const finalDisplayMode = ["volume", "iso", "streamlines"].includes(mode);
  const finishing = Boolean(
    finalDisplayMode &&
    workflow.phase === "ready" &&
    workflow.resultId &&
    workflow.resultId === selectedResultId &&
    playbackClip &&
    !displayReady &&
    !displayFailed &&
    displayedResult.current !== workflow.resultId,
  );
  useEffect(() => {
    if (workflow.phase === "ready" && displayReady && workflow.resultId)
      displayedResult.current = workflow.resultId;
  }, [workflow.phase, workflow.resultId, displayReady]);
  const datasetId = dataset?.id;
  const hasDataset = Boolean(dataset);
  const {
    speed,
    direction,
    durationSeconds: duration,
    stepSeconds: step,
  } = dataset && settings.datasetId === dataset.id
    ? settings.input
    : defaultSettings;
  const setSpeed = (value: number) => settings.update({ speed: value });
  const setDirection = (value: number) => settings.update({ direction: value });
  const setDuration = (value: number) =>
    settings.update({ durationSeconds: value });
  const setStep = (value: number) => settings.update({ stepSeconds: value });
  const [expanded, setExpanded] = useState(
    () =>
      new Set(
        typeof window.matchMedia === "function" &&
          window.matchMedia("(max-width: 800px)").matches
          ? [1]
          : [1, 2, 3],
      ),
  );
  const initialize = placement.initialize;
  const initializeSettings = settings.initialize;
  useEffect(() => {
    if (datasetId) initializeSettings(datasetId);
  }, [datasetId, initializeSettings]);
  useEffect(() => () => useSourcePlacement.getState().cancel(), []);
  useEffect(() => {
    if (dataset?.bounds) initialize(dataset.id, dataset.bounds);
  }, [dataset?.id, dataset?.bounds, initialize]);
  const position =
    dataset && placement.datasetId === dataset.id
      ? placement.position
      : undefined;
  const picking = Boolean(
    dataset && placement.datasetId === dataset.id && placement.picking,
  );
  const controlsDisabled = !dataset || workflow.busy || finishing;
  const [invalidNumbers, setInvalidNumbers] = useState<string[]>([]);
  const numberValidity = useCallback((name: string, invalid: boolean) => {
    setInvalidNumbers((current) =>
      invalid === current.includes(name)
        ? current
        : invalid
          ? [...current, name]
          : current.filter((item) => item !== name),
    );
  }, []);
  const request = {
    source: position ?? ([NaN, NaN, NaN] as [number, number, number]),
    speed,
    direction,
    durationSeconds: duration,
    stepSeconds: step,
    seed: 0,
  };
  const fingerprint = JSON.stringify(request);
  const timingContext = JSON.stringify([
    dataset?.id,
    dataset?.spaceId,
    dataset?.bounds,
    dataset?.origin,
    dataset?.coordinateUnit,
    fingerprint,
    roi,
  ]);
  const completed = Boolean(
    dataset &&
    settings.datasetId === dataset.id &&
    settings.completed?.resultId === selectedResultId,
  );
  const changed = Boolean(
    completed && fingerprint !== settings.completed?.fingerprint,
  );
  const phase = !dataset
    ? "idle"
    : workflow.phase === "idle" && completed
      ? "ready"
      : workflow.phase;
  const validSource = position?.every(
    (value, axis) =>
      Number.isFinite(value) &&
      (!dataset?.bounds ||
        (value >= dataset.bounds[0][axis] && value <= dataset.bounds[1][axis])),
  );
  const valid =
    invalidNumbers.length === 0 &&
    validSource &&
    Number.isFinite(speed) &&
    speed > 0 &&
    speed <= 30 &&
    Number.isFinite(direction) &&
    direction >= 0 &&
    direction < 360 &&
    Number.isFinite(duration) &&
    duration >= 1 &&
    duration <= 3600 &&
    Number.isFinite(step) &&
    step >= 0.1 &&
    step <= 60 &&
    Math.ceil(duration / step) <= 360;
  const canPredict = supports(dataset, "predict");

  // 스크롤바를 제외한 패널 너비를 범례와 공유
  useEffect(() => {
    const element = panels.current;
    const container = element?.parentElement;
    if (!element || !container) return;
    const update = () =>
      container.style.setProperty(
        "--setup-content-width",
        `${element.clientWidth}px`,
      );
    update();
    const observer =
      typeof ResizeObserver === "undefined"
        ? undefined
        : new ResizeObserver(update);
    observer?.observe(element);
    return () => {
      observer?.disconnect();
      container.style.removeProperty("--setup-content-width");
    };
  }, []);

  useEffect(() => {
    onPlaybackLockChange(
      hasDataset && (workflow.busy || finishing || picking || changed),
    );
    return () => onPlaybackLockChange(false);
  }, [
    hasDataset,
    workflow.busy,
    finishing,
    picking,
    changed,
    onPlaybackLockChange,
  ]);
  const toggle = (number: number) =>
    setExpanded((previous) => {
      const next = new Set(previous);
      if (next.has(number)) next.delete(number);
      else next.add(number);
      return next;
    });
  const heading = (number: number, title: string) => (
    <button
      className="setup-heading"
      aria-expanded={!picking && expanded.has(number)}
      aria-controls={"setup-step-" + number}
      onClick={() => toggle(number)}
    >
      <span className="setup-number">{number}</span>
      <strong>{title}</strong>
      <ChevronDown size={14} />
    </button>
  );
  return (
    <aside
      ref={panels}
      className={"inner-setup" + (picking ? " is-picking" : "")}
      aria-label="예측 설정"
    >
      <section className="inner-setup-card">
        {heading(1, "배출원 위치")}
        <div
          id="setup-step-1"
          className="setup-body"
          hidden={picking || !expanded.has(1)}
        >
          <Button
            variant="secondary"
            size="sm"
            disabled={controlsDisabled || !position}
            onClick={() => {
              if (dataset && position) placement.begin();
            }}
          >
            <Crosshair size={14} />
            위치 지정
          </Button>
          {dataset && (
            <div className="source-coordinates" aria-label="배출원 좌표">
              <MapPin size={12} />
              {position
                ? position.map((value) => value.toFixed(1)).join(", ")
                : "공간 정보를 불러오는 중"}
            </div>
          )}
          <label>
            배출 높이 (m)
            <NumberInput
              aria-label="배출 높이"
              min="0"
              step="0.5"
              value={position ? placement.height : 1.5}
              disabled={controlsDisabled || !position}
              onValueChange={placement.setHeight}
              onValidityChange={numberValidity}
            />
          </label>
          <details>
            <summary>좌표 직접 입력</summary>
            <div className="source-coordinate-inputs">
              {(["X", "Y", "Z"] as const).map((axis, index) => (
                <label key={axis}>
                  {axis}
                  <NumberInput
                    aria-label={"배출원 " + axis}
                    step="0.1"
                    value={position?.[index]}
                    min={dataset?.bounds?.[0][index]}
                    max={dataset?.bounds?.[1][index]}
                    disabled={controlsDisabled || !position}
                    onValueChange={(value) => {
                      if (!position) return;
                      const next: [number, number, number] = [...position];
                      next[index] = value;
                      placement.place(next);
                    }}
                    onValidityChange={numberValidity}
                  />
                </label>
              ))}
            </div>
          </details>
        </div>
      </section>
      <section className="inner-setup-card">
        {heading(2, "초기 유동장")}
        <div
          id="setup-step-2"
          className="setup-body"
          hidden={picking || !expanded.has(2)}
        >
          <div className="setup-row">
            <label>
              풍속 (m/s)
              <NumberInput
                aria-label="유입 풍속"
                min="0.1"
                max="30"
                step="0.1"
                value={speed}
                disabled={controlsDisabled}
                onValueChange={setSpeed}
                onValidityChange={numberValidity}
              />
            </label>
            <label>
              풍향 (°)
              <NumberInput
                aria-label="풍향"
                min="0"
                max="359"
                step="1"
                value={direction}
                disabled={controlsDisabled}
                onValueChange={setDirection}
                onValidityChange={numberValidity}
              />
            </label>
          </div>
          <Button
            variant="ghost"
            size="sm"
            disabled={controlsDisabled}
            onClick={() => {
              setSpeed(5);
              setDirection(0);
            }}
          >
            <RotateCcw size={12} />
            기본값
          </Button>
          <Wind className="setup-wind-icon" size={16} />
        </div>
      </section>
      <section className="inner-setup-card">
        {heading(3, "예측")}
        <div
          id="setup-step-3"
          className="setup-body"
          hidden={picking || !expanded.has(3)}
        >
          <label>
            계산 시간 (초)
            <NumberInput
              aria-label="계산 시간"
              min="1"
              max="3600"
              value={duration}
              disabled={controlsDisabled}
              onValueChange={setDuration}
              onValidityChange={numberValidity}
            />
          </label>
          <details>
            <summary>고급 설정</summary>
            <label>
              출력 간격 (초)
              <NumberInput
                aria-label="출력 간격"
                min="0.1"
                max="60"
                step="0.1"
                value={step}
                disabled={controlsDisabled}
                onValueChange={setStep}
                onValidityChange={numberValidity}
              />
            </label>
            <p className="help-text">배출량 1 g/s</p>
          </details>
          <Button
            className="setup-run"
            disabled={!canPredict || !valid || controlsDisabled || picking}
            onClick={async () => {
              if (!dataset) return;
              setRunTimingContext({
                datasetId: dataset.id,
                key: timingContext,
              });
              const result = await workflow.run(request);
              if (result) {
                settings.complete(fingerprint, result);
                setExpanded(new Set([3]));
              }
            }}
          >
            {dataset && (workflow.busy || finishing) && (
              <LoaderCircle size={14} className="spin" />
            )}
            {dataset && (workflow.busy || finishing)
              ? finishing
                ? "준비 중"
                : "계산 중"
              : changed
                ? "다시 예측"
                : "예측 시작"}
          </Button>
          {dataset &&
            !(
              preparingPlayback &&
              !workflow.busy &&
              !finishing &&
              !changed
            ) && (
              <div className="setup-status-row">
                <p className="setup-status" role="status">
                  {changed
                    ? "설정이 변경되었습니다"
                    : displayFailed
                      ? "시각화 준비 실패"
                      : finishing
                        ? "시각화 준비 중"
                        : phase === "preparing"
                          ? (workflow.preparationLabel ?? phases[phase])
                          : phases[phase]}
                </p>
                <PredictionTiming
                  key={dataset.id}
                  phase={
                    displayFailed
                      ? "failed"
                      : workflow.phase === "ready" &&
                          !finalDisplayMode &&
                          !displayReady
                        ? "cancelled"
                        : workflow.phase
                  }
                  progress={workflow.progress}
                  progressKey={workflow.progressKey}
                  contextKey={
                    runTimingContext?.datasetId === dataset.id
                      ? runTimingContext.key
                      : timingContext
                  }
                  finishing={finishing}
                />
              </div>
            )}
          {dataset && workflow.busy && (
            <>
              <progress
                aria-label="예측 진행률"
                max={100}
                value={workflow.progress}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void workflow.cancel()}
              >
                취소
              </Button>
            </>
          )}
          {dataset && !canPredict && (
            <p className="help-text">
              모델 입력이 준비된 공간에서 실행할 수 있습니다
            </p>
          )}
          {dataset && (workflow.error || displayFailed) && (
            <Failure error={workflow.error ?? displayFailed!} />
          )}
        </div>
      </section>
      {picking && (
        <div className="source-placement-instruction" role="status">
          장면을 클릭해 위치를 지정하세요
          <Button variant="ghost" size="sm" onClick={placement.cancel}>
            취소
          </Button>
        </div>
      )}
    </aside>
  );
}

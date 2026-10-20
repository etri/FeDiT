import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Maximize,
  Pause,
  Play,
  Repeat,
  StepBack,
  StepForward,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { useWorkspace } from "../../stores/workspace";
import type { Dataset } from "../datasets/types";
import { usePlaybackTransport } from "./playbackTransport";
import "./PlaybackControls.css";

interface Props {
  dataset?: Dataset;
  firstFrame?: number;
  playable?: boolean;
  disabled?: boolean;
  buffering?: boolean;
  onFullscreen?: () => void;
  continuousKey?: string;
}

const emptyTimes: number[] = [];
const secondsPerUnit: Record<string, number> = {
  ms: 0.001,
  s: 1,
  sec: 1,
  min: 60,
  h: 3600,
};

function clock(seconds: number) {
  const value = Math.round(Math.max(0, seconds) * 10) / 10;
  return `${Math.floor(value / 60)
    .toString()
    .padStart(2, "0")}:${(value % 60)
    .toFixed(value % 1 ? 1 : 0)
    .padStart(value % 1 ? 4 : 2, "0")}`;
}

export function PlaybackControls({
  dataset,
  firstFrame = 0,
  playable = true,
  disabled = false,
  buffering = false,
  onFullscreen,
  continuousKey,
}: Props) {
  const transport = usePlaybackTransport();
  const continuous = continuousKey !== undefined;
  const prepared =
    continuous &&
    transport.key === continuousKey &&
    transport.status === "ready"
      ? transport.clip
      : undefined;
  const storedFrame = useWorkspace((state) => state.frame);
  const resultId = useWorkspace((state) => state.resultId);
  const set = useWorkspace((state) => state.set);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [repeat, setRepeat] = useState(false);
  const serializedTimes = JSON.stringify(dataset?.times ?? emptyTimes);
  const times = useMemo(
    () => JSON.parse(serializedTimes) as number[],
    [serializedTimes],
  );
  const last = Math.max(0, times.length - 1);
  const first = Math.max(0, Math.min(last, Math.trunc(firstFrame)));
  const frame = Math.max(first, Math.min(last, storedFrame));
  const direction = dataset?.timeUnit === "direction";
  const steps = dataset?.timeUnit === "frame";
  const unit = secondsPerUnit[dataset?.timeUnit ?? "s"] ?? 1;
  const capabilities = dataset?.capabilities;
  const staticResult =
    capabilities &&
    !Array.isArray(capabilities) &&
    capabilities.playback === false;
  const locked = disabled || !times.length;
  const legacyCanPlay =
    !locked && playable && !staticResult && !direction && last > first;
  const canPlay =
    legacyCanPlay &&
    (!continuous ||
      (Boolean(prepared && prepared.times.length > 1) && !buffering));
  const activePlaying = continuous
    ? transport.key === continuousKey && transport.playing
    : playing;
  const activeSpeed = continuous ? transport.speed : speed;
  const activeRepeat = continuous ? transport.repeat : repeat;
  const startTime = prepared?.times[0] ?? (times[first] ?? 0) * unit;
  const endTime = prepared?.times.at(-1) ?? (times[last] ?? 0) * unit;
  const currentTime =
    continuous && transport.key === continuousKey ? transport.time : startTime;
  const previousTime =
    prepared?.times
      .slice()
      .reverse()
      .find((time) => time < currentTime) ?? startTime;
  const nextTime =
    prepared?.times.find((time) => time > currentTime) ?? endTime;
  const shownTime = (index: number) =>
    direction
      ? `${times[index] ?? 0}°`
      : steps
        ? `단계 ${index + 1}`
        : clock((times[index] ?? 0) * unit);
  const timeLabel = continuous
    ? `${clock(currentTime)} / ${clock(endTime)}`
    : `${shownTime(frame)} / ${shownTime(last)}`;

  const move = (index: number) => {
    if (continuous) {
      transport.pause();
      transport.seek(index);
      return;
    }
    setPlaying(false);
    set({ frame: Math.max(first, Math.min(last, index)) });
  };
  const toggle = useCallback(() => {
    if (!canPlay) return;
    if (continuous) {
      const current = usePlaybackTransport.getState();
      if (current.playing) current.pause();
      else current.play();
      return;
    }
    if (!playing && frame === last) set({ frame: first });
    setPlaying((value) => !value);
  }, [canPlay, continuous, playing, frame, last, first, set]);

  useEffect(() => {
    setPlaying(false);
    if (continuous) usePlaybackTransport.getState().pause();
  }, [
    dataset?.id,
    dataset?.timeUnit,
    resultId,
    times,
    first,
    disabled,
    playable,
    legacyCanPlay,
    continuous,
    continuousKey,
  ]);

  useEffect(() => {
    if (continuous && buffering) usePlaybackTransport.getState().pause();
  }, [continuous, buffering]);
  useEffect(
    () => () => {
      if (continuous) usePlaybackTransport.getState().pause();
    },
    [continuous],
  );
  useEffect(() => {
    if (continuous || !playing || !canPlay || buffering) return;
    const next = frame === last ? first : frame + 1;
    const interval =
      frame === last
        ? times[last] - times[last - 1]
        : times[next] - times[frame];
    const delay =
      ((steps
        ? 1
        : Number.isFinite(interval) && interval > 0
          ? interval * unit
          : 1) *
        1000) /
      speed;
    const timer = window.setTimeout(() => {
      set({ frame: next });
      if (next === last && !repeat) setPlaying(false);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [
    continuous,
    playing,
    buffering,
    canPlay,
    frame,
    first,
    last,
    times,
    steps,
    unit,
    speed,
    repeat,
    set,
  ]);

  useEffect(() => {
    const stop = () => {
      setPlaying(false);
      if (continuous) usePlaybackTransport.getState().pause();
    };
    const keydown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        event.defaultPrevented ||
        event.repeat ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      )
        return;
      if (
        target instanceof HTMLElement &&
        (target.closest(
          "input, textarea, select, button, a, [contenteditable]",
        ) ||
          target.isContentEditable)
      )
        return;
      if (event.code === "Space" && canPlay) {
        event.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", keydown);
    window.addEventListener("flowcast:graphics-lost", stop);
    return () => {
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("flowcast:graphics-lost", stop);
    };
  }, [canPlay, toggle, continuous]);

  return (
    <div
      className="timeline playback-controls"
      aria-label="결과 재생"
      aria-busy={
        buffering || (continuous && !prepared && transport.status !== "failed")
      }
    >
      {continuous &&
        !prepared &&
        (transport.key === continuousKey && transport.status === "failed" ? (
          <span className="playback-preparation-error" role="alert">
            {transport.error?.message ?? "Playback preparation failed."}
          </span>
        ) : (
          <div className="playback-preparation" role="status">
            <span>
              {transport.preparationLabel ?? "재생 준비"}{" "}
              {transport.key === continuousKey &&
              transport.progress > 0 &&
              !transport.preparationIndeterminate
                ? transport.progress < 1
                  ? "1% 미만"
                  : `${Math.floor(transport.progress)}%`
                : "진행량 확인 중"}
            </span>
            <progress
              aria-label="재생 준비 진행률"
              max={100}
              value={
                transport.key === continuousKey &&
                transport.progress > 0 &&
                !transport.preparationIndeterminate
                  ? transport.progress
                  : undefined
              }
            />
          </div>
        ))}
      <input
        className="playback-seek"
        aria-label={direction ? "풍향 사례" : "시간 단계"}
        aria-valuetext={continuous ? clock(currentTime) : shownTime(frame)}
        title={continuous ? clock(currentTime) : shownTime(frame)}
        type="range"
        min={continuous ? startTime : first}
        max={continuous ? endTime || 1 : last || 1}
        step={continuous ? 0.01 : 1}
        value={continuous ? currentTime : frame}
        disabled={
          continuous
            ? !prepared || disabled || buffering || startTime === endTime
            : locked || first === last
        }
        onChange={(event) => move(Number(event.target.value))}
      />
      <div className="playback-row">
        <div className="playback-primary">
          <Button
            variant="secondary"
            size="icon"
            aria-label={activePlaying ? "일시정지" : "재생"}
            title="재생 / 일시정지 (Space)"
            disabled={!canPlay}
            onClick={toggle}
          >
            {activePlaying ? <Pause size={17} /> : <Play size={17} />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="이전 프레임"
            title="이전 프레임"
            disabled={
              continuous
                ? !prepared || disabled || buffering || currentTime <= startTime
                : locked || frame <= first
            }
            onClick={() => move(continuous ? previousTime : frame - 1)}
          >
            <StepBack size={17} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="다음 프레임"
            title="다음 프레임"
            disabled={
              continuous
                ? !prepared || disabled || buffering || currentTime >= endTime
                : locked || frame >= last
            }
            onClick={() => move(continuous ? nextTime : frame + 1)}
          >
            <StepForward size={17} />
          </Button>
          <span className="time-label playback-time">{timeLabel}</span>
        </div>
        <div className="playback-options">
          <select
            aria-label="재생 속도"
            value={activeSpeed}
            disabled={!canPlay}
            onChange={(event) =>
              continuous
                ? transport.setSpeed(Number(event.target.value))
                : setSpeed(Number(event.target.value))
            }
          >
            {[0.5, 1, 2].map((value) => (
              <option key={value} value={value}>
                {value}×
              </option>
            ))}
          </select>
          <Button
            variant="ghost"
            size="icon"
            aria-label="반복 재생"
            title="반복 재생"
            aria-pressed={activeRepeat}
            disabled={!canPlay}
            onClick={() =>
              continuous
                ? transport.setRepeat(!activeRepeat)
                : setRepeat((value) => !value)
            }
          >
            <Repeat size={17} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="재생 화면 전체화면"
            title="전체화면"
            onClick={(event) => {
              if (onFullscreen) onFullscreen();
              else
                void event.currentTarget
                  .closest(".scene-workspace, .center-workspace")
                  ?.requestFullscreen?.()
                  .catch(() => undefined);
            }}
          >
            <Maximize size={17} />
          </Button>
        </div>
      </div>
    </div>
  );
}

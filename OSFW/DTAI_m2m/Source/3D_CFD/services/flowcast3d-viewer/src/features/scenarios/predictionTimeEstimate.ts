import type { PredictionPhase } from "./usePredictionWorkflow";

const phases = ["predicting", "dispersing", "preparing", "rendering"] as const;
export type TimedPredictionPhase = PredictionPhase | "rendering";
type ActivePhase = (typeof phases)[number];
type Durations = Partial<Record<ActivePhase, number>>;
interface Sample {
  progress: number;
  observedAt: number;
}
export interface PredictionClock {
  context: string;
  startedAt: number;
  phase: ActivePhase;
  phaseStartedAt: number;
  durations: Durations;
  history?: Durations;
  progressKey?: string;
  anchor?: Sample;
  latest?: Sample;
  finished?: boolean;
}
const profiles = new Map<string, Durations>();
const MINIMUM_WINDOW = 5_000;

export function isTimedPhase(
  phase: TimedPredictionPhase,
): phase is ActivePhase {
  return phases.some((candidate) => candidate === phase);
}

// 완료된 같은 공간과 설정의 실행만 후속 단계 시간의 기준으로 보관
export function observePredictionTime(
  previous: PredictionClock | undefined,
  context: string,
  phase: TimedPredictionPhase,
  progress: number | undefined,
  progressKey: string | undefined,
  now: number,
): PredictionClock | undefined {
  if (!isTimedPhase(phase)) {
    if (
      phase !== "ready" ||
      !previous ||
      previous.finished ||
      previous.context !== context
    )
      return undefined;
    const durations = {
      ...previous.durations,
      [previous.phase]: Math.max(0, now - previous.phaseStartedAt),
    };
    durations.rendering ??= 0;
    if (phases.every((item) => durations[item] !== undefined)) {
      if (profiles.size >= 32 && !profiles.has(context))
        profiles.delete(profiles.keys().next().value!);
      profiles.set(context, durations);
    }
    return { ...previous, durations, finished: true };
  }
  let clock: PredictionClock;
  if (!previous || previous.finished || previous.context !== context) {
    clock = {
      context,
      startedAt: now,
      phase,
      phaseStartedAt: now,
      durations: {},
      history: profiles.get(context),
    };
  } else if (previous.phase !== phase) {
    clock = {
      ...previous,
      phase,
      phaseStartedAt: now,
      durations: {
        ...previous.durations,
        [previous.phase]: Math.max(0, now - previous.phaseStartedAt),
      },
      anchor: undefined,
      latest: undefined,
    };
  } else clock = previous;
  const valid =
    progress !== undefined &&
    Number.isFinite(progress) &&
    progress >= 0 &&
    progress <= 100;
  if (!valid)
    return {
      ...clock,
      progressKey,
      anchor: undefined,
      latest: undefined,
    };
  const sample = { progress, observedAt: now };
  if (
    clock.progressKey !== progressKey ||
    !clock.anchor ||
    (clock.latest && progress < clock.latest.progress)
  )
    return { ...clock, progressKey, anchor: sample, latest: sample };
  if (clock.latest?.progress === progress) return clock;
  return { ...clock, progressKey, latest: sample };
}

// 짧은 마지막 응답 간격 대신 누적 관측 구간으로 최종 준비 단계 추정
export function estimatePredictionRemaining(
  clock: PredictionClock | undefined,
  now: number,
): number | undefined {
  if (!clock || clock.finished) return undefined;
  const index = phases.indexOf(clock.phase);
  const following = phases.slice(index + 1);
  if (following.some((phase) => clock.history?.[phase] === undefined))
    return undefined;
  let remaining: number | undefined;
  const anchor = clock.anchor,
    latest = clock.latest;
  if (
    clock.phase === "preparing" &&
    anchor &&
    latest &&
    latest.progress < 100 &&
    latest.progress > anchor.progress &&
    latest.observedAt - anchor.observedAt >= MINIMUM_WINDOW
  ) {
    const interval = latest.observedAt - anchor.observedAt;
    const estimate =
      (interval * (100 - latest.progress)) /
      (latest.progress - anchor.progress);
    remaining = estimate - Math.max(0, now - latest.observedAt);
  } else if (clock.history?.[clock.phase] !== undefined) {
    remaining = clock.history[clock.phase]! - (now - clock.phaseStartedAt);
  }
  if (remaining === undefined || !Number.isFinite(remaining) || remaining <= 0)
    return undefined;
  return (
    remaining +
    following.reduce((sum, phase) => sum + clock.history![phase]!, 0)
  );
}

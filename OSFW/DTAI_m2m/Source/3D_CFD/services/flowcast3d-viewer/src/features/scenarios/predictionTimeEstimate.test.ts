import { describe, expect, it } from "vitest";
import {
  estimatePredictionRemaining,
  observePredictionTime,
  type PredictionClock,
  type TimedPredictionPhase,
} from "./predictionTimeEstimate";

function timeline(context: string) {
  let clock: PredictionClock | undefined;
  return {
    observe(
      phase: TimedPredictionPhase,
      progress: number | undefined,
      now: number,
      key = "frames",
    ) {
      clock = observePredictionTime(clock, context, phase, progress, key, now);
      return clock;
    },
    remaining(now: number) {
      return estimatePredictionRemaining(clock, now);
    },
  };
}
function learned(context: string) {
  const run = timeline(context);
  run.observe("predicting", 0, 0);
  run.observe("dispersing", 0, 10_000);
  run.observe("preparing", 0, 50_000);
  run.observe("rendering", undefined, 130_000);
  run.observe("ready", 100, 135_000);
  return run;
}

describe("whole prediction estimate", () => {
  it("includes unstarted preparation and GPU rendering instead of the server poll pair alone", () => {
    const run = learned("total-remaining");
    run.observe("predicting", 20, 200_000);
    run.observe("predicting", 95, 201_500);
    expect(run.remaining(201_500)).toBe(133_500);
    run.observe("dispersing", 80, 210_000);
    expect(run.remaining(210_000)).toBe(125_000);
  });

  it("uses a cumulative window and rejects a fast final response burst as its sole rate", () => {
    const run = learned("burst-window");
    run.observe("preparing", 0, 200_000);
    run.observe("preparing", 10, 210_000);
    expect(run.remaining(210_000)).toBe(95_000);
    run.observe("preparing", 11, 210_100);
    expect(run.remaining(210_100)).toBeCloseTo((10_100 * 89) / 11 + 5000);
    expect(run.remaining(210_100)).toBeGreaterThan(80_000);
  });

  it("uses measured history until the live window reaches five seconds", () => {
    const run = learned("minimum-window");
    run.observe("preparing", 0, 200_000);
    run.observe("preparing", 50, 200_100);
    expect(run.remaining(200_100)).toBe(84_900);
  });

  it.each([undefined, Number.NaN, Infinity, -1, 101])(
    "rejects invalid progress %s",
    (progress) => {
      const run = learned(`invalid-progress-${progress}`);
      run.observe("preparing", 0, 200_000);
      run.observe("preparing", 10, 210_000);
      expect(run.remaining(210_000)).toBe(95_000);
      run.observe("preparing", progress, 211_000);
      expect(run.remaining(211_000)).toBe(74_000);
    },
  );

  it("resets the sampling window on changing units or regressing progress", () => {
    const run = learned("reset-window");
    run.observe("preparing", 0, 200_000);
    run.observe("preparing", 10, 210_000);
    run.observe("preparing", 5, 211_000);
    expect(run.remaining(211_000)).toBe(74_000);
    run.observe("preparing", 50, 221_000, "another-stage");
    expect(run.remaining(221_000)).toBe(64_000);
  });

  it("does not count below zero when a historical duration or live estimate is exceeded", () => {
    const run = learned("expired-estimate");
    run.observe("rendering", undefined, 200_000);
    expect(run.remaining(204_000)).toBe(1000);
    expect(run.remaining(205_000)).toBeUndefined();
    expect(run.remaining(210_000)).toBeUndefined();
  });

  it("never learns ready timings from a different context", () => {
    let clock = observePredictionTime(
      undefined,
      "context-before",
      "predicting",
      0,
      "",
      0,
    );
    clock = observePredictionTime(
      clock,
      "context-before",
      "dispersing",
      0,
      "",
      10_000,
    );
    clock = observePredictionTime(
      clock,
      "context-before",
      "preparing",
      0,
      "",
      20_000,
    );
    expect(
      observePredictionTime(clock, "context-after", "ready", 100, "", 30_000),
    ).toBeUndefined();
    const next = timeline("context-after");
    next.observe("predicting", 0, 40_000);
    expect(next.remaining(40_000)).toBeUndefined();
  });
});

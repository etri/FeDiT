import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PredictionTiming } from "./PredictionTiming";

let now: number;
function advance(milliseconds: number) {
  now += milliseconds;
  act(() => vi.advanceTimersByTime(milliseconds));
}
function elapsed() {
  return screen.getByLabelText("경과 시간");
}
function remaining() {
  return screen.queryByLabelText("전체 예상 남은 시간");
}

beforeEach(() => {
  now = 0;
  vi.useFakeTimers();
  vi.spyOn(performance, "now").mockImplementation(() => now);
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("prediction processing time", () => {
  it("shows elapsed time without remaining estimates throughout each stage", () => {
    const view = render(
      <PredictionTiming
        contextKey="first-run"
        phase="predicting"
        progress={20}
      />,
    );
    advance(10_000);
    view.rerender(
      <PredictionTiming
        contextKey="first-run"
        phase="predicting"
        progress={90}
      />,
    );
    expect(elapsed()).toHaveTextContent("경과 00:10");
    expect(remaining()).not.toBeInTheDocument();
    view.rerender(
      <PredictionTiming
        contextKey="first-run"
        phase="dispersing"
        progress={40}
      />,
    );
    advance(20_000);
    view.rerender(
      <PredictionTiming
        contextKey="first-run"
        phase="dispersing"
        progress={95}
      />,
    );
    expect(elapsed()).toHaveTextContent("경과 00:30");
    expect(remaining()).not.toBeInTheDocument();
    view.rerender(
      <PredictionTiming
        contextKey="first-run"
        phase="preparing"
        progress={0}
      />,
    );
    advance(10_000);
    view.rerender(
      <PredictionTiming
        contextKey="first-run"
        phase="preparing"
        progress={90}
      />,
    );
    expect(remaining()).not.toBeInTheDocument();
    expect(elapsed()).toHaveTextContent("경과 00:40");
  });

  it("keeps the clock active until the first GPU display is ready", () => {
    const view = render(
      <PredictionTiming
        contextKey="gpu-wait"
        phase="preparing"
        progress={50}
      />,
    );
    advance(10_000);
    view.rerender(
      <PredictionTiming
        contextKey="gpu-wait"
        phase="ready"
        progress={100}
        finishing
      />,
    );
    expect(screen.getByLabelText("예측 처리 시간")).toBeInTheDocument();
    advance(5000);
    expect(elapsed()).toHaveTextContent("경과 00:15");
    expect(remaining()).not.toBeInTheDocument();
    view.rerender(
      <PredictionTiming contextKey="gpu-wait" phase="ready" progress={100} />,
    );
    expect(screen.queryByLabelText("예측 처리 시간")).not.toBeInTheDocument();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("resets elapsed time for a new run or a different context", () => {
    const contextKey = "completed-profile";
    const view = render(
      <PredictionTiming contextKey={contextKey} phase="predicting" />,
    );
    advance(10_000);
    view.rerender(
      <PredictionTiming contextKey={contextKey} phase="dispersing" />,
    );
    advance(40_000);
    view.rerender(
      <PredictionTiming
        contextKey={contextKey}
        phase="preparing"
        progress={0}
      />,
    );
    advance(80_000);
    view.rerender(
      <PredictionTiming contextKey={contextKey} phase="ready" finishing />,
    );
    advance(5000);
    view.rerender(<PredictionTiming contextKey={contextKey} phase="ready" />);
    view.rerender(
      <PredictionTiming contextKey={contextKey} phase="predicting" />,
    );
    expect(elapsed()).toHaveTextContent("경과 00:00");
    expect(remaining()).not.toBeInTheDocument();
    advance(5000);
    expect(remaining()).not.toBeInTheDocument();
    view.rerender(
      <PredictionTiming
        contextKey="another-dataset-or-settings"
        phase="predicting"
      />,
    );
    expect(elapsed()).toHaveTextContent("경과 00:00");
    expect(remaining()).not.toBeInTheDocument();
  });

  it.each(["cancelled", "failed"] as const)(
    "does not learn an incomplete %s run",
    (phase) => {
      const contextKey = `incomplete-${phase}`;
      const view = render(
        <PredictionTiming contextKey={contextKey} phase="predicting" />,
      );
      advance(10_000);
      view.rerender(
        <PredictionTiming contextKey={contextKey} phase="dispersing" />,
      );
      advance(10_000);
      view.rerender(
        <PredictionTiming contextKey={contextKey} phase="preparing" />,
      );
      advance(10_000);
      view.rerender(<PredictionTiming contextKey={contextKey} phase={phase} />);
      view.rerender(
        <PredictionTiming contextKey={contextKey} phase="predicting" />,
      );
      expect(remaining()).not.toBeInTheDocument();
      expect(elapsed()).toHaveTextContent("경과 00:00");
    },
  );

  it("clears its interval on unmount and starts another run at zero elapsed", () => {
    const view = render(<PredictionTiming phase="predicting" progress={20} />);
    expect(vi.getTimerCount()).toBe(1);
    advance(10_000);
    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
    advance(90_000);
    render(<PredictionTiming phase="predicting" progress={40} />);
    expect(elapsed()).toHaveTextContent("경과 00:00");
    advance(2000);
    expect(elapsed()).toHaveTextContent("경과 00:02");
  });

  it("formats elapsed times beyond one hour without wrapping minutes", () => {
    render(<PredictionTiming phase="predicting" />);
    now = 3_661_000;
    act(() => vi.advanceTimersByTime(1000));
    expect(elapsed()).toHaveTextContent("경과 1:01:01");
    expect(remaining()).not.toBeInTheDocument();
  });
});

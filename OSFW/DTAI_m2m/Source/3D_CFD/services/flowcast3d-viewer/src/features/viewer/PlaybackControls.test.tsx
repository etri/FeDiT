import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Dataset } from "../datasets/types";
import { useWorkspace } from "../../stores/workspace";
import { PlaybackControls } from "./PlaybackControls";
import { usePlaybackTransport } from "./playbackTransport";
import type { PreparedPlaybackClip } from "./preparedPlayback";

const dataset: Dataset = {
  id: "test",
  fields: [{ id: "speed" }],
  times: [0, 0.5, 2],
  timeUnit: "s",
};
const advance = (milliseconds: number) =>
  act(() => vi.advanceTimersByTime(milliseconds));
const frame = () => useWorkspace.getState().frame;

beforeEach(() => {
  vi.useFakeTimers();
  useWorkspace.setState({ frame: 0, resultId: "" });
  usePlaybackTransport.getState().reset();
  usePlaybackTransport.setState({ speed: 1, repeat: false });
});
afterEach(() => {
  cleanup();
  usePlaybackTransport.getState().reset();
  vi.useRealTimers();
});

describe("prepared continuous playback controls", () => {
  let now = 0,
    nextId = 0;
  const callbacks = new Map<number, FrameRequestCallback>();
  const continuousDataset = { ...dataset, times: [0, 0.5, 60] };
  const clip: PreparedPlaybackClip = {
    key: "clip",
    times: continuousDataset.times,
    range: [0, 1],
    bytes: 15,
    frames: continuousDataset.times.map((time, index) => {
      const asset = {
        kind: "volume" as const,
        format: "float32",
        url: `/frame-${index}`,
      };
      return {
        index,
        asset,
        values: new Float32Array([index]),
        mask: new Uint8Array([1]),
        scene: {
          contextKey: `${index}`,
          origin: [0, 0, 0],
          bounds: [
            [0, 0, 0],
            [1, 1, 1],
          ],
          assets: [asset],
          time,
        },
      };
    }),
  };
  const frameAt = (milliseconds: number) =>
    act(() => {
      now = milliseconds;
      const pending = [...callbacks.values()];
      callbacks.clear();
      pending.forEach((callback) => callback(now));
    });
  const ready = () => {
    usePlaybackTransport.getState().prepare("clip");
    usePlaybackTransport.getState().setReady("clip", clip);
  };
  beforeEach(() => {
    now = 0;
    callbacks.clear();
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callbacks.set(++nextId, callback);
      return nextId;
    });
    vi.stubGlobal("cancelAnimationFrame", (id: number) => callbacks.delete(id));
    vi.spyOn(performance, "now").mockImplementation(() => now);
  });
  afterEach(() => {
    usePlaybackTransport.getState().reset();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("requires complete preparation and initial GPU readiness before playing", () => {
    usePlaybackTransport.getState().prepare("clip");
    usePlaybackTransport.getState().setProgress("clip", 40);
    const view = render(
      <PlaybackControls
        dataset={continuousDataset}
        continuousKey="clip"
        buffering
      />,
    );
    expect(
      screen.getByRole("progressbar", { name: "재생 준비 진행률" }),
    ).toHaveAttribute("value", "40");
    expect(screen.getAllByRole("progressbar")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveTextContent("재생 준비 40%");
    act(() => usePlaybackTransport.getState().setProgress("clip", 75));
    expect(screen.getAllByRole("progressbar")).toHaveLength(1);
    expect(
      screen.getByRole("progressbar", { name: "재생 준비 진행률" }),
    ).toHaveAttribute("value", "75");
    expect(screen.getByRole("status")).toHaveTextContent("재생 준비 75%");
    expect(screen.getByRole("button", { name: "재생" })).toBeDisabled();
    act(() => usePlaybackTransport.getState().setReady("clip", clip));
    expect(screen.getByRole("button", { name: "재생" })).toBeDisabled();
    view.rerender(
      <PlaybackControls dataset={continuousDataset} continuousKey="clip" />,
    );
    expect(screen.getByRole("button", { name: "재생" })).toBeEnabled();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("seeks fractional seconds and steps through actual stored timestamps", () => {
    ready();
    render(
      <PlaybackControls dataset={continuousDataset} continuousKey="clip" />,
    );
    const slider = screen.getByRole("slider", { name: "시간 단계" });
    expect(slider).toHaveAttribute("step", "0.01");
    expect(slider).toHaveAttribute("max", "60");
    fireEvent.change(slider, { target: { value: "0.25" } });
    expect(usePlaybackTransport.getState().time).toBe(0.25);
    expect(frame()).toBe(0);
    fireEvent.click(screen.getByRole("button", { name: "다음 프레임" }));
    expect(usePlaybackTransport.getState().time).toBe(0.5);
    expect(frame()).toBe(1);
    fireEvent.click(screen.getByRole("button", { name: "이전 프레임" }));
    expect(usePlaybackTransport.getState().time).toBe(0);
  });

  it("keeps the clock running through equal metadata and pauses on result replacement", () => {
    ready();
    const view = render(
      <PlaybackControls dataset={continuousDataset} continuousKey="clip" />,
    );
    fireEvent.click(screen.getByRole("button", { name: "재생" }));
    frameAt(250);
    expect(screen.getByRole("slider")).toHaveValue("0.25");
    view.rerender(
      <PlaybackControls
        dataset={{
          ...continuousDataset,
          times: [...continuousDataset.times],
          name: "Refreshed",
        }}
        continuousKey="clip"
      />,
    );
    frameAt(1250);
    expect(usePlaybackTransport.getState()).toMatchObject({
      time: 1.25,
      playing: true,
    });
    act(() => useWorkspace.setState({ resultId: "replacement", frame: 0 }));
    frameAt(5000);
    expect(usePlaybackTransport.getState().playing).toBe(false);
    expect(frame()).toBe(0);
    view.rerender(
      <PlaybackControls
        dataset={continuousDataset}
        continuousKey="replacement"
      />,
    );
    expect(screen.getByRole("button", { name: "재생" })).toBeDisabled();
  });

  it("pauses the continuous clock on graphics loss and displays preparation failures", () => {
    ready();
    render(
      <PlaybackControls dataset={continuousDataset} continuousKey="clip" />,
    );
    fireEvent.click(screen.getByRole("button", { name: "재생" }));
    frameAt(250);
    act(() => window.dispatchEvent(new Event("flowcast:graphics-lost")));
    frameAt(5000);
    expect(usePlaybackTransport.getState()).toMatchObject({
      time: 0.25,
      playing: false,
    });
    act(() =>
      usePlaybackTransport
        .getState()
        .setError("clip", new Error("Volume frame unavailable.")),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Volume frame unavailable.",
    );
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "재생" })).toBeDisabled();
  });
});

describe("video playback controls", () => {
  it("waits for scene and asset readiness before advancing the next frame", () => {
    const view = render(<PlaybackControls dataset={dataset} buffering />);
    fireEvent.click(screen.getByRole("button", { name: "재생" }));
    advance(5000);
    expect(frame()).toBe(0);
    expect(screen.getByRole("button", { name: "일시정지" })).toBeEnabled();
    view.rerender(<PlaybackControls dataset={dataset} buffering={false} />);
    advance(500);
    expect(frame()).toBe(1);
    view.rerender(<PlaybackControls dataset={dataset} buffering />);
    advance(5000);
    expect(frame()).toBe(1);
    expect(screen.getByRole("button", { name: "일시정지" })).toBeEnabled();
    view.rerender(<PlaybackControls dataset={dataset} buffering={false} />);
    advance(1499);
    expect(frame()).toBe(1);
    advance(1);
    expect(frame()).toBe(2);
    expect(screen.getByRole("button", { name: "재생" })).toBeEnabled();
  });
  it("follows uneven timestamps and stops exactly at the final frame", () => {
    render(<PlaybackControls dataset={dataset} />);
    fireEvent.click(screen.getByRole("button", { name: "재생" }));
    advance(499);
    expect(frame()).toBe(0);
    advance(1);
    expect(frame()).toBe(1);
    advance(1499);
    expect(frame()).toBe(1);
    advance(1);
    expect(frame()).toBe(2);
    expect(screen.getByRole("button", { name: "재생" })).toBeEnabled();
    advance(10000);
    expect(frame()).toBe(2);
  });

  it("keeps playback and elapsed intervals through equal metadata refreshes", () => {
    const view = render(<PlaybackControls dataset={dataset} />);
    fireEvent.click(screen.getByRole("button", { name: "재생" }));
    advance(200);
    view.rerender(
      <PlaybackControls
        dataset={{ ...dataset, name: "Refreshed", times: [...dataset.times] }}
      />,
    );
    expect(screen.getByRole("button", { name: "일시정지" })).toBeEnabled();
    advance(299);
    expect(frame()).toBe(0);
    advance(1);
    expect(frame()).toBe(1);
    advance(500);
    view.rerender(
      <PlaybackControls
        dataset={{
          ...dataset,
          fields: [...dataset.fields],
          times: [...dataset.times],
        }}
      />,
    );
    advance(999);
    expect(frame()).toBe(1);
    advance(1);
    expect(frame()).toBe(2);
    expect(screen.getByRole("button", { name: "재생" })).toBeEnabled();
  });

  it("stops when another result uses the same case and time axis", () => {
    useWorkspace.setState({ resultId: "result-a" });
    render(<PlaybackControls dataset={dataset} />);
    fireEvent.click(screen.getByRole("button", { name: "재생" }));
    advance(200);
    act(() => useWorkspace.setState({ resultId: "result-b" }));
    expect(screen.getByRole("button", { name: "재생" })).toBeEnabled();
    advance(2000);
    expect(frame()).toBe(0);
  });

  it("stops when timestamp values change and uses the new interval on replay", () => {
    const view = render(<PlaybackControls dataset={dataset} />);
    fireEvent.click(screen.getByRole("button", { name: "재생" }));
    advance(200);
    view.rerender(
      <PlaybackControls dataset={{ ...dataset, times: [0, 1, 2] }} />,
    );
    expect(screen.getByRole("button", { name: "재생" })).toBeEnabled();
    advance(2000);
    expect(frame()).toBe(0);
    fireEvent.click(screen.getByRole("button", { name: "재생" }));
    advance(999);
    expect(frame()).toBe(0);
    advance(1);
    expect(frame()).toBe(1);
  });

  it("stops when the time unit changes even if timestamp values stay equal", () => {
    const view = render(<PlaybackControls dataset={dataset} />);
    fireEvent.click(screen.getByRole("button", { name: "재생" }));
    advance(200);
    view.rerender(
      <PlaybackControls dataset={{ ...dataset, timeUnit: "ms" }} />,
    );
    expect(screen.getByRole("button", { name: "재생" })).toBeEnabled();
    advance(2000);
    expect(frame()).toBe(0);
  });

  it("restarts from the first allowed frame and steps without rounding", () => {
    useWorkspace.setState({ frame: 2 });
    render(<PlaybackControls dataset={dataset} firstFrame={1} />);
    fireEvent.click(screen.getByRole("button", { name: "재생" }));
    expect(frame()).toBe(1);
    expect(screen.getByRole("slider")).toHaveAttribute("min", "1");
    fireEvent.click(screen.getByRole("button", { name: "다음 프레임" }));
    expect(frame()).toBe(2);
    expect(screen.getByRole("button", { name: "재생" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "이전 프레임" }));
    expect(frame()).toBe(1);
    expect(screen.getByRole("button", { name: "이전 프레임" })).toBeDisabled();
  });

  it("applies playback speed and loops only when repeat is enabled", () => {
    render(<PlaybackControls dataset={dataset} />);
    fireEvent.change(screen.getByLabelText("재생 속도"), {
      target: { value: "2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "반복 재생" }));
    fireEvent.click(screen.getByRole("button", { name: "재생" }));
    advance(250);
    expect(frame()).toBe(1);
    advance(750);
    expect(frame()).toBe(2);
    advance(749);
    expect(frame()).toBe(2);
    advance(1);
    expect(frame()).toBe(0);
    advance(250);
    expect(frame()).toBe(1);
    expect(screen.getByRole("button", { name: "일시정지" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "반복 재생" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("shows both frames before repeating a two-frame result", () => {
    render(<PlaybackControls dataset={{ ...dataset, times: [0, 1] }} />);
    fireEvent.click(screen.getByRole("button", { name: "반복 재생" }));
    fireEvent.click(screen.getByRole("button", { name: "재생" }));
    advance(1000);
    expect(frame()).toBe(1);
    advance(999);
    expect(frame()).toBe(1);
    advance(1);
    expect(frame()).toBe(0);
  });

  it("converts millisecond times and treats frame values as step indices", () => {
    const view = render(
      <PlaybackControls
        dataset={{ ...dataset, timeUnit: "ms", times: [0, 200, 1000] }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "재생" }));
    advance(200);
    expect(frame()).toBe(1);
    expect(screen.getByText("00:00.2 / 00:01")).toBeVisible();
    view.rerender(
      <PlaybackControls
        dataset={{ ...dataset, timeUnit: "frame", times: [10, 50, 100] }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "재생" }));
    advance(999);
    expect(frame()).toBe(1);
    advance(1);
    expect(frame()).toBe(2);
    expect(screen.getByText("단계 3 / 단계 3")).toBeVisible();
  });

  it("seeks exact frames and pauses playback", () => {
    render(<PlaybackControls dataset={dataset} />);
    fireEvent.click(screen.getByRole("button", { name: "재생" }));
    fireEvent.change(screen.getByRole("slider", { name: "시간 단계" }), {
      target: { value: "1" },
    });
    expect(frame()).toBe(1);
    expect(screen.getByRole("slider")).toHaveAttribute(
      "aria-valuetext",
      "00:00.5",
    );
    advance(3000);
    expect(frame()).toBe(1);
  });

  it("disables time playback for direction and explicitly static datasets", () => {
    const view = render(
      <PlaybackControls
        dataset={{ ...dataset, timeUnit: "direction", times: [0, 90, 180] }}
      />,
    );
    expect(screen.getByRole("button", { name: "재생" })).toBeDisabled();
    fireEvent.change(screen.getByRole("slider", { name: "풍향 사례" }), {
      target: { value: "1" },
    });
    expect(frame()).toBe(1);
    expect(screen.getByText("90° / 180°")).toBeVisible();
    view.rerender(
      <PlaybackControls
        dataset={{ ...dataset, capabilities: { playback: false } }}
      />,
    );
    expect(screen.getByRole("button", { name: "재생" })).toBeDisabled();
    expect(screen.getByRole("slider")).toBeEnabled();
  });

  it("ignores Space in editable controls and stops after graphics loss", () => {
    render(
      <>
        <input aria-label="풍속" />
        <PlaybackControls dataset={dataset} />
      </>,
    );
    fireEvent.keyDown(screen.getByLabelText("풍속"), { code: "Space" });
    expect(screen.getByRole("button", { name: "재생" })).toBeEnabled();
    fireEvent.keyDown(document.body, { code: "Space" });
    expect(screen.getByRole("button", { name: "일시정지" })).toBeEnabled();
    act(() => window.dispatchEvent(new Event("flowcast:graphics-lost")));
    advance(2000);
    expect(frame()).toBe(0);
    expect(screen.getByRole("button", { name: "재생" })).toBeEnabled();
  });

  it("locks an outdated result and cancels pending playback", () => {
    const view = render(<PlaybackControls dataset={dataset} />);
    fireEvent.click(screen.getByRole("button", { name: "재생" }));
    view.rerender(<PlaybackControls dataset={dataset} disabled />);
    expect(screen.getByRole("slider")).toBeDisabled();
    expect(screen.getByRole("button", { name: "다음 프레임" })).toBeDisabled();
    advance(3000);
    expect(frame()).toBe(0);
  });

  it("uses the workspace fullscreen callback", () => {
    const onFullscreen = vi.fn();
    render(<PlaybackControls dataset={dataset} onFullscreen={onFullscreen} />);
    fireEvent.click(screen.getByRole("button", { name: "재생 화면 전체화면" }));
    expect(onFullscreen).toHaveBeenCalledOnce();
  });
});

import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Dataset } from "../datasets/types";
import { useWorkspace } from "../../stores/workspace";
import {
  loadPreparedPlayback,
  type PreparedPlaybackClip,
} from "./preparedPlayback";
import { usePlaybackTransport } from "./playbackTransport";
import { prepareEmissionStreamlines } from "./preparedEmission";
import { playbackSelection, usePreparedPlayback } from "./usePreparedPlayback";

vi.mock("./preparedPlayback", () => ({ loadPreparedPlayback: vi.fn() }));
vi.mock("./preparedEmission", () => ({ prepareEmissionStreamlines: vi.fn() }));
const load = vi.mocked(loadPreparedPlayback);
const dataset: Dataset = {
  id: "city",
  fields: [{ id: "concentration" }],
  times: [0, 1, 60],
  timeUnit: "s",
};
function clip(key: string, times = dataset.times): PreparedPlaybackClip {
  return {
    key,
    times,
    frames: times.map((time, index) => ({
      index,
      scene: {
        contextKey: `scene-${index}`,
        origin: [0, 0, 0],
        bounds: [
          [0, 0, 0],
          [1, 1, 1],
        ],
        time,
        assets: [],
      },
      asset: {
        kind: "volume",
        format: "float32",
        url: `/app-api/assets/${index}.bin`,
        dimensions: [1, 1, 1],
        origin: [0, 0, 0],
        spacing: [1, 1, 1],
      },
      values: new Float32Array([index]),
      mask: new Uint8Array([1]),
    })),
    range: [0, 2],
    bytes: 13,
  };
}
function pending() {
  let resolve!: (value: PreparedPlaybackClip) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<PreparedPlaybackClip>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
beforeEach(() => {
  load.mockReset();
  vi.mocked(prepareEmissionStreamlines).mockReset();
  usePlaybackTransport.getState().reset();
  usePlaybackTransport.setState(usePlaybackTransport.getInitialState(), true);
  useWorkspace.setState({
    datasetId: "city",
    resultId: "result-a",
    fieldId: "concentration",
    mode: "volume",
    frame: 0,
    roi: undefined,
  });
});
afterEach(() => {
  cleanup();
  usePlaybackTransport.getState().reset();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("prepared playback context", () => {
  it("converts timestamps to seconds and retains ROI, result, color range and first allowed frame", () => {
    useWorkspace.setState({ roi: { min: [1, 2, 3], max: [4, 5, 6] } });
    const metadata = {
      ...dataset,
      times: [0, 1000, 60000],
      timeUnit: "ms",
      initialFrame: 1,
      colorRange: [0, 20] as [number, number],
    };
    const value = playbackSelection(metadata, useWorkspace.getState())!;
    expect(value.times).toEqual([0, 1, 60]);
    expect(value.firstFrame).toBe(1);
    expect(value.request).toMatchObject({
      resultId: "result-a",
      roi: [
        [1, 2, 3],
        [4, 5, 6],
      ],
      colorRange: [0, 20],
    });
    useWorkspace.setState({ frame: 2 });
    expect(
      playbackSelection(
        { ...metadata, name: "Refresh" },
        useWorkspace.getState(),
      )?.key,
    ).toBe(value.key);
  });
  it("keeps static, direction, non-volume and malformed timelines on the existing path", () => {
    for (const value of [
      { ...dataset, timeUnit: "direction" },
      { ...dataset, timeUnit: undefined },
      { ...dataset, times: [0, 0, 1] },
      { ...dataset, capabilities: { playback: false } },
      { ...dataset, fields: [{ id: "speed" }] },
    ])
      expect(playbackSelection(value, useWorkspace.getState())).toBeUndefined();
    useWorkspace.setState({ mode: "slice" });
    expect(playbackSelection(dataset, useWorkspace.getState())).toBeUndefined();
  });
  it("preserves surface fallback and field-specific display capabilities", () => {
    for (const analysisKind of ["points", "surface"] as const) {
      const metadata = { ...dataset, analysisKind };
      expect(
        playbackSelection(metadata, useWorkspace.getState()),
      ).toBeUndefined();
      const explicit = {
        ...metadata,
        supportModes: ["surface"],
        fields: [{ id: "concentration", supportModes: ["volume"] }],
      };
      expect(
        playbackSelection(explicit, useWorkspace.getState()),
      ).toBeDefined();
    }
  });
  it("prepares the whole clip before exposing it and retains the clock through equal metadata refresh", async () => {
    const task = pending();
    load.mockReturnValue(task.promise);
    const hook = renderHook(({ data }) => usePreparedPlayback(data), {
      initialProps: { data: dataset },
    });
    const options = load.mock.calls[0][0];
    expect(hook.result.current.status).toBe("preparing");
    expect(hook.result.current.clip).toBeUndefined();
    act(() => options.onProgress?.(1, 3));
    expect(hook.result.current.progress).toBe(33);
    await act(async () => task.resolve(clip(options.key)));
    expect(hook.result.current.status).toBe("ready");
    act(() => usePlaybackTransport.setState({ time: 0.25, playing: true }));
    hook.rerender({
      data: { ...dataset, times: [...dataset.times], name: "Refresh" },
    });
    expect(load).toHaveBeenCalledTimes(1);
    expect(usePlaybackTransport.getState().time).toBe(0.25);
    expect(usePlaybackTransport.getState().playing).toBe(true);
  });
  it("aborts the previous result and rejects late clips and progress after switching context", async () => {
    const first = pending(),
      second = pending();
    load.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const hook = renderHook(() => usePreparedPlayback(dataset));
    const old = load.mock.calls[0][0];
    act(() => useWorkspace.getState().set({ resultId: "result-b" }));
    await waitFor(() => expect(load).toHaveBeenCalledTimes(2));
    const current = load.mock.calls[1][0];
    expect(old.signal.aborted).toBe(true);
    await act(async () => {
      old.onProgress?.(3, 3);
      first.resolve(clip(old.key));
    });
    expect(hook.result.current.status).toBe("preparing");
    expect(hook.result.current.progress).toBe(0);
    await act(async () => second.resolve(clip(current.key)));
    expect(hook.result.current.clip?.key).toBe(current.key);
  });
  it("retries failed preparation explicitly and retains a completed clip on unmount", async () => {
    const next = pending();
    load
      .mockRejectedValueOnce(new Error("Frame unavailable."))
      .mockReturnValueOnce(next.promise);
    const hook = renderHook(() => usePreparedPlayback(dataset));
    await waitFor(() => expect(hook.result.current.status).toBe("failed"));
    act(() => hook.result.current.retry());
    await waitFor(() => expect(load).toHaveBeenCalledTimes(2));
    const options = load.mock.calls[1][0];
    await act(async () => next.resolve(clip(options.key)));
    expect(hook.result.current.status).toBe("ready");
    hook.unmount();
    expect(options.signal.aborted).toBe(true);
    expect(usePlaybackTransport.getState()).toMatchObject({
      status: "ready",
      clip: hook.result.current.clip,
      playing: false,
    });
  });

  it("pauses navigation and reuses the exact ready clip and fractional position after remount", async () => {
    load.mockImplementation(async ({ key }) => clip(key));
    const prepare = vi.spyOn(usePlaybackTransport.getState(), "prepare");
    const setReady = vi.spyOn(usePlaybackTransport.getState(), "setReady");
    const first = renderHook(() => usePreparedPlayback(dataset));
    await waitFor(() => expect(first.result.current.status).toBe("ready"));
    const prepared = first.result.current.clip;
    vi.spyOn(performance, "now").mockReturnValue(1000);
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn(() => 1),
    );
    const cancelAnimation = vi.fn();
    vi.stubGlobal("cancelAnimationFrame", cancelAnimation);
    act(() => {
      usePlaybackTransport.getState().seek(13.5);
      usePlaybackTransport.getState().play();
    });
    expect(usePlaybackTransport.getState().playing).toBe(true);
    first.unmount();
    expect(usePlaybackTransport.getState()).toMatchObject({
      status: "ready",
      time: 13.5,
      playing: false,
    });
    expect(cancelAnimation).toHaveBeenCalledWith(1);
    expect(useWorkspace.getState().frame).toBe(1);
    const second = renderHook(() => usePreparedPlayback(dataset));
    expect(second.result.current.clip).toBe(prepared);
    expect(usePlaybackTransport.getState().clip).toBe(prepared);
    expect(usePlaybackTransport.getState().time).toBe(13.5);
    expect(useWorkspace.getState().frame).toBe(1);
    expect(load).toHaveBeenCalledOnce();
    expect(prepare).toHaveBeenCalledOnce();
    expect(setReady).toHaveBeenCalledOnce();
  });

  it.each(["iso", "streamlines"] as const)(
    "retains one ready volume through %s mode and reuses it when volume returns",
    async (mode) => {
      load.mockImplementation(async ({ key }) => clip(key));
      const hook = renderHook(() => usePreparedPlayback(dataset));
      await waitFor(() => expect(hook.result.current.status).toBe("ready"));
      const prepared = hook.result.current.clip;
      act(() => usePlaybackTransport.getState().seek(13.5));
      act(() => useWorkspace.getState().set({ mode }));
      expect(hook.result.current.status).toBe("ready");
      expect(hook.result.current.clip).toBe(prepared);
      expect(usePlaybackTransport.getState().clip).toBe(prepared);
      expect(usePlaybackTransport.getState().time).toBe(13.5);
      act(() => useWorkspace.getState().set({ mode: "volume" }));
      expect(hook.result.current.status).toBe("ready");
      expect(hook.result.current.clip).toBe(prepared);
      expect(usePlaybackTransport.getState().time).toBe(13.5);
      expect(useWorkspace.getState().frame).toBe(1);
      expect(load).toHaveBeenCalledOnce();
    },
  );

  it.each(["result", "ROI", "version", "timeline"])(
    "replaces the single retained clip when %s changes",
    async (change) => {
      const next = pending();
      load
        .mockImplementationOnce(async ({ key }) => clip(key))
        .mockReturnValueOnce(next.promise);
      const hook = renderHook(({ data }) => usePreparedPlayback(data), {
        initialProps: { data: dataset },
      });
      await waitFor(() => expect(hook.result.current.status).toBe("ready"));
      const previous = hook.result.current.clip;
      if (change === "result")
        act(() => useWorkspace.getState().set({ resultId: "result-b" }));
      else if (change === "ROI")
        act(() =>
          useWorkspace.getState().set({
            roi: { min: [1, 2, 3], max: [4, 5, 6] },
          }),
        );
      else
        hook.rerender({
          data:
            change === "version"
              ? { ...dataset, version: "updated" }
              : { ...dataset, times: [0, 2, 60] },
        });
      expect(load).toHaveBeenCalledTimes(2);
      expect(hook.result.current.status).toBe("preparing");
      expect(usePlaybackTransport.getState().clip).toBeUndefined();
      const options = load.mock.calls[1][0];
      const replacement = clip(options.key, options.times);
      await act(async () => next.resolve(replacement));
      expect(hook.result.current.clip).toBe(replacement);
      expect(usePlaybackTransport.getState().clip).toBe(replacement);
      expect(replacement).not.toBe(previous);
      expect(replacement.key).not.toBe(previous?.key);
    },
  );

  it("aborts unfinished preparation on unmount and ignores its later clip and progress", async () => {
    const task = pending();
    load.mockReturnValue(task.promise);
    const hook = renderHook(() => usePreparedPlayback(dataset));
    const options = load.mock.calls[0][0];
    hook.unmount();
    expect(options.signal.aborted).toBe(true);
    expect(usePlaybackTransport.getState().status).toBe("idle");
    await act(async () => {
      options.onProgress?.(3, 3);
      task.resolve(clip(options.key));
    });
    expect(usePlaybackTransport.getState()).toMatchObject({
      status: "idle",
      clip: undefined,
      progress: 0,
    });
  });

  it("starts preparation again after a failed visit rather than reusing the failure", async () => {
    const next = pending();
    load
      .mockRejectedValueOnce(new Error("Frame unavailable."))
      .mockReturnValueOnce(next.promise);
    const first = renderHook(() => usePreparedPlayback(dataset));
    await waitFor(() => expect(first.result.current.status).toBe("failed"));
    first.unmount();
    expect(usePlaybackTransport.getState().status).toBe("idle");
    const second = renderHook(() => usePreparedPlayback(dataset));
    expect(load).toHaveBeenCalledTimes(2);
    expect(second.result.current.status).toBe("preparing");
    const options = load.mock.calls[1][0];
    await act(async () => next.resolve(clip(options.key)));
    expect(second.result.current.status).toBe("ready");
  });

  it("forces preparation for an explicit retry even when the current clip is ready", async () => {
    const next = pending();
    load
      .mockImplementationOnce(async ({ key }) => clip(key))
      .mockReturnValueOnce(next.promise);
    const hook = renderHook(() => usePreparedPlayback(dataset));
    await waitFor(() => expect(hook.result.current.status).toBe("ready"));
    const previous = hook.result.current.clip;
    act(() => hook.result.current.retry());
    expect(load).toHaveBeenCalledTimes(2);
    expect(hook.result.current.status).toBe("preparing");
    expect(usePlaybackTransport.getState().clip).toBeUndefined();
    const options = load.mock.calls[1][0];
    const replacement = clip(options.key);
    await act(async () => next.resolve(replacement));
    expect(hook.result.current.clip).toBe(replacement);
    expect(replacement).not.toBe(previous);
    act(() => useWorkspace.getState().set({ mode: "iso" }));
    act(() => useWorkspace.getState().set({ mode: "volume" }));
    expect(hook.result.current.clip).toBe(replacement);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("rejects a ready transport whose clip belongs to a different key", () => {
    const task = pending();
    load.mockReturnValue(task.promise);
    const key = playbackSelection(dataset, useWorkspace.getState())!.key;
    usePlaybackTransport.setState({
      key,
      status: "ready",
      clip: clip("different-selection"),
    });
    const hook = renderHook(() => usePreparedPlayback(dataset));
    expect(load).toHaveBeenCalledOnce();
    expect(hook.result.current.status).toBe("preparing");
    expect(hook.result.current.clip).toBeUndefined();
  });
});

describe("emission mode preparation", () => {
  const saved = {
    ...dataset,
    provenance: {
      source: [13.82, 40.63, 5.52],
      sourceDatasetId: "city",
      sourceResultId: "saved-wind",
    },
  };
  it("waits for source paths after the last concentration frame and preserves the clip across modes", async () => {
    let finish!: (
      value: Awaited<ReturnType<typeof prepareEmissionStreamlines>>,
    ) => void;
    let pathProgress: ((completed: number, total: number) => void) | undefined;
    vi.mocked(prepareEmissionStreamlines).mockImplementation(
      (_saved, _clip, _signal, _client, _wind, report) => {
        pathProgress = report;
        report?.(0, 4);
        return new Promise((resolve) => {
          finish = resolve;
        });
      },
    );
    load.mockImplementation(async (options) => {
      options.onProgress?.(3, 3);
      return clip(options.key);
    });
    const hook = renderHook(() => usePreparedPlayback(saved));
    await waitFor(() =>
      expect(prepareEmissionStreamlines).toHaveBeenCalledOnce(),
    );
    expect(hook.result.current.status).toBe("preparing");
    expect(hook.result.current.progress).toBe(90);
    expect(hook.result.current.label).toBe("입자 이동 경로 검증 중");
    expect(hook.result.current.indeterminate).toBe(true);
    act(() => pathProgress?.(2, 4));
    expect(hook.result.current.progress).toBe(95);
    expect(hook.result.current.label).toBe("입자 이동 경로 준비 중");
    expect(hook.result.current.indeterminate).toBe(false);
    await act(async () =>
      finish({
        kind: "particle-paths" as const,
        positions: new Float32Array([0, 0, 0, 1, 0, 0]),
        times: new Float32Array([0, 1]),
        particleIds: new Uint32Array([0]),
        count: 1,
        source: [13.82, 40.63, 5.52],
        bytes: 24,
      }),
    );
    expect(hook.result.current.status).toBe("ready");
    expect(hook.result.current.clip?.bytes).toBe(37);
    const key = hook.result.current.key;
    act(() => usePlaybackTransport.getState().seek(15.25));
    for (const mode of ["streamlines", "iso", "volume"] as const) {
      act(() => useWorkspace.getState().set({ mode }));
      expect(hook.result.current.key).toBe(key);
      expect(hook.result.current.status).toBe("ready");
      expect(usePlaybackTransport.getState().time).toBe(15.25);
    }
    expect(load).toHaveBeenCalledOnce();
    expect(prepareEmissionStreamlines).toHaveBeenCalledOnce();
  });
  it("isolates a failed particle path preparation to V1 while retaining V2 and V3", async () => {
    load.mockImplementation(async ({ key }) => clip(key));
    vi.mocked(prepareEmissionStreamlines).mockRejectedValue(
      new Error("Saved wind is unavailable."),
    );
    const hook = renderHook(() => usePreparedPlayback(saved));
    await waitFor(() => expect(hook.result.current.status).toBe("ready"));
    expect(hook.result.current.clip?.streamlineError).toBe(
      "Saved wind is unavailable.",
    );
    act(() => useWorkspace.getState().set({ mode: "streamlines" }));
    expect(hook.result.current.status).toBe("failed");
    expect(hook.result.current.error?.message).toBe(
      "Saved wind is unavailable.",
    );
    act(() => useWorkspace.getState().set({ mode: "iso" }));
    expect(hook.result.current.status).toBe("ready");
    expect(hook.result.current.error).toBeUndefined();
    expect(load).toHaveBeenCalledOnce();
  });
});

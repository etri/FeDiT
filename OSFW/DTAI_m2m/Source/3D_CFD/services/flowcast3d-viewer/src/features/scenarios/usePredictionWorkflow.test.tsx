import { act, cleanup, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { api, post } from "../../lib/api";
import { useWorkspace } from "../../stores/workspace";
import { preparePredictionViews } from "../viewer/preparedViews";
import type { Dataset } from "../datasets/types";
import {
  usePredictionWorkflow,
  type PredictionSettings,
} from "./usePredictionWorkflow";

vi.mock("../../lib/api", () => ({ api: vi.fn(), post: vi.fn() }));
vi.mock("../viewer/preparedViews", () => ({
  preparePredictionViews: vi.fn(),
}));
const dataset: Dataset = {
  id: "case:harbor",
  fields: [],
  times: [],
  capabilities: { predict: true },
};
const settings: PredictionSettings = {
  source: [12, 34, 2],
  speed: 5,
  direction: 0,
  durationSeconds: 60,
  stepSeconds: 1,
  seed: 0,
};
const prediction = { id: "wind-job", status: "queued", datasetId: dataset.id },
  dispersion = {
    id: "dispersion-job",
    status: "queued",
    datasetId: "concentration-id",
  },
  resultDataset = {
    ...dataset,
    fields: [{ id: "concentration", unit: "g/m3" }],
    times: [0, 1, 2],
  };
let client: QueryClient;
function Wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
async function flush() {
  await act(async () => {
    await Promise.resolve();
  });
}
async function tick(milliseconds = 1500) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(milliseconds);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.mocked(api).mockReset();
  vi.mocked(post).mockReset();
  vi.mocked(preparePredictionViews)
    .mockReset()
    .mockResolvedValue({
      wind: {
        dataset,
        resultId: "wind-job",
        request: {
          datasetId: dataset.id,
          resultId: undefined,
          roi: undefined,
          mode: "streamlines",
          frame: 0,
        },
        scene: {
          contextKey: "wind",
          origin: [0, 0, 0],
          bounds: [
            [0, 0, 0],
            [1, 1, 1],
          ],
          assets: [],
        },
      },
      iso: {
        request: {
          datasetId: dataset.id,
          resultId: undefined,
          roi: undefined,
          mode: "iso",
          frame: 0,
        },
        scene: {
          contextKey: "iso",
          origin: [0, 0, 0],
          bounds: [
            [0, 0, 0],
            [1, 1, 1],
          ],
          assets: [],
        },
      },
    });
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  useWorkspace.setState(useWorkspace.getInitialState(), true);
  useWorkspace.setState({ datasetId: dataset.id });
  vi.mocked(post).mockImplementation(async (path) => {
    if (path === "/predict") return prediction;
    if (path === "/dispersion") return { job: dispersion };
    return {};
  });
  vi.mocked(api).mockImplementation(async (path) => {
    if (path === "/jobs")
      return {
        jobs: [
          { ...prediction, status: "succeeded" },
          {
            ...dispersion,
            status: "succeeded",
            result: { datasetId: "concentration-id" },
          },
        ],
      };
    return resultDataset;
  });
});
afterEach(() => {
  cleanup();
  client.clear();
  vi.useRealTimers();
  useWorkspace.setState(useWorkspace.getInitialState(), true);
  localStorage.clear();
});

describe("prediction and dispersion workflow", () => {
  it("unlocks the form when ROI changes while display preparation is pending", async () => {
    const value = await vi
      .mocked(preparePredictionViews)
      .getMockImplementation()!({} as never);
    const prepared = deferred<typeof value>();
    vi.mocked(preparePredictionViews).mockReturnValue(prepared.promise);
    const { result } = renderHook(() => usePredictionWorkflow(dataset), {
      wrapper: Wrapper,
    });
    let completion: Promise<string | undefined> | undefined;
    act(() => {
      completion = result.current.run(settings);
    });
    await flush();
    await tick();
    await tick();
    expect(result.current.phase).toBe("preparing");
    act(() =>
      useWorkspace.setState({ roi: { min: [0, 0, 0], max: [1, 1, 1] } }),
    );
    await act(async () => prepared.resolve(value));
    await completion;
    expect(result.current.phase).toBe("cancelled");
    expect(result.current.busy).toBe(false);
    expect(useWorkspace.getState().resultId).toBe("");
  });

  it("waits for all display modes without submitting another prediction", async () => {
    const prepared =
      deferred<Awaited<ReturnType<typeof preparePredictionViews>>>();
    const value = await vi
      .mocked(preparePredictionViews)
      .getMockImplementation()!({} as never);
    vi.mocked(preparePredictionViews).mockReturnValue(prepared.promise);
    const { result } = renderHook(() => usePredictionWorkflow(dataset), {
      wrapper: Wrapper,
    });
    let completion: Promise<string | undefined> | undefined;
    act(() => {
      completion = result.current.run(settings);
    });
    await flush();
    await tick();
    await tick();
    expect(result.current.phase).toBe("preparing");
    expect(result.current.busy).toBe(true);
    expect(useWorkspace.getState().resultId).toBe("");
    expect(preparePredictionViews).toHaveBeenCalledWith(
      expect.objectContaining({
        windResultId: prediction.id,
        resultId: "concentration-id",
        signal: expect.any(AbortSignal),
      }),
    );
    await act(async () => prepared.resolve(value));
    await expect(completion).resolves.toBe("concentration-id");
    expect(result.current.phase).toBe("ready");
    expect(
      vi.mocked(post).mock.calls.filter(([path]) => path === "/predict"),
    ).toHaveLength(1);
  });

  it("does not select a late prepared result after cancellation", async () => {
    const value = await vi
      .mocked(preparePredictionViews)
      .getMockImplementation()!({} as never);
    const prepared = deferred<typeof value>();
    vi.mocked(preparePredictionViews).mockReturnValue(prepared.promise);
    const { result } = renderHook(() => usePredictionWorkflow(dataset), {
      wrapper: Wrapper,
    });
    let completion: Promise<string | undefined> | undefined;
    act(() => {
      completion = result.current.run(settings);
    });
    await flush();
    await tick();
    await tick();
    const signal = vi.mocked(preparePredictionViews).mock.calls[0][0].signal;
    await act(async () => {
      await result.current.cancel();
    });
    expect(signal.aborted).toBe(true);
    await act(async () => prepared.resolve(value));
    await completion;
    expect(result.current.phase).toBe("cancelled");
    expect(useWorkspace.getState().resultId).toBe("");
  });
  it("waits for each server job and selects concentration within the same city", async () => {
    const { result } = renderHook(() => usePredictionWorkflow(dataset), {
      wrapper: Wrapper,
    });
    let completion: Promise<string | undefined> | undefined;
    act(() => {
      completion = result.current.run(settings);
    });
    await flush();
    expect(result.current.phase).toBe("predicting");
    expect(post).toHaveBeenCalledWith(
      "/predict",
      {
        datasetId: dataset.id,
        speed: 5,
        direction: 0,
        steps: 1,
      },
      expect.any(AbortSignal),
    );
    expect(post).toHaveBeenCalledTimes(1);
    await tick();
    expect(result.current.phase).toBe("dispersing");
    expect(post).toHaveBeenCalledWith(
      "/dispersion",
      {
        datasetId: dataset.id,
        resultId: prediction.id,
        source: settings.source,
        durationSeconds: 60,
        stepSeconds: 1,
        seed: 0,
      },
      expect.any(AbortSignal),
    );
    await tick();
    await expect(completion).resolves.toBe("concentration-id");
    expect(result.current).toMatchObject({
      phase: "ready",
      busy: false,
      resultId: "concentration-id",
    });
    expect(useWorkspace.getState()).toMatchObject({
      datasetId: dataset.id,
      resultId: "concentration-id",
      fieldId: "concentration",
      mode: "volume",
      frame: 0,
    });
    expect(
      client.getQueryData(["dataset", dataset.id, "concentration-id"]),
    ).toEqual(resultDataset);
    expect(
      vi
        .mocked(post)
        .mock.calls.every(([path]) => !path.includes("dispersion-scenarios")),
    ).toBe(true);
  });

  it("starts at the result initial frame and clears a previous comparison within the same city", async () => {
    useWorkspace.setState({
      compareId: dataset.id,
      compareResultId: "previous-wind-result",
    });
    vi.mocked(post).mockImplementation(async (path) =>
      path === "/predict"
        ? { ...prediction, status: "succeeded" }
        : { job: { ...dispersion, status: "succeeded" } },
    );
    vi.mocked(api).mockResolvedValue({ ...resultDataset, initialFrame: 1 });
    const { result } = renderHook(() => usePredictionWorkflow(dataset), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.run(settings);
    });

    expect(result.current.phase).toBe("ready");
    expect(useWorkspace.getState()).toMatchObject({
      datasetId: dataset.id,
      resultId: "concentration-id",
      fieldId: "concentration",
      frame: 1,
      compareId: "",
      compareResultId: "",
    });
  });

  it("supports the existing job datasetId when no result object is returned", async () => {
    vi.mocked(post).mockImplementation(async (path) =>
      path === "/predict"
        ? { ...prediction, status: "succeeded" }
        : { job: { ...dispersion, status: "succeeded" } },
    );
    const { result } = renderHook(() => usePredictionWorkflow(dataset), {
      wrapper: Wrapper,
    });
    await act(async () => {
      await result.current.run(settings);
    });
    expect(result.current.resultId).toBe("concentration-id");
  });

  it("stops after prediction failure without submitting dispersion", async () => {
    vi.mocked(api).mockResolvedValue({
      jobs: [
        {
          ...prediction,
          status: "failed",
          error: "Checkpoint is unavailable.",
        },
      ],
    });
    const { result } = renderHook(() => usePredictionWorkflow(dataset), {
      wrapper: Wrapper,
    });
    act(() => {
      void result.current.run(settings);
    });
    await flush();
    await tick();
    expect(result.current).toMatchObject({ phase: "failed", busy: false });
    expect(result.current.error?.message).toBe("Checkpoint is unavailable.");
    expect(post).toHaveBeenCalledTimes(1);
    await tick(10_000);
    expect(api).toHaveBeenCalledTimes(1);
  });

  it.each(["cancelled", "interrupted"])(
    "handles server %s status without an endless poll",
    async (status) => {
      vi.mocked(api).mockResolvedValue({ jobs: [{ ...prediction, status }] });
      const { result } = renderHook(() => usePredictionWorkflow(dataset), {
        wrapper: Wrapper,
      });
      act(() => {
        void result.current.run(settings);
      });
      await flush();
      await tick();
      expect(result.current.phase).toBe("cancelled");
      expect(result.current.error?.message).toBe(`Prediction ${status}.`);
      expect(result.current.busy).toBe(false);
    },
  );

  it("ends on network failure and does not retry submission", async () => {
    vi.mocked(api).mockRejectedValue(new Error("Network unavailable."));
    const { result } = renderHook(() => usePredictionWorkflow(dataset), {
      wrapper: Wrapper,
    });
    act(() => {
      void result.current.run(settings);
    });
    await flush();
    await tick();
    expect(result.current.phase).toBe("failed");
    expect(result.current.error?.message).toBe("Network unavailable.");
    expect(
      vi.mocked(post).mock.calls.filter(([path]) => path === "/predict"),
    ).toHaveLength(1);
    expect(post).toHaveBeenCalledWith(
      "/jobs/wind-job/cancel",
      {},
      expect.any(AbortSignal),
    );
    await tick(10_000);
    expect(api).toHaveBeenCalledTimes(1);
  });

  it("cancels the current server job and prevents downstream work", async () => {
    const { result } = renderHook(() => usePredictionWorkflow(dataset), {
      wrapper: Wrapper,
    });
    act(() => {
      void result.current.run(settings);
    });
    await flush();
    await act(async () => {
      await result.current.cancel();
    });
    expect(result.current).toMatchObject({ phase: "cancelled", busy: false });
    expect(post).toHaveBeenCalledWith(
      "/jobs/wind-job/cancel",
      {},
      expect.any(AbortSignal),
    );
    await tick(5000);
    expect(api).not.toHaveBeenCalled();
    expect(
      vi.mocked(post).mock.calls.some(([path]) => path === "/dispersion"),
    ).toBe(false);
  });

  it("ignores a late prediction response after city selection changes and cancels its server job", async () => {
    const pending = deferred<unknown>();
    vi.mocked(post).mockImplementation((path) =>
      path === "/predict" ? pending.promise : Promise.resolve({}),
    );
    const { result, rerender } = renderHook(
      ({ selected }) => usePredictionWorkflow(selected),
      {
        wrapper: Wrapper,
        initialProps: { selected: dataset },
      },
    );
    act(() => {
      void result.current.run(settings);
    });
    await flush();
    act(() => {
      useWorkspace.getState().selectDataset("case:other");
      rerender({ selected: { ...dataset, id: "case:other" } });
    });
    await act(async () => {
      pending.resolve(prediction);
    });
    expect(result.current.phase).toBe("idle");
    expect(useWorkspace.getState()).toMatchObject({
      datasetId: "case:other",
      resultId: "",
    });
    expect(post).toHaveBeenCalledWith(
      "/jobs/wind-job/cancel",
      {},
      expect.any(AbortSignal),
    );
    expect(
      vi.mocked(post).mock.calls.some(([path]) => path === "/dispersion"),
    ).toBe(false);
  });

  it("cancels a dispersion response that arrives after local cancellation", async () => {
    const pending = deferred<unknown>();
    vi.mocked(post).mockImplementation((path) =>
      path === "/predict"
        ? Promise.resolve({ ...prediction, status: "succeeded" })
        : path === "/dispersion"
          ? pending.promise
          : Promise.resolve({}),
    );
    const { result } = renderHook(() => usePredictionWorkflow(dataset), {
      wrapper: Wrapper,
    });
    act(() => {
      void result.current.run(settings);
    });
    await flush();
    expect(result.current.phase).toBe("dispersing");
    await act(async () => {
      await result.current.cancel();
    });
    await act(async () => {
      pending.resolve({ job: dispersion });
    });
    expect(post).toHaveBeenCalledWith(
      "/jobs/dispersion-job/cancel",
      {},
      expect.any(AbortSignal),
    );
    expect(result.current.phase).toBe("cancelled");
    expect(useWorkspace.getState().resultId).toBe("");
  });

  it("stops polling jobs after the deadline", async () => {
    vi.mocked(api).mockResolvedValue({
      jobs: [{ ...prediction, status: "running" }],
    });
    const { result } = renderHook(() => usePredictionWorkflow(dataset), {
      wrapper: Wrapper,
    });
    act(() => {
      void result.current.run(settings);
    });
    await flush();
    vi.setSystemTime(Date.now() + 20 * 60_000);
    await tick();
    expect(result.current.phase).toBe("failed");
    expect(result.current.error?.message).toMatch(/Job polling timed out/);
    expect(api).toHaveBeenCalledTimes(1);
    await tick(10_000);
    expect(api).toHaveBeenCalledTimes(1);
  });

  it("ignores late result metadata after unmount", async () => {
    const pending = deferred<unknown>();
    vi.mocked(api).mockImplementation((path) =>
      path === "/jobs"
        ? Promise.resolve({
            jobs: [
              { ...prediction, status: "succeeded" },
              { ...dispersion, status: "succeeded" },
            ],
          })
        : pending.promise,
    );
    const { result, unmount } = renderHook(
      () => usePredictionWorkflow(dataset),
      { wrapper: Wrapper },
    );
    act(() => {
      void result.current.run(settings);
    });
    await flush();
    await tick();
    await tick();
    unmount();
    await act(async () => {
      pending.resolve(resultDataset);
    });
    expect(useWorkspace.getState().resultId).toBe("");
    expect(
      client.getQueryData(["dataset", dataset.id, "concentration-id"]),
    ).toBeUndefined();
  });

  it("shows only finite progress reported by the current server job", async () => {
    vi.mocked(post).mockResolvedValue({
      ...prediction,
      progress: { current: 1, total: 4 },
    });
    vi.mocked(api).mockResolvedValue({
      jobs: [
        {
          ...prediction,
          status: "running",
          progress: { current: Infinity, total: 4 },
        },
      ],
    });
    const { result } = renderHook(() => usePredictionWorkflow(dataset), {
      wrapper: Wrapper,
    });
    act(() => {
      void result.current.run(settings);
    });
    await flush();
    expect(result.current.progress).toBe(25);
    await tick();
    expect(result.current.progress).toBeUndefined();
    await act(async () => {
      await result.current.cancel();
    });
  });

  it("keeps the progress key for percent updates and changes it for each phase, stage, or total", async () => {
    vi.mocked(post).mockImplementation(async (path) => {
      if (path === "/predict")
        return {
          ...prediction,
          progress: { stage: "encode", current: 1, total: 4 },
        };
      if (path === "/dispersion")
        return {
          job: {
            ...dispersion,
            progress: { stage: "infer", current: 2, total: 8 },
          },
        };
      return {};
    });
    for (const progress of [
      { stage: "encode", current: 2, total: 4 },
      { stage: "infer", current: 1, total: 4 },
      { stage: "infer", current: 2, total: 8 },
    ])
      vi.mocked(api).mockResolvedValueOnce({
        jobs: [{ ...prediction, status: "running", progress }],
      });
    vi.mocked(api).mockResolvedValueOnce({
      jobs: [
        {
          ...prediction,
          status: "succeeded",
          progress: { stage: "infer", current: 8, total: 8 },
        },
      ],
    });
    const { result } = renderHook(() => usePredictionWorkflow(dataset), {
      wrapper: Wrapper,
    });
    act(() => {
      void result.current.run(settings);
    });
    await flush();
    const encodingKey = result.current.progressKey;
    expect(encodingKey).toEqual(expect.any(String));
    expect(result.current.progress).toBe(25);
    await tick();
    expect(result.current.progress).toBe(50);
    expect(result.current.progressKey).toBe(encodingKey);
    await tick();
    const inferenceKey = result.current.progressKey;
    expect(result.current.progress).toBe(25);
    expect(inferenceKey).not.toBe(encodingKey);
    await tick();
    const expandedKey = result.current.progressKey;
    expect(result.current.progress).toBe(25);
    expect(expandedKey).not.toBe(inferenceKey);
    await tick();
    expect(result.current.phase).toBe("dispersing");
    expect(result.current.progress).toBe(25);
    expect(result.current.progressKey).not.toBe(expandedKey);
    await act(async () => {
      await result.current.cancel();
    });
    expect(result.current.progressKey).toBeUndefined();
  });

  it("bounds a request that never resolves", async () => {
    vi.mocked(post).mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => usePredictionWorkflow(dataset), {
      wrapper: Wrapper,
    });
    act(() => {
      void result.current.run(settings);
    });
    await flush();
    await tick(30_000);
    expect(result.current).toMatchObject({ phase: "failed", busy: false });
    expect(result.current.error?.message).toBe("Request timed out. Try again.");
  });

  it("rejects invalid or unsupported input before any request", async () => {
    const { result } = renderHook(() => usePredictionWorkflow(dataset), {
      wrapper: Wrapper,
    });
    await act(async () => {
      await result.current.run({ ...settings, speed: 0 });
    });
    expect(result.current.error?.message).toMatch(/Wind speed/);
    expect(post).not.toHaveBeenCalled();
    act(() => result.current.clear());
    expect(result.current.phase).toBe("idle");
  });

  it("rejects completed results that do not contain concentration frames", async () => {
    vi.mocked(post).mockImplementation(async (path) =>
      path === "/predict"
        ? { ...prediction, status: "succeeded" }
        : { job: { ...dispersion, status: "succeeded" } },
    );
    vi.mocked(api).mockResolvedValue(dataset);
    const { result } = renderHook(() => usePredictionWorkflow(dataset), {
      wrapper: Wrapper,
    });
    await act(async () => {
      await result.current.run(settings);
    });
    expect(result.current.error?.message).toBe(
      "Completed dispersion has no concentration frames.",
    );
    expect(result.current.phase).toBe("failed");
    expect(useWorkspace.getState().resultId).toBe("");
  });
});

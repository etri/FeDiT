import { QueryClient } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, post } from "../../lib/api";
import { useWorkspace } from "../../stores/workspace";
import type { Dataset } from "../datasets/types";
import { buildSceneRequest, sceneQueryKey } from "./api";
import {
  loadPreparedPlayback,
  type PreparedPlaybackClip,
} from "./preparedPlayback";
import { preparePredictionViews } from "./preparedViews";
import { preloadSceneAssets } from "./sceneAssets";
import type { Scene } from "./types";
import { playbackSelection } from "./usePreparedPlayback";
import { prepareEmissionStreamlines } from "./preparedEmission";

vi.mock("../../lib/api", () => ({ api: vi.fn(), post: vi.fn() }));
vi.mock("./preparedPlayback", () => ({ loadPreparedPlayback: vi.fn() }));
vi.mock("./sceneAssets", () => ({ preloadSceneAssets: vi.fn() }));
vi.mock("./preparedEmission", () => ({ prepareEmissionStreamlines: vi.fn() }));

const concentration: Dataset = {
  id: "case:harbor",
  spaceId: "case:harbor",
  fields: [
    { id: "concentration", range: [0, 80], supportModes: ["iso", "volume"] },
  ],
  times: [0, 1, 2],
  timeUnit: "s",
  initialFrame: 1,
  colorRange: [0, 100],
  version: "plume-v1",
  bounds: [
    [0, 0, 0],
    [20, 30, 40],
  ],
  provenance: {
    sourceDatasetId: "case:harbor",
    sourceResultId: null,
    windStartFrame: 2,
  },
};
const wind: Dataset = {
  id: "case:harbor",
  fields: [
    { id: "velocity", components: 3, unit: "m/s" },
    { id: "speed", unit: "m/s" },
  ],
  times: [0, 1, 2, 3],
  timeUnit: "s",
  initialFrame: 3,
  supportModes: ["streamlines"],
  bounds: concentration.bounds,
};
function scene(mode: string): Scene {
  return {
    contextKey: mode,
    origin: [0, 0, 0],
    bounds: [
      [0, 0, 0],
      [20, 30, 40],
    ],
    time: 1,
    assets: [
      { kind: "geometry", format: "glb", url: `/app-api/assets/${mode}.glb` },
    ],
  };
}
let client: QueryClient;
function options(dataset: Dataset = concentration) {
  return {
    client,
    dataset,
    resultId: "plume",
    windResultId: "predicted-wind",
    state: {
      ...useWorkspace.getInitialState(),
      datasetId: dataset.id,
      fieldId: "speed",
      axis: "x" as const,
      position: 0.25,
      threshold: 7,
      roi: {
        min: [1, 2, 3] as [number, number, number],
        max: [10, 20, 30] as [number, number, number],
      },
    },
    signal: new AbortController().signal,
  };
}
function clip(dataset: Dataset = concentration): PreparedPlaybackClip {
  const selection = playbackSelection(dataset, {
    ...options(dataset).state,
    resultId: "plume",
    fieldId: "concentration",
    mode: "volume",
  })!;
  return {
    key: selection.key,
    frames: [],
    times: [1, 2],
    range: [0, 60],
    bytes: 0,
  };
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
async function flush() {
  for (let index = 0; index < 30; index += 1) await Promise.resolve();
}

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  vi.mocked(api).mockReset().mockResolvedValue(wind);
  vi.mocked(prepareEmissionStreamlines).mockReset();
  vi.mocked(post)
    .mockReset()
    .mockImplementation(async (_path, request) =>
      scene((request as { mode: string }).mode),
    );
  vi.mocked(preloadSceneAssets).mockReset().mockResolvedValue(undefined);
  vi.mocked(loadPreparedPlayback)
    .mockReset()
    .mockImplementation(async (selection) => ({
      ...clip(),
      key: selection.key,
    }));
});
afterEach(() => {
  client.clear();
});

describe("prediction display preparation", () => {
  it("prepares exact V1 and V2 requests plus a complete V3 clip without changing provenance", async () => {
    const before = structuredClone(concentration);
    const report = vi.fn();
    const request = options();
    const result = await preparePredictionViews({
      ...request,
      onProgress: report,
    });
    expect(api).toHaveBeenCalledWith(
      "/datasets/case%3Aharbor?resultId=predicted-wind",
      expect.anything(),
    );
    expect(result.wind!.resultId).toBe("predicted-wind");
    expect(result.wind!.request).toEqual(
      buildSceneRequest(wind, {
        ...request.state,
        resultId: "predicted-wind",
        fieldId: "speed",
        mode: "streamlines",
        frame: 3,
      }),
    );
    expect(result.iso!.request).toEqual(
      buildSceneRequest(concentration, {
        ...request.state,
        resultId: "plume",
        fieldId: "concentration",
        mode: "iso",
        frame: 1,
        threshold: 30,
      }),
    );
    expect(result.playback?.key).toBe(
      playbackSelection(concentration, {
        ...request.state,
        resultId: "plume",
        fieldId: "concentration",
        mode: "volume",
        frame: 1,
      })?.key,
    );
    expect(
      client.getQueryData(["dataset", concentration.id, "predicted-wind"]),
    ).toEqual(wind);
    for (const view of [result.wind!, result.iso!]) {
      const version =
        view === result.wind ? wind.version : concentration.version;
      expect(client.getQueryData(sceneQueryKey(view.request, version))).toEqual(
        view.scene,
      );
      expect(preloadSceneAssets).toHaveBeenCalledWith(
        view.scene,
        expect.any(AbortSignal),
      );
    }
    expect(report).toHaveBeenLastCalledWith(4, 4);
    expect(concentration).toEqual(before);
  });

  it("waits for asset parsing and reuses exact immutable scene caches on a later preparation", async () => {
    const parsed = deferred<void>();
    vi.mocked(preloadSceneAssets).mockReturnValue(parsed.promise);
    let ready = false;
    const pending = preparePredictionViews(options()).then((value) => {
      ready = true;
      return value;
    });
    await flush();
    expect(ready).toBe(false);
    parsed.resolve();
    const first = await pending;
    await preparePredictionViews(options());
    expect(api).toHaveBeenCalledOnce();
    expect(post).toHaveBeenCalledTimes(2);
    for (const view of [first.wind!, first.iso!]) {
      const version =
        view === first.wind ? wind.version : concentration.version;
      const query = client
        .getQueryCache()
        .find({ queryKey: sceneQueryKey(view.request, version) })!;
      expect(query.options).toMatchObject({ staleTime: Infinity });
      expect(query.gcTime).toBe(Infinity);
    }
  });

  it("uses the full clip range when metadata has no finite concentration range", async () => {
    const dataset = {
      ...concentration,
      colorRange: undefined,
      fields: [{ id: "concentration", supportModes: ["iso", "volume"] }],
    };
    const pendingClip = deferred<PreparedPlaybackClip>();
    vi.mocked(loadPreparedPlayback).mockReturnValue(pendingClip.promise);
    const pending = preparePredictionViews(options(dataset));
    await flush();
    expect(
      vi
        .mocked(post)
        .mock.calls.map(([, body]) => (body as { mode: string }).mode),
    ).toEqual(["streamlines"]);
    pendingClip.resolve(clip(dataset));
    const result = await pending;
    expect(result.iso!.request).toMatchObject({ threshold: 30 });
  });

  it("uses the initial volume range for legacy frame timelines without range metadata", async () => {
    const dataset: Dataset = {
      ...concentration,
      timeUnit: "frame",
      colorRange: undefined,
      fields: [{ id: "concentration", supportModes: ["iso", "volume"] }],
    };
    vi.mocked(post).mockImplementation(async (_path, body) => {
      const mode = (body as { mode: string }).mode;
      return {
        ...scene(mode),
        ...(mode === "volume" ? { range: [0, 16] } : {}),
      };
    });
    const request = options(dataset);
    const report = vi.fn();
    const result = await preparePredictionViews({
      ...request,
      onProgress: report,
    });
    const volumeRequest = buildSceneRequest(dataset, {
      ...request.state,
      resultId: "plume",
      fieldId: "concentration",
      frame: 1,
      mode: "volume",
    });
    expect(
      client.getQueryData(sceneQueryKey(volumeRequest, dataset.version)),
    ).toMatchObject({
      range: [0, 16],
    });
    expect(result.iso!.request).toMatchObject({ threshold: 8 });
    expect(result.playback).toBeUndefined();
    expect(loadPreparedPlayback).not.toHaveBeenCalled();
    expect(post).toHaveBeenCalledTimes(3);
    expect(report).toHaveBeenLastCalledWith(3, 3);
  });

  it("accepts matching scalar velocity components and the provenance start frame", async () => {
    vi.mocked(api).mockResolvedValue({
      ...wind,
      initialFrame: undefined,
      fields: ["velocity_x", "velocity_y", "velocity_z"].map((id) => ({
        id,
        unit: "m/s",
      })),
    });
    const result = await preparePredictionViews(options());
    expect(result.wind!.request).toMatchObject({
      fieldId: "velocity_x",
      frame: 2,
    });
  });

  it("prepares both result-specific geometry scenes before reporting completion", async () => {
    const dataset = { ...concentration, capabilities: ["geometry"] };
    const windDataset = { ...wind, capabilities: ["geometry"] };
    vi.mocked(api).mockResolvedValue(windDataset);
    const report = vi.fn();
    const request = options(dataset);
    await preparePredictionViews({ ...request, onProgress: report });
    for (const [metadata, resultId] of [
      [dataset, "plume"],
      [windDataset, "predicted-wind"],
    ] as const) {
      const selection = buildSceneRequest(
        metadata,
        { ...request.state, resultId },
        true,
      );
      expect(
        client.getQueryData(sceneQueryKey(selection, metadata.version)),
      ).toEqual(scene("geometry"));
    }
    expect(post).toHaveBeenCalledTimes(4);
    expect(preloadSceneAssets).toHaveBeenCalledTimes(4);
    expect(report).toHaveBeenLastCalledWith(6, 6);
  });

  it("keeps ROI selections isolated when preparing a different region", async () => {
    const original = options();
    const first = await preparePredictionViews(original);
    const second = await preparePredictionViews({
      ...options(),
      state: { ...original.state, roi: undefined },
    });
    expect(second.wind!.request).not.toEqual(first.wind!.request);
    expect(second.iso!.request).not.toEqual(first.iso!.request);
    expect(post).toHaveBeenCalledTimes(4);
    expect(loadPreparedPlayback).toHaveBeenCalledTimes(2);
  });

  it("isolates immutable scenes when the same result identifiers gain new versions", async () => {
    const first = await preparePredictionViews(options());
    const nextDataset = { ...concentration, version: "plume-v2" };
    const nextWind = { ...wind, version: "wind-v2" };
    client.setQueryData(
      ["dataset", concentration.id, "predicted-wind"],
      nextWind,
    );
    vi.mocked(post).mockImplementation(async (_path, body) => {
      const mode = (body as { mode: string }).mode;
      return { ...scene(mode), contextKey: `updated-${mode}` };
    });
    const second = await preparePredictionViews(options(nextDataset));
    expect(second.wind!.request).toEqual(first.wind!.request);
    expect(second.iso!.request).toEqual(first.iso!.request);
    expect(post).toHaveBeenCalledTimes(4);
    for (const [previous, updated, previousVersion, nextVersion] of [
      [first.wind!, second.wind!, wind.version, nextWind.version],
      [first.iso!, second.iso!, concentration.version, nextDataset.version],
    ] as const) {
      expect(
        client.getQueryData(sceneQueryKey(previous.request, previousVersion)),
      ).toEqual(previous.scene);
      expect(
        client.getQueryData(sceneQueryKey(updated.request, nextVersion)),
      ).toEqual(updated.scene);
      expect(updated.scene.contextKey).toBe(`updated-${updated.request.mode}`);
    }
  });

  it("rejects unrelated or unusable wind metadata before requesting its scene", async () => {
    for (const value of [
      { ...wind, id: "case:other" },
      { ...wind, fields: [{ id: "speed" }] },
    ]) {
      client.clear();
      vi.mocked(post).mockClear();
      vi.mocked(api).mockResolvedValue(value);
      await expect(preparePredictionViews(options())).rejects.toThrow(
        /Display wind/,
      );
      expect(
        client.getQueryData(["dataset", concentration.id, "predicted-wind"]),
      ).toBeUndefined();
      expect(
        vi
          .mocked(post)
          .mock.calls.every(
            ([, body]) => (body as { mode: string }).mode !== "streamlines",
          ),
      ).toBe(true);
    }
  });

  it("cancels immediately and prevents late wind metadata or scene publication", async () => {
    const metadata = deferred<Dataset>();
    const lateScene = deferred<Scene>();
    const playback = deferred<PreparedPlaybackClip>();
    vi.mocked(api).mockReturnValue(metadata.promise);
    vi.mocked(post).mockReturnValue(lateScene.promise);
    vi.mocked(loadPreparedPlayback).mockReturnValue(playback.promise);
    const controller = new AbortController();
    const report = vi.fn();
    const pending = preparePredictionViews({
      ...options(),
      signal: controller.signal,
      onProgress: report,
    });
    await flush();
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    const reports = report.mock.calls.length;
    metadata.resolve(wind);
    lateScene.resolve(scene("iso"));
    playback.resolve(clip());
    await flush();
    expect(
      client.getQueryData(["dataset", concentration.id, "predicted-wind"]),
    ).toBeUndefined();
    expect(
      client
        .getQueryCache()
        .findAll({ queryKey: ["scene"] })
        .every((query) => query.state.data === undefined),
    ).toBe(true);
    expect(report).toHaveBeenCalledTimes(reports);
  });

  it("rejects late asset success after cancellation without publishing its scene", async () => {
    const assets = deferred<void>();
    vi.mocked(preloadSceneAssets).mockReturnValue(assets.promise);
    const controller = new AbortController();
    const pending = preparePredictionViews({
      ...options(),
      signal: controller.signal,
    });
    await flush();
    expect(preloadSceneAssets).toHaveBeenCalled();
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    assets.resolve();
    await flush();
    expect(
      client
        .getQueryCache()
        .findAll({ queryKey: ["scene"] })
        .every((query) => query.state.data === undefined),
    ).toBe(true);
  });

  it("cancels sibling preparation when one asset cannot be parsed", async () => {
    const playback = deferred<PreparedPlaybackClip>();
    vi.mocked(loadPreparedPlayback).mockReturnValue(playback.promise);
    vi.mocked(preloadSceneAssets).mockRejectedValue(
      new Error("Invalid display asset."),
    );
    const pending = preparePredictionViews(options());
    await expect(pending).rejects.toThrow("Invalid display asset.");
    expect(
      vi.mocked(loadPreparedPlayback).mock.calls[0][0].signal.aborted,
    ).toBe(true);
    playback.resolve(clip());
    await flush();
    expect(
      client
        .getQueryCache()
        .findAll({ queryKey: ["scene"] })
        .every((query) => query.state.data === undefined),
    ).toBe(true);
  });

  it("does not start work for an already cancelled prediction", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      preparePredictionViews({ ...options(), signal: controller.signal }),
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(api).not.toHaveBeenCalled();
    expect(post).not.toHaveBeenCalled();
    expect(loadPreparedPlayback).not.toHaveBeenCalled();
  });
});

describe("saved emission prediction views", () => {
  const saved: Dataset = {
    ...concentration,
    provenance: { ...concentration.provenance, source: [13.82, 40.63, 5.52] },
  };
  it("prepares a single shared concentration clip for all modes without citywide stream or single-frame iso requests", async () => {
    const paths = {
      kind: "particle-paths" as const,
      positions: new Float32Array([0, 0, 0, 1, 0, 0]),
      times: new Float32Array([0, 1]),
      particleIds: new Uint32Array([0]),
      count: 1,
      source: [13.82, 40.63, 5.52] as [number, number, number],
      bytes: 24,
    };
    vi.mocked(prepareEmissionStreamlines).mockResolvedValue(paths);
    vi.mocked(loadPreparedPlayback).mockImplementation(async (selection) => {
      selection.onProgress?.(2, 2);
      return { ...clip(), key: selection.key };
    });
    const report = vi.fn();
    const before = structuredClone(saved);
    const result = await preparePredictionViews({
      ...options(saved),
      onProgress: report,
    });
    expect(loadPreparedPlayback).toHaveBeenCalledOnce();
    expect(prepareEmissionStreamlines).toHaveBeenCalledWith(
      saved,
      result.playback,
      expect.any(AbortSignal),
      client,
      undefined,
      expect.any(Function),
    );
    expect(result.playback?.streamlines).toBe(paths);
    expect(result.playback?.bytes).toBe(24);
    expect(result.wind).toBeUndefined();
    expect(result.iso).toBeUndefined();
    expect(post).not.toHaveBeenCalled();
    expect(report).toHaveBeenLastCalledWith(6, 6);
    expect(saved).toEqual(before);
  });
  it("advances fractional frame preparation and all four trajectory preparation units before completion", async () => {
    const paths = {
      kind: "particle-paths" as const,
      positions: new Float32Array([0, 0, 0, 1, 0, 0]),
      times: new Float32Array([0, 1]),
      particleIds: new Uint32Array([0]),
      count: 1,
      source: [13.82, 40.63, 5.52] as [number, number, number],
      bytes: 24,
    };
    vi.mocked(loadPreparedPlayback).mockImplementation(async (selection) => {
      selection.onProgress?.(0.25, 2);
      selection.onProgress?.(1.5, 2);
      selection.onProgress?.(2, 2);
      return { ...clip(), key: selection.key };
    });
    vi.mocked(prepareEmissionStreamlines).mockImplementation(
      async (_dataset, _clip, _signal, _client, _wind, report) => {
        for (const completed of [0, 0.5, 1, 2, 3, 4]) report?.(completed, 4);
        return paths;
      },
    );
    const report = vi.fn();
    await preparePredictionViews({ ...options(saved), onProgress: report });
    expect(report.mock.calls).toContainEqual([0.25, 6]);
    expect(report.mock.calls).toContainEqual([1.5, 6]);
    expect(report.mock.calls).toContainEqual([
      2,
      6,
      { label: "입자 이동 경로 검증 중", indeterminate: true },
    ]);
    expect(report.mock.calls).toContainEqual([
      2.5,
      6,
      { label: "입자 이동 경로 준비 중", indeterminate: false },
    ]);
    expect(report.mock.calls).toContainEqual([
      3,
      6,
      { label: "입자 이동 경로 준비 중", indeterminate: false },
    ]);
    expect(report.mock.calls).toContainEqual([
      4,
      6,
      { label: "입자 이동 경로 준비 중", indeterminate: false },
    ]);
    expect(report.mock.calls).toContainEqual([
      5,
      6,
      { label: "입자 이동 경로 준비 중", indeterminate: false },
    ]);
    expect(report).toHaveBeenLastCalledWith(6, 6);
    const measured = report.mock.calls
      .filter(([, total]) => total === 6)
      .map(([completed]) => completed);
    expect(
      measured.every(
        (value, index) => index === 0 || value >= measured[index - 1],
      ),
    ).toBe(true);
  });

  it("retains a ready concentration clip and mode-specific error if particle path preparation fails", async () => {
    vi.mocked(prepareEmissionStreamlines).mockRejectedValue(
      new Error("Source wind unavailable."),
    );
    const result = await preparePredictionViews(options(saved));
    expect(result.playback?.streamlineError).toBe("Source wind unavailable.");
    expect(result.playback?.range).toEqual([0, 60]);
    expect(post).not.toHaveBeenCalled();
  });
});

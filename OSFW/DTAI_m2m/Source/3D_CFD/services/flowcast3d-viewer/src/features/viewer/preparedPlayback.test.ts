import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { post } from "../../lib/api";
import { boundedAsset } from "./decode";
import { loadPreparedPlayback } from "./preparedPlayback";
import type { Scene } from "./types";

vi.mock("../../lib/api", () => ({ post: vi.fn() }));
vi.mock("./decode", () => ({ boundedAsset: vi.fn() }));
const prefix = "/app-api/assets/";
function scene(index: number): Scene {
  return {
    contextKey: `frame-${index}`,
    origin: [1000, 2000, 10],
    bounds: [
      [1000, 2000, 10],
      [1004, 2003, 14],
    ],
    field: { id: "concentration", unit: "µg/m3" },
    time: index,
    range: [-index, index + 2],
    assets: [
      { kind: "geometry", format: "glb", url: `${prefix}city.glb` },
      {
        kind: "volume",
        format: "float32",
        url: `${prefix}volume-${index}.bin`,
        dimensions: [2, 1, 1],
        origin: [0, 0, 0],
        spacing: [2, 3, 4],
        maskUrl: `${prefix}mask-${index}.bin`,
      },
    ],
  };
}
function options(
  changes: Partial<Parameters<typeof loadPreparedPlayback>[0]> = {},
) {
  return {
    key: "city-concentration",
    request: {
      datasetId: "case:city",
      resultId: "derived",
      fieldId: "concentration",
      mode: "volume",
    },
    times: [0, 0.001, 0.002],
    signal: new AbortController().signal,
    ...changes,
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
  for (let i = 0; i < 20; i++) await Promise.resolve();
}

beforeEach(() => {
  vi.mocked(post).mockReset();
  vi.mocked(boundedAsset).mockReset();
  vi.mocked(post).mockImplementation(async (_path, request) =>
    scene((request as { frame: number }).frame),
  );
  vi.mocked(boundedAsset).mockImplementation(async (url) =>
    url.includes("mask-")
      ? new Uint8Array([1, 0]).buffer
      : new Float32Array([0.25, Number(url.match(/volume-(\d+)/)?.[1]) + 1])
          .buffer,
  );
});
afterEach(() => vi.useRealTimers());

describe("prepared volume clip", () => {
  it("keeps source indices and seconds, shares one mask, combines ranges and preserves raw values", async () => {
    const raw = new Float32Array([0.25, 8.5]);
    vi.mocked(boundedAsset).mockImplementation(async (url) =>
      url.includes("mask-")
        ? new Uint8Array([1, 0]).buffer
        : raw.buffer.slice(0),
    );
    const report = vi.fn();
    const request = options({ firstFrame: 1, onProgress: report });
    const clip = await loadPreparedPlayback(request);
    expect(clip.key).toBe(request.key);
    expect(clip.frames.map((frame) => frame.index)).toEqual([1, 2]);
    expect(clip.times).toEqual([0.001, 0.002]);
    expect(clip.range).toEqual([-2, 4]);
    expect(clip.bytes).toBe(18);
    expect(clip.frames[0].mask).toBe(clip.frames[1].mask);
    expect([...clip.frames[0].values]).toEqual([0.25, 8.5]);
    expect([...raw]).toEqual([0.25, 8.5]);
    expect(report).toHaveBeenNthCalledWith(1, 0, 2);
    expect(report).toHaveBeenLastCalledWith(2, 2);
    expect(
      vi
        .mocked(post)
        .mock.calls.every(
          ([path, body]) =>
            path === "/scene" &&
            (body as { maxCells: number }).maxCells === 100000,
        ),
    ).toBe(true);
    expect(
      vi
        .mocked(boundedAsset)
        .mock.calls.some(([url]) => url.includes("city.glb")),
    ).toBe(false);
    expect(request.request).not.toHaveProperty("frame");
  });

  it("uses an explicit common color range without changing field values", async () => {
    const clip = await loadPreparedPlayback(
      options({ request: { colorRange: [0, 100] } }),
    );
    expect(clip.range).toEqual([0, 100]);
    expect([...clip.frames[2].values]).toEqual([0.25, 3]);
  });

  it.each([
    { request: { maxCells: 262144 }, expected: 262144 },
    { request: { maxCells: 65536 }, maxCells: 131072, expected: 131072 },
  ])(
    "honors the selected display density without mutating requests",
    async ({ expected, ...selection }) => {
      const settings = options(selection);
      const before = structuredClone(settings.request);
      await loadPreparedPlayback(settings);
      expect(
        vi
          .mocked(post)
          .mock.calls.every(
            ([, request]) =>
              (request as { maxCells: number }).maxCells === expected,
          ),
      ).toBe(true);
      expect(settings.request).toEqual(before);
    },
  );

  it.each([63, 262145, 64.5, Number.NaN, "262144"])(
    "rejects invalid request maxCells %s before fetching",
    async (maxCells) => {
      await expect(
        loadPreparedPlayback(options({ request: { maxCells } })),
      ).rejects.toThrow(/maxCells/);
      expect(post).not.toHaveBeenCalled();
    },
  );

  it("reports fractional progress while the first volume is still downloading", async () => {
    const download = deferred<ArrayBuffer>();
    const progress = vi.fn();
    let received: ((received: number, total?: number) => void) | undefined;
    vi.mocked(boundedAsset).mockImplementation(
      async (url, _signal, _budget, onProgress) => {
        if (url.includes("mask-")) return new Uint8Array([1, 0]).buffer;
        received = onProgress;
        onProgress?.(0, 8);
        return download.promise;
      },
    );
    const prepared = loadPreparedPlayback(
      options({ times: [0], onProgress: progress }),
    );
    await flush();
    const beforeChunk = progress.mock.calls.at(-1)![0] as number;
    expect(beforeChunk).toBeGreaterThan(0);
    expect(beforeChunk).toBeLessThan(1);
    received?.(4, 8);
    const duringChunk = progress.mock.calls.at(-1)![0] as number;
    expect(duringChunk).toBeGreaterThan(beforeChunk);
    expect(duringChunk).toBeLessThan(1);
    download.resolve(new Float32Array([0.25, 1]).buffer);
    await prepared;
    expect(progress).toHaveBeenLastCalledWith(1, 1);
    const values = progress.mock.calls.map(([completed]) => completed);
    expect(
      values.every(
        (value, index) =>
          value >= 0 &&
          value <= 1 &&
          (index === 0 || value >= values[index - 1]),
      ),
    ).toBe(true);
  });

  it("ignores late byte-progress callbacks from a cancelled generation", async () => {
    const controller = new AbortController();
    const progress = vi.fn();
    let received: ((received: number, total?: number) => void) | undefined;
    vi.mocked(boundedAsset).mockImplementation(
      (_url, _signal, _budget, onProgress) => {
        received = onProgress;
        return new Promise(() => {});
      },
    );
    const prepared = loadPreparedPlayback(
      options({
        times: [0],
        signal: controller.signal,
        onProgress: progress,
      }),
    );
    const rejected = expect(prepared).rejects.toMatchObject({
      name: "AbortError",
    });
    await flush();
    controller.abort();
    await rejected;
    const calls = progress.mock.calls.length;
    received?.(8, 8);
    await flush();
    expect(progress).toHaveBeenCalledTimes(calls);
  });

  it("prepares at most two frames concurrently and retains source order", async () => {
    const pending = Array.from({ length: 3 }, () => deferred<Scene>());
    let active = 0,
      maximum = 0;
    vi.mocked(post).mockImplementation((_path, body) => {
      active++;
      maximum = Math.max(maximum, active);
      return pending[(body as { frame: number }).frame].promise.finally(() => {
        active--;
      }) as ReturnType<typeof post>;
    });
    const result = loadPreparedPlayback(options());
    await flush();
    expect(post).toHaveBeenCalledTimes(2);
    pending[1].resolve(scene(1));
    await flush();
    expect(post).toHaveBeenCalledTimes(3);
    pending[2].resolve(scene(2));
    pending[0].resolve(scene(0));
    expect((await result).frames.map((frame) => frame.index)).toEqual([
      0, 1, 2,
    ]);
    expect(maximum).toBe(2);
  });

  it("does not start requests for an already cancelled generation", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      loadPreparedPlayback(options({ signal: controller.signal })),
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(post).not.toHaveBeenCalled();
  });

  it("cancels pending initialization without waiting for a late response or reporting stale progress", async () => {
    vi.useFakeTimers();
    const pending = deferred<Scene>(),
      controller = new AbortController(),
      report = vi.fn();
    vi.mocked(post).mockImplementation(
      () => pending.promise as ReturnType<typeof post>,
    );
    const result = loadPreparedPlayback(
      options({ signal: controller.signal, onProgress: report }),
    );
    const rejected = expect(result).rejects.toMatchObject({
      name: "AbortError",
    });
    controller.abort();
    await rejected;
    expect(
      vi.mocked(post).mock.calls.every(([, , signal]) => signal?.aborted),
    ).toBe(true);
    pending.resolve(scene(0));
    await flush();
    expect(boundedAsset).not.toHaveBeenCalled();
    expect(report).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each(["scene request", "asset download"])(
    "limits each %s to 30 seconds and clears its timers",
    async (phase) => {
      vi.useFakeTimers();
      const pending = new Promise<never>(() => {});
      if (phase === "scene request")
        vi.mocked(post).mockImplementation(() => pending);
      else vi.mocked(boundedAsset).mockImplementation(() => pending);
      const result = loadPreparedPlayback(options({ times: [0] }));
      const rejected = expect(result).rejects.toThrow(`${phase} timed out`);
      await flush();
      await vi.advanceTimersByTimeAsync(30_000);
      await rejected;
      expect(vi.getTimerCount()).toBe(0);
    },
  );

  it("rejects a projected clip over 256 MiB before downloading its arrays", async () => {
    vi.mocked(post).mockImplementation(async (_path, body) => {
      const result = scene((body as { frame: number }).frame);
      result.assets[1].dimensions = [128, 128, 64];
      return result;
    });
    await expect(
      loadPreparedPlayback(
        options({ times: Array.from({ length: 100 }, (_, index) => index) }),
      ),
    ).rejects.toThrow("256 MiB");
    expect(boundedAsset).not.toHaveBeenCalled();
  });

  it.each(["dimensions", "origin", "spacing", "sceneOrigin"])(
    "rejects changing %s instead of interpolating mismatched grids",
    async (property) => {
      vi.mocked(post).mockImplementation(async (_path, body) => {
        const index = (body as { frame: number }).frame,
          result = scene(index);
        if (index === 1) {
          if (property === "sceneOrigin") result.origin = [2000, 2000, 10];
          else if (property === "dimensions")
            result.assets[1].dimensions = [1, 2, 1];
          else if (property === "origin") result.assets[1].origin = [1, 0, 0];
          else result.assets[1].spacing = [1, 3, 4];
        }
        return result;
      });
      await expect(loadPreparedPlayback(options())).rejects.toThrow(
        "grids differ",
      );
    },
  );

  it("rejects differing masks rather than blending through changed solids", async () => {
    vi.mocked(boundedAsset).mockImplementation(async (url) =>
      url.includes("mask-")
        ? new Uint8Array(url.includes("mask-1") ? [0, 1] : [1, 0]).buffer
        : new Float32Array([0, 1]).buffer,
    );
    await expect(loadPreparedPlayback(options())).rejects.toThrow(
      "fluid masks differ",
    );
  });

  it.each(["bytes", "non-finite"])(
    "aborts sibling requests after invalid volume %s",
    async (failure) => {
      const pending = deferred<Scene>();
      vi.mocked(post).mockImplementation(
        (_path, body) =>
          ((body as { frame: number }).frame === 0
            ? Promise.resolve(scene(0))
            : pending.promise) as ReturnType<typeof post>,
      );
      vi.mocked(boundedAsset).mockResolvedValue(
        failure === "bytes"
          ? new ArrayBuffer(7)
          : new Float32Array([NaN, 1]).buffer,
      );
      await expect(loadPreparedPlayback(options())).rejects.toThrow(
        failure === "bytes" ? "byte size" : "non-finite",
      );
      expect(vi.mocked(post).mock.calls[1][2]?.aborted).toBe(true);
    },
  );

  it.each([[0, 0], [0, NaN], Array.from({ length: 362 }, (_, index) => index)])(
    "rejects invalid times or frame count before fetching",
    async (...times) => {
      await expect(
        loadPreparedPlayback(options({ times: times as number[] })),
      ).rejects.toThrow(/times|361 frames/);
      expect(post).not.toHaveBeenCalled();
    },
  );
});

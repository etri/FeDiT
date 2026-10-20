import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { post } from "../../lib/api";
import type { Dataset } from "../datasets/types";
import { boundedAsset } from "./decode";
import type { PreparedPlaybackClip } from "./preparedPlayback";
import { prepareEmissionStreamlines } from "./preparedEmission";

const { webcrypto } = await vi.importActual<{ webcrypto: Crypto }>(
  "node:crypto",
);

vi.mock("../../lib/api", () => ({ post: vi.fn() }));
vi.mock("./decode", () => ({ boundedAsset: vi.fn() }));

function dataset(): Dataset {
  return {
    id: "case:harbor",
    fields: [{ id: "concentration", unit: "µg/m3" }],
    times: [0, 1, 2],
    timeUnit: "s",
    provenance: {
      sourceDatasetId: "case:harbor",
      sourceResultId: "prediction/saved",
      sourceVersion: "wind-v1",
      source: [10.5, 20.5, 30.5],
      methodVersion: "physics-v1",
      seed: 0,
    },
  };
}
function clip(): PreparedPlaybackClip {
  return {
    key: JSON.stringify({
      request: {
        datasetId: "case:harbor",
        resultId: "concentration/saved",
        fieldId: "concentration",
        mode: "volume",
        roi: [
          [10, 20, 30],
          [12, 22, 32],
        ],
      },
    }),
    frames: [0, 1, 2].map((index) => ({
      index,
      scene: {
        contextKey: `${index}`,
        origin: [10, 20, 30],
        bounds: [
          [10, 20, 30],
          [20, 30, 40],
        ],
        assets: [],
      },
      asset: {
        kind: "volume",
        format: "float32",
        url: "/app-api/assets/field.bin",
        dimensions: [2, 2, 2],
        origin: [0, 0, 0],
        spacing: [1, 1, 1],
      },
      values: new Float32Array(8).fill(1),
      mask: new Uint8Array(8).fill(1),
    })),
    times: [0, 1, 2],
    range: [0, 100],
    bytes: 104,
  };
}
const signal = () => new AbortController().signal;
const originalRows = [
  10.5, 20.5, 30.5, 0, 11, 21, 31, 1, 7, 11, 21, 31, 1, 12, 22, 32, 2, 7,
];
async function response(rows = originalRows) {
  const buffer = new Float32Array(rows).buffer;
  const hash = Array.from(
    new Uint8Array(await webcrypto.subtle.digest("SHA-256", buffer)),
    (value) => value.toString(16).padStart(2, "0"),
  ).join("");
  const value = {
    contextKey: "paths",
    origin: [10, 20, 30],
    bounds: [
      [10, 20, 30],
      [20, 30, 40],
    ],
    field: { id: "concentration", unit: "µg/m3" },
    time: 2,
    assets: [
      {
        kind: "trajectories",
        format: "float32-xyz-t-xyz-t-id/1",
        stride: 9,
        count: rows.length / 9,
        byteLength: buffer.byteLength,
        sha256: hash,
        url: `/app-api/assets/${hash}.bin`,
      },
    ],
    particlePaths: {
      schema: "flowcast.particle-paths/1",
      datasetId: "case:harbor",
      resultId: "concentration/saved",
      ...dataset().provenance,
      times: [0, 1, 2],
      verified: true,
      verification: "all-concentration-frames-equal",
      timestampInterpretation: "Integration substep endpoints",
    },
  };
  vi.mocked(post).mockResolvedValue(value);
  vi.mocked(boundedAsset).mockImplementation(
    async (_, __, budget, progress) => {
      expect(buffer.byteLength).toBeLessThanOrEqual(budget!);
      progress?.(0, buffer.byteLength);
      progress?.(buffer.byteLength / 2, buffer.byteLength);
      progress?.(buffer.byteLength, buffer.byteLength);
      return buffer;
    },
  );
  return { value, buffer };
}
beforeEach(async () => {
  vi.stubGlobal("crypto", webcrypto);
  await response();
});
afterEach(() => {
  vi.resetAllMocks();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("verified emission particle paths", () => {
  it("loads the exact saved concentration selection and normalizes world coordinates without modifying the result", async () => {
    const saved = dataset(),
      prepared = clip();
    const before = structuredClone(saved);
    const paths = await prepareEmissionStreamlines(saved, prepared, signal());
    expect(post).toHaveBeenCalledOnce();
    expect(post).toHaveBeenCalledWith(
      "/scene",
      {
        ...JSON.parse(prepared.key).request,
        mode: "streamlines",
        frame: 2,
        maxCells: 262144,
      },
      expect.any(AbortSignal),
    );
    expect(paths).toMatchObject({
      kind: "particle-paths",
      count: 2,
      source: [10.5, 20.5, 30.5],
      bytes: 2 * (36 + 312),
    });
    expect(paths!.positions).toEqual(
      new Float32Array([
        0.25, 0.25, 0.25, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1, 1, 1,
      ]),
    );
    expect(paths!.times).toEqual(new Float32Array([0, 1, 1, 2]));
    expect(paths!.particleIds).toEqual(new Uint32Array([7, 7]));
    expect(saved).toEqual(before);
    expect(prepared.frames[0].values).toEqual(new Float32Array(8).fill(1));
  });
  it("reports measurable download bytes and final validation after an unknown scene preparation stage", async () => {
    const progress = vi.fn();
    await prepareEmissionStreamlines(
      dataset(),
      clip(),
      signal(),
      undefined,
      undefined,
      progress,
    );
    expect(progress.mock.calls).toEqual([
      [0, 4],
      [1, 4],
      [1, 4],
      [2, 4],
      [3, 4],
      [4, 4],
    ]);
  });
  it("preserves original seconds when metadata uses milliseconds and the clip starts later", async () => {
    const saved = dataset();
    saved.timeUnit = "ms";
    saved.times = [0, 1000, 2000];
    const prepared = clip();
    prepared.frames.shift();
    prepared.times.shift();
    const { value } = await response();
    value.time = 2000;
    const paths = await prepareEmissionStreamlines(saved, prepared, signal());
    expect(paths!.times).toEqual(new Float32Array([0, 1, 1, 2]));
  });
  it("allows null source results and instantaneous emission initialization links", async () => {
    const saved = dataset();
    saved.provenance!.sourceResultId = null;
    const { value } = await response([
      10.5, 20.5, 30.5, 1, 10.6, 20.6, 30.6, 1, 0,
    ]);
    (value.particlePaths as Record<string, unknown>).sourceResultId = null;
    expect(
      (await prepareEmissionStreamlines(saved, clip(), signal()))!.times,
    ).toEqual(new Float32Array([1, 1]));
  });
  it("clips actual segment intersections to an ROI and interpolates only the clipped time endpoints", async () => {
    const { value } = await response([9, 21, 31, 0, 13, 21, 31, 2, 1]);
    value.bounds[0][0] = 0;
    const result = await prepareEmissionStreamlines(
      dataset(),
      clip(),
      signal(),
    );
    expect(result!.positions).toEqual(
      new Float32Array([0, 0.5, 0.5, 1, 0.5, 0.5]),
    );
    expect(result!.times).toEqual(new Float32Array([0.5, 1.5]));
  });
  it("accepts a native grid ROI and rejects a coarsened or misaligned concentration mask before requesting paths", async () => {
    const saved = dataset();
    saved.provenance!.grid = {
      origin: [0, 0, 0],
      spacing: [1, 1, 1],
      shape: [30, 40, 50],
    };
    expect(
      (await prepareEmissionStreamlines(saved, clip(), signal()))!.count,
    ).toBe(2);
    vi.mocked(post).mockClear();
    const coarse = clip();
    coarse.frames[0].asset.spacing = [2, 2, 2];
    await expect(
      prepareEmissionStreamlines(saved, coarse, signal()),
    ).rejects.toThrow(/original concentration grid/);
    const misaligned = clip();
    misaligned.frames[0].asset.origin = [0.1, 0, 0];
    await expect(
      prepareEmissionStreamlines(saved, misaligned, signal()),
    ).rejects.toThrow(/cell-aligned native ROI/);
    expect(post).not.toHaveBeenCalled();
  });
  it("does not fall back to a velocity streamline when replay metadata is unavailable", async () => {
    vi.mocked(post).mockResolvedValue({
      contextKey: "old",
      origin: [0, 0, 0],
      bounds: [
        [0, 0, 0],
        [1, 1, 1],
      ],
      assets: [],
    });
    await expect(
      prepareEmissionStreamlines(dataset(), clip(), signal()),
    ).rejects.toThrow(/verification does not match/);
    expect(boundedAsset).not.toHaveBeenCalled();
  });
  it("leaves unrelated non-derived results available without loading paths", async () => {
    const saved = dataset();
    delete saved.provenance;
    expect(
      await prepareEmissionStreamlines(saved, clip(), signal()),
    ).toBeUndefined();
    expect(post).not.toHaveBeenCalled();
  });
  it.each([
    "source",
    "sourceDatasetId",
    "sourceResultId",
    "sourceVersion",
    "methodVersion",
    "seed",
    "times",
    "datasetId",
    "resultId",
  ])("rejects a mismatched %s before accessing the asset", async (key) => {
    const { value } = await response();
    const metadata = value.particlePaths as Record<string, unknown>;
    metadata[key] =
      key === "seed"
        ? 99
        : key === "times"
          ? [0, 1, 3]
          : key === "source"
            ? [1, 2, 3]
            : "different";
    await expect(
      prepareEmissionStreamlines(dataset(), clip(), signal()),
    ).rejects.toThrow();
    expect(boundedAsset).not.toHaveBeenCalled();
  });
  it.each(["verified", "verification", "schema"])(
    "rejects missing or invalid replay proof %s",
    async (key) => {
      const { value } = await response();
      delete (value.particlePaths as Record<string, unknown>)[key];
      await expect(
        prepareEmissionStreamlines(dataset(), clip(), signal()),
      ).rejects.toThrow();
      expect(boundedAsset).not.toHaveBeenCalled();
    },
  );
  it.each(["methodVersion", "sourceVersion", "seed"])(
    "rejects incomplete saved provenance %s without making a request",
    async (key) => {
      const saved = dataset();
      delete saved.provenance![key];
      await expect(
        prepareEmissionStreamlines(saved, clip(), signal()),
      ).rejects.toThrow(/replay provenance/);
      expect(post).not.toHaveBeenCalled();
    },
  );
  it.each([
    [
      "missing result",
      (prepared: PreparedPlaybackClip) => {
        prepared.key = JSON.stringify({
          request: { datasetId: "case:harbor", fieldId: "concentration" },
        });
      },
    ],
    [
      "wrong space",
      (prepared: PreparedPlaybackClip) => {
        prepared.key = JSON.stringify({
          request: {
            datasetId: "other",
            resultId: "x",
            fieldId: "concentration",
          },
        });
      },
    ],
    [
      "wrong timeline",
      (prepared: PreparedPlaybackClip) => {
        prepared.times[1] = 0.5;
      },
    ],
  ] as const)("rejects %s before making a request", async (_, change) => {
    const prepared = clip();
    change(prepared);
    await expect(
      prepareEmissionStreamlines(dataset(), prepared, signal()),
    ).rejects.toThrow();
    expect(post).not.toHaveBeenCalled();
  });
  it.each(["format", "stride", "count", "byteLength", "sha256"])(
    "rejects malformed asset %s before downloading",
    async (key) => {
      const { value } = await response();
      (value.assets[0] as Record<string, unknown>)[key] =
        key === "count"
          ? 200001
          : key === "stride"
            ? 8
            : key === "byteLength"
              ? 1
              : "invalid";
      await expect(
        prepareEmissionStreamlines(dataset(), clip(), signal()),
      ).rejects.toThrow();
      expect(boundedAsset).not.toHaveBeenCalled();
    },
  );
  it("rejects a corrupt asset hash instead of rendering unverified paths", async () => {
    const { buffer } = await response();
    new Float32Array(buffer)[0] += 1;
    await expect(
      prepareEmissionStreamlines(dataset(), clip(), signal()),
    ).rejects.toThrow(/SHA-256/);
  });
  it.each([
    ["non-finite position", [NaN, 20.5, 30.5, 0, 11, 21, 31, 1, 7]],
    ["reverse time", [10.5, 20.5, 30.5, 2, 11, 21, 31, 1, 7]],
    ["future time", [10.5, 20.5, 30.5, 0, 11, 21, 31, 3, 7]],
    ["fractional ID", [10.5, 20.5, 30.5, 0, 11, 21, 31, 1, 7.5]],
    ["oversized ID", [10.5, 20.5, 30.5, 0, 11, 21, 31, 1, 2 ** 25]],
    ["outside scene", [10.5, 20.5, 30.5, 0, 100, 21, 31, 1, 7]],
    [
      "disconnected path",
      [...originalRows.slice(0, 9), 11.5, 21, 31, 1, 12, 22, 32, 2, 7],
    ],
    [
      "per-particle time overlap",
      [...originalRows, ...originalRows.slice(0, 9)],
    ],
  ] as const)("rejects decoded %s", async (_, rows) => {
    await response([...rows]);
    await expect(
      prepareEmissionStreamlines(dataset(), clip(), signal()),
    ).rejects.toThrow();
  });
  it("accounts for the decoded data, download copies, and future ribbon buffers before fetching", async () => {
    const prepared = clip();
    prepared.bytes = 256 * 1024 * 1024 - 800;
    await expect(
      prepareEmissionStreamlines(dataset(), prepared, signal()),
    ).rejects.toThrow(/CPU asset budget/);
    expect(boundedAsset).not.toHaveBeenCalled();
  });
  it("cancels pending scene preparation even if the request does not settle", async () => {
    vi.mocked(post).mockImplementation(() => new Promise(() => {}));
    const controller = new AbortController();
    const pending = prepareEmissionStreamlines(
      dataset(),
      clip(),
      controller.signal,
    );
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    expect((vi.mocked(post).mock.calls[0][2] as AbortSignal).aborted).toBe(
      true,
    );
  });
  it("times out unknown replay preparation without waiting indefinitely", async () => {
    vi.useFakeTimers();
    vi.mocked(post).mockImplementation(() => new Promise(() => {}));
    const pending = prepareEmissionStreamlines(dataset(), clip(), signal());
    const failure = expect(pending).rejects.toThrow(/scene request timed out/);
    await vi.advanceTimersByTimeAsync(180000);
    await failure;
    expect(boundedAsset).not.toHaveBeenCalled();
  });
  it("rejects late downloads after cancellation before decoding or progress completion", async () => {
    let finish!: (buffer: ArrayBuffer) => void;
    vi.mocked(boundedAsset).mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const controller = new AbortController();
    const progress = vi.fn();
    const pending = prepareEmissionStreamlines(
      dataset(),
      clip(),
      controller.signal,
      undefined,
      undefined,
      progress,
    );
    await vi.waitFor(() => expect(boundedAsset).toHaveBeenCalledOnce());
    controller.abort();
    finish(new Float32Array(originalRows).buffer);
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    expect(progress.mock.calls.at(-1)).toEqual([1, 4]);
  });
});

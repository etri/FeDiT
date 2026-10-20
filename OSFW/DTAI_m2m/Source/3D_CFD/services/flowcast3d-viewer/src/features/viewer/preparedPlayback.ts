import { post } from "../../lib/api";
import { boundedAsset } from "./decode";
import { sceneSchema } from "./schema";
import type { Scene, SceneAsset } from "./types";
import type { EmissionParticlePaths } from "./preparedEmission";

export interface PreparedVolumeFrame {
  index: number;
  scene: Scene;
  asset: SceneAsset;
  values: Float32Array;
  mask: Uint8Array;
}
export interface PreparedPlaybackClip {
  key: string;
  frames: PreparedVolumeFrame[];
  times: number[];
  range: [number, number];
  bytes: number;
  streamlines?: EmissionParticlePaths;
  streamlineError?: string;
}
export interface Options {
  key: string;
  request: Record<string, unknown>;
  times: number[];
  firstFrame?: number;
  signal: AbortSignal;
  budgetBytes?: number;
  maxCells?: number;
  onProgress?: (completed: number, total: number) => void;
}
const BUDGET = 256 * 1024 * 1024;
const TIMEOUT = 30_000;
const aborted = () =>
  new DOMException("Playback preparation was cancelled.", "AbortError");

function checkedRange(value: unknown): [number, number] {
  if (
    !Array.isArray(value) ||
    value.length !== 2 ||
    !value.every(Number.isFinite) ||
    value[0] > value[1]
  )
    throw new Error(
      "Playback color range must contain two ordered finite values.",
    );
  return [value[0], value[1]];
}

export async function loadPreparedPlayback({
  key,
  request,
  times,
  firstFrame = 0,
  signal,
  onProgress,
  budgetBytes = BUDGET,
  maxCells: requestedMaxCells,
}: Options): Promise<PreparedPlaybackClip> {
  if (signal.aborted) throw aborted();
  if (!Number.isFinite(budgetBytes) || budgetBytes <= 0)
    throw new Error("Playback memory budget must be positive and finite.");
  const budget = Math.min(BUDGET, budgetBytes);
  const maxCells = requestedMaxCells ?? request.maxCells ?? 100000;
  if (
    typeof maxCells !== "number" ||
    !Number.isInteger(maxCells) ||
    maxCells < 64 ||
    maxCells > 262144
  )
    throw new Error(
      "Playback maxCells must be an integer between 64 and 262144.",
    );
  const sourceTimes = [...times];
  if (
    !sourceTimes.length ||
    !sourceTimes.every(Number.isFinite) ||
    sourceTimes.some(
      (time, index) => index > 0 && time <= sourceTimes[index - 1],
    )
  )
    throw new Error("Playback times must be finite and strictly increasing.");
  if (
    !Number.isInteger(firstFrame) ||
    firstFrame < 0 ||
    firstFrame >= sourceTimes.length ||
    sourceTimes.length - firstFrame > 361
  )
    throw new Error("Playback preparation requires between 1 and 361 frames.");
  const selection = structuredClone(request);
  const explicitRange =
    selection.colorRange === undefined
      ? undefined
      : checkedRange(selection.colorRange);
  const controller = new AbortController();
  const stop = () => controller.abort(aborted());
  signal.addEventListener("abort", stop, { once: true });
  const total = sourceTimes.length - firstFrame;
  const frames = new Array<PreparedVolumeFrame>(total);
  let sharedMask: Uint8Array | undefined, grid: string | undefined;
  let bytes = 0,
    cursor = 0;
  const progress = new Array<number>(total).fill(0);
  const report = (slot: number, fraction: number) => {
    if (controller.signal.aborted) return;
    progress[slot] = Math.max(progress[slot], Math.min(1, fraction));
    onProgress?.(
      progress.reduce((sum, value) => sum + value, 0),
      total,
    );
  };
  let range: [number, number] = [Infinity, -Infinity];
  let workers: Promise<void>[] = [];
  const alive = () => {
    if (controller.signal.aborted) throw controller.signal.reason ?? aborted();
  };
  const reserve = (size: number) => {
    if (bytes + size > budget)
      throw new Error("Playback CPU asset budget exceeded (256 MiB).");
    bytes += size;
  };

  // 각 요청의 취소와 제한 시간은 외부 응답 완료와 별개로 처리
  const timed = async <T>(
    label: string,
    operation: (signal: AbortSignal) => Promise<T>,
  ): Promise<T> => {
    alive();
    const child = new AbortController();
    let reject!: (reason: unknown) => void;
    const interrupted = new Promise<never>((_, fail) => {
      reject = fail;
    });
    const cancel = () => {
      child.abort();
      reject(controller.signal.reason ?? aborted());
    };
    controller.signal.addEventListener("abort", cancel, { once: true });
    const timer = setTimeout(() => {
      reject(new Error(`Playback ${label} timed out after 30 seconds.`));
      child.abort();
    }, TIMEOUT);
    try {
      const result = await Promise.race([operation(child.signal), interrupted]);
      alive();
      return result;
    } finally {
      clearTimeout(timer);
      controller.signal.removeEventListener("abort", cancel);
    }
  };
  const download = async (
    url: string,
    expected: number,
    onBytes: (fraction: number) => void,
  ) => {
    // 스트림 조각과 결합 버퍼가 잠시 함께 존재하는 메모리도 예약
    reserve(expected);
    try {
      const buffer = await timed("asset download", (requestSignal) =>
        boundedAsset(url, requestSignal, expected, (received) =>
          onBytes(Math.min(1, received / expected)),
        ),
      );
      if (buffer.byteLength !== expected)
        throw new Error(
          "Playback volume asset byte size does not match its grid.",
        );
      return buffer;
    } finally {
      bytes -= expected;
    }
  };
  const prepare = async (slot: number) => {
    const index = firstFrame + slot;
    const scene = sceneSchema.parse(
      await timed("scene request", (requestSignal) =>
        post<unknown>(
          "/scene",
          { ...selection, frame: index, maxCells },
          requestSignal,
        ),
      ),
    );
    report(slot, 0.1);
    const volumes = scene.assets.filter((asset) => asset.kind === "volume");
    if (volumes.length !== 1 || volumes[0].format !== "float32")
      throw new Error(
        `Playback frame ${index} requires exactly one float32 volume.`,
      );
    const asset = volumes[0];
    if (
      !asset.dimensions ||
      !asset.origin ||
      !asset.spacing ||
      asset.spacing.some((value) => value <= 0)
    )
      throw new Error(`Playback frame ${index} has an invalid volume grid.`);
    const count = asset.dimensions.reduce(
      (product, value) => product * value,
      1,
    );
    const signature = JSON.stringify([
      asset.dimensions,
      asset.origin,
      asset.spacing,
      scene.origin,
      scene.field?.id,
      scene.field?.unit,
    ]);
    if (grid !== undefined && signature !== grid)
      throw new Error(
        "Playback volume grids differ. Temporal interpolation is unavailable.",
      );
    grid = signature;
    if (count * 4 * total + count > budget)
      throw new Error("Playback CPU asset budget exceeded (256 MiB).");
    const frameRange =
      scene.range === undefined && explicitRange
        ? explicitRange
        : checkedRange(scene.range);
    reserve(count * 5);
    const values = new Float32Array(
      await download(asset.url, count * 4, (fraction) =>
        report(slot, 0.1 + 0.65 * fraction),
      ),
    );
    if (!values.every(Number.isFinite))
      throw new Error(`Playback frame ${index} contains non-finite values.`);
    const mask = asset.maskUrl
      ? new Uint8Array(
          await download(asset.maskUrl, count, (fraction) =>
            report(slot, 0.75 + 0.15 * fraction),
          ),
        )
      : new Uint8Array(count).fill(1);
    alive();
    if (sharedMask) {
      if (
        mask.length !== sharedMask.length ||
        !mask.every((value, offset) => value === sharedMask![offset])
      )
        throw new Error(
          "Playback fluid masks differ. Temporal interpolation is unavailable.",
        );
      bytes -= count;
    } else sharedMask = mask;
    frames[slot] = { index, scene, asset, values, mask: sharedMask };
    range = [
      Math.min(range[0], frameRange[0]),
      Math.max(range[1], frameRange[1]),
    ];
    report(slot, 1);
  };
  try {
    alive();
    onProgress?.(0, total);
    workers = Array.from({ length: Math.min(2, total) }, async () => {
      while (cursor < total) {
        alive();
        await prepare(cursor++);
      }
    });
    await Promise.all(workers);
    alive();
    return {
      key,
      frames,
      times: sourceTimes.slice(firstFrame),
      range: explicitRange ?? range,
      bytes,
    };
  } catch (error) {
    controller.abort(error);
    await Promise.allSettled(workers);
    frames.length = 0;
    sharedMask = undefined;
    bytes = 0;
    throw error;
  } finally {
    signal.removeEventListener("abort", stop);
  }
}

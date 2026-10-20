import type { QueryClient } from "@tanstack/react-query";
import { post } from "../../lib/api";
import type { Dataset } from "../datasets/types";
import { boundedAsset } from "./decode";
import type { PreparedPlaybackClip } from "./preparedPlayback";
import { sceneSchema } from "./schema";
import { sha256 } from "./sha256";

export interface EmissionParticlePaths {
  kind: "particle-paths";
  positions: Float32Array;
  times: Float32Array;
  particleIds: Uint32Array;
  source: [number, number, number];
  count: number;
  bytes: number;
}
const BUDGET = 256 * 1024 * 1024;
const MAX_SEGMENTS = 200_000;
const SEGMENT_BYTES = 36;
const RIBBON_BYTES = 312;
const TIMEOUT = 180_000;
const TOTAL_TIMEOUT = 300_000;
const secondsPerUnit: Record<string, number> = {
  ms: 0.001,
  s: 1,
  sec: 1,
  min: 60,
  h: 3600,
};
const aborted = () =>
  new DOMException("Particle path preparation was cancelled.", "AbortError");
function checked(signal: AbortSignal) {
  if (signal.aborted) throw signal.reason ?? aborted();
}
function equal(a: unknown, b: unknown) {
  return JSON.stringify(a) === JSON.stringify(b);
}
function invalid(message: string): never {
  throw new Error(`Particle paths ${message}`);
}

// 실제 선분의 영역 교차만 잘라 농도 격자와 같은 좌표계로 변환
function clipSegment(
  start: number[],
  end: number[],
  lower: number[],
  upper: number[],
): [number, number] | undefined {
  let entry = 0,
    exit = 1;
  for (let axis = 0; axis < 3; axis++) {
    const difference = end[axis] - start[axis];
    if (Math.abs(difference) < 1e-12) {
      if (start[axis] < lower[axis] || start[axis] > upper[axis]) return;
      continue;
    }
    const a = (lower[axis] - start[axis]) / difference;
    const b = (upper[axis] - start[axis]) / difference;
    entry = Math.max(entry, Math.min(a, b));
    exit = Math.min(exit, Math.max(a, b));
    if (entry > exit) return;
  }
  return [entry, exit];
}

/** 원본 농도와 모든 시점이 일치한다고 검증된 실제 입자 궤적을 준비 */
export async function prepareEmissionStreamlines(
  dataset: Dataset,
  clip: PreparedPlaybackClip,
  signal: AbortSignal,
  _client?: QueryClient,
  _windDataset?: Dataset,
  onProgress?: (completed: number, total: number) => void,
): Promise<EmissionParticlePaths | undefined> {
  checked(signal);
  const provenance = dataset.provenance
    ? structuredClone(dataset.provenance)
    : undefined;
  if (!provenance?.source) return undefined;
  const source = provenance.source;
  if (
    !Array.isArray(source) ||
    source.length !== 3 ||
    !source.every(Number.isFinite) ||
    typeof provenance.sourceDatasetId !== "string" ||
    !provenance.sourceDatasetId ||
    !(
      provenance.sourceResultId === null ||
      (typeof provenance.sourceResultId === "string" &&
        provenance.sourceResultId)
    ) ||
    typeof provenance.sourceVersion !== "string" ||
    !provenance.sourceVersion ||
    typeof provenance.methodVersion !== "string" ||
    !provenance.methodVersion ||
    !Number.isSafeInteger(provenance.seed) ||
    (provenance.seed as number) < 0
  )
    invalid("require a valid saved emission source and replay provenance.");
  if (!Number.isFinite(clip.bytes) || clip.bytes < 0 || clip.bytes >= BUDGET)
    invalid("CPU asset budget exceeded (256 MiB).");
  const unit = secondsPerUnit[dataset.timeUnit ?? ""];
  const times = dataset.times.map((time) => time * unit);
  if (
    !Object.hasOwn(secondsPerUnit, dataset.timeUnit ?? "") ||
    !times.length ||
    times.some(
      (time, index) =>
        !Number.isFinite(time) || (index > 0 && time <= times[index - 1]),
    ) ||
    !clip.frames.length ||
    clip.frames.length !== clip.times.length ||
    clip.frames.some(
      (frame, index) =>
        !Number.isInteger(frame.index) ||
        frame.index < 0 ||
        frame.index >= times.length ||
        times[frame.index] !== clip.times[index] ||
        (index > 0 && frame.index !== clip.frames[index - 1].index + 1),
    )
  )
    invalid("require the exact prepared concentration timeline.");
  let request: Record<string, unknown>;
  try {
    request = JSON.parse(clip.key).request;
  } catch {
    invalid("require an exact saved result selection.");
  }
  if (
    !request ||
    request.datasetId !== dataset.id ||
    typeof request.resultId !== "string" ||
    !request.resultId ||
    request.fieldId !== "concentration"
  )
    invalid("require an exact saved concentration result selection.");
  const frame = clip.frames[0];
  const { dimensions, origin, spacing } = frame.asset;
  if (
    !dimensions ||
    !origin ||
    !spacing ||
    spacing.some((value) => !Number.isFinite(value) || value <= 0) ||
    dimensions.some((value) => !Number.isInteger(value) || value <= 0) ||
    ![...origin, ...frame.scene.origin].every(Number.isFinite)
  )
    invalid("require a valid prepared concentration grid.");
  const lower = origin.map((value, axis) => value + frame.scene.origin[axis]);
  const extent = spacing.map((value, axis) => value * dimensions[axis]);
  const upper = lower.map((value, axis) => value + extent[axis]);
  if (provenance.grid !== undefined) {
    const grid = provenance.grid as {
      origin?: unknown;
      spacing?: unknown;
      shape?: unknown;
    };
    const nativeOrigin = grid?.origin,
      nativeSpacing = grid?.spacing,
      nativeShape = grid?.shape;
    if (
      !Array.isArray(nativeOrigin) ||
      !Array.isArray(nativeSpacing) ||
      !Array.isArray(nativeShape) ||
      [nativeOrigin, nativeSpacing, nativeShape].some(
        (vector) => vector.length !== 3 || !vector.every(Number.isFinite),
      ) ||
      nativeSpacing.some((value) => value <= 0) ||
      nativeShape.some((value) => !Number.isInteger(value) || value <= 0) ||
      spacing.some(
        (value, axis) => Math.abs(value - nativeSpacing[axis]) > 1e-6,
      ) ||
      lower.some((value, axis) => {
        const offset = (value - nativeOrigin[axis]) / nativeSpacing[axis];
        return (
          Math.abs(offset - Math.round(offset)) > 1e-6 ||
          offset < -1e-6 ||
          offset + dimensions[axis] > nativeShape[axis] + 1e-6
        );
      })
    )
      invalid(
        "require the original concentration grid or a cell-aligned native ROI.",
      );
  }

  const controller = new AbortController();
  const stop = () => controller.abort(aborted());
  signal.addEventListener("abort", stop, { once: true });
  const totalTimer = setTimeout(
    () =>
      controller.abort(
        new Error("Particle path preparation timed out after 300 seconds."),
      ),
    TOTAL_TIMEOUT,
  );
  const timed = async <T>(
    label: string,
    load: (signal: AbortSignal) => Promise<T>,
  ): Promise<T> => {
    checked(controller.signal);
    const child = new AbortController();
    let fail!: (reason: unknown) => void;
    const cancelled = new Promise<never>((_, reject) => {
      fail = reject;
    });
    const cancel = () => {
      child.abort(controller.signal.reason ?? aborted());
      fail(controller.signal.reason ?? aborted());
    };
    controller.signal.addEventListener("abort", cancel, { once: true });
    const timer = setTimeout(() => {
      const error = new Error(
        `Particle path ${label} timed out after 180 seconds.`,
      );
      child.abort(error);
      fail(error);
    }, TIMEOUT);
    try {
      const result = await Promise.race([load(child.signal), cancelled]);
      checked(controller.signal);
      return result;
    } finally {
      clearTimeout(timer);
      controller.signal.removeEventListener("abort", cancel);
    }
  };
  try {
    onProgress?.(0, 4);
    const scene = sceneSchema.parse(
      await timed("scene request", (requestSignal) =>
        post<unknown>(
          "/scene",
          {
            ...request,
            mode: "streamlines",
            frame: clip.frames.at(-1)!.index,
            maxCells: 262144,
          },
          requestSignal,
        ),
      ),
    );
    const metadata = scene.particlePaths;
    if (
      !metadata ||
      metadata.datasetId !== request.datasetId ||
      metadata.resultId !== request.resultId ||
      !equal(metadata.source, source) ||
      !equal(metadata.times, times) ||
      metadata.sourceDatasetId !== provenance.sourceDatasetId ||
      metadata.sourceResultId !== provenance.sourceResultId ||
      metadata.sourceVersion !== provenance.sourceVersion ||
      metadata.methodVersion !== provenance.methodVersion ||
      metadata.seed !== provenance.seed ||
      scene.field?.id !== "concentration" ||
      scene.time !== dataset.times[clip.frames.at(-1)!.index]
    )
      invalid("verification does not match the selected concentration result.");
    const assets = scene.assets.filter(
      (asset) => asset.kind === "trajectories",
    );
    if (assets.length !== 1 || scene.assets.length !== 1)
      invalid("require exactly one verified trajectory asset.");
    const asset = assets[0];
    const count = asset.count;
    if (
      asset.format !== "float32-xyz-t-xyz-t-id/1" ||
      asset.stride !== 9 ||
      count === undefined ||
      !Number.isInteger(count) ||
      count <= 0 ||
      count > MAX_SEGMENTS ||
      asset.byteLength !== count * SEGMENT_BYTES ||
      !asset.sha256 ||
      !asset.url.endsWith(`/${asset.sha256}.bin`)
    )
      invalid("asset format, count, or hash is invalid.");
    // 다운로드 중 이중 버퍼와 렌더링 속성의 메모리를 함께 제한
    const retained = count * (SEGMENT_BYTES + RIBBON_BYTES);
    if (clip.bytes + retained + count * SEGMENT_BYTES * 2 > BUDGET)
      invalid("CPU asset budget exceeded (256 MiB).");
    onProgress?.(1, 4);
    const buffer = await timed("asset download", (requestSignal) =>
      boundedAsset(
        asset.url,
        requestSignal,
        count * SEGMENT_BYTES,
        (received) => {
          checked(controller.signal);
          onProgress?.(
            1 + Math.min(1, received / (count * SEGMENT_BYTES)) * 2,
            4,
          );
        },
      ),
    );
    if (buffer.byteLength !== count * SEGMENT_BYTES)
      invalid("asset byte size does not match its segment count.");
    const hash = await timed("hash verification", (requestSignal) =>
      sha256(buffer, requestSignal),
    );
    if (hash !== asset.sha256)
      invalid("asset SHA-256 does not match its metadata.");
    const raw = new Float32Array(buffer);
    const positions = new Float32Array(count * 6);
    const particleTimes = new Float32Array(count * 2);
    const ids = new Uint32Array(count);
    const last = new Map<number, number>();
    let written = 0;
    for (let index = 0; index < count; index++) {
      if (index > 0 && index % 4096 === 0) {
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
        checked(controller.signal);
        onProgress?.(3 + index / count, 4);
      }
      const offset = index * 9;
      const row = raw.subarray(offset, offset + 9);
      const [x0, y0, z0, t0, x1, y1, z1, t1, id] = row;
      const previous = last.get(id);
      if (
        !row.every(Number.isFinite) ||
        !Number.isInteger(id) ||
        id < 0 ||
        id > 2 ** 24 ||
        t0 < times[0] - 1e-5 ||
        t1 < t0 ||
        t1 > times.at(-1)! + 1e-5 ||
        t0 < (previous === undefined ? -Infinity : raw[previous + 7]) - 1e-5
      )
        invalid(
          "contain invalid coordinates, timestamps, or particle identifiers.",
        );
      const start = [x0, y0, z0],
        end = [x1, y1, z1];
      if (
        previous !== undefined &&
        start.some(
          (value, axis) => Math.abs(value - raw[previous + 4 + axis]) > 1e-3,
        )
      )
        invalid("contain disconnected segments for one particle.");
      last.set(id, offset);
      if (
        [start, end].some((point) =>
          point.some(
            (value, axis) =>
              value < scene.bounds[0][axis] - 1e-3 ||
              value > scene.bounds[1][axis] + 1e-3,
          ),
        )
      )
        invalid("coordinates are outside the verified scene bounds.");
      const intersection = clipSegment(start, end, lower, upper);
      if (!intersection) continue;
      const [entry, exit] = intersection;
      for (let axis = 0; axis < 3; axis++) {
        const delta = end[axis] - start[axis];
        positions[written * 6 + axis] = Math.max(
          0,
          Math.min(
            1,
            (start[axis] + delta * entry - lower[axis]) / extent[axis],
          ),
        );
        positions[written * 6 + axis + 3] = Math.max(
          0,
          Math.min(
            1,
            (start[axis] + delta * exit - lower[axis]) / extent[axis],
          ),
        );
      }
      particleTimes[written * 2] = t0 + (t1 - t0) * entry;
      particleTimes[written * 2 + 1] = t0 + (t1 - t0) * exit;
      ids[written] = id;
      written += 1;
    }
    checked(controller.signal);
    if (!written)
      invalid("have no segments inside the selected concentration region.");
    onProgress?.(4, 4);
    return {
      kind: "particle-paths",
      positions:
        written === count ? positions : positions.slice(0, written * 6),
      times:
        written === count ? particleTimes : particleTimes.slice(0, written * 2),
      particleIds: written === count ? ids : ids.slice(0, written),
      source: [...source] as [number, number, number],
      count: written,
      bytes: written * (SEGMENT_BYTES + RIBBON_BYTES),
    };
  } finally {
    clearTimeout(totalTimer);
    signal.removeEventListener("abort", stop);
    controller.abort();
  }
}

import type { QueryClient } from "@tanstack/react-query";
import { api, post } from "../../lib/api";
import { useWorkspace } from "../../stores/workspace";
import { datasetSchema } from "../datasets/schema";
import { supports, type Dataset, type Field } from "../datasets/types";
import { buildSceneRequest, sceneQueryKey } from "./api";
import {
  loadPreparedPlayback,
  type PreparedPlaybackClip,
} from "./preparedPlayback";
import { preloadSceneAssets } from "./sceneAssets";
import { sceneSchema } from "./schema";
import type { Scene } from "./types";
import { playbackSelection } from "./usePreparedPlayback";
import { prepareEmissionStreamlines } from "./preparedEmission";

type WorkspaceState = ReturnType<typeof useWorkspace.getState>;
export type PreparedSceneRequest = ReturnType<typeof buildSceneRequest>;
export interface PreparedPredictionViews {
  wind?: {
    dataset: Dataset;
    resultId: string;
    request: PreparedSceneRequest;
    scene: Scene;
  };
  iso?: { request: PreparedSceneRequest; scene: Scene };
  playback?: PreparedPlaybackClip;
}
export interface PreparationStatus {
  label?: string;
  indeterminate?: boolean;
}
export interface PreparedPredictionViewOptions {
  client: QueryClient;
  dataset: Dataset;
  resultId: string;
  windResultId: string;
  state: WorkspaceState;
  signal: AbortSignal;
  onProgress?: (
    completed: number,
    total: number,
    status?: PreparationStatus,
  ) => void;
}

function cancelled() {
  return new DOMException("Display preparation was cancelled.", "AbortError");
}

function checked(signal: AbortSignal) {
  if (signal.aborted) throw cancelled();
}

function abortable<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) {
    void promise.catch(() => {});
    return Promise.reject(cancelled());
  }
  return new Promise((resolve, reject) => {
    const stop = () => reject(cancelled());
    signal.addEventListener("abort", stop, { once: true });
    promise.then(resolve, reject).finally(() => {
      signal.removeEventListener("abort", stop);
    });
  });
}

function validRange(value: unknown): value is [number, number] {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    value.every(Number.isFinite) &&
    value[0] < value[1]
  );
}

function velocityField(dataset: Dataset): Field | undefined {
  const vector = dataset.fields.find((field) => field.components === 3);
  const components = ["velocity_x", "velocity_y", "velocity_z"].map((id) =>
    dataset.fields.find((field) => field.id === id),
  );
  if (
    !vector &&
    (!components.every(Boolean) ||
      new Set(components.map((field) => field?.unit ?? "")).size !== 1)
  )
    return undefined;
  return (
    dataset.fields.find((field) => field.id === "speed") ??
    vector ??
    components[0]
  );
}

function frameIndex(dataset: Dataset, requested: number) {
  return Math.max(
    0,
    Math.min(Math.max(0, dataset.times.length - 1), Math.trunc(requested)),
  );
}

export async function preparePredictionViews({
  client,
  dataset,
  resultId,
  windResultId,
  state,
  signal,
  onProgress,
}: PreparedPredictionViewOptions): Promise<PreparedPredictionViews> {
  checked(signal);
  const concentration = dataset.fields.find(
    (field) => field.id === "concentration",
  );
  if (!concentration)
    throw new Error("Display preparation requires a concentration field.");
  if (!resultId || !windResultId)
    throw new Error(
      "Display preparation requires concentration and wind results.",
    );
  const modes = concentration.supportModes ?? dataset.supportModes;
  if (modes && !modes.includes("iso"))
    throw new Error("Concentration does not support iso-surfaces.");

  // 같은 예측의 표시 작업을 묶고 취소 이후 결과 게시 차단
  const controller = new AbortController();
  const stop = () => controller.abort();
  signal.addEventListener("abort", stop, { once: true });
  const currentSignal = controller.signal;
  const snapshot = {
    ...state,
    roi: state.roi ? structuredClone(state.roi) : undefined,
    datasetId: dataset.id,
    resultId,
    fieldId: concentration.id,
    frame: frameIndex(dataset, dataset.initialFrame ?? 0),
    mode: "volume" as const,
  };
  const selection = playbackSelection(dataset, snapshot);
  const frameCount = selection
    ? selection.times.length - selection.firstFrame
    : 0;
  let total =
    frameCount +
    2 +
    (selection ? 0 : 1) +
    (supports(dataset, "geometry") ? 1 : 0);
  let completedViews = 0;
  let completedFrames = 0;
  const report = (status?: PreparationStatus) => {
    checked(currentSignal);
    if (status) onProgress?.(completedViews + completedFrames, total, status);
    else onProgress?.(completedViews + completedFrames, total);
  };
  const checkedWind = (value: unknown): Dataset => {
    const wind = datasetSchema.parse(value);
    if (
      wind.id !== dataset.id ||
      (wind.spaceId &&
        wind.spaceId !== dataset.spaceId &&
        wind.spaceId !== dataset.id)
    )
      throw new Error("Display wind does not belong to the selected dataset.");
    const field = velocityField(wind);
    const windModes = field?.supportModes ?? wind.supportModes;
    if (!field || (windModes && !windModes.includes("streamlines")))
      throw new Error("Display wind requires a supported velocity field.");
    return wind;
  };
  const prepareScene = async (
    request: PreparedSceneRequest,
    version: string | undefined,
  ) => {
    let preloaded = false;
    const scene = sceneSchema.parse(
      await abortable(
        client.fetchQuery({
          queryKey: sceneQueryKey(request, version),
          staleTime: Infinity,
          gcTime: Infinity,
          retry: false,
          queryFn: async ({ signal: querySignal }) => {
            const requestSignal = AbortSignal.any([currentSignal, querySignal]);
            const value = sceneSchema.parse(
              await abortable(
                post<unknown>("/scene", request, requestSignal),
                requestSignal,
              ),
            );
            await abortable(
              preloadSceneAssets(value, requestSignal),
              requestSignal,
            );
            checked(requestSignal);
            preloaded = true;
            return value;
          },
        }),
        currentSignal,
      ),
    );
    // 캐시된 장면도 파싱된 자산의 준비 상태를 확인
    if (!preloaded)
      await abortable(preloadSceneAssets(scene, currentSignal), currentSignal);
    checked(currentSignal);
    completedViews += 1;
    report();
    return scene;
  };

  try {
    report();
    // 배출원 결과의 세 표시 모드는 같은 전체 농도 클립과 시간축 공유
    if (selection && dataset.provenance?.source) {
      total = frameCount + 4 + (supports(dataset, "geometry") ? 1 : 0);
      const playback = await loadPreparedPlayback({
        ...selection,
        signal: currentSignal,
        onProgress: (completed) => {
          completedFrames = completed;
          report();
        },
      });
      try {
        playback.streamlines = await prepareEmissionStreamlines(
          dataset,
          playback,
          currentSignal,
          client,
          undefined,
          (completed) => {
            completedViews = completed;
            report({
              label:
                completed === 0
                  ? "입자 이동 경로 검증 중"
                  : "입자 이동 경로 준비 중",
              indeterminate: completed === 0,
            });
          },
        );
        if (!playback.streamlines?.positions.length)
          playback.streamlineError =
            "Verified particle paths are unavailable. Contour and Volume remain available.";
      } catch (error) {
        checked(currentSignal);
        playback.streamlineError =
          error instanceof Error
            ? error.message
            : "Particle path preparation failed.";
      }
      if (playback.streamlines) playback.bytes += playback.streamlines.bytes;
      completedViews = 4;
      report();
      if (supports(dataset, "geometry"))
        await prepareScene(
          buildSceneRequest(dataset, snapshot, true),
          dataset.version,
        );
      checked(currentSignal);
      return { playback };
    }
    const playbackPromise = selection
      ? abortable(
          loadPreparedPlayback({
            ...selection,
            signal: currentSignal,
            onProgress: (completed) => {
              if (currentSignal.aborted) return;
              completedFrames = completed;
              report();
            },
          }),
          currentSignal,
        )
      : Promise.resolve(undefined);
    // 연속 재생이 없는 결과는 최초 볼륨 장면의 농도 범위를 확인
    const initialVolumePromise = selection
      ? Promise.resolve(undefined)
      : prepareScene(buildSceneRequest(dataset, snapshot), dataset.version);

    // 이번에 계산한 풍장 결과를 정확한 메타데이터 키로 준비
    const windPromise = (async () => {
      const wind = checkedWind(
        await abortable(
          client.fetchQuery({
            queryKey: ["dataset", dataset.id, windResultId],
            staleTime: Infinity,
            gcTime: Infinity,
            retry: false,
            queryFn: async ({ signal: querySignal }) => {
              const requestSignal = AbortSignal.any([
                currentSignal,
                querySignal,
              ]);
              const value = checkedWind(
                await abortable(
                  api<unknown>(
                    `/datasets/${encodeURIComponent(dataset.id)}?resultId=${encodeURIComponent(windResultId)}`,
                    { signal: requestSignal },
                  ),
                  requestSignal,
                ),
              );
              checked(requestSignal);
              return value;
            },
          }),
          currentSignal,
        ),
      );
      const field = velocityField(wind)!;
      const start = wind.initialFrame ?? dataset.provenance?.windStartFrame;
      const request = buildSceneRequest(wind, {
        ...snapshot,
        resultId: windResultId,
        fieldId: field.id,
        frame: frameIndex(
          wind,
          typeof start === "number" && Number.isFinite(start) ? start : 0,
        ),
        mode: "streamlines",
      });
      if (supports(wind, "geometry")) {
        total += 1;
        report();
        await prepareScene(
          buildSceneRequest(
            wind,
            {
              ...snapshot,
              resultId: windResultId,
            },
            true,
          ),
          wind.version,
        );
      }
      return {
        dataset: wind,
        resultId: windResultId,
        request,
        scene: await prepareScene(request, wind.version),
      };
    })();

    // 공통 농도 범위를 사용하여 등농도면 임계값을 고정
    const isoPromise = (async () => {
      const playback = await playbackPromise;
      const initialVolume = await initialVolumePromise;
      const range = [
        playback?.range,
        dataset.colorRange,
        concentration.range,
        initialVolume?.range,
      ].find(validRange);
      if (!validRange(range))
        throw new Error(
          "A finite concentration range is required for iso-surfaces.",
        );
      const request = buildSceneRequest(dataset, {
        ...snapshot,
        mode: "iso",
        threshold: range[0] / 2 + range[1] / 2,
      });
      return { request, scene: await prepareScene(request, dataset.version) };
    })();

    const geometryPromise = supports(dataset, "geometry")
      ? prepareScene(
          buildSceneRequest(dataset, snapshot, true),
          dataset.version,
        )
      : Promise.resolve(undefined);
    const [wind, iso, playback] = await abortable(
      Promise.all([
        windPromise,
        isoPromise,
        playbackPromise,
        geometryPromise,
        initialVolumePromise,
      ]),
      currentSignal,
    );
    checked(currentSignal);
    completedFrames = frameCount;
    report();
    return { wind, iso, playback };
  } catch (error) {
    controller.abort();
    throw error;
  } finally {
    signal.removeEventListener("abort", stop);
  }
}

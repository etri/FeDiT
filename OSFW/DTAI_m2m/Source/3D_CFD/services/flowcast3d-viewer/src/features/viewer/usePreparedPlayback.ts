import { useCallback, useEffect, useRef, useState } from "react";
import type { Dataset } from "../datasets/types";
import { useWorkspace } from "../../stores/workspace";
import {
  loadPreparedPlayback,
  type PreparedPlaybackClip,
} from "./preparedPlayback";
import { usePlaybackTransport } from "./playbackTransport";
import { prepareEmissionStreamlines } from "./preparedEmission";

type WorkspaceState = ReturnType<typeof useWorkspace.getState>;
export interface PreparedPlaybackState {
  key?: string;
  status: "idle" | "preparing" | "ready" | "failed";
  progress: number;
  label?: string;
  indeterminate?: boolean;
  clip?: PreparedPlaybackClip;
  error?: Error;
  retry: () => void;
}
const secondsPerUnit: Record<string, number> = {
  ms: 0.001,
  s: 1,
  sec: 1,
  min: 60,
  h: 3600,
};

export function playbackSelection(
  dataset: Dataset | undefined,
  state: WorkspaceState,
) {
  const metadata = dataset as
    | (Dataset & {
        analysisKind?: string;
        initialFrame?: number;
        colorRange?: [number, number];
        supportModes?: string[];
      })
    | undefined;
  const field = (dataset?.fields.find((item) => item.id === state.fieldId) ??
    dataset?.fields[0]) as
    (Dataset["fields"][number] & { supportModes?: string[] }) | undefined;
  const unit = secondsPerUnit[dataset?.timeUnit ?? ""];
  const modes = field?.supportModes ?? metadata?.supportModes;
  const volumeSupported = modes
    ? modes.includes("volume")
    : metadata?.analysisKind !== "points" &&
      metadata?.analysisKind !== "surface";
  const staticResult =
    dataset?.capabilities &&
    !Array.isArray(dataset.capabilities) &&
    dataset.capabilities.playback === false;
  if (
    !dataset ||
    !["volume", "iso", "streamlines"].includes(state.mode) ||
    !field?.id.toLowerCase().includes("concentration") ||
    !unit ||
    dataset.times.length < 2 ||
    staticResult ||
    !volumeSupported
  )
    return undefined;
  const times = dataset.times.map((time) => time * unit);
  if (
    times.some(
      (time, index) =>
        !Number.isFinite(time) || (index > 0 && time <= times[index - 1]),
    )
  )
    return undefined;
  const firstFrame = Math.min(
    times.length - 1,
    Math.max(0, Math.trunc(metadata?.initialFrame ?? 0)),
  );
  if (firstFrame === times.length - 1) return undefined;
  const request = {
    datasetId: dataset.id,
    resultId: state.resultId || undefined,
    fieldId: field.id,
    mode: "volume",
    roi: state.roi ? [state.roi.min, state.roi.max] : undefined,
    colorRange: metadata?.colorRange,
    maxCells: 262144,
  };
  return {
    key: JSON.stringify({
      renderVersion: 4,
      provenance: metadata?.provenance,
      request,
      times,
      firstFrame,
      version: dataset.version,
    }),
    request,
    times,
    firstFrame,
  };
}

export function usePreparedPlayback(dataset?: Dataset): PreparedPlaybackState {
  const workspace = useWorkspace();
  const selection = playbackSelection(dataset, workspace);
  const key = selection?.key;
  const [attempt, setAttempt] = useState(0);
  const previousAttempt = useRef(attempt);
  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  const storedKey = usePlaybackTransport((state) => state.key);
  const status = usePlaybackTransport((state) => state.status);
  const progress = usePlaybackTransport((state) => state.progress);
  const label = usePlaybackTransport((state) => state.preparationLabel);
  const indeterminate = usePlaybackTransport(
    (state) => state.preparationIndeterminate,
  );
  const clip = usePlaybackTransport((state) => state.clip);
  const error = usePlaybackTransport((state) => state.error);

  useEffect(() => {
    const forceReload = previousAttempt.current !== attempt;
    previousAttempt.current = attempt;
    if (!key) return;
    const controller = new AbortController();
    const transport = usePlaybackTransport.getState();
    const release = () => {
      controller.abort();
      const current = usePlaybackTransport.getState();
      if (
        current.key === key &&
        current.status === "ready" &&
        current.clip?.key === key
      )
        current.pause();
      else current.reset(key);
    };

    // 완료된 현재 클립을 한 건만 보존하여 화면 복귀 시 재사용
    if (
      !forceReload &&
      transport.key === key &&
      transport.status === "ready" &&
      transport.clip?.key === key
    ) {
      transport.pause();
      return release;
    }

    // 선택 변경과 명시적 재시도는 기존 클립을 새 준비 작업으로 교체
    const selection = JSON.parse(key) as {
      request: Record<string, unknown>;
      times: number[];
      firstFrame: number;
    };
    transport.prepare(key);
    void loadPreparedPlayback({
      key,
      ...selection,
      signal: controller.signal,
      onProgress: (completed, total) => {
        if (!controller.signal.aborted)
          transport.setProgress(
            key,
            Math.floor(
              (completed / total) * (dataset?.provenance?.source ? 90 : 100),
            ),
          );
      },
    })
      .then(async (clip) => {
        // 같은 농도 클립으로 검증된 입자 궤적과 등농도면도 재생 준비
        if (dataset?.provenance?.source && !controller.signal.aborted) {
          try {
            clip.streamlines = await prepareEmissionStreamlines(
              dataset,
              clip,
              controller.signal,
              undefined,
              undefined,
              (completed, total) => {
                if (!controller.signal.aborted) {
                  transport.setPreparationStatus(
                    key,
                    completed === 0
                      ? "입자 이동 경로 검증 중"
                      : "입자 이동 경로 준비 중",
                    completed === 0,
                  );
                  transport.setProgress(key, 90 + (completed / total) * 10);
                }
              },
            );
            if (!clip.streamlines?.positions.length)
              clip.streamlineError =
                "Verified particle paths are unavailable. Contour and Volume remain available.";
          } catch (error) {
            if (controller.signal.aborted) throw error;
            clip.streamlineError =
              error instanceof Error
                ? error.message
                : "Particle path preparation failed.";
          }
        }
        if (clip.streamlines) clip.bytes += clip.streamlines.bytes;
        if (!controller.signal.aborted) transport.setReady(key, clip);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          transport.setError(
            key,
            error instanceof Error
              ? error
              : new Error("Playback preparation failed."),
          );
      });
    return release;
    // 선택 키는 메타데이터와 좌표 및 버전을 포함
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt]);

  const matching =
    storedKey === key && (status !== "ready" || clip?.key === key);
  return key
    ? {
        key,
        status:
          matching && workspace.mode === "streamlines" && clip?.streamlineError
            ? "failed"
            : matching
              ? status
              : "preparing",
        progress: matching ? progress : 0,
        label: matching ? label : undefined,
        indeterminate: matching ? indeterminate : undefined,
        clip: matching ? clip : undefined,
        error:
          matching && workspace.mode === "streamlines" && clip?.streamlineError
            ? new Error(clip.streamlineError)
            : matching
              ? error
              : undefined,
        retry,
      }
    : { status: "idle", progress: 0, retry };
}

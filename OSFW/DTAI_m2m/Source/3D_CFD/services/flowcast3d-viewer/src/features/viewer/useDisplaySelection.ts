import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useWorkspace } from "../../stores/workspace";
import { datasetSchema } from "../datasets/schema";
import type { Dataset, Field } from "../datasets/types";
import { usePlaybackTransport } from "./playbackTransport";
import { playbackSelection } from "./usePreparedPlayback";

export type QuickDisplayMode = "streamlines" | "iso" | "volume";
type DisplayField = Field & { supportModes?: string[] };
type DisplayDataset = Dataset & {
  fields: DisplayField[];
  supportModes?: string[];
  analysisKind?: string;
  initialFrame?: number;
  colorRange?: [number, number];
  provenance?: Record<string, unknown> | null;
  sourceRef?: { datasetId?: string; resultId?: string | null };
};
type Selection = Pick<
  ReturnType<typeof useWorkspace.getState>,
  "datasetId" | "resultId" | "fieldId" | "frame" | "mode"
>;
interface ConcentrationSelection {
  selection: Selection;
  dataset: DisplayDataset;
  fieldId: string;
  range?: [number, number];
  time?: number;
  windResultId?: string;
}
interface Operation {
  controller: AbortController;
  selectionKey: string;
}
interface RestoreTime {
  selection: Selection;
  dataset: DisplayDataset;
  time: number;
  expectedKey: string;
  scheduled?: boolean;
}

let retainedConcentration:
  { client: QueryClient; value: ConcentrationSelection } | undefined;

function selectionKey(selection: Selection) {
  return JSON.stringify([
    selection.datasetId,
    selection.resultId,
    selection.fieldId,
    selection.frame,
    selection.mode,
  ]);
}

function concentrationField(dataset?: DisplayDataset) {
  return dataset?.fields.find((field) =>
    field.id.toLowerCase().includes("concentration"),
  );
}

function velocityField(dataset?: DisplayDataset) {
  if (!dataset) return undefined;
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

function displaySupported(
  dataset: DisplayDataset | undefined,
  mode: QuickDisplayMode,
  field: DisplayField | undefined,
) {
  if (!dataset || !field) return false;
  const modes = field.supportModes ?? dataset.supportModes;
  if (modes && !modes.includes(mode)) return false;
  if (mode === "streamlines") return Boolean(velocityField(dataset));
  return !["surface", "points", "none"].includes(dataset.analysisKind ?? "");
}

function validRange(value: unknown): value is [number, number] {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    value.every(
      (number) => typeof number === "number" && Number.isFinite(number),
    ) &&
    value[0] < value[1]
  );
}

function concentrationRange(
  dataset: DisplayDataset,
  selection: Selection,
  range?: [number, number],
) {
  const field = concentrationField(dataset);
  const selected =
    dataset.fields.find((item) => item.id === selection.fieldId) ??
    dataset.fields[0];
  const candidates = [
    selected?.id === field?.id ? range : undefined,
    field?.range,
    dataset.colorRange,
  ];
  const found = candidates.find(validRange);
  return found ? ([...found] as [number, number]) : undefined;
}

function windSource(dataset: DisplayDataset) {
  const provenance = dataset.provenance;
  const source =
    provenance && "sourceDatasetId" in provenance
      ? {
          datasetId: provenance.sourceDatasetId,
          resultId: provenance.sourceResultId,
        }
      : dataset.sourceRef;
  if (
    !dataset.id.startsWith("case:") ||
    source?.datasetId !== dataset.id ||
    !(
      source.resultId === null ||
      (typeof source.resultId === "string" && source.resultId.length > 0)
    )
  )
    return undefined;
  return { datasetId: dataset.id, resultId: source.resultId ?? "" };
}

function matchingClip(key: string, selection: Selection) {
  try {
    const request = JSON.parse(key).request;
    return (
      request?.datasetId === selection.datasetId &&
      (request.resultId ?? "") === selection.resultId &&
      request.fieldId === selection.fieldId
    );
  } catch {
    return false;
  }
}

function sameResult(left: Selection, right: Selection) {
  return left.datasetId === right.datasetId && left.resultId === right.resultId;
}

function savedSelectionMatches(
  saved: ConcentrationSelection,
  current: Selection,
) {
  return (
    current.datasetId === saved.selection.datasetId &&
    (current.resultId === saved.selection.resultId ||
      current.resultId === saved.windResultId)
  );
}

// 화면을 떠난 동안 다른 공간이나 결과를 선택하면 복원 기억 해제
useWorkspace.subscribe((state) => {
  if (
    retainedConcentration &&
    !savedSelectionMatches(retainedConcentration.value, state)
  )
    retainedConcentration = undefined;
});

function frameIndex(dataset: DisplayDataset, requested: number) {
  return Math.max(
    0,
    Math.min(Math.max(0, dataset.times.length - 1), Math.trunc(requested)),
  );
}

function physicalTime(dataset: DisplayDataset, frame: number) {
  const units: Record<string, number> = {
    ms: 0.001,
    s: 1,
    sec: 1,
    min: 60,
    h: 3600,
  };
  const scale = units[dataset.timeUnit ?? ""];
  const time = dataset.times[frame] * scale;
  return Number.isFinite(time) ? time : undefined;
}

export function useDisplaySelection(
  dataset?: Dataset,
  range?: [number, number],
) {
  const client = useQueryClient();
  const workspace = useWorkspace();
  const data = dataset as DisplayDataset | undefined;
  const latest = useRef({ dataset: data, range });
  latest.current = { dataset: data, range };
  const mounted = useRef(false);
  const operation = useRef<Operation | undefined>(undefined);
  const remembered = useRef<ConcentrationSelection | undefined>(
    retainedConcentration?.client === client &&
      savedSelectionMatches(retainedConcentration.value, workspace)
      ? retainedConcentration.value
      : undefined,
  );
  const restoreTime = useRef<RestoreTime | undefined>(undefined);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<Error>();

  const applyRestore = useCallback(() => {
    const restore = restoreTime.current;
    const transport = usePlaybackTransport.getState();
    if (
      !restore ||
      transport.status !== "ready" ||
      transport.key !== restore.expectedKey ||
      restore.scheduled
    )
      return;
    restore.scheduled = true;
    // 준비 완료의 첫 프레임 게시가 끝난 뒤 원래 재생 시각 복원
    queueMicrotask(() => {
      const current = usePlaybackTransport.getState();
      const selection = useWorkspace.getState();
      if (!mounted.current || restoreTime.current !== restore) return;
      if (
        !sameResult(selection, restore.selection) ||
        selection.mode !== "volume" ||
        selection.fieldId !== restore.selection.fieldId ||
        current.status !== "ready" ||
        current.key !== restore.expectedKey ||
        playbackSelection(restore.dataset, selection)?.key !==
          restore.expectedKey
      ) {
        restore.scheduled = false;
        return;
      }
      restoreTime.current = undefined;
      current.pause();
      current.seek(restore.time);
    });
  }, []);

  // 외부 선택 변경과 해제 시 진행 중인 표시 전환을 취소
  useEffect(() => {
    mounted.current = true;
    const unsubscribe = useWorkspace.subscribe((state) => {
      const active = operation.current;
      if (active && selectionKey(state) !== active.selectionKey) {
        operation.current = undefined;
        active.controller.abort();
        setPending(false);
      }
      const saved = remembered.current;
      if (saved && !savedSelectionMatches(saved, state))
        remembered.current = undefined;
      const restore = restoreTime.current;
      if (
        restore &&
        (!sameResult(state, restore.selection) ||
          state.fieldId !== restore.selection.fieldId ||
          state.mode !== "volume" ||
          playbackSelection(restore.dataset, state)?.key !==
            restore.expectedKey)
      )
        restoreTime.current = undefined;
    });

    const playback = usePlaybackTransport.subscribe(applyRestore);
    return () => {
      mounted.current = false;
      operation.current?.controller.abort();
      operation.current = undefined;
      restoreTime.current = undefined;
      unsubscribe();
      playback();
    };
  }, [applyRestore]);

  const concentration = concentrationField(data);
  const saved = remembered.current;
  const returning =
    saved &&
    workspace.datasetId === saved.selection.datasetId &&
    workspace.resultId === saved.windResultId
      ? saved
      : undefined;
  const availableRange =
    data && concentration
      ? (concentrationRange(data, workspace, range) ??
        (saved &&
        sameResult(saved.selection, workspace) &&
        saved.selection.frame === workspace.frame
          ? saved.range
          : undefined))
      : returning?.range;
  const concentrationDataset = concentration ? data : returning?.dataset;
  const targetField = concentration ?? concentrationField(returning?.dataset);
  const current = Boolean(data && data.id === workspace.datasetId);
  const continuousConcentration = Boolean(
    concentration && data && playbackSelection(data, workspace),
  );
  const storedClip = usePlaybackTransport((state) => state.clip);
  const clip =
    storedClip?.key === (data && playbackSelection(data, workspace)?.key)
      ? storedClip
      : undefined;
  const emissionAvailable = Boolean(
    data?.provenance?.source && windSource(data),
  );
  const available: Record<QuickDisplayMode, boolean> = {
    streamlines:
      current &&
      (continuousConcentration && emissionAvailable
        ? !clip ||
          Boolean(clip.streamlines?.positions.length && !clip.streamlineError)
        : displaySupported(data, "streamlines", velocityField(data)) ||
          Boolean(concentration && data && windSource(data))),
    iso:
      current &&
      (validRange(availableRange) ||
        (continuousConcentration && Boolean(clip))) &&
      displaySupported(concentrationDataset, "iso", targetField),
    volume:
      current && displaySupported(concentrationDataset, "volume", targetField),
  };
  const value: QuickDisplayMode | "" =
    current &&
    ((workspace.mode === "streamlines" &&
      (displaySupported(data, "streamlines", velocityField(data)) ||
        (continuousConcentration && emissionAvailable))) ||
      ((workspace.mode === "iso" || workspace.mode === "volume") &&
        Boolean(concentration)))
      ? (workspace.mode as QuickDisplayMode)
      : "";

  const select = useCallback(
    async (mode: QuickDisplayMode) => {
      operation.current?.controller.abort();
      operation.current = undefined;
      restoreTime.current = undefined;
      setError(undefined);
      usePlaybackTransport.getState().pause();
      const state = useWorkspace.getState();
      const source = latest.current.dataset;
      if (!source || source.id !== state.datasetId) {
        setError(new Error("Dataset selection is unavailable."));
        setPending(false);
        return;
      }
      // 배출원 농도는 결과와 재생 시간을 유지하고 표시 방식만 전환
      if (
        source.provenance?.source &&
        concentrationField(source) &&
        playbackSelection(source, state)
      ) {
        const clip = usePlaybackTransport.getState().clip;
        if (
          mode === "streamlines" &&
          clip &&
          clip.key === playbackSelection(source, state)?.key &&
          clip.streamlineError
        ) {
          setError(new Error(clip.streamlineError));
          setPending(false);
          return;
        }
        useWorkspace.getState().set({
          mode,
          fieldId: concentrationField(source)!.id,
          compareId: "",
          valueRange: undefined,
        });
        setPending(false);
        return;
      }
      const controller = new AbortController();
      const active: Operation = {
        controller,
        selectionKey: selectionKey(state),
      };
      operation.current = active;
      const alive = () =>
        mounted.current &&
        operation.current === active &&
        !controller.signal.aborted &&
        selectionKey(useWorkspace.getState()) === active.selectionKey;
      const load = async (datasetId: string, resultId: string) => {
        const value = await client.fetchQuery({
          queryKey: ["dataset", datasetId, resultId],
          staleTime: resultId ? Infinity : 30_000,
          retry: false,
          queryFn: async ({ signal }) => {
            const abort = () => controller.abort();
            if (signal.aborted) abort();
            signal.addEventListener("abort", abort, { once: true });
            try {
              return datasetSchema.parse(
                await api<unknown>(
                  `/datasets/${encodeURIComponent(datasetId)}${resultId ? `?resultId=${encodeURIComponent(resultId)}` : ""}`,
                  { signal: controller.signal },
                ),
              );
            } finally {
              signal.removeEventListener("abort", abort);
            }
          },
        });
        const detail = datasetSchema.parse(value) as DisplayDataset;
        if (
          detail.id !== datasetId ||
          (detail.spaceId &&
            detail.spaceId !== source.spaceId &&
            detail.spaceId !== datasetId)
        )
          throw new Error(
            "Display source does not belong to the selected dataset.",
          );
        return detail;
      };
      const capture = (): ConcentrationSelection => {
        const field = concentrationField(source)!;
        const previous = remembered.current;
        const transport = usePlaybackTransport.getState();
        const selection: Selection = {
          datasetId: state.datasetId,
          resultId: state.resultId,
          fieldId: field.id,
          frame: state.frame,
          mode: state.mode,
        };
        const sampledTime =
          state.mode === "volume" &&
          transport.status === "ready" &&
          matchingClip(transport.key, selection) &&
          Number.isFinite(transport.time)
            ? transport.time
            : previous &&
                sameResult(previous.selection, selection) &&
                previous.selection.frame === selection.frame
              ? previous.time
              : undefined;
        const time = sampledTime ?? physicalTime(source, selection.frame);
        return {
          selection,
          dataset: source,
          fieldId: field.id,
          range:
            concentrationRange(source, state, latest.current.range) ??
            (previous && sameResult(previous.selection, selection)
              ? previous.range
              : undefined),
          time,
        };
      };

      setPending(true);
      try {
        let target = source;
        let resultId = state.resultId;
        let frame = state.frame;
        let bookmark = remembered.current;
        let field: DisplayField | undefined;
        let scalarRange: [number, number] | undefined;
        if (mode === "streamlines") {
          field = velocityField(source);
          if (
            displaySupported(source, mode, field) &&
            concentrationField(source)
          ) {
            bookmark = capture();
            bookmark.windResultId = state.resultId;
          }
          if (!displaySupported(source, mode, field)) {
            if (!concentrationField(source))
              throw new Error("Streamlines require a velocity field.");
            const reference = windSource(source);
            if (!reference)
              throw new Error(
                "Concentration has no valid source wind reference.",
              );
            bookmark = capture();
            target = await load(reference.datasetId, reference.resultId);
            resultId = reference.resultId;
            field = velocityField(target);
            if (!displaySupported(target, mode, field))
              throw new Error("Source wind does not support streamlines.");
            const start =
              target.initialFrame ?? source.provenance?.windStartFrame;
            frame = frameIndex(
              target,
              typeof start === "number" && Number.isFinite(start) ? start : 0,
            );
            bookmark.windResultId = resultId;
          }
        } else {
          field = concentrationField(source);
          if (field) {
            bookmark = capture();
          } else {
            if (
              !bookmark ||
              state.datasetId !== bookmark.selection.datasetId ||
              state.resultId !== bookmark.windResultId
            )
              throw new Error(
                "No concentration result is available for this selection.",
              );
            target = await load(
              bookmark.selection.datasetId,
              bookmark.selection.resultId,
            );
            resultId = bookmark.selection.resultId;
            field = target.fields.find((item) => item.id === bookmark!.fieldId);
            frame = frameIndex(target, bookmark.selection.frame);
          }
          scalarRange = bookmark?.range;
          if (!displaySupported(target, mode, field))
            throw new Error(
              "Concentration does not support the selected display mode.",
            );
          if (mode === "iso" && !validRange(scalarRange))
            throw new Error(
              "A finite concentration range is required for iso-surfaces.",
            );
        }
        if (!alive() || !field) return;
        const changes = {
          resultId,
          fieldId: field.id,
          frame,
          mode,
          compareId: "",
          valueRange: undefined,
          ...(mode === "iso" && scalarRange
            ? { threshold: scalarRange[0] / 2 + scalarRange[1] / 2 }
            : {}),
        };
        const playback = playbackSelection(target, { ...state, ...changes });
        if (
          mode === "volume" &&
          bookmark?.time !== undefined &&
          playback &&
          (state.mode !== "volume" || state.resultId !== resultId)
        )
          restoreTime.current = {
            selection: {
              datasetId: state.datasetId,
              resultId,
              fieldId: field.id,
              frame,
              mode,
            },
            dataset: target,
            time: bookmark.time,
            expectedKey: playback.key,
          };
        remembered.current = bookmark;
        retainedConcentration = bookmark
          ? { client, value: bookmark }
          : undefined;
        operation.current = undefined;
        state.set(changes);
        applyRestore();
      } catch (failure) {
        if (alive())
          setError(
            failure instanceof Error
              ? failure
              : new Error("Display selection failed."),
          );
      } finally {
        if (operation.current === active) operation.current = undefined;
        if (mounted.current && !operation.current) setPending(false);
      }
    },
    [client, applyRestore],
  );

  return {
    value,
    available,
    pending,
    error:
      error ??
      (clip?.streamlineError ? new Error(clip.streamlineError) : undefined),
    select,
    streamlineError: clip?.streamlineError,
  };
}

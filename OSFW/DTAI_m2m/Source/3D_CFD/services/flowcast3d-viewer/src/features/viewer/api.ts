import { useDebounced } from "../../lib/useDebounced";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { post } from "../../lib/api";
import { useWorkspace } from "../../stores/workspace";
import { supports, type Dataset } from "../datasets/types";
import { slicePosition } from "./selection";
import { sceneSchema } from "./schema";
import { displayMode } from "../datasets/results";
type WorkspaceState = ReturnType<typeof useWorkspace.getState>;

export function buildSceneRequest(
  dataset: Dataset | undefined,
  state: WorkspaceState,
  geometry = false,
) {
  const shared = {
    datasetId: dataset?.id,
    resultId: state.resultId || undefined,
    frame: geometry ? 0 : Math.max(dataset?.initialFrame ?? 0, state.frame),
    roi: state.roi ? [state.roi.min, state.roi.max] : undefined,
  };
  const fieldId =
    dataset?.fields.find((field) => field.id === state.fieldId)?.id ??
    dataset?.fields[0]?.id;
  const mode = displayMode(
    dataset,
    state.mode === "geometry" ? "surface" : state.mode,
    dataset?.fields.find((field) => field.id === fieldId),
  );
  return geometry
    ? { ...shared, mode: "geometry" }
    : {
        ...shared,
        fieldId,
        mode,
        colorRange: dataset?.colorRange,
        ...(mode === "slice"
          ? {
              axis: state.axis,
              position: slicePosition(
                dataset?.bounds,
                state.roi,
                state.axis,
                state.position,
              ).value,
            }
          : {}),
        ...(mode === "iso" ? { threshold: state.threshold } : {}),
      };
}

export function sceneQueryKey(
  request: ReturnType<typeof buildSceneRequest>,
  version?: string,
) {
  return ["scene", request, version ?? null] as const;
}

export function useScene(
  dataset: Dataset | undefined,
  geometry = false,
  suspended = false,
) {
  const state = useWorkspace();
  const client = useQueryClient();
  const hasGeometry = supports(dataset, "geometry");
  const request = buildSceneRequest(dataset, state, geometry);
  const debounced = useDebounced(request);
  const cached = client.getQueryState(sceneQueryKey(request, dataset?.version));
  const prepared =
    cached?.status === "success" &&
    !cached.isInvalidated &&
    (Boolean(request.resultId) || Date.now() - cached.dataUpdatedAt < 30000);
  const selection = prepared ? request : debounced;
  const fieldId = "fieldId" in request ? request.fieldId : undefined;
  const current = JSON.stringify(selection) === JSON.stringify(request);
  const contextKey = JSON.stringify({
    ...request,
    frame: undefined,
    version: dataset?.version,
  });
  const sameContext =
    JSON.stringify({
      ...selection,
      frame: undefined,
      version: dataset?.version,
    }) === contextKey;
  const enabled = Boolean(
    dataset &&
    !suspended &&
    (geometry
      ? hasGeometry
      : fieldId && !(hasGeometry && state.mode === "geometry")),
  );
  const query = useQuery({
    queryKey: sceneQueryKey(selection, dataset?.version),
    queryFn: ({ signal }) =>
      post<unknown>("/scene", selection, signal).then((value) =>
        sceneSchema.parse(value),
      ),
    enabled: enabled && sameContext,
    placeholderData: (previous, previousQuery) => {
      const previousRequest = previousQuery?.queryKey[1] as
        typeof request | undefined;
      return previousRequest &&
        previousQuery?.queryKey[2] === (dataset?.version ?? null) &&
        JSON.stringify({
          ...previousRequest,
          frame: undefined,
          version: dataset?.version,
        }) === contextKey
        ? previous
        : undefined;
    },
    staleTime: request.resultId ? Infinity : 30000,
    gcTime: request.resultId ? 10 * 60_000 : 30000,
    retry: false,
  });
  return {
    ...query,
    enabled,
    contextKey,
    requestKey: JSON.stringify({ request, version: dataset?.version }),
    data: enabled && sameContext ? query.data : undefined,
    isPending:
      enabled && (!current || query.isPending || query.isPlaceholderData),
  };
}

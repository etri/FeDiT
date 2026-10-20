import { useDebounced } from "../../lib/useDebounced";
import { useQuery } from "@tanstack/react-query";
import { post } from "../../lib/api";
import { useWorkspace } from "../../stores/workspace";
import type { Dataset } from "../datasets/types";
import { analysisSchema } from "./schema";
export function useAnalysis(dataset?: Dataset) {
  const state = useWorkspace();
  const request = {
    datasetId: dataset?.id,
    resultId: state.resultId || undefined,
    fieldId:
      dataset?.fields.find((field) => field.id === state.fieldId)?.id ??
      dataset?.fields[0]?.id,
    frame: Math.max(dataset?.initialFrame ?? 0, state.frame),
    roi: state.roi ? [state.roi.min, state.roi.max] : undefined,
    probes: state.probes.map((probe) => ({
      id: probe.id,
      point: probe.position,
    })),
    threshold: state.threshold,
    bins: state.bins,
    compareDatasetId: state.compareId || undefined,
    compareResultId: state.compareResultId || undefined,
  };
  const selection = useDebounced(request);
  const current = JSON.stringify(selection) === JSON.stringify(request);
  const query = useQuery({
    queryKey: ["analysis", selection],
    queryFn: ({ signal }) =>
      post<unknown>("/analysis", selection, signal).then((value) =>
        analysisSchema.parse(value),
      ),
    enabled: Boolean(
      dataset &&
      dataset.analysisKind !== "none" &&
      request.fieldId &&
      selection.datasetId === dataset.id &&
      selection.fieldId,
    ),
    retry: false,
    gcTime: 30000,
  });
  return {
    ...query,
    data: current ? query.data : undefined,
    isPending: !current || query.isPending,
  };
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { api } from "../../lib/api";
import { datasetSchema, datasetsSchema } from "./schema";
import { useWorkspace } from "../../stores/workspace";
import type { Dataset } from "./types";

export function useRenameDataset(datasetId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (title: string) =>
      api<unknown>(`/datasets/${encodeURIComponent(datasetId)}`, {
        method: "PATCH",
        body: JSON.stringify({ title: title.trim() }),
      }).then((value) => datasetSchema.parse(value)),
    onSuccess: (dataset) => {
      client.setQueryData<{ datasets: Dataset[] }>(["datasets"], (previous) =>
        previous
          ? {
              ...previous,
              datasets: previous.datasets.map((item) =>
                item.id === dataset.id ? dataset : item,
              ),
            }
          : previous,
      );
      client.setQueriesData<Dataset>(
        { queryKey: ["dataset", datasetId] },
        (previous) =>
          previous ? { ...previous, name: dataset.name } : previous,
      );
      void client.invalidateQueries({ queryKey: ["datasets"] });
      void client.invalidateQueries({ queryKey: ["dataset", datasetId] });
    },
  });
}
export function useDatasets() {
  return useQuery({
    queryKey: ["datasets"],
    queryFn: ({ signal }) =>
      api<unknown>("/datasets", { signal }).then((value) =>
        datasetsSchema.parse(value),
      ),
    refetchInterval: 15000,
    select: (value) =>
      value.datasets.filter(
        (dataset) =>
          !dataset.status ||
          ["ready", "succeeded", "completed"].includes(dataset.status),
      ),
  });
}

export function useSelectedDataset() {
  const all = useDatasets(),
    datasetId = useWorkspace((state) => state.datasetId),
    resultId = useWorkspace((state) => state.resultId);
  useEffect(() => {
    if (!datasetId || all.data?.some((dataset) => dataset.id === datasetId))
      return;
    const space = all.data?.find((dataset) =>
      dataset.results?.some((result) => result.id === datasetId),
    );
    if (space)
      useWorkspace.getState().set({
        datasetId: space.id,
        resultId: datasetId,
        camera: undefined,
      });
  }, [all.data, datasetId]);
  const detail = useQuery({
    queryKey: ["dataset", datasetId, resultId],
    queryFn: ({ signal }) =>
      api<unknown>(
        `/datasets/${encodeURIComponent(datasetId)}${resultId ? `?resultId=${encodeURIComponent(resultId)}` : ""}`,
        { signal },
      ).then((value) => datasetSchema.parse(value)),
    enabled: Boolean(datasetId),
    retry: false,
    refetchInterval: 15000,
  });
  const listed = all.data?.find((item) => item.id === datasetId);
  const selectedResult = listed?.results?.find((item) => item.id === resultId);
  const fallback =
    resultId && listed
      ? {
          ...listed,
          fields: selectedResult?.fields ?? [],
          times: selectedResult?.times ?? [],
          capabilities: selectedResult?.capabilities ?? {},
          supportModes: selectedResult?.supportModes ?? [],
          analysisKind: selectedResult?.analysisKind ?? "none",
          scenarioId: selectedResult?.scenarioId,
          resultRole: selectedResult?.resultRole,
          sourceRef: selectedResult?.sourceRef,
          colorRange: selectedResult?.colorRange,
          initialFrame: selectedResult?.initialFrame,
        }
      : listed;
  return {
    ...detail,
    data: detail.data ?? fallback,
    datasets: all,
  };
}

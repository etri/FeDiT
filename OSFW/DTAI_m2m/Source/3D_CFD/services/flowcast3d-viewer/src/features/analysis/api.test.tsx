import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { post } from "../../lib/api";
import { useWorkspace } from "../../stores/workspace";
import { useAnalysis } from "./api";
import type { Dataset } from "../datasets/types";

vi.mock("../../lib/api", () => ({ post: vi.fn() }));
vi.mock("../../lib/useDebounced", () => ({
  useDebounced: (value: unknown) => value,
}));
let client: QueryClient;
function Wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  useWorkspace.setState(useWorkspace.getInitialState(), true);
  vi.mocked(post)
    .mockReset()
    .mockResolvedValue({
      contextKey: "actual-station",
      field: { id: "concentration", unit: "µg/m3" },
      time: 0,
      probes: [],
      timeseries: [
        { id: "station-1", times: [0, 30], values: [1, 3], timeUnit: "s" },
      ],
      histogram: { edges: [0], volumes: [], percentages: [] },
      validVolume: null,
      thresholdVolume: null,
      statistics: { minimum: 1, maximum: 3, mean: 2 },
      analysisKind: "points",
    });
});
afterEach(() => {
  cleanup();
  client.clear();
  localStorage.clear();
});

describe("analysis source contracts", () => {
  it("queries actual station series without inventing cell volumes", async () => {
    const dataset: Dataset = {
      id: "stations",
      fields: [{ id: "concentration" }],
      times: [0],
      analysisKind: "points",
    };
    const { result } = renderHook(() => useAnalysis(dataset), {
      wrapper: Wrapper,
    });
    await waitFor(() =>
      expect(result.current.data?.timeseries[0].values).toEqual([1, 3]),
    );
    expect(result.current.data?.validVolume).toBeNull();
  });

  it("sends explicit dataset and result references for same-space comparisons", async () => {
    useWorkspace.setState({
      resultId: "model-plume",
      compareId: "case:city",
      compareResultId: "reference-plume",
    });
    renderHook(
      () =>
        useAnalysis({
          id: "case:city",
          fields: [{ id: "concentration" }],
          times: [0],
        }),
      { wrapper: Wrapper },
    );
    await waitFor(() => expect(post).toHaveBeenCalled());
    expect(vi.mocked(post).mock.calls[0][1]).toMatchObject({
      datasetId: "case:city",
      resultId: "model-plume",
      compareDatasetId: "case:city",
      compareResultId: "reference-plume",
    });
  });
});

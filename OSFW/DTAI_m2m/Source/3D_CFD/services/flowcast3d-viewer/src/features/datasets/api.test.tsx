import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { api } from "../../lib/api";
import { useWorkspace } from "../../stores/workspace";
import { useDatasets, useSelectedDataset } from "./api";

vi.mock("../../lib/api", () => ({ api: vi.fn() }));

const space = {
  id: "case:harbor",
  name: "Kalasatama, Helsinki (OBJ)",
  fileFormat: "OBJ",
  fields: [{ id: "speed" }],
  times: [0, 1, 2],
  results: [{ id: "prediction:one", fields: [{ id: "pressure" }], times: [0] }],
};
let client: QueryClient;
function Wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  useWorkspace.setState(useWorkspace.getInitialState(), true);
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  vi.mocked(api)
    .mockReset()
    .mockImplementation(async (path) => {
      if (path === "/datasets") return { datasets: [space] };
      if (path === "/datasets/case%3Aharbor?resultId=prediction%3Aone")
        return { ...space, fields: [{ id: "pressure" }], times: [0] };
      return space;
    });
});
afterEach(() => {
  cleanup();
  client.clear();
  useWorkspace.setState(useWorkspace.getInitialState(), true);
  localStorage.clear();
});

describe("space dataset selection", () => {
  it("lists published spaces without unfinished or failed result placeholders", async () => {
    vi.mocked(api).mockResolvedValue({
      datasets: [
        space,
        { ...space, id: "ready", status: "ready" },
        { ...space, id: "failed", status: "failed" },
        { ...space, id: "cancelled", status: "cancelled" },
        { ...space, id: "interrupted", status: "interrupted" },
        { ...space, id: "preparing", status: "preparing" },
      ],
    });
    const { result } = renderHook(() => useDatasets(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.data).toHaveLength(2));
    expect(result.current.data?.map((dataset) => dataset.id)).toEqual([
      space.id,
      "ready",
    ]);
  });

  it("waits for result metadata without reusing original field and time values", async () => {
    useWorkspace.setState({ datasetId: space.id, resultId: "prediction:one" });
    vi.mocked(api).mockImplementation(async (path) =>
      path === "/datasets"
        ? {
            datasets: [
              {
                ...space,
                capabilities: { flow: true, predict: true },
                results: [{ id: "prediction:one", fields: [], times: [] }],
              },
            ],
          }
        : new Promise(() => {}),
    );
    const { result } = renderHook(() => useSelectedDataset(), {
      wrapper: Wrapper,
    });
    await waitFor(() => expect(result.current.datasets.data).toHaveLength(1));
    expect(result.current.data).toMatchObject({
      id: space.id,
      fields: [],
      times: [],
      capabilities: {},
      analysisKind: "none",
    });
    expect(result.current.isPending).toBe(true);
  });

  it("keeps one space while updating the selected result fields and times", async () => {
    useWorkspace.setState({ datasetId: space.id });
    const { result } = renderHook(() => useSelectedDataset(), {
      wrapper: Wrapper,
    });
    await waitFor(() => expect(result.current.data?.times).toEqual([0, 1, 2]));
    act(() => useWorkspace.getState().set({ resultId: "prediction:one" }));
    await waitFor(() =>
      expect(result.current.data?.fields).toEqual([{ id: "pressure" }]),
    );
    expect(result.current.data?.id).toBe(space.id);
    expect(result.current.data?.times).toEqual([0]);
    expect(result.current.datasets.data).toHaveLength(1);
  });

  it("restores an older prediction selection under its containing space", async () => {
    useWorkspace.setState({ datasetId: "prediction:one" });
    const { result } = renderHook(() => useSelectedDataset(), {
      wrapper: Wrapper,
    });
    await waitFor(() =>
      expect(useWorkspace.getState()).toMatchObject({
        datasetId: space.id,
        resultId: "prediction:one",
      }),
    );
    await waitFor(() =>
      expect(result.current.data?.fields).toEqual([{ id: "pressure" }]),
    );
    expect(result.current.datasets.data).toHaveLength(1);
  });
});

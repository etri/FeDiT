import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { post } from "../../lib/api";
import { useWorkspace } from "../../stores/workspace";
import type { Dataset } from "../datasets/types";
import { useScene } from "./api";

vi.mock("../../lib/api", () => ({ post: vi.fn() }));
vi.mock("../../lib/useDebounced", () => ({
  useDebounced: (value: unknown) => value,
}));

const dataset: Dataset = {
  id: "city",
  fields: [{ id: "speed", unit: "m/s" }],
  times: [0, 1],
  capabilities: ["geometry"],
};
const scene = {
  contextKey: "city",
  origin: [0, 0, 0],
  bounds: [
    [0, 0, 0],
    [1, 1, 1],
  ],
  assets: [],
};
let client: QueryClient;
function Wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  useWorkspace.setState(useWorkspace.getInitialState(), true);
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  vi.mocked(post).mockReset().mockResolvedValue(scene);
});
afterEach(() => {
  cleanup();
  client.clear();
  useWorkspace.setState(useWorkspace.getInitialState(), true);
  localStorage.clear();
});

describe("geometry-first scene requests", () => {
  it("loads a new scene when an immutable result version changes", async () => {
    useWorkspace.setState({ resultId: "prediction", mode: "streamlines" });
    const hook = renderHook(({ data }) => useScene(data), {
      wrapper: Wrapper,
      initialProps: { data: { ...dataset, version: "v1" } },
    });
    await waitFor(() => expect(hook.result.current.data).toEqual(scene));
    const previous = hook.result.current.contextKey;
    const updated = { ...scene, contextKey: "new-version" };
    vi.mocked(post).mockResolvedValue(updated);
    hook.rerender({ data: { ...dataset, version: "v2" } });
    await waitFor(() => expect(hook.result.current.data).toEqual(updated));
    expect(hook.result.current.contextKey).not.toBe(previous);
    expect(post).toHaveBeenCalledTimes(2);
  });

  it("keeps only the geometry query active while a prepared clip advances", async () => {
    useWorkspace.setState({ mode: "volume" });
    const { result } = renderHook(
      () => ({
        field: useScene(dataset, false, true),
        geometry: useScene(dataset, true),
      }),
      { wrapper: Wrapper },
    );
    await waitFor(() => expect(result.current.geometry.data).toEqual(scene));
    for (const frame of [1, 30, 60])
      act(() => useWorkspace.setState({ frame }));
    expect(result.current.field.enabled).toBe(false);
    expect(result.current.field.data).toBeUndefined();
    expect(post).toHaveBeenCalledTimes(1);
    expect(vi.mocked(post).mock.calls[0][1]).toMatchObject({
      mode: "geometry",
      frame: 0,
    });
  });

  it("loads only buildings initially and does not report a pending field request", async () => {
    const { result } = renderHook(
      () => ({
        field: useScene(dataset),
        geometry: useScene(dataset, true),
      }),
      { wrapper: Wrapper },
    );
    expect(result.current.field.enabled).toBe(false);
    expect(result.current.field.isPending).toBe(false);
    expect(result.current.field.data).toBeUndefined();
    await waitFor(() => expect(result.current.geometry.data).toEqual(scene));
    expect(post).toHaveBeenCalledTimes(1);
    expect(vi.mocked(post).mock.calls[0][1]).toMatchObject({
      datasetId: "city",
      mode: "geometry",
    });
  });

  it("keeps the geometry cache when field controls change", async () => {
    const { result } = renderHook(() => useScene(dataset, true), {
      wrapper: Wrapper,
    });
    await waitFor(() => expect(result.current.data).toEqual(scene));
    const key = result.current.requestKey;
    act(() =>
      useWorkspace.setState({
        fieldId: "pressure",
        mode: "slice",
        axis: "x",
        position: 0.7,
        threshold: 4,
      }),
    );
    expect(result.current.requestKey).toBe(key);
    expect(result.current.data).toEqual(scene);
    expect(post).toHaveBeenCalledTimes(1);
    act(() => useWorkspace.setState({ frame: 1 }));
    expect(result.current.requestKey).toBe(key);
    expect(post).toHaveBeenCalledTimes(1);
    expect(vi.mocked(post).mock.calls[0][1]).toMatchObject({ frame: 0 });
    act(() => useWorkspace.setState({ resultId: "another-result" }));
    await waitFor(() => expect(post).toHaveBeenCalledTimes(2));
    expect(vi.mocked(post).mock.calls[1][1]).toMatchObject({
      resultId: "another-result",
      frame: 0,
    });
  });

  it("keeps the previous frame while the next scene is pending", async () => {
    useWorkspace.setState({ mode: "volume" });
    let resolve!: (value: typeof scene) => void;
    vi.mocked(post)
      .mockResolvedValueOnce(scene)
      .mockImplementationOnce(
        () =>
          new Promise((done) => {
            resolve = done;
          }),
      );
    const { result } = renderHook(() => useScene(dataset), {
      wrapper: Wrapper,
    });
    await waitFor(() => expect(result.current.data).toEqual(scene));
    act(() => useWorkspace.setState({ frame: 1 }));
    expect(result.current.data).toEqual(scene);
    expect(result.current.isPending).toBe(true);
    const next = { ...scene, contextKey: "next-frame" };
    await act(async () => resolve(next));
    await waitFor(() => expect(result.current.data).toEqual(next));
    expect(result.current.isPending).toBe(false);
  });

  it.each([
    { resultId: "another-result" },
    { mode: "slice" as const },
    { fieldId: "pressure" },
    {
      roi: {
        min: [0, 0, 0] as [number, number, number],
        max: [0.5, 0.5, 0.5] as [number, number, number],
      },
    },
  ])(
    "does not reuse a previous scene for another context %j",
    async (selection) => {
      useWorkspace.setState({ mode: "volume" });
      vi.mocked(post)
        .mockResolvedValueOnce(scene)
        .mockImplementationOnce(() => new Promise(() => {}));
      const value = {
        ...dataset,
        fields: [...dataset.fields, { id: "pressure" }],
      };
      const { result } = renderHook(() => useScene(value), {
        wrapper: Wrapper,
      });
      await waitFor(() => expect(result.current.data).toEqual(scene));
      act(() => useWorkspace.setState(selection));
      expect(result.current.data).toBeUndefined();
      expect(result.current.isPending).toBe(true);
    },
  );

  it("hides cached field samples after returning to buildings", async () => {
    useWorkspace.setState({ mode: "surface" });
    const { result } = renderHook(() => useScene(dataset), {
      wrapper: Wrapper,
    });
    await waitFor(() => expect(result.current.data).toEqual(scene));
    act(() => useWorkspace.setState({ mode: "geometry" }));
    expect(result.current.enabled).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.isPending).toBe(false);
  });

  it("falls back to field samples for datasets without buildings", async () => {
    const { result } = renderHook(
      () => useScene({ ...dataset, capabilities: [] }),
      { wrapper: Wrapper },
    );
    await waitFor(() => expect(result.current.data).toEqual(scene));
    expect(result.current.enabled).toBe(true);
    expect(vi.mocked(post).mock.calls[0][1]).toMatchObject({
      mode: "surface",
      fieldId: "speed",
    });
  });

  it("requests the shared scenario range for the selected concentration", async () => {
    useWorkspace.setState({ resultId: "virtual-model", mode: "surface" });
    renderHook(() => useScene({ ...dataset, colorRange: [0, 80] }), {
      wrapper: Wrapper,
    });
    await waitFor(() => expect(post).toHaveBeenCalled());
    expect(vi.mocked(post).mock.calls[0][1]).toMatchObject({
      resultId: "virtual-model",
      colorRange: [0, 80],
    });
  });

  it("never requests synthetic input frames of a native model result", async () => {
    useWorkspace.setState({
      resultId: "steady-wind",
      mode: "surface",
      frame: 0,
    });
    renderHook(
      () => useScene({ ...dataset, initialFrame: 3, times: [0, 1, 2, 3] }),
      { wrapper: Wrapper },
    );
    await waitFor(() => expect(post).toHaveBeenCalled());
    expect(vi.mocked(post).mock.calls[0][1]).toMatchObject({
      resultId: "steady-wind",
      frame: 3,
    });
  });
});

import { act, cleanup, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../../lib/api";
import { useWorkspace } from "../../stores/workspace";
import type { Dataset } from "../datasets/types";
import { useDisplaySelection } from "./useDisplaySelection";
import { usePlaybackTransport } from "./playbackTransport";
import { playbackSelection } from "./usePreparedPlayback";
import type { PreparedPlaybackClip } from "./preparedPlayback";

vi.mock("../../lib/api", () => ({ api: vi.fn() }));
type Metadata = Dataset & {
  sourceRef?: { datasetId: string; resultId?: string | null };
  provenance?: {
    sourceDatasetId: string;
    sourceResultId?: string | null;
    windStartFrame?: number;
  };
  supportModes?: string[];
};
const city = "case:harbor";
const concentration: Metadata = {
  id: city,
  fields: [{ id: "concentration", range: [2, 10] }],
  times: [0, 10, 20],
  timeUnit: "s",
  capabilities: { playback: true },
  supportModes: ["iso", "volume"],
  provenance: {
    sourceDatasetId: city,
    sourceResultId: "wind",
    windStartFrame: 3,
  },
};
const wind: Metadata = {
  id: city,
  fields: [{ id: "velocity", components: 3, range: [0, 100] }],
  times: [0, 1, 2, 3],
  supportModes: ["streamlines"],
};
let client: QueryClient;
function Wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
function mount(data: Metadata = concentration, range?: [number, number]) {
  return renderHook(({ data, range }) => useDisplaySelection(data, range), {
    wrapper: Wrapper,
    initialProps: { data, range },
  });
}
function selection() {
  const { datasetId, resultId, fieldId, frame, mode } = useWorkspace.getState();
  return { datasetId, resultId, fieldId, frame, mode };
}
function resetWorkspace() {
  useWorkspace.setState(useWorkspace.getInitialState(), true);
  useWorkspace.getState().set({
    datasetId: city,
    resultId: "plume",
    fieldId: "concentration",
    mode: "volume",
    frame: 1,
  });
}
function deferred() {
  let resolve!: (value: Metadata) => void;
  const promise = new Promise<Metadata>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
function clip(resultId: string, label: string): PreparedPlaybackClip {
  const key = playbackSelection(concentration, {
    ...useWorkspace.getState(),
    datasetId: city,
    resultId,
    fieldId: "concentration",
    mode: "volume",
  })!.key;
  return {
    key,
    times: [0, 10, 20],
    range: [2, 10],
    bytes: 15,
    frames: [0, 10, 20].map((time, index) => ({
      index,
      values: new Float32Array([index]),
      mask: new Uint8Array([1]),
      asset: {
        kind: "volume",
        format: "float32",
        url: `/frame-${index}.bin`,
        dimensions: [1, 1, 1],
        origin: [0, 0, 0],
        spacing: [1, 1, 1],
      },
      scene: {
        contextKey: label,
        time,
        origin: [0, 0, 0],
        bounds: [
          [0, 0, 0],
          [1, 1, 1],
        ],
        assets: [],
      },
    })),
  };
}

beforeEach(() => {
  client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  client.setQueryData(["dataset", city, "plume"], concentration);
  vi.mocked(api).mockReset().mockResolvedValue(wind);
  usePlaybackTransport.getState().reset();
  usePlaybackTransport.setState(usePlaybackTransport.getInitialState(), true);
  resetWorkspace();
});
afterEach(() => {
  cleanup();
  client.clear();
  usePlaybackTransport.getState().reset();
  useWorkspace.setState(useWorkspace.getInitialState(), true);
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("quick display selection", () => {
  it("returns from the declared wind to the original concentration frame and uses its saved iso range", async () => {
    const hook = mount(concentration, [2, 10]);
    expect(hook.result.current.value).toBe("volume");
    await act(async () => hook.result.current.select("streamlines"));
    expect(api).toHaveBeenCalledWith(
      "/datasets/case%3Aharbor?resultId=wind",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(selection()).toMatchObject({
      datasetId: city,
      resultId: "wind",
      fieldId: "velocity",
      mode: "streamlines",
      frame: 3,
    });
    hook.rerender({ data: wind, range: [0, 100] });
    expect(hook.result.current.value).toBe("streamlines");
    await act(async () => hook.result.current.select("iso"));
    expect(selection()).toMatchObject({
      datasetId: city,
      resultId: "plume",
      fieldId: "concentration",
      mode: "iso",
      frame: 1,
    });
    expect(useWorkspace.getState().threshold).toBe(6);
    expect(api).toHaveBeenCalledOnce();
  });

  it("reuses validated wind metadata from the exact query cache key", async () => {
    client.setQueryData(["dataset", city, "wind"], wind);
    const hook = mount();
    await act(async () => hook.result.current.select("streamlines"));
    expect(selection()).toMatchObject({
      resultId: "wind",
      mode: "streamlines",
    });
    expect(api).not.toHaveBeenCalled();
  });

  it.each([
    {
      label: "sourceRef",
      data: {
        ...concentration,
        provenance: undefined,
        sourceRef: { datasetId: city, resultId: "wind" },
      },
      resultId: "wind",
      path: "/datasets/case%3Aharbor?resultId=wind",
    },
    {
      label: "explicit base wind",
      data: {
        ...concentration,
        provenance: { sourceDatasetId: city, sourceResultId: null },
      },
      resultId: "",
      path: "/datasets/case%3Aharbor",
    },
  ])(
    "accepts an explicit $label reference",
    async ({ data, resultId, path }) => {
      const hook = mount(data);
      expect(hook.result.current.available.streamlines).toBe(true);
      await act(async () => hook.result.current.select("streamlines"));
      expect(selection()).toMatchObject({ resultId, mode: "streamlines" });
      expect(api).toHaveBeenCalledWith(path, expect.any(Object));
    },
  );

  it("never selects an arbitrary cached wind when the source is absent or belongs to another city", async () => {
    client.setQueryData(["dataset", city, "unrelated-wind"], wind);
    for (const data of [
      { ...concentration, provenance: undefined },
      {
        ...concentration,
        provenance: {
          sourceDatasetId: "case:other",
          sourceResultId: "unrelated-wind",
        },
      },
    ]) {
      const hook = mount(data);
      expect(hook.result.current.available.streamlines).toBe(false);
      const before = selection();
      await act(async () => hook.result.current.select("streamlines"));
      expect(selection()).toEqual(before);
      hook.unmount();
    }
    expect(api).not.toHaveBeenCalled();
  });

  it.each([
    { label: "wrong city", data: { ...wind, id: "case:other" }, cached: false },
    {
      label: "cached scalar field",
      data: { ...wind, fields: [{ id: "pressure", components: 1 }] },
      cached: true,
    },
  ])(
    "rejects $label metadata before changing selection",
    async ({ data, cached }) => {
      if (cached) client.setQueryData(["dataset", city, "wind"], data);
      else vi.mocked(api).mockResolvedValue(data);
      const hook = mount();
      const before = selection();
      await act(async () => hook.result.current.select("streamlines"));
      expect(selection()).toEqual(before);
      expect(hook.result.current.error).toBeInstanceOf(Error);
      expect(hook.result.current.pending).toBe(false);
    },
  );

  it("keeps the concentration selected and reports a failed metadata request", async () => {
    vi.mocked(api).mockRejectedValue(new Error("Wind metadata unavailable."));
    const hook = mount();
    const before = selection();
    await act(async () => hook.result.current.select("streamlines"));
    expect(selection()).toEqual(before);
    expect(hook.result.current.error?.message).toMatch(/unavailable/i);
    expect(hook.result.current.pending).toBe(false);
  });

  it("ignores a late wind response after any selected context changes", async () => {
    for (const change of [
      { datasetId: "case:other" },
      { resultId: "different-result" },
      { fieldId: "pressure" },
      { frame: 2 },
      { mode: "iso" as const },
    ]) {
      resetWorkspace();
      client.clear();
      const task = deferred();
      vi.mocked(api).mockReturnValueOnce(task.promise);
      const hook = mount();
      let complete!: Promise<void>;
      act(() => {
        complete = hook.result.current.select("streamlines");
      });
      expect(hook.result.current.pending).toBe(true);
      act(() => useWorkspace.getState().set(change));
      const before = selection();
      await act(async () => {
        task.resolve(wind);
        await complete;
      });
      expect(selection()).toEqual(before);
      expect(hook.result.current.pending).toBe(false);
      expect(hook.result.current.error).toBeUndefined();
      hook.unmount();
    }
  });

  it("does not apply a pending selection after unmount", async () => {
    const task = deferred();
    vi.mocked(api).mockReturnValue(task.promise);
    const hook = mount();
    const before = selection();
    let complete!: Promise<void>;
    act(() => {
      complete = hook.result.current.select("streamlines");
    });
    hook.unmount();
    await act(async () => {
      task.resolve(wind);
      await complete;
    });
    expect(selection()).toEqual(before);
  });

  it("restores fractional concentration time only after its matching volume is ready", async () => {
    const original = clip("plume", "original");
    usePlaybackTransport.getState().prepare(original.key);
    usePlaybackTransport.getState().setReady(original.key, original);
    usePlaybackTransport.getState().seek(13.5);
    const seek = vi.spyOn(usePlaybackTransport.getState(), "seek");
    const hook = mount();
    await act(async () => hook.result.current.select("streamlines"));
    hook.rerender({ data: wind, range: undefined });
    act(() => usePlaybackTransport.getState().reset());
    await act(async () => hook.result.current.select("volume"));
    hook.rerender({ data: concentration, range: undefined });
    expect(selection()).toMatchObject({
      resultId: "plume",
      frame: 1,
      mode: "volume",
    });
    expect(seek).not.toHaveBeenCalled();
    const unrelated = clip("another-plume", "unrelated");
    act(() => {
      usePlaybackTransport.getState().prepare(unrelated.key);
      usePlaybackTransport.getState().setReady(unrelated.key, unrelated);
    });
    expect(seek).not.toHaveBeenCalled();
    const restored = clip("plume", "restored");
    await act(async () => {
      usePlaybackTransport.getState().prepare(restored.key);
      usePlaybackTransport.getState().setReady(restored.key, restored);
    });
    expect(seek).toHaveBeenCalledWith(13.5);
    expect(usePlaybackTransport.getState().time).toBe(13.5);
    expect(useWorkspace.getState().frame).toBe(1);
  });

  it("retains the selected iso frame when volume preparation starts without an existing transport", async () => {
    useWorkspace.getState().set({ mode: "iso", frame: 1 });
    const hook = mount();
    expect(usePlaybackTransport.getState().status).toBe("idle");
    await act(async () => hook.result.current.select("volume"));
    expect(selection()).toMatchObject({
      resultId: "plume",
      mode: "volume",
      frame: 1,
    });
    const prepared = clip("plume", "first-volume");
    await act(async () => {
      usePlaybackTransport.getState().prepare(prepared.key);
      usePlaybackTransport.getState().setReady(prepared.key, prepared);
    });
    expect(usePlaybackTransport.getState().time).toBe(10);
    expect(useWorkspace.getState().frame).toBe(1);
  });

  it("keeps fractional volume time through an iso detour and a reset playback clip", async () => {
    const original = clip("plume", "before-iso");
    usePlaybackTransport.getState().prepare(original.key);
    usePlaybackTransport.getState().setReady(original.key, original);
    usePlaybackTransport.getState().seek(13.5);
    const hook = mount();
    await act(async () => hook.result.current.select("iso"));
    expect(selection()).toMatchObject({
      resultId: "plume",
      mode: "iso",
      frame: 1,
    });
    act(() => usePlaybackTransport.getState().reset());
    await act(async () => hook.result.current.select("volume"));
    expect(selection()).toMatchObject({
      resultId: "plume",
      mode: "volume",
      frame: 1,
    });
    const prepared = clip("plume", "after-iso");
    await act(async () => {
      usePlaybackTransport.getState().prepare(prepared.key);
      usePlaybackTransport.getState().setReady(prepared.key, prepared);
    });
    expect(usePlaybackTransport.getState().time).toBe(13.5);
    expect(useWorkspace.getState().frame).toBe(1);
  });

  it("restores fractional time from an exact ready cache without preparing it again", async () => {
    const prepared = clip("plume", "cached");
    usePlaybackTransport.getState().prepare(prepared.key);
    usePlaybackTransport.getState().setReady(prepared.key, prepared);
    usePlaybackTransport.getState().seek(13.5);
    const hook = mount();
    await act(async () => hook.result.current.select("streamlines"));
    hook.rerender({ data: wind, range: undefined });
    const seek = vi.spyOn(usePlaybackTransport.getState(), "seek");
    const prepare = vi.spyOn(usePlaybackTransport.getState(), "prepare");
    const ready = vi.spyOn(usePlaybackTransport.getState(), "setReady");

    await act(async () => hook.result.current.select("volume"));
    expect(seek).toHaveBeenCalledWith(13.5);
    expect(prepare).not.toHaveBeenCalled();
    expect(ready).not.toHaveBeenCalled();
    expect(usePlaybackTransport.getState().clip).toBe(prepared);
    expect(usePlaybackTransport.getState().time).toBe(13.5);
    expect(selection()).toMatchObject({
      resultId: "plume",
      frame: 1,
      mode: "volume",
    });
  });

  it("retains one concentration bookmark when the viewer unmounts while displaying its wind", async () => {
    const prepared = clip("plume", "before-navigation");
    usePlaybackTransport.getState().prepare(prepared.key);
    usePlaybackTransport.getState().setReady(prepared.key, prepared);
    usePlaybackTransport.getState().seek(13.5);
    const original = mount();
    await act(async () => original.result.current.select("streamlines"));
    original.unmount();
    const revisited = mount(wind, [0, 100]);
    expect(revisited.result.current.available.volume).toBe(true);
    expect(revisited.result.current.available.iso).toBe(true);
    await act(async () => revisited.result.current.select("volume"));
    expect(selection()).toMatchObject({
      resultId: "plume",
      fieldId: "concentration",
      mode: "volume",
      frame: 1,
    });
    expect(usePlaybackTransport.getState().time).toBe(13.5);
  });

  it.each([{ datasetId: "case:other" }, { resultId: "unrelated-result" }])(
    "clears an unmounted bookmark after a different selection %j",
    async (change) => {
      const original = mount();
      await act(async () => original.result.current.select("streamlines"));
      original.unmount();
      act(() => {
        useWorkspace.getState().set(change);
        useWorkspace.getState().set({
          datasetId: city,
          resultId: "wind",
          fieldId: "velocity",
          mode: "streamlines",
        });
      });
      const revisited = mount(wind);
      expect(revisited.result.current.available.volume).toBe(false);
      expect(revisited.result.current.available.iso).toBe(false);
    },
  );

  it.each(["version", "roi"])(
    "ignores a ready cache with a different %s until the exact requested clip is ready",
    async (property) => {
      const original = clip("plume", "original");
      usePlaybackTransport.getState().prepare(original.key);
      usePlaybackTransport.getState().setReady(original.key, original);
      usePlaybackTransport.getState().seek(13.5);
      const hook = mount();
      await act(async () => hook.result.current.select("streamlines"));
      hook.rerender({ data: wind, range: undefined });
      const other = clip("plume", "other");
      const identity = JSON.parse(other.key);
      if (property === "version") identity.version = "different-version";
      else
        identity.request.roi = [
          [1, 1, 1],
          [2, 2, 2],
        ];
      other.key = JSON.stringify(identity);
      act(() => {
        usePlaybackTransport.getState().prepare(other.key);
        usePlaybackTransport.getState().setReady(other.key, other);
      });
      const seek = vi.spyOn(usePlaybackTransport.getState(), "seek");

      await act(async () => hook.result.current.select("volume"));
      hook.rerender({ data: concentration, range: undefined });
      expect(seek).not.toHaveBeenCalled();
      const exact = clip("plume", "exact");
      await act(async () => {
        usePlaybackTransport.getState().prepare(exact.key);
        usePlaybackTransport.getState().setReady(exact.key, exact);
      });
      expect(seek).toHaveBeenCalledWith(13.5);
      expect(usePlaybackTransport.getState().time).toBe(13.5);
      expect(useWorkspace.getState().frame).toBe(1);
    },
  );

  it("uses a current vector field directly and disables iso without a valid concentration range", async () => {
    useWorkspace
      .getState()
      .set({ resultId: "wind", fieldId: "velocity", mode: "surface" });
    const velocity = mount(wind);
    expect(velocity.result.current.available).toEqual({
      streamlines: true,
      iso: false,
      volume: false,
    });
    await act(async () => velocity.result.current.select("streamlines"));
    expect(selection()).toMatchObject({
      resultId: "wind",
      fieldId: "velocity",
      mode: "streamlines",
    });
    velocity.unmount();
    resetWorkspace();
    const scalar = mount({
      ...concentration,
      fields: [{ id: "concentration" }],
    });
    expect(scalar.result.current.available.iso).toBe(false);
    const before = selection();
    await act(async () => scalar.result.current.select("iso"));
    expect(selection()).toEqual(before);
    expect(api).not.toHaveBeenCalled();
  });
});

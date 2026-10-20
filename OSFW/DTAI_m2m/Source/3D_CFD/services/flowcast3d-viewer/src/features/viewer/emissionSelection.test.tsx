import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../../lib/api";
import { useWorkspace } from "../../stores/workspace";
import type { Dataset } from "../datasets/types";
import { useDisplaySelection } from "./useDisplaySelection";
import { usePlaybackTransport } from "./playbackTransport";
import type { PreparedPlaybackClip } from "./preparedPlayback";
import { playbackSelection } from "./usePreparedPlayback";

vi.mock("../../lib/api", () => ({ api: vi.fn() }));

const dataset: Dataset = {
  id: "case:harbor",
  spaceId: "case:harbor",
  version: "plume-v1",
  fields: [{ id: "concentration", unit: "µg/m3", range: [0, 100] }],
  supportModes: ["volume", "iso"],
  capabilities: { playback: true },
  times: Array.from({ length: 61 }, (_, index) => index),
  timeUnit: "s",
  colorRange: [0, 100],
  provenance: {
    sourceDatasetId: "case:harbor",
    sourceResultId: "saved-wind",
    source: [13.82, 40.63, 5.52],
    windStartFrame: 3,
  },
};
const unsupported =
  "Time-varying wind streamlines are unavailable. Contour and Volume remain available.";
let client: QueryClient;
function Wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
function mount(data: Dataset = dataset) {
  return renderHook(() => useDisplaySelection(data, [0, 100]), {
    wrapper: Wrapper,
  });
}
function prepared(resultId = "saved-concentration"): PreparedPlaybackClip {
  const selection = playbackSelection(dataset, {
    ...useWorkspace.getState(),
    resultId,
  })!;
  return {
    key: selection.key,
    times: dataset.times,
    range: [0, 100],
    bytes: 61 * 40,
    streamlines: {
      kind: "particle-paths",
      positions: new Float32Array([0, 0, 0, 1, 1, 1]),
      times: new Float32Array([0, 60]),
      particleIds: new Uint32Array([0]),
      count: 1,
      source: [13.82, 40.63, 5.52],
      bytes: 24,
    },
    frames: dataset.times.map((time, index) => ({
      index,
      values: new Float32Array(8).fill(index),
      mask: new Uint8Array(8).fill(1),
      asset: {
        kind: "volume",
        format: "float32",
        url: `/frame-${index}.bin`,
        dimensions: [2, 2, 2],
        origin: [0, 0, 0],
        spacing: [1, 1, 1],
      },
      scene: {
        contextKey: `frame-${index}`,
        time,
        origin: [0, 0, 0],
        bounds: [
          [0, 0, 0],
          [2, 2, 2],
        ],
        assets: [],
      },
    })),
  };
}
function ready(clip = prepared()) {
  usePlaybackTransport.getState().prepare(clip.key);
  usePlaybackTransport.getState().setReady(clip.key, clip);
  usePlaybackTransport.getState().seek(15.25);
  return clip;
}
beforeEach(() => {
  client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  usePlaybackTransport.getState().reset();
  useWorkspace.setState(useWorkspace.getInitialState(), true);
  useWorkspace.getState().set({
    datasetId: dataset.id,
    resultId: "saved-concentration",
    fieldId: "concentration",
    frame: 15,
    mode: "volume",
  });
  vi.mocked(api).mockReset();
});
afterEach(() => {
  cleanup();
  client.clear();
  usePlaybackTransport.getState().reset();
  useWorkspace.setState(useWorkspace.getInitialState(), true);
  localStorage.clear();
});

describe("prepared emission display selection", () => {
  it("switches V3 to V1, V2, and V3 without replacing the concentration result or fractional time", async () => {
    const clip = ready();
    const hook = mount();
    expect(hook.result.current.available).toEqual({
      streamlines: true,
      iso: true,
      volume: true,
    });
    for (const mode of ["streamlines", "iso", "volume"] as const) {
      await act(async () => hook.result.current.select(mode));
      expect(useWorkspace.getState()).toMatchObject({
        datasetId: dataset.id,
        resultId: "saved-concentration",
        fieldId: "concentration",
        frame: 15,
        mode,
      });
      expect(usePlaybackTransport.getState()).toMatchObject({
        status: "ready",
        key: clip.key,
        clip,
        time: 15.25,
      });
      expect(playbackSelection(dataset, useWorkspace.getState())?.key).toBe(
        clip.key,
      );
      expect(hook.result.current.value).toBe(mode);
      expect(hook.result.current.error).toBeUndefined();
    }
    expect(api).not.toHaveBeenCalled();
    expect(clip.streamlines?.source).toEqual([13.82, 40.63, 5.52]);
  });

  it("keeps V2 and V3 available and explains a mode-specific V1 preparation failure", async () => {
    const clip = prepared();
    clip.streamlines = undefined;
    clip.streamlineError = unsupported;
    ready(clip);
    const hook = mount();
    expect(hook.result.current.available).toEqual({
      streamlines: false,
      iso: true,
      volume: true,
    });
    expect(hook.result.current.error?.message).toBe(unsupported);
    await act(async () => hook.result.current.select("streamlines"));
    expect(useWorkspace.getState().mode).toBe("volume");
    await act(async () => hook.result.current.select("iso"));
    expect(useWorkspace.getState()).toMatchObject({
      mode: "iso",
      resultId: "saved-concentration",
      frame: 15,
    });
    expect(usePlaybackTransport.getState().time).toBe(15.25);
    await act(async () => hook.result.current.select("volume"));
    expect(useWorkspace.getState().mode).toBe("volume");
    expect(api).not.toHaveBeenCalled();
  });

  it("updates V1 availability when preparation publishes an unsupported result after mount", () => {
    const hook = mount();
    act(() => {
      const clip = prepared();
      clip.streamlines = undefined;
      clip.streamlineError = unsupported;
      usePlaybackTransport.setState({
        key: clip.key,
        clip,
        status: "ready",
        time: 15.25,
      });
    });
    expect(hook.result.current.available.streamlines).toBe(false);
    expect(hook.result.current.available.iso).toBe(true);
    expect(hook.result.current.error?.message).toBe(unsupported);
  });

  it("does not apply another result's retained V1 failure to the current concentration", () => {
    const old = prepared("another-concentration");
    old.streamlines = undefined;
    old.streamlineError = unsupported;
    ready(old);
    const hook = mount();
    expect(hook.result.current.available.streamlines).toBe(true);
    expect(hook.result.current.error).toBeUndefined();
  });

  it("cancels an older wind metadata transition when the selected dataset changes", async () => {
    const legacy = {
      ...dataset,
      provenance: { ...dataset.provenance, source: undefined },
    };
    let resolve!: (value: Dataset) => void;
    vi.mocked(api).mockImplementation(
      () =>
        new Promise<Dataset>((done) => {
          resolve = done;
        }),
    );
    const hook = mount(legacy);
    let transition!: Promise<void>;
    await act(async () => {
      transition = hook.result.current.select("streamlines");
    });
    expect(hook.result.current.pending).toBe(true);
    const requestSignal = vi.mocked(api).mock.calls[0][1]!
      .signal as AbortSignal;
    act(() => {
      useWorkspace.getState().set({
        datasetId: "case:other",
        resultId: "other-concentration",
        frame: 0,
      });
    });
    expect(requestSignal.aborted).toBe(true);
    await act(async () => {
      resolve({
        id: dataset.id,
        fields: [{ id: "velocity", components: 3, unit: "m/s" }],
        supportModes: ["streamlines"],
        times: [0, 1, 2, 3],
      });
      await transition;
    });
    expect(useWorkspace.getState()).toMatchObject({
      datasetId: "case:other",
      resultId: "other-concentration",
      frame: 0,
      mode: "volume",
    });
    expect(hook.result.current.pending).toBe(false);
  });
});

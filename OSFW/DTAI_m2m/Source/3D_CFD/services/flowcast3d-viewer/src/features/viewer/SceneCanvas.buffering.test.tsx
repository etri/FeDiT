import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SceneCanvas } from "./SceneCanvas";
import { SceneLoading } from "./SceneLoading";
import { usePlaybackTransport } from "./playbackTransport";
import type { Scene } from "./types";
import type { PreparedPlaybackClip } from "./preparedPlayback";
import type { PreparedPlaybackState } from "./usePreparedPlayback";

const state = vi.hoisted(() => ({
  progress: 100,
  context: "volume-result-a",
  pending: false,
  fetching: false,
  error: undefined as Error | undefined,
  refetch: vi.fn(),
  field: undefined as Scene | undefined,
}));
const geometry: Scene = {
  contextKey: "city",
  origin: [0, 0, 0],
  bounds: [
    [0, 0, 0],
    [10, 10, 10],
  ],
  assets: [{ kind: "geometry", format: "glb", url: "/city.glb" }],
};
const first: Scene = {
  ...geometry,
  contextKey: "frame-0",
  time: 0,
  assets: [{ kind: "volume", format: "float32", url: "/volume-0.bin" }],
};
const second: Scene = {
  ...first,
  contextKey: "frame-1",
  time: 1,
  assets: [{ kind: "volume", format: "float32", url: "/volume-1.bin" }],
};
vi.mock("./api", () => ({
  useScene: (_dataset: unknown, buildings: boolean, suspended = false) => ({
    data: suspended ? undefined : buildings ? geometry : state.field,
    enabled: !suspended,
    isPending: !buildings && state.pending,
    isFetching: !buildings && state.fetching,
    error: buildings ? undefined : state.error,
    refetch: state.refetch,
    contextKey: buildings ? "geometry" : state.context,
    requestKey: buildings
      ? "geometry"
      : `${state.context}-${state.field?.time}`,
  }),
}));
vi.mock("./loading", async (original) => ({
  ...(await original<typeof import("./loading")>()),
  useSceneProgress: () => ({
    progress: state.progress,
    active: state.progress < 100,
    report: () => {},
  }),
}));
const dataset = {
  id: "city",
  fields: [{ id: "concentration" }],
  times: [0, 1],
};
function layers(node: ReactNode): { scene: Scene; visible: boolean }[] {
  if (!isValidElement(node)) return [];
  const element = node as ReactElement<{
    children?: ReactNode;
    scene?: Scene;
    visible?: boolean;
  }>;
  const current =
    element.props.scene && element.props.visible !== undefined
      ? [{ scene: element.props.scene, visible: element.props.visible }]
      : [];
  return [
    ...current,
    ...Children.toArray(element.props.children).flatMap(layers),
  ];
}
function errorCard(node: ReactNode): ReactNode {
  if (!isValidElement(node)) return null;
  const element = node as ReactElement<{
    className?: string;
    children?: ReactNode;
  }>;
  if (element.props.className === "graphics-failure") return element;
  return (
    Children.toArray(element.props.children).map(errorCard).find(Boolean) ??
    null
  );
}
function loadingCard(node: ReactNode): ReactNode {
  if (!isValidElement(node)) return null;
  const element = node as ReactElement<{ children?: ReactNode }>;
  if (element.type === SceneLoading) return element;
  return (
    Children.toArray(element.props.children).map(loadingCard).find(Boolean) ??
    null
  );
}

beforeEach(() => {
  usePlaybackTransport.getState().reset();
  state.progress = 100;
  state.context = "volume-result-a";
  state.pending = false;
  state.fetching = false;
  state.error = undefined;
  state.refetch.mockReset();
  state.field = first;
  vi.stubGlobal("WebGL2RenderingContext", function () {});
});
afterEach(() => {
  cleanup();
  usePlaybackTransport.getState().reset();
  vi.unstubAllGlobals();
});

describe("frame layer handoff", () => {
  it("shows measurable preparation progress in the scene and retains its failure retry", () => {
    const playback: PreparedPlaybackState = {
      key: "clip-a",
      status: "preparing",
      progress: 40,
      retry: vi.fn(),
    };
    const { result, rerender } = renderHook(() =>
      SceneCanvas({ dataset, preparedPlayback: playback }),
    );
    const loading = render(loadingCard(result.current));
    expect(loading.getByRole("status")).toHaveTextContent(
      "재생 데이터 준비 중",
    );
    expect(
      loading.getByRole("progressbar", { name: "데이터 불러오기 진행률" }),
    ).toHaveAttribute("value", "40");
    state.progress = 60;
    playback.progress = 70;
    rerender();
    loading.rerender(loadingCard(result.current));
    expect(
      loading.getByRole("progressbar", { name: "데이터 불러오기 진행률" }),
    ).toHaveAttribute("value", "70");
    playback.status = "failed";
    playback.error = new Error("Volume frame unavailable.");
    rerender();
    const notice = render(errorCard(result.current));
    expect(notice.getByRole("alert")).toHaveTextContent(
      "Volume frame unavailable.",
    );
    fireEvent.click(
      notice.getByRole("button", { name: "재생 데이터 다시 준비" }),
    );
    expect(playback.retry).toHaveBeenCalledOnce();
  });

  it("waits for the prepared volume's first actual draw and ignores stale ready notifications", () => {
    const clip: PreparedPlaybackClip = {
      key: "clip-a",
      times: [0, 1],
      range: [0, 1],
      bytes: 9,
      frames: [first, second].map((scene, index) => ({
        index,
        scene,
        asset: {
          ...scene.assets[0],
          dimensions: [1, 1, 1],
          spacing: [1, 1, 1],
          origin: [0, 0, 0],
        },
        values: new Float32Array([index]),
        mask: new Uint8Array([1]),
      })),
    };
    function findReady(node: ReactNode): (() => void) | undefined {
      if (!isValidElement(node)) return;
      const element = node as ReactElement<{
        clip?: PreparedPlaybackClip;
        onReady?: () => void;
        children?: ReactNode;
      }>;
      return element.props.clip
        ? element.props.onReady
        : Children.toArray(element.props.children).map(findReady).find(Boolean);
    }
    usePlaybackTransport.getState().prepare(clip.key);
    usePlaybackTransport.getState().setReady(clip.key, clip);
    const onBufferingChange = vi.fn();
    const prepared = {
      key: clip.key,
      clip,
      progress: 100,
      status: "ready" as const,
      retry: vi.fn(),
    };
    const { result, rerender } = renderHook(
      ({ playback }) =>
        SceneCanvas({ dataset, preparedPlayback: playback, onBufferingChange }),
      {
        initialProps: {
          playback: prepared as
            | typeof prepared
            | {
                key: string;
                progress: number;
                status: "preparing";
                retry: () => void;
              },
        },
      },
    );
    expect(onBufferingChange).toHaveBeenLastCalledWith(true);
    expect(usePlaybackTransport.getState().displayReady).toBe(false);
    expect(layers(result.current)).toEqual([]);
    const drawReady = findReady(result.current)!;
    act(() => drawReady());
    expect(onBufferingChange).toHaveBeenLastCalledWith(false);
    expect(usePlaybackTransport.getState().displayReady).toBe(true);
    act(() => usePlaybackTransport.getState().prepare("clip-b"));
    rerender({
      playback: {
        key: "clip-b",
        progress: 0,
        status: "preparing",
        retry: vi.fn(),
      },
    });
    act(() => drawReady());
    expect(onBufferingChange).toHaveBeenLastCalledWith(true);
    expect(usePlaybackTransport.getState()).toMatchObject({
      key: "clip-b",
      displayReady: false,
    });
  });

  it("shows a request error and retries without clearing the ready frame", () => {
    const onBufferingChange = vi.fn();
    const { result, rerender } = renderHook(() =>
      SceneCanvas({ dataset, onBufferingChange }),
    );
    state.field = undefined;
    state.error = new Error("Scene request timed out.");
    rerender();
    expect(layers(result.current)).toEqual([{ scene: first, visible: true }]);
    expect(onBufferingChange).toHaveBeenLastCalledWith(true);
    const notice = render(errorCard(result.current));
    expect(notice.getByRole("alert")).toHaveTextContent(
      "Scene request timed out.",
    );
    fireEvent.click(notice.getByRole("button", { name: "장면 다시 불러오기" }));
    expect(state.refetch).toHaveBeenCalledOnce();
    state.fetching = true;
    rerender();
    notice.rerender(errorCard(result.current));
    expect(
      notice.getByRole("button", { name: "장면 다시 불러오기" }),
    ).toBeDisabled();
    state.error = undefined;
    state.fetching = false;
    state.field = second;
    state.progress = 66;
    rerender();
    const loading = render(loadingCard(result.current));
    expect(
      loading.getByRole("progressbar", { name: "데이터 불러오기 진행률" }),
    ).toHaveAttribute("value", "66");
    expect(layers(result.current)).toEqual([
      { scene: first, visible: true },
      { scene: second, visible: false },
    ]);
    state.progress = 100;
    rerender();
    notice.rerender(errorCard(result.current));
    expect(notice.queryByRole("alert")).not.toBeInTheDocument();
    expect(layers(result.current)).toEqual([{ scene: second, visible: true }]);
    expect(onBufferingChange).toHaveBeenLastCalledWith(false);
  });
  it("keeps the last ready layer until the replacement assets are ready", () => {
    const onBufferingChange = vi.fn();
    const { result, rerender } = renderHook(() =>
      SceneCanvas({ dataset, onBufferingChange }),
    );
    expect(layers(result.current)).toEqual([{ scene: first, visible: true }]);
    state.pending = true;
    state.progress = 0;
    rerender();
    expect(layers(result.current)).toEqual([{ scene: first, visible: true }]);
    expect(onBufferingChange).toHaveBeenLastCalledWith(true);
    state.pending = false;
    state.field = second;
    state.progress = 66;
    rerender();
    expect(layers(result.current)).toEqual([
      { scene: first, visible: true },
      { scene: second, visible: false },
    ]);
    state.progress = 100;
    rerender();
    expect(layers(result.current)).toEqual([{ scene: second, visible: true }]);
    expect(onBufferingChange).toHaveBeenLastCalledWith(false);
  });

  it("removes a retained layer when the result context changes", () => {
    const { result, rerender } = renderHook(() => SceneCanvas({ dataset }));
    expect(layers(result.current)).toHaveLength(1);
    state.context = "volume-result-b";
    state.field = undefined;
    state.pending = true;
    state.progress = 0;
    rerender();
    expect(layers(result.current)).toEqual([]);
  });
});

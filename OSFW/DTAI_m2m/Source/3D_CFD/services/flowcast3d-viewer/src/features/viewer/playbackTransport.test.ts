import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useWorkspace } from "../../stores/workspace";
import { usePlaybackTransport } from "./playbackTransport";
import type { PreparedPlaybackClip } from "./preparedPlayback";

let now = 0,
  nextId = 0;
const callbacks = new Map<number, FrameRequestCallback>();
function frameAt(milliseconds: number) {
  now = milliseconds;
  const pending = [...callbacks.values()];
  callbacks.clear();
  pending.forEach((callback) => callback(now));
}
function clip(key = "first", times = [0, 0.5, 4, 60]): PreparedPlaybackClip {
  return {
    key,
    times,
    range: [0, 1],
    bytes: times.length * 5,
    frames: times.map((time, index) => {
      const asset = {
        kind: "volume" as const,
        format: "float32",
        url: `/frame-${index}`,
        dimensions: [1, 1, 1] as [number, number, number],
      };
      return {
        index,
        asset,
        values: new Float32Array([index]),
        mask: new Uint8Array([1]),
        scene: {
          contextKey: `${index}`,
          origin: [0, 0, 0],
          bounds: [
            [0, 0, 0],
            [1, 1, 1],
          ],
          assets: [asset],
          time,
        },
      };
    }),
  };
}
function ready(value = clip()) {
  const state = usePlaybackTransport.getState();
  state.prepare(value.key);
  state.setReady(value.key, value);
  return usePlaybackTransport.getState();
}

beforeEach(() => {
  now = 0;
  callbacks.clear();
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    callbacks.set(++nextId, callback);
    return nextId;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => callbacks.delete(id));
  vi.spyOn(performance, "now").mockImplementation(() => now);
  vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
  usePlaybackTransport.getState().reset();
  usePlaybackTransport.setState({ speed: 1, repeat: false });
  useWorkspace.setState({ datasetId: "city", resultId: "first", frame: 0 });
});
afterEach(() => {
  usePlaybackTransport.getState().reset();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("continuous playback clock", () => {
  it("keeps replay status scoped to the preparing clip and clears it once ready", () => {
    const state = usePlaybackTransport.getState();
    state.prepare("first");
    state.setProgress("first", 90);
    state.setPreparationStatus("first", "입자 이동 경로 검증 중", true);
    state.setPreparationStatus("stale", "Stale", false);
    expect(usePlaybackTransport.getState()).toMatchObject({
      progress: 90,
      preparationLabel: "입자 이동 경로 검증 중",
      preparationIndeterminate: true,
    });
    state.setReady("first", clip());
    state.setPreparationStatus("first", "Stale", true);
    expect(usePlaybackTransport.getState()).toMatchObject({
      status: "ready",
      preparationIndeterminate: false,
      preparationLabel: undefined,
    });
  });
  it("announces display readiness only for the matching completed clip and clears it across replacement and failure", () => {
    const state = usePlaybackTransport.getState();
    expect(state.displayReady).toBe(false);
    state.prepare("first");
    state.setDisplayReady("first", true);
    expect(usePlaybackTransport.getState().displayReady).toBe(false);
    state.setReady("first", clip());
    expect(usePlaybackTransport.getState().displayReady).toBe(false);
    state.setDisplayReady("stale", true);
    expect(usePlaybackTransport.getState().displayReady).toBe(false);
    state.setDisplayReady("first", true);
    expect(usePlaybackTransport.getState().displayReady).toBe(true);
    state.setDisplayReady("stale", false);
    expect(usePlaybackTransport.getState().displayReady).toBe(true);
    state.prepare("second");
    state.setDisplayReady("first", true);
    expect(usePlaybackTransport.getState().displayReady).toBe(false);
    state.setReady("second", clip("second"));
    state.setDisplayReady("second", true);
    state.setError("second", new Error("GPU preparation failed."));
    expect(usePlaybackTransport.getState()).toMatchObject({
      status: "failed",
      displayReady: false,
    });
    state.setDisplayReady("second", true);
    expect(usePlaybackTransport.getState().displayReady).toBe(false);
    ready();
    state.setDisplayReady("first", true);
    state.reset();
    expect(usePlaybackTransport.getState()).toMatchObject({
      status: "idle",
      displayReady: false,
    });
  });

  it("plays exactly 60 seconds at 1x and preserves fractional time", () => {
    ready().play();
    frameAt(250);
    expect(usePlaybackTransport.getState().time).toBe(0.25);
    expect(useWorkspace.getState().frame).toBe(0);
    frameAt(1250);
    expect(usePlaybackTransport.getState().time).toBe(1.25);
    expect(useWorkspace.getState().frame).toBe(1);
    frameAt(59999);
    expect(usePlaybackTransport.getState().time).toBe(59.999);
    expect(usePlaybackTransport.getState().playing).toBe(true);
    frameAt(60000);
    expect(usePlaybackTransport.getState()).toMatchObject({
      time: 60,
      playing: false,
    });
    expect(useWorkspace.getState().frame).toBe(3);
    expect(callbacks.size).toBe(0);
  });

  it("uses wall time across delayed animation callbacks without accumulated drift", () => {
    ready().play();
    for (const elapsed of [17, 51, 1077, 4001, 27003]) frameAt(elapsed);
    expect(usePlaybackTransport.getState().time).toBe(27.003);
    frameAt(64000);
    expect(usePlaybackTransport.getState()).toMatchObject({
      time: 60,
      playing: false,
    });
  });

  it("updates only the lower-bracket original frame index at boundaries", () => {
    const value = clip();
    value.frames.forEach((frame, index) => {
      frame.index = index + 7;
    });
    ready(value);
    const frames: number[] = [];
    const unsubscribe = useWorkspace.subscribe((state, previous) => {
      if (state.frame !== previous.frame) frames.push(state.frame);
    });
    usePlaybackTransport.getState().play();
    for (const elapsed of [100, 250, 499, 500, 700, 3999, 4000])
      frameAt(elapsed);
    expect(frames).toEqual([8, 9]);
    unsubscribe();
  });

  it("supports fractional seek, exact pause and speed changes", () => {
    ready().seek(0.25);
    usePlaybackTransport.getState().play();
    frameAt(1000);
    usePlaybackTransport.getState().setSpeed(2);
    frameAt(2000);
    expect(usePlaybackTransport.getState().time).toBe(3.25);
    now = 2250;
    usePlaybackTransport.getState().pause();
    expect(usePlaybackTransport.getState().time).toBe(3.75);
    frameAt(5000);
    expect(usePlaybackTransport.getState().time).toBe(3.75);
    usePlaybackTransport.getState().seek(100);
    expect(usePlaybackTransport.getState().time).toBe(60);
    usePlaybackTransport.getState().seek(-5);
    expect(usePlaybackTransport.getState().time).toBe(0);
  });

  it("repeats at the physical duration without a duplicate final-frame delay", () => {
    ready().setRepeat(true);
    usePlaybackTransport.getState().play();
    frameAt(60250);
    expect(usePlaybackTransport.getState()).toMatchObject({
      time: 0.25,
      playing: true,
    });
    frameAt(120500);
    expect(usePlaybackTransport.getState().time).toBe(0.5);
  });

  it("finishes the current lap after disabling repeat", () => {
    ready().setRepeat(true);
    usePlaybackTransport.getState().play();
    frameAt(60250);
    usePlaybackTransport.getState().setRepeat(false);
    frameAt(61000);
    expect(usePlaybackTransport.getState()).toMatchObject({
      time: 1,
      playing: true,
    });
    frameAt(120000);
    expect(usePlaybackTransport.getState()).toMatchObject({
      time: 60,
      playing: false,
    });
  });

  it("ignores stale completions and stale RAF callbacks after a replacement", () => {
    ready().play();
    const stale = [...callbacks.values()][0];
    usePlaybackTransport.getState().prepare("second");
    usePlaybackTransport.getState().setProgress("first", 90);
    usePlaybackTransport.getState().setReady("first", clip());
    usePlaybackTransport
      .getState()
      .setError("first", new Error("Old request failed."));
    usePlaybackTransport.getState().reset("first");
    stale(10000);
    expect(usePlaybackTransport.getState()).toMatchObject({
      key: "second",
      status: "preparing",
      progress: 0,
      time: 0,
      playing: false,
    });
    expect(callbacks.size).toBe(0);
  });

  it("pauses on background visibility and result changes without moving the new frame", () => {
    ready().play();
    frameAt(250);
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    document.dispatchEvent(new Event("visibilitychange"));
    expect(usePlaybackTransport.getState().playing).toBe(false);
    expect(callbacks.size).toBe(0);
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
    usePlaybackTransport.getState().play();
    useWorkspace.setState({ resultId: "second", frame: 12 });
    frameAt(5000);
    expect(usePlaybackTransport.getState().playing).toBe(false);
    expect(useWorkspace.getState().frame).toBe(12);
  });
});

import { create } from "zustand";
import { useWorkspace } from "../../stores/workspace";
import type { PreparedPlaybackClip } from "./preparedPlayback";

interface PlaybackTransport {
  key: string;
  status: "idle" | "preparing" | "ready" | "failed";
  progress: number;
  preparationLabel?: string;
  preparationIndeterminate: boolean;
  displayReady: boolean;
  displayError?: Error;
  error?: Error;
  clip?: PreparedPlaybackClip;
  time: number;
  playing: boolean;
  speed: number;
  repeat: boolean;
  prepare: (key: string) => void;
  setProgress: (key: string, percent: number) => void;
  setPreparationStatus: (
    key: string,
    label: string | undefined,
    indeterminate: boolean,
  ) => void;
  setReady: (key: string, clip: PreparedPlaybackClip) => void;
  setDisplayReady: (key: string, ready: boolean) => void;
  setDisplayError: (key: string, error?: Error) => void;
  setError: (key: string, error: Error) => void;
  reset: (key?: string) => void;
  play: () => void;
  pause: () => void;
  seek: (seconds: number) => void;
  setSpeed: (speed: number) => void;
  setRepeat: (repeat: boolean) => void;
}

let animation: number | undefined;
let generation = 0;
let anchor: { time: number; wall: number } | undefined;
function cancelClock() {
  if (animation !== undefined) cancelAnimationFrame(animation);
  animation = undefined;
  anchor = undefined;
  generation++;
}

function publish(time: number) {
  const clip = usePlaybackTransport.getState().clip;
  if (!clip) return;
  let low = 0,
    high = clip.times.length - 1;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (clip.times[middle] <= time) low = middle;
    else high = middle - 1;
  }
  const index = clip.frames[low].index;
  if (useWorkspace.getState().frame !== index)
    useWorkspace.getState().set({ frame: index });
  usePlaybackTransport.setState({ time });
}

function updateClock(now: number) {
  const state = usePlaybackTransport.getState();
  if (!anchor || !state.playing || !state.clip) return;
  const start = state.clip.times[0];
  const end = state.clip.times.at(-1)!;
  const elapsed = Math.max(0, now - anchor.wall) / 1000;
  const time = anchor.time + elapsed * state.speed;
  if (time >= end && !state.repeat) {
    publish(end);
    cancelClock();
    usePlaybackTransport.setState({ playing: false });
  } else {
    publish(time >= end ? start + ((time - start) % (end - start)) : time);
  }
}

export const usePlaybackTransport = create<PlaybackTransport>((set, get) => ({
  key: "",
  status: "idle",
  progress: 0,
  preparationIndeterminate: false,
  displayReady: false,
  time: 0,
  playing: false,
  speed: 1,
  repeat: false,
  prepare: (key) => {
    cancelClock();
    set({
      key,
      status: "preparing",
      progress: 0,
      preparationLabel: undefined,
      preparationIndeterminate: false,
      displayReady: false,
      displayError: undefined,
      clip: undefined,
      error: undefined,
      time: 0,
      playing: false,
    });
  },
  setProgress: (key, percent) => {
    if (
      get().key === key &&
      get().status === "preparing" &&
      Number.isFinite(percent)
    )
      set({ progress: Math.max(0, Math.min(100, percent)) });
  },
  setReady: (key, clip) => {
    if (get().key !== key || clip.key !== key) return;
    if (
      !clip.times.length ||
      clip.times.length !== clip.frames.length ||
      clip.times.some(
        (time, index) =>
          !Number.isFinite(time) ||
          (index > 0 && time <= clip.times[index - 1]),
      )
    ) {
      get().setError(key, new Error("Invalid playback timeline."));
      return;
    }
    cancelClock();
    set({
      status: "ready",
      progress: 100,
      preparationLabel: undefined,
      preparationIndeterminate: false,
      displayReady: false,
      displayError: undefined,
      clip,
      error: undefined,
      time: clip.times[0],
      playing: false,
    });
    publish(clip.times[0]);
  },
  setDisplayReady: (key, ready) => {
    const current = get();
    if (
      current.key === key &&
      current.status === "ready" &&
      current.clip?.key === key &&
      current.displayReady !== ready
    )
      set({
        displayReady: ready,
        ...(ready ? { displayError: undefined } : {}),
      });
  },
  setPreparationStatus: (key, label, indeterminate) => {
    if (get().key === key && get().status === "preparing")
      set({ preparationLabel: label, preparationIndeterminate: indeterminate });
  },
  setDisplayError: (key, error) => {
    const current = get();
    if (
      current.key === key &&
      current.clip?.key === key &&
      current.displayError !== error
    )
      set({ displayError: error, ...(error ? { displayReady: false } : {}) });
  },
  setError: (key, error) => {
    if (get().key !== key) return;
    cancelClock();
    set({
      status: "failed",
      preparationLabel: undefined,
      preparationIndeterminate: false,
      error,
      clip: undefined,
      playing: false,
      displayReady: false,
    });
  },
  reset: (key) => {
    if (key !== undefined && key !== get().key) return;
    cancelClock();
    set({
      key: "",
      status: "idle",
      preparationLabel: undefined,
      preparationIndeterminate: false,
      progress: 0,
      displayReady: false,
      displayError: undefined,
      clip: undefined,
      error: undefined,
      time: 0,
      playing: false,
    });
  },
  play: () => {
    const state = get();
    if (
      state.playing ||
      state.status !== "ready" ||
      !state.clip ||
      state.clip.times.length < 2 ||
      document.visibilityState === "hidden"
    )
      return;
    cancelClock();
    if (state.time >= state.clip.times.at(-1)!) publish(state.clip.times[0]);
    anchor = { time: get().time, wall: performance.now() };
    const currentGeneration = generation;
    set({ playing: true });
    const tick = (now: number) => {
      if (generation !== currentGeneration || !get().playing) return;
      animation = undefined;
      updateClock(now);
      if (generation === currentGeneration && get().playing)
        animation = requestAnimationFrame(tick);
    };
    animation = requestAnimationFrame(tick);
  },
  pause: () => {
    updateClock(performance.now());
    cancelClock();
    set({ playing: false });
  },
  seek: (seconds) => {
    const { clip, playing } = get();
    if (!clip || !Number.isFinite(seconds)) return;
    cancelClock();
    set({ playing: false });
    const time = Math.max(clip.times[0], Math.min(clip.times.at(-1)!, seconds));
    publish(time);
    if (playing && time < clip.times.at(-1)!) get().play();
  },
  setSpeed: (speed) => {
    if (!Number.isFinite(speed) || speed <= 0) return;
    const playing = get().playing;
    get().pause();
    set({ speed });
    if (playing && get().clip && get().time < get().clip!.times.at(-1)!)
      get().play();
  },
  setRepeat: (repeat) => {
    const playing = get().playing;
    get().pause();
    set({ repeat });
    if (playing && get().clip && get().time < get().clip!.times.at(-1)!)
      get().play();
  },
}));

if (typeof document !== "undefined")
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden")
      usePlaybackTransport.getState().pause();
  });
useWorkspace.subscribe((state, previous) => {
  if (
    state.datasetId !== previous.datasetId ||
    state.resultId !== previous.resultId
  ) {
    cancelClock();
    usePlaybackTransport.setState({ playing: false });
  }
});

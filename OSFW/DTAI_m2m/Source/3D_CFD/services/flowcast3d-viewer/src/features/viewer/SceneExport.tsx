import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useWorkspace } from "../../stores/workspace";
import { download } from "../../lib/utils";
import type { Bounds } from "../datasets/types";
import type { Scene } from "./types";
import type { PreparedPlaybackClip } from "./preparedPlayback";
import { usePlaybackTransport } from "./playbackTransport";
import { SceneExportMenu } from "./SceneExportMenu";
import { createAnimationEncoder } from "./sceneExportEncoders";
import { getSceneCrop } from "./sceneExportCrop";
import { checkExport, exportTimeline, pngBlob } from "./sceneExport";
import type {
  SceneExportSession,
  SceneExportFormat,
  SceneExportRenderer as Renderer,
} from "./sceneExport";

type BridgeRef = RefObject<Renderer | null>;

export function SceneExport({
  bridge,
  disabled,
  animated,
  context,
}: {
  bridge: BridgeRef;
  disabled: boolean;
  animated: boolean;
  context: string;
}) {
  const running = useRef<AbortController | undefined>(undefined);
  const [busy, setBusy] = useState<{
    format: SceneExportFormat;
    progress: number;
  }>();
  const [error, setError] = useState<string>();
  useEffect(() => {
    const stop = () => running.current?.abort();
    const hidden = () => {
      if (document.hidden) stop();
    };
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("flowcast:graphics-lost", stop);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("flowcast:graphics-lost", stop);
    };
  }, [context]);
  const save = async (format: SceneExportFormat) => {
    if (
      running.current ||
      disabled ||
      !bridge.current ||
      (format !== "png" && !animated)
    )
      return;
    const controller = new AbortController();
    running.current = controller;
    setError(undefined);
    setBusy({ format, progress: 0 });
    const prior = usePlaybackTransport.getState();
    const selected = useWorkspace.getState();
    prior.pause();
    const time = usePlaybackTransport.getState().time;
    const unsubscribe = useWorkspace.subscribe((next) => {
      if (
        next.datasetId !== selected.datasetId ||
        next.resultId !== selected.resultId ||
        next.mode !== selected.mode ||
        next.cameraRevision !== selected.cameraRevision ||
        next.roi !== selected.roi ||
        next.opacity !== selected.opacity ||
        next.threshold !== selected.threshold ||
        next.valueRange !== selected.valueRange ||
        next.wireframe !== selected.wireframe ||
        next.showGrid !== selected.showGrid ||
        next.showBounds !== selected.showBounds
      )
        controller.abort();
    });
    let session: ReturnType<Renderer["open"]> | undefined;
    let encoder: Awaited<ReturnType<typeof createAnimationEncoder>> | undefined;
    try {
      session = bridge.current.open(format);
      let blob: Blob;
      if (format === "png") {
        blob = await pngBlob(
          await session.frame(prior.clip ? time : undefined, controller.signal),
          controller.signal,
        );
      } else {
        if (!prior.clip || prior.status !== "ready" || !prior.displayReady)
          throw new Error(
            "Prepared prediction playback is required for animation export.",
          );
        const fps = format === "gif" ? 10 : 20;
        const frames = exportTimeline(
          prior.clip.times[0],
          prior.clip.times.at(-1)!,
          fps,
        );
        encoder = await createAnimationEncoder(
          format,
          session.width,
          session.height,
          fps,
          controller.signal,
        );
        for (let index = 0; index < frames.length; index++) {
          checkExport(controller.signal);
          const frame = frames[index];
          const image = await session.frame(frame.time, controller.signal);
          await encoder.addFrame(image, frame.timestamp, frame.duration);
          setBusy({
            format,
            progress: Math.round(((index + 1) / frames.length) * 99),
          });
        }
        blob = await encoder.finish();
      }
      checkExport(controller.signal);
      download(
        `flowcast3d-${selected.mode}-${new Date().toISOString().replace(/[:.]/g, "-")}.${format}`,
        blob,
        blob.type,
      );
    } catch (reason) {
      if (!controller.signal.aborted)
        setError(
          reason instanceof Error ? reason.message : "Scene export failed.",
        );
    } finally {
      encoder?.dispose();
      session?.close();
      unsubscribe();
      const current = usePlaybackTransport.getState();
      const workspace = useWorkspace.getState();
      if (
        current.key === prior.key &&
        current.clip === prior.clip &&
        workspace.datasetId === selected.datasetId &&
        workspace.resultId === selected.resultId
      ) {
        current.seek(time);
        if (
          prior.playing &&
          document.visibilityState !== "hidden" &&
          current.displayReady &&
          !current.displayError &&
          workspace.mode === selected.mode &&
          workspace.cameraRevision === selected.cameraRevision
        )
          current.play();
      }
      if (running.current === controller) {
        running.current = undefined;
        setBusy(undefined);
      }
    }
  };
  return (
    <SceneExportMenu
      disabled={disabled}
      animated={animated}
      busy={busy}
      error={error}
      onExport={(format) => {
        void save(format);
      }}
      onCancel={() => running.current?.abort()}
    />
  );
}

// 현재 합성 프레임을 복사한 뒤 표시용 라벨과 범례만 덧그림
function drawLabels(
  context: CanvasRenderingContext2D,
  host: HTMLElement,
  source: HTMLCanvasElement,
  crop: { x: number; y: number; width: number; height: number },
  width: number,
  height: number,
  time?: number,
) {
  const rect = source.getBoundingClientRect();
  const sx = source.width / rect.width,
    sy = source.height / rect.height;
  const scale = width / crop.width;
  context.save();
  context.scale(scale, scale);
  context.translate(-crop.x, -crop.y);
  context.font = `${12 * sx}px sans-serif`;
  context.textBaseline = "middle";
  for (const label of host.querySelectorAll<HTMLElement>(
    ".source-marker-label, .source-preview-label, .probe-label",
  )) {
    const box = label.getBoundingClientRect();
    const x = (box.x - rect.x) * sx,
      y = (box.y - rect.y) * sy;
    if (
      x + box.width * sx < crop.x ||
      x > crop.x + crop.width ||
      y + box.height * sy < crop.y ||
      y > crop.y + crop.height
    )
      continue;
    const leader = label.parentElement?.querySelector<HTMLElement>(
      ".source-position-leader",
    );
    if (leader) {
      const line = leader.getBoundingClientRect();
      context.strokeStyle = "#ef4444";
      context.lineWidth = sx;
      context.setLineDash([3 * sx, 3 * sx]);
      context.beginPath();
      context.moveTo((line.x - rect.x) * sx, (line.y - rect.y) * sy);
      context.lineTo((line.x - rect.x) * sx, (line.bottom - rect.y) * sy);
      context.stroke();
      context.setLineDash([]);
    }
    context.fillStyle = "#fffffff0";
    context.fillRect(x, y, box.width * sx, box.height * sy);
    context.fillStyle = label.classList.contains("probe-label")
      ? "#2556e8"
      : "#ef4444";
    const style = getComputedStyle(label);
    context.font = `${style.fontWeight} ${parseFloat(style.fontSize) * sx}px ${style.fontFamily}`;
    context.fillText(
      label.textContent ?? "",
      x + 7 * sx,
      y + (box.height * sy) / 2,
      Math.max(1, box.width * sx - 14 * sx),
    );
  }
  context.restore();
  const legend = host.querySelector<HTMLElement>(".scalar-legend");
  if (legend) {
    const pad = 12,
      w = Math.min(250, width - pad * 2),
      h = 66;
    if (w > 90 && height > 110) {
      const x = pad,
        y = height - h - pad;
      context.fillStyle = "#fffffff0";
      context.fillRect(x, y, w, h);
      context.fillStyle = "#526986";
      context.font = "12px sans-serif";
      context.textBaseline = "top";
      const rows = legend.querySelectorAll("div");
      context.fillText(
        rows[0]?.querySelector("b")?.textContent ?? "",
        x + 8,
        y + 8,
        w - 80,
      );
      context.textAlign = "right";
      context.fillText(
        rows[0]?.querySelector("span")?.textContent ?? "",
        x + w - 8,
        y + 8,
      );
      context.textAlign = "left";
      const gradient = context.createLinearGradient(x + 8, y, x + w - 8, y);
      const colors = legend.classList.contains("contour-legend")
        ? ["#c70ffa", "#ff1478", "#ff6b0f", "#ffd114", "#ff1f2e"]
        : legend.classList.contains("concentration-legend")
          ? ["#3b82f6", "#21d4ed", "#4ade80", "#fce047", "#f04545"]
          : ["#0000ff", "#7777ff", "#ffbbbb", "#ff4400"];
      colors.forEach((color, index) =>
        gradient.addColorStop(index / (colors.length - 1), color),
      );
      context.fillStyle = gradient;
      context.fillRect(x + 8, y + 30, w - 16, 5);
      context.fillStyle = "#526986";
      context.fillText(
        rows[1]?.firstElementChild?.textContent ?? "",
        x + 8,
        y + 43,
      );
      context.textAlign = "right";
      context.fillText(
        rows[1]?.lastElementChild?.textContent ?? "",
        x + w - 8,
        y + 43,
      );
      context.textAlign = "left";
    }
  }
  if (time !== undefined) {
    context.font = "13px sans-serif";
    context.textBaseline = "top";
    const text = `t = ${Number(time.toFixed(2))} s`;
    context.fillStyle = "#fffffff0";
    context.fillRect(12, 12, context.measureText(text).width + 16, 28);
    context.fillStyle = "#304b72";
    context.fillText(text, 20, 19);
  }
}

export function SceneExportRenderer({
  bridge,
  host,
  source,
  bounds,
  clip,
}: {
  bridge: BridgeRef;
  host: RefObject<HTMLDivElement | null>;
  source: Scene;
  bounds: Bounds;
  clip?: PreparedPlaybackClip;
}) {
  const { gl, scene, camera, controls, invalidate } = useThree();
  const activeSession = useRef<SceneExportSession | undefined>(undefined);
  const pending = useRef<
    | { time?: number; copy: () => void; fail: (reason: unknown) => void }
    | undefined
  >(undefined);
  useFrame(() => {
    const request = pending.current;
    if (!request) return;
    if (
      request.time !== undefined &&
      clip &&
      Number(host.current?.dataset.renderedTime) !== request.time
    ) {
      invalidate();
      return;
    }
    pending.current = undefined;
    try {
      request.copy();
    } catch (reason) {
      request.fail(reason);
    }
  }, 3);
  useLayoutEffect(() => {
    const renderer: Renderer = {
      open: (format) => {
        if (activeSession.current)
          throw new Error("Scene capture is already active.");
        const canvas = gl.domElement;
        const root = host.current;
        if (!root || !canvas.width || !canvas.height)
          throw new Error("Scene capture is unavailable.");
        const original = { width: canvas.width, height: canvas.height };
        const orbit = controls as { enabled: boolean } | null;
        const enabled = orbit?.enabled;
        camera.updateMatrixWorld();
        const cameraMatrix = camera.matrixWorld.clone();
        const cameraProjection = camera.projectionMatrix.clone();
        const crop = getSceneCrop(scene, camera, canvas.width, canvas.height, {
          bounds,
          origin: source.origin,
          clip:
            format === "png" &&
            useWorkspace.getState().mode !== "streamlines" &&
            clip
              ? { ...clip, streamlines: undefined }
              : clip,
          time:
            format === "png" ? usePlaybackTransport.getState().time : undefined,
        });
        const rect = canvas.getBoundingClientRect();
        for (const label of root.querySelectorAll<HTMLElement>(
          ".source-marker-label, .source-preview-label, .probe-label",
        )) {
          const box = label.getBoundingClientRect();
          if (
            box.width &&
            box.height &&
            box.right >= rect.left &&
            box.left <= rect.right &&
            box.bottom >= rect.top &&
            box.top <= rect.bottom
          ) {
            const x = Math.max(
              0,
              Math.min(
                crop.x,
                ((box.left - rect.left - 8) * canvas.width) / rect.width,
              ),
            );
            const y = Math.max(
              0,
              Math.min(
                crop.y,
                ((box.top - rect.top - 8) * canvas.height) / rect.height,
              ),
            );
            crop.width =
              Math.min(
                canvas.width,
                Math.max(
                  crop.x + crop.width,
                  ((box.right - rect.left + 8) * canvas.width) / rect.width,
                ),
              ) - x;
            crop.height =
              Math.min(
                canvas.height,
                Math.max(
                  crop.y + crop.height,
                  ((box.bottom - rect.top + 8) * canvas.height) / rect.height,
                ),
              ) - y;
            crop.x = x;
            crop.y = y;
          }
        }
        const ratio = Math.min(
          1,
          (format === "png" ? 2048 : format === "gif" ? 720 : 1280) /
            Math.max(crop.width, crop.height),
        );
        const output = document.createElement("canvas");
        output.width = Math.max(2, Math.floor((crop.width * ratio) / 2) * 2);
        output.height = Math.max(2, Math.floor((crop.height * ratio) / 2) * 2);
        const context = output.getContext("2d", {
          willReadFrequently: format === "gif",
        });
        if (!context) {
          if (orbit && enabled !== undefined) orbit.enabled = enabled;
          throw new Error("Canvas capture is unavailable.");
        }
        if (orbit) orbit.enabled = false;
        let closed = false;
        const session: SceneExportSession = {
          width: output.width,
          height: output.height,
          frame: (time, signal) => {
            checkExport(signal);
            if (closed || pending.current)
              return Promise.reject(
                new Error("Scene capture is already active or closed."),
              );
            if (
              canvas.width !== original.width ||
              canvas.height !== original.height
            )
              return Promise.reject(
                new Error("Viewport changed during export. Please retry."),
              );
            return new Promise<HTMLCanvasElement>((resolve, reject) => {
              const cleanup = () => {
                clearTimeout(timer);
                signal.removeEventListener("abort", cancel);
              };
              const fail = (reason: unknown) => {
                pending.current = undefined;
                cleanup();
                reject(reason);
              };
              const cancel = () =>
                fail(
                  new DOMException("Scene export was cancelled.", "AbortError"),
                );
              signal.addEventListener("abort", cancel, { once: true });
              const timer = setTimeout(
                () =>
                  fail(new Error("Scene capture timed out after 30 seconds.")),
                30_000,
              );
              pending.current = {
                time,
                fail,
                copy: () => {
                  cleanup();
                  checkExport(signal);
                  if (
                    canvas.width !== original.width ||
                    canvas.height !== original.height
                  )
                    throw new Error(
                      "Viewport changed during export. Please retry.",
                    );
                  if (
                    !camera.matrixWorld.equals(cameraMatrix) ||
                    !camera.projectionMatrix.equals(cameraProjection)
                  )
                    throw new Error(
                      "Camera changed during export. Please retry after camera movement stops.",
                    );
                  context.clearRect(0, 0, output.width, output.height);
                  context.drawImage(
                    canvas,
                    crop.x,
                    crop.y,
                    crop.width,
                    crop.height,
                    0,
                    0,
                    output.width,
                    output.height,
                  );
                  drawLabels(
                    context,
                    root,
                    canvas,
                    crop,
                    output.width,
                    output.height,
                    time,
                  );
                  resolve(output);
                },
              };
              if (time !== undefined)
                usePlaybackTransport.getState().seek(time);
              invalidate();
            });
          },
          close: () => {
            if (closed) return;
            closed = true;
            if (activeSession.current === session)
              activeSession.current = undefined;
            pending.current?.fail(
              new DOMException("Scene export was cancelled.", "AbortError"),
            );
            if (orbit && enabled !== undefined) orbit.enabled = enabled;
            invalidate();
          },
        };
        activeSession.current = session;
        return session;
      },
    };
    bridge.current = renderer;
    return () => {
      if (bridge.current === renderer) bridge.current = null;
      activeSession.current?.close();
      pending.current?.fail(
        new DOMException("Scene export was cancelled.", "AbortError"),
      );
    };
  }, [
    bridge,
    host,
    gl,
    scene,
    camera,
    controls,
    invalidate,
    source.origin,
    bounds,
    clip,
  ]);
  return null;
}

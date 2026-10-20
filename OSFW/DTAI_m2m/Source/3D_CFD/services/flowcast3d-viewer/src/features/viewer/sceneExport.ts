export type SceneExportFormat = "png" | "gif" | "mp4";
export interface SceneExportSession {
  width: number;
  height: number;
  frame: (
    time: number | undefined,
    signal: AbortSignal,
  ) => Promise<HTMLCanvasElement>;
  close: () => void;
}
export interface SceneExportRenderer {
  open: (format: SceneExportFormat) => SceneExportSession;
}

// 인코딩 시간과 무관하게 원래 예측 구간의 길이를 유지
export function exportTimeline(start: number, end: number, fps: number) {
  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    end <= start ||
    !Number.isFinite(fps) ||
    fps <= 0 ||
    fps > 60
  )
    throw new Error("Invalid export timeline.");
  const duration = Math.round((end - start) * 1_000_000);
  const count = Math.ceil((end - start) * fps);
  if (count < 2 || count > 7200 || duration > 360_000_000)
    throw new Error(
      "Animation export supports up to 6 minutes and 7200 frames.",
    );
  return Array.from({ length: count }, (_, index) => {
    const timestamp = Math.round((index * duration) / count);
    return {
      time: start + (index / (count - 1)) * (end - start),
      timestamp,
      duration: Math.round(((index + 1) * duration) / count) - timestamp,
    };
  });
}
export function checkExport(signal: AbortSignal) {
  if (signal.aborted)
    throw new DOMException("Scene export was cancelled.", "AbortError");
}
export function pngBlob(
  canvas: HTMLCanvasElement,
  signal: AbortSignal,
): Promise<Blob> {
  checkExport(signal);
  return new Promise((resolve, reject) => {
    const cancel = () =>
      reject(new DOMException("Scene export was cancelled.", "AbortError"));
    signal.addEventListener("abort", cancel, { once: true });
    canvas.toBlob((blob) => {
      signal.removeEventListener("abort", cancel);
      if (signal.aborted) cancel();
      else if (blob) resolve(blob);
      else reject(new Error("PNG encoding failed."));
    }, "image/png");
  });
}

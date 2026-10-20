import { describe, expect, it, vi } from "vitest";
import { exportTimeline, pngBlob } from "./sceneExport";

describe("scene export timeline", () => {
  it.each([10, 20])(
    "keeps the full 60-second range and encoded duration at %i fps",
    (fps) => {
      const frames = exportTimeline(0, 60, fps);
      expect(frames).toHaveLength(60 * fps);
      expect(frames[0]).toEqual({
        time: 0,
        timestamp: 0,
        duration: 1_000_000 / fps,
      });
      expect(frames.at(-1)?.time).toBe(60);
      expect(frames.reduce((sum, frame) => sum + frame.duration, 0)).toBe(
        60_000_000,
      );
      frames
        .slice(1)
        .forEach((frame, index) =>
          expect(frame.timestamp).toBe(
            frames[index].timestamp + frames[index].duration,
          ),
        );
    },
  );
  it("uses absolute simulation seconds and relative file timestamps", () => {
    const frames = exportTimeline(12, 13.13, 20);
    expect(frames[0].time).toBe(12);
    expect(frames.at(-1)?.time).toBe(13.13);
    expect(frames.reduce((sum, frame) => sum + frame.duration, 0)).toBe(
      1_130_000,
    );
  });
  it.each([
    [0, 0, 20],
    [0, Infinity, 20],
    [0, 400, 20],
    [0, 60, 100],
    [0, 0.001, 20],
  ])("rejects invalid or oversized range %j", (start, end, fps) => {
    expect(() => exportTimeline(start, end, fps)).toThrow();
  });
});
describe("PNG capture", () => {
  it("rejects cancellation before the asynchronous blob arrives", async () => {
    let complete!: BlobCallback;
    const canvas = {
      toBlob: vi.fn((callback) => {
        complete = callback;
      }),
    } as unknown as HTMLCanvasElement;
    const controller = new AbortController();
    const pending = pngBlob(canvas, controller.signal);
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    complete(new Blob(["late PNG"]));
  });
  it("reports failed PNG encoding instead of downloading an empty file", async () => {
    const canvas = {
      toBlob: (callback: BlobCallback) => callback(null),
    } as HTMLCanvasElement;
    await expect(pngBlob(canvas, new AbortController().signal)).rejects.toThrow(
      "PNG encoding failed.",
    );
  });
});

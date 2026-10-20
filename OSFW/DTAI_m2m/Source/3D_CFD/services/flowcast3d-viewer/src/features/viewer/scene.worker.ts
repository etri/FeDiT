import { decodePoints } from "./decode";
self.onmessage = (
  event: MessageEvent<{
    contextKey: string;
    buffer: ArrayBuffer;
    range: [number, number];
  }>,
) => {
  try {
    const points = decodePoints(event.data.buffer, event.data.range);
    self.postMessage(
      { contextKey: event.data.contextKey, ...points },
      {
        transfer: [
          points.positions.buffer,
          points.colors.buffer,
          points.values.buffer,
        ],
      },
    );
  } catch (error) {
    self.postMessage({
      contextKey: event.data.contextKey,
      error: error instanceof Error ? error.message : "Scene decode failed",
    });
  }
};

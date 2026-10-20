import type { PointBuffers } from "./types";
export const POINT_BUDGET = 500_000;
export const ASSET_BUDGET = 128 * 1024 * 1024;
export function decodePoints(
  buffer: ArrayBuffer,
  range: [number, number],
): PointBuffers {
  if (buffer.byteLength > ASSET_BUDGET || buffer.byteLength % 16)
    throw new Error("Invalid or oversized scene asset");
  const source = new Float32Array(buffer),
    count = source.length / 4;
  if (count > POINT_BUDGET) throw new Error("Scene point budget exceeded");
  const positions = new Float32Array(count * 3),
    colors = new Float32Array(count * 3),
    values = new Float32Array(count);
  const spread = range[1] - range[0] || 1;
  for (let index = 0; index < count; index++) {
    const value = source[index * 4 + 3];
    if (
      ![
        source[index * 4],
        source[index * 4 + 1],
        source[index * 4 + 2],
        value,
      ].every(Number.isFinite)
    )
      throw new Error("Non-finite scene sample");
    positions.set(source.subarray(index * 4, index * 4 + 3), index * 3);
    values[index] = value;
    const t = Math.max(0, Math.min(1, (value - range[0]) / spread));
    colors.set(
      [
        Math.min(1, 2 * t),
        0.25 + 0.55 * (1 - Math.abs(2 * t - 1)),
        Math.min(1, 2 * (1 - t)),
      ],
      index * 3,
    );
  }
  return { positions, colors, values };
}
export async function boundedAsset(
  url: string,
  signal: AbortSignal,
  budget = ASSET_BUDGET,
  onProgress?: (received: number, total?: number) => void,
) {
  if (!url.startsWith("/app-api/assets/") || url.includes(".."))
    throw new Error("Invalid scene asset URL");
  const response = await fetch(url, { signal, credentials: "same-origin" });
  if (!response.ok || !response.body)
    throw new Error(`Scene asset unavailable (${response.status})`);
  const declared = Number(response.headers.get("Content-Length"));
  const length =
    Number.isFinite(declared) && declared > 0 ? declared : undefined;
  if (length && length > budget) throw new Error("Scene asset budget exceeded");
  const reader = response.body.getReader(),
    chunks: Uint8Array[] = [];
  let size = 0;
  onProgress?.(0, length);
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > budget) throw new Error("Scene asset budget exceeded");
      chunks.push(value);
      onProgress?.(size, length);
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
  const result = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  onProgress?.(size, size);
  return result.buffer;
}

import { afterEach, describe, expect, it, vi } from "vitest";
import { boundedAsset } from "./decode";

const url = "/app-api/assets/points.bin";

function streamedResponse(length?: number) {
  let controller!: ReadableStreamDefaultController<Uint8Array>;
  const body = new ReadableStream<Uint8Array>({
    start(value) {
      controller = value;
    },
  });
  const response = new Response(body, {
    headers: length === undefined ? {} : { "Content-Length": String(length) },
  });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));
  return controller;
}

async function readNextChunk() {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

afterEach(() => vi.unstubAllGlobals());

describe("scene asset download progress", () => {
  it("reports received bytes as delayed chunks arrive", async () => {
    const stream = streamedResponse(8),
      report = vi.fn();
    const result = boundedAsset(url, new AbortController().signal, 16, report);
    stream.enqueue(new Uint8Array([1, 2, 3]));
    await readNextChunk();
    expect(report).toHaveBeenCalledWith(3, 8);
    expect(report).not.toHaveBeenCalledWith(8, 8);
    stream.enqueue(new Uint8Array([4, 5, 6, 7, 8]));
    stream.close();
    expect([...new Uint8Array(await result)]).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(report).toHaveBeenLastCalledWith(8, 8);
  });

  it("keeps the total unknown until a lengthless response finishes", async () => {
    const stream = streamedResponse(),
      report = vi.fn();
    const result = boundedAsset(url, new AbortController().signal, 16, report);
    stream.enqueue(new Uint8Array([1, 2, 3]));
    await readNextChunk();
    expect(report).toHaveBeenCalledWith(3, undefined);
    stream.enqueue(new Uint8Array([4, 5]));
    stream.close();
    await result;
    expect(report).toHaveBeenLastCalledWith(5, 5);
  });

  it("rejects excess bytes without reporting successful completion", async () => {
    const stream = streamedResponse(),
      report = vi.fn();
    const result = boundedAsset(url, new AbortController().signal, 4, report);
    const rejected = expect(result).rejects.toThrow("budget");
    stream.enqueue(new Uint8Array([1, 2, 3]));
    await readNextChunk();
    stream.enqueue(new Uint8Array([4, 5]));
    await rejected;
    expect(report).not.toHaveBeenCalledWith(5, 5);
  });

  it("preserves abort errors without reporting completion", async () => {
    const stream = streamedResponse(8),
      abort = new AbortController(),
      report = vi.fn();
    abort.signal.addEventListener("abort", () =>
      stream.error(new DOMException("Request aborted", "AbortError")),
    );
    const result = boundedAsset(url, abort.signal, 16, report);
    const rejected = expect(result).rejects.toMatchObject({
      name: "AbortError",
    });
    stream.enqueue(new Uint8Array([1, 2, 3]));
    await readNextChunk();
    abort.abort();
    await rejected;
    expect(report).not.toHaveBeenCalledWith(8, 8);
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { createAnimationEncoder } from "./sceneExportEncoders";

function canvas(width: number, height: number, pixels: number[]) {
  return {
    width,
    height,
    getContext: () => ({
      getImageData: () => ({ data: Uint8ClampedArray.from(pixels) }),
    }),
  } as unknown as HTMLCanvasElement;
}
async function bytes(blob: Blob) {
  return new Uint8Array(
    await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(blob);
    }),
  );
}
function decodeGif(data: Uint8Array) {
  let offset = 6;
  const word = () => data[offset++] | (data[offset++] << 8);
  const width = word();
  const height = word();
  const packed = data[offset++];
  offset += 2;
  const palette = data.slice(offset, offset + 3 * (2 << (packed & 7)));
  offset += palette.length;
  const screen = new Uint8Array(width * height);
  const result: { delay: number; pixels: Uint8Array; rectangle: number[] }[] =
    [];
  let delay = 0;
  while (offset < data.length) {
    const marker = data[offset++];
    if (marker === 0x3b) break;
    if (marker === 0x21) {
      const label = data[offset++];
      if (label === 0xf9) {
        offset += 2;
        delay = word();
        offset += 2;
      } else {
        for (let count = data[offset++]; count; count = data[offset++])
          offset += count;
      }
      continue;
    }
    if (marker !== 0x2c) throw new Error("Invalid GIF image marker");
    const x = word();
    const y = word();
    const frameWidth = word();
    const frameHeight = word();
    offset++;
    const minimum = data[offset++];
    const compressed: number[] = [];
    for (let count = data[offset++]; count; count = data[offset++])
      for (let index = 0; index < count; index++)
        compressed.push(data[offset++]);
    let bit = 0;
    let size = minimum + 1;
    let dictionary: number[][] = [];
    let previous: number[] | undefined;
    const output: number[] = [];
    const clear = 1 << minimum;
    const read = () => {
      let value = 0;
      for (let index = 0; index < size; index++, bit++)
        value |= ((compressed[bit >>> 3] >>> (bit & 7)) & 1) << index;
      return value;
    };
    for (let guard = 0; guard < frameWidth * frameHeight * 2 + 100; guard++) {
      const code = read();
      if (code === clear) {
        dictionary = Array.from({ length: clear + 2 }, (_, index) => [index]);
        previous = undefined;
        size = minimum + 1;
        continue;
      }
      if (code === clear + 1) break;
      const entry =
        dictionary[code] ?? (previous && [...previous, previous[0]]);
      if (!entry || code > dictionary.length)
        throw new Error("Invalid GIF code");
      output.push(...entry);
      if (previous) {
        dictionary.push([...previous, entry[0]]);
        if (dictionary.length === 1 << size && size < 12) size++;
      }
      previous = entry;
    }
    if (output.length !== frameWidth * frameHeight)
      throw new Error("Invalid GIF frame length");
    output.forEach((pixel, index) => {
      screen[
        (y + Math.floor(index / frameWidth)) * width + x + (index % frameWidth)
      ] = pixel;
    });
    result.push({
      delay,
      pixels: screen.slice(),
      rectangle: [x, y, frameWidth, frameHeight],
    });
  }
  return { palette, frames: result, width, height };
}
const rgba = (red: number, green: number, blue: number) => [
  red,
  green,
  blue,
  255,
];
afterEach(() => vi.unstubAllGlobals());

describe("deterministic scene animation encoders", () => {
  it("writes decodable GIF frames with cropped updates and exact timeline duration", async () => {
    const encoder = await createAnimationEncoder(
      "gif",
      2,
      2,
      20,
      new AbortController().signal,
    );
    const red = rgba(255, 0, 0);
    const blue = rgba(0, 0, 255);
    await encoder.addFrame(
      canvas(2, 2, [...red, ...red, ...red, ...red]),
      0,
      50000,
    );
    await encoder.addFrame(
      canvas(2, 2, [...red, ...red, ...red, ...blue]),
      50000,
      50000,
    );
    await encoder.addFrame(
      canvas(2, 2, [...red, ...red, ...red, ...blue]),
      100000,
      50000,
    );
    const blob = await encoder.finish();
    const data = await bytes(blob);
    expect(blob.type).toBe("image/gif");
    expect(new TextDecoder().decode(data.slice(0, 6))).toBe("GIF89a");
    const decoded = decodeGif(data);
    expect(decoded.frames.map((frame) => frame.delay)).toEqual([5, 5, 5]);
    expect(decoded.frames.map((frame) => frame.rectangle)).toEqual([
      [0, 0, 2, 2],
      [1, 1, 1, 1],
      [0, 0, 1, 1],
    ]);
    expect([...decoded.frames[0].pixels]).toEqual([224, 224, 224, 224]);
    expect([...decoded.frames[1].pixels]).toEqual([224, 224, 224, 3]);
    expect([...decoded.frames[2].pixels]).toEqual([224, 224, 224, 3]);
    await expect(encoder.finish()).rejects.toThrow("closed");
  });

  it("keeps LZW data correct across dictionary width changes and resets", async () => {
    const width = 240;
    const height = 180;
    let seed = 9127;
    const pixels: number[] = [];
    const expected: number[] = [];
    for (let index = 0; index < width * height; index++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const value = seed >>> 24;
      const red = Math.round(((value >>> 5) * 255) / 7);
      const green = Math.round((((value >>> 2) & 7) * 255) / 7);
      const blue = Math.round(((value & 3) * 255) / 3);
      pixels.push(...rgba(red, green, blue));
      expected.push(value);
    }
    const encoder = await createAnimationEncoder(
      "gif",
      width,
      height,
      20,
      new AbortController().signal,
    );
    await encoder.addFrame(canvas(width, height, pixels), 0, 50000);
    const decoded = decodeGif(await bytes(await encoder.finish()));
    expect([...decoded.frames[0].pixels]).toEqual(expected);
  });

  it("quantizes GIF delays against cumulative timestamps without cumulative drift", async () => {
    const encoder = await createAnimationEncoder(
      "gif",
      1,
      1,
      30,
      new AbortController().signal,
    );
    for (let index = 0; index < 30; index++) {
      const start = Math.round((index * 1000000) / 30);
      const end = Math.round(((index + 1) * 1000000) / 30);
      await encoder.addFrame(
        canvas(1, 1, rgba(255, 255, 255)),
        start,
        end - start,
      );
    }
    const decoded = decodeGif(await bytes(await encoder.finish()));
    expect(decoded.frames.reduce((sum, frame) => sum + frame.delay, 0)).toBe(
      100,
    );
  });

  it("rejects invalid sizes, dimensions, timing and empty exports", async () => {
    const signal = new AbortController().signal;
    await expect(
      createAnimationEncoder("gif", 4096, 4096, 20, signal),
    ).rejects.toThrow("dimensions");
    const encoder = await createAnimationEncoder("gif", 1, 1, 20, signal);
    await expect(encoder.finish()).rejects.toThrow("no completed frames");
    await expect(
      encoder.addFrame(canvas(1, 1, rgba(0, 0, 0)), 50000, 50000),
    ).rejects.toThrow("timing");
    await expect(encoder.addFrame(canvas(2, 1, []), 0, 50000)).rejects.toThrow(
      "dimensions changed",
    );
    encoder.dispose();
  });

  it("cancels GIF work at a task boundary and releases the encoder", async () => {
    const controller = new AbortController();
    const encoder = await createAnimationEncoder(
      "gif",
      128,
      128,
      20,
      controller.signal,
    );
    const work = encoder.addFrame(
      canvas(128, 128, Array(128 * 128 * 4).fill(255)),
      0,
      50000,
    );
    controller.abort();
    await expect(work).rejects.toMatchObject({ name: "AbortError" });
    await expect(encoder.finish()).rejects.toMatchObject({
      name: "AbortError",
    });
  });

  it("stops in-flight GIF work when disposed without aborting the shared signal", async () => {
    const encoder = await createAnimationEncoder(
      "gif",
      2,
      2,
      20,
      new AbortController().signal,
    );
    const work = encoder.addFrame(canvas(2, 2, Array(16).fill(255)), 0, 50000);
    encoder.dispose();
    await expect(work).rejects.toThrow("closed");
  });

  it("fails honestly when browser video encoding is unavailable", async () => {
    vi.stubGlobal("VideoEncoder", undefined);
    vi.stubGlobal("VideoFrame", undefined);
    await expect(
      createAnimationEncoder("mp4", 2, 2, 20, new AbortController().signal),
    ).rejects.toThrow("unavailable");
  });

  it("muxes exact MP4 sample durations and supports the VP9 fallback", async () => {
    const frames: { timestamp: number; duration: number; closed: boolean }[] =
      [];
    let closeCount = 0;
    class Frame {
      timestamp: number;
      duration: number;
      closed = false;
      constructor(
        _canvas: unknown,
        init: { timestamp: number; duration: number },
      ) {
        this.timestamp = init.timestamp;
        this.duration = init.duration;
        frames.push(this);
      }
      close() {
        this.closed = true;
      }
    }
    class Encoder {
      static async isConfigSupported(config: VideoEncoderConfig) {
        return { supported: config.codec.startsWith("vp09") };
      }
      state = "configured";
      callback: VideoEncoderInit["output"];
      constructor(init: VideoEncoderInit) {
        this.callback = init.output;
      }
      configure() {}
      encode(frame: Frame) {
        const encoded = new Uint8Array([0x82, 0x49, 0x83, 0x42, 0x20, 0, 0, 0]);
        this.callback(
          {
            timestamp: frame.timestamp,
            byteLength: encoded.length,
            type: "key",
            copyTo: (target: Uint8Array) => target.set(encoded),
          } as unknown as EncodedVideoChunk,
          {},
        );
      }
      async flush() {}
      close() {
        this.state = "closed";
        closeCount++;
      }
    }
    vi.stubGlobal("VideoFrame", Frame);
    vi.stubGlobal("VideoEncoder", Encoder);
    const encoder = await createAnimationEncoder(
      "mp4",
      2,
      2,
      20,
      new AbortController().signal,
    );
    await encoder.addFrame(canvas(2, 2, []), 0, 50000);
    await encoder.addFrame(canvas(2, 2, []), 50000, 75000);
    const blob = await encoder.finish();
    const data = await bytes(blob);
    const ascii = new TextDecoder().decode(data);
    expect(blob.type).toBe("video/mp4");
    expect(ascii.slice(4, 8)).toBe("ftyp");
    expect(ascii).toContain("vp09");
    expect(ascii).toContain("vpcC");
    const view = new DataView(data.buffer);
    const stts = ascii.indexOf("stts");
    expect(view.getUint32(stts + 8)).toBe(2);
    expect(view.getUint32(stts + 16)).toBe(50000);
    expect(view.getUint32(stts + 24)).toBe(75000);
    const mdhd = ascii.indexOf("mdhd");
    expect(view.getUint32(mdhd + 16)).toBe(1000000);
    expect(view.getUint32(mdhd + 20)).toBe(125000);
    expect(frames.map((frame) => frame.closed)).toEqual([true, true]);
    expect(closeCount).toBe(1);
  });

  it("limits queued video frames and cancels a stalled flush immediately", async () => {
    let encoded = 0;
    let flushes = 0;
    let closes = 0;
    class Frame {
      close() {}
    }
    class Encoder {
      static async isConfigSupported() {
        return { supported: true };
      }
      state = "configured";
      configure() {}
      encode() {
        encoded++;
      }
      flush() {
        flushes++;
        return new Promise<void>(() => {});
      }
      close() {
        this.state = "closed";
        closes++;
      }
    }
    vi.stubGlobal("VideoFrame", Frame);
    vi.stubGlobal("VideoEncoder", Encoder);
    const controller = new AbortController();
    const encoder = await createAnimationEncoder(
      "mp4",
      2,
      2,
      20,
      controller.signal,
    );
    for (let index = 0; index < 3; index++)
      await encoder.addFrame(canvas(2, 2, []), index * 50000, 50000);
    const work = encoder.addFrame(canvas(2, 2, []), 150000, 50000);
    expect(encoded).toBe(4);
    expect(flushes).toBe(1);
    controller.abort();
    await expect(work).rejects.toMatchObject({ name: "AbortError" });
    expect(closes).toBe(1);
  });

  it("rejects oversized encoded chunks before allocating their buffers", async () => {
    let copies = 0;
    class Frame {
      close() {}
    }
    class Encoder {
      static async isConfigSupported() {
        return { supported: true };
      }
      state = "configured";
      callback: VideoEncoderInit["output"];
      constructor(init: VideoEncoderInit) {
        this.callback = init.output;
      }
      configure() {}
      encode() {
        this.callback(
          {
            timestamp: 0,
            byteLength: 97 * 1024 * 1024,
            type: "key",
            copyTo: () => {
              copies++;
            },
          } as unknown as EncodedVideoChunk,
          {},
        );
      }
      close() {
        this.state = "closed";
      }
    }
    vi.stubGlobal("VideoFrame", Frame);
    vi.stubGlobal("VideoEncoder", Encoder);
    const encoder = await createAnimationEncoder(
      "mp4",
      2,
      2,
      20,
      new AbortController().signal,
    );
    await expect(encoder.addFrame(canvas(2, 2, []), 0, 50000)).rejects.toThrow(
      "96 MiB",
    );
    expect(copies).toBe(0);
  });
});

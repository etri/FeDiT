export type AnimationExportFormat = "gif" | "mp4";
export type AnimationEncoder = {
  addFrame: (
    canvas: HTMLCanvasElement,
    timestampUs: number,
    durationUs: number,
  ) => Promise<void>;
  finish: () => Promise<Blob>;
  dispose: () => void;
};

// 출력과 작업 프레임의 메모리를 제한
const MAX_BYTES = 96 * 1024 * 1024;
const MAX_PIXELS = 2048 * 2048;
const MAX_FRAMES = 10000;
const TIMESCALE = 1000000;
const textBytes = (value: string) =>
  Uint8Array.from(value, (character) => character.charCodeAt(0));
const zeros = (size: number) => new Uint8Array(size);
const u16 = (value: number) =>
  new Uint8Array([(value >>> 8) & 255, value & 255]);
const u32 = (value: number) =>
  new Uint8Array([
    (value >>> 24) & 255,
    (value >>> 16) & 255,
    (value >>> 8) & 255,
    value & 255,
  ]);
const join = (...parts: Uint8Array[]) => {
  const joined = new Uint8Array(
    parts.reduce((size, part) => size + part.byteLength, 0),
  );
  let offset = 0;
  for (const part of parts) {
    joined.set(part, offset);
    offset += part.byteLength;
  }
  return joined;
};
const box = (name: string, ...parts: Uint8Array[]) =>
  join(
    u32(8 + parts.reduce((size, part) => size + part.byteLength, 0)),
    textBytes(name),
    ...parts,
  );
const fullBox = (
  name: string,
  version: number,
  flags: number,
  ...parts: Uint8Array[]
) =>
  box(
    name,
    new Uint8Array([version, flags >>> 16, flags >>> 8, flags]),
    ...parts,
  );
const abortError = () => new DOMException("Export cancelled", "AbortError");
function checkAbort(signal: AbortSignal) {
  if (signal.aborted) throw abortError();
}
async function yieldTask(signal: AbortSignal) {
  checkAbort(signal);
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  checkAbort(signal);
}
function dimensions(width: number, height: number, fps: number) {
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width < 1 ||
    height < 1 ||
    width > 65535 ||
    height > 65535 ||
    width * height > MAX_PIXELS ||
    !Number.isFinite(fps) ||
    fps < 1 ||
    fps > 60
  )
    throw new Error("Invalid export dimensions or frame rate");
}
function frameTiming(
  timestamp: number,
  duration: number,
  expected: number,
  frames: number,
) {
  if (
    !Number.isSafeInteger(timestamp) ||
    !Number.isSafeInteger(duration) ||
    timestamp !== expected ||
    duration <= 0 ||
    timestamp + duration > 0xffffffff ||
    frames >= MAX_FRAMES
  )
    throw new Error("Invalid export frame timing");
}

// GIF 바이트를 작은 블록으로 축적
class GifBytes {
  private parts: Uint8Array<ArrayBuffer>[] = [];
  private current = new Uint8Array(65536);
  private position = 0;
  private size = 0;

  byte(value: number) {
    if (++this.size > MAX_BYTES)
      throw new Error("Export exceeds the 96 MiB file limit");
    if (this.position === this.current.length) {
      this.parts.push(this.current);
      this.current = new Uint8Array(65536);
      this.position = 0;
    }
    this.current[this.position++] = value;
  }

  bytes(values: Uint8Array) {
    for (const value of values) this.byte(value);
  }

  word(value: number) {
    this.byte(value & 255);
    this.byte(value >>> 8);
  }

  blob() {
    return new Blob([...this.parts, this.current.slice(0, this.position)], {
      type: "image/gif",
    });
  }

  clear() {
    this.parts = [];
    this.current = new Uint8Array(0);
    this.position = 0;
    this.size = 0;
  }
}

// 고정 팔레트와 변경된 사각형만 사용하여 GIF 용량을 제한
async function gifEncoder(
  width: number,
  height: number,
  signal: AbortSignal,
): Promise<AnimationEncoder> {
  const output = new GifBytes();
  output.bytes(textBytes("GIF89a"));
  output.word(width);
  output.word(height);
  output.bytes(new Uint8Array([0xf7, 0, 0]));
  for (let index = 0; index < 256; index++)
    output.bytes(
      new Uint8Array([
        Math.round(((index >>> 5) * 255) / 7),
        Math.round((((index >>> 2) & 7) * 255) / 7),
        Math.round(((index & 3) * 255) / 3),
      ]),
    );
  output.bytes(
    new Uint8Array([
      0x21,
      0xff,
      11,
      ...textBytes("NETSCAPE2.0"),
      3,
      1,
      0,
      0,
      0,
    ]),
  );
  let previous: Uint8Array | undefined;
  let expected = 0;
  let frames = 0;
  let closed = false;
  let busy = false;
  const dispose = () => {
    closed = true;
    previous = undefined;
    output.clear();
    signal.removeEventListener("abort", dispose);
  };
  signal.addEventListener("abort", dispose, { once: true });
  const assertOpen = () => {
    checkAbort(signal);
    if (closed) throw new Error("Export encoder is closed");
  };
  return {
    async addFrame(canvas, timestamp, duration) {
      assertOpen();
      if (busy) throw new Error("Export frame is already being encoded");
      frameTiming(timestamp, duration, expected, frames);
      if (canvas.width !== width || canvas.height !== height)
        throw new Error("Export frame dimensions changed");
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) throw new Error("Canvas pixel access is unavailable");
      busy = true;
      try {
        const rgba = context.getImageData(0, 0, width, height).data;
        const pixels = new Uint8Array(width * height);
        await yieldTask(signal);
        assertOpen();
        let yieldedAt = performance.now();
        const yieldIfNeeded = async () => {
          if (performance.now() - yieldedAt >= 12) {
            await yieldTask(signal);
            assertOpen();
            yieldedAt = performance.now();
          }
        };
        let left = width;
        let right = -1;
        let top = height;
        let bottom = -1;
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const index = y * width + x;
            const offset = index * 4;
            const alpha = rgba[offset + 3] / 255;
            const red = rgba[offset] * alpha + 255 * (1 - alpha);
            const green = rgba[offset + 1] * alpha + 255 * (1 - alpha);
            const blue = rgba[offset + 2] * alpha + 255 * (1 - alpha);
            const color =
              (Math.round((red * 7) / 255) << 5) |
              (Math.round((green * 7) / 255) << 2) |
              Math.round((blue * 3) / 255);
            pixels[index] = color;
            if (!previous || previous[index] !== color) {
              left = Math.min(left, x);
              right = Math.max(right, x);
              top = Math.min(top, y);
              bottom = Math.max(bottom, y);
            }
          }
          if (y % 64 === 63) await yieldIfNeeded();
        }
        assertOpen();
        if (right < left) left = right = top = bottom = 0;
        const frameWidth = right - left + 1;
        const frameHeight = bottom - top + 1;
        const delay =
          Math.round((timestamp + duration) / 10000) -
          Math.round(timestamp / 10000);
        if (delay < 1 || delay > 65535)
          throw new Error("GIF frame duration must be between 10 ms and 655 s");
        output.bytes(new Uint8Array([0x21, 0xf9, 4, 4]));
        output.word(delay);
        output.bytes(new Uint8Array([0, 0, 0x2c]));
        output.word(left);
        output.word(top);
        output.word(frameWidth);
        output.word(frameHeight);
        output.bytes(new Uint8Array([0, 8]));

        // GIF 사전 코드의 비트 폭과 하위 블록을 기록
        let bits = 0;
        let bitCount = 0;
        let block: number[] = [];
        let codeSize = 9;
        let nextCode = 258;
        const dictionary = new Map<number, number>();
        const writeCode = (code: number) => {
          bits |= code << bitCount;
          bitCount += codeSize;
          while (bitCount >= 8) {
            block.push(bits & 255);
            bits >>>= 8;
            bitCount -= 8;
            if (block.length === 255) {
              output.byte(255);
              output.bytes(Uint8Array.from(block));
              block = [];
            }
          }
          if (nextCode === 1 << codeSize && codeSize < 12) codeSize++;
        };
        writeCode(256);
        let prefix = pixels[top * width + left];
        const count = frameWidth * frameHeight;
        for (let index = 1; index < count; index++) {
          const color =
            pixels[
              (top + Math.floor(index / frameWidth)) * width +
                left +
                (index % frameWidth)
            ];
          const key = prefix * 256 + color;
          const known = dictionary.get(key);
          if (known !== undefined) prefix = known;
          else {
            writeCode(prefix);
            if (nextCode < 4096) dictionary.set(key, nextCode++);
            else {
              writeCode(256);
              dictionary.clear();
              codeSize = 9;
              nextCode = 258;
            }
            prefix = color;
          }
          if (index % 32768 === 0) await yieldIfNeeded();
        }
        writeCode(prefix);
        writeCode(257);
        if (bitCount) block.push(bits & 255);
        if (block.length) {
          output.byte(block.length);
          output.bytes(Uint8Array.from(block));
        }
        output.byte(0);
        previous = pixels;
        expected += duration;
        frames++;
      } catch (error) {
        dispose();
        throw error;
      } finally {
        busy = false;
      }
    },
    async finish() {
      assertOpen();
      if (busy || !frames) throw new Error("Export has no completed frames");
      output.byte(0x3b);
      const blob = output.blob();
      dispose();
      return blob;
    },
    dispose,
  };
}

type Mp4Sample = {
  bytes: Uint8Array<ArrayBuffer>;
  duration: number;
  key: boolean;
};
const matrix = new Uint8Array([
  0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 64, 0, 0, 0,
]);
function vp9Configuration(sample: Uint8Array) {
  let position = 0;
  const read = (length: number) => {
    let value = 0;
    for (let index = 0; index < length; index++, position++)
      value =
        (value << 1) | ((sample[position >>> 3] >>> (7 - (position & 7))) & 1);
    return value;
  };
  if (read(2) !== 2 || read(1) !== 0 || read(1) !== 0 || read(1) !== 0)
    throw new Error("Unsupported VP9 profile");
  if (read(1) !== 0) throw new Error("MP4 must begin with a key frame");
  read(2);
  if (read(24) !== 0x498342) throw new Error("Invalid VP9 key frame");
  const color = read(3);
  const range = read(1);
  const colorimetry =
    color === 2
      ? [1, 1, 1]
      : color === 1 || color === 3
        ? [6, 6, 6]
        : color === 4
          ? [7, 7, 7]
          : color === 5
            ? [9, 14, 9]
            : [2, 2, 2];
  return fullBox(
    "vpcC",
    1,
    0,
    new Uint8Array([0, 41, 0x82 | range, ...colorimetry, 0, 0]),
  );
}

// 정해진 시각과 길이로 MP4 표본 테이블을 작성
function mp4Blob(
  width: number,
  height: number,
  codec: string,
  description: Uint8Array | undefined,
  samples: Mp4Sample[],
) {
  const duration = samples.reduce((sum, sample) => sum + sample.duration, 0);
  const codecBox = codec.startsWith("avc1")
    ? description?.length
      ? box("avcC", description)
      : undefined
    : vp9Configuration(samples[0].bytes);
  if (!codecBox) throw new Error("H.264 decoder configuration is missing");
  const entry = box(
    codec.startsWith("avc1") ? "avc1" : "vp09",
    zeros(6),
    u16(1),
    zeros(16),
    u16(width),
    u16(height),
    u32(0x00480000),
    u32(0x00480000),
    u32(0),
    u16(1),
    zeros(32),
    u16(24),
    u16(65535),
    codecBox,
  );
  const runs: { count: number; duration: number }[] = [];
  const keys: number[] = [];
  samples.forEach((sample, index) => {
    const last = runs.at(-1);
    if (last?.duration === sample.duration) last.count++;
    else runs.push({ count: 1, duration: sample.duration });
    if (sample.key) keys.push(index + 1);
  });
  const header = box(
    "ftyp",
    textBytes("isom"),
    u32(512),
    textBytes("isomiso2mp41"),
  );
  const table = box(
    "stbl",
    fullBox("stsd", 0, 0, u32(1), entry),
    fullBox(
      "stts",
      0,
      0,
      u32(runs.length),
      ...runs.map((run) => join(u32(run.count), u32(run.duration))),
    ),
    fullBox("stsc", 0, 0, u32(1), u32(1), u32(samples.length), u32(1)),
    fullBox(
      "stsz",
      0,
      0,
      u32(0),
      u32(samples.length),
      ...samples.map((sample) => u32(sample.bytes.length)),
    ),
    fullBox("stco", 0, 0, u32(1), u32(header.length + 8)),
    fullBox("stss", 0, 0, u32(keys.length), ...keys.map(u32)),
  );
  const media = box(
    "mdia",
    fullBox(
      "mdhd",
      0,
      0,
      zeros(8),
      u32(TIMESCALE),
      u32(duration),
      u16(0x55c4),
      u16(0),
    ),
    fullBox(
      "hdlr",
      0,
      0,
      u32(0),
      textBytes("vide"),
      zeros(12),
      textBytes("FlowCast3D\0"),
    ),
    box(
      "minf",
      fullBox("vmhd", 0, 1, zeros(8)),
      box("dinf", fullBox("dref", 0, 0, u32(1), fullBox("url ", 0, 1))),
      table,
    ),
  );
  const track = box(
    "trak",
    fullBox(
      "tkhd",
      0,
      7,
      zeros(8),
      u32(1),
      u32(0),
      u32(duration),
      zeros(16),
      matrix,
      u32(width * 65536),
      u32(height * 65536),
    ),
    media,
  );
  const movie = box(
    "moov",
    fullBox(
      "mvhd",
      0,
      0,
      zeros(8),
      u32(TIMESCALE),
      u32(duration),
      u32(0x00010000),
      u16(0x0100),
      zeros(10),
      matrix,
      zeros(24),
      u32(2),
    ),
    track,
  );
  const byteLength = samples.reduce(
    (sum, sample) => sum + sample.bytes.length,
    0,
  );
  return new Blob(
    [
      header,
      u32(byteLength + 8),
      textBytes("mdat"),
      ...samples.map((sample) => sample.bytes),
      movie,
    ],
    { type: "video/mp4" },
  );
}

async function mp4Encoder(
  width: number,
  height: number,
  fps: number,
  signal: AbortSignal,
): Promise<AnimationEncoder> {
  if (typeof VideoEncoder === "undefined" || typeof VideoFrame === "undefined")
    throw new Error("MP4 encoding is unavailable in this browser");
  if (width % 2 || height % 2) throw new Error("MP4 dimensions must be even");
  let config: VideoEncoderConfig | undefined;
  for (const codec of ["avc1.42002a", "avc1.420028", "vp09.00.41.08"]) {
    checkAbort(signal);
    const candidate: VideoEncoderConfig = {
      codec,
      width,
      height,
      framerate: fps,
      bitrate: Math.max(
        600000,
        Math.min(12000000, Math.round(width * height * fps * 0.2)),
      ),
      latencyMode: "realtime",
      hardwareAcceleration: "no-preference",
      ...(codec.startsWith("avc1") ? { avc: { format: "avc" as const } } : {}),
    };
    try {
      if ((await VideoEncoder.isConfigSupported(candidate)).supported) {
        config = candidate;
        break;
      }
    } catch {
      /* 브라우저가 지원하지 않는 코덱은 다음 후보로 전환 */
    }
  }
  checkAbort(signal);
  if (!config) throw new Error("MP4 encoding is unavailable in this browser");
  const samples: Mp4Sample[] = [];
  const pending = new Map<number, number>();
  let description: Uint8Array<ArrayBuffer> | undefined;
  let error: Error | undefined;
  let size = 0;
  let expected = 0;
  let lastTimestamp = -1;
  let frames = 0;
  let closed = false;
  let busy = false;
  const encoder = new VideoEncoder({
    output(chunk, metadata) {
      if (closed || error) return;
      const duration = pending.get(chunk.timestamp);
      if (duration === undefined || chunk.timestamp <= lastTimestamp) {
        error = new Error("Video encoder returned reordered or unknown frames");
        return;
      }
      if (size + chunk.byteLength > MAX_BYTES) {
        error = new Error("Export exceeds the 96 MiB file limit");
        return;
      }
      const data = new Uint8Array(chunk.byteLength);
      chunk.copyTo(data);
      if (metadata?.decoderConfig?.description) {
        const source = metadata.decoderConfig.description;
        const bytes = ArrayBuffer.isView(source)
          ? new Uint8Array(source.buffer, source.byteOffset, source.byteLength)
          : new Uint8Array(source);
        if (
          (description && description.byteLength !== bytes.byteLength) ||
          (description &&
            !bytes.every((value, index) => description?.[index] === value))
        ) {
          error = new Error("Video encoder configuration changed");
          return;
        }
        description = bytes.slice();
      }
      samples.push({ bytes: data, duration, key: chunk.type === "key" });
      size += data.length;
      lastTimestamp = chunk.timestamp;
      pending.delete(chunk.timestamp);
    },
    error(value) {
      error = value;
    },
  });
  const dispose = () => {
    closed = true;
    if (encoder.state !== "closed") encoder.close();
    samples.length = 0;
    pending.clear();
    description = undefined;
    signal.removeEventListener("abort", dispose);
  };
  const assertOpen = () => {
    checkAbort(signal);
    if (error) throw error;
    if (closed) throw new Error("Export encoder is closed");
  };
  const flush = async () => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let onAbort: (() => void) | undefined;
    try {
      await Promise.race([
        encoder.flush(),
        new Promise<never>((_, reject) => {
          onAbort = () => reject(abortError());
          signal.addEventListener("abort", onAbort, { once: true });
          if (signal.aborted) onAbort();
        }),
        new Promise<never>((_, reject) => {
          timeout = setTimeout(
            () => reject(new Error("Video encoding timed out")),
            30000,
          );
        }),
      ]);
      assertOpen();
    } finally {
      clearTimeout(timeout);
      if (onAbort) signal.removeEventListener("abort", onAbort);
    }
  };
  signal.addEventListener("abort", dispose, { once: true });
  try {
    encoder.configure(config);
  } catch (value) {
    dispose();
    throw value;
  }
  return {
    async addFrame(canvas, timestamp, duration) {
      assertOpen();
      if (busy) throw new Error("Export frame is already being encoded");
      frameTiming(timestamp, duration, expected, frames);
      if (canvas.width !== width || canvas.height !== height)
        throw new Error("Export frame dimensions changed");
      busy = true;
      let frame: VideoFrame | undefined;
      try {
        pending.set(timestamp, duration);
        frame = new VideoFrame(canvas, {
          timestamp,
          duration,
          alpha: "discard",
        });
        encoder.encode(frame, {
          keyFrame: frames % Math.max(1, Math.round(fps * 2)) === 0,
        });
        frame.close();
        frame = undefined;
        expected += duration;
        frames++;
        if (pending.size >= 4) await flush();
        else await yieldTask(signal);
        assertOpen();
      } catch (value) {
        frame?.close();
        dispose();
        throw value;
      } finally {
        busy = false;
      }
    },
    async finish() {
      assertOpen();
      if (busy || !frames) throw new Error("Export has no completed frames");
      try {
        await flush();
        if (pending.size || samples.length !== frames || !samples[0].key)
          throw new Error("Video encoder did not return every frame");
        const blob = mp4Blob(width, height, config.codec, description, samples);
        dispose();
        return blob;
      } catch (value) {
        dispose();
        throw value;
      }
    },
    dispose,
  };
}

export async function createAnimationEncoder(
  format: AnimationExportFormat,
  width: number,
  height: number,
  fps: number,
  signal: AbortSignal,
): Promise<AnimationEncoder> {
  dimensions(width, height, fps);
  checkAbort(signal);
  return format === "gif"
    ? gifEncoder(width, height, signal)
    : mp4Encoder(width, height, fps, signal);
}

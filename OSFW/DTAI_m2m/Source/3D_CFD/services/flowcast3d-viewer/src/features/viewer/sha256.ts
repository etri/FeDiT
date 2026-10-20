const MAX_BYTES = 200_000 * 36;
const CONSTANTS = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
  0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
  0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
  0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
  0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
  0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);
const rotate = (value: number, count: number) =>
  (value >>> count) | (value << (32 - count));
const hex = (bytes: Uint8Array) =>
  Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
function checked(signal?: AbortSignal) {
  if (signal?.aborted)
    throw (
      signal.reason ??
      new DOMException("SHA-256 verification was cancelled.", "AbortError")
    );
}

/** 비보안 HTTP에서도 제한된 자산의 SHA-256을 같은 방식으로 검증 */
export async function sha256(
  buffer: ArrayBuffer,
  signal?: AbortSignal,
): Promise<string> {
  checked(signal);
  if (buffer.byteLength > MAX_BYTES)
    throw new Error("SHA-256 asset budget exceeded (7200000 bytes).");
  if (globalThis.crypto?.subtle) {
    try {
      const digest = await crypto.subtle.digest("SHA-256", buffer);
      checked(signal);
      return hex(new Uint8Array(digest));
    } catch (error) {
      checked(signal);
      if (error instanceof DOMException && error.name === "AbortError")
        throw error;
    }
  }

  // 입력을 복제하지 않고 고정 크기 작업 버퍼로 블록을 처리
  const state = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c,
    0x1f83d9ab, 0x5be0cd19,
  ]);
  const words = new Uint32Array(64);
  const process = (view: DataView, offset: number) => {
    for (let index = 0; index < 16; index++)
      words[index] = view.getUint32(offset + index * 4, false);
    for (let index = 16; index < 64; index++) {
      const a = words[index - 15],
        b = words[index - 2];
      const s0 = rotate(a, 7) ^ rotate(a, 18) ^ (a >>> 3);
      const s1 = rotate(b, 17) ^ rotate(b, 19) ^ (b >>> 10);
      words[index] = (words[index - 16] + s0 + words[index - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, h] = state;
    for (let index = 0; index < 64; index++) {
      const s1 = rotate(e, 6) ^ rotate(e, 11) ^ rotate(e, 25);
      const choice = (e & f) ^ (~e & g);
      const first = (h + s1 + choice + CONSTANTS[index] + words[index]) >>> 0;
      const s0 = rotate(a, 2) ^ rotate(a, 13) ^ rotate(a, 22);
      const majority = (a & b) ^ (a & c) ^ (b & c);
      const second = (s0 + majority) >>> 0;
      h = g;
      g = f;
      f = e;
      e = (d + first) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (first + second) >>> 0;
    }
    const result = [a, b, c, d, e, f, g, h];
    for (let index = 0; index < 8; index++)
      state[index] = (state[index] + result[index]) >>> 0;
  };
  const view = new DataView(buffer);
  const full = buffer.byteLength - (buffer.byteLength % 64);
  for (let offset = 0; offset < full; offset += 64) {
    process(view, offset);
    if (offset > 0 && offset % (4096 * 64) === 0) {
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      checked(signal);
    }
  }

  // 마지막 블록에 원본 길이를 빅 엔디언 비트 수로 기록
  const remaining = buffer.byteLength - full;
  const tail = new Uint8Array(remaining < 56 ? 64 : 128);
  tail.set(new Uint8Array(buffer, full));
  tail[remaining] = 0x80;
  const tailView = new DataView(tail.buffer);
  tailView.setUint32(
    tail.length - 8,
    Math.floor(buffer.byteLength / 0x20000000),
    false,
  );
  tailView.setUint32(tail.length - 4, buffer.byteLength * 8, false);
  for (let offset = 0; offset < tail.length; offset += 64)
    process(tailView, offset);
  checked(signal);
  return Array.from(state, (value) => value.toString(16).padStart(8, "0")).join(
    "",
  );
}

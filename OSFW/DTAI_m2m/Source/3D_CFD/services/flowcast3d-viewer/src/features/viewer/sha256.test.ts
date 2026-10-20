import { afterEach, describe, expect, it, vi } from "vitest";
import { sha256 } from "./sha256";
const { webcrypto } = await vi.importActual<{ webcrypto: Crypto }>(
  "node:crypto",
);
const encoded = (text: string) => new TextEncoder().encode(text).buffer;
const oracle = async (buffer: ArrayBuffer) =>
  Array.from(
    new Uint8Array(await webcrypto.subtle.digest("SHA-256", buffer)),
    (value) => value.toString(16).padStart(2, "0"),
  ).join("");
afterEach(() => vi.unstubAllGlobals());

describe("bounded SHA-256 verification", () => {
  it.each([
    ["", "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"],
    ["abc", "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"],
  ])(
    "matches published vector %s without Web Crypto",
    async (text, expected) => {
      vi.stubGlobal("crypto", undefined);
      expect(await sha256(encoded(text))).toBe(expected);
    },
  );
  it.each([55, 56, 63, 64, 65, 127, 128])(
    "matches Node Crypto across the %i-byte padding boundary",
    async (size) => {
      vi.stubGlobal("crypto", undefined);
      const bytes = Uint8Array.from(
        { length: size },
        (_, index) => (index * 19 + 5) % 256,
      );
      expect(await sha256(bytes.buffer)).toBe(await oracle(bytes.buffer));
    },
  );
  it("hashes a multi-megabyte maximum-size binary asset while yielding to the UI", async () => {
    vi.stubGlobal("crypto", undefined);
    const buffer = Uint8Array.from(
      { length: 7_200_000 },
      (_, index) => index % 251,
    ).buffer;
    let yielded = false;
    setTimeout(() => {
      yielded = true;
    }, 0);
    expect(await sha256(buffer)).toBe(await oracle(buffer));
    expect(yielded).toBe(true);
  });
  it("uses native Web Crypto when available and falls back if the native implementation is unavailable", async () => {
    const digest = vi.fn(webcrypto.subtle.digest.bind(webcrypto.subtle));
    vi.stubGlobal("crypto", { subtle: { digest } });
    expect(await sha256(encoded("abc"))).toBe(await oracle(encoded("abc")));
    expect(digest).toHaveBeenCalledOnce();
    digest.mockRejectedValue(
      new DOMException("Unavailable", "NotSupportedError"),
    );
    expect(await sha256(encoded("abc"))).toBe(await oracle(encoded("abc")));
  });
  it("enforces the binary asset limit before hashing", async () => {
    const digest = vi.fn();
    vi.stubGlobal("crypto", { subtle: { digest } });
    await expect(sha256(new ArrayBuffer(7_200_001))).rejects.toThrow(
      /budget exceeded/,
    );
    expect(digest).not.toHaveBeenCalled();
  });
  it("cancels fallback work after yielding without publishing a stale hash", async () => {
    vi.stubGlobal("crypto", undefined);
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 0);
    await expect(
      sha256(new ArrayBuffer(3_000_000), controller.signal),
    ).rejects.toMatchObject({ name: "AbortError" });
  });
});

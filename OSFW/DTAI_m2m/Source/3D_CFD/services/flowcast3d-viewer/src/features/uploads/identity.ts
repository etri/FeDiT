import { api } from "../../lib/api";
const fingerprints = new WeakMap<Blob, Promise<string>>();
const verified = new WeakMap<Blob, Set<string>>();
const hash = async (buffer: ArrayBuffer) =>
  [...new Uint8Array(await crypto.subtle.digest("SHA-256", buffer))]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
export function fileFingerprint(file: Blob) {
  let value = fingerprints.get(file);
  if (!value) {
    value = (async () => {
      const size = new TextEncoder().encode(`${file.size}:`),
        head = new Uint8Array(await file.slice(0, 1024 ** 2).arrayBuffer()),
        tail = new Uint8Array(
          await file.slice(Math.max(0, file.size - 1024 ** 2)).arrayBuffer(),
        ),
        bytes = new Uint8Array(size.length + head.length + tail.length);
      bytes.set(size);
      bytes.set(head, size.length);
      bytes.set(tail, size.length + head.length);
      return hash(bytes.buffer);
    })();
    fingerprints.set(file, value);
  }
  return value;
}
export async function verifyResume(
  url: string,
  file: Blob,
  filename: string,
  force = false,
) {
  const path = new URL(url, location.origin).pathname;
  if (!/^\/app-api\/uploads\/[a-zA-Z0-9_-]+$/.test(path))
    throw new Error("Invalid upload location");
  const checked = verified.get(file) ?? new Set<string>();
  if (checked.has(path) && !force) return;
  const identity = await api<{
    filename: string;
    length: number;
    offset: number;
    prefixBytes: number;
    prefixSha256: string;
    fingerprint?: string;
  }>(`${path.slice("/app-api".length)}/identity`);
  if (
    identity.filename !== filename ||
    identity.length !== file.size ||
    identity.prefixBytes < 0 ||
    identity.prefixBytes > Math.min(identity.offset, 1024 ** 2)
  )
    throw new Error(
      "Upload identity mismatch. Select the original file or start a new upload.",
    );
  if (
    identity.fingerprint &&
    identity.fingerprint !== (await fileFingerprint(file))
  )
    throw new Error(
      "Upload fingerprint mismatch. Select the original file or start a new upload.",
    );
  if (
    identity.prefixBytes &&
    (await hash(await file.slice(0, identity.prefixBytes).arrayBuffer())) !==
      identity.prefixSha256
  )
    throw new Error(
      "Upload content mismatch. Select the original file or start a new upload.",
    );
  checked.add(path);
  verified.set(file, checked);
}

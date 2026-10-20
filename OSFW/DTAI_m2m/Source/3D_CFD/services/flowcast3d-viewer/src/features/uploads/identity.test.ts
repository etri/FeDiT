// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fileFingerprint, verifyResume } from "./identity";
import { api } from "../../lib/api";
vi.mock("../../lib/api", () => ({ api: vi.fn() }));
beforeEach(() => {
  vi.stubGlobal("location", { origin: "http://localhost:5173" });
  vi.mocked(api).mockReset();
});
describe("resumable upload identity", () => {
  it("separates different content with the same filename and size", async () => {
    expect(await fileFingerprint(new Blob(["first"]))).not.toBe(
      await fileFingerprint(new Blob(["other"])),
    );
  });
  it("checks the server prefix before appending and rejects wrong content", async () => {
    const file = new Blob(["12345"]);
    vi.mocked(api).mockResolvedValue({
      filename: "field.npy",
      length: 5,
      offset: 3,
      prefixBytes: 3,
      prefixSha256: "invalid",
      fingerprint: await fileFingerprint(file),
    });
    await expect(
      verifyResume("/app-api/uploads/fixture", file, "field.npy"),
    ).rejects.toThrow("content mismatch");
  });
  it("accepts an empty verified upload and blocks external paths", async () => {
    const file = new Blob(["12345"]);
    vi.mocked(api).mockResolvedValue({
      filename: "field.npy",
      length: 5,
      offset: 0,
      prefixBytes: 0,
      prefixSha256: "",
      fingerprint: await fileFingerprint(file),
    });
    await expect(
      verifyResume("/app-api/uploads/fixture", file, "field.npy"),
    ).resolves.toBeUndefined();
    await expect(
      verifyResume("/assets/original", file, "field.npy"),
    ).rejects.toThrow("Invalid upload location");
  });
});

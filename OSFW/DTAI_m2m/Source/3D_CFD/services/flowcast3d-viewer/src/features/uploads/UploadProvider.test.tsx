import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../lib/api";
import { UploadProvider } from "./UploadProvider";
import { useDirectUpload } from "./upload-context";

const transport = vi.hoisted(() => {
  type FileEntry = { id: string; name: string; data: File };
  type Listener = (file: FileEntry, value: unknown) => void;
  const listeners = new Map<string, Set<Listener>>();
  const files = new Map<string, FileEntry>();
  let sequence = 0;
  const uppy = {
    on: vi.fn((event: string, callback: Listener) => {
      const callbacks = listeners.get(event) ?? new Set<Listener>();
      callbacks.add(callback);
      listeners.set(event, callbacks);
      return uppy;
    }),
    off: vi.fn((event: string, callback: Listener) => {
      listeners.get(event)?.delete(callback);
      return uppy;
    }),
    addFile: vi.fn((file: { name: string; data: File }) => {
      const id = `file-${++sequence}`;
      files.set(id, { id, ...file });
      return id;
    }),
    getFile: vi.fn((id: string) => files.get(id)),
    removeFile: vi.fn((id: string) => files.delete(id)),
    upload: vi.fn(async () => ({ successful: [], failed: [] })),
    retryUpload: vi.fn(async () => undefined),
  };
  return {
    uppy,
    files,
    post: vi.fn<(path: string, body: unknown) => Promise<unknown>>(),
    api: vi.fn<(path: string, options?: RequestInit) => Promise<unknown>>(),
    session: vi.fn(async () => ({ csrfToken: "test-token" })),
    emit(event: string, file: FileEntry, value: unknown) {
      for (const callback of listeners.get(event) ?? []) callback(file, value);
    },
    reset() {
      sequence = 0;
      listeners.clear();
      files.clear();
    },
  };
});

vi.mock("../../lib/api", async (original) => ({
  ...(await original<typeof import("../../lib/api")>()),
  post: transport.post,
  api: transport.api,
  session: transport.session,
}));
vi.mock("./useUploader", async (original) => ({
  ...(await original<typeof import("./useUploader")>()),
  useUploader: () => transport.uppy,
}));

function mount() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const invalidated = vi.spyOn(client, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <UploadProvider>{children}</UploadProvider>
    </QueryClientProvider>
  );
  const hook = renderHook(({ page }) => ({ ...useDirectUpload(), page }), {
    wrapper,
    initialProps: { page: "datasets" },
  });
  return { ...hook, client, invalidated };
}

async function queue(hook: ReturnType<typeof mount>, name = "city.stl") {
  await act(async () => {
    await hook.result.current.addFiles([new File([new Uint8Array(16)], name)]);
  });
  return transport.files.values().next().value!;
}

async function finish(file: { id: string; name: string; data: File }) {
  await act(async () => {
    transport.emit("upload-success", file, {
      uploadURL: "/app-api/uploads/source-1",
    });
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  transport.reset();
  transport.post
    .mockReset()
    .mockResolvedValue({ dataset: { id: "dataset-1", status: "ready" } });
  transport.api.mockReset().mockResolvedValue({ jobs: [] });
  transport.session.mockReset().mockResolvedValue({ csrfToken: "test-token" });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("direct upload registration", () => {
  it("ignores a late transfer success after the upload was cancelled", async () => {
    const hook = mount();
    const file = await queue(hook);
    act(() => hook.result.current.dismiss(file.id));
    await finish(file);
    expect(hook.result.current.entries).toEqual([]);
    expect(transport.post).not.toHaveBeenCalled();
    expect(transport.api).not.toHaveBeenCalled();
  });

  it("registers duplicate success events only once with automatic source metadata", async () => {
    let respond!: (value: unknown) => void;
    transport.post.mockImplementation(
      () =>
        new Promise((resolve) => {
          respond = resolve;
        }),
    );
    const hook = mount();
    const file = await queue(hook, `${"a".repeat(121)}.stl`);
    act(() => {
      transport.emit("upload-success", file, {
        uploadURL: "/app-api/uploads/source-1",
      });
      transport.emit("upload-success", file, {
        uploadURL: "/app-api/uploads/source-1",
      });
    });
    expect(transport.post).toHaveBeenCalledExactlyOnceWith("/datasets", {
      name: "a".repeat(120),
      uploadIds: ["source-1"],
      mapping: {},
    });
    expect(hook.result.current.entries[0].status).toBe("registering");
    await act(async () => {
      respond({ dataset: { id: "dataset-1", status: "ready" } });
    });
    expect(hook.result.current.entries[0].status).toBe("complete");
    await finish(file);
    expect(transport.post).toHaveBeenCalledTimes(1);
    expect(transport.uppy.removeFile).toHaveBeenCalledExactlyOnceWith(file.id);
  });

  it("retries a failed preparation through the same job without registering or uploading again", async () => {
    transport.post
      .mockResolvedValueOnce({
        dataset: { id: "dataset-1", status: "preparing" },
        job: { id: "prepare/job-1", status: "queued" },
      })
      .mockResolvedValue({ id: "prepare/job-1", status: "queued" });
    transport.api
      .mockResolvedValueOnce({
        jobs: [
          {
            id: "prepare/job-1",
            status: "failed",
            error: "Dataset preparation failed.",
          },
        ],
      })
      .mockResolvedValue({
        jobs: [{ id: "prepare/job-1", status: "succeeded" }],
      });
    const hook = mount();
    const file = await queue(hook);
    await finish(file);
    expect(hook.result.current.entries[0]).toMatchObject({
      status: "error",
      retry: "job",
      jobId: "prepare/job-1",
      error: "Dataset preparation failed.",
    });
    await act(async () => {
      await Promise.all([
        hook.result.current.retry(file.id),
        hook.result.current.retry(file.id),
      ]);
    });
    expect(transport.post.mock.calls).toEqual([
      ["/datasets", { name: "city.stl", uploadIds: ["source-1"], mapping: {} }],
      ["/jobs/prepare%2Fjob-1/retry", {}],
    ]);
    expect(transport.uppy.retryUpload).not.toHaveBeenCalled();
    expect(hook.result.current.entries[0]).toMatchObject({
      status: "complete",
      jobId: "prepare/job-1",
    });
  });

  it.each([
    ["lost response", new Error("Connection lost")],
    ["conflict", new ApiError("Registration already exists", 409)],
    ["server error", new ApiError("Registration unavailable", 503)],
  ])(
    "keeps %s registrations uncertain without another POST",
    async (_name, failure) => {
      transport.post.mockRejectedValue(failure);
      const hook = mount();
      const file = await queue(hook);
      await finish(file);
      expect(hook.result.current.entries[0]).toMatchObject({
        status: "uncertain",
      });
      expect(hook.result.current.entries[0].error).toContain(
        "Check task history before uploading again",
      );
      expect(hook.result.current.entries[0].retry).toBeUndefined();
      await act(async () => {
        await hook.result.current.retry(file.id);
      });
      await finish(file);
      expect(transport.post).toHaveBeenCalledTimes(1);
      expect(transport.uppy.retryUpload).not.toHaveBeenCalled();
      expect(transport.api).not.toHaveBeenCalled();
    },
  );

  it("keeps the active upload when the provider stays mounted during page changes", async () => {
    const hook = mount();
    const file = await queue(hook);
    hook.rerender({ page: "visualization" });
    act(() => {
      transport.emit("upload-progress", file, {
        bytesUploaded: 8,
        bytesTotal: 16,
      });
    });
    expect(hook.result.current.entries[0]).toMatchObject({
      id: file.id,
      status: "uploading",
      progress: 50,
    });
    expect(transport.uppy.off).not.toHaveBeenCalled();
    await finish(file);
    hook.rerender({ page: "datasets" });
    expect(hook.result.current.entries[0].status).toBe("complete");
    expect(transport.uppy.upload).toHaveBeenCalledTimes(1);
    expect(transport.post).toHaveBeenCalledTimes(1);
  });

  it("refreshes the dataset list for a watched completion instead of unrelated successful jobs", async () => {
    vi.useFakeTimers();
    transport.post.mockResolvedValue({
      dataset: { id: "dataset-1", status: "preparing" },
      job: { id: "prepare-1", status: "queued" },
    });
    transport.api
      .mockResolvedValueOnce({
        jobs: [
          { id: "other-job", status: "succeeded" },
          { id: "prepare-1", status: "running" },
        ],
      })
      .mockResolvedValue({ jobs: [{ id: "prepare-1", status: "succeeded" }] });
    const hook = mount();
    const file = await queue(hook);
    await finish(file);
    const refreshes = () =>
      hook.invalidated.mock.calls.filter(
        ([filters]) => filters?.queryKey?.[0] === "datasets",
      );
    expect(hook.result.current.entries[0].status).toBe("preparing");
    expect(refreshes()).toHaveLength(1);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(hook.result.current.entries[0].status).toBe("complete");
    expect(refreshes()).toHaveLength(2);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10000);
    });
    expect(transport.api).toHaveBeenCalledTimes(2);
  });
});

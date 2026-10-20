import { useEffect, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, ApiError, post, session } from "../../lib/api";
import type { Job } from "../scenarios/api";
import { UploadContext, type UploadEntry } from "./upload-context";
import { uploadFormats, useUploader } from "./useUploader";

interface Registration {
  dataset: { id: string; status?: string };
  job?: Job;
}

const message = (error: unknown) =>
  error instanceof Error ? error.message : "Upload failed";

export function UploadProvider({ children }: { children: ReactNode }) {
  const uppy = useUploader();
  const client = useQueryClient();
  const [entries, setEntries] = useState<UploadEntry[]>([]);
  const [error, setError] = useState<string>();
  const alive = useRef(false);
  const registrations = useRef(new Set<string>());
  const retries = useRef(new Set<string>());
  const currentEntries = useRef(entries);
  currentEntries.current = entries;

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  // 전송 완료 파일은 한 번만 등록하고 원본 메타데이터를 사용
  useEffect(() => {
    if (!uppy) return;
    const update = (id: string, value: Partial<UploadEntry>) => {
      if (alive.current)
        setEntries((previous) =>
          previous.map((entry) =>
            entry.id === id ? { ...entry, ...value } : entry,
          ),
        );
    };
    const progress: Parameters<typeof uppy.on<"upload-progress">>[1] = (
      file,
      value,
    ) => {
      if (file)
        update(file.id, {
          progress: value.bytesTotal
            ? Math.min(
                100,
                Math.round((100 * value.bytesUploaded) / value.bytesTotal),
              )
            : 0,
        });
    };
    const failed: Parameters<typeof uppy.on<"upload-error">>[1] = (
      file,
      failure,
    ) => {
      if (file)
        update(file.id, {
          status: "error",
          error: failure.message,
          retry: "upload",
        });
    };
    const success: Parameters<typeof uppy.on<"upload-success">>[1] = (
      file,
      response,
    ) => {
      if (!file || !uppy.getFile(file.id) || registrations.current.has(file.id))
        return;
      registrations.current.add(file.id);
      update(file.id, {
        status: "registering",
        progress: 100,
        error: undefined,
        retry: undefined,
      });
      void (async () => {
        try {
          const path = new URL(response.uploadURL ?? "", location.origin)
            .pathname;
          if (!/^\/app-api\/uploads\/[a-zA-Z0-9_-]+$/.test(path))
            throw new Error("Invalid upload location");
          const result = await post<Registration>("/datasets", {
            name: (file.name ?? "Uploaded dataset").slice(0, 120),
            uploadIds: [path.split("/").at(-1)],
            mapping: {},
          });
          if (
            !result.dataset?.id ||
            (result.dataset.status === "preparing" && !result.job?.id)
          )
            throw new Error("Invalid dataset registration response");
          update(file.id, {
            status: result.job?.id ? "preparing" : "complete",
            jobId: result.job?.id,
          });
          void client.invalidateQueries({ queryKey: ["datasets"] });
          void client.invalidateQueries({ queryKey: ["jobs"] });
        } catch (failure) {
          const uncertain =
            !(failure instanceof ApiError) ||
            failure.status >= 500 ||
            failure.status === 409;
          update(file.id, {
            status: uncertain ? "uncertain" : "error",
            error: uncertain
              ? `${message(failure)}. Registration status is unknown. Check task history before uploading again.`
              : message(failure),
          });
        } finally {
          if (alive.current && uppy.getFile(file.id)) uppy.removeFile(file.id);
        }
      })();
    };
    uppy.on("upload-progress", progress);
    uppy.on("upload-error", failed);
    uppy.on("upload-success", success);
    return () => {
      uppy.off("upload-progress", progress);
      uppy.off("upload-error", failed);
      uppy.off("upload-success", success);
    };
  }, [uppy, client]);

  // 준비 작업을 묶어서 조회하고 완료된 데이터셋 목록을 갱신
  const waiting = entries.filter((entry) => entry.status === "preparing");
  const watchKey = waiting
    .map((entry) => `${entry.id}:${entry.jobId}:${entry.attempt ?? 0}`)
    .join(",");
  useEffect(() => {
    if (!watchKey) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const controller = new AbortController();
    const poll = async () => {
      try {
        const result = await api<{ jobs: Job[] }>("/jobs", {
          signal: controller.signal,
        });
        if (stopped) return;
        const jobs = new Map(result.jobs.map((job) => [job.id, job]));
        const completed = currentEntries.current.some(
          (entry) =>
            entry.status === "preparing" &&
            jobs.get(entry.jobId ?? "")?.status === "succeeded",
        );
        setEntries((previous) =>
          previous.map((entry) => {
            if (entry.status !== "preparing") return entry;
            const job = jobs.get(entry.jobId ?? "");
            if (job?.status === "succeeded") {
              return { ...entry, status: "complete", error: undefined };
            }
            if (
              job &&
              ["failed", "cancelled", "interrupted"].includes(job.status)
            )
              return {
                ...entry,
                status: "error",
                error: job.error ?? `Dataset preparation ${job.status}`,
                retry: "job",
              };
            return entry.error ? { ...entry, error: undefined } : entry;
          }),
        );
        // 상태 갱신과 별개로 성공한 작업의 목록을 즉시 재조회
        if (completed)
          void client.invalidateQueries({ queryKey: ["datasets"] });
      } catch (failure) {
        if (!stopped)
          setEntries((previous) =>
            previous.map((entry) =>
              entry.status === "preparing"
                ? {
                    ...entry,
                    error: `Task status unavailable. ${message(failure)}`,
                  }
                : entry,
            ),
          );
      }
      if (!stopped) timer = setTimeout(() => void poll(), 2000);
    };
    void poll();
    return () => {
      stopped = true;
      controller.abort();
      clearTimeout(timer);
    };
  }, [watchKey, client]);

  const transferring = entries.some((entry) =>
    ["uploading", "registering"].includes(entry.status),
  );
  useEffect(() => {
    if (!transferring) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [transferring]);

  async function addFiles(files: File[]) {
    if (!uppy || !files.length) return;
    setError(undefined);
    const accepted: File[] = [];
    const rejected: string[] = [];
    for (const file of files) {
      const extension = `.${file.name.split(".").at(-1)?.toLowerCase()}`;
      if (!uploadFormats.includes(extension))
        rejected.push(
          `Unsupported file type: ${file.name}. Use STL, VTK, or NPZ.`,
        );
      else if (!file.size) rejected.push(`Empty file: ${file.name}`);
      else accepted.push(file);
    }
    if (rejected.length) setError(rejected.join(" "));
    if (!accepted.length) return;
    try {
      await session();
      if (!alive.current) return;
      for (const file of accepted) {
        try {
          const id = uppy.addFile({
            name: file.name,
            type: file.type,
            data: file,
          });
          registrations.current.delete(id);
          setEntries((previous) => [
            ...previous.filter((entry) => entry.id !== id),
            {
              id,
              name: file.name,
              status: "uploading",
              progress: 0,
            },
          ]);
        } catch (failure) {
          setError(message(failure));
        }
      }
      await uppy.upload();
    } catch (failure) {
      if (alive.current) {
        setError(message(failure));
        setEntries((previous) =>
          previous.map((entry) =>
            entry.status === "uploading"
              ? {
                  ...entry,
                  status: "error",
                  error: message(failure),
                  retry: "upload",
                }
              : entry,
          ),
        );
      }
    }
  }

  async function retry(id: string) {
    const entry = currentEntries.current.find((item) => item.id === id);
    if (!entry?.retry || !uppy || retries.current.has(id)) return;
    retries.current.add(id);
    setEntries((previous) =>
      previous.map((item) =>
        item.id === id
          ? {
              ...item,
              status: entry.retry === "job" ? "registering" : "uploading",
              error: undefined,
            }
          : item,
      ),
    );
    try {
      await session();
      if (entry.retry === "job" && entry.jobId) {
        await post(`/jobs/${encodeURIComponent(entry.jobId)}/retry`, {});
        if (alive.current)
          setEntries((previous) =>
            previous.map((item) =>
              item.id === id
                ? {
                    ...item,
                    status: "preparing",
                    attempt: (item.attempt ?? 0) + 1,
                  }
                : item,
            ),
          );
      } else await uppy.retryUpload(id);
    } catch (failure) {
      if (alive.current)
        setEntries((previous) =>
          previous.map((item) =>
            item.id === id
              ? { ...item, status: "error", error: message(failure) }
              : item,
          ),
        );
    } finally {
      retries.current.delete(id);
    }
  }

  function dismiss(id: string) {
    if (uppy?.getFile(id)) uppy.removeFile(id);
    setEntries((previous) => previous.filter((entry) => entry.id !== id));
  }

  return (
    <UploadContext.Provider
      value={{ ready: Boolean(uppy), entries, error, addFiles, retry, dismiss }}
    >
      {children}
    </UploadContext.Provider>
  );
}

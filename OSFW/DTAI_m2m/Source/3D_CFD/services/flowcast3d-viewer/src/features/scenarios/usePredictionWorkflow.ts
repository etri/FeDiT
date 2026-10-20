import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, post } from "../../lib/api";
import { datasetSchema } from "../datasets/schema";
import { supports, type Dataset } from "../datasets/types";
import { useWorkspace } from "../../stores/workspace";
import { preparePredictionViews } from "../viewer/preparedViews";
import { usePreparedViewStore } from "../viewer/preparedViewStore";
import { usePlaybackTransport } from "../viewer/playbackTransport";

export interface PredictionSettings {
  source: [number, number, number];
  speed: number;
  direction: number;
  durationSeconds: number;
  stepSeconds: number;
  seed: number;
}
export type PredictionPhase =
  | "idle"
  | "predicting"
  | "dispersing"
  | "preparing"
  | "ready"
  | "cancelled"
  | "failed";
interface WorkflowState {
  phase: PredictionPhase;
  progress?: number;
  progressKey?: string;
  preparationLabel?: string;
  error?: Error;
  resultId?: string;
}
interface WorkflowJob {
  id: string;
  status: string;
  datasetId?: string;
  error?: string;
  progress?: { stage?: string; current: number; total: number };
  result?: { datasetId?: string };
}
interface ActiveRun {
  controller: AbortController;
  jobId?: string;
}
const REQUEST_TIMEOUT = 30_000;
const JOB_TIMEOUT = 20 * 60_000;
const POLL_INTERVAL = 1500;
const idle: WorkflowState = { phase: "idle" };

function aborted() {
  return new DOMException("Request aborted", "AbortError");
}

function wait(milliseconds: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) return reject(aborted());
    const onAbort = () => {
      clearTimeout(timer);
      reject(aborted());
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, milliseconds);
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

async function request<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  signal: AbortSignal,
): Promise<T> {
  if (signal.aborted) throw aborted();
  const controller = new AbortController();
  let timedOut = false;
  const relay = () => controller.abort();
  signal.addEventListener("abort", relay, { once: true });
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT);
  try {
    return await Promise.race([
      operation(controller.signal),
      new Promise<never>((_, reject) => {
        controller.signal.addEventListener(
          "abort",
          () =>
            reject(
              timedOut ? new Error("Request timed out. Try again.") : aborted(),
            ),
          { once: true },
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
    signal.removeEventListener("abort", relay);
  }
}

function jobResponse(value: unknown): WorkflowJob {
  if (!value || typeof value !== "object")
    throw new Error("Invalid job response.");
  const job = value as Partial<WorkflowJob>;
  if (typeof job.id !== "string" || !job.id || typeof job.status !== "string")
    throw new Error("Invalid job response.");
  return job as WorkflowJob;
}

function percentage(job: WorkflowJob) {
  const current = job.progress?.current,
    total = job.progress?.total;
  return typeof current === "number" &&
    Number.isFinite(current) &&
    current >= 0 &&
    typeof total === "number" &&
    Number.isFinite(total) &&
    total > 0 &&
    current <= total
    ? (current / total) * 100
    : undefined;
}

function validate(settings: PredictionSettings) {
  if (settings.source.length !== 3 || !settings.source.every(Number.isFinite))
    throw new Error("Source coordinates must contain three finite values.");
  if (
    !Number.isFinite(settings.speed) ||
    settings.speed <= 0 ||
    settings.speed > 100
  )
    throw new Error("Wind speed must be greater than 0 and at most 100 m/s.");
  if (
    !Number.isFinite(settings.direction) ||
    settings.direction < 0 ||
    settings.direction >= 360
  )
    throw new Error("Wind direction must be between 0 and 360 degrees.");
  if (
    !Number.isFinite(settings.durationSeconds) ||
    settings.durationSeconds < 1 ||
    settings.durationSeconds > 3600 ||
    !Number.isFinite(settings.stepSeconds) ||
    settings.stepSeconds < 0.1 ||
    settings.stepSeconds > 60 ||
    Math.ceil(settings.durationSeconds / settings.stepSeconds) > 360
  )
    throw new Error("Invalid simulation duration or output interval.");
  if (
    !Number.isInteger(settings.seed) ||
    settings.seed < 0 ||
    settings.seed > 2 ** 32 - 1
  )
    throw new Error("Seed must be an integer between 0 and 4294967295.");
}

export function usePredictionWorkflow(dataset?: Dataset) {
  const client = useQueryClient(),
    datasetId = dataset?.id,
    canPredict = supports(dataset, "predict"),
    active = useRef<ActiveRun | undefined>(undefined),
    revision = useRef(0);
  const [state, setState] = useState<WorkflowState>(idle);
  const cancelServer = useCallback(async (jobId: string) => {
    await request(
      (signal) => post(`/jobs/${encodeURIComponent(jobId)}/cancel`, {}, signal),
      new AbortController().signal,
    );
  }, []);

  useEffect(() => {
    setState(idle);
    return () => {
      const previous = active.current;
      revision.current += 1;
      active.current = undefined;
      previous?.controller.abort();
      if (previous?.jobId) void cancelServer(previous.jobId).catch(() => {});
    };
  }, [datasetId, cancelServer]);

  const clear = useCallback(() => {
    if (!active.current) setState(idle);
  }, []);
  const cancel = useCallback(async () => {
    const previous = active.current;
    if (!previous) return;
    const cancellation = ++revision.current;
    active.current = undefined;
    previous.controller.abort();
    setState({ phase: "cancelled" });
    if (previous.jobId) {
      try {
        await cancelServer(previous.jobId);
      } catch {
        if (revision.current !== cancellation) return;
        setState((current) =>
          current.phase === "cancelled"
            ? {
                ...current,
                error: new Error(
                  "Cancellation request failed. The server job may still be running.",
                ),
              }
            : current,
        );
      }
    }
  }, [cancelServer]);

  const run = useCallback(
    async (settings: PredictionSettings) => {
      if (active.current) return;
      revision.current += 1;
      const execution: ActiveRun = { controller: new AbortController() },
        signal = execution.controller.signal;
      active.current = execution;
      const current = () => active.current === execution && !signal.aborted;
      const update = (value: WorkflowState) => {
        if (current()) setState(value);
      };
      const poll = async (
        submitted: WorkflowJob,
        phase: "predicting" | "dispersing",
      ) => {
        let job = submitted;
        const deadline = Date.now() + JOB_TIMEOUT;
        while (current()) {
          update({
            phase,
            progress: percentage(job),
            progressKey: JSON.stringify([
              phase,
              job.progress?.stage,
              job.progress?.total,
            ]),
          });
          if (job.status === "succeeded") {
            execution.jobId = undefined;
            return job;
          }
          if (["failed", "cancelled", "interrupted"].includes(job.status)) {
            execution.jobId = undefined;
            throw new Error(
              job.error ||
                `${phase === "predicting" ? "Prediction" : "Dispersion"} ${job.status}.`,
            );
          }
          if (!["queued", "running"].includes(job.status))
            throw new Error(`Unexpected job status: ${job.status}.`);
          if (Date.now() >= deadline)
            throw new Error(
              "Job polling timed out. Check the server before trying again.",
            );
          await wait(POLL_INTERVAL, signal);
          const value = await request(
            (requestSignal) =>
              api<{ jobs: unknown[] }>("/jobs", { signal: requestSignal }),
            signal,
          );
          if (!Array.isArray(value.jobs))
            throw new Error("Invalid job list response.");
          const found = value.jobs.find(
            (candidate) =>
              candidate &&
              typeof candidate === "object" &&
              "id" in candidate &&
              candidate.id === submitted.id,
          );
          if (!found)
            throw new Error(
              "Submitted job was not found. Check the server before trying again.",
            );
          job = jobResponse(found);
        }
        throw aborted();
      };
      const submit = async (
        path: "/predict" | "/dispersion",
        body: unknown,
      ) => {
        const job = await request(async (requestSignal) => {
          const value = await post<unknown>(path, body, requestSignal);
          const job = jobResponse(
            path === "/predict"
              ? value
              : value && typeof value === "object" && "job" in value
                ? value.job
                : undefined,
          );
          if (!current()) void cancelServer(job.id).catch(() => {});
          return job;
        }, signal);
        execution.jobId = job.id;
        return job;
      };
      const refresh = () => {
        void client.invalidateQueries({ queryKey: ["jobs"] }).catch(() => {});
      };
      try {
        if (!datasetId?.startsWith("case:") || !canPredict)
          throw new Error("Prediction requires a prepared model case.");
        validate(settings);
        update({ phase: "predicting" });
        const prediction = await submit("/predict", {
          datasetId,
          speed: settings.speed,
          direction: settings.direction,
          steps: 1,
        });
        if (!current()) return;
        refresh();
        await poll(prediction, "predicting");
        update({ phase: "dispersing" });
        const submitted = await submit("/dispersion", {
          datasetId,
          resultId: prediction.id,
          source: settings.source,
          durationSeconds: settings.durationSeconds,
          stepSeconds: settings.stepSeconds,
          seed: settings.seed,
        });
        if (!current()) return;
        refresh();
        const completed = await poll(submitted, "dispersing"),
          resultId =
            completed.result?.datasetId ??
            completed.datasetId ??
            submitted.datasetId;
        if (!resultId || resultId === datasetId)
          throw new Error("Completed dispersion has no result dataset.");
        const result = datasetSchema.parse(
          await request(
            (requestSignal) =>
              api(
                `/datasets/${encodeURIComponent(datasetId)}?resultId=${encodeURIComponent(resultId)}`,
                { signal: requestSignal },
              ),
            signal,
          ),
        );
        if (
          !result.fields.some((field) => field.id === "concentration") ||
          !result.times.length
        )
          throw new Error("Completed dispersion has no concentration frames.");
        if (!current() || useWorkspace.getState().datasetId !== datasetId)
          return;
        update({ phase: "preparing", progress: 0 });
        const context = useWorkspace.getState();
        const views = await preparePredictionViews({
          client,
          dataset: result,
          resultId,
          windResultId: prediction.id,
          state: context,
          signal,
          onProgress: (completed, total, status) =>
            update({
              phase: "preparing",
              progress: status?.indeterminate
                ? undefined
                : total
                  ? (completed / total) * 100
                  : 0,
              progressKey: "display-modes",
              preparationLabel: status?.label,
            }),
        });
        if (!current() || useWorkspace.getState().datasetId !== datasetId)
          return;
        if (
          JSON.stringify(useWorkspace.getState().roi) !==
          JSON.stringify(context.roi)
        ) {
          update({ phase: "cancelled" });
          return;
        }
        client.setQueryData(["dataset", datasetId, resultId], result);
        usePreparedViewStore.setState({
          views,
          datasetId,
          resultId,
          resultVersion: result.version,
          roi: JSON.stringify(context.roi),
        });
        if (views.playback)
          usePlaybackTransport.getState().prepare(views.playback.key);
        useWorkspace.getState().set({
          resultId,
          fieldId: "concentration",
          frame: result.initialFrame ?? 0,
          mode: "volume",
          valueRange: undefined,
          compareId: "",
          compareResultId: "",
        });
        if (views.playback)
          usePlaybackTransport
            .getState()
            .setReady(views.playback.key, views.playback);
        update({ phase: "ready", progress: 100, resultId });
        void client
          .invalidateQueries({ queryKey: ["datasets"] })
          .catch(() => {});
        return resultId;
      } catch (error) {
        if (current()) {
          const failure =
            error instanceof Error
              ? error
              : new Error("Prediction workflow failed.");
          update({
            phase: /cancelled|interrupted/.test(failure.message)
              ? "cancelled"
              : "failed",
            error: failure,
          });
          if (execution.jobId)
            void cancelServer(execution.jobId).catch(() => {});
        }
      } finally {
        if (active.current === execution) active.current = undefined;
        refresh();
      }
    },
    [datasetId, canPredict, client, cancelServer],
  );

  return {
    ...state,
    busy:
      state.phase === "predicting" ||
      state.phase === "dispersing" ||
      state.phase === "preparing",
    run,
    cancel,
    clear,
  };
}

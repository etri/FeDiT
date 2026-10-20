import { useQuery } from "@tanstack/react-query";
import { api, post } from "../../lib/api";
export interface ScenarioBranch {
  status: string;
  stage?: string;
  jobId?: string;
  predictionJobId?: string;
  windResultId?: string;
  resultId?: string;
  error?: string;
}
export interface DispersionScenario {
  id: string;
  datasetId: string;
  status: string;
  colorRange?: [number, number];
  request: {
    source: [number, number, number];
    durationSeconds: number;
    stepSeconds: number;
    seed: number;
    direction: number;
    speed: number;
    referenceResultId?: string | null;
  };
  branches: { reference: ScenarioBranch; model: ScenarioBranch };
}
export function useDispersionScenarios(enabled: boolean) {
  return useQuery({
    queryKey: ["dispersion-scenarios"],
    queryFn: ({ signal }) =>
      api<{ scenarios: DispersionScenario[] }>("/dispersion-scenarios", {
        signal,
      }),
    enabled,
    retry: false,
    refetchInterval: enabled ? 3000 : false,
    select: (value) => value.scenarios,
  });
}
export interface Job {
  id: string;
  name?: string;
  status: string;
  progress?: { stage: string; current: number; total: number };
  error?: string;
  createdAt?: number;
  updatedAt?: number;
  cancellable?: boolean;
  datasetId?: string;
}
export function useJobs() {
  return useQuery({
    queryKey: ["jobs"],
    queryFn: ({ signal }) => api<{ jobs: Job[] }>("/jobs", { signal }),
    refetchInterval: 3000,
    select: (value) => value.jobs,
  });
}
export const cancelJob = (id: string) =>
  post(`/jobs/${encodeURIComponent(id)}/cancel`, {});
export const statusLabel: Record<string, string> = {
  queued: "대기",
  running: "실행 중",
  succeeded: "완료",
  failed: "실패",
  cancelled: "취소",
  interrupted: "중단",
  partial: "일부 완료",
  unavailable: "미지원",
};

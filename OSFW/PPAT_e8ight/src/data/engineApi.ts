// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   engineApi.ts

해석엔진(1세부 연동 API)을 부르는 얇은 층. 물리 시뮬레이션 페이지만 쓴다.
페이지와 같은 주소 아래 앞단 웹서버(deploy/proxy)가 길을 나눈다:
- engine/...   → 엔진 API (앞단이 앞부분 engine/ 을 떼고 넘긴다). POST /jobs, GET /jobs/{id}, GET /health
- results/...  → 엔진 작업 폴더(읽기 전용). 후처리가 결과를 바로 읽는다(post.html?job=<id>)
주소는 모두 페이지 기준 상대 주소라 서버의 하위 경로에 올려도 된다.
앞단에 접근 키(ACCESS_KEY)를 넣어 두면 해석 실행(POST)만 쿠키 cfd_key 를 확인한다(401). 비워 두면 열려 있다.
*/
/******************************************************************************/
import type { EngineKind, InputPackage } from './handoff';

export type { EngineKind };
export type JobState = 'queued' | 'running' | 'completed' | 'failed';

/** GET /jobs/{id} 응답 (엔진 integration/README.md 2.3절) */
export interface JobStatus {
  job_id: string;
  engine?: string;
  config?: string;
  inputs?: string[];
  status: JobState;
  message: string;
  created_at?: string;
  started_at?: string | null;
  finished_at?: string | null;
  exit_code?: number | null;
  /** 작업 폴더 기준 결과 폴더 (<job_id>/<입력 이름>/). 결과 폴더가 생기지 않았으면 null */
  result_path: string | null;
  progress: { step: number; total_steps: number; percent: number } | null;
}

export const ENGINE_BASE = 'engine';
export const RESULTS_BASE = 'results';
const KEY_COOKIE = 'cfd_key';

/** 엔진이 거절했거나 앞단이 막았을 때. status 401 = 접근 키 필요, 400 = 입력 오류(message 가 엔진의 설명) */
export class EngineError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}

/** 작업 번호: 영문·숫자·_·- 64자 이하(엔진 규칙). cfd-YYYYMMDD-HHMMSS-xxxx */
export function newJobId(now = new Date()): string {
  const p = (n: number, w = 2) => String(n).padStart(w, '0');
  const stamp = `${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}-${p(now.getHours())}${p(now.getMinutes())}${p(now.getSeconds())}`;
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(2)), (b) => b.toString(16).padStart(2, '0')).join('');
  return `cfd-${stamp}-${rand}`;
}

/** 해석 실행에 쓸 접근 키를 이 브라우저에 기억한다(쿠키, 1년). 빈 값이면 지운다 */
export function setAccessKey(key: string): void {
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  const value = key.trim();
  document.cookie = value
    ? `${KEY_COOKIE}=${encodeURIComponent(value)}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`
    : `${KEY_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}

export function hasAccessKey(): boolean {
  return document.cookie.split(';').some((c) => c.trim().startsWith(`${KEY_COOKIE}=`) && c.trim().length > KEY_COOKIE.length + 1);
}

async function readError(res: Response): Promise<EngineError> {
  let message = `HTTP ${res.status}`;
  try {
    const t = await res.text();
    try { const j = JSON.parse(t) as { message?: unknown; detail?: unknown }; message = String(j.message ?? j.detail ?? t); }
    catch { if (t.trim()) message = t.trim().slice(0, 300); }
  } catch { /* 본문 없음 */ }
  if (res.status === 401) message = '해석 실행에는 접근 키가 필요합니다.';
  return new EngineError(res.status, message);
}

/** POST /jobs. 받으면 202 와 { job_id, status: running|queued, message } */
export async function submitJob(jobId: string, pkg: InputPackage, signal?: AbortSignal): Promise<{ job_id: string; status: string; message: string }> {
  const form = new FormData();
  form.append('job_id', jobId);
  form.append('engine', pkg.engine);
  form.append('config', new Blob([pkg.config.text], { type: 'application/json' }), pkg.config.name);
  for (const f of pkg.files) form.append('files', new Blob([f.bytes as BlobPart], { type: 'application/octet-stream' }), f.name);
  const res = await fetch(`${ENGINE_BASE}/jobs`, { method: 'POST', body: form, credentials: 'same-origin', signal });
  if (res.status !== 202 && !res.ok) throw await readError(res);
  return res.json();
}

/** GET /jobs/{id}. 없는 작업은 EngineError(404) */
export async function getJob(jobId: string, signal?: AbortSignal): Promise<JobStatus> {
  const res = await fetch(`${ENGINE_BASE}/jobs/${encodeURIComponent(jobId)}`, { credentials: 'same-origin', cache: 'no-store', signal });
  if (!res.ok) throw await readError(res);
  return res.json();
}

/** GET /health. GPU 가 안 보이면 엔진이 503(no_gpu) 을 준다 */
export async function getHealth(signal?: AbortSignal): Promise<{ status: string; gpus?: { name: string }[]; running_job?: string | null; queued_jobs?: number }> {
  const res = await fetch(`${ENGINE_BASE}/health`, { credentials: 'same-origin', cache: 'no-store', signal });
  if (!res.ok && res.status !== 503) throw await readError(res);
  return res.json();
}

/** 후처리가 이 작업의 결과를 읽을 주소(작업 폴더). post.html?job=<id> 가 이 아래를 훑어 .vtm 을 찾는다 */
export function resultFolderUrl(jobId: string): string {
  return `${RESULTS_BASE}/${encodeURIComponent(jobId)}`;
}

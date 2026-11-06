// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   serverJobs.ts

서버(1세부 해석엔진의 작업 폴더)에 쌓인 해석 목록을 읽는다. 물리 시뮬레이션 페이지와 후처리 페이지가 함께 쓴다.
- 목록: 앞단이 results/ 맨 윗단을 nginx 폴더 목록(JSON [{name,type,mtime}])으로 내준다(deploy/proxy/locations.conf).
- 한 줄: 작업마다 엔진이 쓰는 상태 파일 results/<작업 번호>/engine_job.json (job_id·engine·config·status·시각).
엔진 API(engine/)는 부르지 않는다. 결과 폴더의 파일만 읽으므로 후처리도 쓸 수 있다(해석 작업은 물리 시뮬레이션 페이지만, 2026-10-21).
목록 출처를 1세부 API(예: GET /jobs)로 바꾸게 되면 이 파일만 고친다.
결과는 공개다: 이 목록은 서버에 쌓인 모든 해석을 보여 준다(2026-11-04 결정, deploy/README.md 1.4절).
*/
/******************************************************************************/
import { RESULTS_BASE, type JobState } from './engineApi';

/** 작업 번호 규칙(엔진과 같음): 영문·숫자·_·- 64자 이하 */
export const JOB_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

/** 한 번에 보이는 줄 수. '더 보기'가 이만큼씩 더 읽는다 */
export const JOB_PAGE = 20;

/** 맨 윗단 목록의 작업 폴더 하나 */
export interface JobFolder {
  id: string;
  /** 폴더 수정 시각(ms). 엔진이 상태 파일을 바꿔 쓸 때마다 바뀌므로 '마지막 활동 시각'이다(시작 시각 아님). 정렬에만 쓴다. 모르면 0 */
  mtime: number;
}

/** 상태 파일을 못 읽으면 'unknown' */
export type ServerJobState = JobState | 'unknown';

/** 목록 한 줄 */
export interface ServerJob {
  id: string;
  /** 표시 이름: 올린 입력 JSON 파일 이름에서 .json 을 뺀 것. 모르면 작업 번호 */
  name: string;
  /** 올린 입력 JSON 파일 이름 (엔진 상태 파일의 config) */
  config: string | null;
  /** lbm · lbm_dem */
  engine: string | null;
  status: ServerJobState;
  /** 엔진의 한 줄 설명(실패 이유 등). 상태 파일을 못 읽었으면 그 까닭 */
  message: string;
  /** 시각(ms). 모르면 NaN */
  createdAt: number;
  startedAt: number;
  finishedAt: number;
  /** 폴더 수정 시각(ms) */
  activity: number;
}

export const STATE_LABEL: Record<ServerJobState, string> = { queued: '대기 중', running: '실행 중', completed: '완료', failed: '실패', unknown: '상태 모름' };
/** 꼬리표 색 이름(.tag.ok · .tag.err · .tag.run) */
export const STATE_TAG: Record<ServerJobState, string> = { queued: '', running: 'run', completed: 'ok', failed: 'err', unknown: '' };

const STATES: readonly JobState[] = ['queued', 'running', 'completed', 'failed'];

/** nginx 폴더 목록 JSON → 작업 폴더. 폴더만, 점(.)으로 시작하지 않고 작업 번호 형식인 이름만. 최근 활동순(같으면 번호 역순) */
export function parseJobFolders(data: unknown): JobFolder[] {
  if (!Array.isArray(data)) throw new Error('해석 목록 응답이 목록 형식이 아닙니다.');
  const out: JobFolder[] = [];
  for (const it of data) {
    const o = (it ?? {}) as { name?: unknown; type?: unknown; mtime?: unknown };
    if (o.type !== 'directory' || typeof o.name !== 'string') continue;
    if (o.name.startsWith('.') || !JOB_ID_RE.test(o.name)) continue;
    const t = typeof o.mtime === 'string' ? Date.parse(o.mtime) : NaN;
    out.push({ id: o.name, mtime: Number.isFinite(t) ? t : 0 });
  }
  out.sort((a, b) => b.mtime - a.mtime || (a.id < b.id ? 1 : a.id > b.id ? -1 : 0));
  return out;
}

/** 서버의 작업 폴더 목록 (요청 1번). 목록을 내주지 않는 서버(옛 앞단)는 404. 오류는 모두 한국어 한 줄(끊기(abort)만 그대로) */
export async function listJobFolders(signal?: AbortSignal): Promise<JobFolder[]> {
  let res: Response;
  try {
    res = await fetch(`${RESULTS_BASE}/`, { cache: 'no-store', credentials: 'same-origin', signal });
  } catch (e) {
    if (signal?.aborted) throw e;
    throw new Error('서버에 연결하지 못했습니다.'); // 브라우저의 'Failed to fetch' 를 화면에 그대로 보이지 않게
  }
  if (res.status === 404) throw new Error('이 서버는 해석 목록을 내주지 않습니다.');
  if (!res.ok) throw new Error(`해석 목록을 읽지 못했습니다 (HTTP ${res.status}).`);
  let data: unknown;
  try { data = await res.json(); } catch { throw new Error('해석 목록 응답을 읽지 못했습니다.'); }
  return parseJobFolders(data);
}

const str = (v: unknown): string | null => (typeof v === 'string' && v ? v : null);
const time = (v: unknown): number => (typeof v === 'string' && v ? Date.parse(v) : NaN);

/** 표시 이름: 'thermal.json' → 'thermal'. 없으면 작업 번호 */
export function displayName(config: string | null, id: string): string {
  return config ? config.replace(/\.json$/i, '') || config : id;
}

/** 상태 파일을 못 읽은 작업 한 줄 */
export function unknownJob(folder: JobFolder, message: string): ServerJob {
  return { id: folder.id, name: folder.id, config: null, engine: null, status: 'unknown', message, createdAt: NaN, startedAt: NaN, finishedAt: NaN, activity: folder.mtime };
}

/** 상태 파일(engine_job.json) 내용 → 한 줄. 모르는 status 는 'unknown' */
export function parseJobRecord(folder: JobFolder, data: unknown): ServerJob {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return unknownJob(folder, '상태 파일 형식이 맞지 않습니다.');
  const o = data as Record<string, unknown>;
  const config = str(o.config);
  const status = STATES.includes(o.status as JobState) ? (o.status as JobState) : 'unknown';
  return {
    id: folder.id,
    name: displayName(config, folder.id),
    config,
    engine: str(o.engine),
    status,
    message: str(o.message) ?? '',
    createdAt: time(o.created_at),
    startedAt: time(o.started_at),
    finishedAt: time(o.finished_at),
    activity: folder.mtime,
  };
}

/** 작업 하나의 상태 파일을 읽는다. 없거나(404) 막혔거나(403) 못 읽으면 '상태 모름' 줄 (예외를 던지지 않음, 끊기(abort)만 예외) */
export async function readJob(folder: JobFolder, signal?: AbortSignal): Promise<ServerJob> {
  let res: Response;
  try {
    res = await fetch(`${RESULTS_BASE}/${encodeURIComponent(folder.id)}/engine_job.json`, { cache: 'no-store', credentials: 'same-origin', signal });
  } catch (e) {
    if (signal?.aborted) throw e;
    return unknownJob(folder, '상태 파일을 읽지 못했습니다.');
  }
  if (!res.ok) return unknownJob(folder, res.status === 404 ? '상태 파일이 없습니다 (HTTP 404).' : `상태 파일을 읽지 못했습니다 (HTTP ${res.status}).`);
  try { return parseJobRecord(folder, await res.json()); }
  catch (e) {
    if (signal?.aborted) throw e;
    return unknownJob(folder, '상태 파일을 읽지 못했습니다.');
  }
}

/** 여러 작업의 상태 파일을 동시에 몇 개씩 읽는다. 순서는 넘긴 순서 그대로 */
export async function readJobs(folders: JobFolder[], signal?: AbortSignal, concurrency = 6): Promise<ServerJob[]> {
  const out: ServerJob[] = new Array(folders.length);
  let next = 0;
  const worker = async (): Promise<void> => {
    while (next < folders.length) {
      const i = next++;
      out[i] = await readJob(folders[i], signal);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, folders.length) }, worker));
  return out;
}

/** 결과를 열어 볼 수 있는 상태: 완료 · 실패(끊긴 시점까지 저장된 것) · 상태 모름(열어 보고 안 되면 그 줄에 오류) */
export const canOpenResult = (j: ServerJob): boolean => j.status === 'completed' || j.status === 'failed' || j.status === 'unknown';
/** 아직 끝나지 않은 해석 */
export const isActive = (j: ServerJob): boolean => j.status === 'queued' || j.status === 'running';

/** 걸린 시간(ms): 끝난 시각 - 시작 시각. 둘 중 하나라도 모르면 null */
export function durationMs(j: ServerJob): number | null {
  return Number.isFinite(j.startedAt) && Number.isFinite(j.finishedAt) ? Math.max(0, j.finishedAt - j.startedAt) : null;
}

/** 'MM-DD HH:mm' (보는 PC 의 시간대). 모르면 '-' */
export function fmtWhen(ms: number): string {
  if (!Number.isFinite(ms)) return '-';
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** 짧은 걸린 시간: '1시간 8분' · '4분 41초' · '10초' */
export function fmtDur(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  return h ? `${h}시간 ${m}분` : m ? `${m}분 ${r}초` : `${r}초`;
}

/** 줄 아래쪽 한 줄: '11-04 14:04 · 4분 41초' (시작 시각, 끝났으면 걸린 시간) */
export function jobWhenText(j: ServerJob): string {
  const start = Number.isFinite(j.startedAt) ? j.startedAt : j.createdAt;
  const parts = [fmtWhen(Number.isFinite(start) ? start : j.activity || NaN)];
  const d = durationMs(j);
  if (d !== null && !isActive(j)) parts.push(fmtDur(d));
  return parts.join(' · ');
}

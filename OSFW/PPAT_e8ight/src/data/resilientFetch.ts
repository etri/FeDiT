// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   resilientFetch.ts

결과 파일을 HTTP 로 읽을 때, 망에서 멈추거나 끊긴 요청을 스스로 끊고 다시 보낸다(source.ts HttpSource · HttpFolder 가 쓴다).
2026-11-06 운영 서버(cfd.fedit.or.kr)에서 본 것: 요청 대부분은 0.1 초 안팎인데, 가끔 새 연결이 15~21 초 붙지 않거나
받는 도중 몇십 초 멈추거나(DevTools 'Pending') 끊긴다(ERR_CONNECTION_RESET). 브라우저는 멈춘 요청을 분 단위로 기다리므로
그 하나 때문에 재생이 서고, 끊기면 읽기가 실패했다. 같은 16.8 MB 가 0.3 초에 오기도, 2 분에 7.5 MB 에서 멈추기도 했다 — 느린 것이 아니라 멈춘다.
- 멈춤: 응답 머리나 본문 바이트가 STALL_MS 동안 하나도 오지 않으면 그 요청을 끊는다(느려도 바이트가 계속 오면 기다린다).
- 다시 보내기: 멈춤 · 연결 실패 · 받는 도중 끊김(fetch 의 TypeError) · 502/503/504 면 잠깐 쉬었다 다시 보낸다(모두 MAX_TRIES 번까지).
  바이트 구간 요청은 받은 데까지 두고 나머지만 다시 요청한다(이어 받기). 다 실패하면 한국어 한 줄 — 실패가 모두 멈춤이면 '… 모두 멈췄습니다',
  모두 끊김이면 '… 모두 끊겼습니다', 섞였으면 까닭마다 횟수(giveUp).
- 같은 날 오후 측정: 큰 응답을 받는 동안 그 서버에서 오는 데이터 전체가 30~55 초씩 통째로 끊기고, 그 사이 새 연결로 다시 요청해도(HTTP/1.1 · HTTP/2)
  5 초씩 아무것도 오지 않다가 30 초쯤 뒤 다시 흐른다(같은 PC 에서 nodejs.org 는 늘 빠름 — 서버 쪽 길의 문제). 그래서 다시 보내기 예산을 2 분 남짓으로 잡는다(MAX_TRIES).
- 받기 단계(같은 날 밤 — rangeGovernor.ts): 모든 바이트 구간 받기(fetchRange)는 그 서버 주소(origin)의 자동 단계 조절기에서 요청마다 줄을 선다.
  처음(0단계)은 제약 없음 — 구간을 큰 요청 한 번으로. 끊김 · 느려짐을 알아채면 그 주소만 단계를 낮춘다: 1단계 2 MB 조각을 그 주소 전체에서 동시 1개씩
  + 0단계에서 잰 실제 속도(받은 바이트 ÷ 바쁜 시간)의 절반 상한(못 쟀으면 상한 없음 — Chrome 실측: 상한 없는 1단계는 한 번 더 끊김),
  2단계부터 동시 1개 + 앞 단계 실제 속도와 앞 상한 가운데 작은 것의 절반 + 조각도 단계마다 절반(바닥 256 KB · 1 MB/s) — 느려짐으로 낮출 때는
  잰 실제 속도(이미 느려진 속도) 대신 느려지기 전 속도(상한, 없으면 그 단계 표본 중앙값)의 절반. 그 페이지에서는 올리지 않고,
  브라우저에 하루 기억한다. 끊김 신호는 멈춤 · 응답 머리나 본문을 받은 뒤의 연결 끊김(TypeError) · 덜 받음(Content-Range, 못 읽으면 Content-Length 가
  약속한 만큼 오기 전에 닫힘 — 둘 다 못 읽으면 신호 아님)이다 — 502/503/504 · 응답 머리 전 연결 실패는 다시 보내기만 하고 신호로 세지 않고,
  바깥 signal 로 끊은 것(취소)은 사유가 TypeError 여도 세지 않는다(fetchRange).
  조각 크기는 요청마다 그때 단계를 본다 — 0단계의 큰 요청이 도중에 멈춰 1단계가 되면 남은 바이트는 2 MB 조각으로 이어 받는다.
  조각 하나를 다 받으면 그 자리를 다음 조각에 넘기고(handoff — 먼저 부른 같은 차례 · 뒤 차례 읽기에 끼어들기를 당하지 않고, 앞 차례 · 나중에 부른 보는 장면이 기다리면 그쪽이 먼저)
  다시 보내기 횟수를 새로 센다(조각마다 MAX_TRIES). 첫 요청에서 서버가 Range 를 무시하면(200 전체) 그것을 돌려준다.
  Content-Range 를 못 읽는 206(다른 출처)이 Content-Length 만큼 다 왔는데 요청보다 적으면 파일 끝에서 줄여 준 것으로 보고 거기까지 돌려준다
  (다시 보내지 않음 · 신호 없음 — 전에는 나머지를 다시 요청해 416 으로 실패).
  예전(같은 날 저녁)의 고정 속도 조절(초당 10 MB · 통 4 MB · 2 MB 조각을 늘 차례로)은 없앴다 — 다른 서버에 배포했을 때 묶이지 않게.
  HEAD · 폴더 목록 · 작은 파일(fetchWhole)은 조절기를 거치지 않는다.
- 바깥 signal('전 시점 범위' [취소] 등)로 끊으면 다시 보내지 않고(조절기 줄에서 기다리던 중이어도) 바로 그 이유로 끝낸다. 줄에서 기다린 뒤 보내기 직전에도
  signal 을 다시 본다(검증 지적 4 — 그 틈에 끊겨도 요청이 나가지 않게). 바이트 구간이 유한한 정수가 아니면(NaN 등) 보내기 전에 거부한다(검증 지적 3).
시험: scripts/test_resilient_fetch.mjs (가짜 fetch · 다시 보내기 · 이어 받기 · 조각), scripts/test_adaptive_fetch.mjs (단계 조절기).
*/
/******************************************************************************/
import { RangeGovernor, RangeTicket, ReadPriority, rangeGovernor } from './rangeGovernor';

/** 응답 머리·본문 바이트가 이만큼 오지 않으면 멈춘 것으로 보고 끊는다 (ms) */
export const STALL_MS = 5000;
/**
 * 한 요청을 보내는 최대 횟수 (처음 포함). 멈춤이 이어지면 한 번에 STALL_MS(5 초) + 쉬는 시간이라 16 번이면 약 2 분 10 초
 * (16 × 5 초 + 쉼 0.3 · 1 · 2 · 3 · 4 · 4 … 합 50.3 초) — 운영 서버의 30~55 초 끊김을 넘긴다. 바로 끊기는 실패만 이어지면 쉼 합 약 50 초.
 * 2026-11-06 오후 8 → 16 (8 번은 멈춤만 이어질 때 약 58 초라 55 초 끊김에 빠듯했다). 바이트 구간은 조각 하나를 다 받을 때마다 새로 센다
 */
export const MAX_TRIES = 16;
/** n 번째 다시 보내기 전에 쉬는 시간 (ms). 모자라면 마지막 값 */
export const RETRY_DELAYS_MS: readonly number[] = [300, 1000, 2000, 3000, 4000];
const RETRY_STATUS = new Set([502, 503, 504]);

export interface FetchOpts {
  fetchImpl?: typeof fetch;
  stallMs?: number;
  tries?: number;
  delays?: readonly number[];
  /** 다시 보내기 직전에 부른다(다음이 몇 번째 시도인지 · 까닭). 없으면 콘솔 경고 한 줄 */
  onRetry?: (attempt: number, reason: string, url: string) => void;
  /** 바이트 구간 받기(fetchRange)의 자동 단계 조절기. 없으면 rangeGovernor(모든 읽기가 함께 씀), null 이면 조절하지 않는다(나누지 않음 · 줄 없음). fetchWhole 은 쓰지 않는다 */
  governor?: RangeGovernor | null;
  /** 줄 차례 (fetchRange — 없으면 PRIORITY_VIEW: 지금 보는 장면) */
  priority?: ReadPriority;
  /** 한 요청이 받는 바이트를 정해 준다(시험). 없으면 그 주소의 지금 단계 — 0단계는 나누지 않음 */
  chunk?: number;
}

/** 받은 응답. body = 본문 전체(HEAD 면 null) */
export interface Fetched { status: number; ok: boolean; headers: Headers; body: Uint8Array | null }

/** 멈춰서 우리가 끊은 요청 */
class Stalled extends Error {}

const abortReason = (signal: AbortSignal): unknown => signal.reason ?? new DOMException('Aborted', 'AbortError');
const fileName = (url: string): string => { try { return decodeURIComponent(url.slice(url.lastIndexOf('/') + 1)); } catch { return url; } };

/** ms 동안 쉰다. 바깥 signal 로 끊으면 바로 그 이유로 끝난다 */
function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) { reject(abortReason(signal)); return; }
    const onAbort = (): void => { clearTimeout(t); reject(abortReason(signal!)); };
    const t = setTimeout(() => { signal?.removeEventListener('abort', onAbort); resolve(); }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/** 다시 보내도 되는 실패인가: 우리가 끊은 멈춤 · 연결 실패와 받는 도중 끊김(브라우저 fetch 는 TypeError) */
const retryable = (e: unknown): boolean => e instanceof Stalled || e instanceof TypeError;

function concat(parts: Uint8Array[], total: number): Uint8Array {
  if (parts.length === 1 && parts[0].byteLength === total && parts[0].byteOffset === 0 && parts[0].buffer.byteLength === total) return parts[0];
  const out = new Uint8Array(total);
  let at = 0;
  for (const p of parts) { out.set(p, at); at += p.byteLength; }
  return out;
}

/** 206 응답의 Content-Range(bytes a-b/전체)에서 파일 전체 길이. 모르면('*') null */
function sizeFromContentRange(h: Headers): number | null {
  const m = /\/(\d+)\s*$/.exec(h.get('content-range') ?? '');
  return m ? Number(m[1]) : null;
}
/** 206 응답의 Content-Range(bytes a-b/…)가 약속한 본문 바이트 수 (b - a + 1). 모르면 null */
function promisedFromContentRange(h: Headers): number | null {
  const m = /bytes\s+(\d+)-(\d+)\s*\//i.exec(h.get('content-range') ?? '');
  return m ? Number(m[2]) - Number(m[1]) + 1 : null;
}
/** Content-Length (유한한 0 이상 정수일 때). 못 읽으면 null */
function contentLength(h: Headers): number | null {
  const cl = (h.get('content-length') ?? '').trim();
  if (!/^\d+$/.test(cl)) return null;
  const n = Number(cl);
  return Number.isSafeInteger(n) ? n : null;
}
/**
 * 응답이 약속한 본문 바이트 수: Content-Range 에서 읽은 양, 못 읽으면 Content-Length(유한한 0 이상 정수일 때), 둘 다 없으면 null.
 * 다른 출처(origin) 배포에서 서버가 Access-Control-Expose-Headers 로 Content-Range 를 열어 주지 않으면 브라우저 코드는 그것을 못 읽는다(Content-Length 는 읽힘)
 */
function promisedBytes(h: Headers): number | null {
  return promisedFromContentRange(h) ?? contentLength(h);
}

/** Uint8Array → 딱 그 길이의 ArrayBuffer (이미 딱 맞으면 복사하지 않는다) */
export function toArrayBuffer(u: Uint8Array): ArrayBuffer {
  return (u.byteOffset === 0 && u.byteLength === u.buffer.byteLength ? u.buffer : u.slice().buffer) as ArrayBuffer;
}

/**
 * 요청 한 번. 응답 머리가 오면 sink(res) 로 본문 조각 받을 곳을 얻어 조각마다 넘긴다(끊겨도 받은 조각은 이미 넘어가 있다 — 이어 받기용).
 * 머리·본문 바이트가 stallMs 동안 오지 않으면 끊고 Stalled 를 던진다. 바깥 signal 로 끊기면(부르기 전에 이미 끊겼어도) 보내지 않고 그 이유를 던진다.
 */
async function attemptOnce(
  url: string, init: RequestInit, signal: AbortSignal | undefined, stallMs: number, fetchImpl: typeof fetch,
  sink: (res: Response) => ((chunk: Uint8Array) => void) | null,
): Promise<Response> {
  if (signal?.aborted) throw abortReason(signal); // 이미 지나간 abort 사건에 듣기만 붙이지 않게
  const ctrl = new AbortController();
  const onOuter = (): void => ctrl.abort(abortReason(signal!));
  signal?.addEventListener('abort', onOuter, { once: true });
  let stalled = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const arm = (): void => {
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => { stalled = true; ctrl.abort(new Stalled('stalled')); }, stallMs);
  };
  arm();
  try {
    const res = await fetchImpl(url, { ...init, signal: ctrl.signal });
    arm();
    const put = sink(res);
    if (res.body) {
      if (!put) { await res.body.cancel().catch(() => undefined); return res; } // 본문이 필요 없으면 연결을 바로 놓아 준다
      const reader = res.body.getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        arm();
        if (value && value.byteLength) put(value);
      }
    }
    return res;
  } catch (e) {
    if (signal?.aborted) throw abortReason(signal);
    if (stalled) throw new Stalled('stalled');
    throw e;
  } finally {
    if (timer !== null) clearTimeout(timer);
    signal?.removeEventListener('abort', onOuter);
  }
}

/** fails = 다시 보낼 수 있는 실패의 까닭마다 횟수 ('응답 멈춤' · '연결 끊김' · 'HTTP 503' · '덜 받음') — 다 실패했을 때의 한 줄(giveUp) */
interface Ctx { url: string; signal?: AbortSignal; fetchImpl: typeof fetch; stallMs: number; tries: number; delays: readonly number[]; onRetry: NonNullable<FetchOpts['onRetry']>; fails: Map<string, number> }

function ctxOf(url: string, signal: AbortSignal | undefined, o: FetchOpts): Ctx {
  return {
    url, signal,
    fetchImpl: o.fetchImpl ?? ((...a: Parameters<typeof fetch>) => fetch(...a)),
    stallMs: o.stallMs ?? STALL_MS,
    tries: Math.max(1, o.tries ?? MAX_TRIES),
    delays: o.delays ?? RETRY_DELAYS_MS,
    onRetry: o.onRetry ?? ((n, why, u) => console.warn(`[결과 읽기] ${fileName(u)}: ${why} → ${n}번째로 다시 요청`)),
    fails: new Map(),
  };
}

/**
 * 다 해 봐도 안 될 때의 한국어 한 줄. 실패가 모두 멈춤이면 '서버 응답이 n번 모두 멈췄습니다', 모두 끊김이면 '서버와 연결이 n번 모두 끊겼습니다',
 * 섞였으면 '서버에서 n번 모두 받지 못했습니다 (응답 멈춤 a번 · 연결 끊김 b번 …)' — 마지막 실패만 보고 '모두 멈춤'이라 하지 않게.
 * 덜 받음(연결이 오류 없이 일찍 닫힘)으로 끝나도 같은 꼴이다(예전에는 'null' 한 줄이 나갔다)
 */
function giveUp(c: Ctx): Error {
  const name = fileName(c.url);
  const kinds = Array.from(c.fails);
  const total = kinds.reduce((s, [, n]) => s + n, 0);
  if (kinds.length === 1 && kinds[0][0] === '응답 멈춤') return new Error(`서버 응답이 ${total}번 모두 멈췄습니다: ${name}`);
  if (kinds.length === 1 && kinds[0][0] === '연결 끊김') return new Error(`서버와 연결이 ${total}번 모두 끊겼습니다: ${name}`);
  return new Error(`서버에서 ${total}번 모두 받지 못했습니다 (${kinds.map(([k, n]) => `${k} ${n}번`).join(' · ')}): ${name}`);
}

const why = (e: unknown): string => (e instanceof Stalled ? '응답 멈춤' : e instanceof TypeError ? '연결 끊김' : String(e));
/** 실패 까닭의 종류 (한 줄에 셀 때 — '덜 받음 160/200 B' 는 '덜 받음') */
const kindOf = (reason: string): string => (reason.startsWith('덜 받음') ? '덜 받음' : reason);

/** 실패 하나를 처리: 다시 보낼 수 있으면 콘솔에 남기고 잠깐 쉰다. 다시 보낼 수 없거나 횟수를 다 썼으면 던진다. reason 이 있으면(상태 코드 · 덜 받음) 늘 다시 보낼 수 있는 실패 */
async function backoff(c: Ctx, attempt: number, e: unknown, reason?: string): Promise<void> {
  if (c.signal?.aborted) throw abortReason(c.signal);
  if (reason === undefined && !retryable(e)) throw e;
  const r = reason ?? why(e);
  c.fails.set(kindOf(r), (c.fails.get(kindOf(r)) ?? 0) + 1);
  if (attempt >= c.tries) throw giveUp(c);
  c.onRetry(attempt + 1, r, c.url);
  await sleep(c.delays[Math.min(attempt - 1, c.delays.length - 1)] ?? 0, c.signal);
}

/**
 * 본문 전체를 받는 요청(HEAD · 폴더 목록 · 작은 파일). 멈춤 · 연결 실패 · 502/503/504 면 처음부터 다시 보낸다.
 * 그 밖의 상태(404 등)는 그대로 돌려준다 — 판단은 부른 쪽. 받기 단계 조절기(rangeGovernor)는 쓰지 않는다(작은 요청 — 큰 값 받기 뒤에 줄 서지 않게)
 */
export async function fetchWhole(url: string, init: { method?: 'GET' | 'HEAD'; headers?: Record<string, string> } = {}, signal?: AbortSignal, opts: FetchOpts = {}): Promise<Fetched> {
  const c = ctxOf(url, signal, opts);
  const head = init.method === 'HEAD';
  for (let attempt = 1; ; attempt++) {
    if (signal?.aborted) throw abortReason(signal);
    const parts: Uint8Array[] = [];
    let got = 0;
    let res: Response;
    try {
      res = await attemptOnce(url, init, signal, c.stallMs, c.fetchImpl, () => (head ? null : (b) => { parts.push(b); got += b.byteLength; }));
    } catch (e) {
      await backoff(c, attempt, e);
      continue;
    }
    if (RETRY_STATUS.has(res.status) && attempt < c.tries) { await backoff(c, attempt, null, `HTTP ${res.status}`); continue; }
    return { status: res.status, ok: res.ok, headers: res.headers, body: head ? null : concat(parts, got) };
  }
}

/**
 * [start, end] 바이트 구간(끝 포함) 하나. 요청마다 그 서버 주소의 받기 단계 조절기(opts.governor — 없으면 rangeGovernor)에서 줄을 서고(줄 차례 opts.priority),
 * 그때 단계의 조각 크기만큼 받는다 — 0단계는 구간 전체를 한 번에, 1단계부터는 그 단계 조각(2 MB, 2단계부터 단계마다 절반)을 차례로(다 받은 조각의 자리는
 * 다음 조각에 넘김). 받는 도중 멈추거나 끊기면 받은 데까지 두고 나머지만 다시 요청한다(멈춤 · 응답 머리를 받은 뒤의 끊김 · 덜 받음은 조절기에 끊김 신호로 알린다
 * — 바깥 signal 로 끊은 것은 알리지 않는다). 파일 끝을 넘는 구간이면 첫 206 의 Content-Range(전체 길이)로 줄여 있는 데까지만 돌려준다(ByteSource.read 약속).
 * Content-Range 를 못 읽으면(다른 출처) Content-Length 만큼 다 받았고 그것이 요청한 양보다 적을 때 서버가 파일 끝에서 줄여 준 것으로 보고 거기까지 돌려준다.
 * 서버가 Range 를 무시하고 200 으로 전체를 주면 { status: 200, body: 전체 } 를 돌려준다(부른 쪽이 잘라 쓴다 — 끊기면 전체를 처음부터).
 * 그 밖의 상태(404 · 416 등)는 body null 로 돌려준다. start · end 가 유한한 정수가 아니면(NaN 등) 보내기 전에 거부한다.
 */
export async function fetchRange(url: string, start: number, end: number, signal?: AbortSignal, opts: FetchOpts = {}): Promise<Fetched> {
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0) throw new Error(`바이트 구간이 잘못되었습니다 (${start}~${end}): ${fileName(url)}`);
  const c = ctxOf(url, signal, opts);
  const gov = opts.governor === undefined ? rangeGovernor.forUrl(url) : opts.governor ? opts.governor.forUrl(url) : null;
  let want = end - start + 1; // 파일 끝을 넘는 구간이면 첫 206 의 Content-Range(전체 길이)로 줄인다
  const parts: Uint8Array[] = [];
  let got = 0; // 206 으로 받아 둔 바이트 (다음 요청의 시작점)
  let carry: RangeTicket | null = null; // 다 받은 앞 조각의 자리 — 다음 조각에 넘긴다(handoff: 같은 차례 사이에서 조각이 끼어들기를 당하지 않게)
  let order: number | undefined; // 이 읽기의 부른 차례 (다시 보내기도 그대로)
  for (let attempt = 1; ;) {
    if (signal?.aborted) { carry?.release(true); throw abortReason(signal); }
    const from = start + got;
    const piece = opts.chunk !== undefined && opts.chunk > 0 ? opts.chunk : (gov?.chunkBytes ?? Infinity); // 요청마다 그때 단계를 본다
    const to = Math.min(start + want - 1, from + piece - 1);
    let ticket: RangeTicket | null = null;
    if (gov) {
      const prev: RangeTicket | null = carry;
      carry = null;
      const t: RangeTicket = await (prev ? prev.handoff(to - from + 1, signal) : gov.acquire(to - from + 1, opts.priority, signal, order));
      order = t.order;
      ticket = t;
    }
    if (signal?.aborted) { ticket?.release(false); throw abortReason(signal); } // 줄에서 기다린 뒤 보내기 직전에 끊겼으면 보내지 않는다
    let whole: Uint8Array[] | null = null; // 200(전체)일 때만
    let wholeGot = 0;
    let headed = false; // 이 요청이 응답 머리를 받았다 — 그 뒤의 TypeError 는 받는 도중 끊김(끊김 신호)
    let attemptBytes = 0; // 이 요청에서 받은 본문 바이트 (덜 받음 가리기)
    let res: Response;
    try {
      // cache 'no-store': 브라우저 HTTP 캐시에서 꺼낸 본문은 망 속도가 아닌데 조절기가 실제 속도로 센다 — 다시 연 결과의 캐시 장면이
      // 0단계 느려짐 기준을 부풀려, 문제없는 서버를 '느려짐'으로 보고 하루 묶을 수 있다(재현). Chrome 실측 A~E 도 no-store 로 쟀다.
      // 이미 받은 장면은 페이지를 연 동안 TimeSeries 메모리 캐시에 남는다(새로 고침하면 다시 받음)
      res = await attemptOnce(url, { headers: { Range: `bytes=${from}-${to}` }, cache: 'no-store' }, signal, c.stallMs, c.fetchImpl, (r) => {
        headed = true;
        ticket?.responded();
        if (r.status === 206) {
          const size = sizeFromContentRange(r.headers);
          if (size !== null) want = Math.max(0, Math.min(want, size - start));
          const limit = Math.min(want, to - start + 1); // 이 요청이 채울 끝 (요청보다 많이 오면 넘치는 것은 버린다)
          return (b) => {
            ticket?.received(b.byteLength);
            attemptBytes += b.byteLength;
            const room = limit - got;
            if (room <= 0) return;
            const p = b.byteLength > room ? b.subarray(0, room) : b;
            parts.push(p); got += p.byteLength;
          };
        }
        if (r.ok) { const w: Uint8Array[] = (whole = []); return (b) => { ticket?.received(b.byteLength); w.push(b); wholeGot += b.byteLength; }; }
        return null;
      });
    } catch (e) {
      // 끊김 신호: 멈춤(응답 머리 전 기다림 가운데 다른 요청에서 바이트가 흐르던 것은 조절기가 가린다) · 응답 머리를 받은 뒤 연결이 끊김.
      // 응답 머리 전 연결 실패(TypeError — 주소 · 망 · 꺼진 서버)는 받는 속도의 문제가 아니라 세지 않는다.
      // 바깥 signal 로 끊은 것(취소 — '전 시점 범위' [취소] 등)도 세지 않는다: 사유가 TypeError 여도(abort(new TypeError(…))) 서버가 끊은 것이 아니다(앞 검증 low)
      if (!signal?.aborted) {
        if (e instanceof Stalled) ticket?.stalled();
        else if (headed && e instanceof TypeError) ticket?.dropped();
      }
      ticket?.release(false);
      await backoff(c, attempt++, e);
      continue;
    }
    if (res.status === 206) {
      const done = got >= Math.min(want, to - start + 1);
      if (done && got >= want) { ticket?.release(true); return { status: 206, ok: true, headers: res.headers, body: concat(parts, want) }; }
      if (done) { carry = ticket; attempt = 1; c.fails.clear(); continue; } // 조각 하나를 다 받았다 — 자리를 다음 조각에 넘긴다 (다시 보내기 횟수는 조각마다 새로)
      // 파일 끝에서 줄여 준 구간 — Content-Range 를 못 읽을 때(다른 출처 배포에서 서버가 Access-Control-Expose-Headers 로 열어 주지 않음): Content-Length 를
      // 읽을 수 있고, 그만큼 다 왔고, 그것이 요청한 양보다 적으면 서버가 파일 끝에서 구간을 줄여 준 것으로 보고 거기까지를 결과로 돌려준다(다시 보내지 않음 ·
      // 신호 없음 — ByteSource.read 약속 '파일 끝을 넘으면 있는 데까지'). 전에는 나머지(파일 끝부터)를 다시 요청해 416 을 받아, 작은 파일의 헤더 읽기
      // (readVtuHeader 0~65535)가 'HTTP 416' 으로 실패했다. Content-Range 를 읽으면 이 판단을 하지 않는다(파일 끝이면 첫 206 의 전체 길이로 want 를
      // 줄여 위에서 끝나고, 파일 중간에서 줄여 준 구간이면 나머지를 다시 받는다). 그 밖(Content-Length 도 못 읽음 · 약속보다 덜 옴)은 아래 그대로
      if (promisedFromContentRange(res.headers) === null) {
        const cl = contentLength(res.headers);
        if (cl !== null && attemptBytes === cl && cl < to - from + 1) { ticket?.release(true); return { status: 206, ok: true, headers: res.headers, body: concat(parts, got) }; }
      }
      // 덜 받음: 응답 머리가 약속한 만큼(Content-Range, 못 읽으면 Content-Length) 오기 전에 연결이 닫혔다 — 끊김 신호. 서버가 구간을 줄여 준 것(약속한 만큼은
      // 다 옴)은 신호가 아니다. 둘 다 못 읽으면 신호를 내지 않는다 — '요청한 크기'와 견주면 파일 끝을 넘는 작은 파일의 헤더 읽기가 덜 받음으로 잡혀 그 주소가
      // 하루 동안 묶인다(앞 검증 low). 나머지를 다시 받는 것은 그대로
      const promised = promisedBytes(res.headers);
      if (promised !== null && attemptBytes < promised && !signal?.aborted) ticket?.dropped();
      ticket?.release(false);
      await backoff(c, attempt++, null, `덜 받음 ${got}/${want} B`); // 나머지만 다시
      continue;
    }
    ticket?.release(res.ok);
    if (res.ok) return { status: res.status, ok: true, headers: res.headers, body: concat(whole ?? [], wholeGot) };
    // 502/503/504 는 다시 보내기만 하고 조절기 신호로 세지 않는다 — 서버 · 앞단(nginx)이 바쁘거나 다시 뜨는 중이라는 서버 쪽 대답이라
    // 받는 속도를 낮춰도 낫지 않고, 낮추면 그 주소를 하루 동안 묶게 된다
    if (RETRY_STATUS.has(res.status) && attempt < c.tries) { await backoff(c, attempt++, null, `HTTP ${res.status}`); continue; }
    return { status: res.status, ok: false, headers: res.headers, body: null };
  }
}

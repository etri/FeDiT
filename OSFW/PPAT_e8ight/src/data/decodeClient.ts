// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   decodeClient.ts

값 변환(decodeCore.ts decodeCellArrays)을 Worker 로 보내는 쪽. 부르는 쪽(loaders/vtu_loader.ts readVtuFields)은 getDecoder().decode 만 본다.
- 처음 부를 때 Worker 를 하나 만든다. Worker 가 없거나(Node 시험) 만들지 못하면(보안 설정 등) 같은 함수를 메인에서 돈다(inline).
- 위상의 남긴 셀 번호(kept)는 위상마다 한 번 복사해 보내 두고, 장면마다 배열 바이트만 넘긴다(transfer — 보낸 쪽 버퍼는 비워진다).
  데이터를 바꿔 열면 옛 시간축이 release 로 바로 지운다(TimeSeries.dispose). 놓친 위상은 FinalizationRegistry 가 있으면 메인 쪽이 버려진 뒤 지운다(보조).
- Worker 가 죽으면(error · messageerror) 기다리던 요청은 모두 WorkerLost 로 실패하고, 그 뒤로는 메인에 고정한다.
  넘긴 바이트는 Worker 와 함께 사라졌으므로 부른 쪽이 바이트를 다시 읽어 메인에서 한 번 더 한다(readVtuFields).
- 오류 없이 답이 끊겨도 같은 길로 간다: 기다리는 요청이 있는데 마지막 답(없으면 첫 요청) 뒤 REPLY_TIMEOUT_MS 동안 아무 답이 없으면 죽은 것으로 본다('응답 없음').
  그러지 않으면 그 묶음이 시간축의 '읽는 중'(TimeSeries inflight)에 영원히 남아 그 장면을 찾는 읽기와 미리 읽기가 모두 멈춘다(검토 반영 2026-11-06).
- 시험: setDecoderForTest 로 가짜 Worker 를 넣는다(scripts/test_decode_core.mjs).
*/
/******************************************************************************/
import { DecodeInput, DecodeMessage, DecodeReply, Decoded, decodeCellArrays, transferOfInputs } from './decodeCore';

/** Worker 가 죽어 요청이 사라졌다 — 넘긴 바이트도 없으므로 다시 읽어 메인에서 한다 */
export class WorkerLost extends Error {
  constructor(message: string) { super(message); this.name = 'WorkerLost'; }
}

/** 변환 한 건: 위상(남긴 셀 번호 · 수)과 배열들 */
export interface DecodeJob { kept: Int32Array; count: number; arrays: DecodeInput[] }
export interface Decoder {
  readonly kind: 'worker' | 'inline';
  /** 배열들을 값으로. Worker 길에서는 arrays 의 바이트 버퍼를 넘겨주므로 부른 뒤에는 쓰지 않는다 */
  decode(job: DecodeJob): Promise<Decoded>;
  /** 그 위상(남긴 셀 번호)을 더 쓰지 않는다 — Worker 쪽 사본을 바로 지운다. 보낸 적 없으면 아무것도 하지 않는다. 그 뒤 같은 위상으로 decode 하면 다시 보낸다 */
  release(kept: Int32Array): void;
}

/** Worker 응답 시간 제한 (ms): 기다리는 요청이 있는데 마지막 답(없으면 첫 요청) 뒤 이만큼 아무 답이 없으면 Worker 를 버리고 메인에서 한다 */
export const REPLY_TIMEOUT_MS = 30_000;

/** Worker 와 같은 모양 (시험의 가짜 Worker 도) */
export interface WorkerLike {
  onmessage: ((e: { data: DecodeReply }) => void) | null;
  onerror: ((e: unknown) => void) | null;
  onmessageerror: ((e: unknown) => void) | null;
  postMessage(msg: DecodeMessage, transfer: Transferable[]): void;
  terminate(): void;
}
export type WorkerFactory = () => WorkerLike;

/** 메인에서 바로 (예전과 같은 차례 — 부른 자리에서 계산하고 끝난 약속을 돌려준다) */
const inline: Decoder = {
  kind: 'inline',
  decode(job) {
    try { return Promise.resolve(decodeCellArrays(job.arrays, job.kept, job.count)); } catch (e) { return Promise.reject(e); }
  },
  release() { /* 메인에는 따로 든 사본이 없다 */ },
};

interface FinReg { register(target: object, held: number, token?: object): void; unregister(token: object): void }
type FinRegCtor = new (cleanup: (held: number) => void) => FinReg;

class WorkerDecoder implements Decoder {
  readonly kind = 'worker' as const;
  private w: WorkerLike | null;
  private seq = 0;
  private readonly pending = new Map<number, { resolve: (d: Decoded) => void; reject: (e: unknown) => void }>();
  private readonly topoIds = new WeakMap<Int32Array, number>();
  private nextTopo = 1;
  private readonly registry: FinReg | null;
  /** 응답 시간 제한 타이머 (기다리는 요청이 있을 때만) */
  private watchdog: ReturnType<typeof setTimeout> | null = null;

  constructor(make: WorkerFactory, private readonly onLost: () => void, private readonly replyTimeoutMs: number) {
    const w = make();
    this.w = w;
    w.onmessage = (e) => this.receive(e.data);
    w.onerror = (e) => { (e as { preventDefault?: () => void } | null)?.preventDefault?.(); this.lose('Worker 오류'); };
    w.onmessageerror = () => this.lose('Worker 메시지를 풀지 못함');
    const FR = (globalThis as { FinalizationRegistry?: FinRegCtor }).FinalizationRegistry;
    this.registry = FR ? new FR((topoId) => { try { this.w?.postMessage({ op: 'drop', topoId }, []); } catch { /* 이미 죽음 */ } }) : null;
  }

  decode(job: DecodeJob): Promise<Decoded> {
    const w = this.w;
    if (!w) return inline.decode(job);
    return new Promise<Decoded>((resolve, reject) => {
      const id = ++this.seq;
      try {
        const topoId = this.topoOf(w, job.kept);
        this.pending.set(id, { resolve, reject });
        w.postMessage({ op: 'decode', id, topoId, count: job.count, arrays: job.arrays }, transferOfInputs(job.arrays));
        if (this.pending.size === 1) this.arm(); // 기다리는 것이 없던 차례면 지금부터 센다 (이미 있으면 마지막 답부터 세는 중)
      } catch {
        // 보내지 못함(복제 실패 등): 바이트는 넘어가지 않았다 — 이 건만 메인에서
        this.pending.delete(id);
        if (!this.pending.size) this.arm();
        inline.decode(job).then(resolve, reject);
      }
    });
  }

  release(kept: Int32Array): void {
    const id = this.topoIds.get(kept);
    if (id === undefined) return;
    this.topoIds.delete(kept);
    this.registry?.unregister(kept);
    try { this.w?.postMessage({ op: 'drop', topoId: id }, []); } catch { /* 이미 죽음 */ }
  }

  /** 위상의 남긴 셀 번호를 처음 볼 때 한 번 보낸다(복사 — 메인도 계속 쓴다) */
  private topoOf(w: WorkerLike, kept: Int32Array): number {
    let id = this.topoIds.get(kept);
    if (id !== undefined) return id;
    id = this.nextTopo++;
    w.postMessage({ op: 'topo', topoId: id, kept }, []);
    this.topoIds.set(kept, id);
    this.registry?.register(kept, id, kept);
    return id;
  }

  /** 응답 시간 제한을 지금부터 다시 센다. 기다리는 요청이 없으면 멈춘다 */
  private arm(): void {
    if (this.watchdog !== null) clearTimeout(this.watchdog);
    this.watchdog = this.pending.size ? setTimeout(() => { this.watchdog = null; this.lose('응답 없음'); }, this.replyTimeoutMs) : null;
  }

  private receive(msg: DecodeReply): void {
    const p = this.pending.get(msg.id);
    if (!p) return; // 죽은 뒤 늦게 온 답
    this.pending.delete(msg.id);
    this.arm(); // 답이 왔다 — 남은 요청은 이때부터 센다
    if (msg.op === 'decoded') p.resolve({ scalars: msg.scalars, vectors: msg.vectors });
    else p.reject(new Error(msg.message));
  }

  private lose(reason: string): void {
    const w = this.w;
    if (!w) return;
    this.w = null;
    if (this.watchdog !== null) { clearTimeout(this.watchdog); this.watchdog = null; }
    try { w.terminate(); } catch { /* 이미 끝남 */ }
    this.onLost();
    const err = new WorkerLost(`값 변환 ${reason} — 메인에서 계속합니다`);
    console.warn(err.message);
    const waiting = Array.from(this.pending.values());
    this.pending.clear();
    for (const p of waiting) p.reject(err);
  }
}

/** 기본 Worker: Vite 가 이 꼴(new Worker(new URL(..., import.meta.url)))을 보고 따로 묶는다. Worker 가 없는 곳(Node)이면 null */
function defaultFactory(): WorkerFactory | null {
  if (typeof Worker === 'undefined') return null;
  return () => new Worker(new URL('./decode.worker.ts', import.meta.url), { type: 'module' }) as unknown as WorkerLike;
}

let current: Decoder | null = null;
let override: WorkerFactory | null | undefined; // undefined = 기본
let replyTimeoutMs = REPLY_TIMEOUT_MS;

/** 지금 쓸 변환기. Worker 를 처음 쓸 때 만들고, 만들지 못하거나 죽은 뒤로는 메인 */
export function getDecoder(): Decoder {
  if (current) return current;
  const make = override !== undefined ? override : defaultFactory();
  if (!make) return (current = inline);
  try {
    current = new WorkerDecoder(make, () => { current = inline; }, replyTimeoutMs);
  } catch (e) {
    console.warn(`값 변환 Worker 를 만들지 못함 — 메인에서 합니다 (${e instanceof Error ? e.message : String(e)})`);
    current = inline;
  }
  return current;
}

/** 그 위상을 더 쓰지 않는다 (Worker 쪽 사본을 바로 지움 — TimeSeries.dispose). 아직 변환기를 만들지 않았으면 아무것도 하지 않는다(지우려고 Worker 를 만들지 않게) */
export function releaseTopology(kept: Int32Array): void {
  current?.release(kept);
}

/**
 * 시험용: Worker 를 만드는 함수를 바꾼다(null = Worker 없음 → 메인, 인자 없음 = 기본). 지금 변환기는 버린다.
 * opts.replyTimeoutMs = 응답 시간 제한(기본 REPLY_TIMEOUT_MS — 시험은 짧게 준다)
 */
export function setDecoderForTest(make?: WorkerFactory | null, opts: { replyTimeoutMs?: number } = {}): void {
  current = null;
  override = make;
  replyTimeoutMs = opts.replyTimeoutMs ?? REPLY_TIMEOUT_MS;
}

// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   decodeCore.ts

VTU 배열 바이트 → 화면 값(순수 함수 — DOM·Worker·three 를 쓰지 않는다). 메인과 Worker(decode.worker.ts)가 같은 함수를 쓴다.
- 원본 바이트를 Float32 로 바꾸고(asFloat32), 위상의 남긴 셀만 고르고, 스칼라는 통계, 벡터는 크기·통계를 센다(decodeCellArrays).
  식은 예전 loaders/vtu_loader.ts readVtuFields 그대로라 결과가 비트까지 같다(Float64→Float32 변환 · Math.sqrt(x*x+y*y+z*z) · computeStats).
- 바이트는 ArrayBuffer 또는 받은 버퍼 위의 보기(Uint8Array — 길이 머리 뒤부터)로 받는다. 원소 크기에 맞게 놓여 있으면 복사하지 않고,
  어긋나 있으면(UInt32 길이 머리 4 B 뒤의 Float64 등) 그 바이트만 복사해 읽는다.
- Worker 와 주고받는 말(createDecodeHandler)도 여기 둔다 — Node 시험이 가짜 Worker 로 같은 처리를 돌린다(scripts/test_decode_core.mjs).
*/
/******************************************************************************/
import { ScalarField, VectorField, computeStats, vectorFieldFromInterleaved } from './pointDataset';

const ELEMENT_SIZE: Record<string, number> = { Float32: 4, Float64: 8, Int8: 1, UInt8: 1, Int16: 2, UInt16: 2, Int32: 4, UInt32: 4, Int64: 8, UInt64: 8 };
/** VTU 배열 형식의 원소 바이트 수 (모르는 형식은 0) — 전 시점 범위가 시점당 읽을 양을 어림한다(TimeSeries.arrayBytesPerStep) */
export const elementSize = (type: string): number => ELEMENT_SIZE[type] ?? 0;

/** 배열 바이트: 딱 그 길이의 ArrayBuffer, 또는 받은 버퍼 위의 보기 */
export type Bytes = ArrayBuffer | Uint8Array;

/** 딱 그 바이트만 든 ArrayBuffer (보기가 버퍼 전체면 복사하지 않음) */
export function exactBuffer(bytes: Bytes): ArrayBuffer {
  if (!ArrayBuffer.isView(bytes)) return bytes;
  const buf = bytes.buffer as ArrayBuffer;
  return bytes.byteOffset === 0 && bytes.byteLength === buf.byteLength ? buf : buf.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

/**
 * 원소 크기 es 로 읽을 [버퍼, 시작, 원소 수]. 보기가 원소 크기에 맞게 놓였으면 복사하지 않고, 아니면 그 바이트만 복사한다.
 * 원소 수 undefined = 버퍼 전체(바이트 수가 원소 크기의 배수가 아니면 typed array 가 예전처럼 RangeError)
 */
function span(bytes: Bytes, es: number): [ArrayBuffer, number, number | undefined] {
  if (!ArrayBuffer.isView(bytes)) return [bytes, 0, undefined];
  const buf = bytes.buffer as ArrayBuffer;
  if (bytes.byteOffset % es === 0 && bytes.byteLength % es === 0) return [buf, bytes.byteOffset, bytes.byteLength / es];
  return [buf.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), 0, undefined];
}

/** 원본 배열 → Float32 (Float32 는 복사하지 않은 보기) */
export function asFloat32(bytes: Bytes, type: string): Float32Array {
  switch (type) {
    case 'Float32': { const [b, o, n] = span(bytes, 4); return new Float32Array(b, o, n); }
    case 'Float64': { const [b, o, n] = span(bytes, 8); return Float32Array.from(new Float64Array(b, o, n)); }
    case 'Int32': { const [b, o, n] = span(bytes, 4); return Float32Array.from(new Int32Array(b, o, n)); }
    case 'UInt32': { const [b, o, n] = span(bytes, 4); return Float32Array.from(new Uint32Array(b, o, n)); }
    case 'Int16': { const [b, o, n] = span(bytes, 2); return Float32Array.from(new Int16Array(b, o, n)); }
    case 'UInt16': { const [b, o, n] = span(bytes, 2); return Float32Array.from(new Uint16Array(b, o, n)); }
    case 'Int8': { const [b, o, n] = span(bytes, 1); return Float32Array.from(new Int8Array(b, o, n)); }
    case 'UInt8': { const [b, o, n] = span(bytes, 1); return Float32Array.from(new Uint8Array(b, o, n)); }
    case 'Int64': { const [b, o, n] = span(bytes, 8); return Float32Array.from(new BigInt64Array(b, o, n), Number); }
    case 'UInt64': { const [b, o, n] = span(bytes, 8); return Float32Array.from(new BigUint64Array(b, o, n), Number); }
    default: throw new Error(`지원하지 않는 배열 형식: ${type}`);
  }
}

/** 원본 배열을 숫자로 읽는 보기 (복사하지 않음 — 어긋나 놓였으면 그 바이트만 복사). 64비트 정수는 BigInt 라 float32 로 바꿔 담는다 */
export function numericView(bytes: Bytes, type: string): ArrayLike<number> {
  const es = ELEMENT_SIZE[type] || 1;
  const len = bytes.byteLength;
  const n = Math.floor(len / es); // 파일 끝에서 잘린 배열도 원소 단위로
  const whole: Uint8Array = ArrayBuffer.isView(bytes) ? bytes : new Uint8Array(bytes);
  const [b, o] = span(whole.subarray(0, n * es), es);
  switch (type) {
    case 'Float32': return new Float32Array(b, o, n);
    case 'Float64': return new Float64Array(b, o, n);
    case 'Int32': return new Int32Array(b, o, n);
    case 'UInt32': return new Uint32Array(b, o, n);
    case 'Int16': return new Int16Array(b, o, n);
    case 'UInt16': return new Uint16Array(b, o, n);
    case 'Int8': return new Int8Array(b, o, n);
    case 'UInt8': return new Uint8Array(b, o, n);
    default: return asFloat32(whole.subarray(0, n * es), type);
  }
}

/** 변환할 배열 하나: VTU 헤더의 이름·형식·성분 수와 그 바이트(길이 머리 뒤부터) */
export interface DecodeInput { name: string; type: string; components: number; bytes: Bytes }
export interface Decoded { scalars: ScalarField[]; vectors: VectorField[] }

/**
 * 배열들을 위상에 맞춘다: kept(남긴 셀 번호, 원본 셀 순서)의 셀만 count 개. 성분 1 = 스칼라, 3 = 벡터, 그 밖은 버린다(형식은 그래도 확인 — 모르는 형식이면 예외).
 * 들어온 차례대로 돌려준다. 값이 셀 수보다 짧으면 모자란 자리는 NaN(예전과 같음)
 */
export function decodeCellArrays(arrays: readonly DecodeInput[], kept: Int32Array, count: number): Decoded {
  const scalars: ScalarField[] = [], vectors: VectorField[] = [];
  for (const a of arrays) {
    const data = asFloat32(a.bytes, a.type);
    if (a.components === 1) {
      const v = new Float32Array(count);
      for (let i = 0; i < count; i++) v[i] = data[kept[i]];
      scalars.push({ kind: 'scalar', name: a.name, values: v, stats: computeStats(v) });
    } else if (a.components === 3) {
      const v = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) { const c = kept[i] * 3; v[i * 3] = data[c]; v[i * 3 + 1] = data[c + 1]; v[i * 3 + 2] = data[c + 2]; }
      vectors.push(vectorFieldFromInterleaved(a.name, [`${a.name}_x`, `${a.name}_y`, `${a.name}_z`], v));
    }
  }
  return { scalars, vectors };
}

/** 넘겨줄(transfer) 버퍼 목록 — 같은 버퍼는 한 번만(두 번 넣으면 postMessage 가 DataCloneError) */
function uniqueBuffers(list: Iterable<ArrayBufferLike>): ArrayBuffer[] {
  const out = new Set<ArrayBuffer>();
  for (const b of list) if (b instanceof ArrayBuffer && b.byteLength > 0) out.add(b);
  return Array.from(out);
}
/** 보낼 배열 바이트의 버퍼들 (Worker 로 넘기면 보낸 쪽 버퍼는 비워진다) */
export const transferOfInputs = (arrays: readonly DecodeInput[]): ArrayBuffer[] =>
  uniqueBuffers(arrays.map((a) => (ArrayBuffer.isView(a.bytes) ? a.bytes.buffer : a.bytes)));
/** 돌려줄 값 배열의 버퍼들 (values · magnitude — 배열마다 제 버퍼) */
export const transferOfDecoded = (d: Decoded): ArrayBuffer[] =>
  uniqueBuffers([...d.scalars.map((s) => s.values.buffer), ...d.vectors.flatMap((v) => [v.values.buffer, v.magnitude.buffer])]);

/** 메인 → Worker. topo: 위상의 남긴 셀 번호를 한 번 보내 둔다(복사) · drop: 버린 위상 · decode: 배열 바이트(넘겨줌) */
export type DecodeMessage =
  | { op: 'topo'; topoId: number; kept: Int32Array }
  | { op: 'drop'; topoId: number }
  | { op: 'decode'; id: number; topoId: number; count: number; arrays: DecodeInput[] };
/** Worker → 메인. decoded: 값(넘겨줌) · error: 변환 중 예외(형식 모름 등 — 메인에서 해도 같은 예외) */
export type DecodeReply =
  | ({ op: 'decoded'; id: number } & Decoded)
  | { op: 'error'; id: number; message: string };

/** Worker 쪽 처리 (decode.worker.ts 와 시험의 가짜 Worker 가 함께 쓴다). post = 답 보내기(값, 넘겨줄 버퍼) */
export function createDecodeHandler(post: (msg: DecodeReply, transfer: ArrayBuffer[]) => void): (msg: DecodeMessage) => void {
  const topos = new Map<number, Int32Array>();
  return (msg) => {
    if (msg.op === 'topo') { topos.set(msg.topoId, msg.kept); return; }
    if (msg.op === 'drop') { topos.delete(msg.topoId); return; }
    let out: Decoded;
    try {
      const kept = topos.get(msg.topoId);
      if (!kept) throw new Error(`위상 ${msg.topoId} 을 받지 못했습니다.`);
      out = decodeCellArrays(msg.arrays, kept, msg.count);
    } catch (e) {
      post({ op: 'error', id: msg.id, message: e instanceof Error ? e.message : String(e) }, []);
      return;
    }
    post({ op: 'decoded', id: msg.id, scalars: out.scalars, vectors: out.vectors }, transferOfDecoded(out));
  };
}

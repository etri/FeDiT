#!/usr/bin/env node
// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   test_decode_core.mjs

저장 시점 값 읽기(src/data/loaders/vtu_loader.ts readVtuFields · readVtuBytes)와 값 변환(src/data/decodeCore.ts · decodeClient.ts · decode.worker.ts)의 Node 시험.
esbuild 로 메모리에서 묶어 data: 주소로 불러 쓴다. Node 에는 Worker 가 없어 기본은 메인 길이고, Worker 길은 가짜 Worker
(structuredClone 으로 넘겨주기를 흉내 — 보낸 버퍼가 실제로 비워지고 같은 버퍼가 두 번이면 DataCloneError)에 같은 처리(createDecodeHandler)를 넣어 본다.
'예전'은 바꾸기 전 코드(길이 머리와 값을 따로 두 번 읽기 · 바이트를 그대로 Float32 로 · 비교 함수 정렬 통계)를 이 파일에 옮겨 둔 것이다.
확인: 합성 VTU(UInt64 · UInt32 길이 머리, Float64·Float32·Int64·UInt64·Int32·UInt32·Int16·UInt16·Int8·UInt8, 성분 1·3·9, 머리값이 기대의 2배 · 기대보다 짧은 배열 ·
파일 끝에서 잘린 배열)에서 값·통계·차례가 예전과 비트까지 같음 · 배열 바이트(readVtuArray)가 예전 두 번 읽기와 같음 · 읽기 = 헤더 + 배열마다 한 번(connectivity 만 두 번) ·
어긋난 byteOffset(복사해 읽음) · Int64·UInt8 변환 · 빈 kept · 넘겨줄 버퍼 목록에 같은 버퍼가 두 번 없음 · computeStats 의 Float64Array 정렬이 예전 정렬과 같음(±0 차례 포함) ·
가짜 Worker: 값이 같고 위상은 한 번만 보내며 보낸 바이트가 비워짐 · 변환 오류(형식 모름)는 예전과 같은 예외이고 Worker 를 버리지 않음 ·
Worker 가 죽으면 기다리던 배열을 다시 읽어 메인에서 같은 값 · 그 뒤로는 메인 고정 · 뒤 배열 읽기가 실패해도 처리 안 한 거부가 남지 않음 ·
Worker 가 오류 없이 답을 주지 않으면 응답 시간 제한(기본 30 초 — 시험은 40 ms) 뒤 같은 길(다시 읽어 메인에서) · 답이 이어지는 동안은 마지막 답부터 세어 버리지 않음 ·
위상 지우기(releaseTopology): drop 을 바로 한 번 · 변환기를 만들기 전이면 아무것도 안 함 · 지운 뒤 다시 쓰면 위상부터 다시 보냄.
deploy/jobs 의 실제 fluid_dem_0.vtu(git 에 없음)가 있으면 그것도 예전과 비트까지 같은지 본다(없으면 건너뜀).

실행: node scripts/test_decode_core.mjs
*/
/******************************************************************************/

import { build } from 'esbuild';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const res = await build({
  stdin: {
    contents: "export * from './src/data/decodeCore'; export * from './src/data/decodeClient'; export { readVtuHeader, readVtuBytes, readVtuArray, readVtuFields, readVtuTopology } from './src/data/loaders/vtu_loader'; export { widenRange } from './src/data/pointDataset'; export { computeStats as newComputeStats } from './src/data/pointDataset';",
    resolveDir: ROOT, loader: 'ts',
  },
  bundle: true, platform: 'neutral', format: 'esm', target: 'es2022', write: false, logLevel: 'silent',
});
const M = await import(`data:text/javascript;base64,${Buffer.from(res.outputFiles[0].text).toString('base64')}`);
const { readVtuHeader, readVtuBytes, readVtuArray, readVtuFields, readVtuTopology, decodeCellArrays, transferOfDecoded, transferOfInputs, createDecodeHandler,
  asFloat32, numericView, getDecoder, setDecoderForTest, releaseTopology, REPLY_TIMEOUT_MS, WorkerLost, widenRange, newComputeStats } = M;

let fail = 0, pass = 0, skipped = 0;
const ok = (cond, name, extra = '') => { if (cond) { pass++; console.log(`PASS ${name}`); } else { fail++; console.log(`FAIL ${name} ${extra}`); } };
let unhandled = 0;
process.on('unhandledRejection', (e) => { unhandled++; console.log(`처리 안 한 거부: ${e}`); });
const warnings = [];
const realWarn = console.warn;
console.warn = (...a) => { warnings.push(a.join(' ')); };

// ---------- 예전 코드 (바꾸기 전 vtu_loader.ts · pointDataset.ts 그대로) ----------
const OLD_ES = { Float32: 4, Float64: 8, Int8: 1, UInt8: 1, Int16: 2, UInt16: 2, Int32: 4, UInt32: 4, Int64: 8, UInt64: 8 };
function oldExpected(h, info) {
  const es = OLD_ES[info.type];
  if (!es) return Infinity;
  if (info.location === 'points' || (info.location === 'grid' && info.name !== 'connectivity' && info.name !== 'offsets' && info.name !== 'types')) return h.numPoints * info.components * es;
  if (info.name === 'connectivity') return Infinity;
  return h.numCells * info.components * es;
}
async function oldReadArray(h, info) {
  const hs = h.header64 ? 8 : 4;
  const start = h.base + info.offset;
  const dv = new DataView(await h.source.read(start, start + hs - 1));
  const declared = h.header64 ? Number(dv.getBigUint64(0, true)) : dv.getUint32(0, true);
  const nbytes = Math.min(declared, oldExpected(h, info));
  if (nbytes <= 0) return new ArrayBuffer(0);
  return h.source.read(start + hs, start + hs + nbytes - 1);
}
function oldAsFloat32(buf, type) {
  switch (type) {
    case 'Float32': return new Float32Array(buf);
    case 'Float64': return Float32Array.from(new Float64Array(buf));
    case 'Int32': return Float32Array.from(new Int32Array(buf));
    case 'UInt32': return Float32Array.from(new Uint32Array(buf));
    case 'Int16': return Float32Array.from(new Int16Array(buf));
    case 'UInt16': return Float32Array.from(new Uint16Array(buf));
    case 'Int8': return Float32Array.from(new Int8Array(buf));
    case 'UInt8': return Float32Array.from(new Uint8Array(buf));
    case 'Int64': return Float32Array.from(new BigInt64Array(buf), Number);
    case 'UInt64': return Float32Array.from(new BigUint64Array(buf), Number);
    default: throw new Error(`지원하지 않는 배열 형식: ${type}`);
  }
}
function oldComputeStats(values) {
  let min = Infinity, max = -Infinity;
  for (let i = 0; i < values.length; i++) { const v = values[i]; if (v !== v) continue; if (v < min) min = v; if (v > max) max = v; }
  if (!isFinite(min)) return { min: 0, max: 1, p2: 0, p98: 1 };
  const stride = Math.max(1, Math.floor(values.length / 60000));
  const sample = [];
  for (let i = 0; i < values.length; i += stride) { const v = values[i]; if (v === v) sample.push(v); }
  sample.sort((a, b) => a - b);
  const q = (p) => sample[Math.min(sample.length - 1, Math.max(0, Math.floor(p * (sample.length - 1))))];
  let p2 = q(0.02), p98 = q(0.98);
  if (p98 <= p2) { p2 = min; p98 = max; }
  [p2, p98] = widenRange(p2, p98);
  return { min, max, p2, p98 };
}
function oldVectorField(name, componentNames, values) {
  const n = values.length / 3;
  const magnitude = new Float32Array(n), xs = new Float32Array(n), ys = new Float32Array(n), zs = new Float32Array(n);
  for (let i = 0; i < n; i++) { const x = values[i * 3], y = values[i * 3 + 1], z = values[i * 3 + 2]; xs[i] = x; ys[i] = y; zs[i] = z; magnitude[i] = Math.sqrt(x * x + y * y + z * z); }
  return { kind: 'vector', name, componentNames, values, magnitude, stats: { magnitude: oldComputeStats(magnitude), x: oldComputeStats(xs), y: oldComputeStats(ys), z: oldComputeStats(zs) } };
}
async function oldReadFields(src, topo, arrays) {
  const scalars = [], vectors = [];
  if (topo.count === 0) return { scalars, vectors };
  const h = await readVtuHeader(src);
  const { kept, count } = topo;
  for (const nm of arrays) {
    const info = h.arrays.find((a) => a.name === nm && a.location === 'cells');
    if (!info) continue;
    const data = oldAsFloat32(await oldReadArray(h, info), info.type);
    if (info.components === 1) {
      const v = new Float32Array(count);
      for (let i = 0; i < count; i++) v[i] = data[kept[i]];
      scalars.push({ kind: 'scalar', name: nm, values: v, stats: oldComputeStats(v) });
    } else if (info.components === 3) {
      const v = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) { const c = kept[i] * 3; v[i * 3] = data[c]; v[i * 3 + 1] = data[c + 1]; v[i * 3 + 2] = data[c + 2]; }
      vectors.push(oldVectorField(nm, [`${nm}_x`, `${nm}_y`, `${nm}_z`], v));
    }
  }
  return { scalars, vectors };
}

// ---------- 비트 비교 ----------
const bits = (a) => new Uint8Array(a.buffer, a.byteOffset, a.byteLength);
const sameBits = (a, b) => !!a && !!b && a.constructor === b.constructor && a.length === b.length && Buffer.compare(Buffer.from(bits(a)), Buffer.from(bits(b))) === 0;
const sameStats = (a, b) => ['min', 'max', 'p2', 'p98'].every((k) => Object.is(a[k], b[k]));
/** 두 결과({scalars, vectors})가 이름·차례·값·통계까지 같은가. 다르면 첫 다른 곳 */
function diffFields(a, b) {
  if (a.scalars.length !== b.scalars.length || a.vectors.length !== b.vectors.length) return `개수 ${a.scalars.length}/${a.vectors.length} ≠ ${b.scalars.length}/${b.vectors.length}`;
  for (let i = 0; i < a.scalars.length; i++) {
    const x = a.scalars[i], y = b.scalars[i];
    if (x.kind !== 'scalar' || x.name !== y.name) return `스칼라 ${i} 이름 ${x.name} ≠ ${y.name}`;
    if (!sameBits(x.values, y.values)) return `스칼라 ${x.name} 값`;
    if (!sameStats(x.stats, y.stats)) return `스칼라 ${x.name} 통계 ${JSON.stringify(x.stats)} ≠ ${JSON.stringify(y.stats)}`;
  }
  for (let i = 0; i < a.vectors.length; i++) {
    const x = a.vectors[i], y = b.vectors[i];
    if (x.kind !== 'vector' || x.name !== y.name || x.componentNames.join() !== y.componentNames.join()) return `벡터 ${i} 이름 ${x.name} ≠ ${y.name}`;
    if (!sameBits(x.values, y.values) || !sameBits(x.magnitude, y.magnitude)) return `벡터 ${x.name} 값·크기`;
    for (const k of ['magnitude', 'x', 'y', 'z']) if (!sameStats(x.stats[k], y.stats[k])) return `벡터 ${x.name} ${k} 통계`;
  }
  return '';
}

// ---------- 시험용 바이트 원본 (읽기를 센다 — 바이트 · 횟수, fail 이 참이면 그 읽기 실패) ----------
class CountingSource {
  constructor(name, bytes) { this.name = name; this.bytes = bytes; this.reads = []; this.fail = null; }
  async size() { return this.bytes.length; }
  async read(start, end, signal) {
    signal?.throwIfAborted();
    if (this.fail && this.fail(start, this.reads.length)) throw new Error('시험: 읽기 실패');
    const b = this.bytes.slice(start, Math.min(end + 1, this.bytes.length)); // 늘 새 버퍼 (Worker 로 넘겨도 원본은 그대로)
    this.reads.push({ start, end, len: b.length });
    return b.buffer;
  }
  get readBytes() { return this.reads.reduce((s, r) => s + r.len, 0); }
  reset() { this.reads = []; this.fail = null; }
}
/** 디스크 파일 (deploy/jobs) */
class FileSource extends CountingSource {
  constructor(abs, fh, size) { super(path.basename(abs), null); this.fh = fh; this.sz = size; }
  async size() { return this.sz; }
  async read(start, end) {
    const len = Math.max(0, Math.min(end + 1, this.sz) - start);
    const buf = new Uint8Array(len);
    if (len) await this.fh.read(buf, 0, len, start);
    this.reads.push({ start, end, len });
    return buf.buffer;
  }
}

/**
 * VTU(UnstructuredGrid, raw appended) 한 파일. arrays: [{ sec: 'Points'|'Cells'|'CellData', type, name, comps, data(typed array), declared?(길이 머리값 — 일부러 다르게) }]
 * header64 = 길이 머리 UInt64(8 B) / UInt32(4 B). cut = 파일 끝에서 잘라 낼 바이트(꼬리 XML 도 없앰 — 마지막 배열이 잘림)
 */
function makeVtu({ cells, points = 0, arrays, header64 = true, cut = 0 }) {
  const hs = header64 ? 8 : 4;
  let off = 0, xml = '', section = '';
  const parts = [];
  for (const a of arrays) {
    if (a.sec !== section) { if (section) xml += `</${section}>\n`; xml += `<${a.sec}>\n`; section = a.sec; }
    xml += `<DataArray type="${a.type}" Name="${a.name}" NumberOfComponents="${a.comps}" offset="${off}" format="appended"/>\n`;
    const body = Buffer.from(a.data.buffer, a.data.byteOffset, a.data.byteLength);
    const head = Buffer.alloc(hs);
    const declared = a.declared ?? body.length;
    if (header64) head.writeBigUInt64LE(BigInt(declared)); else head.writeUInt32LE(declared);
    parts.push(head, body);
    off += hs + body.length;
  }
  xml += `</${section}>\n`;
  const top = `<VTKFile type="UnstructuredGrid" version="1.0" byte_order="LittleEndian" header_type="${header64 ? 'UInt64' : 'UInt32'}">\n<UnstructuredGrid>\n<Piece NumberOfPoints="${points}" NumberOfCells="${cells}">\n${xml}</Piece>\n</UnstructuredGrid>\n<AppendedData encoding="raw">\n_`;
  const tail = cut ? [] : [Buffer.from('\n</AppendedData>\n</VTKFile>\n', 'latin1')];
  const full = Buffer.concat([Buffer.from(top, 'latin1'), ...parts, ...tail]);
  return new Uint8Array(cut ? full.subarray(0, full.length - cut) : full);
}

// 결정적인 난수 (같은 값이 늘 나오게)
let seed = 12345;
const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296);

const N = 40;
const SOLID = new Set([2, 9, 17, 33]);
/** 합성 셀 배열 묶음: 여러 형식 · 성분 1·3·9 · ±0 섞인 값 · 2^53 넘는 Int64 */
function cellArrays() {
  const solid = Uint8Array.from({ length: N }, (_, i) => (SOLID.has(i) ? 1 : 0));
  const position = new Float64Array(N * 3);
  for (let i = 0; i < N; i++) position.set([i + 0.5, 0.5, 0.5], i * 3);
  const pressure = Float64Array.from({ length: N }, (_, i) => (i < 10 ? (i < 5 ? 0 : -0) : 101325 - 7.123456789 * i * rnd())); // 앞쪽 +0 · -0 (백분위가 0 덩어리에 닿게)
  const velocity = Float64Array.from({ length: N * 3 }, () => (rnd() - 0.5) * 3.3333333333);
  const temp = Float32Array.from({ length: N }, () => 280 + rnd() * 40);
  const big = BigInt64Array.from({ length: N }, (_, i) => BigInt(2 ** 53) + BigInt(i * 3 + 1) - (i % 2 ? 2n * BigInt(2 ** 53) : 0n));
  const ubig = BigUint64Array.from({ length: N * 3 }, (_, i) => BigInt(i) * 1234567890123n);
  const flag = Uint8Array.from({ length: N }, (_, i) => (i * 37) % 256);
  const vel32 = Float32Array.from({ length: N * 3 }, (_, i) => (i % 7 === 0 ? -0 : Math.sin(i) * 1e-3));
  const i32 = Int32Array.from({ length: N }, (_, i) => (i - 20) * 100000);
  const u32 = Uint32Array.from({ length: N }, (_, i) => 4294967295 - i * 99991);
  const i16 = Int16Array.from({ length: N }, (_, i) => (i - 20) * 1500);
  const u16 = Uint16Array.from({ length: N }, (_, i) => i * 1600);
  const i8 = Int8Array.from({ length: N }, (_, i) => i - 20);
  const tensor = Float64Array.from({ length: N * 9 }, () => rnd());
  return [
    { sec: 'CellData', type: 'UInt8', name: 'solid', comps: 1, data: solid },
    { sec: 'CellData', type: 'Float64', name: 'position', comps: 3, data: position },
    { sec: 'CellData', type: 'Float64', name: 'pressure', comps: 1, data: pressure },
    { sec: 'CellData', type: 'Float64', name: 'velocity', comps: 3, data: velocity },
    { sec: 'CellData', type: 'Float32', name: 'temp', comps: 1, data: temp },
    { sec: 'CellData', type: 'Int64', name: 'big', comps: 1, data: big },
    { sec: 'CellData', type: 'UInt64', name: 'ubig', comps: 3, data: ubig },
    { sec: 'CellData', type: 'UInt8', name: 'flag', comps: 1, data: flag },
    { sec: 'CellData', type: 'Float32', name: 'vel32', comps: 3, data: vel32 },
    { sec: 'CellData', type: 'Int32', name: 'i32', comps: 1, data: i32 },
    { sec: 'CellData', type: 'UInt32', name: 'u32', comps: 1, data: u32 },
    { sec: 'CellData', type: 'Int16', name: 'i16', comps: 1, data: i16 },
    { sec: 'CellData', type: 'UInt16', name: 'u16', comps: 1, data: u16 },
    { sec: 'CellData', type: 'Int8', name: 'i8', comps: 1, data: i8 },
    { sec: 'CellData', type: 'Float64', name: 'tensor', comps: 9, data: tensor },
  ];
}
const VALUE_NAMES = ['pressure', 'velocity', 'temp', 'big', 'ubig', 'flag', 'vel32', 'i32', 'u32', 'i16', 'u16', 'i8', 'tensor', 'no_such'];
const VALUE_COUNT = VALUE_NAMES.length - 1; // 파일에 있는 것 (no_such 는 없음)
const topoOpts = { arrays: [], solidArray: 'solid' };

/** 같은 파일을 예전 코드와 지금 코드로 읽어 비교. 읽기 수·바이트도 돌려준다 */
async function compareFile(label, bytes, names = VALUE_NAMES) {
  const src = new CountingSource(`${label}.vtu`, bytes);
  const topo = await readVtuTopology(src, label, topoOpts);
  src.reset();
  const before = await oldReadFields(src, topo, names);
  const oldReads = src.reads.length, oldBytes = src.readBytes;
  src.reset();
  const after = await readVtuFields(src, topo, names);
  return { src, topo, before, after, oldReads, oldBytes, newReads: src.reads.length, newBytes: src.readBytes };
}

// ---------- 1. 합성 VTU: 예전과 비트까지 같음 · 읽기 횟수 ----------
setDecoderForTest(); // 기본 (Node 에는 Worker 가 없어 메인)
{
  const c = await compareFile('syn64', makeVtu({ cells: N, arrays: cellArrays() }));
  ok(getDecoder().kind === 'inline', `Node 에는 Worker 가 없어 메인 길 (${getDecoder().kind})`);
  ok(c.topo.count === N - SOLID.size, `남긴 셀 ${c.topo.count} (고체 ${SOLID.size} 뺌)`);
  const d = diffFields(c.after, c.before);
  ok(!d && c.after.scalars.length === 9 && c.after.vectors.length === 3, `UInt64 머리: 스칼라 9 · 벡터 3 (성분 9 는 버림) 값·통계·차례가 예전과 비트까지 같음 ${d}`);
  ok(c.after.scalars.map((s) => s.name).join() === 'pressure,temp,big,flag,i32,u32,i16,u16,i8', `스칼라 차례 = 요청 차례 (${c.after.scalars.map((s) => s.name).join()})`);
  ok(c.newReads === 1 + VALUE_COUNT && c.oldReads === 1 + 2 * VALUE_COUNT, `읽기: 헤더 + 배열마다 한 번 = ${c.newReads} (예전 ${c.oldReads})`);
  ok(c.newBytes === c.oldBytes, `받은 바이트는 예전과 같음 (${c.newBytes} = ${c.oldBytes})`);
  // Int64 · UInt8 변환: Number(BigInt) → float32, UInt8 → float32
  const big = c.after.scalars.find((s) => s.name === 'big'), flag = c.after.scalars.find((s) => s.name === 'flag');
  const keptIdx = Array.from(c.topo.kept);
  const wantBig = keptIdx.map((i) => Math.fround(Number(BigInt(2 ** 53) + BigInt(i * 3 + 1) - (i % 2 ? 2n * BigInt(2 ** 53) : 0n))));
  ok(wantBig.every((v, k) => Object.is(big.values[k], v)), 'Int64 → Number → float32 (2^53 넘는 값 포함)');
  ok(keptIdx.every((i, k) => flag.values[k] === (i * 37) % 256), 'UInt8 → float32');
  // ±0: pressure 앞쪽 0 들이 남긴 셀 차례대로
  const p = c.after.scalars.find((s) => s.name === 'pressure');
  ok(Object.is(p.values[0], 0) && Object.is(p.values[7], -0), `±0 보존 (${Object.is(p.values[0], 0)} · ${Object.is(p.values[7], -0)})`);
}
{
  const c = await compareFile('syn32', makeVtu({ cells: N, arrays: cellArrays(), header64: false }));
  const d = diffFields(c.after, c.before);
  ok(!d && c.after.scalars.length === 9,`UInt32 머리(4 B — Float64·Int64 가 어긋나 놓임 → 복사해 읽음): 예전과 비트까지 같음 ${d}`);
  ok(c.newReads === 1 + VALUE_COUNT && c.newBytes === c.oldBytes, `UInt32 머리: 읽기 ${c.newReads} · 바이트 ${c.newBytes} = 예전 ${c.oldBytes}`);
}
// 머리값이 기대의 2배 · 기대보다 짧은 배열 · 다음 배열이 곧바로 붙음
{
  const arrs = cellArrays();
  arrs.find((a) => a.name === 'temp').declared = N * 4 * 2; // 2배 (offsets 처럼) — 기대 길이로 자름
  const p = arrs.find((a) => a.name === 'pressure');
  p.data = p.data.subarray(0, N - 7); // 셀 수보다 짧은 배열 (모자란 자리는 NaN — 예전과 같음)
  const c = await compareFile('synOdd', makeVtu({ cells: N, arrays: arrs }));
  const d = diffFields(c.after, c.before);
  const pv = c.after.scalars.find((s) => s.name === 'pressure').values;
  ok(!d, `머리값 2배 · 짧은 배열: 예전과 비트까지 같음 ${d}`);
  ok(Number.isNaN(pv[pv.length - 1]) && !Number.isNaN(pv[0]), '짧은 배열: 모자란 자리는 NaN (예전과 같음)');
  ok(c.newReads === 1 + VALUE_COUNT, `머리값이 달라도 다시 읽지 않음 (읽기 ${c.newReads})`);
  ok(c.newBytes > c.oldBytes, `짧은 배열은 기대 길이만큼 받고 잘라 버림 (받은 ${c.newBytes} > 예전 ${c.oldBytes})`);
}
// 파일 끝에서 잘린 배열 (마지막 배열 velocity)
{
  const base = cellArrays().filter((a) => ['solid', 'position', 'pressure', 'velocity'].includes(a.name));
  for (const [cut, label] of [[8 * 3 * 5, '원소 단위로 잘림'], [8 * 3 * 5 + 3, '원소 중간에서 잘림']]) {
    const bytes = makeVtu({ cells: N, arrays: base, cut });
    const src = new CountingSource('cut.vtu', bytes);
    const topo = await readVtuTopology(src, 'cut', topoOpts);
    const run = async (f) => { try { return { r: await f(src, topo, ['pressure', 'velocity']) }; } catch (e) { return { e }; } };
    const a = await run(readVtuFields), b = await run(oldReadFields);
    if (b.e) ok(!!a.e && a.e.constructor === b.e.constructor, `잘린 파일(${label}): 예전처럼 예외 (${a.e?.name} · 예전 ${b.e?.name})`);
    else ok(!a.e && !diffFields(a.r, b.r), `잘린 파일(${label}): 예전과 비트까지 같음 ${a.e ?? diffFields(a.r, b.r)}`);
  }
}
// 배열 바이트(readVtuArray / readVtuBytes)가 예전 두 번 읽기와 같음 — Points · connectivity(Int64, 길이 모름) · offsets(머리값 2배) · types 포함
{
  const pts = new Float64Array(N * 8 * 3), conn = new BigInt64Array(N * 8), offs = new Int32Array(N), types = new Uint8Array(N).fill(12);
  for (let i = 0; i < N; i++) {
    for (let k = 0; k < 8; k++) pts.set([i + (k & 1), (k >> 1) & 1, (k >> 2) & 1], (i * 8 + k) * 3);
    for (let k = 0; k < 8; k++) conn[i * 8 + k] = BigInt(i * 8 + k);
    offs[i] = (i + 1) * 8;
  }
  const vals = cellArrays().filter((a) => a.name !== 'position');
  for (const header64 of [true, false]) {
    const bytes = makeVtu({
      cells: N, points: N * 8, header64,
      arrays: [
        { sec: 'Points', type: 'Float64', name: 'Points', comps: 3, data: pts },
        { sec: 'Cells', type: 'Int64', name: 'connectivity', comps: 1, data: conn },
        { sec: 'Cells', type: 'Int32', name: 'offsets', comps: 1, data: offs, declared: N * 4 * 2 },
        { sec: 'Cells', type: 'UInt8', name: 'types', comps: 1, data: types },
        ...vals,
      ],
    });
    const src = new CountingSource('grid.vtu', bytes);
    const h = await readVtuHeader(src);
    let same = true, reads = 0, oldReads = 0;
    for (const info of h.arrays) {
      src.reset();
      const a = new Uint8Array(await readVtuArray(h, info));
      reads += src.reads.length;
      src.reset();
      const b = new Uint8Array(await oldReadArray(h, info));
      oldReads += src.reads.length;
      if (Buffer.compare(Buffer.from(a), Buffer.from(b)) !== 0) { same = false; console.log(`  다름: ${info.name}`); }
      const v = await readVtuBytes(h, info);
      if (Buffer.compare(Buffer.from(v), Buffer.from(b)) !== 0) { same = false; console.log(`  보기 다름: ${info.name}`); }
    }
    const nArr = h.arrays.length;
    ok(same && reads === nArr + 1 && oldReads === 2 * nArr, `${header64 ? 'UInt64' : 'UInt32'} 머리: 배열 ${nArr}개 바이트가 예전과 같음 · 읽기 ${reads} = 배열마다 한 번 + connectivity 한 번 더 (예전 ${oldReads})`);
    // Points · connectivity(Int64) · offsets 로 셀 중심 (위치 배열 없음)
    const topo = await readVtuTopology(src, 'grid', topoOpts);
    const want = [];
    for (let i = 0; i < N; i++) if (!SOLID.has(i)) want.push(i + 0.5, 0.5, 0.5);
    ok(topo.count === N - SOLID.size && want.every((v, k) => topo.positions[k] === v), `${header64 ? 'UInt64' : 'UInt32'} 머리: Points · connectivity(Int64) · offsets(머리값 2배)로 셀 중심`);
  }
}

// ---------- 2. 변환 함수: 어긋난 byteOffset · 빈 kept · 넘겨줄 버퍼 ----------
{
  const kept = Int32Array.from({ length: N - SOLID.size }, (_, k) => [...Array(N).keys()].filter((i) => !SOLID.has(i))[k]);
  const arrs = cellArrays().filter((a) => a.comps !== 9 && a.name !== 'solid' && a.name !== 'position');
  const exact = (a) => new Uint8Array(a.data.buffer.slice(a.data.byteOffset, a.data.byteOffset + a.data.byteLength));
  const ref = decodeCellArrays(arrs.map((a) => ({ name: a.name, type: a.type, components: a.comps, bytes: exact(a).buffer })), kept, kept.length);
  let allSame = true;
  for (const shift of [1, 3, 4, 5, 8]) {
    const shifted = arrs.map((a) => {
      const e = exact(a), buf = new ArrayBuffer(e.length + shift + 7);
      new Uint8Array(buf, shift, e.length).set(e);
      return { name: a.name, type: a.type, components: a.comps, bytes: new Uint8Array(buf, shift, e.length) };
    });
    const got = decodeCellArrays(shifted, kept, kept.length);
    const d = diffFields(got, ref);
    if (d) { allSame = false; console.log(`  어긋남 ${shift} B: ${d}`); }
  }
  ok(allSame, '어긋난 byteOffset(1 · 3 · 4 · 5 · 8 B): 맞춰 놓은 바이트와 결과가 비트까지 같음');
  // asFloat32 · numericView: 보기와 딱 맞는 버퍼가 같은 값, 어긋나면 복사
  const f64 = new Float64Array([1.1, -2.2, 3.3e300, -0]);
  const buf = new ArrayBuffer(4 + 32); new Uint8Array(buf, 4).set(new Uint8Array(f64.buffer));
  const view = new Uint8Array(buf, 4, 32);
  ok(sameBits(asFloat32(view, 'Float64'), oldAsFloat32(f64.buffer.slice(0), 'Float64')), 'asFloat32: 4 B 어긋난 Float64 = 예전 변환');
  const nv = numericView(view, 'Float64');
  ok(nv.length === 4 && nv[0] === 1.1 && Object.is(nv[3], -0), 'numericView: 4 B 어긋난 Float64 를 복사해 읽음');
  const f32buf = new ArrayBuffer(8 + 12); new Float32Array(f32buf, 8, 3).set([1, 2, 3]);
  const v32 = asFloat32(new Uint8Array(f32buf, 8, 12), 'Float32');
  ok(v32.buffer === f32buf && v32.byteOffset === 8 && v32.length === 3, 'asFloat32: 맞게 놓인 Float32 는 복사하지 않은 보기');
  let threw = '';
  try { asFloat32(new Uint8Array(new ArrayBuffer(16), 8, 6), 'Float32'); } catch (e) { threw = e.name; }
  let oldThrew = '';
  try { oldAsFloat32(new ArrayBuffer(6), 'Float32'); } catch (e) { oldThrew = e.name; }
  ok(threw === 'RangeError' && threw === oldThrew, `원소 크기의 배수가 아닌 바이트: 예전처럼 ${oldThrew} (${threw})`);
  // 빈 kept
  const empty = decodeCellArrays(arrs.map((a) => ({ name: a.name, type: a.type, components: a.comps, bytes: exact(a) })), new Int32Array(0), 0);
  ok(empty.scalars.length === 9 && empty.vectors.length === 3 && empty.scalars.every((s) => s.values.length === 0 && sameStats(s.stats, { min: 0, max: 1, p2: 0, p98: 1 }))
    && empty.vectors.every((v) => v.values.length === 0 && v.magnitude.length === 0 && sameStats(v.stats.magnitude, { min: 0, max: 1, p2: 0, p98: 1 })), '빈 kept: 길이 0 값 · 통계 0~1');
  ok(transferOfDecoded(empty).length === 0 && !!structuredClone(empty, { transfer: transferOfDecoded(empty) }), '빈 kept: 넘겨줄 버퍼 없음 · 그대로 복제됨');
  // 넘겨줄 버퍼: 배열마다 제 버퍼, 같은 버퍼 두 번 없음 → structuredClone(transfer) 가 받아 주고 보낸 쪽은 비워짐
  const t = transferOfDecoded(ref);
  ok(t.length === ref.scalars.length + 2 * ref.vectors.length && new Set(t).size === t.length, `돌려줄 버퍼 ${t.length}개 = 스칼라 ${ref.scalars.length} + 벡터 ${ref.vectors.length} × 2 · 중복 없음`);
  const sent = structuredClone(ref, { transfer: t });
  ok(ref.scalars[0].values.byteLength === 0 && ref.vectors[0].magnitude.byteLength === 0 && sent.scalars[0].values.length === kept.length, '넘겨준 값 버퍼는 보낸 쪽에서 비워지고 받은 쪽에 있음');
  let dup = '';
  try { const b = new ArrayBuffer(8); structuredClone(b, { transfer: [b, b] }); } catch (e) { dup = e.name; }
  ok(dup === 'DataCloneError', `(확인) 같은 버퍼를 두 번 넘기면 ${dup}`);
  const shared = new ArrayBuffer(64);
  const ins = [{ name: 'a', type: 'Float32', components: 1, bytes: new Uint8Array(shared, 0, 32) }, { name: 'b', type: 'Float32', components: 1, bytes: new Uint8Array(shared, 32, 32) }, { name: 'c', type: 'Float32', components: 1, bytes: new ArrayBuffer(8) }];
  const ti = transferOfInputs(ins);
  ok(ti.length === 2 && ti.includes(shared), `보낼 바이트: 한 버퍼를 나눠 쓴 두 배열은 한 번만 (${ti.length}개)`);
}

// ---------- 3. computeStats: Float64Array 정렬 = 예전 비교 함수 정렬 ----------
{
  const cases = [];
  const mk = (n, f) => Float32Array.from({ length: n }, (_, i) => f(i));
  cases.push(['+0 들 뒤에 -0 들 (백분위가 0 덩어리)', Float32Array.from([...Array(25).fill(0), ...Array(25).fill(-0), ...Array.from({ length: 50 }, (_, i) => i + 1)])]);
  cases.push(['-0 들 뒤에 +0 들', Float32Array.from([...Array(25).fill(-0), ...Array(25).fill(0), ...Array.from({ length: 50 }, (_, i) => -i - 1)])]);
  cases.push(['±0 번갈아 · 음수 · 양수', mk(500, (i) => (i % 3 === 0 ? (i % 2 ? -0 : 0) : (i % 3 === 1 ? -i : i)))]);
  cases.push(['모두 ±0', mk(1000, (i) => (i % 5 ? 0 : -0))]);
  cases.push(['NaN · ±Infinity 섞임', mk(3000, (i) => (i % 11 === 0 ? NaN : i % 13 === 0 ? Infinity : i % 17 === 0 ? -Infinity : Math.sin(i) * 1e5))]);
  cases.push(['모두 같은 값', mk(2000, () => 101325)]);
  cases.push(['모두 NaN', mk(10, () => NaN)]);
  cases.push(['표본(보폭) 위가 모두 NaN', mk(120001, (i) => (i % 2 === 0 ? NaN : 5))]);
  cases.push(['큰 배열(보폭 > 1) · 0 이 많음', mk(250000, (i) => (i % 4 === 0 ? (i % 8 ? 0 : -0) : (rnd() - 0.3) * 1e-3))]);
  cases.push(['값 하나', Float32Array.from([-0])]);
  cases.push(['float32 끝값', Float32Array.from([3.4028234663852886e38, -3.4028234663852886e38, 1e-45, -1e-45, 0, -0])]);
  let all = true, naiveDiffers = false;
  for (const [label, v] of cases) {
    const a = newComputeStats(v), b = oldComputeStats(v);
    if (!sameStats(a, b)) { all = false; console.log(`  다름: ${label} ${JSON.stringify(a)} ≠ ${JSON.stringify(b)} (p2 ${Object.is(a.p2, -0) ? '-0' : a.p2} · ${Object.is(b.p2, -0) ? '-0' : b.p2})`); }
  }
  // (확인) 0 부호를 맞추지 않고 Float64Array 로만 정렬하면 첫 경우가 달라진다 — 위 비교가 그 차이를 잡는다
  {
    const v = cases[0][1], s = Float64Array.from(v).sort();
    naiveDiffers = !Object.is(s[Math.floor(0.02 * (s.length - 1))], oldComputeStats(v).p2);
  }
  ok(all, `computeStats ${cases.length}경우(±0 · NaN · ±Infinity · 같은 값 · 큰 배열): min·max·p2·p98 가 예전과 비트까지 같음`);
  ok(naiveDiffers, '(확인) 0 부호를 맞추지 않은 정렬은 +0 들 뒤 -0 경우에서 p2 부호가 달라짐 — 맞춤이 필요함');
}

// ---------- 4. 가짜 Worker: 넘겨주기 · 위상 한 번 · 오류 · 죽음 → 메인 ----------
/** 가짜 Worker: structuredClone 으로 넘겨주기를 흉내(보낸 버퍼가 비워짐) · 처리는 실제 createDecodeHandler. die 면 decode 를 받으면 죽는다 */
function fakeFactory(opts = {}) {
  const made = [];
  const factory = () => {
    const w = {
      onmessage: null, onerror: null, onmessageerror: null, ops: [], sentBytes: [], dropped: [], terminated: false,
      handle: null,
      postMessage(msg, transfer) {
        if (w.terminated) return;
        const inputs = msg.op === 'decode' ? msg.arrays.map((a) => a.bytes) : [];
        const copy = structuredClone(msg, { transfer });
        w.sentBytes.push(...inputs);
        w.ops.push(copy.op);
        if (copy.op === 'drop') w.dropped.push(copy.topoId);
        if (opts.die && copy.op === 'decode' && w.ops.filter((o) => o === 'decode').length >= opts.die) { setTimeout(() => w.onerror?.({ message: '시험: Worker 죽음' })); return; }
        if (opts.silent && copy.op === 'decode') return; // 오류 없이 답을 주지 않는다 (응답 없음)
        setTimeout(() => { if (!w.terminated) w.handle(copy); });
      },
      terminate() { w.terminated = true; },
    };
    w.handle = createDecodeHandler((reply, transfer) => { const copy = structuredClone(reply, { transfer }); setTimeout(() => { if (!w.terminated) w.onmessage?.({ data: copy }); }); });
    made.push(w);
    return w;
  };
  return { factory, made };
}
const synBytes = makeVtu({ cells: N, arrays: cellArrays() });
{
  const { factory, made } = fakeFactory();
  setDecoderForTest(factory);
  const c = await compareFile('w', synBytes);
  const w = made[0];
  const d = diffFields(c.after, c.before);
  ok(getDecoder().kind === 'worker' && made.length === 1, `가짜 Worker 를 씀 (${getDecoder().kind} · 만든 수 ${made.length})`);
  ok(!d, `Worker 길: 예전과 비트까지 같음 ${d}`);
  ok(w.ops[0] === 'topo' && w.ops.filter((o) => o === 'topo').length === 1 && w.ops.filter((o) => o === 'decode').length === VALUE_COUNT, `위상 한 번 + 배열마다 decode (${w.ops.join(',')})`);
  ok(w.sentBytes.length === VALUE_COUNT && w.sentBytes.every((b) => b.byteLength === 0), '보낸 배열 바이트는 넘겨져 메인 쪽이 비워짐 (복사하지 않음)');
  ok(c.newReads === 1 + VALUE_COUNT, `Worker 길도 읽기 = 헤더 + 배열마다 한 번 (${c.newReads})`);
  // 같은 위상으로 다시: 위상을 다시 보내지 않음
  const again = await readVtuFields(c.src, c.topo, ['pressure', 'velocity']);
  ok(w.ops.filter((o) => o === 'topo').length === 1 && again.scalars.length === 1 && again.vectors.length === 1, '같은 위상으로 다음 장면: 위상은 다시 보내지 않음');
  // 변환 오류(형식 모름): 예전과 같은 예외 · Worker 는 그대로
  const bad = makeVtu({ cells: N, arrays: [...cellArrays().slice(0, 3), { sec: 'CellData', type: 'Float16', name: 'half', comps: 1, data: new Uint16Array(N) }] });
  const bsrc = new CountingSource('bad.vtu', bad);
  const btopo = await readVtuTopology(bsrc, 'bad', topoOpts);
  let e1 = '', e0 = '';
  try { await readVtuFields(bsrc, btopo, ['pressure', 'half']); } catch (e) { e1 = e.message; }
  try { await oldReadFields(bsrc, btopo, ['pressure', 'half']); } catch (e) { e0 = e.message; }
  ok(e1 && e1 === e0 && getDecoder().kind === 'worker' && !w.terminated, `Worker 안 변환 오류: 예전과 같은 예외 '${e1}' · Worker 는 버리지 않음`);
  // 뒤 배열 읽기가 실패: 앞 배열(half — Worker 에서 변환 오류)은 기다리지 않게 되지만 처리 안 한 거부로 남지 않음
  // 읽기 차례: 헤더(0) · half 길이 머리(1) · half 값(2 — 기대 길이를 모르는 형식이라 두 번) · pressure(3, 실패)
  bsrc.reset();
  bsrc.fail = (_start, n) => n === 3;
  let rf = '';
  try { await readVtuFields(bsrc, btopo, ['half', 'pressure']); } catch (e) { rf = e.message; }
  bsrc.fail = null;
  await new Promise((r) => setTimeout(r, 30));
  ok(/시험: 읽기 실패/.test(rf) && unhandled === 0, `뒤 배열 읽기 실패 → 그 예외 (${rf}) · 앞 배열의 변환 오류는 처리 안 한 거부로 남지 않음 (${unhandled})`);
}
{
  // Worker 가 첫 decode 를 받고 죽음: 기다리던 배열은 WorkerLost → 다시 읽어 메인에서 · 그 뒤로는 메인 고정
  const { factory, made } = fakeFactory({ die: 1 });
  setDecoderForTest(factory);
  warnings.length = 0;
  const c = await compareFile('dead', synBytes);
  const d = diffFields(c.after, c.before);
  const rereads = c.newReads - (1 + VALUE_COUNT);
  ok(!d, `Worker 가 죽어도 값은 예전과 비트까지 같음 ${d}`);
  ok(rereads >= 1 && rereads <= VALUE_COUNT, `죽을 때 넘겨 둔 배열만 다시 읽음 (다시 읽기 ${rereads}번 · 배열 ${VALUE_COUNT})`);
  ok(getDecoder().kind === 'inline' && made.length === 1 && made[0].terminated, `그 뒤로는 메인 고정 (${getDecoder().kind}) · Worker 끝냄 · 새로 만들지 않음`);
  ok(warnings.some((m) => /메인에서 계속/.test(m)), `콘솔 경고 한 줄 (${warnings[0] ?? '없음'})`);
  c.src.reset();
  const next = await readVtuFields(c.src, c.topo, VALUE_NAMES);
  ok(!diffFields(next, c.before) && c.src.reads.length === 1 + VALUE_COUNT && made.length === 1, '다음 장면은 메인에서 (다시 읽기 없음 · Worker 를 다시 만들지 않음)');
  let lost = null;
  try { throw new WorkerLost('x'); } catch (e) { lost = e; }
  ok(lost instanceof Error && lost.name === 'WorkerLost', 'WorkerLost 는 Error');
}
{
  // Worker 가 오류 없이 답을 주지 않음(응답 없음): 마지막 답(없으면 첫 요청) 뒤 시간 제한(시험 40 ms)이 지나면 Worker 를 버린다 — 기다리던 배열은
  // WorkerLost 길로 다시 읽어 메인에서(값 같음) · 그 뒤로는 메인 고정. 시간 제한이 없으면 readVtuFields 가 끝나지 않는다(검토 반영 2026-11-06)
  ok(REPLY_TIMEOUT_MS === 30000, `응답 시간 제한 기본값 ${REPLY_TIMEOUT_MS} ms (마지막 답 뒤 30 초)`);
  const { factory, made } = fakeFactory({ silent: true });
  setDecoderForTest(factory, { replyTimeoutMs: 40 });
  warnings.length = 0;
  const t0 = performance.now();
  const c = await Promise.race([compareFile('silent', synBytes), new Promise((r) => setTimeout(() => r(null), 3000))]);
  const ms = performance.now() - t0;
  ok(c && !diffFields(c.after, c.before), `응답 없는 Worker: 시간 제한 뒤 메인에서 끝남 · 값이 예전과 비트까지 같음 (${ms.toFixed(0)} ms)`);
  ok(c && c.newReads > 1 + VALUE_COUNT && c.newReads <= 1 + 2 * VALUE_COUNT, `넘겨 둔 배열만 다시 읽음 (읽기 ${c?.newReads} · 헤더 + 배열 ${VALUE_COUNT} + 다시 읽기)`);
  ok(getDecoder().kind === 'inline' && made.length === 1 && made[0].terminated && warnings.some((m) => /응답 없음 — 메인에서 계속/.test(m)),
    `그 뒤로는 메인 고정 (${getDecoder().kind}) · Worker 끝냄 · 콘솔 경고 '${warnings.find((m) => /응답 없음/.test(m)) ?? '없음'}'`);
}
{
  // 답이 오는 동안은 시간 제한에 걸리지 않음: Worker 가 한 번에 하나씩 30 ms 씩 걸려 답하면(시간 제한 150 ms) 모두 합해 시간 제한을 넘어도
  // 답 사이가 짧으므로 Worker 그대로 — 시간 제한은 첫 요청이 아니라 마지막 답부터 센다
  const slowFactory = () => {
    const w = fakeFactory().factory();
    const realHandle = w.handle;
    let queue = Promise.resolve();
    w.handle = (msg) => { queue = queue.then(() => new Promise((r) => setTimeout(() => { realHandle(msg); r(); }, msg.op === 'decode' ? 30 : 0))); };
    return w;
  };
  setDecoderForTest(slowFactory, { replyTimeoutMs: 150 });
  const c = await compareFile('slow', synBytes);
  ok(!diffFields(c.after, c.before) && getDecoder().kind === 'worker' && c.newReads === 1 + VALUE_COUNT,
    `느린 답(30 ms씩, 배열 ${VALUE_COUNT}개 — 합 ${30 * VALUE_COUNT} ms > 시간 제한 150 ms): 마지막 답부터 세므로 Worker 를 버리지 않음 (${getDecoder().kind} · 읽기 ${c.newReads})`);
}
{
  // 위상 지우기(release — 데이터를 바꿔 열 때 TimeSeries.dispose): Worker 에 drop 을 바로 보내고, 같은 위상을 다시 쓰면 위상부터 다시 보낸다
  const { factory, made } = fakeFactory();
  setDecoderForTest(factory);
  const src = new CountingSource('rel.vtu', synBytes);
  const topo = await readVtuTopology(src, 'rel', topoOpts);
  releaseTopology(topo.kept);
  ok(made.length === 0, '변환기를 만들기 전에 지우면 아무것도 하지 않음 (지우려고 Worker 를 만들지 않음)');
  await readVtuFields(src, topo, ['pressure']);
  const w = made[0];
  releaseTopology(topo.kept);
  releaseTopology(topo.kept);
  ok(w.dropped.length === 1 && w.dropped[0] === 1, `release: 그 위상의 drop 을 한 번 보냄 (두 번째는 보낸 적 없는 위상이라 하지 않음 — ${w.dropped.join(',')})`);
  await readVtuFields(src, topo, ['pressure']);
  ok(w.ops.filter((o) => o === 'topo').length === 2 && w.ops.at(-2) === 'topo' && w.ops.at(-1) === 'decode', `지운 뒤 같은 위상으로 변환하면 위상부터 다시 보냄 (${w.ops.join(',')})`);
  setDecoderForTest(null);
  releaseTopology(topo.kept);
  ok(getDecoder().kind === 'inline', '메인 변환기에서는 지울 것이 없음 (예외 없음)');
}
{
  // Worker 를 만들 수 없음(생성자 예외 — 보안 설정 등) → 메인
  setDecoderForTest(() => { throw new Error('시험: Worker 금지'); });
  warnings.length = 0;
  const c = await compareFile('noworker', synBytes);
  ok(getDecoder().kind === 'inline' && !diffFields(c.after, c.before) && warnings.some((m) => /만들지 못함/.test(m)), 'Worker 를 만들지 못하면 메인 · 값 같음 · 경고 한 줄');
  setDecoderForTest(null);
  ok(getDecoder().kind === 'inline', 'Worker 없음(null) → 메인');
  setDecoderForTest();
}

// ---------- 5. 실제 결과 fluid_dem_0.vtu (deploy/jobs — git 에 없음) ----------
{
  const rel = 'deploy/jobs/cfd-20261027-120608-4be2/fluid_dem/bin/LEVEL_00/fluid_dem_0.vtu';
  const abs = path.join(ROOT, rel);
  let fh = null;
  try { fh = await fs.open(abs, 'r'); } catch { skipped++; console.log(`SKIP ${rel} 이 없어 건너뜀 (git 에 없는 배포 결과)`); }
  if (fh) {
    try {
      const src = new FileSource(abs, fh, (await fh.stat()).size);
      const h = await readVtuHeader(src);
      const names = h.arrays.filter((a) => a.location === 'cells' && /^Float/.test(a.type) && a.name !== 'position' && (a.components === 1 || a.components === 3)).map((a) => a.name);
      const topo = await readVtuTopology(src, 'LEVEL_00', { arrays: [], solidArray: h.arrays.some((a) => a.name === 'solid') ? 'solid' : undefined });
      src.reset();
      const before = await oldReadFields(src, topo, names);
      const oldReads = src.reads.length, oldBytes = src.readBytes;
      for (const [label, make] of [['메인', null], ['가짜 Worker', fakeFactory().factory]]) {
        setDecoderForTest(make);
        src.reset();
        const t0 = performance.now();
        const after = await readVtuFields(src, topo, names);
        const ms = performance.now() - t0;
        const d = diffFields(after, before);
        ok(!d && names.length >= 2, `fluid_dem_0.vtu(셀 ${topo.numCells.toLocaleString()} · 남긴 ${topo.count.toLocaleString()} · 배열 ${names.length}) ${label}: 예전과 비트까지 같음 · ${ms.toFixed(0)} ms ${d}`);
        ok(src.reads.length === 1 + names.length && oldReads === 1 + 2 * names.length && src.readBytes === oldBytes,
          `fluid_dem_0.vtu ${label}: 읽기 ${src.reads.length} (예전 ${oldReads}) · 받은 바이트 ${src.readBytes} = 예전 ${oldBytes}`);
      }
      setDecoderForTest();
    } finally { await fh.close(); }
  }
}

console.warn = realWarn;
ok(unhandled === 0, `처리 안 한 거부 없음 (${unhandled})`);
console.log(fail ? `\n실패 ${fail} · 통과 ${pass}` : `\n모두 통과 (통과 ${pass}${skipped ? ` · 건너뜀 ${skipped}묶음` : ''})`);
process.exit(fail ? 1 : 0);

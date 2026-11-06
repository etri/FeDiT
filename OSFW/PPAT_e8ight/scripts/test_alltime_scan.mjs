#!/usr/bin/env node
// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   test_alltime_scan.mjs

'전 시점 범위' 읽기(src/data/timeSeries.ts TimeSeries.scanRange)의 Node 시험. esbuild 로 메모리에서 묶어 data: 주소로 불러 쓰고,
파일은 읽은 바이트·동시 읽기 수를 세는 시험용 폴더(메모리 · fs)와 가짜 fetch(바이트 범위 요청을 받는 서버 / 무시하는 서버)로 연다.
0번 묶음(합성 결과 — 6장면 × 12셀, 고체 2셀, 메모리에서 만든 VTU)은 배포 결과 없이도 늘 돈다: 값(화면 경로와 비트까지 같음 · 고체 뺌) · 읽은 바이트 ·
멈춤 · 동시 수 · 첫 파일 읽기가 끝날 때까지 다른 일꾼은 기다림(캐시된 첫 시점은 세지 않음) · 다중 레벨 가림(mask — 파일 길·캐시 길·손 계산이 같음) ·
진행 알림이 예외를 던지면 새 시점을 맡지 않음 · 바이트 범위를 무시하는 서버(모든 .vtu GET 이 겹치지 않음) ·
성분(Z)을 읽으며 함께 센 벡터 크기 최대(magMax — 성분의 '모두 같음' 하한, 파일 길·캐시 길)가 크기 전 시점 최대와 같음 ·
읽어 둔 시점들의 범위(cachedRange — 값 밀대 끝을 정할 때)가 전 시점 범위의 캐시 길과 같고 파일을 읽지 않으며 캐시에 있는 시점만 셈.
0b 묶음(같은 합성 결과)은 저장 시점 하나 읽기의 진행(재생 막대의 진행 원 — onStepProgress · loadProgress)과 캐시 바뀜(읽어 둔 장면 띠 — onCacheChange):
0 에서 시작해 늘기만 하고 끝은 가득 · 배열 하나를 마칠 때마다 그 몫 · step() 바로 뒤부터 진행이 있음 · 미리 읽기를 기다리면 한 번만 읽음 ·
캐시에 있는 시점은 알림 없음 · 넣음 · 비움 · 예산 초과로 버림이 캐시 바뀜.
0c 묶음은 재생 중 미리 읽기(prefetchAhead — 예산 60% 안의 수 · 한 번에 하나 · 멈춤 · 실패한 시점 건너뜀).
0d 묶음(같은 합성 결과)은 쓰는 배열만 읽기((시점, 배열) 캐시): 머리로 만든 Field 목록(fieldCatalogOf — 다중 레벨 교집합)·처음 칠할 Field(defaultFieldOf) ·
init 은 쓰는 배열만 · 빠진 배열만 읽음(읽은 바이트) · 같은 배열 두 번 안 읽음 · useArrays 로 '읽어 둔 장면'이 줄어듦 · 같은 (시점, 배열) 동시 요청은 한 번 ·
읽는 중에 배열을 더하면 겹친 것은 기다리고 빠진 것만(진행은 두 묶음 몫을 더함) · 값이 '전부 읽기'와 비트까지 같음 · 파일에 없는 배열은 다시 안 읽음 ·
안 쓰는 배열 먼저 버림 · 그다음 오래 안 쓴 것 · 방금 장면은 버리지 않음 · 미리 읽기 상한과 읽는 배열이 쓰는 배열 기준 · 전 시점 범위가 (시점, 배열) 항목을 바로 씀 · clearCache ·
같은 시점의 헤더 · 파일 열기는 한 번(위상 읽기와 첫 값 읽기도 함께, 동시 두 묶음도 함께 — 항목이 모두 버려지거나 clearCache 면 함께 버림) · dispose.
0e 묶음(같은 합성 결과)은 받기 줄 차례(2026-11-06 밤 — rangeGovernor 우선 줄): 처음 열기 · step 은 보는 장면, prefetch · prefetchAhead 는 미리 읽기,
scanRange 는 전 시점 범위 차례를 ByteSource.read 에 넘기고, 미리 읽던 장면을 step 이 기다리면 그 묶음의 차례(헤더 읽기 포함)를 올림. 보는 장면끼리는
나중에 부른 묶음이 먼저 받도록 묶음마다 부른 차례(turn)를 매기고, 미리 읽던 묶음을 보게 되면 turn 도 새로 매김.
3번 묶음(HTTP 가짜 fetch)의 합성 결과 시험에는 검증 반영(2026-11-06 저녁)도 있다: 바이트 범위를 무시하는 서버에서 헤더 표가 파일 전체를 붙잡지 않음(받는 서버는
그대로 다시 씀) · 전 시점 범위 [취소]가 블록 파일 열기(HEAD) · .vtm 읽기에서 매달린 요청을 바로 끊고 더 보내지 않음 · 닫은 시간축(dispose)이 읽던 배열 요청을 끊음.
setArrays 는 예전 뜻(쓰는 배열 바꾸기 + 캐시 비우기) 그대로라 아래 묶음은 그것을 '캐시 비우기'로 쓴다.
1~3번 묶음은 저장소의 배포 결과(deploy/jobs — git 에 없음)를 그대로 읽는다.
확인: 농도확산(e2e_cd_001, 5장면)·다상(cfd-20261021-121914-9c75, 4장면)의 전 시점 최소~최대가 정답(파이썬 계산, float32)과 같고, 모든 시점을 화면 경로
(series.step → 데이터셋 값)로 읽어 구한 값과 비트까지 같음 · 읽은 .vtu 바이트 = 시점마다 헤더 64 KB + 길이 머리 8 B + 그 배열뿐(다른 배열 자리를 읽지 않음, HTTP 도 같음),
읽기는 시점마다 2번(헤더 · 길이 머리와 배열 한 요청 — loaders/vtu_loader.ts readVtuBytes) ·
캐시된 시점은 파일을 읽지 않고 캐시를 바꾸지 않음 · 캐시된 시점에 그 배열이 없으면 파일로 · 없는 배열은 모든 시점 '못 읽음' · 한 시점 실패 = 그 시점만 빠짐 ·
멈춤(첫 시점 뒤 · 읽는 도중) = 새 읽기 없음·못 읽음으로 세지 않음 · 동시 읽기 ≤ 4, 1 로 주면 1 · 바이트 범위를 무시하는 서버 = 파일마다 한 번만 받고 그 뒤로는 한 번에 한 시점.
--big 을 붙이면 유체-입자(cfd-20261027-120608-4be2, 51장면 · VTU 572 MB)도 읽는다: velocity 크기 0 ~ 1.9150196, pressure -3656.574 ~ 17758.887,
읽은 바이트(velocity 63,808,344 · pressure 23,497,944)·읽기 102번 판정, wall_normal 은 모든 시점 같음이라 scanOutcome 이 적용하지 않음, 시간.

실행: node scripts/test_alltime_scan.mjs [--big]
*/
/******************************************************************************/

import { build } from 'esbuild';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const JOBS = path.join(ROOT, 'deploy', 'jobs');
const BIG = process.argv.includes('--big');
const res = await build({
  stdin: { contents: "export * from './src/data/timeSeries'; export * from './src/data/resultSet'; export * from './src/data/source'; export { mappedValues } from './src/data/pointDataset'; export { scanOutcome } from './src/core/colorRange'; export { priorityLevel, priorityTurn, PRIORITY_VIEW, PRIORITY_PREFETCH, PRIORITY_SCAN } from './src/data/rangeGovernor';", resolveDir: ROOT, loader: 'ts' },
  bundle: true, platform: 'neutral', format: 'esm', target: 'es2022', write: false, logLevel: 'silent',
});
const { TimeSeries, scanResultFolder, displayableArrays, solidArrayOf, fieldCatalogOf, defaultFieldOf, HttpFolder, mappedValues, scanOutcome, priorityLevel, priorityTurn, PRIORITY_VIEW, PRIORITY_PREFETCH, PRIORITY_SCAN } = await import(`data:text/javascript;base64,${Buffer.from(res.outputFiles[0].text).toString('base64')}`);

let fail = 0, pass = 0, skipped = 0;
const ok = (cond, name, extra = '') => { if (cond) { pass++; console.log(`PASS ${name}`); } else { fail++; console.log(`FAIL ${name} ${extra}`); } };
const f32 = Math.fround;
/** deploy/jobs 는 git 에 없다(.gitignore — 서버 작업 폴더에서 복사한 배포 결과). 없으면 그 묶음을 건너뛰고 알린다 */
const JOB_CD = 'e2e_cd_001', JOB_MP = 'cfd-20261021-121914-9c75', JOB_FD = 'cfd-20261027-120608-4be2';
const have = async (job) => {
  try { await fs.access(path.join(JOBS, job)); return true; } catch { skipped++; console.log(`SKIP deploy/jobs/${job} 이 없어 건너뜀 (git 에 없는 배포 결과 — 서버 작업 폴더에서 복사)`); return false; }
};
const sleep = (ms, signal) => new Promise((resolve, reject) => {
  if (!ms) { resolve(); return; }
  const t = setTimeout(resolve, ms);
  signal?.addEventListener('abort', () => { clearTimeout(t); reject(new DOMException('멈춤', 'AbortError')); }, { once: true });
});

/** 읽은 바이트·동시 읽기 수를 세는 기록 (.vtu 만 따로) */
function newStats() {
  return { vtuBytes: 0, otherBytes: 0, vtuReads: [], vtuOpens: 0, inFlight: 0, maxInFlight: 0, delayMs: 0, fail: null, mark: false, readsAfterMark: 0, prios: [] };
}

async function readRange(abs, start, end) {
  const fh = await fs.open(abs, 'r');
  try {
    const size = (await fh.stat()).size;
    const len = Math.max(0, Math.min(end + 1, size) - start);
    const buf = Buffer.alloc(len);
    if (len) await fh.read(buf, 0, len, start);
    return buf;
  } finally { await fh.close(); }
}

/**
 * 시험용 파일 (ByteSource 와 같은 모양): 읽기를 센다(.vtu 만 따로 — 바이트 · 동시 수 · 시각). store 가 실제 바이트를 준다(fs 또는 메모리).
 * 읽기마다 넘겨받은 줄 차례(priority — 받기 단계 조절기의 우선 줄)를 그때 값(level)과 함께 적는다(prios)
 */
class CountingFile {
  constructor(store, rel, stats) { this.store = store; this.rel = rel; this.stats = stats; this.name = path.posix.basename(rel); }
  async size() { return this.store.size(this.rel); }
  async read(start, end, signal, priority) {
    const s = this.stats, vtu = this.rel.endsWith('.vtu');
    s.prios.push({ rel: this.rel, start, level: priorityLevel(priority), turn: priorityTurn(priority), priority });
    signal?.throwIfAborted();
    if (s.mark && vtu) s.readsAfterMark++;
    if (vtu) { s.inFlight++; s.maxInFlight = Math.max(s.maxInFlight, s.inFlight); }
    const t0 = performance.now();
    try {
      await sleep(vtu ? s.delayMs : 0, signal);
      if (vtu && s.fail && s.fail(this.rel)) throw new Error('시험: 읽기 실패');
      const buf = await this.store.read(this.rel, start, end);
      if (vtu) { s.vtuBytes += buf.length; s.vtuReads.push({ rel: this.rel, start, len: buf.length, t0, t1: performance.now() }); } else s.otherBytes += buf.length;
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length);
    } finally { if (vtu) s.inFlight--; }
  }
}
/** 시험용 폴더 (FolderSource 와 같은 모양). store = { list(rel), size(rel), read(rel, start, end) } — 없는 경로면 list·size 가 null */
class CountingFolder {
  constructor(store, stats, rel = '', name = 'root') { this.store = store; this.stats = stats; this.rel = rel; this.name = rel ? path.posix.basename(rel) : name; }
  async list(p = '') { return this.store.list(path.posix.join(this.rel, p)); }
  async file(p) {
    const rel = path.posix.join(this.rel, p);
    if (rel.endsWith('.vtu')) this.stats.vtuOpens++; // 파일 열기 (서버면 HEAD 한 번 — HttpFolder.file)
    return (await this.store.size(rel)) === null ? null : new CountingFile(this.store, rel, this.stats);
  }
  sub(p) { return new CountingFolder(this.store, this.stats, path.posix.join(this.rel, p)); }
}
/** 디스크 폴더 (deploy/jobs/<결과>) */
function diskStore(base) {
  return {
    async list(rel) {
      try { return (await fs.readdir(path.join(base, rel), { withFileTypes: true })).map((d) => ({ name: d.name, kind: d.isDirectory() ? 'dir' : 'file' })); } catch { return null; }
    },
    async size(rel) { try { const st = await fs.stat(path.join(base, rel)); return st.isFile() ? st.size : null; } catch { return null; } },
    read: (rel, start, end) => readRange(path.join(base, rel), start, end),
  };
}
/** 메모리 폴더: files = Map<'a/b.vtu', Uint8Array> */
function memStore(files) {
  return {
    async list(rel) {
      const prefix = rel && rel !== '.' ? `${rel.replace(/\/+$/, '')}/` : '';
      const seen = new Map();
      for (const key of files.keys()) {
        if (!key.startsWith(prefix)) continue;
        const rest = key.slice(prefix.length), slash = rest.indexOf('/');
        seen.set(slash < 0 ? rest : rest.slice(0, slash), slash < 0 ? 'file' : 'dir');
      }
      return seen.size ? Array.from(seen, ([name, kind]) => ({ name, kind })) : null;
    },
    async size(rel) { return files.get(rel)?.length ?? null; },
    async read(rel, start, end) { const b = files.get(rel); return Buffer.from(b.subarray(start, Math.min(end + 1, b.length))); },
  };
}
const NodeFolder = class extends CountingFolder { constructor(base, stats) { super(diskStore(base), stats, '', path.basename(base)); } };

/** 결과 하나를 열고(위상 + 첫 시점) 캐시를 비운 TimeSeries */
async function openJob(job, stats) {
  const scan = await scanResultFolder(new NodeFolder(path.join(JOBS, job), stats));
  const series = new TimeSeries(scan, { arrays: displayableArrays(scan.blocks), solidArray: solidArrayOf(scan.blocks) });
  await series.init();
  series.setArrays(displayableArrays(scan.blocks)); // 첫 시점 캐시를 비움 (아래 시험은 파일에서 읽는 양을 센다)
  return { scan, series };
}
const resetStats = (s) => Object.assign(s, newStats(), { delayMs: s.delayMs, fail: s.fail });

/** 화면 경로: 모든 시점을 series.step 으로 읽어 데이터셋 값의 최소~최대 (레벨 하나 — 가림 없음) */
async function viaSteps(series, scan, key, mapping) {
  const [kind, name] = key.split(':');
  let lo = Infinity, hi = -Infinity;
  for (const s of scan.steps) {
    for (const d of await series.step(s.n)) {
      const f = kind === 'vector' ? d.vectors.find((v) => v.name === name) : d.scalars.find((v) => v.name === name);
      if (!f) continue;
      const v = mappedValues(f, mapping);
      for (let i = 0; i < v.length; i++) if (Number.isFinite(v[i])) { if (v[i] < lo) lo = v[i]; if (v[i] > hi) hi = v[i]; }
    }
  }
  return [lo, hi];
}

// ---------- 0. 합성 결과 (메모리에서 만든 VTU — 배포 결과 없이도 늘 돈다) ----------
const SYN = { cells: 12, steps: 6, solid: new Set([3, 7]) };
/** 저장 s 의 값: 0번은 velocity 모두 0 · pressure 모두 101325(모두 같음), 그 뒤로 퍼짐. 고체 셀에는 큰 값을 넣어 빠지는지 본다 */
function synValues(s) {
  const n = SYN.cells, velocity = new Float64Array(n * 3), pressure = new Float64Array(n), solid = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    solid[i] = SYN.solid.has(i) ? 1 : 0;
    if (solid[i]) { velocity.set([50, 50, 50], i * 3); pressure[i] = -1e9; continue; }
    velocity.set(s === 0 ? [0, 0, 0] : [0.1 * s * i, -0.03 * s * (i % 4), 1e-3 * Math.sin(i + s)], i * 3);
    pressure[i] = s === 0 ? 101325 : 101325 - 0.25 * s * i;
  }
  return { velocity, pressure, solid };
}
/** VTU(UnstructuredGrid, raw appended, UInt64 머리) 한 파일: 셀 i = x 가 i ~ i+1 인 육면체(꼭짓점 8개, 공유 없음) */
function makeVtu(v) {
  const n = SYN.cells, pts = new Float64Array(n * 8 * 3), conn = new Int32Array(n * 8), offs = new Int32Array(n), types = new Uint8Array(n).fill(12);
  for (let i = 0; i < n; i++) {
    for (let k = 0; k < 8; k++) pts.set([i + (k & 1), (k >> 1) & 1, (k >> 2) & 1], (i * 8 + k) * 3);
    for (let k = 0; k < 8; k++) conn[i * 8 + k] = i * 8 + k;
    offs[i] = (i + 1) * 8;
  }
  const blocks = [
    ['Points', 'Float64', '', 3, pts], ['Cells', 'Int32', 'connectivity', 1, conn], ['Cells', 'Int32', 'offsets', 1, offs], ['Cells', 'UInt8', 'types', 1, types],
    ['CellData', 'UInt8', 'solid', 1, v.solid], ['CellData', 'Float64', 'pressure', 1, v.pressure], ['CellData', 'Float64', 'velocity', 3, v.velocity],
  ];
  let off = 0, xml = '', section = '';
  const parts = [];
  for (const [sec, type, name, comps, arr] of blocks) {
    if (sec !== section) { if (section) xml += `</${section}>\n`; xml += `<${sec}>\n`; section = sec; }
    xml += `<DataArray type="${type}" Name="${name}" NumberOfComponents="${comps}" offset="${off}" format="appended"/>\n`;
    const head = Buffer.alloc(8); head.writeBigUInt64LE(BigInt(arr.byteLength));
    parts.push(head, Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength));
    off += 8 + arr.byteLength;
  }
  xml += `</${section}>\n`;
  const top = `<VTKFile type="UnstructuredGrid" version="1.0" byte_order="LittleEndian" header_type="UInt64">\n<UnstructuredGrid>\n<Piece NumberOfPoints="${n * 8}" NumberOfCells="${n}">\n${xml}</Piece>\n</UnstructuredGrid>\n<AppendedData encoding="raw">\n_`;
  return new Uint8Array(Buffer.concat([Buffer.from(top, 'latin1'), ...parts, Buffer.from('\n</AppendedData>\n</VTKFile>\n', 'latin1')]));
}
function synFiles() {
  const files = new Map();
  for (let s = 0; s < SYN.steps; s++) {
    files.set(`syn_${s}.vtm`, new Uint8Array(Buffer.from(`<VTKFile type="vtkMultiBlockDataSet" version="1.0" byte_order="LittleEndian" header_type="UInt64">\n<vtkMultiBlockDataSet>\n<DataSet index="0" Name="syn_${s}.vtu" file="bin/LEVEL_00/syn_${s}.vtu"> </DataSet>\n</vtkMultiBlockDataSet>\n</VTKFile>\n`, 'latin1')));
    files.set(`bin/LEVEL_00/syn_${s}.vtu`, makeVtu(synValues(s)));
  }
  return files;
}
{
  const files = synFiles();
  const stats = newStats();
  const scan = await scanResultFolder(new CountingFolder(memStore(files), stats, '', 'syn'));
  const series = new TimeSeries(scan, { arrays: displayableArrays(scan.blocks), solidArray: solidArrayOf(scan.blocks) });
  await series.init();
  series.setArrays(displayableArrays(scan.blocks));
  ok(scan.steps.length === 6 && series['topologies']?.[0]?.count === 10, `합성: 저장 6개 · 남긴 셀 10 (고체 2 뺌) — ${series['topologies']?.[0]?.count}`);
  // 값: 화면 경로(series.step)와 비트까지 같음 · 고체(50 · -1e9)는 빠짐
  resetStats(stats);
  const v = await series.scanRange({ array: 'velocity', mapping: 'magnitude' });
  const vtuSize = files.get('bin/LEVEL_00/syn_0.vtu').length;
  ok(v.used === 6 && v.failed.length === 0 && v.steps[0].min === 0 && v.steps[0].max === 0 && v.max < 50, `합성 velocity 크기 ${v.min} ~ ${v.max} · 0번은 모두 0 · 고체 값(50) 빠짐`);
  ok(stats.vtuBytes === 6 * (vtuSize + 8 + 12 * 3 * 8) && stats.vtuReads.length === 12, `합성: 읽은 .vtu 바이트 = 6 × (머리 = 파일 ${vtuSize} B · 64 KB 보다 작음 + 8 + 288) (${stats.vtuBytes}) · 읽기 12번 = 시점마다 헤더 · 길이 머리와 배열 한 번 (${stats.vtuReads.length})`);
  const p = await series.scanRange({ array: 'pressure', mapping: 'magnitude' });
  ok(p.min === f32(101325 - 0.25 * 5 * 11) && p.max === 101325, `합성 pressure ${p.min} ~ ${p.max} (고체 -1e9 빠짐)`);
  const vz = await series.scanRange({ array: 'velocity', mapping: 'z' });
  const vv = await viaSteps(series, scan, 'vector:velocity', 'magnitude'), vzz = await viaSteps(series, scan, 'vector:velocity', 'z');
  ok(vv[0] === v.min && vv[1] === v.max && vzz[0] === vz.min && vzz[1] === vz.max, `합성: 화면 경로와 비트까지 같음 — 크기 ${vv[0]} ~ ${vv[1]} · Z ${vzz[0]} ~ ${vzz[1]}`);
  // 성분의 '모두 같음' 하한(colorRange.ts componentFlatFloor)에 쓰는 벡터 크기 최대: Z 를 읽으며 같은 배열에서 함께 센다(더 읽지 않음)
  ok(vz.magMax === v.max && v.magMax === v.max && p.magMax === -Infinity, `합성: Z 성분 전 시점 범위의 magMax ${vz.magMax} = 크기 전 시점 최대 ${v.max} · 스칼라 pressure 는 -Infinity (${p.magMax})`);

  // 다중 레벨 가림(mask — 남긴 셀 순서): 파일 길 · 캐시 길 · 손 계산이 같음
  const mask = Uint8Array.from({ length: 10 }, (_, i) => (i % 2 === 0 ? 1 : 0));
  const masks = new Map([['LEVEL_00', mask]]);
  series.setArrays(displayableArrays(scan.blocks));
  const viaFile = await series.scanRange({ array: 'velocity', mapping: 'magnitude', masks });
  for (const s of scan.steps) await series.step(s.n);
  resetStats(stats);
  const viaCache = await series.scanRange({ array: 'velocity', mapping: 'magnitude', masks });
  let mlo = Infinity, mhi = -Infinity;
  for (const s of scan.steps) {
    const f = (await series.step(s.n))[0].vectors.find((x) => x.name === 'velocity');
    const m = mappedValues(f, 'magnitude');
    for (let i = 0; i < m.length; i++) if (mask[i] && Number.isFinite(m[i])) { mlo = Math.min(mlo, m[i]); mhi = Math.max(mhi, m[i]); }
  }
  ok(viaFile.min === viaCache.min && viaFile.max === viaCache.max && viaFile.max === mhi && viaFile.min === mlo && stats.vtuReads.length === 0,
    `가림 mask: 파일에서 ${viaFile.min} ~ ${viaFile.max} = 캐시에서 ${viaCache.min} ~ ${viaCache.max} = 손 계산 ${mlo} ~ ${mhi} (캐시 길은 파일 안 읽음)`);
  ok(viaFile.max < v.max, `가림이 실제로 셀을 뺌 (가림 ${viaFile.max} < 전체 ${v.max})`);
  const vzCache = await series.scanRange({ array: 'velocity', mapping: 'z', masks });
  ok(vzCache.magMax === viaFile.max, `캐시 길: Z 성분의 magMax ${vzCache.magMax} = 가림 크기 최대 ${viaFile.max}`);

  // 읽어 둔 시점들의 범위(cachedRange — 값 밀대 끝을 정할 때): 전 시점 범위의 캐시 길과 같은 값 · 파일을 읽지 않음 · 캐시에 있는 시점만
  resetStats(stats);
  const cr = series.cachedRange('velocity', 'magnitude', masks), crAll = series.cachedRange('velocity', 'magnitude', new Map());
  const crZ = series.cachedRange('velocity', 'z', new Map()), crP = series.cachedRange('pressure', 'x', new Map());
  ok(cr && cr.min === viaCache.min && cr.max === viaCache.max && crAll && crAll.min === v.min && crAll.max === v.max && stats.vtuReads.length === 0,
    `cachedRange: 6장면 모두 캐시 — 가림 ${cr?.min} ~ ${cr?.max} · 전체 ${crAll?.min} ~ ${crAll?.max} 가 전 시점 범위와 같음 · 파일 안 읽음`);
  ok(crZ && crZ.min === vz.min && crZ.max === vz.max && crP && crP.min === p.min && crP.max === p.max, `cachedRange: Z 성분 ${crZ?.min} ~ ${crZ?.max} · 스칼라는 성분 무시 ${crP?.min} ~ ${crP?.max}`);
  ok(series.cachedRange('no_such_array', 'magnitude', new Map()) === null, 'cachedRange: 없는 배열이면 null');
  series.setArrays(displayableArrays(scan.blocks));
  ok(series.cachedRange('velocity', 'magnitude', new Map()) === null, 'cachedRange: 캐시가 비면 null');
  await series.step(scan.steps[0].n); await series.step(scan.steps[3].n);
  const part = series.cachedRange('velocity', 'magnitude', new Map());
  const s0 = v.steps.find((x) => x.n === scan.steps[0].n), s3 = v.steps.find((x) => x.n === scan.steps[3].n);
  ok(part && part.min === Math.min(s0.min, s3.min) && part.max === Math.max(s0.max, s3.max), `cachedRange: 0 · 3번만 캐시 — ${part?.min} ~ ${part?.max} (그 두 장면의 범위)`);

  // 첫 파일 읽기가 끝날 때까지 다른 일꾼은 기다림 (읽기마다 5 ms) — 바이트 범위를 받지 않는 서버에서 처음부터 파일 전체가 여럿 오르지 않게
  series.setArrays(displayableArrays(scan.blocks));
  stats.delayMs = 5;
  resetStats(stats);
  await series.scanRange({ array: 'velocity', mapping: 'magnitude' });
  const end0 = Math.max(...stats.vtuReads.filter((x) => x.rel.endsWith('syn_0.vtu')).map((x) => x.t1));
  const others = stats.vtuReads.filter((x) => !x.rel.endsWith('syn_0.vtu'));
  ok(others.every((x) => x.t0 >= end0) && stats.maxInFlight >= 2 && stats.maxInFlight <= 4, `첫 시점(파일)을 다 읽은 뒤에 다른 일꾼이 시작 · 그 뒤 동시 ${stats.maxInFlight} (2~4)`);
  await series.step(scan.steps[0].n); // 0번을 캐시해 두면 파일을 읽는 첫 시점은 1번
  resetStats(stats);
  await series.scanRange({ array: 'velocity', mapping: 'magnitude' });
  const end1 = Math.max(...stats.vtuReads.filter((x) => x.rel.endsWith('syn_1.vtu')).map((x) => x.t1));
  ok(!stats.vtuReads.some((x) => x.rel.endsWith('syn_0.vtu')) && stats.vtuReads.filter((x) => !x.rel.endsWith('syn_1.vtu')).every((x) => x.t0 >= end1),
    '캐시에서 꺼낸 첫 시점은 세지 않음 — 파일을 읽은 1번이 끝난 뒤에 다른 일꾼이 시작');
  resetStats(stats);
  await series.scanRange({ array: 'velocity', mapping: 'magnitude', concurrency: 1 });
  ok(stats.maxInFlight === 1, `동시 1 로 주면 1 (${stats.maxInFlight})`);

  // 멈춤: 동시 1, 첫 시점 뒤 → 그 뒤 새 .vtu 읽기 없음
  series.setArrays(displayableArrays(scan.blocks));
  stats.delayMs = 0;
  const ctrl = new AbortController();
  resetStats(stats);
  const ab = await series.scanRange({ array: 'velocity', mapping: 'magnitude', concurrency: 1, signal: ctrl.signal, onStep: (q) => { if (q.done === 1) { ctrl.abort(); stats.mark = true; } } });
  ok(ab.aborted && ab.used === 1 && stats.readsAfterMark === 0, `합성: 첫 시점 뒤 멈춤 → 1개만, 그 뒤 읽기 ${stats.readsAfterMark}`);

  // 진행 알림이 예외를 던지면: scanRange 는 실패하고, 다른 일꾼은 그때 읽던 시점만 끝내고 새 시점을 맡지 않는다.
  // 0번(첫 일꾼 혼자) 뒤 네 일꾼이 1~4번을 맡고, 먼저 끝난 하나(done 2)가 예외 → 5번은 아무도 맡지 않아야 한다 (고치기 전에는 끝난 일꾼이 5번을 읽었다)
  stats.delayMs = 5;
  resetStats(stats);
  let threw = '';
  try { await series.scanRange({ array: 'pressure', mapping: 'magnitude', onStep: (q) => { if (q.done === 2) throw new Error('시험: 화면 구독 오류'); } }); } catch (e) { threw = String(e); }
  await new Promise((r) => setTimeout(r, 100)); // 남은 일꾼이 읽던 시점을 끝낼 때까지
  const readSteps = [...new Set(stats.vtuReads.map((x) => /syn_(\d+)\.vtu$/.exec(x.rel)[1]))].sort();
  ok(/화면 구독 오류/.test(threw) && !readSteps.includes('5'), `진행 알림 예외 → scanRange 실패 · 그 뒤 새 시점을 맡지 않음 (읽은 시점 ${readSteps.join(',')})`);
  stats.delayMs = 0;
}

// ---------- 0b. 저장 시점 하나 읽기 진행 (재생 막대의 진행 원 · 읽어 둔 장면 띠 — onStepProgress · loadProgress · onCacheChange) ----------
{
  const files = synFiles();
  const stats = newStats();
  const scan = await scanResultFolder(new CountingFolder(memStore(files), stats, '', 'syn'));
  const events = [];
  let cacheChanges = 0;
  const series = new TimeSeries(scan, {
    arrays: displayableArrays(scan.blocks), solidArray: solidArrayOf(scan.blocks),
    onStepProgress: (n, done, total) => events.push({ n, done, total }), onCacheChange: () => { cacheChanges++; },
  });
  await series.init();
  // 표시 배열 = pressure(Float64 × 1) · velocity(Float64 × 3), 셀 12 → 읽을 몫 12×8 + 12×3×8 = 384 B (고체 UInt8 은 표시 배열이 아님)
  const n0 = scan.steps[0].n, want = 12 * 8 + 12 * 3 * 8;
  const e0 = events.filter((e) => e.n === n0);
  const mono = e0.every((e, i) => i === 0 || e.done >= e0[i - 1].done);
  ok(e0.length >= 3 && e0[0].done === 0 && e0.every((e) => e.total === want) && e0.at(-1).done === want && mono,
    `첫 시점 읽기 진행: 0 에서 시작 · 늘기만 · 끝 ${want}/${want} (${e0.map((e) => e.done).join('→')})`);
  ok(e0.some((e) => e.done === 12 * 8), `배열 하나(pressure 96 B)를 다 읽고 다음 배열을 시작할 때 96 (${e0.map((e) => e.done).join(',')})`);
  ok(cacheChanges === 1 && series.loadProgress(n0) === null, `첫 시점이 캐시에 들어가면 캐시 바뀜 1번 · 끝난 시점은 진행 없음 (${cacheChanges})`);
  // 읽는 중: step() 을 부른 바로 뒤부터 진행이 있다 (AppCore.setStep 이 기다리기 전에 읽음) · 끝나면 없어짐
  stats.delayMs = 15;
  const n2 = scan.steps[2].n;
  const p = series.step(n2);
  const mid = series.loadProgress(n2);
  ok(!!mid && mid.done === 0 && mid.total === want, `step() 바로 뒤 진행 ${JSON.stringify(mid)}`);
  // 미리 읽기 중인 시점을 기다리면 같은 진행 (따로 읽지 않음)
  const n3 = scan.steps[3].n;
  series.prefetch(n3);
  const joined = series.step(n3);
  ok(!!series.loadProgress(n3), '미리 읽기 중인 시점도 진행이 있음');
  await Promise.all([p, joined]);
  stats.delayMs = 0;
  ok(series.loadProgress(n2) === null && series.loadProgress(n3) === null && cacheChanges === 3, `다 읽으면 진행 없음 · 캐시 바뀜 3번 (${cacheChanges})`);
  ok(events.filter((e) => e.n === n3 && e.done === want).length === 1, '미리 읽기를 기다린 시점은 한 번만 읽음 (다 읽음 알림 1번)');
  // 캐시에 있는 시점은 진행 알림 없음 · 캐시 목록도 그대로
  const before = events.length;
  await series.step(n2);
  ok(events.length === before && cacheChanges === 3, '캐시에 있는 시점: 진행 알림 없음 · 캐시 바뀜 없음');
  series.setArrays(displayableArrays(scan.blocks));
  ok(cacheChanges === 4 && series.cachedSteps().length === 0, `setArrays 로 비우면 캐시 바뀜 (${cacheChanges})`);
  series.setArrays(displayableArrays(scan.blocks));
  ok(cacheChanges === 4, '이미 빈 캐시를 다시 비우면 알리지 않음');
  // 예산을 넘어 버리는 것도 캐시 바뀜 (한 시점 몫보다 작은 예산 → 넣을 때마다 앞 시점을 버림)
  const tiny = new TimeSeries(scan, { arrays: displayableArrays(scan.blocks), solidArray: solidArrayOf(scan.blocks), cacheBytes: 1, onCacheChange: () => { tinyChanges++; } });
  let tinyChanges = 0;
  await tiny.init();
  await tiny.step(scan.steps[1].n);
  ok(tiny.cachedSteps().length === 1 && tiny.cachedSteps()[0] === scan.steps[1].n && tinyChanges === 2, `예산 초과: 앞 시점을 버리고 방금 것만 · 캐시 바뀜 2번 (${tiny.cachedSteps()} · ${tinyChanges})`);
}

// ---------- 0c. 재생 중 미리 읽기 (prefetchAhead — 앞으로 볼 시점을 캐시 예산 안에서 차례로, 한 번에 하나씩) ----------
{
  const files = synFiles();
  const stats = newStats();
  const scan = await scanResultFolder(new CountingFolder(memStore(files), stats, '', 'syn'));
  const mk = (cacheBytes) => new TimeSeries(scan, { arrays: displayableArrays(scan.blocks), solidArray: solidArrayOf(scan.blocks), cacheBytes });
  const idle = async (s) => { for (let i = 0; i < 400 && s.prefetchRunning; i++) await sleep(5); };
  const ns = scan.steps.map((s) => s.n);
  const per = 12 * 8 + 12 * 3 * 8; // 시점 하나 = 384 B (0b 와 같음)

  const s1 = mk(undefined);
  await s1.init();
  ok(s1.stepBytes() === per, `시점 하나의 바이트 = 읽는 배열 합 ${per} (${s1.stepBytes()})`);
  stats.delayMs = 3; stats.maxInFlight = 0;
  s1.prefetchAhead(ns.slice(1));
  await idle(s1);
  stats.delayMs = 0;
  ok(ns.slice(1).every((n) => s1.cachedSteps().includes(n)), `예산이 넉넉하면 앞으로 볼 시점(${ns.length - 1}개)을 모두 읽어 둠 (${s1.cachedSteps()})`);
  ok(stats.maxInFlight === 1, `한 번에 시점 하나씩 (.vtu 동시 읽기 최대 ${stats.maxInFlight})`);

  // 예산이 시점 세 개 몫이면 그 60% → 한 개(내림, 적어도 1)만
  const s2 = mk(per * 3);
  await s2.init();
  s2.prefetchAhead(ns.slice(1));
  ok(s2.prefetchQueue.length === 1 && s2.prefetchQueue[0] === ns[1], `예산 3시점 → 미리 읽기 차례 ${s2.prefetchQueue.length}개`);
  await idle(s2);
  ok(s2.cachedSteps().includes(ns[1]) && !s2.cachedSteps().includes(ns[2]), '차례에 든 것만 읽음');

  // 예산 10시점 → 6개까지. 이어서 부르면 차례를 새로 바꾼다
  const s3 = mk(per * 10);
  await s3.init();
  s3.prefetchAhead([ns[5], ns[4], ns[3]]);
  ok(s3.prefetchQueue.join() === [ns[5], ns[4], ns[3]].join(), '차례는 받은 순서대로');
  await idle(s3);
  ok([ns[5], ns[4], ns[3]].every((n) => s3.cachedSteps().includes(n)) && !s3.cachedSteps().includes(ns[1]), '받은 시점만 읽음');
  // 멈춤: 차례를 비우면 더 읽지 않는다
  stats.delayMs = 10;
  s3.prefetchAhead([ns[1], ns[2]]);
  s3.stopPrefetch();
  await idle(s3);
  stats.delayMs = 0;
  ok(s3.prefetchQueue.length === 0 && !s3.cachedSteps().includes(ns[2]), `stopPrefetch: 읽는 중인 하나 말고는 더 읽지 않음 (${s3.cachedSteps()})`);

  // 실패한 시점은 미리 읽기에서 빼고 다음으로 (재생이 닿으면 그때 다시 읽는다)
  const s4 = mk(undefined);
  await s4.init();
  stats.fail = (rel) => rel.endsWith(`syn_${ns[2]}.vtu`);
  s4.prefetchAhead([ns[2], ns[3]]);
  await idle(s4);
  stats.fail = null;
  ok(!s4.cachedSteps().includes(ns[2]) && s4.cachedSteps().includes(ns[3]), `실패한 시점은 건너뛰고 다음 시점은 읽음 (${s4.cachedSteps()})`);
  s4.prefetchAhead([ns[2], ns[3]]);
  await idle(s4);
  ok(!s4.cachedSteps().includes(ns[2]), '실패한 시점은 다시 미리 읽지 않음');
  await s4.step(ns[2]);
  ok(s4.cachedSteps().includes(ns[2]), '재생이 닿으면(step) 다시 읽어 성공');
}

// ---------- 0d. 쓰는 배열만 읽기 ((시점, 배열) 캐시 — useArrays · 빠진 배열만 · 같은 배열 두 번 안 읽음 · 버리는 차례 · 미리 읽기 상한 · 값은 전부 읽기와 비트까지 같음) ----------
{
  const files = synFiles();
  const stats = newStats();
  const scan = await scanResultFolder(new CountingFolder(memStore(files), stats, '', 'syn'));
  const solidArray = solidArrayOf(scan.blocks);
  const ns = scan.steps.map((s) => s.n);
  const vtuSize = files.get('bin/LEVEL_00/syn_0.vtu').length; // 헤더 읽기(앞 64 KB) = 파일 전체
  const P = 8 + 12 * 8, V = 8 + 12 * 3 * 8;                  // 배열 읽기 한 번 = 길이 머리 8 B + 셀 12 × 성분 × 8 B (pressure 104 · velocity 296)
  const lens = (len) => stats.vtuReads.filter((r) => r.len === len).length;
  const names = (fs) => fs.map((f) => f.name).join();
  const idle = async (s) => { for (let i = 0; i < 400 && s.prefetchRunning; i++) await sleep(5); };

  // 머리 정보로 만든 Field 목록 (resultSet.ts fieldCatalogOf — 값을 읽지 않음): UInt8 solid 는 빠지고 벡터 먼저
  const cat = fieldCatalogOf(scan.blocks);
  ok(cat.map((o) => `${o.key}|${o.label}|${o.kind}`).join() === 'vector:velocity|velocity (벡터)|vector,scalar:pressure|pressure|scalar', `Field 목록(머리): ${cat.map((o) => o.key)}`);
  const arr = (name, type, components) => ({ name, type, components, offset: 0, location: 'cells' });
  const lv = (index, numCells, arrays) => ({ index, name: `LEVEL_0${index}`, numCells, arrays });
  const multi = [
    lv(0, 8, [arr('position', 'Float64', 3), arr('rho', 'Float64', 1), arr('only0', 'Float64', 1), arr('u', 'Float32', 3), arr('flag', 'UInt8', 1), arr('t', 'Float64', 6), arr('mixed', 'Float64', 1)]),
    lv(1, 0, []),
    lv(2, 4, [arr('u', 'Float64', 3), arr('rho', 'Float64', 1), arr('position', 'Float64', 3), arr('flag', 'UInt8', 1), arr('t', 'Float64', 6), arr('mixed', 'Float64', 3)]),
  ];
  ok(fieldCatalogOf(multi).map((o) => o.key).join() === 'vector:u,scalar:rho',
    `다중 레벨: 셀 있는 블록의 교집합 · 성분 수가 다른 배열(mixed) · 한 레벨만(only0) · position · UInt8 · 성분 6 빠짐 · 빈 블록은 안 봄 (${fieldCatalogOf(multi).map((o) => o.key)})`);
  ok(defaultFieldOf(cat, 'scalar:pressure') === 'scalar:pressure' && defaultFieldOf(cat, 'scalar:none') === 'vector:velocity' && defaultFieldOf(cat) === 'vector:velocity'
    && defaultFieldOf([{ key: 'scalar:a', label: 'a', kind: 'scalar' }]) === 'scalar:a' && defaultFieldOf([]) === null, '처음 칠할 Field: colorField → 첫 벡터 → 첫 스칼라');

  // 처음 열 때는 쓰는 배열(pressure)만 읽는다
  let changes = 0;
  const events = [];
  const s = new TimeSeries(scan, { arrays: ['pressure'], solidArray, onCacheChange: () => { changes++; }, onStepProgress: (n, done, total) => events.push({ n, done, total }) });
  resetStats(stats);
  const d0 = await s.init();
  ok(names(d0[0].scalars) === 'pressure' && d0[0].vectors.length === 0 && events.length > 0 && events.every((e) => e.total === 12 * 8) && changes === 1,
    `init: 처음 쓰는 배열(pressure)만 읽음 — 진행 total ${events[0]?.total} · 데이터셋 스칼라 ${names(d0[0].scalars)} · 벡터 ${d0[0].vectors.length}개`);
  ok(stats.vtuOpens === 1 && lens(vtuSize) === 1 && lens(P) === 1,
    `init: 위상과 첫 값 읽기가 헤더를 함께 씀 — 파일 열기 ${stats.vtuOpens}번(서버면 HEAD) · 헤더 ${lens(vtuSize)}번 · pressure ${lens(P)}번 (전에는 열기 2 · 헤더 2)`);
  resetStats(stats);
  await s.step(ns[1]);
  ok(stats.vtuBytes === vtuSize + P && stats.vtuReads.length === 2 && stats.vtuOpens === 1, `1번 저장: 헤더 + pressure 만 읽음 (${stats.vtuBytes} B = ${vtuSize} + ${P} · 읽기 ${stats.vtuReads.length}번 · 열기 ${stats.vtuOpens}번)`);

  // 쓰는 배열을 바꾸면 캐시는 두고 '읽어 둔 장면'만 줄어든다
  const c0 = changes;
  s.useArrays(['velocity', 'pressure']);
  ok(changes === c0 + 1 && s.arrays.join() === 'pressure,velocity', `useArrays: 캐시 바뀜 알림 1번 · 헤더 차례로 정렬 (${s.arrays.join()})`);
  ok(s.cachedSteps().length === 0 && s.missingArrays(ns[1]).join() === 'velocity' && s.cachedBytes > 0 && s.peek(ns[1]) === null && s.peek(ns[1], ['pressure'])?.[0].scalars.length === 1,
    `쓰는 배열이 늘면 '읽어 둔 장면'이 줄어듦 (${s.cachedSteps().length}개) · 캐시는 그대로(${s.cachedBytes} B) · 1번에 빠진 배열 ${s.missingArrays(ns[1])}`);
  s.useArrays(['pressure', 'velocity', 'pressure']);
  ok(changes === c0 + 1, '같은 배열 목록이면 알리지 않음');

  // 빠진 배열만 읽는다 · 같은 배열은 두 번 읽지 않는다 · 같은 시점의 헤더는 다시 받지 않는다(앞 묶음이 읽어 둔 헤더 · 파일을 다시 씀 —
  // 2026-11-06 검토 반영 전에는 묶음마다 파일 열기(HEAD) 1번 + 헤더 1번을 더 받았다: 여기서 읽기 2번 · 열기 1번이었다)
  resetStats(stats);
  const d1 = await s.step(ns[1]);
  ok(stats.vtuBytes === V && stats.vtuReads.length === 1 && lens(P) === 0 && lens(vtuSize) === 0 && stats.vtuOpens === 0,
    `빠진 배열만: 1번 저장에 velocity 만 더 읽음 — 헤더·파일은 앞 묶음(pressure)의 것 (${stats.vtuBytes} B = ${V} · 읽기 ${stats.vtuReads.length}번 · 헤더 ${lens(vtuSize)} · 열기 ${stats.vtuOpens} · pressure ${lens(P)}번)`);
  ok(names(d1[0].scalars) === 'pressure' && names(d1[0].vectors) === 'velocity' && s.cachedSteps().join() === String(ns[1]), `1번 데이터셋 = pressure + velocity · 읽어 둔 장면 ${s.cachedSteps()}`);
  resetStats(stats);
  await s.step(ns[1]);
  ok(stats.vtuReads.length === 0, `같은 배열 두 번 안 읽음: 1번을 다시 부르면 파일을 읽지 않음 (${stats.vtuReads.length}번)`);
  await s.step(ns[0]);
  ok(stats.vtuReads.length === 1 && lens(V) === 1 && lens(P) === 0 && lens(vtuSize) === 0 && stats.vtuOpens === 0,
    `0번(처음 열 때 pressure 만 읽음)은 velocity 만 더 읽음 — 헤더는 위상을 읽을 때의 것 (헤더 ${lens(vtuSize)} · 열기 ${stats.vtuOpens} · velocity ${lens(V)} · pressure ${lens(P)})`);

  // 같은 (시점, 배열)을 동시에 부르면 한 번만 읽는다 (step 두 번 + 미리 읽기)
  stats.delayMs = 5;
  resetStats(stats);
  const [a2, b2] = await Promise.all([s.step(ns[2]), s.step(ns[2]), (s.prefetch(ns[2]), Promise.resolve())]);
  ok(stats.vtuReads.length === 3 && lens(P) === 1 && lens(V) === 1 && names(a2[0].vectors) === 'velocity' && a2[0].vectors[0] === b2[0].vectors[0],
    `동시 요청 셋(step 두 번 · prefetch) → 한 번만 읽음 (읽기 ${stats.vtuReads.length}번 = 헤더 · pressure · velocity, 같은 값 객체)`);
  // 읽는 중에 배열을 더하면 겹친 배열은 그 읽기를 기다리고 빠진 배열만 따로 읽는다 — 진행은 두 묶음 몫을 더해 끝에 가득
  s.useArrays(['pressure']);
  resetStats(stats);
  const before3 = events.length;
  const onlyP = s.step(ns[3]);
  s.useArrays(['pressure', 'velocity']);
  const both = s.step(ns[3]);
  const mid3 = s.loadProgress(ns[3]);
  const [dp, db] = await Promise.all([onlyP, both]);
  stats.delayMs = 0;
  const e3 = events.slice(before3).filter((e) => e.n === ns[3]);
  // 두 묶음이 같은 때 같은 파일을 찾으면 헤더 읽기 하나를 함께 기다린다 (검토 반영 전에는 헤더 2번 · 열기 2번)
  ok(lens(P) === 1 && lens(V) === 1 && lens(vtuSize) === 1 && stats.vtuOpens === 1 && names(dp[0].scalars) === 'pressure' && dp[0].vectors.length === 0 && names(db[0].vectors) === 'velocity' && dp[0].scalars[0] === db[0].scalars[0],
    `읽는 중에 velocity 를 더함: pressure 는 기다리고 velocity 만 따로 · 헤더는 함께 한 번 (헤더 ${lens(vtuSize)} · 열기 ${stats.vtuOpens} · pressure ${lens(P)} · velocity ${lens(V)})`);
  ok(mid3?.total === 12 * 8 + 12 * 3 * 8 && e3.every((e, i) => i === 0 || e.done >= e3[i - 1].done) && e3.at(-1).done === e3.at(-1).total && e3.at(-1).total === 384 && s.loadProgress(ns[3]) === null,
    `진행: 같은 장면 두 묶음 몫을 더함(total ${mid3?.total}) · 늘기만 · 끝 ${e3.at(-1)?.done}/${e3.at(-1)?.total} · 끝나면 진행 없음`);

  // 결과 값이 '전부 읽기'(처음부터 두 배열)와 비트까지 같음 — 값 · 벡터 크기 · 통계 · 배열 차례
  const full = new TimeSeries(scan, { arrays: displayableArrays(scan.blocks), solidArray });
  await full.init();
  const bytesOf = (a) => Buffer.from(a.buffer, a.byteOffset, a.byteLength);
  const sameF = (x, y) => x.length === y.length && bytesOf(x).equals(bytesOf(y));
  const sameS = (x, y) => ['min', 'max', 'p2', 'p98'].every((k) => Object.is(x[k], y[k]));
  let same = true;
  for (const n of ns) {
    const [x] = await full.step(n), [y] = await s.step(n);
    same &&= names(x.scalars) === names(y.scalars) && names(x.vectors) === names(y.vectors) && x.scalars.length === 1 && x.vectors.length === 1
      && x.scalars.every((f, i) => sameF(f.values, y.scalars[i].values) && sameS(f.stats, y.scalars[i].stats))
      && x.vectors.every((f, i) => { const g = y.vectors[i]; return sameF(f.values, g.values) && sameF(f.magnitude, g.magnitude) && ['magnitude', 'x', 'y', 'z'].every((k) => sameS(f.stats[k], g.stats[k])); });
  }
  ok(same, `6장면 모두 '전부 읽기'와 비트까지 같음 (0 · 1 · 3번은 배열을 나눠 읽음)`);

  // 파일에 없는 배열은 '없음'으로 적어 다시 읽지 않는다 ('읽어 둔 장면'에도 듦)
  const nm = new TimeSeries(scan, { arrays: ['pressure', 'no_such_array'], solidArray });
  await nm.init();
  resetStats(stats);
  const dn = await nm.step(ns[0]);
  ok(stats.vtuReads.length === 0 && nm.cachedSteps().join() === String(ns[0]) && names(dn[0].scalars) === 'pressure', `없는 배열은 다시 읽지 않음 (읽기 ${stats.vtuReads.length}번 · 읽어 둔 장면 ${nm.cachedSteps()})`);

  // 버리기: 예산을 넘으면 안 쓰는 배열부터(오래 안 쓴 것부터), 그다음 쓰는 배열을 오래 안 쓴 것부터. 캐시 바이트 = pressure 40 B(남긴 10셀 × float32) · velocity 160 B(값 120 + 크기 40)
  const ev = new TimeSeries(scan, { arrays: ['pressure', 'velocity'], solidArray, cacheBytes: 650 });
  await ev.init(); await ev.step(ns[1]); await ev.step(ns[2]);
  ok(ev.cachedBytes === 600 && ev.cachedSteps().join() === [ns[0], ns[1], ns[2]].join(), `세 장면 × (40 + 160) = ${ev.cachedBytes} B (예산 650)`);
  ev.useArrays(['velocity']);
  await ev.step(ns[3]);
  ok(ev.cachedBytes === 640 && ev.cachedSteps().join() === [ns[0], ns[1], ns[2], ns[3]].join() && ev.cachedRange('pressure', 'x', new Map()) === null,
    `안 쓰는 배열 먼저: pressure 셋(120 B)을 버리고 가장 오래된 0번 velocity 는 남김 (${ev.cachedBytes} B · 읽어 둔 장면 ${ev.cachedSteps()} — 오래된 것부터만 버리면 0번 velocity 를 버렸다)`);
  await ev.step(ns[0]); // 0번을 최근 사용으로
  await ev.step(ns[4]);
  ok(ev.cachedBytes === 640 && [...ev.cachedSteps()].sort((x, y) => x - y).join() === [ns[0], ns[2], ns[3], ns[4]].join(), `그다음 쓰는 배열은 오래 안 쓴 것부터: 1번을 버림 (읽어 둔 장면 ${ev.cachedSteps()})`);
  // 항목이 모두 버려진 시점은 들고 있던 헤더도 함께 버린다 — 1번을 다시 읽으면 파일을 다시 열고 헤더부터 (항목이 남은 시점은 위에서처럼 헤더를 다시 받지 않는다)
  resetStats(stats);
  await ev.step(ns[1]);
  ok(stats.vtuOpens === 1 && lens(vtuSize) === 1 && lens(V) === 1 && stats.vtuReads.length === 2,
    `항목을 모두 버린 1번은 헤더도 버림 → 다시 읽을 때 파일 열기 ${stats.vtuOpens} · 헤더 ${lens(vtuSize)} · velocity ${lens(V)}`);
  // 방금 읽은 장면은 예산보다 커도 버리지 않는다
  const tiny = new TimeSeries(scan, { arrays: ['pressure', 'velocity'], solidArray, cacheBytes: 100 });
  await tiny.init();
  const dt = await tiny.step(ns[2]);
  ok(tiny.cachedSteps().join() === String(ns[2]) && tiny.cachedBytes === 200 && names(dt[0].vectors) === 'velocity' && tiny.peek(ns[2]) !== null,
    `예산(100 B)이 장면 하나(200 B)보다 작아도 방금 읽은 장면은 남김 (${tiny.cachedSteps()} · ${tiny.cachedBytes} B)`);

  // 미리 읽기 상한·읽는 배열은 쓰는 배열 기준
  const pf = new TimeSeries(scan, { arrays: ['pressure'], solidArray, cacheBytes: 96 * 5 });
  await pf.init();
  pf.prefetchAhead(ns.slice(1));
  ok(pf.stepBytes() === 96 && pf.prefetchQueue.length === 3, `pressure 만 쓰면 장면 하나 ${pf.stepBytes()} B → 예산 480 B 의 60% 안에 ${pf.prefetchQueue.length}개`);
  resetStats(stats);
  await idle(pf);
  ok(stats.vtuBytes === 3 * (vtuSize + P) && lens(V) === 0 && pf.cachedSteps().length === 4, `미리 읽기도 쓰는 배열만 (${stats.vtuBytes} B = 3 × (${vtuSize} + ${P}))`);
  pf.useArrays(['pressure', 'velocity']);
  pf.prefetchAhead(ns.slice(1));
  ok(pf.stepBytes() === 384 && pf.prefetchQueue.length === 1, `velocity 를 더하면 장면 하나 ${pf.stepBytes()} B → ${pf.prefetchQueue.length}개`);
  resetStats(stats);
  await idle(pf);
  ok(lens(V) === 1 && lens(P) === 0 && pf.cachedSteps().join() === String(ns[1]), `차례의 1번에 빠진 velocity 만 더 읽음 (velocity ${lens(V)} · pressure ${lens(P)})`);

  // 전 시점 범위는 (시점, 배열) 항목으로 바로 찾는다: 쓰는 배열이 아니어도 캐시에 있으면 파일을 읽지 않는다
  const sr = new TimeSeries(scan, { arrays: ['velocity'], solidArray });
  await sr.init();
  for (const n of ns) await sr.step(n);
  sr.useArrays(['pressure']);
  resetStats(stats);
  const rv = await sr.scanRange({ array: 'velocity', mapping: 'magnitude' });
  const crv = sr.cachedRange('velocity', 'magnitude', new Map());
  ok(rv.used === 6 && stats.vtuReads.length === 0 && crv && crv.min === rv.min && crv.max === rv.max, `안 쓰게 된 velocity 도 캐시에 있으면 전 시점 범위 · cachedRange 가 파일 없이 셈 (${rv.min} ~ ${rv.max})`);
  // clearCache: 쓰는 배열은 두고 값만 비움
  let srChanges = 0;
  const cc = new TimeSeries(scan, { arrays: ['pressure'], solidArray, onCacheChange: () => { srChanges++; } });
  await cc.init();
  cc.clearCache();
  cc.clearCache();
  ok(srChanges === 2 && cc.cachedBytes === 0 && cc.arrays.join() === 'pressure', `clearCache: 값만 비우고 알림 1번(빈 캐시는 알리지 않음) · 쓰는 배열은 그대로 (${srChanges - 1})`);
  // clearCache 는 헤더도 비운다 — 같은 시점을 다시 읽으면 헤더부터
  resetStats(stats);
  await cc.step(ns[0]);
  ok(stats.vtuOpens === 1 && lens(vtuSize) === 1 && lens(P) === 1, `clearCache 뒤 0번: 파일 열기 ${stats.vtuOpens} · 헤더 ${lens(vtuSize)} · pressure ${lens(P)}`);

  // dispose (다른 데이터를 열 때 — AppCore): 미리 읽기 멈춤 · 캐시 비움 · 읽는 중인 묶음은 캐시에 넣지 않음 · 그 뒤 읽기는 실패
  // (Worker 에 보낸 위상 사본 지우기는 test_decode_core.mjs 의 releaseTopology — Node 는 메인 변환이라 여기서는 보낼 곳이 없다)
  const dz = new TimeSeries(scan, { arrays: ['pressure'], solidArray });
  await dz.init();
  dz.prefetchAhead(ns.slice(1));
  const wasPrefetching = dz.prefetchRunning;
  dz.dispose();
  let dzErr = '';
  try { await dz.step(ns[4]); } catch (e) { dzErr = e.message; }
  await idle(dz);
  ok(wasPrefetching && dz.cachedBytes === 0 && dz.cachedSteps().length === 0 && dz.prefetchQueue.length === 0 && dzErr === '닫은 시간축입니다.' && !dz.prefetchRunning,
    `dispose: 미리 읽기 멈춤 · 캐시 ${dz.cachedBytes} B · 그 뒤 읽기는 '${dzErr}'`);
}

// ---------- 0e. 받기 줄 차례 (2026-11-06 밤 — rangeGovernor 우선 줄): 보는 장면 · 미리 읽기 · 전 시점 범위가 ByteSource.read 에 차례를 넘김 ----------
{
  const files = synFiles();
  const stats = newStats();
  const scan = await scanResultFolder(new CountingFolder(memStore(files), stats, '', 'syn'));
  const series = new TimeSeries(scan, { arrays: ['velocity'], solidArray: solidArrayOf(scan.blocks) });
  const ns = scan.steps.map((s) => s.n);
  const levels = (from) => [...new Set(stats.prios.slice(from).map((p) => p.level))].join();
  const until = async (cond) => { for (let i = 0; i < 400 && !cond(); i++) await sleep(2); };
  let at = stats.prios.length;
  await series.init();
  ok(stats.prios.length - at >= 4 && levels(at) === String(PRIORITY_VIEW), `처음 열기(.vtm · 헤더 · 위상 · 첫 장면 값)는 보는 장면 차례 (읽기 ${stats.prios.length - at}번 · 차례 ${levels(at)})`);
  at = stats.prios.length;
  await series.step(ns[1]);
  series.useArrays(['velocity', 'pressure']);
  await series.step(ns[1]); // Field 를 바꿔 지금 장면에 배열을 더 읽음
  ok(stats.prios.length - at >= 4 && levels(at) === String(PRIORITY_VIEW), `step(n) — 장면 넘기기 · 지금 장면에 배열 더 읽기 — 는 보는 장면 차례 (읽기 ${stats.prios.length - at}번 · 차례 ${levels(at)})`);
  at = stats.prios.length;
  series.prefetch(ns[2]);
  await until(() => series.cachedSteps().includes(ns[2]));
  series.prefetchAhead([ns[3]]);
  await until(() => !series.prefetchRunning);
  ok(series.cachedSteps().includes(ns[3]) && stats.prios.length - at >= 6 && levels(at) === String(PRIORITY_PREFETCH),
    `prefetch · prefetchAhead 는 미리 읽기 차례 (읽기 ${stats.prios.length - at}번 · 차례 ${levels(at)})`);
  at = stats.prios.length;
  series.clearCache();
  const r = await series.scanRange({ array: 'velocity', mapping: 'magnitude' });
  ok(r.used === ns.length && stats.prios.length - at >= ns.length * 2 && levels(at) === String(PRIORITY_SCAN),
    `전 시점 범위(.vtm · 헤더 · 배열)는 전 시점 범위 차례 (읽기 ${stats.prios.length - at}번 · 차례 ${levels(at)})`);
  // 미리 읽던 장면을 보게 되면(같은 (시점, 배열)을 step 이 기다림) 그 묶음의 차례를 올린다: 이미 줄에 선 헤더 읽기의 차례 값도, 뒤 배열 읽기도 보는 장면
  series.useArrays(['velocity']);
  stats.delayMs = 15;
  at = stats.prios.length;
  series.prefetch(ns[4]);
  await sleep(5); // 미리 읽기 묶음의 헤더 읽기가 나가 있는 동안
  const firstLevel = stats.prios[at]?.level;
  await series.step(ns[4]);
  stats.delayMs = 0;
  const reads = stats.prios.slice(at);
  ok(reads.length >= 2 && firstLevel === PRIORITY_PREFETCH && reads[0].start === 0 && typeof reads[0].priority === 'object' && reads[0].priority.level === PRIORITY_VIEW
    && reads.slice(1).every((p) => p.level === PRIORITY_VIEW),
    `미리 읽던 장면을 보게 되면 차례를 올림: 헤더는 미리 읽기 차례(${firstLevel})로 섰다가 ${reads[0].priority?.level} 로, 뒤 배열 읽기 ${reads.length - 1}번은 보는 장면 차례`);
  // 보는 장면끼리는 나중에 부른 묶음이 먼저 받는다(turn — 받기 줄): 나중에 부른 step 의 읽기는 turn 이 더 크고, 미리 읽던 묶음을 보게 되면 turn 도 새로 매긴다
  series.clearCache();
  at = stats.prios.length;
  await series.step(ns[1]);
  const turnsA = stats.prios.slice(at).map((p) => p.turn);
  at = stats.prios.length;
  await series.step(ns[2]);
  const turnsB = stats.prios.slice(at).map((p) => p.turn);
  ok(turnsA.length >= 2 && turnsB.length >= 2 && [...turnsA, ...turnsB].every(Number.isFinite) && Math.min(...turnsB) > Math.max(...turnsA),
    `나중에 부른 step 의 읽기(헤더 포함)는 부른 차례(turn)가 더 큼 (${[...new Set(turnsA)].join(',')} → ${[...new Set(turnsB)].join(',')})`);
  stats.delayMs = 15;
  at = stats.prios.length;
  series.prefetch(ns[3]);
  await sleep(5); // 미리 읽기 묶음의 첫 읽기가 나가 있는 동안
  const pfTurn = stats.prios[at]?.turn;
  await series.step(ns[3]);
  stats.delayMs = 0;
  const laterTurns = stats.prios.slice(at + 1).map((p) => p.turn);
  ok(Number.isFinite(pfTurn) && pfTurn > Math.max(...turnsB) && laterTurns.length >= 1 && laterTurns.every((t) => Number.isFinite(t) && t > pfTurn),
    `미리 읽던 묶음을 보게 되면 turn 도 새로 매김 (미리 읽기 ${pfTurn} → 뒤 읽기 ${[...new Set(laterTurns)].join(',')})`);
}

// ---------- 1. 농도확산 e2e_cd_001 (264셀, 5장면) ----------
if (await have(JOB_CD)) {
  const stats = newStats();
  const { scan, series } = await openJob('e2e_cd_001', stats);
  const want = { 'velocity|magnitude': [0.5, 0.70710677], 'velocity|x': [0, 0.5], 'pressure|magnitude': [-0.0056507867, 101325] };
  for (const [k, [lo, hi]] of Object.entries(want)) {
    const [array, mapping] = k.split('|');
    const r = await series.scanRange({ array, mapping });
    ok(r.used === 5 && r.total === 5 && r.failed.length === 0 && r.min === f32(lo) && r.max === f32(hi), `농도확산 ${array} ${mapping}: ${r.min} ~ ${r.max} (5/5)`, `기대 ${f32(lo)} ~ ${f32(hi)}, used ${r.used}`);
  }
  const r = await series.scanRange({ array: 'velocity', mapping: 'magnitude' });
  ok(r.steps.length === 5 && r.steps[0].min === 0.5 && r.steps[0].max === 0.5, `시점별 결과: 0번은 velocity 크기 0.5 한 점 (${JSON.stringify(r.steps[0])})`);
  const vp = await viaSteps(series, scan, 'scalar:pressure', 'magnitude');
  const sp = await series.scanRange({ array: 'pressure', mapping: 'magnitude' }); // 이번엔 모든 시점이 캐시에 있다(viaSteps 가 읽음)
  ok(sp.min === vp[0] && sp.max === vp[1], `화면 경로(series.step)와 비트까지 같음 — pressure ${vp[0]} ~ ${vp[1]}`);

  // 없는 배열: 모든 시점 '못 읽음'
  const none = await series.scanRange({ array: 'no_such_array', mapping: 'magnitude' });
  ok(none.used === 0 && none.failed.length === 5 && /배열이 없습니다/.test(none.failed[0].reason), `없는 배열 → 5개 모두 못 읽음 (${none.failed[0]?.reason})`);

  // 캐시된 시점에 그 배열이 없으면 파일로 읽는다 (velocity 만 캐시)
  series.setArrays(['velocity']);
  await series.step(scan.steps[0].n);
  resetStats(stats);
  const pr = await series.scanRange({ array: 'pressure', mapping: 'magnitude' });
  ok(pr.used === 5 && stats.vtuReads.some((x) => /_0\.vtu$/.test(x.rel)), '캐시된 시점에 그 배열이 없음 → 그 시점은 파일에서 읽음(못 읽음 아님)');

  // 한 시점 실패
  series.setArrays(displayableArrays(scan.blocks));
  stats.fail = (rel) => /_2\.vtu$/.test(rel);
  const f1 = await series.scanRange({ array: 'velocity', mapping: 'magnitude' });
  ok(f1.used === 4 && f1.failed.length === 1 && f1.failed[0].n === 2 && /시험: 읽기 실패/.test(f1.failed[0].reason), `2번 파일 읽기 실패 → 4/5, 못 읽은 시점 [2] (${JSON.stringify(f1.failed)})`);
  stats.fail = () => true;
  const f2 = await series.scanRange({ array: 'velocity', mapping: 'magnitude' });
  ok(f2.used === 0 && f2.failed.length === 5 && !(f2.min <= f2.max), '모두 실패 → used 0');
  stats.fail = null;

  // 멈춤: 동시 1, 첫 시점 끝난 뒤 → 그 뒤 새 .vtu 읽기 없음
  const ctrl = new AbortController();
  resetStats(stats);
  const ab = await series.scanRange({ array: 'velocity', mapping: 'magnitude', concurrency: 1, signal: ctrl.signal, onStep: (p) => { if (p.done === 1) { ctrl.abort(); stats.mark = true; } } });
  ok(ab.aborted && ab.used === 1 && ab.failed.length === 0 && stats.readsAfterMark === 0, `첫 시점 뒤 멈춤 → aborted, 1개만, 그 뒤 읽기 ${stats.readsAfterMark}`);
  // 멈춤: 읽는 도중 (각 읽기 30 ms) → 못 읽음으로 세지 않음
  const ctrl2 = new AbortController();
  stats.delayMs = 30;
  setTimeout(() => ctrl2.abort(), 10);
  const ab2 = await series.scanRange({ array: 'velocity', mapping: 'magnitude', signal: ctrl2.signal });
  ok(ab2.aborted && ab2.failed.length === 0 && ab2.used === 0, `읽는 도중 멈춤 → aborted, 못 읽음 0 (used ${ab2.used})`);
  stats.delayMs = 0;
}

// ---------- 2. 다상 cfd-20261021-121914-9c75 (72,400셀 · 고체 1,900, 4장면) ----------
if (await have(JOB_MP)) {
  const stats = newStats();
  const { scan, series } = await openJob('cfd-20261021-121914-9c75', stats);
  const kept = series['topologies']?.[0]?.count;
  ok(kept === 70500, `남긴 셀 70,500 (고체 뺌) — ${kept}`);
  const bytes = series.arrayBytesPerStep('velocity');
  ok(bytes === 1737600, `velocity 시점당 바이트 72,400 × 3 × 8 = 1,737,600 (${bytes})`);
  resetStats(stats);
  const v = await series.scanRange({ array: 'velocity', mapping: 'magnitude' });
  ok(v.used === 4 && v.min === 0 && v.max === f32(0.040996734), `다상 velocity 크기 ${v.min} ~ ${v.max}`, `기대 0 ~ ${f32(0.040996734)}`);
  ok(stats.vtuBytes === 4 * (65536 + 8 + 1737600), `읽은 .vtu 바이트 = 4 × (64 KB + 8 + 1,737,600) = ${4 * (65536 + 8 + 1737600)} (${stats.vtuBytes})`);
  ok(stats.vtuReads.length === 8, `.vtu 읽기 8번 = 시점마다 헤더 · 길이 머리와 배열 한 번 (${stats.vtuReads.length})`);
  ok(stats.maxInFlight >= 1 && stats.maxInFlight <= 4, `동시 .vtu 읽기 ≤ 4 (${stats.maxInFlight})`);
  const p = await series.scanRange({ array: 'pressure', mapping: 'magnitude' });
  ok(p.min === f32(-0.083260626) && p.max === f32(0.04157978), `다상 pressure ${p.min} ~ ${p.max}`);
  const pz = await series.scanRange({ array: 'velocity', mapping: 'z' });
  ok(pz.used === 4, `다상 velocity Z 성분 ${pz.min} ~ ${pz.max} (0 근처 잡음 — 상대 기준으로는 모두 같음이 아님)`);
  // 동시 수: 읽기마다 3 ms 늦추면 기본은 겹치고, 1 로 주면 하나
  stats.delayMs = 3;
  resetStats(stats);
  await series.scanRange({ array: 'velocity', mapping: 'magnitude' });
  const m4 = stats.maxInFlight;
  resetStats(stats);
  await series.scanRange({ array: 'velocity', mapping: 'magnitude', concurrency: 1 });
  ok(m4 >= 2 && m4 <= 4 && stats.maxInFlight === 1, `동시 읽기: 기본 ${m4} (2~4) · 1 로 주면 ${stats.maxInFlight}`);
  stats.delayMs = 0;
  // 캐시: 0번을 캐시해 두면 0번 파일은 읽지 않고, 캐시(시점·바이트)는 그대로
  await series.step(scan.steps[0].n);
  const before = [series.cachedSteps().join(','), series.cachedBytes];
  resetStats(stats);
  const c = await series.scanRange({ array: 'velocity', mapping: 'magnitude' });
  ok(c.used === 4 && c.max === v.max && !stats.vtuReads.some((x) => /_0\.vtu$/.test(x.rel)), '캐시된 0번은 파일을 읽지 않음 (결과는 같음)');
  ok(series.cachedSteps().join(',') === before[0] && series.cachedBytes === before[1], `스캔이 캐시를 바꾸지 않음 (시점 ${before[0]} · ${before[1]} B)`);
  const vs = await viaSteps(series, scan, 'vector:velocity', 'magnitude');
  ok(vs[0] === v.min && vs[1] === v.max, `화면 경로(series.step)와 비트까지 같음 — velocity 크기 ${vs[0]} ~ ${vs[1]}`);
}

// ---------- 3. HTTP: 바이트 범위 요청 (가짜 fetch) ----------
const realFetch = globalThis.fetch;
/** 가짜 HTTP 서버. store = diskStore(결과 폴더) 또는 memStore(합성 파일) */
function fakeServer(store, mode, vtuDelay = 5) {
  const st = { mode, gets: [], vtuBytes: 0, heads: 0, vtuHeads: 0 };
  globalThis.fetch = async (url, init = {}) => {
    const u = String(url);
    init.signal?.throwIfAborted?.();
    if (u.startsWith('http://t/list')) {
      const ents = await store.list(decodeURIComponent(u.slice('http://t/list'.length).replace(/^\/+/, '')));
      return ents ? new Response(JSON.stringify(ents), { status: 200 }) : new Response('', { status: 404 });
    }
    const rel = decodeURIComponent(u.slice('http://t/data'.length).replace(/^\/+/, ''));
    const size = await store.size(rel);
    if (size === null) return new Response('', { status: 404 });
    if (init.method === 'HEAD') { st.heads++; if (rel.endsWith('.vtu')) st.vtuHeads++; return new Response(null, { status: 200, headers: { 'content-length': String(size) } }); }
    const range = /bytes=(\d+)-(\d+)/.exec(init.headers?.Range ?? '');
    const g = { rel, t0: performance.now(), t1: 0 };
    st.gets.push(g);
    await sleep(rel.endsWith('.vtu') ? vtuDelay : 0, init.signal);
    let buf;
    if (range && st.mode === 'range') buf = await store.read(rel, Number(range[1]), Number(range[2]));
    else buf = await store.read(rel, 0, size - 1);
    g.t1 = performance.now();
    if (rel.endsWith('.vtu')) st.vtuBytes += buf.length;
    // 206 에는 실제 서버처럼 Content-Range(전체 길이)를 단다 — 파일 끝을 넘는 구간(64 KB 보다 작은 합성 파일의 헤더 읽기)을 있는 데까지로 받게
    const partial = range && st.mode === 'range';
    const hdr = { 'content-length': String(buf.length), ...(partial ? { 'content-range': `bytes ${range[1]}-${Number(range[1]) + buf.length - 1}/${size}` } : {}) };
    return new Response(buf, { status: partial ? 206 : 200, headers: hdr });
  };
  return st;
}
// 합성 결과 + 바이트 범위를 무시하는 서버 (배포 결과 없이도 돈다): 첫 파일을 다 받아 알아챌 때까지 다른 일꾼이 기다리므로 모든 .vtu GET 이 겹치지 않는다
{
  const files = synFiles();
  const st = fakeServer(memStore(files), 'ignore', 5);
  const scan = await scanResultFolder(new HttpFolder('http://t/data', 'http://t/list'));
  const series = new TimeSeries(scan, { arrays: displayableArrays(scan.blocks), solidArray: solidArrayOf(scan.blocks) });
  await series.init();
  series.setArrays(displayableArrays(scan.blocks));
  st.gets.length = 0;
  const r = await series.scanRange({ array: 'velocity', mapping: 'magnitude' });
  const gets = st.gets.filter((g) => g.rel.endsWith('.vtu')).sort((a, b) => a.t0 - b.t0);
  ok(r.used === 6 && r.wholeFiles && gets.length === 6 && gets.every((g, i) => i === 0 || g.t0 >= gets[i - 1].t1),
    `합성 · 바이트 범위를 무시하는 서버: wholeFiles 표시 · 파일마다 한 번 · .vtu GET ${gets.length}개가 하나도 겹치지 않음 (처음부터 파일 전체가 여럿 오르지 않음)`);
}

// (시점, 블록) 헤더 표가 파일 전체를 받아 둔 원본(HttpSource.whole)을 붙잡지 않음 (검증 반영 2026-11-06 저녁 — 붙잡으면 바이트 범위를 무시하는 서버에서
// 읽은 장면마다 블록 파일 전체가 캐시 예산(값 바이트만 셈) 밖에 쌓였다: 유체-입자 12장면에 예산이 세는 값 9.5 MB · 붙잡은 파일 134.6 MB). 바이트 범위를 받는 서버는 지금처럼 헤더를 다시 쓴다
/** 헤더 표(heads)에 든 헤더 수와, 그 가운데 파일 전체를 받아 둔 원본의 수 · 바이트 */
async function headsHeld(series) {
  let heads = 0, wholeFiles = 0, wholeBytes = 0;
  for (const m of series['heads'].values()) {
    for (const p of m.values()) {
      const h = await p.catch(() => null);
      if (!h) continue;
      heads++;
      if (h.source.wholeFile) { wholeFiles++; wholeBytes += await h.source.size(); }
    }
  }
  return { heads, wholeFiles, wholeBytes };
}
const vtuGets = (st) => st.gets.filter((g) => g.rel.endsWith('.vtu')).length;
{
  const files = synFiles();
  // 기준값: 메모리 폴더(바이트 범위)로 읽은 velocity
  const refScan = await scanResultFolder(new CountingFolder(memStore(files), newStats(), '', 'syn'));
  const ref = new TimeSeries(refScan, { arrays: ['velocity'], solidArray: solidArrayOf(refScan.blocks) });
  await ref.init();
  const st = fakeServer(memStore(files), 'ignore', 0);
  const scan = await scanResultFolder(new HttpFolder('http://t/data', 'http://t/list'));
  const series = new TimeSeries(scan, { arrays: ['velocity'], solidArray: solidArrayOf(scan.blocks) });
  st.gets.length = 0; st.vtuHeads = 0;
  await series.init();
  let same = true;
  for (const s of scan.steps) {
    const a = (await series.step(s.n))[0].vectors[0].values, b = (await ref.step(s.n))[0].vectors[0].values;
    same &&= a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
  }
  const held = await headsHeld(series);
  ok(held.wholeFiles === 0 && held.wholeBytes === 0 && series.cachedSteps().length === 6 && same,
    `바이트 범위를 무시하는 서버: 6장면을 읽은 뒤 헤더 표가 붙잡은 파일 전체 ${held.wholeFiles}개 · ${held.wholeBytes} B (고치기 전: 장면마다 1개) · 값은 바이트 범위로 읽은 것과 비트까지 같음`);
  ok(vtuGets(st) === 6 && st.vtuHeads === 6, `바이트 범위를 무시하는 서버: 위상 읽기와 첫 장면 값은 같은 파일 전체를 함께 씀 — .vtu GET ${vtuGets(st)}번 · .vtu HEAD ${st.vtuHeads}번 (장면마다 1번)`);
  // 같은 시점에 배열을 더하면 파일을 다시 연다 (그런 서버는 어차피 전체를 다시 받는다 — 들고 있지 않은 값)
  st.gets.length = 0; st.vtuHeads = 0;
  series.useArrays(['velocity', 'pressure']);
  await series.step(scan.steps[2].n);
  const held2 = await headsHeld(series);
  ok(st.vtuHeads === 1 && vtuGets(st) === 1 && held2.wholeFiles === 0, `바이트 범위를 무시하는 서버: 같은 장면에 pressure 를 더하면 파일을 다시 열고(.vtu HEAD ${st.vtuHeads}) 한 번 받은 뒤(.vtu GET ${vtuGets(st)}) 다시 놓음`);
}
{
  // 바이트 범위를 받는 서버: 헤더 표는 장면마다 그대로 남아, 같은 장면에 배열을 더할 때 HEAD · 헤더를 다시 받지 않는다
  const files = synFiles();
  const st = fakeServer(memStore(files), 'range', 0);
  const scan = await scanResultFolder(new HttpFolder('http://t/data', 'http://t/list'));
  const series = new TimeSeries(scan, { arrays: ['velocity'], solidArray: solidArrayOf(scan.blocks) });
  await series.init();
  for (const s of scan.steps) await series.step(s.n);
  const held = await headsHeld(series);
  st.gets.length = 0; st.vtuHeads = 0;
  series.useArrays(['velocity', 'pressure']);
  await series.step(scan.steps[2].n);
  ok(held.heads === 6 && held.wholeFiles === 0 && st.vtuHeads === 0 && vtuGets(st) === 1,
    `바이트 범위를 받는 서버: 헤더 ${held.heads}개를 들고 있음 · pressure 를 더할 때 .vtu HEAD ${st.vtuHeads} · .vtu GET ${vtuGets(st)}(배열만)`);
}

// 취소가 뒤에 남는 요청까지 끊음 (검증 반영 2026-11-06 저녁): 전 시점 범위의 블록 파일 열기(HEAD) · .vtm 읽기, 닫은 시간축(dispose)의 읽던 배열.
// 고치기 전에는 signal 이 넘어가지 않아, 끊긴 화면 뒤에서 그 요청이 멈춤(5 초)마다 16번(약 2 분 10 초)까지 다시 나갔다
/**
 * 가짜 HTTP 서버(바이트 범위를 받음). hang(rel, method, range) 가 참인 요청은 답하지 않고 기다린다 — 그 요청의 signal 이 끊기면 그 시각을 적는다.
 * sent = 받은 요청 모두
 */
function hangServer(store, hang) {
  const st = { sent: [], hung: [] };
  globalThis.fetch = async (url, init = {}) => {
    const u = String(url);
    const method = init.method ?? 'GET';
    const range = init.headers?.Range ?? null;
    if (u.startsWith('http://t/list')) {
      const ents = await store.list(decodeURIComponent(u.slice('http://t/list'.length).replace(/^\/+/, '')));
      return ents ? new Response(JSON.stringify(ents), { status: 200 }) : new Response('', { status: 404 });
    }
    const rel = decodeURIComponent(u.slice('http://t/data'.length).replace(/^\/+/, ''));
    st.sent.push({ rel, method, range });
    if (hang(rel, method, range)) {
      const rec = { rel, method, range, abortedAt: null };
      st.hung.push(rec);
      return new Promise((_, reject) => init.signal?.addEventListener('abort', () => { rec.abortedAt = performance.now(); reject(init.signal.reason); }, { once: true }));
    }
    const size = await store.size(rel);
    if (size === null) return new Response('', { status: 404 });
    if (method === 'HEAD') return new Response(null, { status: 200, headers: { 'content-length': String(size) } });
    const mm = /bytes=(\d+)-(\d+)/.exec(range ?? '');
    const buf = mm ? await store.read(rel, Number(mm[1]), Number(mm[2])) : await store.read(rel, 0, size - 1);
    const hdr = { 'content-length': String(buf.length), ...(mm ? { 'content-range': `bytes ${mm[1]}-${Number(mm[1]) + buf.length - 1}/${size}` } : {}) };
    return new Response(buf, { status: mm ? 206 : 200, headers: hdr });
  };
  return st;
}
/** [취소] 뒤: 매달린 요청이 곧 끊겼는지 · 그 뒤 새 요청이 없는지 */
async function afterCancel(st, tCancel) {
  const before = st.sent.length;
  await new Promise((r) => setTimeout(r, 80));
  const cut = st.hung.length > 0 && st.hung.every((h) => h.abortedAt !== null && h.abortedAt - tCancel < 60);
  return { cut, more: st.sent.length - before, hung: st.hung.map((h) => `${h.method} ${h.rel}`).join(', ') };
}
for (const [what, hang] of [
  ['블록 파일 열기(HEAD)', (rel, method) => method === 'HEAD' && /syn_[1-5]\.vtu$/.test(rel)],
  ['.vtm 읽기', (rel) => /syn_[1-5]\.vtm$/.test(rel)],
]) {
  const files = synFiles();
  let hold = false; // 위상 · 첫 장면은 정상으로 읽고, 전 시점 범위 때만 매단다
  const st = hangServer(memStore(files), (...a) => hold && hang(...a));
  const scan = await scanResultFolder(new HttpFolder('http://t/data', 'http://t/list'));
  const series = new TimeSeries(scan, { arrays: ['pressure'], solidArray: solidArrayOf(scan.blocks) });
  await series.init();
  hold = true;
  const ctrl = new AbortController();
  const t0 = performance.now();
  const scanning = series.scanRange({ array: 'pressure', mapping: 'magnitude', signal: ctrl.signal, concurrency: 2 });
  await new Promise((r) => setTimeout(r, 30));
  const tCancel = performance.now();
  ctrl.abort();
  const r = await scanning;
  const done = performance.now() - tCancel;
  const a = await afterCancel(st, tCancel);
  ok(r.aborted && done < 200 && a.cut && a.more === 0,
    `전 시점 범위 [취소]: ${what}에서 매달린 요청을 바로 끊음 (${a.hung}) · 끝남 ${done.toFixed(0)} ms 뒤 · 그 뒤 새 요청 ${a.more}번 (${(tCancel - t0).toFixed(0)} ms 에 취소)`);
}
{
  // 다른 데이터를 열어 닫은 시간축(dispose): 읽던 배열 요청을 끊고 '닫은 시간축입니다.' 로 끝남 (같은 블록의 남은 배열을 끝까지 받지 않음)
  const files = synFiles();
  const st = hangServer(memStore(files), (rel, method, range) => rel.endsWith('syn_3.vtu') && method === 'GET' && !!range && !range.startsWith('bytes=0-'));
  const scan = await scanResultFolder(new HttpFolder('http://t/data', 'http://t/list'));
  const series = new TimeSeries(scan, { arrays: ['pressure', 'velocity'], solidArray: solidArrayOf(scan.blocks) });
  await series.init();
  const reading = series.step(scan.steps[3].n).then(() => '끝남', (e) => e.message);
  await new Promise((r) => setTimeout(r, 30));
  const tCancel = performance.now();
  series.dispose();
  const msg = await reading;
  const done = performance.now() - tCancel;
  const a = await afterCancel(st, tCancel);
  ok(msg === '닫은 시간축입니다.' && done < 200 && a.cut && a.more === 0,
    `닫은 시간축: 읽던 배열 요청을 바로 끊음 (${a.hung}) · '${msg}' ${done.toFixed(0)} ms 뒤 · 그 뒤 새 요청 ${a.more}번`);
}
if (await have(JOB_MP)) {
  const st = fakeServer(diskStore(path.join(JOBS, JOB_MP)), 'range');
  const scan = await scanResultFolder(new HttpFolder('http://t/data', 'http://t/list'));
  const series = new TimeSeries(scan, { arrays: displayableArrays(scan.blocks), solidArray: solidArrayOf(scan.blocks) });
  await series.init();
  series.setArrays(displayableArrays(scan.blocks));
  st.vtuBytes = 0; st.gets.length = 0;
  const r = await series.scanRange({ array: 'velocity', mapping: 'magnitude' });
  ok(r.used === 4 && r.max === f32(0.040996734) && !r.wholeFiles, `HTTP(바이트 범위): 다상 velocity 크기 ${r.min} ~ ${r.max}`);
  ok(st.vtuBytes === 4 * (65536 + 8 + 1737600), `HTTP 로 받은 .vtu 바이트도 시점마다 헤더 + 8 + 배열뿐 (${st.vtuBytes})`);
}
if (await have(JOB_CD)) {
  // 첫 일꾼이 파일에서 읽는 첫 시점을 끝낼 때까지 다른 일꾼은 기다린다(timeSeries.ts scanRange). 그래서 바이트 범위를 무시하는 서버면
  // 처음부터 끝까지 .vtu GET 이 하나씩만 나간다. 블록 목록(.vtm)은 미리 읽어 두고 .vtu 응답을 40 ms 늦춘다(겹치면 드러나게)
  const st = fakeServer(diskStore(path.join(JOBS, JOB_CD)), 'ignore', 40);
  const scan = await scanResultFolder(new HttpFolder('http://t/data', 'http://t/list'));
  const series = new TimeSeries(scan, { arrays: displayableArrays(scan.blocks), solidArray: solidArrayOf(scan.blocks) });
  await series.init();
  for (const s of scan.steps) await series.step(s.n); // 시점마다 블록 목록(.vtm)을 읽어 둔다
  series.setArrays(displayableArrays(scan.blocks));    // 값 캐시만 비움 (블록 목록은 남음)
  st.gets.length = 0;
  const r = await series.scanRange({ array: 'pressure', mapping: 'magnitude' });
  const vtuGets = st.gets.filter((g) => g.rel.endsWith('.vtu')).sort((a, b) => a.t0 - b.t0);
  ok(r.used === 5 && r.wholeFiles && r.min === f32(-0.0056507867) && r.max === 101325, `바이트 범위를 무시하는 서버: 결과는 같고 wholeFiles 표시 (${r.min} ~ ${r.max})`);
  ok(vtuGets.length === 5, `파일마다 한 번만 받음 (.vtu GET ${vtuGets.length}번 — 배열마다 다시 받지 않음)`);
  ok(vtuGets.every((g, i) => i === 0 || g.t0 >= vtuGets[i - 1].t1), `처음부터 한 번에 한 시점 (.vtu GET ${vtuGets.length}개가 하나도 겹치지 않음 — 파일 전체가 여럿 메모리에 오르지 않음)`);
}
globalThis.fetch = realFetch;

// ---------- 4. (--big) 유체-입자 51장면 ----------
if (BIG && await have(JOB_FD)) {
  const stats = newStats();
  const { series } = await openJob(JOB_FD, stats);
  // 읽은 바이트 = 51 × (헤더 64 KB + 길이 머리 8 B + 셀 49,400 × 성분 × 8 B), 읽기 = 51 × 2번 (헤더 · 길이 머리와 배열 한 번 — 다른 배열 자리를 읽지 않음)
  for (const [array, mapping, lo, hi, bytes] of [['velocity', 'magnitude', 0, 1.9150196, 63808344], ['pressure', 'magnitude', -3656.574, 17758.887, 23497944]]) {
    resetStats(stats);
    const t0 = performance.now();
    const r = await series.scanRange({ array, mapping });
    const ms = performance.now() - t0;
    ok(r.used === 51 && r.min === f32(lo) && r.max === f32(hi), `유체-입자 ${array} ${mapping}: ${r.min} ~ ${r.max} · ${ms.toFixed(0)} ms (동시 ${stats.maxInFlight})`, `기대 ${f32(lo)} ~ ${f32(hi)}`);
    ok(stats.vtuBytes === bytes && stats.vtuReads.length === 102, `유체-입자 ${array}: 읽은 .vtu ${stats.vtuBytes} B (기대 ${bytes} = 51 × (65,536 + 8 + 49,400 × ${array === 'velocity' ? 3 : 1} × 8)) · 읽기 ${stats.vtuReads.length}번 (기대 102)`);
    if (array === 'velocity') {
      const firstMoving = r.steps.find((s) => s.max > 0);
      ok(r.steps[0].min === 0 && r.steps[0].max === 0 && firstMoving?.n === r.steps[1].n, `0번은 모두 0, 값이 처음 퍼지는 장면은 1번 (n=${firstMoving?.n})`);
    }
  }
  const wn = await series.scanRange({ array: 'wall_normal', mapping: 'magnitude' }).catch((e) => ({ err: String(e) }));
  if (!wn.err) {
    const out = scanOutcome(wn, (n) => `저장 ${n}`);
    ok(wn.used === 51 && !out.apply && out.range === null, `wall_normal 크기 ${wn.min} ~ ${wn.max} · 모든 시점에서 같음 → 적용하지 않음 (${out.note})`);
  } else ok(false, `wall_normal 읽기 실패 ${wn.err}`);
}

console.log(fail ? `\n실패 ${fail} · 통과 ${pass}` : `\n모두 통과 (통과 ${pass}${skipped ? ` · 건너뜀 ${skipped}묶음` : ''})`);
process.exit(fail ? 1 : pass === 0 ? 2 : 0); // 하나도 못 돌렸으면(배포 결과 없음) 통과로 치지 않는다

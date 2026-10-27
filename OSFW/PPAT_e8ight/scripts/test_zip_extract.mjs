#!/usr/bin/env node
// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   test_zip_extract.mjs

src/data/zipExtract.ts의 Node 22 시험. TS를 바로 못 돌리므로 esbuild(vite가 깔아 둔 것)로 ES 모듈 하나로 묶어
임시 폴더에 내보낸 뒤 불러 쓴다(fflate도 함께 묶는다).

시험 ZIP은 미리 만들어 두지 않는다. E2E 결과 폴더(03_concentration_diffusion)의 네 파일(video.json, run.log,
video/video_9.vtm, video/bin/LEVEL_00/video_9.vtu)을 fflate로 '03_concentration_diffusion/...' 경로로 묶어 임시 파일로 쓴다.
두 형태를 만든다: zipSync(크기가 로컬 머리말에 있음)와 스트리밍 Zip(크기 대신 data descriptor — 엔진 API처럼 묶으면서
보내는 형태). 그 ZIP을 extractZip + 파일 sink로 풀어 원본과 바이트 비교하고, unzipToMemory로 풀어 MemoryFolder.list/file로
읽히는지 본다. 그 밖에 건너뛰기, '..' 거부, 역슬래시, 상한, 중단, Blob 입력, 손상(CRC)·잘린 ZIP, 압축 자료 속 PK 서명,
손으로 만든 ZIP64, directoryHandleSink(가짜 폴더 핸들), 작은 항목 수천 개일 때 읽는 양, 값이 전부 0인 큰 항목(압축비 약
1000:1)의 쓰기 조각 크기·메모리 최고점, 이름 인코딩(UTF-8 깃발 없는 CP949), 항목 목록 순서가 실제 위치와 다른 ZIP을 확인한다.

실행: node scripts/test_zip_extract.mjs <원본 폴더>
      원본 폴더: 1세부 해석엔진 E2E 실행 결과의 03_concentration_diffusion 폴더(꼭 적는다)
      ZIP_TEST_ZERO_MB=1024 node scripts/test_zip_extract.mjs   → [18]의 0 바이트 항목 크기(MB, 기본 256)
      node --expose-gc scripts/test_zip_extract.mjs             → [18]의 메모리 최고점을 GC 뒤 기준으로 잰다
*/
/******************************************************************************/

import { build } from 'esbuild';
import { Unzip, UnzipInflate, Zip, ZipDeflate, ZipPassThrough, strToU8, zipSync } from 'fflate';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = process.argv[2];
if (!SRC_DIR) {
  console.error('사용: node scripts/test_zip_extract.mjs <E2E 결과의 03_concentration_diffusion 폴더>');
  process.exit(2);
}
const JOB = '03_concentration_diffusion';
const FILES = ['video.json', 'run.log', 'video/video_9.vtm', 'video/bin/LEVEL_00/video_9.vtu'];

let failed = 0;
const check = (ok, what) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${what}`); if (!ok) failed++; };
const ms = (t) => `${t.toFixed(1)} ms`;
const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
const msgOf = (e) => (e instanceof Error ? e.message : String(e));
const rejects = (p) => p.then(() => null, (e) => e); // 거부되면 그 오류, 아니면 null

// --- 시험 보조 ---------------------------------------------------------------

/** 파일 하나를 ByteSource(source.ts 계약)로. 필요한 구간만 읽는다 */
class NodeFileSource {
  constructor(file) { this.file = file; this.name = path.basename(file); this.handle = null; this.bytes = -1; }
  async size() { if (this.bytes < 0) this.bytes = (await fs.stat(this.file)).size; return this.bytes; }
  async read(start, end) {
    if (end < start) return new ArrayBuffer(0);
    this.handle ??= await fs.open(this.file, 'r');
    const n = Math.max(0, Math.min(end + 1, await this.size()) - start);
    const buf = new Uint8Array(n);
    const { bytesRead } = await this.handle.read(buf, 0, n, start);
    return bytesRead === n ? buf.buffer : buf.buffer.slice(0, bytesRead);
  }
  async close() { await this.handle?.close(); this.handle = null; }
}

/** 폴더에 쓰는 간이 sink */
function fsSink(dir) {
  return {
    async file(rel) {
      const full = path.join(dir, ...rel.split('/'));
      await fs.mkdir(path.dirname(full), { recursive: true });
      const fh = await fs.open(full, 'w');
      return {
        write: async (chunk) => { await fh.write(chunk); },
        close: () => fh.close(),
        abort: async () => { await fh.close(); await fs.rm(full, { force: true }); },
      };
    },
  };
}

/** File System Access API 폴더 핸들 흉내 (directoryHandleSink 시험용). 쓴 파일은 files(경로 → Buffer)에, 폴더 생성 횟수는 counts에 */
function fakeDirectoryHandle(files, counts, prefix = '') {
  return {
    kind: 'directory',
    name: prefix ? path.posix.basename(prefix) : 'root',
    async getDirectoryHandle(name, opts) {
      if (!opts?.create) throw new Error(`create 없이 폴더를 열었다: ${name}`);
      counts.set(name, (counts.get(name) ?? 0) + 1);
      return fakeDirectoryHandle(files, counts, `${prefix}${name}/`);
    },
    async getFileHandle(name, opts) {
      if (!opts?.create) throw new Error(`create 없이 파일을 열었다: ${name}`);
      const key = prefix + name;
      return {
        kind: 'file',
        name,
        async createWritable() {
          const parts = [];
          return {
            async write(chunk) { parts.push(Buffer.from(chunk)); },
            async close() { files.set(key, Buffer.concat(parts)); },
            async abort() { parts.length = 0; },
          };
        },
      };
    },
  };
}

async function loadModule(work) {
  const outfile = path.join(work, 'zipExtract.bundle.mjs');
  await build({
    entryPoints: [path.join(ROOT, 'src', 'data', 'zipExtract.ts')],
    bundle: true, format: 'esm', platform: 'node', target: 'node22', outfile, logLevel: 'warning',
  });
  return import(pathToFileURL(outfile).href);
}

/** zipSync: 크기가 로컬 머리말에 있는 보통 ZIP. 폴더 항목 하나를 일부러 넣는다 */
function buildSyncZip(originals) {
  const tree = {};
  for (const [rel, bytes] of originals) tree[`${JOB}/${rel}`] = bytes;
  tree[`${JOB}/video/`] = new Uint8Array(0);
  return zipSync(tree, { level: 1 });
}

/** 스트리밍 Zip: 크기를 모르고 쓰므로 로컬 머리말에 크기가 없고 자료 뒤에 data descriptor가 붙는다 (엔진 API의 ZIP과 같은 형태) */
function buildStreamZip(files, { stored = false } = {}) {
  const chunks = [];
  const zip = new Zip((err, chunk) => { if (err) throw err; chunks.push(chunk); });
  for (const [name, bytes] of files) {
    const f = stored ? new ZipPassThrough(name) : new ZipDeflate(name, { level: 1 });
    zip.add(f);
    const step = 256 * 1024;
    for (let i = 0; i < bytes.length; i += step) f.push(bytes.subarray(i, Math.min(i + step, bytes.length)), false);
    f.push(new Uint8Array(0), true);
  }
  zip.end();
  return Buffer.concat(chunks);
}

/** 손으로 만든 ZIP64 ZIP: 저장 항목 하나. central directory 값은 0xFFFFFFFF + ZIP64 추가 필드, ZIP64 끝 레코드 + locator */
function buildZip64Zip(crc32) {
  const name = strToU8('z64/hello.txt');
  const data = strToU8('hello from zip64');
  const crc = crc32(0, data);
  const dv = (n) => new DataView(new ArrayBuffer(n));
  const local = dv(30);
  local.setUint32(0, 0x04034b50, true); local.setUint16(4, 45, true);
  local.setUint32(14, crc, true); local.setUint32(18, data.length, true); local.setUint32(22, data.length, true);
  local.setUint16(26, name.length, true);
  const cdOffset = 30 + name.length + data.length;
  const extra = dv(28);
  extra.setUint16(0, 1, true); extra.setUint16(2, 24, true);
  extra.setBigUint64(4, BigInt(data.length), true); extra.setBigUint64(12, BigInt(data.length), true); extra.setBigUint64(20, 0n, true);
  const central = dv(46);
  central.setUint32(0, 0x02014b50, true); central.setUint16(4, 45, true); central.setUint16(6, 45, true);
  central.setUint32(16, crc, true); central.setUint32(20, 0xffffffff, true); central.setUint32(24, 0xffffffff, true);
  central.setUint16(28, name.length, true); central.setUint16(30, 28, true); central.setUint32(42, 0xffffffff, true);
  const cdSize = 46 + name.length + 28;
  const eocd64 = dv(56);
  eocd64.setUint32(0, 0x06064b50, true); eocd64.setBigUint64(4, 44n, true); eocd64.setUint16(12, 45, true); eocd64.setUint16(14, 45, true);
  eocd64.setBigUint64(24, 1n, true); eocd64.setBigUint64(32, 1n, true);
  eocd64.setBigUint64(40, BigInt(cdSize), true); eocd64.setBigUint64(48, BigInt(cdOffset), true);
  const locator = dv(20);
  locator.setUint32(0, 0x07064b50, true); locator.setBigUint64(8, BigInt(cdOffset + cdSize), true); locator.setUint32(16, 1, true);
  const eocd = dv(22);
  eocd.setUint32(0, 0x06054b50, true); eocd.setUint16(8, 0xffff, true); eocd.setUint16(10, 0xffff, true);
  eocd.setUint32(12, 0xffffffff, true); eocd.setUint32(16, 0xffffffff, true);
  const parts = [local, name, data, central, name, extra, eocd64, locator, eocd];
  return { bytes: Buffer.concat(parts.map((v) => Buffer.from(v instanceof DataView ? v.buffer : v))), data };
}

/** 메모리 버퍼를 ByteSource로. read 횟수와 읽은 바이트를 센다 (읽는 양 시험용) */
class CountingSource {
  constructor(bytes, name = 'count.zip') { this.bytes = bytes; this.name = name; this.reads = 0; this.readBytes = 0; }
  async size() { return this.bytes.length; }
  async read(start, end) {
    if (end < start) return new ArrayBuffer(0);
    const slice = this.bytes.subarray(start, Math.min(end + 1, this.bytes.length));
    this.reads++;
    this.readBytes += slice.length;
    return slice.buffer.slice(slice.byteOffset, slice.byteOffset + slice.length);
  }
}

/** 쓰기 횟수·최대 조각·합만 세는 sink. 조각 내용은 check로 확인(선택) */
function countingSink(onChunk) {
  const stat = { writes: 0, maxWrite: 0, total: 0 };
  return {
    stat,
    async file() {
      return {
        async write(chunk) { stat.writes++; stat.total += chunk.length; if (chunk.length > stat.maxWrite) stat.maxWrite = chunk.length; onChunk?.(chunk); },
        async close() {},
        async abort() {},
      };
    },
  };
}

/** 0으로 가득한 큰 항목 하나를 스트리밍 Zip(level 1)으로 임시 파일에 쓴다. 압축비 약 1000:1 → 1 GB가 약 1 MB */
async function writeZerosZip(file, mb) {
  const fh = await fs.open(file, 'w');
  let pending = Promise.resolve(); // 쓰기는 순서대로 이어 붙인다 (같은 FileHandle에 동시에 write하지 않게)
  const zip = new Zip((err, chunk) => { if (err) throw err; const copy = Buffer.from(chunk); pending = pending.then(() => fh.write(copy)).then(() => undefined); });
  const z = new ZipDeflate('big/zeros.bin', { level: 1 });
  zip.add(z);
  const block = new Uint8Array(1024 * 1024);
  for (let m = 0; m < mb; m++) z.push(block, false);
  z.push(new Uint8Array(0), true);
  zip.end();
  await pending;
  await fh.close();
}

/**
 * 손으로 만든 저장(무압축) ZIP. items: [{ name: Uint8Array(이름 바이트), data, flags }]. 로컬 머리말·자료는 적은 순서로,
 * 항목 목록(central directory)은 centralOrder(기본 같은 순서)대로 적는다. 이름 인코딩·목록 순서 시험용
 */
function buildStoredZip(items, crc32, { centralOrder } = {}) {
  const le16 = (n) => { const b = Buffer.alloc(2); b.writeUInt16LE(n); return b; };
  const le32 = (n) => { const b = Buffer.alloc(4); b.writeUInt32LE(n >>> 0); return b; };
  const locals = [];
  const offsets = [];
  let pos = 0;
  for (const it of items) {
    offsets.push(pos);
    const crc = crc32(0, it.data);
    const local = Buffer.concat([le32(0x04034b50), le16(20), le16(it.flags ?? 0), le16(0), le32(0), le32(crc), le32(it.data.length), le32(it.data.length), le16(it.name.length), le16(0), Buffer.from(it.name), Buffer.from(it.data)]);
    locals.push(local);
    pos += local.length;
  }
  const order = centralOrder ?? items.map((_, i) => i);
  const centrals = order.map((i) => {
    const it = items[i];
    return Buffer.concat([le32(0x02014b50), le16(20), le16(20), le16(it.flags ?? 0), le16(0), le32(0), le32(crc32(0, it.data)), le32(it.data.length), le32(it.data.length), le16(it.name.length), le16(0), le16(0), le16(0), le16(0), le32(0), le32(offsets[i]), Buffer.from(it.name)]);
  });
  const cd = Buffer.concat(centrals);
  const eocd = Buffer.concat([le32(0x06054b50), le16(0), le16(0), le16(items.length), le16(items.length), le32(cd.length), le32(pos), le16(0)]);
  return Buffer.concat([...locals, cd, eocd]);
}

const mb = (n) => `${(n / (1024 * 1024)).toFixed(1)} MB`;

async function compareDir(outDir, originals, label) {
  for (const [rel, bytes] of originals) {
    const got = await fs.readFile(path.join(outDir, JOB, ...rel.split('/'))).catch(() => null);
    check(got !== null && got.equals(bytes), `${label} ${rel} 바이트 일치 (${kb(bytes.length)})`);
  }
}

async function readAll(src) {
  return Buffer.from(await src.read(0, (await src.size()) - 1));
}

// --- 본 시험 ---------------------------------------------------------------

async function main() {
  const work = await fs.mkdtemp(path.join(os.tmpdir(), 'zip-extract-test-'));
  try {
    const originals = [];
    for (const rel of FILES) originals.push([rel, await fs.readFile(path.join(SRC_DIR, ...rel.split('/')))]);
    console.log(`원본: ${SRC_DIR}\n      ${originals.map(([r, b]) => `${r} ${kb(b.length)}`).join(', ')}`);

    let t = performance.now();
    const m = await loadModule(work);
    console.log(`번들(esbuild): ${ms(performance.now() - t)}`);
    const { extractZip, unzipToMemory, memorySink, directoryHandleSink, listZipEntries, normalizeEntryPath, crc32 } = m;

    const syncBytes = buildSyncZip(originals);
    const streamBytes = buildStreamZip(originals.map(([rel, b]) => [`${JOB}/${rel}`, b]));
    const zipA = path.join(work, 'a_sync.zip');
    const zipB = path.join(work, 'b_stream.zip');
    await fs.writeFile(zipA, syncBytes);
    await fs.writeFile(zipB, streamBytes);
    console.log(`ZIP: zipSync ${kb(syncBytes.length)}, 스트리밍 Zip(data descriptor) ${kb(streamBytes.length)}`);

    // [1] zipSync ZIP → 파일 sink (기본 조각 1 MB)
    {
      const src = new NodeFileSource(zipA);
      const out = path.join(work, 'out1');
      const progress = [];
      t = performance.now();
      const r = await extractZip(src, fsSink(out), { onProgress: (p) => progress.push({ ...p }) });
      const dt = performance.now() - t;
      await src.close();
      console.log(`[1] extractZip(zipSync → 폴더): ${ms(dt)}, entries=${r.entries}, bytes=${r.bytes}, topLevel=${JSON.stringify(r.topLevel)}`);
      check(r.entries === FILES.length, '[1] 파일 항목 4개 (폴더 항목은 건너뜀)');
      check(r.topLevel.length === 1 && r.topLevel[0] === JOB, '[1] topLevel = [job_id]');
      check(r.bytes === syncBytes.length, '[1] bytes = ZIP 크기');
      const last = progress.at(-1);
      check(progress.length > 0 && last.bytes === syncBytes.length && last.totalBytes === syncBytes.length && last.entries === FILES.length,
        `[1] 진행률 마지막 값 (${progress.length}회 보고)`);
      const videoIsDir = await fs.stat(path.join(out, JOB, 'video')).then((s) => s.isDirectory()).catch(() => false);
      check(videoIsDir, '[1] video는 폴더로 생김');
      await compareDir(out, originals, '[1]');
    }

    // [2] 스트리밍 Zip(data descriptor) → 파일 sink, 조각 64 KB (머리말·자료가 조각 경계에 걸치게)
    {
      const src = new NodeFileSource(zipB);
      const out = path.join(work, 'out2');
      let reports = 0;
      t = performance.now();
      const r = await extractZip(src, fsSink(out), { chunkBytes: 64 * 1024, onProgress: () => reports++ });
      const dt = performance.now() - t;
      await src.close();
      console.log(`[2] extractZip(스트리밍 Zip → 폴더, 64 KB 조각): ${ms(dt)}, entries=${r.entries}, 보고 ${reports}회`);
      check(r.entries === FILES.length && r.topLevel[0] === JOB, '[2] 항목 4개, topLevel');
      await compareDir(out, originals, '[2]');
    }

    // [3] unzipToMemory → MemoryFolder
    {
      const src = new NodeFileSource(zipA);
      t = performance.now();
      const folder = await unzipToMemory(src);
      const dt = performance.now() - t;
      await src.close();
      console.log(`[3] unzipToMemory: ${ms(dt)}, 폴더 이름 '${folder.name}'`);
      const top = await folder.list('');
      check(top.length === 1 && top[0].name === JOB && top[0].kind === 'dir', '[3] list(""): job 폴더 하나');
      const names = (await folder.list(JOB)).map((e) => `${e.name}:${e.kind}`).sort();
      check(JSON.stringify(names) === JSON.stringify(['run.log:file', 'video.json:file', 'video:dir']), `[3] list(job) = ${names.join(' ')}`);
      const vtm = await folder.file(`${JOB}/video/video_9.vtm`);
      const text = vtm ? new TextDecoder().decode(await readAll(vtm)) : '';
      check(text.includes('<VTKFile'), '[3] vtm 텍스트 읽힘');
      const vtu = await folder.sub(`${JOB}/video`).file('bin/LEVEL_00/video_9.vtu');
      check(vtu !== null && (await readAll(vtu)).equals(originals[3][1]), '[3] sub().file() vtu 바이트 일치');
      check((await folder.file(`${JOB}/없는파일`)) === null, '[3] 없는 파일은 null');
    }

    // [4] skip
    {
      const out = path.join(work, 'out4');
      const r = await extractZip(new Blob([syncBytes]), fsSink(out), { skip: (p) => p.endsWith('run.log') });
      const exists = await fs.stat(path.join(out, JOB, 'run.log')).then(() => true, () => false);
      check(r.entries === 3 && !exists, '[4] skip: run.log 안 씀, 항목 3개');
      await compareDir(out, originals.filter(([rel]) => rel !== 'run.log'), '[4]');
    }

    // [5] '..' 거부
    {
      const bad = zipSync({ [`${JOB}/../evil.txt`]: strToU8('x'), 'ok.txt': strToU8('y') }, { level: 1 });
      const sink = memorySink();
      const err = await rejects(extractZip(new Blob([bad]), sink));
      check(err !== null && /\.\./.test(msgOf(err)), `[5] '..' 경로 거부: ${err ? msgOf(err) : '(거부 안 함)'}`);
      check(sink.files.size === 0, '[5] 거부한 ZIP은 아무것도 안 씀');
    }

    // [6] 역슬래시 → 슬래시, 앞의 '/' 제거
    {
      const sink = memorySink();
      const r = await extractZip(new Blob([zipSync({ 'a\\b\\c.txt': strToU8('hello'), '/d.txt': strToU8('d') }, { level: 1 })]), sink);
      check(sink.files.has('a/b/c.txt') && sink.files.has('d.txt') && r.topLevel.join(',') === 'a,d.txt', `[6] 경로 정규화: ${[...sink.files.keys()].join(', ')}`);
    }

    // [7] 메모리 상한
    {
      const e1 = await rejects(unzipToMemory(new Blob([syncBytes]), { maxBytes: 1000 }));
      check(e1 !== null && msgOf(e1).includes('폴더로 열어'), `[7] ZIP 크기 > 상한: ${e1 ? msgOf(e1) : '(거부 안 함)'}`);
      const e2 = await rejects(unzipToMemory(new Blob([syncBytes]), { maxBytes: syncBytes.length + 1 }));
      check(e2 !== null && msgOf(e2).includes('폴더로 열어'), `[7] 푼 크기 > 상한: ${e2 ? msgOf(e2) : '(거부 안 함)'}`);
    }

    // [8] 중단
    {
      const pre = new AbortController();
      pre.abort();
      const e1 = await rejects(extractZip(new Blob([syncBytes]), memorySink(), { signal: pre.signal }));
      check(e1 !== null && e1.name === 'AbortError', `[8] 미리 중단: ${e1 ? e1.name : '(거부 안 함)'}`);
      const mid = new AbortController();
      const out = path.join(work, 'out8');
      const e2 = await rejects(extractZip(new Blob([syncBytes]), fsSink(out), { signal: mid.signal, chunkBytes: 64 * 1024, onProgress: (p) => { if (p.current.endsWith('run.log') && p.bytes > 0) mid.abort(); } }));
      const partial = await fs.stat(path.join(out, JOB, 'run.log')).then(() => true, () => false);
      check(e2 !== null && e2.name === 'AbortError' && !partial, `[8] 도중 중단: ${e2 ? e2.name : '(거부 안 함)'}, 쓰다 만 run.log 버림=${!partial}`);
    }

    // [9] Blob 입력
    {
      const sink = memorySink();
      const r = await extractZip(new Blob([streamBytes]), sink);
      check(r.entries === 4 && sink.files.size === 4 && Buffer.from(sink.files.get(`${JOB}/run.log`)).equals(originals[1][1]), '[9] Blob 입력 (스트리밍 ZIP) → 메모리');
    }

    // [10] directoryHandleSink (가짜 폴더 핸들)
    {
      const files = new Map();
      const counts = new Map();
      const r = await extractZip(new Blob([syncBytes]), directoryHandleSink(fakeDirectoryHandle(files, counts)));
      const allEqual = originals.every(([rel, b]) => files.get(`${JOB}/${rel}`)?.equals(b));
      check(r.entries === 4 && allEqual, '[10] directoryHandleSink: 4개 파일 바이트 일치');
      const once = [JOB, 'video', 'bin', 'LEVEL_00'].every((d) => counts.get(d) === 1);
      check(once && counts.size === 4, `[10] 폴더는 한 번씩만 만듦: ${[...counts].map(([k, v]) => `${k}=${v}`).join(' ')}`);
    }

    // [11] normalizeEntryPath
    {
      check(normalizeEntryPath('./a//b\\c') === 'a/b/c' && normalizeEntryPath('/') === '' && normalizeEntryPath('x/') === 'x', '[11] normalizeEntryPath');
      let threw = false;
      try { normalizeEntryPath('a/../b'); } catch { threw = true; }
      check(threw, "[11] normalizeEntryPath('a/../b') 던짐");
    }

    // [12] 손상된 ZIP(압축 자료 한 바이트 바꿈) → CRC 또는 풀기 오류
    {
      const entries = await listZipEntries(new Blob([syncBytes]));
      const log = entries.find((e) => e.name.endsWith('run.log'));
      const corrupt = Buffer.from(syncBytes);
      const dataStart = log.offset + 30 + corrupt.readUInt16LE(log.offset + 26) + corrupt.readUInt16LE(log.offset + 28);
      corrupt[dataStart + Math.floor(log.csize / 2)] ^= 0xff;
      const err = await rejects(extractZip(new Blob([corrupt]), memorySink()));
      check(err !== null && /(CRC|푸는 중 오류)/.test(msgOf(err)), `[12] 손상 감지: ${err ? msgOf(err) : '(거부 안 함)'}`);
    }

    // [13] 잘린 ZIP(끝 100바이트 없음) → 항목 목록 오류
    {
      const err = await rejects(extractZip(new Blob([syncBytes.subarray(0, syncBytes.length - 100)]), memorySink()));
      check(err !== null && msgOf(err).includes('central directory'), `[13] 잘린 ZIP: ${err ? msgOf(err) : '(거부 안 함)'}`);
    }

    // [14] 자료 안에 PK 서명이 있는 data descriptor ZIP: 작은 ZIP 파일을 저장(무압축)으로 넣은 스트리밍 ZIP
    {
      const inner = zipSync({ 'inner.txt': strToU8('inner') }, { level: 1 }); // 'PK\x03\x04'로 시작
      const outer = buildStreamZip([['nested.zip', inner], ['after.txt', strToU8('after')]], { stored: true });
      const sink = memorySink();
      const r = await extractZip(new Blob([outer]), sink);
      const ok = r.entries === 2 && Buffer.from(sink.files.get('nested.zip') ?? []).equals(inner) && Buffer.from(sink.files.get('after.txt') ?? []).toString() === 'after';
      check(ok, '[14] 자료 속 PK 서명이 있는 data descriptor ZIP을 바르게 풂');
      // 참고: 같은 ZIP을 fflate 스트리밍 Unzip으로 풀면 (이 모듈이 Unzip을 쓰지 않는 이유)
      const got = new Map();
      let unzipErr = null;
      try {
        const u = new Unzip((file) => {
          const parts = [];
          file.ondata = (err, d, final) => { if (err) unzipErr ??= err; else { parts.push(d); if (final) got.set(file.name, Buffer.concat(parts)); } };
          file.start();
        });
        u.register(UnzipInflate);
        u.push(outer, true);
      } catch (e) { unzipErr = e; }
      const same = got.size === 2 && Buffer.from(got.get('nested.zip') ?? []).equals(inner);
      console.log(`      참고: fflate 스트리밍 Unzip은 같은 ZIP을 ${same ? '바르게 풂' : `잘못 풂 (얻은 항목: ${[...got.keys()].join(', ') || '없음'}${unzipErr ? `; 오류: ${msgOf(unzipErr)}` : ''})`}`);
    }

    // [15] 손으로 만든 ZIP64
    {
      const { bytes, data } = buildZip64Zip(crc32);
      const list = await listZipEntries(new Blob([bytes]));
      const sink = memorySink();
      const r = await extractZip(new Blob([bytes]), sink);
      const ok = list.length === 1 && list[0].csize === data.length && list[0].offset === 0
        && r.entries === 1 && Buffer.from(sink.files.get('z64/hello.txt') ?? []).equals(data);
      check(ok, `[15] ZIP64(끝 레코드·추가 필드) 읽음: ${list.map((e) => `${e.name} ${e.csize}B@${e.offset}`).join(', ')}`);
    }

    // [16] listZipEntries
    {
      const list = await listZipEntries(new Blob([syncBytes]));
      const dir = list.find((e) => e.isDir);
      const log = list.find((e) => e.name.endsWith('run.log'));
      check(list.length === 5 && dir?.name === `${JOB}/video/` && log?.usize === originals[1][1].length && log?.method === 8,
        `[16] listZipEntries: ${list.length}개, run.log ${log?.csize}→${log?.usize} B`);
    }

    // [17] 작은 항목 수천 개: 항목마다 1 MB씩 읽지 않고 항목 크기만큼만 읽는지 (읽은 바이트 ≤ ZIP 크기 × 2)
    {
      const N = 2000;
      const tree = {};
      for (let i = 0; i < N; i++) tree[`${JOB}/video/video_${i}.vtm`] = strToU8(`<VTKFile type="vtkMultiBlockDataSet"><!-- ${i} --></VTKFile>\n`);
      const bytes = zipSync(tree, { level: 1 });
      const src = new CountingSource(bytes);
      const sink = memorySink();
      t = performance.now();
      const r = await extractZip(src, sink);
      const dt = performance.now() - t;
      console.log(`[17] 작은 항목 ${N}개 (ZIP ${kb(bytes.length)}): ${ms(dt)}, read ${src.reads}회, 읽은 바이트 ${kb(src.readBytes)} (ZIP의 ${(src.readBytes / bytes.length).toFixed(2)}배)`);
      check(r.entries === N && sink.files.size === N && new TextDecoder().decode(sink.files.get(`${JOB}/video/video_${N - 1}.vtm`)).includes(`<!-- ${N - 1} -->`), `[17] ${N}개 모두 풂`);
      check(src.readBytes <= bytes.length * 2, `[17] 읽은 바이트 ≤ ZIP 크기 × 2`);
    }

    // [18] 값이 전부 0인 큰 항목(압축비 약 1000:1): 슬라이스로 넣어 한 번의 쓰기가 '약 1032 × 슬라이스'를 넘지 않는지
    {
      const zeroMB = Number(process.env.ZIP_TEST_ZERO_MB ?? 256);
      const zipZ = path.join(work, 'c_zeros.zip');
      t = performance.now();
      await writeZerosZip(zipZ, zeroMB);
      const zsize = (await fs.stat(zipZ)).size;
      console.log(`[18] 0 바이트 ${zeroMB} MB 항목 ZIP 만들기: ${ms(performance.now() - t)}, ZIP ${kb(zsize)} (압축비 ${(zeroMB * 1024 * 1024 / zsize).toFixed(0)}:1)`);
      for (const sliceKB of [64, 16]) {
        global.gc?.();
        const base = process.memoryUsage().arrayBuffers;
        let peak = base;
        const sample = () => { const a = process.memoryUsage().arrayBuffers; if (a > peak) peak = a; };
        let nonZero = 0;
        const sink = countingSink((chunk) => { for (let i = 0; i < chunk.length; i += 4093) if (chunk[i] !== 0) nonZero++; sample(); });
        const src = new NodeFileSource(zipZ);
        t = performance.now();
        const r = await extractZip(src, sink, { inflateSliceBytes: sliceKB * 1024, onProgress: sample });
        const dt = performance.now() - t;
        await src.close();
        const { writes, maxWrite, total } = sink.stat;
        console.log(`[18] 슬라이스 ${sliceKB} KB: ${ms(dt)}, 쓰기 ${writes}회, 최대 쓰기 ${mb(maxWrite)}, arrayBuffers 최고점 +${mb(peak - base)}${global.gc ? '' : ' (GC 없이 잰 값, 상한)'}`);
        check(r.entries === 1 && total === zeroMB * 1024 * 1024 && nonZero === 0, `[18] 슬라이스 ${sliceKB} KB: ${zeroMB} MB 전부 0으로 풂`);
        check(maxWrite <= 1100 * sliceKB * 1024, `[18] 슬라이스 ${sliceKB} KB: 최대 쓰기 ${mb(maxWrite)} ≤ 1100 × 슬라이스 (${mb(1100 * sliceKB * 1024)})`);
      }
    }

    // [19] 이름 인코딩: UTF-8 깃발(11번) 없이 CP949로 적힌 한글 이름, 깃발 있는 UTF-8 이름, 깃발 없는 UTF-8 이름
    {
      const cp949 = Uint8Array.of(0xc7, 0xd1, 0xb1, 0xdb, 0x2e, 0x74, 0x78, 0x74); // '한글.txt' (EUC-KR/CP949)
      const utf8 = strToU8('유니코드.txt');
      const items = [
        { name: cp949, data: strToU8('cp949'), flags: 0 },
        { name: utf8, data: strToU8('utf8-flag'), flags: 0x800 },
        { name: strToU8('깃발없음.txt'), data: strToU8('utf8-noflag'), flags: 0 },
      ];
      const bytes = buildStoredZip(items, crc32);
      const list = await listZipEntries(new Blob([bytes]));
      const names = list.map((e) => e.name);
      check(names[0] === '한글.txt', `[19] 깃발 없는 CP949 이름 → '${names[0]}'`);
      check(names[1] === '유니코드.txt', `[19] 깃발 있는 UTF-8 이름 → '${names[1]}'`);
      check(names[2] === '깃발없음.txt', `[19] 깃발 없는 UTF-8 이름 → '${names[2]}'`);
      const sink = memorySink();
      const r = await extractZip(new Blob([bytes]), sink);
      check(r.entries === 3 && Buffer.from(sink.files.get('한글.txt') ?? []).toString() === 'cp949', '[19] 풀린 파일 이름도 같음');
    }

    // [20] 항목 목록 순서가 실제 위치 순서와 반대인 ZIP: 둘 다 풀리고 진행률 bytes가 줄지 않는지
    {
      const items = [
        { name: strToU8('first.txt'), data: strToU8('first '.repeat(1000)) },
        { name: strToU8('second.txt'), data: strToU8('second '.repeat(1000)) },
      ];
      const bytes = buildStoredZip(items, crc32, { centralOrder: [1, 0] });
      const list = await listZipEntries(new Blob([bytes]));
      const sink = memorySink();
      const progress = [];
      const r = await extractZip(new Blob([bytes]), sink, { onProgress: (p) => progress.push(p.bytes) });
      const monotonic = progress.every((b, i) => i === 0 || b >= progress[i - 1]);
      check(list[0].name === 'second.txt' && list[0].offset > list[1].offset, `[20] 목록 순서: ${list.map((e) => `${e.name}@${e.offset}`).join(', ')}`);
      check(r.entries === 2 && sink.files.size === 2 && monotonic && progress.at(-1) === bytes.length, `[20] 둘 다 풂, 진행률 ${progress.length}회 보고 중 줄어든 적 없음=${monotonic}`);
    }

    // [21] 큰 .vtu(건너뜀) 사이에 작은 .vtm이 끼어 있을 때: 건너뛰는 항목은 읽지 않고, 작은 항목마다 1 MB씩 미리 읽지도 않는지
    {
      const N = 100;
      const tree = {};
      let s = 7;
      for (let i = 0; i < N; i++) {
        tree[`${JOB}/video/video_${i}.vtm`] = strToU8(`<VTKFile type="vtkMultiBlockDataSet"><!-- ${i} --></VTKFile>\n`);
        const vtu = new Uint32Array(25 * 1024); // 100 KB, xorshift32 난수 → 압축이 안 되는 자료
        for (let k = 0; k < vtu.length; k++) { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; vtu[k] = s >>> 0; }
        tree[`${JOB}/video/bin/LEVEL_00/video_${i}.vtu`] = new Uint8Array(vtu.buffer);
      }
      const bytes = zipSync(tree, { level: 1 });
      const src = new CountingSource(bytes);
      const sink = memorySink();
      const r = await extractZip(src, sink, { skip: (p) => p.endsWith('.vtu') });
      console.log(`[21] .vtm ${N}개 + .vtu ${N}개(건너뜀), ZIP ${mb(bytes.length)}: read ${src.reads}회, 읽은 바이트 ${kb(src.readBytes)} (ZIP의 ${(100 * src.readBytes / bytes.length).toFixed(1)} %)`);
      check(r.entries === N && sink.files.size === N, `[21] .vtm ${N}개만 풂`);
      check(src.readBytes <= bytes.length * 0.05, '[21] 읽은 바이트 ≤ ZIP 크기의 5 % (건너뛴 .vtu는 읽지 않음)');
    }
  } finally {
    await fs.rm(work, { recursive: true, force: true });
  }
  console.log(failed ? `\n실패 ${failed}건` : '\n모두 통과');
  process.exitCode = failed ? 1 : 0;
}

main().catch((e) => { console.error(e); process.exitCode = 1; });

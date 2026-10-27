// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   zipExtract.ts

해석엔진 결과 ZIP을 브라우저에서 푸는 층.
엔진 API(GET /jobs/{job_id}/download)는 입력 JSON·입력 파일·run.log와 결과 폴더를 압축 수준 1(deflate)로 묶으면서 바로
보낸다(integration/README.md 2.2절·4절). 이름은 작업 폴더 기준이라(engine_api/core.py의 relative_to(job_dir)) 맨 위에
<job_id>/ 겹이 없다: '<입력 이름>.json', 'run.log', '<결과폴더>/<title>_<n>.vtm', '<결과폴더>/bin/LEVEL_xx/*.vtu' 등.
항목 크기가 로컬 머리말에 없는 형태(data descriptor)이며 4 GB가 넘으면 ZIP64다.

읽는 방식: ZIP 끝의 항목 목록(central directory)을 먼저 읽어 항목마다 압축 바이트가 어디서 어디까지인지 정확히 안 뒤,
그 구간만 조각(기본 1 MB, 항목이 작으면 항목 크기만큼)으로 읽어 fflate Inflate(스트리밍)로 풀면서 ZipSink에 흘려 쓴다.
전체를 메모리에 올리지 않는다. 읽은 조각은 다시 작은 슬라이스(기본 64 KB)로 나눠 Inflate에 넣는다. deflate는 최대 약
1032:1까지 부풀 수 있어(값이 전부 0인 .vtu 등) 1 MB를 한 번에 넣으면 출력 1 GB가 한꺼번에 메모리에 잡히기 때문이다.
fflate의 스트리밍 Unzip은 쓰지 않는다. 크기가 머리말에 없는 항목에서는 압축 바이트 속을 서명(PK..)으로 훑어 끝을 찾는데
(fflate esm/index.mjs Unzip.push), 수 GB 자료에서는 우연히 같은 4바이트가 나와 깨질 확률이 무시할 수 없기 때문이다.

- extractZip: 핵심. ByteSource만 쓰므로 Node에서도 돈다(scripts/test_zip_extract.mjs). Blob은 브라우저에서 감싼다.
- ZipSink 구현: directoryHandleSink(사용자가 고른 폴더, File System Access API), memorySink(작은 ZIP → MemoryFolder).
- unzipToMemory: 작은 ZIP(기본 256 MB까지)을 MemoryFolder로.
- listZipEntries: 풀지 않고 항목 목록만.
- supportsDirectoryWrite / pickExtractFolder: 폴더 쓰기 지원 여부(Chrome·Edge)와 폴더 고르기.

큰 ZIP은 사용자가 고른 폴더에 풀고 그 폴더를 DirectoryHandleFolder(source.ts)로 여는 것이 기본 흐름이다.
*/
/******************************************************************************/

import { Inflate } from 'fflate';
import { MemoryFolder, baseName, parentPath, type ByteSource } from './source';

// ---------------------------------------------------------------------------
// 계약
// ---------------------------------------------------------------------------

/** ZIP 항목 하나를 받아 쓰는 쪽 */
export interface ZipEntryWriter {
  write(chunk: Uint8Array): Promise<void>;
  close(): Promise<void>;
  /** 풀기가 중간에 실패·중단됐을 때 쓰다 만 파일을 버린다. 없으면 close()로 대신한다 */
  abort?(reason?: unknown): Promise<void>;
}

/** 어디에 풀지 추상화. 경로는 '/' 구분, 앞에 '/' 없음 */
export interface ZipSink {
  file(path: string): Promise<ZipEntryWriter>;
}

export interface ZipProgress {
  entries: number;    // 쓰기 시작한 파일 수
  bytes: number;      // 처리한 ZIP 위치(바이트). 건너뛴 항목도 지나간다. 줄어들지 않는다
  totalBytes: number; // ZIP 전체 크기
  current: string;    // 지금 쓰는 항목 경로
}

export interface ExtractZipOptions {
  onProgress?: (p: ZipProgress) => void;
  signal?: AbortSignal;
  /** true를 돌려주면 그 항목은 읽지도 풀지도 않는다 (경로는 정규화된 것) */
  skip?: (path: string) => boolean;
  /** ZIP을 읽는 조각 크기(바이트). 64 KB~4 MB로 맞춘다. 기본 1 MB. 항목이 그보다 작으면 항목 크기만큼만 읽는다 */
  chunkBytes?: number;
  /**
   * 읽은 조각을 Inflate에 넣는 슬라이스 크기(바이트). 4 KB~256 KB로 맞춘다. 기본 64 KB.
   * 한 번에 나오는 출력(= sink.write 한 번의 크기)은 최대 약 1032 × 이 값이고, fflate 내부 버퍼까지 더한 순간 최고점은 그 약 2배다.
   * Node 측정(1 GB가 전부 0인 항목): 64 KB → 쓰기 최대 63.5 MB·최고점 약 120~140 MB, 32 KB → 31.8 MB·약 60 MB.
   * 보통 자료(float32, 압축비 1.1)에서는 64 KB가 슬라이스 없던 때와 같은 속도, 32 KB는 약 10 % 느리고 16 KB는 약 60 % 느리다
   */
  inflateSliceBytes?: number;
  /** 푼 바이트의 CRC-32를 ZIP에 적힌 값과 대조한다. 기본 켬 */
  verifyCrc?: boolean;
}

export interface ExtractZipResult {
  entries: number;    // 쓴 파일 수
  bytes: number;      // 처리한 ZIP 바이트 (= 전체 크기)
  topLevel: string[]; // ZIP 안 최상위 이름(중복 제거, 나온 순서). 엔진 ZIP이면 입력 JSON·run.log·결과 폴더 이름
}

/** ZIP 항목 하나의 정보 (central directory 기준) */
export interface ZipEntry {
  name: string;        // ZIP에 적힌 이름 ('/' 구분, 폴더는 '/'로 끝남). 글자 해석은 decodeEntryName 참고
  isDir: boolean;
  method: number;      // 0 저장, 8 deflate
  csize: number;       // 압축된 크기
  usize: number;       // 원래 크기
  crc: number;         // 원래 바이트의 CRC-32
  offset: number;      // 로컬 머리말 위치
  nameLength: number;  // 항목 목록에 적힌 이름 길이(바이트). 로컬 머리말 길이 어림용
  extraLength: number; // 항목 목록에 적힌 추가 필드 길이(바이트). 로컬 머리말의 값과 다를 수 있다
}

const CHUNK_MIN = 64 * 1024;
const CHUNK_MAX = 4 * 1024 * 1024;
const CHUNK_DEFAULT = 1024 * 1024;
const SLICE_MIN = 4 * 1024;
const SLICE_MAX = 256 * 1024;
const SLICE_DEFAULT = 64 * 1024;
/** 로컬 머리말의 추가 필드가 항목 목록보다 길 때를 위한 여유(바이트). 자료 시작은 머리말 값으로 세므로 넘어도 맞게 읽는다 */
const LOCAL_HEADER_SLACK = 64;
const MEMORY_MAX_DEFAULT = 256 * 1024 * 1024;
const FLAG_ENCRYPTED = 1;
const FLAG_UTF8 = 0x800; // 깃발 11번: 이름·주석이 UTF-8

const SIG_LOCAL = 0x04034b50;
const SIG_CENTRAL = 0x02014b50;
const SIG_EOCD = 0x06054b50;
const SIG_EOCD64 = 0x06064b50;
const SIG_LOCATOR64 = 0x07064b50;

const u16 = (b: Uint8Array, i: number): number => b[i] | (b[i + 1] << 8);
const u32 = (b: Uint8Array, i: number): number => (b[i] | (b[i + 1] << 8) | (b[i + 2] << 16) | (b[i + 3] << 24)) >>> 0;
const u64 = (b: Uint8Array, i: number): number => u32(b, i) + u32(b, i + 4) * 0x100000000;
const errorMessage = (e: unknown): string => (e instanceof Error ? e.message : String(e));
const fmtMB = (n: number): string => `${(n / (1024 * 1024)).toFixed(n < 10 * 1024 * 1024 ? 1 : 0)} MB`;

const CRC_TABLE = ((): Uint32Array => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

/** 이어서 계산할 수 있는 CRC-32 (처음에는 crc = 0) */
export function crc32(crc: number, bytes: Uint8Array): number {
  let c = ~crc;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return ~c >>> 0;
}

const utf8Strict = new TextDecoder('utf-8', { fatal: true });
const utf8Loose = new TextDecoder('utf-8');
let legacyDecoder: TextDecoder | null | undefined; // euc-kr(CP949). 지원하지 않는 런타임이면 null

/**
 * ZIP 항목 이름 바이트 → 문자열.
 * 깃발 11번(UTF-8 표시)이 켜져 있거나 ASCII뿐이면 UTF-8. 엔진(Python zipfile)은 ASCII가 아닌 이름에 이 깃발을 켠다.
 * 깃발이 꺼진 비ASCII 이름(Windows 탐색기 등으로 다시 묶은 ZIP의 한글)은 먼저 UTF-8로 엄격히 읽어 보고, 안 되면
 * euc-kr(CP949)로 읽는다. 규격의 기본은 CP437이지만 이 앱은 한국어 Windows에서 묶은 ZIP을 받을 가능성이 훨씬 크다.
 * 한계: CP949 바이트가 우연히 올바른 UTF-8이면 잘못 읽고, Info-ZIP Unicode Path 추가 필드(0x7075)는 보지 않는다.
 */
export function decodeEntryName(bytes: Uint8Array, flags: number): string {
  let ascii = true;
  for (let i = 0; i < bytes.length; i++) if (bytes[i] >= 0x80) { ascii = false; break; }
  if (ascii || (flags & FLAG_UTF8)) return utf8Loose.decode(bytes);
  try { return utf8Strict.decode(bytes); } catch { /* UTF-8이 아님 */ }
  if (legacyDecoder === undefined) {
    try { legacyDecoder = new TextDecoder('euc-kr'); } catch { legacyDecoder = null; }
  }
  return legacyDecoder ? legacyDecoder.decode(bytes) : utf8Loose.decode(bytes);
}

/** ZIP 항목 이름 → sink 경로. 역슬래시는 슬래시로, 앞의 '/'와 '.'은 떼고, '..'이 있으면 거부한다. 빈 이름은 '' */
export function normalizeEntryPath(raw: string): string {
  const parts = raw.replace(/\\/g, '/').split('/').filter((s) => s !== '' && s !== '.');
  if (parts.includes('..')) throw new Error(`ZIP 항목 경로에 상위 폴더(..)가 있어 거부합니다: ${raw}`);
  return parts.join('/');
}

// ---------------------------------------------------------------------------
// 입력 (ByteSource | Blob)
// ---------------------------------------------------------------------------

/** Blob(File)을 ByteSource처럼. slice는 그 구간만 읽는다 */
class BlobSource implements ByteSource {
  readonly name: string;
  constructor(private readonly blob: Blob) {
    const n = 'name' in blob ? blob.name : undefined;
    this.name = typeof n === 'string' && n ? n : 'archive.zip';
  }
  async size(): Promise<number> { return this.blob.size; }
  async read(start: number, end: number): Promise<ArrayBuffer> {
    if (end < start) return new ArrayBuffer(0);
    return this.blob.slice(start, Math.min(end + 1, this.blob.size)).arrayBuffer();
  }
}

const toByteSource = (zip: ByteSource | Blob): ByteSource =>
  typeof Blob !== 'undefined' && zip instanceof Blob ? new BlobSource(zip) : (zip as ByteSource);

function throwIfAborted(signal?: AbortSignal): void {
  if (!signal?.aborted) return;
  const reason: unknown = signal.reason;
  if (reason instanceof Error) throw reason;
  if (typeof DOMException !== 'undefined') throw new DOMException('ZIP 풀기를 중단했습니다', 'AbortError');
  const e = new Error('ZIP 풀기를 중단했습니다');
  e.name = 'AbortError';
  throw e;
}

// ---------------------------------------------------------------------------
// 항목 목록 (central directory)
// ---------------------------------------------------------------------------

/** ZIP 끝의 항목 목록을 읽는다. 풀지 않고 목록만 볼 때도 쓴다 */
export async function listZipEntries(zip: ByteSource | Blob): Promise<ZipEntry[]> {
  const src = toByteSource(zip);
  return readCentralDirectory(src, await src.size());
}

async function readCentralDirectory(src: ByteSource, size: number): Promise<ZipEntry[]> {
  const incomplete = (why: string): Error =>
    new Error(`ZIP의 항목 목록(central directory)을 읽지 못했습니다 (${src.name}): ${why}. 내려받다 끊긴 파일일 수 있습니다`);
  if (size < 22) throw incomplete('파일이 너무 작습니다');

  // 끝 레코드(EOCD, 22바이트 + 주석 최대 64 KB)는 파일 끝에 있다. 뒤에서부터 서명을 찾는다
  const tailLen = Math.min(size, 22 + 0xffff + 20);
  const tail = new Uint8Array(await src.read(size - tailLen, size - 1));
  let eocd = -1;
  for (let i = tail.length - 22; i >= 0; i--) if (u32(tail, i) === SIG_EOCD) { eocd = i; break; }
  if (eocd < 0) throw incomplete('끝 레코드(EOCD)가 없습니다');
  let count = u16(tail, eocd + 10);
  let cdSize = u32(tail, eocd + 12);
  let cdOffset = u32(tail, eocd + 16);

  // ZIP64: EOCD 바로 앞의 locator가 64비트 끝 레코드 위치를 가리킨다. 거기 적힌 값이 진짜다
  if (eocd >= 20 && u32(tail, eocd - 20) === SIG_LOCATOR64) {
    const at = u64(tail, eocd - 12);
    if (at + 56 > size) throw incomplete('ZIP64 끝 레코드 위치가 파일 밖입니다');
    const rec = new Uint8Array(await src.read(at, at + 55));
    if (rec.length < 56 || u32(rec, 0) !== SIG_EOCD64) throw incomplete('ZIP64 끝 레코드 서명이 맞지 않습니다');
    count = u64(rec, 32);
    cdSize = u64(rec, 40);
    cdOffset = u64(rec, 48);
  }
  if (cdOffset + cdSize > size) throw incomplete('항목 목록 위치가 파일 밖입니다');

  const cd = new Uint8Array(await src.read(cdOffset, cdOffset + cdSize - 1));
  const entries: ZipEntry[] = [];
  let p = 0;
  for (let n = 0; n < count; n++) {
    if (p + 46 > cd.length || u32(cd, p) !== SIG_CENTRAL) throw incomplete(`항목 ${n}의 서명이 맞지 않습니다`);
    const flags = u16(cd, p + 8);
    if (flags & FLAG_ENCRYPTED) throw new Error(`암호가 걸린 ZIP은 지원하지 않습니다: ${src.name}`);
    const method = u16(cd, p + 10);
    const crc = u32(cd, p + 16);
    let csize = u32(cd, p + 20);
    let usize = u32(cd, p + 24);
    const fnLen = u16(cd, p + 28);
    const exLen = u16(cd, p + 30);
    const cmLen = u16(cd, p + 32);
    let offset = u32(cd, p + 42);
    const name = decodeEntryName(cd.subarray(p + 46, p + 46 + fnLen), flags);
    // ZIP64 추가 필드(id 1): 0xFFFFFFFF인 값만 이 순서로 8바이트씩 들어 있다
    for (let q = p + 46 + fnLen, end = q + exLen; q + 4 <= end;) {
      const id = u16(cd, q);
      const len = u16(cd, q + 2);
      let r = q + 4;
      if (id === 1) {
        if (usize === 0xffffffff && r + 8 <= end) { usize = u64(cd, r); r += 8; }
        if (csize === 0xffffffff && r + 8 <= end) { csize = u64(cd, r); r += 8; }
        if (offset === 0xffffffff && r + 8 <= end) offset = u64(cd, r);
      }
      q += 4 + len;
    }
    entries.push({ name, isDir: /[\\/]$/.test(name), method, csize, usize, crc, offset, nameLength: fnLen, extraLength: exLen });
    p += 46 + fnLen + exLen + cmLen;
  }
  return entries;
}

// ---------------------------------------------------------------------------
// 풀기
// ---------------------------------------------------------------------------

/**
 * ZIP을 항목마다 조각으로 읽어 sink에 흘려 쓴다. 폴더 항목은 건너뛰고, 경로에 '..'이 있으면 오류.
 * 항목은 ZIP 안의 실제 위치 순서로 처리한다(항목 목록 순서와 달라도 됨). 읽기가 앞으로만 가고 진행률도 줄지 않는다.
 * 읽기는 조각(chunkBytes) 단위로 미리 읽어 두되, 앞으로 쓸 항목이 그 안에 없으면 지금 항목 끝까지만 읽는다.
 * 그래서 작은 항목 수천 개는 1 MB마다 한 번 읽고, 건너뛰는 큰 항목 사이의 작은 항목은 그 크기만큼만 읽는다.
 */
export async function extractZip(zip: ByteSource | Blob, sink: ZipSink, opts: ExtractZipOptions = {}): Promise<ExtractZipResult> {
  const src = toByteSource(zip);
  const { onProgress, signal, skip } = opts;
  const chunkBytes = Math.min(CHUNK_MAX, Math.max(CHUNK_MIN, Math.floor(opts.chunkBytes ?? CHUNK_DEFAULT)));
  const sliceBytes = Math.min(SLICE_MAX, Math.max(SLICE_MIN, Math.floor(opts.inflateSliceBytes ?? SLICE_DEFAULT)));
  const verifyCrc = opts.verifyCrc ?? true;
  const totalBytes = await src.size();
  if (!(totalBytes > 0)) throw new Error(`ZIP이 비어 있습니다: ${src.name}`);
  throwIfAborted(signal);
  const list = (await readCentralDirectory(src, totalBytes)).sort((a, b) => a.offset - b.offset);

  // 계획: 쓸 항목만 실제 위치 순서로 고른다. topLevel은 폴더·건너뛴 항목까지 본다. '..' 같은 오류는 쓰기 전에 난다
  const topLevel: string[] = [];
  const plan: { e: ZipEntry; path: string }[] = [];
  for (const e of list) {
    const path = normalizeEntryPath(e.name);
    if (!path) continue;
    const top = path.includes('/') ? path.slice(0, path.indexOf('/')) : path;
    if (!topLevel.includes(top)) topLevel.push(top);
    if (e.isDir || skip?.(path)) continue; // 폴더 항목·건너뛰는 항목은 읽지도 않는다
    if (e.method !== 0 && e.method !== 8) throw new Error(`지원하지 않는 압축 방식(${e.method})입니다: ${path}`);
    plan.push({ e, path });
  }

  // 읽기 버퍼: 마지막으로 읽은 구간. 다음 항목이 그 안에 있으면 다시 읽지 않는다
  let buf = new Uint8Array(0);
  let bufStart = 0;
  const estimatedEnd = (e: ZipEntry): number => e.offset + 30 + e.nameLength + e.extraLength + e.csize + LOCAL_HEADER_SLACK;
  /** [start, end) 구간. 버퍼에 start가 있으면 있는 데까지(whole이면 end까지 다 있을 때만) 돌려주고, 아니면 새로 읽는다 */
  const readAt = async (start: number, end: number, planIndex: number, whole: boolean): Promise<Uint8Array> => {
    end = Math.min(end, totalBytes);
    if (end <= start) return new Uint8Array(0);
    const bufEnd = bufStart + buf.length;
    if (start >= bufStart && start < bufEnd && (!whole || end <= bufEnd)) {
      return buf.subarray(start - bufStart, Math.min(end, bufEnd) - bufStart);
    }
    // 미리 읽는 범위: 조각 하나 안에 이어지는 '쓸 항목'들의 끝까지. 건너뛰는 구간이 gapMax보다 길면 거기서 멈춘다
    // (건너뛰는 큰 .vtu 사이의 작은 .vtm은 제 크기만큼만 읽게). 그 뒤는 다음 읽기 몫이다
    const window = start + chunkBytes;
    const gapMax = chunkBytes >> 4;
    let limit = end;
    for (let j = planIndex; j < plan.length && plan[j].e.offset < window; j++) {
      if (plan[j].e.offset > limit + gapMax) break;
      limit = Math.max(limit, estimatedEnd(plan[j].e));
    }
    const readEnd = Math.min(Math.max(end, Math.min(window, limit)), totalBytes);
    buf = new Uint8Array(await src.read(start, readEnd - 1));
    bufStart = start;
    return buf.subarray(0, Math.min(end - start, buf.length));
  };

  let entries = 0;
  let bytes = 0;
  let current = '';
  const report = (): void => onProgress?.({ entries, bytes, totalBytes, current });
  const advance = (to: number): void => { bytes = Math.max(bytes, to); report(); };

  const extractOne = async (planIndex: number, writer: ZipEntryWriter): Promise<void> => {
    const { e, path } = plan[planIndex];
    // 로컬 머리말(30바이트 + 이름 + 추가 필드). 추가 필드 길이는 항목 목록과 다를 수 있어 여유를 두고, 자료 시작은 머리말 값으로 센다
    const head = await readAt(e.offset, e.offset + 30 + e.nameLength + e.extraLength + LOCAL_HEADER_SLACK, planIndex, true);
    if (head.length < 30 || u32(head, 0) !== SIG_LOCAL) throw new Error(`항목의 머리말이 맞지 않습니다: ${path}`);
    const dataStart = e.offset + 30 + u16(head, 26) + u16(head, 28);
    const dataEnd = dataStart + e.csize;
    if (dataEnd > totalBytes) throw new Error(`항목이 ZIP 끝을 넘습니다: ${path}`);
    const out: Uint8Array[] = [];
    const inflate = e.method === 8 && e.csize > 0 ? new Inflate((d) => { out.push(d); }) : null;
    let crc = 0;
    const flush = async (): Promise<void> => {
      for (const d of out) {
        if (verifyCrc) crc = crc32(crc, d);
        await writer.write(d);
      }
      out.length = 0;
    };
    let at = dataStart;
    for (;;) {
      const chunk = await readAt(at, Math.min(at + chunkBytes, dataEnd), planIndex, false);
      const final = at + chunk.length >= dataEnd;
      if (!chunk.length && !final) throw new Error(`ZIP을 끝까지 읽지 못했습니다 (${at}/${totalBytes} 바이트): ${path}`);
      if (inflate) {
        // 조각을 슬라이스로 나눠 넣고 슬라이스마다 출력을 비운다. 한 번에 잡히는 출력이 '압축비 × 슬라이스'를 넘지 않게
        let off = 0;
        do {
          const end = Math.min(off + sliceBytes, chunk.length);
          try { inflate.push(chunk.subarray(off, end), final && end === chunk.length); } catch (err) {
            throw new Error(`항목을 푸는 중 오류 (${path}): ${errorMessage(err)}`);
          }
          await flush();
          off = end;
          if (off < chunk.length) { advance(at + off); throwIfAborted(signal); }
        } while (off < chunk.length);
      } else if (chunk.length) {
        out.push(chunk);
        await flush();
      }
      at += chunk.length;
      advance(at);
      if (final) break;
      throwIfAborted(signal);
    }
    if (verifyCrc && crc !== e.crc) throw new Error(`푼 내용의 CRC가 ZIP에 적힌 값과 다릅니다 (손상된 ZIP): ${path}`);
    await writer.close();
  };

  let active: ZipEntryWriter | null = null; // 쓰는 중인 파일. 실패·중단 시 버린다
  try {
    for (let i = 0; i < plan.length; i++) {
      throwIfAborted(signal);
      entries++;
      current = plan[i].path;
      advance(plan[i].e.offset);
      const writer = await sink.file(current);
      active = writer;
      await extractOne(i, writer);
      active = null;
    }
    advance(totalBytes);
  } catch (err) {
    if (active) {
      const w = active;
      active = null;
      try { await (w.abort ? w.abort(err) : w.close()); } catch { /* 버리는 중 오류는 무시 */ }
    }
    throw err;
  }
  return { entries, bytes: totalBytes, topLevel };
}

// ---------------------------------------------------------------------------
// sink: 메모리 (작은 ZIP → MemoryFolder)
// ---------------------------------------------------------------------------

export interface MemorySink extends ZipSink {
  /** 다 쓴 파일 (경로 → 바이트) */
  readonly files: Map<string, Uint8Array>;
  /** 쓴 바이트 합 */
  bytes(): number;
  /** 모인 파일로 MemoryFolder를 만든다 */
  toFolder(name?: string): MemoryFolder;
}

const tooBigMessage = (what: string, bytes: number, max: number): string =>
  `${what} (${fmtMB(bytes)} > 상한 ${fmtMB(max)}). 먼저 풀어서 폴더로 열어 주세요.`;

/**
 * 풀린 바이트를 메모리에 모은다. maxBytes를 넘으면 쓰기에서 오류.
 * 상한은 조각(write 한 번) 단위로 본다: 받은 조각까지 더해 상한을 넘으면 그 조각을 붙들지 않고 바로 던진다. 조각 자체는
 * 이미 만들어진 뒤라, 조각 크기 상한은 extractZip의 inflateSliceBytes(기본 64 KB → 조각 최대 약 64 MB)가 정한다.
 * 항목 목록의 원래 크기 합으로 미리 거르는 것은 unzipToMemory가 한다
 */
export function memorySink(opts: { maxBytes?: number } = {}): MemorySink {
  const files = new Map<string, Uint8Array>();
  const max = opts.maxBytes ?? Infinity;
  let total = 0;
  return {
    files,
    bytes: () => total,
    toFolder: (name = '메모리') => new MemoryFolder(files, name),
    async file(path) {
      const parts: Uint8Array[] = [];
      let n = 0;
      return {
        async write(chunk) {
          n += chunk.length;
          total += chunk.length;
          if (total > max) throw new Error(tooBigMessage('푼 내용이 메모리 상한을 넘었습니다', total, max));
          parts.push(chunk);
        },
        async close() {
          const out = new Uint8Array(n); // 읽기 조각(최대 4 MB)을 붙들지 않도록 새로 복사
          let o = 0;
          for (const p of parts) { out.set(p, o); o += p.length; }
          files.set(path, out);
          parts.length = 0;
        },
        async abort() {
          total -= n;
          parts.length = 0;
        },
      };
    },
  };
}

/**
 * 작은 ZIP을 메모리에 풀어 MemoryFolder로. maxBytes(기본 256 MB)를 넘으면 오류.
 * 세 겹으로 거른다: ZIP 크기 → 항목 목록에 적힌 원래 크기 합(풀기 전에 거름) → 실제로 푼 바이트(조각 단위, memorySink).
 * 항목 목록의 크기는 묶은 쪽이 적은 값이라 믿지 않고, 마지막 검사가 안전망이다
 */
export async function unzipToMemory(
  zip: ByteSource | Blob,
  opts: { maxBytes?: number; signal?: AbortSignal; onProgress?: (p: ZipProgress) => void } = {},
): Promise<MemoryFolder> {
  const maxBytes = opts.maxBytes ?? MEMORY_MAX_DEFAULT;
  const src = toByteSource(zip);
  const size = await src.size();
  if (size > maxBytes) throw new Error(tooBigMessage(`ZIP이 너무 커서 메모리에 풀 수 없습니다: ${src.name}`, size, maxBytes));
  const listed = (await readCentralDirectory(src, size)).reduce((sum, e) => (e.isDir ? sum : sum + e.usize), 0);
  if (listed > maxBytes) throw new Error(tooBigMessage(`푼 크기가 메모리 상한을 넘습니다: ${src.name}`, listed, maxBytes));
  const sink = memorySink({ maxBytes });
  await extractZip(src, sink, { signal: opts.signal, onProgress: opts.onProgress });
  return sink.toFolder(src.name.replace(/\.zip$/i, '') || '메모리');
}

// ---------------------------------------------------------------------------
// sink: 사용자가 고른 폴더 (File System Access API, Chrome·Edge)
// ---------------------------------------------------------------------------

/** 폴더 핸들에 쓴다. 하위 폴더는 만들면서 내려간다 */
export function directoryHandleSink(root: FileSystemDirectoryHandle): ZipSink {
  const dirs = new Map<string, Promise<FileSystemDirectoryHandle>>([['', Promise.resolve(root)]]);
  const dirAt = (path: string): Promise<FileSystemDirectoryHandle> => {
    let p = dirs.get(path);
    if (!p) {
      p = dirAt(parentPath(path)).then((parent) => parent.getDirectoryHandle(baseName(path), { create: true }));
      dirs.set(path, p);
    }
    return p;
  };
  return {
    async file(path) {
      const dir = await dirAt(parentPath(path));
      const handle = await dir.getFileHandle(baseName(path), { create: true });
      // createWritable은 임시 파일에 쓰다가 close()에서 바꿔 넣는다. abort()하면 원래 파일은 그대로다
      const w = await handle.createWritable();
      return {
        write: (chunk) => w.write(chunk as Uint8Array<ArrayBuffer>), // 조각은 늘 ArrayBuffer 기반(read() 결과·fflate 출력)
        close: () => w.close(),
        abort: (reason) => w.abort(reason),
      };
    },
  };
}

/**
 * 폴더 선택 창을 브라우저가 막는 화면인가: 다른 주소(출처)의 페이지 안에 iframe 으로 끼워져 있으면 Chrome 은 폴더 선택 창을 SecurityError 로 막는다.
 * 호스트 앱이 우리 페이지를 다른 주소에서 띄울 때다. 바깥 창의 주소를 읽을 수 없으면 다른 출처로 본다. 같은 출처 iframe·단독 창은 false
 */
export function folderPickerBlocked(): boolean {
  if (typeof window === 'undefined' || window.self === window.top) return false;
  try { return !window.top?.location.href; } catch { return true; }
}

/** 사용자가 고른 폴더에 쓸 수 있는 화면인가 (window.showDirectoryPicker 가 있고 막히지 않음) */
export function supportsDirectoryWrite(): boolean {
  return typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function' && !folderPickerBlocked();
}

/** 풀어 넣을 폴더를 고른다(읽기·쓰기). 사용자가 취소하면 null. 사용자 동작(클릭) 안에서 불러야 한다 */
export async function pickExtractFolder(): Promise<FileSystemDirectoryHandle | null> {
  if (!supportsDirectoryWrite()) throw new Error('이 브라우저는 폴더에 쓰기를 지원하지 않습니다 (Chrome·Edge에서 열어 주세요)');
  try {
    return await window.showDirectoryPicker!({ mode: 'readwrite', id: 'union-twin-extract' });
  } catch (e) {
    if ((e as { name?: unknown } | null)?.name === 'AbortError') return null;
    throw e;
  }
}

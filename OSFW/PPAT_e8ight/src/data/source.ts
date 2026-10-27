// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   source.ts

결과 파일이 "어디에 있든" 같은 방식으로 읽기 위한 얇은 층.
- ByteSource: 파일 하나. 필요한 바이트 구간만 읽는다(HTTP Range 요청, 또는 File.slice).
- FolderSource: 폴더 하나. 안의 파일 목록을 보고, 파일을 ByteSource로 연다.

구현 네 가지: 서버 주소(HTTP — 개발 서버 /__data·/__list, 운영 서버의 엔진 작업 폴더 results/<job_id>/ = nginx 폴더 목록),
사용자가 고른 폴더(File System Access API 핸들), 폴더째 올린 파일 목록(input webkitdirectory·끌어다 놓기), 메모리(작은 ZIP을 풀어 둔 것).
로더(vtu_loader 등)는 이 층만 보고, 파일이 서버에 있는지 PC에 있는지 모른다.
*/
/******************************************************************************/

export interface ByteSource {
  readonly name: string;   // 파일 이름 (표시·오류 메시지용)
  size(): Promise<number>;
  /** [start, end] 바이트 구간(끝 포함)을 읽는다. 파일 끝을 넘으면 있는 데까지만 돌려준다. */
  read(start: number, end: number): Promise<ArrayBuffer>;
}

export interface FolderEntry { name: string; kind: 'file' | 'dir' }

export interface FolderSource {
  readonly name: string;
  /** 하위 경로의 항목 목록. 경로는 '/' 구분, ''는 폴더 자신. 목록을 못 주는 저장소(HTTP)는 null */
  list(path?: string): Promise<FolderEntry[] | null>;
  /** 하위 경로의 파일. 없으면 null */
  file(path: string): Promise<ByteSource | null>;
  /** 하위 폴더를 같은 형식으로 */
  sub(path: string): FolderSource;
}

export const joinPath = (a: string, b: string): string => (a ? `${a.replace(/\/+$/, '')}/${b.replace(/^\/+/, '')}` : b);
export const parentPath = (p: string): string => (p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '');
export const baseName = (p: string): string => p.slice(p.lastIndexOf('/') + 1);

/** 파일 전체를 글자로 (헤더·JSON·로그처럼 작은 파일용) */
export async function readText(src: ByteSource, maxBytes = 64 * 1024 * 1024): Promise<string> {
  const n = Math.min(await src.size(), maxBytes);
  return new TextDecoder('utf-8').decode(await src.read(0, Math.max(0, n - 1)));
}

// ---------------------------------------------------------------------------
// HTTP (개발 서버 /__data, 운영 정적 서버). Range를 무시하는 서버는 전체를 받아 잘라 쓴다.
// ---------------------------------------------------------------------------
export class HttpSource implements ByteSource {
  readonly name: string;
  private sizeCache: number | null = null;
  private whole: ArrayBuffer | null = null; // 서버가 Range를 무시했을 때 받은 전체 본문
  constructor(readonly url: string) { this.name = decodeURIComponent(url.slice(url.lastIndexOf('/') + 1)); }

  async size(): Promise<number> {
    if (this.sizeCache !== null) return this.sizeCache;
    if (this.whole) return (this.sizeCache = this.whole.byteLength);
    const res = await fetch(this.url, { method: 'HEAD' });
    const len = Number(res.headers.get('content-length'));
    if (res.ok && len >= 0 && Number.isFinite(len)) return (this.sizeCache = len);
    // HEAD를 안 받는 서버: 첫 바이트를 Range로 받아 Content-Range에서 전체 길이를 본다
    const r = await fetch(this.url, { headers: { Range: 'bytes=0-0' } });
    const cr = r.headers.get('content-range');
    const m = cr && /\/(\d+)$/.exec(cr);
    if (r.status === 206 && m) { await r.arrayBuffer(); return (this.sizeCache = Number(m[1])); }
    if (r.ok) { this.whole = await r.arrayBuffer(); return (this.sizeCache = this.whole.byteLength); }
    throw new Error(`파일을 가져오지 못했습니다 (HTTP ${r.status}): ${this.url}`);
  }

  async read(start: number, end: number): Promise<ArrayBuffer> {
    if (end < start) return new ArrayBuffer(0);
    if (this.whole) return this.whole.slice(start, end + 1);
    const res = await fetch(this.url, { headers: { Range: `bytes=${start}-${end}` } });
    if (res.status === 206) return res.arrayBuffer();
    if (res.ok) {
      // Range를 무시한 서버: 전체를 한 번만 받아 두고 잘라 쓴다 (배열마다 전체를 다시 받지 않게)
      this.whole = await res.arrayBuffer();
      this.sizeCache = this.whole.byteLength;
      return this.whole.slice(start, end + 1);
    }
    throw new Error(`파일을 가져오지 못했습니다 (HTTP ${res.status}): ${this.url}`);
  }
}

/** 폴더 목록 JSON → FolderEntry. 개발 서버 형식([{name, kind: 'dir'|'file'}])과 nginx 폴더 목록 형식([{name, type: 'directory'|'file', mtime, size}])을 함께 받는다 */
function parseListing(data: unknown): FolderEntry[] | null {
  if (!Array.isArray(data)) return null;
  const out: FolderEntry[] = [];
  for (const it of data) {
    const o = (it ?? {}) as { name?: unknown; kind?: unknown; type?: unknown };
    if (typeof o.name !== 'string' || !o.name) continue;
    if (o.kind === 'dir' || o.kind === 'file') out.push({ name: o.name, kind: o.kind });
    else if (typeof o.type === 'string') out.push({ name: o.name, kind: o.type === 'directory' ? 'dir' : 'file' });
  }
  return out;
}

export class HttpFolder implements FolderSource {
  readonly name: string;
  /** nginx 폴더 목록(autoindex_format json): 폴더 주소 끝에 '/'를 붙여 목록을 받는다 */
  readonly autoindex: boolean;
  /**
   * listBase: 폴더 목록을 JSON으로 주는 주소. 없으면 목록 없음.
   * 기본은 개발 서버 /__list/<이름>([{name, kind}]), opts.autoindex 면 운영 서버의 nginx 폴더 목록(results/<job_id>/ 등)
   */
  constructor(readonly baseUrl: string, readonly listBase?: string, opts: { autoindex?: boolean } = {}) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.listBase = listBase?.replace(/\/+$/, '');
    this.autoindex = !!opts.autoindex;
    this.name = decodeURIComponent(this.baseUrl.slice(this.baseUrl.lastIndexOf('/') + 1));
  }
  async list(path = ''): Promise<FolderEntry[] | null> {
    if (!this.listBase) return null; // 정적 서버는 목록을 주지 않는다
    let url: string;
    if (this.autoindex) {
      const enc = path.split('/').filter(Boolean).map(encodeURIComponent).join('/');
      url = `${this.listBase}/${enc ? `${enc}/` : ''}`; // '/'로 끝나야 nginx 가 목록을 준다 (없으면 '/' 붙은 주소로 돌려보냄)
    } else {
      url = path ? `${this.listBase}/${path.split('/').map(encodeURIComponent).join('/')}` : this.listBase;
    }
    const res = await fetch(url);
    if (!res.ok) return null;
    try { return parseListing(await res.json()); } catch { return null; } // 목록이 아닌 응답(HTML 등)
  }
  async file(path: string): Promise<ByteSource | null> {
    const url = `${this.baseUrl}/${path.split('/').map(encodeURIComponent).join('/')}`;
    const res = await fetch(url, { method: 'HEAD' });
    if (!res.ok && res.status !== 405) return null;
    return new HttpSource(url);
  }
  sub(path: string): FolderSource {
    const enc = path.split('/').map(encodeURIComponent).join('/');
    return new HttpFolder(`${this.baseUrl}/${enc}`, this.listBase ? `${this.listBase}/${enc}` : undefined, { autoindex: this.autoindex });
  }
}

// ---------------------------------------------------------------------------
// 사용자 PC 파일 (File 객체). slice는 파일을 메모리에 올리지 않고 그 구간만 읽는다.
// ---------------------------------------------------------------------------
export class FileSource implements ByteSource {
  readonly name: string;
  constructor(readonly file: File) { this.name = file.name; }
  async size(): Promise<number> { return this.file.size; }
  async read(start: number, end: number): Promise<ArrayBuffer> {
    if (end < start) return new ArrayBuffer(0);
    return this.file.slice(start, Math.min(end + 1, this.file.size)).arrayBuffer();
  }
}

/** 사용자가 고른 폴더(File System Access API). 하위 폴더도 핸들로 내려간다. */
export class DirectoryHandleFolder implements FolderSource {
  readonly name: string;
  constructor(readonly handle: FileSystemDirectoryHandle) { this.name = handle.name; }

  private async dirAt(path: string): Promise<FileSystemDirectoryHandle | null> {
    let h = this.handle;
    for (const seg of path.split('/').filter(Boolean)) {
      try { h = await h.getDirectoryHandle(seg); } catch { return null; }
    }
    return h;
  }
  async list(path = ''): Promise<FolderEntry[] | null> {
    const dir = await this.dirAt(path);
    if (!dir) return null;
    const out: FolderEntry[] = [];
    for await (const [name, h] of dir.entries()) out.push({ name, kind: h.kind === 'directory' ? 'dir' : 'file' });
    return out;
  }
  async file(path: string): Promise<ByteSource | null> {
    const dir = await this.dirAt(parentPath(path));
    if (!dir) return null;
    try { return new FileSource(await (await dir.getFileHandle(baseName(path))).getFile()); } catch { return null; }
  }
  sub(path: string): FolderSource { return new SubFolder(this, path); }
}

/** 폴더째 올린 파일 목록(input webkitdirectory, 끌어다 놓기). 상대 경로로 찾는다. */
export class FileListFolder implements FolderSource {
  readonly name: string;
  private readonly files = new Map<string, File>(); // 폴더 안 상대 경로 → 파일
  constructor(files: Iterable<File>, name = '폴더') {
    this.name = name;
    for (const f of files) {
      const rel = (f.webkitRelativePath || f.name).replace(/\\/g, '/');
      // webkitRelativePath는 고른 폴더 이름부터 시작하므로 첫 마디를 뗀다
      const parts = rel.split('/');
      const key = parts.length > 1 ? parts.slice(1).join('/') : rel;
      this.files.set(key, f);
      if (parts.length > 1) this.name = parts[0];
    }
  }
  static fromPaths(entries: Iterable<[string, File]>, name = '폴더'): FileListFolder {
    const f = new FileListFolder([], name);
    for (const [path, file] of entries) f.files.set(path.replace(/\\/g, '/').replace(/^\/+/, ''), file);
    return f;
  }
  async list(path = ''): Promise<FolderEntry[]> {
    const prefix = path ? `${path.replace(/\/+$/, '')}/` : '';
    const seen = new Map<string, 'file' | 'dir'>();
    for (const key of this.files.keys()) {
      if (!key.startsWith(prefix)) continue;
      const rest = key.slice(prefix.length);
      const slash = rest.indexOf('/');
      if (slash < 0) seen.set(rest, 'file'); else seen.set(rest.slice(0, slash), 'dir');
    }
    return Array.from(seen, ([name, kind]) => ({ name, kind }));
  }
  async file(path: string): Promise<ByteSource | null> {
    const f = this.files.get(path.replace(/^\/+/, ''));
    return f ? new FileSource(f) : null;
  }
  sub(path: string): FolderSource { return new SubFolder(this, path); }
}

// ---------------------------------------------------------------------------
// 메모리 (작은 ZIP을 풀어 둔 것)
// ---------------------------------------------------------------------------
export class MemorySource implements ByteSource {
  constructor(readonly name: string, private readonly bytes: Uint8Array) {}
  async size(): Promise<number> { return this.bytes.byteLength; }
  async read(start: number, end: number): Promise<ArrayBuffer> {
    if (end < start) return new ArrayBuffer(0);
    return this.bytes.slice(start, Math.min(end + 1, this.bytes.byteLength)).buffer as ArrayBuffer;
  }
}

export class MemoryFolder implements FolderSource {
  readonly name: string;
  private readonly files = new Map<string, Uint8Array>();
  constructor(entries: Iterable<[string, Uint8Array]>, name = '메모리') {
    this.name = name;
    for (const [p, b] of entries) this.files.set(p.replace(/\\/g, '/').replace(/^\/+/, ''), b);
  }
  async list(path = ''): Promise<FolderEntry[]> {
    const prefix = path ? `${path.replace(/\/+$/, '')}/` : '';
    const seen = new Map<string, 'file' | 'dir'>();
    for (const key of this.files.keys()) {
      if (!key.startsWith(prefix)) continue;
      const rest = key.slice(prefix.length);
      const slash = rest.indexOf('/');
      if (slash < 0) seen.set(rest, 'file'); else seen.set(rest.slice(0, slash), 'dir');
    }
    return Array.from(seen, ([name, kind]) => ({ name, kind }));
  }
  async file(path: string): Promise<ByteSource | null> {
    const b = this.files.get(path.replace(/^\/+/, ''));
    return b ? new MemorySource(baseName(path), b) : null;
  }
  sub(path: string): FolderSource { return new SubFolder(this, path); }
}

/** 어떤 FolderSource의 하위 폴더를 폴더 자신처럼 보이게 한다 */
export class SubFolder implements FolderSource {
  readonly name: string;
  constructor(private readonly parent: FolderSource, private readonly path: string) { this.name = baseName(path) || parent.name; }
  list(path = ''): Promise<FolderEntry[] | null> { return this.parent.list(path ? joinPath(this.path, path) : this.path); }
  file(path: string): Promise<ByteSource | null> { return this.parent.file(joinPath(this.path, path)); }
  sub(path: string): FolderSource { return new SubFolder(this.parent, joinPath(this.path, path)); }
}

/** 끌어다 놓은 항목(DataTransfer)에서 폴더를 만든다. 폴더 핸들을 주는 브라우저면 핸들로, 아니면 파일 목록으로 */
export function folderFromDataTransfer(dt: DataTransfer): Promise<FolderSource | null> {
  // 핸들 요청과 파일 목록 복사는 drop 이벤트 안에서(await 전에) 해야 한다 — 이벤트가 끝나면 항목이 비워진다
  const handles = Array.from(dt.items ?? []).map((it) => (it.kind === 'file' && it.getAsFileSystemHandle ? it.getAsFileSystemHandle().catch(() => null) : Promise.resolve(null)));
  const files = Array.from(dt.files ?? []);
  return Promise.all(handles).then((hs) => {
    const dir = hs.find((h) => h && h.kind === 'directory');
    if (dir) return new DirectoryHandleFolder(dir as FileSystemDirectoryHandle);
    return files.length ? new FileListFolder(files) : null;
  });
}

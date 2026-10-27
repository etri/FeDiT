// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   zipInput.ts

해석엔진이 내려준 결과 ZIP을 "열 수 있는 폴더"로 만드는 얇은 층. 실제 풀기는 zipExtract.ts가 한다
(항목 목록(central directory)을 먼저 읽고 항목마다 정확한 구간만 스트리밍으로 풀며 CRC-32를 대조한다).
- 작은 ZIP(푼 크기 기본 256 MB 이하): 메모리에 풀어 MemoryFolder로 연다.
- 큰 ZIP: 사용자가 고른 폴더(File System Access API, Chrome·Edge)에 풀고 DirectoryHandleFolder로 연다.
엔진 ZIP은 작업 폴더 기준 이름이라 <입력 이름>.json + <입력 이름>/<이름>_<n>.vtm … 이다(맨 위 <job_id>/ 겹 없음).
그 위에 폴더가 한 겹 더 있어도 scanResultFolder가 2단계까지 내려가 찾는다.
*/
/******************************************************************************/
import { DirectoryHandleFolder, FolderSource } from './source';
import { ZipProgress, directoryHandleSink, extractZip, folderPickerBlocked, listZipEntries, memorySink, pickExtractFolder, supportsDirectoryWrite } from './zipExtract';

export { supportsDirectoryWrite, pickExtractFolder, folderPickerBlocked };

export interface OpenZipProgress extends ZipProgress {
  totalFiles: number;    // ZIP 안 파일 수 (폴더 항목 제외)
  totalUnpacked: number; // 푼 뒤 바이트 합 (항목 목록 기준)
}

export interface OpenZipOptions {
  memoryLimit?: number;                                          // 이 크기(푼 뒤 바이트) 이하면 메모리에 (기본 256 MB)
  pickFolder?: () => Promise<FileSystemDirectoryHandle | null>;  // 큰 ZIP을 풀 폴더 (기본 pickExtractFolder)
  onProgress?: (p: OpenZipProgress) => void;
  signal?: AbortSignal;
}

export interface OpenZipResult {
  folder: FolderSource;
  where: 'memory' | 'disk';
  files: number;
  unpackedBytes: number;
  handle?: FileSystemDirectoryHandle;
}

const mb = (b: number) => Math.round(b / 1048576);

/**
 * 결과 ZIP을 열 수 있는 폴더로 만든다. 작으면 메모리, 크면 사용자가 고른 폴더에 푼다.
 * 폴더를 고르지 않거나(취소) 브라우저가 폴더 쓰기를 지원하지 않으면 오류를 던진다.
 */
export async function openResultZip(file: File, opts: OpenZipOptions = {}): Promise<OpenZipResult> {
  const entries = await listZipEntries(file);
  const files = entries.filter((e) => !e.isDir);
  if (files.length === 0) throw new Error('ZIP 안에 파일이 없습니다.');
  const unpacked = files.reduce((s, e) => s + e.usize, 0);
  const limit = opts.memoryLimit ?? 256 * 1024 * 1024;
  const name = file.name.replace(/\.zip$/i, '') || 'result';
  const onProgress = opts.onProgress ? (p: ZipProgress) => opts.onProgress!({ ...p, totalFiles: files.length, totalUnpacked: unpacked }) : undefined;

  if (unpacked <= limit) {
    const sink = memorySink({ maxBytes: limit });
    const r = await extractZip(file, sink, { onProgress, signal: opts.signal });
    return { folder: sink.toFolder(name), where: 'memory', files: r.entries, unpackedBytes: sink.bytes() };
  }
  // 큰 ZIP 을 풀 폴더를 고를 수 없는 화면: 다른 주소에서 띄운 iframe(호스트 앱) 또는 폴더 쓰기가 없는 브라우저
  // 폴더를 끌어다 놓아 여는 것은 폴더 핸들을 주는 브라우저(Chrome·Edge)에서만 된다(source.ts folderFromDataTransfer)
  const canDropFolder = typeof DataTransferItem !== 'undefined' && 'getAsFileSystemHandle' in DataTransferItem.prototype;
  const unzipFirst = `ZIP을 PC에서 먼저 푼 뒤 "결과 폴더 열기"로 그 폴더를 고르${canDropFolder ? '거나 3D 화면에 끌어다 놓으' : ''}세요.`;
  if (folderPickerBlocked()) throw new Error(`ZIP을 풀면 ${mb(unpacked)} MB라 이 화면에서는 바로 열 수 없습니다. ${unzipFirst}`);
  if (!supportsDirectoryWrite()) {
    throw new Error(`ZIP을 풀면 ${mb(unpacked)} MB라 메모리에 올리기 어렵습니다. Chrome·Edge에서 열어 폴더에 풀거나, ${unzipFirst}`);
  }
  let handle: FileSystemDirectoryHandle | null;
  // 폴더 고르기 창은 클릭 직후 잠깐만 열린다. ZIP 을 고르는 창에서 오래 머물면 그 허가가 끝나 SecurityError 가 난다 — 원인에 맞게 알린다
  const activeBefore = (navigator as { userActivation?: { isActive: boolean } }).userActivation?.isActive;
  try { handle = await (opts.pickFolder ?? pickExtractFolder)(); }
  catch (e) {
    if ((e as { name?: unknown } | null)?.name === 'SecurityError') {
      if (activeBefore === false) throw new Error(`풀어 둘 폴더를 고르는 창은 클릭 직후에만 열립니다. "결과 ZIP 열기"를 다시 눌러 ZIP 을 바로 고르거나, ${unzipFirst}`);
      throw new Error(`ZIP을 풀면 ${mb(unpacked)} MB라 이 화면에서는 바로 열 수 없습니다. ${unzipFirst}`);
    }
    throw e;
  }
  if (!handle) throw new Error('풀어 둘 폴더를 고르지 않았습니다.');
  const r = await extractZip(file, directoryHandleSink(handle), { onProgress, signal: opts.signal });
  return { folder: new DirectoryHandleFolder(handle), where: 'disk', files: r.entries, unpackedBytes: unpacked, handle };
}

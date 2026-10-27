// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   openZip.ts

결과 ZIP 파일 하나를 열어 가시화까지 잇는다 (데이터 구획의 "결과 ZIP 열기" 단추와 3D 화면 끌어다 놓기가 같이 쓴다).
작은 ZIP은 메모리에, 큰 ZIP은 사용자가 고른 폴더에 풀고(zipInput.ts → zipExtract.ts), 푼 폴더를 결과 폴더로 연다.
*/
/******************************************************************************/
import { AppCore } from '../core/AppCore';
import { openResultZip } from '../data/zipInput';

const mb = (b: number) => Math.round(b / 1048576);

export async function openZipFile(app: AppCore, file: File): Promise<void> {
  app.reportProgress(`${file.name} 목록 읽는 중`);
  try {
    // 시험용 손잡이: post.html?zipmem=<MB> 로 메모리 상한을 낮추면 작은 ZIP으로도 '폴더에 풀기' 경로를 눌러 볼 수 있다
    const knob = Number(new URLSearchParams(location.search).get('zipmem'));
    const { folder, where, unpackedBytes } = await openResultZip(file, {
      memoryLimit: Number.isFinite(knob) && knob > 0 ? knob * 1024 * 1024 : undefined,
      onProgress: (p) => app.reportProgress(`${file.name} 푸는 중 · ${p.entries}/${p.totalFiles} 파일 · ZIP ${mb(p.bytes)} / ${mb(p.totalBytes)} MB`),
    });
    app.reportProgress('');
    await app.loadResultFolder(folder);
    if (where === 'disk') app.notify(`ZIP(푼 크기 ${mb(unpackedBytes)} MB)을 고른 폴더에 풀어 열었습니다. 다음에는 "결과 폴더 열기"로 그 폴더를 바로 열 수 있습니다.`);
  } finally {
    app.reportProgress('');
  }
}

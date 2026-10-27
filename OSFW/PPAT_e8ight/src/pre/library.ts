// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   library.ts

전처리 페이지의 내장 모델(STL) 라이브러리. 목록은 public/models/library.json, 파일은 public/models/<file>.
예제 다섯 해석기의 STL과 렌더러 샘플 건물을 넣어 두었다. 다성분 예제의 RTI_region.stl은 21 MB(삼각형 445,416개)라
다성분 템플릿으로 시작할 때 몇 초 걸리지만, 빼면 템플릿이 'STL 없음' 오류로 시작하므로 넣었다(2026-10-15 결정).
사용자는 여기서 고르거나 자기 STL을 올린다.
*/
/******************************************************************************/
import type { SolverKind } from './solverInput';

export interface LibraryModel {
  file: string;          // 파일 이름 (해석기 입력의 mesh_path로도 그대로 쓴다)
  label: string;
  note: string;
  kinds: SolverKind[];   // 어느 템플릿이 쓰는지 (빈 배열이면 공통)
}

let cache: Promise<LibraryModel[]> | null = null;

export function loadLibrary(): Promise<LibraryModel[]> {
  // 페이지 기준 상대 주소 (하위 경로 배포)
  cache ??= fetch('models/library.json').then(async (r) => {
    if (!r.ok) throw new Error(`모델 목록을 가져오지 못했습니다 (HTTP ${r.status})`);
    return (await r.json()) as LibraryModel[];
  }).catch((e) => { cache = null; throw e; });
  return cache;
}

/** 라이브러리 STL의 바이트. 없으면 null */
export async function fetchLibraryStl(file: string): Promise<Uint8Array | null> {
  const list = await loadLibrary();
  if (!list.some((m) => m.file === file)) return null;
  const r = await fetch(`models/${encodeURIComponent(file)}`);
  if (!r.ok) return null;
  return new Uint8Array(await r.arrayBuffer());
}

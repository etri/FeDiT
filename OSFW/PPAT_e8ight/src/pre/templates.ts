// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   templates.ts

해석기별 템플릿 JSON(public/templates/<kind>.json, 예제의 원래 길이 입력을 그대로 복사한 것)을 읽는다.
- parseSolverInput(text): 글자 → SolverInputDoc. 모양(meta.version·meta.title·config)만 확인하고 나머지는 그대로 둔다.
  사용자가 올린 JSON을 읽을 때도 같은 함수를 쓴다. Node 시험에서는 fetch 대신 이 함수에 파일 내용을 넘긴다.
- loadTemplate(kind): fetch로 한 번 받아 두고, 부를 때마다 깊은 복사를 돌려준다.
*/
/******************************************************************************/
import { SOLVER_INFO, cloneDoc, isJsonObject, type SolverInputDoc, type SolverKind } from './solverInput';

/** 입력 JSON 글자를 문서로. 맨 앞의 BOM은 떼고 읽는다(엔진 API도 utf-8-sig로 읽는다) */
export function parseSolverInput(text: string): SolverInputDoc {
  let data: unknown;
  try {
    data = JSON.parse(text.replace(/^﻿/, ''));
  } catch (e) {
    throw new Error(`입력 JSON을 읽지 못했습니다: ${(e as Error).message}`);
  }
  if (!isJsonObject(data) || !isJsonObject(data.meta) || !isJsonObject(data.config)) {
    throw new Error('입력 JSON에는 meta와 config 객체가 있어야 합니다.');
  }
  if (typeof data.meta.version !== 'number') throw new Error('meta.version은 숫자여야 합니다(예: 202502).');
  if (typeof data.meta.title !== 'string') throw new Error('meta.title은 글자여야 합니다.');
  return data as unknown as SolverInputDoc;
}

export const parseTemplate = parseSolverInput;

const cache = new Map<SolverKind, SolverInputDoc>();

/** 템플릿 문서의 깊은 복사. 고쳐도 다음 호출에 영향이 없다 */
export async function loadTemplate(kind: SolverKind): Promise<SolverInputDoc> {
  let doc = cache.get(kind);
  if (!doc) {
    const url = `templates/${SOLVER_INFO[kind].template}`; // 페이지 기준 상대 주소
    const res = await fetch(url);
    if (!res.ok) throw new Error(`템플릿을 가져오지 못했습니다 (HTTP ${res.status}): ${url}`);
    doc = parseSolverInput(await res.text());
    cache.set(kind, doc);
  }
  return cloneDoc(doc);
}

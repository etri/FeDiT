// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   openedData.ts

후처리에서 지금 열린 데이터가 어디서 왔는지(예제 · 서버 결과 · 사용자 파일)와, 주소의 ?data= · ?job= 을 그 데이터에 맞추는 판정.
화면·앱을 모르는 순수 함수만 둔다 — post/main.ts 가 부르고, scripts/test_post_url.mjs 가 시험한다.
- 예제(public/datasets.json 항목)를 열면 data=<아이디>, job 은 지운다. 서버 결과를 열면 job=<작업 번호>, data 는 지운다.
  사용자 파일(CSV · 결과 폴더 · 결과 ZIP · 끌어다 놓기)을 열면 둘 다 지운다. 새로 고치면 보던 것이 다시 열린다(사용자 파일은 다시 열 수 없으므로 빈 화면).
- 아무것도 열리지 않았으면(여는 중 · 못 엶) 주소를 건드리지 않는다. 다른 매개변수(tab · scene 등)와 # 뒤는 그대로 둔다.
- 해상도 선택지는 주소에 넣지 않는다(새로 고치면 그 예제의 기본 해상도로 열린다).
- '데이터 열기' 창 안에서 연 것이 열리면 장면 매개변수(scene · tab)를 지운다(sceneDroppedUrl — post/main.ts 가 창의 onOpened 에서 부른다).
  장면은 주소로 처음 연 데이터에만 얹으므로, 남겨 두면 새로 고칠 때 창에서 고른 데이터에 그 장면이 얹혀 보던 것과 다른 화면이 열린다.
*/
/******************************************************************************/

/** 열린 데이터의 출처. example = 목록(datasets.json) 항목, server = 서버의 해석 결과, file = 사용자가 고르거나 끌어다 놓은 것 */
export type OpenedData =
  | { kind: 'example'; id: string }
  | { kind: 'server'; job: string }
  | { kind: 'file' };

/** 도구막대 꼬리표 글 */
export const SOURCE_LABEL: Record<OpenedData['kind'], string> = { example: '예제', server: '서버 결과', file: '사용자 파일' };

/**
 * 지금 열린 데이터의 출처. 데이터가 없으면 null.
 * serverJob = 열린 데이터가 서버 결과면 그 작업 번호(openServerJob.ts serverJobOf), exampleIds = 목록 항목 아이디들
 */
export function openedDataOf(hasData: boolean, currentId: string | null, exampleIds: readonly string[], serverJob: string | null): OpenedData | null {
  if (!hasData) return null;
  if (serverJob) return { kind: 'server', job: serverJob };
  if (currentId !== null && exampleIds.includes(currentId)) return { kind: 'example', id: currentId };
  return { kind: 'file' };
}

/**
 * 주소를 열린 데이터에 맞춘 새 주소(경로 + ?매개변수 + #뒤). 바꿀 것이 없거나 아무것도 안 열렸으면 null.
 * 돌려받은 주소는 history.replaceState 로 바꾼다(방문 기록을 늘리지 않음)
 */
export function syncedPostUrl(loc: { pathname: string; search: string; hash: string }, opened: OpenedData | null): string | null {
  if (!opened) return null;
  const params = new URLSearchParams(loc.search);
  const want: Record<'data' | 'job', string | null> = {
    data: opened.kind === 'example' ? opened.id : null,
    job: opened.kind === 'server' ? opened.job : null,
  };
  // get 은 매개변수가 없으면 null, 값이 비었으면('?data') '' — 빈 값도 지울 대상이다
  if (params.get('data') === want.data && params.get('job') === want.job) return null;
  for (const key of ['data', 'job'] as const) {
    const v = want[key];
    if (v === null) params.delete(key); else params.set(key, v);
  }
  const q = params.toString();
  return `${loc.pathname}${q ? `?${q}` : ''}${loc.hash}`;
}

/** 장면 매개변수 — 창 안에서 다른 데이터를 열면 지운다 */
export const SCENE_PARAMS = ['scene', 'tab'] as const;

/** 장면 매개변수(scene · tab)를 지운 새 주소. 지울 것이 없으면 null. 다른 매개변수의 순서와 # 뒤는 그대로 */
export function sceneDroppedUrl(loc: { pathname: string; search: string; hash: string }): string | null {
  const params = new URLSearchParams(loc.search);
  if (!SCENE_PARAMS.some((k) => params.has(k))) return null;
  for (const k of SCENE_PARAMS) params.delete(k);
  const q = params.toString();
  return `${loc.pathname}${q ? `?${q}` : ''}${loc.hash}`;
}

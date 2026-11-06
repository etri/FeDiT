// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   openServerJob.ts

서버의 해석 결과 하나(엔진 작업 폴더 results/<작업 번호>/: <이름>.json + <이름>/…vtm)를 결과 폴더로 연다.
주소의 ?job= 과 '데이터 열기' 창(post/openDataDialog.ts) '서버 결과' 목록의 [열기]가 이 함수 하나를 함께 쓴다(post/serverResults.ts).
연 데이터의 아이디는 'server:<작업 번호>' — 도구막대 꼬리표 '서버 결과', 목록의 '열림', 주소의 ?job= 이 이것으로 정해진다(post/openedData.ts).
엔진 API(engine/)는 부르지 않는다. 결과 폴더의 파일만 읽는다(해석 작업은 물리 시뮬레이션 페이지만, 2026-10-21).
*/
/******************************************************************************/
import type { AppCore } from '../core/AppCore';
import { FolderSource, HttpFolder } from '../data/source';
import { resultFolderUrl } from '../data/engineApi';
import { JOB_ID_RE } from '../data/serverJobs';

const PREFIX = 'server:';

/** 지금 연 데이터(app.currentId)가 서버 결과면 그 작업 번호, 아니면 null */
export function serverJobOf(currentId: string | null): string | null {
  return currentId?.startsWith(PREFIX) ? currentId.slice(PREFIX.length) : null;
}

/** fetch 의 연결 실패인지 (브라우저마다 글이 다르다: 'Failed to fetch' · 'NetworkError …' · 'Load failed'). '예제' 줄 오류(examples.ts)도 쓴다 */
export const isConnectionError = (e: unknown): boolean => e instanceof TypeError && /fetch|network|load failed/i.test(e.message);

/**
 * 작업 폴더를 결과 폴더로 연다. 못 열면 예외(지금 열려 있던 데이터는 그대로 남는다).
 * label = 연 뒤의 이름(도구막대·장면 트리 — 서버 결과 목록 줄의 이름). 없으면(?job= 으로 목록보다 먼저 열 때) 결과 폴더의 끝 이름
 */
export async function openServerJob(app: AppCore, jobId: string, label?: string): Promise<void> {
  if (!JOB_ID_RE.test(jobId)) throw new Error('작업 번호 형식이 맞지 않습니다.');
  const url = resultFolderUrl(jobId);
  const http = new HttpFolder(url, url, { autoindex: true });
  // 진행 글('<이름> 읽는 중' — 이 함수와 loadResultFolder 의 첫 글)은 넘겨받은 이름(목록 줄의 이름)으로. 없으면(주소의 ?job=) 폴더 이름(작업 번호) 그대로.
  // 이름만 바꾸고 읽기는 그대로 넘긴다 — 이름을 넘겼으면 loadResultFolder 는 연 뒤의 이름·아이디에 폴더 이름을 쓰지 않는다(label · id 를 받으므로)
  const folder: FolderSource = label ? { name: label, list: (p) => http.list(p), file: (p, s) => http.file(p, s), sub: (p) => http.sub(p) } : http;
  // 폴더를 찾는 동안에도 '불러오는 중'으로 둔다(app.loading) — 그동안 '데이터 열기' 창의 다른 [열기]가 함께 돌지 않게(app.opening). 찾으면 loadResultFolder 가 이어받는다
  app.reportProgress(`${folder.name} 읽는 중`);
  try {
    let found: unknown;
    try { found = await folder.list(); } catch (e) { app.reportProgress(''); throw e; }
    // 없는 번호·results/ 길이 없는 서버. 작업 번호는 글에 넣지 않는다 — 부르는 쪽(목록 줄 · ?job= 맨 위 줄 '…(작업 <번호>): ')이 이미 보인다
    if (!found) { app.reportProgress(''); throw new Error('서버에 작업 폴더가 없습니다.'); }
    await app.loadResultFolder(folder, { id: PREFIX + jobId, label });
  } catch (e) {
    if (isConnectionError(e)) throw new Error('서버 연결이 끊겼습니다.'); // 브라우저의 영어 글을 화면에 그대로 보이지 않게
    throw e;
  }
}

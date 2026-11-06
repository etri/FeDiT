// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   dropOpen.ts

끌어다 놓은 것을 연다 — 3D 화면(post/main.ts)과 '데이터 열기' 창(post/openDataDialog.ts)이 함께 쓴다.
폴더·.vtm 묶음 → 결과 폴더, ZIP 하나 → 결과 ZIP(ui/openZip.ts), 그 밖 낱개 파일 → CSV 를 연 뒤 .stl 을 형상으로 더한다(각각 놓은 차례대로 —
CSV 를 열면 형상이 비워지므로 STL 이 뒤).
무엇으로 열지는 순수 함수 dropPlan(openDialogRules.ts). 창에 STL 만 놓으면 열지 않고 stlNotDataText(데이터가 있는지에 따라 두 글)를 던진다.
다른 데이터를 여는 중(app.opening)이면 열지 않고 BUSY_TEXT 를 던진다 — 늦게 끝난 쪽이 이기지 않게(목록의 [열기]·파일 단추와 같은 기준).
저장 시점을 읽는 중(재생 · 슬라이더)은 거절하지 않는다 — 새로 여는 일이 그 읽기를 버린다(AppCore.beginOpen).
폴더 핸들·파일 목록은 drop 이벤트 안에서(기다리기 전에) 잡아야 하므로 takeDrop 을 이벤트 안에서 먼저 부른다.
*/
/******************************************************************************/
import type { AppCore } from '../core/AppCore';
import { DirectoryHandleFolder, FolderSource, folderFromDataTransfer } from '../data/source';
import { openZipFile } from '../ui/openZip';
import { BUSY_TEXT, dropPlan, stlNotDataText } from './openDialogRules';

/** drop 이벤트 안에서 잡아 둔 것 */
export interface Dropped {
  files: File[];
  folder: Promise<FolderSource | null>;
}

/** drop 이벤트 안에서 부른다 — 이벤트가 끝나면 항목이 비워진다 */
export function takeDrop(dt: DataTransfer): Dropped {
  return { folder: folderFromDataTransfer(dt), files: Array.from(dt.files ?? []) };
}

/** 끌어 온 것에 파일이 있는가 (글자·링크를 끌 때는 창 테두리를 강조하지 않는다) */
export const hasFiles = (dt: DataTransfer | null): boolean => !!dt && Array.from(dt.types ?? []).includes('Files');

/**
 * 놓은 것을 연다. 데이터(결과 폴더·ZIP·CSV)를 열었으면 true, 형상(STL)만 더했거나 놓은 파일이 없으면 false.
 * 못 열면 예외(한국어 한 줄) — 그전에 열려 있던 데이터는 그대로다.
 */
export async function openDropped(app: AppCore, d: Dropped, where: 'dialog' | 'viewport'): Promise<boolean> {
  if (app.opening) throw new Error(BUSY_TEXT);
  const folder = await d.folder;
  if (app.opening) throw new Error(BUSY_TEXT); // 폴더 핸들을 기다리는 사이 다른 열기가 시작됨
  const plan = dropPlan(d.files.map((f) => f.name), folder instanceof DirectoryHandleFolder, !!folder, where);
  switch (plan.kind) {
    case 'none':
      return false;
    case 'stl-only':
      throw new Error(stlNotDataText(!!app.dataset));
    case 'zip':
      await openZipFile(app, d.files[plan.index]);
      return true;
    case 'folder':
      await app.loadResultFolder(folder!, { label: plan.label });
      return true;
    case 'files': {
      // CSV 를 먼저 열고(놓은 차례) STL 은 그 뒤에 더한다(놓은 차례) — CSV 를 열면 형상이 비워지므로(AppCore.loadCsvText), STL 을 먼저 더하면 바로 지워진다
      for (const i of plan.csv) {
        const f = d.files[i];
        // CSV 는 읽는 동안에도 '불러오는 중'으로 둔다 — 그동안 다른 [열기]가 함께 돌지 않게(읽기 덮개 · 창의 결과 줄에 진행 글)
        app.reportProgress(`${f.name} 불러오는 중`);
        try { app.loadCsvText(await f.text(), f.name); }
        finally { app.reportProgress(''); }
      }
      for (const i of plan.stl) app.loadStlBuffer(await d.files[i].arrayBuffer(), d.files[i].name);
      return plan.csv.length > 0;
    }
  }
}

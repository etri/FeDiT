// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   fileOpen.ts

'데이터 열기' 창(post/openDataDialog.ts)의 '파일' 묶음. 2026-11-05 전에는 패널 데이터 화면(ui/panel.ts)에 있던 단추를 옮겼다.
위→아래: 소제목 '파일'(물음표) / [결과 폴더 열기](주 단추) [결과 ZIP 열기] [CSV 열기] / 결과 줄(진행 글 · 오류, 평소에는 숨음).
놓기는 창 전체(뒤판 포함)가 받는다 — 끄는 동안의 강조는 창 테두리(components.css .modal.drop). 끌어다 놓아도 된다는 설명은 '파일' 물음표 안에만 둔다
(화면 글은 상태·결과·오류만 — 2026-11-05 옅은 안내 한 줄을 뺐다. 그전의 점선 놓기 상자는 눌러도 반응이 없어 단추로 오해할 수 있었다).
STL 은 데이터가 아니라 여기 두지 않는다 — 형상 편집 화면의 [STL 추가](ui/panel.ts addStl) 또는 3D 화면에 놓기.
- 결과 폴더: 폴더 선택 창(Chrome·Edge). 없거나 막힌 화면(다른 주소에서 띄운 iframe)이면 폴더째 올리기 — 파일 입력은 iframe 안에서도 열린다.
  막힘을 미리 알 수 있으면 클릭 안에서 바로 연다(기다린 뒤에 열면 브라우저가 사용자 동작으로 보지 않을 수 있다).
- 결과 ZIP: 작으면 메모리에, 크면 사용자가 고른 폴더에 풀어서 연다(ui/openZip.ts).
- 여는 일은 창이 맡는다(opts.run — 여는 동안 막기 · 결과 줄 · 성공하면 닫기). 이 묶음은 단추·숨은 입력·결과 줄만 가진다.
  run 에 넘기는 일은 데이터를 열었으면 true, 열지 않고 끝났으면(창을 닫음 · 폴더째 올리기 창으로 넘김) false 를 돌려준다.
  run 에 누른 단추도 넘긴다 — 여는 동안 단추가 막혀 초점이 빠지므로, 못 열고 끝나면 창이 초점을 그 단추로 돌린다.
- 결과 줄은 두 줄: 회색 진행 글(평소 숨김)과 빨간 오류(평소 숨김). 여는 중에 또 열려고 하면 진행 글 아래 오류 자리에 '다른 데이터를 불러오는 중입니다.'.
*/
/******************************************************************************/
import type { AppCore } from '../core/AppCore';
import { DirectoryHandleFolder, FileListFolder } from '../data/source';
import { folderPickerBlocked } from '../data/zipInput';
import { button, el, withHelp } from '../ui/dom';
import { openZipFile } from '../ui/openZip';
import { BUSY_TEXT } from './openDialogRules';

export interface FileOpenOptions {
  /** 여는 일 하나를 맡긴다(창이 막기·결과 줄·성공하면 닫기를 한다). 일은 데이터를 열었으면 true. from = 누른 단추 */
  run(task: () => Promise<boolean>, from?: HTMLElement): void;
}

export interface FileOpen {
  /** '파일' 묶음 */
  root: HTMLElement;
  /** 결과 줄: progress = 회색 진행 글, error = 빨간 오류. 빈 글이면 그 줄을 숨김 */
  setResult(progress: string, error: string): void;
  /** 여는 동안 단추를 막는다 */
  setDisabled(v: boolean): void;
}

export function mountFileOpen(app: AppCore, opts: FileOpenOptions): FileOpen {
  const root = el('div', 'srv');
  const title = withHelp(el('div', 'sub', '파일'), [
    '결과 폴더·ZIP·CSV를 이 창이나 3D 화면에 끌어다 놓아도 열립니다.',
    folderPickerBlocked() // 다른 주소에서 띄운 iframe 안이면 폴더를 고를 수 없다 (페이지가 떠 있는 동안 바뀌지 않음)
      ? '결과 ZIP은 해석엔진이 내려준 파일 그대로 열리며(안에 작업 폴더가 있어도 찾습니다), 풀면 256 MB를 넘는 ZIP은 PC에서 먼저 푼 뒤 "결과 폴더 열기"로 그 폴더를 고릅니다.'
      : '결과 ZIP은 해석엔진이 내려준 파일 그대로 열리며(안에 작업 폴더가 있어도 찾습니다), 풀면 256 MB를 넘는 ZIP은 풀어 둘 폴더를 고릅니다(Chrome·Edge).',
  ]);

  // ---------- 숨은 입력 ----------
  const csvInput = el('input'); csvInput.type = 'file'; csvInput.accept = '.csv,.txt,.tsv'; csvInput.hidden = true;
  csvInput.addEventListener('change', () => {
    const f = csvInput.files?.[0]; csvInput.value = '';
    if (!f) return;
    opts.run(async () => {
      // 읽는 동안에도 '불러오는 중'으로 둔다 — 결과 줄에 진행 글, 그동안 목록의 [열기]도 막힌다
      app.reportProgress(`${f.name} 불러오는 중`);
      try { app.loadCsvText(await f.text(), f.name); }
      finally { app.reportProgress(''); }
      return true;
    }, csvBtn);
  });
  const dirInput = el('input'); dirInput.type = 'file'; dirInput.hidden = true; dirInput.setAttribute('webkitdirectory', ''); dirInput.setAttribute('multiple', '');
  dirInput.addEventListener('change', () => {
    const files = Array.from(dirInput.files ?? []); dirInput.value = '';
    if (!files.length) return;
    opts.run(async () => { await app.loadResultFolder(new FileListFolder(files)); return true; }, folderBtn);
  });
  const zipInput = el('input'); zipInput.type = 'file'; zipInput.accept = '.zip'; zipInput.hidden = true;
  zipInput.addEventListener('change', () => {
    const f = zipInput.files?.[0]; zipInput.value = '';
    if (!f) return;
    opts.run(async () => { await openZipFile(app, f); return true; }, zipBtn);
  });

  // 결과 폴더: 폴더 선택 창. 거절되면 클릭 허가가 남아 있을 때 폴더째 올리기 창으로 대신 열고, 없으면 그 사실만 알린다
  const openResultFolder = async (): Promise<boolean> => {
    if (!window.showDirectoryPicker || folderPickerBlocked()) { dirInput.click(); return false; }
    let handle: FileSystemDirectoryHandle;
    try { handle = await window.showDirectoryPicker({ id: 'cfd-result', mode: 'read' }); }
    catch (e) {
      if ((e as { name?: unknown } | null)?.name === 'AbortError') return false; // 사용자가 창을 닫음
      const canOpen = (navigator as { userActivation?: { isActive: boolean } }).userActivation?.isActive ?? true;
      if (canOpen) { dirInput.click(); return false; }
      throw new Error("폴더 선택 창을 열지 못했습니다. '결과 폴더 열기'를 다시 누르거나 폴더를 이 창에 끌어다 놓아 주세요.");
    }
    // 고르는 사이 다른 열기가 시작됐으면(주소의 ?data= 목록이 그사이 도착 등) 열지 않는다 — 늦게 끝난 쪽이 이기지 않게(놓기 dropOpen.ts 와 같다)
    if (app.opening) throw new Error(BUSY_TEXT);
    await app.loadResultFolder(new DirectoryHandleFolder(handle));
    return true;
  };

  // ---------- 단추 · 결과 줄 ----------
  const folderBtn = button('결과 폴더 열기', () => opts.run(openResultFolder, folderBtn), 'primary', 'folder');
  const zipBtn = button('결과 ZIP 열기', () => zipInput.click(), 'normal', 'archive');
  const csvBtn = button('CSV 열기', () => csvInput.click(), 'normal', 'file');
  const btns = el('div', 'btn-row');
  btns.append(folderBtn, zipBtn, csvBtn);
  const progressLine = el('div', 'file-result'); // 자주 바뀌므로(블록 3/12 …) 화면 읽기 프로그램에 매번 읽히지 않게 aria-live 를 달지 않는다
  const errorLine = el('div', 'file-result error');
  errorLine.setAttribute('aria-live', 'polite');
  root.append(title, btns, progressLine, errorLine, csvInput, dirInput, zipInput);

  return {
    root,
    setResult(progress, error) {
      if (progressLine.textContent !== progress) progressLine.textContent = progress;
      if (errorLine.textContent !== error) errorLine.textContent = error;
    },
    setDisabled(v) {
      for (const b of [folderBtn, zipBtn, csvBtn]) b.disabled = v;
    },
  };
}

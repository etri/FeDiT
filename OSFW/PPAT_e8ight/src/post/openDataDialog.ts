// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   openDataDialog.ts

후처리 '데이터 열기' 창 (2026-11-05): 데이터를 골라야 다음 단계로 넘어간다.
A안 = 한 단으로 세로로 쌓는 창. 막기 = 데이터가 없으면 창을 닫을 수 없다(나갈 길은 창 머리의 '처음 화면' 링크, 실행·대기 중인 해석이 있으면 서버 결과의
'물리 시뮬레이션에서 보기', 브라우저 뒤로 가기). 창 꼴은 공용 부품 ui/modal.ts(뒤판 + 가운데 창, 뒤 화면 inert, Esc·뒤판·Tab·키 전파 규칙).

  데이터 열기                                   [처음 화면] (데이터 없음) | x (데이터 있음)
  (데이터를 연 뒤 바꾼 것이 있으면) 열면 지금 레이어 n개와 더한 형상 m개가 지워집니다. — 해당하는 것만
  (주소 오류) 장면을 얹을 데이터가 없습니다: … 등 — 데이터를 열면 사라진다
  서버 결과 (?) [새로고침] / 실행 중 한 줄 / 줄 목록(칸 높이 40vh 안에서 스크롤) / [더 보기]     ← serverResults.ts
  파일 (?) / [결과 폴더 열기] [결과 ZIP 열기] [CSV 열기] / 결과 줄(진행 · 오류) ← fileOpen.ts
  예제 (?) / 줄 목록                                                                            ← examples.ts

- 열림·닫힘 규칙은 순수 함수 dialogView(openDialogRules.ts): 데이터 없음 → 못 닫음 · 머리에 '처음 화면'. 데이터 있음 → x · Esc · 뒤판으로 닫힘.
  여는 동안(app.opening — 데이터를 여는 중, 또는 '파일' 묶음에서 시작한 열기가 안 끝남) → 어떤 길로도 닫히지 않고 x 도 막힌다. 창 안의 여는 단추도 모두 막힌다
  (목록의 [열기]는 각 묶음이 app.opening 으로, 파일 단추·놓기는 여기서). 열기를 중간에 취소하는 단추는 없다(엔진에도 중간 취소가 없음).
  저장 시점을 읽는 중(재생 · 슬라이더)은 '여는 중'이 아니다 — 창을 열면 재생을 멈춘다(창이 뒤 화면을 막아 재생 막대·Space 로 멈출 수 없으므로).
- 성공하면 닫는다: 창 안에서 누른 열기(목록 줄의 [열기] — 각 묶음의 onOpened, 파일 단추·놓기 — run)가 성공으로 끝났을 때. 닫기 바로 전에 opts.onOpened(패널을 데이터 화면으로).
  이때 초점은 [데이터 열기] 단추로 돌리지 않고 버린다 — Space 가 곧바로 재생/정지로 간다(단추에 남으면 Space 가 창을 다시 띄운다). x · Esc · 뒤판으로 닫으면 연 자리로 돌린다.
  실패하면 창은 그대로이고 오류는 누른 줄 또는 '파일' 결과 줄에 남는다(그전 데이터도 그대로). 초점은 누른 단추로 돌린다(막히며 빠졌으면).
- 진행 글: 목록 줄의 열기는 그 줄(주소의 ?job= 은 서버 결과 맨 위에도), '파일' 묶음의 열기와 창 밖에서 시작한 열기(3D 화면에 놓기 등)는 '파일' 결과 줄(fileLineView).
  읽기 덮개는 창에 가려지므로, 창이 뜬 동안 어느 열기든 창 안 어딘가에 진행 글이 있다. 창을 다시 띄우면 '파일' 결과 줄의 지난 오류·거절 알림은 지운다.
- 레이어 경고: 데이터를 연 직후의 장면 서명(openDialogRules.ts sceneMark — 레이어 · 데이터 노드의 표시 · 형상 배치)을 데이터가 다 열린 뒤 한 번 재 두고,
  창을 그릴 때 지금과 견준다(editsSince). 기본 레이어(Slice 1 / Clip 1)만 그대로 있으면 뜨지 않는다.
- 끌어다 놓기: 창과 뒤판 어디에 놓아도 받는다(놓는 동안 창 테두리 강조 — 뒤판이 덮은 3D 화면 자리에 놓아도 연다). 처리는 dropOpen.ts(3D 화면과 같은 함수).
  STL 만 놓으면 열지 않고 결과 줄에 알린다. 여는 중에 놓으면 결과 줄에 '다른 데이터를 불러오는 중입니다.'(여는 일이 끝나면 지운다).
- DOM 과 구독은 한 벌(페이지를 열 때 만들고 숨겼다 보였다). 목록은 페이지를 열 때 한 번 읽고, 창을 다시 열어도 저절로 다시 읽지 않는다(새로고침 단추).
- 엔진 API(engine/)는 부르지 않는다 — 결과 파일만 읽는다(serverResults.ts).
*/
/******************************************************************************/
import type { AppCore } from '../core/AppCore';
import { callout, el, homeLink } from '../ui/dom';
import { icon } from '../ui/icons';
import { createModal } from '../ui/modal';
import { hasFiles, openDropped, takeDrop } from './dropOpen';
import { Examples, mountExamples } from './examples';
import { mountFileOpen } from './fileOpen';
import { BUSY_TEXT, DialogView, NO_EDITS, SceneMark, dialogView, editsSince, fileLineView, sceneMark } from './openDialogRules';
import { ServerResults, mountServerResults } from './serverResults';

export interface OpenDataDialogOptions {
  /** 목록 파일 읽기(app.loadCatalog) — '예제' 묶음이 줄을 채우고, 못 읽으면 그 자리에 알린다 */
  catalog: Promise<unknown>;
  /** 창 안에서 연 데이터가 열렸을 때, 창을 닫기 바로 전 */
  onOpened?: () => void;
}

export interface OpenDataDialog {
  /** 창 맨 위 '서버 결과' 묶음 (주소의 ?job= 이 open · showJobError 를 쓴다) */
  serverResults: ServerResults;
  /** 창 맨 아래 '예제' 묶음 (주소의 ?data= 가 open · notFound 를 쓴다) */
  examples: Examples;
  /** 창을 연다. returnFocus = 닫은 뒤 초점을 돌릴 요소(null = 3D 화면 — 아무 요소에도 두지 않음). 없으면 지금 초점이 있는 요소. 이미 떠 있으면 그대로 */
  open(returnFocus?: HTMLElement | null): void;
  isOpen(): boolean;
  /** 데이터를 여는 중인가 — 앱이 여는 중(app.opening)이거나, '파일' 묶음에서 시작한 열기가 안 끝남(폴더 선택 창이 떠 있는 동안 포함) */
  isBusy(): boolean;
  /** 제목 아래 안내 한 줄(주소의 ?scene= 인데 데이터 없음 · 주소 매개변수 오류). 무엇이든 데이터를 열면 사라진다 */
  showUrlNote(msg: string): void;
  /** '파일' 결과 줄에 오류 (3D 화면에 놓았다가 못 열었을 때). 무엇이든 데이터를 열면 사라진다 */
  showFileError(msg: string): void;
}

const errText = (e: unknown): string => (e instanceof Error ? e.message : String(e));

export function mountOpenDataDialog(app: AppCore, opts: OpenDataDialogOptions): OpenDataDialog {
  // ---------- 상태 ----------
  let fileBusy = false;          // '파일' 묶음(단추·놓기)에서 시작한 열기가 아직 안 끝남
  let fileMsg = '';              // '파일' 결과 줄의 오류
  let fileMsgAt: unknown = null; // 그 오류를 띄울 때 열려 있던 데이터 (무엇이든 새로 열면 지운다)
  let busyNotice = false;        // 여는 중에 또 열려고 해서 거절함 — 결과 줄에 BUSY_TEXT (여는 일이 끝나면 지운다)
  let urlNote = '';              // 주소에서 온 안내
  let urlNoteAt: unknown = null;
  let view: DialogView = dialogView({ hasData: false, busy: false });
  const isBusy = (): boolean => fileBusy || app.opening;

  // ---------- 레이어 경고: 데이터를 연 직후의 장면 서명 ----------
  // 데이터가 바뀌고 다 열린 뒤(app.opening 이 풀린 첫 알림 — 결과 폴더는 형상을 앉히고 화면을 맞춘 뒤) 한 번 잰다. 경고는 그 뒤에 바뀐 것만.
  // 아래 paint 구독보다 먼저 듣는다(같은 알림에서 새 서명으로 그리게)
  const markNow = (): SceneMark => sceneMark(app.layers, app.root.view, app.objects.list);
  let baseFor: unknown = null;       // 서명을 잰 데이터
  let base: SceneMark | null = null; // 그 데이터를 연 직후의 장면 서명
  app.subscribe(() => {
    if (app.opening || app.dataset === baseFor) return;
    baseFor = app.dataset;
    base = app.dataset ? markNow() : null;
  });

  /** 창 안에서 누른 열기가 성공: 패널을 데이터 화면으로 돌리고 창을 닫는다. 초점은 버린다(Space 가 재생으로 — modal.ts) */
  const succeeded = () => {
    if (!modal.isOpen()) return;
    opts.onOpened?.();
    modal.close({ restoreFocus: false });
  };
  /** 못 열고 끝났을 때: 누른 단추가 막히며 초점이 빠졌으면 그 단추로 돌린다 */
  const refocus = (to?: HTMLElement) => {
    const at = document.activeElement;
    if (to && modal.isOpen() && to.isConnected && (!at || at === document.body)) to.focus();
  };

  // ---------- 묶음 ----------
  const serverResults = mountServerResults(app, { onOpened: succeeded }); // 페이지를 열 때 서버의 해석 목록을 한 번 읽는다
  const examples = mountExamples(app, { catalog: opts.catalog, onOpened: succeeded });
  /**
   * '파일' 묶음의 여는 일 하나(단추 · 놓기). 일은 클릭 안에서 바로 부른다 — 폴더 선택 창은 사용자 동작 안에서만 열린다.
   * 일이 데이터를 열었으면(true) 창을 닫고, 못 열면 결과 줄에 오류. 다른 데이터를 여는 중이면 시작하지 않고 알린다(늦게 끝난 쪽이 이기지 않게)
   */
  const run = (task: () => Promise<boolean>, from?: HTMLElement) => {
    if (isBusy()) { busyNotice = true; paint(); return; }
    fileBusy = true;
    fileMsg = '';
    busyNotice = false;
    let p: Promise<boolean>;
    try { p = task(); } catch (e) { p = Promise.reject(e); }
    paint();
    p.then(
      (opened) => { fileBusy = false; paint(); if (opened) succeeded(); else refocus(from); },
      (e) => {
        fileBusy = false;
        const msg = errText(e);
        if (msg === BUSY_TEXT) busyNotice = true; // 기다리는 사이 다른 열기가 시작됨 — 그 열기가 끝나면 지운다
        else { fileMsg = msg; fileMsgAt = app.dataset; }
        paint();
        refocus(from);
      },
    );
  };
  const files = mountFileOpen(app, { run });

  // ---------- 창 ----------
  const title = el('h2', 'modal-title', '데이터 열기');
  title.id = 'open-data-title';
  const home = homeLink(); // 데이터가 없을 때의 나갈 길 (잃을 것이 없으므로 묻지 않고 옮긴다)
  const closeBtn = el('button', 'icon-btn modal-close');
  closeBtn.type = 'button';
  closeBtn.title = '닫기';
  closeBtn.setAttribute('aria-label', '닫기');
  closeBtn.append(icon('x'));
  closeBtn.addEventListener('click', () => { modal.requestClose(); });
  const head = el('div', 'modal-head');
  head.append(title, home, closeBtn);
  const warn = callout('warn');   // 레이어 경고 (결과를 알리는 글)
  const note = callout('warn');   // 주소에서 온 안내
  note.root.setAttribute('aria-live', 'polite');
  const body = el('div', 'modal-body');
  body.append(warn.root, note.root, serverResults.root, files.root, examples.root);
  const modal = createModal({ title, content: [head, body], canClose: () => view.canClose, scrollArea: body, className: 'open-data' });
  const win = modal.window;

  /** 머리 오른쪽 · 경고 · 안내 · 파일 단추 막힘 · 결과 줄을 맞춘다 (글은 바뀔 때만 쓴다) */
  const paint = () => {
    if (urlNote && app.dataset !== urlNoteAt) urlNote = '';
    if (fileMsg && app.dataset !== fileMsgAt) fileMsg = '';
    // 새 데이터가 아직 다 안 열렸으면(서명을 재기 전) 견주지 않는다 — 옛 데이터의 서명과 견준 엉뚱한 경고가 잠깐 뜨지 않게
    const edits = app.dataset && app.dataset === baseFor ? editsSince(base, markNow()) : NO_EDITS;
    view = dialogView({ hasData: !!app.dataset, busy: isBusy(), edits });
    home.hidden = view.head !== 'home';
    closeBtn.hidden = view.head !== 'close';
    closeBtn.disabled = view.closeDisabled;
    if (warn.text.textContent !== view.layerWarning) warn.text.textContent = view.layerWarning;
    warn.root.hidden = !view.layerWarning;
    if (note.text.textContent !== urlNote) note.text.textContent = urlNote;
    note.root.hidden = !urlNote;
    files.setDisabled(view.openDisabled);
    // 결과 줄: 진행 글은 '파일' 묶음의 열기 또는 창 밖에서 시작한 열기(목록 줄의 열기는 그 줄이 보인다), 오류는 거절 알림 또는 마지막 오류
    const line = fileLineView({
      fileBusy, opening: app.opening, listBusy: serverResults.isBusy() || examples.isBusy(), busyNotice, fileMsg,
    });
    busyNotice = line.keepNotice;
    files.setResult(line.showProgress ? app.loading : '', line.error);
    if (view.openDisabled) win.classList.remove('drop');
  };
  app.subscribe(() => { if (modal.isOpen()) paint(); }); // 닫혀 있는 동안은 열 때 맞춘다

  // ---------- 끌어다 놓기: 창과 뒤판(층 전체)이 받는다 ----------
  // dragenter/dragleave 는 안쪽 요소를 지날 때마다 오므로 깊이를 세어 층을 완전히 벗어났을 때만 강조를 끈다.
  // 뒤판의 기본 처리(modal.ts — '안 됨' 표시)보다 뒤에 듣고 dropEffect 를 'copy' 로 다시 정한다
  const layer = modal.layer;
  let dragDepth = 0;
  layer.addEventListener('dragenter', (e) => {
    if (!hasFiles(e.dataTransfer)) return;
    e.preventDefault();
    dragDepth++;
    if (!view.openDisabled) win.classList.add('drop');
  });
  layer.addEventListener('dragover', (e) => {
    if (!hasFiles(e.dataTransfer)) return;
    e.preventDefault(); // 받지 않으면 브라우저가 그 파일로 페이지를 옮겨 간다 (여는 중이면 놓은 뒤 알린다)
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
  });
  layer.addEventListener('dragleave', (e) => {
    if (!hasFiles(e.dataTransfer)) return;
    dragDepth = Math.max(0, dragDepth - 1);
    if (!dragDepth) win.classList.remove('drop');
  });
  layer.addEventListener('drop', (e) => {
    e.preventDefault();
    dragDepth = 0;
    win.classList.remove('drop');
    const dt = e.dataTransfer;
    if (!dt || !hasFiles(dt)) return;
    const dropped = takeDrop(dt); // 이벤트 안에서 먼저 잡는다
    run(() => openDropped(app, dropped, 'dialog'));
  });

  return {
    serverResults,
    examples,
    open(returnFocus) {
      if (modal.isOpen()) return;
      if (app.playing) app.pause(); // 창이 뒤 화면을 막는 동안 재생 막대·Space 로 멈출 수 없다
      // 다시 띄운 창은 '파일' 결과 줄의 지난 결과 없이 (지난 창에서 STL 만 놓았던 글 등). 창 밖에서 못 연 오류는 창을 연 뒤 showFileError 로 쓴다(post/main.ts)
      fileMsg = ''; busyNotice = false;
      paint();
      body.scrollTop = 0;
      modal.open(returnFocus);
    },
    isOpen: () => modal.isOpen(),
    isBusy,
    showUrlNote(msg) { urlNote = msg; urlNoteAt = app.dataset; paint(); },
    showFileError(msg) { fileMsg = msg; fileMsgAt = app.dataset; paint(); },
  };
}

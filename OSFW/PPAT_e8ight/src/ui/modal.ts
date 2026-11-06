// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   modal.ts

공용 모달 부품 — 화면 가운데에 뜨고, 떠 있는 동안 뒤 화면(3D 화면·패널·도구막대)은 눌리지 않는 창. 페이지와 상관없이 쓴다
(지금은 후처리 '데이터 열기' 창 post/openDataDialog.ts 만 쓴다).
- 브라우저 기본 <dialog> 를 쓰지 않는다: <dialog> 는 맨 위 층(z-index 와 상관없이 모든 것 위)에 그려져, body 에 붙는 물음표 설명 창(z 50, dom.ts help)과
  메뉴·확인 상자(z 60)가 그 밑에 깔린다. 대신 div 뒤판 + 창을 body 에 붙이고 쌓임 순서를 --z-modal(40, tokens.css)로 둔다.
- 한 번만 만들고 숨겼다 보였다 한다(안의 DOM 과 구독을 한 벌로 지키려고). 열면 #app 에 inert(누르기·초점이 못 가게 막는 속성)를 걸고,
  뒤 화면 물음표에 고정해 둔 설명 창을 닫는다(dom.ts closeHelp — 누를 수 없게 된 물음표의 설명이 창 위에 남지 않게).
- 창: role=dialog · aria-modal=true · aria-labelledby(제목). 처음 초점은 창 자체(tabindex -1). 초점이 창에 있을 때 PageUp·PageDown·Home·End·화살표·Space 는
  창 안을 넘긴다(창 자체는 스크롤하지 않으므로 브라우저 기본 동작으로는 움직이지 않는다). 넘길 칸은 scrollTarget: 스크롤 영역(scrollArea)이 그 방향으로
  움직일 수 있으면 그것, 끝에 닿았거나 넘치지 않으면 그 안에서 보이고 그 방향으로 움직일 수 있는 첫 스크롤 칸(데이터 열기 창의 서버 결과 목록처럼 칸 높이가 묶인 목록).
- 닫으면 열 때 초점이 있던 요소로 돌린다(넘긴 요소가 있으면 그것, null 이면 아무 데도 두지 않음). close({ restoreFocus: false }) 는 돌리지 않는다
  — 열기가 성공해 닫힐 때: [데이터 열기] 단추에 초점이 남으면 Space(재생/정지, ui/timeBar.ts — 단추에 초점이 있으면 단추에 넘김)가 창을 다시 띄운다.
- 닫기: canClose() 가 참일 때만 Esc · 뒤판 누르기 · close 단추(페이지가 단 것)로 닫힌다. 거짓이면 Esc·뒤판은 아무 일도 하지 않고 뒤판을 누르면 초점만 창으로 옮긴다.
- 키: 창 안에서 난 키 이벤트는 Tab 말고는 전파를 끊는다 — Space(재생/정지, ui/timeBar.ts)와 형상 편집 단축키(edit/editor.ts)는 window 에서 받으므로 뒤로 새지 않는다.
  초점이 창 밖(body)에 있을 때 누른 키도 document 에서 같은 규칙으로 끊는다(window 보다 먼저 받는다).
  Esc 는 물음표 설명이 떠 있으면 설명 창이 capture 단계에서 먼저 받아 끝낸다(dom.ts) — 그래서 Esc 는 설명만 닫는다.
  Tab 은 브라우저에 맡기지 않고 직접 옮기며 창 안에서 돈다(마지막 다음은 처음 — iframe 안에서도 초점이 부모 화면으로 빠지지 않게).
  초점이 갈 수 있는 목록 밖(막힌 단추 등 — 막힐 때 초점을 그대로 두는 브라우저)에 있어도 문서 차례로 다음·이전 요소를 고른다.
- 뒤판에 파일을 놓으면 브라우저가 그 파일로 페이지를 옮겨 가므로 막는다(놓기 표시는 '안 됨'). 페이지가 layer 에서 받으면 그쪽이 이긴다(데이터 열기 창은 받는다).
*/
/******************************************************************************/
import { closeHelp, el } from './dom';

export interface ModalOptions {
  /** 창의 이름이 되는 제목 요소 (aria-labelledby). id 가 없으면 붙인다 */
  title: HTMLElement;
  /** 창 안에 차례대로 놓을 요소 */
  content: HTMLElement[];
  /** 지금 닫을 수 있는지 (Esc · 뒤판 · requestClose) */
  canClose: () => boolean;
  /** 창 안 스크롤 영역 — 초점이 창 자체에 있을 때 넘김 키(PageDown 등)를 여기에 준다(끝에 닿았거나 넘치지 않으면 그 안의 스크롤 칸에) */
  scrollArea?: HTMLElement;
  /** 창(.modal)에 더할 클래스 */
  className?: string;
  /** 열 때 inert 를 걸 뒤 화면 (기본 #app) */
  inertTarget?: HTMLElement | null;
}

export interface Modal {
  /** 창 (.modal, role=dialog) */
  window: HTMLElement;
  /** 뒤판 (.modal-backdrop) */
  backdrop: HTMLElement;
  /** 뒤판 + 창을 담은 층 (.modal-layer) — 창과 뒤판 어디에 놓아도 받으려면 여기에 놓기 처리를 붙인다 */
  layer: HTMLElement;
  /** 연다. returnFocus = 닫은 뒤 초점을 돌릴 요소(null = 아무 데도 두지 않음 → 3D 화면 단축키가 바로 듣는다). 없으면 지금 초점이 있는 요소 */
  open(returnFocus?: HTMLElement | null): void;
  /** 닫을 수 있으면(canClose) 닫는다. 닫았으면 true. 초점은 열 때 정한 자리로 */
  requestClose(): boolean;
  /** 규칙과 상관없이 닫는다 (열기가 성공했을 때). restoreFocus false = 초점을 돌리지 않고 버린다 */
  close(opts?: { restoreFocus?: boolean }): void;
  isOpen(): boolean;
}

let seq = 0;

/** 창 안에서 Tab 으로 갈 수 있는 요소 (보이고 막히지 않은 것, 문서 차례) */
function focusables(root: HTMLElement): HTMLElement[] {
  const sel = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  return Array.from(root.querySelectorAll<HTMLElement>(sel)).filter((e) => !e.closest('[hidden]') && !e.closest('[inert]') && e.getClientRects().length > 0);
}

/** Tab(뒤로 = shift)으로 갈 다음 요소. at 이 목록에 없으면 문서 차례로 at 다음(이전)의 첫 요소, 없으면 처음(끝)으로 돈다 */
function nextFocus(list: HTMLElement[], at: Element | null, back: boolean, win: HTMLElement): HTMLElement {
  const n = list.length;
  const i = at ? list.indexOf(at as HTMLElement) : -1;
  if (i >= 0) return list[(i + (back ? n - 1 : 1)) % n];
  if (at && at !== win && win.contains(at)) {
    const found = back
      ? [...list].reverse().find((x) => at.compareDocumentPosition(x) & Node.DOCUMENT_POSITION_PRECEDING)
      : list.find((x) => at.compareDocumentPosition(x) & Node.DOCUMENT_POSITION_FOLLOWING);
    if (found) return found;
  }
  return back ? list[n - 1] : list[0];
}

/** x 가 dir 방향(1 = 아래, -1 = 위)으로 더 넘어갈 수 있는가 */
const canScroll = (x: HTMLElement, dir: number): boolean => (dir > 0 ? x.scrollTop + x.clientHeight < x.scrollHeight - 1 : x.scrollTop > 0);

/**
 * 넘김 키를 줄 칸: area 가 dir 방향으로 움직일 수 있으면 area. 아니면 area 안에서 지금 보이고(숨지 않고 area 의 보이는 자리에 걸친) 그 방향으로
 * 움직일 수 있는 첫 스크롤 칸(문서 차례). 없으면 area — 본문이 먼저 넘어가고, 본문이 끝에 닿거나 넘치지 않으면 목록이 넘어간다
 */
function scrollTarget(area: HTMLElement, dir: number): HTMLElement {
  if (canScroll(area, dir)) return area;
  const box = area.getBoundingClientRect();
  for (const x of area.querySelectorAll<HTMLElement>('*')) {
    if (!canScroll(x, dir)) continue;
    const oy = getComputedStyle(x).overflowY;
    if (oy !== 'auto' && oy !== 'scroll') continue;
    const r = x.getBoundingClientRect();
    if (x.getClientRects().length > 0 && r.bottom > box.top && r.top < box.bottom) return x;
  }
  return area;
}

export function createModal(opts: ModalOptions): Modal {
  const layer = el('div', 'modal-layer');
  const backdrop = el('div', 'modal-backdrop');
  const win = el('div', opts.className ? `modal ${opts.className}` : 'modal');
  if (!opts.title.id) opts.title.id = `modal-title-${++seq}`;
  win.setAttribute('role', 'dialog');
  win.setAttribute('aria-modal', 'true');
  win.setAttribute('aria-labelledby', opts.title.id);
  win.tabIndex = -1;
  win.append(...opts.content);
  layer.append(backdrop, win);
  layer.hidden = true;
  document.body.append(layer);

  let open = false;
  let returnTo: HTMLElement | null = null;
  const inertTarget = (): HTMLElement | null => (opts.inertTarget !== undefined ? opts.inertTarget : document.getElementById('app'));

  const close = (o: { restoreFocus?: boolean } = {}) => {
    if (!open) return;
    open = false;
    layer.hidden = true;
    inertTarget()?.removeAttribute('inert');
    document.removeEventListener('keydown', onOutsideKey);
    const back = o.restoreFocus === false ? null : returnTo;
    returnTo = null;
    if (back && back.isConnected && back.getClientRects().length > 0) back.focus({ preventScroll: true });
    else (document.activeElement as HTMLElement | null)?.blur?.(); // 숨긴 창 안의 초점을 버린다 — Space 등이 3D 화면 단축키로 간다
  };
  const requestClose = (): boolean => {
    if (!open || !opts.canClose()) return false;
    close();
    return true;
  };

  /** 초점이 창 자체에 있을 때 넘김 키 → 창 안 스크롤 영역(또는 그 안의 스크롤 칸 — scrollTarget). 처리했으면 true */
  const scrollByKey = (e: KeyboardEvent): boolean => {
    const a = opts.scrollArea;
    if (!a || e.target !== win || e.altKey || e.ctrlKey || e.metaKey) return false;
    // dir = 방향(1 아래 · -1 위), unit = 'page' 한 화면 · 'line' 한 줄 · 'end' 끝까지
    let dir: number, unit: 'page' | 'line' | 'end';
    switch (e.key) {
      case 'PageDown': dir = 1; unit = 'page'; break;
      case 'PageUp': dir = -1; unit = 'page'; break;
      case ' ': dir = e.shiftKey ? -1 : 1; unit = 'page'; break;
      case 'ArrowDown': dir = 1; unit = 'line'; break;
      case 'ArrowUp': dir = -1; unit = 'line'; break;
      case 'Home': dir = -1; unit = 'end'; break;
      case 'End': dir = 1; unit = 'end'; break;
      default: return false;
    }
    const t = scrollTarget(a, dir);
    if (unit === 'end') t.scrollTop = dir > 0 ? t.scrollHeight : 0;
    else t.scrollTop += dir * (unit === 'page' ? Math.max(40, t.clientHeight * 0.9) : 40);
    return true;
  };

  /** Esc → 닫을 수 있으면 닫기. Tab → 창 안에서 돌기. 그 밖의 키는 전파를 끊어 뒤 화면 단축키에 닿지 않게 */
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const list = focusables(win);
      (list.length ? nextFocus(list, document.activeElement, e.shiftKey, win) : win).focus();
      return;
    }
    e.stopPropagation();
    if (e.key === 'Escape') { e.preventDefault(); requestClose(); return; }
    if (scrollByKey(e)) e.preventDefault();
  };
  layer.addEventListener('keydown', onKey);
  // 초점이 창 밖(body — 뒤판을 누른 직후, 누른 단추가 막혀 초점이 빠진 뒤 등)에 있을 때: document 는 window 보다 먼저 받으므로 여기서 끊으면 재생·편집 단축키에 닿지 않는다
  const onOutsideKey = (e: KeyboardEvent) => {
    if (!open || layer.contains(e.target as Node)) return;
    if (e.key === 'Tab') { // 창 밖에서 Tab → 창 안 첫(뒤로면 끝) 요소로
      e.preventDefault();
      const list = focusables(win);
      (list.length ? (e.shiftKey ? list[list.length - 1] : list[0]) : win).focus();
      return;
    }
    e.stopPropagation();
    if (e.key === 'Escape') { e.preventDefault(); requestClose(); }
  };

  // 뒤판: 누르면 초점을 창으로(초점이 body 로 빠지지 않게), 떼면 닫을 수 있을 때만 닫는다
  backdrop.addEventListener('mousedown', (e) => { e.preventDefault(); win.focus({ preventScroll: true }); });
  backdrop.addEventListener('click', () => { requestClose(); });
  // 뒤판에 파일을 놓으면 브라우저가 그 파일로 페이지를 옮겨 가므로 막는다. 페이지가 layer 에서 받으면(dropEffect 를 다시 정함) 그쪽이 이긴다
  backdrop.addEventListener('dragover', (e) => { e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = 'none'; });
  backdrop.addEventListener('drop', (e) => e.preventDefault());

  return {
    window: win,
    backdrop,
    layer,
    open(returnFocus) {
      if (open) return;
      open = true;
      const active = document.activeElement;
      returnTo = returnFocus !== undefined ? returnFocus : active instanceof HTMLElement && active !== document.body ? active : null;
      closeHelp();
      layer.hidden = false;
      inertTarget()?.setAttribute('inert', '');
      document.addEventListener('keydown', onOutsideKey);
      win.focus({ preventScroll: true });
    },
    requestClose,
    close,
    isOpen: () => open,
  };
}

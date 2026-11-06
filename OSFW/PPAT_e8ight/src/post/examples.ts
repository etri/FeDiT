// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   examples.ts

후처리 '데이터 열기' 창(openDataDialog.ts)의 '예제' 묶음('파일' 묶음 아래, 맨 끝). 함께 실린 예제 데이터(public/datasets.json — 빌드한 페이지는 도시 예제 하나,
개발 서버는 Ahmed body · E2E 까지)를 줄마다 [열기]로 바로 연다(app.loadEntry). 줄 꼴은 서버 결과와 같은 줄 꼴을 빌려 씀
(components.css .srv-item · .srv-item-head · .srv-item-foot · .srv-item-err — 이름에 '서버'가 들어 있지만 같은 꼴).
- 줄 = 이름(label) + 꼬리표(항목의 badge, 예: '실제 해석 결과') / 둘째 줄 desc · (열린 줄만) 체크 아이콘 + '열림' · [열기].
  해상도 선택지(levelChoices)가 있는 항목은 선택지마다 한 줄로 펴고 둘째 줄은 그 선택지의 설명이다. 미리 골라 두는 칸이 없으므로 '열림'이
  실제로 연 해상도와 어긋나지 않고, 큰 해상도는 그 줄을 눌렀을 때만 받는다.
- 누른 줄에 결과가 보인다: [열기] → 그 줄 '여는 중…'과 그 아래 회색 진행 글(app.loading) → '열림' 또는 그 줄에 '열지 못했습니다: <사유>'(그전에 열려 있던 데이터는 그대로).
  줄 오류는 무엇이든(다른 줄 · 서버 결과 · 파일) 새로 열면 지운다(서버 결과 줄 오류와 같은 규칙).
  줄의 [열기]가 성공하면 onOpened 를 부른다(창이 닫힌다 — 주소의 ?data= 처럼 open 을 바로 부른 것은 부르지 않는다). 못 열면 초점을 그 줄 [열기]로 돌린다.
  '열림' = app.currentId 가 그 항목이고, 해상도 줄은 app.currentChoice 까지 같은 줄. 서버 결과 줄의 아이디는 'server:<번호>'라 겹치지 않으므로
  '열림'은 서버 결과와 예제를 통틀어 많아야 한 줄이다. 사용자 파일을 열면 어느 줄도 '열림'이 아니다.
  이미 '열림'인 줄도 다시 열 수 있다(처음 상태로, 쌓은 레이어는 지워짐 — 물음표에 적음).
- 무엇이든 데이터를 여는 동안(app.opening) [열기]는 막힌다 — 서버 결과 목록과 같은 기준. 저장 시점을 읽는 동안(재생)은 막지 않는다.
- 줄 DOM 은 목록(app.catalog)이 바뀔 때만 다시 만들고, 그 밖에는 상태만 고친다(다시 만들면 누르는 도중의 클릭이 버려진다 — serverResults.ts 와 같은 기준).
- 목록에 줄이 없으면 묶음을 숨긴다. 주소의 ?data= 아이디가 목록에 없으면 notFound 가 묶음 안에 오류 한 줄을 띄운다(첫 항목으로 대신 열지 않는다).
  목록 파일을 못 읽으면(opts.catalog 가 실패) 묶음을 숨기지 않고 그 자리에 '예제 목록을 읽지 못했습니다.'를 보인다.
*/
/******************************************************************************/
import type { AppCore, DatasetEntry } from '../core/AppCore';
import { button, el, withHelp } from '../ui/dom';
import { icon } from '../ui/icons';
import { isConnectionError } from './openServerJob';

export interface ExamplesOptions {
  /** 줄의 [열기]가 성공했을 때 */
  onOpened?: () => void;
  /** 목록 파일 읽기(app.loadCatalog). 실패하면 묶음에 '예제 목록을 읽지 못했습니다.' */
  catalog?: Promise<unknown>;
}

export interface Examples {
  /** '데이터 열기' 창에 놓을 묶음 */
  root: HTMLElement;
  /**
   * 예제 하나를 연다(주소의 ?data= 도 이것을 쓴다). 해상도 선택지가 있으면 choice(없으면 그 항목의 defaultChoice).
   * 여는 동안 [열기]는 막히고, 못 열면 그 줄에 오류를 남긴 뒤 예외를 다시 던진다. 목록에 없는 아이디면 notFound 와 같이 알리고 던진다
   */
  open(id: string, choice?: number): Promise<void>;
  /** 주소의 ?data= 아이디가 목록에 없을 때: 묶음 안에 '예제에 없는 항목입니다: <아이디>' 한 줄 */
  notFound(id: string): void;
  /** 이 묶음이 예제 하나를 여는 중인가 (줄의 [열기] · 주소의 ?data=) — 진행 글은 그 줄이 보인다 */
  isBusy(): boolean;
}

/** 줄 한 개의 고칠 자리 */
interface RowView { root: HTMLElement; name: string; btn: HTMLButtonElement; label: HTMLElement; state: HTMLElement; prog: HTMLElement; err: HTMLElement }

/** 줄에 보일 오류 글. 연결 실패는 서버 결과 줄과 같은 한국어 한 줄(브라우저의 영어 글 'Failed to fetch' 등을 그대로 보이지 않게) */
const errText = (e: unknown): string => (isConnectionError(e) ? '서버 연결이 끊겼습니다.' : e instanceof Error ? e.message : String(e));
/** 줄 열쇠: 항목 아이디, 해상도 줄은 '<아이디>#<선택지 번호>' */
const rowKey = (id: string, choice: number | null): string => (choice === null ? id : `${id}#${choice}`);

/** 해상도 선택지가 있는 항목이면 열 선택지 번호(넘긴 것 → 항목의 기본값 → 첫 것, 범위 밖이면 첫 것), 없으면 null */
function choiceFor(entry: DatasetEntry, choice?: number): number | null {
  const n = entry.levelChoices?.length ?? 0;
  if (!n) return null;
  const i = choice ?? entry.defaultChoice ?? 0;
  return Number.isInteger(i) && i >= 0 && i < n ? i : 0;
}

export function mountExamples(app: AppCore, opts: ExamplesOptions = {}): Examples {
  // ---------- 상태 ----------
  let busy: string | null = null;              // 여는 중인 줄 열쇠
  let shownCatalog: DatasetEntry[] | null = null; // 줄을 만든 목록 (바뀌면 다시 만든다)
  let shownOpen: string | null = null;         // '열림'으로 칠해 둔 줄 열쇠
  let shownLoading = false;                    // 줄을 칠할 때 앱이 불러오는 중이었는지
  let shownProgress = '';                      // 여는 줄 아래에 칠해 둔 진행 글
  let listError = '';                          // 목록 파일을 못 읽음
  let missing = '';                            // 목록에 없는 ?data= 아이디 알림
  let missingAt: unknown = null;               // 그 알림을 띄울 때 열려 있던 데이터 (무엇이든 새로 열면 알림을 지운다)
  const errors = new Map<string, string>();    // 줄 열쇠 → 마지막으로 열다 난 오류 (무엇이든 새로 열면 지운다)
  let errorsAt: unknown = null;                // 마지막 줄 오류를 띄울 때 열려 있던 데이터 (그것이 바뀌면 줄 오류를 모두 지운다 — ?data= 알림과 같은 규칙)
  const rows = new Map<string, RowView>();

  // ---------- 화면 ----------
  const root = el('div', 'srv');
  const title = withHelp(el('div', 'sub', '예제'), [
    '함께 실린 예제 데이터입니다.',
    '[열기]를 누르면 쌓은 레이어는 지워지고 처음 상태로 열립니다.',
  ]);
  const listLine = el('div', 'srv-item-err');
  listLine.setAttribute('aria-live', 'polite');
  const missingLine = el('div', 'srv-item-err');
  missingLine.setAttribute('aria-live', 'polite');
  const list = el('div', 'srv-list');
  root.append(title, listLine, missingLine, list);

  /** 한 줄: 이름 + 꼬리표 / 설명(또는 해상도 선택지 설명) + '열림' + [열기] / 여는 동안 진행 글 / 여는 오류 */
  const rowView = (entry: DatasetEntry, choice: number | null): RowView => {
    const desc = choice === null ? (entry.desc ?? '') : entry.levelChoices![choice].label;
    const name = choice === null ? entry.label : `${entry.label} ${desc}`; // 화면 읽기 프로그램: 해상도 줄끼리 구별
    const r = el('div', 'srv-item');
    const top = el('div', 'srv-item-head');
    top.append(el('span', 'srv-item-name', entry.label));
    if (entry.badge) top.append(el('span', 'tag', entry.badge));
    const state = el('span', 'srv-item-state');
    state.append(icon('check'), el('span', undefined, '열림'));
    state.hidden = true;
    const btn = button('열기', () => {
      open(entry.id, choice ?? undefined).then(
        () => opts.onOpened?.(),
        () => { // 오류는 그 줄에 보인다. 여는 동안 단추가 막혀 초점이 빠졌으면 이 단추로 돌린다(서버 결과 줄과 같다)
          const at = document.activeElement;
          if (!at || at === document.body) btn.focus();
        },
      );
    }, 'normal', 'eye');
    btn.setAttribute('aria-label', `${name} 열기`);
    const when = el('span', 'srv-item-when', desc);
    if (desc) when.title = desc; // 길면 말줄임 — 전체는 마우스를 올려
    const foot = el('div', 'srv-item-foot');
    foot.append(when, state, btn);
    const prog = el('div', 'srv-item-prog');
    const err = el('div', 'srv-item-err');
    err.setAttribute('aria-live', 'polite');
    r.append(top, foot, prog, err);
    return { root: r, name, btn, label: btn.querySelector('span')!, state, prog, err };
  };

  /** 목록이 바뀌었을 때만: 줄을 다시 만든다 */
  const build = () => {
    shownCatalog = app.catalog;
    rows.clear();
    list.replaceChildren();
    for (const entry of app.catalog) {
      const n = entry.levelChoices?.length ?? 0;
      const choices: (number | null)[] = n ? Array.from({ length: n }, (_, i) => i) : [null];
      for (const c of choices) {
        const v = rowView(entry, c);
        rows.set(rowKey(entry.id, c), v);
        list.append(v.root);
      }
    }
  };

  /** 지금 열린 데이터가 예제면 그 줄 열쇠, 아니면 null */
  const openedKey = (): string | null => {
    if (!app.dataset) return null;
    const entry = app.catalog.find((c) => c.id === app.currentId);
    if (!entry) return null;
    return rowKey(entry.id, entry.levelChoices?.length ? app.currentChoice : null);
  };

  /** 줄마다 여는 중 · 진행 글 · 열림 · 오류 · [열기] 막힘을 맞춘다 (글은 바뀔 때만 쓴다) */
  const paint = () => {
    const opened = openedKey();
    shownOpen = opened;
    shownLoading = app.opening;
    shownProgress = busy ? app.loading : '';
    for (const [key, v] of rows) {
      const prog = busy === key ? shownProgress : '';
      if (v.prog.textContent !== prog) v.prog.textContent = prog;
      const isOpen = key === opened && busy !== key;
      v.root.classList.toggle('open', isOpen);
      v.state.hidden = !isOpen;
      v.btn.disabled = busy !== null || shownLoading;
      const label = busy === key ? '여는 중…' : '열기';
      if (v.label.textContent !== label) { v.label.textContent = label; v.btn.setAttribute('aria-label', `${v.name} ${label}`); }
      const err = errors.get(key) ?? '';
      if (v.err.textContent !== err) v.err.textContent = err;
    }
    if (missingLine.textContent !== missing) missingLine.textContent = missing;
    if (listLine.textContent !== listError) listLine.textContent = listError;
    list.hidden = !rows.size;
    root.hidden = !rows.size && !missing && !listError;
  };

  async function open(id: string, choice?: number): Promise<void> {
    const entry = app.catalog.find((c) => c.id === id);
    if (!entry) { notFound(id); throw new Error(`예제에 없는 항목입니다: ${id}`); }
    if (busy) throw new Error('다른 예제를 여는 중입니다.');
    if (app.opening) throw new Error('다른 데이터를 불러오는 중입니다.');
    const c = choiceFor(entry, choice);
    const key = rowKey(id, c);
    busy = key;
    errors.delete(key);
    missing = '';
    paint();
    try {
      await app.loadEntry(entry, c ?? undefined);
    } catch (e) {
      errors.set(key, `열지 못했습니다: ${errText(e)}`);
      errorsAt = app.dataset; // 못 열면 데이터는 그대로이므로 바로 지워지지 않는다
      throw e;
    } finally {
      busy = null;
      paint();
    }
  }

  function notFound(id: string): void {
    missing = `예제에 없는 항목입니다: ${id}`;
    missingAt = app.dataset;
    paint();
  }

  // 목록이 들어오면 줄을 만들고, 다른 데이터를 열면 '열림'이 따라 옮겨 가거나 사라지며, 앱이 데이터를 여는 동안은 [열기]가 막힌다.
  // 주소의 ?data= 알림('예제에 없는 항목')과 줄 오류는 무엇이든(서버 결과 · 파일 포함) 새로 열면 지운다 — 그때 주소에서도 data 가 바뀐다
  app.subscribe(() => {
    if (missing && app.dataset !== missingAt) missing = '';
    const staleErr = errors.size > 0 && app.dataset !== errorsAt;
    if (staleErr) errors.clear();
    if (app.catalog !== shownCatalog) { build(); paint(); return; }
    if (staleErr || openedKey() !== shownOpen || app.opening !== shownLoading || (busy ? app.loading : '') !== shownProgress || missingLine.textContent !== missing) paint();
  });
  // 목록 파일을 못 읽으면 묶음을 숨기지 않고 알린다(주소의 ?data= 로 들어왔을 때도 이 줄이 알린다 — post/main.ts)
  opts.catalog?.catch(() => { listError = '예제 목록을 읽지 못했습니다.'; paint(); });
  build();
  paint();
  return { root, open, notFound, isBusy: () => busy !== null };
}

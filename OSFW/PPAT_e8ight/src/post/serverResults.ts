// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   serverResults.ts

후처리 '데이터 열기' 창(openDataDialog.ts) 맨 위의 '서버 결과' 묶음. 이 서버(1세부 해석엔진 작업 폴더)에 쌓인 해석 가운데 결과를 열 수 있는 것
(완료 · 실패 · 상태 모름)을 줄로 보이고, 줄의 [열기]로 그 작업 폴더를 연다(openServerJob.ts — 주소의 ?job= 과 같은 함수).
줄의 [열기]가 성공하면 onOpened 를 부른다(창이 닫힌다). 주소의 ?job= 이 실패하면 묶음 맨 위 한 줄(showJobError)에 알린다 — 그 작업이 읽은 줄 안에 없어도 보이게.
- 목록·상태 파일 읽기는 data/serverJobs.ts. 엔진 API(engine/)는 부르지 않는다 — 후처리는 결과를 열기만 한다(2026-10-21).
- 대기·실행 중인 해석은 줄로 넣지 않고 건수 한 줄 + 물리 시뮬레이션 화면 링크로 보인다.
- 페이지를 열 때 한 번 읽는다(자동 반복 없음). 새로고침 단추로 처음부터 다시, '더 보기'로 다음 JOB_PAGE 개 폴더를 더 읽는다.
- 누른 줄에 결과가 보인다: [열기] → 그 줄 '여는 중…'과 그 아래 회색 진행 글(app.loading — 읽기 덮개는 창에 가려진다) → '열림'(app.currentId 가 'server:<번호>' 인 줄 하나) 또는 그 줄에 오류 한 줄.
  못 열면 초점을 그 줄 [열기]로 돌린다(여는 동안 단추가 막혀 초점이 빠지므로). 줄 오류는 무엇이든(다른 줄 · 예제 · 파일) 새로 열거나 새로고침하면 지운다.
  주소의 ?job= 이 여는 중이면 진행 글을 묶음 맨 위 한 줄에도 보인다('작업 <번호> 여는 중 · …') — 그 줄이 읽은 목록에 없거나 칸 아래에 있어도 창을 띄운 사람이 무엇을 기다리는지 알게.
  '열림'은 아래 '예제' 묶음(examples.ts)과 통틀어 많아야 한 줄이다. 연 뒤의 이름(도구막대·장면 트리)은 그 줄의 이름이다(줄 이름이 작업 번호로 대신 적힌 줄은 결과 폴더 끝 이름 — ?job= 과 같게).
  여는 동안, 그리고 앱이 다른 데이터를 여는 동안(app.opening) [열기]는 막힌다 — 두 열기가 겹치지 않게('예제' 묶음의 [열기]와 같은 기준). 저장 시점을 읽는 동안(재생)은 막지 않는다.
  줄 DOM 은 목록을 읽을 때 한 번 만들고 상태만 고친다(다시 만들면 누르는 도중의 클릭이 버려진다).
- 주소의 ?job= · ?data= 는 지금 열린 데이터를 따른다 — 맞추는 일은 post/main.ts(판정은 post/openedData.ts)가 예제·사용자 파일과 함께 맡는다.
*/
/******************************************************************************/
import type { AppCore } from '../core/AppCore';
import {
  JOB_PAGE, STATE_LABEL, STATE_TAG, canOpenResult, jobWhenText, listJobFolders, readJobs, type JobFolder, type ServerJob,
} from '../data/serverJobs';
import { button, el, withHelp } from '../ui/dom';
import { icon } from '../ui/icons';
import { openServerJob, serverJobOf } from './openServerJob';

export interface ServerResultsOptions {
  /** 줄의 [열기]가 성공했을 때 (주소의 ?job= 처럼 open 을 바로 부른 것은 부르지 않는다) */
  onOpened?: () => void;
}

export interface ServerResults {
  /** '데이터 열기' 창 맨 위에 놓을 묶음 */
  root: HTMLElement;
  /**
   * 작업 하나를 연다(주소의 ?job= 도 이것을 쓴다). 여는 동안 목록의 [열기]는 막히고, 못 열면 그 줄에 오류를 남긴 뒤 예외를 다시 던진다.
   * label = 연 뒤의 이름(줄의 [열기]는 줄 이름을 넘긴다). 없으면 결과 폴더의 끝 이름(openServerJob)
   */
  open(jobId: string, label?: string): Promise<void>;
  /** 주소의 ?job= 이 실패했을 때: 묶음 맨 위에 '서버 결과를 열지 못했습니다(작업 <번호>): <사유>' 한 줄. 무엇이든 새로 열면 지운다 */
  showJobError(jobId: string, reason: string): void;
  /** 이 묶음이 작업 하나를 여는 중인가 (줄의 [열기] · 주소의 ?job=) — 진행 글은 이 묶음이 보인다 */
  isBusy(): boolean;
}

/** 목록 한 줄의 고칠 자리 */
interface RowView { root: HTMLElement; name: string; btn: HTMLButtonElement; label: HTMLElement; state: HTMLElement; prog: HTMLElement; err: HTMLElement }

const errText = (e: unknown): string => (e instanceof Error ? e.message : String(e));

export function mountServerResults(app: AppCore, opts: ServerResultsOptions = {}): ServerResults {
  // ---------- 상태 ----------
  let folders: JobFolder[] = [];             // 맨 윗단의 작업 폴더 (최근 활동순)
  let jobs: ServerJob[] = [];                // 상태 파일을 읽은 작업 (folders 앞에서부터 순서대로)
  let phase: 'loading' | 'ready' | 'error' = 'loading';
  let listError = '';
  let reading = false;                       // '더 보기'로 읽는 중
  let ctrl: AbortController | null = null;   // 지금 목록 읽기 (새로고침하면 끊는다)
  let busy: string | null = null;            // 여는 중인 작업 번호
  let busyFromRow = false;                   // 그 열기를 줄의 [열기]로 시작했는가 (아니면 주소의 ?job= — 맨 위 한 줄에도 진행 글)
  let shownOpen: string | null = null;       // 줄에 '열림'으로 칠해 둔 작업 번호
  let shownLoading = false;                  // 줄을 칠할 때 앱이 불러오는 중이었는지
  let shownProgress = '';                    // 여는 줄 아래에 칠해 둔 진행 글
  let jobError = '';                         // 주소의 ?job= 실패 (묶음 맨 위 한 줄)
  let jobErrorAt: unknown = null;            // 그 글을 띄울 때 열려 있던 데이터 (무엇이든 새로 열면 지운다)
  const errors = new Map<string, string>();  // 작업 번호 → 마지막으로 열다 난 오류 (무엇이든 새로 열거나 새로고침하면 지운다)
  let errorsAt: unknown = null;              // 마지막 줄 오류를 띄울 때 열려 있던 데이터 (그것이 바뀌면 줄 오류를 모두 지운다 — ?job= 오류와 같은 규칙)
  const rows = new Map<string, RowView>();

  // ---------- 화면 ----------
  const root = el('div', 'srv');
  const title = withHelp(el('div', 'sub', '서버 결과'), [
    '이 서버에서 돌린 해석 결과입니다(다른 사람이 돌린 것 포함). 완료·실패·상태 모름인 해석을 열 수 있습니다.',
    '실패한 해석도 멈춘 시점까지 저장된 결과가 있으면 열립니다.',
    '실행 중·대기 중인 해석은 물리 시뮬레이션 화면에서 봅니다.',
  ]);
  const refreshBtn = el('button', 'icon-btn');
  refreshBtn.type = 'button';
  refreshBtn.title = '새로고침';
  refreshBtn.setAttribute('aria-label', '서버 결과 새로고침');
  refreshBtn.append(icon('rotate'));
  refreshBtn.addEventListener('click', () => { errors.clear(); void reload(); });
  const head = el('div', 'srv-head');
  head.append(title, refreshBtn);
  const jobErrorLine = el('div', 'srv-item-err');
  jobErrorLine.setAttribute('aria-live', 'polite');
  const jobProgLine = el('div', 'srv-item-prog'); // 주소의 ?job= 이 여는 중일 때의 진행 글 (평소 숨김)
  const status = el('div', 'status');
  status.setAttribute('aria-live', 'polite');
  // 대기·실행 중: '실행 중 1건 · 대기 2건' + 물리 시뮬레이션 링크 (실행 중이 하나면 그 작업을 바로 연다)
  const activeText = el('span');
  const activeLink = el('a', 'srv-link', '물리 시뮬레이션에서 보기');
  const active = el('div', 'hint srv-active');
  active.append(activeText, activeLink);
  const list = el('div', 'srv-list');
  const moreBtn = button('더 보기', () => void readMore(), 'normal', 'chevron');
  const moreLabel = moreBtn.querySelector('span')!;
  root.append(head, jobErrorLine, jobProgLine, status, active, list, moreBtn);

  /** 한 줄: 이름 + 상태 꼬리표 / 시작 시각 · 걸린 시간 + '열림' + [열기] / (실패면) 엔진의 한 줄 설명 / 여는 동안 진행 글 / 여는 오류 */
  const rowView = (j: ServerJob): RowView => {
    const r = el('div', 'srv-item');
    r.title = `작업 번호 ${j.id}`;
    const top = el('div', 'srv-item-head');
    top.append(el('span', 'srv-item-name', j.name), el('span', STATE_TAG[j.status] ? `tag ${STATE_TAG[j.status]}` : 'tag', STATE_LABEL[j.status]));
    const state = el('span', 'srv-item-state');
    state.append(icon('check'), el('span', undefined, '열림'));
    state.hidden = true;
    // 연 뒤의 주소(?job=)는 post/main.ts 가 맞춘다. 연 뒤의 이름은 이 줄의 이름. 다만 상태 파일에 입력 이름(config)이 없어 줄 이름이
    // 작업 번호로 대신 적힌 줄은 이름을 넘기지 않는다 — ?job= 으로 새로 고칠 때와 같은 결과 폴더 끝 이름이 되어 여는 길마다 이름이 달라지지 않게
    const btn = button('열기', () => {
      openJob(j.id, j.config ? j.name : undefined, true).then(
        () => opts.onOpened?.(),
        () => { // 오류는 그 줄에 보인다. 여는 동안 단추가 막혀 초점이 빠졌으면 이 단추로 돌린다(키보드 · 화면 읽기 프로그램이 자리를 잃지 않게)
          const at = document.activeElement;
          if (!at || at === document.body) btn.focus();
        },
      );
    }, 'normal', 'eye');
    btn.setAttribute('aria-label', `${j.name} 열기`); // 화면 읽기 프로그램: 어느 줄의 단추인지
    const foot = el('div', 'srv-item-foot');
    foot.append(el('span', 'srv-item-when', jobWhenText(j)), state, btn);
    r.append(top, foot);
    if (j.status === 'failed' && j.message) {
      const m = el('div', 'srv-item-msg', j.message);
      m.title = j.message;
      r.append(m);
    }
    const prog = el('div', 'srv-item-prog');
    const err = el('div', 'srv-item-err');
    err.setAttribute('aria-live', 'polite');
    r.append(prog, err);
    return { root: r, name: j.name, btn, label: btn.querySelector('span')!, state, prog, err };
  };

  /** 줄마다 여는 중 · 진행 글 · 열림 · 오류 · [열기] 막힘, 맨 위 ?job= 오류를 맞춘다 (글은 바뀔 때만 쓴다) */
  const paint = () => {
    const opened = serverJobOf(app.currentId);
    shownOpen = opened;
    shownLoading = app.opening;
    shownProgress = busy ? app.loading : '';
    if (jobErrorLine.textContent !== jobError) jobErrorLine.textContent = jobError;
    // 진행 글이 '<작업 번호> 읽는 중'(이름 없이 연 ?job= 의 첫 글)이면 번호를 두 번 적지 않게 '작업 <번호> 읽는 중'으로
    const top = !busy || busyFromRow ? ''
      : shownProgress.startsWith(`${busy} `) ? `작업 ${shownProgress}`
      : `작업 ${busy} 여는 중${shownProgress ? ` · ${shownProgress}` : ''}`;
    if (jobProgLine.textContent !== top) jobProgLine.textContent = top;
    for (const [id, v] of rows) {
      const prog = busy === id ? shownProgress : '';
      if (v.prog.textContent !== prog) v.prog.textContent = prog;
      const isOpen = id === opened && busy !== id;
      v.root.classList.toggle('open', isOpen);
      v.state.hidden = !isOpen;
      v.btn.disabled = busy !== null || shownLoading;
      const label = busy === id ? '여는 중…' : '열기';
      if (v.label.textContent !== label) { v.label.textContent = label; v.btn.setAttribute('aria-label', `${v.name} ${label}`); }
      const err = errors.get(id) ?? '';
      if (v.err.textContent !== err) v.err.textContent = err;
    }
  };

  /** 상태 한 줄 · 대기·실행 중 한 줄 · '더 보기' · 새로고침 단추 */
  const renderMeta = () => {
    const running = jobs.filter((j) => j.status === 'running');
    const queued = jobs.filter((j) => j.status === 'queued').length;
    const more = phase === 'ready' && jobs.length < folders.length;
    let msg = '', cls = 'status';
    if (phase === 'loading') msg = '서버 결과를 읽는 중…';
    else if (phase === 'error') { msg = listError; cls = 'status error'; }
    else if (!rows.size && !running.length && !queued && !more) { msg = '열 수 있는 결과가 없습니다.'; cls = 'hint'; }
    status.className = cls;
    status.textContent = msg;
    status.hidden = !msg;
    const parts = [running.length ? `실행 중 ${running.length}건` : '', queued ? `대기 ${queued}건` : ''].filter(Boolean);
    active.hidden = phase !== 'ready' || !parts.length;
    activeText.textContent = parts.join(' · ');
    activeLink.href = running.length === 1 ? `sim.html?job=${encodeURIComponent(running[0].id)}` : 'sim.html';
    list.hidden = !rows.size;
    moreBtn.hidden = !more;
    moreBtn.disabled = reading;
    moreLabel.textContent = reading ? '읽는 중…' : '더 보기';
    refreshBtn.disabled = phase === 'loading';
  };

  /** 아직 읽지 않은 폴더 가운데 앞의 JOB_PAGE 개의 상태 파일을 읽어 열 수 있는 것을 줄로 붙인다 */
  async function readPage(c: AbortController): Promise<void> {
    const got = await readJobs(folders.slice(jobs.length, jobs.length + JOB_PAGE), c.signal);
    if (ctrl !== c) return;
    jobs = jobs.concat(got);
    for (const j of got) {
      if (!canOpenResult(j) || rows.has(j.id)) continue;
      const v = rowView(j);
      rows.set(j.id, v);
      list.append(v.root);
    }
  }

  /** 처음부터 다시 읽는다 (페이지를 열 때 · 새로고침) */
  async function reload(): Promise<void> {
    ctrl?.abort();
    const c = new AbortController();
    ctrl = c;
    folders = []; jobs = []; rows.clear(); list.replaceChildren();
    phase = 'loading'; reading = false;
    renderMeta();
    try {
      folders = await listJobFolders(c.signal);
      await readPage(c);
      if (ctrl !== c) return;
      phase = 'ready';
    } catch (e) {
      if (c.signal.aborted) return;
      phase = 'error';
      listError = errText(e); // listJobFolders 의 오류는 모두 한국어 한 줄(연결 실패 포함)
    }
    renderMeta();
    paint();
  }

  async function readMore(): Promise<void> {
    const c = ctrl;
    if (!c || reading || phase !== 'ready') return;
    reading = true;
    renderMeta();
    const before = list.childElementCount;
    try { await readPage(c); } catch { /* 새로고침으로 끊긴 것뿐 — 상태 파일을 못 읽은 작업은 '상태 모름' 줄이 된다 */ }
    if (ctrl !== c) return;
    reading = false;
    renderMeta();
    paint();
    // 새로 붙은 첫 줄을 목록 칸 맨 위로 — 칸 높이가 묶여 있어 그대로 두면 칸 아래에 숨는다
    const first = list.children[before];
    if (first) list.scrollTop += first.getBoundingClientRect().top - list.getBoundingClientRect().top;
  }

  /** fromRow = 줄의 [열기]로 시작함 (아니면 주소의 ?job= — 맨 위 한 줄에도 진행 글) */
  async function openJob(jobId: string, label: string | undefined, fromRow: boolean): Promise<void> {
    if (busy) throw new Error('다른 서버 결과를 여는 중입니다.');
    if (app.opening) throw new Error('다른 데이터를 불러오는 중입니다.');
    busy = jobId;
    busyFromRow = fromRow;
    errors.delete(jobId);
    paint();
    try {
      await openServerJob(app, jobId, label);
    } catch (e) {
      errors.set(jobId, `열지 못했습니다: ${errText(e)}`);
      errorsAt = app.dataset; // 못 열면 데이터는 그대로이므로 바로 지워지지 않는다
      throw e;
    } finally {
      busy = null;
      busyFromRow = false;
      paint();
    }
  }
  const open = (jobId: string, label?: string): Promise<void> => openJob(jobId, label, false);

  function showJobError(jobId: string, reason: string): void {
    jobError = `서버 결과를 열지 못했습니다(작업 ${jobId}): ${reason}`;
    jobErrorAt = app.dataset;
    paint();
  }

  // 다른 데이터를 열면(예제 · 파일 · 끌어다 놓기 · 다른 줄) '열림'이 따라 옮겨 가거나 사라지고, 앱이 데이터를 여는 동안은 [열기]가 막힌다.
  // 여는 동안은 진행 글이 바뀔 때마다 그 줄 아래 글을 고친다. 주소의 ?job= 오류와 줄 오류는 무엇이든 새로 열면 지운다(그때 주소의 job 도 바뀐다)
  app.subscribe(() => {
    if (jobError && app.dataset !== jobErrorAt) jobError = '';
    const staleErr = errors.size > 0 && app.dataset !== errorsAt;
    if (staleErr) errors.clear();
    if (staleErr || serverJobOf(app.currentId) !== shownOpen || app.opening !== shownLoading || (busy ? app.loading : '') !== shownProgress || jobErrorLine.textContent !== jobError) paint();
  });
  void reload(); // 페이지를 열 때 한 번
  return { root, open, showJobError, isBusy: () => busy !== null };
}

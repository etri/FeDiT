// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   main.ts (물리 시뮬레이션 페이지 진입점, sim.html)

해석기 입력(JSON + STL)을 해석엔진에 넣고, 끝날 때까지 상태를 보여 준 뒤 후처리로 넘긴다. 3D 화면이 없는 카드 하나짜리 2D 페이지다.
들어오는 길 셋:
- sim.html?from=pre : 전처리의 '해석 실행'. 넘겨받은 묶음(data/handoff.ts)을 꺼내 바로 실행한다. 묶음이 없으면(새로 고침 등) 입력 고르기로.
- sim.html          : 입력 고르기. JSON 하나 + STL 여러 개를 고르거나 끌어다 놓고, 해석기를 골라 실행한다.
- sim.html?job=<id> : 그 작업의 상태 화면. 새로 고침해도 이어진다.
실행·상태 조회는 이 페이지만 한다(data/engineApi.ts). 전처리는 묶음만 넘기고, 후처리는 post.html?job=<id> 로 결과만 연다.
작업은 한 번에 하나만 다룬다(목록·삭제 없음). 주소는 모두 페이지 기준 상대 주소다.
*/
/******************************************************************************/
import './sim.css';
import { button, callout, el, fmtInt, homeLink, row, select } from '../ui/dom';
import { icon } from '../ui/icons';
import { takeHandoff, type EngineKind, type HandoffRecord, type InputPackage } from '../data/handoff';
import { EngineError, getHealth, getJob, hasAccessKey, newJobId, setAccessKey, submitJob, type JobState, type JobStatus } from '../data/engineApi';
import { engineFor, isJsonObject, type JsonObject, type SolverInputDoc } from '../pre/solverInput';

const ENGINE_OPTIONS: { value: EngineKind; label: string }[] = [
  { value: 'lbm', label: 'LBM (다성분·다상·농도확산·복합 열전달)' },
  { value: 'lbm_dem', label: 'LBM-DEM (유체-입자)' },
];
const engineLabel = (e: string | undefined): string => ENGINE_OPTIONS.find((o) => o.value === e)?.label ?? (e || '-');
const STATE_LABEL: Record<JobState, string> = { queued: '대기 중', running: '실행 중', completed: '완료', failed: '실패' };
const STATE_TAG: Record<JobState, string> = { queued: '', running: 'run', completed: 'ok', failed: 'err' };

const LAST_JOB_KEY = 'utcfd.sim.lastJob';
const POLL_MS = 3000;
const JOB_ID_RE = /^[A-Za-z0-9_-]{1,64}$/; // 엔진의 작업 번호 규칙
const PATH_CHARS = /[\\/]|\.\./;           // 엔진은 경로가 섞인 파일 이름·meta.title 을 거절한다

// ---------------------------------------------------------------------------
// 작은 도우미
// ---------------------------------------------------------------------------
function loadLastJob(): string | null {
  try { const v = localStorage.getItem(LAST_JOB_KEY); return v && JOB_ID_RE.test(v) ? v : null; } catch { return null; }
}
function saveLastJob(id: string | null): void {
  try { if (id) localStorage.setItem(LAST_JOB_KEY, id); else localStorage.removeItem(LAST_JOB_KEY); } catch { /* 저장소를 못 쓰면 이어 보기 링크만 없다 */ }
}

/** 주소 줄만 바꾼다(다시 읽지 않음). 빈 값이면 쿼리 없는 맨 주소 */
function setQuery(q: string): void {
  history.replaceState(null, '', q ? `?${q}` : location.pathname);
}

/** 오류 한 줄. 앞단이 HTML 오류 페이지(413 등)를 주면 본문 대신 상태 번호만 */
const errText = (e: unknown): string => {
  if (e instanceof EngineError && /^\s*</.test(e.message)) return `HTTP ${e.status}`;
  return e instanceof Error ? e.message : String(e);
};

const utf8Bytes = (text: string): number => new TextEncoder().encode(text).length;

function fmtSize(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
}

function fmtDuration(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000)); // 서버와 이 PC 의 시계가 조금 어긋나도 음수는 보이지 않게
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  return h ? `${h}시간 ${m}분 ${r}초` : m ? `${m}분 ${r}초` : `${r}초`;
}

const parseTime = (s: string | null | undefined): number => (s ? Date.parse(s) : NaN);

/** JSON 어디에 있든 mesh_path 값을 모은다(빈 값 제외, 처음 나온 순서). 엔진의 입력 확인(integration core.py _mesh_paths)과 같은 기준 */
function meshPaths(v: unknown, out: string[] = []): string[] {
  if (Array.isArray(v)) for (const x of v) meshPaths(x, out);
  else if (isJsonObject(v)) {
    for (const [k, x] of Object.entries(v)) {
      if (k === 'mesh_path' && typeof x === 'string' && x) { if (!out.includes(x)) out.push(x); }
      else meshPaths(x, out);
    }
  }
  return out;
}

/** 입자 설정이 있으면 lbm_dem (전처리 solverInput.engineFor 와 같은 기준). config 블록이 없으면 lbm */
const guessEngine = (doc: JsonObject): EngineKind => (isJsonObject(doc.config) ? engineFor(doc as unknown as SolverInputDoc) : 'lbm');

const packageBytes = (pkg: InputPackage): number => utf8Bytes(pkg.config.text) + pkg.files.reduce((s, f) => s + f.bytes.length, 0);

// ---------------------------------------------------------------------------
// 머리: 제목 + 세 단계
// ---------------------------------------------------------------------------
const root = document.getElementById('app') as HTMLElement;
const head = el('header', 'sim-head');
const steps = el('nav', 'steps');
steps.setAttribute('aria-label', '단계');
function step(n: number, label: string, href: string | null): HTMLElement {
  const s = href ? el('a', 'step') : el('span', 'step cur');
  if (href) (s as HTMLAnchorElement).href = href;
  else s.setAttribute('aria-current', 'step');
  s.append(el('span', 'n', String(n)), el('span', undefined, label));
  return s;
}
const stepPost = step(3, '후처리', 'post.html') as HTMLAnchorElement; // 해석이 끝나면 그 결과 주소로 바꾼다
steps.append(step(1, '전처리', 'pre.html'), el('span', 'sep'), step(2, '물리 시뮬레이션', null), el('span', 'sep'), stepPost);
// 보내는(업로드) 동안 떠나면 업로드가 끊기고 작업 번호도 남지 않는다 — 그때만 '처음 화면'에서 한 번 묻는다.
// 해석이 시작된 뒤에는 엔진 서버에서 계속 돌므로 묻지 않는다
let uploading = false;
const headTop = el('div', 'sim-top');
headTop.append(el('h1', undefined, '연합트윈 CFD 물리 시뮬레이션'), homeLink(() => (uploading ? '보내는 중인 입력이 끊깁니다.' : null)));
head.append(headTop, steps);
const card = el('section', 'sim-card');
root.append(head, card);

// 카드 밖에 파일을 놓아도 브라우저가 그 파일로 페이지를 바꾸지 않게 (입력 고르기 화면은 카드가 먼저 받는다)
window.addEventListener('dragover', (e) => { if (!e.defaultPrevented) { e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = 'none'; } });
window.addEventListener('drop', (e) => e.preventDefault());

/** 화면 전환: 앞 화면의 타이머·이벤트를 정리하고 카드를 비운 뒤 새 화면을 그린다 */
let cleanup: (() => void) | null = null;
function switchView(build: () => (() => void) | void): void {
  cleanup?.();
  cleanup = null;
  card.replaceChildren();
  cleanup = build() ?? null;
}

// ---------------------------------------------------------------------------
// 입력 고르기
// ---------------------------------------------------------------------------
interface FormState {
  config: { name: string; text: string; size: number } | null;
  doc: JsonObject | null;   // 읽은 JSON (못 읽었으면 null)
  parseError: string;
  files: Map<string, Uint8Array>;
  engine: EngineKind;
}

const emptyForm = (): FormState => ({ config: null, doc: null, parseError: '', files: new Map(), engine: 'lbm' });
let form: FormState = emptyForm();
/** 이 페이지에서 마지막으로 보낸 묶음. '입력 다시 고르기'가 이것으로 입력 칸을 채운다 */
let lastPkg: InputPackage | null = null;

/** JSON 을 넣고 읽어 본다. 읽히면 해석기를 JSON 에 맞게 고른다 */
function setConfig(f: FormState, name: string, text: string, size: number): void {
  f.config = { name, text, size };
  f.doc = null;
  f.parseError = '';
  try {
    const doc = JSON.parse(text) as unknown;
    if (isJsonObject(doc)) { f.doc = doc; f.engine = guessEngine(doc); }
    else f.parseError = '입력 JSON 의 맨 바깥이 객체({ })가 아닙니다.';
  } catch (e) {
    f.parseError = `입력 JSON 을 읽지 못했습니다: ${errText(e)}`;
  }
}

function formFromPackage(pkg: InputPackage): FormState {
  const f = emptyForm();
  setConfig(f, pkg.config.name, pkg.config.text, utf8Bytes(pkg.config.text));
  for (const file of pkg.files) f.files.set(file.name, file.bytes);
  f.engine = pkg.engine; // 보냈던 해석기를 그대로
  return f;
}

function packageFromForm(f: FormState): InputPackage {
  return { engine: f.engine, config: { name: f.config!.name, text: f.config!.text }, files: [...f.files].map(([name, bytes]) => ({ name, bytes })) };
}

interface FormCheck { referenced: string[]; unused: string[]; errors: string[]; warns: string[] }

/** 보내기 전 확인: JSON 이 읽히는지, mesh_path 가 가리키는 STL 이 모두 있는지. 엔진도 같은 것을 확인한다(어긋나면 400) */
function checkForm(f: FormState): FormCheck {
  const errors: string[] = [], warns: string[] = [];
  if (f.parseError) errors.push(f.parseError);
  const referenced = f.doc ? meshPaths(f.doc) : [];
  const badNames = referenced.filter((n) => PATH_CHARS.test(n));
  if (badNames.length) errors.push(`mesh_path 에 폴더 경로가 들어 있습니다: ${badNames.join(', ')}`);
  const missing = referenced.filter((n) => !badNames.includes(n) && !f.files.has(n));
  if (missing.length) errors.push(`JSON 이 가리키는 STL 이 없습니다: ${missing.join(', ')}`);
  const meta = f.doc && isJsonObject(f.doc.meta) ? f.doc.meta : null;
  const title = meta && typeof meta.title === 'string' ? meta.title : '';
  if (title && PATH_CHARS.test(title)) errors.push(`meta.title 에 경로 문자(/ \\ ..)가 있습니다: ${title}`);
  if (f.doc && guessEngine(f.doc) !== f.engine) {
    warns.push(f.engine === 'lbm' ? '이 JSON 에는 입자 설정(particle_generation)이 있습니다.' : '이 JSON 에는 입자 설정(particle_generation)이 없습니다.');
  }
  const unused = [...f.files.keys()].filter((n) => !referenced.includes(n));
  return { referenced, unused, errors, warns };
}

function fileInput(accept: string, multiple: boolean, onPick: (files: File[]) => void): HTMLInputElement {
  const i = el('input');
  i.type = 'file';
  i.accept = accept;
  i.multiple = multiple;
  i.hidden = true;
  i.addEventListener('change', () => {
    const files = Array.from(i.files ?? []);
    i.value = ''; // 같은 파일을 다시 골라도 change 가 오게
    if (files.length) onPick(files);
  });
  return i;
}

/** 파일 목록 한 줄: 아이콘 · 이름 · 크기 · 상태 꼬리표 · 빼기 */
function fileRow(name: string, size: number | null, tag: { text: string; cls: string } | null, onRemove: (() => void) | null): HTMLElement {
  const r = el('div', tag?.cls === 'err' ? 'file-row missing' : 'file-row');
  r.title = name;
  r.append(icon(/\.json$/i.test(name) ? 'file' : 'building'), el('span', 'name', name));
  if (size !== null) r.append(el('span', 'size', fmtSize(size)));
  if (tag) r.append(el('span', tag.cls ? `tag ${tag.cls}` : 'tag', tag.text));
  if (onRemove) {
    const b = el('button', 'rm');
    b.type = 'button';
    b.title = '빼기';
    b.setAttribute('aria-label', `${name} 빼기`);
    b.append(icon('trash', 'icon-sm'));
    b.addEventListener('click', onRemove);
    r.append(b);
  } else r.append(el('span', 'rm-gap'));
  return r;
}

function showForm(note = ''): void {
  switchView(() => {
    const headRow = el('div', 'card-head');
    headRow.append(el('h2', undefined, '입력'));
    const lastJob = loadLastJob();
    if (lastJob) {
      const a = el('a', 'aside link', '최근 해석 이어 보기');
      a.href = `?job=${encodeURIComponent(lastJob)}`;
      a.title = lastJob;
      headRow.append(a);
    }
    card.append(headRow);
    if (note) {
      const c = callout('warn');
      c.text.textContent = note;
      card.append(c.root);
    }

    // 고르기 단추 둘 + 끌어다 놓는 자리
    const pickJson = fileInput('.json,application/json', false, (f) => void add(f));
    const pickStl = fileInput('.stl', true, (f) => void add(f));
    const drop = el('div', 'drop');
    const pickRow = el('div', 'btn-row');
    pickRow.append(button('입력 JSON 고르기', () => pickJson.click(), 'normal', 'file'), button('STL 고르기', () => pickStl.click(), 'normal', 'building'));
    drop.append(icon('upload'), el('span', undefined, '입력 JSON 하나와 STL 파일을 여기에 끌어다 놓거나 고르세요'), pickRow, pickJson, pickStl);

    const list = el('div', 'files');
    const engineSel = select(ENGINE_OPTIONS, form.engine, (v) => { form.engine = v; refresh(); });
    const fileNote = el('p', 'line dim'); // 넣지 않은 파일 · 읽기 오류
    const lines = el('div', 'lines');     // 확인 결과(오류 · 주의)
    const run = button('해석 실행', () => { if (!run.disabled && form.config) showRun({ pkg: packageFromForm(form) }); }, 'primary', 'play');
    const actions = el('div', 'actions');
    actions.append(run);
    card.append(drop, list, row('해석기', engineSel), fileNote, lines, actions);

    const refresh = (): void => {
      const chk = checkForm(form);
      list.replaceChildren();
      if (form.config) {
        list.append(fileRow(form.config.name, form.config.size, { text: '입력 JSON', cls: '' }, () => {
          form.config = null; form.doc = null; form.parseError = '';
          refresh();
        }));
      }
      for (const name of chk.referenced) {
        const bytes = form.files.get(name);
        list.append(bytes
          ? fileRow(name, bytes.length, { text: '올림', cls: 'ok' }, () => { form.files.delete(name); refresh(); })
          : fileRow(name, null, { text: '없음', cls: 'err' }, null));
      }
      for (const name of chk.unused) {
        list.append(fileRow(name, form.files.get(name)!.length, form.config ? { text: '쓰이지 않음', cls: '' } : null, () => { form.files.delete(name); refresh(); }));
      }
      list.hidden = list.childElementCount === 0;
      engineSel.value = form.engine;
      lines.replaceChildren(...chk.errors.map((t) => el('p', 'line err', t)), ...chk.warns.map((t) => el('p', 'line', t)));
      run.disabled = !(form.config && form.doc && chk.errors.length === 0);
    };

    // .json 은 입력 JSON(처음 하나), .stl 은 입력 파일. 이름이 같은 STL 은 새 것으로 바꾼다
    const add = async (files: File[]): Promise<void> => {
      const skipped: string[] = [];
      let tookJson = false;
      try {
        for (const f of files) {
          if (/\.json$/i.test(f.name) && !tookJson) { tookJson = true; setConfig(form, f.name, await f.text(), f.size); }
          else if (/\.stl$/i.test(f.name)) form.files.set(f.name, new Uint8Array(await f.arrayBuffer()));
          else skipped.push(f.name);
        }
        fileNote.className = 'line dim';
        fileNote.textContent = skipped.length ? `넣지 않은 파일: ${skipped.join(', ')}` : '';
      } catch (err) {
        fileNote.className = 'line err';
        fileNote.textContent = `파일을 읽지 못했습니다: ${errText(err)}`;
      }
      refresh();
    };

    // 끌어다 놓기: 카드 어디에 놓아도 받는다
    const onOver = (e: DragEvent): void => { e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'; drop.classList.add('over'); };
    const onLeave = (e: DragEvent): void => { if (!card.contains(e.relatedTarget as Node | null)) drop.classList.remove('over'); };
    const onDrop = (e: DragEvent): void => { e.preventDefault(); drop.classList.remove('over'); void add(Array.from(e.dataTransfer?.files ?? [])); };
    card.addEventListener('dragover', onOver);
    card.addEventListener('dragleave', onLeave);
    card.addEventListener('drop', onDrop);
    refresh();
    return () => {
      card.removeEventListener('dragover', onOver);
      card.removeEventListener('dragleave', onLeave);
      card.removeEventListener('drop', onDrop);
    };
  });
}

/** 상태 화면에서 입력 고르기로 돌아간다. 이 페이지에서 보낸 묶음이 있으면 그것으로 채운다 */
function backToForm(): void {
  setQuery('');
  form = lastPkg ? formFromPackage(lastPkg) : emptyForm();
  showForm();
}

// ---------------------------------------------------------------------------
// 보내기 · 상태
// ---------------------------------------------------------------------------
function showRun(start: { pkg: InputPackage } | { jobId: string }): void {
  switchView(() => {
    const pkg = 'pkg' in start ? start.pkg : null;
    if (pkg) lastPkg = pkg;
    let jobId: string | null = 'jobId' in start ? start.jobId : null;
    let last: JobStatus | null = null;
    let alive = true;
    let keyEntered = false;
    let pollTimer = 0, tickTimer = 0, failures = 0, inFlight = false, pausedHidden = false;
    let stepText = '';

    // ---- 화면 ----
    const state = el('span', 'tag');
    state.setAttribute('aria-live', 'polite');
    const headRow = el('div', 'card-head');
    headRow.append(el('h2', undefined, '해석'), state);
    const summary = el('div', 'kv');
    const bar = el('div', 'bar');
    const fill = el('i');
    bar.append(fill);
    bar.setAttribute('role', 'progressbar');
    bar.setAttribute('aria-valuemin', '0');
    bar.setAttribute('aria-valuemax', '100');
    const metaLeft = el('span'), metaRight = el('span');
    const meta = el('div', 'progress-meta');
    meta.append(metaLeft, metaRight);
    const progress = el('div', 'progress');
    progress.append(bar, meta);
    const queueLine = el('p', 'line dim'), messageLine = el('p', 'line'), errorLine = el('p', 'line err');
    const lines = el('div', 'lines');
    lines.append(queueLine, messageLine, errorLine);

    // 접근 키: 앞단이 401 을 주면 나타난다. 넣은 키는 다시 보여 주지 않는다
    const keyRow = el('div', 'key-row');
    keyRow.hidden = true;
    const keyInput = el('input', 'num text');
    keyInput.type = 'password';
    keyInput.id = 'sim-access-key';
    keyInput.autocomplete = 'off';
    const keyLabel = el('label', undefined, '접근 키');
    keyLabel.htmlFor = keyInput.id;
    const submitKey = (): void => {
      const v = keyInput.value.trim();
      if (!v) { keyInput.focus(); return; }
      keyInput.value = '';
      setAccessKey(v);
      keyEntered = true;
      void send();
    };
    keyInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitKey(); });
    keyRow.append(keyLabel, keyInput, button('확인', submitKey, 'primary'));

    const actions = el('div', 'actions');
    card.append(headRow, summary, progress, lines, keyRow, actions);

    const setState = (text: string, cls: string): void => { state.textContent = text; state.className = cls ? `tag ${cls}` : 'tag'; };
    /** percent 가 null 이면 오가는 띠(얼마나 남았는지 모름) */
    const setProgress = (percent: number | null, kind: '' | 'done' | 'fail' = ''): void => {
      bar.className = `bar${percent === null ? ' indet' : ''}${kind ? ` ${kind}` : ''}`;
      if (percent === null) { bar.removeAttribute('aria-valuenow'); return; }
      const p = Math.min(100, Math.max(0, percent));
      fill.style.setProperty('--p', `${p}%`);
      bar.setAttribute('aria-valuenow', p.toFixed(1));
    };
    const setSummary = (): void => {
      const rows: [string, string][] = [['작업 번호', jobId ?? '-']];
      if (pkg) {
        rows.push(['입력 JSON', pkg.config.name]);
        rows.push(['STL', pkg.files.length ? pkg.files.map((f) => `${f.name} (${fmtSize(f.bytes.length)})`).join(', ') : '없음']);
        rows.push(['해석기', engineLabel(pkg.engine)]);
      } else if (last) { // 이어 보기: 엔진이 기억하는 입력
        rows.push(['입력 JSON', last.config ?? '-']);
        rows.push(['STL', last.inputs?.length ? last.inputs.join(', ') : '없음']);
        rows.push(['해석기', engineLabel(last.engine)]);
      }
      summary.replaceChildren(...rows.flatMap(([k, v]) => [el('span', 'k', k), el('span', 'v', v)]));
    };
    /** 진행 막대 아래 줄: 왼쪽 스텝, 오른쪽 시간(대기 · 경과 · 걸린 시간) */
    const tick = (): void => {
      let right = '';
      if (last?.status === 'queued') {
        const c = parseTime(last.created_at);
        if (Number.isFinite(c)) right = `대기 ${fmtDuration(Date.now() - c)}`;
      } else if (last?.status === 'running') {
        const s = parseTime(last.started_at);
        if (Number.isFinite(s)) right = `경과 ${fmtDuration(Date.now() - s)}`;
      } else if (last) {
        const s = parseTime(last.started_at), f = parseTime(last.finished_at);
        if (Number.isFinite(s) && Number.isFinite(f)) right = `걸린 시간 ${fmtDuration(f - s)}`;
      }
      metaLeft.textContent = stepText;
      metaRight.textContent = right;
    };
    const stopTimers = (): void => {
      window.clearTimeout(pollTimer);
      window.clearInterval(tickTimer);
      pollTimer = tickTimer = 0;
    };
    const guardUnload = (e: BeforeUnloadEvent): void => { e.preventDefault(); e.returnValue = ''; };

    // ---- 보내기 (전처리 묶음 · 직접 고른 입력) ----
    const send = async (): Promise<void> => {
      if (!pkg) return;
      const id = newJobId(); // 거절된 시도의 번호는 다시 쓰지 않는다
      jobId = null;
      setState('보내는 중', 'run');
      setProgress(null);
      stepText = `입력 ${fmtSize(packageBytes(pkg))}`;
      tick();
      queueLine.textContent = messageLine.textContent = errorLine.textContent = '';
      keyRow.hidden = true;
      actions.replaceChildren();
      setSummary();
      window.addEventListener('beforeunload', guardUnload); // 보내는 동안 페이지를 떠나면 업로드가 끊긴다
      uploading = true;
      try {
        const res = await submitJob(id, pkg);
        if (!alive) return;
        jobId = id;
        setQuery(`job=${encodeURIComponent(id)}`);
        saveLastJob(id);
        setSummary();
        setState(res.status === 'running' ? STATE_LABEL.running : STATE_LABEL.queued, res.status === 'running' ? STATE_TAG.running : STATE_TAG.queued);
        stepText = '';
        tick();
        void poll();
      } catch (err) {
        if (alive) sendFailed(err);
      } finally {
        window.removeEventListener('beforeunload', guardUnload);
        uploading = false;
      }
    };

    const sendFailed = (err: unknown): void => {
      setProgress(0);
      stepText = '';
      tick();
      actions.replaceChildren();
      if (err instanceof EngineError && err.status === 401) {
        setState('접근 키 필요', 'warn');
        errorLine.textContent = keyEntered || hasAccessKey() ? '접근 키가 맞지 않습니다.' : err.message;
        keyRow.hidden = false;
        keyInput.focus();
        actions.append(button('입력 다시 고르기', backToForm, 'normal', 'rotate'));
        return;
      }
      setState('보내지 못함', 'err');
      if (err instanceof EngineError && err.status === 400) {
        errorLine.textContent = `해석엔진이 입력을 받지 않았습니다: ${err.message}`;
        actions.append(button('입력 다시 고르기', backToForm, 'primary', 'rotate'));
      } else {
        errorLine.textContent = `해석엔진에 보내지 못했습니다: ${errText(err)}`;
        actions.append(button('다시 보내기', () => void send(), 'primary', 'rotate'), button('입력 다시 고르기', backToForm, 'normal', 'upload'));
      }
    };

    // ---- 상태 조회 (3초마다, 대기·실행 중에만) ----
    const schedule = (): void => {
      window.clearTimeout(pollTimer);
      pollTimer = window.setTimeout(() => void poll(), POLL_MS);
    };
    const poll = async (): Promise<void> => {
      if (!alive || !jobId || inFlight) return;
      if (document.hidden) { pausedHidden = true; return; } // 탭이 가려지면 쉬고, 다시 보이면 바로 묻는다
      const id = jobId;
      inFlight = true;
      try {
        const st = await getJob(id);
        if (!alive || jobId !== id) return;
        failures = 0;
        applyStatus(st);
        if (st.status === 'queued' || st.status === 'running') schedule();
        else stopTimers();
      } catch (err) {
        if (!alive || jobId !== id) return;
        if (err instanceof EngineError && err.status === 404) { notFound(id); return; }
        failures += 1;
        errorLine.textContent = `상태를 읽지 못했습니다(${failures}회째). ${POLL_MS / 1000}초 뒤 다시 시도합니다: ${errText(err)}`;
        schedule();
      } finally {
        inFlight = false;
      }
    };
    const onVisible = (): void => { if (!document.hidden && pausedHidden) { pausedHidden = false; void poll(); } };
    document.addEventListener('visibilitychange', onVisible);

    const applyStatus = (st: JobStatus): void => {
      last = st;
      setState(STATE_LABEL[st.status] ?? st.status, STATE_TAG[st.status] ?? '');
      setSummary();
      const p = st.progress;
      const pct = p && typeof p.percent === 'number' && Number.isFinite(p.percent) ? p.percent : null; // 엔진은 전체 스텝이 0 이면 percent 를 null 로 준다
      if (st.status === 'completed') setProgress(100, 'done');
      else if (st.status === 'failed') setProgress(pct ?? 0, 'fail');
      else setProgress(pct);
      stepText = p ? `${fmtInt(p.step)} / ${fmtInt(p.total_steps)} 스텝${pct === null ? '' : ` · ${pct.toFixed(1)}%`}` : st.status === 'running' ? '준비 중' : '';
      tick();
      const active = st.status === 'queued' || st.status === 'running';
      if (active && !tickTimer) tickTimer = window.setInterval(tick, 1000);
      if (!active) { window.clearInterval(tickTimer); tickTimer = 0; }

      messageLine.textContent = st.status === 'failed' ? '' : st.message || '';
      errorLine.textContent = st.status === 'failed' ? st.message || '해석이 실패했습니다.' : '';
      if (st.status === 'queued') void showQueue();
      else queueLine.textContent = '';

      if (active) { actions.replaceChildren(); return; }
      const id = st.job_id || jobId || '';
      if (st.status === 'completed') {
        const zip = el('a', 'btn');
        zip.href = `engine/jobs/${encodeURIComponent(id)}/download?range=last`;
        zip.setAttribute('download', '');
        zip.append(icon('download'), el('span', undefined, '결과 ZIP 내려받기'));
        actions.replaceChildren(
          button('가시화', () => { location.href = `post.html?job=${encodeURIComponent(id)}`; }, 'primary', 'eye'),
          zip,
          button('새 입력 고르기', backToForm, 'normal', 'upload'),
        );
        stepPost.href = `post.html?job=${encodeURIComponent(id)}`;
      } else {
        const toPre = el('a', 'btn');
        toPre.href = 'pre.html';
        toPre.append(icon('flask'), el('span', undefined, '전처리로'));
        actions.replaceChildren(button('입력 다시 고르기', backToForm, 'primary', 'rotate'), toPre);
      }
    };

    /** 대기 중일 때 엔진 대기열 (GET /health). 화면에는 건수만 쓴다. 응답에는 실행 중인 작업 번호가 들어 있다(결과 공개 — deploy/README.md 1.4절) */
    const showQueue = async (): Promise<void> => {
      try {
        const h = await getHealth();
        if (!alive || last?.status !== 'queued') return;
        const parts: string[] = [];
        if (h.status === 'no_gpu') parts.push('해석엔진에서 GPU 를 찾지 못했습니다');
        if (h.running_job) parts.push('실행 중 1건');
        if (typeof h.queued_jobs === 'number') parts.push(`대기 ${h.queued_jobs}건`);
        queueLine.textContent = parts.join(' · ');
      } catch {
        if (alive) queueLine.textContent = '';
      }
    };

    const notFound = (id: string): void => {
      stopTimers();
      setState('찾을 수 없음', 'err');
      setProgress(0);
      stepText = '';
      tick();
      errorLine.textContent = `해석엔진에 이 작업이 없습니다: ${id}`;
      if (loadLastJob() === id) saveLastJob(null);
      actions.replaceChildren(button('입력 고르기', backToForm, 'primary', 'upload'));
    };

    // ---- 시작 ----
    if (pkg) void send();
    else {
      setState('확인 중', '');
      setProgress(null);
      setSummary();
      void poll();
    }

    return () => {
      alive = false;
      stopTimers();
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('beforeunload', guardUnload);
    };
  });
}

// ---------------------------------------------------------------------------
// 들어오는 길
// ---------------------------------------------------------------------------
async function boot(): Promise<void> {
  const q = new URLSearchParams(location.search);
  const job = q.get('job');
  if (job !== null) {
    if (JOB_ID_RE.test(job)) { showRun({ jobId: job }); return; }
    setQuery('');
    showForm('주소의 작업 번호가 올바르지 않습니다.');
    return;
  }
  if (q.get('from') === 'pre') {
    card.replaceChildren(el('p', 'line dim', '넘겨받은 입력을 여는 중'));
    let rec: HandoffRecord | null = null;
    let readError = '';
    try { rec = await takeHandoff(); } catch (e) { readError = errText(e); }
    if (rec) { showRun({ pkg: { engine: rec.engine, config: rec.config, files: rec.files } }); return; }
    setQuery('');
    showForm(readError ? `전처리에서 넘긴 입력을 읽지 못했습니다: ${readError}` : '전처리에서 넘긴 입력이 더 이상 없습니다. 파일을 직접 고르세요.');
    return;
  }
  showForm();
}

void boot();

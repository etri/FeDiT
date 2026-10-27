// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   panel.ts (전처리 속성 화면)

장면 트리의 "해석 설정" 줄들을 누르면 열리는 구획들: 해석기 · 계산 영역과 시간 · 재질 · 바깥 경계 · 영역(STL) · 해석기 설정 · 내보내기.
값은 PreState(state.ts)에 있고, 입력 요소는 바꿀 때마다 state.update(...)를 부른다. 형상 편집·보기 설정 구획은 ui/panel.ts의 것을 그대로 쓴다.
내보내기 구획의 '해석 실행'은 입력 묶음(JSON + STL)을 브라우저 저장소에 맡기고(data/handoff.ts) 물리 시뮬레이션 페이지(sim.html)로 옮긴다. 해석기는 그 페이지가 부른다.
알림창(alert)은 쓰지 않는다 — 호스트 iframe 에 allow-modals 가 없으면 말없이 막힌다. 결과·오류는 구획 안 상태 줄에.

화면 문법은 기존 패널과 같다: 짧은 한글 라벨 + 조작 요소 한 줄(row), 작은 소제목(sub), 계산된 값은 키·값 표(kv), 안내는 한 줄(hint).
해석기 입력 JSON의 키 이름은 라벨에 섞지 않고 칸의 도움말(title)로 둔다. 값이 정해진 키(경계 처리 방식 등)는 선택 상자로, 숫자 칸은 반올림 없이 값 그대로.

다시 그리기: 구획마다 '모양 서명'(항목 수·키 목록처럼 요소 구성을 정하는 것)을 두고, 서명이 바뀔 때만 요소를 새로 만들고(build)
그 밖에는 글자만 고친다(refresh). 새로 만들기는 한 박자 뒤로 미루고, 그 구획의 글자 칸에 커서가 있으면 커서가 나갈 때까지 더 미룬다 — 값을 고치고 다음 칸을 누르는 손을 끊지 않기 위해.
*/
/******************************************************************************/
import { AppCore } from '../core/AppCore';
import { Section, button, callout, checkbox, el, fmtInt, fmtNum, numberInput, row, section, select, withHelp } from '../ui/dom';
import { PreState } from './state';
import { BOUNDARY_FACES, CoreMaterial, JsonObject, SOLVER_INFO, SOLVER_KINDS, SolverKind, engineFor } from './solverInput';
import { LibraryModel, fetchLibraryStl, loadLibrary } from './library';
import { putHandoff } from '../data/handoff';

export const PRE_TABS = ['solver', 'domain', 'materials', 'boundaries', 'regions', 'settings', 'export'] as const;
export type PreTab = typeof PRE_TABS[number];

/** JSON 키 → 짧은 한글 라벨 (라벨 칸 84px에 맞게 6글자 안팎). 템플릿 5개의 설정·경계·재질 키를 모두 덮는다. 없는 키는 키 이름 그대로 */
const KEY_LABELS: Record<string, string> = {
  density: '밀도', dynamic_viscosity: '동적 점성', kinematic_viscosity: '운동 점성', diffusivity1: '확산계수',
  thermal_conductivity: '열전도율', specific_heat_capacity_pressure: '정압 비열', specific_heat_capacity_volume: '정적 비열', thermal_expansion_coefficient: '열팽창계수',
  rigid_density: '입자 밀도', Y_modulus: '영률', Poisson_ratio: '푸아송비', friction_coefficient: '마찰계수',
  rolling_friction_coefficient: '구름 마찰', restitution_coefficient: '반발계수', cohesive: '응집력',
  scheme: '경계 처리', momentum_type: '유입 조건', velocity: '속도', pressure: '압력', temperature: '온도', concentration1: '농도',
  thermal_type: '열 조건', material: '재질', surface_tension: '표면장력', contact_angle: '접촉각',
  turbulence_model: '난류 모델', smagorinsky_constant: '난류 상수', turbulent_Prandtl: '난류 Pr 수', turbulent_Schmidt: '난류 Sc 수',
  multiphase_model: '다상 모델', thermal_mode: '열 계산', critical_temperature: '임계 온도', saturated_temperature: '포화 온도',
  surface_tension_lattice: '격자 표면장력', number_of_components: '성분 수', interface_width: '경계면 두께', miscibility: '혼화성', mobility: '이동도',
  peng_robinsonA_lattice: 'PR 상수 A', peng_robinsonB_lattice: 'PR 상수 B', lambda_lattice: '람다(격자)', kappa_lattice: '카파(격자)', omega_bulk_lattice: '체적 완화율',
};
const labelOf = (k: string) => KEY_LABELS[k] ?? k;
/** 칸의 도움말에 보일 단위·뜻 (라벨만으로 모자란 것) */
const KEY_HELP: Record<string, string> = {
  dynamic_viscosity: '동적 점성계수 (Pa·s 계열)', kinematic_viscosity: '운동(동)점성계수 = 동적 점성 ÷ 밀도 (m²/s 계열)',
  is_main_material: '기본이 되는 유체 재질', turbulent_Prandtl: '난류 프란틀 수', turbulent_Schmidt: '난류 슈미트 수', smagorinsky_constant: 'Smagorinsky 난류 모델 상수',
};
const helpOf = (k: string) => (KEY_HELP[k] ? `${k} — ${KEY_HELP[k]}` : k);

/** 값이 정해진 키: 자유 입력 대신 선택 상자. 문서에만 있는 낯선 값은 '(그대로)' 선택지로 보존한다 */
const ENUM_OPTIONS: Record<string, { value: string; label: string }[]> = {
  scheme: [{ value: 'halfway', label: '벽 중간 반사 (halfway)' }, { value: 'equilibrium', label: '평형 분포 (equilibrium)' }],
  thermal_type: [{ value: 'isothermal', label: '온도 고정 (isothermal)' }, { value: 'adiabatic', label: '단열 (adiabatic)' }],
  momentum_type: [{ value: 'velocity', label: '속도 지정 (velocity)' }, { value: 'pressure', label: '압력 지정 (pressure)' }],
  turbulence_model: [{ value: 'none', label: '없음 (none)' }, { value: 'smagorinsky', label: '스마고린스키 (smagorinsky)' }, { value: 'LES', label: 'LES' }],
};
const PHASES = [{ value: 'gas', label: '기체 (gas)' }, { value: 'liquid', label: '액체 (liquid)' }, { value: 'solid', label: '고체 (solid)' }];
const BOUNDARY_TYPES = [
  { value: 'wall', label: '벽 (wall)' }, { value: 'periodic', label: '주기 (periodic)' }, { value: 'inlet', label: '유입 (inlet)' },
  { value: 'outflow_neumann', label: '유출 (outflow_neumann)' }, { value: 'none', label: '없음 (none)' }, { value: 'particle', label: '입자용 (particle)' },
];
const FACE_LABELS: Record<string, string> = { xmin: 'X 작은 쪽', xmax: 'X 큰 쪽', ymin: 'Y 작은 쪽', ymax: 'Y 큰 쪽', zmin: 'Z 아래 (작은 쪽)', zmax: 'Z 위 (큰 쪽)' };
const REGION_TYPES_LATTICE = [
  { value: 'fixed', label: '고정 고체·벽 (fixed)' }, { value: 'region_ref', label: '초기 유체 (region_ref)' },
  { value: 'cht', label: '열전달 고체 (cht)' }, { value: 'subdivision_ref', label: '격자 세분화 (subdivision_ref)' },
  { value: 'free_surface', label: '자유표면 유체 (free_surface)' },
];
const REGION_TYPES_PARTICLE = [{ value: 'fixed', label: '입자 벽 (fixed)' }, { value: 'region_ref', label: '입자 채움 (region_ref)' }];

type Vec3 = [number, number, number];
type Origin = { origin: 'lattice' | 'particle'; group: number };
const splitOrigin = (v: string): Origin => { const [o, g] = v.split(':'); return { origin: o as 'lattice' | 'particle', group: Number(g) }; };

/** 파일 내려받기 */
function download(blob: Blob, name: string): void {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

// ---- 작은 부품: 모두 JSON 키 이름을 도움말(title)로 단다 ----
function num(value: number, key: string, onCommit: (v: number) => void): HTMLInputElement {
  const i = numberInput(value, onCommit, { exact: true });
  i.title = helpOf(key);
  return i;
}

function vec(v: Vec3, key: string, onCommit: (v: Vec3) => void): HTMLElement {
  const w = el('div', 'triple');
  ['X', 'Y', 'Z'].forEach((axis, i) => {
    const input = numberInput(v[i], (x) => { const n: Vec3 = [...v]; n[i] = x; v = n; onCommit(n); }, { exact: true });
    input.title = `${key} ${axis}`;
    w.append(input);
  });
  return w;
}

/** 글자 칸. 비워 두고 나가면 이전 값으로 되돌린다 (빈 이름이 저장되지 않게) */
function text(value: string, key: string, onCommit: (v: string) => void): HTMLInputElement {
  const i = el('input', 'num text');
  i.type = 'text'; i.value = value; i.title = `${key}: ${value}`;
  i.addEventListener('change', () => {
    const v = i.value.trim();
    if (!v) { i.value = value; return; }
    value = v; i.title = `${key}: ${v}`; onCommit(v);
  });
  i.addEventListener('keydown', (e) => { if (e.key === 'Enter') i.blur(); });
  return i;
}

/** 선택 상자. 목록에 없는 값은 '(그대로)'로 남겨 둔다 */
function choice(options: { value: string; label: string }[], value: string, key: string, onChange: (v: string) => void): HTMLSelectElement {
  const opts = options.some((o) => o.value === value) ? options : [...options, { value, label: `${value} (그대로)` }];
  const s = select(opts, value, onChange);
  s.title = helpOf(key);
  return s;
}

/** 라벨이 84px 라벨 칸에 안 들어가는 긴 원문 키(한글 라벨이 없는 사용자 JSON의 키)는 라벨 위·칸 아래 배치(슬라이더와 같은 모양)로 */
function fieldOrRow(label: string, control: HTMLElement): HTMLElement {
  const width = Array.from(label).reduce((w, ch) => w + (/[가-힣]/.test(ch) ? 12 : /[A-Z_]/.test(ch) ? 7.5 : 6.5), 0);
  if (width <= 82) return row(label, control);
  const f = el('div', 'field');
  const head = el('div', 'field-head');
  head.append(el('label', 'field-label', label));
  f.append(head, control);
  return f;
}

/** 키·값 표 (계산된 값·요약). refresh에서 글자만 바꿀 수 있게 값 칸을 돌려준다 */
function kvTable(pairs: [string, string][]): { root: HTMLElement; values: HTMLElement[] } {
  const root = el('div', 'kv');
  const values: HTMLElement[] = [];
  for (const [k, v] of pairs) { const vEl = el('span', 'v', v); root.append(el('span', 'k', k), vEl); values.push(vEl); }
  return { root, values };
}

/**
 * 모양이 열린 객체(해석기 설정 블록·경계의 추가 키 등)를 키마다 알맞은 한 줄로. 값이 정해진 키는 선택 상자, 숫자·참/거짓·글자·숫자 3개 배열은
 * 고칠 수 있고, 그 밖의 값은 읽기 전용 글로 보여 준다. 값은 obj에 바로 쓴다
 */
function objectRows(obj: JsonObject, onChange: () => void, materialNames: string[] = []): HTMLElement[] {
  const out: HTMLElement[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const label = labelOf(k);
    const set = (x: unknown) => { obj[k] = x; onChange(); };
    if (typeof v === 'string' && ENUM_OPTIONS[k]) out.push(fieldOrRow(label, choice(ENUM_OPTIONS[k], v, k, set)));
    else if (typeof v === 'string' && k === 'material' && materialNames.length) out.push(fieldOrRow(label, choice(materialNames.map((m) => ({ value: m, label: m })), v, k, set)));
    else if (typeof v === 'number') out.push(fieldOrRow(label, num(v, k, set)));
    else if (typeof v === 'boolean') { const c = checkbox(label, v, set); c.input.title = helpOf(k); out.push(c.root); }
    else if (typeof v === 'string') out.push(fieldOrRow(label, text(v, k, set)));
    else if (Array.isArray(v) && v.length === 3 && v.every((x) => typeof x === 'number')) out.push(fieldOrRow(label, vec(v as Vec3, k, set)));
    else {
      const ro = el('input', 'num text'); ro.type = 'text'; ro.readOnly = true; ro.value = JSON.stringify(v); ro.title = `${k} — 화면에서 고치지 않고 그대로 내보냅니다`;
      out.push(fieldOrRow(label, ro));
    }
  }
  return out;
}

/** 구획 하나: 모양 서명이 바뀌면 build, 아니면 refresh */
interface Part { id: PreTab; sec: Section; sig: () => string; build: () => void; refresh?: () => void; lastSig: string; dirty: boolean }

export interface PrePanel {
  sections: { id: PreTab; sec: Section }[];
  /** 장면 트리 줄의 짧은 상태 글 */
  meta(tab: PreTab): string;
  /** 숨겨져 있어서 미뤄 둔 구획을 그린다 (탭이 바뀌어 보이게 될 때 부른다) */
  refresh(): void;
  /** 해석기 구획의 상태 줄 (끌어다 놓기 결과·오류). 빈 글이면 숨긴다 */
  setSolverStatus(msg: string, isError?: boolean): void;
}

export function mountPrePanel(app: AppCore, state: PreState): PrePanel {
  const library: { list: LibraryModel[]; error: string } = { list: [], error: '' };
  void loadLibrary().then((l) => { library.list = l; schedule(); }).catch((e) => { library.error = (e as Error).message; schedule(); });

  const needDoc = (body: HTMLElement): boolean => {
    if (state.core) return true;
    body.innerHTML = '';
    body.append(el('div', 'hint', '먼저 "해석기" 화면에서 템플릿으로 시작하거나 입력 JSON을 여세요.'));
    return false;
  };
  const update = (f: (c: NonNullable<typeof state.core>) => void) => state.update(f);

  // ---------- 해석기 ----------
  const solver = section('flask', '해석기');
  const kindSel = select<SolverKind>(SOLVER_KINDS.map((k) => ({ value: k, label: SOLVER_INFO[k].label })), 'multi_component', () => syncKind());
  const KEY_TIP = '칸에 마우스를 올리면 JSON 키 이름이 보입니다.'; // 키 이름 title 이 붙는 화면마다 물음표에 넣는다
  const syncKind = () => {
    const k = kindSel.value as SolverKind;
    kindSel.title = `solver_type = ${SOLVER_INFO[k].solverType} · 실행 파일 ${SOLVER_INFO[k].engine === 'lbm_dem' ? 'LBM_DEM' : 'LBM'}`;
  };
  syncKind();
  const solverStatus = el('div', 'status');
  const setSolverStatus = (msg: string, isError = false) => { solverStatus.textContent = msg; solverStatus.classList.toggle('error', isError); solverStatus.hidden = !msg; };
  setSolverStatus('');
  const startBtn = button('템플릿으로 시작', async () => {
    startBtn.disabled = true;
    try { await state.startFromTemplate(kindSel.value as SolverKind); setSolverStatus(''); }
    catch (e) { setSolverStatus((e as Error).message, true); }
    startBtn.disabled = false;
  }, 'primary', 'flask');
  startBtn.classList.add('btn-block');
  const jsonInput = el('input'); jsonInput.type = 'file'; jsonInput.accept = '.json,.stl'; jsonInput.multiple = true; jsonInput.hidden = true;
  jsonInput.addEventListener('change', async () => {
    const files = Array.from(jsonInput.files ?? []);
    jsonInput.value = '';
    const json = files.find((f) => /\.json$/i.test(f.name));
    if (!json) { setSolverStatus('입력 JSON(.json)을 함께 고르세요.', true); return; }
    const stls = new Map<string, Uint8Array>();
    for (const f of files) if (/\.stl$/i.test(f.name)) stls.set(f.name, new Uint8Array(await f.arrayBuffer()));
    try { await state.openJson(await json.text(), json.name, stls); setSolverStatus(''); }
    catch (e) { setSolverStatus((e as Error).message, true); }
  });
  const openBtn = button('입력 JSON 열기', () => jsonInput.click(), 'normal', 'upload');
  openBtn.classList.add('btn-block');
  openBtn.title = 'JSON과 함께 STL 파일을 골라도 됩니다';
  const current = el('div', 'kv');
  const missing = callout('warn');
  solver.body.append(withHelp(row('해석 종류', kindSel), SOLVER_KINDS.map((k) => `${SOLVER_INFO[k].label}: ${SOLVER_INFO[k].description}`)), startBtn, openBtn, jsonInput, solverStatus,
    el('div', 'sub', '현재 입력'), current, missing.root);
  solver.setHelp(KEY_TIP);
  const refreshSolver = () => {
    const c = state.core;
    current.innerHTML = '';
    if (!state.doc || !c) { current.append(el('span', 'v wide', '아직 연 입력이 없습니다.')); missing.root.hidden = true; return; }
    const pairs: [string, string][] = [
      ['출처', state.sourceName],
      ['해석 종류', state.kind ? SOLVER_INFO[state.kind].label : '알 수 없음'],
      ['실행 파일', state.engineLabel],
      ['영역', `${state.regions.length}개${state.missingStl.length ? ` (STL 없음 ${state.missingStl.length})` : ''}`],
      ['재질', `${c.materials.length}개`],
    ];
    for (const [k, v] of pairs) current.append(el('span', 'k', k), el('span', 'v', v));
    missing.root.hidden = state.missingStl.length === 0;
    missing.text.textContent = `찾지 못한 STL: ${state.missingStl.join(', ')}. 영역 화면에서 다시 추가하세요.`;
  };
  state.onAdopt(() => { if (state.kind) { kindSel.value = state.kind; syncKind(); } }); // 새 입력을 열 때만 드롭다운을 맞춘다

  // ---------- 계산 영역과 시간 ----------
  const domain = section('box', '계산 영역과 시간');
  domain.setHelp(['3D 화면의 주황 상자가 계산 영역입니다.', KEY_TIP]);
  let cellsVal: HTMLElement | null = null, savesVal: HTMLElement | null = null;
  const savesText = (c: NonNullable<typeof state.core>) => {
    const n = c.time.saveInterval > 0 ? Math.max(0, Math.floor((Math.min(c.time.endTime, c.time.saveEnd) - c.time.saveStart) / c.time.saveInterval)) + 1 : 0;
    return n ? `${fmtInt(n)}회${c.time.saveEnd >= c.time.endTime ? ' (계산 끝까지 저장)' : ''}` : '-';
  };
  const cellsText = () => (state.cellEstimate() ? `약 ${fmtInt(state.cellEstimate())}개 (세분화 전)` : '격자 간격이 0보다 커야 합니다');
  const buildDomain = () => {
    const body = domain.body;
    if (!needDoc(body)) return;
    const c = state.core!;
    body.innerHTML = '';
    const cells = kvTable([['기본 격자 셀', cellsText()]]);
    const saves = kvTable([['저장 횟수', savesText(c)]]);
    cellsVal = cells.values[0]; savesVal = saves.values[0];
    const dx = num(c.domain.baseDx, 'lattice_generation[0].base_dx', (v) => update((k) => { k.domain.baseDx = v; }));
    dx.title = 'base_dx — 격자 한 칸의 크기. 단위는 템플릿을 따릅니다(격자 단위 또는 m)';
    body.append(
      el('div', 'sub', '계산 영역'),
      row('최소 (X, Y, Z)', vec(c.domain.min, 'lattice_generation[0].base_region.min', (v) => update((k) => { k.domain.min = v; }))),
      row('최대 (X, Y, Z)', vec(c.domain.max, 'lattice_generation[0].base_region.max', (v) => update((k) => { k.domain.max = v; }))),
      row('격자 간격', dx),
      cells.root,
      el('div', 'sub', '시간'),
      row('계산 끝', num(c.time.endTime, 'solver_common.simulation_end_time', (v) => update((k) => { k.time.endTime = v; }))),
      row('시간 간격', num(c.time.timeStep, 'solver_common.time_step', (v) => update((k) => { k.time.timeStep = v; }))),
      row('저장 시작', num(c.time.saveStart, 'result_report.save_start_time', (v) => update((k) => { k.time.saveStart = v; }))),
      row('저장 끝', num(c.time.saveEnd, 'result_report.save_end_time', (v) => update((k) => { k.time.saveEnd = v; }))),
      row('저장 간격', num(c.time.saveInterval, 'result_report.save_time_interval', (v) => update((k) => { k.time.saveInterval = v; }))),
      saves.root,
      el('div', 'sub', '중력과 초기 상태'),
      row('중력 (X, Y, Z)', vec(c.gravity, 'source_terms.gravity', (v) => update((k) => { k.gravity = v; }))),
      row('초기 압력', num(c.initial.pressure, 'initial_conditions[주 항목].pressure', (v) => update((k) => { k.initial.pressure = v; }))),
      row('초기 속도', vec(c.initial.velocity, 'initial_conditions[주 항목].velocity', (v) => update((k) => { k.initial.velocity = v; }))),
    );
  };
  const refreshDomain = () => { const c = state.core; if (!c || !cellsVal || !savesVal) return; cellsVal.textContent = cellsText(); savesVal.textContent = savesText(c); };

  // ---------- 재질 ----------
  const materials = section('droplet', '재질');
  materials.setHelp(['이름을 바꾸거나 지우면 그 재질을 쓰는 영역도 따라갑니다.', KEY_TIP]);
  let materialHeads: HTMLElement[] = [];
  const buildMaterials = () => {
    const body = materials.body;
    if (!needDoc(body)) return;
    const c = state.core!;
    body.innerHTML = '';
    materialHeads = [];
    c.materials.forEach((m, i) => {
      const head = el('div', 'sub', `재질 ${i + 1} · ${m.name}`);
      materialHeads.push(head);
      const main = checkbox('주 재질 (기본 유체)', m.isMain ?? false, (v) => update((k) => { k.materials.forEach((x, j) => { x.isMain = j === i ? v : (v ? false : x.isMain); }); }));
      main.input.title = helpOf('is_main_material');
      const del = el('div', 'btn-row');
      del.append(button('삭제', () => update((k) => {
        // 이 재질을 쓰는 영역은 주 재질(없으면 첫 재질)로 돌린다
        const fallback = k.materials.find((x, j) => j !== i && x.isMain) ?? k.materials.find((_, j) => j !== i);
        for (const r of state.regions) if (r.material === m.name && fallback) r.material = fallback.name;
        k.materials.splice(i, 1);
      }), 'danger', 'trash'));
      body.append(
        head,
        row('이름', text(m.name, 'name', (v) => update((k) => { const old = k.materials[i].name; k.materials[i].name = v; for (const r of state.regions) if (r.material === old) r.material = v; }))),
        row('물질 상태', choice(PHASES, m.phase, 'phase', (v) => update((k) => { k.materials[i].phase = v; }))),
        main.root,
        ...objectRows(m.props as unknown as JsonObject, () => update(() => {})),
        del,
      );
    });
    const add = button('재질 추가', () => update((k) => {
      const last = k.materials[k.materials.length - 1];
      const m: CoreMaterial = last
        ? { ...PreState.clone(last), name: `${last.name}_2`, isMain: last.isMain === undefined ? undefined : false }
        : { name: 'material', phase: 'liquid', isMain: k.materials.length === 0, props: { density: 1, dynamic_viscosity: 0.001 }, extra: {} };
      k.materials.push(m);
    }), 'normal', 'plus');
    add.classList.add('btn-block');
    add.title = '마지막 재질을 복사해 하나 더 만듭니다';
    body.append(add);
  };
  const refreshMaterials = () => { state.core?.materials.forEach((m, i) => { if (materialHeads[i]) materialHeads[i].textContent = `재질 ${i + 1} · ${m.name}`; }); };

  // ---------- 바깥 경계 ----------
  const boundaries = section('layers2', '바깥 경계');
  boundaries.setHelp(['종류를 바꿔도 유입 속도 같은 추가 칸은 저절로 생기지 않습니다.', KEY_TIP]);
  const buildBoundaries = () => {
    const body = boundaries.body;
    if (!needDoc(body)) return;
    const c = state.core!;
    body.innerHTML = '';
    const names = c.materials.map((m) => m.name);
    for (const face of BOUNDARY_FACES) {
      const b = c.boundaries[face];
      body.append(
        el('div', 'sub', `${FACE_LABELS[face]} (${face})`),
        row('종류', choice(BOUNDARY_TYPES, b.type, `outer_boundary_condition.${face}.type`, (v) => update((k) => { k.boundaries[face].type = v; }))),
        ...objectRows(b.extra, () => update(() => {}), names),
      );
    }
  };

  // ---------- 영역 (STL) ----------
  const regions = section('building', '영역 (STL)');
  regions.setHelp(KEY_TIP);
  let regionHeads: HTMLElement[] = [], regionKv: (HTMLElement[] | null)[] = [];
  const regionPairs = (o: { size: number[]; scale: number[]; position: number[]; rotationZ: number }): [string, string][] => [
    ['크기', o.size.map((s, k) => s * o.scale[k]).map(fmtNum).join(' × ')],
    ['위치', o.position.map(fmtNum).join(', ')],
    ['회전', o.rotationZ ? `${fmtNum(o.rotationZ)}°` : '없음'],
  ];
  const buildRegions = () => {
    const body = regions.body;
    if (!needDoc(body)) return;
    const c = state.core!;
    body.innerHTML = '';
    regionHeads = []; regionKv = [];
    const matOpts = c.materials.map((m) => ({ value: m.name, label: m.name }));
    const groups = state.particleGroups();
    const originOpts = [{ value: 'lattice:0', label: '유체 격자' }, ...Array.from({ length: groups }, (_, g) => ({ value: `particle:${g}`, label: `입자 그룹 ${g + 1}` }))];

    state.regions.forEach((r, i) => {
      const o = r.objectId ? app.objects.byId(r.objectId) : undefined;
      const head = el('div', 'sub', `영역 ${i + 1} · ${r.name || r.meshPath}${o ? '' : ' · STL 없음'}`);
      regionHeads.push(head);
      body.append(head);
      if (r.origin === 'lattice') body.append(row('이름', text(r.name, 'name', (v) => state.updateRegion(i, { name: v }))));
      body.append(
        row('STL 파일', text(r.meshPath, 'mesh_path', (v) => state.updateRegion(i, { meshPath: v }))),
        row('재질', choice(matOpts, r.material, 'material', (v) => state.updateRegion(i, { material: v }))),
        row('역할', choice(r.origin === 'particle' ? REGION_TYPES_PARTICLE : REGION_TYPES_LATTICE, r.regionType, 'region_type', (v) => state.updateRegion(i, { regionType: v }))),
        row('소속', choice(originOpts, `${r.origin}:${r.group}`, 'lattice_generation / particle_generation', (v) => state.updateRegion(i, splitOrigin(v)))),
      );
      if (o) { const t = kvTable(regionPairs(o)); regionKv.push(t.values); body.append(t.root); } else regionKv.push(null);
      const btns = el('div', 'btn-row');
      if (o) btns.append(button('3D에서 선택', () => app.objects.select([o.id], 'replace'), 'normal', 'cursor'));
      btns.append(button('삭제', () => state.removeRegion(i), 'danger', 'trash'));
      body.append(btns);
    });
    if (!state.regions.length) body.append(el('div', 'hint', '영역이 없습니다. 아래에서 추가하세요.'));

    // 추가
    // 처음 값은 비워 둔다: 첫 항목을 기본으로 두면 해석기와 상관없는 STL(예: 21 MB RTI_region)이 그냥 눌러서 얹힌다
    const libSel = select<string>([{ value: '', label: '고르세요' }, ...library.list.map((m) => ({ value: m.file, label: m.label }))], '', () => { addLib.disabled = !libSel.value; });
    const libNote = el('div', 'hint'); // 상태·오류만 (모델마다의 설명은 '내장 STL' 옆 물음표에)
    libNote.textContent = library.list.length ? '' : library.error ? `내장 STL 목록을 읽지 못했습니다: ${library.error}` : '내장 STL 목록을 읽는 중…';
    const libRow = row('내장 STL', libSel);
    const libHelp = library.list.filter((m) => m.note).map((m) => `${m.label}: ${m.note}`);
    if (libHelp.length) withHelp(libRow, libHelp);
    const typeSel = choice(REGION_TYPES_LATTICE, 'fixed', 'region_type', () => {});
    const matSel = select(matOpts, (c.materials.find((m) => m.isMain) ?? c.materials[0])?.name ?? null, () => {});
    const originSel = select(originOpts, 'lattice:0', () => {});
    const addLib = button('내장 STL 추가', async () => {
      const file = libSel.value; if (!file) return;
      const bytes = await fetchLibraryStl(file).catch(() => null);
      if (!bytes) { libNote.textContent = `${file}을 가져오지 못했습니다.`; return; }
      state.addRegionFromBytes(bytes, file, { regionType: typeSel.value, material: matSel.value, ...splitOrigin(originSel.value) });
    }, 'primary', 'book');
    addLib.disabled = !libSel.value;
    const stlInput = el('input'); stlInput.type = 'file'; stlInput.accept = '.stl'; stlInput.multiple = true; stlInput.hidden = true;
    stlInput.addEventListener('change', async () => {
      const files = Array.from(stlInput.files ?? []); stlInput.value = '';
      for (const f of files) state.addRegionFromBytes(new Uint8Array(await f.arrayBuffer()), f.name, { regionType: typeSel.value, material: matSel.value, ...splitOrigin(originSel.value) });
    });
    const addUpload = button('STL 파일로 추가', () => stlInput.click(), 'normal', 'upload');
    const free = state.unassignedObjects();
    const objSel = select<string>(free.map((o) => ({ value: o.id, label: o.name })), free[0]?.id ?? null, () => {});
    const addObj = button('형상을 영역으로 추가', () => {
      if (!objSel.value) return;
      state.addRegionFromObject(objSel.value, { regionType: typeSel.value, material: matSel.value, ...splitOrigin(originSel.value) });
    }, 'normal', 'plus');
    addObj.disabled = objSel.disabled = free.length === 0;
    const row1 = el('div', 'btn-row'); row1.append(addLib, addUpload);
    const row2 = el('div', 'btn-row'); row2.append(addObj);
    body.append(
      el('div', 'sub', '영역 추가'),
      libRow, libNote, row('역할', typeSel), row('재질', matSel), row('소속', originSel), row1, stlInput,
      withHelp(row('형상', objSel), '아직 영역이 아닌 형상(형상 편집에서 만든 상자·원기둥, 복제·분리 등으로 새로 생긴 형상)을 영역으로 추가합니다. 3D 화면에 끌어다 놓은 STL은 바로 영역이 됩니다.'), row2,
    );
  };
  const refreshRegions = () => {
    state.regions.forEach((r, i) => {
      const o = r.objectId ? app.objects.byId(r.objectId) : undefined;
      if (regionHeads[i]) regionHeads[i].textContent = `영역 ${i + 1} · ${r.name || r.meshPath}${o ? '' : ' · STL 없음'}`;
      const vals = regionKv[i];
      if (o && vals) regionPairs(o).forEach(([, v], j) => { if (vals[j]) vals[j].textContent = v; });
    });
  };

  // ---------- 해석기 설정 ----------
  const settings = section('sliders', '해석기 설정');
  settings.setHelp(['화면에 없는 값은 템플릿 값 그대로 내보냅니다.', KEY_TIP]);
  const buildSettings = () => {
    const body = settings.body;
    if (!needDoc(body)) return;
    const c = state.core!;
    body.innerHTML = '';
    const key = state.kind ? SOLVER_INFO[state.kind].settingsKey : null;
    settings.summary.textContent = key ?? '';
    if (!key) { body.append(el('div', 'hint', '이 해석 종류는 따로 설정 블록이 없습니다.')); return; }
    const rows = objectRows(c.solverSettings, () => update(() => {}));
    body.append(...(rows.length ? rows : [el('div', 'hint', '설정 항목이 없습니다.')]));
  };

  // ---------- 내보내기 ----------
  const exportSec = section('export', '내보내기');
  exportSec.setHelp(["'해석 실행'은 지금 설정(JSON + STL)을 물리 시뮬레이션 페이지로 넘깁니다.", '결과 ZIP은 후처리 페이지에서 엽니다.']);
  let lastIssues = { errors: 0, warnings: 0 };
  let exportParts: { check: HTMLElement; summary: HTMLElement[]; runBtn: HTMLButtonElement; zipBtn: HTMLButtonElement; jsonBtn: HTMLButtonElement; status: HTMLElement; preview: HTMLTextAreaElement } | null = null;
  /** 내보내기 구획의 상태 줄 (해석 실행 준비·내려받기 오류). 빈 글이면 숨긴다 */
  const setExportStatus = (msg: string, isError = false) => {
    const s = exportParts?.status;
    if (!s) return;
    s.textContent = msg; s.classList.toggle('error', isError); s.hidden = !msg;
  };
  let handingOff = false; // 묶음을 맡기는 중(페이지를 옮기기 전까지) — 단추를 다시 켜지 않는다
  /** 해석 실행: 내보내기와 같은 묶음(JSON + STL)을 맡기고 물리 시뮬레이션 페이지로 옮긴다. 해석기는 그 페이지가 부른다 */
  const runSimulation = async () => {
    if (handingOff) return;
    const errors = state.validate().filter((i) => i.level === 'error');
    if (errors.length) { refreshExport(); return; } // 검사 목록에 오류가 보인다
    handingOff = true;
    if (exportParts) exportParts.runBtn.disabled = true;
    setExportStatus('물리 시뮬레이션 페이지로 넘기는 중…');
    try {
      const { fileName, text: t } = state.exportJsonText();
      const files = state.exportFiles();
      const engine = engineFor(state.buildDoc());
      await putHandoff({ engine, config: { name: fileName, text: t }, files });
      location.href = 'sim.html?from=pre'; // 페이지 기준 상대 주소 (하위 경로 배포)
    } catch (e) {
      handingOff = false;
      setExportStatus(`넘기지 못했습니다: ${(e as Error).message}`, true);
      refreshExport();
    }
  };
  // 물리 시뮬레이션 페이지에서 '뒤로'로 돌아와 페이지가 그대로 되살아나면(bfcache) 단추와 상태 줄을 되돌린다
  window.addEventListener('pageshow', (e) => {
    if (!e.persisted || !handingOff) return;
    handingOff = false;
    setExportStatus('');
    refreshExport();
  });
  const buildExport = () => {
    const body = exportSec.body;
    if (!needDoc(body)) { exportParts = null; return; }
    body.innerHTML = '';
    const stem = text(state.fileStem, 'meta.title', (v) => { state.fileStem = v.replace(/\.json$/i, ''); update(() => {}); });
    const check = el('div', 'kv');
    const summary = kvTable([['JSON', ''], ['STL', '']]);
    const runBtn = button('해석 실행', () => { void runSimulation(); }, 'primary', 'play');
    runBtn.title = '지금 설정을 물리 시뮬레이션 페이지로 넘깁니다';
    const zipBtn = button('ZIP으로 내보내기', () => {
      try { const { fileName, blob } = state.exportZipBlob(); download(blob, fileName); setExportStatus(''); }
      catch (e) { setExportStatus((e as Error).message, true); }
    }, 'normal', 'download');
    zipBtn.title = 'JSON과 STL을 한 ZIP으로 내려받습니다';
    const jsonBtn = button('JSON만 내보내기', () => {
      try { const { fileName, text: t } = state.exportJsonText(); download(new Blob([t], { type: 'application/json' }), fileName); setExportStatus(''); }
      catch (e) { setExportStatus((e as Error).message, true); }
    }, 'normal', 'file');
    const btns = el('div', 'btn-row'); btns.append(runBtn, zipBtn, jsonBtn);
    const status = el('div', 'status');
    status.hidden = true;
    const preview = el('textarea', 'num text json-preview');
    preview.readOnly = true;
    body.append(
      row('파일 이름', stem),
      el('div', 'sub', '검사'), check,
      el('div', 'sub', '내보낼 파일'), summary.root, btns, status,
      el('div', 'sub', 'JSON 미리 보기'), preview,
    );
    exportParts = { check, summary: summary.values, runBtn, zipBtn, jsonBtn, status, preview };
    refreshExport();
  };
  const refreshExport = () => {
    const p = exportParts;
    if (!p || !state.core) return;
    const issues = state.validate();
    lastIssues = { errors: issues.filter((i) => i.level === 'error').length, warnings: issues.filter((i) => i.level === 'warning').length };
    p.check.innerHTML = '';
    for (const i of issues) p.check.append(el('span', `k ${i.level === 'error' ? 'err' : 'warn'}`, i.level === 'error' ? '오류' : '주의'), el('span', 'v', i.message));
    if (!issues.length) p.check.append(el('span', 'v wide', '통과 — 해석기가 거절할 조건이 없습니다.'));
    const files = state.exportFiles();
    p.summary[0].textContent = `${state.fileStem || 'input'}.json`;
    p.summary[1].textContent = files.length ? files.map((f) => `${f.name} (${Math.round(f.bytes.byteLength / 1024)} KB)`).join(', ') : '없음';
    p.zipBtn.disabled = p.jsonBtn.disabled = lastIssues.errors > 0;
    p.runBtn.disabled = lastIssues.errors > 0 || handingOff;
    try { p.preview.value = state.exportJsonText().text; } catch (e) { p.preview.value = (e as Error).message; }
  };

  // ---------- 그리기 조율 ----------
  const matKeys = () => state.core?.materials.map((m) => `${Object.keys(m.props).join(',')}|${m.isMain}`).join(';') ?? '';
  const parts: Part[] = [
    { id: 'solver', sec: solver, sig: () => 'static', build: () => {}, refresh: refreshSolver, lastSig: '', dirty: true },
    { id: 'domain', sec: domain, sig: () => `${state.docSerial}`, build: buildDomain, refresh: refreshDomain, lastSig: '', dirty: true },
    { id: 'materials', sec: materials, sig: () => `${state.docSerial}|${matKeys()}`, build: buildMaterials, refresh: refreshMaterials, lastSig: '', dirty: true },
    { id: 'boundaries', sec: boundaries, sig: () => `${state.docSerial}|${state.core?.materials.map((m) => m.name).join(',')}|${BOUNDARY_FACES.map((f) => `${state.core?.boundaries[f].type}:${Object.keys(state.core?.boundaries[f].extra ?? {}).join(',')}`).join(';')}`, build: buildBoundaries, lastSig: '', dirty: true },
    { id: 'regions', sec: regions, sig: () => `${state.docSerial}|${library.list.length}|${library.error}|${state.core?.materials.map((m) => m.name).join(',')}|${state.regions.map((r) => `${r.objectId}:${r.origin}:${r.group}:${r.regionType}:${r.material}`).join(';')}|${state.unassignedObjects().map((o) => o.id).join(',')}`, build: buildRegions, refresh: refreshRegions, lastSig: '', dirty: true },
    { id: 'settings', sec: settings, sig: () => `${state.docSerial}|${Object.keys(state.core?.solverSettings ?? {}).join(',')}`, build: buildSettings, lastSig: '', dirty: true },
    { id: 'export', sec: exportSec, sig: () => `${state.docSerial}`, build: buildExport, refresh: refreshExport, lastSig: '', dirty: true },
  ];
  /** 글자를 치는 칸에 커서가 있는가 (단추·선택 상자는 해당 없음) */
  const typingIn = (root: HTMLElement): boolean => {
    const a = document.activeElement as HTMLElement | null;
    if (!a || !root.contains(a)) return false;
    return a.tagName === 'TEXTAREA' || (a.tagName === 'INPUT' && ['text', 'number'].includes((a as HTMLInputElement).type));
  };
  const draw = () => {
    for (const p of parts) {
      if (p.sec.root.hidden) { p.dirty = true; continue; } // 숨은 구획은 보일 때(refresh) 그린다
      const sig = p.sig();
      if (sig !== p.lastSig) {
        if (typingIn(p.sec.root)) { p.dirty = true; continue; } // 커서가 나가면 focusout에서 다시
        p.build(); p.lastSig = sig;
      } else if (p.dirty || true) {
        p.refresh?.();
      }
      p.dirty = false;
    }
  };
  let scheduled = false;
  const schedule = () => { if (scheduled) return; scheduled = true; setTimeout(() => { scheduled = false; draw(); }, 0); };
  for (const p of parts) p.sec.root.addEventListener('focusout', () => setTimeout(() => { if (p.dirty && !p.sec.root.hidden) draw(); }, 0));
  state.subscribe(schedule);
  let raf = 0;
  app.objects.subscribe(() => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; draw(); }); }); // 핸들을 끄는 동안은 프레임당 한 번만
  draw();

  return {
    sections: parts.map((p) => ({ id: p.id, sec: p.sec })),
    refresh: draw,
    setSolverStatus,
    meta(tab) {
      const c = state.core;
      switch (tab) {
        case 'solver': return state.kind ? SOLVER_INFO[state.kind].label : (c ? '?' : '');
        case 'domain': return c ? `셀 ${fmtInt(state.cellEstimate())}` : '';
        case 'materials': return c ? `${c.materials.length}개` : '';
        case 'regions': return c ? `${state.regions.length}개` : '';
        case 'export': return c ? (lastIssues.errors ? `오류 ${lastIssues.errors}` : lastIssues.warnings ? `주의 ${lastIssues.warnings}` : '준비됨') : '';
        default: return '';
      }
    },
  };
}

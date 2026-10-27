// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   opacityEditor.ts

Opacity 곡선 편집기 (ParaView Color Map Editor 의 불투명도 전달함수 칸). Color Map 묶음의 'Opacity 곡선' 줄 아래에 놓인다
(panel.ts mapEditor — 노드 화면의 Color Map 묶음과 Color Map 화면 두 곳).
그림 한 장(SVG): 곡선 아래를 Preset 색으로 칠한 면 · 그 위 옅은 히스토그램 막대(Volume 이 그리는 셀의 값을 Color Map 범위로 고르게 나눈 칸마다 센 셀 수 —
노드 화면은 그 노드가 그리는 셀(Clip·Threshold 는 남은 셀), Color Map 화면은 그 지도로 Volume 을 그리는 보이는 노드들의 셀 합. 무엇을 셀지는 panel.ts 가 cells 로 넘긴다) ·
꺾은선과 제어점 · 맨 아래 Preset 색 띠. 가로 = Color Map 범위(최소 ~ 최대 = 곡선의 x 0~1), 세로 = Opacity(0~1).
그 아래 범위 양 끝 값, 고른 점의 숫자 칸(값 · Opacity), 시작 곡선 select, 히스토그램 표시 칸, 히스토그램 상태 한 줄.
조작 (ParaView 와 같음 — 참조 설명서 'Transfer function editor', VTK vtkControlPointsItem): 곡선 칸 빈 곳을 누르면 그 자리에 점이 생기고(누르는 순간 —
그대로 끌면 옮겨진다), 점을 끌면 옮겨진다. 곡선 칸 밖(아래 색 띠·양옆 여백)은 점에 걸리지 않으면 아무 일도 없다. 안쪽 점은 이웃 점을 넘지 못하고,
양 끝 점은 위아래로만 움직이며 지울 수 없다. Delete·Backspace 는 고른 점을 지운다.
PV와 다름: 화살표 키가 고른 점을 옮긴다(PV 는 Alt+화살표로 옮기고 맨 화살표로 고른 점을 바꾼다 — 여기서는 점마다
Tab 으로 초점이 가고 Home·End 로 첫·끝 점) · 점을 잡은 자리와 점 중심의 차이를 끄는 동안 그대로 둔다(PV 는 점이 커서 자리로 옮겨진다) ·
터치는 잡는 거리가 넓고 빈 곳은 짧게 눌렀다 뗄 때 점이 생긴다 · midpoint·sharpness 없음(늘 직선 — PV 기본 0.5·0 과 같은 모양) ·
히스토그램은 처음부터 보이고 저절로 다시 센다(PV 는 기본 끔·다시 계산 단추) · Color Map 화면의 히스토그램은 Volume 으로 그리는 노드만 센다(PV 는 그 지도로
칠하는 보이는 표현 전부의 입력 — Surface·Slice 도. 곡선은 Volume 에만 쓰이므로 뺐다) · 막대 높이를 로그로도 볼 수 있다(PV 는 가장 큰 칸 기준 선형만) · 시작 곡선 목록(우리 편의).
곡선은 늘 새 배열로 넘긴다(onChange → app.updateColorMap). 끄는 동안은 화면 프레임마다 한 번만 넘긴다(requestAnimationFrame).
AppCore 는 fps 갱신으로 매초 emit 하므로 sync 는 서명이 같으면 DOM 을 건드리지 않는다. 그림이 숨어 있으면(폭 0 — 다른 화면) sync 는 받은 상태만 두고
맞추기·히스토그램 세기를 보일 때(ResizeObserver)로 미루며, 숨는 순간 지난 셀 묶음·히스토그램을 놓는다. 점 원(circle)은 개수가 바뀔 때만 늘리거나 줄인다 — 초점이 사라지지 않게.
*/
/******************************************************************************/
import { ColormapId, DEFAULT_OPACITY_CURVE, OpacityCurve, colormapCss, copyOpacityCurve } from '../utils/colormap';
import { checkbox, el, fmtInt, fmtRangeValue, numberInput, row, select } from './dom';

const NS = 'http://www.w3.org/2000/svg';
function svgEl<K extends keyof SVGElementTagNameMap>(tag: K, cls?: string): SVGElementTagNameMap[K] {
  const e = document.createElementNS(NS, tag);
  if (cls) e.setAttribute('class', cls);
  return e;
}
function setAttrs(e: Element, a: Record<string, number | string>): void {
  for (const k in a) e.setAttribute(k, typeof a[k] === 'number' ? (a[k] as number).toFixed(1) : String(a[k]));
}

// ---------- 시작 곡선 ----------
/** 시작 곡선: 고르면 지금 곡선을 그 모양으로 바꾼다(한 번의 동작, 결과는 그 자리 그림에 바로 보임). 첫째는 ParaView 기본 곡선(= '기본값' 단추) */
export const START_CURVES: { id: string; label: string; curve: OpacityCurve }[] = [
  { id: 'ramp', label: '직선 증가 (기본)', curve: DEFAULT_OPACITY_CURVE },
  { id: 'ramp-down', label: '직선 감소', curve: [[0, 1], [1, 0]] },
  { id: 'high', label: '높은 값만', curve: [[0, 0], [0.5, 0], [1, 1]] },
  { id: 'low', label: '낮은 값만', curve: [[0, 1], [0.5, 0], [1, 0]] },
  { id: 'band', label: '가운데 띠', curve: [[0, 0], [0.35, 0], [0.5, 1], [0.65, 0], [1, 0]] },
  { id: 'flat', label: '고르게 옅게', curve: [[0, 0.1], [1, 0.1]] },
];

const sameCurve = (a: OpacityCurve, b: OpacityCurve): boolean => a.length === b.length && a.every(([x, y], i) => x === b[i][0] && y === b[i][1]);

// ---------- 히스토그램 ----------
export interface ValueHistogram {
  counts: Uint32Array; // 칸마다 센 수. 칸 k = [min + k·폭, min + (k+1)·폭), 마지막 칸은 max 포함
  peak: number;        // 가장 큰 칸의 수
  total: number;       // 센 값 수 (NaN·결측 표시값 뺌)
  outside: number;     // 범위 밖이라 양 끝 칸에 넣은 수
}

/** 결측 표시값 기준: 이 이상은 그리지 않는 값이라 세지 않는다 (Surface·Points·Slice 셰이더의 1e29, volumeRenderer VALUE_MAX 와 같음) */
const MISSING_MIN = 1e29;

/**
 * 값 배열의 히스토그램: [min, max] 를 bins 칸으로 고르게 나눈다. 범위 밖 값은 버리지 않고 양 끝 칸에 센다 — ParaView(vtkExtractHistogram 의 custom bin range)와 같고,
 * 셰이더도 범위 밖 값을 곡선 양 끝 Opacity 로 그리므로 끝 칸이 곧 그 Opacity 로 그려지는 셀 수가 된다. NaN(결측)과 결측 표시값(1e29 이상)은 세지 않는다(그리지 않는 값).
 * keep 을 주면 keep[i] === 1 인 셀만 센다 (Volume 이 그린 셀 — AppCore.volumeCellsOf 의 레벨마다 남은 셀 표시).
 */
export function valueHistogram(values: Float32Array, min: number, max: number, bins: number, keep: Uint8Array | null = null): ValueHistogram {
  const counts = new Uint32Array(bins);
  let total = 0, outside = 0, peak = 0;
  if (!(max > min) || bins < 1) return { counts, peak, total, outside };
  const scale = bins / (max - min);
  for (let i = 0; i < values.length; i++) {
    if (keep && keep[i] !== 1) continue;
    const v = values[i];
    if (v !== v || v >= MISSING_MIN) continue;
    if (v < min || v > max) outside++;
    let k = Math.floor((v - min) * scale);
    if (k < 0) k = 0; else if (k >= bins) k = bins - 1;
    counts[k]++;
    total++;
  }
  for (let k = 0; k < bins; k++) if (counts[k] > peak) peak = counts[k];
  return { counts, peak, total, outside };
}

/** 히스토그램으로 셀 셀 한 묶음: 값 배열과, 그 가운데 셀 셀 표시(keep[i] === 1 인 i 만 — null 이면 전부). 묶음이 같은 객체면 같은 셀이다(캐시 열쇠) */
export interface CellSet { values: Float32Array; keep: Uint8Array | null }

// 묶음(노드가 다시 계산할 때마다 새 객체 — AppCore.rebuildVolume)마다 범위·칸 수 조합 몇 개의 결과를 둔다. 여러 편집기(노드 화면들 · Color Map 화면)가 함께 쓴다
// — 같은 셀을 범위가 다른 두 지도(공유 지도 · Separate)가 써도 서로 덮어쓰지 않게. 묶음이 버려지면 결과도 함께 버려진다(WeakMap)
const HIST_KEEP = 4;
const histCache = new WeakMap<CellSet, Map<string, ValueHistogram>>();
function histogramOf(set: CellSet, min: number, max: number, bins: number): ValueHistogram {
  const key = `${min}|${max}|${bins}`;
  let byKey = histCache.get(set);
  if (!byKey) { byKey = new Map(); histCache.set(set, byKey); }
  const hit = byKey.get(key);
  if (hit) return hit;
  const h = valueHistogram(set.values, min, max, bins, set.keep);
  byKey.set(key, h);
  if (byKey.size > HIST_KEEP) byKey.delete(byKey.keys().next().value!); // 가장 먼저 센 것부터
  return h;
}

/**
 * 여러 묶음의 히스토그램 = 묶음마다 센 것의 합 (묶음마다 캐시하므로 한 노드만 다시 계산되면 그 노드만 다시 센다).
 * 같은 셀이 두 묶음에 있으면 두 번 센다 — ParaView 도 여러 표현의 입력을 GroupDataSets 로 묶어 한 번에 세므로 겹치면 두 번이고, 우리 Volume 도 겹친 곳을 두 번 쌓는다
 */
export function cellsHistogram(sets: readonly CellSet[], min: number, max: number, bins: number): ValueHistogram {
  if (sets.length === 1) return histogramOf(sets[0], min, max, bins);
  const counts = new Uint32Array(Math.max(0, bins));
  let total = 0, outside = 0, peak = 0;
  for (const s of sets) {
    const h = histogramOf(s, min, max, bins);
    for (let k = 0; k < counts.length; k++) counts[k] += h.counts[k];
    total += h.total;
    outside += h.outside;
  }
  for (let k = 0; k < counts.length; k++) if (counts[k] > peak) peak = counts[k];
  return { counts, peak, total, outside };
}

/** 편집기에 넘기는 히스토그램 대상 (panel.ts mapEditor 가 만든다) */
export interface HistogramCells {
  what: string;               // 무엇을 셌는지 — 상태 줄 '히스토그램: {what} 45,889개'
  sets: readonly CellSet[];   // 셀 셀. 비었으면 세지 않고 empty 를 띄운다
  empty?: string;             // sets 가 비었을 때의 상태 줄 (숨긴 노드·계산 전·칠할 배열 없음 등)
}

// ---------- 히스토그램 표시 칸 (보는 사람 한 명의 편의 — 두 편집기가 함께 쓰고 브라우저에 기억. 그림 결과에는 영향 없음) ----------
interface HistPrefs { show: boolean; log: boolean; bins: number }
const BIN_CHOICES = [10, 25, 50, 100, 200];
const PREFS_KEY = 'utcfd.opacityHist';
/** 기본: 보임 · 선형 높이 · 10칸 (칸 수 10·선형은 ParaView 기본 DataHistogramNumberOfBins·막대 높이와 같음. 보임은 PV와 다름 — PV 는 기본 끔) */
const prefs: HistPrefs = { show: true, log: false, bins: 10 };
try {
  const raw = JSON.parse(localStorage.getItem(PREFS_KEY) ?? 'null') as Partial<HistPrefs> | null;
  if (raw && typeof raw === 'object') {
    if (typeof raw.show === 'boolean') prefs.show = raw.show;
    if (typeof raw.log === 'boolean') prefs.log = raw.log;
    if (typeof raw.bins === 'number' && BIN_CHOICES.includes(raw.bins)) prefs.bins = raw.bins;
  }
} catch { /* 비공개 창 등 — 기본값으로 */ }
const prefWatchers: (() => void)[] = [];
function setPrefs(p: Partial<HistPrefs>): void {
  Object.assign(prefs, p);
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch { /* 저장 못 해도 됨 */ }
  for (const w of prefWatchers) w();
}

// ---------- 그림 크기 (px, viewBox 는 실제 폭 그대로라 1:1) ----------
const PAD_X = 7;       // 양 끝 점이 잘리지 않고 잡히게
const PAD_T = 7;
const PLOT_H = 104;
const STRIP_GAP = 5, STRIP_H = 8;
const H = PAD_T + PLOT_H + STRIP_GAP + STRIP_H + 1;
const HIT_R = 9;       // 점을 잡는 거리 (마우스·펜)
const HIT_R_TOUCH = 18; // 점을 잡는 거리 (손가락)
const TAP_SLOP = 6;    // 터치로 빈 곳을 누른 뒤 이만큼(px) 넘게 움직이면 점을 만들지 않는다 (쓸어내리기)
const EPS = 1e-4;      // 이웃 점과의 최소 x 간격 (범위 기준 — 저장 형식이 x 가 늘 커지기를 요구한다)
const STOPS = 17;      // 색 띠·곡선 아래 면의 Preset 색 단계
let seq = 0;
const round4 = (v: number) => Math.round(v * 1e4) / 1e4;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const fmtOpacity = (o: number) => String(Number(o.toFixed(3)));

/** 편집기가 그리는 데 쓰는 것 (panel.ts mapEditor 가 그 지도에서 만들어 넘긴다) */
export interface OpacityEditorInput {
  key: string;                 // 고치는 지도의 서명 — 바뀌면 고른 점을 푼다
  curve: OpacityCurve;
  colormap: ColormapId;
  rangeMin: number;
  rangeMax: number;
  rangeReady: boolean;         // 범위가 정해졌는지 (아직이면 히스토그램을 그리지 않는다 — 임시 범위 0~1 로 센 막대는 틀린 그림)
  unit: string;
  cells: () => HistogramCells; // 히스토그램을 셀 셀: 노드 화면은 그 노드가 Volume 으로 그리는 셀, Color Map 화면은 그 지도로 Volume 을 그리는 보이는 노드들의 셀. 보이고 셀 때만 부른다
}

export interface OpacityEditor { root: HTMLElement; sync(input: OpacityEditorInput): void }

/** Opacity 곡선 편집기 하나. onChange 는 새 곡선 배열을 받는다(부른 쪽이 app.updateColorMap 으로 넣는다) */
export function opacityEditor(onChange: (curve: OpacityCurve) => void): OpacityEditor {
  const root = el('div', 'opac');

  // 그림
  const plot = el('div', 'opac-plot');
  const svg = svgEl('svg');
  svg.setAttribute('height', String(H));
  svg.setAttribute('role', 'group');
  svg.setAttribute('aria-label', 'Opacity 곡선');
  svg.setAttribute('tabindex', '-1'); // Esc 로 고르기를 풀면 초점이 여기로 온다 (문서 전체로 날아가지 않게)
  const gradId = `opac-grad-${++seq}`;
  const defs = svgEl('defs');
  const grad = svgEl('linearGradient');
  grad.id = gradId;
  grad.setAttribute('gradientUnits', 'userSpaceOnUse');
  setAttrs(grad, { y1: 0, y2: 0 });
  defs.append(grad);
  const bg = svgEl('rect', 'opac-bg');
  const fill = svgEl('path', 'opac-fill');
  fill.setAttribute('fill', `url(#${gradId})`);
  const bars = svgEl('g', 'opac-bars');
  const line = svgEl('path', 'opac-line');
  const strip = svgEl('rect', 'opac-strip');
  strip.setAttribute('fill', `url(#${gradId})`);
  const pts = svgEl('g');
  svg.append(defs, bg, fill, bars, line, strip, pts);
  plot.append(svg);
  const axis = el('div', 'opac-axis');
  const axMin = el('span'), axMax = el('span');
  axis.append(axMin, axMax);

  // 고른 점: 번호 · '점 삭제' · 값(데이터 단위) · Opacity
  const ptIndex = el('span', 'row-value');
  const delBtn = el('button', 'btn btn-normal btn-mini', '점 삭제');
  delBtn.type = 'button';
  delBtn.addEventListener('click', () => remove(sel));
  const ptHead = el('div', 'field-head');
  ptHead.append(el('label', 'field-label', '고른 점'), ptIndex, delBtn);
  const valIn = numberInput(0, (v) => {
    const c = curve(), m = input;
    if (!m || sel <= 0 || sel >= c.length - 1) return; // 양 끝 점의 값은 범위 끝으로 고정
    const span = m.rangeMax - m.rangeMin;
    if (!(span > 0)) return;
    edit(moved(c, sel, Number(((v - m.rangeMin) / span).toPrecision(12)), c[sel][1])); // 이웃 점 사이로 맞춘다(넘으면 그 앞에서 멈춤). 부동소수 찌꺼기는 걷어 낸다
  }, { exact: true });
  const opIn = numberInput(0, (v) => {
    const c = curve();
    if (sel < 0 || sel >= c.length) return;
    edit(moved(c, sel, c[sel][0], v));
  }, { exact: true });
  // 돌림 단추·위아래 키의 한 걸음: Opacity 0.01, 값은 범위의 1% (sync 에서). step="any" 면 브라우저가 1씩 움직인다
  opIn.step = '0.01'; opIn.min = '0'; opIn.max = '1';
  // 비우거나 숫자가 아니면 numberInput 은 마지막으로 받아들인 글자로 되돌리는데, 그 글자는 다른 점의 것일 수 있다 — 곧이어 지금 점의 값으로 다시 쓴다
  // (numberInput 의 change 처리 뒤에 붙어 돈다. 넣은 값이 받아들여졌으면 같은 값을 다시 쓸 뿐)
  for (const i of [valIn, opIn]) i.addEventListener('change', () => showPoint(true));
  const valRow = row('값', valIn);
  const valLabel = valRow.querySelector<HTMLElement>('.row-label')!;
  const ptBlk = el('div', 'blk');
  ptBlk.append(ptHead, valRow, row('Opacity', opIn));

  // 시작 곡선: 지금 곡선이 목록의 하나와 같으면 그 이름, 아니면 '직접 고친 곡선'(고를 수는 없는 선택지)
  const startSel = select<string>([{ value: '', label: '직접 고친 곡선' }, ...START_CURVES.map((s) => ({ value: s.id, label: s.label }))], '', (v) => {
    const s = START_CURVES.find((x) => x.id === v);
    if (!s) return;
    sel = -1;
    commit(copyOpacityCurve(s.curve));
  });
  startSel.querySelector<HTMLOptionElement>('option[value=""]')!.disabled = true;

  // 히스토그램 표시 칸
  const histCheck = checkbox('히스토그램', prefs.show, (v) => setPrefs({ show: v }));
  const logCheck = checkbox('로그 높이', prefs.log, (v) => setPrefs({ log: v }));
  const binSel = select<string>(BIN_CHOICES.map((n) => ({ value: String(n), label: `${n}칸` })), String(prefs.bins), (v) => setPrefs({ bins: Number(v) }));
  binSel.setAttribute('aria-label', '히스토그램 칸 수');
  const opts = el('div', 'opac-opts');
  opts.append(histCheck.root, logCheck.root, binSel);
  const hint = el('div', 'hint');
  root.append(plot, axis, ptBlk, row('시작 곡선', startSel), opts, hint);

  // ---------- 상태 ----------
  let input: OpacityEditorInput | null = null;
  let sel = -1;                          // 고른 점 (-1 = 없음). 그림에 강조로, 아래 숫자 칸으로 보인다
  let pending: OpacityCurve | null = null; // 끄는 중 아직 넘기지 않은 곡선 (그림은 이것으로)
  let raf = 0;
  let dragId: number | null = null;
  let grabDx = 0, grabDy = 0;            // 끄는 점: 점 중심 − 누른 자리(px). 끄는 동안 유지해, 점 가장자리를 눌러 고르기만 해도 점이 커서 자리로 튀지 않게
  let tap: { id: number; px: number; py: number } | null = null; // 터치로 빈 곳을 누름: 거의 움직이지 않고 떼면 그 자리에 점을 더한다
  let width = 0;
  let stale = true;                      // 숨어 있는 동안 받은 상태를 아직 맞추지 않음 (보이면 다시 맞춘다)
  let hist: ValueHistogram | null = null;
  let lastSig = '';
  let lastSets: readonly CellSet[] = [];   // 지난번에 센 묶음들 (객체가 모두 같으면 다시 세지 않는다)
  let lastColormap = '';
  const circles: SVGCircleElement[] = [];
  const barRects: SVGRectElement[] = [];

  const curve = (): OpacityCurve => pending ?? input?.curve ?? DEFAULT_OPACITY_CURVE;
  const cancelRaf = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } };
  const flush = () => { raf = 0; if (pending) { const c = pending; pending = null; onChange(c); } };
  /** 곡선을 바로 넘긴다 (점 추가·지우기·숫자 칸·키·시작 곡선). 넘기면 app 이 emit 해 sync 로 돌아온다 */
  const commit = (c: OpacityCurve) => { cancelRaf(); pending = null; onChange(c); };
  /** 숫자 칸·키: 바뀌었으면 넘기고, 같으면(이웃 점에 막힘 등) 숫자 칸만 지금 값으로 되돌린다 */
  const edit = (c: OpacityCurve) => { if (!sameCurve(c, curve())) commit(c); showPoint(true); };
  /** 끄는 중: 그림은 바로, 넘기기는 화면 프레임마다 한 번 */
  const commitLater = (c: OpacityCurve) => { pending = c; draw(); if (!raf) raf = requestAnimationFrame(flush); };
  const focusPoint = () => { if (sel >= 0) circles[sel]?.focus({ preventScroll: true }); };

  /** i 번째 점을 (t, o) 로 옮긴 새 곡선. 안쪽 점은 이웃 점 사이(EPS 간격)로, 양 끝 점은 x 를 그대로(위아래로만). Opacity 는 0~1 */
  const moved = (c: OpacityCurve, i: number, t: number, o: number): OpacityCurve => {
    const out = copyOpacityCurve(c);
    let x = c[i][0];
    if (i > 0 && i < c.length - 1) {
      const lo = c[i - 1][0] + EPS, hi = c[i + 1][0] - EPS;
      if (lo <= hi) x = clamp(t, lo, hi); // 장면 파일에서 읽은 아주 가까운 두 점 사이면 x 는 그대로
    }
    out[i] = [x, clamp(o, 0, 1)];
    return out;
  };

  /** 안쪽 점 하나를 지운다 (양 끝 점은 지우지 않음 — ParaView 와 같음). 앞 점을 고르고, 편집기 안에 초점이 있었으면 그 점으로 */
  function remove(i: number): void {
    const c = curve();
    if (i <= 0 || i >= c.length - 1) return;
    const had = root.contains(document.activeElement);
    sel = i - 1;
    commit([...c.slice(0, i), ...c.slice(i + 1)].map(([x, y]): [number, number] => [x, y]));
    draw();
    if (had) focusPoint();
  }

  // ---------- 점 원 (개수가 바뀔 때만 늘리거나 줄인다) ----------
  const onKey = (e: KeyboardEvent, i: number) => {
    const c = curve();
    if (i >= c.length) return;
    const step = e.shiftKey ? 0.1 : 0.01; // 범위·Opacity 의 1% (Shift 10%)
    const [x, y] = c[i];
    switch (e.key) {
      case 'ArrowUp': sel = i; edit(moved(c, i, x, round4(y + step))); break;
      case 'ArrowDown': sel = i; edit(moved(c, i, x, round4(y - step))); break;
      case 'ArrowRight': sel = i; edit(moved(c, i, round4(x + step), y)); break;
      case 'ArrowLeft': sel = i; edit(moved(c, i, round4(x - step), y)); break;
      case 'Delete': case 'Backspace': remove(i); break;
      case 'Home': sel = 0; draw(); focusPoint(); break;
      case 'End': sel = c.length - 1; draw(); focusPoint(); break;
      case 'Escape': sel = -1; draw(); svg.focus({ preventScroll: true }); break; // 초점은 그림에 남긴다 — Tab 이면 다시 첫 점부터
      default: return;
    }
    e.preventDefault();
    e.stopPropagation(); // 형상 편집의 Delete 등 창 전체 단축키로 가지 않게
  };
  const ensureCircles = (n: number) => {
    while (circles.length < n) {
      const i = circles.length;
      const c = svgEl('circle', 'opac-pt');
      c.setAttribute('tabindex', '0');
      c.setAttribute('role', 'slider');
      c.setAttribute('aria-valuemin', '0');
      c.setAttribute('aria-valuemax', '1');
      c.addEventListener('focus', () => { if (sel !== i) { sel = i; draw(); } });
      c.addEventListener('keydown', (e) => onKey(e, i));
      pts.append(c);
      circles.push(c);
    }
    while (circles.length > n) circles.pop()!.remove();
  };
  const ensureBars = (n: number) => {
    while (barRects.length < n) { const r = svgEl('rect'); bars.append(r); barRects.push(r); }
    while (barRects.length > n) barRects.pop()!.remove();
  };

  // ---------- 그리기 ----------
  const geom = () => ({ x0: PAD_X, x1: Math.max(PAD_X + 1, width - PAD_X), y0: PAD_T, y1: PAD_T + PLOT_H });
  const valueText = (x: number): string => {
    const m = input;
    if (!m) return '';
    const span = m.rangeMax - m.rangeMin;
    return fmtRangeValue(m.rangeMin + x * span, span);
  };
  /** 고른 점의 번호·숫자 칸. force 면 초점이 있어도 쓴다 (넣은 값이 이웃 점에 막혀 바뀌었을 때) */
  function showPoint(force = false): void {
    const c = curve();
    const has = !!input && sel >= 0 && sel < c.length;
    ptBlk.hidden = !has;
    if (!has) return;
    const [x, y] = c[sel];
    const end = sel === 0 || sel === c.length - 1;
    ptIndex.textContent = `${sel + 1} / ${c.length}`;
    delBtn.disabled = end;
    valIn.disabled = end;
    if (force || document.activeElement !== valIn) valIn.value = valueText(x);
    if (force || document.activeElement !== opIn) opIn.value = fmtOpacity(y);
  }
  function draw(): void {
    if (!input) return;
    const c = curve();
    if (sel >= c.length) sel = -1;
    ensureCircles(c.length);
    showPoint();
    if (!width) return; // 숨어 있어 폭을 모른다 — 보이면 ResizeObserver 가 다시 그린다
    const { x0, x1, y0, y1 } = geom();
    const X = (t: number) => x0 + t * (x1 - x0), Y = (o: number) => y1 - o * (y1 - y0);
    svg.setAttribute('viewBox', `0 0 ${width} ${H}`);
    setAttrs(bg, { x: x0, y: y0, width: x1 - x0, height: y1 - y0 });
    setAttrs(grad, { x1: x0, x2: x1 });
    setAttrs(strip, { x: x0, y: y1 + STRIP_GAP, width: x1 - x0, height: STRIP_H });
    const path = c.map(([x, y], i) => `${i ? 'L' : 'M'}${X(x).toFixed(1)},${Y(y).toFixed(1)}`).join('');
    line.setAttribute('d', path);
    fill.setAttribute('d', `M${X(0).toFixed(1)},${y1}L${path.slice(1)}L${X(1).toFixed(1)},${y1}Z`);
    // 히스토그램: 가장 큰 칸을 그림 높이로 (로그 높이면 log(1+수) 기준 — 0 근처에 몰린 농도 같은 값에서 적은 칸도 보이게)
    const nb = hist && prefs.show ? hist.counts.length : 0;
    ensureBars(nb);
    if (hist && nb) {
      const w = (x1 - x0) / nb, gap = w > 4 ? 1 : 0, lp = Math.log1p(hist.peak);
      for (let k = 0; k < nb; k++) {
        const n = hist.counts[k];
        const f = hist.peak > 0 ? (prefs.log ? Math.log1p(n) / lp : n / hist.peak) : 0;
        const bh = f * (y1 - y0);
        setAttrs(barRects[k], { x: x0 + k * w + gap / 2, y: y1 - bh, width: Math.max(0.5, w - gap), height: bh });
      }
    }
    c.forEach(([x, y], i) => {
      const p = circles[i];
      setAttrs(p, { cx: X(x), cy: Y(y), r: i === sel ? 6 : 5 });
      p.classList.toggle('sel', i === sel);
      p.setAttribute('aria-label', `Opacity 점 ${i + 1} / ${c.length}`);
      p.setAttribute('aria-valuenow', String(y));
      p.setAttribute('aria-valuetext', `값 ${valueText(x)}, Opacity ${fmtOpacity(y)}`);
    });
  }

  // ---------- 마우스·터치: 곡선 칸 빈 곳 = 점 추가(그대로 끌기), 점 근처 = 고르고 끌기 ----------
  const local = (e: PointerEvent) => {
    const r = svg.getBoundingClientRect();
    return { px: (e.clientX - r.left) * (width / Math.max(1, r.width)), py: (e.clientY - r.top) * (H / Math.max(1, r.height)) };
  };
  const toCurve = (px: number, py: number) => {
    const { x0, x1, y0, y1 } = geom();
    return { t: clamp((px - x0) / (x1 - x0), 0, 1), o: clamp((y1 - py) / (y1 - y0), 0, 1) };
  };
  /** 곡선 칸(배경 사각형) 안인지. 아래 색 띠·양옆 여백은 밖 */
  const inPlot = (px: number, py: number) => { const { x0, x1, y0, y1 } = geom(); return px >= x0 && px <= x1 && py >= y0 && py <= y1; };
  /** (px, py) 에서 r px 안의 가장 가까운 점 번호, 없으면 -1 */
  const hitPoint = (c: OpacityCurve, px: number, py: number, r: number): number => {
    const { x0, x1, y0, y1 } = geom();
    let hit = -1, best = r * r;
    c.forEach(([x, y], i) => {
      const dx = x0 + x * (x1 - x0) - px, dy = y1 - y * (y1 - y0) - py, d = dx * dx + dy * dy;
      if (d <= best) { best = d; hit = i; }
    });
    return hit;
  };
  /** (px, py) 자리에 점을 더하고 고른다. 그 자리의 이웃 두 점 사이가 너무 좁으면 false */
  const addAt = (px: number, py: number): boolean => {
    const c = curve();
    const { t, o } = toCurve(px, py);
    let i = c.findIndex(([x]) => x >= t); // 새 점이 들어갈 자리 (양 끝 점 사이)
    if (i < 1) i = 1;
    const lo = c[i - 1][0] + EPS, hi = c[i][0] - EPS;
    if (lo > hi) return false;
    sel = i;
    commit([...c.slice(0, i), [clamp(round4(t), lo, hi), round4(o)] as [number, number], ...c.slice(i)].map(([x, y]): [number, number] => [x, y]));
    return true;
  };
  svg.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || !input || !width) return;
    const touch = e.pointerType === 'touch', r = touch ? HIT_R_TOUCH : HIT_R;
    const { px, py } = local(e);
    // 점에 걸리지 않은 곡선 칸 밖(아래 색 띠·양옆 여백)은 받지 않는다 — ParaView 도 그림 범위 안에서만 점을 더한다(vtkControlPointsItem 의 점 추가 영역 판정)
    if (!inPlot(px, py) && hitPoint(curve(), px, py, r) < 0) return;
    e.preventDefault(); // 글자 선택·기본 초점 이동 대신 고른 점에 초점을 준다
    // 숫자 칸에 넣다 만 값은 지금 고른 점에 먼저 넣는다 (초점을 옮긴 뒤에 넣으면 새로 고른 점에 들어간다)
    if (document.activeElement === valIn || document.activeElement === opIn) (document.activeElement as HTMLElement).blur();
    const c = curve(); // 숫자 칸 값이 방금 들어가 곡선이 바뀌었을 수 있다
    const hit = hitPoint(c, px, py, r);
    grabDx = grabDy = 0;
    if (hit >= 0) {
      sel = hit;
      const { x0, x1, y0, y1 } = geom();
      grabDx = x0 + c[hit][0] * (x1 - x0) - px;
      grabDy = y1 - c[hit][1] * (y1 - y0) - py;
    } else if (!inPlot(px, py)) return;
    else if (touch) { tap = { id: e.pointerId, px, py }; svg.setPointerCapture(e.pointerId); return; } // 손가락: 뗄 때 점을 더한다 (쓸어내리기로 점이 생기지 않게)
    else if (!addAt(px, py)) return; // 두 점 사이가 너무 좁다
    dragId = e.pointerId;
    svg.setPointerCapture(e.pointerId);
    draw();
    focusPoint();
  });
  /** 끌기·터치 누르기 끝 (pointerup · pointercancel · 포인터 캡처를 잃음). 짧게 누른 터치는 떼는 순간(pointerup)에만 점을 더한다 */
  const endDrag = (e: PointerEvent) => {
    if (tap && tap.id === e.pointerId) {
      const p = tap;
      tap = null;
      if (svg.hasPointerCapture(e.pointerId)) svg.releasePointerCapture(e.pointerId);
      if (e.type === 'pointerup' && addAt(p.px, p.py)) { draw(); focusPoint(); }
      return;
    }
    if (dragId !== e.pointerId) return;
    dragId = null;
    if (svg.hasPointerCapture(e.pointerId)) svg.releasePointerCapture(e.pointerId);
    cancelRaf();
    flush();
  };
  svg.addEventListener('pointermove', (e) => {
    if (tap && tap.id === e.pointerId) {
      const { px, py } = local(e);
      if (Math.hypot(px - tap.px, py - tap.py) > TAP_SLOP) tap = null; // 쓸어내림 — 점을 만들지 않는다
      return;
    }
    if (dragId !== e.pointerId || sel < 0) return;
    if (e.pointerType === 'mouse' && !(e.buttons & 1)) { endDrag(e); return; } // 놓는 순간을 놓쳤다(창 밖에서 놓음 등) — 버튼 없이 지나가는 마우스로 점이 움직이지 않게
    const c = curve();
    if (sel >= c.length) return;
    const { px, py } = local(e);
    const { t, o } = toCurve(px + grabDx, py + grabDy);
    commitLater(moved(c, sel, round4(t), round4(o)));
  });
  svg.addEventListener('pointerup', endDrag);
  svg.addEventListener('pointercancel', endDrag);
  svg.addEventListener('lostpointercapture', endDrag); // 창 초점을 잃는 등으로 캡처가 풀려도 끌기를 끝낸다

  new ResizeObserver(() => {
    const w = Math.round(plot.clientWidth);
    if (w === width) return;
    width = w;
    if (!width) { // 숨음(다른 화면·Volume 아님): 끌던 것은 넘기고, 지난 값 배열·히스토그램을 놓는다 (큰 데이터는 배열 하나가 수십 MB). 보이면 다시 맞춘다
      tap = null;
      if (dragId !== null) { dragId = null; cancelRaf(); flush(); }
      stale = true; hist = null; lastSets = [];
      return;
    }
    if (stale && input) sync(input); else draw();
  }).observe(plot);

  // ---------- 바깥 상태 맞추기 ----------
  function sync(m: OpacityEditorInput): void {
    if (input && m.key !== input.key) { // 다른 지도: 고른 점·끌기를 푼다
      sel = -1; cancelRaf(); pending = null; dragId = null; tap = null;
    }
    input = m;
    if (!width) { stale = true; return; } // 숨어 있다(다른 화면): 맞추기와 히스토그램 세기는 보일 때(ResizeObserver)
    const span = m.rangeMax - m.rangeMin;
    // 셀 셀은 히스토그램을 셀 때만 묻는다. 묶음 객체가 모두 같고 서명이 같으면 아무것도 하지 않는다(AppCore 는 fps 로 매초 emit)
    const cells = prefs.show && m.rangeReady && span > 0 ? m.cells() : null;
    const sets = cells?.sets ?? [];
    const sig = [m.key, m.curve.map((p) => p.join(':')).join(' '), m.colormap, m.rangeMin, m.rangeMax, m.rangeReady, m.unit, prefs.show, prefs.log, prefs.bins, cells?.what, cells?.empty].join('|');
    const sameSets = sets.length === lastSets.length && sets.every((s, i) => s === lastSets[i]);
    if (!stale && sig === lastSig && sameSets) return;
    stale = false;
    lastSig = sig;
    lastSets = sets;
    if (m.colormap !== lastColormap) {
      lastColormap = m.colormap;
      grad.replaceChildren(...Array.from({ length: STOPS }, (_, k) => {
        const s = svgEl('stop');
        const t = k / (STOPS - 1);
        s.setAttribute('offset', String(t));
        s.setAttribute('stop-color', colormapCss(m.colormap, t));
        return s;
      }));
    }
    const u = m.unit ? ` ${m.unit}` : '';
    axMin.textContent = `${fmtRangeValue(m.rangeMin, span)}${u}`;
    axMax.textContent = `${fmtRangeValue(m.rangeMax, span)}${u}`;
    valLabel.textContent = m.unit ? `값 (${m.unit})` : '값';
    valIn.step = span > 0 ? String(Number((span / 100).toPrecision(3))) : 'any'; // 돌림 단추 한 걸음 = 범위의 1%
    const start = START_CURVES.find((s) => sameCurve(m.curve, s.curve))?.id ?? '';
    if (startSel.value !== start) startSel.value = start;
    // 히스토그램 (묶음·범위·칸 수가 같으면 캐시)
    hist = null;
    let note = '';
    if (prefs.show) {
      if (!m.rangeReady) note = '히스토그램: 범위가 아직 정해지지 않았습니다.';
      else if (!(span > 0)) note = '히스토그램: 범위의 최소가 최대보다 작지 않아 세지 않았습니다.'; // 손으로 고친 장면 파일 등
      else if (!cells || !sets.length) note = cells?.empty ?? '히스토그램: 그린 셀이 없습니다.';
      else {
        hist = cellsHistogram(sets, m.rangeMin, m.rangeMax, prefs.bins);
        note = `히스토그램: ${cells.what} ${fmtInt(hist.total)}개${hist.outside ? ` · 범위 밖 ${fmtInt(hist.outside)}개는 양 끝 칸에 넣음` : ''}`;
      }
    }
    hint.textContent = note;
    histCheck.input.checked = prefs.show;
    logCheck.input.checked = prefs.log;
    logCheck.input.disabled = binSel.disabled = !prefs.show;
    binSel.value = String(prefs.bins);
    draw();
  }
  prefWatchers.push(() => { lastSig = ''; if (input) sync(input); }); // 숨은 편집기는 표시만 하고(stale) 보일 때 센다

  return { root, sync };
}

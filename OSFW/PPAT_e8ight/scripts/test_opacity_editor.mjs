#!/usr/bin/env node
// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   test_opacity_editor.mjs

src/ui/opacityEditor.ts(Opacity 곡선 편집기)의 조작 논리 Node 시험. TS 를 바로 못 돌리므로 esbuild(vite 가 깔아 둔 것)로 ES 모듈 하나로 묶어
임시 폴더에 내보낸 뒤 불러 쓴다. 브라우저가 없으니 아주 작은 가짜 DOM(요소 트리·속성·이벤트·초점·ResizeObserver·requestAnimationFrame·
localStorage)을 깔고 돌린다 — 그림이 맞는지는 보지 못하고, 조작이 곡선을 어떻게 바꾸는지만 본다.
가짜 app 은 받은 곡선을 parseOpacityCurve(AppCore.updateColorMap 과 같은 확인)로 넣은 뒤 다시 sync 한다.
확인: 처음 점·막대 수, 히스토그램(범위 밖은 양 끝 칸, NaN 뺌), 빈 곳 누르기 = 점 추가·고름·초점, 끌기(프레임마다 한 번 넘김·이웃 점에서 멈춤),
끝 점은 위아래로만, 화살표·Delete·끝 점 지우기 막음, 시작 곡선(새 배열), 숫자 칸(데이터 단위·이웃에서 멈춤·Opacity 0~1),
점 근처 누르기 = 고르기, 다른 지도면 고르기 풀림, 히스토그램 끄기·칸 수·범위 미정.
2026-10-16 보강: 색 띠·옆 여백 누르기 무시(끝 점 근처는 고르기), 잡은 자리 차이 유지, 버튼을 놓친 마우스·캡처 잃음 = 끌기 끝,
잘못 넣은 숫자 칸 = 지금 점 값으로, 숫자 칸 한 걸음, 숨은 편집기는 값 배열을 꺼내지도 세지도 않음(보이면 셈), 터치(짧게 누름 = 점, 쓸어내림 = 없음,
잡는 거리 18 px), Esc 뒤 초점은 그림, 범위 폭 0 안내.
그린 셀 히스토그램(2026-10-16): keep 으로 고른 셀만 셈, 결측 표시값(1e29 이상) 뺌, 여러 묶음 = 합(겹치면 두 번), 상태 줄에 센 대상 이름,
묶음 객체가 같으면 다시 세지 않음(캐시)·새 객체면 다시 셈, 셀 묶음이 없으면 empty 글(숨긴 노드·계산 전),
데이터 노드가 넘기는 occupancy(keep 사본 대신)도 같은 수.

실행: node scripts/test_opacity_editor.mjs
*/
/******************************************************************************/

import { build } from 'esbuild';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ---------- 가짜 DOM ----------
class ClassList {
  constructor() { this.s = new Set(); }
  add(...c) { c.forEach((x) => this.s.add(x)); }
  remove(...c) { c.forEach((x) => this.s.delete(x)); }
  toggle(c, on) { const want = on === undefined ? !this.s.has(c) : on; if (want) this.s.add(c); else this.s.delete(c); return want; }
  contains(c) { return this.s.has(c); }
}
class FakeNode {
  constructor(tag) {
    this.tagName = tag.toUpperCase(); this.children = []; this.parent = null; this.attrs = new Map(); this.classList = new ClassList();
    this.listeners = {}; this.hidden = false; this._text = ''; this.style = { setProperty() {} }; this.disabled = false; this.checked = false; this.type = ''; this.id = '';
    this._value = '';
  }
  get className() { return [...this.classList.s].join(' '); }
  set className(v) { this.classList.s = new Set(String(v).split(/\s+/).filter(Boolean)); }
  get value() { return this.tagName === 'SELECT' ? this._value || (this.children[0]?.value ?? '') : this._value; }
  set value(v) {
    if (this.tagName === 'SELECT') { if (this.children.some((o) => o.value === String(v))) this._value = String(v); return; }
    this._value = String(v);
  }
  get textContent() { return this._text + this.children.map((c) => c.textContent).join(''); }
  set textContent(v) { this.children = []; this._text = String(v); }
  set innerHTML(_v) { this.children = []; this._text = ''; }
  setAttribute(k, v) { this.attrs.set(k, String(v)); if (k === 'class') this.className = v; }
  getAttribute(k) { return k === 'class' ? this.className : this.attrs.get(k) ?? null; }
  append(...ns) {
    for (const n of ns) {
      if (typeof n === 'string') { this._text += n; continue; }
      if (n.parent) n.parent.children.splice(n.parent.children.indexOf(n), 1);
      n.parent = this; this.children.push(n);
    }
  }
  remove() {
    if (this.parent) { this.parent.children.splice(this.parent.children.indexOf(this), 1); this.parent = null; }
    if (doc.activeElement === this) doc.activeElement = doc.body;
  }
  replaceChildren(...ns) { this.children.forEach((c) => { c.parent = null; }); this.children = []; this.append(...ns); }
  insertBefore(n) { this.append(n); }
  contains(n) { for (let x = n; x; x = x.parent) if (x === this) return true; return false; }
  *walk() { for (const c of this.children) { yield c; yield* c.walk(); } }
  matches(sel) {
    const m = sel.match(/^option\[value="(.*)"\]$/);
    if (m) return this.tagName === 'OPTION' && this.value === m[1];
    return sel.split(',').map((s) => s.trim()).some((c) => c.startsWith('.') && this.classList.contains(c.slice(1)));
  }
  querySelector(sel) { for (const n of this.walk()) if (n.matches(sel)) return n; return null; }
  addEventListener(t, f) { (this.listeners[t] ??= []).push(f); }
  dispatch(type, props = {}) {
    const e = { type, target: this, defaultPrevented: false, stopped: false, preventDefault() { this.defaultPrevented = true; }, stopPropagation() { this.stopped = true; }, ...props };
    for (let n = this; n && !e.stopped; n = n.parent) for (const f of n.listeners[type] ?? []) f(e);
    return e;
  }
  focus() { if (doc.activeElement === this) return; const prev = doc.activeElement; doc.activeElement = this; prev?.dispatch?.('blur'); this.dispatch('focus'); }
  blur() { if (doc.activeElement === this) { doc.activeElement = doc.body; this.dispatch('blur'); } }
  select() {}
  getBoundingClientRect() { return { left: 0, top: 0, width: 300, height: Number(this.attrs.get('height') ?? 125) }; }
  get clientWidth() { return globalThis.__fakeWidth ?? 300; } // 0 이면 숨은 그림
  setPointerCapture(id) { this.cap = id; }
  hasPointerCapture(id) { return this.cap === id; }
  releasePointerCapture() { this.cap = undefined; }
}
const doc = { body: new FakeNode('body'), activeElement: null, createElement: (t) => new FakeNode(t), createElementNS: (_ns, t) => new FakeNode(t) };
doc.activeElement = doc.body;
const roCallbacks = [];
const rafQueue = [];
const store = new Map();
globalThis.document = doc;
globalThis.HTMLInputElement = class {};
globalThis.ResizeObserver = class { constructor(cb) { roCallbacks.push(cb); } observe() {} };
globalThis.requestAnimationFrame = (f) => { rafQueue.push(f); return rafQueue.length; };
globalThis.cancelAnimationFrame = () => { rafQueue.length = 0; };
globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)) };
const flushRaf = () => rafQueue.splice(0).forEach((f) => f());

// ---------- 묶어 불러오기 ----------
const work = await fs.mkdtemp(path.join(os.tmpdir(), 'opacity-editor-test-'));
const outfile = path.join(work, 'opacityEditor.bundle.mjs');
await build({
  stdin: {
    contents: "export * from './src/ui/opacityEditor.ts'; export { parseOpacityCurve, DEFAULT_OPACITY_CURVE } from './src/utils/colormap.ts';",
    resolveDir: ROOT, loader: 'ts', sourcefile: 'entry.ts',
  },
  bundle: true, format: 'esm', platform: 'node', target: 'node22', outfile, logLevel: 'warning',
});
const { opacityEditor, valueHistogram, cellsHistogram, START_CURVES, parseOpacityCurve, DEFAULT_OPACITY_CURVE } = await import(pathToFileURL(outfile).href);

// ---------- 시험 ----------
let fails = 0;
const ok = (cond, msg) => { if (!cond) { fails++; console.log('FAIL', msg); } else console.log('ok  ', msg); };
const near = (a, b, e = 1e-6) => Math.abs(a - b) <= e;

let changes = 0;
const vals = new Float32Array(1000);
for (let i = 0; i < vals.length; i++) vals[i] = (i % 100) / 10; // 0 ~ 9.9 고르게 (값마다 10개)
vals[5] = NaN; vals[6] = -3; vals[7] = 25;                     // 결측 하나, 범위 밖 둘
const allCells = { what: '데이터의 셀', sets: [{ values: vals, keep: null }] }; // 데이터 노드: 모든 셀 (묶음 객체는 그대로 — 캐시 열쇠)
const state = { key: '{"nodeId":"root"}', curve: DEFAULT_OPACITY_CURVE.map((p) => [...p]), colormap: 'coolwarm', rangeMin: 0, rangeMax: 10, rangeReady: true, unit: 'm/s', cells: () => allCells };
let ed = null;
ed = opacityEditor((c) => { // 가짜 app.updateColorMap
  changes++;
  const parsed = parseOpacityCurve(c);
  if (!parsed) { fails++; console.log('FAIL 곡선 형식', JSON.stringify(c)); return; }
  state.curve = parsed;
  ed.sync({ ...state });
});
ed.sync({ ...state });
roCallbacks.forEach((cb) => cb()); // 폭 300 px

const svg = ed.root.querySelector('.opac-plot').children[0];
const circles = () => svg.children[6].children;
const bars = () => svg.children[3].children;
const X = (t) => 7 + t * 286, Y = (o) => 111 - o * 104; // opacityEditor 의 PAD_X·PAD_T·PLOT_H 와 폭 300
const hint = ed.root.children[ed.root.children.length - 1];
const ptBlk = ed.root.children[2];

ok(circles().length === 2, '처음 점 2개');
ok(bars().length === 10, '히스토그램 막대 10개 (기본 칸 수)');
const h = valueHistogram(vals, 0, 10, 10);
ok(h.total === 999 && h.outside === 2, `히스토그램: 센 수 ${h.total}, 범위 밖 ${h.outside}`);
ok(h.counts.reduce((a, b) => a + b, 0) === h.total, '칸 합 = 센 수');
ok(h.counts[0] === 98 && h.counts[9] === 101, `범위 밖은 양 끝 칸에 (${h.counts[0]}, ${h.counts[9]})`);
ok(/데이터의 셀 999개/.test(hint.textContent) && /범위 밖 2개/.test(hint.textContent), `상태 줄: ${hint.textContent}`);

svg.dispatch('pointerdown', { button: 0, pointerId: 1, clientX: X(0.5), clientY: Y(0.2) });
ok(state.curve.length === 3 && near(state.curve[1][0], 0.5, 1e-3) && near(state.curve[1][1], 0.2, 1e-3), `빈 곳 누르기 = 점 추가 ${JSON.stringify(state.curve)}`);
ok(doc.activeElement === circles()[1] && circles()[1].classList.contains('sel') && !ptBlk.hidden, '새 점이 골라지고 초점·숫자 칸');
const before = changes;
svg.dispatch('pointermove', { pointerId: 1, clientX: X(0.8), clientY: Y(0.9) });
svg.dispatch('pointermove', { pointerId: 1, clientX: X(0.7), clientY: Y(0.6) });
ok(changes === before && circles()[1].getAttribute('cx') === X(0.7).toFixed(1), '끄는 동안 그림은 바로, 넘기기는 아직');
flushRaf();
ok(changes === before + 1 && near(state.curve[1][0], 0.7, 1e-3) && near(state.curve[1][1], 0.6, 1e-3), `프레임에 한 번 넘김 ${JSON.stringify(state.curve[1])}`);
svg.dispatch('pointermove', { pointerId: 1, clientX: X(1.3), clientY: Y(1.5) });
svg.dispatch('pointerup', { pointerId: 1 });
ok(near(state.curve[1][0], 1 - 1e-4, 1e-9) && state.curve[1][1] === 1, `이웃 점 앞에서 멈춤 ${JSON.stringify(state.curve[1])}`);

svg.dispatch('pointerdown', { button: 0, pointerId: 2, clientX: X(0), clientY: Y(0) });
svg.dispatch('pointermove', { pointerId: 2, clientX: X(0.3), clientY: Y(0.4) });
svg.dispatch('pointerup', { pointerId: 2 });
ok(state.curve.length === 3 && state.curve[0][0] === 0 && near(state.curve[0][1], 0.4, 1e-3), `끝 점은 위아래로만 ${JSON.stringify(state.curve[0])}`);

circles()[1].focus();
circles()[1].dispatch('keydown', { key: 'ArrowDown', shiftKey: true });
ok(near(state.curve[1][1], 0.9), `Shift+↓ = 10% ${state.curve[1][1]}`);
circles()[1].dispatch('keydown', { key: 'ArrowLeft' });
ok(near(state.curve[1][0], 0.9899, 2e-4), `← = 1% ${state.curve[1][0]}`);
const cnt = changes;
circles()[2].focus();
circles()[2].dispatch('keydown', { key: 'ArrowRight' });
const del = circles()[2].dispatch('keydown', { key: 'Delete' });
ok(changes === cnt && state.curve.length === 3 && del.stopped, '끝 점: → 와 Delete 는 바뀜 없음 (창 단축키로도 안 감)');
circles()[1].focus();
circles()[1].dispatch('keydown', { key: 'Delete' });
ok(state.curve.length === 2 && circles().length === 2 && doc.activeElement === circles()[0], 'Delete = 안쪽 점 지움, 앞 점에 초점');

const startSel = ed.root.children[3].children[1];
startSel.value = 'band'; startSel.dispatch('change');
const band = START_CURVES.find((s) => s.id === 'band').curve;
ok(JSON.stringify(state.curve) === JSON.stringify(band) && state.curve !== band && startSel.value === 'band', '시작 곡선 = 새 배열로 통째로');

circles()[2].focus();
const valIn = ptBlk.children[1].children[1], opIn = ptBlk.children[2].children[1];
ok(valIn.value === '5', `값 칸 = 데이터 단위 ${valIn.value}`);
valIn.value = '4.2'; valIn.dispatch('change');
ok(state.curve[2][0] === 0.42, `값 칸으로 옮김 ${state.curve[2][0]}`);
valIn.value = '9'; valIn.dispatch('change');
ok(near(state.curve[2][0], 0.65 - 1e-4, 1e-9), `값 칸도 이웃 점 앞에서 멈춤 ${state.curve[2][0]}`);
opIn.value = '1.7'; opIn.dispatch('change');
ok(state.curve[2][1] === 1 && startSel.value === '', 'Opacity 칸 0~1, 고친 뒤 시작 곡선 칸 = 직접 고친 곡선');

const n = state.curve.length;
svg.dispatch('pointerdown', { button: 0, pointerId: 3, clientX: X(state.curve[1][0]) + 5, clientY: Y(state.curve[1][1]) + 3 });
svg.dispatch('pointerup', { pointerId: 3 });
ok(state.curve.length === n && circles()[1].classList.contains('sel'), '점 근처 누르기 = 고르기 (추가 아님)');

ed.sync({ ...state, key: '{"fieldKey":"scalar:T"}' });
ok(ptBlk.hidden, '다른 지도면 고르기 풀림');

const opts = ed.root.children[4];
const histInput = opts.children[0].children[0];
histInput.checked = false; histInput.dispatch('change');
ok(bars().length === 0 && hint.textContent === '', '히스토그램 끄기');
histInput.checked = true; histInput.dispatch('change');
const binSel = opts.children[2];
binSel.value = '50'; binSel.dispatch('change');
ok(bars().length === 50, '칸 수 50');
ed.sync({ ...state, rangeReady: false });
ok(bars().length === 0 && /정해지지/.test(hint.textContent), '범위 미정이면 막대 없음');

// ---------- 보강 시험 ----------
const resize = (w) => { globalThis.__fakeWidth = w; roCallbacks.forEach((cb) => cb()); };
state.curve = [[0, 0], [0.5, 0.5], [1, 1]];
ed.sync({ ...state });
const n0 = changes;
svg.dispatch('pointerdown', { button: 0, pointerId: 10, pointerType: 'mouse', clientX: X(0.3), clientY: 111 + 5 + 4 });
svg.dispatch('pointerup', { pointerId: 10 });
svg.dispatch('pointerdown', { button: 0, pointerId: 11, pointerType: 'mouse', clientX: 2, clientY: Y(0.5) });
svg.dispatch('pointerup', { pointerId: 11 });
ok(changes === n0 && state.curve.length === 3, '색 띠·옆 여백 누르기 = 점 추가 없음');
svg.dispatch('pointerdown', { button: 0, pointerId: 12, pointerType: 'mouse', clientX: X(0), clientY: Y(0) + 5 });
svg.dispatch('pointerup', { pointerId: 12 });
ok(changes === n0 && circles()[0].classList.contains('sel'), '띠 위라도 끝 점 9 px 안이면 고르기');

svg.dispatch('pointerdown', { button: 0, pointerId: 13, pointerType: 'mouse', clientX: X(0.5) + 6, clientY: Y(0.5) + 4 });
svg.dispatch('pointermove', { pointerId: 13, pointerType: 'mouse', buttons: 1, clientX: X(0.5) + 7, clientY: Y(0.5) + 4 });
flushRaf();
svg.dispatch('pointerup', { pointerId: 13 });
ok(state.curve.length === 3 && near(state.curve[1][0], 0.5 + 1 / 286, 2e-4) && near(state.curve[1][1], 0.5, 1e-3), `잡은 자리 차이 유지: 1 px 움직이면 1 px 만 ${JSON.stringify(state.curve[1])}`);

const n1 = changes, x1 = state.curve[1][0];
svg.dispatch('pointerdown', { button: 0, pointerId: 14, pointerType: 'mouse', clientX: X(x1), clientY: Y(0.5) });
svg.dispatch('pointermove', { pointerId: 14, pointerType: 'mouse', buttons: 0, clientX: X(0.2), clientY: Y(0.9) });
svg.dispatch('pointermove', { pointerId: 14, pointerType: 'mouse', buttons: 0, clientX: X(0.3), clientY: Y(0.8) });
flushRaf();
ok(changes === n1 && state.curve[1][0] === x1, '버튼을 놓친 마우스: 지나가도 점이 안 움직임');
svg.dispatch('pointerdown', { button: 0, pointerId: 15, pointerType: 'mouse', clientX: X(x1), clientY: Y(0.5) });
svg.dispatch('lostpointercapture', { pointerId: 15 });
svg.dispatch('pointermove', { pointerId: 15, pointerType: 'mouse', buttons: 1, clientX: X(0.2), clientY: Y(0.9) });
flushRaf();
ok(changes === n1 && state.curve[1][0] === x1, '포인터 캡처를 잃으면 끌기 끝');

circles()[1].focus();
const shownVal = valIn.value, shownOp = opIn.value;
valIn.value = ''; valIn.dispatch('change');
opIn.value = 'abc'; opIn.dispatch('change');
ok(valIn.value === shownVal && opIn.value === shownOp && shownOp === '0.5', `잘못 넣은 숫자 칸 = 지금 점 값으로 (${valIn.value}, ${opIn.value})`);
ok(opIn.step === '0.01' && valIn.step === '0.1', `숫자 칸 한 걸음 Opacity ${opIn.step} · 값 ${valIn.step} (범위 10 의 1%)`);

circles()[1].dispatch('keydown', { key: 'Escape' });
ok(doc.activeElement === svg && ptBlk.hidden, 'Esc = 고르기 풀고 초점은 그림에');

resize(0);
let calls = 0;
const cells2 = { what: '데이터의 셀', sets: [{ values: new Float32Array(vals), keep: null }] };
ed.sync({ ...state, cells: () => { calls++; return cells2; } });
binSel.value = '25'; binSel.dispatch('change');
ok(calls === 0, '숨은 편집기: 셀 묶음을 묻지도 세지도 않음 (시점 바뀜·칸 수 바뀜)');
resize(300);
ok(calls === 1 && bars().length === 25, `보이면 그때 셈 (꺼낸 수 ${calls}, 막대 ${bars().length})`);

const n2 = changes, len2 = state.curve.length;
svg.dispatch('pointerdown', { button: 0, pointerId: 20, pointerType: 'touch', clientX: X(0.25), clientY: Y(0.8) });
ok(changes === n2, '터치: 누르는 순간에는 점이 안 생김');
svg.dispatch('pointermove', { pointerId: 20, pointerType: 'touch', clientX: X(0.25), clientY: Y(0.8) + 20 });
svg.dispatch('pointerup', { pointerId: 20 });
ok(changes === n2 && state.curve.length === len2, '터치로 쓸어내림 = 점 없음');
svg.dispatch('pointerdown', { button: 0, pointerId: 21, pointerType: 'touch', clientX: X(0.25), clientY: Y(0.8) });
svg.dispatch('pointermove', { pointerId: 21, pointerType: 'touch', clientX: X(0.25) + 2, clientY: Y(0.8) + 1 });
svg.dispatch('pointerup', { pointerId: 21 });
ok(state.curve.length === len2 + 1 && near(state.curve[1][0], 0.25, 1e-3) && circles()[1].classList.contains('sel'), `터치로 짧게 누름 = 뗄 때 점 추가 ${JSON.stringify(state.curve)}`);
const len3 = state.curve.length;
svg.dispatch('pointerdown', { button: 0, pointerId: 22, pointerType: 'touch', clientX: X(state.curve[2][0]) + 14, clientY: Y(state.curve[2][1]) });
svg.dispatch('pointerup', { pointerId: 22 });
ok(state.curve.length === len3 && circles()[2].classList.contains('sel'), '터치는 18 px 안이면 점 고르기 (추가 아님)');

ed.sync({ ...state, rangeMin: 5, rangeMax: 5 });
ok(bars().length === 0 && /작지 않아/.test(hint.textContent), `범위 폭 0 = 세지 않음 (${hint.textContent})`);

// ---------- 그린 셀 히스토그램 (노드가 Volume 으로 그리는 셀만 — AppCore.volumeCellsOf 의 keep) ----------
const keepEven = new Uint8Array(vals.length);
for (let i = 0; i < vals.length; i += 2) keepEven[i] = 1;          // 짝수 번째만 남음 (vals[6] = -3 남음, vals[5] NaN·vals[7] = 25 는 빠짐)
const hk = valueHistogram(vals, 0, 10, 10, keepEven);
ok(hk.total === 500 && hk.outside === 1, `keep 으로 고른 셀만: 센 수 ${hk.total}, 범위 밖 ${hk.outside}`);
const withMissing = new Float32Array([1, 2, 1e30, 3e30, 5]);
ok(valueHistogram(withMissing, 0, 10, 10).total === 3, '결측 표시값(1e29 이상)은 세지 않음 (그리지 않는 값)');
const setA = { values: vals, keep: keepEven }, setB = { values: vals, keep: null };
const hs = cellsHistogram([setA, setB], 0, 10, 10);
ok(hs.total === 500 + 999 && hs.counts.every((n, k) => n === hk.counts[k] + h.counts[k]), `여러 묶음 = 묶음마다 센 것의 합 (겹치면 두 번) ${hs.total}`);

binSel.value = '10'; binSel.dispatch('change');
const clipCells = { what: 'Clip 1 의 남은 셀', sets: [setA] };
ed.sync({ ...state, cells: () => clipCells });
ok(bars().length === 10 && hint.textContent === '히스토그램: Clip 1 의 남은 셀 500개 · 범위 밖 1개는 양 끝 칸에 넣음', `상태 줄 = 센 대상 이름 (${hint.textContent})`);
const barH = () => bars().map((r) => r.getAttribute('height')).join(',');
const h0 = barH();
keepEven.fill(0); keepEven[0] = 1;                                  // 같은 묶음 객체 안의 표시만 바꿈 → 캐시가 그대로 쓰여 다시 세지 않는다
ed.sync({ ...state, cells: () => clipCells });
ok(barH() === h0 && /500개/.test(hint.textContent), '묶음 객체가 같으면 다시 세지 않음 (캐시)');
const clipCells2 = { what: 'Clip 1 의 남은 셀', sets: [{ values: vals, keep: keepEven }] }; // 다시 계산 = 새 묶음 객체
ed.sync({ ...state, cells: () => clipCells2 });
ok(barH() !== h0 && /남은 셀 1개/.test(hint.textContent), `새 묶음 객체면 다시 셈 (${hint.textContent})`);
ed.sync({ ...state, cells: () => ({ what: 'Clip 1 의 남은 셀', sets: [], empty: '히스토그램: 이 노드를 숨겨 세지 않았습니다.' }) });
ok(bars().length === 0 && hint.textContent === '히스토그램: 이 노드를 숨겨 세지 않았습니다.', `셀 묶음이 없으면 empty 글 (${hint.textContent})`);
ed.sync({ ...state, cells: () => ({ what: '노드 2개의 셀을 더해', sets: [setB, clipCells2.sets[0]] }) });
ok(/노드 2개의 셀을 더해 1,000개/.test(hint.textContent), `Color Map 화면: 노드들의 셀 합 (${hint.textContent})`);
// 데이터 노드(사슬 없음)는 keep 사본 대신 격자 occupancy(0/1)를 그대로 넘긴다 (AppCore.rebuildVolume noChain) — 사본과 같은 수여야 한다
const occ = new Uint8Array(vals.length);
for (let i = 0; i < vals.length; i += 3) occ[i] = 1;
const occCopy = Uint8Array.from(occ);
const ho = valueHistogram(vals, 0, 10, 10, occ), hc = valueHistogram(vals, 0, 10, 10, occCopy);
ok(ho.total === hc.total && ho.counts.every((n, k) => n === hc.counts[k]), `occupancy 를 keep 으로 = 사본과 같은 히스토그램 (${ho.total})`);

await fs.rm(work, { recursive: true, force: true });
console.log(fails ? `\n${fails}건 실패` : '\n모두 통과');
process.exit(fails ? 1 : 0);

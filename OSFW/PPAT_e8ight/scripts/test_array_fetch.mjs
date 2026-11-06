#!/usr/bin/env node
// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   test_array_fetch.mjs

AppCore 의 '쓰는 배열 더 읽기'(fetchUsedArrays · ensureUsedArrays · setStep — 결과 폴더에서 저장 시점마다 칠하거나 거르는 배열만 읽는다, 2026-11-06)의 Node 시험.
AppCore.ts 를 esbuild 로 메모리에서 묶어(파일을 쓰지 않음) data: 주소로 불러 쓴다. 3D 화면(three 렌더러 · DOM)은 만들지 않는다 — 생성자를 건너뛰고
(Object.create) 이 흐름이 쓰는 상태만 손으로 채운 뒤 진짜 메서드를 부른다. 시간축(TimeSeries)은 가짜다: (시점, 배열) 캐시가 있고, 캐시에 없으면
'망 읽기'로 세어 시험이 도착·실패를 정한다.
확인(검토 반영 2026-11-06 — 배열을 더 읽는 중에 다른 데이터 열기를 시작했다가 실패하면 그 배열을 기다리는 노드가 '읽는 중'에 갇혔다):
데이터 열기 시작(beginOpen — stepToken 만 바뀜) 뒤 도착한 값은 열기가 실패해 옛 데이터가 남으면 끼워진다(받은 값은 캐시에서 — 망을 다시 읽지 않음) ·
그 사이 실패했으면 한 번 더 읽고, 그것도 실패하면 '읽지 못함'(요약 줄 · 안내 글), 다시 읽기가 되면 끼워짐 ·
열기가 성공해 시간축이 바뀌면 옛 시간축을 다시 읽지 않음 · 기다리는 setStep 이 있으면 버린 결과를 따로 다시 읽지 않고 setStep 이 늘어난 배열까지 받음.
같은 날 검토 반영 둘째 묶음: Outline 데이터 노드는 칠하지 않는 색 배열을 기다리지 않음(Surface 면 기다림) · 기본값을 기다리는 노드의 복제본도 도착 뒤 새 Field 범위
(원본 값을 바꾼 뒤 복제하면 그 값 그대로) · 기다리는 볼륨 노드는 색 지도(Range · Opacity 곡선)를 고쳐도 칠하지 않음(진짜 DataViewRenderer) ·
addLayer 의 patch 로 준 Lower·Upper 는 도착 뒤에도 그대로 · 저장 시점 파일에 없는 배열은 fieldMissingNow · 기다리지 않음 · 요약 'b 없음' · 그 배열이 있는 장면에서
미뤄 둔 기본값 · 열기가 예외로 끝나면 옛 헤더 Field 목록을 남기지 않고 옛 시간축을 닫음(dispose).
검증 반영(같은 날 저녁): 기다리는 볼륨 노드의 표현 방식을 setNodeView 로 바꾸면 렌더러는 앞 표현 그대로(배열이 온 뒤 다시 계산 때 새 표현 — 진짜 DataViewRenderer) ·
기다리지 않게 되는 표현(Feature Edges)은 바로 바뀜 · 읽기에 실패한 Field 는 fieldFailed(Color Map 화면 Field 설명 줄 '<배열> 읽지 못함').

실행: node scripts/test_array_fetch.mjs
*/
/******************************************************************************/

import { build } from 'esbuild';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// 셰이더 글(?raw)은 글로 · CSS 는 비운다 (Vite 가 하는 일)
const rawPlugin = {
  name: 'raw',
  setup(b) {
    b.onResolve({ filter: /\?raw$/ }, (a) => ({ path: path.resolve(a.resolveDir, a.path.replace(/\?raw$/, '')), namespace: 'raw' }));
    b.onLoad({ filter: /.*/, namespace: 'raw' }, (a) => ({ contents: readFileSync(a.path, 'utf8'), loader: 'text' }));
  },
};
/** rel = 묶을 파일, 또는 contents = 묶을 글(여러 모듈을 한 묶음으로 — 같은 three 를 함께 쓰게) */
const bundle = async (rel, contents) => {
  const res = await build({
    ...(contents ? { stdin: { contents, resolveDir: ROOT, loader: 'ts' } } : { entryPoints: [path.join(ROOT, rel)] }),
    bundle: true, platform: 'node', format: 'esm', target: 'es2022', write: false, logLevel: 'error',
    absWorkingDir: ROOT, plugins: [rawPlugin], define: { 'import.meta.env.DEV': 'false' }, loader: { '.css': 'empty' },
  });
  return import(`data:text/javascript;base64,${Buffer.from(res.outputFiles[0].text).toString('base64')}`);
};
// THREE 는 진짜 렌더러에 붙일 점 속성(12번)을 AppCore 와 같은 three 로 만들려고 함께 묶는다
const { AppCore, THREE } = await bundle(null, "export { AppCore } from './src/core/AppCore'; export * as THREE from 'three';");
const { ValueBounds, RangeStore } = await bundle('src/core/sliderRange.ts');

let fail = 0, pass = 0;
const ok = (cond, name, extra = '') => { if (cond) { pass++; console.log(`PASS ${name}`); } else { fail++; console.log(`FAIL ${name} ${extra}`); } };
const flush = async () => { for (let i = 0; i < 20; i++) await new Promise((r) => setTimeout(r, 0)); };
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };

// ---- 가짜 데이터 (스칼라 a · b, 셀 2개) ----
const RANGES = { a: [0, 10], b: [100, 200] };
const scalar = (name) => ({ kind: 'scalar', name, values: new Float32Array(RANGES[name]), stats: { min: RANGES[name][0], max: RANGES[name][1], p2: RANGES[name][0], p98: RANGES[name][1] } });
const datasetsOf = (want) => [{ name: 'L0', count: 2, scalars: want.map(scalar), vectors: [] }];
const HEADER = ['a', 'b']; // 머리 차례

/**
 * 가짜 시간축: (시점, 배열) 캐시. 캐시에 모두 있으면 바로, 아니면 '망 읽기'(net)로 남기고 시험이 arrive · fail 로 끝낸다.
 * absent = 그 시점 파일에 없는 배열 ('n:배열' — 읽기는 끝나지만 데이터셋에서 빠진다, TimeSeries 의 '없음' 항목)
 */
class FakeSeries {
  constructor(arrays, cached) { this._arrays = [...arrays]; this.cache = new Set(cached); this.calls = []; this.net = []; this.absent = new Set(); this.disposed = 0; }
  get arrays() { return [...this._arrays]; }
  useArrays(list) { this._arrays = HEADER.filter((x) => list.includes(x)); }
  hasArrays(n, want = this._arrays) { return want.every((a) => this.cache.has(`${n}:${a}`)); }
  present(n, want) { return datasetsOf(want.filter((a) => !this.absent.has(`${n}:${a}`))); }
  step(n, want = this._arrays) {
    this.calls.push({ n, want: [...want] });
    if (this.hasArrays(n, want)) return Promise.resolve(this.present(n, want));
    const d = deferred();
    this.net.push({ n, want: [...want], d });
    return d.promise;
  }
  // 없는 읽기면 아무것도 하지 않는다 (그 뒤 확인이 FAIL 로 알린다 — 시험이 도중에 멈추지 않게)
  arrive(i) { const r = this.net[i]; if (!r) return; for (const a of r.want) this.cache.add(`${r.n}:${a}`); r.d.resolve(this.present(r.n, r.want)); }
  fail(i, msg = '망 오류') { this.net[i]?.d.reject(new Error(msg)); }
  prefetchAhead() {} prefetch() {} stopPrefetch() {}
  dispose() { this.disposed++; }
  cachedSteps() { return []; } loadProgress() { return null; } cachedRange() { return null; }
}

/** 결과 폴더를 연 직후의 앱 (장면 0 · 쓰는 배열 a 만 끼움 · 데이터 노드 Surface 를 a 로 칠함 — 값으로 칠하는 표현이라 색 배열을 기다린다) */
function makeApp() {
  const app = Object.create(AppCore.prototype);
  const level = { name: 'L0', count: 2, scalars: [scalar('a')], vectors: [] };
  const combined = { ...level, bounds: { min: [0, 0, 0], max: [1, 1, 1] } };
  const ml = { levels: [{ name: 'L0', dataset: level, grid: null, keptCount: 2, keep: new Uint8Array([1, 1]) }], combined };
  Object.assign(app, {
    listeners: [], stepListeners: [], loading: '', info: { note: '', units: {}, descriptions: {} },
    playing: false, playTimer: null, loopPlay: false, rangeScan: null, stepLoad: null, stepLoadToken: 0,
    stepToken: 0, stepIndex: 0, arrayToken: 0, arrayFetch: null, arrayFailed: new Set(), stepBusy: 0, holdArrays: 0, usedSig: '',
    pendingDefaults: new Map(), legacyRecheck: new Map(), runtime: new Map(), layers: [], gridCache: new Map(), valuesCache: new Map(),
    ml, levels: ml.levels, dataset: combined,
    root: { visible: true, view: { representation: 'surface', opacity: 1, pointSize: 1, sphereShading: true, volumeUnitDistance: null, color: { fieldKey: 'scalar:a', separate: false, map: {} } } },
    defaultFieldKey: 'scalar:a',
    headerCatalog: [{ key: 'scalar:a', label: 'a', kind: 'scalar' }, { key: 'scalar:b', label: 'b', kind: 'scalar' }],
    catalogKeys: new Set(['scalar:a', 'scalar:b']),
    scan: { steps: [{ n: 0, time: 0 }, { n: 1, time: 1 }], input: null },
    allTimeRanges: new RangeStore(), countDirty: false, selectedLayerId: null,
    // 노드를 만들 때 쓰는 것 (addLayer · duplicateLayer — 렌더러·위치 표시는 아래에서 건너뜀)
    lastView: {}, colorMaps: new Map(), mapRuntime: new WeakMap(), passId: 0,
  });
  app.createRuntime = (l) => app.runtime.set(l.id, { kind: 'data', dirty: true, growPending: true, renderer: { triangleCount: 0, group: { visible: true } }, ms: 0 });
  app.updateGizmo = () => {};
  app.valueBounds = new ValueBounds({ known: (f, m) => app.knownRangeOf(f, m), now: (f, m) => app.nowRangeOf(f, m) });
  app.runtime.set('root', { kind: 'data', dirty: false, growPending: false, renderer: { triangleCount: 0, group: { visible: true } }, ms: 0 });
  app.dropStaleFlats = () => {}; // 색 지도 판단 지우기 — 이 시험이 보는 흐름과 무관(색 지도 상태를 만들지 않음)
  const series = new FakeSeries(['a'], ['0:a', '1:a']);
  app.series = series;
  app.installedArrays = new Set(series.arrays);
  app.emit();
  return { app, series };
}
/** 데이터 노드 색을 b 로 (패널이 하는 일 — 다시 계산 표시 · Apply 넓히기 · 화면 알림 → 쓰는 배열이 늘어 b 읽기 시작) */
function colorRootByB(app) {
  app.root.view.color.fieldKey = 'scalar:b';
  const rt = app.runtime.get('root');
  rt.dirty = true; rt.growPending = true;
  app.emit();
}
const installed = (app) => [...(app.installedArrays ?? [])].sort().join(',');

// ---- 1. 배열을 읽는 중에 데이터 열기 시작 → 값 도착 → 열기 실패(옛 데이터 그대로): 끼워지고 망은 다시 읽지 않음 ----
{
  const { app, series } = makeApp();
  ok(series.calls.length === 0, '1: 처음 장면(기본 Field 만 씀)은 더 읽지 않음');
  colorRootByB(app);
  ok(series.net.length === 1 && series.net[0].want.join() === 'a,b', '1: 데이터 노드 색을 b 로 → 장면 0 의 a·b 읽기 시작', JSON.stringify(series.calls));
  ok(app.waitingArrays('root').join() === 'b', '1: 도착 전 데이터 노드는 b 를 기다림(다시 계산하지 않음)');
  app.beginOpen('다른 데이터 여는 중'); // stepToken 만 바뀐다
  series.arrive(0);
  await flush();
  app.setLoading(''); // 열기 실패 (loadEntry · loadResultFolder 의 finally — 옛 데이터가 남음)
  await flush();
  ok(installed(app) === 'a,b', '1: 열기 실패 뒤 b 가 지금 장면에 끼워짐', `installed=[${installed(app)}]`);
  ok(app.waitingArrays('root').length === 0, '1: 데이터 노드가 더는 기다리지 않음(다시 계산할 차례)', `waiting=[${app.waitingArrays('root')}]`);
  ok(series.net.length === 1, '1: 받은 값은 캐시에서 꺼냄 — 망을 다시 읽지 않음', `net=${series.net.length}`);
  ok(app.runtime.get('root').growPending === true && app.runtime.get('root').dirty === true, '1: Apply 넓히기(growPending)가 남아 다시 계산 때 공유 색 지도를 넓힘');
  ok(app.arrayFailed.size === 0 && !app.info.note.includes('읽지 못'), '1: 실패로 적지 않음');
}

// ---- 2. 읽는 중에 데이터 열기 시작 → 읽기 실패 → 열기 실패: 한 번 더 읽고, 그것도 실패하면 '읽지 못함' ----
{
  const { app, series } = makeApp();
  colorRootByB(app);
  app.beginOpen('다른 데이터 여는 중');
  series.fail(0);
  await flush();
  app.setLoading('');
  await flush();
  ok(series.net.length === 2 && series.net[1].n === 0 && series.net[1].want.join() === 'a,b', '2: 버린 실패 뒤 지금 장면의 a·b 를 한 번 더 읽음', `net=${JSON.stringify(series.net.map((r) => r.want))}`);
  ok(app.arrayFailed.size === 0, '2: 다시 읽는 동안은 실패로 적지 않음(요약 줄 \'읽는 중\')');
  ok(app.fieldPending('scalar:b') && !app.fieldFailed('scalar:b'), '2: 다시 읽는 동안 Color Map 화면 Field 설명도 \'읽는 중\'(fieldFailed 거짓)');
  series.fail(1, '다시 읽기도 실패');
  await flush();
  ok(app.arrayFailed.has('b') && !app.arrayFailed.has('a'), '2: 다시 읽기도 실패하면 b 를 \'읽지 못함\'으로 적음(a 는 끼워져 있음)', `failed=[${[...app.arrayFailed]}]`);
  ok(app.info.note.includes('배열을 읽지 못했습니다: b'), '2: 데이터 화면 안내 글에 알림', `note=${app.info.note}`);
  ok(app.waitingArrays('root').join() === 'b' && installed(app) === 'a', '2: 데이터 노드는 앞 그림 그대로(b 를 기다림)');
  ok(app.fieldFailed('scalar:b') && !app.fieldFailed('scalar:a') && !app.fieldFailed(null) && app.layerStats('root')?.detail === 'b 읽지 못함',
    `2: fieldFailed(b) — Color Map 화면 Field 설명 줄도 노드 요약 줄('${app.layerStats('root')?.detail}')처럼 '읽지 못함' (a · 빈 Field 는 거짓)`);
  ok(series.net.length === 2, '2: 실패를 적은 뒤에는 저절로 다시 읽지 않음(되풀이 없음)', `net=${series.net.length}`);
}

// ---- 3. 같은 흐름에서 다시 읽기가 되면 끼워짐 ----
{
  const { app, series } = makeApp();
  colorRootByB(app);
  app.beginOpen('다른 데이터 여는 중');
  series.fail(0);
  await flush();
  app.setLoading('');
  await flush();
  series.arrive(1);
  await flush();
  ok(installed(app) === 'a,b' && app.waitingArrays('root').length === 0 && app.arrayFailed.size === 0, '3: 다시 읽기가 되면 b 가 끼워지고 기다림이 풀림', `installed=[${installed(app)}]`);
  ok(!app.fieldFailed('scalar:b') && !app.fieldPending('scalar:b'), '3: 끼워진 b 는 fieldFailed · fieldPending 모두 거짓');
}

// ---- 4. 읽는 중에 데이터 열기 시작 → 열기 성공(시간축이 바뀜) → 옛 값 도착: 옛 시간축을 다시 읽지 않음 ----
{
  const { app, series } = makeApp();
  colorRootByB(app);
  app.beginOpen('다른 데이터 여는 중');
  // installLevels 가 하는 일 (앞 데이터의 쓰는 배열 읽기를 버림)
  app.series = null; app.installedArrays = null; app.usedSig = ''; app.arrayToken++; app.arrayFetch = null; app.arrayFailed.clear(); app.stepBusy = 0;
  series.arrive(0);
  await flush();
  ok(series.calls.length === 1 && app.installedArrays === null, '4: 새 데이터를 연 뒤 옛 시간축의 값은 버리고 다시 읽지 않음', `calls=${series.calls.length}`);
}

// ---- 5. 읽는 중에 다른 장면을 고름(setStep 이 기다림) → 앞 결과 도착: 따로 다시 읽지 않고 setStep 이 늘어난 배열까지 받음 ----
{
  const { app, series } = makeApp();
  colorRootByB(app);
  const stepping = app.setStep(1);
  ok(series.net.length === 2 && series.net[1].n === 1 && series.net[1].want.join() === 'a,b', '5: 장면 1 을 쓰는 배열 a·b 로 읽기 시작', `net=${JSON.stringify(series.net.map((r) => [r.n, r.want]))}`);
  series.arrive(0); // 장면 0 의 b 도착 — 장면 1 을 기다리는 중이라 끼우지 않는다
  await flush();
  ok(series.calls.length === 2 && app.stepIndex === 0, '5: 버린 결과 뒤 따로 다시 읽지 않음(기다리는 setStep 에 맡김)', `calls=${JSON.stringify(series.calls.map((c) => [c.n, c.want]))}`);
  series.arrive(1);
  await stepping;
  await flush();
  ok(app.stepIndex === 1 && installed(app) === 'a,b' && app.waitingArrays('root').length === 0, '5: 장면 1 에 a·b 가 끼워짐', `step=${app.stepIndex} installed=[${installed(app)}]`);
  ok(series.calls.length === 2, '5: 그 뒤에도 더 읽지 않음', `calls=${series.calls.length}`);
}

// ---- 6. 기다림 판정: 볼륨 노드의 색은 값으로 칠하는 표현(Surface · Points · Volume)일 때만 기다린다 (검토 반영 2026-11-06) ----
{
  const { app, series } = makeApp();
  app.root.view.representation = 'outline';
  colorRootByB(app);
  ok(series.net.length === 1 && series.net[0].want.join() === 'a,b', '6: Outline 이어도 색 배열 b 는 읽어 둔다(표현을 바꿀 때 기다리지 않게)');
  ok(app.waitingArrays('root').length === 0, '6: Outline 데이터 노드는 칠하지 않는 색(b)을 기다리지 않음 — 모양 변경이 막히지 않음', `waiting=[${app.waitingArrays('root')}]`);
  app.root.view.representation = 'surface';
  ok(app.waitingArrays('root').join() === 'b', '6: Surface 로 바꾸면 그때는 b 를 기다림(빈 그림 대신 앞 그림 유지)');
  series.arrive(0);
  await flush();
  ok(app.waitingArrays('root').length === 0, '6: b 가 오면 기다림이 풀림');
}

// ---- 7. 기본값을 기다리는 노드를 복제: 복제본도 도착 뒤 새 Field 범위를 받음 (검토 반영 2026-11-06) ----
const thresholdLayer = (app, id, extra = {}) => {
  const t = { id, type: 'threshold', name: id, visible: true, parentId: null,
    params: { fieldKey: 'scalar:a', mapping: 'magnitude', method: 'between', lower: 0, upper: 10, allScalars: true, invert: false, ...extra },
    view: { representation: 'surface', opacity: 1, pointSize: 1, sphereShading: true, volumeUnitDistance: null, color: { fieldKey: null, separate: false, map: {} } } };
  app.layers.push(t);
  app.createRuntime(t);
  app.runtime.get(id).dirty = false;
  app.valueBounds.fix(id, { fieldKey: 'scalar:a', mapping: 'magnitude', values: [t.params.lower, t.params.upper] });
  return t;
};
{
  const { app, series } = makeApp();
  const t = thresholdLayer(app, 't1');
  app.setValueField('t1', { fieldKey: 'scalar:b' }); // 패널 Field 칸 — b 는 아직 없다
  ok(series.net.length === 1 && t.params.lower === 0 && t.params.upper === 10 && app.pendingDefaults.has('t1'), '7: Field 를 b 로 — 기본값은 미뤄 둠(b 읽기 시작)');
  const copy = app.duplicateLayer('t1');
  ok(app.pendingDefaults.has(copy.id), '7: 복제본도 기본값을 미뤄 둠');
  series.arrive(0);
  await flush();
  ok(t.params.lower === 100 && t.params.upper === 200, `7: 원본은 b 범위 100~200 (${t.params.lower}~${t.params.upper})`);
  ok(copy.params.lower === 100 && copy.params.upper === 200, `7: 복제본도 b 범위 100~200 — 옛 a 값(0~10)이 남지 않음 (${copy.params.lower}~${copy.params.upper})`);
}
{
  // 원본의 값을 사용자가 바꾼 뒤 복제하면(원본의 미뤄 둔 기본값은 이미 무효) 복제본도 그 값을 지킨다
  const { app, series } = makeApp();
  const t = thresholdLayer(app, 't1');
  app.setValueField('t1', { fieldKey: 'scalar:b' });
  app.updateLayer('t1', { lower: 120, upper: 150 });
  const copy = app.duplicateLayer('t1');
  series.arrive(0);
  await flush();
  ok(t.params.lower === 120 && t.params.upper === 150 && copy.params.lower === 120 && copy.params.upper === 150 && !app.pendingDefaults.has(copy.id),
    `7: 원본 값을 바꾼 뒤 복제 → 둘 다 넣은 값 그대로 (원본 ${t.params.lower}~${t.params.upper} · 복제본 ${copy.params.lower}~${copy.params.upper})`);
}

// ---- 8. 기다리는 볼륨 노드의 색 지도를 고쳐도 옛 값 위에 새 지도를 칠하지 않음 (검토 반영 2026-11-06 — 진짜 DataViewRenderer) ----
{
  const { app, series } = makeApp();
  Object.assign(app, { scene: { add() {}, remove() {} }, camera: {}, orthoCamera: {} });
  app.updatePointScale = () => {};
  app.runtime.delete('root');
  app.attachRuntime('root', 'data', true);
  const rt = app.runtime.get('root');
  rt.dirty = false;
  const calls = [];
  const orig = rt.renderer.setColor.bind(rt.renderer);
  rt.renderer.setColor = (spec) => { calls.push(spec); orig(spec); };
  app.setNodeColoring('root', { fieldKey: 'scalar:b' }); // 데이터 노드(Surface) 색을 b 로 — 아직 a 값이 올라 있다
  ok(app.waitingArrays('root').join() === 'b', '8: 데이터 노드가 b 를 기다림');
  calls.length = 0;
  app.updateColorMap({ nodeId: 'root' }, { rangeMin: 500, rangeMax: 900 }); // 기다리는 동안 Color Map 편집기에서 Range 를 넣음
  ok(calls.length === 0 && rt.dirty, `8: Range 를 바꿔도 기다리는 노드는 칠하지 않고 다시 계산 표시만 (setColor ${calls.length}번)`);
  app.root.view.representation = 'volume';
  app.updateColorMap({ nodeId: 'root' }, { opacity: [[0, 0], [1, 1]] }); // Opacity 곡선만 (Volume 노드만 다시 칠하는 길)
  ok(calls.length === 0 && rt.dirty, `8: Opacity 곡선을 바꿔도 기다리는 Volume 노드는 칠하지 않음 (setColor ${calls.length}번)`);
  app.root.view.representation = 'surface';
  series.arrive(0);
  await flush();
  rt.dirty = false; // (그리기 고리 대신) 도착 뒤 다시 계산했다고 친다
  app.updateColorMap({ nodeId: 'root' }, { rangeMin: 100, rangeMax: 200 });
  ok(calls.length === 1 && calls[0].fieldKey === 'scalar:b' && calls[0].rangeMin === 100, `8: b 가 온 뒤에는 바로 칠함 (setColor ${calls.length}번 · ${calls[0]?.fieldKey} ${calls[0]?.rangeMin}~${calls[0]?.rangeMax})`);
}

// ---- 9. addLayer(type, patch): patch 로 준 통계 기본값 키는 배열이 온 뒤에도 덮지 않음 (검토 반영 2026-11-06) ----
{
  const { app, series } = makeApp();
  const both = app.addLayer('threshold', { fieldKey: 'scalar:b', lower: 120, upper: 150 }, false);
  const one = app.addLayer('threshold', { fieldKey: 'scalar:b', lower: 130 }, false);
  const none = app.addLayer('threshold', { fieldKey: 'scalar:b' }, false);
  ok(!app.pendingDefaults.has(both.id) && app.pendingDefaults.has(one.id) && app.pendingDefaults.has(none.id), '9: Lower·Upper 를 모두 주면 미루지 않음 · 하나만 주거나 안 주면 미룸');
  ok(series.net.length >= 1 && series.net.at(-1).want.includes('b'), '9: b 읽기 시작');
  for (let i = 0; i < series.net.length; i++) series.arrive(i);
  await flush();
  for (let i = 0; i < series.net.length; i++) series.arrive(i);
  await flush();
  ok(both.params.lower === 120 && both.params.upper === 150, `9: 둘 다 준 값 그대로 (${both.params.lower}~${both.params.upper})`);
  ok(one.params.lower === 130 && one.params.upper === 200, `9: 준 Lower 는 그대로 · 주지 않은 Upper 만 b 최대 200 (${one.params.lower}~${one.params.upper})`);
  ok(none.params.lower === 100 && none.params.upper === 200, `9: 아무것도 안 주면 b 범위 100~200 (${none.params.lower}~${none.params.upper})`);
}

// ---- 10. 저장 시점 파일에 없는 배열: '(없음)'·'Field 없음' 판정 · 기다리지 않음(끝난 상태) · 그 배열이 있는 장면에서 미뤄 둔 기본값 (검토 반영 2026-11-06) ----
{
  const { app, series } = makeApp();
  series.absent.add('0:b'); // 0번 파일에는 b 가 없다 (1번에는 있다)
  const t = thresholdLayer(app, 't1');
  app.setValueField('t1', { fieldKey: 'scalar:b' });
  series.arrive(0); // 읽기는 끝났지만 b 는 데이터셋에 없다
  await flush();
  ok(installed(app) === 'a,b' && app.fieldMissingNow('scalar:b') && !app.fieldPending('scalar:b') && !app.fieldMissingNow('scalar:a'),
    `10: b 는 끼웠지만(읽기 끝) 이 저장 시점에 없음 — fieldMissingNow (installed=[${installed(app)}])`);
  ok(app.waitingArrays('t1').length === 0 && app.runtime.get('t1').dirty, '10: 그 노드는 \'읽는 중\'으로 기다리지 않음 (끝난 상태 — 다시 계산할 차례)');
  const st = app.layerStats('t1');
  ok(st && st.detail.startsWith('b 없음 · ') && !st.pending, `10: 요약 줄 앞에 'b 없음' (${st?.detail})`);
  ok(t.params.lower === 0 && t.params.upper === 10 && app.pendingDefaults.has('t1'), '10: 미뤄 둔 기본값은 값이 없는 동안 넣지 않음 (0~1 로 덮지 않음)');
  const changesBefore = series.calls.length;
  app.setStep(1);
  await flush();
  series.arrive(series.net.length - 1);
  await flush();
  ok(app.stepIndex === 1 && !app.fieldMissingNow('scalar:b') && t.params.lower === 100 && t.params.upper === 200 && !app.pendingDefaults.has('t1'),
    `10: b 가 있는 1번 장면으로 넘기면 그때 기본값 100~200 (${t.params.lower}~${t.params.upper} · 읽기 ${series.calls.length - changesBefore}번)`);
  const st1 = app.layerStats('t1');
  ok(st1 && !st1.detail.includes('없음'), `10: 1번 장면 요약에는 '없음' 이 없음 (${st1?.detail})`);
}

// ---- 11. 열기가 예외로 끝나면 옛 헤더 Field 목록을 남기지 않음 · 옛 시간축은 닫음 (검토 반영 2026-11-06) ----
{
  const { app, series } = makeApp();
  Object.assign(app, { valuesCache: new Map(), gridCache: new Map() });
  let err = '';
  try { app.installLevels([{ name: 'x', count: 0, scalars: [], vectors: [] }], { note: '', units: {}, descriptions: {} }, {}, null, '빈 데이터'); } catch (e) { err = e.message; }
  ok(err === '읽을 수 있는 셀이 없습니다.', `11: 셀 0개 열기 실패 (${err})`);
  ok(app.series === null && series.disposed === 1, `11: 옛 시간축은 닫음(dispose ${series.disposed}번 — Worker 위상 사본도 지움)`);
  ok(app.fieldOption('scalar:b') === null && app.fieldOption('scalar:a')?.key === 'scalar:a' && app.catalogKeys.size === 0,
    '11: 목록이 옛 데이터셋에 실제로 든 배열(a)로 돌아감 — 다시 읽을 수 없는 b 는 목록에서 빠짐');
}

// ---- 12. 기다리는 볼륨 노드의 표현 방식 바꾸기 — setNodeView 를 거쳐 (검증 반영 2026-11-06 저녁 — 진짜 DataViewRenderer) ----
// 바로 바꾸면 한 번도 계산하지 않은 표현이 보였다(Surface · Volume 은 빈 그림, Points 는 거르지 않은 점). 이제 배열이 온 뒤 다시 계산(rebuildData) 때 바뀐다
/** 진짜 렌더러를 붙인 앱 (장면·카메라는 빈 것, 점 2개의 공유 속성 — 도착 뒤 다시 계산까지 돈다) */
function makeRenderApp() {
  const { app, series } = makeApp();
  Object.assign(app, { scene: { add() {}, remove() {} }, camera: {}, orthoCamera: {}, timings: {} });
  app.updatePointScale = () => {};
  app.dataset.positions = new Float32Array([0, 0, 0, 1, 1, 1]);
  app.pointAttrs = { position: new THREE.BufferAttribute(new Float32Array([0, 0, 0, 1, 1, 1]), 3), pointRadius: new THREE.BufferAttribute(new Float32Array(2), 1), useRadiusAttr: false, worldRadius: 0.5, count: 2 };
  delete app.createRuntime; // 진짜 createRuntime (attachRuntime — 진짜 렌더러)
  app.runtime.delete('root');
  app.attachRuntime('root', 'data', true);
  return { app, series };
}
{
  // (가) 데이터 노드: Outline 으로 계산해 둔 채 색을 아직 없는 b 로(Outline 은 칠하지 않아 기다리지 않음) → 도착 전에 Surface 로
  const { app, series } = makeRenderApp();
  const rt = app.runtime.get('root'), r = rt.renderer;
  app.setNodeView('root', { representation: 'outline' });
  ok(r.representation === 'outline' && r.outline.group.visible && !r.surface.group.visible, '12: 기다리지 않는 노드는 표현이 바로 바뀜 (Surface → Outline)');
  rt.dirty = false; // (그리기 고리 대신) Outline 으로 계산했다고 친다
  app.setNodeColoring('root', { fieldKey: 'scalar:b' });
  ok(series.net.length === 1 && app.waitingArrays('root').length === 0, '12: Outline 에서 색을 b 로 — b 읽기 시작 · 칠하지 않으므로 기다리지 않음');
  app.setNodeView('root', { representation: 'surface' });
  app.rebuildDirtyLayers();
  ok(app.root.view.representation === 'surface' && r.representation === 'outline' && r.outline.group.visible && !r.surface.group.visible,
    `12: 기다리는 데이터 노드를 Surface 로 바꾸면 렌더러는 앞 표현(Outline) 그대로 — 빈 그림 대신 앞 그림 (보이는 표현 ${r.shownRepresentation()})`);
  ok(app.layerStats('root')?.detail === 'b 읽는 중' && rt.dirty, `12: 요약 줄 '${app.layerStats('root')?.detail}' · 다시 계산할 차례로 남음`);
  series.arrive(0);
  await flush();
  app.rebuildDirtyLayers();
  ok(r.representation === 'surface' && !rt.dirty && !r.outline.group.visible,
    `12: b 가 오면 다시 계산하며 새 표현(Surface)으로 바뀜 (렌더러 ${r.representation} · 보이는 표현 ${r.shownRepresentation()} — 격자 없는 시험 데이터라 점으로 대신)`);
}
{
  // (나) Threshold(Surface 로 계산해 둠): Field 를 아직 없는 b 로 → 도착 전에 Points · Volume 으로
  const { app, series } = makeRenderApp();
  app.runtime.get('root').dirty = false;
  thresholdLayer(app, 't1');
  const rt = app.runtime.get('t1'), r = rt.renderer;
  r.setRepresentation('surface'); rt.dirty = false; // Surface 로 계산해 둔 앞 그림
  app.setValueField('t1', { fieldKey: 'scalar:b' });
  ok(app.waitingArrays('t1').join() === 'b', '12: Threshold Field 를 b 로 — b 를 기다림');
  app.setNodeView('t1', { representation: 'points' });
  app.rebuildDirtyLayers();
  ok(r.representation === 'surface' && r.surface.group.visible && !r.points.group.visible,
    `12: 기다리는 Threshold 를 Points 로 바꿔도 앞 표현(Surface) — 거르지 않은 점을 보이지 않음 (보이는 표현 ${r.shownRepresentation()})`);
  app.setNodeView('t1', { representation: 'volume' });
  ok(r.representation === 'surface' && !r.volume.group.visible && app.layerStats('t1')?.detail === 'b 읽는 중', `12: Volume 으로 바꿔도 앞 표현 그대로 (빈 Volume 을 보이지 않음 · 요약 '${app.layerStats('t1')?.detail}')`);
  series.arrive(0);
  await flush();
  app.rebuildDirtyLayers();
  ok(r.representation === 'volume' && !rt.dirty, `12: b 가 오면 다시 계산하며 Volume 으로 (렌더러 ${r.representation})`);
}
{
  // (다) 기다리는 데이터 노드(Surface, 색 b)를 칠하지 않는 표현(Feature Edges)으로 바꾸면 더는 기다리지 않으므로 바로 바뀐다
  const { app, series } = makeRenderApp();
  const rt = app.runtime.get('root'), r = rt.renderer;
  r.setRepresentation('surface'); rt.dirty = false;
  app.setNodeColoring('root', { fieldKey: 'scalar:b' });
  ok(app.waitingArrays('root').join() === 'b' && series.net.length === 1, '12: Surface 데이터 노드의 색을 b 로 — b 를 기다림');
  app.setNodeView('root', { representation: 'featureEdges' });
  ok(r.representation === 'featureEdges' && app.waitingArrays('root').length === 0, `12: 칠하지 않는 Feature Edges 로 바꾸면 기다리지 않으므로 바로 바뀜 (렌더러 ${r.representation})`);
}

console.log(`\n통과 ${pass}, 실패 ${fail}`);
process.exit(fail ? 1 : 0);

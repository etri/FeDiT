#!/usr/bin/env node
// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   test_slider_range.mjs

src/core/sliderRange.ts(값 밀대 양 끝 — 노드마다 정해 두고 재생으로는 바꾸지 않음, 2026-11-05 결정)의 Node 시험.
esbuild 로 메모리에서 묶어(파일을 쓰지 않음) data: 주소로 불러 쓴다. 숫자 칸 글자 읽기(src/ui/dom.ts parseNumberText)도 함께 본다.
확인: 범위 넓히기 · 합치기 · 밀대 끝 = 끝 ∪ 노드 값(눈금 폭/500 · 폭 0 이면 1e-9 · 값이 없으면 0~1) · 성분 열쇠(스칼라는 늘 magnitude) ·
노드의 값 밀대(Threshold Lower·Upper · Clip 기준값 · Isosurface 값 = 크기) · 끝 정하기(알고 있는 범위 ∪ 값 · 모두 같거나 없으면 미정) ·
값까지 넓히기만(숫자 입력 · 장면 JSON — 끄는 동안 줄지 않음) · 노드별 끝 모음(ValueBounds):
재생 흉내 51장면 두 바퀴에서 Threshold 손잡이 — 지금 시점 범위(첫 고침 전)는 거의 매 장면 · 본 범위로 넓히기(직전 작업)는 처음 보는 끝값에서 ·
노드별 끝(이번)은 한 번도 안 움직임 · 첫 장면 값이 모두 같으면(velocity t = 0 모두 0) 미정 → 값이 처음 달라지는 장면에서 한 번만 정함 ·
미리 읽은 1번 장면이 캐시에 있어도 미정(보이는 장면으로 판단 — 검토 반영) · 0번에서 30번으로 건너뛰면 그때 정함 · t = 0 에서 전 시점 범위를 읽으면 정함 ·
Field·Component 를 바꾸면 다시 정함(값만 바꾸면 그대로) · 전 시점 범위(다)는 같은 배열·성분 노드만 모든 시점 범위로, 뒤에 만든 노드도 그 범위로 시작 ·
한 바퀴 돈 뒤 만든 노드는 읽어 둔 모든 장면으로 시작 · 미정 끝을 정하지 못하면 임시 끝(숫자로 넓힌 것)을 지킴 · Field 가 없으면 미정 ·
지우기 · 비우기 · 만들 때 정하지 못한 노드는 처음 물을 때 정함 · 숫자 칸은 십진수만 받음.

실행: node scripts/test_slider_range.mjs
*/
/******************************************************************************/

import { build } from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bundle = async (rel) => {
  const res = await build({ entryPoints: [path.join(ROOT, rel)], bundle: true, platform: 'neutral', format: 'esm', target: 'es2022', write: false, logLevel: 'silent', loader: { '.css': 'empty', '.svg': 'text' } });
  return import(`data:text/javascript;base64,${Buffer.from(res.outputFiles[0].text).toString('base64')}`);
};
const {
  widenRange, unionRanges, sliderBounds, mappingKeyOf, sliderKeyOf, valueSliderOf, decideBounds, includeValues, boundsForSlider, isFlatInfo, ValueBounds, RangeStore,
} = await bundle('src/core/sliderRange.ts');
const { parseNumberText } = await bundle('src/ui/dom.ts');

let fail = 0, pass = 0;
const ok = (cond, name, extra = '') => { if (cond) { pass++; console.log(`PASS ${name}`); } else { fail++; console.log(`FAIL ${name} ${extra}`); } };
const same = (r, lo, hi) => !!r && r.min === lo && r.max === hi;
const J = (v) => JSON.stringify(v);

// ---- widenRange ----
{
  const a = widenRange(null, 1, 3);
  ok(same(a, 1, 3), `처음: null → 1~3 (${J(a)})`);
  ok(widenRange(a, 1.5, 2.5) === a, '안쪽 값이면 같은 객체(바뀌지 않음 — 좁히지 않음)');
  ok(same(widenRange(a, 0.5, 2), 0.5, 3), '아래로만 넓힘 0.5~3');
  ok(same(widenRange(a, 2, 4), 1, 4), '위로만 넓힘 1~4');
  ok(widenRange(a, NaN, Infinity) === a, 'NaN·Infinity 는 건너뜀 (같은 객체)');
  ok(same(widenRange(a, -Infinity, 5), 1, 5), '한쪽만 유한하면 그 끝만 씀 1~5');
  ok(widenRange(null, NaN, NaN) === null, '유한한 끝이 없고 앞 범위도 없으면 null');
  ok(same(widenRange(null, 2, 2), 2, 2), '폭 0 도 범위 (2~2)');
  ok(same(widenRange(null, 3, 1), 1, 3), '거꾸로 준 끝도 최소~최대로 (1~3)');
}

// ---- unionRanges ----
{
  ok(same(unionRanges({ min: 0, max: 1 }, null, { min: -2, max: 0.5 }, undefined), -2, 1), '합치기: null·undefined 건너뜀 → -2~1');
  ok(unionRanges(null, undefined) === null, '합칠 것이 없으면 null');
  const src = { min: 1, max: 2 };
  const u = unionRanges(src);
  ok(same(u, 1, 2) && u !== src, '하나뿐이어도 새 객체 (받은 범위를 나중에 고치지 않게)');
  ok(same(unionRanges({ min: NaN, max: 3 }, { min: 1, max: Infinity }), 1, 3), '유한하지 않은 끝은 건너뜀 → 1~3');
}

// ---- sliderBounds ----
{
  const b = sliderBounds({ min: 0, max: 2 }, [0.56, 1.56]);
  ok(b.min === 0 && b.max === 2 && b.step === 2 / 500, `안쪽 값: 끝 0~2 · 눈금 폭/500 (${J(b)})`);
  const c = sliderBounds({ min: 0.6, max: 1.2 }, [0.56, 1.56]);
  ok(c.min === 0.56 && c.max === 1.56, `값이 범위 밖이면 끝이 값까지 (손잡이가 끝에 붙지 않게) ${c.min}~${c.max}`);
  const d = sliderBounds({ min: 101325, max: 101325 }, [101325]);
  ok(d.min === 101325 && d.max === 101325 && d.step === 1e-9, `폭 0: 눈금 1e-9 (고치기 전과 같음) ${J(d)}`);
  const e = sliderBounds(null, []);
  ok(e.min === 0 && e.max === 1 && e.step === 1 / 500, `범위·값이 없으면 0~1 (${J(e)})`);
  ok(sliderBounds(null, [5]).min === 5 && sliderBounds(null, [5]).max === 5, '범위가 없으면 값만으로');
  const g = sliderBounds({ min: 0, max: 1 }, [NaN, -Infinity]);
  ok(g.min === 0 && g.max === 1, '유한하지 않은 값은 건너뜀');
}

// ---- 열쇠 · 노드의 값 밀대 ----
{
  ok(mappingKeyOf('scalar:fraction', 'x') === 'magnitude' && mappingKeyOf('vector:velocity', 'x') === 'x' && mappingKeyOf(null, 'y') === 'y', '성분 열쇠: 스칼라는 늘 magnitude · 벡터는 성분 그대로');
  ok(sliderKeyOf({ fieldKey: 'scalar:p', mapping: 'z' }) === sliderKeyOf({ fieldKey: 'scalar:p', mapping: 'magnitude' }), '스칼라는 Component 가 달라도 같은 열쇠 (Component 칸이 숨어 있어 바뀌어도 끝을 다시 정하지 않음)');
  ok(sliderKeyOf({ fieldKey: 'vector:v', mapping: 'x' }) !== sliderKeyOf({ fieldKey: 'vector:v', mapping: 'y' }), '벡터는 성분마다 다른 열쇠');
  const thr = { id: 't', type: 'threshold', params: { fieldKey: 'vector:velocity', mapping: 'x', lower: -1, upper: 2 } };
  const clip = { id: 'c', type: 'clip', params: { fieldKey: 'scalar:p', mapping: 'y', value: 3, clipType: 'plane' } };
  const iso = { id: 'i', type: 'iso', params: { fieldKey: 'vector:velocity', value: 0.4 } };
  ok(J(valueSliderOf(thr)) === J({ fieldKey: 'vector:velocity', mapping: 'x', values: [-1, 2] }), `Threshold: Lower·Upper (${J(valueSliderOf(thr))})`);
  ok(J(valueSliderOf(clip)) === J({ fieldKey: 'scalar:p', mapping: 'magnitude', values: [3] }), 'Clip: 기준값 (종류가 Plane 이어도 — Scalar 로 바꾸면 그 끝 그대로)');
  ok(J(valueSliderOf(iso)) === J({ fieldKey: 'vector:velocity', mapping: 'magnitude', values: [0.4] }), 'Isosurface: 값 (벡터는 크기)');
  ok(valueSliderOf({ type: 'slice', params: {} }) === null && valueSliderOf({ type: 'glyph', params: {} }) === null && valueSliderOf({ type: 'stream', params: {} }) === null, 'Slice·Glyph·Streamline 은 값 밀대가 없음');
}

// ---- 끝 정하기 · 값까지 넓히기 ----
{
  const a = decideBounds('k', { range: { min: 0, max: 1.2 }, floor: 0 }, [0.56, 1.56]);
  ok(a.decided && same(a.range, 0, 1.56), `정함: 알고 있는 범위 0~1.2 ∪ 값(장면 JSON 의 Upper 1.56) → 0~1.56 (${J(a)})`);
  const f = decideBounds('k', { range: { min: 0, max: 0 }, floor: 0 }, [0, 0]);
  ok(!f.decided && same(f.range, 0, 0), `알고 있는 값이 모두 같으면(0~0) 미정 · 임시 끝 0~0 (${J(f)})`);
  const n = decideBounds('k', { range: null, floor: 0 }, [2, 5]);
  ok(!n.decided && same(n.range, 2, 5), 'Field 가 없으면(범위 null) 미정 · 임시 끝은 값만으로 2~5');
  ok(decideBounds('k', { range: null, floor: 0 }, [NaN]).range === null, '값도 유한하지 않으면 끝 없음(null — 밀대는 0~1)');
  const j = decideBounds('k', { range: { min: 0, max: 0.03 }, floor: 0 }, [0], { range: { min: 0, max: 0 }, floor: 0 });
  ok(!j.decided && same(j.range, 0, 0.03), `보이는 장면(judge)이 모두 같으면 알고 있는 범위가 달라도 미정 · 임시 끝은 알고 있는 범위 0~0.03 (${J(j)})`);
  ok(decideBounds('k', { range: { min: 0, max: 0.03 }, floor: 0 }, [0], { range: { min: 0, max: 0.02 }, floor: 0 }).decided, '보이는 장면이 서로 다르면 정함');
  const noise = { range: { min: -5e-15, max: 5e-15 }, floor: 1.19e-7 };
  ok(isFlatInfo(noise) && !decideBounds('k', noise, [0]).decided, '벡터 성분의 계산 잡음(±5e-15, 하한 1.19e-7 — colorRange componentFlatFloor)은 모두 같음 → 미정');
  ok(!isFlatInfo({ range: { min: 0, max: 1e-5 }, floor: 1.19e-7 }), '하한보다 넓은 약한 성분(0~1e-5)은 정함');
  const w = includeValues(a, [0.3, 2.5]);
  ok(same(w.range, 0, 2.5) && w.decided && w !== a, '숫자 칸에 2.5 → 끝이 2.5 까지 넓어짐 (정한 상태 그대로)');
  ok(includeValues(w, [0.1, 1.0]) === w, '안쪽 값으로 끌면 같은 객체 (끝이 줄지 않음)');
  ok(same(includeValues(f, [0, 3]).range, 0, 3) && !includeValues(f, [0, 3]).decided, '미정인 임시 끝도 넣은 값까지 넓어짐 (미정은 그대로)');
  const sb = boundsForSlider(a, [0.56, 1.56]);
  ok(sb.min === 0 && sb.max === 1.56 && sb.step === 1.56 / 500, `밀대: 끝 0~1.56 · 눈금 폭/500 (${J(sb)})`);
  ok(boundsForSlider(a, [5]).max === 5, '다른 길로 값이 끝 밖이 되어도 밀대는 값까지 (손잡이가 끝에 붙지 않게 — 끝 자체는 그대로)');
}

// ---- 노드별 끝 모음: 가짜 시간축 (51장면) ----
const N = 51;
/** fraction: 0 근처 ~ 장면마다 다른 최대 (유체-입자 fraction 흉내) */
const fractionAt = (k) => ({ min: 0.02 * Math.sin(k * 0.7) - 0.05, max: 1.4 + 0.5 * Math.sin(k * 0.37) + 0.3 * Math.cos(k * 1.3) });
/** velocity: t = 0 은 모두 0, 그 뒤 장면마다 다름. 성분 x 는 -a ~ b */
const velAt = (m, k) => (k === 0 ? { min: 0, max: 0 } : m === 'magnitude' ? { min: 0.001 * k, max: 0.03 * k + 0.01 * Math.sin(k) } : { min: -0.01 * k, max: 0.02 * k + 0.005 * Math.cos(k) });
/** 가짜 AppCore: 지금 장면 · 읽어 둔 장면(캐시) · 전 시점 범위 결과 — sliderRange.ts RangeSource */
class FakeCore {
  constructor() { this.step = 0; this.cached = new Set([0]); this.allTime = new RangeStore(); this.knownCalls = 0; this.missing = new Set(); }
  rangeAt(f, m, k) {
    if (!f || this.missing.has(f)) return null;
    if (f === 'scalar:fraction') return fractionAt(k);
    if (f === 'vector:velocity') return velAt(mappingKeyOf(f, m), k);
    return null;
  }
  goto(k) { this.step = k; this.cached.add(k); }
  now(f, m) { return { range: this.rangeAt(f, m, this.step), floor: 0 }; }
  known(f, m) {
    this.knownCalls++;
    const mk = mappingKeyOf(f, m);
    return { range: unionRanges(this.rangeAt(f, m, this.step), ...[...this.cached].map((k) => this.rangeAt(f, m, k)), f ? this.allTime.get(f, mk) : null), floor: 0 };
  }
}
const thrNode = (id, fieldKey, mapping, lower, upper) => ({ id, type: 'threshold', params: { fieldKey, mapping, lower, upper } });
const isoNode = (id, fieldKey, value) => ({ id, type: 'iso', params: { fieldKey, value } });
const sliderNodes = (nodes) => nodes.map((l) => ({ id: l.id, slider: valueSliderOf(l) }));
/** 손잡이 자리 (밀대 위 0~1) */
const handle = (b, v) => (b.max > b.min ? (v - b.min) / (b.max - b.min) : 0);
/**
 * 재생 흉내: AppCore.setStep 처럼 장면을 옮길 때마다 settle 하고, 패널처럼 밀대 끝을 묻는다(노드 다시 고르기 = 같은 물음).
 * 돌려주는 것: 손잡이(값 v)가 앞 장면과 다른 자리에 선 장면 수 · 끝이 바뀐 장면 수 · settle 이 정한 수
 */
function play(core, vb, nodes, id, v, loops, start = 1) {
  const node = nodes.find((l) => l.id === id);
  let prev = vb.sliderOf(id, valueSliderOf(node)), prevPos = handle(prev, v), moved = 0, changed = 0, settled = 0;
  for (let j = 0; j < loops * N - (start === 1 ? 1 : 0); j++) {
    const k = (start + j) % N;
    core.goto(k);
    settled += vb.settle(sliderNodes(nodes));
    const b = vb.sliderOf(id, valueSliderOf(node));
    const pos = handle(b, v);
    if (Math.abs(pos - prevPos) > 1e-12) moved++;
    if (b.min !== prev.min || b.max !== prev.max) changed++;
    prev = b; prevPos = pos;
  }
  return { moved, changed, settled };
}

// 1. 손잡이가 재생 중에 움직이는가 — 세 방식
{
  const lower = 0.56, upper = 1.56;
  // 첫 고침 전: 밀대 끝 = 지금 시점 범위
  let prev = null, before = 0;
  for (let k = 0; k < N; k++) { const pos = handle(sliderBounds(fractionAt(k), []), lower); if (prev !== null && Math.abs(pos - prev) > 1e-12) before++; prev = pos; }
  // 직전 작업: 밀대 끝 = 본 범위(보인 장면마다 넓히기) ∪ 값
  let seen = null; prev = null; let widenWay = 0;
  for (let k = 0; k < N; k++) { seen = widenRange(seen, fractionAt(k).min, fractionAt(k).max); const pos = handle(sliderBounds(seen, [lower, upper]), lower); if (prev !== null && Math.abs(pos - prev) > 1e-12) widenWay++; prev = pos; }
  // 이번: 노드별 끝 (0번 장면에서 만듦 — 0·1번이 캐시에 있음, 미리 읽기 흉내)
  const core = new FakeCore(); core.cached.add(1);
  const vb = new ValueBounds(core);
  const nodes = [thrNode('t1', 'scalar:fraction', 'magnitude', lower, upper)];
  vb.fix('t1', valueSliderOf(nodes[0]));
  const r = play(core, vb, nodes, 't1', lower, 2);
  ok(before >= N - 2, `첫 고침 전(지금 시점 범위): 첫 바퀴 51장면 중 Lower 0.56 손잡이가 움직인 장면 ${before}`);
  ok(widenWay > 0 && widenWay < 15, `직전 작업(본 범위로 넓히기): 첫 바퀴에 처음 보는 끝값이 나온 장면에서 ${widenWay}번 움직임`);
  ok(r.moved === 0 && r.changed === 0 && r.settled === 0, `이번(노드별 끝): 두 바퀴(101번 장면 넘김 · 매번 다시 물음) 동안 손잡이 ${r.moved}번 · 끝 ${r.changed}번 바뀜`);
  const b = vb.sliderOf('t1', valueSliderOf(nodes[0]));
  const r01 = unionRanges(fractionAt(0), fractionAt(1));
  ok(b.min === r01.min && b.max === Math.max(r01.max, upper), `끝 = 만들 때 알고 있던 범위(0·1번 장면) ∪ Upper (${b.min.toFixed(4)} ~ ${b.max.toFixed(4)})`);
}

// 2. 한 바퀴 돈 뒤(51장면 모두 캐시) 25번 장면에서 만든 노드: 읽어 둔 모든 장면으로 시작 → 두 번째 바퀴에도 안 움직임
{
  const core = new FakeCore();
  for (let k = 0; k < N; k++) core.goto(k);
  core.goto(25);
  const vb = new ValueBounds(core);
  const nodes = [thrNode('t2', 'scalar:fraction', 'magnitude', 0.56, 1.56)];
  vb.fix('t2', valueSliderOf(nodes[0]));
  const all = unionRanges(...Array.from({ length: N }, (_, k) => fractionAt(k)));
  const b = vb.sliderOf('t2', valueSliderOf(nodes[0]));
  ok(b.min === all.min && b.max === all.max, `한 바퀴 뒤 만든 노드: 끝 = 51장면 모두의 범위 (${b.min.toFixed(4)} ~ ${b.max.toFixed(4)})`);
  const r = play(core, vb, nodes, 't2', 0.56, 1, 26);
  ok(r.moved === 0, `그 뒤 한 바퀴: 손잡이 ${r.moved}번 움직임`);
}

// 3. 첫 장면 값이 모두 같음(velocity t = 0 모두 0): 미정 → 값이 처음 달라지는 장면에서 한 번만 정함
{
  const core = new FakeCore();
  const vb = new ValueBounds(core);
  const nodes = [isoNode('i1', 'vector:velocity', 0), thrNode('t3', 'scalar:fraction', 'magnitude', 0.1, 0.9)];
  for (const l of nodes) vb.fix(l.id, valueSliderOf(l));
  ok(!vb.get('i1').decided && same(vb.get('i1').range, 0, 0), `t = 0 만 읽음: Isosurface(velocity 크기) 끝 미정 · 임시 0~0 (${J(vb.get('i1'))})`);
  ok(vb.get('t3').decided, '같은 장면의 fraction Threshold 는 바로 정함 (값이 서로 다름)');
  core.goto(0);
  ok(vb.settle(sliderNodes(nodes)) === 0 && !vb.get('i1').decided, '0번 장면에 다시 와도(모두 0) 정하지 않음');
  const r = play(core, vb, nodes, 'i1', 0, 2);
  ok(r.settled === 1 && r.changed === 1, `두 바퀴: 끝은 1번 장면에서 한 번만 정함 (settle ${r.settled}번 · 끝 바뀜 ${r.changed}번)`);
  const d = vb.get('i1');
  const want = unionRanges(velAt('magnitude', 0), velAt('magnitude', 1));
  ok(d.decided && same(d.range, Math.min(want.min, 0), want.max), `정한 끝 = 그때 알고 있던 범위(0·1번) ∪ 값 0 → ${d.range.min} ~ ${d.range.max.toFixed(4)}`);
}

// 3b. 미리 읽기(결과 폴더를 열면 1번 장면을 바로 읽음): t = 0 에서 만들 때 1번이 캐시에 있어도 미정 — 보이는 장면으로 판단(검토 반영 2026-11-05)
{
  const core = new FakeCore(); core.cached.add(1);
  const vb = new ValueBounds(core);
  const nodes = [isoNode('i3', 'vector:velocity', 0)];
  vb.fix('i3', valueSliderOf(nodes[0]));
  const k01 = unionRanges(velAt('magnitude', 0), velAt('magnitude', 1));
  ok(!vb.get('i3').decided && same(vb.get('i3').range, Math.min(k01.min, 0), k01.max), `0·1번 캐시 · t = 0 에서 만듦: 미정 · 임시 끝 = 알고 있는 범위(0·1번) ∪ 값 0 (${J(vb.get('i3'))})`);
  ok(vb.settle(sliderNodes(nodes)) === 0 && !vb.get('i3').decided, '0번 장면에서는 정하지 않음');
  const r = play(core, vb, nodes, 'i3', 0, 1);
  ok(r.settled === 1 && r.changed === 0, `한 바퀴: 1번 장면에서 한 번 정함 — 그때 알고 있는 범위가 임시 끝과 같아 끝은 안 바뀜 (settle ${r.settled}번 · 끝 바뀜 ${r.changed}번)`);
  // 0번에서 바로 30번으로 건너뜀 (캐시로 판단하던 첫 구현은 만들 때 0·1번 범위로 정해 30번 값이 끝 밖이었다)
  const c2 = new FakeCore(); c2.cached.add(1);
  const vb2 = new ValueBounds(c2);
  vb2.fix('i3', valueSliderOf(nodes[0]));
  c2.goto(30);
  const k = unionRanges(velAt('magnitude', 0), velAt('magnitude', 1), velAt('magnitude', 30));
  ok(vb2.settle(sliderNodes(nodes)) === 1 && vb2.get('i3').decided && same(vb2.get('i3').range, Math.min(k.min, 0), k.max), `0번 → 30번으로 건너뛰면 그때 정함: 0·1·30번 ∪ 값 0 (${J(vb2.get('i3').range)})`);
  // (다) t = 0 (보이는 장면 모두 0) 에서 전 시점 범위를 읽으면 정함 — 사용자가 누른 결과
  const c3 = new FakeCore();
  const vb3 = new ValueBounds(c3);
  vb3.fix('i3', valueSliderOf(nodes[0]));
  const all = unionRanges(...Array.from({ length: N }, (_, n) => velAt('magnitude', n)));
  c3.allTime.widen('vector:velocity', 'magnitude', all.min, all.max);
  const calls = c3.knownCalls;
  ok(vb3.refixUsers(sliderNodes([...nodes, isoNode('i3b', 'vector:velocity', 0.1)]), 'vector:velocity', 'magnitude') === 2 && vb3.get('i3').decided && same(vb3.get('i3').range, 0, all.max),
    `t = 0 에서 velocity 크기 전 시점 범위: 미정이던 끝도 정함 0 ~ ${all.max.toFixed(4)}`);
  ok(c3.knownCalls - calls === 1, `전 시점 범위 뒤 다시 정하기: 같은 배열·성분 노드 둘에 알고 있는 범위는 한 번만 물음 (${c3.knownCalls - calls}번)`);
}

// 4. 숫자 입력 · 장면 JSON 의 범위 밖 값 · 끄는 동안
{
  const core = new FakeCore();
  const vb = new ValueBounds(core);
  const t = thrNode('t4', 'scalar:fraction', 'magnitude', 0.56, 1.56);
  const k0 = fractionAt(0); // 0번 장면 최대 ≈ 1.7 (1.56 은 안쪽)
  vb.fix('t4', valueSliderOf(t));
  const calls = core.knownCalls;
  t.params.upper = 2.5; vb.update('t4', valueSliderOf(t)); // 숫자 칸에 2.5
  ok(vb.get('t4').range.max === 2.5, `숫자 칸 Upper 2.5 (끝 ${k0.max.toFixed(3)} 밖): 끝이 2.5 까지`);
  const held = vb.get('t4');
  let shrunk = 0;
  for (const u of [2.3, 2.0, 1.7, 1.2, 1.0]) { t.params.upper = u; vb.update('t4', valueSliderOf(t)); if (vb.get('t4').range.max < 2.5) shrunk++; }
  ok(shrunk === 0 && vb.get('t4') === held, 'Upper 를 2.5 → 1.0 으로 끄는 동안 끝이 줄지 않음 (같은 객체)');
  ok(core.knownCalls === calls, `값만 바꾸면 끝을 다시 정하지 않음 (알고 있는 범위를 묻지 않음 — ${core.knownCalls - calls}번)`);
  const lowerPos = [];
  for (const u of [2.3, 1.0]) { t.params.upper = u; vb.update('t4', valueSliderOf(t)); lowerPos.push(handle(vb.sliderOf('t4', valueSliderOf(t)), t.params.lower)); }
  ok(lowerPos[0] === lowerPos[1], 'Upper 를 끄는 동안 Lower 손잡이 자리 그대로');
  // 장면 JSON: 알고 있는 최대보다 큰 Upper 로 들어옴 → 만들 때 끝이 그 값까지
  const s = thrNode('t5', 'scalar:fraction', 'magnitude', -0.5, 9);
  vb.fix('t5', valueSliderOf(s));
  ok(same(vb.get('t5').range, -0.5, 9) && vb.get('t5').decided, `장면 JSON 의 Lower -0.5 · Upper 9 (알고 있는 범위 밖): 끝 -0.5 ~ 9 (${J(vb.get('t5').range)})`);
}

// 5. Field·Component 를 바꾸면 다시 정함 (나)
{
  const core = new FakeCore();
  for (const k of [0, 1, 2]) core.goto(k);
  const vb = new ValueBounds(core);
  const t = thrNode('t6', 'scalar:fraction', 'magnitude', 0.2, 0.8);
  vb.fix('t6', valueSliderOf(t));
  const before = vb.get('t6');
  const vm = unionRanges(velAt('magnitude', 0), velAt('magnitude', 1), velAt('magnitude', 2));
  t.params.fieldKey = 'vector:velocity'; t.params.lower = vm.min; t.params.upper = vm.max; // 패널: Field 를 바꾸면 Lower·Upper 를 그 Field 범위로
  vb.update('t6', valueSliderOf(t));
  ok(vb.get('t6') !== before && same(vb.get('t6').range, vm.min, vm.max), `Field fraction → velocity: 끝을 velocity 크기의 알고 있는 범위로 (${J(vb.get('t6').range)})`);
  const vx = unionRanges(velAt('x', 0), velAt('x', 1), velAt('x', 2));
  t.params.mapping = 'x'; t.params.lower = vx.min; t.params.upper = vx.max;
  vb.update('t6', valueSliderOf(t));
  ok(same(vb.get('t6').range, vx.min, vx.max), `Component 크기 → X: 끝을 X 성분 범위로 (${J(vb.get('t6').range)})`);
  const c = { id: 'c1', type: 'clip', params: { fieldKey: 'scalar:fraction', mapping: 'magnitude', value: 0.5 } };
  vb.fix('c1', valueSliderOf(c));
  const cb = vb.get('c1');
  c.params.mapping = 'y'; vb.update('c1', valueSliderOf(c));
  ok(vb.get('c1') === cb, '스칼라 Field 의 Component 가 바뀌어도(숨은 칸) 끝 그대로');
}

// 6. 전 시점 범위 (다): 같은 배열·성분 노드만 모든 시점 범위로 · 뒤에 만든 노드도 그 범위로 시작
{
  const core = new FakeCore();
  for (let k = 0; k < 10; k++) core.goto(k); // 앞 10장면만 읽음
  const vb = new ValueBounds(core);
  const nodes = [
    thrNode('ta', 'scalar:fraction', 'magnitude', 0.3, 0.6),
    thrNode('tb', 'vector:velocity', 'x', 0, 0.1),
    isoNode('ia', 'vector:velocity', 0.2),
    { id: 'ca', type: 'clip', params: { fieldKey: 'scalar:fraction', mapping: 'magnitude', value: 0.4 } },
  ];
  for (const l of nodes) vb.fix(l.id, valueSliderOf(l));
  const tbBefore = vb.get('tb'), iaBefore = vb.get('ia');
  // 사용자가 숫자 칸에 넣어 넓힌 끝도 (다)에서는 모든 시점 범위 ∪ 지금 값으로 다시 정한다
  nodes[0].params.upper = 5; vb.update('ta', valueSliderOf(nodes[0])); nodes[0].params.upper = 0.6; vb.update('ta', valueSliderOf(nodes[0]));
  const all = unionRanges(...Array.from({ length: N }, (_, k) => fractionAt(k)));
  core.allTime.widen('scalar:fraction', 'magnitude', all.min, all.max); // AppCore: 전 시점 범위 결과를 남김
  const n = vb.refixUsers(sliderNodes(nodes), 'scalar:fraction', 'z'); // 스칼라는 성분 무시
  ok(n === 2, `fraction 전 시점 범위: fraction 을 쓰는 노드 2개(Threshold · Clip)만 다시 정함 (${n})`);
  ok(same(vb.get('ta').range, all.min, all.max) && same(vb.get('ca').range, all.min, all.max), `그 노드들의 끝 = 51장면 모두의 범위 ${all.min.toFixed(4)} ~ ${all.max.toFixed(4)} (숫자로 넓힌 5 는 지금 값이 아니라 빠짐)`);
  ok(vb.get('tb') === tbBefore && vb.get('ia') === iaBefore, '다른 배열(velocity)의 노드는 그대로');
  const later = thrNode('tc', 'scalar:fraction', 'magnitude', 0.1, 0.2);
  vb.fix('tc', valueSliderOf(later));
  ok(same(vb.get('tc').range, all.min, all.max), '전 시점 범위를 읽은 뒤 만든 노드도 그 범위로 시작');
  // 벡터: X 성분 결과는 X Threshold 만, 크기 결과는 크기 Isosurface 만
  const vxAll = unionRanges(...Array.from({ length: N }, (_, k) => velAt('x', k)));
  core.allTime.widen('vector:velocity', 'x', vxAll.min, vxAll.max);
  ok(vb.refixUsers(sliderNodes(nodes), 'vector:velocity', 'x') === 1 && same(vb.get('tb').range, vxAll.min, vxAll.max) && vb.get('ia') === iaBefore,
    `velocity X 전 시점 범위: X Threshold 만 (${J(vb.get('tb').range)}), 크기 Isosurface 는 그대로`);
  const vmAll = unionRanges(...Array.from({ length: N }, (_, k) => velAt('magnitude', k)));
  core.allTime.widen('vector:velocity', 'magnitude', vmAll.min, vmAll.max);
  ok(vb.refixUsers(sliderNodes(nodes), 'vector:velocity', 'magnitude') === 1 && same(vb.get('ia').range, vmAll.min, vmAll.max), 'velocity 크기 전 시점 범위: 크기 Isosurface 만');
  // 그 뒤 재생해도 그대로
  const r = play(core, vb, nodes, 'ta', 0.3, 1, 10);
  ok(r.changed === 0, `전 시점 범위 뒤 한 바퀴: 끝 ${r.changed}번 바뀜`);
}

// 7. 미정 끝을 정하지 못하면 임시 끝을 지킴 · Field 가 없으면 미정 · 정한 뒤로는 다시 보지 않음
{
  const core = new FakeCore();
  const vb = new ValueBounds(core);
  const iso = isoNode('i2', 'vector:velocity', 0);
  vb.fix('i2', valueSliderOf(iso));
  iso.params.value = 3; vb.update('i2', valueSliderOf(iso)); // 미정인 동안 숫자 칸에 3
  iso.params.value = 0.5; vb.update('i2', valueSliderOf(iso)); // 그 뒤 0.5 로 끌어 내림
  ok(same(vb.get('i2').range, 0, 3) && !vb.get('i2').decided, '미정인 동안 숫자로 넓힌 임시 끝 0~3 은 끌어도 줄지 않음');
  // 지금 장면은 값이 다르지만 알고 있는 범위 판단으로는 모두 같다고 보는 경우(하한이 큰 경우) — 임시 끝을 버리지 않는다
  const strict = new ValueBounds({ now: (f, m) => core.now(f, m), known: (f, m) => ({ ...core.known(f, m), floor: 1e9 }) });
  strict.fix('i2', valueSliderOf(iso)); iso.params.value = 3; strict.update('i2', valueSliderOf(iso)); iso.params.value = 0.5; strict.update('i2', valueSliderOf(iso));
  core.goto(1);
  ok(strict.settle(sliderNodes([iso])) === 0 && same(strict.get('i2').range, 0, 3), 'settle 이 정하지 못하면(알고 있는 범위도 모두 같음) 임시 끝 0~3 그대로');
  ok(vb.settle(sliderNodes([iso])) === 1 && vb.get('i2').decided, '보통은 1번 장면에서 정함');
  const decided = vb.get('i2');
  core.goto(30);
  ok(vb.settle(sliderNodes([iso])) === 0 && vb.get('i2') === decided, '정한 끝은 뒤 장면에서 다시 보지 않음');
  // Field 가 데이터에 없음
  core.missing.add('scalar:fraction');
  const t = thrNode('t7', 'scalar:fraction', 'magnitude', 0.2, 0.4);
  vb.fix('t7', valueSliderOf(t));
  ok(!vb.get('t7').decided && same(vb.get('t7').range, 0.2, 0.4), 'Field 가 데이터에 없으면 미정 · 임시 끝은 값만으로 0.2~0.4');
  core.goto(31);
  ok(vb.settle(sliderNodes([t])) === 0, 'Field 가 없는 동안은 정하지 않음');
}

// 8. 지우기 · 비우기 · 만들 때 정하지 못한 노드
{
  const core = new FakeCore();
  const vb = new ValueBounds(core);
  const t = thrNode('t8', 'scalar:fraction', 'magnitude', 0.2, 0.4);
  const b = vb.sliderOf('t8', valueSliderOf(t));
  ok(vb.get('t8') && vb.get('t8').decided && b.max >= 0.4, '끝이 없는 노드를 물으면 그 자리에서 정함 (만들 때 정하지 못한 길 — 있으면 안 됨)');
  t.params.fieldKey = 'vector:velocity';
  vb.sliderOf('t8', valueSliderOf(t));
  ok(vb.get('t8').key === sliderKeyOf({ fieldKey: 'vector:velocity', mapping: 'magnitude' }), 'update 를 거치지 않고 Field 가 바뀐 노드도 물을 때 그 Field 로 정함');
  vb.delete('t8');
  ok(vb.get('t8') === null, '노드를 지우면 끝도 지움');
  vb.fix('t9', valueSliderOf(t));
  vb.clear();
  ok(vb.get('t9') === null, '데이터를 새로 열면 비움');
  const s = new RangeStore();
  s.widen('scalar:p', 'x', 1, 2); s.widen('scalar:p', 'magnitude', 0, 1.5);
  ok(same(s.get('scalar:p', 'y'), 0, 2), '전 시점 범위 모음: 스칼라는 성분 무시하고 합침 0~2');
  s.widen('vector:v', 'magnitude', 3, -Infinity);
  ok(same(s.get('vector:v', 'magnitude'), 3, 3), '유한한 끝만 (한쪽이 -Infinity 면 다른 끝만)');
  // 성분 X 로 전 시점 범위를 읽음: X 범위와 크기 최대(하한용)는 남기되 크기 쪽 범위에는 넣지 않는다(검토 반영 — 뒤에 만드는 크기 노드의 끝이 넓어지지 않게)
  s.widen('vector:w', 'x', -0.5, 1.0); s.noteMagMax('vector:w', 1.2); s.noteMagMax('vector:w', 0.9); s.noteMagMax('vector:w', -Infinity);
  ok(s.get('vector:w', 'magnitude') === null && s.magMax('vector:w') === 1.2 && same(s.get('vector:w', 'x'), -0.5, 1.0), `성분 결과: 크기 쪽 범위 없음 · 크기 최대 ${s.magMax('vector:w')}(더 큰 값만 · 유한한 값만) · X 범위 -0.5~1`);
  const cm = new FakeCore(); cm.allTime = s;
  const vbm = new ValueBounds(cm);
  vbm.fix('tm', valueSliderOf(thrNode('tm', 'vector:w', 'magnitude', 0, 0.01)));
  ok(same(vbm.get('tm').range, 0, 0.01), `그 뒤 만든 크기 Threshold: 끝은 값만(0~0.01 — 크기 최대 1.2 까지 넓어지지 않음) (${J(vbm.get('tm').range)})`);
  ok(s.magMax('nope') === -Infinity, '남긴 것이 없으면 -Infinity');
  s.clear();
  ok(s.get('scalar:p', 'x') === null && s.magMax('vector:w') === -Infinity, '전 시점 범위 모음 비우기 (크기 최대도)');
}

// ---- 숫자 칸 글자 (dom.ts parseNumberText — 잘못된 글자는 받지 않음) ----
{
  const good = [['1.5', 1.5], ['-2e-3', -0.002], ['.5', 0.5], ['5.', 5], [' 3 ', 3], ['+1', 1], ['1.2E+5', 120000], ['0', 0]];
  const bad = ['', ' ', 'abc', '0x10', 'Infinity', '-Infinity', 'NaN', '1,5', '1.2.3', 'e5', '1e', '--1', '1 2'];
  ok(good.every(([s, v]) => parseNumberText(s) === v), `받는 글자: ${good.map(([s]) => J(s)).join(' ')}`);
  ok(bad.every((s) => Number.isNaN(parseNumberText(s))), `받지 않는 글자(되돌림): ${bad.map((s) => J(s)).join(' ')}`);
}

console.log(fail ? `\n실패 ${fail} · 통과 ${pass}` : `\n모두 통과 (${pass})`);
process.exit(fail ? 1 : 0);

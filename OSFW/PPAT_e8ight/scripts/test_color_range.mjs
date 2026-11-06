#!/usr/bin/env node
// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   test_color_range.mjs

색 지도 범위 규칙의 Node 시험 — src/core/colorRange.ts(값이 모두 같은 장면 · 처음 정하기 · 넓히기 · 상태 줄 · 전 시점 범위 결과)와
src/data/rangeScan.ts(minMaxMapped — 전 시점 범위의 최소~최대). esbuild 로 메모리에서 묶어(파일을 쓰지 않음) data: 주소로 불러 쓴다.
확인: '모두 같음' 기준(측정한 결과 값들) · 직접 넣은 한 점 범위는 최소 그대로 최대만 올림 · 합·처음 정하기·넓히기(모두 같은 값은 넓히는 데 안 씀) ·
한 다시 계산 차례 안에서 노드 순서를 바꿔도 처음 범위가 같음(순열) · '모두 0' 글 · 상태 줄(정함·넓힘·Rescale·전 시점·장면 파일의 값·사용자 지정·시간축 없음·없는 저장 번호) ·
장면 JSON 의 근거 확인 · 한꺼번에 읽는 시점 수 · 전 시점 결과(모두 읽음·일부·하나도 못 읽음·모두 같음) · 늦게 끝난 작업은 적용 안 함 ·
minMaxMapped 의 NaN·무한 건너뛰기·남긴 셀·가림 mask·화면 값(vectorFieldFromInterleaved + computeStats)과 비트까지 같음.
검토 반영(2026-11-05): 값이 거의 같은 장면의 임시 범위 = 화면 한 색 · 범례 막대 색 = 화면 색(float32 셰이더 흉내, 구간 칠하기 2~31) · '모두 약 c' 숫자는 [최소, 최대] 안 ·
Range 한 칸 입력 · Rescale 단추 결과 · 처음 범위 합에 넣을 노드 · 임시 범위가 바뀔 때 다시 칠할 노드 · 멈춤 안내는 자동으로 정해져도 남음.
결정(2026-11-05, 15번): (가) 벡터 성분의 0 근처 잡음 = '모두 약 0'(componentFlatFloor — 자동 정하기 · 넓히기 · Rescale · 전 시점 범위,
minMaxMapped 의 magMax. 한쪽 부호뿐인 잡음도 flatNearZero) · (나) 옛 장면 파일의 '모두 같음' 폭 범위는 미정으로(isLegacyFlatSaved — 옛 넓힘의 꼴만.
근거 있음 · 사용자 지정 · 진짜 범위 · 옛 넓힘 폭보다 좁은 범위는 그대로) · (다) 넓히기에서 모두 같은 장면 값 빼기 유지.

실행: node scripts/test_color_range.mjs
*/
/******************************************************************************/

import { build } from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const res = await build({
  stdin: { contents: "export * from './src/core/colorRange'; export * from './src/data/rangeScan'; export { vectorFieldFromInterleaved, computeStats } from './src/data/pointDataset';", resolveDir: ROOT, loader: 'ts' },
  bundle: true, platform: 'neutral', format: 'esm', target: 'es2022', write: false, logLevel: 'silent',
});
const M = await import(`data:text/javascript;base64,${Buffer.from(res.outputFiles[0].text).toString('base64')}`);
const {
  isFlatRange, widenColorRange, unionRanges, freshDecision, growDecision, rebuildDecision, fmtFlatValue, flatShownValue, parseRangeBasis,
  rangeStateText, scanConcurrency, scanOutcome, scanApplies, scanProgressText, minMaxMapped, vectorFieldFromInterleaved, computeStats,
  FLAT_PAINT_T, paintRangeForFlat, flatBarT, joinsFirstRange, repaintsOnRangeChange, fillOneSided, rescaleDecision, noteAfterAutoRange, NO_NOTE,
  FLOAT32_EPS, componentFlatFloor, isLegacyFlatSaved, flatNearZero,
} = M;

let fail = 0, pass = 0;
const ok = (cond, name, extra = '') => { if (cond) { pass++; console.log(`PASS ${name}`); } else { fail++; console.log(`FAIL ${name} ${extra}`); } };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ---------- 1. '모두 같음' (폭 < 값 크기 × 1e-4, 값이 0 이면 1e-12) ----------
ok(isFlatRange(0, 0), '[0,0] 모두 같음 (유체-입자 t = 0 속도)');
ok(!isFlatRange(0, 2e-12), '[0,2e-12] 같지 않음');
ok(!isFlatRange(0, 1e-13), '[0,1e-13] 같지 않음 (상대 기준 — 값 크기가 곧 폭. widenRange 와 같은 기준)');
ok(isFlatRange(0.5, 0.5000031), '[0.5,0.5000031] 모두 같음 (농도확산 velocity Y 성분)');
ok(!isFlatRange(0.5, 0.7071), '[0.5,0.7071] 같지 않음 (농도확산 1번 velocity 크기)');
ok(isFlatRange(101325, 101325), '[101325,101325] 모두 같음 (농도확산 t = 0 pressure)');
ok(!isFlatRange(-0.00146, -0.00143), '[-0.00146,-0.00143] 같지 않음 (상대 폭 2 %)');
ok(!isFlatRange(-5.6e-15, 5.6e-16), '[-5.6e-15,5.6e-16] 하한 없이는 같지 않음 (상대 기준 — 다상 Z 성분 잡음은 성분 하한으로 모두 같음, 15번)');
ok(isFlatRange(0.9999563, 0.9999572), '[0.9999563,0.9999572] 모두 같음 (농도확산 density — 끝까지 미정)');
ok(isFlatRange(1, 1.00005) && !isFlatRange(1, 1.0002), '[1,1.00005] 같음 · [1,1.0002] 다름');
ok(isFlatRange(5, 5) && isFlatRange(-1, -1), '0 이 아닌 한 점');
ok(!isFlatRange(NaN, 1) && !isFlatRange(0, Infinity), 'NaN·무한이 섞이면 판단하지 않음(거짓)');

// ---------- 2. 직접 넣은 범위의 최소 폭 ----------
ok(same(widenColorRange(0, 0), [0, 1e-12]), `[0,0] → [0,1e-12] ${JSON.stringify(widenColorRange(0, 0))}`);
{ const r = widenColorRange(1, 1); ok(r[0] === 1 && Math.abs(r[1] - 1.0001) < 1e-15, `[1,1] → [1,1.0001] ${JSON.stringify(r)}`); }
{ const r = widenColorRange(-1, -1); ok(r[0] === -1 && Math.abs(r[1] + 0.9999) < 1e-15, `[-1,-1] → [-1,-0.9999] (최소 그대로, 음수 쪽으로 안 감) ${JSON.stringify(r)}`); }
ok(same(widenColorRange(0, 1.9), [0, 1.9]), '넓은 범위 그대로');
ok(same(widenColorRange(3, 1), [1, 3]), '거꾸로 들어오면 바꿈');
ok(same(widenColorRange(NaN, 1), [0, 1]) && same(widenColorRange(0, Infinity), [0, 1]), 'NaN·무한 → [0,1]');

// ---------- 3. 합 · 처음 정하기 · 넓히기 ----------
ok(same(unionRanges([null, [0, 1], undefined, [-2, 0.5]]), [-2, 1]) && unionRanges([null]) === null, 'unionRanges (null 건너뜀, 없으면 null)');
ok(freshDecision(null).kind === 'wait', '그린 값 없음 → wait');
ok(same(freshDecision([0, 0]), { kind: 'flat', range: [0, 0] }), '[0,0] → flat (정하지 않음)');
ok(same(freshDecision(unionRanges([[0, 0], [5, 5]])), { kind: 'set', range: [0, 5] }), '[0,0] ∪ [5,5] → set [0,5] (노드 둘이 각각 한 점이면 합쳐 판단)');
ok(same(growDecision([0, 1.5], [0, 2]), [0, 2]), '넓히기 [0,1.5] + [0,2] → [0,2]');
ok(growDecision([0, 1.5], [0.2, 1]) === null, '안쪽이면 그대로(줄이지 않음)');
ok(growDecision([-0.00146, -0.00143], [101325, 101325]) === null, '모두 같은 값(농도확산 t = 0 pressure)은 넓히는 데 안 씀');
ok(growDecision([0, 1], null) === null, '값 없음 → 넓히지 않음');

// rebuildDecision — 지도 하나의 상태 기계
const view = (o = {}) => ({ fresh: true, min: 0, max: 1, settledThisPass: false, growPending: false, autoGrow: true, ...o });
{
  const a = rebuildDecision(view(), [0, 0], []);
  ok(a.kind === 'flat' && same(a.flat, [0, 0]) && a.paint[0] < 0 && a.paint[1] > 0 && Math.abs((0 - a.paint[0]) / (a.paint[1] - a.paint[0]) - FLAT_PAINT_T) < 1e-9, `미정 + 모두 0 → flat, 칠하기 범위에서 0 은 가운데 색 자리(${FLAT_PAINT_T}) ${JSON.stringify(a)}`);
  ok(rebuildDecision(view(), null, []).kind === 'wait', '미정 + 값 없음 → wait');
  ok(same(rebuildDecision(view(), [0, 0.038], []), { kind: 'set', range: [0, 0.038] }), '미정 + 값이 다름 → set (1번 장면에서 한 번 정함)');
  ok(same(rebuildDecision(view(), [0, 0], [[0, 0.5]]), { kind: 'set', range: [0, 0.5] }), '이 노드가 모두 0 이어도 이미 계산된 다른 노드가 다르면 set');
  ok(rebuildDecision(view({ fresh: false, min: 0, max: 0.038 }), [0, 1.9], []).kind === 'none', '정해진 지도 + 저장 시점 넘김(growPending 아님) → 그대로');
  ok(same(rebuildDecision(view({ fresh: false, min: 0, max: 0.038, growPending: true }), [0, 1.9], []), { kind: 'grow', range: [0, 1.9] }), '노드를 만들거나 바꿈(growPending) + 자동 넓히기 → grow');
  ok(rebuildDecision(view({ fresh: false, min: 0, max: 0.038, growPending: true, autoGrow: false }), [0, 1.9], []).kind === 'none', '자동 넓히기 끔 → 그대로');
  ok(rebuildDecision(view({ fresh: false, min: -0.00146, max: -0.00143, growPending: true }), [101325, 101325], []).kind === 'none', 'growPending 이어도 모두 같은 값은 넓히지 않음');
  ok(same(rebuildDecision(view({ fresh: false, min: 0, max: 0.5, settledThisPass: true }), [5, 5], []), { kind: 'widen', range: [0, 5] }), '같은 차례에서 막 정해짐 → 모두 같은 값도 합에 넣어 넓힘(순서 무관을 위해)');
}

// M3: 한 다시 계산 차례 안에서 노드 순서를 바꿔도 처음 범위가 같다 (AppCore.colorForRebuild 흉내 — others = 이 차례에 앞서 계산된 노드)
function runPass(order, ranges) {
  const s = { fresh: true, min: 0, max: 1, settledPass: -1, flat: null };
  const PASS = 7;
  const computed = [];
  for (const u of order) {
    const act = rebuildDecision({ fresh: s.fresh, min: s.min, max: s.max, settledThisPass: s.settledPass === PASS, growPending: false, autoGrow: true }, ranges[u], computed.map((c) => ranges[c]));
    if (act.kind === 'wait') s.flat = null;
    else if (act.kind === 'flat') { s.flat = act.flat; [s.min, s.max] = act.paint; }
    else if (act.kind === 'set') { s.fresh = false; s.settledPass = PASS; s.flat = null; [s.min, s.max] = widenColorRange(...act.range); }
    else if (act.kind === 'widen' || act.kind === 'grow') [s.min, s.max] = widenColorRange(...act.range);
    computed.push(u);
  }
  return s;
}
const perms = (a) => (a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p])));
for (const [name, ranges, want] of [
  ['Slice 1 0~0.03 · Slice 2 0~0.5 · Glyph 모두 0', { A: [0, 0.03], B: [0, 0.5], C: [0, 0] }, [0, 0.5]],
  ['모두 같은 값(5)이 범위 밖', { A: [0, 0.03], B: [0, 0.5], C: [5, 5] }, [0, 5]],
  ['둘이 모두 같고 하나만 다름', { A: [1, 1], B: [1, 1], C: [0.2, 0.9] }, [0.2, 1]],
  ['값 없는 노드 섞임', { A: null, B: [0, 0.5], C: [0.1, 0.7] }, [0, 0.7]],
]) {
  const outs = perms(Object.keys(ranges)).map((o) => runPass(o, ranges));
  ok(outs.every((s) => !s.fresh && same([s.min, s.max], want)), `순서 6가지 모두 같은 처음 범위 — ${name} → ${JSON.stringify(want)}`, JSON.stringify(outs.map((s) => [s.fresh, s.min, s.max])));
}
{
  const outs = perms(['A', 'B']).map((o) => runPass(o, { A: [0, 0], B: [0, 0] }));
  ok(outs.every((s) => s.fresh && same(s.flat, [0, 0])), '모두 0 둘 → 순서와 무관하게 미정 · 모두 0');
}

// ---------- 4. '모두 c' 글 ----------
ok(fmtFlatValue(0, 0) === '0' && fmtFlatValue(-0, 0) === '0', "(0,0) → '0'");
ok(fmtFlatValue(101325, 101325) === '101325', "(101325,101325) → '101325'");
ok(fmtFlatValue(0.5, 0.5000031) === '약 0.5', `(0.5,0.5000031) → '약 0.5' (${fmtFlatValue(0.5, 0.5000031)})`);
ok(fmtFlatValue(0.9999563, 0.9999572) === '약 0.999957', `농도확산 density → '약 0.999957' (반올림한 '1' 은 실제 값 범위 밖이라 자릿수를 늘림 — ${fmtFlatValue(0.9999563, 0.9999572)})`);
{
  const v = flatShownValue(101320, 101330);
  ok(v >= 101320 && v <= 101330 && fmtFlatValue(101320, 101330) === `약 ${v}`, `큰 기준값(101320 ~ 101330) → '약 ${v}' — [최소, 최대] 안 (유효숫자 4자리 101300 이 아님)`);
  const w = flatShownValue(-0.0014600, -0.00145995);
  ok(w >= -0.00146 && w <= -0.00145995, `음수 거의 같음 → ${w} 도 [최소, 최대] 안`);
}
ok(flatShownValue(0.1 + 0.2, 0.1 + 0.2) === 0.3, '부동소수 찌꺼기는 걷음 (칸에 넣는 숫자)');

// ---------- 5. 상태 줄 ----------
const labels = { grow: '자동(넓히기)', data: '데이터 범위', custom: '사용자 지정', alltime: '전 시점 범위', visible: '보이는 범위' };
const stepOf = (n) => (n <= 50 ? `t = ${Number((n * 0.004).toPrecision(6))}` : null);
const st = (o) => rangeStateText({ fresh: false, mode: 'grow', modeLabel: labels[o.mode ?? 'grow'], flat: null, unit: 'm/s', stepLabelOf: stepOf, stepCount: 51, ...o });
const eqs = (got, want, name) => ok(got === want, `${name}: ${got}`, `(기대 ${want})`);
eqs(st({ fresh: true }), '범위: 아직 정하지 않음', '미정 · 그린 값 없음');
eqs(st({ fresh: true, flat: [0, 0] }), '범위: 아직 정하지 않음 · 지금 값은 모두 0 · 단위 m/s', '미정 · 모두 0');
eqs(st({ fresh: true, flat: [0.5, 0.5000031] }), '범위: 아직 정하지 않음 · 지금 값은 모두 약 0.5 · 단위 m/s', '미정 · 거의 같음');
eqs(st({ basis: { kind: 'first', n: 1 } }), '범위 기준: 자동 · t = 0.004 값으로 정함 · 단위 m/s', '자동으로 처음 정함');
eqs(st({ basis: { kind: 'grow', n: 25 } }), '범위 기준: 자동(넓히기) · t = 0.1 값으로 넓힘 · 단위 m/s', '노드를 바꿔 넓힘');
eqs(st({ mode: 'data', basis: { kind: 'data', n: 50 } }), '범위 기준: 데이터 범위 · t = 0.2 값 · 단위 m/s', '데이터 범위');
eqs(st({ mode: 'visible', basis: { kind: 'visible', n: 0 } }), '범위 기준: 보이는 범위 · t = 0 값 · 단위 m/s', '보이는 범위');
eqs(st({ mode: 'alltime', basis: { kind: 'alltime', total: 51, used: 51 } }), '범위 기준: 전 시점 범위 · 저장 시점 51개 모두 · 단위 m/s', '전 시점 범위 · 모두');
eqs(st({ mode: 'alltime', basis: { kind: 'alltime', total: 51, used: 49 } }), '범위 기준: 전 시점 범위 · 저장 시점 51개 가운데 49개 · 단위 m/s', '전 시점 범위 · 일부');
eqs(st({ mode: 'alltime' }), '범위 기준: 전 시점 범위 · 장면 파일의 값 · 단위 m/s', '옛 장면의 전 시점 범위(근거 없음)');
eqs(st({ mode: 'alltime', basis: { kind: 'alltime', total: 10, used: 10 } }), '범위 기준: 전 시점 범위 · 장면 파일의 값 · 단위 m/s', '다른 데이터에서 저장한 전 시점 범위(저장 시점 수 다름)');
eqs(st({ mode: 'alltime', basis: { kind: 'alltime', total: 1, used: 1 }, stepCount: 0 }), '범위 기준: 전 시점 범위 · 저장 시점 1개 모두 · 단위 m/s', '시간축 없는 데이터의 전 시점 범위');
eqs(st({ mode: 'custom' }), '범위 기준: 사용자 지정 · 단위 m/s', '사용자 지정');
eqs(st({ basis: { kind: 'first', n: null }, unit: '' }), '범위 기준: 자동', '시간축 없음 · 단위 없음');
eqs(st({ basis: { kind: 'first', n: 70 } }), '범위 기준: 자동 · 저장 70 값으로 정함 · 단위 m/s', '지금 데이터에 없는 저장 번호');
eqs(st({ mode: 'grow' }), '범위 기준: 자동(넓히기) · 단위 m/s', '옛 장면(근거 없음)');
eqs(st({ mode: 'custom', basis: { kind: 'first', n: 1 } }), '범위 기준: 사용자 지정 · 단위 m/s', '기준과 안 맞는 근거는 쓰지 않음');

// ---------- 6. 장면 JSON 의 근거 ----------
ok(same(parseRangeBasis({ kind: 'first', n: 3 }, 'grow'), { kind: 'first', n: 3 }), '근거 first 읽음');
ok(same(parseRangeBasis({ kind: 'alltime', total: 51, used: 49 }, 'alltime'), { kind: 'alltime', total: 51, used: 49 }), '근거 alltime 읽음');
ok(same(parseRangeBasis({ kind: 'data', n: null }, 'data'), { kind: 'data', n: null }), 'n 이 null 이면 시간축 없음');
ok(parseRangeBasis({ kind: 'weird', n: 1 }) === undefined, '모르는 종류 → 버림');
ok(parseRangeBasis({ kind: 'first', n: '3' }) === undefined && parseRangeBasis({ kind: 'grow', n: -1 }) === undefined && parseRangeBasis({ kind: 'grow', n: 1.5 }) === undefined, '숫자 아님·음수·소수 → 버림');
ok(parseRangeBasis({ kind: 'alltime', total: 5, used: 6 }) === undefined && parseRangeBasis({ kind: 'alltime', total: 0, used: 0 }) === undefined, 'used > total · 0 → 버림');
ok(parseRangeBasis({ kind: 'data', n: 1 }, 'grow') === undefined, '범위 기준과 안 맞으면 버림');
ok(parseRangeBasis(null) === undefined && parseRangeBasis('x') === undefined, '객체 아님 → 버림');

// ---------- 7. 한꺼번에 읽는 시점 수 ----------
ok(scanConcurrency(1.19e6) === 4 && scanConcurrency(40e6) === 3 && scanConcurrency(240e6) === 1 && scanConcurrency(0) === 4, `시점당 1.19 MB → 4 · 40 MB → 3 · 240 MB → 1 · 모름 → 4`);

// ---------- 8. 전 시점 결과 ----------
const lab = (n) => `t = ${Number((n * 0.004).toPrecision(6))}`;
{
  const o = scanOutcome({ min: 0, max: 1.9150196, used: 51, total: 51, failed: [] }, lab);
  ok(o.apply && same(o.range, [0, 1.9150196]) && same(o.basis, { kind: 'alltime', total: 51, used: 51 }) && o.note === '', '모두 읽음 → 적용, 안내 없음');
}
{
  const o = scanOutcome({ min: 0, max: 1.5, used: 49, total: 51, failed: [{ n: 12, reason: '블록 파일이 없습니다: x' }, { n: 7, reason: '셀 수가 다릅니다' }] }, lab);
  ok(o.apply && same(o.basis, { kind: 'alltime', total: 51, used: 49 }) && o.note === '저장 시점 51개 가운데 49개로 계산했습니다. 못 읽은 시점: t = 0.028, t = 0.048 (셀 수가 다릅니다)', `일부 못 읽음 → 적용 + 안내 (${o.note})`);
}
{
  const failed = [1, 2, 3, 4, 5].map((n) => ({ n, reason: '파일이 없습니다' }));
  const o = scanOutcome({ min: 0, max: 1, used: 46, total: 51, failed }, lab);
  ok(o.note.includes('t = 0.004, t = 0.008, t = 0.012 외 2개 (파일이 없습니다)'), `못 읽은 시점은 3개까지 + '외 n개' (${o.note})`);
}
{
  const o = scanOutcome({ min: Infinity, max: -Infinity, used: 0, total: 5, failed: [{ n: 0, reason: '시험: 읽기 실패' }] }, lab);
  ok(!o.apply && o.note === '저장 시점을 하나도 읽지 못해 범위를 바꾸지 않았습니다. 시험: 읽기 실패', `하나도 못 읽음 → 적용 안 함 (${o.note})`);
}
{
  const o = scanOutcome({ min: 0, max: 0, used: 51, total: 51, failed: [] }, lab);
  ok(!o.apply && o.note === '범위를 바꾸지 않았습니다: 모든 저장 시점에서 값이 모두 0 입니다.', `모든 시점에서 모두 같음(유체-입자 wall_normal 같은 배열) → 적용 안 함 (${o.note})`);
  const o2 = scanOutcome({ min: 0.5, max: 0.5000031, used: 4, total: 5, failed: [{ n: 2, reason: 'x' }] }, lab);
  ok(!o2.apply && o2.note.startsWith('범위를 바꾸지 않았습니다: 읽은 저장 시점 4개(전체 5개)에서 값이 모두 약 0.5 입니다. 못 읽은 시점: t = 0.008'), `모두 같음 + 못 읽은 시점 (${o2.note})`);
}
ok(scanProgressText(12, 51, 0) === '전 시점 범위 읽는 중 12 / 51' && scanProgressText(12, 51, 1) === '전 시점 범위 읽는 중 12 / 51 · 1개 못 읽음', '진행 글');
ok(scanProgressText(3, 5, 0, true).endsWith('서버가 부분 읽기를 받지 않아 파일 전체를 받는 중'), '진행 글 — 서버가 바이트 범위를 받지 않음');

// ---------- 9. 늦게 끝난 작업 (M1) ----------
{
  // 흉내: 작업 A 시작 → 마지막 읽기를 기다리는 사이 [취소] → 그 뒤 A 의 읽기가 끝나 결과가 옴(읽기 함수의 aborted 칸은 아직 거짓일 수 있음)
  let current = null;
  const start = () => { const job = { ctrl: new AbortController() }; current = job; return job; };
  const cancel = () => { current?.ctrl.abort(); current = null; };
  const A = start();
  cancel();
  ok(!scanApplies({ current: current === A, aborted: A.ctrl.signal.aborted, reachable: true, sameMapping: true }), '[취소] 뒤 늦게 도착한 결과 → 적용 안 함');
  const B = start(); // [취소] 뒤 같은 지도에서 다시 누름
  ok(!scanApplies({ current: current === A, aborted: false, reachable: true, sameMapping: true }), '다시 누른 뒤 앞 작업의 결과 → 적용 안 함 (지금 작업이 아님)');
  ok(scanApplies({ current: current === B, aborted: B.ctrl.signal.aborted, reachable: true, sameMapping: true }), '지금 작업의 결과 → 적용');
  ok(!scanApplies({ current: true, aborted: false, reachable: false, sameMapping: true }), '지도에 닿을 수 없음(Separate 끔·주인 노드 지움) → 적용 안 함');
  ok(!scanApplies({ current: true, aborted: false, reachable: true, sameMapping: false }), '성분이 바뀜 → 적용 안 함');
}

// ---------- 10. minMaxMapped ----------
{
  const d = new Float64Array([1, NaN, -2, Infinity, 3, -Infinity]);
  const r = minMaxMapped(d, 1, 'magnitude', null, null);
  ok(r.min === -2 && r.max === 3 && r.count === 3, `스칼라: NaN·±무한 건너뜀 ${JSON.stringify(r)}`);
  const r2 = minMaxMapped(d, 1, 'magnitude', new Int32Array([0, 2, 4]), new Uint8Array([1, 0, 1]));
  ok(r2.min === 1 && r2.max === 3 && r2.count === 2, `남긴 셀(kept) + 가림(mask, kept 순서) ${JSON.stringify(r2)}`);
  const r3 = minMaxMapped(d, 1, 'magnitude', new Int32Array([0, 9]), null);
  ok(r3.count === 1 && r3.min === 1, '배열 밖 셀 번호는 건너뜀');
  const r4 = minMaxMapped(new Float32Array(0), 3, 'magnitude', null, null);
  ok(r4.count === 0 && r4.min === Infinity && r4.max === -Infinity, '빈 배열 → count 0');
}
{
  // 무작위 Float64 벡터: 화면 경로(asFloat32 = Float32Array.from → vectorFieldFromInterleaved → computeStats)와 최소·최대가 비트까지 같다
  let seed = 12345;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const N = 5000;
  const d = new Float64Array(N * 3);
  for (let i = 0; i < d.length; i++) d[i] = (rnd() - 0.4) * 3.7 + (i % 7 === 0 ? 1e-9 * rnd() : 0);
  const kept = Int32Array.from({ length: 4000 }, (_, i) => i + Math.floor(i / 4));
  const mask = Uint8Array.from({ length: kept.length }, (_, i) => (i % 9 === 4 ? 0 : 1));
  const f32 = Float32Array.from(d);
  const used = [];
  for (let i = 0; i < kept.length; i++) if (mask[i]) used.push(kept[i]);
  const v = new Float32Array(used.length * 3);
  used.forEach((c, i) => { v[i * 3] = f32[c * 3]; v[i * 3 + 1] = f32[c * 3 + 1]; v[i * 3 + 2] = f32[c * 3 + 2]; });
  const ref = vectorFieldFromInterleaved('v', ['x', 'y', 'z'], v).stats;
  for (const m of ['magnitude', 'x', 'y', 'z']) {
    const r = minMaxMapped(d, 3, m, kept, mask);
    ok(r.min === ref[m].min && r.max === ref[m].max && r.count === used.length, `벡터 ${m}: 화면 값과 비트까지 같음 (${r.min} ~ ${r.max})`, `기대 ${ref[m].min} ~ ${ref[m].max}`);
  }
  const s = Float64Array.from({ length: N }, () => (rnd() - 0.5) * 1e5);
  const sref = computeStats(Float32Array.from(s));
  const sr = minMaxMapped(s, 1, 'magnitude', null, null);
  ok(sr.min === sref.min && sr.max === sref.max, `스칼라 Float64: 화면 값과 비트까지 같음 (${sr.min} ~ ${sr.max})`);
}

// ---------- 11. 값이 거의 같은 장면: 임시 범위 · 범례 막대 = 화면 색 (검토 반영) ----------
{
  const fr = Math.fround;
  /** Slice 셰이더(sliceRenderer.ts) 흉내: 값·범위는 float32 uniform/attribute, 폭은 1e-12 아래로 보지 않음, 구간 칠하기 */
  const shaderT = (v, min, max, bands) => {
    let t = fr(fr(fr(v) - fr(min)) / Math.max(fr(fr(max) - fr(min)), 1e-12));
    t = Math.min(1, Math.max(0, t));
    if (bands > 0) t = (Math.min(bands - 1, Math.floor(t * bands)) + 0.5) / bands;
    return t;
  };
  // 검토가 잰 농도확산 density 다섯 장면(저장소 TimeSeries.scanRange) + 큰 기준값 · 0 · 아주 작은 값 · 음수
  const cases = [
    ['density n0', 1, 1], ['density n1', 0.9999563097953796, 0.9999572038650513], ['density n2', 0.9999143481254578, 0.9999153017997742],
    ['density n3', 0.9998724460601807, 0.9998733401298523], ['density n4', 0.9998304843902588, 0.9998313784599304],
    ['절대압 101320 ~ 101330', 101320, 101330], ['모두 0', 0, 0], ['아주 작은 값 5e-13', 5e-13, 5e-13], ['음수 거의 같음', -0.00146, -0.00145995],
  ];
  for (const [name, lo, hi] of cases) {
    ok(isFlatRange(lo, hi), `${name}: 모두 같음으로 봄`);
    const [a, b] = paintRangeForFlat(lo, hi);
    let worst = 0, mismatch = 0;
    for (const bands of [0, 2, 3, 4, 8, 9, 11, 30, 31]) {
      const bar = flatBarT([lo, hi], a, b, bands);
      for (let k = 0; k <= 50; k++) {
        const t = shaderT(lo + ((hi - lo) * k) / 50, a, b, bands);
        if (bands === 0) worst = Math.max(worst, Math.abs(t - FLAT_PAINT_T));
        else if (t !== bar) mismatch++;
      }
    }
    ok(worst < 0.002 && mismatch === 0, `${name}: 화면 값이 모두 가운데 색 자리 ±${worst.toFixed(5)} · 범례 막대와 같은 구간 (구간 2~31, 어긋남 ${mismatch})`);
  }
  ok(flatBarT([0, 0], ...paintRangeForFlat(0, 0), 8) === 0.5625 && Math.abs(flatBarT([0, 0], ...paintRangeForFlat(0, 0)) - FLAT_PAINT_T) < 1e-9,
    '모두 0 · 구간 8 → 범례 막대 0.5625 (Slice 셰이더와 같은 구간), 구간 없음 → 가운데 색 자리');
  // 옛 식(가운데 기준 widenRange + 반올림한 표시값)으로는 장면마다 범례 막대 색이 0.19 ~ 0.93 으로 흔들렸다 — 이제 모든 장면이 같은 자리
  const bars = cases.slice(0, 5).map(([, lo, hi]) => flatBarT([lo, hi], ...paintRangeForFlat(lo, hi)));
  ok(bars.every((t) => Math.abs(t - FLAT_PAINT_T) < 1e-6), `농도확산 density 재생: 범례 막대 자리가 장면마다 같음 (${bars.map((t) => t.toFixed(4)).join(' · ')})`);
}

// ---------- 12. Range 한 칸 입력 · Rescale 단추 결과 (검토 반영) ----------
{
  ok(same(fillOneSided({ rangeMax: 2 }, null), { rangeMin: 2, rangeMax: 2 }), '미정 · 그린 값 없음(칸 비어 있음) · 최대만 2 → 최소도 2 (숨은 임시 값 -5e-13 이 아님)');
  ok(same(widenColorRange(...Object.values(fillOneSided({ rangeMax: 2 }, null))), [2, 2.0002]), '  → 사용자 지정 범위 2 ~ 2.0002');
  ok(same(fillOneSided({ rangeMin: 5 }, null), { rangeMin: 5, rangeMax: 5 }), '기본 지도(0 ~ 1, 아직 안 칠함)에 최소만 5 → 5 ~ 5 (숨은 최대 1 과 자리가 바뀌어 1 ~ 5 가 되지 않음)');
  ok(same(fillOneSided({ rangeMax: 2 }, [0, 0]), { rangeMin: 0, rangeMax: 2 }), '모두 0 · 최대만 2 → 0 ~ 2');
  ok(same(fillOneSided({ rangeMin: -1 }, [0.9999563, 0.9999572]), { rangeMin: -1, rangeMax: 0.999957 }), '거의 같음 · 최소만 → 다른 칸은 칸에 보이던 값(0.999957)');
  ok(fillOneSided({ rangeMin: 0, rangeMax: 1 }, null) === null && fillOneSided({ colormap: 'jet' }, [0, 0]) === null, '두 칸 다 · 범위 칸 아님 → 그대로(null)');
  const dv = rescaleDecision([0, 1.9150196]);
  ok(dv.apply && same(dv.range, [0, 1.9150196]), 'Rescale: 값이 다르면 적용');
  const d0 = rescaleDecision([0, 0]);
  ok(!d0.apply && d0.note === '범위를 바꾸지 않았습니다: 지금 값이 모두 0 입니다.', `Rescale: t = 0 [데이터 범위] → 바꾸지 않음 (${d0.note}) — 0 / 5e-13 / 1e-12 가 보이지 않게`);
  const dn = rescaleDecision(null);
  ok(!dn.apply && dn.note === '보이는 노드 가운데 이 지도로 칠하는 것이 없어 범위를 바꾸지 않았습니다.', 'Rescale: 보이는 노드 없음 → 바꾸지 않음');
  const d1 = rescaleDecision([3, 3.00001]);
  ok(!d1.apply && d1.note.includes('모두 약 3'), `Rescale: 거의 같음 → 바꾸지 않음 (${d1.note})`);
}

// ---------- 13. 처음 범위 합에 넣을 노드 · 임시 범위가 바뀔 때 다시 칠할 노드 (검토 반영) ----------
{
  const u = (o = {}) => ({ hasRange: true, visible: true, dirty: false, computedThisPass: false, ...o });
  ok(joinsFirstRange(u()), '보이고 지금 값으로 계산됨 → 합에 넣음');
  ok(joinsFirstRange(u({ dirty: true, computedThisPass: true })), '이 차례에 계산됐다가 다시 칠하라고 표시됨 → 넣음 (처음 범위가 노드 줄 순서에 매이지 않게)');
  ok(!joinsFirstRange(u({ dirty: true })), '저장 시점을 넘겨 아직 계산 전(앞 장면 값) → 넣지 않음');
  ok(!joinsFirstRange(u({ visible: false })) && !joinsFirstRange(u({ hasRange: false })), '숨김 · 그린 값 없음 → 넣지 않음');
  const r = (kind, o = {}) => repaintsOnRangeChange(kind, { volumeColorOnly: false, ...u(o) });
  ok(r('set', { computedThisPass: true }) && r('widen', { computedThisPass: true }) && r('grow', { computedThisPass: true }), '처음 정함·넓힘 → 이 차례에 계산된 노드도 다시 칠함(진짜 범위로)');
  ok(!r('flat', { computedThisPass: true }), "'모두 같음' 임시 범위만 바뀜 → 이 차례에 계산된 보이는 노드는 다시 계산하지 않음 (장면마다 두 번 계산하지 않게)");
  ok(r('flat', { computedThisPass: true, visible: false }) && r('flat', { dirty: true }) && r('flat'), "'모두 같음'이어도 숨긴 노드 · 계산 전 · 앞 차례에 계산된 노드는 표시 (다시 보일 때 판단)");
  ok(repaintsOnRangeChange('flat', { volumeColorOnly: true, ...u({ computedThisPass: true }) }), '볼륨 노드는 색만 바꾸므로 늘 바꿈');
  // 다시 칠하지 않아도 되는 까닭: 같은 '모두 같음' 합 안의 값은 어느 임시 범위로 칠하든 가운데 색 자리 ± 0.0005
  let seed = 7;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  let worst = 0;
  for (let k = 0; k < 2000; k++) {
    const c = (rnd() - 0.5) * 10 ** Math.floor(rnd() * 12 - 6), w = Math.abs(c) * 1e-4 * rnd() * 0.99;
    const lo = c - w / 2, hi = c + w / 2;                   // 합(A ∪ B) — 모두 같음
    const bLo = lo + (hi - lo) * rnd() * 0.5, bHi = bLo + (hi - bLo) * rnd(); // B 는 그 안
    const pB = paintRangeForFlat(bLo, bHi), pAB = paintRangeForFlat(lo, hi);
    for (const v of [bLo, bHi]) for (const p of [pB, pAB]) worst = Math.max(worst, Math.abs((v - p[0]) / Math.max(p[1] - p[0], 1e-12) - FLAT_PAINT_T));
  }
  ok(worst <= 0.0005 + 1e-9, `같은 합 안의 노드: 앞서 칠한 임시 범위와 새 임시 범위 모두 가운데 색 자리 ±${worst.toFixed(6)} (무작위 2,000)`);
}

// ---------- 14. 안내 줄: 멈춤 안내는 자동으로 정해져도 남음 (검토 반영) ----------
{
  // AppCore.updateColorMap 흉내 (값이 서로 다른 장면에서 읽는 중 Component 를 바꿈): 안내 비움 → 멈춤 안내 → 성분을 바꿔 미정 → 그 노드를 바로 다시 계산 → 처음 정함
  let note = NO_NOTE;
  note = { text: 'Component 를 바꿔 전 시점 범위 읽기를 멈췄습니다.', sticky: true };
  note = noteAfterAutoRange(note);
  ok(note.text === 'Component 를 바꿔 전 시점 범위 읽기를 멈췄습니다.', "Component 를 바꿔 멈춤 → 그 장면에서 바로 범위가 정해져도 안내가 남음 (t = 0 이 아닌 장면)");
  ok(noteAfterAutoRange({ text: '다른 데이터를 여느라 전 시점 범위 읽기를 멈췄습니다.', sticky: true }).text !== '', '다른 데이터 열기로 멈춤 → 남음');
  ok(same(noteAfterAutoRange({ text: '범위를 바꾸지 않았습니다: 지금 값이 모두 0 입니다.', sticky: false }), NO_NOTE), "Rescale 결과('모두 0' 이라 안 바꿈) → 범위가 자동으로 정해지면 지움 (그때 범위에 대한 글)");
}

// ---------- 15. 결정 (2026-11-05) ----------
// (가) 벡터 성분의 0 근처 계산 잡음은 '모두 약 0': 성분일 때 문턱 하한 = float32 정밀도 × 같은 벡터 배열의 크기 최대 (자동 정하기 · 전 시점 범위 둘 다)
{
  const z = componentFlatFloor('z', 0.0079); // 다상 velocity: Z 잡음 ±5e-15 (크기 최대는 예시 값)
  ok(FLOAT32_EPS === 2 ** -23 && Math.abs(z - 0.0079 * 2 ** -23) < 1e-24, `하한 = 2^-23 × 크기 최대 (${z.toExponential(3)})`);
  ok(componentFlatFloor('magnitude', 1) === 0 && componentFlatFloor('x', 0) === 0 && componentFlatFloor('y', NaN) === 0 && componentFlatFloor('z', -Infinity) === 0,
    '크기로 칠함 · 크기 최대 0·모름(NaN·-Infinity, 스칼라) → 하한 없음(0)');
  ok(isFlatRange(-5.6e-15, 5.6e-16, z), '[-5.6e-15,5.6e-16] + 성분 하한 → 모두 같음 (다상 Z 성분 잡음)');
  ok(!isFlatRange(-1e-5, 1e-5, componentFlatFloor('z', 1)), '3D 흐름의 약한 성분(크기 1, Z ±1e-5) → 같지 않음 (하한 1.2e-7 보다 넓음)');
  ok(!isFlatRange(0, 0.041, componentFlatFloor('x', 0.041)) && isFlatRange(0.5, 0.5000031, componentFlatFloor('y', 0.71)), '하한은 문턱을 올리기만 함 — 진짜 범위는 그대로, 상대 기준으로 같은 것은 그대로 같음');
  const view0 = { fresh: true, min: 0, max: 1, settledThisPass: false, growPending: false, autoGrow: true };
  const a = rebuildDecision(view0, [-5.6e-15, 5.6e-16], [], z);
  ok(a.kind === 'flat' && same(a.flat, [-5.6e-15, 5.6e-16]), `자동 정하기: 미정 + Z 잡음 → flat(정하지 않음) ${a.kind}`);
  ok(rebuildDecision(view0, [-5.6e-15, 5.6e-16], []).kind === 'set', '  (하한 없이는 지수 숫자 범위로 정해지던 것)');
  ok(rebuildDecision(view0, [-5.6e-15, 0.003], [], z).kind === 'set', '자동 정하기: 값이 처음 달라지는 장면에서는 정함');
  ok(growDecision([0, 0.003], [-5.6e-15, 5.6e-16], z) === null, '넓히기: Z 잡음 장면은 넓히는 데 안 씀');
  ok(fmtFlatValue(-5.6e-15, 5.6e-16) === '약 0' && flatShownValue(-5.6e-15, 5.6e-16) === 0, `0 을 걸치는 '모두 같음'은 '약 0' (지수 숫자 없음 — ${fmtFlatValue(-5.6e-15, 5.6e-16)})`);
  ok(rangeStateText({ fresh: true, mode: 'grow', modeLabel: '자동(넓히기)', flat: [-5.6e-15, 5.6e-16], unit: 'm/s', stepLabelOf: () => null, stepCount: 51 }) === '범위: 아직 정하지 않음 · 지금 값은 모두 약 0 · 단위 m/s', '상태 줄: 지금 값은 모두 약 0');
  const [pa, pb] = paintRangeForFlat(-5.6e-15, 5.6e-16);
  const tz = (v) => (v - pa) / (pb - pa);
  ok(Math.abs(tz(-5.6e-15) - FLAT_PAINT_T) < 0.001 && Math.abs(tz(5.6e-16) - FLAT_PAINT_T) < 0.001, `칠하기 임시 범위: Z 잡음이 모두 가운데 색 자리 (${tz(-5.6e-15).toFixed(5)} · ${tz(5.6e-16).toFixed(5)})`);
  const lab15 = (n) => `t = ${n}`;
  const so = scanOutcome({ min: -5.6e-15, max: 5.6e-16, used: 51, total: 51, failed: [] }, lab15, componentFlatFloor('z', 0.041));
  ok(!so.apply && so.note === '범위를 바꾸지 않았습니다: 모든 저장 시점에서 값이 모두 약 0 입니다.', `전 시점 범위: Z 잡음 → 적용 안 함 (${so.note})`);
  ok(scanOutcome({ min: -5.6e-15, max: 5.6e-16, used: 51, total: 51, failed: [] }, lab15).apply, '  (하한 없이는 적용되던 것)');
  ok(scanOutcome({ min: -0.002, max: 0.003, used: 51, total: 51, failed: [] }, lab15, componentFlatFloor('z', 0.041)).apply, '전 시점 범위: 성분이 실제로 움직이면 적용');
  const rz = rescaleDecision([-5.6e-15, 5.6e-16], z);
  ok(!rz.apply && rz.note === '범위를 바꾸지 않았습니다: 지금 값이 모두 약 0 입니다.', `Rescale 단추(시간축 없는 전 시점 범위 포함)도 같은 하한 (${rz.note})`);
  // 전 시점 범위가 같은 배열을 읽으며 크기 최대를 함께 센다 (rangeScan.ts minMaxMapped magMax) — 화면의 크기 통계와 비트까지 같음
  let seed = 99;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const N = 3000, d = new Float64Array(N * 3);
  for (let i = 0; i < N; i++) { d[i * 3] = (rnd() - 0.3) * 2; d[i * 3 + 1] = (rnd() - 0.6) * 0.5; d[i * 3 + 2] = (rnd() - 0.5) * 1e-14; }
  const ref = vectorFieldFromInterleaved('v', ['x', 'y', 'z'], Float32Array.from(d)).stats;
  const mags = ['magnitude', 'x', 'y', 'z'].map((m) => minMaxMapped(d, 3, m, null, null).magMax);
  ok(mags.every((m) => m === ref.magnitude.max), `magMax: 크기·X·Y·Z 어느 것을 읽어도 = 화면 크기 최대 ${ref.magnitude.max} (${mags.join(' · ')})`);
  ok(minMaxMapped(new Float64Array([1, 2, 3]), 1, 'magnitude', null, null).magMax === -Infinity, 'magMax: 스칼라 → -Infinity');
  const rzz = minMaxMapped(d, 3, 'z', null, null);
  ok(isFlatRange(rzz.min, rzz.max, componentFlatFloor('z', rzz.magMax)) && !isFlatRange(rzz.min, rzz.max), `합성 Z 잡음(±5e-15) + 같은 배열의 크기 최대 → 모두 같음 (${rzz.min.toExponential(2)} ~ ${rzz.max.toExponential(2)})`);
  // 검토 반영: 잡음이 한쪽 부호뿐이어도(1e-15 ~ 5e-15 — 양수 쪽만 지나는 Slice 등) 값이 모두 하한 안쪽이면 '약 0' (지수 숫자가 글에 나오지 않음)
  ok(same(flatNearZero([1e-15, 5e-15], z), [0, 5e-15]) && same(flatNearZero([-5e-15, -1e-15], z), [-5e-15, 0]) && same(flatNearZero([3e-15, 3e-15], z), [0, 3e-15]),
    'flatNearZero: 하한 안쪽의 한쪽 부호 범위 → 0 을 걸친 범위');
  ok(same(flatNearZero([3e-15, 3e-15], 0), [3e-15, 3e-15]) && same(flatNearZero([0.5, 0.5000031], componentFlatFloor('y', 0.71)), [0.5, 0.5000031]) && same(flatNearZero([-5.6e-15, 5.6e-16], z), [-5.6e-15, 5.6e-16]),
    '  하한 없음(크기 · 스칼라) · 하한 밖의 값 · 이미 0 을 걸침 → 그대로');
  const one = rebuildDecision(view0, [1e-15, 5e-15], [], z);
  ok(one.kind === 'flat' && fmtFlatValue(one.flat[0], one.flat[1]) === '약 0' && flatShownValue(one.flat[0], one.flat[1]) === 0,
    `자동 정하기: 한쪽 부호 잡음 → flat, 글 '약 0' · Range 칸 0 (${one.kind === 'flat' ? fmtFlatValue(one.flat[0], one.flat[1]) : one.kind})`);
  ok(one.kind === 'flat' && rangeStateText({ fresh: true, mode: 'grow', modeLabel: '자동(넓히기)', flat: one.flat, unit: '', stepLabelOf: () => null, stepCount: 51 }) === '범위: 아직 정하지 않음 · 지금 값은 모두 약 0',
    '  상태 줄도 같은 범위로 지금 값은 모두 약 0');
  if (one.kind === 'flat') {
    const tp = (v) => (v - one.paint[0]) / (one.paint[1] - one.paint[0]);
    ok(Math.abs(tp(1e-15) - FLAT_PAINT_T) < 0.001 && Math.abs(tp(5e-15) - FLAT_PAINT_T) < 0.001 && Math.abs(flatBarT(one.flat, one.paint[0], one.paint[1]) - FLAT_PAINT_T) < 0.001,
      `  칠하는 임시 범위 · 범례 막대 색 자리도 가운데 색 (${tp(1e-15).toFixed(5)} · ${tp(5e-15).toFixed(5)})`);
  }
  ok(rebuildDecision(view0, [3e-15, 3e-15], [], z).kind === 'flat' && fmtFlatValue(...rebuildDecision(view0, [3e-15, 3e-15], [], z).flat) === '약 0', "  하한 안쪽의 한 점(3e-15) → '약 0' (0 이 아니므로 '약')");
  ok(fmtFlatValue(...rebuildDecision(view0, [3e-15, 3e-15], []).flat) === '3e-15', "  스칼라(하한 없음)의 한 점 3e-15 → 그대로 '3e-15'");
  ok(rescaleDecision([1e-15, 5e-15], z).note === '범위를 바꾸지 않았습니다: 지금 값이 모두 약 0 입니다.', `Rescale 단추: 한쪽 부호 잡음 → '모두 약 0' (${rescaleDecision([1e-15, 5e-15], z).note})`);
  const so1 = scanOutcome({ min: 1e-15, max: 5e-15, used: 51, total: 51, failed: [] }, lab15, z);
  ok(!so1.apply && so1.note === '범위를 바꾸지 않았습니다: 모든 저장 시점에서 값이 모두 약 0 입니다.', `전 시점 범위: 한쪽 부호 잡음 → '모두 약 0' (${so1.note})`);
  ok(fmtFlatValue(...freshDecision([0.5, 0.5000031], componentFlatFloor('y', 0.71)).range) === '약 0.5', "  하한 밖(농도확산 velocity Y ≈ 0.5)은 그대로 '약 0.5'");
}
// (나) 옛 코드로 저장한 장면 파일의 '모두 같음' 폭 범위는 '범위 미정'으로 들인다 (그 폭이 '모두 같음' 문턱 이하일 때만)
{
  const legacyWiden = (lo, hi) => { const s = Math.max(Math.abs(lo), Math.abs(hi)); const ms = s > 0 ? s * 1e-4 : 1e-12; if (hi - lo >= ms) return [lo, hi]; const c = (lo + hi) / 2; return [c - ms / 2, c + ms / 2]; }; // 옛 pointDataset.ts widenRange
  const saved = (lo, hi, o = {}) => ({ fresh: false, rangeMode: 'grow', rangeMin: lo, rangeMax: hi, ...o });
  ok(isLegacyFlatSaved(saved(-5e-13, 5e-13)), '옛 t = 0 범위 -5e-13 ~ 5e-13 (자동) → 미정으로');
  ok(isLegacyFlatSaved(saved(...legacyWiden(0, 0), { rangeMode: 'data' })), '옛 [데이터 범위]로 정한 모두 0 → 미정으로');
  ok(isLegacyFlatSaved(saved(...legacyWiden(101325, 101325))) && isLegacyFlatSaved(saved(...legacyWiden(0.9999563, 0.9999572))) && isLegacyFlatSaved(saved(...legacyWiden(-0.00146, -0.00145995))),
    '옛 넓힘(가운데 기준) 101325 · density · 음수 거의 같음 → 미정으로');
  ok(isLegacyFlatSaved(saved(...legacyWiden(1, 1.00009))), '옛 넓힘: 거의 같은 값(1 ~ 1.00009 → 폭이 가운데의 1만분의 1 보다 조금 넓음)도 미정으로');
  ok(isLegacyFlatSaved(saved(-5.6e-15, 5.6e-16), componentFlatFloor('z', 0.0079)) && !isLegacyFlatSaved(saved(-5.6e-15, 5.6e-16)), '옛 Z 성분 잡음 범위 → 성분 하한이 있을 때만 미정으로');
  ok(!isLegacyFlatSaved(saved(0, 1.9150196)) && !isLegacyFlatSaved(saved(0.5, 0.50006)), '진짜 범위 → 그대로 (저장된 범위를 지킨다)');
  ok(!isLegacyFlatSaved(saved(-5e-13, 5e-13, { rangeBasis: { kind: 'first', n: 0 } })), '범위 근거가 있음(지금 코드가 저장) → 그대로');
  ok(!isLegacyFlatSaved(saved(-5e-13, 5e-13, { rangeMode: 'custom' })) && !isLegacyFlatSaved(saved(1, 1.0001, { rangeMode: 'custom' })), '사용자 지정 → 그대로 (지금 코드의 [1,1] 입력 = 1 ~ 1.0001 포함)');
  ok(!isLegacyFlatSaved(saved(...widenColorRange(0, 0))), '지금 코드의 최소 폭 0 ~ 1e-12 → 옛 넓힘 꼴이 아님(그대로)');
  ok(!isLegacyFlatSaved(saved(-5e-13, 5e-13, { fresh: true })) && !isLegacyFlatSaved(saved(NaN, 1)) && !isLegacyFlatSaved(saved(1, 0)), '이미 미정 · NaN · 거꾸로 → 그대로');
  // 검토 반영: '옛 넓힘의 꼴'만 — 옛 넓힘 폭보다 좁은 범위는 옛 widenRange 가 만들 수 없으므로 그대로 (전에는 '폭 이하'라 미정으로 돌렸다)
  ok(!isLegacyFlatSaved(saved(-4e-13, 4e-13)) && !isLegacyFlatSaved(saved(-1e-13, 1e-13)), '가운데가 0 인 진짜 범위 -4e-13 ~ 4e-13 · -1e-13 ~ 1e-13 (스칼라) → 그대로');
  ok(!isLegacyFlatSaved(saved(101320, 101330)) && !isLegacyFlatSaved(saved(1, 1.00005)), '손으로 줄여 적은 101320 ~ 101330 · 1 ~ 1.00005 (옛 넓힘 폭보다 좁음) → 그대로');
  ok(isLegacyFlatSaved(saved(-4e-13, 4e-13), componentFlatFloor('z', 0.0079)), '  성분 하한보다 좁으면 (가)대로 미정으로 (-4e-13 ~ 4e-13, Z 하한 9.4e-10)');
  ok(!isLegacyFlatSaved(saved(-6e-13, 6e-13)) && !isLegacyFlatSaved(saved(...legacyWiden(1, 1.0002))), '옛 넓힘 폭보다 넓음 · 옛 넓힘이 건드리지 않은 범위 → 그대로');
}
// (다) 자동 넓히기에서 '모두 같은 장면' 값을 빼는 규칙은 유지 (농도확산 pressure: 0번 장면만 101325)
{
  ok(growDecision([-0.00565, -0.0014], [101325, 101325]) === null, '정해진 범위 -0.00565 ~ -0.0014 + 0번 장면 노드를 바꿈(101325 한 점) → 넓히지 않음 (PV와 다름 — 명세 §3)');
  ok(same(growDecision([-0.00565, -0.0014], [-0.006, 101325]), [-0.006, 101325]), '값이 서로 다른 장면이면 101325 를 포함해도 넓힘 (빼는 것은 모두 같은 장면만)');
  ok(rebuildDecision({ fresh: false, min: -0.00565, max: -0.0014, settledThisPass: false, growPending: true, autoGrow: true }, [101325, 101325], []).kind === 'none', '  rebuildDecision 도 같음');
}

console.log(fail ? `\n실패 ${fail} · 통과 ${pass}` : `\n모두 통과 (통과 ${pass})`);
process.exit(fail ? 1 : 0);

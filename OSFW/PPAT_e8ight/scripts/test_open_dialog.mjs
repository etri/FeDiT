#!/usr/bin/env node
// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   test_open_dialog.mjs

src/post/openDialogRules.ts(후처리 '데이터 열기' 창의 열림·닫힘 규칙과 끌어다 놓기 판정)의 Node 시험.
TS 를 바로 못 돌리므로 esbuild(vite 가 깔아 둔 것)로 메모리에서 ES 모듈 하나로 묶어(파일을 쓰지 않음) data: 주소로 불러 쓴다.
확인: dialogView — 데이터 없음 / 있음 / 여는 중(둘 다) → 닫을 수 있나 · 머리 오른쪽('처음 화면' | 닫기 x) · 닫기 단추 막힘 · 여는 단추 막힘 ·
레이어 경고 글(editsWarning — 바꾼 것이 있을 때만, 레이어 · 바꾼 데이터 표시 · 더한 형상 · 바꾼 형상 가운데 해당하는 것만, 데이터 없음·이상한 수는 숨김);
sceneMark · editsSince — 기본 Slice 1 / Clip 1 그대로면 경고 없음, 이름·보이기·색 지도 범위는 바꾼 것 아님, 매개변수·표시(표현 방식 · Opacity · 칠할 배열)·위 노드·
레이어 더함은 바꾼 것, 기본 레이어를 지워 0개면 없음, 데이터 노드의 표시는 레이어와 따로(레이어 0개여도 셈), 형상 더함·옮김·돌림·배율·크기는 셈, 지운 형상은 안 셈;
여는 차례 흉내(빈 첫 화면 → 여는 중 → 열림(기본만 — 경고 없음) → 레이어 쌓음 → 다시 엶 → 실패 → 형상 더함);
dropPlan — ZIP 하나 · ZIP 둘(낱개) · 폴더 핸들 · .vtm 섞인 낱개 파일(이름 'xxx_10.vtm' → 'xxx', 숫자 없는 이름, '_10.vtm' 만) ·
창에 STL 만(열지 않음) · 3D 화면에 STL 만(형상) · CSV+STL 섞임(놓은 차례) · 대소문자 · 놓은 것 없음;
fileLineView — '파일' 결과 줄의 진행 글(파일 묶음 · 창 밖에서 시작한 열기만, 목록 줄의 열기는 그 줄) · 오류 · 거절 알림('불러오는 중'은 진행 글과 함께 보이고 여는 일이 끝나면 지움);
글(stlNotDataText 데이터 있음/없음 · BUSY_TEXT).

실행: node scripts/test_open_dialog.mjs
*/
/******************************************************************************/

import { build } from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ---------- 묶기(메모리) ----------
const res = await build({
  entryPoints: [path.join(ROOT, 'src/post/openDialogRules.ts')],
  bundle: true, platform: 'neutral', format: 'esm', target: 'es2022', write: false, logLevel: 'silent',
});
const m = await import(`data:text/javascript;base64,${Buffer.from(res.outputFiles[0].text).toString('base64')}`);

let fail = 0, pass = 0;
const check = (ok, msg) => { console.log(`${ok ? 'PASS' : 'FAIL'} ${msg}`); if (ok) pass++; else fail++; };
const eq = (got, want, msg) => check(isDeepStrictEqual(got, want), isDeepStrictEqual(got, want) ? msg : `${msg} — 기대 ${JSON.stringify(want)}, 실제 ${JSON.stringify(got)}`);

/** edits = 다른 데이터를 열면 잃는 것 (레이어 수 · 더한 형상 · 바꾼 형상 · 데이터 노드의 표시를 바꿨나) */
const E = (layers = 0, addedShapes = 0, changedShapes = 0, dataView = false) => ({ layers, dataView, addedShapes, changedShapes });
const v = (hasData, busy, edits) => m.dialogView(edits === undefined ? { hasData, busy } : { hasData, busy, edits });
const pick = (x) => ({ canClose: x.canClose, head: x.head, closeDisabled: x.closeDisabled, openDisabled: x.openDisabled });

// ---------- dialogView: 닫기 · 머리 오른쪽 ----------
console.log('\n[1] dialogView — 닫을 수 있나 · 머리 오른쪽');
eq(pick(v(false, false)), { canClose: false, head: 'home', closeDisabled: false, openDisabled: false }, "데이터 없음: 못 닫음 · 머리에 '처음 화면' · 여는 단추 열림");
eq(pick(v(false, true)), { canClose: false, head: 'home', closeDisabled: true, openDisabled: true }, "데이터 없음 + 여는 중: 못 닫음 · '처음 화면' 그대로 · 여는 단추 막힘");
eq(pick(v(true, false, E(1))), { canClose: true, head: 'close', closeDisabled: false, openDisabled: false }, '데이터 있음: x · Esc · 뒤판으로 닫힘');
eq(pick(v(true, true, E(1))), { canClose: false, head: 'close', closeDisabled: true, openDisabled: true }, '데이터 있음 + 여는 중: x 는 보이되 막힘 · 어떤 길로도 못 닫음');
for (const hasData of [false, true]) for (const busy of [false, true]) {
  const x = v(hasData, busy, E(2));
  check(x.canClose === (hasData && !busy), `닫힘 = 데이터 있음 그리고 여는 중 아님 (데이터 ${hasData} · 여는 중 ${busy})`);
  check(x.closeDisabled === busy && x.openDisabled === busy, `여는 중이면 닫기·여는 단추 모두 막힘 (데이터 ${hasData} · 여는 중 ${busy})`);
  check(x.head === (hasData ? 'close' : 'home'), `머리 오른쪽은 데이터만 따른다 (데이터 ${hasData} · 여는 중 ${busy})`);
}

// ---------- dialogView: 레이어 경고 ----------
console.log('\n[2] dialogView · editsWarning — 레이어 경고 (제목 아래 한 줄, 연 직후와 견줘 바꾼 것만)');
eq(v(true, false, E(3)).layerWarning, '열면 지금 레이어 3개가 지워집니다.', '레이어를 바꿈 · 지금 3개');
eq(v(true, false, E(1)).layerWarning, '열면 지금 레이어 1개가 지워집니다.', '레이어를 바꿈 · 지금 1개');
eq(v(true, true, E(2)).layerWarning, '열면 지금 레이어 2개가 지워집니다.', '여는 중에도 그대로 보인다(아직 지워지지 않았으므로)');
eq(v(true, false, E(0)).layerWarning, '', '바꾼 것 없음 → 숨김');
eq(v(true, false).layerWarning, '', 'edits 를 안 넘김 → 숨김');
eq(v(false, false, E(4, 1)).layerWarning, '', '데이터 없음 → 숨김 (남은 값이 있어도)');
eq(v(true, false, E(-1)).layerWarning, '', '음수 → 숨김');
eq(v(true, false, E(NaN)).layerWarning, '', 'NaN → 숨김');
eq(v(true, false, E(2.7)).layerWarning, '열면 지금 레이어 2개가 지워집니다.', '소수는 내림');
eq(m.editsWarning(E(2, 1)), '열면 지금 레이어 2개와 더한 형상 1개가 지워집니다.', '레이어 + 더한 형상');
eq(m.editsWarning(E(0, 2)), '열면 지금 더한 형상 2개가 지워집니다.', '더한 형상만');
eq(m.editsWarning(E(0, 0, 1)), '열면 지금 바꾼 형상 1개가 지워집니다.', '옮긴 형상만');
eq(m.editsWarning(E(1, 0, 3)), '열면 지금 레이어 1개와 바꾼 형상 3개가 지워집니다.', '레이어 + 바꾼 형상');
eq(m.editsWarning(E(4, 2, 1)), '열면 지금 레이어 4개, 더한 형상 2개와 바꾼 형상 1개가 지워집니다.', '셋 다');
eq(m.editsWarning(m.NO_EDITS), '', 'NO_EDITS → 빈 글');
eq(m.editsWarning(E(0, 0, 0, true)), '열면 지금 바꾼 데이터 표시가 지워집니다.', '데이터 노드의 표시만');
eq(m.editsWarning(E(2, 0, 0, true)), '열면 지금 레이어 2개와 바꾼 데이터 표시가 지워집니다.', '레이어 + 데이터 표시');
eq(m.editsWarning(E(1, 1, 1, true)), '열면 지금 레이어 1개, 바꾼 데이터 표시, 더한 형상 1개와 바꾼 형상 1개가 지워집니다.', '넷 다');
eq(v(false, false, E(0, 0, 0, true)).layerWarning, '', '데이터 없음 → 데이터 표시도 숨김');

// ---------- sceneMark · editsSince: 연 직후 서명과 견주기 ----------
console.log('\n[3] sceneMark · editsSince — 데이터를 연 직후와 견줘 사용자가 바꾼 것');
const cmap = (lo, hi) => ({ preset: 'Jet', range: [lo, hi], opacity: [[0, 0], [1, 1]] });
const sliceL = (o = {}) => ({ id: 'L1', name: 'Slice 1', visible: true, type: 'slice', parentId: null, params: { axis: 2, position: 0.5, surface: true, fieldColor: { fieldKey: 'vector:velocity', separate: false, map: cmap(0, 1) }, ...o } });
const clipL = (rep = 'points', o = {}) => ({ id: 'L1', name: 'Clip 1', visible: true, type: 'clip', parentId: null, params: { clipType: 'plane', axis: 2, position: 1, invert: true, ...o }, view: { representation: rep, opacity: 1, color: { fieldKey: null, separate: false, map: cmap(0, 1) } } });
const shape = (id, uuid = `g-${id}`, pos = [0, 0, 0], rot = 0, scale = [1, 1, 1], size = [1, 1, 1]) => ({ id, name: `형상 ${id}`, visible: true, geometry: { uuid }, position: pos, rotationZ: rot, scale, size });
/** 데이터 노드의 표시 (core/layers.ts DataView 꼴) */
const rootV = (rep = 'outline', o = {}) => ({ representation: rep, opacity: 1, pointSize: 1, sphereShading: true, volumeUnitDistance: null, color: { fieldKey: 'vector:velocity', separate: false, map: cmap(0, 1) }, ...o });
const OUT = rootV();
const mk = (layers, root = OUT, shapes = []) => m.sceneMark(layers, root, shapes);
const since = (base, now) => m.editsSince(base, now);
{
  const base = mk([sliceL()]);
  eq(since(base, mk([sliceL()])), E(0, 0, 0), '기본 Slice 1 만 그대로 → 바꾼 것 없음 (경고 없음 — 고친 문제)');
  eq(m.editsWarning(since(base, mk([sliceL()]))), '', '그때 경고 글은 빈 글');
  eq(since(base, mk([{ ...sliceL(), name: '바꾼 이름', visible: false }])), E(0, 0, 0), '이름 · 보이기(눈)만 바꿈 → 바꾼 것 아님');
  eq(since(base, mk([sliceL({ fieldColor: { fieldKey: 'vector:velocity', separate: false, map: cmap(-3, 9) } })])), E(0, 0, 0), '색 지도 범위만 바뀜(저절로 넓어짐 등) → 바꾼 것 아님');
  eq(since(base, mk([sliceL({ position: 0.7 })])), E(1, 0, 0), 'Slice 위치(매개변수)를 바꿈 → 레이어 1개');
  eq(since(base, mk([sliceL({ fieldColor: { fieldKey: 'scalar:p', separate: false, map: cmap(0, 1) } })])), E(1, 0, 0), '칠할 배열(fieldKey)을 바꿈 → 바꾼 것');
  eq(since(base, mk([sliceL(), { ...clipL(), id: 'L2' }])), E(2, 0, 0), 'Clip 을 더함 → 지금 레이어 2개');
  eq(since(base, mk([])), E(0, 0, 0), '기본 Slice 를 지워 레이어 0개 → 지워질 레이어 없음');
  eq(since(base, mk([{ ...sliceL(), parentId: 'X' }])), E(1, 0, 0), '위 노드를 바꿈 → 바꾼 것');
}
// 데이터 노드의 표시: 레이어와 따로 센다 (전에는 레이어 서명에 섞여 '레이어 n개'로 나오고, 레이어 0개면 경고가 없었다)
{
  const base = mk([sliceL()]);
  eq(since(base, mk([sliceL()], rootV('surface'))), E(0, 0, 0, true), '데이터 노드 표현 방식(Outline → Surface)만 바꿈 → 바꾼 데이터 표시 (레이어는 그대로 → 0개)');
  eq(m.editsWarning(since(base, mk([sliceL()], rootV('surface')))), '열면 지금 바꾼 데이터 표시가 지워집니다.', '그때 경고 글은 데이터 표시만');
  eq(since(base, mk([], rootV('surface'))), E(0, 0, 0, true), '기본 Slice 를 지운 뒤 데이터 표현 방식을 바꿈 → 레이어 0개여도 경고');
  eq(since(base, mk([sliceL({ position: 0.7 })], rootV('surface'))), E(1, 0, 0, true), '레이어도 바꾸고 데이터 표시도 바꿈 → 둘 다');
  eq(since(base, mk([sliceL()], rootV('outline', { opacity: 0.4 }))), E(0, 0, 0, true), '데이터 노드 Opacity 를 바꿈 → 바꾼 데이터 표시');
  eq(since(base, mk([sliceL()], rootV('outline', { color: { fieldKey: 'scalar:p', separate: false, map: cmap(0, 1) } }))), E(0, 0, 0, true), '데이터 노드의 칠할 배열을 바꿈 → 바꾼 데이터 표시');
  eq(since(base, mk([sliceL()], rootV('outline', { color: { fieldKey: 'vector:velocity', separate: false, map: cmap(-2, 7) } }))), E(0, 0, 0), '데이터 노드의 색 지도 범위만 바뀜 → 바꾼 것 아님');
}
{
  const base = mk([clipL('points')]);
  eq(since(base, mk([clipL('points')])), E(0, 0, 0), '격자 없는 데이터의 기본 Clip 1(Points) 그대로 → 경고 없음');
  eq(since(base, mk([clipL('surface')])), E(1, 0, 0), 'Clip 1 표현 방식을 Surface 로 → 바꾼 것');
  eq(since(base, mk([clipL('points', { invert: false })])), E(1, 0, 0), 'Clip 1 Invert 를 끔 → 바꾼 것');
  // Clip·Threshold 의 Opacity · 칠할 배열은 view 에 있다 — Slice(매개변수 안)와 같이 센다 (전에는 표현 방식만 넣어 Clip 의 배열을 바꿔도 경고가 없었다)
  const clipView = (o) => { const l = clipL('points'); l.view = { ...l.view, ...o }; return l; };
  eq(since(base, mk([clipView({ color: { fieldKey: 'scalar:p', separate: false, map: cmap(0, 1) } })])), E(1, 0, 0), 'Clip 1(Points)의 칠할 배열을 바꿈 → 바꾼 것');
  eq(since(base, mk([clipView({ opacity: 0.5 })])), E(1, 0, 0), 'Clip 1 Opacity 를 바꿈 → 바꾼 것');
  eq(since(base, mk([clipView({ color: { fieldKey: null, separate: false, map: cmap(3, 4) } })])), E(0, 0, 0), 'Clip 1 의 색 지도 범위만 바뀜 → 바꾼 것 아님');
}
{
  const base = mk([sliceL()], OUT, [shape('a'), shape('b')]);
  eq(since(base, mk([sliceL()], OUT, [shape('a'), shape('b')])), E(0, 0, 0), '데이터와 함께 온 형상 그대로 → 바꾼 것 없음');
  eq(since(base, mk([sliceL()], OUT, [shape('a'), shape('b'), shape('c')])), E(0, 1, 0), '형상(상자·STL)을 더함 → 더한 형상 1개');
  eq(since(base, mk([sliceL()], OUT, [shape('a', 'g-a', [5, 0, 0]), shape('b')])), E(0, 0, 1), '있던 형상을 옮김 → 바꾼 형상 1개');
  eq(since(base, mk([sliceL()], OUT, [shape('a', 'g-a', [0, 0, 0], 30), shape('b', 'g-b', [0, 0, 0], 0, [2, 2, 2])])), E(0, 0, 2), '돌림 · 배율 → 바꾼 형상 2개');
  eq(since(base, mk([sliceL()], OUT, [shape('a', 'g-new', [0, 0, 0], 0, [1, 1, 1], [3, 1, 1]), shape('b')])), E(0, 0, 1), '크기를 바꿔 모양을 새로 만듦 → 바꾼 형상');
  eq(since(base, mk([sliceL()], OUT, [shape('a')])), E(0, 0, 0), '있던 형상을 지움 → 잃을 것이 아니므로 세지 않음');
  eq(since(base, mk([sliceL({ position: 0.9 })], OUT, [shape('a'), shape('b'), shape('c'), shape('d')])), E(1, 2, 0), '레이어 바꿈 + 형상 2개 더함');
  eq(m.editsWarning(since(base, mk([sliceL(), { ...clipL(), id: 'L2' }], OUT, [shape('a'), shape('b'), shape('z')]))), '열면 지금 레이어 2개와 더한 형상 1개가 지워집니다.', '경고 글: 레이어 2개와 더한 형상 1개');
}
eq(since(null, mk([sliceL()])), E(0, 0, 0), '연 직후 서명이 없음(아직 연 데이터 없음) → 바꾼 것 없음');
eq(mk([sliceL()]).layerCount, 1, 'sceneMark 레이어 수');
eq(Object.keys(mk([], OUT, [shape('a'), shape('b')]).shapes), ['a', 'b'], 'sceneMark 형상 아이디');
check(m.shapeSignature(shape('a')) !== m.shapeSignature(shape('a', 'g-a', [0, 0, 1])), 'shapeSignature: 위치가 다르면 서명이 다름');
check(m.layerSignature([sliceL()]) === m.layerSignature([sliceL({ fieldColor: { fieldKey: 'vector:velocity', separate: false, map: cmap(5, 6) } })]), 'layerSignature: 매개변수 안 색 지도(map)는 넣지 않음');
check(m.viewSignature(rootV()) === m.viewSignature(rootV('outline', { color: { fieldKey: 'vector:velocity', separate: false, map: cmap(5, 6) } })), 'viewSignature: 표시 안 색 지도(map)는 넣지 않음');
check(m.viewSignature(rootV()) !== m.viewSignature(rootV('outline', { pointSize: 2 })), 'viewSignature: 점 크기가 다르면 서명이 다름');

// ---------- 여는 차례 흉내 ----------
console.log('\n[3b] 여는 차례 흉내 (창의 닫힘 · 머리 · 경고)');
const steps = [
  ['빈 첫 화면', false, false, E(), { canClose: false, head: 'home', warn: '' }],
  ['서버 결과 [열기] 누름 → 여는 중', false, true, E(), { canClose: false, head: 'home', warn: '' }],
  ['실패 → 데이터 없음 그대로 (창 남음)', false, false, E(), { canClose: false, head: 'home', warn: '' }],
  ['예제 [열기] 성공 → 기본 Slice 1 만 → [데이터 열기]', true, false, E(), { canClose: true, head: 'close', warn: '' }],
  ['레이어 3개로 쌓은 뒤 [데이터 열기]', true, false, E(3), { canClose: true, head: 'close', warn: '열면 지금 레이어 3개가 지워집니다.' }],
  ['다른 결과 여는 중', true, true, E(3), { canClose: false, head: 'close', warn: '열면 지금 레이어 3개가 지워집니다.' }],
  ['열기 실패 → 그전 데이터 그대로', true, false, E(3), { canClose: true, head: 'close', warn: '열면 지금 레이어 3개가 지워집니다.' }],
  ['형상 하나 더 더함', true, false, E(3, 1), { canClose: true, head: 'close', warn: '열면 지금 레이어 3개와 더한 형상 1개가 지워집니다.' }],
];
for (const [name, hasData, busy, ed, want] of steps) {
  const x = v(hasData, busy, ed);
  eq({ canClose: x.canClose, head: x.head, warn: x.layerWarning }, want, name);
}

// ---------- dropPlan ----------
console.log('\n[4] dropPlan — 놓은 것을 무엇으로 열지');
eq(m.dropPlan(['result.zip'], false, true, 'dialog'), { kind: 'zip', index: 0 }, 'ZIP 하나 → 결과 ZIP (창)');
eq(m.dropPlan(['RESULT.ZIP'], false, true, 'viewport'), { kind: 'zip', index: 0 }, 'ZIP 하나 대문자 → 결과 ZIP (3D 화면)');
eq(m.dropPlan(['a.zip', 'b.zip'], false, true, 'dialog'), { kind: 'files', csv: [0, 1], stl: [] }, 'ZIP 둘 → 낱개 파일(예전과 같음 — CSV 로 읽다 오류)');
eq(m.dropPlan(['case01'], true, true, 'dialog'), { kind: 'folder' }, '폴더 핸들 → 결과 폴더 (이름은 폴더 이름)');
eq(m.dropPlan(['case.zip'], true, true, 'dialog'), { kind: 'folder' }, "이름이 '.zip' 으로 끝나는 폴더 → 결과 폴더");
eq(m.dropPlan(['bin', 'video_10.vtm', 'video.json'], false, true, 'dialog'), { kind: 'folder', label: 'video' }, ".vtm 섞인 낱개 파일 → 결과 폴더, 이름 'video_10.vtm' → 'video'");
eq(m.dropPlan(['flow.VTM'], false, true, 'viewport'), { kind: 'folder', label: 'flow' }, "숫자 없는 '.VTM' → 'flow'");
eq(m.dropPlan(['_10.vtm'], false, true, 'dialog'), { kind: 'folder', label: '_10.vtm' }, "'_10.vtm' 만 → 빈 이름 대신 파일 이름 그대로");
eq(m.dropPlan(['x.vtm'], false, false, 'dialog'), { kind: 'files', csv: [0], stl: [] }, '폴더를 못 만들면(파일 목록 없음) 결과 폴더로 보지 않는다');
eq(m.dropPlan(['body.stl'], false, true, 'dialog'), { kind: 'stl-only' }, '창에 STL 만 → 열지 않음');
eq(m.dropPlan(['a.STL', 'b.stl'], false, true, 'dialog'), { kind: 'stl-only' }, '창에 STL 둘(대문자 섞임) → 열지 않음');
eq(m.dropPlan(['body.stl'], false, true, 'viewport'), { kind: 'files', csv: [], stl: [0] }, '3D 화면에 STL 만 → 형상으로 더함');
eq(m.dropPlan(['body.stl', 'flow.csv'], false, true, 'dialog'), { kind: 'files', csv: [1], stl: [0] }, '창에 STL + CSV → 낱개 파일(놓은 차례 그대로, CSV 를 열었으니 데이터)');
eq(m.dropPlan(['flow.csv', 'body.stl', 'more.txt'], false, true, 'viewport'), { kind: 'files', csv: [0, 2], stl: [1] }, '3D 화면에 CSV · STL · TXT → 차례 그대로');
eq(m.dropPlan([], false, false, 'dialog'), { kind: 'none' }, '놓은 파일 없음 (창)');
eq(m.dropPlan([], false, false, 'viewport'), { kind: 'none' }, '놓은 파일 없음 (3D 화면)');

// ---------- fileLineView: '파일' 결과 줄 (진행 글 · 오류 · 거절 알림) ----------
console.log("\n[5] fileLineView — '파일' 결과 줄");
const fl = (fileBusy, opening, listBusy, busyNotice, fileMsg = '') => m.fileLineView({ fileBusy, opening, listBusy, busyNotice, fileMsg });
const B = m.BUSY_TEXT;
eq(fl(false, false, false, false), { showProgress: false, error: '', keepNotice: false }, '아무 일 없음 → 두 줄 다 숨김');
eq(fl(false, false, false, false, '깨진 CSV'), { showProgress: false, error: '깨진 CSV', keepNotice: false }, '마지막 오류가 남아 있음');
eq(fl(true, false, false, false), { showProgress: true, error: '', keepNotice: false }, "'파일'에서 시작 · 폴더 선택 창이 떠 있음(앱은 아직 안 엶) → 진행 줄(빈 글)");
eq(fl(true, true, false, false, '옛 오류'), { showProgress: true, error: '', keepNotice: false }, "'파일'에서 연 것이 진행 중 → 진행 글, 옛 오류는 숨김");
eq(fl(true, true, false, true), { showProgress: true, error: B, keepNotice: true }, "'파일'에서 여는 중에 또 놓음 → 진행 글 + '불러오는 중' 둘 다 (검토 지적: 전에는 진행 글에 가려 안 보임)");
eq(fl(false, true, true, false), { showProgress: false, error: '', keepNotice: false }, '목록 줄이 여는 중 → 진행 글은 그 줄이 보이고 여기는 숨김');
eq(fl(false, true, true, true), { showProgress: false, error: B, keepNotice: true }, "목록 줄이 여는 중에 창에 놓음 → '불러오는 중'");
eq(fl(false, false, false, true), { showProgress: false, error: '', keepNotice: false }, "그 열기가 끝남(실패해도) → '불러오는 중'을 지움 (검토 지적: 전에는 계속 남음)");
eq(fl(false, false, false, true, '앞의 오류'), { showProgress: false, error: '앞의 오류', keepNotice: false }, '거절 알림을 지우면 앞의 오류가 다시 보임');
eq(fl(false, true, false, false), { showProgress: true, error: '', keepNotice: false }, '창 밖에서 시작한 열기(3D 화면에 놓기) → 여기에 진행 글 (검토 지적: 전에는 창 어디에도 없음)');
eq(fl(false, true, false, true), { showProgress: true, error: B, keepNotice: true }, "창 밖 열기 중에 창에 놓음 → 진행 글 + '불러오는 중'");
// 차례 흉내: 서버 결과 줄 [열기] → 그사이 창에 ZIP 놓음 → 서버 열기 실패
let notice = false;
const stepFl = (fileBusy, opening, listBusy, rejectNow, msg = '') => { if (rejectNow) notice = true; const x = fl(fileBusy, opening, listBusy, notice, msg); notice = x.keepNotice; return x.error; };
eq([stepFl(false, true, true, false), stepFl(false, true, true, true), stepFl(false, true, true, false), stepFl(false, false, false, false)], ['', B, B, ''], "차례: 줄 여는 중 → 놓음(거절) → 아직 여는 중 → 실패로 끝남 → '불러오는 중' 사라짐");

console.log('\n[6] 글');
eq(m.stlNotDataText(true), 'STL은 데이터가 아니라 형상입니다. 형상 편집의 [STL 추가]로 넣어 주세요.', '창에 STL 만 놓음 · 데이터 있음');
eq(m.stlNotDataText(false), 'STL은 데이터가 아니라 형상입니다. 데이터를 연 뒤 형상 편집의 [STL 추가]로 넣어 주세요.', '창에 STL 만 놓음 · 데이터 없음');
eq(m.BUSY_TEXT, '다른 데이터를 불러오는 중입니다.', '여는 중의 글 (서버 결과·예제 줄과 같은 글)');

console.log(`\n${pass} 통과, ${fail} 실패`);
process.exit(fail ? 1 : 0);

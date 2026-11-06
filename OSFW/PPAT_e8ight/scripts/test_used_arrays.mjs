#!/usr/bin/env node
// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   test_used_arrays.mjs

src/core/usedArrays.ts(결과 폴더에서 저장 시점마다 읽을 '쓰는 배열'을 노드 트리로 정하는 순수 함수, 2026-11-06)의 Node 시험.
esbuild 로 메모리에서 묶어(파일을 쓰지 않음) data: 주소로 불러 쓴다. 노드는 layers.ts 의 꼴을 손으로 만든다.
확인: Field key → 배열 이름 · 데이터 노드 색(표현 방식과 무관) · 새 노드 기본 배열 · Slice 색 · Clip(Plane·Box 는 Field 를 쓰지 않음, Scalar 만) ·
Threshold Field · 볼륨 위 Clip·Threshold 의 색(면·선 위면 쓰지 않음) · Glyph·Streamline 의 Field(벡터)와 색(단색이면 뺌) ·
Isosurface 의 Field 와 색(단색이면 뺌) · 숨긴 노드도 넣음 · 머리 정보(Field 목록)에 없는 Field 는 뺌(종류가 다른 key 도) · 겹친 이름은 한 번 ·
노드 하나가 기대는 배열(nodeArrays — 노드 + 조상 사슬의 Clip(Scalar)·Threshold, 면·선 위 Clip·Threshold 는 입력 노드의 Field·색까지,
볼륨 노드의 색은 Surface · Points · Volume 일 때만 — Outline · Feature Edges · 없음이면 기다리지 않지만 읽어 둘 배열에는 넣음) ·
사슬이 아닌 형제·자손의 배열은 넣지 않음 · 없는 노드 · parentId 고리에서도 멈춤 · 쓰는 배열 = 모든 노드의 기대는 배열 ∪ 기본 배열.

실행: node scripts/test_used_arrays.mjs
*/
/******************************************************************************/

import { build } from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bundle = async (rel) => {
  const res = await build({ entryPoints: [path.join(ROOT, rel)], bundle: true, platform: 'neutral', format: 'esm', target: 'es2022', write: false, logLevel: 'silent' });
  return import(`data:text/javascript;base64,${Buffer.from(res.outputFiles[0].text).toString('base64')}`);
};
const { usedArrays, nodeArrays, arrayNameOf, ROOT_NODE_ID } = await bundle('src/core/usedArrays.ts');

let fail = 0, pass = 0;
const ok = (cond, name, extra = '') => { if (cond) { pass++; console.log(`PASS ${name}`); } else { fail++; console.log(`FAIL ${name} ${extra}`); } };
const sameSet = (a, b) => a.length === b.length && b.every((x) => a.includes(x));
const eq = (got, want, name) => ok(sameSet(got, want), name, `got [${got.join(', ')}] want [${want.join(', ')}]`);

// ---- 노드 만들기 (layers.ts 의 꼴) ----
const color = (fieldKey) => ({ fieldKey, separate: false, map: {} });
const view = (representation, fieldKey) => ({ representation, opacity: 1, pointSize: 1, sphereShading: true, volumeUnitDistance: null, color: color(fieldKey) });
let seq = 0;
const node = (type, params, extra = {}) => ({ id: extra.id ?? `n${++seq}`, type, name: type, visible: extra.visible ?? true, parentId: extra.parentId ?? null, params, ...(extra.view ? { view: extra.view } : {}) });
const clip = (clipType, fieldKey, extra = {}) => node('clip', { clipType, axis: 0, position: 0, boxMin: [0, 0, 0], boxMax: [1, 1, 1], fieldKey, mapping: 'magnitude', value: 0, invert: true }, { view: view('surface', extra.color ?? null), ...extra });
const thr = (fieldKey, extra = {}) => node('threshold', { fieldKey, mapping: 'magnitude', method: 'between', lower: 0, upper: 1, allScalars: true, invert: false }, { view: view('surface', extra.color ?? null), ...extra });
const slice = (fieldKey, extra = {}) => node('slice', { axis: 2, position: 0, surface: true, lines: true, levels: 10, resolution: 2, opacity: 1, banded: false, lineColor: 'black', lineWidth: 1, lineOpacity: 0.55, clipToObjects: true, color: color(fieldKey) }, extra);
const glyph = (fieldName, colorMode, fieldKey, extra = {}) => node('glyph', { fieldName, mode: 'uniform', maxSamples: 5000, axis: 2, position: 0, stride: 4, scaleFactor: 1, color: colorMode, lengthMode: 'magnitude', fieldColor: color(fieldKey) }, extra);
const stream = (fieldName, colorMode, fieldKey, extra = {}) => node('stream', { fieldName, seedAxis: 0, seedPos: 0, seedBounds: 'data', nU: 1, nV: 1, vFrac: 0.5, direction: 'both', maxLength: 1, shape: 'line', width: 2, widthUnits: 'px', meshWidth: 1, sides: 4, ribbonDir: 'horizontal', opacity: 1, dash: 'solid', color: colorMode, solidColor: '#fff', fieldColor: color(fieldKey) }, extra);
const iso = (fieldKey, colorMode, colorKey, extra = {}) => node('iso', { fieldKey, value: 0, colorMode, solidColor: '#fff', opacity: 1, fieldColor: color(colorKey) }, extra);

// 머리 정보의 Field 목록 (fluid_dem 꼴: 벡터 velocity·force, 스칼라 pressure·fraction·density·temperature)
const catalog = new Set(['vector:velocity', 'vector:force', 'scalar:pressure', 'scalar:fraction', 'scalar:density', 'scalar:temperature']);
const input = (layers, extra = {}) => ({ root: { view: view(extra.rep ?? 'outline', extra.rootColor ?? null) }, layers, defaultFieldKey: extra.def ?? null, catalog: extra.catalog ?? catalog });

// ---- Field key → 배열 이름 ----
ok(arrayNameOf('vector:velocity') === 'velocity' && arrayNameOf('scalar:a:b') === 'a:b' && arrayNameOf('plain') === 'plain', 'arrayNameOf: 앞의 종류만 뗀다(이름 안의 콜론은 둔다)');
ok(ROOT_NODE_ID === 'root', '데이터 노드 id = AppCore.ROOT_ID(root)');

// ---- 데이터 노드 · 기본 배열 ----
eq(usedArrays(input([])), [], '노드도 색도 기본 배열도 없으면 빈 목록');
eq(usedArrays(input([], { rootColor: 'vector:velocity', def: 'vector:velocity' })), ['velocity'], '처음 연 장면(데이터 Outline 의 색 = 기본 배열): 기본 Field 하나');
eq(usedArrays(input([], { rootColor: 'scalar:pressure', def: 'vector:velocity' })), ['pressure', 'velocity'], '데이터 색과 기본 배열이 다르면 둘 다');
for (const rep of ['outline', 'featureEdges', 'none', 'surface', 'points', 'volume']) {
  eq(usedArrays(input([], { rep, rootColor: 'scalar:fraction' })), ['fraction'], `데이터 색은 표현 방식(${rep})과 무관하게 넣는다(바꿀 때 기다리지 않게)`);
}
eq(usedArrays(input([], { rootColor: null, def: 'scalar:density' })), ['density'], '데이터가 단색이어도 기본 배열은 넣는다(새 Clip·Threshold·Isosurface 기본값이 쓴다)');
eq(nodeArrays(ROOT_NODE_ID, input([], { rep: 'surface', rootColor: 'scalar:pressure', def: 'vector:velocity' })), ['pressure'], 'nodeArrays(데이터 Surface): 데이터 색만 (기본 배열은 데이터 노드가 기대는 배열이 아님)');
// 기다림 판정(nodeArrays)은 표현 방식이 값으로 칠할 때만 볼륨 노드의 색을 넣는다 (AppCore.colorsByField 와 같은 기준 — 검토 반영 2026-11-06)
for (const [rep, want] of [['outline', []], ['featureEdges', []], ['none', []], ['surface', ['fraction']], ['points', ['fraction']], ['volume', ['fraction']]]) {
  eq(nodeArrays(ROOT_NODE_ID, input([], { rep, rootColor: 'scalar:fraction' })), want, `nodeArrays(데이터 ${rep}): 색 배열을 ${want.length ? '기다림' : '기다리지 않음(그리지 않는 표현)'}`);
}

// ---- Slice ----
{
  const s = slice('scalar:temperature');
  eq(usedArrays(input([s])), ['temperature'], 'Slice: 색(Field)');
  eq(nodeArrays(s.id, input([s])), ['temperature'], 'nodeArrays(Slice): 색');
  eq(usedArrays(input([slice(null)])), [], 'Slice 색이 비면 없음');
}

// ---- Clip: Plane·Box 는 Field 를 쓰지 않고 Scalar 만 ----
{
  const p = clip('plane', 'scalar:pressure'), b = clip('box', 'scalar:pressure'), sc = clip('scalar', 'scalar:pressure');
  eq(usedArrays(input([p])), [], 'Clip Plane: 남아 있는 Field(Scalar 칸)는 읽지 않는다');
  eq(usedArrays(input([b])), [], 'Clip Box: 남아 있는 Field 는 읽지 않는다');
  eq(usedArrays(input([sc])), ['pressure'], 'Clip Scalar: Field');
  const vc = clip('plane', null, { color: 'scalar:density' });
  eq(usedArrays(input([vc])), ['density'], '볼륨 위 Clip: 자기 색(view.color)');
  eq(nodeArrays(vc.id, input([vc])), ['density'], 'nodeArrays(볼륨 위 Plane Clip): 자기 색만');
  const vs = clip('scalar', 'vector:force', { color: 'scalar:density' });
  eq(nodeArrays(vs.id, input([vs])), ['force', 'density'], 'nodeArrays(볼륨 위 Scalar Clip): 자기 Field + 자기 색');
  // 볼륨 위 Clip·Threshold 를 Outline 으로 그리면 색 배열은 기다리지 않는다(거르는 Field 는 그대로) — 읽어 둘 배열에는 넣는다
  const vo = clip('scalar', 'vector:force', { view: view('outline', 'scalar:density') });
  eq(nodeArrays(vo.id, input([vo])), ['force'], 'nodeArrays(Outline 인 볼륨 위 Scalar Clip): 자기 Field 만 (칠하지 않는 색은 기다리지 않음)');
  eq(usedArrays(input([vo])), ['force', 'density'], 'usedArrays(Outline 인 볼륨 위 Scalar Clip): 색도 읽어 둠 (표현을 바꿀 때 기다리지 않게)');
  const to = thr('scalar:fraction', { view: view('featureEdges', 'vector:velocity') });
  eq(nodeArrays(to.id, input([to])), ['fraction'], 'nodeArrays(Feature Edges 인 볼륨 위 Threshold): 자기 Field 만');
  const tp = thr('scalar:fraction', { view: view('points', 'vector:velocity') });
  eq(nodeArrays(tp.id, input([tp])), ['fraction', 'velocity'], 'nodeArrays(Points 인 볼륨 위 Threshold): 자기 Field + 자기 색');
}

// ---- Threshold ----
{
  const t = thr('scalar:fraction', { color: 'vector:velocity' });
  eq(usedArrays(input([t])), ['fraction', 'velocity'], 'Threshold: Field(늘) + 볼륨 위면 자기 색');
  eq(usedArrays(input([thr(null)])), [], 'Threshold Field 가 비면 없음');
}

// ---- Glyph · Streamline: Field(벡터) + 색(단색이면 뺌) ----
{
  eq(usedArrays(input([glyph('force', 'field', 'scalar:pressure')])), ['force', 'pressure'], 'Glyph(색 = 배열): Field + 색');
  eq(usedArrays(input([glyph('force', 'white', 'scalar:pressure')])), ['force'], 'Glyph(단색 흰색): Field 만');
  eq(usedArrays(input([glyph('force', 'black', 'scalar:pressure')])), ['force'], 'Glyph(단색 검정): Field 만');
  eq(usedArrays(input([glyph(null, 'white', null)])), [], 'Glyph Field 가 비면 없음');
  eq(usedArrays(input([stream('velocity', 'field', 'scalar:temperature')])), ['velocity', 'temperature'], 'Streamline(색 = 배열): Field + 색');
  eq(usedArrays(input([stream('velocity', 'solid', 'scalar:temperature')])), ['velocity'], 'Streamline(단색): Field 만');
  eq(usedArrays(input([glyph('pressure', 'white', null)])), [], "Glyph Field 는 벡터로 본다('vector:pressure' 는 목록에 없음)");
}

// ---- Isosurface: Field + 색(단색이면 뺌) ----
{
  eq(usedArrays(input([iso('scalar:fraction', 'field', 'vector:velocity')])), ['fraction', 'velocity'], 'Isosurface(색 = 배열): Field + 색');
  eq(usedArrays(input([iso('scalar:fraction', 'solid', 'vector:velocity')])), ['fraction'], 'Isosurface(단색): Field 만');
  eq(usedArrays(input([iso('vector:force', 'solid', null)])), ['force'], 'Isosurface: 벡터 Field(크기)도 그 배열');
}

// ---- 숨긴 노드 · 머리 정보에 없는 Field · 겹친 이름 ----
{
  eq(usedArrays(input([slice('scalar:density', { visible: false })])), ['density'], '숨긴 노드의 배열도 넣는다(켤 때 기다리지 않게)');
  eq(usedArrays(input([slice('scalar:nope'), thr('scalar:gone')], { def: 'scalar:missing' })), [], '머리 정보에 없는 Field 는 뺀다(장면 JSON 의 옛 Field 등)');
  eq(usedArrays(input([slice('scalar:velocity')])), [], "종류가 다른 key 도 뺀다('scalar:velocity' — 목록에는 벡터)");
  eq(usedArrays(input([slice('vector:velocity'), glyph('velocity', 'field', 'vector:velocity'), thr('vector:velocity')], { rootColor: 'vector:velocity', def: 'vector:velocity' })), ['velocity'], '겹친 이름은 한 번');
  eq(usedArrays(input([slice('scalar:pressure')], { catalog: new Set() })), [], '머리 정보가 비면 아무것도 읽지 않는다');
  const got = usedArrays(input([slice('scalar:temperature'), thr('scalar:fraction')], { rootColor: 'vector:velocity', def: 'scalar:density' }));
  ok(got.join(',') === 'velocity,temperature,fraction,density', '차례: 데이터 색 → 노드 트리 차례 → 기본 배열', got.join(','));
}

// ---- 사슬: 노드 하나가 기대는 배열 = 노드 + 조상 Clip(Scalar)·Threshold ----
{
  const c1 = clip('scalar', 'scalar:pressure', { color: 'scalar:density' });                  // 데이터 아래 Scalar Clip (볼륨 위)
  const t1 = thr('scalar:fraction', { parentId: c1.id, color: 'scalar:temperature' });          // 그 아래 Threshold (볼륨 위)
  const s1 = slice('vector:velocity', { parentId: t1.id });                                       // 그 아래 Slice
  const c2 = clip('box', 'scalar:temperature', { parentId: s1.id, color: 'scalar:density' });    // Slice 아래 Box Clip (면 위)
  const c3 = clip('scalar', 'vector:force', { parentId: c2.id, color: 'scalar:pressure' });       // 그 아래 Scalar Clip (면 위)
  const p1 = clip('plane', 'scalar:pressure');                                                    // 형제: 데이터 아래 Plane Clip
  const s2 = slice('scalar:temperature', { parentId: p1.id });                                    // Plane Clip 아래 Slice
  const g1 = glyph('force', 'white', null, { parentId: t1.id });                                  // Threshold 아래 Glyph (형제 가지)
  const all = [c1, t1, s1, c2, c3, p1, s2, g1];
  const I = input(all, { rootColor: 'vector:velocity', def: 'vector:velocity' });
  eq(nodeArrays(c1.id, I), ['pressure', 'density'], 'Scalar Clip(볼륨 위): 자기 Field + 자기 색');
  eq(nodeArrays(t1.id, I), ['pressure', 'fraction', 'temperature'], 'Threshold(Scalar Clip 아래): 조상 Clip Field + 자기 Field + 자기 색 (조상의 색은 아님)');
  eq(nodeArrays(s1.id, I), ['pressure', 'fraction', 'velocity'], 'Slice(Clip → Threshold 아래): 조상 사슬 Field + 자기 색');
  eq(nodeArrays(c2.id, I), ['pressure', 'fraction', 'velocity'], 'Slice 위 Box Clip: 입력(Slice)의 색 + Slice 의 사슬 (자기 view.color 는 쓰지 않음, Box 는 Field 없음)');
  eq(nodeArrays(c3.id, I), ['pressure', 'fraction', 'velocity', 'force'], 'Slice 위 Box Clip 위 Scalar Clip: 사슬 전부 + 자기 Field + 입력(Slice)의 색');
  ok(!nodeArrays(c3.id, I).includes('density') && !nodeArrays(c2.id, I).includes('density'), '면 위 Clip 의 view.color(density)는 기대는 배열에 없다');
  eq(nodeArrays(s2.id, I), ['temperature'], 'Plane Clip 아래 Slice: Plane 은 Field 를 쓰지 않아 자기 색만');
  eq(nodeArrays(g1.id, I), ['pressure', 'fraction', 'force'], 'Threshold 아래 Glyph(단색): 사슬 Field + 벡터 Field');
  ok(!nodeArrays(s1.id, I).includes('force'), '형제·자손 가지의 배열(Glyph force · 아래 Scalar Clip force)은 넣지 않는다');
  eq(usedArrays(I), ['velocity', 'pressure', 'density', 'fraction', 'temperature', 'force'], '쓰는 배열: 면 위 Clip 의 view.color 를 빼고 모두 (density 는 볼륨 위 Clip 의 색으로 들어옴)');
  const union = new Set([...nodeArrays(ROOT_NODE_ID, I), ...all.flatMap((l) => nodeArrays(l.id, I)), 'velocity']);
  eq(usedArrays(I), [...union], '쓰는 배열 = 모든 노드의 기대는 배열 ∪ 기본 배열');
  // 면 위 Clip 하나만 볼륨 위로 옮기면 그 색이 들어온다
  const lone = clip('box', null, { color: 'scalar:density' });
  eq(usedArrays(input([slice('vector:velocity'), lone])), ['velocity', 'density'], '같은 Clip 을 볼륨 위에 두면 자기 색을 쓴다');
}

// ---- 이상한 입력 ----
{
  eq(nodeArrays('없는-노드', input([slice('scalar:pressure')])), [], '없는 노드는 빈 목록');
  const a = thr('scalar:pressure', { id: 'A', parentId: 'B' });
  const b = thr('scalar:fraction', { id: 'B', parentId: 'A' });
  eq(nodeArrays('A', input([a, b])), ['fraction', 'pressure'], 'parentId 고리에서도 멈춘다');
  const orphan = slice('scalar:density', { parentId: '사라진-상위' });
  eq(nodeArrays(orphan.id, input([orphan])), ['density'], '상위를 찾지 못한 노드는 자기 배열만');
}

console.log(`\n통과 ${pass}, 실패 ${fail}`);
process.exit(fail ? 1 : 0);

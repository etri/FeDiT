#!/usr/bin/env node
// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   test_up_axis.mjs

src/core/upAxis.ts(화면에서 위로 세울 축)의 Node 시험. TS 를 바로 못 돌리므로 esbuild(vite 가 깔아 둔 것)로
메모리에서 ES 모듈 하나로 묶어(파일을 쓰지 않음) data: 주소로 불러 쓴다.
확인: upFromInput 규칙 표(중력 반대 방향 · 크기가 같으면 Z>Y>X · 중력 0 이면 2D 는 +Y · 칸 없음 · 숫자 아닌 값),
회전표 여섯 개(R·(0,0,1) = 위쪽 · 행렬식 +1 · fromZUp 이 행렬과 같음 · +Z 는 그대로 = 도시 예제 시점 그대로),
+Y 표로 '측면' (0,-1,0.15) → (0,0.15,1), zSingleLayer(한 층 · 두 층 · 여러 레벨 · 빈 블록), zCellLayers(전처리 Z 셀 수),
전처리 템플릿 다섯 개의 처음 위쪽(public/templates — pre/state.ts adopt 와 같은 readCore · zCellLayers · upFromInput, base_dx 칸 없음 포함),
seedPlaneAxes(Streamline 시작면의 가로·세로 축 — +Z 는 고치기 전 규칙 그대로, Z 한 층 2D 를 +Y 로 볼 때 시작점이 겹치지 않음),
three 의 OrbitControls 에 회전 기준(_quat · _quatInverse)이 있고 AppCore.applyUp 처럼 다시 계산하면 가로 회전이 새 위쪽 축을 중심으로 도는지
(three 판을 올려 내부 필드가 바뀌면 여기서 잡힌다).

실행: node scripts/test_up_axis.mjs
*/
/******************************************************************************/

import { build } from 'esbuild';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ---------- 묶기(메모리) ----------
const bundle = async (rel) => {
  const res = await build({
    entryPoints: [path.join(ROOT, rel)],
    bundle: true, platform: 'neutral', format: 'esm', target: 'es2022', write: false, logLevel: 'silent',
  });
  return import(`data:text/javascript;base64,${Buffer.from(res.outputFiles[0].text).toString('base64')}`);
};
const m = await bundle('src/core/upAxis.ts');

let fail = 0, pass = 0;
const check = (ok, msg) => { console.log(`${ok ? 'PASS' : 'FAIL'} ${msg}`); if (ok) pass++; else fail++; };
const eq = (got, want, msg) => check(isDeepStrictEqual(got, want), isDeepStrictEqual(got, want) ? msg : `${msg} — 기대 ${JSON.stringify(want)}, 실제 ${JSON.stringify(got)}`);
const near = (a, b) => a.length === b.length && a.every((x, i) => Math.abs(x - b[i]) < 1e-12);
const clean = (v) => v.map((x) => (Object.is(x, -0) ? 0 : x)); // -0 과 0 을 같게 본다

// ---------- 기본 ----------
console.log('\n== 기본');
eq(m.UP_AXES, ['+X', '-X', '+Y', '-Y', '+Z', '-Z'], 'UP_AXES 차례 (도구막대 선택지)');
eq(m.DEFAULT_UP, '+Z', '처음 값 +Z');
eq(m.UP_AXES.map((u) => m.isUpAxis(u)), [true, true, true, true, true, true], 'isUpAxis: 여섯 개');
eq(['Z', '+z', 'up', '', null, undefined, 2, '−Z'].map((u) => m.isUpAxis(u)), [false, false, false, false, false, false, false, false], 'isUpAxis: 틀린 값(장면 JSON)은 아님 · 유니코드 빼기(−)도 아님');
eq(m.UP_AXES.map((u) => [m.upIndex(u), m.upSign(u)]), [[0, 1], [0, -1], [1, 1], [1, -1], [2, 1], [2, -1]], 'upIndex · upSign');
eq(m.UP_AXES.map((u) => clean(m.upVector(u))), [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]], 'upVector');
eq(['+Z', '+Y', '+X'].map((u) => m.horizontalAxes(u)), [[0, 1], [2, 0], [1, 2]], 'horizontalAxes: +Z → X·Y (격자 크기 = 예전과 같음), +Y → Z·X, +X → Y·Z');

// ---------- upFromInput (설계 tests 절의 표) ----------
console.log('\n== upFromInput');
const rules = [
  [[0, -9.81, 0], false, '+Y', '유체-입자 [0,-9.81,0]'],
  [[0, -1, 0], false, '+Y', '열전달 [0,-1,0]'],
  [[0, 0, -1.25e-05], false, '+Z', '다성분 [0,0,-1.25e-05]'],
  [[0, 9.81, 0], false, '-Y', '[0,9.81,0] → -Y'],
  [[3, -4, 0], false, '+Y', '대각선 [3,-4,0] → 가장 큰 성분 +Y'],
  [[-1, -1, 0], false, '+Y', '[-1,-1,0] 크기가 같으면 Z>Y>X → +Y'],
  [[-1, -1, -1], false, '+Z', '[-1,-1,-1] 셋이 같으면 +Z'],
  [[2, 0, 0], false, '-X', '[2,0,0] → -X'],
  [[0, 0, 5], true, '-Z', '[0,0,5] → -Z (2D 여도 중력이 먼저)'],
  [[0, 0, 0], true, '+Y', '중력 0 + Z 한 층(2D) → +Y'],
  [[0, 0, 0], false, '+Z', '중력 0 · 3D → +Z'],
  [undefined, false, '+Z', '중력 칸 없음 → +Z'],
  [undefined, true, '+Y', '중력 칸 없음 + 입력 JSON 있고 Z 한 층 → +Y'],
  [null, false, '+Z', 'null → +Z'],
  [[0, -9.81], false, '+Z', '성분 둘 → 없는 것으로'],
  [['0', '-9.81', '0'], false, '+Z', '글자 → 없는 것으로'],
  [[0, Number.NaN, 0], false, '+Z', 'NaN → 없는 것으로'],
  [{ 0: 0, 1: -9.81, 2: 0, length: 3 }, false, '+Z', '배열 아닌 객체 → 없는 것으로'],
];
for (const [g, z, want, msg] of rules) eq(m.upFromInput(g, z), want, msg);

// ---------- 회전표 ----------
console.log('\n== 회전표 (fromZUp · upMatrix)');
const det = (a) => a[0][0] * (a[1][1] * a[2][2] - a[1][2] * a[2][1]) - a[0][1] * (a[1][0] * a[2][2] - a[1][2] * a[2][0]) + a[0][2] * (a[1][0] * a[2][1] - a[1][1] * a[2][0]);
const mul = (a, v) => a.map((row) => row[0] * v[0] + row[1] * v[1] + row[2] * v[2]);
for (const u of m.UP_AXES) {
  const R = m.upMatrix(u);
  eq(clean(m.fromZUp(u, [0, 0, 1])), clean(m.upVector(u)), `${u}: R·(0,0,1) = 위쪽`);
  eq(det(R), 1, `${u}: 행렬식 +1 (오른손 좌표계 유지 · 거울상 아님)`);
  const samples = [[1, 0, 0], [0, 1, 0], [-0.7, -1, 0.75], [0, -0.001, 1], [0.3, -2, 5]];
  check(samples.every((v) => near(m.fromZUp(u, v), mul(R, v))), `${u}: fromZUp = 행렬 곱`);
  const RtR = [0, 1, 2].map((i) => [0, 1, 2].map((j) => R[0][i] * R[0][j] + R[1][i] * R[1][j] + R[2][i] * R[2][j]));
  eq(RtR, [[1, 0, 0], [0, 1, 0], [0, 0, 1]], `${u}: 회전(직교 행렬)`);
}
// 설계 rule 칸의 대응을 글자 그대로 (a,b,c) = (1,2,3)
const abc = [1, 2, 3];
eq(['+Z', '+Y', '-Y', '+X', '-X', '-Z'].map((u) => m.fromZUp(u, abc)), [[1, 2, 3], [1, 3, -2], [1, -3, 2], [3, 1, 2], [-3, 1, -2], [1, -2, -3]], '대응표: +Z 그대로 · +Y (a,c,-b) · -Y (a,-c,b) · +X (c,a,b) · -X (-c,a,-b) · -Z (a,-b,-c)');
eq(m.fromZUp('+Y', [0, -1, 0.15]), [0, 0.15, 1], '+Y 표로 측면 (0,-1,0.15) → (0,0.15,1): +Z 쪽에서 XY 면을 본다');
// 도시 예제(+Z)의 보기 단추 방향은 예전 상수 그대로 (AppCore.fitView)
const oldDirs = [[0, -0.001, 1], [-1, 0, 0.15], [-1, 0, 0], [0, -1, 0.15], [0, -1, 0], [-1, -1, 1], [-0.7, -1, 0.75]];
eq(oldDirs.map((d) => m.fromZUp('+Z', d)), oldDirs, '+Z: 보기 방향 일곱 개(평면 · 정면 원근/직교 · 측면 원근/직교 · 등각 직교/원근)가 예전과 같다');
// +Y: '평면'은 +Y 에서 내려다보고, '정면'은 -X 에서, 등각은 위(+Y) 쪽에서 비스듬히
check(m.fromZUp('+Y', [0, -0.001, 1])[1] === 1, '+Y: 평면은 +Y 쪽에서 내려다본다');
check(m.fromZUp('+Y', [-1, 0, 0.15])[0] === -1 && m.fromZUp('+Y', [-1, 0, 0.15])[1] === 0.15, '+Y: 정면은 -X 쪽에서 (조금 위에서)');
check(m.fromZUp('+Y', [-0.7, -1, 0.75])[1] > 0, '+Y: 등각은 위쪽(+Y)에서 비스듬히 내려다본다');

// ---------- zSingleLayer ----------
console.log('\n== zSingleLayer (후처리 2D 판정)');
const blk = (zmin, zmax, spacing, count = 10) => ({ count, spacing, bounds: { min: [0, 0, zmin], max: [1, 1, zmax] } });
eq(m.zSingleLayer([blk(0.5, 0.5, 1)]), true, '한 층(셀 중심 z 폭 0) → 2D');
eq(m.zSingleLayer([blk(0.5, 1.5, 1)]), false, '두 층(폭 = 한 간격) → 3D');
eq(m.zSingleLayer([blk(0.5, 0.5, 1), blk(0.25, 0.25, 0.5)]), true, '여러 레벨이 모두 한 층 → 2D');
eq(m.zSingleLayer([blk(0.5, 0.5, 1), blk(0.25, 0.75, 0.5)]), false, '한 레벨이라도 두 층 → 3D');
eq(m.zSingleLayer([blk(0.5, 0.5, 1), blk(0, 9, 1, 0)]), true, '셀 없는 블록은 뺀다');
eq(m.zSingleLayer([]), false, '블록 없음 → 아님');

// ---------- zCellLayers ----------
console.log('\n== zCellLayers (전처리 2D 판정 — 계산 영역 Z 셀 수)');
eq([m.zCellLayers(0, 1, 1), m.zCellLayers(0, 0.1, 1), m.zCellLayers(-0.05, 0.05, 0.004), m.zCellLayers(0, 512, 1), m.zCellLayers(0, 1, 0), m.zCellLayers(0, 1, Number.NaN)],
  [1, 1, 25, 512, 0, 0], '한 층 · 한 셀보다 얇아도 1 · 25층 · 512층 · base_dx 0 → 0 · NaN → 0');

// ---------- 전처리 템플릿 (public/templates) — pre/state.ts adopt 와 같은 함수(readCore · zCellLayers · upFromInput) ----------
console.log('\n== 전처리 템플릿의 처음 위쪽 (readCore → upFromInput(gravity, zCellLayers === 1))');
const pre = await bundle('src/pre/solverInput.ts');
const coreUp = (doc) => {
  const core = pre.readCore(doc);
  return m.upFromInput(core.gravity, m.zCellLayers(core.domain.min[2], core.domain.max[2], core.domain.baseDx) === 1);
};
const tpl = (name) => JSON.parse(readFileSync(path.join(ROOT, 'public/templates', name), 'utf8'));
eq(['fluid_dem.json', 'thermal.json', 'multi_component.json', 'multiphase.json', 'concentration_diffusion.json'].map((n) => coreUp(tpl(n))), ['+Y', '+Y', '+Z', '+Y', '+Y'],
  '유체-입자 +Y · 열전달 +Y · 다성분 +Z · 다상(2D) +Y · 농도확산(2D) +Y');
{
  // base_dx 칸이 없으면 readCore 가 1 로 읽는다(내보낼 때도 1) — 그 값으로 센다. 다성분(중력 -Z)은 중력이 먼저라 그대로 +Z
  const noDx = (name) => { const d = tpl(name); delete d.config.lattice_generation[0].base_dx; return d; };
  eq(pre.readCore(noDx('multi_component.json')).domain.baseDx, 1, 'base_dx 없음 → readCore 는 1');
  eq(coreUp(noDx('multi_component.json')), '+Z', 'base_dx 없음 · 중력 -Z → +Z (중력이 먼저)');
  eq(coreUp(noDx('concentration_diffusion.json')), '+Y', 'base_dx 없음 · 중력 0 · Z 폭 1 → base_dx 1 로 한 층 → +Y');
}

// ---------- seedPlaneAxes (Streamline 시작면의 가로·세로 축) ----------
console.log('\n== seedPlaneAxes (AppCore.streamSeeds)');
const box3 = [[0, 0, 0], [10, 8, 6]];          // 3D
const boxZ1 = [[0, 0, 0.5], [10, 8, 0.5]];     // Z 한 층(셀 중심 z 폭 0)
const boxY1 = [[0, 0.5, 0], [10, 0.5, 6]];     // Y 한 층
const sp = (A, up, box, s = 1) => { const r = m.seedPlaneAxes(A, up, box[0], box[1], s); return [r.b, r.c, r.down]; };
const oldRule = (A) => [A === 0 ? 1 : 0, A === 2 ? 1 : 2, false];
eq([0, 1, 2].map((A) => sp(A, '+Z', box3)), [0, 1, 2].map(oldRule), '+Z · 3D: 시작면 X·Y·Z 모두 고치기 전 규칙 그대로(도시 예제)');
eq([0, 1, 2].map((A) => sp(A, '+Z', boxZ1)), [0, 1, 2].map(oldRule), '+Z · Z 한 층: 고치기 전 규칙 그대로');
eq([0, 1, 2].map((A) => sp(A, '+Z', boxY1)), [0, 1, 2].map(oldRule), '+Z · Y 한 층: 고치기 전 규칙 그대로(납작한 축이 있어도 +Z 는 바뀌지 않음)');
eq(sp(0, '+Y', box3), [2, 1, false], '+Y · 3D · 시작면 X: 세로 = Y(위쪽), 가로 = Z');
eq(sp(0, '-Y', box3), [2, 1, true], '-Y · 3D · 시작면 X: 세로 = Y, 아래는 큰 쪽');
eq(sp(1, '+Y', box3), [0, 2, false], '+Y · 시작면 Y(= 위쪽): 남은 축 Z 가 세로');
eq(sp(0, '+X', box3), [1, 2, false], '+X · 시작면 X(= 위쪽): 고치기 전 규칙(가로 Y · 세로 Z)');
eq(sp(1, '+X', box3), [2, 0, false], '+X · 시작면 Y: 세로 = X(위쪽), 가로 = Z');
eq(sp(0, '+Y', boxZ1), [1, 2, false], '+Y · Z 한 층(2D) · 시작면 X: 가로가 납작한 Z 라 고치기 전 규칙(가로 Y) — 14개가 한 자리에 겹치지 않는다');
eq(sp(2, '+Y', boxZ1), [0, 1, false], '+Y · Z 한 층 · 시작면 Z: 가로 X · 세로 Y 그대로');
eq(sp(0, '-Y', boxZ1), [1, 2, false], '-Y · Z 한 층 · 시작면 X: 고치기 전 규칙(세로가 위쪽 축이 아니므로 down 아님)');

// ---------- three OrbitControls 회전 기준 ----------
console.log('\n== three OrbitControls 회전 기준 (AppCore.applyUp 이 다시 계산하는 내부 필드)');
const THREE = await import('three');
const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');
console.log(`three ${THREE.REVISION}`);
const makeControls = () => {
  const cam = new THREE.PerspectiveCamera(45, 1, 0.01, 1000);
  cam.up.set(0, 0, 1);
  cam.position.set(1, -2, 0.5);
  const c = new OrbitControls(cam); // 화면 요소 없이 (마우스 연결 안 함)
  c.target.set(0, 0, 0);
  c.update();
  return { cam, c };
};
{
  const { c } = makeControls();
  check(c._quat instanceof THREE.Quaternion, 'OrbitControls._quat 가 Quaternion');
  check(c._quatInverse instanceof THREE.Quaternion, 'OrbitControls._quatInverse 가 Quaternion');
  check(typeof c._rotateLeft === 'function', 'OrbitControls._rotateLeft 가 있음 (아래 회전 시험용)');
}
if (typeof makeControls().c._rotateLeft === 'function') {
  // applyUp 과 같은 순서: 카메라 up 을 +Y 로, 회전 기준을 다시 계산 → 가로 회전은 Y 축 중심(카메라 y 가 그대로)
  const applyUp = (cam, c, v) => {
    cam.up.set(v[0], v[1], v[2]);
    c._quat.setFromUnitVectors(cam.up, new THREE.Vector3(0, 1, 0));
    c._quatInverse.copy(c._quat).invert();
    c.update();
  };
  for (const [name, v, k] of [['+Y', [0, 1, 0], 1], ['-Y', [0, -1, 0], 1], ['+X', [1, 0, 0], 0], ['-Z', [0, 0, -1], 2], ['+Z', [0, 0, 1], 2]]) {
    const { cam, c } = makeControls();
    c.enableDamping = false;
    applyUp(cam, c, v);
    const before = cam.position.getComponent(k), dist = cam.position.length();
    c._rotateLeft(0.6); c.update();
    const after = cam.position.getComponent(k);
    check(Math.abs(after - before) < 1e-9 && Math.abs(cam.position.length() - dist) < 1e-9, `${name}: 회전 기준을 다시 계산하면 가로로 돌려도 위쪽 축 좌표가 그대로 (${before.toFixed(6)} → ${after.toFixed(6)})`);
  }
  // 대조: 다시 계산하지 않으면 옛 축(Z)으로 돌아 y 가 바뀐다 — 위 시험이 뜻이 있음을 보인다
  const { cam, c } = makeControls();
  c.enableDamping = false;
  cam.up.set(0, 1, 0);
  const before = cam.position.y;
  c._rotateLeft(0.6); c.update();
  check(Math.abs(cam.position.y - before) > 1e-3, `대조: 회전 기준을 그대로 두면 y 가 바뀐다 (${before.toFixed(4)} → ${cam.position.y.toFixed(4)})`);
}

console.log(`\n${pass} 통과 · ${fail} 실패`);
process.exit(fail ? 1 : 0);

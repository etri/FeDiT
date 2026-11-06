#!/usr/bin/env node
// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   test_fit_frame.mjs

src/core/fitFrame.ts(화면 맞춤 거리)의 Node 시험. esbuild 로 메모리에서 묶어(파일을 쓰지 않음) data: 주소로 불러 쓴다.
확인: 맞춘 거리에서 상자 꼭짓점 8개가 모두 시야(가로는 패널에 가려지지 않은 부분) 안에 들고, 여유 1 이면 적어도 한 꼭짓점이 끝에 닿음 ·
유체-입자 영역(0.2 × 0.15 × 0.1 m, +Y 위쪽 등각)에서 예전 식(가장 긴 변 × 0.9)이 꼭짓점을 화면 밖으로 내보냈던 것 ·
직교 세로 길이가 꼭짓점을 다 담음 · 위쪽과 시선이 나란할 때('평면')도 값이 나옴.

실행: node scripts/test_fit_frame.mjs
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
const { fitBox } = await bundle('src/core/fitFrame.ts');
const up = await bundle('src/core/upAxis.ts');

let fail = 0, pass = 0;
const ok = (cond, name, extra = '') => { if (cond) { pass++; console.log(`PASS ${name}`); } else { fail++; console.log(`FAIL ${name} ${extra}`); } };

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => { const l = Math.hypot(...a); return a.map((x) => x / l); };
/** 카메라를 가운데 + dir*dist 에 두고 꼭짓점마다 화면 위치(가로·세로 tan 비)를 잰다. 가장 바깥 비율(1 = 끝)을 돌려준다 */
function worstRatio(min, max, dir, upv, dist, tanV, tanH) {
  const d = norm(dir), f = d.map((x) => -x);
  let right = cross(f, upv); if (Math.hypot(...right) < 1e-9) right = cross(f, [1, 0, 0]); right = norm(right);
  const tu = cross(right, f);
  const c = min.map((v, i) => (v + max[i]) / 2);
  let worst = 0;
  for (let i = 0; i < 8; i++) {
    const p = [i & 1 ? max[0] : min[0], i & 2 ? max[1] : min[1], i & 4 ? max[2] : min[2]];
    const v = p.map((x, k) => x - c[k]);
    const depth = dist - dot(v, d);
    if (depth <= 0) return Infinity; // 카메라 뒤(상자 안에 들어감)
    worst = Math.max(worst, Math.abs(dot(v, right)) / depth / tanH, Math.abs(dot(v, tu)) / depth / tanV);
  }
  return worst;
}

const tanV = Math.tan((45 / 2) * Math.PI / 180);
const visible = 1 / 3; // 패널(384px)이 창 왼쪽을 덮을 때와 비슷한 비율
const aspect = 1.8;
const tanH = tanV * aspect * visible;

// 1) 유체-입자 영역, +Y 위쪽, 원근 등각
{
  const min = [0, 0, -0.05], max = [0.2, 0.15, 0.05];
  const dir = up.fromZUp('+Y', [-0.7, -1, 0.75]);
  const upv = up.upVector('+Y');
  const r = fitBox(min, max, dir, upv, tanV, tanH, 1);
  const w = worstRatio(min, max, dir, upv, r.dist, tanV, tanH);
  ok(Math.abs(w - 1) < 1e-6, '유체-입자 등각: 여유 1 이면 가장 바깥 꼭짓점이 화면 끝에 닿음', `worst=${w}`);
  const r2 = fitBox(min, max, dir, upv, tanV, tanH, 1.05);
  ok(worstRatio(min, max, dir, upv, r2.dist, tanV, tanH) < 1, '유체-입자 등각: 여유 1.05 면 모두 화면 안');
  // 예전 식: 가장 긴 변 기준 × 0.9
  const size = 0.2, oldDist = Math.max(size / (2 * tanV), size / (2 * tanH)) * 0.9;
  ok(worstRatio(min, max, dir, upv, oldDist, tanV, tanH) > 1, '예전 식은 꼭짓점을 화면 밖으로 냈다(고친 까닭)', `old worst=${worstRatio(min, max, dir, upv, oldDist, tanV, tanH)}`);
}

// 2) 도시 예제 규모(244 × 164 × 80 m), +Z, 원근 등각·평면·정면·측면 — 모두 화면 안
for (const [name, zdir] of [['등각', [-0.7, -1, 0.75]], ['평면', [0, -0.001, 1]], ['정면', [-1, 0, 0.15]], ['측면', [0, -1, 0.15]]]) {
  const min = [0, 0, 0], max = [244, 164, 80];
  const dir = up.fromZUp('+Z', zdir), upv = up.upVector('+Z');
  const r = fitBox(min, max, dir, upv, tanV, tanH, 1.05);
  const w = worstRatio(min, max, dir, upv, r.dist, tanV, tanH);
  ok(w < 1 && w > 0.85, `도시 ${name}: 모두 화면 안이고 너무 멀지 않음`, `worst=${w}`);
}

// 3) 직교: 세로 길이가 꼭짓점을 다 담음
{
  const min = [0, 0, -0.05], max = [0.2, 0.15, 0.05];
  const dir = norm(up.fromZUp('+Y', [-1, -1, 1])), upv = up.upVector('+Y');
  const r = fitBox(min, max, dir, upv, tanV, tanH, 1);
  const f = dir.map((x) => -x); const right = norm(cross(f, upv)); const tu = cross(right, f);
  const c = min.map((v, i) => (v + max[i]) / 2);
  let hx = 0, hy = 0;
  for (let i = 0; i < 8; i++) { const p = [i & 1 ? max[0] : min[0], i & 2 ? max[1] : min[1], i & 4 ? max[2] : min[2]]; const v = p.map((x, k) => x - c[k]); hx = Math.max(hx, Math.abs(dot(v, right))); hy = Math.max(hy, Math.abs(dot(v, tu))); }
  const halfH = r.orthoHeight / 2, halfW = halfH * (tanH / tanV);
  ok(hy <= halfH + 1e-9 && hx <= halfW + 1e-9 && (Math.abs(hy - halfH) < 1e-9 || Math.abs(hx - halfW) < 1e-9), '직교 등각: 세로 길이가 꼭짓점을 딱 맞게 담음');
}

// 4) 시선이 위쪽과 나란한 경우(평면을 정확히 위에서): 값이 유한
{
  const r = fitBox([0, 0, 0], [1, 1, 1], [0, 0, 1], [0, 0, 1], tanV, tanH, 1.05);
  ok(Number.isFinite(r.dist) && r.dist > 0 && Number.isFinite(r.orthoHeight), '시선 ∥ 위쪽: 거리·세로 길이가 유한');
}

console.log(fail ? `\n실패 ${fail} · 통과 ${pass}` : `\n모두 통과 (통과 ${pass})`);
process.exit(fail ? 1 : 0);

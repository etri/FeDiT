#!/usr/bin/env node
// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   test_feature_edges.mjs

src/analysis/featureEdges.ts(Feature Edges 표현 — 모양이 꺾이는 모서리만 선으로)의 Node 시험. esbuild 로 메모리에서 묶어(파일을 쓰지 않음) data: 주소로 불러 쓴다.
확인: 셀 하나 = 모서리 12개 · 이어 붙인 두 셀 = 맞닿은 면에 선 없음(여전히 12개) · ㄱ자 셀 셋 = 꺾인 곳 선 18개 ·
대각으로 모서리만 닿은 두 셀 = 닿은 모서리도 그림(셋 이상 만남) · 굵은 셀 하나 + 고운 셀 8개를 이어 붙인 다중 레벨 = 레벨 경계에 선 없음(12개) ·
큰 덩어리(60×60×30)의 계산 시간.

실행: node scripts/test_feature_edges.mjs
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
const { extractFeatureEdges } = await bundle('src/analysis/featureEdges.ts');
const { extractCellSurface, mergeCellSurfaces } = await bundle('src/analysis/cellSurface.ts');

let fail = 0, pass = 0;
const ok = (cond, name, extra = '') => { if (cond) { pass++; console.log(`PASS ${name}`); } else { fail++; console.log(`FAIL ${name} ${extra}`); } };

/** 격자 하나: dims, 셀 중심 origin, spacing, 남길 셀 목록([i,j,k]) */
function grid(dims, origin, spacing, keepList) {
  const count = dims[0] * dims[1] * dims[2];
  const occupancy = new Uint8Array(count).fill(1);
  const keep = new Uint8Array(count);
  for (const [i, j, k] of keepList) keep[i + dims[0] * (j + dims[1] * k)] = 1;
  return { g: { dims, origin, spacing, count, coverage: 1, occupancy, pointIndex: new Int32Array(0), scalars: new Map(), vectors: new Map() }, keep };
}
const all = (dims) => { const l = []; for (let k = 0; k < dims[2]; k++) for (let j = 0; j < dims[1]; j++) for (let i = 0; i < dims[0]; i++) l.push([i, j, k]); return l; };
const lines = (seg) => seg.length / 6;
const totalLength = (seg) => { let s = 0; for (let i = 0; i < seg.length; i += 6) s += Math.hypot(seg[i + 3] - seg[i], seg[i + 4] - seg[i + 1], seg[i + 5] - seg[i + 2]); return s; };
const edgesOf = (dims, origin, spacing, keepList) => { const { g, keep } = grid(dims, origin, spacing, keepList); return extractFeatureEdges(extractCellSurface(g, keep, null)); };

// 1) 셀 하나 (0.2 × 0.1 × 0.05)
{
  const e = edgesOf([1, 1, 1], [0, 0, 0], [0.2, 0.1, 0.05], [[0, 0, 0]]);
  ok(lines(e) === 12 && Math.abs(totalLength(e) - 4 * (0.2 + 0.1 + 0.05)) < 1e-6, '셀 하나: 모서리 12개', `lines=${lines(e)} len=${totalLength(e)}`);
}

// 2) 이어 붙인 두 셀 (x 로 2칸): 맞닿은 면 둘레는 같은 평면이라 그리지 않음 → 상자 하나의 12개, 긴 변은 하나로 합쳐짐
{
  const e = edgesOf([2, 1, 1], [0.5, 0.5, 0.5], [1, 1, 1], all([2, 1, 1]));
  ok(lines(e) === 12 && Math.abs(totalLength(e) - 4 * (2 + 1 + 1)) < 1e-6, '이어 붙인 두 셀: 맞닿은 곳에 선 없음(12개)', `lines=${lines(e)} len=${totalLength(e)}`);
}

// 3) ㄱ자(2×2×1 에서 한 칸 뺌): 위·아래 ㄱ 테두리 6+6, 세로 6 = 18
{
  const e = edgesOf([2, 2, 1], [0.5, 0.5, 0.5], [1, 1, 1], [[0, 0, 0], [1, 0, 0], [0, 1, 0]]);
  ok(lines(e) === 18, 'ㄱ자 셀 셋: 꺾인 모서리 18개', `lines=${lines(e)}`);
  // 평평한 바닥(z=0) 안쪽의 셀 경계 두 곳 — (1, 0..1) 과 (0..1, 1) — 에는 선이 없어야 한다 (가운데 점으로 찾음)
  let inner = 0;
  for (let i = 0; i < e.length; i += 6) {
    if (Math.abs(e[i + 2]) > 1e-9 || Math.abs(e[i + 5]) > 1e-9) continue;
    const mx = (e[i] + e[i + 3]) / 2, my = (e[i + 1] + e[i + 4]) / 2;
    if ((Math.abs(mx - 1) < 1e-9 && Math.abs(my - 0.5) < 1e-9) || (Math.abs(mx - 0.5) < 1e-9 && Math.abs(my - 1) < 1e-9)) inner++;
  }
  ok(inner === 0, 'ㄱ자: 평평한 바닥 안쪽 셀 경계에는 선이 없음', `inner=${inner}`);
}

// 4) 대각으로 모서리만 닿은 두 셀: 각 12개, 닿은 세로 모서리는 한 번(셋 이상 만남 → 그림) → 길이 합 23
{
  const e = edgesOf([2, 2, 1], [0.5, 0.5, 0.5], [1, 1, 1], [[0, 0, 0], [1, 1, 0]]);
  ok(Math.abs(totalLength(e) - 23) < 1e-6, '대각으로 닿은 두 셀: 닿은 모서리도 그림(길이 합 23)', `len=${totalLength(e)}`);
}

// 5) 다중 레벨: 굵은 셀(2 m) 하나 x∈[0,2] + 고운 셀(1 m) 2×2×2 가 x∈[2,4] — 합친 상자 4×2×2 의 12개, 레벨 경계 x=2 에 선 없음
{
  const coarse = grid([1, 1, 1], [1, 1, 1], [2, 2, 2], [[0, 0, 0]]);
  const fine = grid([2, 2, 2], [2.5, 0.5, 0.5], [1, 1, 1], all([2, 2, 2]));
  const inFine = (x, y, z) => x > 2 && x < 4 && y > 0 && y < 2 && z > 0 && z < 2;
  const inCoarse = (x, y, z) => x > 0 && x < 2 && y > 0 && y < 2 && z > 0 && z < 2;
  const s = mergeCellSurfaces([extractCellSurface(coarse.g, coarse.keep, null, inFine), extractCellSurface(fine.g, fine.keep, null, inCoarse)]);
  const e = extractFeatureEdges(s);
  let seam = 0;
  for (let i = 0; i < e.length; i += 6) if (Math.abs(e[i] - 2) < 1e-9 && Math.abs(e[i + 3] - 2) < 1e-9) seam++;
  ok(lines(e) === 12 && Math.abs(totalLength(e) - 4 * (4 + 2 + 2)) < 1e-6, '다중 레벨: 합친 상자의 12개(긴 변은 레벨을 건너 하나)', `lines=${lines(e)} len=${totalLength(e)}`);
  ok(seam === 0, '다중 레벨: 레벨 경계(x=2)에 선 없음', `seam=${seam}`);
}

// 6) 빈 면 묶음 → 빈 배열
ok(extractFeatureEdges({ positions: new Float32Array(0), normals: new Float32Array(0), values: new Float32Array(0), triangleCount: 0 }).length === 0, '면이 없으면 선도 없음');

// 7) 큰 덩어리: 60×60×30 격자에서 구 모양만 남김 — 시간
{
  const dims = [60, 60, 30], keepList = [];
  for (let k = 0; k < dims[2]; k++) for (let j = 0; j < dims[1]; j++) for (let i = 0; i < dims[0]; i++) if ((i - 30) ** 2 + (j - 30) ** 2 + ((k - 15) * 2) ** 2 < 28 ** 2) keepList.push([i, j, k]);
  const { g, keep } = grid(dims, [0, 0, 0], [0.004, 0.004, 0.004], keepList);
  const s = extractCellSurface(g, keep, null);
  const t0 = performance.now();
  const e = extractFeatureEdges(s);
  const ms = performance.now() - t0;
  ok(lines(e) > 0 && ms < 1000, `큰 덩어리(면 ${s.triangleCount / 2}개): 선 ${lines(e)}개 · ${ms.toFixed(0)} ms`);
}

console.log(fail ? `\n실패 ${fail} · 통과 ${pass}` : `\n모두 통과 (통과 ${pass})`);
process.exit(fail ? 1 : 0);

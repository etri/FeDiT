// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   featureEdges.ts

볼륨 노드의 Feature Edges 표현: Surface 가 내는 셀 면(축에 나란한 네모, cellSurface.ts)에서 모양이 꺾이는 모서리만 선으로 뽑는다.
ParaView 'Feature Edges' 표현(vtkFeatureEdges)과 같은 규칙 — 면 하나만 닿은 모서리(경계) · 두 면이 Feature Angle(기본 30°)보다 꺾여 만나는 모서리 ·
셋 이상이 만나는 모서리를 그리고, 같은 평면에 이어진 두 면 사이 모서리는 그리지 않는다.
셀 면은 축 방향뿐이라 두 면이 만나는 각은 0°·90°·180° 중 하나다. 그래서 30° 기준은 '닿은 면들의 방향이 하나뿐이면 안 그림'과 같다
(겹친 면처럼 같은 방향 면이 셋 이상 닿아도 평면이므로 그리지 않는다).
다중 레벨에서 굵은 셀 면의 한 변은 고운 칸 둘에 걸치므로, 모서리를 축마다 가장 짧은 변 길이의 토막으로 나눠 센다 — 레벨 경계의 평평한 면에 선이 생기지 않게.
같은 줄에 이어진 토막은 선 하나로 합친다. 값으로 칠하지 않는다(단색 선) — PV와 다름(ParaView 는 Feature Edges 도 배열로 칠할 수 있다).
*/
/******************************************************************************/
import { CellSurface } from './cellSurface';

/**
 * 셀 면들의 Feature Edges. 돌려주는 배열은 선분 꼭짓점 xyz 의 연속(선분 하나 = 꼭짓점 둘 = 6개 수) — THREE.LineSegments 에 그대로 쓴다.
 * @param s cellSurface.extractCellSurface·mergeCellSurfaces 의 결과(면 하나 = 삼각형 2개 = 꼭짓점 6개, 법선은 축 방향)
 */
export function extractFeatureEdges(s: CellSurface): Float32Array {
  const nf = Math.floor(s.triangleCount / 2);
  if (nf === 0) return new Float32Array(0);
  const P = s.positions, Nm = s.normals;

  // 1차: 면마다 법선 축·부호와 네모의 범위. 축마다 가장 짧은 변 길이(토막 단위)와 전체 범위도 잰다
  const faceDir = new Uint8Array(nf);
  const rect = new Float64Array(nf * 6); // 면마다 [x0, y0, z0, x1, y1, z1]
  const unit = [Infinity, Infinity, Infinity];
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (let f = 0; f < nf; f++) {
    const o = f * 18;
    const a = Math.abs(Nm[o]) > 0.5 ? 0 : Math.abs(Nm[o + 1]) > 0.5 ? 1 : 2;
    faceDir[f] = a * 2 + (Nm[o + a] > 0 ? 1 : 0);
    for (let ax = 0; ax < 3; ax++) {
      let mn = Infinity, mx = -Infinity;
      for (let t = 0; t < 6; t++) { const v = P[o + t * 3 + ax]; if (v < mn) mn = v; if (v > mx) mx = v; }
      rect[f * 6 + ax] = mn; rect[f * 6 + 3 + ax] = mx;
      if (mn < lo[ax]) lo[ax] = mn;
      if (mx > hi[ax]) hi[ax] = mx;
      if (ax !== a) { const len = mx - mn; if (len > 0 && len < unit[ax]) unit[ax] = len; }
    }
  }
  // 한 축에 변이 하나도 없으면(닫히지 않은 면 묶음) 그 축 범위를 단위로 — 서로 다른 평면이 한 점으로 합쳐지지 않게
  for (let ax = 0; ax < 3; ax++) if (!Number.isFinite(unit[ax])) unit[ax] = Math.max(hi[ax] - lo[ax], 1e-9);
  // 격자 좌표: 반 단위(q)로 반올림한 정수. 토막 하나 = 2q
  const q = [unit[0] / 2, unit[1] / 2, unit[2] / 2];
  const grid = (ax: number, v: number) => Math.round((v - lo[ax]) / q[ax]);
  const N = Math.max(grid(0, hi[0]), grid(1, hi[1]), grid(2, hi[2])) + 1;
  if (3 * N * N * N >= Number.MAX_SAFE_INTEGER) return new Float32Array(0); // 셀이 한 축에 13만 칸을 넘는 일은 없다
  // 토막 열쇠: 축 t 의 좌표를 가장 아래 자리로 둬서, 정렬하면 같은 줄의 토막이 차례로 놓인다
  const key = (t: number, it: number, ib: number, ie: number) => ((t * N + ie) * N + ib) * N + it;

  // 2차: 토막마다 닿은 면 수(위 자리)와 면 방향 모음(아래 6비트)
  const seg = new Map<number, number>();
  const addEdge = (t: number, from: number, to: number, ib: number, ie: number, d: number) => {
    for (let it = from; it + 2 <= to; it += 2) {
      const k = key(t, it, ib, ie);
      seg.set(k, ((seg.get(k) ?? 0) | (1 << d)) + 64);
    }
  };
  for (let f = 0; f < nf; f++) {
    const d = faceDir[f], a = d >> 1;
    const r0 = f * 6;
    for (const t of [(a + 1) % 3, (a + 2) % 3]) { // 면 안의 두 축: t 를 따라가는 변 둘(다른 면 안 축 w 의 양 끝)
      const w = 3 - a - t;
      const from = grid(t, rect[r0 + t]), to = grid(t, rect[r0 + 3 + t]);
      const pa = grid(a, rect[r0 + a]);
      for (const wv of [rect[r0 + w], rect[r0 + 3 + w]]) {
        const pw = grid(w, wv);
        const b = (t + 1) % 3; // key 의 ib = 축 (t+1)%3, ie = 축 (t+2)%3
        const ib = b === a ? pa : pw, ie = b === a ? pw : pa;
        addEdge(t, from, to, ib, ie, d);
      }
    }
  }

  // 3차: 그릴 토막 = 면 하나만 닿음(경계) 또는 닿은 면 방향이 둘 이상(꺾임·셋 이상 만남)
  const drawn: number[] = [];
  for (const [k, v] of seg) {
    const mask = v & 63, count = v >> 6;
    if (count === 1 || (mask & (mask - 1)) !== 0) drawn.push(k);
  }
  drawn.sort((x, y) => x - y);

  // 4차: 같은 줄에 이어진 토막을 합쳐 선분으로 (key+2 = 같은 줄 다음 토막 — 끝 토막의 시작은 N-3 이하라 다음 줄로 넘어가지 않는다)
  const out: number[] = [];
  const emit = (kStart: number, kEnd: number) => {
    const it0 = kStart % N, it1 = kEnd % N + 2;
    let rest = (kStart - it0) / N;
    const ib = rest % N; rest = (rest - ib) / N;
    const ie = rest % N; const t = (rest - ie) / N;
    const b = (t + 1) % 3, e = (t + 2) % 3;
    const p0 = [0, 0, 0], p1 = [0, 0, 0];
    p0[t] = lo[t] + it0 * q[t]; p1[t] = lo[t] + it1 * q[t];
    p0[b] = p1[b] = lo[b] + ib * q[b];
    p0[e] = p1[e] = lo[e] + ie * q[e];
    out.push(p0[0], p0[1], p0[2], p1[0], p1[1], p1[2]);
  };
  for (let i = 0; i < drawn.length;) {
    let j = i;
    while (j + 1 < drawn.length && drawn[j + 1] === drawn[j] + 2) j++;
    emit(drawn[i], drawn[j]);
    i = j + 1;
  }
  return new Float32Array(out);
}

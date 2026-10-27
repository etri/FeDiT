// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   sliceSurface.ts

절단면을 면(mesh)으로 만든다. 평면 위에 2차원 격자를 깔고 샘플러로 값을 채운다.
임의 방향 평면, 여러 레벨(샘플러가 알아서 세밀한 레벨을 고름)에 같은 방식으로 동작한다.

형상 경계에 맞춤(clip). 자료는 격자점(또는 셀 중심)에만 있어서 벽까지의 마지막 반 칸에는 값이 없다.
값이 없는 칸을 그냥 버리면 벽 둘레에 0~1칸의 빈 띠가 생긴다(시점과 무관하게, 자료 배치 때문에 생기는 띠).
형상(건물·몸체)이 주어지면:
  1) 평면과 형상의 단면(선분 묶음)을 구해 격자점마다 형상 안인지 판정한다(교차 홀짝 규칙).
  2) 형상 안과 형상 둘레 한 겹의 빈 격자점을 이웃 값으로 채운다 — 벽 옆 반 칸을 잇는 것으로,
     ParaView가 셀 값을 셀 전체에 칠하는 것과 같은 뜻이다. 형상에서 먼 빈 칸은 그대로 구멍으로 둔다.
  3) 벽을 가로지르는 삼각형은 모서리와 형상 단면의 교점에서 정확히 잘라 낸다. 형상의 모서리(두 벽이 만나는 점)가
     삼각형 안에 들어오면 그 점도 꼭짓점으로 끼워 넣어 모서리를 깎지 않는다.
등고선은 완성된 삼각형마다 뽑으므로 잘라 낸 자리에서 등고선도 같이 끝난다.
*/
/******************************************************************************/
import { Bounds } from '../data/pointDataset';
import { ScalarSampler } from '../data/gridDataset';

/** 단면을 잘라 낼 형상 하나: 지역 좌표 삼각형과 세계 좌표로 옮기는 4×4 행렬(열 우선, three.js Matrix4.elements) */
export interface ClipSolid {
  positions: ArrayLike<number>;
  indices: ArrayLike<number> | null;
  matrix: ArrayLike<number>;
}

export interface SliceOptions {
  point: [number, number, number];
  normal: [number, number, number];
  step: number;        // 평면 위 표본 간격 (보통 가장 세밀한 격자 간격)
  maxSamples?: number; // 한 축 최대 표본 수 (기본 1600)
  clip?: ClipSolid[];  // 형상 경계에 맞춤. 없으면 자료가 있는 칸만 그린다
}

export interface SliceSurface {
  nu: number;
  nv: number;
  positions: Float32Array; // 꼭짓점 xyz: 격자점 nu*nv개 + 잘라 낸 자리의 교점들
  values: Float32Array;    // 꼭짓점 값 (삼각형에 쓰이지 않는 격자점은 NaN일 수 있다)
  indices: Uint32Array;
  vertexCount: number;
  triangleCount: number;
}

function basis(n: [number, number, number]): { u: number[]; v: number[]; n: number[] } {
  const len = Math.hypot(n[0], n[1], n[2]) || 1;
  const nn = [n[0] / len, n[1] / len, n[2] / len];
  const ax = Math.abs(nn[0]), ay = Math.abs(nn[1]), az = Math.abs(nn[2]);
  // 축 정렬 평면은 보기 좋은 방향(u=x 또는 y, v=z 또는 y)을 쓴다
  if (az > 0.999) return { u: [1, 0, 0], v: [0, 1, 0], n: nn };
  if (ay > 0.999) return { u: [1, 0, 0], v: [0, 0, 1], n: nn };
  if (ax > 0.999) return { u: [0, 1, 0], v: [0, 0, 1], n: nn };
  const helper = az < 0.9 ? [0, 0, 1] : [1, 0, 0];
  const u = [helper[1] * nn[2] - helper[2] * nn[1], helper[2] * nn[0] - helper[0] * nn[2], helper[0] * nn[1] - helper[1] * nn[0]];
  const ul = Math.hypot(u[0], u[1], u[2]) || 1;
  u[0] /= ul; u[1] /= ul; u[2] /= ul;
  const v = [nn[1] * u[2] - nn[2] * u[1], nn[2] * u[0] - nn[0] * u[2], nn[0] * u[1] - nn[1] * u[0]];
  return { u, v, n: nn };
}

/** 평면 좌표(u,v)로 나타낸 형상 단면: 선분(u0,v0,u1,v1)들과 경계 상자 */
interface Section { seg: Float64Array; count: number; umin: number; umax: number; vmin: number; vmax: number }

/** 형상 삼각형들을 평면으로 잘라 단면 선분을 모은다. 평면과 만나지 않으면 null */
function sectionOf(solid: ClipSolid, P: number[], u: number[], v: number[], n: number[]): Section | null {
  const m = solid.matrix, pos = solid.positions, idx = solid.indices;
  const nTri = idx ? Math.floor(idx.length / 3) : Math.floor(pos.length / 9);
  const seg: number[] = [];
  const wx = [0, 0, 0], wy = [0, 0, 0], wz = [0, 0, 0], d = [0, 0, 0];
  let umin = Infinity, umax = -Infinity, vmin = Infinity, vmax = -Infinity;
  const cross = (i: number, j: number) => {
    const t = d[i] / (d[i] - d[j]);
    const x = wx[i] + (wx[j] - wx[i]) * t - P[0], y = wy[i] + (wy[j] - wy[i]) * t - P[1], z = wz[i] + (wz[j] - wz[i]) * t - P[2];
    const pu = x * u[0] + y * u[1] + z * u[2], pv = x * v[0] + y * v[1] + z * v[2];
    seg.push(pu, pv);
    if (pu < umin) umin = pu; if (pu > umax) umax = pu; if (pv < vmin) vmin = pv; if (pv > vmax) vmax = pv;
  };
  for (let t = 0; t < nTri; t++) {
    for (let k = 0; k < 3; k++) {
      const vi = idx ? idx[t * 3 + k] : t * 3 + k;
      const x = pos[vi * 3], y = pos[vi * 3 + 1], z = pos[vi * 3 + 2];
      wx[k] = m[0] * x + m[4] * y + m[8] * z + m[12];
      wy[k] = m[1] * x + m[5] * y + m[9] * z + m[13];
      wz[k] = m[2] * x + m[6] * y + m[10] * z + m[14];
      d[k] = (wx[k] - P[0]) * n[0] + (wy[k] - P[1]) * n[1] + (wz[k] - P[2]) * n[2];
    }
    const s0 = d[0] > 0, s1 = d[1] > 0, s2 = d[2] > 0;
    if (s0 === s1 && s1 === s2) continue;
    // 혼자 반대쪽에 있는 꼭짓점에서 나가는 두 변이 평면과 만난다
    if (s0 !== s1 && s0 !== s2) { cross(0, 1); cross(0, 2); }
    else if (s1 !== s0 && s1 !== s2) { cross(1, 0); cross(1, 2); }
    else { cross(2, 0); cross(2, 1); }
  }
  if (seg.length < 8) return null;
  return { seg: Float64Array.from(seg), count: seg.length / 4, umin, umax, vmin, vmax };
}

/**
 * 격자점마다 형상 안인지 (교차 홀짝 규칙: 왼쪽에서 그 점까지 단면 선분을 홀수 번 가로지르면 안).
 * 정확히 벽 위에 놓인 격자점은 안으로 본다(닫힌 구간). 그래야 벽이 격자점·격자선과 겹칠 때 세 꼭짓점이 모두 벽 위인
 * 삼각형(속은 형상 안인데 꼭짓점은 모두 "바깥")이 생기지 않는다. 이를 위해 행마다 "위 끝점 포함"·"아래 끝점 포함" 두
 * 규칙으로 교차점을 모으고, 점 위의 교차를 세는 경우와 안 세는 경우 어느 쪽이든 홀수면 안으로 친다.
 */
function insideFlags(sections: Section[], inside: Uint8Array, nu: number, nv: number, umin: number, vmin: number, h: number): void {
  const xsA: number[] = [], xsB: number[] = [];
  const eps = 1e-9 * h;
  for (const s of sections) {
    const b0 = Math.max(0, Math.ceil((s.vmin - vmin) / h) - 1), b1 = Math.min(nv - 1, Math.floor((s.vmax - vmin) / h) + 1);
    const a0 = Math.max(0, Math.ceil((s.umin - umin) / h) - 1), a1 = Math.min(nu - 1, Math.floor((s.umax - umin) / h) + 1);
    const g = s.seg;
    for (let b = b0; b <= b1; b++) {
      const pv = vmin + b * h;
      xsA.length = 0; xsB.length = 0;
      for (let k = 0; k < s.count; k++) {
        const u0 = g[k * 4], v0 = g[k * 4 + 1], u1 = g[k * 4 + 2], v1 = g[k * 4 + 3];
        const inA = (v0 >= pv - eps) !== (v1 >= pv - eps); // v ≥ pv 쪽이 위: 위 끝점이 행 위에 있으면 센다
        const inB = (v0 > pv + eps) !== (v1 > pv + eps);   // v > pv 쪽이 위: 아래 끝점이 행 위에 있으면 센다
        if (!inA && !inB) continue;
        const uc = u0 + ((pv - v0) * (u1 - u0)) / (v1 - v0);
        if (inA) xsA.push(uc);
        if (inB) xsB.push(uc);
      }
      if (xsA.length < 2 && xsB.length < 2) continue;
      xsA.sort((p, q) => p - q); xsB.sort((p, q) => p - q);
      let aLo = 0, aHi = 0, bLo = 0, bHi = 0; // < pu 인 교차 수, ≤ pu 인 교차 수
      for (let a = a0; a <= a1; a++) {
        const pu = umin + a * h;
        while (aLo < xsA.length && xsA[aLo] < pu - eps) aLo++;
        while (aHi < xsA.length && xsA[aHi] <= pu + eps) aHi++;
        while (bLo < xsB.length && xsB[bLo] < pu - eps) bLo++;
        while (bHi < xsB.length && xsB[bHi] <= pu + eps) bHi++;
        if ((aLo | aHi | bLo | bHi) & 1) inside[a + nu * b] = 1;
      }
    }
  }
}

/** 형상 안과 형상 둘레 한 겹의 빈 격자점을 이웃 값 평균으로 채운다. 두 번 돌려 두 칸까지 잇는다 */
function fillNearSolids(values: Float32Array, inside: Uint8Array, nu: number, nv: number): void {
  const near = new Uint8Array(nu * nv);
  for (let b = 0; b < nv; b++) {
    for (let a = 0; a < nu; a++) {
      const i = a + nu * b;
      if (inside[i]) { near[i] = 1; continue; }
      for (let db = -1; db <= 1 && !near[i]; db++) {
        for (let da = -1; da <= 1; da++) {
          const aa = a + da, bb = b + db;
          if (aa < 0 || aa >= nu || bb < 0 || bb >= nv) continue;
          if (inside[aa + nu * bb]) { near[i] = 1; break; }
        }
      }
    }
  }
  for (let pass = 0; pass < 2; pass++) {
    const src = values.slice();
    for (let b = 0; b < nv; b++) {
      for (let a = 0; a < nu; a++) {
        const i = a + nu * b;
        if (!near[i] || src[i] === src[i]) continue;
        let sum = 0, cnt = 0;
        for (let db = -1; db <= 1; db++) {
          for (let da = -1; da <= 1; da++) {
            const aa = a + da, bb = b + db;
            if ((da === 0 && db === 0) || aa < 0 || aa >= nu || bb < 0 || bb >= nv) continue;
            const x = src[aa + nu * bb];
            if (x === x) { sum += x; cnt++; }
          }
        }
        if (cnt) values[i] = sum / cnt;
      }
    }
  }
}

export function resampleSlice(sample: ScalarSampler, bounds: Bounds, opts: SliceOptions): SliceSurface {
  const { u, v, n } = basis(opts.normal);
  const P = opts.point;
  // 데이터 상자의 8개 모서리를 평면 좌표(u,v)로 투영해 범위를 잡는다
  let umin = Infinity, umax = -Infinity, vmin = Infinity, vmax = -Infinity;
  for (let c = 0; c < 8; c++) {
    const x = ((c & 1) ? bounds.max[0] : bounds.min[0]) - P[0];
    const y = ((c & 2) ? bounds.max[1] : bounds.min[1]) - P[1];
    const z = ((c & 4) ? bounds.max[2] : bounds.min[2]) - P[2];
    const pu = x * u[0] + y * u[1] + z * u[2], pv = x * v[0] + y * v[1] + z * v[2];
    if (pu < umin) umin = pu; if (pu > umax) umax = pu;
    if (pv < vmin) vmin = pv; if (pv > vmax) vmax = pv;
  }
  const cap = opts.maxSamples ?? 1600;
  let h = Math.max(opts.step, 1e-9);
  // 표본이 너무 많으면 간격을 키운다
  h = Math.max(h, (umax - umin) / cap, (vmax - vmin) / cap);
  const nu = Math.max(2, Math.floor((umax - umin) / h) + 1);
  const nv = Math.max(2, Math.floor((vmax - vmin) / h) + 1);
  const N = nu * nv;
  const positions = new Float32Array(N * 3);
  const values = new Float32Array(N);
  for (let b = 0; b < nv; b++) {
    const pv = vmin + b * h;
    for (let a = 0; a < nu; a++) {
      const pu = umin + a * h;
      const x = P[0] + u[0] * pu + v[0] * pv, y = P[1] + u[1] * pu + v[1] * pv, z = P[2] + u[2] * pu + v[2] * pv;
      const i = a + nu * b;
      positions[i * 3] = x; positions[i * 3 + 1] = y; positions[i * 3 + 2] = z;
      values[i] = sample(x, y, z);
    }
  }

  // 형상 단면 → 안팎 판정 → 벽 옆 빈 칸 잇기
  const sections: Section[] = [];
  for (const s of opts.clip ?? []) { const sec = sectionOf(s, P, u, v, n); if (sec) sections.push(sec); }
  const inside = new Uint8Array(N);
  if (sections.length) {
    insideFlags(sections, inside, nu, nv, umin, vmin, h);
    fillNearSolids(values, inside, nu, nv);
  }

  // 삼각형 만들기. 벽을 가로지르는 삼각형은 모서리와 단면 선분의 교점에서 자른다
  const idx: number[] = [];
  const extraPos: number[] = [], extraVal: number[] = [];
  const cache = new Map<number, number>(); // (바깥 격자점, 안 격자점) → 교점 꼭짓점 번호. 이웃 삼각형이 같은 교점을 써야 틈이 없다
  const hitSec: number[] = [], hitSeg: number[] = []; // 교점마다 닿은 형상·선분 번호 (모서리 끼워 넣기용, 없으면 -1)
  const crossing = (io: number, ii: number): number => {
    const key = io * N + ii;
    const hit = cache.get(key);
    if (hit !== undefined) return hit;
    const ao = io % nu, bo = (io - ao) / nu, ai = ii % nu, bi = (ii - ai) / nu;
    const pu0 = umin + ao * h, pv0 = vmin + bo * h, du = (ai - ao) * h, dv = (bi - bo) * h;
    const lu = Math.min(pu0, pu0 + du), hu = Math.max(pu0, pu0 + du), lv = Math.min(pv0, pv0 + dv), hv = Math.max(pv0, pv0 + dv);
    let best = Infinity, bestS = -1, bestK = -1;
    for (let si = 0; si < sections.length; si++) {
      const s = sections[si];
      if (hu < s.umin || lu > s.umax || hv < s.vmin || lv > s.vmax) continue;
      const g = s.seg;
      for (let k = 0; k < s.count; k++) {
        const u0 = g[k * 4], v0 = g[k * 4 + 1], eu = g[k * 4 + 2] - u0, ev = g[k * 4 + 3] - v0;
        const den = du * ev - dv * eu;
        if (Math.abs(den) <= 1e-12 * (Math.abs(du) + Math.abs(dv)) * (Math.abs(eu) + Math.abs(ev))) continue; // 평행
        const wu = u0 - pu0, wv = v0 - pv0;
        const t = (wu * ev - wv * eu) / den; // 모서리 위 매개변수 (0 = 바깥 점, 1 = 안 점)
        if (t < -1e-9 || t > 1 + 1e-9 || t >= best) continue;
        const q = (wu * dv - wv * du) / den; // 단면 선분 위 매개변수
        if (q < -1e-9 || q > 1 + 1e-9) continue;
        best = t; bestS = si; bestK = k;
      }
    }
    const t = best <= 1 + 1e-9 ? Math.min(1, Math.max(0, best)) : 0.5; // 수치 오차로 못 찾으면 중간
    const id = N + extraVal.length;
    for (let c = 0; c < 3; c++) extraPos.push(positions[io * 3 + c] + (positions[ii * 3 + c] - positions[io * 3 + c]) * t);
    const vo = values[io], vi = values[ii];
    extraVal.push(vi === vi ? vo + (vi - vo) * t : vo);
    hitSec.push(bestS); hitSeg.push(bestK);
    cache.set(key, id);
    return id;
  };
  const puOf = (i: number) => umin + (i % nu) * h, pvOf = (i: number) => vmin + Math.floor(i / nu) * h;
  /**
   * 두 교점이 서로 다른(나란하지 않은) 단면 선분에 닿았으면 두 선분의 직선이 만나는 형상 모서리 점을 새 꼭짓점으로 만든다.
   * 모서리가 삼각형(ia, ib, ic) 안에 있고 두 선분에서 한 칸 넘게 벗어나지 않을 때만. 아니면 -1 (두 교점을 직선으로 잇는다)
   */
  const corner = (x1: number, x2: number, ia: number, ib: number, ic: number): number => {
    const s1 = hitSec[x1 - N], k1 = hitSeg[x1 - N], s2 = hitSec[x2 - N], k2 = hitSeg[x2 - N];
    if (s1 < 0 || s2 < 0 || (s1 === s2 && k1 === k2)) return -1;
    const g1 = sections[s1].seg, g2 = sections[s2].seg;
    const p0 = g1[k1 * 4], p1 = g1[k1 * 4 + 1], du = g1[k1 * 4 + 2] - p0, dv = g1[k1 * 4 + 3] - p1;
    const q0 = g2[k2 * 4], q1 = g2[k2 * 4 + 1], eu = g2[k2 * 4 + 2] - q0, ev = g2[k2 * 4 + 3] - q1;
    const den = du * ev - dv * eu;
    if (Math.abs(den) <= 1e-9 * (Math.abs(du) + Math.abs(dv)) * (Math.abs(eu) + Math.abs(ev))) return -1; // 한 직선 위
    const t1 = ((q0 - p0) * ev - (q1 - p1) * eu) / den;
    const t2 = ((q0 - p0) * dv - (q1 - p1) * du) / den;
    // 두 선분의 범위에서 한 칸 넘게 벗어나면 진짜 모서리가 아니다 (곡면을 잘게 나눈 선분들이 멀리서 만나는 경우)
    const l1 = Math.hypot(du, dv) || 1, l2 = Math.hypot(eu, ev) || 1;
    if (t1 * l1 < -h || (t1 - 1) * l1 > h || t2 * l2 < -h || (t2 - 1) * l2 > h) return -1;
    const cu = p0 + du * t1, cv = p1 + dv * t1;
    // 삼각형 안인지: 무게중심 좌표
    const au = puOf(ia), av = pvOf(ia), bu = puOf(ib), bv = pvOf(ib), cu2 = puOf(ic), cv2 = pvOf(ic);
    const det = (bu - au) * (cv2 - av) - (cu2 - au) * (bv - av);
    if (Math.abs(det) < 1e-18) return -1;
    const wb = ((cu - au) * (cv2 - av) - (cu2 - au) * (cv - av)) / det;
    const wc = ((bu - au) * (cv - av) - (cu - au) * (bv - av)) / det;
    const wa = 1 - wb - wc;
    if (wa < -1e-6 || wb < -1e-6 || wc < -1e-6) return -1;
    const id = N + extraVal.length;
    for (let c = 0; c < 3; c++) extraPos.push(wa * positions[ia * 3 + c] + wb * positions[ib * 3 + c] + wc * positions[ic * 3 + c]);
    extraVal.push(wa * values[ia] + wb * values[ib] + wc * values[ic]);
    hitSec.push(-1); hitSeg.push(-1);
    return id;
  };
  const tri = (i0: number, i1: number, i2: number) => {
    const in0 = inside[i0], in1 = inside[i1], in2 = inside[i2];
    const nIn = in0 + in1 + in2;
    if (nIn === 0) { idx.push(i0, i1, i2); return; }
    if (nIn === 3) return;
    if (nIn === 1) {
      // 안쪽 꼭짓점 C 하나: 바깥 A, B와 두 교점으로 사각형
      let A: number, B: number, C: number;
      if (in0) { C = i0; A = i1; B = i2; } else if (in1) { C = i1; A = i2; B = i0; } else { C = i2; A = i0; B = i1; }
      const xb = crossing(B, C), xa = crossing(A, C);
      const X = corner(xb, xa, i0, i1, i2);
      if (X < 0) idx.push(A, B, xb, A, xb, xa);
      else idx.push(X, xa, A, X, A, B, X, B, xb); // 모서리 점이 오목할 수 있으니 거기서 부채꼴로
    } else {
      // 바깥 꼭짓점 A 하나: A와 두 교점으로 삼각형
      let A: number, B: number, C: number;
      if (!in0) { A = i0; B = i1; C = i2; } else if (!in1) { A = i1; B = i2; C = i0; } else { A = i2; B = i0; C = i1; }
      const xab = crossing(A, B), xac = crossing(A, C);
      const X = corner(xab, xac, i0, i1, i2);
      if (X < 0) idx.push(A, xab, xac);
      else idx.push(X, xac, A, X, A, xab);
    }
  };
  for (let b = 0; b < nv - 1; b++) {
    for (let a = 0; a < nu - 1; a++) {
      const i0 = a + nu * b, i1 = i0 + 1, i2 = i0 + nu + 1, i3 = i0 + nu;
      if (values[i0] !== values[i0] || values[i1] !== values[i1] || values[i2] !== values[i2] || values[i3] !== values[i3]) continue;
      tri(i0, i1, i2);
      tri(i0, i2, i3);
    }
  }
  // 격자점과 교점을 한 배열로
  const vertexCount = N + extraVal.length;
  let outPos = positions, outVal = values;
  if (extraVal.length) {
    outPos = new Float32Array(vertexCount * 3); outPos.set(positions); outPos.set(extraPos, N * 3);
    outVal = new Float32Array(vertexCount); outVal.set(values); outVal.set(extraVal, N);
  }
  return { nu, nv, positions: outPos, values: outVal, indices: Uint32Array.from(idx), vertexCount, triangleCount: idx.length / 3 };
}

/**
 * 등고선. 면의 삼각형마다 등치선 선분을 뽑는다 (marching squares의 삼각형판).
 * 면의 구간 색 경계(프래그먼트에서 값을 선형 보간해 끊음)와 같은 보간이라 선과 색 경계가 정확히 겹치고,
 * 형상에서 잘라 낸 삼각형을 그대로 쓰므로 등고선도 벽에서 끝난다.
 * 선분 좌표(xyz 두 점씩)와, 선분마다 몇 번째 등고선 값인지(levelIndex)를 돌려준다.
 */
export interface ContourResult { positions: Float32Array; levelIndex: Uint16Array }

export function contourLines(s: SliceSurface, levels: number[]): ContourResult {
  const out: number[] = [];
  const idx: number[] = [];
  const { positions: P, values: V, indices: I } = s;
  const cross = (ia: number, ib: number, level: number) => {
    const va = V[ia], vb = V[ib];
    const t = vb === va ? 0.5 : (level - va) / (vb - va);
    out.push(P[ia * 3] + (P[ib * 3] - P[ia * 3]) * t, P[ia * 3 + 1] + (P[ib * 3 + 1] - P[ia * 3 + 1]) * t, P[ia * 3 + 2] + (P[ib * 3 + 2] - P[ia * 3 + 2]) * t);
  };
  const tri = (ia: number, ib: number, ic: number, L: number, li: number) => {
    const a = V[ia] >= L, b = V[ib] >= L, c = V[ic] >= L;
    if (a === b && b === c) return;
    // 혼자 다른 쪽에 있는 꼭짓점에서 나가는 두 변이 등치선과 만난다
    if (a !== b && a !== c) { cross(ia, ib, L); cross(ia, ic, L); }
    else if (b !== a && b !== c) { cross(ib, ia, L); cross(ib, ic, L); }
    else { cross(ic, ia, L); cross(ic, ib, L); }
    idx.push(li);
  };
  for (let t = 0; t < I.length; t += 3) {
    const ia = I[t], ib = I[t + 1], ic = I[t + 2];
    const va = V[ia], vb = V[ib], vc = V[ic];
    if (va !== va || vb !== vb || vc !== vc) continue;
    const lo = Math.min(va, vb, vc), hi = Math.max(va, vb, vc);
    for (let li = 0; li < levels.length; li++) {
      const L = levels[li];
      if (L <= lo || L > hi) continue;
      tri(ia, ib, ic, L, li);
    }
  }
  return { positions: Float32Array.from(out), levelIndex: Uint16Array.from(idx) };
}

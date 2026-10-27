// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   isosurface.ts

등값면(isosurface) 추출 — marching tetrahedra.
각 격자 칸(정육면체)을 4면체 6개로 나누고, 4면체마다 등값 교차 삼각형을 만든다.
큰 조회표가 필요 없어 구현이 단순하고 구멍이 생기지 않는다(삼각형 수는 marching cubes보다 많다).
법선은 격자점 기울기를 보간해 매끈하게 만든다. 결측(NaN) 칸은 건너뛴다.
*/
/******************************************************************************/
import { StructuredGrid, gradientAt } from '../data/gridDataset';

export interface IsoResult {
  positions: Float32Array;
  normals: Float32Array;
  values: Float32Array | null; // 색 필드 값 (colorField를 줬을 때)
  triangleCount: number;
}

/** 여러 레벨의 결과를 하나로 합친다. */
export function mergeIsoResults(results: IsoResult[]): IsoResult {
  const n = results.reduce((s, r) => s + r.positions.length, 0);
  const positions = new Float32Array(n), normals = new Float32Array(n);
  const hasValues = results.every((r) => r.values);
  const values = hasValues ? new Float32Array(n / 3) : null;
  let o = 0;
  for (const r of results) {
    positions.set(r.positions, o); normals.set(r.normals, o);
    if (values && r.values) values.set(r.values, o / 3);
    o += r.positions.length;
  }
  return { positions, normals, values, triangleCount: n / 9 };
}

const CORNER = [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]];
// 대각선 0-6을 공유하는 4면체 6개
const TETS = [[0, 5, 1, 6], [0, 1, 2, 6], [0, 2, 3, 6], [0, 3, 7, 6], [0, 7, 4, 6], [0, 4, 5, 6]];

export function marchingTetrahedra(g: StructuredGrid, field: Float32Array, iso: number, colorField: Float32Array | null): IsoResult {
  const [nx, ny, nz] = g.dims;
  const [ox, oy, oz] = g.origin;
  const [sx, sy, sz] = g.spacing;
  const nxy = nx * ny;
  const pos: number[] = [], nrm: number[] = [], col: number[] = [];

  const cv = new Float64Array(8);      // 꼭짓점 값
  const cc = new Float64Array(8);      // 색 필드 값
  const cp = new Float64Array(24);     // 꼭짓점 좌표
  const cg = new Float64Array(24);     // 꼭짓점 기울기
  const grad = [0, 0, 0];
  const inside = [false, false, false, false];

  // 방금 넣은 삼각형의 감김 방향을 법선과 맞춘다 (양면 조명의 앞·뒤 판정이 법선과 같게)
  const fixWinding = () => {
    const n = pos.length;
    const ax = pos[n - 9], ay = pos[n - 8], az = pos[n - 7];
    const bx = pos[n - 6], by = pos[n - 5], bz = pos[n - 4];
    const cx = pos[n - 3], cy = pos[n - 2], cz = pos[n - 1];
    const e1x = bx - ax, e1y = by - ay, e1z = bz - az, e2x = cx - ax, e2y = cy - ay, e2z = cz - az;
    const gx = e1y * e2z - e1z * e2y, gy = e1z * e2x - e1x * e2z, gz = e1x * e2y - e1y * e2x;
    if (gx * nrm[n - 9] + gy * nrm[n - 8] + gz * nrm[n - 7] < 0) {
      for (let c = 0; c < 3; c++) {
        let t = pos[n - 6 + c]; pos[n - 6 + c] = pos[n - 3 + c]; pos[n - 3 + c] = t;
        t = nrm[n - 6 + c]; nrm[n - 6 + c] = nrm[n - 3 + c]; nrm[n - 3 + c] = t;
      }
      if (colorField) { const m = col.length; const t = col[m - 2]; col[m - 2] = col[m - 1]; col[m - 1] = t; }
    }
  };

  // 두 꼭짓점 a,b 사이 등값점을 내보낸다
  const emit = (a: number, b: number) => {
    const va = cv[a], vb = cv[b];
    const t = vb === va ? 0.5 : (iso - va) / (vb - va);
    for (let c = 0; c < 3; c++) pos.push(cp[a * 3 + c] + (cp[b * 3 + c] - cp[a * 3 + c]) * t);
    let gx = cg[a * 3] + (cg[b * 3] - cg[a * 3]) * t;
    let gy = cg[a * 3 + 1] + (cg[b * 3 + 1] - cg[a * 3 + 1]) * t;
    let gz = cg[a * 3 + 2] + (cg[b * 3 + 2] - cg[a * 3 + 2]) * t;
    const len = Math.hypot(gx, gy, gz) || 1;
    gx /= len; gy /= len; gz /= len;
    nrm.push(-gx, -gy, -gz); // 값이 줄어드는 쪽(바깥)을 향하게
    if (colorField) {
      const ca = cc[a], cb = cc[b];
      col.push(ca === ca && cb === cb ? ca + (cb - ca) * t : ca === ca ? ca : cb);
    }
  };

  for (let k = 0; k < nz - 1; k++) {
    for (let j = 0; j < ny - 1; j++) {
      for (let i = 0; i < nx - 1; i++) {
        let above = 0, hasNaN = false;
        for (let c = 0; c < 8; c++) {
          const v = field[(i + CORNER[c][0]) + nx * (j + CORNER[c][1]) + nxy * (k + CORNER[c][2])];
          if (v !== v) { hasNaN = true; break; }
          cv[c] = v;
          if (v >= iso) above++;
        }
        if (hasNaN || above === 0 || above === 8) continue;
        for (let c = 0; c < 8; c++) {
          const ci = i + CORNER[c][0], cj = j + CORNER[c][1], ck = k + CORNER[c][2];
          cp[c * 3] = ox + ci * sx; cp[c * 3 + 1] = oy + cj * sy; cp[c * 3 + 2] = oz + ck * sz;
          gradientAt(g, field, ci, cj, ck, grad);
          cg[c * 3] = grad[0]; cg[c * 3 + 1] = grad[1]; cg[c * 3 + 2] = grad[2];
          if (colorField) cc[c] = colorField[ci + nx * cj + nxy * ck];
        }
        for (const t of TETS) {
          let n = 0;
          for (let m = 0; m < 4; m++) { inside[m] = cv[t[m]] >= iso; if (inside[m]) n++; }
          if (n === 0 || n === 4) continue;
          if (n === 1 || n === 3) {
            // 혼자 다른 꼭짓점 하나에서 나머지 셋으로 가는 변 3개의 교차점 → 삼각형
            const want = n === 1;
            let lone = 0;
            for (let m = 0; m < 4; m++) if (inside[m] === want) lone = m;
            const others = [0, 1, 2, 3].filter((m) => m !== lone);
            emit(t[lone], t[others[0]]); emit(t[lone], t[others[1]]); emit(t[lone], t[others[2]]);
            fixWinding();
          } else {
            // 둘씩 나뉨 → 사각형(삼각형 2개)
            const ins = [0, 1, 2, 3].filter((m) => inside[m]), outs = [0, 1, 2, 3].filter((m) => !inside[m]);
            const p = t[ins[0]], q = t[ins[1]], r = t[outs[0]], s = t[outs[1]];
            emit(p, r); emit(p, s); emit(q, s);
            fixWinding();
            emit(p, r); emit(q, s); emit(q, r);
            fixWinding();
          }
        }
      }
    }
  }
  return {
    positions: Float32Array.from(pos),
    normals: Float32Array.from(nrm),
    values: colorField ? Float32Array.from(col) : null,
    triangleCount: pos.length / 9,
  };
}

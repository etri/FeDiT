// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   cellSurface.ts

볼륨 노드의 Surface 표현: 남은 셀 집합의 바깥 면을 모은다 (ParaView 의 vtkPVGeometryFilter 가 구조 격자에서 external faces 를 뽑는 것과 같은 일).
격자 셀 하나 = 격자점(데이터 점)을 중심으로 한 상자, 크기는 격자 간격. 남은 셀과 '남지 않은 셀 또는 격자 밖' 사이의 면만 낸다.
다중 레벨에서는 거친 레벨의 셀이 고운 레벨에 가려져(occupancy 0) 있으므로, 이웃이 비어 있어도 다른 레벨이 그 자리를 채우고 있으면
(occupiedOutside) 면을 내지 않는다 — 레벨 경계에 면이 생기지 않게. 판정은 면 바로 건너편 네 점(면을 2×2 로 나눈 칸의 가운데)으로 한다:
2:1 경계에서 거친 셀의 면 하나에 닿는 고운 셀 넷을 하나씩 짚도록(이웃 셀 중심 한 점이면 반올림이 닿지 않는 셀을 고른다). 넷이 모두 채워졌을 때만
면을 건너뛰므로, 일부만 채워진 경계에서는 면이 남는다(구멍 대신 겹친 면 — 불투명이면 보이지 않는다).
값은 면이 속한 셀의 값(셀 데이터라 면 하나가 한 색). 삼각형은 인덱스 없이 6꼭짓점씩, 감김은 바깥에서 볼 때 반시계.
*/
/******************************************************************************/
import { StructuredGrid } from '../data/gridDataset';

export interface CellSurface {
  positions: Float32Array;  // 삼각형 꼭짓점 xyz (면 하나 = 삼각형 2개 = 꼭짓점 6개)
  normals: Float32Array;    // 꼭짓점 법선 (면의 바깥 방향)
  values: Float32Array;     // 꼭짓점 값 = 셀 값 (값이 없으면 NaN)
  triangleCount: number;
}

/** 면 방향 d (0..5): 축 = d >> 1, 부호 = d & 1 ? + : - */
const DIRS = [0, 1, 2, 3, 4, 5];
/** 면을 2×2 로 나눈 칸의 가운데 (면 안 두 축의 부호) */
const QUAD: [number, number][] = [[-1, -1], [1, -1], [1, 1], [-1, 1]];

/**
 * keep[c] = 1 인 셀들의 바깥 면을 뽑는다.
 * @param keep            격자 셀마다 남길지 (occupancy 0 인 셀은 1 이어도 남기지 않는다)
 * @param values          격자 셀 값 (null 이면 NaN 으로 채운다 — 렌더러가 단색으로 그린다)
 * @param occupiedOutside 이웃 셀이 이 격자에 없거나 비었을 때, 다른 레벨이 그 자리(이웃 셀 중심)를 남은 셀로 채우고 있는지
 */
export function extractCellSurface(
  g: StructuredGrid, keep: Uint8Array, values: Float32Array | null,
  occupiedOutside?: (x: number, y: number, z: number) => boolean,
): CellSurface {
  const [nx, ny, nz] = g.dims;
  const nxy = nx * ny;
  const [ox, oy, oz] = g.origin;
  const sp = g.spacing;
  const kept = (c: number) => keep[c] === 1 && g.occupancy[c] === 1;

  const half = [sp[0] / 2, sp[1] / 2, sp[2] / 2];
  /** 셀 (i,j,k) 의 방향 d 면 바로 건너편 네 점이 모두 다른 레벨의 남은 셀인지 */
  const coveredOutside = (i: number, j: number, k: number, d: number): boolean => {
    const a = d >> 1, s = d & 1 ? 1 : -1, b = (a + 1) % 3, e = (a + 2) % 3;
    const q = [ox + i * sp[0], oy + j * sp[1], oz + k * sp[2]];
    q[a] += s * half[a] * 1.25; // 면을 넘어 이 셀 반 칸의 1/4 만큼
    const qb = q[b], qe = q[e];
    for (const [ub, ue] of QUAD) {
      q[b] = qb + ub * half[b] * 0.5; q[e] = qe + ue * half[e] * 0.5;
      if (!occupiedOutside!(q[0], q[1], q[2])) return false;
    }
    return true;
  };

  // 1차: 낼 면을 (셀 번호 * 6 + 방향) 으로 모은다. 모자라면 두 배로 늘린다
  let faces = new Float64Array(1024);
  let nf = 0;
  for (let k = 0; k < nz; k++) {
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const c = i + nx * j + nxy * k;
        if (!kept(c)) continue;
        for (const d of DIRS) {
          const a = d >> 1, s = d & 1 ? 1 : -1;
          const ii = a === 0 ? i + s : i, jj = a === 1 ? j + s : j, kk = a === 2 ? k + s : k;
          const inside = ii >= 0 && jj >= 0 && kk >= 0 && ii < nx && jj < ny && kk < nz;
          if (inside) {
            const nc = ii + nx * jj + nxy * kk;
            if (kept(nc)) continue;                                  // 이웃도 남은 셀 → 안쪽 면
            if (g.occupancy[nc] === 1) { push(c * 6 + d); continue; } // 이웃은 이 레벨의 셀인데 걸러짐 → 잘린 면
          }
          // 이웃이 격자 밖이거나 이 레벨에서 빈 칸: 다른 레벨이 그 자리를 채우고 있으면 면을 내지 않는다
          if (occupiedOutside && coveredOutside(i, j, k, d)) continue;
          push(c * 6 + d);
        }
      }
    }
  }
  function push(code: number) {
    if (nf === faces.length) { const next = new Float64Array(faces.length * 2); next.set(faces); faces = next; }
    faces[nf++] = code;
  }

  // 2차: 면마다 삼각형 둘
  const positions = new Float32Array(nf * 18);
  const normals = new Float32Array(nf * 18);
  const vals = new Float32Array(nf * 6);
  // (b, e) 평면의 네 모서리 부호를 반시계로: (-,-) (+,-) (+,+) (-,+) — 법선 +e_a 쪽에서 볼 때. 법선이 -e_a 면 순서를 뒤집는다
  const CB = [-1, 1, 1, -1], CE = [-1, -1, 1, 1];
  const ORDER_POS = [0, 1, 2, 0, 2, 3], ORDER_NEG = [0, 2, 1, 0, 3, 2];
  const p = [0, 0, 0];
  for (let f = 0; f < nf; f++) {
    const code = faces[f];
    const c = Math.floor(code / 6), d = code - c * 6;
    const k = Math.floor(c / nxy), rem = c - k * nxy, j = Math.floor(rem / nx), i = rem - j * nx;
    const a = d >> 1, s = d & 1 ? 1 : -1;
    const b = (a + 1) % 3, e = (a + 2) % 3; // e_b × e_e = e_a
    const order = s > 0 ? ORDER_POS : ORDER_NEG;
    const v = values ? values[c] : NaN;
    for (let t = 0; t < 6; t++) {
      const q = order[t];
      p[0] = ox + i * sp[0]; p[1] = oy + j * sp[1]; p[2] = oz + k * sp[2];
      p[a] += s * half[a];
      p[b] += CB[q] * half[b];
      p[e] += CE[q] * half[e];
      const o = (f * 6 + t) * 3;
      positions[o] = p[0]; positions[o + 1] = p[1]; positions[o + 2] = p[2];
      normals[o + a] = s; // 나머지 두 성분은 0 (새 배열)
      vals[f * 6 + t] = v;
    }
  }
  return { positions, normals, values: vals, triangleCount: nf * 2 };
}

/** 여러 레벨의 결과를 하나로 */
export function mergeCellSurfaces(list: CellSurface[]): CellSurface {
  if (list.length === 1) return list[0];
  const tri = list.reduce((n, s) => n + s.triangleCount, 0);
  const positions = new Float32Array(tri * 9), normals = new Float32Array(tri * 9), values = new Float32Array(tri * 3);
  let o = 0;
  for (const s of list) {
    positions.set(s.positions, o * 9); normals.set(s.normals, o * 9); values.set(s.values, o * 3);
    o += s.triangleCount;
  }
  return { positions, normals, values, triangleCount: tri };
}

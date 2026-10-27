// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   gridDataset.ts

점 데이터셋에서 균일 격자(structured grid)를 되살린다.
유선·등값면·면 단면 같은 후처리는 이웃 관계(격자)가 있어야 하므로,
좌표가 일정 간격으로 놓인 데이터(LBM 결과, 정규 격자 CFD)만 격자로 복원한다.
격자 안의 빈 칸(건물 내부 등)은 NaN으로 둔다. 셀 번호 = i + nx*(j + ny*k).

여러 세밀도 레벨(LBM 옥트리)은 레벨마다 격자를 만들고, 샘플러가 세밀한 레벨부터 찾는다.
*/
/******************************************************************************/
import { Bounds, PointDataset } from './pointDataset';

export interface StructuredGrid {
  dims: [number, number, number];
  origin: [number, number, number];
  spacing: [number, number, number];
  count: number;                       // nx*ny*nz
  coverage: number;                    // 채워진 칸 비율
  occupancy: Uint8Array;               // 1 = 값 있음
  pointIndex: Int32Array;              // 원본 점 → 셀 번호 (-1 = 없음)
  scalars: Map<string, Float32Array>;  // NaN = 결측
  vectors: Map<string, Float32Array>;  // xyz 교차, NaN = 결측
}

export type ScalarSampler = (x: number, y: number, z: number) => number;
export type VectorSampler = (x: number, y: number, z: number, out: number[]) => boolean;

interface AxisInfo { min: number; max: number; step: number }

function axisInfo(pos: Float32Array, axis: number, count: number): AxisInfo | null {
  let min = Infinity, max = -Infinity;
  for (let i = 0; i < count; i++) {
    const v = pos[i * 3 + axis];
    if (v !== v) continue;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (!isFinite(min)) return null;
  if (max - min < 1e-9) return { min, max, step: 1 }; // 한 층짜리 축
  // 고유 좌표값(반올림)을 정렬해 이웃 간격의 중앙값을 격자 간격으로 본다.
  // 표본은 앞부분 연속 구간 + 띄엄띄엄 구간을 합친다. 띄엄띄엄만 쓰면 격자 순서(x가 가장 빨리 변함)와
  // 보폭이 맞물려 한 축의 값이 절반만 뽑히고 간격이 2배로 잡히는 일이 있다 (128³ 격자, 보폭 6에서 실제로 생김).
  const set = new Set<number>();
  const stride = Math.max(1, Math.floor(count / 300000));
  const head = Math.min(count, 200000);
  for (let i = 0; i < head; i++) {
    const v = pos[i * 3 + axis];
    if (v === v) set.add(Math.round(v * 1e6) / 1e6);
  }
  for (let i = head; i < count; i += stride) {
    const v = pos[i * 3 + axis];
    if (v === v) set.add(Math.round(v * 1e6) / 1e6);
  }
  const arr = Array.from(set).sort((a, b) => a - b);
  const diffs: number[] = [];
  for (let i = 1; i < arr.length; i++) {
    const d = arr[i] - arr[i - 1];
    if (d > 1e-8) diffs.push(d);
  }
  if (diffs.length === 0) return null;
  diffs.sort((a, b) => a - b);
  return { min, max, step: diffs[Math.floor(diffs.length / 2)] };
}

/** 점 데이터셋에서 격자를 복원한다. 균일 격자가 아니면 null. */
export function buildGridFromPoints(ds: PointDataset): StructuredGrid | null {
  const n = ds.count, pos = ds.positions;
  const ax = [axisInfo(pos, 0, n), axisInfo(pos, 1, n), axisInfo(pos, 2, n)];
  if (ax.some((a) => !a)) return null;
  const info = ax as AxisInfo[];
  const dims = info.map((a) => Math.max(1, Math.round((a.max - a.min) / a.step) + 1)) as [number, number, number];
  const total = dims[0] * dims[1] * dims[2];
  if (total < 8 || total > 80_000_000) return null;

  const pointIndex = new Int32Array(n);
  const occupancy = new Uint8Array(total);
  let bad = 0, dup = 0;
  for (let p = 0; p < n; p++) {
    let idx = 0, mult = 1, ok = true;
    for (let a = 0; a < 3; a++) {
      const f = (pos[p * 3 + a] - info[a].min) / info[a].step;
      const i = Math.round(f);
      if (Math.abs(f - i) > 0.25 || i < 0 || i >= dims[a]) { ok = false; break; }
      idx += i * mult;
      mult *= dims[a];
    }
    if (!ok) { bad++; pointIndex[p] = -1; continue; }
    if (occupancy[idx]) { dup++; pointIndex[p] = -1; continue; }
    occupancy[idx] = 1;
    pointIndex[p] = idx;
  }
  if (bad > n * 0.005 || dup > n * 0.005) return null;
  const coverage = (n - bad - dup) / total;
  if (coverage < 0.05) return null;

  const scalars = new Map<string, Float32Array>();
  for (const s of ds.scalars) {
    const arr = new Float32Array(total).fill(NaN);
    for (let p = 0; p < n; p++) if (pointIndex[p] >= 0) arr[pointIndex[p]] = s.values[p];
    scalars.set(s.name, arr);
  }
  const vectors = new Map<string, Float32Array>();
  for (const v of ds.vectors) {
    const arr = new Float32Array(total * 3).fill(NaN);
    for (let p = 0; p < n; p++) {
      const c = pointIndex[p];
      if (c < 0) continue;
      arr[c * 3] = v.values[p * 3];
      arr[c * 3 + 1] = v.values[p * 3 + 1];
      arr[c * 3 + 2] = v.values[p * 3 + 2];
    }
    vectors.set(v.name, arr);
  }
  return {
    dims,
    origin: [info[0].min, info[1].min, info[2].min],
    spacing: [info[0].step, info[1].step, info[2].step],
    count: total,
    coverage,
    occupancy,
    pointIndex,
    scalars,
    vectors,
  };
}

/**
 * 격자는 그대로 두고 값만 새 데이터셋의 것으로 바꾼다 (시간축에서 다음 저장 시점으로 넘어갈 때).
 * 점의 수·순서·위치가 같아야 한다. 가려진 칸(occupancy 0)은 계속 결측으로 둔다.
 * 새 데이터셋에 있는 필드는 만들고, 없는 필드는 지운다.
 */
export function refillGridFields(g: StructuredGrid, ds: PointDataset): void {
  const n = ds.count, total = g.count, pi = g.pointIndex;
  if (pi.length !== n) throw new Error(`격자 점 수(${pi.length})와 데이터셋 점 수(${n})가 다릅니다.`);
  const keepS = new Set(ds.scalars.map((s) => s.name)), keepV = new Set(ds.vectors.map((v) => v.name));
  for (const k of Array.from(g.scalars.keys())) if (!keepS.has(k)) g.scalars.delete(k);
  for (const k of Array.from(g.vectors.keys())) if (!keepV.has(k)) g.vectors.delete(k);
  for (const s of ds.scalars) {
    let arr = g.scalars.get(s.name);
    if (!arr) { arr = new Float32Array(total); g.scalars.set(s.name, arr); }
    arr.fill(NaN);
    for (let p = 0; p < n; p++) { const c = pi[p]; if (c >= 0 && g.occupancy[c]) arr[c] = s.values[p]; }
  }
  for (const v of ds.vectors) {
    let arr = g.vectors.get(v.name);
    if (!arr) { arr = new Float32Array(total * 3); g.vectors.set(v.name, arr); }
    arr.fill(NaN);
    for (let p = 0; p < n; p++) {
      const c = pi[p];
      if (c < 0 || !g.occupancy[c]) continue;
      arr[c * 3] = v.values[p * 3]; arr[c * 3 + 1] = v.values[p * 3 + 1]; arr[c * 3 + 2] = v.values[p * 3 + 2];
    }
  }
}

/** 좌표에 가장 가까운 셀에 값이 있는지 (다중 레벨 가림 판정용) */
export function hasDataAt(g: StructuredGrid, x: number, y: number, z: number): boolean {
  const i = Math.round((x - g.origin[0]) / g.spacing[0]);
  const j = Math.round((y - g.origin[1]) / g.spacing[1]);
  const k = Math.round((z - g.origin[2]) / g.spacing[2]);
  if (i < 0 || j < 0 || k < 0 || i >= g.dims[0] || j >= g.dims[1] || k >= g.dims[2]) return false;
  return g.occupancy[i + g.dims[0] * (j + g.dims[1] * k)] === 1;
}

/** 지정한 점들이 속한 셀을 결측으로 만든다 (세밀한 레벨이 덮는 거친 셀 가림). */
export function maskCells(g: StructuredGrid, pointIndices: number[]): void {
  for (const p of pointIndices) {
    const c = g.pointIndex[p];
    if (c < 0) continue;
    g.occupancy[c] = 0;
    for (const arr of g.scalars.values()) arr[c] = NaN;
    for (const arr of g.vectors.values()) { arr[c * 3] = NaN; arr[c * 3 + 1] = NaN; arr[c * 3 + 2] = NaN; }
  }
}

// ---- 보간 (trilinear: 둘러싼 8개 격자점 값을 거리 비율로 섞는 것) ----

let li0 = 0, lj0 = 0, lk0 = 0, li1 = 0, lj1 = 0, lk1 = 0, ltx = 0, lty = 0, ltz = 0;

/** 좌표가 속한 셀과 셀 안 비율을 모듈 변수에 넣는다. 격자 밖이면 false. */
function locate(g: StructuredGrid, x: number, y: number, z: number): boolean {
  const [nx, ny, nz] = g.dims;
  const fx = (x - g.origin[0]) / g.spacing[0];
  const fy = (y - g.origin[1]) / g.spacing[1];
  const fz = (z - g.origin[2]) / g.spacing[2];
  if (!(fx >= 0 && fy >= 0 && fz >= 0 && fx <= nx - 1 && fy <= ny - 1 && fz <= nz - 1)) return false;
  li0 = Math.min(Math.floor(fx), Math.max(nx - 2, 0));
  lj0 = Math.min(Math.floor(fy), Math.max(ny - 2, 0));
  lk0 = Math.min(Math.floor(fz), Math.max(nz - 2, 0));
  li1 = Math.min(li0 + 1, nx - 1);
  lj1 = Math.min(lj0 + 1, ny - 1);
  lk1 = Math.min(lk0 + 1, nz - 1);
  ltx = nx > 1 ? fx - li0 : 0;
  lty = ny > 1 ? fy - lj0 : 0;
  ltz = nz > 1 ? fz - lk0 : 0;
  return true;
}

// 둘러싼 8개 격자점의 셀 번호와 가중치 (locate 뒤에 채워짐)
const cIdx = new Int32Array(8);
const cW = new Float64Array(8);

function corners(g: StructuredGrid): void {
  const nx = g.dims[0], nxy = nx * g.dims[1];
  const wx0 = 1 - ltx, wy0 = 1 - lty, wz0 = 1 - ltz;
  cIdx[0] = li0 + nx * lj0 + nxy * lk0; cW[0] = wx0 * wy0 * wz0;
  cIdx[1] = li1 + nx * lj0 + nxy * lk0; cW[1] = ltx * wy0 * wz0;
  cIdx[2] = li0 + nx * lj1 + nxy * lk0; cW[2] = wx0 * lty * wz0;
  cIdx[3] = li1 + nx * lj1 + nxy * lk0; cW[3] = ltx * lty * wz0;
  cIdx[4] = li0 + nx * lj0 + nxy * lk1; cW[4] = wx0 * wy0 * ltz;
  cIdx[5] = li1 + nx * lj0 + nxy * lk1; cW[5] = ltx * wy0 * ltz;
  cIdx[6] = li0 + nx * lj1 + nxy * lk1; cW[6] = wx0 * lty * ltz;
  cIdx[7] = li1 + nx * lj1 + nxy * lk1; cW[7] = ltx * lty * ltz;
}

/**
 * 스칼라 보간 (부분 trilinear). 결측(NaN)인 이웃은 빼고 나머지를 가중 평균한다.
 * 그래서 레벨 경계나 고체 옆에서도 값이 나오고, 이웃이 전혀 없을 때만 NaN이다.
 */
export function sampleScalar(g: StructuredGrid, field: Float32Array, x: number, y: number, z: number): number {
  if (!locate(g, x, y, z)) return NaN;
  corners(g);
  let sum = 0, wsum = 0;
  for (let c = 0; c < 8; c++) {
    const w = cW[c];
    if (w <= 0) continue;
    const v = field[cIdx[c]];
    if (v === v) { sum += v * w; wsum += w; }
  }
  if (wsum > 1e-9) return sum / wsum;
  // 읽는 자리가 결측 격자점 위에 정확히 놓이면 가중치가 그 점에만 실려 NaN이 된다. 그때는 같은 셀의 다른 유효 꼭짓점
  // 평균을 쓴다 — "셀 안에 유효한 꼭짓점이 하나라도 있으면 값이 있다"는 규칙을 격자점 위에서도 지킨다
  let cnt = 0; sum = 0;
  for (let c = 0; c < 8; c++) { const v = field[cIdx[c]]; if (v === v) { sum += v; cnt++; } }
  return cnt ? sum / cnt : NaN;
}

/** 벡터 보간 (부분 trilinear). 성공하면 out에 xyz를 넣고 true. */
export function sampleVector(g: StructuredGrid, field: Float32Array, x: number, y: number, z: number, out: number[]): boolean {
  if (!locate(g, x, y, z)) return false;
  corners(g);
  let sx = 0, sy = 0, sz = 0, wsum = 0;
  for (let c = 0; c < 8; c++) {
    const w = cW[c];
    if (w <= 0) continue;
    const i = cIdx[c] * 3;
    const vx = field[i];
    if (vx !== vx) continue;
    sx += vx * w; sy += field[i + 1] * w; sz += field[i + 2] * w; wsum += w;
  }
  if (wsum <= 1e-9) {
    // 결측 격자점 위에 정확히 놓인 경우: 같은 셀의 유효 꼭짓점 평균 (sampleScalar와 같은 규칙)
    let cnt = 0;
    for (let c = 0; c < 8; c++) { const i = cIdx[c] * 3; const vx = field[i]; if (vx !== vx) continue; sx += vx; sy += field[i + 1]; sz += field[i + 2]; cnt++; }
    if (!cnt) return false;
    out[0] = sx / cnt; out[1] = sy / cnt; out[2] = sz / cnt;
    return true;
  }
  out[0] = sx / wsum; out[1] = sy / wsum; out[2] = sz / wsum;
  return true;
}

/** 여러 레벨(세밀한 것부터)을 차례로 찾는 스칼라 샘플러 */
export function scalarSamplerFor(levels: { grid: StructuredGrid; field: Float32Array }[]): ScalarSampler {
  if (levels.length === 1) { const { grid, field } = levels[0]; return (x, y, z) => sampleScalar(grid, field, x, y, z); }
  return (x, y, z) => {
    for (const l of levels) { const v = sampleScalar(l.grid, l.field, x, y, z); if (v === v) return v; }
    return NaN;
  };
}

/** 여러 레벨(세밀한 것부터)을 차례로 찾는 벡터 샘플러 */
export function vectorSamplerFor(levels: { grid: StructuredGrid; field: Float32Array }[]): VectorSampler {
  if (levels.length === 1) { const { grid, field } = levels[0]; return (x, y, z, out) => sampleVector(grid, field, x, y, z, out); }
  return (x, y, z, out) => {
    for (const l of levels) if (sampleVector(l.grid, l.field, x, y, z, out)) return true;
    return false;
  };
}

/** 격자점 (i,j,k)에서의 기울기(중앙차분). 이웃이 결측이면 그쪽은 중심값으로 대신한다. */
export function gradientAt(g: StructuredGrid, field: Float32Array, i: number, j: number, k: number, out: number[]): void {
  const [nx, ny, nz] = g.dims;
  const nxy = nx * ny;
  const c = field[i + nx * j + nxy * k];
  const pick = (ii: number, jj: number, kk: number): number => {
    if (ii < 0 || jj < 0 || kk < 0 || ii >= nx || jj >= ny || kk >= nz) return c;
    const v = field[ii + nx * jj + nxy * kk];
    return v === v ? v : c;
  };
  out[0] = (pick(i + 1, j, k) - pick(i - 1, j, k)) / (2 * g.spacing[0]);
  out[1] = (pick(i, j + 1, k) - pick(i, j - 1, k)) / (2 * g.spacing[1]);
  out[2] = (pick(i, j, k + 1) - pick(i, j, k - 1)) / (2 * g.spacing[2]);
}

export function gridBounds(g: StructuredGrid): Bounds {
  return {
    min: [g.origin[0], g.origin[1], g.origin[2]],
    max: [g.origin[0] + (g.dims[0] - 1) * g.spacing[0], g.origin[1] + (g.dims[1] - 1) * g.spacing[1], g.origin[2] + (g.dims[2] - 1) * g.spacing[2]],
  };
}

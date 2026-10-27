// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   pointDataset.ts

점(포인트) 형태 해석 결과의 메모리 표현. CSV 로더가 만들고 렌더러가 읽는다.
자사 후처리기의 PointData(offset JSON + 이진 VTK)와 달리 전체 배열을 메모리에 둔다.
*/
/******************************************************************************/

export interface FieldStats {
  min: number;
  max: number;
  p2: number;  // 2% 백분위 — 치우친 분포(농도 등)의 기본 색 범위 하한
  p98: number; // 98% 백분위
}

export interface ScalarField {
  kind: 'scalar';
  name: string;
  values: Float32Array; // 길이 n
  stats: FieldStats;
}

export interface VectorField {
  kind: 'vector';
  name: string;
  componentNames: [string, string, string];
  values: Float32Array;    // xyz 교차 배열, 길이 3n
  magnitude: Float32Array; // 길이 n
  stats: { magnitude: FieldStats; x: FieldStats; y: FieldStats; z: FieldStats };
}

export type Field = ScalarField | VectorField;
export type VectorMapping = 'magnitude' | 'x' | 'y' | 'z';

export interface Bounds {
  min: [number, number, number];
  max: [number, number, number];
}

export interface PointDataset {
  name: string;
  count: number;
  positions: Float32Array; // xyz 교차 배열
  bounds: Bounds;
  spacing: number;         // 추정 격자 간격 (점 반지름 기본값에 사용)
  radii?: Float32Array;    // 점마다 다른 반지름 (다중 레벨 합칠 때). 없으면 spacing 기준
  scalars: ScalarField[];
  vectors: VectorField[];
  columns: string[];       // 원본 열 이름 전체
  coordColumns: [string, string, string];
}

/** xyz 교차 배열에서 벡터 필드(크기·성분 통계 포함)를 만든다. */
export function vectorFieldFromInterleaved(name: string, componentNames: [string, string, string], values: Float32Array): VectorField {
  const n = values.length / 3;
  const magnitude = new Float32Array(n), xs = new Float32Array(n), ys = new Float32Array(n), zs = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = values[i * 3], y = values[i * 3 + 1], z = values[i * 3 + 2];
    xs[i] = x; ys[i] = y; zs[i] = z;
    magnitude[i] = Math.sqrt(x * x + y * y + z * z);
  }
  return {
    kind: 'vector', name, componentNames, values, magnitude,
    stats: { magnitude: computeStats(magnitude), x: computeStats(xs), y: computeStats(ys), z: computeStats(zs) },
  };
}

export function computeStats(values: Float32Array): FieldStats {
  let min = Infinity, max = -Infinity;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (v !== v) continue; // NaN
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (!isFinite(min)) return { min: 0, max: 1, p2: 0, p98: 1 };
  // 백분위: 최대 6만 개를 고르게 뽑아 정렬
  const stride = Math.max(1, Math.floor(values.length / 60000));
  const sample: number[] = [];
  for (let i = 0; i < values.length; i += stride) {
    const v = values[i];
    if (v === v) sample.push(v);
  }
  sample.sort((a, b) => a - b);
  const q = (p: number) => sample[Math.min(sample.length - 1, Math.max(0, Math.floor(p * (sample.length - 1))))];
  let p2 = q(0.02), p98 = q(0.98);
  if (p98 <= p2) { p2 = min; p98 = max; }
  [p2, p98] = widenRange(p2, p98);
  return { min, max, p2, p98 };
}

/**
 * 색 범위의 최소 폭. 값 크기의 1e-4보다 좁은 범위는 가운데를 기준으로 그만큼 넓힌다.
 * 거의 일정한 필드(예: 밀도 1 ± 1e-6)를 범위 1~1로 그리면 float32 보간 오차(약 1e-7)가 컬러맵 전체로 번져 삼각형 얼룩이 생긴다.
 * 1e-4는 그 오차의 1000배라 얼룩은 사라지고, 실제 변화가 그보다 크면 범위에 영향이 없다.
 */
export function widenRange(lo: number, hi: number): [number, number] {
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return [0, 1];
  if (hi < lo) [lo, hi] = [hi, lo];
  const scale = Math.max(Math.abs(lo), Math.abs(hi));
  const minSpan = scale > 0 ? scale * 1e-4 : 1e-12;
  if (hi - lo >= minSpan) return [lo, hi];
  const mid = (lo + hi) / 2;
  return [mid - minSpan / 2, mid + minSpan / 2];
}

export function computeBounds(positions: Float32Array, count: number): Bounds {
  const min: [number, number, number] = [Infinity, Infinity, Infinity];
  const max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < count; i++) {
    for (let k = 0; k < 3; k++) {
      const v = positions[i * 3 + k];
      if (v !== v) continue;
      if (v < min[k]) min[k] = v;
      if (v > max[k]) max[k] = v;
    }
  }
  for (let k = 0; k < 3; k++) {
    if (!isFinite(min[k])) { min[k] = 0; max[k] = 1; }
    if (max[k] <= min[k]) max[k] = min[k] + 1;
  }
  return { min, max };
}

/** x 좌표를 정렬해 이웃 간격의 중앙값으로 격자 간격을 추정한다. */
export function estimateSpacing(positions: Float32Array, count: number, bounds: Bounds): number {
  // 앞부분 연속 구간 + 띄엄띄엄 구간 (격자 순서와 보폭이 맞물려 값이 절반만 뽑히는 것을 막는다)
  const stride = Math.max(1, Math.floor(count / 20000));
  const head = Math.min(count, 20000);
  const xs: number[] = [];
  for (let i = 0; i < head; i++) xs.push(positions[i * 3]);
  for (let i = head; i < count; i += stride) xs.push(positions[i * 3]);
  xs.sort((a, b) => a - b);
  const diffs: number[] = [];
  for (let i = 1; i < xs.length; i++) {
    const d = xs[i] - xs[i - 1];
    if (d > 1e-9) diffs.push(d);
  }
  if (diffs.length > 0) {
    diffs.sort((a, b) => a - b);
    return diffs[Math.floor(diffs.length / 2)];
  }
  const dx = bounds.max[0] - bounds.min[0], dy = bounds.max[1] - bounds.min[1], dz = bounds.max[2] - bounds.min[2];
  return Math.cbrt((dx * dy * dz) / Math.max(count, 1));
}

/** 색·필터에 쓰는 현재 값 배열(스칼라 또는 벡터의 크기/성분)을 돌려준다. */
export function mappedValues(field: Field, mapping: VectorMapping): Float32Array {
  if (field.kind === 'scalar') return field.values;
  if (mapping === 'magnitude') return field.magnitude;
  const k = mapping === 'x' ? 0 : mapping === 'y' ? 1 : 2;
  const n = field.magnitude.length;
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = field.values[i * 3 + k];
  return out;
}

export function mappedStats(field: Field, mapping: VectorMapping): FieldStats {
  if (field.kind === 'scalar') return field.stats;
  return field.stats[mapping];
}

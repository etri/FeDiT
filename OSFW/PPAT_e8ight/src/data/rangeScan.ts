// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   rangeScan.ts

'전 시점 범위'용 최소~최대 계산 (순수 함수 — scripts/test_color_range.mjs 가 시험한다). 숫자 배열 하나에서 최소·최대만 구하고
ScalarField·VectorField·백분위 통계는 만들지 않는다(저장 시점마다 한 벌씩 만들면 시간·메모리가 든다).
값은 화면과 같게 float32 로 맞춘다: 스칼라 fround(v), 벡터 크기 fround(sqrt(x²+y²+z²))(x·y·z 는 각각 fround), 성분 fround(x) —
loaders/vtu_loader.ts asFloat32 → pointDataset.ts vectorFieldFromInterleaved 를 거친 값과 비트까지 같다. NaN·±Infinity 는 건너뛴다.
*/
/******************************************************************************/
import { VectorMapping } from './pointDataset';

/**
 * data = 원본 배열(셀 순서, comps 성분 교차 — Float64 여도 Float32 로 바꿔 담지 않고 바로 훑는다), comps = 1(스칼라) | 3(벡터, mapping 으로 크기·X·Y·Z),
 * kept = 쓸 셀 번호(위상의 남긴 셀 — 고체 뺌. null 이면 전부), mask = kept 순서의 점마다 1 이면 씀(다중 레벨에서 고운 레벨이 덮은 굵은 셀을 뺌. null 이면 전부).
 * count = 쓴 유한 값 수(0 이면 min = Infinity, max = -Infinity).
 * magMax = 같은 셀들의 벡터 크기 최대(벡터 comps 3 일 때 — 성분으로 칠할 때 '모두 같음' 문턱 하한, core/colorRange.ts componentFlatFloor.
 * 성분을 읽어도 같은 배열의 x·y·z 를 이미 들고 있으므로 더 읽지 않는다). 스칼라·값 없음이면 -Infinity
 */
export function minMaxMapped(data: ArrayLike<number>, comps: number, mapping: VectorMapping, kept: ArrayLike<number> | null, mask: ArrayLike<number> | null): { min: number; max: number; count: number; magMax: number } {
  const f = Math.fround;
  const n = kept ? kept.length : Math.floor(data.length / Math.max(1, comps));
  const k = mapping === 'x' ? 0 : mapping === 'y' ? 1 : mapping === 'z' ? 2 : -1;
  let lo = Infinity, hi = -Infinity, count = 0, mag = -Infinity;
  for (let i = 0; i < n; i++) {
    if (mask && !mask[i]) continue;
    const c = (kept ? kept[i] : i) * comps;
    let v: number;
    if (comps === 1) v = f(data[c]);
    else {
      const x = f(data[c]), y = f(data[c + 1]), z = f(data[c + 2]);
      const m = f(Math.sqrt(x * x + y * y + z * z));
      if (Number.isFinite(m) && m > mag) mag = m;
      v = k < 0 ? m : k === 0 ? x : k === 1 ? y : z;
    }
    if (!Number.isFinite(v)) continue; // 배열 밖(undefined → NaN)도 여기서 빠진다
    if (v < lo) lo = v;
    if (v > hi) hi = v;
    count++;
  }
  return { min: lo, max: hi, count, magMax: mag };
}

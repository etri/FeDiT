// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   filter.ts

Clip·Threshold 사슬(조상 Clip·Threshold)의 CPU 판정. 볼륨 노드의 Points 표현(hidden 속성)·Surface/Outline 표현(격자 셀 keep),
Glyph 거르기, 표시 개수·'보이는 값' 범위에 쓴다. 점(합친 데이터셋) 단위는 makeChainTester, 격자 셀 단위는 makeGridChainTester.
- Clip: Plane·Box 는 자리로, Scalar 는 그 Field 값으로 판정한다(layers.ts clipKeeps — Invert 포함 ParaView 뜻 그대로).
- Threshold: Between·Below·Above + Invert(layers.ts thresholdKeeps). Field 가 데이터에 없으면 통과(아무것도 거르지 않음).
사슬의 항목은 모두 AND. bandClip(얇은 층 Box)은 layers.ts 로 옮겼다.
*/
/******************************************************************************/
import { ChainItem, ClipParams, ThresholdParams, clipKeeps, thresholdKeeps } from '../core/layers';
import { VectorMapping } from '../data/pointDataset';
import { StructuredGrid } from '../data/gridDataset';

type ValuesOf = (fieldKey: string | null, mapping: VectorMapping) => Float32Array | null;
/** 사슬 항목에 값 배열을 붙인다. Field 가 데이터에 없으면 그 Scalar Clip·Threshold 는 통과(목록에서 뺀다) */
function prepare(chain: ChainItem[], valuesOf: ValuesOf) {
  const clips: { c: ClipParams; values: Float32Array | null }[] = [];
  const thrs: { t: ThresholdParams; values: Float32Array }[] = [];
  for (const it of chain) {
    if (it.kind === 'clip') {
      if (it.params.clipType !== 'scalar') { clips.push({ c: it.params, values: null }); continue; }
      const values = valuesOf(it.params.fieldKey, it.params.mapping);
      if (values) clips.push({ c: it.params, values });
    } else {
      const values = valuesOf(it.params.fieldKey, it.params.mapping);
      if (values) thrs.push({ t: it.params, values });
    }
  }
  return { clips, thrs };
}

/**
 * 점 하나(i번째)가 사슬을 통과하는지 판정하는 함수를 만든다.
 * @param positions xyz 교차 배열
 * @param valuesOf  Scalar Clip·Threshold 의 Field 값 배열을 돌려준다 (없으면 null → 그 항목은 통과)
 */
export function makeChainTester(chain: ChainItem[], positions: Float32Array, valuesOf: ValuesOf): (i: number) => boolean {
  const { clips, thrs } = prepare(chain, valuesOf);
  if (!clips.length && !thrs.length) return () => true;
  return (i) => {
    const x = positions[i * 3], y = positions[i * 3 + 1], z = positions[i * 3 + 2];
    for (const { c, values } of clips) if (!clipKeeps(c, x, y, z, values ? values[i] : NaN)) return false;
    for (const { t, values } of thrs) if (!thresholdKeeps(t, values[i])) return false; // NaN(결측)도 거른다
    return true;
  };
}

/**
 * 격자 셀 하나(c)가 사슬을 통과하는지 판정하는 함수 (볼륨 노드의 Surface·Outline 표현).
 * Plane·Box 는 셀 중심 좌표, Scalar Clip·Threshold 는 그 레벨 격자의 셀 값(levelValuesOf)으로 본다. 빈 칸(occupancy 0)은 늘 거른다.
 */
export function makeGridChainTester(chain: ChainItem[], g: StructuredGrid, levelValuesOf: ValuesOf): (c: number) => boolean {
  const { clips, thrs } = prepare(chain, levelValuesOf);
  const [nx, ny] = g.dims, nxy = nx * ny;
  return (c) => {
    if (g.occupancy[c] !== 1) return false;
    if (clips.length) {
      const k = Math.floor(c / nxy), rem = c - k * nxy, j = Math.floor(rem / nx), i = rem - j * nx;
      const x = g.origin[0] + i * g.spacing[0], y = g.origin[1] + j * g.spacing[1], z = g.origin[2] + k * g.spacing[2];
      for (const { c: cl, values } of clips) if (!clipKeeps(cl, x, y, z, values ? values[c] : NaN)) return false;
    }
    for (const { t, values } of thrs) if (!thresholdKeeps(t, values[c])) return false;
    return true;
  };
}

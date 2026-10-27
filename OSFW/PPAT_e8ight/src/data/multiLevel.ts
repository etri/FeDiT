// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   multiLevel.ts

여러 세밀도 레벨의 점 데이터셋을 하나로 다룬다.
- 레벨마다 격자를 복원하고, 세밀한 레벨이 값을 가진 자리의 거친 셀은 가린다(중복 표시 방지).
- 점 렌더링용으로 모든 레벨을 합친 데이터셋(점마다 반지름)을 만든다.
단일 데이터셋(CSV)도 레벨 1개짜리로 같은 경로를 탄다.
*/
/******************************************************************************/
import { PointDataset, ScalarField, VectorField, computeBounds, computeStats, vectorFieldFromInterleaved } from './pointDataset';
import { StructuredGrid, buildGridFromPoints, hasDataAt, maskCells, refillGridFields } from './gridDataset';

export interface LevelData {
  name: string;
  dataset: PointDataset;
  grid: StructuredGrid | null;
  spacing: number;
  keep: Uint8Array;      // 합친 점 집합에 남긴 점(가려지지 않은 점)
  keptCount: number;
}

export interface MultiLevelResult {
  levels: LevelData[];   // 세밀한 것 → 거친 것
  combined: PointDataset;
}

export function buildMultiLevel(datasets: PointDataset[]): MultiLevelResult {
  const levels: LevelData[] = datasets.map((ds) => ({
    name: ds.name, dataset: ds, grid: buildGridFromPoints(ds), spacing: ds.spacing,
    keep: new Uint8Array(ds.count).fill(1), keptCount: ds.count,
  }));
  levels.sort((a, b) => a.spacing - b.spacing);

  // 가림: 더 세밀한 레벨(격자 있는 것)이 값을 가진 자리의 거친 점/셀을 지운다
  for (let li = 1; li < levels.length; li++) {
    const L = levels[li];
    const finer = levels.slice(0, li).filter((f) => f.grid).map((f) => f.grid!);
    if (finer.length === 0) continue;
    const pos = L.dataset.positions;
    const covered: number[] = [];
    for (let p = 0; p < L.dataset.count; p++) {
      const x = pos[p * 3], y = pos[p * 3 + 1], z = pos[p * 3 + 2];
      for (const g of finer) {
        if (hasDataAt(g, x, y, z)) { L.keep[p] = 0; covered.push(p); break; }
      }
    }
    L.keptCount = L.dataset.count - covered.length;
    if (L.grid && covered.length) maskCells(L.grid, covered);
  }

  return { levels, combined: combine(levels) };
}

/**
 * 시간축: 레벨마다 새 값(같은 점 수·순서)이 오면 격자 값과 합친 데이터셋 값만 갈아 끼운다.
 * 위치·가림·격자 구조는 그대로라 GPU 점 위치 버퍼도 다시 만들 필요가 없다.
 * 레벨 하나뿐이면 combined가 그 레벨 데이터셋과 같은 객체이므로 필드 참조만 바꾼다.
 */
export function replaceLevelValues(ml: MultiLevelResult, datasets: PointDataset[]): void {
  if (datasets.length !== ml.levels.length) throw new Error('레벨 수가 다릅니다.');
  const byName = new Map(datasets.map((d) => [d.name, d]));
  for (const l of ml.levels) {
    const ds = byName.get(l.name) ?? datasets[ml.levels.indexOf(l)];
    if (ds.count !== l.dataset.count) throw new Error(`${l.name}: 점 수가 다릅니다 (${ds.count} vs ${l.dataset.count}).`);
    l.dataset.scalars = ds.scalars;
    l.dataset.vectors = ds.vectors;
    if (l.grid) refillGridFields(l.grid, l.dataset);
  }
  const single = ml.levels.length === 1 && ml.levels[0].keptCount === ml.levels[0].dataset.count;
  if (single) { ml.combined.scalars = ml.levels[0].dataset.scalars; ml.combined.vectors = ml.levels[0].dataset.vectors; return; }
  const fresh = combine(ml.levels);
  ml.combined.scalars = fresh.scalars;
  ml.combined.vectors = fresh.vectors;
}

function combine(levels: LevelData[]): PointDataset {
  if (levels.length === 1 && levels[0].keptCount === levels[0].dataset.count) return levels[0].dataset;
  const total = levels.reduce((s, l) => s + l.keptCount, 0);
  const positions = new Float32Array(total * 3);
  const radii = new Float32Array(total);
  // 모든 레벨에 있는 필드만 합친다
  const scalarNames = levels[0].dataset.scalars.map((s) => s.name).filter((n) => levels.every((l) => l.dataset.scalars.some((s) => s.name === n)));
  const vectorNames = levels[0].dataset.vectors.map((v) => v.name).filter((n) => levels.every((l) => l.dataset.vectors.some((v) => v.name === n)));
  const scalarArrays = scalarNames.map(() => new Float32Array(total));
  const vectorArrays = vectorNames.map(() => new Float32Array(total * 3));
  let o = 0;
  for (const l of levels) {
    const ds = l.dataset;
    const sFields = scalarNames.map((n) => ds.scalars.find((s) => s.name === n)!);
    const vFields = vectorNames.map((n) => ds.vectors.find((v) => v.name === n)!);
    for (let p = 0; p < ds.count; p++) {
      if (!l.keep[p]) continue;
      positions[o * 3] = ds.positions[p * 3]; positions[o * 3 + 1] = ds.positions[p * 3 + 1]; positions[o * 3 + 2] = ds.positions[p * 3 + 2];
      radii[o] = l.spacing * 0.55;
      for (let s = 0; s < sFields.length; s++) scalarArrays[s][o] = sFields[s].values[p];
      for (let v = 0; v < vFields.length; v++) {
        vectorArrays[v][o * 3] = vFields[v].values[p * 3];
        vectorArrays[v][o * 3 + 1] = vFields[v].values[p * 3 + 1];
        vectorArrays[v][o * 3 + 2] = vFields[v].values[p * 3 + 2];
      }
      o++;
    }
  }
  const scalars: ScalarField[] = scalarNames.map((n, i) => ({ kind: 'scalar', name: n, values: scalarArrays[i], stats: computeStats(scalarArrays[i]) }));
  const vectors: VectorField[] = vectorNames.map((n, i) => vectorFieldFromInterleaved(n, levels[0].dataset.vectors.find((v) => v.name === n)!.componentNames, vectorArrays[i]));
  return {
    name: levels.map((l) => l.name).join('+'),
    count: total,
    positions,
    radii,
    bounds: computeBounds(positions, total),
    spacing: levels[0].spacing,
    scalars,
    vectors,
    columns: levels[0].dataset.columns,
    coordColumns: levels[0].dataset.coordColumns,
  };
}

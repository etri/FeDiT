// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   csv_loader.ts

CSV(쉼표로 칸을 나눈 표) 해석 결과 로더.
- 첫 줄(열 이름)에서 좌표 열(x,y,z)과 속성 열을 자동으로 찾는다.
- ParaView 내보내기 형식(Points:0/1/2, U:0/1/2)과 u,v,w / vel_x 같은 이름도 인식한다.
- 3개 성분이 모두 있는 열 묶음은 벡터(vector) 필드로, 나머지 숫자 열은 스칼라(scalar) 필드로 등록한다.
*/
/******************************************************************************/
import {
  Bounds, FieldStats, PointDataset, ScalarField, VectorField,
  computeBounds, computeStats, estimateSpacing,
} from '../pointDataset';

export interface CsvParseResult {
  dataset: PointDataset;
  skippedRows: number;
  droppedColumns: string[]; // 숫자가 아니어서 버린 열
}

const AXES = ['x', 'y', 'z'] as const;

/** 소문자화, 단위 괄호 제거, 공백·따옴표 제거 */
function normalize(name: string): string {
  return name.toLowerCase().replace(/\[[^\]]*\]|\([^)]*\)/g, '').replace(/[\s"']/g, '');
}

function coordCandidates(i: number): string[] {
  const a = AXES[i];
  return [
    a, `points:${i}`, `points_${i}`, `points${i}`, `point:${i}`, `point_${i}`, `position:${i}`, `position_${i}`,
    `pos${a}`, `pos_${a}`, `position${a}`, `position_${a}`, `p${a}`, `coord${a}`, `coord_${a}`, `coords_${a}`,
    `${a}coord`, `${a}_coord`, `${a}pos`, `${a}_pos`, `${a}c`, `centroid_${a}`, `center_${a}`, `cell_${a}`, `node_${a}`,
  ];
}

function pickDelimiter(header: string): string {
  let best = ',', bestCount = -1;
  for (const d of [',', ';', '\t', '|']) {
    const c = header.split(d).length - 1;
    if (c > bestCount) { best = d; bestCount = c; }
  }
  return best;
}

interface CompCandidate { base: string; comp: number; idx: number }

function componentCandidate(norm: string, idx: number): CompCandidate | null {
  let m: RegExpExecArray | null;
  if ((m = /^(.+?)[_:\-.]([xyz])$/.exec(norm))) return { base: m[1], comp: 'xyz'.indexOf(m[2]), idx };
  if ((m = /^(.+?)[_:.]?\[?([012])\]?$/.exec(norm)) && m[1].length > 0) {
    return { base: m[1].replace(/[_:.[]+$/, ''), comp: Number(m[2]), idx };
  }
  if ((m = /^(.{2,})([xyz])$/.exec(norm))) return { base: m[1], comp: 'xyz'.indexOf(m[2]), idx };
  return null;
}

export function parseCsv(text: string, name: string): CsvParseResult {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const lines = text.split(/\r?\n/);
  let h = 0;
  while (h < lines.length && lines[h].trim() === '') h++;
  if (h >= lines.length) throw new Error('CSV 파일이 비어 있습니다.');

  const delim = pickDelimiter(lines[h]);
  const columns = lines[h].split(delim).map((s) => s.trim().replace(/^"|"$/g, ''));
  const ncol = columns.length;

  let rows = 0;
  for (let i = h + 1; i < lines.length; i++) if (lines[i].trim() !== '') rows++;
  if (rows === 0) throw new Error('CSV에 데이터 행이 없습니다.');

  const raw: Float32Array[] = columns.map(() => new Float32Array(rows));
  let r = 0, skipped = 0;
  for (let i = h + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '') continue;
    const cells = line.split(delim);
    if (cells.length < ncol) { skipped++; continue; }
    for (let c = 0; c < ncol; c++) raw[c][r] = parseFloat(cells[c]);
    r++;
  }
  const count = r;
  const cols = raw.map((a) => a.subarray(0, count));

  // 숫자 열 판정: 앞부분 200행이 전부 NaN이면 문자열 열로 보고 버린다.
  const probe = Math.min(200, count);
  const numeric = cols.map((a) => {
    for (let i = 0; i < probe; i++) if (a[i] === a[i]) return true;
    return false;
  });
  const droppedColumns = columns.filter((_, j) => !numeric[j]);

  const norm = columns.map(normalize);
  const coordIdx: number[] = [];
  for (let k = 0; k < 3; k++) {
    const cands = coordCandidates(k);
    coordIdx.push(norm.findIndex((nm, j) => numeric[j] && cands.includes(nm)));
  }
  if (coordIdx.some((i) => i < 0)) {
    throw new Error(`좌표 열(x, y, z)을 찾지 못했습니다. 열 이름: ${columns.join(', ')}`);
  }

  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = cols[coordIdx[0]][i];
    positions[i * 3 + 1] = cols[coordIdx[1]][i];
    positions[i * 3 + 2] = cols[coordIdx[2]][i];
  }
  const bounds: Bounds = computeBounds(positions, count);

  const used = new Set<number>(coordIdx);
  const vectors: VectorField[] = [];

  // u,v,w → velocity (CFD 관례)
  const uvw = ['u', 'v', 'w'].map((s) => norm.findIndex((nm, j) => numeric[j] && !used.has(j) && nm === s));
  if (uvw.every((i) => i >= 0)) {
    vectors.push(makeVector('velocity', [columns[uvw[0]], columns[uvw[1]], columns[uvw[2]]], uvw.map((i) => cols[i]), count));
    uvw.forEach((i) => used.add(i));
  }

  // 접미사 규칙으로 벡터 묶음 찾기 (성분 0,1,2가 모두 있어야 벡터로 인정)
  const groups = new Map<string, CompCandidate[]>();
  for (let j = 0; j < ncol; j++) {
    if (!numeric[j] || used.has(j)) continue;
    const cand = componentCandidate(norm[j], j);
    if (!cand) continue;
    const list = groups.get(cand.base) ?? [];
    list.push(cand);
    groups.set(cand.base, list);
  }
  for (const [base, list] of groups) {
    const byComp = [0, 1, 2].map((c) => list.find((x) => x.comp === c));
    if (byComp.some((x) => !x)) continue;
    const idxs = byComp.map((x) => x!.idx);
    const label = columns[idxs[0]].replace(/[_:\-.\s]*[xX0]\]?$/, '') || base;
    vectors.push(makeVector(label, [columns[idxs[0]], columns[idxs[1]], columns[idxs[2]]], idxs.map((i) => cols[i]), count));
    idxs.forEach((i) => used.add(i));
  }

  const scalars: ScalarField[] = [];
  for (let j = 0; j < ncol; j++) {
    if (!numeric[j] || used.has(j)) continue;
    scalars.push({ kind: 'scalar', name: columns[j], values: cols[j], stats: computeStats(cols[j]) });
  }

  const dataset: PointDataset = {
    name,
    count,
    positions,
    bounds,
    spacing: estimateSpacing(positions, count, bounds),
    scalars,
    vectors,
    columns,
    coordColumns: [columns[coordIdx[0]], columns[coordIdx[1]], columns[coordIdx[2]]],
  };
  return { dataset, skippedRows: skipped, droppedColumns };
}

function makeVector(name: string, componentNames: [string, string, string], comps: Float32Array[], count: number): VectorField {
  const values = new Float32Array(count * 3);
  const magnitude = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const x = comps[0][i], y = comps[1][i], z = comps[2][i];
    values[i * 3] = x; values[i * 3 + 1] = y; values[i * 3 + 2] = z;
    magnitude[i] = Math.sqrt(x * x + y * y + z * z);
  }
  const stats: { magnitude: FieldStats; x: FieldStats; y: FieldStats; z: FieldStats } = {
    magnitude: computeStats(magnitude),
    x: computeStats(comps[0]),
    y: computeStats(comps[1]),
    z: computeStats(comps[2]),
  };
  return { kind: 'vector', name, componentNames, values, magnitude, stats };
}

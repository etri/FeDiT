// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   upAxis.ts

화면에서 위로 세울 축(위쪽). 바꾸는 것은 카메라의 위쪽과 보기 단추 방향 · 바닥 격자 · 조명뿐이고, 데이터 좌표와
Slice 'Z = …' 같은 숫자는 그대로다. three 에 기대지 않는 순수 함수만 둔다(Node 시험: scripts/test_up_axis.mjs).

처음 값(upFromInput): 데이터를 열 때와 전처리에서 템플릿·입력을 받을 때 한 번 정하고, 그 뒤에는 사용자가 고를 때만 바뀐다.
1. 입력 JSON 의 config.source_terms.gravity 가 0 이 아니면 -gravity 의 세 성분 중 절댓값이 가장 큰 성분의 축·부호
   ([0,-9.81,0] → +Y, [0,0,-1.25e-05] → +Z, [3,-4,0] → +Y). 크기가 같으면 Z, Y, X 순.
2. 중력이 0 이거나 칸이 없는데 입력 JSON 이 있고 Z 방향이 한 층(2D)이면 +Y — 그 판이 서서 보이게.
3. 나머지(입력 JSON 이 없는 도시 CSV·Ahmed, 중력 0 인 3D)는 +Z.

회전표(fromZUp): '+Z 가 위일 때의 방향'을 위쪽마다 옮긴다. 오른손 좌표계를 지키는(행렬식 +1) 축 바꿈이라 거울상이 되지 않는다.
+Z (a,b,c) 그대로 · +Y (a,c,-b) · -Y (a,-c,b) · +X (c,a,b) · -X (-c,a,-b) · -Z (a,-b,-c).
+Y 일 때 '측면'은 +Z 쪽에서 XY 면을 정면으로 보고(X 오른쪽 · Y 위), '평면'은 언제나 위쪽에서 내려다본다.
*/
/******************************************************************************/

export type UpAxis = '+X' | '-X' | '+Y' | '-Y' | '+Z' | '-Z';

/** 도구막대 선택지 차례 */
export const UP_AXES: readonly UpAxis[] = ['+X', '-X', '+Y', '-Y', '+Z', '-Z'];
export const DEFAULT_UP: UpAxis = '+Z';

type Vec3 = [number, number, number];

/** 회전표 한 줄: 나오는 성분 k = sgn[k] × 들어온 성분 idx[k] */
interface UpTable { idx: [number, number, number]; sgn: [number, number, number] }
const TABLE: Record<UpAxis, UpTable> = {
  '+Z': { idx: [0, 1, 2], sgn: [1, 1, 1] },
  '+Y': { idx: [0, 2, 1], sgn: [1, 1, -1] },
  '-Y': { idx: [0, 2, 1], sgn: [1, -1, 1] },
  '+X': { idx: [2, 0, 1], sgn: [1, 1, 1] },
  '-X': { idx: [2, 0, 1], sgn: [-1, 1, -1] },
  '-Z': { idx: [0, 1, 2], sgn: [1, -1, -1] },
};

export function isUpAxis(v: unknown): v is UpAxis {
  return typeof v === 'string' && (UP_AXES as readonly string[]).includes(v);
}

/** 위쪽 축 번호 (X 0 · Y 1 · Z 2) */
export function upIndex(up: UpAxis): 0 | 1 | 2 {
  return up[1] === 'X' ? 0 : up[1] === 'Y' ? 1 : 2;
}

/** 위쪽 부호 (+1 · -1) */
export function upSign(up: UpAxis): 1 | -1 {
  return up[0] === '-' ? -1 : 1;
}

/** 위쪽 단위 벡터 */
export function upVector(up: UpAxis): Vec3 {
  const v: Vec3 = [0, 0, 0];
  v[upIndex(up)] = upSign(up);
  return v;
}

/** 위쪽이 아닌 두 축(수평 두 축) 번호. 차례는 위쪽 다음 축부터 돈다(+Z → X·Y, +Y → Z·X, +X → Y·Z) */
export function horizontalAxes(up: UpAxis): [number, number] {
  const k = upIndex(up);
  return [(k + 1) % 3, (k + 2) % 3];
}

/** '+Z 가 위일 때의 방향' v 를 위쪽 up 기준으로 옮긴다 (회전표) */
export function fromZUp(up: UpAxis, v: readonly number[]): Vec3 {
  const t = TABLE[up];
  return [t.sgn[0] * v[t.idx[0]], t.sgn[1] * v[t.idx[1]], t.sgn[2] * v[t.idx[2]]];
}

/** 회전표의 3×3 행렬 (행 우선). 시험에서 행렬식을 본다 */
export function upMatrix(up: UpAxis): number[][] {
  const t = TABLE[up];
  return [0, 1, 2].map((k) => { const row = [0, 0, 0]; row[t.idx[k]] = t.sgn[k]; return row; });
}

/**
 * 결과가 Z 방향 셀 한 층(2D)인가 — 규칙 2 의 판정(후처리). 점 좌표는 셀 중심이라 한 층이면 블록마다 z 폭이 0 이다.
 * 블록(레벨)마다 z 폭이 그 블록 격자 간격(spacing, 추정값)의 절반보다 작아야 한다(두 층이면 폭이 한 간격). 셀이 없는 블록은 뺀다.
 */
export function zSingleLayer(blocks: readonly { count: number; spacing: number; bounds: { min: readonly number[]; max: readonly number[] } }[]): boolean {
  const ds = blocks.filter((d) => d.count > 0);
  return ds.length > 0 && ds.every((d) => d.bounds.max[2] - d.bounds.min[2] < Math.max(d.spacing, 1e-12) * 0.5);
}

/**
 * 데이터를 열 때의 처음 위쪽 (위 설명의 규칙 1~3).
 * gravity = 입력 JSON 의 config.source_terms.gravity (숫자 셋이 아니면 없는 것으로 본다).
 * zSingleLayer = 입력 JSON 이 있고 Z 방향 셀이 한 층(2D)인가 — 입력 JSON 이 없는 데이터는 false 로 넘긴다(그러면 언제나 +Z).
 */
export function upFromInput(gravity: unknown, zSingleLayer: boolean): UpAxis {
  const g = Array.isArray(gravity) && gravity.length === 3 && gravity.every((x) => typeof x === 'number' && Number.isFinite(x)) ? gravity as number[] : null;
  if (g && g.some((x) => x !== 0)) {
    let best = 2; // 크기가 같으면 Z, Y, X 순
    for (const i of [1, 0]) if (Math.abs(g[i]) > Math.abs(g[best])) best = i;
    return `${-g[best] > 0 ? '+' : '-'}${'XYZ'[best]}` as UpAxis;
  }
  return zSingleLayer ? '+Y' : '+Z';
}

/**
 * 계산 영역의 Z 방향 셀 수 — 규칙 2 의 판정(전처리, pre/state.ts adopt). base_dx 기준이고 전처리 cellEstimate 와 같은 셈이다
 * (영역이 한 셀보다 얇아도 1). baseDx 가 0 이하·숫자가 아니면 0 (= 한 층으로 보지 않음).
 * base_dx 칸이 없는 입력은 전처리가 1 로 읽고(readCore) 내보낼 때도 1 로 쓰므로, 그 값으로 센 결과가 해석기가 만들 층 수와 같다.
 */
export function zCellLayers(minZ: number, maxZ: number, baseDx: number): number {
  return baseDx > 0 ? Math.max(1, Math.round((maxZ - minZ) / baseDx)) : 0;
}

/**
 * Streamline 시작면의 가로 축 b · 세로 축 c (AppCore.streamSeeds). seedAxis = 시작면 법선 축.
 * 세로 = 위쪽 축('아래에서부터 사용할 높이 비율'이 실제 높이에 걸리게). 시작면 법선이 위쪽 축이면 남은 축(Z 법선이면 Y, 아니면 Z).
 * +Z 일 때는 고치기 전 규칙(가로 = X 법선이면 Y 아니면 X · 세로 = Z 법선이면 Y 아니면 Z)과 같다.
 * 가로 축 폭이 격자 간격의 절반보다 좁고 세로 축은 넓으면(Z 한 층인 2D 를 +Y 로 볼 때 가로가 Z 가 된다) 고치기 전 규칙으로 돌아간다 —
 * 가로 개수만큼의 시작점이 한 자리에 겹치지 않고 고치기 전처럼 영역 높이 전체에 퍼진다.
 * down = 세로가 위쪽 축이고 위쪽이 - 면 true ('아래'는 큰 쪽).
 */
export function seedPlaneAxes(seedAxis: number, up: UpAxis, min: readonly number[], max: readonly number[], spacing: number): { b: number; c: number; down: boolean } {
  const u = upIndex(up);
  let c = seedAxis !== u ? u : seedAxis === 2 ? 1 : 2;
  let b = 3 - seedAxis - c;
  const thin = (k: number) => max[k] - min[k] < Math.max(spacing, 1e-12) * 0.5;
  if (thin(b) && !thin(c)) { b = seedAxis === 0 ? 1 : 0; c = seedAxis === 2 ? 1 : 2; }
  return { b, c, down: c === u && upSign(up) < 0 };
}

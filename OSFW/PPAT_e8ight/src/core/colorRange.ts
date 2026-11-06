// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   colorRange.ts

색 지도 범위를 정하는 규칙 (순수 함수 — DOM·three 없음. scripts/test_color_range.mjs 가 시험한다). AppCore 가 이 판단을 그대로 적용한다.
- 값이 모두 같은 장면(예: 처음 저장 시점에 속도가 모두 0)은 자동으로 범위를 정하지도 넓히지도 않는다(rebuildDecision). 범례·상태 줄은 '모두 0',
  값이 처음 달라지는 장면에서 한 번 정한다. Rescale 단추가 읽은 값이 모두 같아도 범위를 바꾸지 않고 알린다(rescaleDecision. PV와 다름 — ParaView 는
  한 점 범위도 vtkSMCoreUtilities::AdjustRange 로 최대만 조금 올려 그대로 쓴다. 우리 옛 코드는 가운데 기준으로 넓혀(pointDataset.ts widenRange)
  -5e-13 ~ 5e-13 같은 뜻 없는 범위가 화면에 남았다).
- '모두 같음' = 폭이 값 크기의 1만분의 1보다 좁음(값이 0 이면 1e-12) — data/pointDataset.ts widenRange 가 넓힐지 보는 기준과 같다.
  벡터 성분(X·Y·Z)은 문턱의 하한을 float32 정밀도 × 그 벡터 크기의 최대로 둔다(componentFlatFloor — 물리적으로 0 인 성분의 계산 잡음 ±5e-15 를
  '모두 약 0'으로. 2026-11-05 결정). 자동 정하기 · 넓히기 · Rescale 단추 · 전 시점 범위가 모두 같은 하한을 쓴다.
  잡음이 한쪽 부호뿐이어도(1e-15 ~ 5e-15) 값이 모두 하한 안쪽이면 '약 0'(flatNearZero).
  그동안 칠하는 임시 범위(paintRangeForFlat)는 값을 Preset 가운데 색 한 가지로 보이게 잡고, 범례 막대(flatBarT)도 같은 식으로 그 색을 쓴다.
- 장면 파일의 옛 '모두 같음' 범위(2026-11-05 전 코드가 값이 모두 같은 장면에서 가운데 기준으로 넓혀 정한 -5e-13 ~ 5e-13 등)는 '범위 미정'으로 들인다
  (isLegacyFlatSaved — 명세 §3 '저장된 범위는 지킨다'의 예외).
- 한 번의 다시 계산 차례(pass)에서 처음 정해진 지도는 같은 차례에 계산되는 다른 노드의 값으로 넓힌다 — 처음 범위가 노드 줄 순서에 매이지 않게.
- '전 시점 범위'(모든 저장 시점에서 그 배열 하나만 읽음 — data/timeSeries.ts scanRange)의 결과를 적용할지·근거·안내 글(scanOutcome),
  늦게 끝난 작업이 사용자의 나중 조작을 덮지 않게 하는 판단(scanApplies).
- 범위 근거(RangeBasis): 상태 줄이 '왜 이 범위인지'를 말하게(rangeStateText). 장면 JSON 에 지도와 함께 저장된다.
- AppCore 가 쓰는 작은 판단들도 여기 둔다(시험하려고): 처음 범위 합에 넣을 노드(joinsFirstRange) · 임시 범위가 바뀔 때 다시 칠할 노드(repaintsOnRangeChange) ·
  Range 한 칸 입력(fillOneSided) · Rescale 단추 결과(rescaleDecision) · 안내 줄이 자동 범위에 지워지는지(MapNote · noteAfterAutoRange).
*/
/******************************************************************************/
import type { RangeMode } from './layers';

export type Range = [number, number];

/**
 * 범위를 마지막으로 잡은 근거 (상태 줄 글 — rangeStateText). n = 그 값을 읽은 저장 번호(ResultStep.n, 시간축이 없으면 null).
 * first = 자동으로 처음 정함 · grow = 노드를 만들거나 바꿔 넓힘 · data / visible = 그 Rescale 단추 · alltime = 전 시점 범위(저장 시점 total 개 가운데 used 개를 읽음).
 * 사용자 지정·아직 정하지 않음이면 없다
 */
export type RangeBasis =
  | { kind: 'first' | 'grow' | 'data' | 'visible'; n: number | null }
  | { kind: 'alltime'; total: number; used: number };

const minSpanOf = (lo: number, hi: number): number => {
  const scale = Math.max(Math.abs(lo), Math.abs(hi));
  return scale > 0 ? scale * 1e-4 : 1e-12;
};

/**
 * 값이 모두 같은가: 폭이 값 크기의 1만분의 1보다 좁다(값이 0 이면 1e-12). floor = 문턱의 하한(벡터 성분 — componentFlatFloor, 없으면 0):
 * 폭이 그보다 좁아도 모두 같음. 무한·NaN 이 섞이면 거짓(판단하지 않음)
 */
export function isFlatRange(lo: number, hi: number, floor = 0): boolean {
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return false;
  if (hi < lo) [lo, hi] = [hi, lo];
  return hi - lo < Math.max(minSpanOf(lo, hi), Number.isFinite(floor) ? floor : 0);
}

/** float32 의 정밀도(1 과 그다음 float32 사이 간격 2^-23 ≈ 1.19e-7). 화면 값은 float32 라 크기 v 인 벡터는 v × 이 값보다 가는 차이를 담지 못한다 */
export const FLOAT32_EPS = 2 ** -23;

/**
 * 벡터 성분(X·Y·Z)으로 칠할 때 '모두 같음' 문턱의 하한 = float32 정밀도 × 같은 벡터 배열의 크기 최대(자동·Rescale 은 지금 장면, 전 시점 범위는 읽은 모든 시점).
 * 물리적으로 0 인 성분(2D 결과의 velocity Z 등)의 계산 잡음(±5e-15)을 '모두 약 0'으로 본다 — 그 벡터의 float32 값으로는 가릴 수 없는 차이다.
 * 3D 흐름의 약한 성분(크기 1 에 성분 1e-5)은 하한(약 1.2e-7)보다 넓어 그대로 범위를 정한다. 크기(magnitude)·스칼라이거나 크기 최대를 모르면 0(하한 없음)
 */
export function componentFlatFloor(mapping: string, magMax: number): number {
  if (mapping !== 'x' && mapping !== 'y' && mapping !== 'z') return 0;
  return Number.isFinite(magMax) && magMax > 0 ? FLOAT32_EPS * magMax : 0;
}

/**
 * '모두 같음'으로 본 값의 범위가 0 에서 하한(floor — componentFlatFloor) 안쪽뿐이면 0 을 걸친 범위로 넓혀 돌려준다(아니면 그대로).
 * 하한 안의 값은 그 벡터의 float32 값으로 0 과 가릴 수 없으므로, 잡음이 한쪽 부호뿐이어도(예: 1e-15 ~ 5e-15) 글은 '모두 약 0'(flatShownValue 가 0 을 고름).
 * 판단한 자리(freshDecision · rescaleDecision · scanOutcome)에서 바꾸므로 칠하는 임시 범위 · 범례 · Range 칸 · 상태 줄이 같은 범위를 쓴다. floor 가 0 이면(크기 · 스칼라) 그대로
 */
export function flatNearZero(r: Range, floor = 0): Range {
  if (!(floor > 0) || !(Math.max(Math.abs(r[0]), Math.abs(r[1])) < floor)) return r;
  return [Math.min(r[0], r[1], 0), Math.max(r[0], r[1], 0)];
}

/**
 * 장면 파일에서 읽은 범위가 옛 코드(2026-11-05 전)가 값이 모두 같은 장면에서 스스로 정한 뜻 없는 범위인가 — 참이면 '범위 미정'으로 들인다
 * (명세 §3 '저장된 범위는 지킨다'의 예외. 예: t = 0 에서 velocity 가 모두 0 → 옛 widenRange 가 가운데 기준으로 넓힌 -5e-13 ~ 5e-13).
 * 셋 다 맞을 때만: 범위 근거(rangeBasis)가 없음(지금 코드는 자동·Rescale·전 시점 범위에 근거를 남긴다) · 사용자 지정(custom)이 아님 ·
 * 폭이 옛 넓힘의 꼴이거나 floor(벡터 성분의 하한 — componentFlatFloor)보다 좁음.
 * 옛 넓힘의 꼴 = 폭이 옛 widenRange 가 만든 폭과 같음: 가운데 값의 1만분의 1(가운데가 0 이면 1e-12). 옛 widenRange 는 폭을 원래 값 끝의 크기 × 1e-4 로
 * 잡아 가운데 값 기준보다 1만분의 0.5 안쪽만큼 넓을 수 있으므로 위로 1e-4, 아래로 1e-6(계산 오차) 여유를 둔다. 지금의 '모두 같음' 판정(isFlatRange)은
 * 저장된 범위의 끝 값으로 재므로 이 범위들을 '모두 같음'으로 보지 않는다(-5e-13 ~ 5e-13 의 문턱은 5e-17) — 그래서 따로 잰다.
 * 그보다 좁은 범위(예: 가운데가 0 인 진짜 범위 -4e-13 ~ 4e-13, 손으로 줄여 적은 101320 ~ 101330)는 옛 넓힘이 만들 수 없는 꼴이라 그대로 둔다.
 * 이미 미정이거나 무한·NaN·거꾸로 된 범위는 거짓(그대로 둔다)
 */
export function isLegacyFlatSaved(m: { fresh?: boolean; rangeMode: RangeMode; rangeBasis?: RangeBasis; rangeMin: number; rangeMax: number }, floor = 0): boolean {
  if (m.fresh || m.rangeMode === 'custom' || m.rangeBasis) return false;
  const lo = m.rangeMin, hi = m.rangeMax;
  if (!Number.isFinite(lo) || !Number.isFinite(hi) || hi < lo) return false;
  const w = hi - lo;
  const mid = Math.abs((lo + hi) / 2);
  const legacySpan = mid > 0 ? mid * 1e-4 : 1e-12;
  return (w >= legacySpan * (1 - 1e-6) && w <= legacySpan * 1.0001) || (Number.isFinite(floor) && w < floor);
}

/**
 * 직접 넣은 범위의 최소 폭: 모두 같으면 최소는 그대로 두고 최대만 올린다(ParaView AdjustRange 와 같은 방향 — 속도 크기에 음수가 보이지 않게).
 * [0,0] → [0, 1e-12] · [1,1] → [1, 1.0001] · [-1,-1] → [-1, -0.9999]. 거꾸로 들어오면 바꾸고, 무한·NaN 이면 [0, 1]
 */
export function widenColorRange(lo: number, hi: number): Range {
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return [0, 1];
  if (hi < lo) [lo, hi] = [hi, lo];
  const span = minSpanOf(lo, hi);
  return hi - lo >= span ? [lo, hi] : [lo, lo + span];
}

/**
 * 미정 지도가 값이 모두 같을 때 그 값(가운데)을 놓는 색 자리. Preset 가운데 색이다(Volume 이 투명해지지 않게). 0.5 에서 조금 비켜 둔다 —
 * 'Contour lines 사이를 단색으로 채움'의 구간 수가 짝수면 0.5 가 두 구간의 경계라, float32 오차로 이웃 구간 색이 섞이거나 범례와 갈리지 않게
 * (구간은 31개까지 — Contour lines 30개 + 1. 홀수 구간의 경계도 0.516 밖이라 닿지 않는다)
 */
export const FLAT_PAINT_T = 0.5025;

/**
 * 미정 지도가 값이 모두 같을 때 칠하는 데만 쓰는 임시 범위. 화면 숫자로는 보이지 않는다.
 * 폭 = 최소 폭과 값 폭의 2000배 가운데 큰 것, 가운데 값이 FLAT_PAINT_T 자리에 온다 — 값이 거의 같아(최소 ≠ 최대) 폭이 최소 폭에 가까워도
 * 화면이 색 막대 전체로 퍼지지 않고, 모든 값이 FLAT_PAINT_T ± 0.00025 자리(한 색)로 보인다(범례 '모두 약 c' 와 같음). 폭은 1e-12 보다 좁게 잡지 않는다
 * (셰이더가 폭을 1e-12 아래로 보지 않으므로 — 5e-13 같은 아주 작은 값도 그 자리에 오게). 무한·NaN 이면 [0, 1]
 */
export function paintRangeForFlat(lo: number, hi: number): Range {
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return [0, 1];
  if (hi < lo) [lo, hi] = [hi, lo];
  const span = Math.max(minSpanOf(lo, hi), (hi - lo) * 2000, 1e-12);
  const min = (lo + hi) / 2 - FLAT_PAINT_T * span;
  return [min, min + span];
}

/**
 * 범례 막대(값이 모두 같은 미정 지도)에 칠할 색 자리 — 화면과 같은 식(AppCore.colorAtSpec · Slice 셰이더): 그 값의 가운데(반올림 전)를 지금 칠하는 범위에 놓고,
 * 구간 칠하기(bands > 0)면 그 구간의 가운데 자리로
 */
export function flatBarT(flat: Range, rangeMin: number, rangeMax: number, bands = 0): number {
  let t = ((flat[0] + flat[1]) / 2 - rangeMin) / Math.max(rangeMax - rangeMin, 1e-12);
  t = Math.min(1, Math.max(0, t));
  if (bands > 0) t = (Math.min(bands - 1, Math.floor(t * bands)) + 0.5) / bands;
  return t;
}

/** 범위 여러 개의 합 (null 은 건너뜀). 하나도 없으면 null */
export function unionRanges(list: readonly (Range | null | undefined)[]): Range | null {
  let lo = Infinity, hi = -Infinity;
  for (const r of list) {
    if (!r) continue;
    if (r[0] < lo) lo = r[0];
    if (r[1] > hi) hi = r[1];
  }
  return lo <= hi ? [lo, hi] : null;
}

/** 미정 지도: 그린 값이 없음(wait) · 모두 같음(flat — 정하지 않음) · 정함(set). floor = '모두 같음' 문턱 하한(isFlatRange) */
export type FreshDecision = { kind: 'wait' } | { kind: 'flat'; range: Range } | { kind: 'set'; range: Range };
export function freshDecision(union: Range | null, floor = 0): FreshDecision {
  if (!union) return { kind: 'wait' };
  return isFlatRange(union[0], union[1], floor) ? { kind: 'flat', range: flatNearZero(union, floor) } : { kind: 'set', range: union };
}

/**
 * 정해진 범위를 노드 값(range)으로 넓히기: 값이 없거나 모두 같거나 이미 안에 들면 null(넓히지 않음). 줄이지는 않는다.
 * 모두 같은 값을 빼는 것은 PV와 다름(명세 §3) — 농도확산 pressure 처럼 첫 장면만 기준값(101325)인 결과에서 그 장면의 노드를 바꿀 때
 * 범위가 101325 까지 넓어져 다른 장면이 한 색이 되지 않게(유지 — 2026-11-05 결정)
 */
export function growDecision(cur: Range, range: Range | null, floor = 0): Range | null {
  if (!range || isFlatRange(range[0], range[1], floor)) return null;
  const lo = Math.min(cur[0], range[0]), hi = Math.max(cur[1], range[1]);
  return lo === cur[0] && hi === cur[1] ? null : [lo, hi];
}

/** 노드 하나를 다시 계산한 뒤 그 지도에서 할 일 (AppCore.colorForRebuild 가 적용한다) */
export interface MapRangeView {
  fresh: boolean;
  min: number;
  max: number;
  settledThisPass: boolean; // 이 다시 계산 차례에서 처음 정해졌다
  growPending: boolean;     // 이 노드가 만들어지거나 바뀐 뒤 첫 계산 (ParaView Apply)
  autoGrow: boolean;
}
export type RebuildAction =
  | { kind: 'none' }
  | { kind: 'wait' }                                   // 미정 · 그린 값 없음
  | { kind: 'flat'; flat: Range; paint: Range }        // 미정 유지 · 그린 값이 모두 같음(flat) · 칠하기용 임시 범위(paint)
  | { kind: 'set' | 'widen' | 'grow'; range: Range };  // 처음 정함 · 같은 차례에서 넓힘 · 노드를 만들거나 바꿔 넓힘

/**
 * own = 이 노드가 칠한 값의 범위, others = 같은 지도로 칠하는 다른 노드 가운데 지금 시점에서 이미 계산된 보이는 것들의 범위.
 * - 미정: own ∪ others 가 없으면 wait, 모두 같으면 flat(정하지 않음), 아니면 set.
 * - 이 차례에서 막 정해졌으면 own 으로 넓힌다(모두 같은 값도 넣는다 — 처음 정할 때의 합에도 들어가므로, 넣어야 순서와 무관하다).
 * - 그 밖에는 Apply 뒤(growPending)이고 자동 넓히기일 때만 넓힌다. 모두 같은 값은 넓히는 데 쓰지 않는다(PV와 다름).
 * floor = '모두 같음' 문턱 하한(벡터 성분이면 componentFlatFloor, 아니면 0)
 */
export function rebuildDecision(s: MapRangeView, own: Range | null, others: readonly (Range | null)[], floor = 0): RebuildAction {
  if (s.fresh) {
    const d = freshDecision(unionRanges([own, ...others]), floor);
    if (d.kind === 'wait') return d;
    if (d.kind === 'flat') return { kind: 'flat', flat: d.range, paint: paintRangeForFlat(d.range[0], d.range[1]) };
    return { kind: 'set', range: d.range };
  }
  if (!own) return { kind: 'none' };
  if (s.settledThisPass) {
    const u = unionRanges([[s.min, s.max], own])!;
    return u[0] === s.min && u[1] === s.max ? { kind: 'none' } : { kind: 'widen', range: u };
  }
  if (s.growPending && s.autoGrow) {
    const g = growDecision([s.min, s.max], own, floor);
    return g ? { kind: 'grow', range: g } : { kind: 'none' };
  }
  return { kind: 'none' };
}

/** 같은 지도를 쓰는 다른 노드 하나 (AppCore.colorForRebuild 가 런타임에서 모은다). computedThisPass = 이 다시 계산 차례에 계산됨 */
export interface MapUserView { hasRange: boolean; visible: boolean; dirty: boolean; computedThisPass: boolean }

/** 미정 지도의 처음 범위 합(rebuildDecision 의 others)에 넣을 다른 노드: 값이 있고 · 보이고 · 지금 값으로 계산됨(다시 계산 표시가 없거나, 이 차례에 계산됐다가 다시 칠하라고 표시됨) */
export const joinsFirstRange = (u: MapUserView): boolean => u.hasRange && u.visible && (!u.dirty || u.computedThisPass);

/**
 * 지도 범위가 바뀐 뒤 같은 지도를 쓰는 다른 노드를 다시 칠할지(볼륨 노드가 아니면 다시 계산 — Contour lines 값이 범위에 매여 있다).
 * 바뀐 까닭이 '모두 같음'의 칠하기용 임시 범위(kind 'flat')이면 이 차례에 이미 계산된 보이는 노드는 다시 칠하지 않는다: 그 노드의 값도 같은 합 안에 있어
 * 어느 임시 범위로 칠하든 색 자리가 FLAT_PAINT_T ± 0.0005 라 보기에 같고 Contour lines 도 생기지 않는다(장면마다 같은 노드를 두 번 계산하지 않게).
 * 숨긴 노드·아직 계산 전인 노드는 그대로 다시 칠하라고 표시한다(다시 보일 때 판단하게). 볼륨 노드(volumeColorOnly — 값 계산 없이 색만 바꿈)는 늘 바꾼다
 */
export const repaintsOnRangeChange = (kind: RebuildAction['kind'], u: MapUserView & { volumeColorOnly: boolean }): boolean =>
  kind !== 'flat' || u.volumeColorOnly || !(u.visible && !u.dirty && u.computedThisPass);

/**
 * 모두 같은 값을 칸·글에 넣을 숫자: 정확히 같으면 그 값(유효숫자 6), 거의 같으면 가운데를 [최소, 최대] 안에 드는 가장 짧은 자릿수로(유효숫자 4부터) —
 * 큰 기준값이 얹힌 결과(예: 101320 ~ 101330)가 범위 밖 숫자(101300)로 보이지 않게. 0 을 걸치면(벡터 성분의 계산 잡음 -5e-15 ~ 5e-15 — componentFlatFloor.
 * 잡음이 한쪽 부호뿐이면 판단한 자리에서 flatNearZero 가 0 을 걸치게 넓혀 둔다) 0
 */
export function flatShownValue(lo: number, hi: number): number {
  if (hi < lo) [lo, hi] = [hi, lo];
  if (lo === hi) return Number(lo.toPrecision(6));
  if (lo <= 0 && hi >= 0) return 0;
  const mid = (lo + hi) / 2;
  for (let p = 4; p <= 17; p++) {
    const v = Number(mid.toPrecision(p));
    if (v >= lo && v <= hi) return v;
  }
  return mid;
}

/**
 * 미정 지도에 Range 한 칸만 넣을 때 두 칸 값: 다른 칸은 지금 칸에 보이는 값(그린 값이 모두 같으면 flatShownValue), 그린 값이 없어 칸이 비어 있으면('-') 넣은 값.
 * 칠하기용 임시 범위(앞 장면의 임시 값 · 처음 0 ~ 1)가 사용자 지정 범위에 섞이지 않게. 두 칸 다 넣었거나 아무 칸도 없으면 null(그대로)
 */
export function fillOneSided(patch: { rangeMin?: number; rangeMax?: number }, flat: Range | null): { rangeMin: number; rangeMax: number } | null {
  const hasMin = 'rangeMin' in patch && typeof patch.rangeMin === 'number';
  const hasMax = 'rangeMax' in patch && typeof patch.rangeMax === 'number';
  if (hasMin === hasMax) return null;
  const typed = hasMin ? patch.rangeMin! : patch.rangeMax!;
  const other = flat ? flatShownValue(flat[0], flat[1]) : typed;
  return hasMin ? { rangeMin: typed, rangeMax: other } : { rangeMin: other, rangeMax: typed };
}

/**
 * Rescale 단추(데이터 범위 · 보이는 범위 · 시간축 없는 전 시점 범위)가 읽은 값 → 바꿀지. 값이 없으면(보이는 노드 가운데 그 지도로 칠하는 것이 없음) ·
 * 모두 같으면 바꾸지 않고 안내 글. 바꾸면 범위는 widenColorRange 를 거친 것. floor = '모두 같음' 문턱 하한(isFlatRange — 자동 정하기와 같은 기준)
 */
export type RescaleDecision = { apply: true; range: Range } | { apply: false; note: string };
export function rescaleDecision(range: Range | null, floor = 0): RescaleDecision {
  if (!range) return { apply: false, note: '보이는 노드 가운데 이 지도로 칠하는 것이 없어 범위를 바꾸지 않았습니다.' };
  if (isFlatRange(range[0], range[1], floor)) return { apply: false, note: `범위를 바꾸지 않았습니다: 지금 값이 모두 ${fmtFlatValue(...flatNearZero(range, floor))} 입니다.` };
  return { apply: true, range: widenColorRange(range[0], range[1]) };
}

/**
 * 색 지도의 안내 줄 (Color Map 편집기 아래 — 지도에 묶음). sticky = 멈춤 안내(전 시점 범위 읽기를 멈춘 까닭 — [취소] · Component 바꿈 · 다른 지도의 단추 ·
 * 다른 데이터 열기 · 읽기 실패): 범위가 자동으로 처음 정해지거나 넓어져도 남는다(noteAfterAutoRange). 그 밖(Rescale 결과 — '범위를 바꾸지 않았습니다…' 등)은
 * 그때 범위에 대한 글이라 자동으로 범위가 바뀌면 지운다. 사용자가 범위·성분을 바꾸거나 단추를 누르면 어느 것이든 새로 쓴다
 */
export interface MapNote { text: string; sticky: boolean }
export const NO_NOTE: MapNote = { text: '', sticky: false };
export const noteAfterAutoRange = (n: MapNote): MapNote => (n.sticky ? n : NO_NOTE);
/** 모두 같은 값의 글: '0' · '101325' · '약 0.5'(거의 같음) */
export function fmtFlatValue(lo: number, hi: number): string {
  return `${lo === hi ? '' : '약 '}${String(flatShownValue(lo, hi))}`;
}

const isCount = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0;
/** 근거 종류가 범위 기준(rangeMode)과 맞는지 — first·grow 는 자동, 나머지는 같은 이름 */
const basisFits = (kind: RangeBasis['kind'], mode: RangeMode): boolean =>
  kind === 'first' || kind === 'grow' ? mode === 'grow' : kind === mode;

/** 장면 JSON 의 범위 근거 → RangeBasis. 모르는 종류·숫자 아님·음수·used > total, 또는 mode(범위 기준)와 안 맞으면 undefined(버림) */
export function parseRangeBasis(raw: unknown, mode?: RangeMode): RangeBasis | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  let b: RangeBasis | undefined;
  if (o.kind === 'alltime') {
    if (isCount(o.total) && isCount(o.used) && o.total >= 1 && o.used >= 1 && o.used <= o.total) b = { kind: 'alltime', total: o.total, used: o.used };
  } else if (o.kind === 'first' || o.kind === 'grow' || o.kind === 'data' || o.kind === 'visible') {
    if (o.n === null || o.n === undefined) b = { kind: o.kind, n: null };
    else if (isCount(o.n)) b = { kind: o.kind, n: o.n };
  }
  if (b && mode && !basisFits(b.kind, mode)) return undefined;
  return b;
}

/** 상태 줄 글에 쓰는 것 (panel.ts mapEditor — AppCore.colorRangeState 가 지도에서 모은다) */
export interface RangeStateInput {
  fresh: boolean;
  mode: RangeMode;
  modeLabel: string;                         // layers.ts RANGE_MODE_LABEL[mode]
  basis?: RangeBasis;
  flat: Range | null;                        // 미정일 때 지금 그린 값(모두 같음). 없으면 null
  unit: string;
  stepLabelOf: (n: number) => string | null; // 저장 번호 → 't = 0.004' 등. 지금 데이터에 없는 번호면 null
  stepCount: number;                         // 지금 데이터의 저장 시점 수 (시간축이 없으면 0)
}

/**
 * Color Map 상태 줄: 범위가 왜 그 값인지.
 * '범위: 아직 정하지 않음' (+ ' · 지금 값은 모두 0 · 단위 m/s') · '범위 기준: 자동 · t = 0.004 값으로 정함' · '범위 기준: 자동(넓히기) · t = 0.1 값으로 넓힘' ·
 * '범위 기준: 데이터 범위 · t = 0.2 값' · '범위 기준: 전 시점 범위 · 저장 시점 51개 모두' / '… 51개 가운데 49개' / '… 장면 파일의 값'(근거가 없거나 저장 시점 수가 다름) ·
 * '범위 기준: 사용자 지정'. 끝에 ' · 단위 m/s'. 시간축이 없으면 시점 부분을 뺀다
 */
export function rangeStateText(s: RangeStateInput): string {
  const unit = s.unit ? ` · 단위 ${s.unit}` : '';
  if (s.fresh) return s.flat ? `범위: 아직 정하지 않음 · 지금 값은 모두 ${fmtFlatValue(s.flat[0], s.flat[1])}${unit}` : '범위: 아직 정하지 않음';
  const b = s.basis && basisFits(s.basis.kind, s.mode) ? s.basis : undefined;
  const parts = [`범위 기준: ${b?.kind === 'first' ? '자동' : s.modeLabel}`];
  if (s.mode === 'alltime') {
    if (b?.kind === 'alltime' && b.total === Math.max(1, s.stepCount)) parts.push(b.used >= b.total ? `저장 시점 ${b.total}개 모두` : `저장 시점 ${b.total}개 가운데 ${b.used}개`);
    else parts.push('장면 파일의 값');
  } else if (b && b.kind !== 'alltime' && b.n !== null) {
    const at = s.stepLabelOf(b.n) ?? `저장 ${b.n}`;
    parts.push(b.kind === 'first' ? `${at} 값으로 정함` : b.kind === 'grow' ? `${at} 값으로 넓힘` : `${at} 값`);
  }
  return parts.join(' · ') + unit;
}

/** 전 시점 범위를 읽을 때 한꺼번에 읽는 저장 시점 수: 시점당 그 배열 바이트로 128 MiB 를 나눈 수, 1~4 (모르면 4) */
export function scanConcurrency(bytesPerStep: number): number {
  if (!(bytesPerStep > 0)) return 4;
  return Math.min(4, Math.max(1, Math.floor((128 * 1024 * 1024) / bytesPerStep)));
}

/** 진행 줄: '전 시점 범위 읽는 중 12 / 51' (+ ' · 1개 못 읽음') (+ 서버가 바이트 범위 읽기를 받지 않을 때 그 사실) */
export function scanProgressText(done: number, total: number, failed: number, wholeFiles = false): string {
  return `전 시점 범위 읽는 중 ${done} / ${total}${failed ? ` · ${failed}개 못 읽음` : ''}${wholeFiles ? ' · 서버가 부분 읽기를 받지 않아 파일 전체를 받는 중' : ''}`;
}

/** 끝난 전 시점 범위 읽기 (data/timeSeries.ts RangeScanResult 의 일부) */
export interface ScanSummary { min: number; max: number; used: number; total: number; failed: readonly { n: number; reason: string }[] }
export interface ScanOutcome { apply: boolean; range: Range | null; basis: RangeBasis | null; note: string }

/**
 * 전 시점 범위 결과 → 적용할지 · 범위 · 근거 · 안내 글(Color Map 편집기의 안내 줄).
 * 하나도 못 읽음 → 적용 안 함 · 모든 시점에서 값이 모두 같음 → 적용 안 함(약속: 뜻 없는 범위를 화면에 두지 않음) · 일부 못 읽음 → 적용하고 못 읽은 시점을 3개까지 적음.
 * 모두 읽으면 안내 글은 비운다(상태 줄이 '저장 시점 51개 모두'로 말한다). floor = '모두 같음' 문턱 하한(벡터 성분이면 componentFlatFloor(성분, 읽은 시점의 크기 최대))
 */
export function scanOutcome(r: ScanSummary, labelOf: (n: number) => string, floor = 0): ScanOutcome {
  const f = [...r.failed].sort((a, b) => a.n - b.n);
  const failedList = f.length
    ? `못 읽은 시점: ${f.slice(0, 3).map((x) => labelOf(x.n)).join(', ')}${f.length > 3 ? ` 외 ${f.length - 3}개` : ''} (${f[0].reason})`
    : '';
  if (r.used <= 0 || !(r.min <= r.max)) {
    return { apply: false, range: null, basis: null, note: `저장 시점을 하나도 읽지 못해 범위를 바꾸지 않았습니다.${f.length ? ` ${f[0].reason}` : ''}` };
  }
  if (isFlatRange(r.min, r.max, floor)) {
    const v = fmtFlatValue(...flatNearZero([r.min, r.max], floor));
    return {
      apply: false, range: null, basis: null,
      note: f.length
        ? `범위를 바꾸지 않았습니다: 읽은 저장 시점 ${r.used}개(전체 ${r.total}개)에서 값이 모두 ${v} 입니다. ${failedList}`
        : `범위를 바꾸지 않았습니다: 모든 저장 시점에서 값이 모두 ${v} 입니다.`,
    };
  }
  return {
    apply: true, range: [r.min, r.max], basis: { kind: 'alltime', total: r.total, used: r.used },
    note: f.length ? `저장 시점 ${r.total}개 가운데 ${r.used}개로 계산했습니다. ${failedList}` : '',
  };
}

/**
 * 끝난 읽기를 적용해도 되는가 — 늦게 끝난 작업이 사용자의 나중 조작을 덮지 않게(저장 시점 읽기의 stepToken 과 같은 생각).
 * current = 지금 작업이 바로 이 작업(그 사이 [취소]·다른 지도의 단추·Range 입력·다른 데이터 열기로 바뀌지 않음), aborted = 멈춤 신호가 섰음,
 * reachable = 그 지도에 아직 닿을 수 있음(Separate 를 끄거나 주인 노드를 지우면 닿지 못함), sameMapping = 누른 때와 성분(크기·X·Y·Z)이 같음.
 * 읽기 함수가 돌려준 '멈춤' 칸은 보지 않는다 — 마지막 읽기를 기다리는 사이에 멈추면 거기는 아직 거짓일 수 있다
 */
export function scanApplies(j: { current: boolean; aborted: boolean; reachable: boolean; sameMapping: boolean }): boolean {
  return j.current && !j.aborted && j.reachable && j.sameMapping;
}

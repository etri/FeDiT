// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   sliderRange.ts

값 밀대(Threshold Lower·Upper · Clip Scalar 기준값 · Isosurface 값)의 양 끝을 노드마다 정하고 지키는 규칙 — scripts/test_slider_range.mjs 가 시험한다.
재생하면 저장 시점마다 값 범위가 달라진다. 밀대 끝을 지금 시점 범위로 잡으면 값(0.56 등)은 그대로인데 장면마다 손잡이가 움직였다(2026-11-05 사용자).
결정(2026-11-05): 끝은 저절로 넓히지 않는다. 끝을 정하는 때는 셋뿐이다 —
(가) 노드를 만들 때(장면 JSON 으로 들어올 때 · 복제 포함) · (나) 그 노드의 Field·Component 를 바꿀 때 · (다) 같은 Field·Component 로 [전 시점 범위]를 읽었을 때.
그때 끝 = 알고 있는 값 범위(지금 장면 ∪ 읽어 둔 저장 시점 ∪ 전 시점 범위 결과 — AppCore 의 RangeSource) ∪ 노드의 지금 값.
재생 · 저장 시점 넘기기 · 재생 멈춤 · 노드 다시 고르기로는 바뀌지 않는다. 끝은 늘 노드 값을 담는다: 값이 끝 밖으로 가는 것은 숫자를 넣을 때 · 장면 JSON 뿐이고,
그때는 끝을 그 값까지 넓혀 지킨다(includeValues — 끄는 동안 끝이 줄지 않게). 처음 장면 값이 모두 같으면(유체-입자 t = 0 의 velocity 모두 0 —
core/colorRange.ts isFlatRange · componentFlatFloor 와 같은 기준) 끝은 '미정'이고, 지금 장면 값이 처음 달라지는 저장 시점에서 한 번만 정한다(settle).
'처음 장면'은 만들 때(Field·Component 를 바꿀 때) 보이는 장면이다 — 미리 읽어 둔 다음 장면이 캐시에 있어도 미정(Color Map 처음 범위처럼 보이는 장면으로 판단.
캐시로 판단하면 미리 읽기가 끝났는지라는 보이지 않는 차이로 미정 여부가 갈렸다 — 2026-11-05). 미정인 동안 임시 끝 = 그때 알고 있는 범위 ∪ 노드 값.
노드별 끝은 AppCore 가 하나 들고(ValueBounds) 데이터를 새로 열면 비운다. 장면 JSON 에는 저장하지 않는다(들어올 때 (가)로 정함).
*/
/******************************************************************************/
import { isFlatRange } from './colorRange';
import type { Layer } from './layers';

export interface ValueRange { min: number; max: number }
export interface SliderBounds { min: number; max: number; step: number }

/** 범위 a 를 min~max 로 넓힌다(좁히지 않음). 유한하지 않은 끝은 건너뛴다. 넓힐 것이 없으면 a 그대로(같은 객체), a 도 없고 유한한 끝도 없으면 null */
export function widenRange(a: ValueRange | null, min: number, max: number): ValueRange | null {
  let lo = a ? a.min : Infinity, hi = a ? a.max : -Infinity;
  for (const v of [min, max]) {
    if (!Number.isFinite(v)) continue;
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  if (!(lo <= hi)) return a;
  return a && a.min === lo && a.max === hi ? a : { min: lo, max: hi };
}

/** 범위들을 합친다 (null · 유한하지 않은 끝은 건너뜀). 합칠 것이 없으면 null */
export function unionRanges(...rs: (ValueRange | null | undefined)[]): ValueRange | null {
  let out: ValueRange | null = null;
  for (const r of rs) if (r) out = widenRange(out, r.min, r.max);
  return out ? { min: out.min, max: out.max } : null;
}

/** 눈금 = 폭/500 (폭 0 이면 1e-9 — 고치기 전과 같음) */
const stepOf = (min: number, max: number) => Math.max((max - min) / 500, 1e-9);

/** 밀대 양 끝·눈금: range ∪ values(유한한 것만). 유한한 값이 하나도 없으면 0~1 */
export function sliderBounds(range: ValueRange | null, values: readonly number[]): SliderBounds {
  let r = range ? widenRange(null, range.min, range.max) : null;
  for (const v of values) r = widenRange(r, v, v);
  if (!r) return { min: 0, max: 1, step: 1 / 500 };
  return { min: r.min, max: r.max, step: stepOf(r.min, r.max) };
}

/** 범위 모음의 성분 열쇠: 스칼라('scalar:…')는 성분이 뜻이 없으므로 늘 'magnitude', 벡터는 성분 그대로 (Field 가 그 시점에 없어도 정할 수 있게 열쇠 글로) */
export function mappingKeyOf(fieldKey: string | null, mapping: string): string {
  return fieldKey?.startsWith('scalar:') ? 'magnitude' : mapping;
}

/** 노드 하나의 값 밀대: 어느 배열·성분의 값인지와 노드의 지금 값 */
export interface ValueSlider { fieldKey: string | null; mapping: string; values: number[] }

/** 노드의 값 밀대 (Threshold Lower·Upper · Clip Scalar 기준값 · Isosurface 값 — 벡터는 크기). 값 밀대가 없는 노드(Slice·Glyph·Streamline)면 null */
export function valueSliderOf(l: Layer): ValueSlider | null {
  if (l.type === 'threshold') return { fieldKey: l.params.fieldKey, mapping: mappingKeyOf(l.params.fieldKey, l.params.mapping), values: [l.params.lower, l.params.upper] };
  if (l.type === 'clip') return { fieldKey: l.params.fieldKey, mapping: mappingKeyOf(l.params.fieldKey, l.params.mapping), values: [l.params.value] };
  if (l.type === 'iso') return { fieldKey: l.params.fieldKey, mapping: 'magnitude', values: [l.params.value] };
  return null;
}

/** 끝을 정한 배열·성분의 열쇠 (이것이 바뀌면 (나) — 끝을 다시 정한다) */
export const sliderKeyOf = (s: { fieldKey: string | null; mapping: string }): string => `${s.fieldKey ?? ''}\n${mappingKeyOf(s.fieldKey, s.mapping)}`;

/** 노드 하나의 값 밀대 끝 */
export interface NodeBounds {
  /** 끝을 정한 배열·성분 (sliderKeyOf) */
  key: string;
  /** false = 미정(정할 때 보이던 장면 값이 모두 같았거나 Field 가 없음) — 지금 장면 값이 처음 달라지는 저장 시점에서 한 번 정한다(settle) */
  decided: boolean;
  /** 끝 (미정이면 임시 끝 = 그때 알고 있는 범위 ∪ 노드 값). 유한한 값이 하나도 없으면 null */
  range: ValueRange | null;
}

/** 값 범위와 그 범위의 '모두 같음' 문턱 하한(벡터 성분이면 core/colorRange.ts componentFlatFloor, 아니면 0) */
export interface RangeInfo { range: ValueRange | null; floor: number }

/** 범위가 없거나 값이 모두 같은가 (colorRange.ts isFlatRange — Color Map 처음 범위와 같은 기준) */
export const isFlatInfo = (k: RangeInfo): boolean => !k.range || isFlatRange(k.range.min, k.range.max, k.floor);

/**
 * 끝을 정한다: 끝 = known ∪ 노드 값(미정이어도 임시 끝은 같은 식). 정했는지는 judge 와 known 이 둘 다 모두 같지 않을 때 —
 * judge 는 (가)·(나)에서 지금 장면(ValueBounds.fix — 첫 장면 값이 모두 같으면 미정), (다) · 미정 끝을 정할 때는 known(기본)
 */
export function decideBounds(key: string, known: RangeInfo, values: readonly number[], judge: RangeInfo = known): NodeBounds {
  const r = sliderBounds(known.range, values);
  const any = !!known.range || values.some(Number.isFinite);
  return { key, decided: !isFlatInfo(judge) && !isFlatInfo(known), range: any ? { min: r.min, max: r.max } : null };
}

/** 노드 값이 바뀌었을 때(숫자 입력 · 끌기 · 장면 JSON): 끝을 그 값까지 넓히기만 한다(좁히지 않음). 바뀌지 않으면 같은 객체 */
export function includeValues(b: NodeBounds, values: readonly number[]): NodeBounds {
  let r = b.range;
  for (const v of values) r = widenRange(r, v, v);
  return r === b.range ? b : { ...b, range: r };
}

/** 밀대에 쓸 끝·눈금: 끝 ∪ 노드 값 (끝은 값을 늘 담지만, 다른 길로 값이 바뀌었어도 손잡이가 끝에 붙지 않게) */
export function boundsForSlider(b: NodeBounds | null, values: readonly number[]): SliderBounds {
  return sliderBounds(b?.range ?? null, values);
}

/** 알고 있는 값 범위를 주는 쪽 (AppCore). fieldKey 가 없거나 그 배열이 데이터에 없으면 range null */
export interface RangeSource {
  /** 지금 장면 ∪ 읽어 둔 저장 시점 ∪ 전 시점 범위 결과 (끝을 정할 때) */
  known(fieldKey: string | null, mapping: string): RangeInfo;
  /** 지금 장면만 (만들 때 · Field·Component 를 바꿀 때 미정인지, 미정인 끝을 이 장면에서 정할지 볼 때) */
  now(fieldKey: string | null, mapping: string): RangeInfo;
}

/** 노드 id 와 그 값 밀대 (ValueBounds.settle · refixUsers 가 훑는 목록) */
export interface SliderNode { id: string; slider: ValueSlider }

/** 노드별 값 밀대 끝 모음 (AppCore 가 하나 든다 — 노드를 다시 골라도 같은 끝). 데이터를 새로 열면 비운다 */
export class ValueBounds {
  private readonly map = new Map<string, NodeBounds>();
  constructor(private readonly src: RangeSource) {}

  /** (가)·(나): 끝을 지금 알고 있는 값 범위 ∪ 노드 값으로 정한다. 지금 장면 값이 모두 같으면 미정(임시 끝은 같은 식) */
  fix(id: string, s: ValueSlider): NodeBounds {
    const b = decideBounds(sliderKeyOf(s), this.src.known(s.fieldKey, s.mapping), s.values, this.src.now(s.fieldKey, s.mapping));
    this.map.set(id, b);
    return b;
  }

  /** 노드 매개변수가 바뀐 뒤: 배열·성분이 바뀌었으면(또는 끝이 없으면) (나) 다시 정하고, 아니면 값까지 넓히기만(끄는 동안 줄지 않음) */
  update(id: string, s: ValueSlider): NodeBounds {
    const b = this.map.get(id);
    if (!b || b.key !== sliderKeyOf(s)) return this.fix(id, s);
    const next = includeValues(b, s.values);
    if (next !== b) this.map.set(id, next);
    return next;
  }

  /**
   * 저장 시점을 보인 뒤: 미정인 끝만, 지금 장면 값이 모두 같지 않으면 그때 알고 있는 범위로 정한다(한 번 — 정한 끝은 다시 보지 않는다).
   * 알고 있는 범위로도 모두 같으면 임시 끝을 그대로 둔다(숫자로 넣어 넓힌 임시 끝이 줄지 않게). 정한 노드 수를 돌려준다
   */
  settle(nodes: readonly SliderNode[]): number {
    let n = 0;
    const flatNow = new Map<string, boolean>(), known = new Map<string, RangeInfo>(); // 같은 배열·성분 노드가 여럿이면 한 번만 묻는다
    for (const { id, slider } of nodes) {
      const b = this.map.get(id);
      if (!b || b.decided || b.key !== sliderKeyOf(slider)) continue;
      if (!flatNow.has(b.key)) flatNow.set(b.key, isFlatInfo(this.src.now(slider.fieldKey, slider.mapping)));
      if (flatNow.get(b.key)) continue;
      if (!known.has(b.key)) known.set(b.key, this.src.known(slider.fieldKey, slider.mapping));
      const next = decideBounds(b.key, known.get(b.key)!, slider.values);
      if (!next.decided) continue;
      this.map.set(id, next);
      n++;
    }
    return n;
  }

  /**
   * (다) 그 배열·성분의 전 시점 범위를 읽은 뒤: 그것을 쓰는 노드들의 끝을 다시 정한다(알고 있는 범위에 전 시점 결과가 들어 있다 — AppCore).
   * 지금 장면 값이 모두 같아도(t = 0) 모든 시점 범위가 서로 다르면 정한다(사용자가 누른 결과). 그래도 모두 같아 정할 수 없으면 그 노드는 그대로.
   * 알고 있는 범위는 한 번만 묻는다(같은 열쇠의 노드는 같은 범위). 바꾼 노드 수를 돌려준다
   */
  refixUsers(nodes: readonly SliderNode[], fieldKey: string, mapping: string): number {
    const key = sliderKeyOf({ fieldKey, mapping });
    let n = 0, known: RangeInfo | null = null;
    for (const { id, slider } of nodes) {
      if (sliderKeyOf(slider) !== key) continue;
      known ??= this.src.known(slider.fieldKey, slider.mapping);
      const next = decideBounds(key, known, slider.values);
      if (!next.decided) continue;
      this.map.set(id, next);
      n++;
    }
    return n;
  }

  /** 밀대에 쓸 끝·눈금. 끝이 없거나 배열·성분이 다르면(만들 때 정하지 못한 길 — 있으면 안 됨) 그 자리에서 정한다 */
  sliderOf(id: string, s: ValueSlider): SliderBounds {
    let b = this.map.get(id);
    if (!b || b.key !== sliderKeyOf(s)) b = this.fix(id, s);
    return boundsForSlider(b, s.values);
  }

  get(id: string): NodeBounds | null { return this.map.get(id) ?? null; }
  delete(id: string): void { this.map.delete(id); }
  clear(): void { this.map.clear(); }
}

/** 배열·성분마다 범위 모음 (AppCore 의 전 시점 범위 읽기 결과 — 밀대 끝을 정할 때 알고 있는 범위에 합친다). 데이터를 새로 열면 비운다 */
export class RangeStore {
  private readonly map = new Map<string, ValueRange>();
  /** 그 배열·성분의 범위를 min~max 로 넓힌다 (유한한 끝만) */
  widen(fieldKey: string, mapping: string, min: number, max: number): void {
    const key = sliderKeyOf({ fieldKey, mapping });
    const next = widenRange(this.map.get(key) ?? null, min, max);
    if (next) this.map.set(key, next);
  }
  get(fieldKey: string, mapping: string): ValueRange | null { return this.map.get(sliderKeyOf({ fieldKey, mapping })) ?? null; }
  private readonly mag = new Map<string, number>();
  /**
   * 벡터 성분(X·Y·Z)으로 전 시점 범위를 읽을 때 함께 센 모든 시점의 크기 최대를 남긴다(유한한 값만, 더 큰 값으로만) — 그 성분의 '모두 같음' 하한에만 쓴다.
   * 크기 쪽 범위(get)에는 넣지 않는다: 넣으면 뒤에 만드는 크기 노드의 끝이 이 최대까지 넓어졌다(검토 반영 2026-11-05)
   */
  noteMagMax(fieldKey: string, v: number): void {
    if (Number.isFinite(v)) this.mag.set(fieldKey, Math.max(this.mag.get(fieldKey) ?? -Infinity, v));
  }
  /** noteMagMax 로 남긴 크기 최대 (없으면 -Infinity) */
  magMax(fieldKey: string): number { return this.mag.get(fieldKey) ?? -Infinity; }
  clear(): void { this.map.clear(); this.mag.clear(); }
}

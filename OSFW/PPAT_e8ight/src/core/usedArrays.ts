// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   usedArrays.ts

결과 폴더(시간축)에서 저장 시점마다 읽을 배열 = '지금 쓰는 배열'을 노드 트리로 정한다 — scripts/test_used_arrays.mjs 가 시험한다(2026-11-06).
장면마다 표시할 수 있는 배열 전부(fluid_dem 9개)를 읽던 것을 칠하거나 거르는 데 쓰는 배열만 읽도록 바꾸면서 둔 순수 함수다(AppCore 가 부른다).
쓰는 배열 = 다음 Field 의 배열 이름('scalar:' · 'vector:' 를 뗀 것)의 합집합. 숨긴 노드도 넣는다(켤 때 기다리지 않게):
- 새 노드 기본 배열(defaultFieldKey) · 데이터 노드의 색(view.color — 표현 방식과 무관하게)
- 볼륨 위 Clip·Threshold 의 색(view.color). 면·선·Glyph 위의 Clip·Threshold 는 입력 노드의 모양·색을 그리므로 자기 view.color 를 쓰지 않는다
- Clip 의 Field(Scalar 일 때만) · Threshold 의 Field
- Slice 의 색 · Glyph·Streamline 의 Field(벡터) 와 색(단색이 아닐 때) · Isosurface 의 Field 와 색(단색이 아닐 때)
머리 정보(첫 저장 헤더로 만든 Field 목록 — data/resultSet.ts fieldCatalogOf)에 없는 Field 는 뺀다(읽어도 없다). 고체(solid) 배열은 위상을 읽을 때 한 번만 읽으므로 넣지 않는다.
노드 하나가 다시 계산하는 데 기대는 배열(nodeArrays)도 같은 규칙이다: 그 노드의 Field·색 + 조상 사슬의 Clip(Scalar)·Threshold Field.
면·선·Glyph 위의 Clip·Threshold 는 입력 노드(가장 가까운, Clip·Threshold 가 아닌 조상)의 Field·색까지. AppCore 는 기대는 배열이 아직 없으면 그 노드를 다시 계산하지 않는다.
다만 볼륨 노드(데이터 · 볼륨 위 Clip·Threshold)의 색(view.color)은 표현 방식이 값으로 칠할 때(Surface · Points · Volume — AppCore.colorsByField 와 같은 기준)만
기대는 배열에 넣는다: Outline · Feature Edges · 없음은 색 배열을 그리지 않으므로 그것을 기다리면 모양 변경이 막히고, 그 사이 표현을 바꾸면 빈 그림이 된다(검토 반영 2026-11-06).
읽어 둘 배열(usedArrays)에는 표현 방식과 무관하게 넣는다(표현을 바꿀 때 기다리지 않게).
*/
/******************************************************************************/
import type { DataView, FilterLayer, Layer } from './layers';

/** 데이터(root) 노드의 id — AppCore.ROOT_ID 와 같은 값 (AppCore 를 불러오면 three.js 까지 묶이므로 따로 둔다) */
export const ROOT_NODE_ID = 'root';

export interface UsedArraysInput {
  /** 데이터 노드의 표현 설정 (색칠 view.color) */
  root: { view: DataView };
  /** 노드 (평면 배열, parentId 로 중첩) */
  layers: readonly Layer[];
  /** 새 노드 기본 배열 */
  defaultFieldKey: string | null;
  /** 머리 정보의 Field key ('vector:velocity' · 'scalar:fraction') — 여기에 없는 Field 는 뺀다 */
  catalog: ReadonlySet<string>;
}

/** Field key → 배열 이름 ('vector:velocity' → 'velocity') */
export function arrayNameOf(fieldKey: string): string {
  const i = fieldKey.indexOf(':');
  return i < 0 ? fieldKey : fieldKey.slice(i + 1);
}

const isFilter = (l: Layer): l is FilterLayer => l.type === 'clip' || l.type === 'threshold';

/** Clip(Scalar)·Threshold 가 판정에 쓰는 Field. 그 밖(Plane·Box Clip, Slice 등)은 null */
function filterKey(l: Layer): string | null {
  if (l.type === 'clip') return l.params.clipType === 'scalar' ? l.params.fieldKey : null;
  if (l.type === 'threshold') return l.params.fieldKey;
  return null;
}

/** Slice·Glyph·Streamline·Isosurface 노드가 모양과 색에 쓰는 Field (사슬 제외) */
function viewKeys(l: Layer): (string | null)[] {
  switch (l.type) {
    case 'slice': return [l.params.color.fieldKey];
    case 'glyph': return [l.params.fieldName ? `vector:${l.params.fieldName}` : null, l.params.color === 'field' ? l.params.fieldColor.fieldKey : null];
    case 'stream': return [l.params.fieldName ? `vector:${l.params.fieldName}` : null, l.params.color === 'field' ? l.params.fieldColor.fieldKey : null];
    case 'iso': return [l.params.fieldKey, l.params.colorMode === 'field' ? l.params.fieldColor.fieldKey : null];
    default: return [];
  }
}

/** 조상 노드를 가까운 것부터 (고리가 있으면 거기서 멈춘다) */
function ancestorsOf(l: Layer, byId: ReadonlyMap<string, Layer>): Layer[] {
  const out: Layer[] = [];
  const seen = new Set<string>([l.id]);
  let pid = l.parentId;
  while (pid && !seen.has(pid)) {
    seen.add(pid);
    const p = byId.get(pid);
    if (!p) break;
    out.push(p);
    pid = p.parentId;
  }
  return out;
}

/** 볼륨 노드의 표현 방식이 값으로 칠하는가 (AppCore.colorsByField 와 같은 기준 — Outline · Feature Edges · 없음은 색 배열을 그리지 않는다) */
const paintsByValue = (v: DataView): boolean => v.representation === 'surface' || v.representation === 'points' || v.representation === 'volume';

/**
 * 노드 하나가 다시 계산하는 데 기대는 Field key (목록에 없는 것·빈 것 포함 — 거르기 전).
 * wide = 읽어 둘 배열(usedArrays) — 볼륨 노드의 색을 표현 방식과 무관하게 넣는다. 아니면(nodeArrays) 값으로 칠하는 표현일 때만
 */
function nodeKeys(id: string, input: UsedArraysInput, byId: ReadonlyMap<string, Layer>, wide: boolean): (string | null)[] {
  const colorOf = (v: DataView): string | null => (wide || paintsByValue(v) ? v.color.fieldKey : null);
  if (id === ROOT_NODE_ID) return [colorOf(input.root.view)];
  const l = byId.get(id);
  if (!l) return [];
  const anc = ancestorsOf(l, byId);
  const keys: (string | null)[] = anc.map(filterKey); // 조상 사슬의 Clip(Scalar)·Threshold
  if (!isFilter(l)) return [...keys, ...viewKeys(l)];
  keys.push(filterKey(l));
  const src = anc.find((a) => !isFilter(a)); // 입력 모양을 만든 노드 (없으면 볼륨 위)
  return src ? [...keys, ...viewKeys(src)] : [...keys, colorOf(l.view)];
}

/** key 목록 → 머리 정보에 있는 것만, 배열 이름으로, 겹친 것을 빼고 처음 나온 차례 */
function namesOf(keys: readonly (string | null)[], catalog: ReadonlySet<string>): string[] {
  const out: string[] = [];
  for (const k of keys) {
    if (!k || !catalog.has(k)) continue;
    const name = arrayNameOf(k);
    if (!out.includes(name)) out.push(name);
  }
  return out;
}

const indexOf = (layers: readonly Layer[]): Map<string, Layer> => new Map(layers.map((l) => [l.id, l]));

/**
 * 노드 하나(데이터는 ROOT_NODE_ID)가 다시 계산하는 데 기대는 배열 이름: 그 노드의 Field·색 + 조상 사슬의 Clip(Scalar)·Threshold Field.
 * 면·선·Glyph 위의 Clip·Threshold 는 입력 노드의 Field·색까지. 볼륨 노드(데이터 · 볼륨 위 Clip·Threshold)의 색(view.color)은 표현 방식이
 * Surface · Points · Volume 일 때만. 머리 정보에 없는 Field 는 뺀다
 */
export function nodeArrays(id: string, input: UsedArraysInput): string[] {
  return namesOf(nodeKeys(id, input, indexOf(input.layers), false), input.catalog);
}

/** 지금 쓰는 배열 이름 (데이터 노드 → 노드 트리 차례로 처음 나온 차례, 마지막에 새 노드 기본 배열). 숨긴 노드도, 볼륨 노드의 색은 표현 방식과 무관하게 넣는다 */
export function usedArrays(input: UsedArraysInput): string[] {
  const byId = indexOf(input.layers);
  const keys: (string | null)[] = [...nodeKeys(ROOT_NODE_ID, input, byId, true)];
  for (const l of input.layers) keys.push(...nodeKeys(l.id, input, byId, true));
  keys.push(input.defaultFieldKey);
  return namesOf(keys, input.catalog);
}

// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   layers.ts

후처리 노드 자료형. ParaView 파이프라인 그대로: 노드(필터)가 데이터를 만들고,
보이는 것은 노드마다 붙는 표현(representation)이다. 트리의 중첩이 곧 파이프라인이며 UI 에서는 "상위"라고 부른다.
노드 여섯은 모두 ParaView 의 필터다(Filters 메뉴 Common 묶음: Contour·Clip·Slice·Threshold·Glyph·Stream Tracer). 차이는 결과 종류다:
- `clip`·`threshold` (코드 FILTER_TYPES): 결과가 볼륨으로 남는다. 어느 노드 아래에도 붙고, 자식은 조상 Clip·Threshold 를 전부 이어받는다(AND).
- `slice`·`iso` → 면, `stream` → 선, `glyph` → Glyph (코드 VIEW_TYPES — 이름은 옛 '표현 노드' 모델의 흔적): 볼륨 노드(데이터·볼륨 위의 Clip/Threshold) 아래에만 붙는다.
- 노드 출력 종류(OutputKind): 데이터와 볼륨 위의 Clip·Threshold = volume, Slice·Isosurface = surface, Streamline = lines,
  Glyph = glyphs, 그 위의 Clip·Threshold = 입력과 같은 종류.
- 볼륨 노드(데이터·볼륨 Clip·Threshold)는 표현 방식(DataView: Surface | Outline | Points | Volume | 없음)을 가진다. 데이터의 표현은 AppCore.root.
- `visible` = 그 노드 자기 표현의 보이기(눈 단추). 자식에는 영향이 없다(ParaView 와 같음).
노드 하나 = 한 가지 일. `parentId` 는 상위 노드의 id 또는 null(데이터 바로 아래).
용어는 영문 원어(Clip, Threshold, Points, Slice, Glyph, Streamline, Isosurface, Surface, Outline, Volume, Coloring, Color Map, Preset, Opacity, Field, Range)를 그대로 쓴다.
*/
/******************************************************************************/
import { VectorMapping } from '../data/pointDataset';
import { ColormapId, DEFAULT_OPACITY_CURVE, OpacityCurve, copyOpacityCurve } from '../utils/colormap';

export type LayerType = 'clip' | 'threshold' | 'slice' | 'glyph' | 'stream' | 'iso';
export type Axis = 0 | 1 | 2;
/** Streamline 모양: 선(굵은 선) · 튜브(원형 단면) · 각기둥(다각형 단면) · 리본(납작한 띠) */
export type StreamShape = 'line' | 'tube' | 'prism' | 'ribbon';

/** Clip·Threshold 노드 (어느 노드 아래에도 붙는다) */
export const FILTER_TYPES: LayerType[] = ['clip', 'threshold'];
/** Slice·Isosurface·Streamline·Glyph 노드 (볼륨 노드 아래에만 붙는다) */
export const VIEW_TYPES: LayerType[] = ['slice', 'glyph', 'stream', 'iso'];
export const LAYER_TYPES: LayerType[] = [...FILTER_TYPES, ...VIEW_TYPES];
export const LAYER_LABEL: Record<LayerType, string> = { clip: 'Clip', threshold: 'Threshold', slice: 'Slice', glyph: 'Glyph', stream: 'Streamline', iso: 'Isosurface' };

/** 노드 출력 종류. volume = 셀 집합(데이터·볼륨 위 Clip·Threshold), surface = 면(Slice·Isosurface), lines = 선(Streamline), glyphs = Glyph.
 *  화면 낱말(OUTPUT_LABEL, '레이어 추가' 메뉴 항목 오른쪽): 셀 · 면 · 선 · 화살표 — 셀 집합을 '볼륨'이라 적지 않는다(표현 방식 Volume = 안개처럼 그리기와 겹치므로, 2026-10-16) */
export type OutputKind = 'volume' | 'surface' | 'lines' | 'glyphs';
export const OUTPUT_LABEL: Record<OutputKind, string> = { volume: '셀', surface: '면', lines: '선', glyphs: '화살표' };

/**
 * 볼륨 노드의 표현 방식 (ParaView Representation). Surface = 남은 셀 집합의 바깥 면을 셀 값 색으로 · Outline = 경계 상자 ·
 * Points = 셀 중심 점 · Volume = 남은 셀의 값을 시선을 따라 반투명하게 쌓아 그림(늘 배열로 칠함, render/volumeRenderer.ts) ·
 * none = 그리지 않음(자식만 보임)
 */
export type Representation = 'surface' | 'outline' | 'points' | 'volume' | 'none';
export const REPRESENTATION_LABEL: Record<Representation, string> = { surface: 'Surface', outline: 'Outline', points: 'Points', volume: 'Volume', none: '없음' };

/**
 * 색 지도 범위를 마지막으로 잡은 방법 (화면 표시용). grow = 노드를 만들거나 바꿀 때 넓히기만 함(ParaView 기본 'Grow and update on Apply') ·
 * data = 데이터 범위 · custom = 사용자 지정 · alltime = 전 시점 범위 · visible = 보이는 범위 (ParaView Rescale 단추 넷)
 */
export type RangeMode = 'grow' | 'data' | 'custom' | 'alltime' | 'visible';
export const RANGE_MODE_LABEL: Record<RangeMode, string> = { grow: '자동(넓히기)', data: '데이터 범위', custom: '사용자 지정', alltime: '전 시점 범위', visible: '보이는 범위' };

/**
 * 색 지도 (ParaView 색 전달함수). 배열(Field)마다 하나를 그 배열로 칠하는 모든 노드가 공유하고,
 * 성분 선택(크기·X·Y·Z)도 지도에 묶인다(ParaView 와 같음). Separate Color Map 을 켠 노드만 자기 지도를 가진다.
 * Opacity 곡선(ParaView 불투명도 전달함수)도 지도에 딸려 같이 공유되고 Separate 를 켜면 같이 따로 된다(ParaView 와 같음). 곡선은 Volume 만 쓴다.
 */
export interface ColorMap {
  mapping: VectorMapping;
  colormap: ColormapId;
  rangeMin: number;
  rangeMax: number;
  rangeMode: RangeMode;
  autoGrow: boolean;   // 노드를 만들거나 바꿔 다시 계산할 때 범위를 넓히기만 (저장 시점을 바꿀 때는 그대로). 사용자 지정 범위를 넣으면 꺼진다
  fresh?: boolean;     // 아직 아무 노드도 범위를 넣지 않음 — 처음 칠하는 노드의 데이터 범위로 시작한다
  opacity: OpacityCurve; // [x, Opacity] 꺾은선, x 는 이 지도 범위 기준 0~1 (기본 [[0,0],[1,1]]). 늘 새 배열로 바꿔 넣고 제자리에서 고치지 않는다
}

/** 새 색 지도 (기본 Preset Cool to Warm, 기본 Opacity 곡선 = 범위 최소 0 → 최대 1 직선 — ParaView 기본) */
export function defaultColorMap(mapping: VectorMapping = 'magnitude'): ColorMap {
  return { mapping, colormap: 'coolwarm', rangeMin: 0, rangeMax: 1, rangeMode: 'grow', autoGrow: true, fresh: true, opacity: copyOpacityCurve(DEFAULT_OPACITY_CURVE) };
}

/** 색 지도 복사 (Separate Color Map 을 켜거나 배열을 바꿀 때 공유 지도에서 시작). Opacity 곡선도 새 배열로 — 두 지도가 같은 배열을 나눠 갖지 않게 */
export function copyColorMap(m: ColorMap): ColorMap {
  return { ...m, opacity: copyOpacityCurve(m.opacity) };
}

/** 노드의 색칠 (ParaView Coloring): fieldKey = 칠할 배열(null = 단색), separate = 이 노드만의 지도(map)를 쓰는지 (ParaView Separate Color Map) */
export interface LayerColor {
  fieldKey: string | null;
  separate: boolean;
  map: ColorMap;       // separate 일 때의 지도. 공유 지도는 AppCore.colorMaps
}

export function defaultLayerColor(fieldKey: string | null): LayerColor {
  return { fieldKey, separate: false, map: defaultColorMap() };
}

/**
 * 볼륨 노드의 표시 설정. opacity 는 Surface, pointSize·sphereShading 은 Points, volumeUnitDistance 는 Volume 에 쓴다.
 * color 는 Surface·Points·Volume 의 색칠(Outline 은 늘 단색 — ParaView. Volume 은 단색이 없다)
 */
export interface DataView {
  representation: Representation;
  opacity: number;
  pointSize: number;       // 점 크기 배율
  sphereShading: boolean;  // 구 형태로 음영 처리
  /** ParaView Scalar Opacity Unit Distance (m): Opacity 곡선의 값이 이 두께를 지날 때의 불투명도라는 뜻. null = 기본값(AppCore.volumeUnitDefault) */
  volumeUnitDistance: number | null;
  color: LayerColor;
}

export function defaultDataView(representation: Representation, fieldKey: string | null = null): DataView {
  return { representation, opacity: 1, pointSize: 1, sphereShading: true, volumeUnitDistance: null, color: defaultLayerColor(fieldKey) };
}

/** Clip 종류 (ParaView Clip Type 중 Plane·Box·Scalar. Sphere·Cylinder 는 뒤로 미룸) */
export type ClipType = 'plane' | 'box' | 'scalar';
export const CLIP_TYPE_LABEL: Record<ClipType, string> = { plane: 'Plane', box: 'Box', scalar: 'Scalar' };

/**
 * Clip. invert 는 ParaView 기본처럼 켬이 기본이고 뜻도 같다:
 * - Plane: 법선 +axis, 원점 position. invert 켬 = 법선 쪽(좌표 > position)을 버리고 좌표 ≤ position 을 남김. 끄면 반대.
 * - Box: invert 켬 = 상자 안을 남김. 끄면 상자 밖을 남김(안을 비움).
 * - Scalar: 그 Field 값이 기준(value) 이하이면 남김(invert 켬), 이상이면 남김(끔). 셀 데이터라 볼륨에는 셀 단위(ParaView 도 Threshold 로 대체).
 * 볼륨에는 셀 중심으로 판정해 셀 단위로 남기거나 버린다(ParaView 는 걸친 셀을 잘라 새 면을 만든다 — PV와 다름, 축 정렬 격자라 차이는 반 칸).
 * 고르지 않은 종류의 항목도 값을 지켜 둔다(종류를 바꿨다 돌아와도 그대로).
 */
export interface ClipParams {
  clipType: ClipType;
  axis: Axis;                          // Plane 법선 축
  position: number;                    // Plane 원점 (m)
  boxMin: [number, number, number];    // Box 하한 (m)
  boxMax: [number, number, number];    // Box 상한 (m)
  fieldKey: string | null;             // Scalar 의 Field ('scalar:<name>' | 'vector:<name>')
  mapping: VectorMapping;
  value: number;                       // Scalar 기준값
  invert: boolean;                     // ParaView Invert (기본 켬)
}

/** Threshold 방식 (ParaView ThresholdMethod). 경계는 모두 포함 */
export type ThresholdMethod = 'between' | 'below' | 'above';
export const THRESHOLD_METHOD_LABEL: Record<ThresholdMethod, string> = { between: 'Between', below: 'Below', above: 'Above' };

/**
 * Threshold: 셀을 통째로 남기거나 뺀다. Between = lower ≤ v ≤ upper, Below = v ≤ lower,
 * Above = v ≥ upper. invert 는 결과를 뒤집는다(기본 끔). allScalars(기본 켬)는 꼭짓점 값이 있는 면·선에 걸 때만 뜻이 있다:
 * 켜면 삼각형(유선은 한 줄)의 모든 꼭짓점이 통과해야 남기고, 끄면 하나라도 통과하면 남긴다. 볼륨 셀은 값이 하나라 상관없다.
 * Field 가 데이터에 없으면 통과(아무것도 거르지 않음).
 */
export interface ThresholdParams {
  fieldKey: string | null;  // 'scalar:<name>' | 'vector:<name>' (기본: 전역 Color 의 Field)
  mapping: VectorMapping;
  method: ThresholdMethod;
  lower: number;
  upper: number;
  allScalars: boolean;
  invert: boolean;
}

type BoundsLike = { min: number[]; max: number[] };

/** 새 Clip 기본값 (ParaView GUI 도메인과 같게): Plane 은 데이터 가운데·법선 +X, Box 는 데이터 범위 전체, Scalar 는 그 Field 값 범위 가운데. Invert 켬 */
export function defaultClip(bounds: BoundsLike, fieldKey: string | null, mapping: VectorMapping, stats: { min: number; max: number }): ClipParams {
  return {
    clipType: 'plane', axis: 0, position: (bounds.min[0] + bounds.max[0]) / 2,
    boxMin: [bounds.min[0], bounds.min[1], bounds.min[2]], boxMax: [bounds.max[0], bounds.max[1], bounds.max[2]],
    fieldKey, mapping, value: (stats.min + stats.max) / 2, invert: true,
  };
}

/** 새 Threshold 기본값 (ParaView): Between, 그 Field 의 값 범위 전체, All Scalars 켬, Invert 끔 */
export function defaultThreshold(fieldKey: string | null, mapping: VectorMapping, stats: { min: number; max: number }): ThresholdParams {
  return { fieldKey, mapping, method: 'between', lower: stats.min, upper: stats.max, allScalars: true, invert: false };
}

/**
 * 평면 주변 두께 thickness 의 얇은 층만 남기는 Box Clip (Glyph '평면 위' 배치, 격자 없는 데이터의 기본 장면). 다른 두 축은 bounds 전체 —
 * 셀 가장자리까지 덮도록 셀 범위(AppCore.cellBounds)를 넘긴다. base 는 Plane·Scalar 항목을 채울 새 Clip 기본값
 */
export function bandClip(axis: Axis, position: number, thickness: number, bounds: BoundsLike, base?: ClipParams): ClipParams {
  const boxMin: [number, number, number] = [bounds.min[0], bounds.min[1], bounds.min[2]];
  const boxMax: [number, number, number] = [bounds.max[0], bounds.max[1], bounds.max[2]];
  boxMin[axis] = position - thickness / 2; boxMax[axis] = position + thickness / 2;
  return { ...(base ?? { fieldKey: null, mapping: 'magnitude', value: 0, position, axis }), clipType: 'box', boxMin, boxMax, invert: true } as ClipParams;
}

/**
 * 장면 JSON 의 Clip params → 지금 형식. 2026-10-08 2단계 전의 형식 { axis, min, max }(축 구간)는 그 축만 좁힌 Box(Invert 켬)로 옮긴다.
 * fill = 새 Clip 기본값(빠진 항목을 채움)
 */
export function normalizeClipParams(p: Record<string, unknown>, fill: ClipParams, bounds: BoundsLike): ClipParams {
  if (typeof p.clipType === 'string' && ['plane', 'box', 'scalar'].includes(p.clipType)) return { ...fill, ...(p as Partial<ClipParams>) } as ClipParams;
  const axis = (typeof p.axis === 'number' ? p.axis : 2) as Axis;
  const min = typeof p.min === 'number' ? p.min : bounds.min[axis];
  const max = typeof p.max === 'number' ? p.max : bounds.max[axis];
  const box = bandClip(axis, (min + max) / 2, max - min, bounds, fill);
  // v3 의 invert: true 는 "구간 밖을 남김" = 상자 밖을 남기는 Box(Invert 끔). v4(1단계 전 노드 트리)에는 invert 가 없었다(구간 안 = Invert 켬)
  if (typeof p.invert === 'boolean') box.invert = !p.invert;
  return box;
}

/** 장면 JSON 의 Threshold params → 지금 형식. 옛 { min, max } 는 Between 의 lower·upper 로 */
export function normalizeThresholdParams(p: Record<string, unknown>, fill: ThresholdParams): ThresholdParams {
  const out = { ...fill, ...(p as Partial<ThresholdParams>) } as ThresholdParams & { min?: number; max?: number };
  if (typeof p.lower !== 'number' && typeof p.min === 'number') out.lower = p.min;
  if (typeof p.upper !== 'number' && typeof p.max === 'number') out.upper = p.max;
  if (!['between', 'below', 'above'].includes(out.method)) out.method = 'between';
  delete out.min; delete out.max;
  return out;
}

/** GPU clippingPlanes 로 정확히 걸 수 있는 Clip 인지 (Plane, 안을 남기는 Box). 나머지(Box 밖·Scalar)는 면·선에 CPU 로 판정한다 */
export function isGpuClip(c: ClipParams): boolean {
  return c.clipType === 'plane' || (c.clipType === 'box' && c.invert);
}

/** Clip 하나가 자리 (x,y,z) 와 그 자리의 Scalar 값 v 를 남기는지. Scalar 인데 값이 없으면(NaN) 남기지 않는다 */
export function clipKeeps(c: ClipParams, x: number, y: number, z: number, v: number): boolean {
  switch (c.clipType) {
    case 'plane': { const p = c.axis === 0 ? x : c.axis === 1 ? y : z; return c.invert ? p <= c.position : p >= c.position; }
    case 'box': {
      const inside = x >= c.boxMin[0] && x <= c.boxMax[0] && y >= c.boxMin[1] && y <= c.boxMax[1] && z >= c.boxMin[2] && z <= c.boxMax[2];
      return c.invert ? inside : !inside;
    }
    case 'scalar': if (v !== v) return false; return c.invert ? v <= c.value : v >= c.value;
  }
}

/** Threshold 의 구간 조건만 (Invert 전). Between·Below·Above, 경계 포함 */
export function thresholdBand(t: ThresholdParams, v: number): boolean {
  return t.method === 'between' ? v >= t.lower && v <= t.upper : t.method === 'below' ? v <= t.lower : v >= t.upper;
}

/** 값 하나짜리 셀(볼륨 셀·점)을 Threshold 가 남기는지: 구간 조건을 Invert 로 한 번 뒤집는다. NaN(결측)은 늘 뺀다 */
export function thresholdKeeps(t: ThresholdParams, v: number): boolean {
  if (v !== v) return false;
  const pass = thresholdBand(t, v);
  return t.invert ? !pass : pass;
}

export interface SliceParams {
  axis: Axis;
  position: number;
  surface: boolean;        // 면 표시
  lines: boolean;          // Contour lines 표시. 둘 다 false 는 금지 (코드는 둘 다 false 면 surface 를 true 로 되돌린다)
  levels: number;          // Contour lines 개수
  resolution: 1 | 2;       // 1 = 격자 간격, 2 = 절반
  opacity: number;
  banded: boolean;         // 색 띠(Contour lines 사이를 한 색으로)
  lineColor: 'black' | 'white' | 'field'; // field = Contour line 값의 Color Map 색
  lineWidth: number;       // Contour lines 굵기 (px)
  lineOpacity: number;     // Contour lines 진하기
  clipToObjects: boolean;  // 형상 경계에 맞춤: 벽 옆 반 칸을 이웃 값으로 잇고 형상 안쪽은 잘라 낸다
  color: LayerColor;
}

/** Glyph 배치(ParaView Glyph Mode): 균일 샘플(Uniform Spatial Distribution, PV 기본) | N개마다 1개(Every Nth Point) | 평면 위(우리 고유 — 평면 근처 얇은 층에서 N개마다) */
export type GlyphMode = 'uniform' | 'stride' | 'plane';

export interface GlyphParams {
  fieldName: string | null;
  mode: GlyphMode;
  maxSamples: number;             // mode = uniform: 흩는 자리 수 (PV MaximumNumberOfSamplePoints, 기본 5000). 화살표 수는 이보다 적을 수 있다
  axis: Axis;                     // mode = plane
  position: number;
  stride: number;                 // mode = stride · plane
  scaleFactor: number;            // 화살표 길이 = 벡터 크기 × scaleFactor (lengthMode = uniform 이면 벡터 크기 최대값 × scaleFactor). PV Scale Factor
  color: 'field' | 'white' | 'black';
  lengthMode: 'magnitude' | 'uniform';
  fieldColor: LayerColor; // color = 'field'일 때의 색 기준
}

export interface StreamParams {
  fieldName: string | null;
  seedAxis: Axis;          // 시작면의 법선 축
  seedPos: number;
  seedBounds: 'data' | 'finest';
  nU: number;
  nV: number;
  vFrac: number;
  direction: 'forward' | 'backward' | 'both';
  maxLength: number;       // m
  shape: StreamShape;
  width: number;           // 선 굵기 (px 또는 m)
  widthUnits: 'px' | 'm';
  meshWidth: number;       // 튜브·각기둥 지름, 리본 너비 (m)
  sides: number;           // 각기둥 면 수 (3~8)
  ribbonDir: 'horizontal' | 'vertical';
  opacity: number;
  dash: 'solid' | 'dashed' | 'dotted'; // 선 모양에만
  color: 'field' | 'solid';
  solidColor: string;
  fieldColor: LayerColor; // color = 'field'일 때의 색 기준
}

export interface IsoParams {
  fieldKey: string | null;
  value: number;
  colorMode: 'solid' | 'field';
  solidColor: string;
  opacity: number;
  fieldColor: LayerColor; // colorMode = 'field'일 때의 색 기준
}

/** parentId: 상위 노드의 id 또는 null(데이터 바로 아래). Slice·Isosurface·Streamline·Glyph 노드의 상위는 볼륨 노드여야 한다(AppCore.canAttach) */
interface LayerBase { id: string; name: string; visible: boolean; parentId: string | null }
/** view: 볼륨 위에 있을 때의 표현 방식. 면·선·Glyph 위의 Clip·Threshold 는 입력 노드의 모양을 그대로 그리므로 view 를 쓰지 않는다 */
export interface ClipLayer extends LayerBase { type: 'clip'; params: ClipParams; view: DataView }
export interface ThresholdLayer extends LayerBase { type: 'threshold'; params: ThresholdParams; view: DataView }
export interface SliceLayer extends LayerBase { type: 'slice'; params: SliceParams }
export interface GlyphLayer extends LayerBase { type: 'glyph'; params: GlyphParams }
export interface StreamLayer extends LayerBase { type: 'stream'; params: StreamParams }
export interface IsoLayer extends LayerBase { type: 'iso'; params: IsoParams }
export type FilterLayer = ClipLayer | ThresholdLayer;
export type ViewLayer = SliceLayer | GlyphLayer | StreamLayer | IsoLayer;
export type Layer = FilterLayer | ViewLayer;
export type LayerParams = ClipParams | ThresholdParams | SliceParams | GlyphParams | StreamParams | IsoParams;
export type LayerPatch = Partial<ClipParams> | Partial<ThresholdParams> | Partial<SliceParams> | Partial<GlyphParams> | Partial<StreamParams> | Partial<IsoParams>;

/** 조상 Clip·Threshold 하나 (뿌리→잎 순서로 모아 사슬을 만든다) */
export type ChainItem = { kind: 'clip'; params: ClipParams } | { kind: 'threshold'; params: ThresholdParams };

/** Clip·Threshold 노드 종류인지 (어느 노드 아래에도 붙는지) */
export function isFilterType(t: LayerType): boolean { return FILTER_TYPES.includes(t); }

/** Slice·Isosurface·Streamline·Glyph 노드 종류의 출력 */
export function viewOutputKind(t: LayerType): OutputKind {
  return t === 'stream' ? 'lines' : t === 'glyph' ? 'glyphs' : 'surface';
}

let seq = 1;
export const newLayerId = (): string => `layer-${Date.now().toString(36)}-${(seq++).toString(36)}`;

/** 데이터 범위 안에서 평면 위치를 정한다 ('min' | 'max' | 'center' | 숫자) */
export function resolvePlanePosition(bounds: { min: number[]; max: number[] }, axis: Axis, sp: number | 'min' | 'max' | 'center'): number {
  if (sp === 'min') return bounds.min[axis];
  if (sp === 'max') return bounds.max[axis];
  if (sp === 'center') return (bounds.min[axis] + bounds.max[axis]) / 2;
  return sp;
}

/** Slice·Isosurface·Streamline·Glyph 노드가 값으로 색을 칠하는지 (단색만 쓰거나 Clip·Threshold 노드면 false). 볼륨 노드의 색칠은 DataView.color(AppCore.nodeColoring) */
export function usesFieldColor(l: Layer): boolean {
  switch (l.type) {
    case 'slice': return true;
    case 'glyph': return l.params.color === 'field';
    case 'stream': return l.params.color === 'field';
    case 'iso': return l.params.colorMode === 'field';
    default: return false;
  }
}

/** Slice·Isosurface·Streamline·Glyph 노드의 색칠 객체 (Slice 는 color, 나머지는 fieldColor). Clip·Threshold 노드는 null (볼륨이면 view.color) */
export function layerColorOf(l: Layer): LayerColor | null {
  switch (l.type) {
    case 'slice': return l.params.color;
    case 'glyph': case 'stream': case 'iso': return l.params.fieldColor;
    default: return null;
  }
}

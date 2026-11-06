// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   AppCore.ts

렌더링 엔진과 앱 상태. UI(panel.ts, sceneTree.ts, legend.ts)는 이 클래스만 통해 동작한다.
자사 후처리기의 AppCore.ts 역할에 해당한다.

데이터 흐름: CSV 또는 VTU(레벨별) → 점 데이터셋 → 격자 복원(레벨별) → 합친 점(공유 속성 pointAttrs) + 샘플러(후처리)
후처리는 노드 트리(layers.ts)로 쌓는다 — ParaView 파이프라인 그대로:
노드가 데이터를 만들고 보이는 것은 노드마다 붙는 표현이다. 데이터(root)·볼륨 위의 Clip/Threshold 는 '볼륨 노드'로 표현 방식
(Surface | Outline | Points | Volume | 없음)을 가지고, Slice·Isosurface·Streamline·Glyph 는 볼륨 노드 아래에만 붙는다. Clip·Threshold 는 어느 노드
아래에도 붙고, 면·선·Glyph 위에 붙으면 입력 노드(sourceOf)의 모양을 자기 Clip·Threshold까지 더해 다시 그린다(예: Slice 1 → Clip 1).
노드(와 root)마다 렌더러 하나와 "다시 계산 필요" 표시를 둔다. 자식은 조상 Clip·Threshold 를 전부 이어받는다(AND, chainOf).
볼륨 노드: 사슬을 격자 셀 단위로 판정해 Surface(바깥 면)·Outline(경계 상자)·Volume(레벨별 3D 텍스처)을, 합친 점 단위로 판정해 Points(hidden 속성)를 만든다.
조상 Clip 은 Slice·Isosurface·Streamline 에 GPU clippingPlanes 로, Glyph 에 CPU 판정으로 적용한다.
조상 Threshold 는 Glyph 는 CPU 판정, Slice 는 꼭짓점 값 NaN, Isosurface 는 삼각형 무게중심 샘플, Streamline 은 적분 중단(stopAt)으로 적용한다.
필터를 메뉴에서 만들면 ParaView 규칙(replace_input)대로 입력 노드를 숨긴다: Glyph 는 숨기지 않고, 나머지는 입력이 불투명 Surface 일 때만.
색(ParaView 색 전달함수): 배열(Field)마다 색 지도 하나(colorMaps — 성분·Colormap·범위)를 그 배열로 칠하는 모든 노드가 공유하고, Separate Color Map 을
켠 노드만 자기 지도를 쓴다. 범위는 값이 서로 다른 장면을 처음 그릴 때 정하고(값이 모두 같은 장면은 정하지 않고 '모두 0'), 노드를 만들거나 바꿔 다시
계산할 때 넓히기만 하며(Grow) 저장 시점을 바꿀 때는 그대로다(판단은 core/colorRange.ts). Rescale 단추 넷은 rescaleColorMap — '전 시점 범위'는 모든
저장 시점에서 그 배열 하나만 읽는 작업을 시작한다(TimeSeries.scanRange, 진행·취소는 rangeScanFor · stopRangeScan).
읽는 중 표시는 둘로 나뉜다: 데이터를 여는 동안은 loading(읽기 덮개 · 데이터 열기 창의 진행 글), 저장 시점을 읽는 동안(재생 · 슬라이더)은 stepLoad
(3D 화면을 덮지 않고 재생 막대가 오래 걸릴 때만 작은 진행 원 — subscribeSteps). 값 밀대의 양 끝은 노드마다 정해 두고(valueBounds — 만들 때 ·
Field·Component 를 바꿀 때 · 같은 배열·성분의 전 시점 범위를 읽었을 때만 정함) 재생으로는 바뀌지 않는다(core/sliderRange.ts).
결과 폴더(시간축)는 저장 시점마다 '쓰는 배열'(칠하거나 거르는 데 쓰는 배열 — core/usedArrays.ts)만 읽는다(2026-11-06): Field 목록은 첫 저장 헤더로 만들고
(resultSet.ts fieldCatalogOf — 값을 읽지 않음), 처음 열 때는 기본 Field 하나만 읽는다. 쓰는 배열이 바뀌면(syncUsedArrays) 지금 장면에 빠진 배열만 더 읽어
끼우고(fetchUsedArrays), 그 배열이 오기 전에는 그 배열에 기대는 노드를 다시 계산하지 않는다(앞 그림 유지 · 요약 줄 '<배열> 읽는 중' — 없는 채 계산하면
Threshold·Scalar Clip 이 아무것도 거르지 않는 '틀린 그림'이 나온다). Field 를 고를 때 통계로 정하던 값은 배열이 온 뒤 정한다(afterArrival).
*/
/******************************************************************************/
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Bounds, Field, FieldStats, PointDataset, VectorField, VectorMapping, mappedStats, mappedValues } from '../data/pointDataset';
import { parseCsv } from '../data/loaders/csv_loader';
import { fetchStl, parseStl, requireTriangles } from '../data/loaders/stl_loader';
import { loadVtiAsCellPoints, loadVtuAsCellPoints, readVtmDatasets } from '../data/loaders/vtu_loader';
import { ScalarSampler, StructuredGrid, VectorSampler, scalarSamplerFor, vectorSamplerFor } from '../data/gridDataset';
import { LevelData, MultiLevelResult, buildMultiLevel, replaceLevelValues } from '../data/multiLevel';
import { FolderSource, HttpFolder, baseName } from '../data/source';
import { ResultScan, defaultFieldOf, fieldCatalogOf, resultName, scanResultFolder, solidArrayOf, stepLabel } from '../data/resultSet';
import { TimeSeries } from '../data/timeSeries';
import { ColormapId, OpacityCurve, RGB, colormapLinear, parseOpacityCurve } from '../utils/colormap';
import { makeChainTester, makeGridChainTester } from '../render/filter';
import { PointAttrs, PointRenderer } from '../render/pointRenderer';
import { DataViewRenderer } from '../render/dataViewRenderer';
import { DrawnCells, VOLUME_EMPTY, VOLUME_MAX_TEXELS, VolumeLevel, VolumeRenderer, fillVolumeLevel, reducedGrid, volumeFactors } from '../render/volumeRenderer';
import { VectorGlyphs } from '../render/vectorGlyphs';
import { Scenery } from '../render/scenery';
import { SliceRenderer } from '../render/sliceRenderer';
import { StreamlineRenderer } from '../render/streamlineRenderer';
import { IsosurfaceRenderer } from '../render/isosurfaceRenderer';
import { PlaneGizmo } from '../render/planeGizmo';
import { Footprint, ObjectStore, SceneObject, objectFromWholeGeometry, objectMatrix, objectsFromGeometries, stlPieceNames } from '../edit/objects';
import { Editor } from '../edit/editor';
import { ClipSolid, contourLines, resampleSlice } from '../analysis/sliceSurface';
import { computeStreamlines } from '../analysis/streamline';
import { IsoResult, marchingTetrahedra, mergeIsoResults } from '../analysis/isosurface';
import { CellSurface, extractCellSurface, mergeCellSurfaces } from '../analysis/cellSurface';
import { extractFeatureEdges } from '../analysis/featureEdges';
import type { Streamline } from '../analysis/streamline';
import type { SliceSurface } from '../analysis/sliceSurface';
import {
  Axis, ChainItem, ClipParams, ColorMap, DataView, FilterLayer, GlyphLayer, IsoLayer, LAYER_LABEL, LAYER_TYPES, Layer, LayerColor, LayerParams, LayerPatch, LayerType,
  OutputKind, Representation, SliceLayer, StreamLayer, StreamParams, ThresholdParams, ViewLayer, bandClip, clipKeeps, copyColorMap, defaultClip, defaultColorMap, defaultDataView,
  defaultLayerColor, defaultThreshold, REPRESENTATIONS, needsGrid,
  isFilterType, isGpuClip, layerColorOf, newLayerId, normalizeClipParams, normalizeThresholdParams, thresholdBand, thresholdKeeps,
  resolvePlanePosition, usesFieldColor, viewOutputKind,
} from './layers';
import { RANGE_MODE_LABEL } from './layers';
import type { RangeMode } from './layers';
import {
  MapNote, NO_NOTE, Range, componentFlatFloor, fillOneSided, isLegacyFlatSaved, joinsFirstRange, noteAfterAutoRange, parseRangeBasis, rangeStateText, rebuildDecision,
  repaintsOnRangeChange, rescaleDecision, scanApplies, scanOutcome, scanProgressText, widenColorRange,
} from './colorRange';
import { DEFAULT_UP, UpAxis, fromZUp, isUpAxis, seedPlaneAxes, upFromInput, upVector, zSingleLayer } from './upAxis';
import { fitBox } from './fitFrame';
import { RangeInfo, RangeStore, SliderBounds, SliderNode, ValueBounds, ValueRange, mappingKeyOf, unionRanges, valueSliderOf } from './sliderRange';
import { PREFETCH_AHEAD_MAX, aheadSteps, firstPlayStep, nextPlayStep } from './playStep';
import { UsedArraysInput, arrayNameOf, nodeArrays, usedArrays } from './usedArrays';

// ---- 데이터 목록 (public/datasets.json) ----
export interface DatasetView {
  sliceAxis?: 0 | 1 | 2;
  slicePosition?: number | 'min' | 'max' | 'center';
  fit?: 'data' | 'shapes';
  colorField?: string;
  seedAxis?: 0 | 1 | 2;
  seedPos?: number;
  seedVFrac?: number;
  seedBounds?: 'data' | 'finest';
}
export interface LevelChoice { label: string; levels: number[]; extra?: number[] }
export interface ExtraBlock { name: string; url: string } // 서버에서 축소한 .vti 등 추가 블록
export type FitTarget = 'data' | 'shapes' | 'domain' | 'all'; // all: 데이터·계산 영역·형상을 모두 담는 범위

/** 부피 표시용 영역 종류: 초기 유체(region_ref·free_surface)·격자 세분화(subdivision_ref). 벽이 아니므로 처음에는 숨긴다 */
const VOLUME_REGION_TYPES = new Set(['region_ref', 'free_surface', 'subdivision_ref']);

/**
 * 객체의 경계 상자가 데이터 범위의 부피를 frac 이상 덮는가 (용기 벽·바깥 상자처럼 데이터를 감싸는 큰 형상 판별).
 * 05 예제의 wall.stl처럼 데이터보다 조금 작은 용기도 잡히게 '통째로 감싸는가' 대신 겹치는 부피 비율로 본다.
 */
export function coversBounds(o: SceneObject, b: Bounds, frac = 0.5): boolean {
  if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
  const box = o.geometry.boundingBox!.clone().applyMatrix4(objectMatrix(o));
  const lo = [Math.max(box.min.x, b.min[0]), Math.max(box.min.y, b.min[1]), Math.max(box.min.z, b.min[2])];
  const hi = [Math.min(box.max.x, b.max[0]), Math.min(box.max.y, b.max[1]), Math.min(box.max.z, b.max[2])];
  const inter = [0, 1, 2].reduce((v, i) => v * Math.max(0, hi[i] - lo[i]), 1);
  const vol = [0, 1, 2].reduce((v, i) => v * Math.max(b.max[i] - b.min[i], 1e-12), 1);
  return inter / vol >= frac;
}

export interface DatasetEntry {
  id: string;
  label: string;           // 짧은 이름 — '데이터 열기' 창(post/openDataDialog.ts) '예제' 줄 이름이자 연 뒤의 도구막대·장면 트리 이름 (currentLabel)
  desc?: string;           // '예제' 줄 둘째 줄의 짧은 설명 (해상도 선택지가 있으면 선택지 설명이 대신한다)
  kind: 'csv' | 'vtm' | 'result';  // result: 해석엔진 결과 폴더를 서버 주소로 (folder + list) — 시간축이 생긴다
  csv?: string;
  vtm?: string;
  folder?: string;         // kind=result: 파일 주소의 밑 (예: /__data/e2e/03_concentration_diffusion)
  list?: string;           // kind=result: 폴더 목록 주소의 밑 (예: /__list/e2e/03_concentration_diffusion)
  extraBlocks?: ExtraBlock[];
  levelChoices?: LevelChoice[];
  defaultChoice?: number;
  defaultLevels?: number[];
  arrays?: string[];
  solidArray?: string;
  units?: Record<string, string>;
  stl?: string[];
  objects?: string;        // 발자국 목록 JSON (형상에 이름을 붙이는 데 씀)
  stlAxes?: string[];      // 형상 파일 축 → 해석 좌표계 (예: ["x","z","y"])
  stlOffset?: number[];
  meta?: string;
  note?: string;
  badge?: string;          // 상단 표시 (예: '실제 해석 결과')
  view?: DatasetView;
}

export interface FieldOption { key: string; label: string; kind: 'scalar' | 'vector' }

/** 렌더러에 넘기는 색 기준 (노드 색칠 + 그 지도에서 만든다 — AppCore.specOf) */
export interface ColorState {
  fieldKey: string | null;   // 'scalar:<name>' | 'vector:<name>'
  mapping: VectorMapping;    // 벡터일 때 크기/성분
  colormap: ColormapId;
  rangeMin: number;
  rangeMax: number;
  rangeMode?: RangeMode;     // 범위를 잡은 기준 (화면 표시용)
  opacity: OpacityCurve;     // Opacity 곡선 (Volume 만 쓴다 — 그 지도의 배열 그대로, 고치지 않는다)
  /** 지도가 아직 범위를 정하지 않음 (범례가 숫자 대신 '모두 0' · '범위 미정'을 쓴다). 이때 rangeMin·rangeMax 는 칠하기용 임시 값 */
  unset?: boolean;
  /** unset 일 때 지금 그린 값이 모두 같으면 그 값의 범위 [최소, 최대] (거의 같음이면 둘이 조금 다름), 그린 값이 없으면 null */
  flat?: Range | null;
}

/**
 * 읽는 중인 저장 시점 하나 (AppCore.stepLoad — setStep 이 캐시에 없는 시점을 기다리는 동안). n = 저장 번호, label = 시각 글('t = 0.096'),
 * done · total = 읽은 · 읽을 배열 바이트(TimeSeries onStepProgress, total 0 = 모름), startedAt = 기다리기 시작한 때(performance.now — 앞서 기다리던 시점이
 * 있으면 그때부터 이어 센다). 재생 막대가 오래 걸릴 때만 진행 원으로 보인다(ui/timeBarModel.ts stepLoadView)
 */
export interface StepLoad { n: number; label: string; done: number; total: number; startedAt: number }

/** 전 시점 범위 읽기 작업 하나 (AppCore.rangeScan — 한 번에 하나). map = 누른 순간의 지도 객체(결과는 이 지도에만), mapping = 누른 때의 성분 */
interface RangeScanJob {
  map: ColorMap; fieldKey: string; owner: string | null; mapping: VectorMapping; ctrl: AbortController;
  done: number; total: number; failed: number; wholeFiles: boolean; lastEmit: number;
}

/**
 * 색 지도마다 들고 있는 잠깐의 상태 (WeakMap — 지도가 버려지면 같이 사라짐. ColorMap 칸에 넣지 않는 까닭: Separate 지도는 노드 params 안에 있어 장면 JSON 에 그대로 저장된다).
 * flat = 미정일 때 마지막 판단에서 그린 값이 모두 같았던 범위(화면 '모두 0' — 판단한 자리에서 남겨 화면이 같은 규칙을 다시 계산하지 않고, 저장 시점을 넘기는 사이 깜빡이지 않음) ·
 * settledPass = 처음 정한 다시 계산 차례 · componentStep = Component 를 바꾼 저장 시점 차례(정한 장면이 같으면 근거 '데이터 범위') ·
 * note = 안내 줄(Rescale 결과 · 전 시점 범위 읽기를 멈춘 까닭 — 편집기 DOM 이 아니라 지도에 묶는다. 멈춤 안내는 자동으로 범위가 정해져도 남는다 — colorRange.ts MapNote)
 */
interface MapRuntime { flat: Range | null; settledPass: number; componentStep: number | null; note: MapNote }

/** 색 지도 대상: 노드(그 노드가 쓰는 지도 — 공유 또는 Separate) 또는 배열(공유 지도) */
export type ColorTarget = { nodeId: string } | { fieldKey: string | null };

/** 지금 쓰이는 색 지도 하나 (Color Map 화면의 목록 한 줄 — AppCore.colorMapList) */
export interface ColorMapEntry {
  key: string;          // 'field:<배열 key>' (공유 지도) | 'node:<색칠 주인 노드 id>' (Separate Color Map)
  target: ColorTarget;  // updateColorMap·rescaleColorMap·colorMapFor 에 넘길 대상
  fieldKey: string;
  owner: string | null; // Separate 지도의 색칠 주인 노드 (공유 지도는 null)
  users: string[];      // 그 지도로 지금 칠하는 노드 id (데이터 = ROOT_ID)
}

export interface DisplayState {
  buildingsVisible: boolean;
  buildingOpacity: number;
  gridVisible: boolean;
  legendSize: 'off' | 'sm' | 'md' | 'lg'; // 범례 크기 (off = 숨김)
  planeFrame: boolean;    // 평면 위치 표시 (Slice·Clip·Streamline 시작면)
  projection: 'perspective' | 'orthographic'; // 원근 / 직교(평행) 투영. 직교는 거리와 무관하게 크기가 같아 비교·계측에 맞다
  /** 화면에서 위로 세울 축 (core/upAxis.ts). 데이터를 열 때 입력 JSON 의 중력으로 정하고(upFromInput), 그 뒤에는 사용자가 고를 때만 바뀐다.
   *  카메라 위쪽·보기 단추 방향·바닥 격자·조명만 따르고 데이터 좌표는 그대로다 */
  upAxis: UpAxis;
}

export interface DatasetInfo {
  note: string;
  units: Record<string, string>;
  descriptions: Record<string, string>;
}

/**
 * 레이어의 계산 결과 요약 (UI 표시용). pending = 다시 계산할 차례인데 기대는 배열이 지금 장면에 아직 없어 기다리는 중(시간축 — 그 배열 이름).
 * 그동안 detail 은 '<배열> 읽는 중'(읽기에 실패했으면 '<배열> 읽지 못함')이고 그림은 앞 그림이다
 */
export interface LayerStats { count: number; detail: string; ms: number; pending?: string[] }

/** 데이터(root) 노드의 런타임 키·장면 JSON 의 이름 */
export const ROOT_ID = 'root';
/** 데이터(원본) 노드: 보이기와 표현 방식 */
export interface RootNode { visible: boolean; view: DataView }

type LayerRenderer = DataViewRenderer | SliceRenderer | VectorGlyphs | StreamlineRenderer | IsosurfaceRenderer;
/** 런타임 종류: data = 볼륨 노드의 표현(DataViewRenderer), 나머지는 그 종류의 모양을 그린다(면·선·Glyph 위의 Clip·Threshold 도 입력 종류를 따름) */
type RuntimeKind = 'data' | 'slice' | 'glyph' | 'stream' | 'iso';
/** 노드(와 root)마다 하나 */
/** valueRange = 마지막 계산에서 칠한 값의 범위(데이터 범위·보이는 범위 Rescale 에 쓴다), growPending = 다음 계산 뒤 색 지도를 넓힐지(ParaView Apply),
 *  computedPass = 마지막으로 색을 정한 다시 계산 차례(AppCore.passId — 같은 차례에 계산된 노드의 값을 처음 범위의 합에 넣는다) */
interface LayerRuntime { kind: RuntimeKind; renderer: LayerRenderer; dirty: boolean; ms: number; lastSide: number; stencilBit: number; valueRange: [number, number] | null; growPending: boolean; computedPass: number }
/**
 * 사슬을 면·선 판정용으로 바꾼 것 (Slice 꼭짓점·Isosurface 삼각형·Streamline 점에 쓴다). 자리에서 격자 샘플러로 값을 읽는다.
 * cpu = GPU clippingPlanes 로 못 거는 Clip(Box 밖·Scalar)의 판정, thr = Threshold 와 그 Field 샘플러.
 */
interface ChainProbes { cpu: ((x: number, y: number, z: number) => boolean)[]; thr: { t: ThresholdParams; sample: ScalarSampler }[] }

type Listener = () => void;

/** version 2 장면 JSON 의 전역 필터 (읽기 호환에만 쓴다) */
interface LegacyFilter {
  thresholdEnabled?: boolean; thresholdMin?: number; thresholdMax?: number;
  clipActive?: boolean; clipMode?: 'clip' | 'slice'; clipPosition?: number[]; clipNormal?: number[]; clipInvert?: boolean; sliceThickness?: number;
}
/** version 3 장면 JSON 의 레이어별·Points 용 Clip/Threshold (읽기 호환에만 쓴다). invert(구간 밖을 남김)는 상자 밖을 남기는 Box 로 옮긴다 */
interface LegacyClip { enabled?: boolean; axis?: Axis; min?: number; max?: number; invert?: boolean }
interface LegacyThreshold { enabled?: boolean; min?: number; max?: number }
interface LegacyPointFilter { clip?: LegacyClip; threshold?: LegacyThreshold }
/** version 3 까지의 전역 Points 표시 항목 (지금은 볼륨 노드의 표현 방식 Points) */
interface LegacyDisplay { pointsVisible?: boolean; pointSize?: number; sphereShading?: boolean }
/** 장면 JSON 의 노드 한 줄. version 4 는 id·parentId 가 있고, 옛 버전은 params 안에 clip/threshold/style 이 있을 수 있다 */
interface SceneLayerJSON { id?: string; parentId?: string | null; type: LayerType | 'points'; name?: string; visible?: boolean; params?: Record<string, unknown>; view?: Partial<DataView> }

/** 데이터셋마다 하나 만드는 Points 공유 속성 (위치·반지름; 색칠 값은 볼륨 노드마다 PointRenderer.setValues) */
function makePointAttrs(ds: PointDataset): PointAttrs {
  return {
    position: new THREE.BufferAttribute(ds.positions, 3),
    // 점마다 반지름이 다르면(다중 레벨) 속성으로, 아니면 worldRadius 하나로. 이웃 점과 살짝 겹쳐 면처럼 보이게 0.55
    pointRadius: new THREE.BufferAttribute(ds.radii ?? new Float32Array(ds.count).fill(ds.spacing * 0.55), 1),
    useRadiusAttr: !!ds.radii, worldRadius: ds.spacing * 0.55, count: ds.count,
  };
}
/** 데이터가 없을 때 볼륨 노드의 Points 가 붙을 빈 속성 */
function emptyPointAttrs(): PointAttrs {
  return { position: new THREE.BufferAttribute(new Float32Array(0), 3), pointRadius: new THREE.BufferAttribute(new Float32Array(0), 1), useRadiusAttr: false, worldRadius: 0.5, count: 0 };
}

/**
 * 장면 JSON 의 view → DataView (모르는 값은 기본값으로). field = 색칠 정보가 없을 때(version 5 이하) 칠할 배열.
 * Volume 은 늘 배열로 칠하므로 단색(fieldKey 없음)이면 volumeField(새 노드 기본 배열 — setNodeView 와 같은 규칙)로 칠하고, 그것도 없으면(배열 없는 데이터)
 * 모르는 값처럼 그 노드의 기본 표현(fallback — 데이터 Outline, Clip·Threshold Surface)으로 들인다.
 */
function viewFromJSON(v: Partial<DataView> | undefined, fallback: Representation, field: string | null, volumeField: string | null): DataView {
  const d = defaultDataView(v?.representation && REPRESENTATIONS.includes(v.representation) ? v.representation : fallback, field);
  if (typeof v?.opacity === 'number') d.opacity = Math.min(1, Math.max(0, v.opacity));
  if (typeof v?.pointSize === 'number' && v.pointSize > 0) d.pointSize = v.pointSize;
  if (typeof v?.sphereShading === 'boolean') d.sphereShading = v.sphereShading;
  if (typeof v?.volumeUnitDistance === 'number' && v.volumeUnitDistance > 0 && Number.isFinite(v.volumeUnitDistance)) d.volumeUnitDistance = v.volumeUnitDistance; // setNodeView 와 같은 확인
  if (v?.color) d.color = layerColorFromJSON(v.color, field);
  if (d.representation === 'volume' && !d.color.fieldKey) {
    if (volumeField) d.color.fieldKey = volumeField; else d.representation = fallback;
  }
  return d;
}

/**
 * 장면 JSON 의 색 지도 → ColorMap (모르는 값은 기본값으로). fresh: true 가 아니고 범위가 적혀 있으면 그 범위로 (fresh 아님).
 * Opacity 곡선은 형식이 맞을 때만(utils/colormap parseOpacityCurve — 점 2개 이상, x 0→1 오름차순, Opacity 0~1), 아니면(옛 장면 포함) 기본 곡선
 */
function colorMapFromJSON(raw: unknown, mappingFallback: VectorMapping = 'magnitude'): ColorMap {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const m = defaultColorMap(['magnitude', 'x', 'y', 'z'].includes(o.mapping as string) ? (o.mapping as VectorMapping) : mappingFallback);
  if (typeof o.colormap === 'string') m.colormap = o.colormap as ColormapId;
  const curve = parseOpacityCurve(o.opacity);
  if (curve) m.opacity = curve;
  const fresh = o.fresh === true;
  if (!fresh && typeof o.rangeMin === 'number' && typeof o.rangeMax === 'number') { m.rangeMin = o.rangeMin; m.rangeMax = o.rangeMax; m.fresh = false; m.rangeMode = 'custom'; }
  if (!fresh && ['grow', 'data', 'custom', 'alltime', 'visible'].includes(o.rangeMode as string)) m.rangeMode = o.rangeMode as ColorMap['rangeMode'];
  // 범위 근거(상태 줄): 형식이 맞고 범위 기준과 어울릴 때만. 옛 장면(근거 없음)은 기준 이름만 보이고, 근거 없는 '전 시점 범위'는 '장면 파일의 값'으로 보인다
  const basis = !m.fresh ? parseRangeBasis(o.rangeBasis, m.rangeMode) : undefined;
  if (basis) m.rangeBasis = basis;
  if (typeof o.autoGrow === 'boolean') m.autoGrow = o.autoGrow;
  else if (!m.fresh) m.autoGrow = false; // 옛 장면의 범위는 손으로 잡은 것으로 본다 (불러온 뒤 넓히지 않음)
  return m;
}

/**
 * 장면 JSON 의 노드 색칠 → LayerColor. version 6 은 { fieldKey, separate, map }. 그 전의 { mode: 'global' | 'own', fieldKey, mapping, colormap, range } 는:
 * global(공통 Color 따름) → 그 장면의 공통 Color 배열(field)을 공유 지도로, own(이 레이어만) → 자기 배열 + Separate Color Map(범위 그대로)
 */
function layerColorFromJSON(raw: unknown, field: string | null): LayerColor {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const key = typeof o.fieldKey === 'string' ? o.fieldKey : null;
  if (typeof o.separate === 'boolean') return { fieldKey: key, separate: o.separate, map: colorMapFromJSON(o.map) };
  if (o.mode === 'own') return { fieldKey: key ?? field, separate: true, map: colorMapFromJSON(o) };
  return defaultLayerColor(field);
}

/**
 * Surface·Outline 용 격자: 한 층짜리 축은 격자 복원이 간격을 자리표시값 1 로 두므로(gridDataset axisInfo), 다른 축의 간격(없으면 fine)으로 바꾼 사본.
 * 한 층짜리 축의 셀 번호는 늘 0 이라 간격은 면 두께에만 쓰인다.
 */
function surfaceGrid(g: StructuredGrid, fine: number): StructuredGrid {
  if (g.dims.every((n) => n > 1)) return g;
  const inPlane = g.spacing.filter((_, a) => g.dims[a] > 1);
  const t = inPlane.length ? Math.min(...inPlane) : fine;
  return { ...g, spacing: g.spacing.map((v, a) => (g.dims[a] > 1 ? v : t)) as [number, number, number] };
}

/** 격자 g 에서 자리 (x,y,z) 를 덮는 셀이 남은 셀(keep)인지 — 다중 레벨 Surface 의 레벨 경계 판정 */
function keptAt(g: StructuredGrid, keep: Uint8Array, x: number, y: number, z: number): boolean {
  const i = Math.round((x - g.origin[0]) / g.spacing[0]);
  const j = Math.round((y - g.origin[1]) / g.spacing[1]);
  const k = Math.round((z - g.origin[2]) / g.spacing[2]);
  if (i < 0 || j < 0 || k < 0 || i >= g.dims[0] || j >= g.dims[1] || k >= g.dims[2]) return false;
  return keep[i + g.dims[0] * (j + g.dims[1] * k)] === 1;
}

/** 남은 셀(keep)들의 범위(셀 중심 ± 반 칸)를 min·max 에 넓혀 넣는다 */
function keptBounds(g: StructuredGrid, keep: Uint8Array, min: number[], max: number[]): void {
  const [nx, ny] = g.dims, nxy = nx * ny;
  for (let c = 0; c < keep.length; c++) {
    if (!keep[c]) continue;
    const k = Math.floor(c / nxy), rem = c - k * nxy, j = Math.floor(rem / nx), i = rem - j * nx;
    const ijk = [i, j, k];
    for (let a = 0; a < 3; a++) {
      const v = g.origin[a] + ijk[a] * g.spacing[a], h = g.spacing[a] / 2;
      if (v - h < min[a]) min[a] = v - h;
      if (v + h > max[a]) max[a] = v + h;
    }
  }
}

/** Isosurface 삼각형 가운데 keep(t) 인 것만 남긴다 */
function filterIsoTriangles(res: IsoResult, keep: (t: number) => boolean): IsoResult {
  const n = res.triangleCount, P = res.positions;
  const kept: number[] = [];
  for (let t = 0; t < n; t++) if (keep(t)) kept.push(t);
  if (kept.length === n) return res;
  const positions = new Float32Array(kept.length * 9), normals = new Float32Array(kept.length * 9);
  const values = res.values ? new Float32Array(kept.length * 3) : null;
  kept.forEach((t, k) => {
    positions.set(P.subarray(t * 9, t * 9 + 9), k * 9);
    normals.set(res.normals.subarray(t * 9, t * 9 + 9), k * 9);
    if (values && res.values) values.set(res.values.subarray(t * 3, t * 3 + 3), k * 3);
  });
  return { positions, normals, values, triangleCount: kept.length };
}

/** 유선마다 keep 을 통과하는 점끼리 이어진 조각만 남긴다 (점 2개 미만 조각은 버림) — 유선 아래의 Box 밖·Scalar Clip */
function splitLines(lines: Streamline[], keep: (x: number, y: number, z: number) => boolean): Streamline[] {
  const out: Streamline[] = [];
  for (const ln of lines) {
    const n = ln.points.length / 3;
    let start = -1;
    for (let i = 0; i <= n; i++) {
      const ok = i < n && keep(ln.points[i * 3], ln.points[i * 3 + 1], ln.points[i * 3 + 2]);
      if (ok && start < 0) start = i;
      if (!ok && start >= 0) {
        if (i - start >= 2) out.push({ points: ln.points.slice(start * 3, i * 3), speeds: ln.speeds.slice(start, i) });
        start = -1;
      }
    }
  }
  return out;
}

/** Streamline 에서 다시 계산 없이 바로 적용되는 항목(모양·굵기·투명도·선 종류) */
const STREAM_STYLE_KEYS = ['width', 'widthUnits', 'opacity', 'dash', 'shape', 'sides', 'ribbonDir', 'meshWidth'];
/** Slice 에서 다시 계산 없이 바로 적용되는 항목(Contour lines 색·굵기·불투명도, 면 불투명도) */
const SLICE_STYLE_KEYS = ['lineColor', 'lineWidth', 'lineOpacity', 'opacity'];
/** Streamline 시작면 표시를 갱신해야 하는 항목 */
const STREAM_SEED_KEYS = ['seedAxis', 'seedPos', 'seedBounds', 'nU', 'nV', 'vFrac', 'direction', 'fieldName'];
/** Glyph 에서 다시 고르지 않고 화살표 길이만 바꾸면 되는 항목 (VectorGlyphs.setLength) */
const GLYPH_STYLE_KEYS = ['scaleFactor', 'lengthMode'];
/** 노드 종류마다 그 Field 의 값 분포로 정하는 기본값 항목 (배열 값이 들어온 뒤로 미룰 수 있는 것 — AppCore.deferNewDefaults) */
const STAT_DEFAULT_KEYS: Partial<Record<LayerType, readonly string[]>> = { threshold: ['lower', 'upper'], clip: ['value'], iso: ['value'], glyph: ['scaleFactor'] };
/** Streamline 종료 속도: 벡터 크기가 이보다 작으면(정체점) 멈춘다. ParaView Stream Tracer 의 Terminal Speed 기본값(절대값, 명세 §4.5) */
const TERMINAL_SPEED = 1e-12;

export class AppCore {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  /** 지금 쓰는 카메라 (원근 또는 직교). 전환은 setDisplay({ projection }) */
  camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
  private readonly perspCamera: THREE.PerspectiveCamera;
  private readonly orthoCamera: THREE.OrthographicCamera;
  private orthoHeight = 100; // 직교 투영에서 zoom 1일 때 화면 세로에 들어오는 길이 (m)
  readonly controls: OrbitControls;
  readonly scenery = new Scenery();
  readonly planeGizmo = new PlaneGizmo();
  readonly objects = new ObjectStore(); // 편집 대상 형상 객체
  private objectsSig = '';       // 형상 배치 서명 — 바뀌면 형상 경계에 맞춘 Slice 를 다시 잘라 낸다
  private clipPending = false;
  private lastClipRebuild = 0;
  private lastSliceMs = 0;
  readonly editor: Editor;

  catalog: DatasetEntry[] = [];
  currentId: string | null = null;
  /** 지금 연 데이터의 이름 — 도구막대·장면 트리 맨 윗줄이 함께 쓴다. 예제는 목록 항목의 label, 서버 결과는 목록 줄 이름(없으면 결과 폴더 끝 이름),
   *  사용자 파일은 파일·폴더 이름. null = 아직 연 것이 없음 */
  currentLabel: string | null = null;
  /** 해상도 선택지(levelChoices)가 있는 목록 항목을 열었을 때 그 선택지 번호. 그 밖의 데이터는 null */
  currentChoice: number | null = null;
  levels: LevelData[] = [];          // 세밀한 것 → 거친 것
  private ml: MultiLevelResult | null = null;
  series: TimeSeries | null = null;  // 시간축 (결과 폴더를 열었을 때만)
  scan: ResultScan | null = null;
  stepIndex = 0;
  playing = false;
  playFps = 4;
  /** 반복 재생(ParaView Loop). 처음에 꺼짐 — 꺼져 있으면 마지막 장면에서 멈춘다 */
  loopPlay = false;
  private playTimer: number | null = null;
  private stepToken = 0;
  /**
   * 읽는 중인 저장 시점 (setStep 이 캐시에 없는 시점을 기다리는 동안). null = 없음. 3D 화면은 덮지 않는다 — 앞 장면이 그대로 보이고, 재생 막대가
   * 오래 걸릴 때만 시각 글 옆에 작은 진행 원을 띄운다(ui/timeBar.ts). 바뀌면 subscribeSteps 구독자에게 알린다(화면 전체 갱신 emit 은 하지 않는다)
   */
  stepLoad: StepLoad | null = null;
  /** stepLoad 를 세운 setStep 의 표(stepToken). 0 = 없음 */
  private stepLoadToken = 0;
  /** 저장 시점 읽기 상태(stepLoad · 읽어 둔 시점 목록) 구독자 — 배열 하나 읽을 때마다 오므로 화면 전체 갱신(listeners)과 따로 둔다 */
  private stepListeners: Listener[] = [];
  /**
   * 노드마다 값 밀대(Threshold Lower·Upper · Clip Scalar 기준값 · Isosurface 값)의 양 끝 (core/sliderRange.ts — 노드를 다시 골라도 같다).
   * 데이터를 새로 열면 비운다. 장면 JSON 에는 저장하지 않는다(들어올 때 만들기로 정함)
   */
  private readonly valueBounds = new ValueBounds({ known: (f, m) => this.knownRangeOf(f, m), now: (f, m) => this.nowRangeOf(f, m) });
  /**
   * 배열·성분마다 전 시점 범위 읽기 결과 (값 밀대 끝을 정할 때 알고 있는 범위에 합친다) · 성분으로 읽을 때 센 크기 최대(그 성분의 '모두 같음' 하한에만 —
   * noteMagMax). 데이터를 새로 열면 비운다
   */
  private readonly allTimeRanges = new RangeStore();
  /** 결과 폴더의 Field 목록 (첫 저장 헤더로 만든 것 — resultSet.ts fieldCatalogOf). null = 데이터셋의 배열로 만든다(CSV · 단일 VTU/VTI · 예제 VTM) */
  private headerCatalog: FieldOption[] | null = null;
  /** headerCatalog 의 key 모음 (core/usedArrays.ts 가 머리 정보에 없는 Field 를 거른다) */
  private catalogKeys: ReadonlySet<string> = new Set();
  /**
   * 지금 장면 값으로 끼워 둔 배열 이름 (시간축 — 쓰는 배열만 읽는다). 그 시점 파일에 없어 빠진 배열도 '끼움'으로 친다(다시 읽어도 없다 — TimeSeries.hasArrays).
   * null = 시간축이 없다(모든 배열이 들어 있다)
   */
  private installedArrays: Set<string> | null = null;
  /** 마지막으로 시간축에 알린 쓰는 배열의 서명 (syncUsedArrays) */
  private usedSig = '';
  /** 쓰는 배열을 더 읽는 일의 표 — 늦게 온 결과를 버린다 (fetchUsedArrays) */
  private arrayToken = 0;
  /** 진행 중인 '쓰는 배열 더 읽기' (stepTok = 시작할 때의 stepToken — 그 뒤 다른 장면을 골랐으면 끝난 것으로 본다). null = 없음 */
  private arrayFetch: { token: number; stepTok: number; want: string[] } | null = null;
  /** 마지막 읽기에 실패한 배열 (요약 줄 '<배열> 읽지 못함'). 끼우거나 다시 읽기 시작하면 뺀다 */
  private readonly arrayFailed = new Set<string>();
  /** 값을 기다리는 setStep 의 표(stepToken). 0 = 없음 — 그동안 늘어난 쓰는 배열은 setStep 이 끝날 때 함께 받는다 */
  private stepBusy = 0;
  /** 0 보다 크면 쓰는 배열 비교를 미룬다 (장면 JSON 을 읽는 동안 — 노드를 하나씩 넣을 때마다 읽기를 시작하지 않게) */
  private holdArrays = 0;
  /**
   * 배열이 오면 정할 노드의 통계 기본값 (노드 id → 기다리는 Field key · 그때의 값 서명 · 기본값). Field 를 고를 때(setValueField) · 메뉴로 만들 때(addLayer)
   * 그 배열을 아직 읽지 않았으면 넣는다. 배열이 오면 그 사이 값을 바꾸지 않았을 때만 적용한다(afterArrival)
   */
  private readonly pendingDefaults = new Map<string, { keys: string[]; sig: string; make: () => LayerPatch; params: readonly string[] }>();
  /** 장면 JSON 을 읽을 때 벡터 성분 배열이 아직 없어 '옛 모두 같음 범위' 판단을 미룬 지도 → 그 Field key (afterArrival 이 다시 본다) */
  private readonly legacyRecheck = new Map<ColorMap, string>();
  dataset: PointDataset | null = null; // 렌더링·통계용 합친 점
  hasGrid = false;
  info: DatasetInfo = { note: '', units: {}, descriptions: {} };
  lastLoad: { skippedRows: number; droppedColumns: string[] } = { skippedRows: 0, droppedColumns: [] };
  /** 데이터를 여는 동안의 진행 글 (읽기 덮개 · '데이터 열기' 창의 회색 진행 글 · 데이터가 없을 때 상태 줄). 빈 글 = 여는 중 아님. 저장 시점 읽기는 넣지 않는다(stepLoad) */
  loading = '';
  timings: Record<string, number> = {};

  /** 데이터셋마다 하나인 Points 공유 속성 (position · pointRadius). 볼륨 노드들의 Points 표현이 같은 BufferAttribute 를 붙인다 */
  pointAttrs: PointAttrs | null = null;
  /** 배열(fieldKey)마다 공유 색 지도 (ParaView: 색 전달함수는 배열 이름에 묶인다) */
  colorMaps = new Map<string, ColorMap>();
  /** 입력이 단색일 때 새 노드가 칠할 배열 (데이터의 첫 배열 — installLevels) */
  defaultFieldKey: string | null = null;
  /** 장면을 읽는 동안: version 5 이하 노드의 'Color 따름' 이 칠하던 배열 (그 장면의 공통 Color) */
  private legacyField: string | null = null;
  display: DisplayState = { buildingsVisible: true, buildingOpacity: 1, gridVisible: true, legendSize: 'sm', planeFrame: true, projection: 'perspective', upAxis: DEFAULT_UP };
  /** 카메라·조작기·장면 요소에 마지막으로 적용한 위쪽 (applyUp) */
  private appliedUp: UpAxis = DEFAULT_UP;

  /** 데이터(원본) 노드의 보이기·표현 방식. 기본 Outline (ParaView: 구조 격자류는 Outline 이 기본) */
  root: RootNode = { visible: true, view: defaultDataView('outline') };
  /** 후처리 노드 (평면 배열이지만 트리 순서: 상위 다음에 그 자손이 이어진다. parentId 로 중첩) */
  layers: Layer[] = [];
  selectedLayerId: string | null = null;

  /** 보이는 볼륨 노드가 Points 표현으로 그린 점 수의 합 */
  visibleCount = 0;
  fps = 0;

  private readonly runtime = new Map<string, LayerRuntime>();
  /** 다시 계산 차례 번호: rebuildDirtyLayers 한 번, 또는 Rescale·Component 가 바로 부르는 계산 한 묶음마다 하나 올린다 (colorForRebuild 의 '같은 차례') */
  private passId = 0;
  /** 색 지도마다 잠깐의 상태 (flat · settledPass · componentStep · note — MapRuntime) */
  private readonly mapRuntime = new WeakMap<ColorMap, MapRuntime>();
  /** 진행 중인 전 시점 범위 읽기 (한 번에 하나). null = 없음 */
  private rangeScan: RangeScanJob | null = null;
  private listeners: Listener[] = [];
  private container: HTMLElement;
  private frameCount = 0;
  private fpsTime = performance.now();
  private countDirty = false;
  private gridCache = new Map<string, Float32Array>();
  private valuesCache = new Map<string, Float32Array>(); // 점 단위 Field 값 (valuesOf). 데이터셋·저장 시점이 바뀌면 비운다
  private lastW = 0;
  private lastH = 0;
  private lastFitDirection: 'iso' | 'top' | 'front' | 'side' = 'iso';
  private lastFitTarget: FitTarget = 'data';
  private viewInset = 0; // 왼쪽 패널이 덮는 너비(px)
  /** GPU 의 3D 텍스처 한 변 한계 (MAX_3D_TEXTURE_SIZE). 0 = 아직 읽지 않음 — volumeLimits 가 처음 Volume 을 그릴 때 한 번 읽는다 */
  private max3DTextureSize = 0;
  /** 콘솔 확인용 덮어쓰기 (debugVolumeTextureLimit): 한 변 한계·노드 텍스처 칸 수 한계. null = 덮어쓰지 않음 */
  private volumeLimitOverride: { size: number | null; texels: number | null } = { size: null, texels: null };
  /** 장면 깊이 선행 패스의 그림판 (그리기 버퍼 크기, MSAA 없음, DepthTexture). 보이는 Volume 이 있을 때만 있다 — renderScene */
  private depthTarget: THREE.WebGLRenderTarget | null = null;
  private readonly bufferSize = new THREE.Vector2();
  private lastView: DatasetView = {}; // 새 레이어의 기본값(기본 평면·시작면)에 쓴다

  constructor(container: HTMLElement) {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, stencil: true, powerPreference: 'high-performance' }); // stencil: 반투명 유선을 픽셀마다 한 번만 섞는 데 쓴다
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x2b3441, 1);
    this.renderer.localClippingEnabled = true;
    container.appendChild(this.renderer.domElement);

    this.perspCamera = new THREE.PerspectiveCamera(45, 1, 0.01, 100000);
    this.perspCamera.up.set(0, 0, 1); // 처음은 z-up (CFD 관례). 위쪽을 바꾸면 applyUp 이 두 카메라·조작기를 함께 맞춘다
    this.perspCamera.position.set(-150, -200, 160);
    this.orthoCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1000, 1000);
    this.orthoCamera.up.set(0, 0, 1);
    this.camera = this.perspCamera;

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;

    this.objects.subscribe(() => { // 장면을 먼저 맞추고
      this.scenery.setObjects(this.objects.list, this.objects.selection);
      const sig = this.objectsSignature();
      if (sig !== this.objectsSig) { this.objectsSig = sig; this.clipPending = true; } // 고르기만 한 것은 단면과 무관
      this.emit();
    });
    this.editor = new Editor(this.objects, this.scenery, this.camera, this.renderer.domElement, this.controls, this.scene); // 그 다음 편집기가 핸들을 붙인다

    this.scene.add(this.scenery.group, this.planeGizmo.group);

    window.addEventListener('resize', () => this.resize());
    this.resize();
    this.renderer.setAnimationLoop(() => this.frame());
  }

  // ---- 구독 ----
  subscribe(cb: Listener): void { this.listeners.push(cb); }
  /** 화면에 알린다. 그 전에 쓰는 배열이 바뀌었는지 본다(syncUsedArrays — 바뀌었으면 빠진 배열 읽기를 시작해 화면이 '읽는 중'을 바로 보이게) */
  private emit(): void {
    this.syncUsedArrays();
    for (const cb of this.listeners) cb();
  }
  private setLoading(msg: string): void { this.loading = msg; this.emit(); }
  /** 저장 시점 읽기 상태(stepLoad · 읽어 둔 시점 목록 cachedStepIndices)가 바뀔 때 부를 함수 (재생 막대). 화면 전체 갱신(subscribe)과 따로 온다 */
  subscribeSteps(cb: Listener): void { this.stepListeners.push(cb); }
  private emitSteps(): void { for (const cb of this.stepListeners) cb(); }
  /** 시점 읽기 표시를 내린다 (기다리던 setStep 이 끝남 · 캐시에 있는 시점으로 옮김 · 데이터 열기) */
  private clearStepLoad(): void {
    this.stepLoadToken = 0;
    if (!this.stepLoad) return;
    this.stepLoad = null;
    this.emitSteps();
  }
  /** 지금 시간축의 시점 읽기 진행 (TimeSeries onStepProgress) — 기다리는 그 시점이면 stepLoad 에 옮겨 적는다 */
  private onStepProgress(series: TimeSeries, n: number, done: number, total: number): void {
    const s = this.stepLoad;
    if (this.series !== series || !s || s.n !== n) return;
    s.done = done; s.total = total;
    this.emitSteps();
  }
  /**
   * 데이터 열기를 시작한다: 재생을 멈추고 읽는 중인 저장 시점을 버린 뒤(그 진행 원도 내림) 읽기 덮개를 띄운다. 덮개는 열기가 끝날 때까지 이어진다
   * (저장 시점 읽기는 덮개를 쓰지 않는다 — stepLoad) — '불러오는 중'(데이터 화면 목록의 [열기] 막힘)이 재생 중에 다른 데이터를 열어도 중간에 풀리지 않게
   */
  private beginOpen(msg: string): void {
    this.stopPlayback();
    // 옛 데이터의 전 시점 범위 읽기가 새로 여는 일과 연결을 나눠 쓰지 않게 멈춘다. 그 지도의 안내 줄에 남겨 두면, 열기가 실패해 옛 데이터가 그대로일 때
    // 진행 줄만 말없이 사라지지 않는다(열기가 되면 지도가 바뀌어 보이지 않는다)
    this.cancelRangeScan('open');
    this.stepToken++;
    this.clearStepLoad();
    this.setLoading(msg);
  }
  /** 바깥에서 데이터를 여는 동안(서버 결과 폴더 찾기 · ZIP 풀기) 진행 상황을 읽기 덮개에 띄운다(데이터 열기 시작과 같음). 빈 글이면 덮개를 내린다 */
  reportProgress(msg: string): void { if (msg) this.beginOpen(msg); else this.setLoading(''); }
  /**
   * 데이터를 여는 중인가 — 읽기 덮개(loading)는 데이터 열기(beginOpen · reportProgress)만 쓴다. 저장 시점 읽기(재생 · 슬라이더 — setStep)는 넣지 않는다(stepLoad):
   * 새로 여는 일은 beginOpen 이 앞의 저장 시점 읽기를 버리므로 막을 까닭이 없다. 후처리 '데이터 열기' 창의 닫힘 · 여는 단추 막힘 · 놓기 거절이 이것을 본다
   */
  get opening(): boolean { return !!this.loading; }
  /** 데이터 화면의 안내 글에 한 줄 덧붙인다 */
  notify(msg: string): void { this.info = { ...this.info, note: [this.info.note, msg].filter(Boolean).join(' ') }; this.emit(); }

  // ---- 데이터 목록 / 불러오기 ----
  async loadCatalog(): Promise<DatasetEntry[]> {
    const res = await fetch('datasets.json'); // 페이지 기준 상대 주소 (하위 경로 배포)
    // 못 받으면(404 등) 빈 목록이 아니라 예외 — 주소의 ?data= 가 '예제에 없는 항목'이 아니라 '목록을 읽지 못함'으로 알리게(post/main.ts)
    if (!res.ok) throw new Error(`예제 목록을 읽지 못했습니다 (HTTP ${res.status}).`);
    const list = ((await res.json()).datasets ?? []) as DatasetEntry[];
    // 개발 서버 전용 주소(/__data·/__list — vite.config.ts)를 쓰는 항목은 빌드한 페이지에서는 열리지 않으므로 목록에서 뺀다
    this.catalog = import.meta.env.DEV ? list : list.filter((e) => !JSON.stringify(e).includes('"/__'));
    this.emit();
    return this.catalog;
  }

  /** 목록(datasets.json) 항목 하나를 연다. 해상도 선택지가 있으면 choiceIndex(없으면 defaultChoice, 그것도 없으면 0)로 */
  async loadEntry(entry: DatasetEntry, choiceIndex?: number): Promise<void> {
    if (entry.kind === 'result') {
      if (!entry.folder) throw new Error(`예제 항목 ${entry.id}에 folder가 없습니다.`);
      await this.loadResultFolder(new HttpFolder(entry.folder, entry.list), { id: entry.id, view: entry.view, note: entry.note, label: entry.label });
      return;
    }
    const choiceAt = entry.levelChoices?.length ? (choiceIndex ?? entry.defaultChoice ?? 0) : null;
    const t0 = performance.now();
    this.beginOpen(`${entry.label} 불러오는 중`);
    try {
      const info: DatasetInfo = { note: entry.note ?? '', units: { ...(entry.units ?? {}) }, descriptions: {} };
      let datasets: PointDataset[];
      if (entry.kind === 'csv') {
        if (entry.meta) {
          try {
            const meta = await fetch(entry.meta).then((r) => (r.ok ? r.json() : null));
            if (meta?.columns) {
              info.note = meta.note ?? info.note;
              for (const [k, v] of Object.entries(meta.columns as Record<string, { unit?: string; desc?: string }>)) {
                if (v.unit) info.units[k] = v.unit;
                if (v.desc) info.descriptions[k] = v.desc;
              }
              if (meta.columns.u?.unit) info.units.velocity = meta.columns.u.unit;
            }
          } catch { /* 메타는 선택 사항 */ }
        }
        const res = await fetch(entry.csv!);
        if (!res.ok) throw new Error(`CSV 파일을 가져오지 못했습니다 (HTTP ${res.status})`);
        const parsed = parseCsv(await res.text(), entry.csv!.split('/').pop() ?? 'data.csv');
        this.lastLoad = { skippedRows: parsed.skippedRows, droppedColumns: parsed.droppedColumns };
        datasets = [parsed.dataset];
      } else {
        const choice = choiceAt === null ? undefined : entry.levelChoices?.[choiceAt];
        const blocks = await readVtmDatasets(entry.vtm!);
        const want = new Set(choice?.levels ?? entry.defaultLevels ?? blocks.map((b) => b.index));
        const chosen = blocks.filter((b) => want.has(b.index));
        const extras = (choice?.extra ?? []).map((i) => entry.extraBlocks?.[i]).filter((x): x is ExtraBlock => !!x);
        if (chosen.length + extras.length === 0) throw new Error('선택한 레벨이 VTM 파일에 없습니다.');
        const opts = { arrays: entry.arrays ?? [], solidArray: entry.solidArray, onProgress: (m: string) => this.setLoading(m) };
        datasets = await Promise.all([
          ...chosen.map((b) => loadVtuAsCellPoints(b.url, b.name, opts)),
          ...extras.map((x) => loadVtiAsCellPoints(x.url, x.name, opts)),
        ]);
        this.lastLoad = { skippedRows: 0, droppedColumns: [] };
      }
      this.setLoading('격자 복원 및 레벨 병합 중');
      await new Promise((r) => setTimeout(r, 0)); // 상태 표시가 그려질 틈
      const shapes = entry.stl ? await Promise.all(entry.stl.map((u) => fetchStl(u, entry.stlAxes, entry.stlOffset))) : [];
      let footprints: Footprint[] | undefined;
      if (entry.objects) {
        try { footprints = await fetch(entry.objects).then((r) => (r.ok ? r.json() : undefined)); } catch { /* 이름 붙이기는 선택 사항 */ }
      }
      this.useUp(DEFAULT_UP); // CSV·VTM 예제는 입력 JSON 이 없다 → +Z (격자·시점보다 먼저)
      this.installLevels(datasets, info, entry.view ?? {}, entry.id, entry.label, choiceAt);
      this.objects.replaceAll(shapes.length ? objectsFromGeometries(shapes, footprints) : []);
      this.fitView('iso', entry.view?.fit ?? 'data');
      this.timings.load = performance.now() - t0;
    } finally {
      this.setLoading('');
    }
  }

  /**
   * 사용자가 고른 CSV 파일. 형상은 비운다 — 다른 여는 길(예제 · 결과 폴더 · 서버 결과)처럼 새 데이터를 열면 형상도 새 데이터의 것으로 바뀌고, CSV 에는 형상이 없다
   * ('데이터 열기' 창의 레이어 경고 '… 더한 형상이 지워집니다'가 CSV 에서도 맞게 — 2026-11-05 전에는 옛 형상이 남았다).
   * 셀이 없어 못 열면 아무것도 바꾸기 전에(View Up · 시간축 · 재생 · 데이터 · 형상) installLevels 와 같은 글로 거절한다 — 옛 데이터는 그대로.
   * 같이 놓은 STL 은 CSV 를 연 뒤에 더한다(post/dropOpen.ts).
   */
  loadCsvText(text: string, name: string, info?: DatasetInfo): void {
    const parsed = parseCsv(text, name);
    if (!(parsed.dataset.count > 0)) throw new Error('읽을 수 있는 셀이 없습니다.'); // useUp · installLevels 앞부분(시간축 비움)이 돌기 전에
    this.lastLoad = { skippedRows: parsed.skippedRows, droppedColumns: parsed.droppedColumns };
    this.useUp(DEFAULT_UP); // 입력 JSON 이 없다 → +Z
    this.installLevels([parsed.dataset], info ?? { note: '', units: {}, descriptions: {} }, {}, null, name);
    this.objects.replaceAll([]);
    this.fitView('iso', 'data');
  }

  /**
   * STL 하나를 형상으로 기존 형상에 더한다(후처리 형상 편집의 [STL 추가] · 3D 화면에 놓기). 서로 붙지 않은 덩어리는 따로(splitComponents).
   * 이름은 파일 이름 줄기, 이미 있는 이름과 겹치면 번호(stlPieceNames). 삼각형이 없거나 좌표가 유한하지 않으면 더하지 않고 STL_PARSE_ERROR(requireTriangles).
   */
  loadStlBuffer(buffer: ArrayBuffer, fileName = ''): void {
    const g = parseStl(buffer);
    requireTriangles(g);
    const objs = objectsFromGeometries([g]);
    const names = stlPieceNames(fileName, objs.length, this.objects.list.map((o) => o.name));
    objs.forEach((o, i) => { o.name = names[i]; });
    this.objects.append(objs);
    this.emit();
  }

  /**
   * STL 하나를 형상 객체 하나로 더하고 돌려준다 (전처리 페이지의 영역 STL).
   * scale·translate는 해석기 입력의 영역 키와 같은 뜻: 꼭짓점에 배율을 곱한 뒤 평행이동. 조각으로 나누지 않는다.
   */
  addStlObject(buffer: ArrayBuffer, name: string, scale: [number, number, number] = [1, 1, 1], translate: [number, number, number] = [0, 0, 0]): SceneObject {
    const g = parseStl(buffer);
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3().fromArray(translate), new THREE.Quaternion(), new THREE.Vector3().fromArray(scale)));
    g.computeBoundingBox(); g.computeVertexNormals();
    const o = objectFromWholeGeometry(g, name);
    this.objects.append([o]);
    this.emit();
    return o;
  }

  // ---- 계산 영역 상자 (전처리) ----
  domain: Bounds | null = null;
  /** 해석기 입력의 base_region(계산 영역)을 테두리 상자로 보여 준다. 데이터가 없으면 지면 격자도 이 영역에 맞춘다 */
  setDomainBox(bounds: Bounds | null): void {
    this.domain = bounds ? { min: [bounds.min[0], bounds.min[1], bounds.min[2]], max: [bounds.max[0], bounds.max[1], bounds.max[2]] } : null;
    this.scenery.setDomainBox(this.domain);
    if (this.domain && !this.dataset) this.scenery.fitTo(this.domain);
    this.emit();
  }

  /**
   * 읽은 데이터를 앱에 앉힌다. id = 연 데이터 아이디(목록 항목 · 'server:<번호>' · 'result:<이름>' · 사용자 CSV 는 null), label = 이름(currentLabel), choice = 해상도 선택지 번호,
   * catalog = 결과 폴더의 Field 목록(첫 저장 헤더 — 값은 기본 Field 만 읽었다). 없으면(CSV · 단일 VTU/VTI) 데이터셋의 배열로 목록을 만든다
   */
  private installLevels(datasets: PointDataset[], info: DatasetInfo, view: DatasetView, id: string | null, label: string | null, choice: number | null = null, catalog: FieldOption[] | null = null): void {
    const t0 = performance.now();
    this.stopPlayback();
    this.cancelRangeScan('open'); // CSV 열기는 beginOpen 을 거치지 않는다 (아래에서 셀이 없어 실패하면 옛 데이터의 안내 줄에 남는다)
    this.stepToken++; // 앞 데이터의 setStep 이 읽는 중이었으면 끝난 뒤 새 데이터에 앞 데이터의 값을 끼워 넣지 않게
    this.clearStepLoad();
    // 앞 데이터의 시간축을 닫는다: 미리 읽기가 뒤에서 계속 내려받지 않게, Worker 에 보내 둔 위상 사본도 바로 지운다(TimeSeries.dispose — 검토 반영 2026-11-06)
    this.series?.dispose();
    this.series = null; this.scan = null; this.stepIndex = 0;
    // 쓰는 배열 읽기도 앞 데이터의 것은 버린다(시간축을 다시 붙이는 loadResultFolder 가 끼운 배열을 새로 적는다)
    this.installedArrays = null; this.usedSig = ''; this.arrayToken++; this.arrayFetch = null; this.arrayFailed.clear(); this.stepBusy = 0;
    this.pendingDefaults.clear(); this.legacyRecheck.clear();
    // 헤더 Field 목록도 시간축과 함께 비운다 — 아래에서 열기가 예외로 끝나 옛 데이터가 남으면 목록은 그 데이터셋에 실제로 든 배열로 돌아간다
    // (남겨 두면 다시는 읽을 수 없는 Field 가 목록에 남아, 고르는 즉시 0~1 기본값이 들어가고 거르지 않는 그림이 나왔다 — 검토 반영 2026-11-06)
    this.headerCatalog = null; this.catalogKeys = new Set();
    const nonEmpty = datasets.filter((d) => d.count > 0); // 셀 0개인 빈 블록은 뺀다
    if (!nonEmpty.length) throw new Error('읽을 수 있는 셀이 없습니다.');
    const ml = buildMultiLevel(nonEmpty);
    // 값 밀대 끝 · 전 시점 범위 결과는 데이터마다. 격자를 만든 뒤에 비운다 — 셀이 없거나 격자 만들기가 예외로 끝나면 옛 노드와 함께 옛 끝을 남긴다
    // (먼저 비우면 옛 노드의 끝이 다음 그리기에서 지금 장면 범위로 새로 정해졌다 — 검토 반영 2026-11-05)
    this.valueBounds.clear(); this.allTimeRanges.clear();
    this.ml = ml;
    this.timings.grid = performance.now() - t0;
    this.levels = ml.levels;
    this.dataset = ml.combined;
    this.info = info;
    this.currentId = id;
    this.currentLabel = label;
    this.currentChoice = choice;
    this.lastView = view;
    this.headerCatalog = catalog ? catalog.map((o) => ({ ...o })) : null;
    this.catalogKeys = new Set(catalog?.map((o) => o.key) ?? []);
    this.gridCache.clear();
    this.valuesCache.clear();
    this.hasGrid = this.levels.some((l) => l.grid);

    // 옛 노드를 먼저 지운다 — 마지막 볼륨 노드(root)의 Points 가 옛 공유 속성의 GPU 버퍼를 놓는다 (PointRenderer.dispose 'free')
    this.clearLayers();
    this.disposeRuntime(ROOT_ID);
    this.pointAttrs = makePointAttrs(this.dataset);
    this.scenery.fitTo(this.dataset.bounds);

    const b = this.dataset.bounds;
    const spacing = this.finestSpacing();
    const axis = (view.sliceAxis ?? 2) as Axis;
    const position = resolvePlanePosition(b, axis, view.slicePosition ?? 'min');

    // 처음 칠할 배열: 목록(view.colorField) → 첫 벡터 → 첫 스칼라. 결과 폴더는 같은 규칙으로 init 전에 정해 그 배열만 읽었다(loadResultFolder)
    const first = defaultFieldOf(this.fieldOptions(), view.colorField);
    this.colorMaps.clear();
    this.defaultFieldKey = first;
    if (first) this.colorMapOf(first);

    // 기본 장면: 데이터는 Outline(ParaView 기본) + Slice 1 (도시는 지면층, 몸체는 대칭면). 전체를 면이나 점으로 그리면 상자처럼 막혀 형상이 안 보인다.
    this.root = { visible: true, view: defaultDataView('outline', first) };
    this.createRootRuntime();
    if (this.hasGrid) {
      this.insertLayer('slice', { axis, position }, null);
    } else {
      // 격자를 못 만들면 면 Slice 가 없으니 Clip 1(기본 평면 주위 얇은 구간)을 Points 로
      const clip = this.insertLayer('clip', bandClip(axis, position, spacing * 1.2, this.cellBounds(), this.defaultParams('clip') as ClipParams), null);
      if (clip.type === 'clip') clip.view.representation = 'points';
    }
    this.selectedLayerId = null;
    this.applyDisplay();
    this.markAllLayers();
    this.countDirty = true;
    this.emit();
  }

  // ---- 결과 폴더 (시간축) ----
  /**
   * 사용자가 고른 결과 폴더(또는 결과 ZIP을 푼 작업 폴더)를 연다. 저장 시점이 여러 개면 시간축이 생긴다.
   * opts는 데이터 목록(datasets.json)의 result 항목·서버 결과가 넘기는 표시 정보(아이디·시점·안내 글·이름).
   * 이름(label)이 없으면 결과 폴더의 끝 이름(고른 폴더가 곧 결과 폴더면 그 폴더 이름)을 쓴다.
   */
  async loadResultFolder(root: FolderSource, opts: { id?: string; view?: DatasetView; note?: string; label?: string } = {}): Promise<void> {
    const t0 = performance.now();
    this.beginOpen(`${root.name} 읽는 중`);
    let fresh: TimeSeries | null = null; // 만들었지만 아직 앱에 붙이지 않은 시간축 — 열기가 실패하면 닫는다(Worker 에 보낸 위상 사본도 지움)
    try {
      const scan = await scanResultFolder(root);
      // Field 목록은 첫 저장 헤더로 만들고(값을 읽지 않음) 처음에는 기본 Field 하나만 읽는다 — installLevels 와 같은 규칙으로 init 전에 정한다.
      // 다른 배열은 노드가 쓰기 시작할 때 읽는다(syncUsedArrays)
      const catalog: FieldOption[] = fieldCatalogOf(scan.blocks);
      const first = defaultFieldOf(catalog, opts.view?.colorField);
      // 진행 글: 첫 저장 시점(위상 + 값)을 읽는 동안만 읽기 덮개에. 그 뒤 저장 시점 읽기 · 미리 읽기는 재생 막대의 진행 원(stepLoad)과 '읽어 둔 장면' 띠로
      let initializing = true;
      const series: TimeSeries = new TimeSeries(scan, {
        arrays: first ? [arrayNameOf(first)] : [], solidArray: solidArrayOf(scan.blocks),
        onProgress: (m) => { if (initializing && this.loading) this.setLoading(m); },
        onStepProgress: (n, done, total) => this.onStepProgress(series, n, done, total),
        onCacheChange: () => { if (this.series === series) this.emitSteps(); },
      });
      fresh = series;
      const datasets = (await series.init().finally(() => { initializing = false; })).filter((d) => d.count > 0);
      if (!datasets.length) throw new Error('읽을 수 있는 셀이 없습니다.');
      const shapes = await this.shapesFromInput(scan);
      const info: DatasetInfo = { note: [opts.note, ...scan.notes].filter(Boolean).join(' '), units: {}, descriptions: {} };
      const label = opts.label ?? (scan.folderPath ? baseName(scan.folderPath) : root.name);
      // 위쪽: 입력 JSON 의 중력 반대 방향, 중력이 없으면 Z 한 층(2D)은 +Y · 나머지 +Z (upFromInput). 격자·시점을 만들기 전에 정한다
      const gravity = (scan.input?.doc as { config?: { source_terms?: { gravity?: unknown } } } | undefined)?.config?.source_terms?.gravity;
      this.useUp(upFromInput(gravity, !!scan.input && zSingleLayer(datasets)));
      this.installLevels(datasets, info, { fit: 'data', ...(opts.view ?? {}) }, opts.id ?? `result:${resultName(scan)}`, label, null, catalog);
      this.series = series; this.scan = scan; this.stepIndex = 0;
      fresh = null;
      this.installedArrays = new Set(series.arrays); this.usedSig = ''; // 다음 emit 이 쓰는 배열을 처음 맞춘다(기본 장면이면 더 읽을 것이 없다)
      this.objects.replaceAll(shapes);
      // 보이는 형상이 데이터 영역의 절반 넘게 덮으면(용기 벽 등) 안이 보이게 반투명으로
      if (this.dataset && shapes.some((o) => o.visible && coversBounds(o, this.dataset!.bounds))) this.setDisplay({ buildingOpacity: 0.35 });
      else if (this.display.buildingOpacity < 1) this.setDisplay({ buildingOpacity: 1 });
      this.fitView('iso', 'data');
      this.timings.load = performance.now() - t0;
      if (scan.steps.length > 1) series.prefetch(scan.steps[1].n);
      this.emit();
    } finally {
      fresh?.dispose();
      this.setLoading('');
    }
  }

  /**
   * 입력 JSON의 STL 영역을 형상으로 (표시용). scale·translate만 적용하고 origin은 0으로 본다.
   * 고체(fixed·cht)만 처음부터 보이고, 부피 표시용 영역(region_ref·free_surface·subdivision_ref: 초기 유체·세분화 영역)은 숨긴 채 더한다 — 장면 트리에서 켤 수 있다.
   */
  private async shapesFromInput(scan: ResultScan): Promise<SceneObject[]> {
    const cfg = (scan.input?.doc as { config?: Record<string, unknown> } | undefined)?.config;
    if (!cfg) return [];
    const segs: { name: string; mesh: string; scale: number[]; translate: number[]; type: string }[] = [];
    const collect = (gen: unknown) => {
      for (const g of Array.isArray(gen) ? gen : []) {
        const rs = (g as { regional_segment?: unknown[] }).regional_segment;
        for (const r of Array.isArray(rs) ? rs : []) {
          const o = r as { name?: string; mesh_path?: string; scale?: number[]; translate?: number[]; region_type?: string };
          if (o.mesh_path) segs.push({ name: o.name ?? o.mesh_path, mesh: o.mesh_path, scale: o.scale?.length === 3 ? o.scale : [1, 1, 1], translate: o.translate?.length === 3 ? o.translate : [0, 0, 0], type: o.region_type ?? '' });
        }
      }
    };
    collect(cfg.lattice_generation); collect(cfg.particle_generation);
    const out: SceneObject[] = [];
    for (const seg of segs) {
      try {
        const src = await scan.job.file(seg.mesh);
        if (!src) continue;
        const g = parseStl(await src.read(0, (await src.size()) - 1));
        g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3().fromArray(seg.translate), new THREE.Quaternion(), new THREE.Vector3().fromArray(seg.scale)));
        g.computeBoundingBox(); g.computeVertexNormals();
        const o = objectFromWholeGeometry(g, seg.name);
        o.translucent = VOLUME_REGION_TYPES.has(seg.type);
        o.visible = !o.translucent; // 부피 영역은 숨긴 채 더한다 (장면 트리에서 켜면 반투명으로 보인다)
        out.push(o);
      } catch { /* 형상은 선택 사항 */ }
    }
    return out;
  }

  stepCount(): number { return this.scan?.steps.length ?? 0; }
  stepLabelAt(i: number): string { return this.scan && this.scan.steps[i] ? stepLabel(this.scan, this.scan.steps[i]) : ''; }
  /** 읽어 둔(캐시에 있는) 저장 시점의 자리(scan.steps 번호, 순서 없음) — 재생 막대의 '읽어 둔 장면' 띠. 시간축이 없으면 빈 목록 */
  cachedStepIndices(): number[] {
    if (!this.series || !this.scan) return [];
    const cached = new Set(this.series.cachedSteps());
    const out: number[] = [];
    this.scan.steps.forEach((s, i) => { if (cached.has(s.n)) out.push(i); });
    return out;
  }

  /**
   * i번째 저장 시점으로. 값만 갈아 끼우고 레이어·Clip·Threshold·색 범위는 그대로 둔다.
   * 캐시에 없으면 다 읽을 때까지 앞 장면이 그대로 보이고, '시점 읽기' 상태(stepLoad)만 세운다 — 3D 화면은 덮지 않는다(2026-11-05 사용자: 재생 중 덮개가
   * 번쩍임). 앞서 기다리던 시점이 있으면 기다린 시각은 이어 센다(밀대를 끌며 읽지 않은 시점을 여럿 지나도 기다림이 모여 길어지면 진행 원이 보이게).
   * 캐시에 있으면 기다릴 것이 없으므로 앞 표시를 내린다. 표시는 마지막에 세운 setStep 이 끝날 때 내린다.
   * 읽기에 실패하면(그 사이 다른 시점을 고르지 않았을 때) 재생을 멈추고 데이터 화면의 안내 글에 알린다 — 예외를 밖으로 내지 않는다(재생 반복이
   * 다음 타이머를 걸지 못한 채 '재생 중'으로 멈추던 것, 2026-11-05 검토).
   * 값은 '지금 쓰는 배열'(core/usedArrays.ts)이 그 시점에 모두 갖춰진 뒤에만 갈아 끼운다 — 일부만 끼우면 refillGridFields 가 빠진 배열을 격자에서 지워 노드가
   * 깜빡인다. 기다리는 사이 쓰는 배열이 늘었으면(Field 를 바꿈 · 노드를 더함) 늘어난 배열까지 받은 뒤 끼운다. 캐시 판정('읽어 둔 장면')도 쓰는 배열 기준이다
   */
  async setStep(i: number): Promise<void> {
    if (!this.series || !this.scan || !this.ml) return;
    const series = this.series, scan = this.scan;
    const n = Math.max(0, Math.min(this.scan.steps.length - 1, Math.round(i)));
    const token = ++this.stepToken;
    const step = this.scan.steps[n];
    let want = [...series.arrays];
    const cached = series.hasArrays(step.n, want);
    const pending = series.step(step.n, want); // 읽기를 시작하거나(미리 읽기 중이면 그것을) 기다린다 — 진행은 그 뒤 바로 있다(loadProgress)
    this.stepBusy = token; // 그동안 늘어난 쓰는 배열은 이 setStep 이 받는다(ensureUsedArrays 가 따로 읽지 않음)
    if (!cached) {
      const p = series.loadProgress(step.n);
      this.stepLoad = { n: step.n, label: stepLabel(this.scan, step), done: p?.done ?? 0, total: p?.total ?? 0, startedAt: this.stepLoad?.startedAt ?? performance.now() };
      this.stepLoadToken = token;
      this.emitSteps();
    } else this.clearStepLoad();
    try {
      let datasets = await pending;
      // 기다리는 사이 쓰는 배열이 늘었으면 빠진 것을 더 받는다 (늘기 전 목록으로 끼우면 새 배열이 격자에서 다시 빠진다)
      while (token === this.stepToken && series.arrays.some((a) => !want.includes(a))) {
        want = [...series.arrays];
        datasets = await series.step(step.n, want);
      }
      if (token !== this.stepToken) return; // 그 사이 다른 시점을 골랐다
      const arrived = this.installValues(datasets.filter((d) => d.count > 0), want);
      this.stepIndex = n;
      // 이 장면에서 처음 들어온 쓰는 배열: 미뤄 둔 기본값 · 미정인 밀대 끝 (Field 를 바꾸는 중에 장면을 넘긴 경우)
      this.afterArrival(arrived);
      // 값 밀대 끝은 그대로 — 다만 아직 미정인 끝(앞 장면의 값이 모두 같았음)은 이 장면 값이 서로 다르면 이때 한 번 정한다(sliderRange.ts settle)
      this.valueBounds.settle(this.valueSliderNodes());
      // 정해진 색 지도는 그대로 (ParaView 'Grow and update on Apply' 는 저장 시점 변경에 반응하지 않는다 — 같은 색 = 어느 시점에서나 같은 값).
      // 아직 정하지 않은 지도(앞 장면의 값이 모두 같았음)는 다시 계산하면서 값이 서로 다르면 이때 한 번 정한다(colorForRebuild)
      this.markAllLayers();
      this.dropStaleFlats();
      this.countDirty = true;
      this.prefetchFrom(n);
    } catch (e) {
      if (token === this.stepToken) { // 그 사이 다른 시점을 골랐거나 다른 데이터를 열었으면 알리지 않는다
        const wasPlaying = this.playing;
        this.stopPlayback();
        this.notify(`저장 시점을 읽지 못했습니다${wasPlaying ? '(재생을 멈춤)' : ''}: ${stepLabel(scan, step)} · ${e instanceof Error ? e.message : String(e)}`);
      }
    } finally {
      if (this.stepLoadToken === token) this.clearStepLoad();
      if (this.stepBusy === token) { this.stepBusy = 0; this.ensureUsedArrays(); } // 끼우지 못했으면(실패) 지금 장면에 빠진 쓰는 배열을 따로 읽는다
      this.emit();
    }
  }

  /** idx 장면 다음으로 볼 장면들을 미리 읽게 한다: 재생 중에는 앞으로 볼 장면들을 캐시 예산 안에서 차례로(망이 잠깐 멈춰도 읽어 둔 장면으로 이어 가게), 멈춰 있으면 다음 장면 하나만 */
  private prefetchFrom(idx: number): void {
    const series = this.series, scan = this.scan;
    if (!series || !scan) return;
    const ahead = aheadSteps(idx, scan.steps.length, this.loopPlay, this.playing ? PREFETCH_AHEAD_MAX : 1);
    series.prefetchAhead(ahead.map((i) => scan.steps[i].n));
  }

  // ---- 쓰는 배열 (시간축: 저장 시점마다 칠하거나 거르는 데 쓰는 배열만 읽는다 — core/usedArrays.ts) ----
  /** usedArrays · nodeArrays 에 넘기는 지금 노드 트리 */
  private usedInput(): UsedArraysInput {
    return { root: this.root, layers: this.layers, defaultFieldKey: this.defaultFieldKey, catalog: this.catalogKeys };
  }

  /**
   * 쓰는 배열이 바뀌었는지 본다 — 한 곳에서(emit 직전 · rebuildDirtyLayers 시작. 노드 수십 개를 훑는 비용). 바뀌었으면 시간축에 알리고(TimeSeries.useArrays —
   * 안 쓰게 된 배열은 캐시에 두되 예산을 넘으면 먼저 버린다) 지금 장면에 빠진 배열을 읽기 시작한다(ensureUsedArrays). 바뀌었으면 true
   */
  private syncUsedArrays(): boolean {
    const series = this.series;
    if (!series || !this.installedArrays || this.holdArrays > 0) return false;
    const used = usedArrays(this.usedInput());
    const sig = [...used].sort().join('\n');
    if (sig === this.usedSig) return false;
    this.usedSig = sig;
    series.useArrays(used);
    this.ensureUsedArrays();
    return true;
  }

  /**
   * 지금 장면에 쓰는 배열이 다 끼워져 있지 않으면 빠진 것을 읽기 시작한다. 저장 시점을 기다리는 중(setStep)이면 그쪽이 끝날 때 늘어난 배열까지 받으므로 맡긴다.
   * 같은 배열 목록을 이 장면에서 이미 읽는 중이면 그대로 둔다
   */
  private ensureUsedArrays(): void {
    const series = this.series, have = this.installedArrays;
    if (!series || !this.scan || !this.ml || !have) return;
    if (this.stepBusy && this.stepBusy === this.stepToken) return;
    const want = [...series.arrays];
    if (!want.some((a) => !have.has(a))) return;
    const f = this.arrayFetch;
    if (f && f.stepTok === this.stepToken && f.want.join('\n') === want.join('\n')) return;
    void this.fetchUsedArrays(series, want);
  }

  /**
   * 지금 장면의 쓰는 배열(want)을 받아 끼운다 — 이미 캐시에 있는 배열은 꺼내고 빠진 배열만 파일에서(TimeSeries.step — 같은 배열을 두 번 읽지 않음).
   * 늦게 온 결과는 버린다: 더 새 읽기가 시작됐거나(arrayToken) 그 사이 다른 장면을 고르거나 다른 데이터를 열기 시작했으면(stepToken · series) 끼우지 않는다.
   * 끼운 뒤 도착 처리(afterArrival) · 다시 계산 · 미리 읽기(앞 장면들도 새 배열로)를 다시 건다. 실패하면 데이터 화면 안내 글에 알리고 그 노드는 앞 그림 그대로
   * (요약 줄 '<배열> 읽지 못함') — 장면을 넘기거나 쓰는 배열이 다시 바뀌면 다시 읽는다.
   * stepToken 만 바뀌어 버렸으면(같은 시간축 · 더 새 읽기 없음) 끝난 뒤 지금 장면을 다시 맞춘다(ensureUsedArrays): 기다리는 setStep 이 있으면 그쪽이 받고,
   * 없으면(데이터 열기가 실패해 옛 데이터가 그대로) 다시 읽는다 — 받은 값은 캐시에 있어 곧 끝나고, 실패였으면 한 번 더 읽어 보고 그것도 실패하면 '읽지 못함'.
   * 다시 맞추지 않으면 그 배열을 기다리는 노드가 '읽는 중'에 갇혀 다시 계산되지 않았다(검토 반영 2026-11-06)
   */
  private async fetchUsedArrays(series: TimeSeries, want: string[]): Promise<void> {
    const scan = this.scan!;
    const token = ++this.arrayToken, stepTok = this.stepToken, idx = this.stepIndex;
    const step = scan.steps[idx];
    this.arrayFetch = { token, stepTok, want };
    for (const a of want) this.arrayFailed.delete(a);
    let ok = false, moved = false; // moved = stepToken 만 바뀌어 결과를 버림 (끝난 뒤 다시 맞춘다)
    try {
      const datasets = (await series.step(step.n, want)).filter((d) => d.count > 0);
      if (token !== this.arrayToken || this.series !== series) return;
      if (stepTok !== this.stepToken || this.stepIndex !== idx) { moved = true; return; }
      this.afterArrival(this.installValues(datasets, want));
      this.markAllLayers();
      this.countDirty = true;
      this.prefetchFrom(idx);
      ok = true;
    } catch (e) {
      if (token === this.arrayToken && this.series === series) {
        if (stepTok !== this.stepToken || this.stepIndex !== idx) moved = true;
        else {
          const missing = want.filter((a) => !this.installedArrays?.has(a));
          for (const a of missing) this.arrayFailed.add(a);
          this.notify(`배열을 읽지 못했습니다: ${missing.join(', ')} · ${stepLabel(scan, step)} · ${e instanceof Error ? e.message : String(e)}`);
        }
      }
    } finally {
      if (this.arrayFetch?.token === token) this.arrayFetch = null;
      if (token === this.arrayToken) {
        this.emit();
        if (ok || moved) this.ensureUsedArrays(); // 끼웠으면 그 사이 늘어난 쓰는 배열을 이어서 · 버렸으면 지금 장면을 다시 맞춘다
      }
    }
  }

  /**
   * 시간축의 값을 끼운다(레벨 격자 · 합친 점 — 위치·가림은 그대로). arrays = 끼운 배열(그 시점 파일에 없어 빠진 것도 '끼움' — 다시 읽어도 없다).
   * 새로 값이 들어온 배열 이름을 돌려준다: 앞 장면에 값이 없던(끼우지 않았거나 그 시점 파일에 없던) 배열 가운데 이번에 값이 있는 것 —
   * 파일에 없던 배열이 다음 장면에서 나타나도 미뤄 둔 기본값이 그때 정해지게(afterArrival)
   */
  private installValues(datasets: PointDataset[], arrays: readonly string[]): string[] {
    const before = this.installedArrays;
    const hadValues = new Set(arrays.filter((a) => before?.has(a) && this.arrayPresent(a)));
    replaceLevelValues(this.ml!, datasets);
    this.gridCache.clear();
    this.valuesCache.clear();
    this.installedArrays = new Set(arrays);
    for (const a of arrays) this.arrayFailed.delete(a);
    return arrays.filter((a) => !hadValues.has(a) && this.arrayPresent(a));
  }

  /** 그 배열 이름의 값이 지금 데이터셋(합친 점 — 레벨 모두에 있는 배열만)에 있는가 */
  private arrayPresent(name: string): boolean {
    const ds = this.dataset;
    return !!ds && (ds.scalars.some((s) => s.name === name) || ds.vectors.some((v) => v.name === name));
  }

  /**
   * 쓰는 배열이 지금 장면에 새로 들어온 뒤(Field 를 바꿈 · 노드를 더함 · 장면 JSON — 저장 시점을 넘기며 함께 온 것도):
   * 미뤄 둔 통계 기본값(Threshold Lower·Upper · Clip 기준값 · Isosurface 값 · Glyph Scale Factor)을 그 사이 값을 바꾸지 않았으면 정하고,
   * 그 배열을 쓰는 값 밀대 가운데 끝이 미정이거나 없는 것을 다시 정하고(만들 때 · Field 를 바꿀 때와 같은 규칙 — 지금 장면 값이 모두 같으면 여전히 미정),
   * 장면 JSON 을 읽을 때 벡터 성분 배열이 없어 미뤄 둔 옛 '모두 같음' 범위를 다시 본다. 다시 계산 표시는 부른 쪽이 한다(markAllLayers) —
   * 기다리던 노드는 그동안 다시 계산하지 않았으므로 바꿀 때 켠 Apply 넓히기(growPending — markApplied)가 그대로 남아 공유 색 지도를 넓힌다
   * (장면 JSON 으로 들인 노드는 꺼진 채 — 저장된 범위를 지킨다)
   */
  private afterArrival(arrived: readonly string[]): void {
    if (!arrived.length) return;
    const got = new Set(arrived);
    const hit = (key: string | null): boolean => !!key && got.has(arrayNameOf(key));
    for (const [id, p] of Array.from(this.pendingDefaults)) {
      const l = this.layerById(id);
      if (!l) { this.pendingDefaults.delete(id); continue; }
      if (!p.keys.every((k) => this.fieldByKey(k))) continue; // 아직 다 오지 않음 (그 시점 파일에 없는 배열이면 다음 장면에서)
      this.pendingDefaults.delete(id);
      if (p.sig === this.defaultsSig(l)) this.updateLayer(id, p.make());
    }
    for (const nd of this.valueSliderNodes()) {
      if (!hit(nd.slider.fieldKey)) continue;
      const b = this.valueBounds.get(nd.id);
      if (!b || !b.decided || !b.range) this.valueBounds.fix(nd.id, nd.slider);
    }
    for (const [m, key] of Array.from(this.legacyRecheck)) {
      if (!hit(key)) continue;
      this.legacyRecheck.delete(m);
      this.resetIfLegacyFlat(m, key);
    }
  }

  /** 그 Field 가 머리 정보에는 있는데 지금 장면에 아직 끼우지 않았는가 (시간축 — 쓰는 배열만 읽는다. 곧 읽거나 읽는 중 · 읽지 못함). 시간축이 없으면 늘 false */
  fieldPending(key: string | null): boolean {
    return !!key && !!this.installedArrays && this.catalogKeys.has(key) && !this.installedArrays.has(arrayNameOf(key));
  }

  /**
   * 그 Field 의 배열을 지금 장면에 읽지 못했는가 (fieldPending 가운데 읽기가 실패한 것 — 노드 요약 줄 '<배열> 읽지 못함'과 같은 판정).
   * 패널의 Color Map 화면 Field 설명 줄이 '읽는 중' 대신 '읽지 못함'을 띄울 때 쓴다. 장면을 넘기거나 쓰는 배열이 바뀌어 다시 읽으면 false 로 돌아간다
   */
  fieldFailed(key: string | null): boolean {
    return this.fieldPending(key) && this.arrayFailed.has(arrayNameOf(key!));
  }

  /**
   * 그 Field 를 지금 장면에 끼웠는데(읽기는 끝남) 이 저장 시점 파일에 그 배열이 없는가 (시간축 — 어느 레벨이든 없으면 합친 데이터셋에도 없다).
   * 패널은 예전처럼 '(없음)' · 'Field 없음'으로 보이고, 노드는 '읽는 중'으로 기다리지 않는다(끝난 상태 — 그 배열 없이 계산한다). 시간축이 없으면 늘 false
   */
  fieldMissingNow(key: string | null): boolean {
    return !!key && !!this.installedArrays && this.catalogKeys.has(key) && this.installedArrays.has(arrayNameOf(key)) && !this.fieldByKey(key);
  }

  /** 지금 장면 값으로 쓸 수 없는 Field 인가 (읽는 중 · 읽지 못함 · 이 저장 시점 파일에 없음) — 통계 기본값을 그 값이 들어올 때로 미룰지 */
  private fieldUnready(key: string | null): boolean {
    return this.fieldPending(key) || this.fieldMissingNow(key);
  }

  /** 노드(데이터는 ROOT_ID)가 다시 계산하는 데 기대는 배열 가운데 지금 장면에 아직 없는 것 (core/usedArrays.ts nodeArrays — 시간축이 없으면 빈 목록) */
  private nodeMissing(id: string): string[] {
    const have = this.installedArrays;
    if (!have) return [];
    return nodeArrays(id, this.usedInput()).filter((a) => !have.has(a));
  }

  /** 노드가 기대는 배열 가운데 지금 장면에 끼웠지만 이 저장 시점 파일에 없는 것 (기다리지 않는다 — 요약 줄에 '<배열> 없음'). 시간축이 없으면 빈 목록 */
  private nodeAbsent(id: string): string[] {
    const have = this.installedArrays;
    if (!have) return [];
    return nodeArrays(id, this.usedInput()).filter((a) => have.has(a) && !this.arrayPresent(a));
  }

  /** 보이고 · 다시 계산할 차례인데 · 기대는 배열이 지금 장면에 아직 없어 기다리는 노드면 그 배열 이름 (요약 줄 '<배열> 읽는 중'). 아니면 빈 목록 */
  waitingArrays(id: string): string[] {
    const rt = this.runtime.get(id);
    if (!rt?.dirty || !this.nodeVisible(id)) return [];
    return this.nodeMissing(id);
  }

  /**
   * Clip·Threshold·Isosurface 의 Field·Component 를 바꾸고, 값(Clip 기준값 · Threshold Lower·Upper · Isosurface 값)을 그 Field 의 값 범위로 되돌린다
   * (Clip 은 최소~최대의 가운데, Threshold 는 최소~최대 전체, Isosurface 는 2~98% 의 가운데 — 노드를 만들 때의 기본값과 같다).
   * 그 배열이 지금 장면에 있으면(또는 목록에 없는 Field 면) 바로. 아직 읽지 않았거나 이 저장 시점 파일에 없으면(시간축 — 쓰는 배열만 읽음) Field·Component 만
   * 바꾸고 값은 배열 값이 들어온 뒤 정한다(그 사이 값을 바꾸면 덮지 않음 — afterArrival). 패널의 Field · Component 칸이 부른다
   */
  setValueField(id: string, patch: { fieldKey?: string; mapping?: VectorMapping }): void {
    const l = this.layerById(id);
    if (!l || (l.type !== 'clip' && l.type !== 'threshold' && l.type !== 'iso')) return;
    const key = patch.fieldKey !== undefined ? patch.fieldKey : l.params.fieldKey;
    const mapping: VectorMapping = l.type === 'iso' ? 'magnitude' : patch.mapping ?? l.params.mapping;
    const make = this.valueDefaultsOf(l.type, key, mapping);
    this.pendingDefaults.delete(id);
    if (!key || !this.fieldUnready(key)) { this.updateLayer(id, { ...patch, ...make() } as LayerPatch); return; }
    this.updateLayer(id, { ...patch } as LayerPatch);
    this.deferDefaults(l, [key], make, STAT_DEFAULT_KEYS[l.type] ?? []);
  }

  /** Clip·Threshold·Isosurface 의 값 기본값 (그 Field·성분의 지금 장면 값 분포로 — 부를 때 센다) */
  private valueDefaultsOf(type: 'clip' | 'threshold' | 'iso', key: string | null, mapping: VectorMapping): () => LayerPatch {
    return () => {
      const st = this.statsFor(key, mapping);
      return type === 'threshold' ? { lower: st.min, upper: st.max } : type === 'clip' ? { value: (st.min + st.max) / 2 } : { value: (st.p2 + st.p98) / 2 };
    };
  }

  /**
   * 노드의 통계 기본값을 배열이 온 뒤로 미룬다 (keys = 기다리는 Field key, make = 그때 넣을 값, params = make 가 정하는 항목 — 복제가 그대로 따른다).
   * 지금 값의 서명을 남겨 그 사이 바꿨는지 본다
   */
  private deferDefaults(l: Layer, keys: string[], make: () => LayerPatch, params: readonly string[]): void {
    this.pendingDefaults.set(l.id, { keys, sig: this.defaultsSig(l), make, params });
  }

  /** 미뤄 둔 기본값이 덮을 값의 서명 (Field·성분 + 값 — 같으면 그 사이 사용자가 바꾸지 않았다) */
  private defaultsSig(l: Layer): string {
    switch (l.type) {
      case 'clip': return `${l.params.fieldKey}|${l.params.mapping}|${l.params.value}`;
      case 'threshold': return `${l.params.fieldKey}|${l.params.mapping}|${l.params.lower}|${l.params.upper}`;
      case 'iso': return `${l.params.fieldKey}|${l.params.value}`;
      case 'glyph': return `${l.params.fieldName}|${l.params.lengthMode}|${l.params.scaleFactor}`;
      default: return '';
    }
  }

  /**
   * 메뉴로 만든 노드(· 기본값을 기다리던 노드의 복제)의 통계 기본값이 아직 값이 없는 배열에 매여 있으면(defaultParams 가 값 분포 없이 0~1 · 벡터 크기 최대 1 로
   * 잡았다) 배열 값이 들어온 뒤 다시 정한다: Clip 기준값 · Threshold Lower·Upper · Isosurface 값(새 노드 기본 배열 — 장면 JSON 이 기본 배열을 바꾼 직후) ·
   * Glyph Scale Factor(첫 벡터). given = 부른 쪽이 값을 직접 준 키(addLayer 의 patch) — 그 키는 덮지 않고, 모두 주었으면 미루지 않는다
   */
  private deferNewDefaults(l: Layer, given: readonly string[] = []): void {
    const own = (STAT_DEFAULT_KEYS[l.type] ?? []).filter((k) => !given.includes(k));
    if (!own.length) return;
    // 기본값 가운데 직접 주지 않은 키만 넣는다
    const only = (make: () => LayerPatch) => (): LayerPatch => {
      const all = make() as Record<string, unknown>;
      const out: Record<string, unknown> = {};
      for (const k of own) if (k in all) out[k] = all[k];
      return out as LayerPatch;
    };
    if (l.type === 'clip' || l.type === 'threshold' || l.type === 'iso') {
      const key = l.params.fieldKey;
      if (key && this.fieldUnready(key)) this.deferDefaults(l, [key], only(this.valueDefaultsOf(l.type, key, l.type === 'iso' ? 'magnitude' : l.params.mapping)), own);
    } else if (l.type === 'glyph') {
      const name = l.params.fieldName, key = name ? `vector:${name}` : null;
      const mode = l.params.lengthMode;
      if (key && this.fieldUnready(key)) this.deferDefaults(l, [key], only(() => ({ scaleFactor: this.glyphScaleDefault(name, mode) })), own);
    }
  }

  /** 모든 볼륨 노드의 그리기 객체 (카메라 바뀜을 한꺼번에 돌린다) */
  private dataRenderers(): DataViewRenderer[] {
    const out: DataViewRenderer[] = [];
    for (const rt of this.runtime.values()) if (rt.renderer instanceof DataViewRenderer) out.push(rt.renderer);
    return out;
  }
  /** 모든 볼륨 노드의 Points 렌더러 (뷰포트 바뀜) */
  private pointRenderers(): PointRenderer[] { return this.dataRenderers().map((r) => r.points); }

  /** 점 단위 Field 값 배열 (Clip·Threshold 사슬 CPU 판정·Points·Glyph 색). Field 가 없으면 null */
  valuesOf(fieldKey: string | null, mapping: VectorMapping): Float32Array | null {
    if (!fieldKey) return null;
    // 벡터 크기·성분은 노드마다 전체 길이 배열을 새로 만들게 되므로 데이터셋·저장 시점 단위로 캐시한다
    const key = `${fieldKey}|${mapping}`;
    const cached = this.valuesCache.get(key);
    if (cached) return cached;
    const f = this.fieldByKey(fieldKey);
    if (!f) return null;
    const v = mappedValues(f, mapping);
    this.valuesCache.set(key, v);
    return v;
  }

  togglePlay(): void { if (this.playing) this.pause(); else this.play(); }

  /**
   * 재생. ParaView 와 같이 마지막 장면에서 누르면 처음부터, 반복 재생(loopPlay)이 꺼져 있으면 마지막 장면을 보이고 멈춘다(core/playStep.ts).
   * 다음 장면은 앞 장면 읽기가 끝난 뒤 재생 간격만큼 쉬고 넘어간다 — 읽기가 오래 걸리면 그만큼 기다린다
   */
  play(): void {
    if (!this.series || this.stepCount() < 2 || this.playing) return;
    this.playing = true;
    this.emit();
    const tick = async (first: boolean) => {
      if (!this.playing) return;
      const n = this.stepCount();
      const next = first ? firstPlayStep(this.stepIndex, n) : nextPlayStep(this.stepIndex, n, this.loopPlay);
      if (next === null) { this.pause(); return; } // 마지막 장면까지 보였다
      await this.setStep(next);
      if (!this.playing) return;
      this.playTimer = window.setTimeout(() => { void tick(false); }, 1000 / this.playFps);
    };
    void tick(true);
  }

  /** 반복 재생 켜기·끄기 (재생 막대 오른쪽 단추). 재생 중에 바꾸면 다음 장면부터 따른다 */
  setLoopPlay(on: boolean): void {
    if (this.loopPlay === on) return;
    this.loopPlay = on;
    this.emit();
  }

  pause(): void {
    this.stopPlayback();
    this.emit();
  }

  setPlayFps(fps: number): void { this.playFps = Math.max(0.5, Math.min(30, fps)); }

  private stopPlayback(): void {
    this.playing = false;
    if (this.playTimer !== null) { clearTimeout(this.playTimer); this.playTimer = null; }
  }

  // ---- 필드/색 ----
  /**
   * 고를 수 있는 Field 목록 (선택 상자 · 데이터 정보의 벡터·스칼라 줄 · 기본 Field). 결과 폴더는 첫 저장 헤더로 만든 목록(값을 읽지 않아도 모자라지 않다 —
   * 쓰는 배열만 읽으므로 지금 데이터셋에는 일부만 있다), 그 밖(CSV · 단일 VTU/VTI)은 데이터셋의 배열. 벡터 먼저
   */
  fieldOptions(): FieldOption[] {
    if (!this.dataset) return [];
    if (this.headerCatalog) return this.headerCatalog.map((o) => ({ ...o }));
    const out: FieldOption[] = [];
    for (const v of this.dataset.vectors) out.push({ key: `vector:${v.name}`, label: `${v.name} (벡터)`, kind: 'vector' });
    for (const s of this.dataset.scalars) out.push({ key: `scalar:${s.name}`, label: s.name, kind: 'scalar' });
    return out;
  }

  /** Field 목록의 한 줄 (이름·종류 — 값을 아직 읽지 않았어도 있다). 목록에 없으면 null. 'Field 없음'과 '읽는 중'(fieldPending)을 가를 때 쓴다 */
  fieldOption(key: string | null): FieldOption | null {
    if (!key) return null;
    return this.fieldOptions().find((o) => o.key === key) ?? null;
  }

  /** 지금 장면 값이 들어 있는 Field (값·통계). 결과 폴더에서는 아직 읽지 않은 배열이면 null — 목록에 있는지는 fieldOption */
  fieldByKey(key: string | null): Field | null {
    if (!this.dataset || !key) return null;
    const [kind, ...rest] = key.split(':');
    const name = rest.join(':');
    return kind === 'vector'
      ? this.dataset.vectors.find((v) => v.name === name) ?? null
      : this.dataset.scalars.find((s) => s.name === name) ?? null;
  }

  /** 새 노드 기본 배열의 값 분포 (성분은 그 배열 색 지도의 것) */
  currentStats(): FieldStats { return this.statsFor(this.defaultFieldKey, this.colorMapOf(this.defaultFieldKey).mapping); }

  statsFor(key: string | null, mapping: VectorMapping = 'magnitude'): FieldStats {
    const f = this.fieldByKey(key);
    return f ? mappedStats(f, mapping) : { min: 0, max: 1, p2: 0, p98: 1 };
  }

  /**
   * 노드의 값 밀대(Threshold Lower·Upper · Clip Scalar 기준값 · Isosurface 값)의 양 끝·눈금 — 그 노드에 정해 둔 끝 ∪ 노드의 지금 값(core/sliderRange.ts).
   * 끝은 노드를 만들 때 · Field·Component 를 바꿀 때 · 같은 배열·성분의 전 시점 범위를 읽었을 때만 정하고, 재생 · 저장 시점 넘기기 · 노드 다시 고르기로는
   * 바뀌지 않는다(2026-11-05 결정). 처음 값이 모두 같았던 끝만 값이 처음 달라지는 장면에서 한 번 정한다(setStep → settle).
   * 패널의 밀대와 요약 글(트리 meta · '남기는 셀' 줄)의 자릿수 기준이 쓴다. 값 밀대가 없는 노드면 null
   */
  valueSliderBounds(id: string): SliderBounds | null {
    const l = this.layerById(id);
    const s = l ? valueSliderOf(l) : null;
    return s ? this.valueBounds.sliderOf(id, s) : null;
  }

  /** 값 밀대가 있는 노드들 (settle · 전 시점 범위 뒤 다시 정하기가 훑는다) */
  private valueSliderNodes(): SliderNode[] {
    const out: SliderNode[] = [];
    for (const l of this.layers) { const slider = valueSliderOf(l); if (slider) out.push({ id: l.id, slider }); }
    return out;
  }

  /** 노드의 값 밀대 끝을 지금 알고 있는 범위로 정한다 — 만들 때(insertLayer · duplicateLayer). 값 밀대가 없는 노드는 건너뜀 */
  private fixValueBounds(l: Layer): void {
    const s = valueSliderOf(l);
    if (s) this.valueBounds.fix(l.id, s);
  }

  /** 그 배열·성분의 지금 장면 값 범위와 '모두 같음' 하한 (Field 가 지금 데이터에 없으면 범위 null) — 미정인 밀대 끝을 이 장면에서 정할지 */
  private nowRangeOf(fieldKey: string | null, mapping: string): RangeInfo {
    const f = this.fieldByKey(fieldKey);
    if (!f) return { range: null, floor: 0 };
    const st = mappedStats(f, mapping as VectorMapping);
    return { range: unionRanges({ min: st.min, max: st.max }), floor: this.flatFloor(fieldKey, mapping as VectorMapping) };
  }

  /**
   * 그 배열·성분에 대해 지금 알고 있는 값 범위 = 지금 장면 ∪ 읽어 둔 저장 시점(TimeSeries.cachedRange — 파일은 읽지 않음, 셀은 전 시점 범위와 같게 가림)
   * ∪ 전 시점 범위 읽기 결과(allTimeRanges). '모두 같음' 하한은 같은 범위의 벡터 크기 최대로(벡터 성분일 때 — componentFlatFloor. 성분으로 전 시점 범위를
   * 읽었으면 그때 센 크기 최대 allTimeRanges.magMax 도).
   * 밀대 끝을 정할 때만 부른다(만들기 · Field·Component 바꿈 · 전 시점 범위 뒤 · 미정 끝 정하기) — 캐시를 훑으므로 장면마다 부르지 않는다
   */
  private knownRangeOf(fieldKey: string | null, mapping: string): RangeInfo {
    if (!fieldKey) return { range: null, floor: 0 };
    const m = mappingKeyOf(fieldKey, mapping);
    const range = this.knownValues(fieldKey, m);
    if (!fieldKey.startsWith('vector:') || m === 'magnitude') return { range, floor: 0 };
    const magMax = Math.max(this.knownValues(fieldKey, 'magnitude')?.max ?? -Infinity, this.allTimeRanges.magMax(fieldKey));
    return { range, floor: componentFlatFloor(m, magMax) };
  }
  private knownValues(fieldKey: string, mapping: string): ValueRange | null {
    const f = this.fieldByKey(fieldKey);
    const st = f ? mappedStats(f, mapping as VectorMapping) : null;
    const cached = this.series ? this.series.cachedRange(fieldKey.slice(fieldKey.indexOf(':') + 1), mapping as VectorMapping, this.levelMasks()) : null;
    return unionRanges(st ? { min: st.min, max: st.max } : null, cached, this.allTimeRanges.get(fieldKey, mapping));
  }

  /** 다중 레벨에서 고운 레벨이 덮은 굵은 셀을 빼는 표 (레벨 이름 → 점마다 쓸지) — 합친 데이터셋('데이터 범위')과 같은 셀. 전 시점 범위 · 본 범위가 쓴다 */
  private levelMasks(): Map<string, Uint8Array> {
    const masks = new Map<string, Uint8Array>();
    for (const l of this.levels) if (l.keptCount < l.dataset.count) masks.set(l.name, l.keep);
    return masks;
  }

  /**
   * '모두 같음' 문턱 하한 (core/colorRange.ts componentFlatFloor): 벡터 성분(X·Y·Z)으로 칠하면 float32 정밀도 × 지금 장면의 그 벡터 크기 최대
   * (이미 들고 있는 통계 — 더 읽지 않음), 크기·스칼라면 0. 자동 정하기·넓히기·Rescale 단추가 쓴다(전 시점 범위는 읽은 모든 시점의 크기 최대로 — startRangeScan)
   */
  private flatFloor(fieldKey: string | null, mapping: VectorMapping): number {
    const f = this.fieldByKey(fieldKey);
    return f?.kind === 'vector' ? componentFlatFloor(mapping, f.stats.magnitude.max) : 0;
  }

  unitFor(fieldKey: string | null): string {
    const f = this.fieldByKey(fieldKey);
    if (!f) return '';
    return this.info.units[f.name] ?? (f.kind === 'vector' ? this.info.units[f.componentNames[0]] ?? '' : '');
  }

  // ---- 색 지도 (ParaView 색 전달함수: 배열마다 하나를 공유, Separate Color Map 은 그 노드만) ----
  /** 배열의 공유 색 지도. 없으면 만든다(fresh — 처음 칠하는 노드의 데이터 범위로 시작) */
  colorMapOf(fieldKey: string | null): ColorMap {
    const key = fieldKey ?? '';
    let m = this.colorMaps.get(key);
    if (!m) { m = defaultColorMap(); this.colorMaps.set(key, m); }
    return m;
  }

  /** 노드 색칠 객체를 가진 노드: 볼륨 노드는 자기 자신, 면·선·Glyph 모양을 그리는 노드는 그 모양을 만든 노드(sourceOf) */
  private coloringOwner(id: string): string {
    if (id === ROOT_ID || this.nodeView(id)) return id;
    return this.sourceOf(id)?.id ?? id;
  }

  /** 노드의 색칠 객체 (화면에서 고치는 대상). 볼륨 노드는 view.color, 그 밖은 모양을 만든 노드의 color/fieldColor */
  coloringOf(id: string): LayerColor | null {
    const view = this.nodeView(id);
    if (view) return view.color;
    const src = this.sourceOf(id);
    return src ? layerColorOf(src) : null;
  }

  /** 노드가 지금 값으로 칠하는지 (단색·Outline·없음이면 false) */
  colorsByField(id: string): boolean {
    const view = this.nodeView(id);
    if (view) return !!view.color.fieldKey && (view.representation === 'surface' || view.representation === 'points' || view.representation === 'volume');
    const src = this.sourceOf(id);
    return !!src && usesFieldColor(src) && !!layerColorOf(src)?.fieldKey;
  }

  /** 색칠이 쓰는 지도 (Separate 면 자기 것, 아니면 그 배열의 공유 지도) */
  mapOf(c: LayerColor): ColorMap { return c.separate ? c.map : this.colorMapOf(c.fieldKey); }

  /** 렌더러에 넘기는 색 기준 (배열·성분·Colormap·범위·Opacity 곡선) */
  specOf(c: LayerColor): ColorState {
    const m = this.mapOf(c);
    const s: ColorState = { fieldKey: c.fieldKey, mapping: m.mapping, colormap: m.colormap, rangeMin: m.rangeMin, rangeMax: m.rangeMax, rangeMode: m.rangeMode, opacity: m.opacity };
    if (m.fresh) { s.unset = true; s.flat = this.mapRuntime.get(m)?.flat ?? null; }
    return s;
  }

  /** 지도의 잠깐 상태 (없으면 만든다) */
  private mapRt(m: ColorMap): MapRuntime {
    let r = this.mapRuntime.get(m);
    if (!r) { r = { flat: null, settledPass: -1, componentStep: null, note: NO_NOTE }; this.mapRuntime.set(m, r); }
    return r;
  }

  /**
   * 저장 시점을 넘긴 뒤: 미정 지도 가운데 그 지도로 칠하는 보이는 노드가 하나도 없는 것은 그린 값의 판단(flat — '지금 값은 모두 0')을 지운다.
   * 그 판단은 앞 장면의 값이고, 숨긴 노드는 다시 계산되지 않아 새로 판단할 노드가 없다(상태 줄·목록 줄·Range 칸이 '범위: 아직 정하지 않음'만 보인다).
   * 보이는 노드가 있는 지도는 그대로 두고 다음 계산이 새로 판단한다 — 여기서 지우면 장면을 넘기는 사이 범례가 '범위 미정'으로 깜빡인다
   */
  private dropStaleFlats(): void {
    for (const e of this.colorMapList()) {
      const c = this.coloringOf(e.users[0]);
      if (!c) continue;
      const m = this.mapOf(c);
      const mr = this.mapRuntime.get(m);
      if (m.fresh && mr?.flat && !e.users.some((id) => this.nodeVisible(id))) mr.flat = null;
    }
  }

  /** 지금 저장 시점의 저장 번호 (범위 근거에 남긴다). 시간축이 없으면 null */
  private currentStepN(): number | null { return this.scan?.steps[this.stepIndex]?.n ?? null; }

  /** 저장 번호 → 't = 0.004' 등. 지금 데이터에 없는 번호면 null */
  private stepLabelOfN(n: number): string | null {
    const s = this.scan?.steps.find((x) => x.n === n);
    return this.scan && s ? stepLabel(this.scan, s) : null;
  }

  /** 노드의 색 기준. 값으로 칠하지 않으면 null */
  nodeSpec(id: string): ColorState | null {
    const c = this.coloringOf(id);
    return c && this.colorsByField(id) ? this.specOf(c) : null;
  }

  /** 색칠 객체를 가진 노드와, 그 모양을 다시 그리는 아래 노드들 (볼륨 노드는 자기만) */
  private coloringTargets(ownerId: string): string[] {
    if (ownerId === ROOT_ID || this.nodeView(ownerId)) return [ownerId];
    return [ownerId, ...this.descendantsOf(ownerId).map((d) => d.id)];
  }

  /** 다시 계산하고, 그 뒤 칠할 값 범위만큼 색 지도를 넓히게 한다 (ParaView 의 Apply 에 해당하는 변경) */
  private markApplied(id: string): void {
    const rt = this.runtime.get(id);
    if (rt) { rt.dirty = true; rt.growPending = true; }
  }

  /**
   * 노드 색칠을 바꾼다 (ParaView Coloring): 배열(fieldKey, null = 단색)·Separate Color Map. Separate 를 켜는 순간 지금 공유 지도를 복사해 시작한다
   * (보이는 색이 바뀌지 않게; 그 공유 지도가 아직 범위가 없으면 복사본도 처음 칠할 때 정해진다). 바꾸면 그 노드를 다시 계산하고 새 배열의 지도를 넓힌다.
   */
  setNodeColoring(id: string, patch: { fieldKey?: string | null; separate?: boolean }): void {
    const c = this.coloringOf(id);
    if (!c) return;
    const nextField = patch.fieldKey !== undefined ? patch.fieldKey : c.fieldKey;
    if (patch.separate === true && !c.separate) c.map = copyColorMap(this.colorMapOf(nextField)); // Opacity 곡선도 새 배열로
    if (patch.fieldKey !== undefined && patch.fieldKey !== c.fieldKey && c.separate) c.map = copyColorMap(this.colorMapOf(nextField));
    Object.assign(c, patch);
    if (c.fieldKey) this.colorMapOf(c.fieldKey);
    for (const t of this.coloringTargets(this.coloringOwner(id))) this.markApplied(t);
    this.countDirty = true;
    this.emit();
  }

  /** 색 지도 대상: 노드(그 노드가 쓰는 지도 — 공유 또는 Separate) 또는 배열(공유 지도) */
  private resolveMap(target: ColorTarget): { map: ColorMap; fieldKey: string | null; owner: string | null } | null {
    if ('nodeId' in target) {
      const c = this.coloringOf(target.nodeId);
      if (!c) return null;
      return { map: this.mapOf(c), fieldKey: c.fieldKey, owner: c.separate ? this.coloringOwner(target.nodeId) : null };
    }
    return { map: this.colorMapOf(target.fieldKey), fieldKey: target.fieldKey, owner: null };
  }

  /** 대상의 색 지도 (화면 표시용). 배열 대상이면 그 배열의 공유 지도(없으면 만든다) */
  colorMapFor(target: ColorTarget): ColorMap | null { return this.resolveMap(target)?.map ?? null; }

  /** 그 지도를 쓰는 노드 id 들 (화면 안내용: 데이터 = ROOT_ID). 지금 값으로 칠하는 노드만 */
  colorMapUsers(target: ColorTarget): string[] {
    if ('fieldKey' in target) return this.mapUsers(target.fieldKey, null); // 배열 대상은 지도를 만들지 않고 센다
    const r = this.resolveMap(target);
    return r ? this.mapUsers(r.fieldKey, r.owner) : [];
  }

  /**
   * 지금 쓰이는 색 지도들 (트리 순서). 공유 지도는 배열마다 하나, Separate Color Map 은 색칠 주인 노드마다 하나(그 모양을 다시 그리는 아래 Clip·Threshold 도 users 에).
   * 값으로 칠하도록 되어 있는 노드가 있는 지도만 — 숨긴 노드도 센다(다시 보이면 그 지도로 칠한다).
   */
  colorMapList(): ColorMapEntry[] {
    const out: ColorMapEntry[] = [];
    for (const id of [ROOT_ID, ...this.layers.map((l) => l.id)]) {
      const key = this.colorMapKeyOf(id);
      const c = this.coloringOf(id);
      if (!key || !c?.fieldKey) continue;
      let e = out.find((x) => x.key === key);
      if (!e) {
        const owner = c.separate ? this.coloringOwner(id) : null;
        e = { key, target: owner ? { nodeId: owner } : { fieldKey: c.fieldKey }, fieldKey: c.fieldKey, owner, users: [] };
        out.push(e);
      }
      e.users.push(id);
    }
    return out;
  }

  /** 노드가 지금 칠하는 색 지도의 key (colorMapList 의 key). 값으로 칠하지 않으면 null */
  colorMapKeyOf(id: string): string | null {
    if (!this.colorsByField(id)) return null;
    const c = this.coloringOf(id);
    if (!c?.fieldKey) return null;
    return c.separate ? `node:${this.coloringOwner(id)}` : `field:${c.fieldKey}`;
  }

  /** 지금 쓰이는 색 지도 수 — 트리·Color Map 구획 요약 */
  colorMapsInUse(): number { return this.colorMapList().length; }

  /** 그 지도로 칠하는 노드들 (owner 가 있으면 Separate 지도 — 그 노드들만) */
  private mapUsers(fieldKey: string | null, owner: string | null): string[] {
    if (owner) return this.coloringTargets(owner).filter((id) => this.colorsByField(id));
    return [ROOT_ID, ...this.layers.map((l) => l.id)].filter((id) => {
      if (!this.colorsByField(id)) return false;
      const c = this.coloringOf(id);
      return !!c && !c.separate && c.fieldKey === fieldKey;
    });
  }

  /**
   * 지도가 바뀐 뒤 그 지도로 칠하는 노드를 다시 칠한다: 볼륨 노드는 uniform 만(성분이 바뀌면 값부터), 나머지는 다시 계산(색을 굽거나 Contour lines 값이 범위에 매여 있다).
   * flatOnly = 미정 지도의 '모두 같음' 임시 범위만 바뀜 — 이 차례에 이미 계산된 보이는 노드는 다시 계산하지 않는다(colorRange.ts repaintsOnRangeChange).
   * 기대는 배열을 기다리는 볼륨 노드는 uniform 을 바꾸지 않고 다시 계산 표시만 둔다: 그 렌더러에는 아직 옛 배열 값이 올라 있어 새 지도로 칠하면 옛 값이
   * 새 지도의 색·범위로 보인다('앞 그림 유지'가 아니라 틀린 그림 — 검토 반영 2026-11-06). 배열이 오면 다시 계산하며 칠한다
   */
  private refreshMapUsers(fieldKey: string | null, owner: string | null, valuesChanged: boolean, except?: string, flatOnly = false): void {
    for (const id of this.mapUsers(fieldKey, owner)) {
      if (id === except) continue;
      const rt = this.runtime.get(id);
      if (!rt) continue;
      const volumeColorOnly = rt.renderer instanceof DataViewRenderer && !valuesChanged;
      if (!repaintsOnRangeChange(flatOnly ? 'flat' : 'set', { volumeColorOnly, hasRange: !!rt.valueRange, visible: this.nodeVisible(id), dirty: rt.dirty, computedThisPass: rt.computedPass === this.passId })) continue;
      if (rt.renderer instanceof DataViewRenderer && !valuesChanged && !this.nodeMissing(id).length) rt.renderer.setColor(this.nodeSpec(id));
      else rt.dirty = true;
    }
  }

  /**
   * Opacity 곡선만 바뀐 뒤: 그 지도로 칠하는 노드 가운데 Volume 으로 그리는 것만 전달함수 텍스처·uniform 을 바꾼다(다시 계산 없음).
   * 곡선은 Volume 만 쓰므로(ParaView 도 면에는 EnableOpacityMapping 기본 끔) 같은 지도를 쓰는 Slice·Streamline·Glyph·Isosurface·Surface·Points 는 건드리지 않는다
   * — refreshMapUsers 를 타면 곡선을 끄는 동안 유선 적분 등이 헛되이 다시 돈다. 기대는 배열을 기다리는 노드는 칠하지 않고 다시 계산 표시만 둔다(refreshMapUsers 와 같음)
   */
  private refreshVolumeUsers(fieldKey: string | null, owner: string | null): void {
    for (const id of this.mapUsers(fieldKey, owner)) {
      const rt = this.runtime.get(id);
      if (!(rt?.renderer instanceof DataViewRenderer) || this.nodeView(id)?.representation !== 'volume') continue;
      if (this.nodeMissing(id).length) rt.dirty = true;
      else rt.renderer.setColor(this.nodeSpec(id));
    }
  }

  /**
   * 색 지도를 고친다(Colormap·성분·범위·자동 넓히기·Opacity 곡선). 범위를 직접 넣으면 '사용자 지정'이 되고 자동 넓히기를 끈다
   * (ParaView 사용자 지정 범위의 'Rescale and disable automatic rescaling'). 폭이 너무 좁은 범위는 값 크기의 1e-4 까지 넓힌다.
   * Opacity 곡선(opacity: [[x, Opacity], …], x 는 범위 기준 0~1)은 확인한 뒤 새 배열로 넣고(형식이 틀리면 그 항목만 버리고 콘솔에 경고), 곡선만 바꾸면
   * Volume 노드만 다시 칠한다(refreshVolumeUsers). 편집 화면이 생기기 전에는 콘솔에서 쓴다:
   * app.updateColorMap({ fieldKey: 'vector:velocity' }, { opacity: [[0, 0], [0.5, 0], [1, 1]] }) · 노드가 쓰는 지도는 { nodeId: 'root' }
   */
  updateColorMap(target: ColorTarget, patch: Partial<ColorMap>): void {
    const r = this.resolveMap(target);
    if (!r) return;
    const m = r.map;
    if ('opacity' in patch) {
      const curve = parseOpacityCurve(patch.opacity);
      const { opacity: _bad, ...rest } = patch;
      if (!curve) {
        console.warn('Opacity 곡선 형식이 맞지 않아 무시했습니다 — 점 2개 이상, x 는 0 에서 1 까지 커지는 순서, Opacity 는 0~1. 예: [[0, 0], [1, 1]]');
        if (!Object.keys(rest).length) return;
      }
      patch = curve ? { ...rest, opacity: curve } : rest; // 받은 배열을 그대로 두지 않는다 (부른 쪽이 나중에 고쳐도 지도가 따라 바뀌지 않게)
    }
    const opacityOnly = Object.keys(patch).length > 0 && Object.keys(patch).every((k) => k === 'opacity');
    const ranged = 'rangeMin' in patch || 'rangeMax' in patch;
    const custom = ranged && !('rangeMode' in patch);
    const mappingChanged = 'mapping' in patch && patch.mapping !== m.mapping;
    // 성분(크기·X·Y·Z)을 바꾸면 범위를 새로 잡는다 — 넓히기가 아니라 처음부터(ParaView componentNumberChanged → Rescale…ToDataRange(extend=false,
    // force=false): 자동 범위를 끈 지도는 그대로). 지도를 fresh 로 돌리고, 노드 대상이면 그 노드를 먼저 다시 계산해 그 노드의 값 범위로 정한다
    const recomponent = mappingChanged && m.autoGrow && !custom;
    const mr = this.mapRt(m);
    // 미정 지도에 Range 한 칸만 넣으면 다른 칸은 지금 칸에 보이는 값(그린 값이 모두 같으면 그 값, 그린 값이 없어 칸이 비었으면 넣은 값)으로 채운다 —
    // 칠하기용 임시 값(앞 장면의 임시 범위 · 처음 0 ~ 1)이 사용자 지정 범위에 섞이지 않게 (colorRange.ts fillOneSided)
    if (m.fresh && ranged) {
      const filled = fillOneSided(patch, mr.flat);
      if (filled) patch = { ...patch, ...filled };
    }
    if (ranged || mappingChanged) mr.note = NO_NOTE; // 지난 안내는 그 범위·성분에 대한 것
    // 이 지도의 전 시점 범위를 읽는 중이면: Range 를 직접 넣으면 그 범위가 이기고(조용히 멈춤), Component 를 바꾸면 읽던 값이 다른 성분이라 멈추고 알린다
    if (this.rangeScan?.map === m) {
      if (mappingChanged) this.cancelRangeScan('component');
      else if (ranged) this.cancelRangeScan('silent');
    }
    Object.assign(m, patch);
    if (ranged) { [m.rangeMin, m.rangeMax] = widenColorRange(m.rangeMin, m.rangeMax); m.fresh = false; mr.flat = null; }
    if (custom) { m.rangeMode = 'custom'; m.autoGrow = false; delete m.rangeBasis; }
    if (mappingChanged && m.fresh) mr.flat = null; // 다른 성분의 값이었다
    if (recomponent) { m.fresh = true; m.rangeMode = 'data'; delete m.rangeBasis; mr.flat = null; mr.componentStep = this.stepIndex; }
    if (opacityOnly) this.refreshVolumeUsers(r.fieldKey, r.owner);
    else this.refreshMapUsers(r.fieldKey, r.owner, 'mapping' in patch);
    if (recomponent && 'nodeId' in target) {
      const rt = this.runtime.get(target.nodeId);
      // 기대는 배열이 아직 없으면 여기서 계산하지 않는다(배열이 오면 다시 계산하며 정한다 — rebuildDirtyLayers)
      if (rt?.dirty && !this.nodeMissing(target.nodeId).length) { this.passId++; this.rebuildNode(target.nodeId, rt); }
    }
    this.emit();
  }

  /**
   * ParaView Rescale 단추. data = 데이터 범위(노드 대상이면 그 노드가 그린 값, 배열 대상이면 지금 시점 데이터셋 전체), visible = 보이는 범위
   * (그 지도로 칠하는 보이는 노드들이 그린 값), alltime = 전 시점 범위 — 저장 시점이 둘 이상이면 모든 저장 시점에서 그 배열 하나만 읽는 작업을 시작하고
   * 바로 돌아온다(startRangeScan — 진행은 rangeScanFor, 결과는 끝날 때 누른 순간의 지도에). 시간축이 없으면 지금 데이터. 자동 넓히기 설정은 그대로 둔다.
   * 읽은 값이 모두 같으면 범위를 바꾸지 않고 알린다(PV와 다름 — -5e-13 ~ 5e-13 같은 뜻 없는 범위를 화면에 두지 않는다). 단추가 범위를 바꾸면 그 지도의
   * 전 시점 범위 읽기는 멈춘다(나중 조작이 이김. 범위를 바꾸지 않은 누름은 멈추지 않는다). 안내 글은 지도에 묶어 두고(colorMapNote — 그 지도를 고치는 편집기에 보인다) 같은 글을 돌려준다.
   * PV와 다름 — 전 시점 범위가 읽는 것: PV 는 그 표현의 입력(필터 출력, 예: Slice 결과)의 전 시점 정보, 우리는 데이터 전체 배열(그 배열·성분, 고체·가려진 굵은 셀 뺌).
   * 노드가 그린 값의 전 시점 범위를 내려면 시점마다 노드 사슬을 다시 계산해야 해서다(명세 §3)
   */
  async rescaleColorMap(target: ColorTarget, mode: 'data' | 'visible' | 'alltime'): Promise<string> {
    const r = this.resolveMap(target);
    if (!r || !r.fieldKey) return '';
    if (mode === 'alltime' && this.series && this.scan && this.scan.steps.length > 1) {
      this.startRangeScan(r.map, r.fieldKey, r.owner);
      return '';
    }
    // 그 배열(또는 노드가 기대는 배열)을 아직 읽는 중이거나 이 저장 시점 파일에 없으면 바꾸지 않는다 — 지금 장면 값이 없어 0 ~ 1 이나 앞 그림의 범위를 쓰게 된다
    // (누르기는 배열이 온 뒤에 · 그 배열이 있는 저장 시점에서)
    if (this.fieldUnready(r.fieldKey) || ('nodeId' in target && mode === 'data' && this.nodeMissing(target.nodeId).length)) return '';
    let range: [number, number] | null = null;
    if (mode === 'visible') {
      this.passId++;
      for (const id of this.mapUsers(r.fieldKey, r.owner)) {
        const rt = this.runtime.get(id);
        if (!rt || !this.nodeVisible(id)) continue;
        if (rt.dirty) { // 바꾼 직후 아직 그리지 않은 노드 (기대는 배열을 읽는 중이면 그 노드는 빼고 센다)
          if (this.nodeMissing(id).length) continue;
          this.rebuildNode(id, rt);
        }
        if (!rt.valueRange) continue;
        range = range ? [Math.min(range[0], rt.valueRange[0]), Math.max(range[1], rt.valueRange[1])] : [...rt.valueRange];
      }
    } else {
      if (mode === 'data' && 'nodeId' in target) {
        const rt = this.runtime.get(target.nodeId);
        if (rt?.dirty) { this.passId++; this.rebuildNode(target.nodeId, rt); } // 숨은 노드는 다시 계산되지 않고 밀려 있다 — 지금 계산해 최신 범위를 쓴다
        range = rt?.valueRange ?? null;
      }
      if (!range) { const st = this.statsFor(r.fieldKey, r.map.mapping); range = [st.min, st.max]; }
    }
    const d = rescaleDecision(range, this.flatFloor(r.fieldKey, r.map.mapping)); // 값이 없거나(보이는 노드 없음) 모두 같으면 바꾸지 않고 알린다 — 그 지도의 전 시점 범위 읽기도 그대로
    if (!d.apply) return this.setMapNote(r.map, d.note);
    if (this.rangeScan?.map === r.map) this.cancelRangeScan('silent');
    [r.map.rangeMin, r.map.rangeMax] = d.range;
    r.map.rangeMode = mode;
    r.map.rangeBasis = mode === 'alltime' ? { kind: 'alltime', total: 1, used: 1 } : { kind: mode, n: this.currentStepN() };
    r.map.fresh = false;
    const mr = this.mapRt(r.map);
    mr.flat = null;
    mr.note = NO_NOTE;
    this.refreshMapUsers(r.fieldKey, r.owner, false);
    this.emit();
    return '';
  }

  /** 지도의 안내 줄을 Rescale 결과 글로 바꾸고 알린다 (돌려주는 값 = 그 글) */
  private setMapNote(m: ColorMap, text: string): string {
    this.mapRt(m).note = { text, sticky: false };
    this.emit();
    return text;
  }

  /** 전 시점 범위 작업의 화면 이름 ('velocity' · Separate 면 'Slice 1 의 velocity') */
  private scanJobName(j: RangeScanJob): string {
    const name = arrayNameOf(j.fieldKey); // 지금 장면에 끼우지 않은 배열이어도 이름은 key 에 있다
    return j.owner ? `${j.owner === ROOT_ID ? '데이터' : this.layerById(j.owner)?.name ?? j.owner} 의 ${name}` : name;
  }

  /** 작업의 지도에 아직 닿을 수 있는가 (공유: 그 배열의 지도가 그 객체 · Separate: 주인 노드가 있고 Separate 이며 그 객체를 씀) */
  private mapReachable(j: RangeScanJob): boolean {
    if (!j.owner) return this.colorMaps.get(j.fieldKey) === j.map;
    const c = this.coloringOf(j.owner);
    return !!c && c.separate && c.map === j.map;
  }

  /**
   * 전 시점 범위 읽기를 시작한다 (한 번에 하나 — 다른 지도의 작업은 멈추고 그 사실을 새로 누른 지도의 안내 줄에 적는다: 누른 자리가 결과 자리).
   * 재생·저장 시점 넘기기·노드 만들기는 막지 않는다. 끝나면 scanApplies(지금 작업이 이것이고 · 멈추지 않았고 · 지도에 닿고 · 성분이 같을 때)일 때만
   * scanOutcome 대로 적용한다. 진행 알림은 100 ms 에 한 번 + 끝날 때. 지도에 닿을 수 없게 되면(Separate 끔·주인 노드 지움) 그 자리에서 멈춘다
   */
  private startRangeScan(map: ColorMap, fieldKey: string, owner: string | null): void {
    const series = this.series, scan = this.scan;
    if (!series || !scan) return;
    const prev = this.rangeScan;
    if (prev?.map === map) return; // 이미 읽는 중 (단추는 막혀 있다)
    const prevName = prev ? this.scanJobName(prev) : '';
    if (prev) this.cancelRangeScan('silent');
    const job: RangeScanJob = { map, fieldKey, owner, mapping: map.mapping, ctrl: new AbortController(), done: 0, total: scan.steps.length, failed: 0, wholeFiles: false, lastEmit: 0 };
    this.rangeScan = job;
    this.mapRt(map).note = prev ? { text: `앞서 읽던 ${prevName} 의 전 시점 범위는 멈췄습니다.`, sticky: true } : NO_NOTE;
    this.emit();
    // 다중 레벨: 고운 레벨이 덮은 굵은 셀을 뺀다 — 합친 데이터셋('데이터 범위')과 같은 셀 (LevelData.name = 위상 이름)
    const masks = this.levelMasks();
    series.scanRange({
      array: fieldKey.slice(fieldKey.indexOf(':') + 1), mapping: job.mapping, masks, signal: job.ctrl.signal,
      onStep: (p) => {
        if (this.rangeScan !== job) return;
        job.done = p.done; job.failed = p.failed; job.wholeFiles = p.wholeFiles;
        if (!this.mapReachable(job)) { this.cancelRangeScan('silent'); this.emit(); return; } // 어느 편집기에도 진행이 보이지 않는 숨은 작업이 되지 않게
        const now = performance.now();
        if (now - job.lastEmit >= 100 || p.done === p.total) { job.lastEmit = now; this.emit(); }
      },
    }).then((res) => {
      // 값 밀대의 양 끝: 그 배열·성분을 쓰는 노드들의 끝을 모든 시점 범위로 다시 정한다(sliderRange.ts 의 (다)) — 지도에 적용하든 말든 그 배열·성분의 값이다
      // (같은 데이터일 때만. 멈춘 작업은 반쪽이라 뺀다). 결과는 남겨 두어 뒤에 만드는 노드도 그 범위로 시작한다. 성분이면 읽은 모든 시점의 크기 최대도
      // 따로 남긴다('모두 같음' 하한에만 — knownRangeOf. 크기 쪽 범위에는 넣지 않는다)
      if (!job.ctrl.signal.aborted && this.series === series && res.used > 0) {
        const m = mappingKeyOf(fieldKey, job.mapping);
        this.allTimeRanges.widen(fieldKey, m, res.min, res.max);
        if (m !== 'magnitude') this.allTimeRanges.noteMagMax(fieldKey, res.magMax);
        this.valueBounds.refixUsers(this.valueSliderNodes(), fieldKey, m);
      }
      if (!scanApplies({ current: this.rangeScan === job, aborted: job.ctrl.signal.aborted, reachable: this.mapReachable(job), sameMapping: map.mapping === job.mapping })) return;
      // 성분(X·Y·Z)이면 '모두 같음' 하한 = float32 정밀도 × 읽은 모든 시점의 벡터 크기 최대 (같은 배열을 읽으며 함께 셈 — rangeScan.ts minMaxMapped)
      const out = scanOutcome(res, (n) => this.stepLabelOfN(n) ?? `저장 ${n}`, componentFlatFloor(job.mapping, res.magMax));
      const mr = this.mapRt(map);
      if (out.apply && out.range) {
        [map.rangeMin, map.rangeMax] = widenColorRange(out.range[0], out.range[1]);
        map.rangeMode = 'alltime';
        if (out.basis) map.rangeBasis = out.basis;
        map.fresh = false;
        mr.flat = null;
        this.refreshMapUsers(fieldKey, owner, false);
      }
      mr.note = { text: out.note, sticky: false };
    }).catch((e: unknown) => {
      if (this.rangeScan === job && !job.ctrl.signal.aborted) this.mapRt(map).note = { text: `전 시점 범위를 읽지 못했습니다. ${e instanceof Error ? e.message : String(e)}`, sticky: true };
      job.ctrl.abort(); // 일꾼 하나가 예외로 끝나도 나머지 일꾼이 남은 시점을 끝까지 내려받지 않게 (주인 없는 숨은 작업이 되지 않게)
    }).finally(() => {
      if (this.rangeScan === job) { this.rangeScan = null; this.emit(); }
    });
  }

  /**
   * 진행 중인 전 시점 범위 읽기를 멈춘다(범위는 그대로). user = [취소](안내 줄에 멈춘 자리) · component = 그 지도의 Component 를 바꿈(안내) ·
   * open = 다른 데이터 열기(안내 — 열기가 실패해 옛 데이터가 남을 때 보인다) · silent = 장면 읽기·Range 입력·범위를 바꾼 다른 Rescale·다른 지도의 단추
   * (그 지도에 따로 적음)·지도에 닿을 수 없음(안내 없음). 멈춤 안내는 자동으로 범위가 정해져도 남는다(MapNote.sticky). 알리지 않는다 — 부른 쪽이 emit
   */
  private cancelRangeScan(reason: 'user' | 'component' | 'open' | 'silent'): void {
    const job = this.rangeScan;
    if (!job) return;
    job.ctrl.abort();
    this.rangeScan = null;
    const text = reason === 'user' ? `전 시점 범위 읽기를 멈췄습니다 (${job.done} / ${job.total}). 범위는 그대로입니다.`
      : reason === 'component' ? 'Component 를 바꿔 전 시점 범위 읽기를 멈췄습니다.'
        : reason === 'open' ? '다른 데이터를 여느라 전 시점 범위 읽기를 멈췄습니다.' : '';
    if (text) this.mapRt(job.map).note = { text, sticky: true };
  }

  /** 대상의 지도가 지금 전 시점 범위를 읽는 중이면 진행 (편집기의 진행 줄 · Color Map 목록 줄). 아니면 null */
  rangeScanFor(target: ColorTarget): { done: number; total: number; failed: number; text: string } | null {
    const j = this.rangeScan;
    if (!j || this.resolveMap(target)?.map !== j.map) return null;
    return { done: j.done, total: j.total, failed: j.failed, text: scanProgressText(j.done, j.total, j.failed, j.wholeFiles) };
  }

  /** 편집기의 [취소]: 대상의 지도가 읽는 중이면 멈춘다 (범위는 그대로, 안내 줄에 멈춘 자리) */
  stopRangeScan(target: ColorTarget): void {
    const j = this.rangeScan;
    if (!j || this.resolveMap(target)?.map !== j.map) return;
    this.cancelRangeScan('user');
    this.emit();
  }

  /** 대상 지도의 안내 줄 (Rescale 결과 — 못 읽은 시점·멈춤·값이 모두 같아 안 바꿈 등). 범위가 바뀌면 비워진다 */
  colorMapNote(target: ColorTarget): string {
    const r = this.resolveMap(target);
    return r ? this.mapRuntime.get(r.map)?.note.text ?? '' : '';
  }

  /** 대상 지도가 아직 범위를 정하지 않았고 마지막으로 그린 값이 모두 같았으면 그 범위 (Range 칸·Opacity 곡선 축에 '모두 0'). 아니면 null */
  colorMapFlat(target: ColorTarget): Range | null {
    const r = this.resolveMap(target);
    return r?.map.fresh ? this.mapRuntime.get(r.map)?.flat ?? null : null;
  }

  /** Color Map 상태 줄: 범위가 왜 그 값인지 (core/colorRange.ts rangeStateText) */
  colorRangeState(target: ColorTarget): string {
    const r = this.resolveMap(target);
    if (!r) return '';
    const m = r.map;
    return rangeStateText({
      fresh: !!m.fresh, mode: m.rangeMode, modeLabel: RANGE_MODE_LABEL[m.rangeMode], basis: m.rangeBasis,
      flat: m.fresh ? this.mapRuntime.get(m)?.flat ?? null : null, unit: this.unitFor(r.fieldKey),
      stepLabelOf: (n) => this.stepLabelOfN(n), stepCount: this.stepCount(),
    });
  }

  /**
   * 다시 계산한 노드의 색: 칠할 값의 범위(range)를 기록하고 그 지도에서 할 일을 정해(core/colorRange.ts rebuildDecision) 적용한다.
   * - 미정 지도: 이 노드 + 같은 지도로 칠하는 다른 노드 가운데 지금 시점에서 이미 계산된 보이는 것들(같은 차례에 계산됐다가 다시 칠하라고 표시된 것 포함)의 합.
   *   값이 없으면 기다리고, 모두 같으면 정하지 않고(화면 '모두 0' — mapRuntime.flat, 칠하기는 가운데 기준 임시 범위), 서로 다르면 정한다.
   *   Component 를 바꾼 그 장면에서 정했으면 근거 '데이터 범위', 아니면 '자동 · … 값으로 정함'.
   * - 이 차례(passId)에 막 정해진 지도: 뒤에 계산되는 노드의 값으로 넓힌다 — 처음 범위가 트리 순서에 매이지 않게.
   * - 그 밖: 'Apply' 뒤(growPending)이고 자동 넓히기면 넓히기만(ParaView 'Grow and update on Apply' — 저장 시점을 바꿀 때는 넓히지 않는다). 모두 같은 값은 쓰지 않는다.
   * 범위가 바뀌면 같은 지도를 쓰는 다른 노드도 다시 칠한다. 돌려주는 값은 적용한 뒤의 색 기준.
   */
  private colorForRebuild(id: string, c: LayerColor, range: [number, number] | null): ColorState {
    const rt = this.runtime.get(id);
    if (rt) { rt.valueRange = range; rt.computedPass = this.passId; }
    const m = this.mapOf(c);
    const mr = this.mapRt(m);
    const owner = c.separate ? this.coloringOwner(id) : null;
    const others: Range[] = [];
    if (m.fresh) {
      for (const uid of this.mapUsers(c.fieldKey, owner)) {
        const u = uid === id ? null : this.runtime.get(uid);
        if (u?.valueRange && joinsFirstRange({ hasRange: true, visible: this.nodeVisible(uid), dirty: u.dirty, computedThisPass: u.computedPass === this.passId })) others.push(u.valueRange);
      }
    }
    const act = rebuildDecision({ fresh: !!m.fresh, min: m.rangeMin, max: m.rangeMax, settledThisPass: mr.settledPass === this.passId, growPending: !!rt?.growPending, autoGrow: m.autoGrow },
      range, others, this.flatFloor(c.fieldKey, m.mapping));
    let next: Range | null = null;
    switch (act.kind) {
      case 'wait': mr.flat = null; break;
      case 'flat': mr.flat = act.flat; next = act.paint; break;
      case 'set': {
        const dataBasis = m.rangeMode === 'data' && mr.componentStep === this.stepIndex;
        if (!dataBasis) m.rangeMode = 'grow';
        m.rangeBasis = { kind: dataBasis ? 'data' : 'first', n: this.currentStepN() };
        m.fresh = false;
        // 지난 Rescale 결과 글은 그때 범위에 대한 것이라 지우고, 전 시점 범위 읽기를 멈춘 까닭(예: Component 를 바꿔 멈춤)은 남긴다
        Object.assign(mr, { flat: null, componentStep: null, settledPass: this.passId, note: noteAfterAutoRange(mr.note) });
        next = widenColorRange(act.range[0], act.range[1]);
        break;
      }
      case 'widen': next = widenColorRange(act.range[0], act.range[1]); break; // 근거는 처음 정한 그대로
      case 'grow':
        m.rangeMode = 'grow';
        m.rangeBasis = { kind: 'grow', n: this.currentStepN() };
        mr.note = noteAfterAutoRange(mr.note);
        next = widenColorRange(act.range[0], act.range[1]);
        break;
      default: break;
    }
    if (next && (next[0] !== m.rangeMin || next[1] !== m.rangeMax || act.kind === 'set')) {
      m.rangeMin = next[0]; m.rangeMax = next[1];
      this.refreshMapUsers(c.fieldKey, owner, false, id, act.kind === 'flat');
    }
    if (rt) rt.growPending = false;
    return this.specOf(c);
  }

  colorAtSpec(spec: ColorState, value: number, bands = 0): RGB {
    let t = (value - spec.rangeMin) / Math.max(spec.rangeMax - spec.rangeMin, 1e-12);
    t = Math.min(1, Math.max(0, t));
    if (bands > 0) t = (Math.min(bands - 1, Math.floor(t * bands)) + 0.5) / bands;
    return colormapLinear(spec.colormap, t);
  }

  // ---- 레벨별 격자 값 / 샘플러 ----
  private levelValues(l: LevelData, key: string | null, mapping: VectorMapping): Float32Array | null {
    if (!l.grid || !key) return null;
    const [kind, ...rest] = key.split(':');
    const name = rest.join(':');
    if (kind === 'scalar') return l.grid.scalars.get(name) ?? null;
    const vec = l.grid.vectors.get(name);
    if (!vec) return null;
    const ck = `${l.name}|${name}|${mapping}`;
    let arr = this.gridCache.get(ck);
    if (!arr) {
      const n = l.grid.count;
      arr = new Float32Array(n);
      const comp = mapping === 'x' ? 0 : mapping === 'y' ? 1 : 2;
      for (let i = 0; i < n; i++) {
        arr[i] = mapping === 'magnitude' ? Math.hypot(vec[i * 3], vec[i * 3 + 1], vec[i * 3 + 2]) : vec[i * 3 + comp];
      }
      this.gridCache.set(ck, arr);
    }
    return arr;
  }

  scalarSampler(key: string | null, mapping: VectorMapping): ScalarSampler | null {
    const list: { grid: NonNullable<LevelData['grid']>; field: Float32Array }[] = [];
    for (const l of this.levels) {
      const field = this.levelValues(l, key, mapping);
      if (l.grid && field) list.push({ grid: l.grid, field });
    }
    return list.length ? scalarSamplerFor(list) : null;
  }

  vectorSampler(name: string | null): VectorSampler | null {
    if (!name) return null;
    const list: { grid: NonNullable<LevelData['grid']>; field: Float32Array }[] = [];
    for (const l of this.levels) {
      const field = l.grid?.vectors.get(name);
      if (l.grid && field) list.push({ grid: l.grid, field });
    }
    return list.length ? vectorSamplerFor(list) : null;
  }

  /**
   * 셀 범위: 데이터 범위(셀 중심) ± 가장 굵은 레벨 간격의 절반. 새 Box Clip·얇은 층 Box 의 기본 상자로 쓴다 — 데이터 범위 그대로면
   * 격자 복원의 간격 반올림으로 끝 셀 중심이 범위를 조금 넘어 마지막 셀 층이 빠지고, 범위 끝에 놓인 Slice 가 상자 면과 겹친다.
   */
  cellBounds(): Bounds {
    const b = this.dataset?.bounds ?? { min: [0, 0, 0] as [number, number, number], max: [1, 1, 1] as [number, number, number] };
    const h = Math.max(this.dataset?.spacing ?? 0, ...this.levels.map((lv) => lv.spacing)) / 2;
    return { min: [b.min[0] - h, b.min[1] - h, b.min[2] - h], max: [b.max[0] + h, b.max[1] + h, b.max[2] + h] };
  }

  /**
   * Volume 의 Scalar Opacity Unit Distance 기본값 — ParaView 도메인 규칙(vtkSMBoundsDomain): 경계 대각선 ÷ ∛(셀 수).
   * 대략 셀 한 칸 크기다. 경계는 데이터 전체(셀 중심 범위), 셀 수는 우리가 불러온 셀(고체·건물 셀과 고운 레벨이 덮은 굵은 셀은 빠짐).
   * PV와 다름: PV 는 그 표현의 입력(잘렸으면 잘린 결과)의 경계와 입력 셀 수를 쓴다. 경계가 0 이면 1(PV 와 같음).
   */
  volumeUnitDefault(): number {
    const ds = this.dataset;
    if (!ds) return 1;
    const b = ds.bounds;
    const diag = Math.hypot(b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2]);
    return diag > 0 && ds.count > 0 ? diag / Math.cbrt(ds.count) : 1;
  }

  /** 콘솔 확인용(app.debugVolumeLevels()): Volume 을 색 대신 고른 레벨 번호로 칠한다 — 레벨이 공간을 겹치지 않게 나눠 갖는지 본다. false 로 끈다 */
  debugVolumeLevels(on = true): void {
    VolumeRenderer.levelDebug = on;
    for (const r of this.dataRenderers()) r.volume.syncLevelDebug();
  }

  /**
   * Volume 3D 텍스처 한계: 한 변(GPU 의 MAX_3D_TEXTURE_SIZE — three 에 없어 직접 읽는다. 처음 Volume 을 그릴 때 한 번 읽어 콘솔에 남긴다)과
   * 노드의 칸 수 합(VOLUME_MAX_TEXELS). 넘는 레벨은 줄여 올린다(rebuildVolume). debugVolumeTextureLimit 로 덮어쓴 값이 있으면 그것
   */
  private volumeLimits(): { size: number; texels: number } {
    if (!this.max3DTextureSize) {
      const gl = this.renderer.getContext() as WebGL2RenderingContext;
      const v = Number(gl.getParameter(gl.MAX_3D_TEXTURE_SIZE));
      this.max3DTextureSize = v > 0 ? v : 256; // 못 읽으면(컨텍스트 손실 등) WebGL2 가 보장하는 최소값
      console.info(`[Volume] MAX_3D_TEXTURE_SIZE = ${v} — 레벨의 가장 긴 변이 이보다 크면 정수배로 묶어 줄여 올립니다`);
    }
    return { size: this.volumeLimitOverride.size ?? this.max3DTextureSize, texels: this.volumeLimitOverride.texels ?? VOLUME_MAX_TEXELS };
  }

  /**
   * 콘솔 확인용(app.debugVolumeTextureLimit(256)): 3D 텍스처 한 변 한계를 GPU 값 대신 size 로 강제해 줄여 올리기를 시험한다. texels 를 주면 노드 칸 수 한계도
   * (app.debugVolumeTextureLimit(null, 1e6)). 인자 없이 부르면 GPU 값·기본 한계로 돌아간다. Volume 으로 그리는 노드를 다시 계산한다
   */
  debugVolumeTextureLimit(size: number | null = null, texels: number | null = null): void {
    this.volumeLimitOverride = { size: size && size > 0 ? Math.floor(size) : null, texels: texels && texels > 0 ? Math.floor(texels) : null };
    for (const [id, rt] of this.runtime) if (rt.renderer instanceof DataViewRenderer && this.nodeView(id)?.representation === 'volume') rt.dirty = true;
    const lim = this.volumeLimits();
    console.info(`[Volume] 한 변 한계 ${lim.size} · 노드 텍스처 칸 수 한계 ${lim.texels.toLocaleString('ko-KR')}`);
    this.countDirty = true;
    this.emit();
  }

  /** 볼륨 노드를 Surface(셀 바깥 면)로 그릴 수 있는지: 모든 레벨에 격자가 있어야 한다. 아니면 Surface 대신 Points */
  canDrawSurface(): boolean { return this.levels.length > 0 && this.levels.every((lv) => lv.grid); }

  /** 노드를 실제로 Volume 으로 그리는지 (Opacity 곡선이 화면에 쓰이는지). Volume 이어도 격자가 없으면 점으로 대신 그리므로 false — rebuildData 의 surfaceFallback 과 같은 조건 */
  drawsVolume(id: string): boolean { return this.nodeView(id)?.representation === 'volume' && this.canDrawSurface(); }

  finestSpacing(): number { return this.levels[0]?.spacing ?? this.dataset?.spacing ?? 1; }

  // ---- 노드 트리 ----
  /** Clip·Threshold 노드인지 (Clip·Threshold — 어느 노드 아래에도 붙는다) */
  isFilterNode(l: Layer): l is FilterLayer { return isFilterType(l.type); }
  parentOf(id: string): Layer | null { const l = this.layerById(id); return l?.parentId ? this.layerById(l.parentId) : null; }
  /** 바로 아래 자식들 (id = null 이면 데이터 바로 아래 노드들) */
  childrenOf(id: string | null): Layer[] { return this.layers.filter((l) => l.parentId === id); }
  /** 자손 전부 (깊이 우선, 트리 순서) */
  descendantsOf(id: string): Layer[] {
    const out: Layer[] = [];
    const walk = (pid: string) => { for (const c of this.childrenOf(pid)) { out.push(c); walk(c.id); } };
    walk(id);
    return out;
  }
  /** 가장 가까운, Clip·Threshold 가 아닌 조상(자기 포함). Slice·Isosurface·Streamline·Glyph 노드면 자기 자신, 볼륨 노드면 null(데이터) */
  sourceOf(id: string): ViewLayer | null {
    const seen = new Set<string>();
    let cur = this.layerById(id);
    while (cur && this.isFilterNode(cur) && !seen.has(cur.id)) { seen.add(cur.id); cur = cur.parentId ? this.layerById(cur.parentId) : null; }
    return cur && !this.isFilterNode(cur) ? (cur as ViewLayer) : null;
  }
  /** 노드 출력 종류. null = 데이터 = volume. Clip·Threshold 는 입력과 같은 종류 */
  outputKind(id: string | null): OutputKind {
    if (id === null || id === ROOT_ID) return 'volume';
    const src = this.sourceOf(id);
    return src ? viewOutputKind(src.type) : 'volume';
  }
  /** 볼륨 노드 id (데이터 ROOT_ID 를 맨 앞에, 그다음 트리 순서) */
  volumeNodeIds(): string[] {
    return [ROOT_ID, ...this.layers.filter((l) => this.isFilterNode(l) && this.outputKind(l.id) === 'volume').map((l) => l.id)];
  }
  /** type 노드를 parentId(null = 데이터) 아래에 붙일 수 있는지: Clip·Threshold 는 어디든, Slice·Isosurface·Streamline·Glyph 노드는 볼륨 노드 아래만 */
  canAttach(type: LayerType, parentId: string | null): boolean {
    if (parentId !== null && !this.layerById(parentId)) return false;
    return isFilterType(type) || this.outputKind(parentId) === 'volume';
  }
  /** 상위를 바꿀 수 있는지: 자기·자기 자손은 금지, 자기 종류 규칙, 옮긴 뒤에도 자손 전부가 규칙에 맞아야 한다 */
  canReparent(id: string, parentId: string | null): boolean {
    const l = this.layerById(id);
    if (!l) return false;
    if (parentId !== null && (parentId === id || this.descendantsOf(id).some((d) => d.id === parentId))) return false;
    if (!this.canAttach(l.type, parentId)) return false;
    const old = l.parentId;
    l.parentId = parentId; // 잠시 옮겨 놓고 자손을 검사한 뒤 되돌린다
    const ok = this.descendantsOf(id).every((d) => this.canAttach(d.type, d.parentId));
    l.parentId = old;
    return ok;
  }
  /** Clip·Threshold 노드 자기 자신을 사슬 항목으로 (Slice·Isosurface·Streamline·Glyph 노드면 null) */
  private filterItem(l: Layer): ChainItem | null {
    if (l.type === 'clip') return { kind: 'clip', params: l.params, id: l.id };
    if (l.type === 'threshold') return { kind: 'threshold', params: l.params, id: l.id };
    return null;
  }
  /** 노드의 조상 Clip·Threshold 를 뿌리→잎 순서로 */
  chainOf(id: string): ChainItem[] {
    const chain: ChainItem[] = [];
    const seen = new Set<string>([id]);
    let l = this.layerById(id);
    while (l && l.parentId && !seen.has(l.parentId)) {
      seen.add(l.parentId);
      const p = this.layerById(l.parentId);
      if (!p) break;
      const item = this.filterItem(p);
      if (item) chain.unshift(item);
      l = p;
    }
    return chain;
  }
  /** 노드 자기 표현에 거는 사슬: 조상 Clip·Threshold + (Clip·Threshold 노드면) 자기 자신. 데이터는 빈 사슬 */
  renderChainOf(id: string): ChainItem[] {
    if (id === ROOT_ID) return [];
    const chain = this.chainOf(id);
    const l = this.layerById(id);
    const own = l ? this.filterItem(l) : null;
    if (own) chain.push(own);
    return chain;
  }
  /** 사슬의 Clip 들 (clippingPlanes 는 이 가운데 GPU 로 걸 수 있는 것만 쓴다 — clipping.ts) */
  private clipsOf(chain: ChainItem[]): ClipParams[] {
    const out: ClipParams[] = [];
    for (const c of chain) if (c.kind === 'clip') out.push(c.params);
    return out;
  }
  /** 사슬의 GPU Clip(Plane·안을 남기는 Box)이 자리를 남기는지. 그리기는 clippingPlanes 가 하지만 색 범위에는 보이는 부분만 넣으려고 쓴다. 없으면 null */
  private gpuKeeper(chain: ChainItem[]): ((x: number, y: number, z: number) => boolean) | null {
    const g = this.clipsOf(chain).filter(isGpuClip);
    return g.length ? (x, y, z) => g.every((c) => clipKeeps(c, x, y, z, NaN)) : null;
  }
  /**
   * 사슬을 면·선 판정용으로 (ChainProbes). Field 가 데이터에 없으면 그 Scalar Clip·Threshold 는 통과이므로 뺀다.
   * 샘플이 NaN(격자 밖)이면 통과 — 격자 밖 처리는 각 노드가 따로 한다.
   */
  private probesOf(chain: ChainItem[]): ChainProbes {
    const cpu: ChainProbes['cpu'] = [], thr: ChainProbes['thr'] = [];
    for (const it of chain) {
      if (it.kind === 'clip') {
        const c = it.params;
        if (isGpuClip(c)) continue;
        if (c.clipType === 'box') { cpu.push((x, y, z) => clipKeeps(c, x, y, z, NaN)); continue; }
        const sample = this.hasGrid ? this.scalarSampler(c.fieldKey, c.mapping) : null;
        if (sample) cpu.push((x, y, z) => { const v = sample(x, y, z); return v !== v || clipKeeps(c, x, y, z, v); });
      } else {
        const sample = this.hasGrid ? this.scalarSampler(it.params.fieldKey, it.params.mapping) : null;
        if (sample) thr.push({ t: it.params, sample });
      }
    }
    return { cpu, thr };
  }
  /** 자리 (x,y,z) 가 probes 의 CPU Clip 과 Threshold 를 모두 통과하는지 (입력 쪽 판정: 꼭짓점 값 지우기·무게중심·적분 멈춤) */
  private passesProbes(p: ChainProbes, x: number, y: number, z: number, withThresholds = true): boolean {
    for (const f of p.cpu) if (!f(x, y, z)) return false;
    if (withThresholds) for (const { t, sample } of p.thr) { const v = sample(x, y, z); if (v === v && !thresholdKeeps(t, v)) return false; }
    return true;
  }
  /**
   * 출력 쪽 Threshold 로 요소(삼각형·유선) 하나를 남길지 (ParaView vtkThreshold: 셀 통째). Threshold 마다 구간 조건을 꼭짓점에서 보고
   * All Scalars 켬 = 모두 통과, 끔 = 하나라도 통과로 묶은 뒤, 마지막에 Invert 로 한 번 뒤집는다(그래서 Invert 는 정확히 나머지 절반).
   * 꼭짓점 k 의 자리는 at(k). 샘플이 NaN(격자 밖)인 꼭짓점은 빼고 보며, 모두 NaN 이면 그 Threshold 는 통과로 친다.
   */
  private keepsElement(thr: ChainProbes['thr'], count: number, at: (k: number) => [number, number, number]): boolean {
    for (const { t, sample } of thr) {
      let any = false, all = true, valid = 0;
      for (let k = 0; k < count; k++) {
        const [x, y, z] = at(k);
        const v = sample(x, y, z);
        if (v !== v) continue;
        valid++;
        if (thresholdBand(t, v)) any = true; else all = false;
      }
      if (!valid) continue;
      const pass = t.allScalars ? all : any;
      if (t.invert ? pass : !pass) return false;
    }
    return true;
  }
  /**
   * 면·선·Glyph 모양을 그리는 노드의 사슬을 둘로 나눈다. input = 모양을 만드는 노드(sourceOf)의 조상 Clip·Threshold(볼륨에 걸림),
   * output = 그 노드 아래에서 이 노드까지(만든 모양에 걸림). ParaView 처럼 순서에 따라 뜻이 다르다: 예) Threshold → Streamline 은
   * 남은 셀 안에서만 적분하고, Streamline → Threshold 는 유선을 한 줄 통째로 남기거나 뺀다.
   */
  private splitChain(id: string): { input: ChainItem[]; output: ChainItem[] } {
    const src = this.sourceOf(id);
    const input = src ? this.chainOf(src.id) : [];
    return { input, output: this.renderChainOf(id).slice(input.length) };
  }
  /** 노드와 그 자손을 다시 계산 표시 */
  private markSubtree(id: string): void {
    this.markLayer(id);
    for (const d of this.descendantsOf(id)) this.markLayer(d.id);
  }
  /** Slice·Isosurface·Streamline 모양의 렌더러에 사슬의 Clip 을 clippingPlanes 로 (다시 계산 없이) */
  private applyChainClips(id: string, rt: LayerRuntime): void {
    const r = rt.renderer;
    if (r instanceof DataViewRenderer || r instanceof VectorGlyphs) return;
    r.setClips(this.clipsOf(this.renderChainOf(id)));
  }
  /** 노드가 보이는지 (데이터 ROOT_ID 포함) */
  nodeVisible(id: string): boolean { return id === ROOT_ID ? this.root.visible : this.layerById(id)?.visible ?? false; }
  /** 볼륨 노드(데이터 포함)의 표현 설정. 면·선·Glyph 위의 Clip·Threshold 노드와 Slice·Isosurface·Streamline·Glyph 노드는 null */
  nodeView(id: string): DataView | null {
    if (id === ROOT_ID) return this.root.view;
    const l = this.layerById(id);
    return l && this.isFilterNode(l) && this.outputKind(l.id) === 'volume' ? l.view : null;
  }

  /**
   * 위치 표시(테두리·면·화살표) 우선순위: 고른 Clip 노드 → Plane 은 평면과 남는 쪽 화살표, Box 는 상자 테두리 · 고른 Slice / Glyph(평면 위) → 그 평면 ·
   * 고른 Streamline → 시작면(시작점·추적 방향) · 그 외 없음
   */
  private updateGizmo(): void {
    if (!this.dataset || !this.display.planeFrame) { this.planeGizmo.update(null); return; }
    const sel = this.selectedLayer();
    if (sel && sel.type === 'clip') {
      const c = sel.params, b = this.dataset.bounds;
      if (c.clipType === 'plane') this.planeGizmo.update({ bounds: b, axis: c.axis, position: c.position, mode: 'clip', keepPositive: !c.invert }); // 화살표 = 남는 쪽
      else if (c.clipType === 'box') this.planeGizmo.update({ bounds: b, axis: 0, position: 0, mode: 'box', keepPositive: true, clipBox: { min: c.boxMin, max: c.boxMax } });
      else this.planeGizmo.update(null); // Scalar 는 자리 표시가 없다
      return;
    }
    if (sel && (sel.type === 'slice' || (sel.type === 'glyph' && sel.params.mode === 'plane'))) {
      this.planeGizmo.update({ bounds: this.dataset.bounds, axis: sel.params.axis, position: sel.params.position, mode: 'slice', keepPositive: true });
      return;
    }
    if (sel && sel.type === 'stream') {
      const box = this.seedBoxFor(sel.params);
      if (box) {
        const seeds = this.streamSeeds(sel.params);
        this.planeGizmo.update({
          bounds: box, axis: sel.params.seedAxis, position: sel.params.seedPos, mode: 'seed', keepPositive: true,
          seeds, flowDir: this.meanFlowAt(seeds, sel.params.fieldName), direction: sel.params.direction,
        });
        return;
      }
    }
    this.planeGizmo.update(null);
  }

  // ---- 노드 ----
  selectedLayer(): Layer | null { return this.layers.find((l) => l.id === this.selectedLayerId) ?? null; }
  layerById(id: string): Layer | null { return this.layers.find((l) => l.id === id) ?? null; }

  /**
   * 새 노드의 기본값: 데이터 범위·기본 평면·시작면 설정(datasets.json의 view)에서 정한다.
   * Clip·Threshold 는 ParaView GUI 기본값(layers.ts defaultClip·defaultThreshold): Plane 데이터 가운데·법선 +X·Invert 켬, Scalar·Threshold 는 기본 배열의 값 범위 전체.
   * colorField = 칠할 배열 (insertLayer 가 입력 노드에서 물려받은 것, 없으면 기본 배열).
   */
  /**
   * Glyph Scale Factor 기본값 — ParaView 의 리셋 규칙(pqGlyphScaleFactorPropertyWidget): 경계 최장변 × 0.1 ÷ 크기 배열의 최대값.
   * 길이 '크기에 비례'(크기 배열 = 벡터 크기)면 가장 큰 벡터의 화살표가 최장변의 10% 길이가 된다. '일정'(PV 'No scale array')이면 나누지 않아
   * 모든 화살표가 최장변의 10%. 최장변이 0 이면 0.1(vtkSMBoundsDomain), 최대값이 거의 0 이면 나누지 않는다.
   * 경계는 데이터 전체(PV 는 그 Glyph 의 입력 — 잘렸으면 잘린 경계. PV와 다름).
   */
  glyphScaleDefault(fieldName: string | null, lengthMode: 'magnitude' | 'uniform' = 'magnitude'): number {
    const b = this.dataset?.bounds;
    if (!b) return 1;
    const longest = Math.max(b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2]);
    const ext = longest > 0 ? longest * 0.1 : 0.1;
    if (lengthMode === 'uniform') return ext;
    const max = this.vectorMaxMagnitude(fieldName);
    return ext / (max < 1e-9 ? 1 : max);
  }

  /** 벡터 크기의 최대값 (결측 표시값은 빼고 — 최대값이 결측 표시값이면 98% 값) */
  private vectorMaxMagnitude(fieldName: string | null): number {
    const st = this.dataset?.vectors.find((v) => v.name === fieldName)?.stats.magnitude;
    if (!st) return 1;
    return st.max < 1e29 ? st.max : st.p98;
  }

  private defaultParams(type: LayerType, colorField: string | null = this.defaultFieldKey): LayerParams {
    const b = this.dataset?.bounds ?? { min: [0, 0, 0], max: [1, 1, 1] };
    const v = this.lastView;
    const spacing = this.finestSpacing();
    const axis = (v.sliceAxis ?? 2) as Axis;
    const position = resolvePlanePosition(b, axis, v.slicePosition ?? 'min');
    // Glyph·Streamline 의 기본 벡터 = Field 목록의 첫 벡터 (결과 폴더는 헤더 목록 — 아직 읽지 않은 배열이면 읽은 뒤 Scale Factor 를 다시 정한다, deferNewDefaults)
    const vec = this.fieldOptions().find((o) => o.kind === 'vector');
    const firstVector = vec ? arrayNameOf(vec.key) : null;
    switch (type) {
      case 'clip': return defaultClip(this.cellBounds(), this.defaultFieldKey, this.colorMapOf(this.defaultFieldKey).mapping, this.currentStats());
      case 'threshold': return defaultThreshold(this.defaultFieldKey, this.colorMapOf(this.defaultFieldKey).mapping, this.currentStats());
      case 'slice':
        return {
          axis, position, surface: true, lines: true, levels: 10, resolution: 2, opacity: 1, banded: false, lineColor: 'black', lineWidth: 1, lineOpacity: 0.55, clipToObjects: true,
          color: defaultLayerColor(colorField),
        };
      case 'glyph':
        // 배치·크기는 ParaView Glyph 기본값(명세 §4.6): 균일 샘플 5000곳, Scale Factor = 최장변 × 0.1 ÷ 벡터 크기 최대값
        return {
          fieldName: firstVector, mode: 'uniform', maxSamples: 5000, axis, position, stride: 4, scaleFactor: this.glyphScaleDefault(firstVector),
          color: 'white', lengthMode: 'magnitude', fieldColor: defaultLayerColor(colorField),
        };
      case 'stream': {
        const seedAxis = (v.seedAxis ?? 0) as Axis;
        const seedBox = v.seedBounds === 'finest' && this.levels.length ? this.levels[0].dataset.bounds : b;
        const diag = Math.hypot(b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2]);
        return {
          fieldName: firstVector, seedAxis, seedPos: v.seedPos ?? seedBox.min[seedAxis] + spacing, seedBounds: v.seedBounds ?? 'data',
          // 방향·최대 길이는 ParaView Stream Tracer 기본값(명세 §4.5): BOTH, 최대 길이 = 경계 대각선(한 방향마다)
          nU: 14, nV: 6, vFrac: v.seedVFrac ?? 0.5, direction: 'both', maxLength: diag,
          shape: 'line', width: 2, widthUnits: 'px', meshWidth: spacing * 0.5, sides: 4, ribbonDir: 'horizontal',
          opacity: 1, dash: 'solid', color: 'field', solidColor: '#f2f2f2', fieldColor: defaultLayerColor(colorField),
        };
      }
      case 'iso': {
        const st = this.currentStats();
        return { fieldKey: this.defaultFieldKey, value: (st.p2 + st.p98) / 2, colorMode: 'solid', solidColor: '#2dd4bf', opacity: 0.85, fieldColor: defaultLayerColor(colorField) };
      }
    }
  }

  /**
   * 노드를 더한다(메뉴). parentId = 붙일 자리(null = 데이터 바로 아래). 자리는 부르는 쪽이 정한다 — 트리에서 누른 자리(맨 아래 '레이어 추가' 줄 = 데이터,
   * 노드 줄의 더하기 = 그 노드). 고른 노드는 보지 않는다(2026-10-14 결정: 고른 노드에 따라 붙는 곳이 달라지는 숨은 규칙을 없앰).
   * 붙일 수 없는 상위면 붙일 수 있는 가장 가까운 조상으로 간다. 만든 뒤 ParaView 규칙대로 입력 노드를 숨긴다(hideInputIfRequired).
   * 장면 불러오기·복제는 insertLayer 를 직접 쓰므로 입력을 숨기지 않는다.
   */
  addLayer(type: LayerType, patch?: LayerPatch, select = true, parentId: string | null = null): Layer {
    const layer = this.insertLayer(type, patch, parentId);
    this.deferNewDefaults(layer, Object.keys(patch ?? {})); // patch 로 직접 준 값(Lower·Upper 등)은 배열이 온 뒤에도 덮지 않는다
    this.hideInputIfRequired(layer);
    if (select) this.selectedLayerId = layer.id;
    this.updateGizmo();
    this.emit();
    return layer;
  }

  /**
   * ParaView pqApplyBehavior::hideInputIfRequired 와 같은 규칙 (필터 XML 힌트 replace_input).
   * Glyph(replace_input = 0)는 입력을 숨기지 않는다. Slice·Clip·Threshold·Isosurface·Streamline(= 2)은 입력이 Surface 로 보이고
   * Opacity 가 1(또는 0)일 때만 숨긴다 — 그래서 Outline 으로 보이는 데이터 아래에 Slice 를 만들어도 테두리 상자는 남는다.
   * 면·선·Glyph(Slice·Isosurface·Streamline·Glyph 노드와 그 위의 Clip·Threshold 노드)는 ParaView 에서 Surface 표현이므로 그 Opacity 로 본다.
   */
  private hideInputIfRequired(layer: Layer): void {
    if (layer.type === 'glyph') return;
    const pid = layer.parentId;
    const view = this.nodeView(pid ?? ROOT_ID);
    let opacity: number | null; // Surface 로 보일 때의 Opacity (Surface 가 아니면 null)
    if (view) opacity = view.representation === 'surface' ? view.opacity : null;
    else {
      const src = pid ? this.sourceOf(pid) : null;
      opacity = !src ? null : src.type === 'glyph' ? 1 : src.params.opacity;
    }
    if (opacity === null || (opacity > 0 && opacity < 1)) return;
    if (pid) this.setLayerVisible(pid, false); else this.setRootVisible(false);
  }

  /**
   * 노드 하나를 트리에 넣는다 (입력 숨김·선택·emit 없음). 붙일 수 없는 상위면 붙일 수 있는 가장 가까운 조상(끝내 데이터)으로.
   * 칠할 배열은 입력 노드가 배열로 칠하고 있으면 그 배열을 물려받는다(ParaView vtkInheritRepresentationProperties: "scalar coloring is inherited if possible").
   * 입력이 단색이면 기본 배열(데이터의 첫 배열)로 칠한다 — ParaView 는 이때 단색이지만, 우리 Slice 는 단색 면을 그리지 않아 배열 하나를 정해 둔다.
   * 장면 불러오기·복제는 patch 에 색칠이 들어 있어 이 값을 덮는다.
   */
  private insertLayer(type: LayerType, patch: LayerPatch | undefined, parentId: string | null): Layer {
    let pid = parentId && this.layerById(parentId) ? parentId : null;
    while (pid !== null && !this.canAttach(type, pid)) pid = this.layerById(pid)?.parentId ?? null;
    const n = this.layers.filter((l) => l.type === type).length + 1;
    const field = this.inheritedField(pid) ?? this.defaultFieldKey;
    const layer = { id: newLayerId(), type, name: `${LAYER_LABEL[type]} ${n}`, visible: true, parentId: pid, params: { ...this.defaultParams(type, field), ...(patch ?? {}) } } as Layer;
    if (this.isFilterNode(layer)) layer.view = defaultDataView('surface', field); // ParaView: Clip·Threshold 출력(비구조 격자)은 Surface 가 기본
    this.layers.splice(this.insertIndex(pid), 0, layer); // 상위의 마지막 자손 다음 — 평면 배열이 트리 순서를 유지한다
    this.createRuntime(layer);
    this.fixValueBounds(layer); // 값 밀대 끝은 만들 때 정한다(장면 JSON 의 값이 그 밖이면 끝이 값까지)
    return layer;
  }

  /** 입력 노드(pid, null = 데이터)가 배열로 칠하도록 되어 있으면 그 배열 (ParaView GetUsingScalarColoring: 표현 방식과 무관하게 칠할 배열이 정해져 있으면 참) */
  private inheritedField(pid: string | null): string | null {
    const id = pid ?? ROOT_ID;
    const view = this.nodeView(id);
    if (view) return view.color.fieldKey;
    const src = this.sourceOf(id);
    return src && usesFieldColor(src) ? layerColorOf(src)?.fieldKey ?? null : null;
  }

  /** 평면 배열에서 새 자식이 들어갈 자리: 상위의 마지막 자손 바로 다음. 상위가 없으면(데이터 바로 아래) 끝 */
  private insertIndex(parentId: string | null): number {
    const p = parentId ? this.layerById(parentId) : null;
    if (!p) return this.layers.length;
    const desc = this.descendantsOf(p.id);
    const last = desc.length ? desc[desc.length - 1] : p;
    return this.layers.indexOf(last) + 1;
  }

  /** 노드가 그릴 모양: 볼륨 위의 Clip·Threshold 노드면 data, Slice·Isosurface·Streamline·Glyph 노드면 자기 종류, 면·선·Glyph 위의 Clip·Threshold 노드면 입력(sourceOf) 종류 */
  private runtimeKindOf(l: Layer): RuntimeKind {
    const src = this.sourceOf(l.id);
    return src ? (src.type as RuntimeKind) : 'data';
  }

  private createRuntime(layer: Layer): void { this.attachRuntime(layer.id, this.runtimeKindOf(layer), layer.visible); }

  /** 데이터(root) 노드의 그리기 객체 — 데이터를 불러올 때 새로 만든다 */
  private createRootRuntime(): void {
    this.disposeRuntime(ROOT_ID);
    this.attachRuntime(ROOT_ID, 'data', this.root.visible);
  }

  /** 렌더러를 만들어 장면에 붙인다. 볼륨 노드의 Points 는 공유 속성(pointAttrs)을 붙이고 전역 Color 로 맞춘다 */
  private attachRuntime(id: string, kind: RuntimeKind, visible: boolean): void {
    let renderer: LayerRenderer;
    switch (kind) {
      case 'data': {
        const r = new DataViewRenderer(this.pointAttrs ?? emptyPointAttrs());
        r.surface.setOrtho(this.camera === this.orthoCamera);
        renderer = r;
        break;
      }
      case 'slice': { const r = new SliceRenderer(); r.setResolution(this.lastW, this.lastH); renderer = r; break; }
      case 'glyph': { const r = new VectorGlyphs(); r.setDataset(this.dataset); renderer = r; break; }
      case 'stream': { const r = new StreamlineRenderer(); r.setResolution(this.lastW, this.lastH); renderer = r; break; }
      case 'iso': renderer = new IsosurfaceRenderer(); break;
    }
    renderer.group.visible = visible;
    this.scene.add(renderer.group);
    // 새 렌더러는 처음 계산한 뒤 색 지도를 넓힌다 (ParaView: 필터를 처음 Apply). 장면을 불러올 때는 저장된 범위를 지키도록 sceneFromJSON 이 끈다
    this.runtime.set(id, { kind, renderer, dirty: true, ms: 0, lastSide: 1, stencilBit: kind === 'stream' || kind === 'slice' ? this.freeStencilBit() : -1, valueRange: null, growPending: true, computedPass: -1 });
    if (kind === 'data') this.updatePointScale();
  }

  /** 렌더러를 장면에서 떼고 버린다 */
  private disposeRuntime(id: string): void {
    const rt = this.runtime.get(id);
    if (!rt) return;
    this.runtime.delete(id);
    this.scene.remove(rt.renderer.group);
    if (rt.renderer instanceof DataViewRenderer) {
      // 다른 볼륨 노드가 공유 속성을 아직 쓰면 'keep'(떼어내고 자기 것만 버림), 마지막이면 'free'(공유 속성의 GPU 버퍼까지 지움)
      rt.renderer.dispose(this.dataRenderers().length ? 'keep' : 'free');
    } else rt.renderer.dispose(); // 형상·재질·텍스처까지 (상위를 바꿔 렌더러를 새로 만들 때도 여기를 지난다)
  }

  /** 상위가 바뀐 노드들의 그릴 모양이 달라졌으면 렌더러를 새로 만든다 (예: Slice 를 지워 그 아래 Clip 이 볼륨 위로 올라옴) */
  private refreshRuntimeKinds(nodes: Layer[]): void {
    for (const l of nodes) {
      const rt = this.runtime.get(l.id);
      if (rt && rt.kind === this.runtimeKindOf(l)) continue;
      this.disposeRuntime(l.id);
      this.createRuntime(l);
    }
  }

  /**
   * 노드를 지운다. 자식들은 지운 노드의 상위로 올라간다 (사슬·그릴 모양이 바뀔 수 있으므로 렌더러를 맞추고 다시 계산).
   * 노드 화면은 자식이 있으면 이것을 부르지 않고 removeSubtree('하류까지 삭제')를 쓴다(명세 §1). 자식을 올리는 동작은 다른 호출을 위해 남겨 둔다.
   * 올라간 자식은 늘 규칙에 맞는다: Slice·Isosurface·Streamline·Glyph 노드의 자식은 Clip·Threshold 노드뿐이고, 볼륨 노드의 상위는 볼륨이다.
   * ParaView(pqDeleteReaction::aboutToDelete)와 같이: 지운 노드가 골라져 있었으면 입력(상위, 없으면 데이터)을 고르고,
   * 지운 노드가 보이고 있었으면 입력을 다시 보이게 한다 (만들 때 자동으로 숨긴 입력이 되살아난다).
   */
  removeLayer(id: string): void {
    const l = this.layerById(id);
    if (!l) return;
    const kids = this.childrenOf(id);
    for (const c of kids) c.parentId = l.parentId;
    this.disposeRuntime(id);
    this.valueBounds.delete(id);
    this.layers = this.layers.filter((x) => x.id !== id);
    for (const c of kids) { this.refreshRuntimeKinds([c, ...this.descendantsOf(c.id)]); this.markSubtree(c.id); }
    if (l.visible) { if (l.parentId) this.setLayerVisible(l.parentId, true); else this.setRootVisible(true); }
    if (this.selectedLayerId === id) this.selectedLayerId = l.parentId;
    this.countDirty = true;
    this.updateGizmo();
    this.emit();
  }

  /**
   * 노드와 그 아래 전부를 지운다 (ParaView 5.11 Delete Downstream Pipeline). 노드 화면에서는 자식이 있으면 '삭제' 대신 이것을 쓴다(명세 §1).
   * 입력 되살리기는 removeLayer 와 같은 규칙: 지운 덩어리 안에 보이던 노드가 있었으면 남는 입력(상위, 없으면 데이터)을 보이게 한다 —
   * ParaView 는 하류부터 하나씩 지우며 지울 때마다 그 입력을 보이게 하므로 결국 남는 입력이 보이게 된다(pqDeleteReaction 코드를 읽고 한 추론).
   * 골라져 있던 노드가 지워지면 남는 입력을 고른다.
   */
  removeSubtree(id: string): void {
    const l = this.layerById(id);
    if (!l) return;
    const block = [l, ...this.descendantsOf(id)];
    const anyVisible = block.some((x) => x.visible);
    for (const x of block) { this.disposeRuntime(x.id); this.valueBounds.delete(x.id); }
    this.layers = this.layers.filter((x) => !block.includes(x));
    if (anyVisible) { if (l.parentId) this.setLayerVisible(l.parentId, true); else this.setRootVisible(true); }
    if (block.some((x) => x.id === this.selectedLayerId)) this.selectedLayerId = l.parentId;
    this.countDirty = true;
    this.updateGizmo();
    this.emit();
  }

  /** 노드를 전부 지운다 (데이터 노드는 남긴다) */
  private clearLayers(): void {
    for (const l of this.layers) this.disposeRuntime(l.id);
    this.layers = [];
    this.valueBounds.clear();
    this.pendingDefaults.clear();
    this.selectedLayerId = null;
    this.countDirty = true;
  }

  /** 상위를 바꾼다 (ParaView Change Input). canReparent 를 통과해야 하며, 바꾸면 그 노드(와 자손)의 그릴 모양을 맞추고 다시 계산 */
  setParent(id: string, parentId: string | null): void {
    const l = this.layerById(id);
    if (!l || l.parentId === parentId || !this.canReparent(id, parentId)) return;
    // 평면 배열에서 노드와 자손을 떼어 새 상위의 마지막 자손 다음에 옮긴다 (트리 순서 유지)
    const block = [l, ...this.descendantsOf(id)];
    this.layers = this.layers.filter((x) => !block.includes(x));
    l.parentId = parentId;
    this.layers.splice(this.insertIndex(parentId), 0, ...block);
    this.refreshRuntimeKinds(block);
    for (const x of block) this.markApplied(x.id);
    this.countDirty = true;
    this.updateGizmo();
    this.emit();
  }

  /**
   * 노드 하나를 복제한다 — 자식은 복제하지 않는다(명세 §1; ParaView 에는 복제가 없어 우리 편의). params·view 는 깊은 복사, 같은 상위의 원본 덩어리 바로 다음.
   * 원본이 배열 값을 기다리며 통계 기본값을 미뤄 두었으면(그 사이 값을 바꾸지 않았을 때) 복제본도 자기 매개변수로 새로 미룬다 — 원본만 새 Field 범위를 받고
   * 복제본은 옛 Field 의 값이 새 Field 에 남던 것(검토 반영 2026-11-06). 원본의 기본값 함수를 옮기지 않는 것은 그것이 원본 노드를 붙잡고 있을 수 있어서다
   */
  duplicateLayer(id: string): Layer | null {
    const src = this.layerById(id);
    if (!src) return null;
    const copy = { ...src, id: newLayerId(), name: `${src.name} 사본`, params: JSON.parse(JSON.stringify(src.params)) } as Layer;
    if (this.isFilterNode(copy) && this.isFilterNode(src)) copy.view = { ...src.view, color: JSON.parse(JSON.stringify(src.view.color)) }; // 색칠(Separate 지도 포함)을 원본과 나눠 쓰지 않게
    const desc = this.descendantsOf(src.id);
    this.layers.splice(this.layers.indexOf(desc.length ? desc[desc.length - 1] : src) + 1, 0, copy); // 원본의 마지막 자손 다음
    this.createRuntime(copy);
    this.fixValueBounds(copy); // 복제도 만들기 — 값 밀대 끝은 지금 알고 있는 범위로 새로 정한다
    const waiting = this.pendingDefaults.get(src.id);
    if (waiting && waiting.sig === this.defaultsSig(src)) this.deferNewDefaults(copy, (STAT_DEFAULT_KEYS[copy.type] ?? []).filter((k) => !waiting.params.includes(k)));
    this.selectedLayerId = copy.id;
    this.countDirty = true;
    this.updateGizmo();
    this.emit();
    return copy;
  }

  /** 같은 상위 안에서 형제끼리 순서를 바꾼다 (자손은 함께 움직인다) */
  moveLayer(id: string, delta: number): void {
    const l = this.layerById(id);
    if (!l) return;
    const sib = this.childrenOf(l.parentId);
    const i = sib.indexOf(l), j = i + delta;
    if (i < 0 || j < 0 || j >= sib.length) return;
    const other = sib[j];
    const blockA = [l, ...this.descendantsOf(id)], blockB = [other, ...this.descendantsOf(other.id)];
    // 형제의 덩어리(노드+자손)는 평면 배열에서 서로 붙어 있으므로, 둘을 빼고 앞에 있던 자리에 순서를 바꿔 넣는다
    const first = Math.min(this.layers.indexOf(l), this.layers.indexOf(other));
    const rest = this.layers.filter((x) => !blockA.includes(x) && !blockB.includes(x));
    const ordered = delta < 0 ? [...blockA, ...blockB] : [...blockB, ...blockA];
    this.layers = [...rest.slice(0, first), ...ordered, ...rest.slice(first)];
    this.emit();
  }

  renameLayer(id: string, name: string): void {
    const l = this.layerById(id);
    if (!l || !name.trim()) return;
    l.name = name.trim();
    this.emit();
  }

  /** 노드 자기 표현의 보이기 (자식에는 영향 없음 — ParaView 와 같음). id 가 ROOT_ID 면 데이터 노드 */
  setLayerVisible(id: string, visible: boolean): void {
    if (id === ROOT_ID) { this.setRootVisible(visible); return; }
    const l = this.layerById(id);
    if (!l) return;
    l.visible = visible;
    const rt = this.runtime.get(id);
    if (rt) rt.renderer.group.visible = visible;
    this.countDirty = true;
    this.emit();
  }

  /** 데이터(원본) 노드의 보이기 */
  setRootVisible(visible: boolean): void {
    this.root.visible = visible;
    const rt = this.runtime.get(ROOT_ID);
    if (rt) rt.renderer.group.visible = visible;
    this.countDirty = true;
    this.emit();
  }

  /**
   * 볼륨 노드(데이터는 ROOT_ID)의 표현 설정을 바꾼다. Opacity·점 크기·구 음영·Unit Distance(null = 기본값 volumeUnitDefault) 는 다시 계산 없이 바로(셰이더 상수만),
   * 표현 방식이 바뀌면 그 표현에 필요한 것만 다시 계산한다. Volume 은 늘 배열로 칠하므로 단색인 채로 고르면 새 노드 기본 배열(defaultFieldKey)로
   * 칠하고 그 지도를 넓힌다(ParaView 도 단색인 채 Volume 으로 바꾸면 배열 하나로 칠한다 — 고르는 배열만 다름). 칠할 배열이 없는 데이터면 Volume 으로 바꾸지 않는다.
   * 새 표현으로 기대는 배열을 기다리는 노드(nodeMissing — 결과 폴더에서 아직 읽는 중)는 렌더러의 표현을 바로 바꾸지 않는다: 배열이 온 뒤 다시 계산(rebuildData)이
   * 새 표현으로 바꾼다. 그동안 앞 표현의 그림이 남는다(바로 바꾸면 한 번도 계산하지 않은 표현이 보였다 — Surface·Volume 은 빈 그림, Points 는 거르지 않은 점. 검증 2026-11-06)
   */
  setNodeView(id: string, patch: Partial<DataView>): void {
    const view = this.nodeView(id);
    const rt = this.runtime.get(id);
    if (!view || !rt || !(rt.renderer instanceof DataViewRenderer)) return;
    // Unit Distance 는 양수 또는 null(기본값)만. 0·음수·숫자 아님은 버린다(칸은 emit 뒤 지금 값으로 돌아간다)
    if (patch.volumeUnitDistance !== undefined && patch.volumeUnitDistance !== null && !(patch.volumeUnitDistance > 0 && Number.isFinite(patch.volumeUnitDistance))) {
      const { volumeUnitDistance: _bad, ...rest } = patch;
      patch = rest;
    }
    let fieldPicked = false;
    if (patch.representation === 'volume' && !(patch.color ?? view.color).fieldKey) {
      if (!this.defaultFieldKey) return;
      const c = patch.color ?? view.color;
      if (c.separate) c.map = copyColorMap(this.colorMapOf(this.defaultFieldKey)); // Separate 지도는 새 배열의 공유 지도를 복사해 시작 (setNodeColoring 과 같음)
      c.fieldKey = this.defaultFieldKey;
      this.colorMapOf(c.fieldKey);
      fieldPicked = true;
    }
    const repChanged = patch.representation !== undefined && patch.representation !== view.representation;
    Object.assign(view, patch);
    const r = rt.renderer;
    r.surface.setOpacity(view.opacity);
    r.points.setPointSize(view.pointSize);
    r.points.setSphereShading(view.sphereShading);
    r.volume.setUnitDistance(view.volumeUnitDistance ?? this.volumeUnitDefault());
    if (repChanged && !this.nodeMissing(id).length) r.setRepresentation(view.representation); // 기다리는 노드는 다시 계산 때(rebuildData) — 앞 그림 유지
    if (repChanged || fieldPicked) this.markApplied(id);
    this.countDirty = true;
    this.emit();
  }

  /** 불러온 장면의 데이터 노드 설정을 렌더러에 맞춘다 */
  private syncRootRuntime(): void {
    const rt = this.runtime.get(ROOT_ID);
    if (!rt || !(rt.renderer instanceof DataViewRenderer)) return;
    rt.renderer.group.visible = this.root.visible;
    rt.renderer.setRepresentation(this.root.view.representation);
    rt.dirty = true;
  }

  selectLayer(id: string | null): void {
    this.selectedLayerId = id;
    this.updateGizmo();
    this.emit();
  }

  /**
   * 노드 매개변수를 바꾼다. 선 모양·투명도처럼 다시 계산이 필요 없는 항목은 바로 적용한다.
   * Clip 변경 → 자기와 자손 중 볼륨·Glyph 모양은 다시 계산, Slice·Isosurface·Streamline 모양은 clippingPlanes 만(Box 밖·Scalar 면 다시 계산).
   * Threshold 변경 → 자기와 자손 전부 다시 계산.
   * Slice·Isosurface·Streamline·Glyph 노드 변경 → 자기와, 자기 모양을 다시 그리는 아래의 Clip·Threshold 노드들(면·선·Glyph 위의 Clip·Threshold)에 같이.
   */
  updateLayer(id: string, patch: LayerPatch): void {
    const l = this.layerById(id);
    if (!l) return;
    Object.assign(l.params, patch);
    // 값 밀대 끝: Field·Component 가 바뀌었으면 다시 정하고, 아니면 넣은 값까지 넓히기만 한다(끄는 동안 줄지 않음 — sliderRange.ts update)
    const slider = valueSliderOf(l);
    if (slider) this.valueBounds.update(id, slider);
    if (l.type === 'clip') {
      // GPU 로 못 거는 Clip(Box 밖·Scalar)이거나 종류·Invert 가 바뀌었으면 면·선도 다시 만든다. 그 밖(Plane·안을 남기는 Box 이동)은 clippingPlanes 만
      // Streamline 은 Clip 이 적분 영역(입력)·조각 나누기(출력)를 정하므로 늘 다시 계산한다
      const cpu = !isGpuClip(l.params) || 'clipType' in patch || 'invert' in patch;
      for (const d of [l, ...this.descendantsOf(id)]) {
        const rt = this.runtime.get(d.id);
        if (!rt) continue;
        if (rt.kind === 'data' || rt.kind === 'glyph' || rt.kind === 'stream') this.markApplied(d.id);
        else { this.applyChainClips(d.id, rt); if (cpu) this.markApplied(d.id); }
      }
      this.countDirty = true;
      this.planeGizmo.flash(); this.updateGizmo();
      this.emit();
      return;
    }
    if (l.type === 'threshold') {
      for (const d of [l, ...this.descendantsOf(id)]) this.markApplied(d.id);
      this.countDirty = true;
      this.emit();
      return;
    }
    if (l.type === 'slice' && !l.params.surface && !l.params.lines) l.params.surface = true; // 둘 다 끄는 것은 금지 — 면으로 되돌린다
    const keys = Object.keys(patch);
    const styleOnly = (l.type === 'stream' && keys.every((k) => STREAM_STYLE_KEYS.includes(k)))
      || (l.type === 'slice' && keys.every((k) => SLICE_STYLE_KEYS.includes(k)))
      || (l.type === 'iso' && keys.every((k) => k === 'opacity'))
      || (l.type === 'glyph' && keys.every((k) => GLYPH_STYLE_KEYS.includes(k)));
    for (const d of [l, ...this.descendantsOf(id)]) {
      const rt = this.runtime.get(d.id);
      if (!rt) continue;
      if (styleOnly) this.applyStyle(l, d.id, rt);
      else this.markApplied(d.id);
    }
    if ('axis' in patch || 'position' in patch || 'mode' in patch) { this.planeGizmo.flash(); this.updateGizmo(); }
    if (l.type === 'stream' && STREAM_SEED_KEYS.some((k) => k in patch)) { this.planeGizmo.flash(); this.updateGizmo(); }
    this.emit();
  }

  /** 다시 계산 없이 바로 적용되는 모양 항목을 노드 렌더러에 (src = 모양을 정하는 Slice·Isosurface·Streamline·Glyph 노드, nodeId = 그 모양을 그리는 노드) */
  private applyStyle(src: Layer, nodeId: string, rt: LayerRuntime): void {
    if (src.type === 'stream' && rt.renderer instanceof StreamlineRenderer) this.applyStreamStyle(src, rt.renderer, nodeId);
    else if (src.type === 'slice' && rt.renderer instanceof SliceRenderer) this.applySliceStyle(src, rt.renderer, nodeId);
    else if (src.type === 'iso' && rt.renderer instanceof IsosurfaceRenderer) rt.renderer.setOpacity(src.params.opacity);
    else if (src.type === 'glyph' && rt.renderer instanceof VectorGlyphs) rt.renderer.setLength(src.params.scaleFactor, src.params.lengthMode === 'uniform');
  }

  /**
   * 노드의 계산 결과 요약 (데이터는 ROOT_ID). 기대는 배열을 기다리는 중이면(waitingArrays — 보이고 다시 계산할 차례인 노드) 요약 줄을 '<배열> 읽는 중'
   * (읽기에 실패했으면 '<배열> 읽지 못함')으로 바꾸고 pending 을 단다 — 그림과 개수는 앞 그림의 것이다.
   * 기대는 배열이 이 저장 시점 파일에 없으면(끝난 상태 — 그 배열 없이 계산했다) 요약 앞에 '<배열> 없음' 을 붙인다(보이는 노드만)
   */
  layerStats(id: string): LayerStats | null {
    const st = this.computedStats(id);
    if (!st) return null;
    const wait = this.waitingArrays(id);
    if (!wait.length) {
      const absent = this.nodeVisible(id) ? this.nodeAbsent(id) : [];
      return absent.length ? { ...st, detail: `${absent.join(', ')} 없음 · ${st.detail}` } : st;
    }
    const failed = wait.some((a) => this.arrayFailed.has(a));
    return { ...st, detail: `${wait.join(', ')} ${failed ? '읽지 못함' : '읽는 중'}`, pending: wait };
  }

  /** 노드의 마지막 계산 결과 요약 (layerStats 의 몸통) */
  private computedStats(id: string): LayerStats | null {
    const rt = this.runtime.get(id);
    if (!rt) return null;
    const r = rt.renderer;
    if (r instanceof DataViewRenderer) return this.dataStats(id, rt, r);
    const src = this.sourceOf(id);
    if (r instanceof SliceRenderer) return { count: r.triangleCount, detail: `삼각형 ${r.triangleCount.toLocaleString('ko-KR')}개 · Contour lines 선분 ${r.segmentCount.toLocaleString('ko-KR')}개`, ms: rt.ms };
    if (r instanceof VectorGlyphs) return { count: r.visibleCount, detail: `${LAYER_LABEL.glyph} ${r.visibleCount.toLocaleString('ko-KR')}개${src?.type === 'glyph' && src.params.mode !== 'uniform' && r.effectiveStride !== src.params.stride ? ` (간격 자동 조정: ${r.effectiveStride}개마다 1개)` : ''}`, ms: rt.ms };
    if (r instanceof StreamlineRenderer) return { count: r.lineCount, detail: `${LAYER_LABEL.stream} ${r.lineCount.toLocaleString('ko-KR')}개 · 점 ${r.pointCount.toLocaleString('ko-KR')}개`, ms: rt.ms };
    return { count: r.triangleCount, detail: `삼각형 ${r.triangleCount.toLocaleString('ko-KR')}개`, ms: rt.ms };
  }

  /** 볼륨 노드 요약: 남은 셀 수 / 전체 (Surface 면 면 수, Volume 이면 3D 텍스처 크기도). 숨긴 노드는 다시 계산하지 않으므로 수 대신 상태를 적는다 */
  private dataStats(id: string, rt: LayerRuntime, r: DataViewRenderer): LayerStats {
    const fmt = (n: number) => n.toLocaleString('ko-KR');
    const total = this.dataset?.count ?? 0;
    const visible = this.nodeVisible(id);
    if (rt.dirty || !visible) return { count: 0, detail: `셀 ${visible ? '계산 전' : '숨김'} / ${fmt(total)}`, ms: rt.ms };
    const rep = r.shownRepresentation();
    if (rep === 'none') return { count: 0, detail: '표현 없음', ms: rt.ms };
    const extra = rep === 'surface' ? ` · 면 ${fmt(r.surface.triangleCount / 2)}`
      : rep === 'featureEdges' ? ` · 선 ${fmt(r.edges.segmentCount)}`
      : rep === 'volume' ? (r.volume.textureBytes
        ? ` · 3D 텍스처 ${(r.volume.textureBytes / 1048576).toFixed(1)} MB${r.volume.reduction > 1 ? ` · 해상도 1/${r.volume.reduction}로 줄여 올림` : ''}`
        : ' · 칠할 배열이 지금 시점 데이터에 없어 그리지 않음')
      : '';
    return { count: r.keptCells, detail: `셀 ${fmt(r.keptCells)} / ${fmt(total)}${extra}`, ms: rt.ms };
  }

  private markLayer(id: string): void { const rt = this.runtime.get(id); if (rt) rt.dirty = true; }
  private markAllLayers(): void { for (const rt of this.runtime.values()) rt.dirty = true; }
  /** 노드 하나를 다시 계산한다. 그릴 사슬은 renderChainOf(id) — Slice·Isosurface·Streamline·Glyph 노드는 조상 Clip·Threshold, Clip·Threshold 노드는 자기 자신까지 */
  private rebuildNode(id: string, rt: LayerRuntime): void {
    rt.dirty = false;
    const t0 = performance.now();
    if (!this.dataset) { rt.renderer.clear(); return; }
    const chain = this.renderChainOf(id);
    const r = rt.renderer;
    if (r instanceof DataViewRenderer) this.rebuildData(id, r, chain);
    else {
      const src = this.sourceOf(id);
      const { input, output } = this.splitChain(id);
      if (src?.type === 'slice' && r instanceof SliceRenderer) this.rebuildSlice(src, r, input, output, id);
      else if (src?.type === 'glyph' && r instanceof VectorGlyphs) this.rebuildGlyphs(src, r, chain, id);
      else if (src?.type === 'stream' && r instanceof StreamlineRenderer) this.rebuildStreams(src, r, input, output, id);
      else if (src?.type === 'iso' && r instanceof IsosurfaceRenderer) this.rebuildIso(src, r, input, output, id);
      else r.clear();
    }
    rt.ms = performance.now() - t0;
    this.timings[rt.kind] = rt.ms;
  }

  /**
   * 볼륨 노드 하나를 지금 표현 방식에 필요한 것만 계산해 그린다.
   * - Points: 합친 점마다 사슬 판정 → hidden 마스크.
   * - Surface·Outline·Feature Edges·Volume: 레벨마다 격자 셀 keep(makeGridChainTester) → 바깥 면(다른 레벨이 남은 셀로 채운 이웃은 건너뜀) / 남은 셀의 경계 상자 /
   *   바깥 면에서 꺾이는 모서리(extractFeatureEdges) / 레벨별 3D 텍스처 값(rebuildVolume).
   * 격자가 없으면 Surface·Feature Edges·Volume 대신 Points 로 그리고(surfaceFallback), Outline 은 점 위치로 잡는다.
   * 실제로 그리는 표현이 Volume 이 아니면 아래의 이른 반환보다 먼저 Volume 의 3D 텍스처·값 버퍼를 놓는다.
   */
  private rebuildData(id: string, r: DataViewRenderer, chain: ChainItem[]): void {
    const view = this.nodeView(id) ?? defaultDataView('outline');
    const ds = this.dataset!;
    const allGrids = this.canDrawSurface();
    r.surfaceFallback = needsGrid(view.representation) && !allGrids;
    r.setRepresentation(view.representation);
    const tone = id === ROOT_ID ? 'data' : 'filter'; // Clip·Threshold 의 Outline·Feature Edges 는 주황 — 데이터 상자와 겹쳐도 구별(PV와 다름)
    r.outline.setTone(tone);
    r.edges.setTone(tone);
    r.surface.setOpacity(view.opacity);
    r.points.setPointSize(view.pointSize);
    r.points.setSphereShading(view.sphereShading);
    r.volume.setUnitDistance(view.volumeUnitDistance ?? this.volumeUnitDefault());
    r.keptCells = 0;
    const rep = r.shownRepresentation();
    if (rep !== 'volume') r.volume.clear(); // 격자가 없어 Points 로 대신 그리는 Volume 도
    this.countDirty = true;
    if (rep === 'none') return;
    // 색칠: 값으로 칠하면 그 배열(성분은 지도의 것), 단색이면 null (Outline 은 늘 단색 — ParaView)
    const c = view.color;
    const colored = !!c.fieldKey && (rep === 'surface' || rep === 'points' || rep === 'volume');
    const mapping = this.mapOf(c).mapping;
    if (rep === 'points') {
      // 남은 셀 수는 사슬로만 센다 (색 Field 의 결측은 화면에서만 빠지고 셀 수에는 들어간다 — Surface·Outline 과 같은 수)
      const vals = colored ? this.valuesOf(c.fieldKey, mapping) : null;
      r.points.setValues(vals);
      const test = chain.length ? makeChainTester(chain, ds.positions, (k, m) => this.valuesOf(k, m)) : null;
      const mask = test ? new Float32Array(ds.count) : null;
      let n = 0, lo = Infinity, hi = -Infinity;
      for (let i = 0; i < ds.count; i++) {
        if (test && !test(i)) { mask![i] = 1; continue; }
        n++;
        if (vals) { const v = vals[i]; if (v === v) { if (v < lo) lo = v; if (v > hi) hi = v; } }
      }
      r.points.setHidden(mask);
      r.keptCells = n;
      if (colored) r.setColor(this.colorForRebuild(id, c, lo <= hi ? [lo, hi] : null));
      return;
    }
    const grids = allGrids ? this.levels.map((lv) => ({ lv, g: surfaceGrid(lv.grid!, this.finestSpacing()), keep: new Uint8Array(lv.grid!.count) })) : [];
    if (!grids.length) { // 격자가 없는 레벨이 있음: Outline 만 (점 위치 ± 반 칸)
      const test = makeChainTester(chain, ds.positions, (k, m) => this.valuesOf(k, m));
      const min: [number, number, number] = [Infinity, Infinity, Infinity], max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
      let n = 0;
      for (let i = 0; i < ds.count; i++) {
        if (!test(i)) continue;
        const h = (ds.radii ? ds.radii[i] / 0.55 : ds.spacing) / 2;
        for (let a = 0; a < 3; a++) { const v = ds.positions[i * 3 + a]; if (v - h < min[a]) min[a] = v - h; if (v + h > max[a]) max[a] = v + h; }
        n++;
      }
      r.keptCells = n;
      r.outline.set(n ? { min, max } : null);
      return;
    }
    let kept = 0;
    for (const e of grids) {
      const test = makeGridChainTester(chain, e.g, (k, m) => this.levelValues(e.lv, k, m));
      for (let c = 0; c < e.g.count; c++) if (test(c)) { e.keep[c] = 1; kept++; }
    }
    r.keptCells = kept;
    if (rep === 'outline') {
      const min: [number, number, number] = [Infinity, Infinity, Infinity], max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
      for (const e of grids) keptBounds(e.g, e.keep, min, max);
      r.outline.set(kept ? { min, max } : null);
      return;
    }
    if (rep === 'volume') { this.rebuildVolume(id, r, grids, c, mapping, chain.length === 0); return; }
    const surfaces: CellSurface[] = [];
    let lo = Infinity, hi = -Infinity;
    for (const e of grids) {
      const others = grids.filter((o) => o !== e);
      const occupied = others.length ? (x: number, y: number, z: number) => others.some((o) => keptAt(o.g, o.keep, x, y, z)) : undefined;
      const values = colored ? this.levelValues(e.lv, c.fieldKey, mapping) : null;
      if (values) for (let k = 0; k < e.keep.length; k++) { if (!e.keep[k]) continue; const v = values[k]; if (v === v) { if (v < lo) lo = v; if (v > hi) hi = v; } }
      surfaces.push(extractCellSurface(e.g, e.keep, values, occupied));
    }
    const merged = mergeCellSurfaces(surfaces);
    if (rep === 'featureEdges') { r.edges.set(extractFeatureEdges(merged)); return; } // 단색 선 — 면은 모서리를 고르는 데만 쓰고 그리지 않는다
    r.surface.set(merged, colored);
    if (colored) r.setColor(this.colorForRebuild(id, c, lo <= hi ? [lo, hi] : null));
  }

  /**
   * Volume: 레벨마다(고운 것부터 — 셰이더의 우선순위) 셀 값을 3D 텍스처 버퍼에 담는다. 칸마다 — 남은 셀(keep)이고 값이 있으면 그 값 · 그 레벨이 차지한 칸(occupancy 1)인데
   * 사슬(조상 Clip·Threshold 와 Clip·Threshold 노드 자기 자신)로 빠졌거나 값이 결측이면 VOLUME_CUT(셰이더가 더 굵은 레벨로 내려가지 않고 비움 — 뺀 자리에 굵은 값이 비치지 않게) ·
   * 그 레벨에 값이 없는 칸(고운 레벨이 덮은 굵은 칸·고체)은 VOLUME_EMPTY(더 굵은 레벨로 내려감). 그래서 Clip·Threshold 노드를 Volume 으로 그리면 남은 셀만 보인다(명세 §2.1).
   * 버퍼는 크기가 같은 동안 다시 쓴다(VolumeRenderer.levelBuffer — 저장 시점을 넘겨도 텍스처 자리는 그대로). 격자는 surfaceGrid 사본이라 한 층짜리 축도 두께가 있다.
   * 칠할 배열이 그 저장 시점에 어느 레벨에도 없으면 그리지 않고 텍스처를 놓으며, 지난 값 범위도 비운다(Surface 와 같음 — 그 시점에서 Rescale '데이터 범위'가
   * 지난 시점의 범위를 쓰지 않게). 일부 레벨에만 없으면 그 레벨은 전부 VOLUME_EMPTY(이 레벨에 값 없음).
   * 레벨의 가장 긴 변이 GPU 한계(MAX_3D_TEXTURE_SIZE)를 넘거나 노드의 칸 수 합이 VOLUME_MAX_TEXELS 를 넘으면 정수배로 묶어 줄여 올린다
   * (volumeFactors · fillVolumeLevel — 묶음 안 남은 셀 값의 평균, 하나라도 남으면 남김). 색 범위는 남은 셀의 원래 값으로 넓힌다(Surface 와 같은 값).
   * noChain = 사슬이 비었다(데이터 노드) — 그때 keep 은 그 레벨의 occupancy 와 같으므로(makeGridChainTester) 그린 셀에는 keep 사본 대신 occupancy 를 넣는다(격자에 늘 있는 배열 — 더 드는 메모리 없음).
   */
  private rebuildVolume(id: string, r: DataViewRenderer, grids: { lv: LevelData; g: StructuredGrid; keep: Uint8Array }[], c: LayerColor, mapping: VectorMapping, noChain: boolean): void {
    const fields = c.fieldKey ? grids.map((e) => this.levelValues(e.lv, c.fieldKey, mapping)) : [];
    if (!fields.some((f) => f)) {
      r.volume.clear();
      if (c.fieldKey) {
        this.colorForRebuild(id, c, null);
        r.volume.drawnCells = { fieldKey: c.fieldKey, mapping, sets: [] }; // 계산은 했고 그린 셀이 없다 (히스토그램이 '계산 전'과 구분)
      }
      return;
    }
    const lim = this.volumeLimits();
    const factors = volumeFactors(grids.map((e) => e.g.dims), lim.size, lim.texels);
    let lo = Infinity, hi = -Infinity;
    const levels: VolumeLevel[] = grids.map((e, i) => {
      const values = fields[i], rg = reducedGrid(e.g.dims, e.g.origin, e.g.spacing, factors[i]);
      const buf = r.volume.levelBuffer(i, rg.dims[0] * rg.dims[1] * rg.dims[2]);
      if (!values) buf.fill(VOLUME_EMPTY);
      else {
        const [a, b] = fillVolumeLevel(buf, e.g.dims, rg.factors, e.g.occupancy, e.keep, values);
        if (a < lo) lo = a;
        if (b > hi) hi = b;
      }
      return { dims: rg.dims, origin: rg.origin, spacing: rg.spacing, values: buf };
    });
    r.volume.reduction = Math.max(...factors);
    r.setColor(this.colorForRebuild(id, c, lo <= hi ? [lo, hi] : null)); // 색 기준을 먼저 넣어 두면 set 이 전달함수 텍스처를 한 번만 만든다
    r.volume.set(levels);
    // 그린 셀을 남겨 둔다 — 히스토그램이 이 계산의 keep 을 그대로 센다(사슬을 다시 판정하지 않음). 계산마다 새 객체라 히스토그램 캐시도 여기서 바뀐다.
    // 들고 있는 것: Clip·Threshold 노드는 레벨마다 keep(격자 칸 하나에 1바이트), 데이터 노드는 격자의 occupancy(사본 없음). 값 배열은 격자·gridCache 의 것이라 더 들지 않는다
    r.volume.drawnCells = {
      fieldKey: c.fieldKey!, mapping,
      sets: grids.flatMap((e, i) => { const values = fields[i]; return values ? [{ values, keep: noChain ? e.g.occupancy : e.keep }] : []; }),
    };
  }

  /**
   * Opacity 곡선 편집기의 히스토그램이 셀 셀: 노드가 마지막 계산에서 Volume 으로 그린 셀(레벨마다 원래 셀 값과 rebuildVolume 의 keep — 데이터는 모든 셀,
   * Clip·Threshold 노드는 조상과 자기까지 거르고 남은 셀). ParaView 도 그 표현의 입력(잘린 결과)을 센다.
   * 지금 Volume 으로 그리지 않거나(drawsVolume) 숨겼거나(그리지 않으므로 — ParaView 도 보이는 표현만), 지금 색칠(배열·성분)로 아직 계산하지 않았으면 null.
   * 계산했는데 칠할 배열이 그 저장 시점에 없으면 빈 배열. 다시 계산 표시만 되고 아직 그리기 전(다음 프레임까지)이면 지난 계산의 셀을 그대로 준다
   * — Clip 을 끄는 동안 막대가 사라졌다 나타나며 깜박이지 않게(같은 배열·성분일 때만).
   */
  volumeCellsOf(id: string): DrawnCells['sets'] | null {
    if (!this.drawsVolume(id) || !this.nodeVisible(id)) return null;
    const rt = this.runtime.get(id);
    const cells = rt?.renderer instanceof DataViewRenderer ? rt.renderer.volume.drawnCells : null;
    const c = this.coloringOf(id);
    if (!cells || !c || cells.fieldKey !== c.fieldKey || cells.mapping !== this.mapOf(c).mapping) return null;
    return cells.sets;
  }

  private planeOf(axis: Axis, position: number): { point: [number, number, number]; normal: [number, number, number] } {
    const b = this.dataset!.bounds;
    const point: [number, number, number] = [(b.min[0] + b.max[0]) / 2, (b.min[1] + b.max[1]) / 2, (b.min[2] + b.max[2]) / 2];
    point[axis] = position;
    const normal: [number, number, number] = [0, 0, 0];
    normal[axis] = 1;
    return { point, normal };
  }

  /** Slice 를 잘라 낼 형상들. 숨긴 형상도 포함한다 — 자료에 구멍을 낸 것은 형상 자체이므로 */
  /** '형상 경계에 맞춤'에 쓰는 고체 형상. 부피 영역(반투명 — 초기 유체·세분화 영역, VOLUME_REGION_TYPES)은 벽이 아니므로 뺀다. 숨긴 고체는 그대로 쓴다(보이기와 무관하게 고체) */
  private clipSolids(): ClipSolid[] {
    return this.objects.list.filter((o) => !o.translucent).map((o) => ({
      positions: o.geometry.getAttribute('position').array as ArrayLike<number>,
      indices: o.geometry.index ? (o.geometry.index.array as ArrayLike<number>) : null,
      matrix: objectMatrix(o).elements,
    }));
  }

  /** 형상 배치(목록·형상·위치·회전·배율)를 한 줄로. 같으면 Slice 를 다시 자를 필요가 없다 */
  private objectsSignature(): string {
    return this.objects.list.map((o) => `${o.id}|${o.geometry.uuid}|${o.position.join(',')}|${o.rotationZ}|${o.scale.join(',')}|${o.translucent ? 'v' : 's'}`).join(';');
  }

  /** Slice 모양 (src 의 평면·스타일) 을 nodeId 의 렌더러에 사슬 chain 으로 그린다. nodeId 는 src 자신이거나 그 위에 붙은 Clip·Threshold 노드 */
  private rebuildSlice(src: SliceLayer, r: SliceRenderer, input: ChainItem[], output: ChainItem[], nodeId: string): void {
    const t0 = performance.now();
    const p = src.params;
    if (!p.surface && !p.lines) p.surface = true; // 둘 다 끄는 것은 금지 — 면으로 되돌린다
    const c = src.params.color;
    const sampler = this.hasGrid ? this.scalarSampler(c.fieldKey, this.mapOf(c).mapping) : null;
    if (!sampler) { r.clear(); return; }
    const plane = this.planeOf(p.axis, p.position);
    const clip = p.clipToObjects ? this.clipSolids() : undefined;
    let surf = resampleSlice(sampler, this.dataset!.bounds, { point: plane.point, normal: plane.normal, step: this.finestSpacing() / p.resolution, clip });
    // 입력 쪽(볼륨에 걸린 CPU Clip·Threshold)과 출력 쪽 CPU Clip(Box 밖·Scalar): 꼭짓점 값을 NaN 으로 — 면은 1e30 → 프래그먼트 discard,
    // contourLines 는 NaN 삼각형을 건너뛴다(셀 반 칸 해상도로 잘린다). GPU 로 걸 수 있는 Clip 은 아래 clippingPlanes
    const pin = this.probesOf(input), pout = this.probesOf(output);
    if (pin.cpu.length || pin.thr.length || pout.cpu.length) {
      const P = surf.positions, V = surf.values;
      for (let i = 0; i < V.length; i++) {
        if (V[i] !== V[i]) continue;
        const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2];
        if (!this.passesProbes(pin, x, y, z) || !this.passesProbes(pout, x, y, z, false)) V[i] = NaN;
      }
    }
    // 출력 쪽 Threshold(Slice → Threshold): 삼각형 단위로 남기거나 뺀다 (ParaView: 셀 통째, All Scalars)
    if (pout.thr.length) surf = this.filterSliceTriangles(surf, pout.thr);
    // 칠할 값 범위(남은 삼각형의 꼭짓점, GPU Clip 으로 잘려 안 보이는 꼭짓점은 빼고) → 색 지도 넓히기 (ParaView Grow)
    let lo = Infinity, hi = -Infinity;
    {
      const V = surf.values, I = surf.indices, P = surf.positions, keep = this.gpuKeeper([...input, ...output]);
      for (let k = 0; k < surf.triangleCount * 3; k++) {
        const i = I[k], v = V[i];
        if (v !== v || (keep && !keep(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]))) continue;
        if (v < lo) lo = v; if (v > hi) hi = v;
      }
    }
    const spec = this.colorForRebuild(nodeId, c, lo <= hi ? [lo, hi] : null);
    // 구간형이면 Contour line 값이 곧 구간 경계: Contour lines n개 → 구간 n+1개
    r.setSurface(p.surface ? surf : null, spec, p.banded ? p.levels + 1 : 0, p.opacity);
    // 같은 평면에 Slice 모양이 둘이면(노드를 더하면 기본 위치가 같다) 나중 노드가 앞에 오도록 깊이를 조금씩 치우친다 — 번갈아 깜빡이는 z-fighting 방지
    r.setDepthBias(this.layers.filter((x) => this.runtime.get(x.id)?.kind === 'slice').findIndex((x) => x.id === nodeId));
    if (p.lines) {
      const lv: number[] = [];
      for (let i = 1; i <= p.levels; i++) lv.push(spec.rangeMin + (i * (spec.rangeMax - spec.rangeMin)) / (p.levels + 1));
      const cl = contourLines(surf, lv);
      // 선 색이 'Colormap'일 때 쓸 색: Contour line 값마다 한 색
      const lvColors = lv.map((v) => this.colorAtSpec(spec, v));
      const colors = new Float32Array(cl.levelIndex.length * 6);
      for (let k = 0; k < cl.levelIndex.length; k++) {
        const c = lvColors[cl.levelIndex[k]];
        colors.set(c, k * 6); colors.set(c, k * 6 + 3);
      }
      r.setContours(cl.positions, colors);
    } else {
      r.setContours(null);
    }
    this.applySliceStyle(src, r, nodeId);
    r.setClips(this.clipsOf([...input, ...output])); // 사슬의 Plane·안을 남기는 Box 는 GPU clippingPlanes
    this.lastSliceMs = performance.now() - t0;
  }

  /** Slice 삼각형을 출력 쪽 Threshold 로 거른다 (인덱스만 새로) */
  private filterSliceTriangles(surf: SliceSurface, thr: ChainProbes['thr']): SliceSurface {
    const P = surf.positions, I = surf.indices;
    const kept: number[] = [];
    for (let t = 0; t < surf.triangleCount; t++) {
      const at = (k: number): [number, number, number] => { const v = I[t * 3 + k] * 3; return [P[v], P[v + 1], P[v + 2]]; };
      if (this.keepsElement(thr, 3, at)) kept.push(I[t * 3], I[t * 3 + 1], I[t * 3 + 2]);
    }
    return { ...surf, indices: Uint32Array.from(kept), triangleCount: kept.length / 3 };
  }

  /** Contour lines 색·굵기·불투명도와 면 불투명도 — 다시 계산 없이 바로 적용되는 항목 */
  private applySliceStyle(l: SliceLayer, r: SliceRenderer, nodeId = l.id): void {
    const p = l.params;
    r.setLineStyle({ color: p.lineColor, width: p.lineWidth, opacity: p.lineOpacity, stencilBit: this.runtime.get(nodeId)?.stencilBit ?? -1 });
    r.setSurfaceOpacity(p.opacity);
  }

  private rebuildGlyphs(l: GlyphLayer, r: VectorGlyphs, nodeChain: ChainItem[], nodeId: string): void {
    const p = l.params;
    const field: VectorField | null = this.dataset!.vectors.find((v) => v.name === p.fieldName) ?? null;
    r.setField(field);
    if (!field) { r.clear(); return; }
    // 사슬(조상 Clip·Threshold, 위에 붙은 Clip·Threshold 노드면 그것까지)로 CPU 에서 거른다. '평면 위' 배치는 평면 주변 얇은 층 Clip 을 하나 더 AND 한다
    const chain = [...nodeChain];
    if (p.mode === 'plane') chain.push({ kind: 'clip', params: bandClip(p.axis, p.position, this.finestSpacing() * 1.2, this.cellBounds()) });
    const test = makeChainTester(chain, this.dataset!.positions, (k, m) => this.valuesOf(k, m));
    // 색에 쓰는 값: 이 노드가 칠하는 배열(성분은 지도의 것). 범위는 사슬을 통과한 점의 값으로 넓힌다 (ParaView Grow)
    const c = p.fieldColor;
    const colorVals = p.color === 'field' ? this.valuesOf(c.fieldKey, this.mapOf(c).mapping) : null;
    let spec = this.specOf(c);
    if (colorVals) {
      let lo = Infinity, hi = -Infinity;
      for (let i = 0; i < colorVals.length; i++) { if (!test(i)) continue; const v = colorVals[i]; if (v === v) { if (v < lo) lo = v; if (v > hi) hi = v; } }
      spec = this.colorForRebuild(nodeId, c, lo <= hi ? [lo, hi] : null);
    }
    const values = colorVals ?? field.magnitude;
    r.rebuild(test, {
      sampling: p.mode === 'uniform' ? { kind: 'uniform', maxSamples: p.maxSamples } : { kind: 'stride', stride: p.stride },
      scaleFactor: p.scaleFactor,
      colormap: spec.colormap,
      rangeMin: spec.rangeMin,
      rangeMax: spec.rangeMax,
      solidColor: p.color === 'white' ? '#f8fafc' : p.color === 'black' ? '#111827' : undefined,
      planeOffset: p.mode === 'plane' ? { axis: p.axis, sign: this.cameraSide(p.axis, p.position) } : undefined,
      uniformLength: p.lengthMode === 'uniform',
    }, values);
  }

  private cameraSide(axis: Axis, position: number): number {
    return this.camera.position.getComponent(axis) >= position ? 1 : -1;
  }

  /** 시작점들에서의 평균 흐름 방향(단위 벡터). Streamline 시작면 표시의 추적 방향 화살표에 쓴다. 흐름이 없으면 null. */
  private meanFlowAt(seeds: number[][], fieldName: string | null): [number, number, number] | null {
    const sampler = this.vectorSampler(fieldName);
    if (!sampler || !seeds.length) return null;
    const acc = [0, 0, 0], out = [0, 0, 0];
    let n = 0;
    for (const s of seeds) {
      if (!sampler(s[0], s[1], s[2], out)) continue;
      acc[0] += out[0]; acc[1] += out[1]; acc[2] += out[2]; n++;
    }
    const len = Math.hypot(acc[0], acc[1], acc[2]);
    if (!n || len < 1e-12) return null;
    return [acc[0] / len, acc[1] / len, acc[2] / len];
  }

  /** Streamline 시작면의 범위 상자 (매개변수의 seedBounds 기준) */
  seedBoxFor(p: StreamParams) {
    if (!this.dataset) return null;
    return p.seedBounds === 'finest' && this.levels.length ? this.levels[0].dataset.bounds : this.dataset.bounds;
  }

  private streamSeeds(p: StreamParams): number[][] {
    const box = this.seedBoxFor(p);
    if (!box) return [];
    const A = p.seedAxis;
    const spacing = this.finestSpacing();
    // 가로 축 B · 세로 축 C(= 화면의 위쪽 축, '아래에서부터 사용할 높이 비율'이 실제 높이에 걸리게). +Z 일 때는 예전 규칙 그대로이고,
    // 가로 축이 납작하면(Z 한 층인 2D 를 +Y 로 볼 때) 예전 규칙으로 돌아간다 — 시작점이 한 자리에 겹치지 않게 (core/upAxis.ts seedPlaneAxes)
    const { b: B, c: C, down } = seedPlaneAxes(A, this.display.upAxis, box.min, box.max, spacing); // down: 위쪽이 - 면 '아래'는 큰 쪽
    const seeds: number[][] = [];
    const nU = Math.max(1, p.nU), nV = Math.max(1, p.nV);
    const margin = 0.03;
    for (let u = 0; u < nU; u++) {
      const fB = margin + (1 - 2 * margin) * (nU === 1 ? 0.5 : u / (nU - 1));
      for (let v = 0; v < nV; v++) {
        const fC = (nV === 1 ? 0.5 : v / (nV - 1)) * p.vFrac;
        const s = [0, 0, 0];
        s[A] = p.seedPos;
        s[B] = box.min[B] + fB * (box.max[B] - box.min[B]);
        // 아래에서 위로: 예전 식 그대로(더하는 차례까지 같게 — +Z 결과가 비트 단위로 같다). 위쪽이 - 면 큰 쪽에서 빼 나간다
        s[C] = down ? box.max[C] - spacing * 0.5 - fC * (box.max[C] - box.min[C] - spacing)
          : box.min[C] + spacing * 0.5 + fC * (box.max[C] - box.min[C] - spacing);
        seeds.push(s);
      }
    }
    return seeds;
  }

  /** Streamline·Slice(Contour lines) 레이어마다 다른 스텐실 비트(0~7). 여덟 개를 넘으면 -1(스텐실 없이 그냥 섞음) */
  private freeStencilBit(): number {
    const used = new Set<number>();
    for (const rt of this.runtime.values()) if (rt.stencilBit >= 0) used.add(rt.stencilBit);
    for (let b = 0; b < 8; b++) if (!used.has(b)) return b;
    return -1;
  }

  private applyStreamStyle(l: StreamLayer, r: StreamlineRenderer, nodeId = l.id): void {
    const p = l.params;
    const stencilBit = this.runtime.get(nodeId)?.stencilBit ?? -1;
    r.setStyle({
      shape: p.shape, width: p.width, units: p.widthUnits, meshWidth: p.meshWidth, sides: p.sides, ribbonDir: p.ribbonDir,
      opacity: p.opacity, dash: p.dash, dashUnit: this.finestSpacing(), stencilBit, up: upVector(this.display.upAxis),
    });
  }

  /**
   * Streamline. 입력 쪽(볼륨에 걸린) CPU Clip·Threshold 는 남은 영역 밖으로 나가면 적분을 멈춘다(시작점이 밖이면 뺀다 — ParaView 는
   * 잘린 볼륨 안에서만 적분). 출력 쪽(Streamline 아래) CPU Clip 은 통과하는 점끼리 이어진 조각만 남기고, Threshold 는 한 줄 통째로 남기거나 뺀다.
   */
  private rebuildStreams(l: StreamLayer, r: StreamlineRenderer, input: ChainItem[], output: ChainItem[], nodeId: string): void {
    const p = l.params;
    const sampler = this.vectorSampler(p.fieldName);
    if (!sampler) { r.clear(); return; }
    // 입력 쪽: GPU 로 걸 수 있는 Plane·Box 도 적분 영역을 정한다(ParaView 는 잘린 볼륨 안에서만 적분) — 모든 Clip 과 Threshold 로 멈춘다
    const pin = this.probesOf(input);
    const inClips = input.filter((it): it is Extract<ChainItem, { kind: 'clip' }> => it.kind === 'clip' && isGpuClip(it.params)).map((it) => it.params);
    const stopAt = pin.cpu.length || pin.thr.length || inClips.length
      ? (x: number, y: number, z: number) => !this.passesProbes(pin, x, y, z) || inClips.some((c) => !clipKeeps(c, x, y, z, NaN))
      : undefined;
    let lines = computeStreamlines(sampler, this.streamSeeds(p), {
      direction: p.direction, step: this.finestSpacing() * 0.5, maxLength: p.maxLength, minSpeed: TERMINAL_SPEED, stopAt,
    });
    // 출력 쪽은 사슬 순서대로(ParaView 처럼 앞 필터의 결과에 다음 필터): Clip 은 통과하는 점끼리 조각으로, Threshold 는 조각(한 줄) 통째
    for (const it of output) {
      const pr = this.probesOf([it]);
      if (it.kind === 'clip') {
        const c = it.params;
        lines = splitLines(lines, isGpuClip(c) ? (x, y, z) => clipKeeps(c, x, y, z, NaN) : (x, y, z) => this.passesProbes(pr, x, y, z, false));
      } else if (pr.thr.length) {
        lines = lines.filter((ln) => this.keepsElement(pr.thr, ln.points.length / 3, (k) => [ln.points[k * 3], ln.points[k * 3 + 1], ln.points[k * 3 + 2]]));
      }
    }
    // 색: 유선 점마다 칠할 배열 값을 먼저 읽어 범위를 넓힌 뒤(ParaView Grow) 색으로 바꾼다
    const c = l.params.fieldColor;
    const colorSampler = p.color === 'field' ? this.scalarSampler(c.fieldKey, this.mapOf(c).mapping) : null;
    const solidC = new THREE.Color(p.solidColor).convertSRGBToLinear();
    const solid: RGB = [solidC.r, solidC.g, solidC.b];
    const lineVals = colorSampler ? lines.map((ln) => {
      const n = ln.points.length / 3, out = new Float32Array(n);
      for (let i = 0; i < n; i++) out[i] = colorSampler(ln.points[i * 3], ln.points[i * 3 + 1], ln.points[i * 3 + 2]);
      return out;
    }) : null;
    let spec = this.specOf(c);
    if (lineVals) {
      let lo = Infinity, hi = -Infinity;
      for (const vs of lineVals) for (let i = 0; i < vs.length; i++) { const v = vs[i]; if (v === v) { if (v < lo) lo = v; if (v > hi) hi = v; } }
      spec = this.colorForRebuild(nodeId, c, lo <= hi ? [lo, hi] : null);
    }
    const lineIndex = new Map(lines.map((ln, k) => [ln, k]));
    let last: RGB = solid;
    r.set(lines, (line, i) => {
      if (!lineVals) return solid;
      const v = lineVals[lineIndex.get(line)!][i];
      if (v === v) last = this.colorAtSpec(spec, v);
      return last;
    });
    this.applyStreamStyle(l, r, nodeId);
    r.setClips(this.clipsOf([...input, ...output])); // 사슬의 Plane·안을 남기는 Box 는 GPU clippingPlanes
  }

  /** Isosurface. 입력 쪽 CPU Clip·Threshold 와 출력 쪽 CPU Clip 은 삼각형 무게중심으로, 출력 쪽 Threshold 는 꼭짓점(All Scalars)으로 삼각형을 거른다 */
  private rebuildIso(l: IsoLayer, r: IsosurfaceRenderer, input: ChainItem[], output: ChainItem[], id: string): void {
    const p = l.params;
    if (!p.fieldKey) { r.clear(); return; }
    const c = p.fieldColor;
    const cmap = this.mapOf(c).mapping;
    const results: IsoResult[] = [];
    for (const lv of this.levels) {
      if (!lv.grid) continue;
      const values = this.levelValues(lv, p.fieldKey, 'magnitude');
      if (!values) continue;
      const colorValues = p.colorMode === 'field' ? this.levelValues(lv, c.fieldKey, cmap) : null;
      results.push(marchingTetrahedra(lv.grid, values, p.value, colorValues));
    }
    let merged = mergeIsoResults(results);
    const pin = this.probesOf(input), pout = this.probesOf(output);
    if (pin.cpu.length || pin.thr.length || pout.cpu.length || pout.thr.length) {
      const P = merged.positions;
      merged = filterIsoTriangles(merged, (t) => {
        const o = t * 9;
        const cx = (P[o] + P[o + 3] + P[o + 6]) / 3, cy = (P[o + 1] + P[o + 4] + P[o + 7]) / 3, cz = (P[o + 2] + P[o + 5] + P[o + 8]) / 3;
        if (!this.passesProbes(pin, cx, cy, cz) || !this.passesProbes(pout, cx, cy, cz, false)) return false;
        return !pout.thr.length || this.keepsElement(pout.thr, 3, (k) => [P[o + k * 3], P[o + k * 3 + 1], P[o + k * 3 + 2]]);
      });
    }
    let spec = this.specOf(c);
    if (p.colorMode === 'field' && merged.values) {
      // 꼭짓점 값의 범위 (GPU Clip 으로 잘려 안 보이는 꼭짓점은 빼고)
      let lo = Infinity, hi = -Infinity;
      const P = merged.positions, keep = this.gpuKeeper([...input, ...output]);
      for (let i = 0; i < merged.values.length; i++) {
        const v = merged.values[i];
        if (v !== v || (keep && !keep(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]))) continue;
        if (v < lo) lo = v; if (v > hi) hi = v;
      }
      spec = this.colorForRebuild(id, c, lo <= hi ? [lo, hi] : null);
    }
    const solid = new THREE.Color(p.solidColor);
    r.setOpacity(p.opacity);
    r.set(merged, (v) => this.colorAtSpec(spec, v), [solid.r, solid.g, solid.b]);
    r.setClips(this.clipsOf([...input, ...output])); // 사슬의 Plane·안을 남기는 Box 는 GPU clippingPlanes
  }

  // ---- 장면 저장 · 불러오기 (형상 + 데이터 노드 + 노드 트리 + Color · 표시) ----
  /** version 6: { version, objects, root: { visible, view }, layers: [{ id, parentId, type, name, visible, params, view? }], colorMaps, defaultFieldKey, display(upAxis 포함), camera } */
  sceneToJSON(): string {
    const objects = (JSON.parse(this.objects.toJSON()) as { objects: unknown[] }).objects;
    const layers = this.layers.map((l) => ({ id: l.id, parentId: l.parentId, type: l.type, name: l.name, visible: l.visible, params: l.params, ...(this.isFilterNode(l) ? { view: l.view } : {}) }));
    const camera = { position: this.camera.position.toArray(), target: this.controls.target.toArray(), orthoHeight: this.orthoHeight / this.orthoCamera.zoom };
    // 아직 범위가 정해지지 않은 지도는 fresh: true 로 — 읽은 뒤에도 처음 칠하는 노드가 범위를 정한다 (Colormap·성분·자동 넓히기는 남는다)
    const colorMaps = Object.fromEntries(Array.from(this.colorMaps, ([k, m]) => [k, { ...m, fresh: m.fresh ? true : undefined }]));
    return JSON.stringify({ version: 6, objects, root: this.root, layers, colorMaps, defaultFieldKey: this.defaultFieldKey, display: this.display, camera }, null, 2);
  }

  /**
   * 장면 JSON 읽기. version 5·6 은 노드 트리 그대로(id 는 새로 만들고 parentId 를 대응표로 바꾼다). 옛 형식도 받는다:
   * - version 5 이하의 공통 `color`(Field·성분·Colormap·범위) → 그 배열의 공유 색 지도 + 새 노드 기본 배열. 노드의 'Color 따름' → 그 배열 공유,
   *   '이 레이어만' → Separate Color Map(layerColorFromJSON). 저장된 범위는 불러온 뒤 넓히지 않는다(ParaView 상태 파일처럼).
   * - version 4: Points 노드 → 상위 노드(없으면 데이터)의 표현 방식 Points(보이던 것만; 숨긴 Points 는 버림). Points 가 보이지 않던
   *   Clip·Threshold 는 v4 에서 그려지지 않았으므로 숨긴 채(표현 Surface) 들인다.
   * - version 3: `display.pointsVisible/pointSize/sphereShading` + `pointFilter` → 필터가 켜져 있었으면 Clip/Threshold 노드(표현 Points),
   *   아니면 데이터의 표현 Points. 레이어 `params.clip/threshold`(enabled) → 그 레이어 위에 Clip/Threshold 노드를 끼운다(옛 invert 는 버림).
   * - version 2: 전역 `filter` 를 version 3 의 pointFilter 규칙으로 먼저 옮긴 뒤 같은 처리. 레이어 params 의 옛 `style` → surface/lines.
   * 결과 폴더(시간축)면 노드를 다 넣은 뒤 한 번에 쓰는 배열을 맞춰 지금 장면에 빠진 배열을 읽는다(그동안 그 노드들은 계산하지 않고 '읽는 중' —
   * 배열이 오면 값 밀대 끝을 정하고 계산한다. 저장된 색 범위는 그대로 지킨다)
   */
  sceneFromJSON(text: string): { objects: number; layers: number; skipped: number } {
    this.holdArrays++; // 노드를 하나씩 넣을 때마다 읽기를 시작하지 않게 쓰는 배열 비교를 미룬다
    try { return this.readSceneJSON(text); }
    finally { this.holdArrays--; this.emit(); }
  }

  /** sceneFromJSON 의 몸통 */
  private readSceneJSON(text: string): { objects: number; layers: number; skipped: number } {
    this.legacyRecheck.clear();
    const data = JSON.parse(text) as {
      version?: number; objects?: unknown[]; layers?: SceneLayerJSON[];
      root?: { visible?: boolean; view?: Partial<DataView> };
      color?: Partial<ColorState>; colorMaps?: Record<string, unknown>; defaultFieldKey?: string | null;
      display?: Partial<DisplayState> & LegacyDisplay;
      pointFilter?: LegacyPointFilter;
      filter?: LegacyFilter;
      camera?: { position?: number[]; target?: number[]; orthoHeight?: number };
    };
    let objects = 0, layers = 0, skipped = 0;
    if (Array.isArray(data.objects)) { const r = this.objects.loadJSON(JSON.stringify({ objects: data.objects })); objects = r.applied; skipped += r.skipped; }
    // 색 지도: version 6 은 배열별 지도 그대로, 그 전은 공통 Color 하나를 그 배열의 지도로. 앞 장면의 지도는 남기지 않는다(그 지도의 전 시점 범위 읽기도 멈춘다)
    this.cancelRangeScan('silent');
    this.colorMaps.clear();
    if (data.colorMaps && typeof data.colorMaps === 'object') {
      for (const [k, m] of Object.entries(data.colorMaps)) this.colorMaps.set(k, colorMapFromJSON(m));
      if (data.defaultFieldKey !== undefined) this.defaultFieldKey = data.defaultFieldKey;
    } else if (data.color?.fieldKey) {
      this.colorMaps.set(data.color.fieldKey, colorMapFromJSON(data.color));
      this.defaultFieldKey = data.color.fieldKey;
    }
    this.legacyField = data.color?.fieldKey ?? this.defaultFieldKey; // version 5 이하 노드의 'Color 따름' 이 칠하던 배열
    if (Array.isArray(data.layers)) {
      this.clearLayers();
      this.root = { visible: true, view: defaultDataView('outline', this.legacyField) };
      const version = data.version ?? 0;
      let r: { layers: number; skipped: number };
      if (version >= 5) {
        this.root = { visible: data.root?.visible ?? true, view: viewFromJSON(data.root?.view, 'outline', this.legacyField, this.defaultFieldKey) };
        r = this.loadTreeLayers(data.layers);
      } else if (version === 4) {
        const v5 = this.v4ToV5(data.layers);
        this.root = v5.root;
        r = this.loadTreeLayers(v5.items);
      } else r = this.loadLegacyLayers(data.layers, data.pointFilter ?? (data.filter ? this.pointFilterFromLegacy(data.filter) : null), data.display ?? {});
      layers += r.layers; skipped += r.skipped;
      this.syncRootRuntime();
      for (const rt of this.runtime.values()) rt.growPending = false; // 저장된 범위를 지킨다 (아직 범위가 없는 새 지도는 처음 칠할 때 정해진다)
      this.selectedLayerId = null;
      this.markAllLayers();
      this.countDirty = true;
    }
    // 옛 코드가 값이 모두 같은 장면에서 정해 저장한 뜻 없는 범위(-5e-13 ~ 5e-13 등)는 '범위 미정'으로 들인다 — 값이 처음 달라지는 장면에서 새로 정한다
    if (this.dropLegacyFlatRanges()) this.markAllLayers();
    const upBefore = this.display.upAxis;
    if (data.display) {
      // 옛 Points 표시 항목은 표현 방식으로 옮겼다. upAxis 는 카메라 위치보다 먼저 적용하고(아래), 없는 옛 장면·틀린 값이면 지금 값을 둔다(setDisplay)
      const { pointsVisible: _pv, pointSize: _ps, sphereShading: _ss, ...rest } = data.display;
      // 위쪽 칸이 생기기 전(2026-11-04 이전)에 저장한 장면의 카메라는 모두 +Z 위쪽에서 찍은 것이다 → +Z 로 읽어야 저장할 때 화면이 나온다
      if (rest.upAxis === undefined && data.camera?.position?.length === 3) rest.upAxis = DEFAULT_UP;
      this.setDisplay(rest);
    } else if (data.camera?.position?.length === 3) {
      this.setDisplay({ upAxis: DEFAULT_UP }); // display 자체가 없는 더 옛 장면도 같다
    }
    // 카메라가 있으면 그 시점으로 (시연·캡처용 장면). 위쪽은 위에서 이미 맞췄으므로 화면을 다시 맞추지 않는다.
    // 카메라가 없으면 지금 시점 유지 — 다만 장면이 위쪽을 바꿨으면 지금 보기 방향으로 다시 맞춘다(옛 자리에 새 위쪽만 세우면 아래에서 올려다보는 화면이 될 수 있다)
    if (data.camera?.position?.length === 3 && data.camera.target?.length === 3) {
      this.camera.position.fromArray(data.camera.position);
      this.controls.target.fromArray(data.camera.target);
      if (data.camera.orthoHeight && data.camera.orthoHeight > 0) { this.orthoHeight = data.camera.orthoHeight; this.orthoCamera.zoom = 1; }
      this.setClipRange(this.camera.position.distanceTo(this.controls.target));
      this.lastW = 0;
      this.controls.update();
    } else if (this.display.upAxis !== upBefore) {
      this.fitView();
    }
    this.emit();
    return { objects, layers, skipped };
  }

  /**
   * 장면을 읽은 뒤: 옛 '모두 같음' 범위로 저장된 지도(core/colorRange.ts isLegacyFlatSaved — 근거 없음 · 사용자 지정 아님 · 폭이 옛 넓힘의 꼴이거나 성분 하한보다 좁음)를
   * 미정으로 돌린다(명세 §3 '저장된 범위는 지킨다'의 예외, 2026-11-05 결정). 하한은 공유 지도는 그 배열(key), Separate 지도는 그 노드의 배열로
   * 지금 장면에서 정한다(flatFloor). 자동 넓히기 설정(autoGrow)은 장면 파일 그대로. 하나라도 돌렸으면 true.
   * 벡터 성분(X·Y·Z) 지도의 하한은 그 벡터 크기 최대로 정하므로, 그 배열을 지금 장면에 아직 읽지 않았으면(시간축 — 쓰는 배열만 읽음) 배열이 온 뒤에 본다(afterArrival)
   */
  private dropLegacyFlatRanges(): boolean {
    const seen = new Set<ColorMap>();
    let changed = false;
    const visit = (m: ColorMap, fieldKey: string | null) => {
      if (seen.has(m)) return;
      seen.add(m);
      if (fieldKey?.startsWith('vector:') && m.mapping !== 'magnitude' && this.fieldPending(fieldKey)) { this.legacyRecheck.set(m, fieldKey); return; }
      if (this.resetIfLegacyFlat(m, fieldKey)) changed = true;
    };
    for (const [k, m] of this.colorMaps) visit(m, k || null);
    for (const id of [ROOT_ID, ...this.layers.map((l) => l.id)]) {
      const c = this.coloringOf(id);
      if (c?.separate) visit(c.map, c.fieldKey);
    }
    return changed;
  }

  /** 지도가 옛 '모두 같음' 범위로 저장된 것이면(isLegacyFlatSaved — 하한은 지금 장면의 그 배열로) '범위 미정'으로 돌린다. 돌렸으면 true */
  private resetIfLegacyFlat(m: ColorMap, fieldKey: string | null): boolean {
    if (!isLegacyFlatSaved(m, this.flatFloor(fieldKey, m.mapping))) return false;
    const d = defaultColorMap(m.mapping);
    m.fresh = true; m.rangeMin = d.rangeMin; m.rangeMax = d.rangeMax; m.rangeMode = d.rangeMode;
    delete m.rangeBasis;
    return true;
  }

  /** version 5 노드 목록을 트리로 넣는다. id 는 새로 만들고 parentId 는 대응표로 바꾼다 (상위가 먼저 들어가도록 미뤄 가며 처리) */
  private loadTreeLayers(items: SceneLayerJSON[]): { layers: number; skipped: number } {
    let layers = 0, skipped = 0;
    const idMap = new Map<string, string>();
    let pending = items.filter((d) => { const ok = (LAYER_TYPES as string[]).includes(d.type); if (!ok) skipped++; return ok; });
    let progress = true;
    while (pending.length && progress) {
      progress = false;
      const rest: SceneLayerJSON[] = [];
      for (const d of pending) {
        const oldPid = d.parentId ?? null;
        if (oldPid && !idMap.has(oldPid)) { rest.push(d); continue; } // 상위가 아직 안 들어옴
        this.placeSceneLayer(d, oldPid ? idMap.get(oldPid)! : null, idMap);
        layers++; progress = true;
      }
      pending = rest;
    }
    for (const d of pending) { this.placeSceneLayer(d, null, idMap); layers++; } // 상위를 못 찾은 노드는 데이터 바로 아래
    return { layers, skipped };
  }

  /** 노드 하나를 넣는다. 붙일 수 없는 상위면 insertLayer 가 붙일 수 있는 가장 가까운 조상으로 옮긴다 */
  private placeSceneLayer(d: SceneLayerJSON, parentId: string | null, idMap: Map<string, string>): Layer {
    const l = this.insertLayer(d.type as LayerType, this.paramsFromJSON(d.type as LayerType, d.params ?? {}), parentId);
    if (d.id) idMap.set(d.id, l.id);
    if (d.name) l.name = d.name;
    if (this.isFilterNode(l) && d.view) l.view = viewFromJSON(d.view, 'surface', this.legacyField, this.defaultFieldKey);
    this.setLayerVisible(l.id, d.visible ?? true);
    return l;
  }

  /** 장면 JSON 의 params → 지금 형식. Clip·Threshold 는 2단계 전 형식(축 구간 { axis, min, max } · { min, max })을 옮긴다 */
  private paramsFromJSON(type: LayerType, p: Record<string, unknown>): LayerPatch {
    if (type === 'clip') return normalizeClipParams(p, this.defaultParams('clip') as ClipParams, this.cellBounds());
    if (type === 'threshold') return normalizeThresholdParams(p, this.defaultParams('threshold') as ThresholdParams);
    // Slice 는 color, 나머지는 fieldColor — version 5 이하의 'Color 따름/이 레이어만' 을 지금 형식으로
    const key = type === 'slice' ? 'color' : 'fieldColor';
    const out: Record<string, unknown> = { ...p, [key]: layerColorFromJSON(p[key], this.legacyField) };
    if (type === 'glyph' && out.mode === undefined) {
      // 4단계 전 Glyph: placement 'plane' → 평면 위, 'visible'(전체를 N개마다) → N개마다. 옛 길이 배율(scale, 격자 간격 기준)은
      // 뜻이 달라 그대로 옮길 수 없으므로 새 기본 Scale Factor 에 곱한다
      out.mode = out.placement === 'plane' ? 'plane' : 'stride';
      const vec = this.fieldOptions().find((o) => o.kind === 'vector');
      const fieldName = typeof out.fieldName === 'string' ? out.fieldName : vec ? arrayNameOf(vec.key) : null;
      out.scaleFactor = this.glyphScaleDefault(fieldName, out.lengthMode === 'uniform' ? 'uniform' : 'magnitude') * (Number(out.scale) > 0 ? Number(out.scale) : 1);
      delete out.placement; delete out.scale;
    }
    return out as LayerPatch;
  }

  /** version 4 → 5: Points 노드를 상위 노드(없으면 데이터)의 표현 방식으로 옮긴다 (sceneFromJSON 설명 참고) */
  private v4ToV5(items: SceneLayerJSON[]): { items: SceneLayerJSON[]; root: RootNode } {
    const pts = items.filter((d) => d.type === 'points');
    const shownPointsOf = (pid: string | null) => pts.find((d) => (d.parentId ?? null) === pid && (d.visible ?? true));
    const pointsView = (d: SceneLayerJSON): DataView => ({ ...defaultDataView('points', this.legacyField), pointSize: Number(d.params?.size ?? 1) || 1, sphereShading: d.params?.sphereShading !== false });
    const rootPts = shownPointsOf(null);
    const root: RootNode = { visible: true, view: rootPts ? pointsView(rootPts) : defaultDataView('outline', this.legacyField) };
    const out = items.filter((d) => d.type !== 'points').map((d): SceneLayerJSON => {
      if (d.type !== 'clip' && d.type !== 'threshold') return d;
      const p = d.id ? shownPointsOf(d.id) : undefined;
      return p ? { ...d, visible: true, view: pointsView(p) } : { ...d, visible: false, view: defaultDataView('surface', this.legacyField) };
    });
    return { items: out, root };
  }

  /**
   * version 2·3 장면을 트리로 옮긴다: 전역 Points(표시 + pointFilter) → 필터가 켜져 있었으면 Clip/Threshold 노드(표현 Points), 아니면 데이터의 표현 Points.
   * 레이어 params.clip/threshold(enabled) → 그 레이어 위에 Clip/Threshold 노드(그 노드 자체는 v3 에서 그려지지 않았으므로 숨김). invert 는 버린다.
   */
  private loadLegacyLayers(items: SceneLayerJSON[], pf: LegacyPointFilter | null, disp: LegacyDisplay): { layers: number; skipped: number } {
    let layers = 0, skipped = 0;
    const st = this.currentStats();
    const pointsView: DataView = { ...defaultDataView('points', this.legacyField), pointSize: disp.pointSize ?? 1, sphereShading: disp.sphereShading ?? true };
    const shown = disp.pointsVisible ?? true;
    // 전역 Points → 표현 방식 (옛 Points Threshold 의 Field 는 전역 Color 의 Field)
    let clipId: string | null = null, thrId: string | null = null;
    if (pf?.clip?.enabled) { clipId = this.insertLayer('clip', this.legacyClipParams(pf.clip), null).id; layers++; }
    if (pf?.threshold?.enabled) { thrId = this.insertLayer('threshold', defaultThreshold(this.legacyField, this.colorMapOf(this.legacyField).mapping, { min: pf.threshold.min ?? st.min, max: pf.threshold.max ?? st.max }), clipId).id; layers++; }
    const last = thrId ?? clipId;
    if (last) {
      const f = this.layerById(last);
      if (f && this.isFilterNode(f)) f.view = { ...pointsView };
      this.setLayerVisible(last, shown);
      if (thrId && clipId) this.setLayerVisible(clipId, false); // 위쪽 Clip 은 v3 에서 따로 그려지지 않았다
    } else if (shown) this.root.view = { ...pointsView };
    for (const d of items) {
      if (!(LAYER_TYPES as string[]).includes(d.type) || isFilterType(d.type as LayerType)) { skipped++; continue; } // 옛 버전에는 Slice·Glyph·Streamline·Isosurface 레이어만 있었다 (Points 레이어도 건너뜀)
      const params = { ...(d.params ?? {}) } as Record<string, unknown>;
      const clip = params.clip as LegacyClip | undefined, thr = params.threshold as LegacyThreshold | undefined;
      delete params.clip; delete params.threshold;
      if (d.type === 'slice' && typeof params.style === 'string') { // 옛 style → surface/lines
        Object.assign(params, { surface: params.style !== 'lines', lines: params.style !== 'surface' });
        delete params.style;
      }
      let parent: string | null = null;
      if (clip?.enabled) { parent = this.insertLayer('clip', this.legacyClipParams(clip), null).id; this.setLayerVisible(parent, false); }
      if (thr?.enabled) {
        // 옛 Threshold 의 Field 는 그 레이어가 색을 칠하던 Field (자기 색이면 그것, 아니면 전역 Color)
        const lc = (d.type === 'slice' ? params.color : params.fieldColor) as { mode?: string; fieldKey?: string; mapping?: VectorMapping } | undefined;
        const own = lc?.mode === 'own';
        const fieldKey = own ? (lc?.fieldKey ?? this.legacyField) : this.legacyField;
        const mapping = own ? (lc?.mapping ?? 'magnitude') : this.colorMapOf(this.legacyField).mapping;
        const fs = this.statsFor(fieldKey, mapping);
        parent = this.insertLayer('threshold', defaultThreshold(fieldKey, mapping, { min: thr.min ?? fs.min, max: thr.max ?? fs.max }), parent).id;
        this.setLayerVisible(parent, false);
      }
      const l = this.insertLayer(d.type as LayerType, this.paramsFromJSON(d.type as LayerType, params), parent);
      if (d.name) l.name = d.name;
      this.setLayerVisible(l.id, d.visible ?? true);
      layers++;
    }
    return { layers, skipped };
  }

  /** 옛 Clip(enabled·축 구간·invert) → 그 축만 좁힌 Box. 옛 invert(구간 밖을 남김)는 상자 밖을 남기는 Box(Invert 끔)로 옮긴다 */
  private legacyClipParams(c: LegacyClip): ClipParams {
    return normalizeClipParams({ axis: c.axis ?? 2, min: c.min, max: c.max, invert: c.invert ?? false }, this.defaultParams('clip') as ClipParams, this.cellBounds());
  }

  /** version 2 장면의 전역 `filter` 를 version 3 의 pointFilter 모양으로 옮긴다 (읽기 호환). clip 모드는 한쪽 구간, slice 모드는 얇은 층, box 는 무시 */
  private pointFilterFromLegacy(f: LegacyFilter): LegacyPointFilter {
    const b = this.dataset?.bounds ?? { min: [0, 0, 0], max: [1, 1, 1] };
    const st = this.currentStats();
    const threshold: LegacyThreshold = { enabled: f.thresholdEnabled ?? false, min: f.thresholdMin ?? st.min, max: f.thresholdMax ?? st.max };
    let clip: LegacyClip = { enabled: false };
    if (f.clipActive && f.clipNormal && f.clipPosition) {
      const i = f.clipNormal.indexOf(1);
      const axis = (i < 0 ? 2 : i) as Axis;
      const pos = f.clipPosition[axis];
      if (f.clipMode === 'slice') { const h = (f.sliceThickness ?? this.finestSpacing() * 1.2) / 2; clip = { enabled: true, axis, min: pos - h, max: pos + h }; }
      else clip = { enabled: true, axis, min: f.clipInvert ? b.min[axis] : pos, max: f.clipInvert ? pos : b.max[axis] };
    }
    return { clip, threshold };
  }

  // ---- 표시 ----
  setDisplay(patch: Partial<DisplayState>): void {
    const { upAxis, ...rest } = patch;
    Object.assign(this.display, rest);
    if (upAxis !== undefined && isUpAxis(upAxis)) this.display.upAxis = upAxis; // 장면 JSON 의 틀린 값은 버린다(지금 값 유지)
    this.applyDisplay();
    this.emit();
  }

  private applyDisplay(): void {
    if (this.display.upAxis !== this.appliedUp) this.applyUp();
    this.scenery.setBuildingsVisible(this.display.buildingsVisible);
    this.scenery.setBuildingOpacity(this.display.buildingOpacity);
    this.scenery.setGridVisible(this.display.gridVisible);
    this.setProjection(this.display.projection);
    this.updateGizmo();
  }

  /** 데이터를 열 때 규칙으로 정한 위쪽을 바로 적용한다 (알리지 않음 — 이어지는 installLevels 가 알린다). 격자·시점을 만들기 전에 부른다 */
  private useUp(up: UpAxis): void {
    this.display.upAxis = up;
    if (up !== this.appliedUp) this.applyUp();
  }

  /**
   * 위쪽(display.upAxis)을 카메라 두 대의 up · 회전 조작기의 회전 기준 · 바닥 격자와 조명 · 위치 표시 · Streamline 단면 틀에 적용한다.
   * 카메라 자리는 그대로 두고 방향만 새 위쪽으로 다시 세운다(도구막대는 이어서 지금 보기 방향으로 다시 맞춘다 — app/shell.ts).
   * OrbitControls 는 만들 때 object.up 으로 회전 기준(_quat · _quatInverse, three 0.179.1 OrbitControls.js:404)을 한 번만 계산하므로
   * 그 내부 필드를 다시 계산한다(없으면 가로로 끌 때 옛 축으로 돈다 — three 를 올리면 scripts/test_up_axis.mjs 가 잡는다).
   * Streamline 시작점의 '세로' 범위와 단면 틀도 위쪽을 따르므로(streamSeeds · applyStreamStyle) Streamline 모양을 그리는 노드를 다시 계산한다
   * (다시 계산이 끝나면 rebuildStreams 가 새 위쪽으로 모양을 넘긴다).
   */
  private applyUp(): void {
    const up = this.display.upAxis;
    this.appliedUp = up;
    const v = upVector(up);
    this.perspCamera.up.set(v[0], v[1], v[2]);
    this.orthoCamera.up.set(v[0], v[1], v[2]);
    const oc = this.controls as unknown as { _quat?: unknown; _quatInverse?: unknown };
    if (oc._quat instanceof THREE.Quaternion && oc._quatInverse instanceof THREE.Quaternion) {
      oc._quat.setFromUnitVectors(this.perspCamera.up, new THREE.Vector3(0, 1, 0));
      oc._quatInverse.copy(oc._quat).invert();
    } else {
      console.warn('OrbitControls 에 회전 기준(_quat · _quatInverse)이 없어 마우스 회전축이 위쪽을 따르지 않습니다. three 판을 확인하세요.');
    }
    this.scenery.setUp(up);
    this.planeGizmo.setUp(up);
    for (const rt of this.runtime.values()) if (rt.kind === 'stream') rt.dirty = true;
    this.controls.update();
  }

  /** 새 객체를 놓을 자리: 화면 회전 중심의 x·y, 높이는 형상 바닥(없으면 데이터 바닥) */
  placementPoint(): [number, number, number] {
    const ob = this.objects.bounds();
    const z = ob ? ob.min[2] : (this.dataset ? this.dataset.bounds.min[2] : 0);
    return [this.controls.target.x, this.controls.target.y, z];
  }

  // ---- 카메라 ----
  /** 왼쪽 패널이 덮는 너비(px). 장면 중심을 가려지지 않는 영역의 가운데에 둔다 (카메라 view offset). 투영은 바로, 그리기 버퍼는 다음 프레임에 맞춘다 */
  setViewInset(px: number): void { this.viewInset = Math.max(0, px); this.syncProjection(); this.lastW = 0; }

  /**
   * 투영(카메라 틀 — 가로세로 비 · 패널만큼 비켜 그리기)만 지금 화면 크기와 패널 폭에 바로 맞춘다. 그리기 버퍼(캔버스) 크기는 지금처럼 다음 프레임 resize 가 맞춘다.
   * 전에는 다음 프레임에만 맞춰서, 그리기 반복(requestAnimationFrame)이 멈춘 배경 탭·숨긴 iframe 에서 데이터를 열면 첫 화면 맞춤이
   * 패널 폭을 빼지 않고 계산돼 보이는 순간 장면이 패널 폭의 절반만큼 밀렸다(2026-11-05 브라우저 확인 — FeDiT 가 탭을 숨긴 채 미리 읽는 경우).
   * 캡처 중(captureBlob 이 캡처 해상도로 맞춰 둔 동안)에는 덮어쓰지 않는다. 화면 크기가 0(display:none)이면 맞출 크기가 없으므로 그대로 둔다.
   */
  private syncProjection(): void {
    if (this.capturing) return;
    const w = this.container.clientWidth, h = this.container.clientHeight;
    if (!w || !h) return;
    this.applyProjection(w, h, Math.min(this.viewInset, w * 0.6));
  }
  /** captureBlob 이 캡처 해상도로 투영을 맞춰 둔 동안 — syncProjection 이 화면 크기로 되돌리지 않게 */
  private capturing = false;

  /**
   * 화면 맞춤. target: data = 데이터 범위(없으면 계산 영역, 그것도 없으면 형상) · shapes = 형상 전체 · domain = 계산 영역 상자 ·
   * all = 셋을 모두 담는 범위(전처리 기본: 영역 STL이 계산 영역보다 커도 카메라가 그 안에 갇히지 않게). 맞출 대상이 하나도 없으면 아무것도 하지 않는다.
   */
  fitView(direction: 'iso' | 'top' | 'front' | 'side' = this.lastFitDirection, target: FitTarget = this.lastFitTarget): void {
    const changed = direction !== this.lastFitDirection;
    this.lastFitDirection = direction;
    this.lastFitTarget = target;
    this.frameView(direction, target);
    // 보기 방향이 바뀌면 알린다 — 도구막대의 보기 단추가 지금 시점을 보이게(데이터를 열면 안에서 등각으로 맞춘다).
    // 도구막대에서 위쪽을 고르면 이 방향·대상으로 다시 맞추므로, 눌려 보이는 단추와 실제로 다시 맞추는 방향이 늘 같다
    if (changed) this.emit();
  }

  /** 마지막으로 맞춘 보기 방향(fitView). 도구막대의 보기 단추가 이 값을 보인다 */
  get fitDirection(): 'iso' | 'top' | 'front' | 'side' { return this.lastFitDirection; }

  /** fitView 의 몸통: 맞출 범위를 골라 카메라를 그 방향에 놓는다 */
  private frameView(direction: 'iso' | 'top' | 'front' | 'side', target: FitTarget): void {
    this.syncProjection(); // 아래가 읽는 가로세로 비 · view offset 을 지금 화면에 맞춰 둔다 (그리기 반복이 멈춘 숨긴 탭에서도)
    let min: THREE.Vector3, max: THREE.Vector3;
    const sb = target === 'shapes' || (target === 'data' && !this.dataset && !this.domain) ? this.scenery.shapeBounds() : null;
    const db = target === 'domain' || (target === 'data' && !this.dataset) ? this.domain : null;
    if (target === 'all') {
      const box = new THREE.Box3();
      if (this.dataset) box.union(new THREE.Box3(new THREE.Vector3().fromArray(this.dataset.bounds.min), new THREE.Vector3().fromArray(this.dataset.bounds.max)));
      if (this.domain) box.union(new THREE.Box3(new THREE.Vector3().fromArray(this.domain.min), new THREE.Vector3().fromArray(this.domain.max)));
      const s = this.scenery.shapeBounds();
      if (s) box.union(s);
      if (box.isEmpty()) return;
      min = box.min; max = box.max;
    }
    else if (sb) { min = sb.min; max = sb.max; }
    else if (db) { min = new THREE.Vector3().fromArray(db.min); max = new THREE.Vector3().fromArray(db.max); }
    else if (this.dataset) { min = new THREE.Vector3().fromArray(this.dataset.bounds.min); max = new THREE.Vector3().fromArray(this.dataset.bounds.max); }
    else return;
    const center = min.clone().add(max).multiplyScalar(0.5);
    // 여유 배율: 형상만 맞출 때는 둘레가 보이게 넉넉히, 전체는 조금, 데이터는 꼭짓점이 화면 끝에 거의 닿게
    const margin = sb ? 1.8 : target === 'all' ? 1.12 : 1.05;
    // view offset이 걸려 있으면 가려지지 않은 영역의 가로 폭만큼만 쓴다
    const view = this.camera.view;
    const visFrac = view && view.enabled ? Math.max(0.2, (2 * view.width - view.fullWidth) / view.fullWidth) : 1;
    const ortho = this.camera === this.orthoCamera;
    const aspect = ortho
      ? (this.orthoCamera.right - this.orthoCamera.left) / Math.max(this.orthoCamera.top - this.orthoCamera.bottom, 1e-9)
      : this.perspCamera.aspect;
    const tanV = Math.tan(THREE.MathUtils.degToRad(this.perspCamera.fov) / 2);
    const tanH = tanV * aspect * visFrac; // 가려지지 않은 부분의 가로 반각
    // 직교에서는 도면처럼: 정면·측면은 수평으로, 등각은 참 등각(방위 45°, 고도 35.26° = (1,1,1) 대각선 방향)
    // 아래 방향은 +Z 가 위일 때의 값이고, 위쪽(display.upAxis)에 맞춰 회전표로 옮긴다(core/upAxis.ts fromZUp) — '평면'은 언제나 위쪽에서 내려다본다
    const zUpDir = direction === 'top' ? [0, -0.001, 1]
      : direction === 'front' ? [-1, 0, ortho ? 0 : 0.15]
      : direction === 'side' ? [0, -1, ortho ? 0 : 0.15]
      : ortho ? [-1, -1, 1]
      : [-0.7, -1, 0.75];
    const dirArr = fromZUp(this.display.upAxis, zUpDir) as [number, number, number];
    const dir = new THREE.Vector3().fromArray(dirArr);
    // 상자 꼭짓점 8개가 보이는 부분(패널에 가려진 쪽 제외) 안에 다 들어오는 거리·세로 길이 (core/fitFrame.ts)
    const fit = fitBox(min.toArray() as [number, number, number], max.toArray() as [number, number, number], dirArr,
      upVector(this.display.upAxis) as [number, number, number], tanV, tanH, margin);
    const dist = ortho ? Math.max(fit.dist, fit.orthoHeight) : fit.dist; // 직교는 거리가 크기에 영향 없음 — 절단 범위용
    this.camera.position.copy(center).add(dir.normalize().multiplyScalar(dist));
    this.controls.target.copy(center);
    if (ortho) {
      // 보이는 폭 안에 상자가 들어오게 세로 길이를 정한다(꼭짓점 투영 — 등각의 대각선도 그대로 셈)
      this.orthoHeight = fit.orthoHeight;
      this.orthoCamera.zoom = 1;
      const halfH = this.orthoHeight / 2;
      this.orthoCamera.left = -halfH * aspect; this.orthoCamera.right = halfH * aspect;
      this.orthoCamera.top = halfH; this.orthoCamera.bottom = -halfH;
    }
    this.setClipRange(dist);
    this.controls.update();
  }

  /** 원근 ↔ 직교 전환. 보는 방향과 화면에 잡힌 크기를 그대로 유지한다 */
  private setProjection(mode: 'perspective' | 'orthographic'): void {
    const next = mode === 'orthographic' ? this.orthoCamera : this.perspCamera;
    if (next === this.camera) return;
    const prev = this.camera;
    const target = this.controls.target;
    const tanHalf = Math.tan(THREE.MathUtils.degToRad(this.perspCamera.fov) / 2);
    next.position.copy(prev.position);
    next.quaternion.copy(prev.quaternion);
    if (next === this.orthoCamera) {
      this.orthoHeight = 2 * prev.position.distanceTo(target) * tanHalf; // 회전 중심 거리에서 보이던 세로 길이
      this.orthoCamera.zoom = 1;
    } else {
      const dist = (this.orthoHeight / this.orthoCamera.zoom) / (2 * tanHalf);
      const back = prev.position.clone().sub(target).normalize();
      next.position.copy(target).addScaledVector(back, dist);
    }
    this.camera = next;
    this.syncProjection(); // 새 카메라의 투영을 바로 (장면 불러오기처럼 프레임 없이 이어서 맞추는 길이 낡은 틀을 읽지 않게)
    for (const r of this.dataRenderers()) r.surface.setOrtho(next === this.orthoCamera);
    this.controls.object = next;
    this.editor.setCamera(next);
    this.setClipRange(next.position.distanceTo(target));
    this.lastW = 0; // 다음 프레임에 그리기 버퍼·점 크기를 다시 맞춘다
    this.controls.update();
  }

  /** 활성 카메라의 투영을 화면 크기에 맞춘다. inset = 왼쪽 패널이 덮는 너비(px) — 그만큼 장면 중심을 오른쪽으로 민다 */
  private applyProjection(w: number, h: number, inset: number): void {
    const fullW = w + inset;
    if (this.camera === this.perspCamera) {
      this.perspCamera.aspect = fullW / h;
    } else {
      const halfH = this.orthoHeight / 2, halfW = halfH * (fullW / h);
      this.orthoCamera.left = -halfW; this.orthoCamera.right = halfW;
      this.orthoCamera.top = halfH; this.orthoCamera.bottom = -halfH;
    }
    if (inset > 0) this.camera.setViewOffset(fullW, h, 0, 0, w, h); else this.camera.clearViewOffset();
    this.camera.updateProjectionMatrix();
  }

  /** 앞뒤 절단 범위. 직교는 깊이 정밀도가 거리와 무관하고 카메라 뒤쪽도 보여야 하므로 near를 음수로 둔다 */
  private clipDist = 1;
  private setClipRange(dist: number): void {
    this.clipDist = Math.max(dist, 1e-6);
    const b = this.dataset?.bounds;
    const diag = b ? Math.hypot(b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2]) : dist;
    this.perspCamera.near = Math.max(dist / 5000, 0.001);
    this.perspCamera.far = dist * 100;
    const r = Math.max(dist, diag) * 20;
    this.orthoCamera.near = -r; this.orthoCamera.far = r;
    this.camera.updateProjectionMatrix();
  }

  /** 포인트 크기 계산에 쓰는 화면 정보 (직교면 보이는 세로 길이를 넘겨 거리와 무관한 크기로) */
  private updatePointScale(heightPx = this.renderer.domElement.height): void {
    const orthoVisible = this.camera === this.orthoCamera ? this.orthoHeight / this.orthoCamera.zoom : 0;
    for (const r of this.pointRenderers()) r.updateViewport(this.perspCamera.fov, heightPx, orthoVisible);
  }

  /** 직교 투영일 때 화면 1픽셀(CSS)이 몇 m인지. 원근이면 null (거리마다 달라 축척이 성립하지 않음) */
  metersPerPixel(): number | null {
    if (this.camera !== this.orthoCamera || !this.lastH) return null;
    return (this.orthoHeight / this.orthoCamera.zoom) / this.lastH;
  }

  private setLineResolution(w: number, h: number): void {
    for (const rt of this.runtime.values()) {
      if (rt.renderer instanceof SliceRenderer || rt.renderer instanceof StreamlineRenderer) rt.renderer.setResolution(w, h);
    }
  }

  /**
   * 보이는 노드(데이터 먼저) 중 다시 계산 표시가 된 것을 계산한다. 숨긴 노드는 다시 보일 때 계산한다.
   * 먼저 쓰는 배열이 바뀌었는지 본다(syncUsedArrays — 바뀌었으면 빠진 배열 읽기를 시작하고 화면에 알리게 true).
   * 기대는 배열(core/usedArrays.ts nodeArrays — 노드 + 조상 사슬)이 지금 장면에 아직 없는 노드는 계산하지 않고 다시 계산 표시를 그대로 둔다(앞 그림 유지):
   * 없는 채 계산하면 Threshold·Scalar Clip 이 아무것도 거르지 않거나 Glyph 를 크기로 칠하는 '틀린 그림'이 나오고 Apply 넓히기(growPending)도 사라진다
   */
  private rebuildDirtyLayers(): boolean {
    const synced = this.syncUsedArrays();
    let rebuilt = false;
    this.passId++; // 이 차례에 처음 정해진 색 지도는 뒤에 계산되는 노드 값으로 넓힌다 (colorForRebuild)
    for (const id of [ROOT_ID, ...this.layers.map((l) => l.id)]) {
      const rt = this.runtime.get(id);
      if (!rt) continue;
      if (!this.nodeVisible(id)) {
        // 숨은 채 낡은 Volume 의 그린 셀(히스토그램용)은 놓는다 — 지난 시점의 값 배열을 붙잡지 않게. 다시 보이면 계산하면서 새로 넣는다
        if (rt.dirty && rt.renderer instanceof DataViewRenderer) rt.renderer.volume.drawnCells = null;
        continue;
      }
      if (rt.kind === 'glyph') {
        const src = this.sourceOf(id);
        if (src?.type === 'glyph' && src.params.mode === 'plane') {
          const side = this.cameraSide(src.params.axis, src.params.position);
          if (side !== rt.lastSide) { rt.lastSide = side; rt.dirty = true; } // Glyph 를 카메라 쪽으로 띄우는 방향이 바뀜
        }
      }
      if (rt.dirty) {
        if (this.nodeMissing(id).length) continue; // 배열이 오면(afterArrival 뒤 markAllLayers) 계산한다
        this.rebuildNode(id, rt);
        rebuilt = true;
      }
    }
    return rebuilt || synced;
  }

  /** 현재 장면을 PNG로 캡처한다. 크기를 주면 그 해상도로 따로 그린다 (보고서용). */
  async captureBlob(width?: number, height?: number, refit = false): Promise<Blob> {
    const el = this.renderer.domElement;
    const sized = !!(width && height);
    try {
      if (sized) {
        this.capturing = true; // 아래 fitView(frameView)·그사이 패널 폭 알림(setViewInset)이 캡처 투영을 화면 크기로 되돌리지 않게
        this.renderer.setPixelRatio(1);
        this.renderer.setSize(width!, height!, false);
        this.applyProjection(width!, height!, 0);
        this.updatePointScale(height);
        this.setLineResolution(width!, height!);
        if (refit) this.fitView();
      }
      this.rebuildDirtyLayers();
      // 좌표축 글자는 캡처에도 넣는다(좌표축의 일부). 크기는 지금 카메라로 다시 잰다 — 다시 맞춘(refit) 카메라에서도 화면과 같은 비율이 되게
      this.scenery.updateLabels(this.camera, this.lastH);
      this.renderScene(false); // 캡처에는 위치 표시·편집 핸들을 넣지 않는다. Volume 이 있으면 장면 깊이도 이 해상도로 다시 그린다
      return await new Promise<Blob>((resolve, reject) =>
        el.toBlob((b) => (b ? resolve(b) : reject(new Error('캡처에 실패했습니다.'))), 'image/png'));
    } finally {
      if (sized) {
        this.capturing = false;
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.lastW = 0; // 다음 프레임에 화면 크기로 복구
      }
    }
  }

  async saveCapture(name?: string, width = 1920, height = 1080, refit = false): Promise<string> {
    const blob = await this.captureBlob(width, height, refit);
    const base = name ?? `cfd-render-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}`;
    // 개발 서버에서만 captures/ 폴더에 저장한다(/__capture — vite.config.ts). 빌드한 페이지는 바로 내려받기 (호스트 서버로 올라가지 않게)
    if (import.meta.env.DEV) {
      try {
        const res = await fetch(`/__capture?name=${encodeURIComponent(base)}`, { method: 'POST', body: blob });
        if (res.ok) { const f = (await res.json()).file; if (typeof f === 'string') return f; }
      } catch { /* 저장 실패 시 다운로드로 */ }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${base}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    return `${base}.png`;
  }

  // ---- 루프 ----
  /** visibleCount = 보이는 볼륨 노드가 Points 표현으로 그린 점 수의 합 (rebuildDirtyLayers 다음에 불러 마스크가 최신이다) */
  private recount(): void {
    this.countDirty = false;
    let n = 0;
    if (this.dataset) {
      for (const id of this.volumeNodeIds()) {
        const rt = this.runtime.get(id);
        if (!rt || rt.dirty || !this.nodeVisible(id)) continue;
        const r = rt.renderer as DataViewRenderer;
        if (r.shownRepresentation() === 'points') n += r.points.visibleCount;
      }
    }
    this.visibleCount = n;
    this.emit();
  }

  /** 화면 크기에 그리기 버퍼·투영을 맞춘다. 장면 깊이 그림판은 renderScene 이 그릴 때마다 그리기 버퍼 크기에 맞추므로 여기서 따로 손대지 않는다 */
  private resize(): void {
    const w = this.container.clientWidth || 1, h = this.container.clientHeight || 1;
    this.lastW = w; this.lastH = h;
    this.renderer.setSize(w, h, false);
    const inset = Math.min(this.viewInset, w * 0.6);
    this.applyProjection(w, h, inset);
    this.updatePointScale();
    this.setLineResolution(w, h);
  }

  /**
   * 장면을 그리기 버퍼에 그린다 (frame·captureBlob 공통). helpers = 위치 표시·편집 핸들을 넣을지 (캡처는 넣지 않는다).
   * 보이는 Volume 이 있을 때만 먼저 장면 깊이를 따로 그린다(renderSceneDepth). 없으면 예전처럼 한 번만 그리고, 남아 있던 깊이 그림판은 놓는다.
   */
  private renderScene(helpers: boolean): void {
    const vols = this.drawnVolumes();
    const gizmoVisible = this.planeGizmo.group.visible;
    const hide = !helpers || vols !== null;
    if (hide) { this.planeGizmo.group.visible = false; this.editor.setHelperVisible(false); }
    if (vols) this.renderSceneDepth(vols); else this.releaseSceneDepth();
    if (hide && helpers) { this.planeGizmo.group.visible = gizmoVisible; this.editor.setHelperVisible(true); }
    this.renderer.render(this.scene, this.camera);
    if (!helpers) { this.planeGizmo.group.visible = gizmoVisible; this.editor.setHelperVisible(true); }
  }

  /** 이번 그리기에 들어가는 Volume 들. 없으면 null (매 프레임 부르므로 없을 때는 배열을 만들지 않는다) */
  private drawnVolumes(): VolumeRenderer[] | null {
    let out: VolumeRenderer[] | null = null;
    for (const rt of this.runtime.values()) {
      if (!(rt.renderer instanceof DataViewRenderer) || !rt.renderer.volume.drawn()) continue;
      if (!out) out = [];
      out.push(rt.renderer.volume);
    }
    return out;
  }

  /**
   * 장면 깊이 선행 패스: Volume 상자·위치 표시·편집 핸들을 숨기고(캡처와 같은 방식) 같은 카메라로 장면을 그리기 버퍼 크기의 그림판(MSAA 없음)에 그려
   * DepthTexture 를 얻고, 보이는 Volume 마다 넘긴다 — 광선 끝 = min(상자 출구, 이 깊이). 그래서 건물·몸체·Slice 뒤의 공기가 그 앞면 위에 덮이지 않는다.
   * Volume 을 숨기는 것은 그 깊이 텍스처를 읽으면서 쓰는 충돌도 피한다. overrideMaterial 은 쓰지 않는다(절단면이 재질마다 걸려 있고 Points 숨김은 정점 셰이더가 한다).
   * 깊이를 쓰지 않는 반투명 물체는 이 깊이에 없으므로 Volume 앞에 있어도 안개 아래에 깔린다 (검토 (a)4 — 지금은 고치지 않는다):
   *   반투명 Streamline(Opacity < 1, streamlineRenderer.ts:95) · Contour lines(늘, sliceRenderer.ts:78) · Surface Opacity < 1(cellSurfaceRenderer.ts:107) ·
   *   Slice Opacity ≤ 0.5(sliceRenderer.ts:141) · Isosurface Opacity ≤ 0.5(isosurfaceRenderer.ts:28) ·
   *   형상 Opacity ≤ 0.6(scenery.ts:204 — 결과 폴더에서 용기 벽이 데이터를 덮으면 자동 0.35, loadResultFolder) · 형상의 부피 영역(늘, scenery.ts:211) ·
   *   지면 격자(scenery.ts:116) · 위치 표시의 옅은 면(planeGizmo.ts:50, 이 패스에서는 숨김).
   * 거꾸로 깊이를 쓰는 반투명 물체(Slice·Isosurface Opacity 0.5 초과, 형상 0.6 초과)에서는 광선이 멈춰 그 뒤의 안개가 비치지 않는다.
   * 선(Outline·건물 모서리·계산 영역 상자)·Glyph·Points·불투명 Streamline 도 깊이를 써서 그 픽셀에서 광선이 멈춘다(의미상 맞음).
   * 그림판에 그릴 때 three 는 출력 색공간을 선형으로 두므로 재질마다 프로그램이 하나씩 더 생긴다(처음 Volume 을 띄울 때 한 번 컴파일).
   */
  private renderSceneDepth(vols: VolumeRenderer[]): void {
    const size = this.renderer.getDrawingBufferSize(this.bufferSize);
    if (!this.depthTarget) {
      this.depthTarget = new THREE.WebGLRenderTarget(size.x, size.y, { depthTexture: new THREE.DepthTexture(size.x, size.y), samples: 0 });
    } else this.depthTarget.setSize(size.x, size.y); // 크기가 바뀌었을 때만 새로 잡는다 (화면 크기·캡처 해상도)
    for (const v of vols) v.group.visible = false;
    this.renderer.setRenderTarget(this.depthTarget);
    this.renderer.render(this.scene, this.camera);
    this.renderer.setRenderTarget(null);
    const depth = this.depthTarget.depthTexture!;
    for (const v of vols) {
      v.group.visible = true; // drawn() 이었으므로 원래 보였다
      v.setSceneDepth(depth, this.camera.near, this.camera.far);
    }
  }

  /** 장면 깊이 그림판을 놓는다 (보이는 Volume 이 없을 때. 깊이 텍스처도 함께 — three deallocateRenderTarget) */
  private releaseSceneDepth(): void {
    if (!this.depthTarget) return;
    this.depthTarget.dispose();
    this.depthTarget = null;
  }

  private frame(): void {
    if (this.container.clientWidth !== this.lastW || this.container.clientHeight !== this.lastH) this.resize();
    // 휠로 멀리 나가거나 가까이 들어오면 앞뒤 절단 범위를 거리에 맞춘다 — 깊이 정밀도가 거리²/near에 비례하므로 near가 그대로면 멀리서 면이 떨린다
    if (this.camera === this.perspCamera) {
      const d = this.camera.position.distanceTo(this.controls.target);
      if (d > this.clipDist * 1.5 || d < this.clipDist / 1.5) this.setClipRange(d);
    }
    if (this.clipPending) {
      // 형상을 끌고 있을 때 Slice 를 매 프레임 다시 자르면 무거우므로 지난 계산 시간에 맞춰 띄엄띄엄. 마지막 배치는 반드시 반영된다
      const now = performance.now();
      if (now - this.lastClipRebuild >= Math.min(500, 3 * this.lastSliceMs)) {
        this.clipPending = false; this.lastClipRebuild = now;
        for (const l of this.layers) if (l.type === 'slice' && l.params.clipToObjects) this.markSubtree(l.id); // 그 Slice 모양을 다시 그리는 Clip·Threshold 노드도
      }
    }
    const rebuilt = this.rebuildDirtyLayers();
    if (this.countDirty) this.recount();
    if (rebuilt) this.emit();
    this.planeGizmo.tick(performance.now());
    this.controls.update();
    if (this.camera === this.orthoCamera) this.updatePointScale(); // 직교는 확대(zoom)가 바뀌면 포인트 크기도 바뀐다
    this.scenery.updateHeadlight(this.camera, this.controls.target);
    this.scenery.updateLabels(this.camera, this.lastH);
    this.renderScene(true);
    this.frameCount++;
    const now = performance.now();
    if (now - this.fpsTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.fpsTime));
      this.frameCount = 0;
      this.fpsTime = now;
      this.emit();
    }
  }
}

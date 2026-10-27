// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   volumeRenderer.ts

볼륨 노드의 Volume 표현: 남은 셀의 값을 시선을 따라 조금씩 나아가며(ray marching) 색과 불투명도를 앞에서 뒤로 쌓아 그린다.
- 레벨(해상도가 다른 격자 층)마다 3D 텍스처 하나(R32F, NEAREST — 셀 하나에 한 색이라 Surface 색과 같다). 값은 정규화하지 않은 원래 값이라
  Range·Preset 을 바꿔도 다시 올리지 않고 uniform·전달함수 텍스처만 바꾼다.
- 칸마다 약속값: 값(< 1e29) = 그림 · VOLUME_EMPTY(1e30) = 이 레벨에 값 없음(고운 레벨이 덮은 굵은 칸·고체) → 셰이더가 더 굵은 레벨로 내려감 ·
  VOLUME_CUT(3e30) = 이 레벨이 차지한 칸이지만 Clip·Threshold 로 빠졌거나 값이 결측 → 내려가지 않고 비움(그 자리에 굵은 값이 비쳐 보이지 않게).
  그래서 레벨 우선순위는 occupancy(칸에 값이 있는지)로, 남길지는 고른 레벨에서만 정해진다 — 마스크 텍스처를 따로 두지 않는다.
- 셰이더 하나가 고운 레벨부터 모든 레벨을 읽는다(레벨마다 메시를 따로 그리면 고운 상자가 굵은 상자 안에 들어가 앞뒤 순서가 틀린다).
  sampler 는 상수 번호로만 읽을 수 있어 레벨 수만큼 코드를 펼쳐 만든다(레벨 수가 바뀌면 재질을 새로 만든다).
- 상자 셋: 레벨 텍스처 상자(origin − h/2 부터 dims·h — 텍스처 좌표 = (p − origin + h/2) / (dims·h), 셀 중심 = origin + i·h 와 맞음) ·
  레벨이 차지한 칸(값·잘림)의 상자(밖이면 그 레벨을 읽지 않음 — 밖은 모두 '값 없음'이라 결과가 같다) ·
  광선을 걷는 상자 = 값이 있는 칸 상자들의 합(밖에서는 쌓을 것이 없다 — Clip·Threshold 로 조금만 남으면 그만큼만 걷는다). 셋 다 버퍼에서 셈한다.
- 걸음: 그 자리에서 고른 레벨 간격의 0.5배. 어느 레벨에도 값이 없으면 그 자리를 덮는(차지한 칸 상자) 가장 굵은 레벨 간격의 0.5배(빈 곳은 크게 건너뜀),
  어느 레벨 상자에도 들지 않으면 가장 굵은 레벨 간격의 0.5배. 걸음 수 상한 4096, 누적 불투명도 0.99 에서 멈춘다.
  아무것도 쌓지 않은 큰 걸음(빈 곳·잘린 칸) 끝이 더 고운 칸에 닿으면 그 걸음 구간을 이 자리 걸음으로 한 번 다시 걷는다 — 몸체 안처럼 굵게 건너뛴 빈 곳 바로 뒤의
  고운 칸(경계층)을 최대 굵은 걸음만큼 빠뜨리지 않게. 쌓은 걸음 뒤(굵은 값 → 고운 값)는 다시 걷지 않는다(겹쳐 쌓이므로) — 이웃 레벨 간격이 2배면 고운 칸 한 개 이하가 남는 오차.
  불투명도는 걸음 길이로 보정한다: a = 1 − (1 − Opacity)^(걸음 / Unit Distance) — 걸음이 레벨마다 달라도 같은 결과(VTK Scalar Opacity Unit Distance 의 뜻).
  띠무늬를 줄이려고 시작점을 픽셀마다 한 걸음 안에서 흔든다. 표본마다 세는 길이는 앞 표본이 센 끝부터 다음 표본과의 가운데까지(마지막 표본은 광선 끝까지) —
  광선의 각 자리를 가장 가까운 표본이 맡아 표본들이 광선 [입구, 끝]을 빈틈·겹침 없이 나눠 갖는다(흔든 만큼 입구 쪽이 빠져 픽셀마다 진하기가 달라지지 않게
  — 한 층짜리 판에서 두드러진다. 빈 칸 ↔ 값 칸 경계에서도 평균 반 걸음씩 치우치지 않는다).
- 콘솔 확인용: VolumeRenderer.levelDebug 를 켜면(AppCore.debugVolumeLevels) 색 대신 고른 레벨 번호로 칠한다(투명도는 그대로) — 레벨이 공간을 나눠 갖는 모습 확인.
- 큰 격자 줄여 올리기(volumeFactors · reducedGrid · fillVolumeLevel — AppCore.rebuildVolume 이 쓴다): 레벨의 가장 긴 변이 GPU 한계(MAX_3D_TEXTURE_SIZE)를
  넘으면 정수 배율 f = ceil(가장 긴 변 / 한계)로 축마다 f 칸씩 묶고, 노드의 칸 수 합이 VOLUME_MAX_TEXELS 를 넘으면 칸이 가장 많은 레벨부터 f 를 더 올린다.
  묶음 값 = 묶음 안 남은 셀 값의 평균(하나라도 남으면 남김 — scripts/downsample_vtu.py 와 같은 발상). 셰이더는 묶은 레벨도 같은 레벨로 다룬다(간격만 f 배).
- 그린 셀(drawnCells — 레벨마다 원래 셀 값과 남은 셀 표시)을 지울 때까지 들고 있다: Opacity 곡선 편집기의 히스토그램이 그 노드가 그리는 셀만 센다(줄여 올렸어도 원래 셀 값으로).
- 상자의 뒷면(BackSide)을 그려 카메라가 상자 안에 있어도 그려진다. 원근은 카메라에서, 직교는 상자 입구에서 광선을 시작한다(직교는 near 가 음수라
  카메라 뒤도 보인다). 깊이 검사·쓰기를 끄고 반투명 물체 다음(renderOrder 2 — Streamline 1 다음)에 섞는다. 위치 표시의 테두리·화살표·Box Clip 상자(10·11)는
  그 뒤라 안개 위에 보이고, 데이터 상자 테두리·옅은 면(0)은 다른 장면 물체처럼 안개 아래에 놓인다.
  뒷면이 카메라 far 면보다 멀어도 잘리지 않게 정점 셰이더가 깊이를 far 면에 붙인다(깊이 검사를 끄므로 z 는 잘림에만 쓰인다 — 화면 자리·vWorld 는 그대로).
  광선 끝 = min(상자 출구, 장면 깊이, far 면): AppCore.renderScene 이 Volume·위치 표시를 뺀 장면 깊이를 미리 그려 넘기고(setSceneDepth), 셰이더가 그 픽셀 깊이를
  view z(카메라 기준 깊이 — perspectiveDepthToViewZ / orthographicDepthToViewZ, 직교 near 는 음수)로 바꿔 광선 위 거리로 옮긴다 — 건물·Slice 뒤로 쌓지 않는다.
  그 픽셀에 물체가 없으면(깊이 1) far 면에서 멈춘다(다른 물체도 거기서 잘린다). 깊이를 쓰지 않는 반투명 물체는 그 깊이에 없어 앞에 있어도 안개 아래에 깔린다(목록은 AppCore.renderSceneDepth).
- glslVersion 을 정하지 않는다(null): three 가 gl_FragColor 를 바꿔 주고 colorspace_fragment 가 동작한다.
  반복문 안의 텍스처 읽기는 textureLod(…, 0.0) — 밉맵이 없어 결과는 같고, 화면 기울기 계산이 없어 반복문 안에서도 안전하다
  (Windows ANGLE D3D 의 '흐름이 갈리는 반복문 안 기울기 연산' 제약을 피하려는 것. 일반 지식이며 실측 전).
- 음영 없음(ParaView Shade 기본 끔). 그리는 방식은 GPU ray marching 하나뿐(PV와 다름: PV 는 Smart 등 모드를 고른다).
  보간은 NEAREST(PV와 다름: PV 이미지 볼륨의 기본 보간은 Cubic).
*/
/******************************************************************************/
import * as THREE from 'three';
import { CellColorSpec } from './cellSurfaceRenderer';
import { ColormapId, DEFAULT_OPACITY_CURVE, OpacityCurve, makeTransferTexture } from '../utils/colormap';

/** 이 레벨에 값이 없음 — 셰이더가 더 굵은 레벨로 내려간다 */
export const VOLUME_EMPTY = 1e30;
/** 이 레벨이 차지했지만 그리지 않음(Clip·Threshold 로 빠짐·값 결측) — 더 굵은 레벨로 내려가지 않고 비운다 */
export const VOLUME_CUT = 3e30;
/** 칸 값이 이보다 작으면 그릴 값, CUT_MIN 이상이면 잘린 칸, 그 사이(VOLUME_EMPTY)는 이 레벨에 값 없음 — 셰이더의 1.0e29·2.0e30 과 같은 기준 */
const VALUE_MAX = 1e29;
const CUT_MIN = 2e30;
/** 광선 하나의 최대 걸음 수 */
const MAX_STEPS = 4096;
/** 노드 하나의 3D 텍스처 칸 수 한계 (R32F 로 128 MB). 넘으면 칸이 가장 많은 레벨부터 더 줄여 올린다(volumeFactors) */
export const VOLUME_MAX_TEXELS = 32_000_000;

type Vec3i = [number, number, number];

/** 레벨을 f 배로 묶을 때 축마다의 묶음 칸 수. f 보다 짧은 축(한 층짜리 등)은 그 축 전체가 한 묶음 */
function axisFactors(dims: Vec3i, f: number): Vec3i {
  return [Math.min(f, dims[0]), Math.min(f, dims[1]), Math.min(f, dims[2])];
}

/** f 배로 묶은 뒤의 칸 수 */
function reducedCount(dims: Vec3i, f: number): number {
  const a = axisFactors(dims, f);
  return Math.ceil(dims[0] / a[0]) * Math.ceil(dims[1] / a[1]) * Math.ceil(dims[2] / a[2]);
}

/**
 * 레벨마다(고운 것부터, dims 목록) 줄여 올릴 정수 배율 f (1 = 그대로). 가장 긴 변이 한 변 한계 limit(MAX_3D_TEXTURE_SIZE)를 넘으면 f = ceil(가장 긴 변 / limit)
 * — 묶은 뒤 가장 긴 변 = ceil(변 / f) ≤ limit. 그래도 칸 수 합이 maxTexels 를 넘으면 그 아래로 내려갈 때까지 칸이 가장 많은 레벨의 f 를 하나씩 올린다.
 */
export function volumeFactors(dimsList: Vec3i[], limit: number, maxTexels: number): number[] {
  const lim = Math.max(1, Math.floor(limit));
  const f = dimsList.map((d) => Math.max(1, Math.ceil(Math.max(d[0], d[1], d[2]) / lim)));
  const counts = dimsList.map((d, i) => reducedCount(d, f[i]));
  let total = counts.reduce((s, n) => s + n, 0);
  while (total > maxTexels) {
    let big = 0;
    for (let i = 1; i < counts.length; i++) if (counts[i] > counts[big]) big = i;
    if (counts[big] <= 1) break; // 더 줄일 수 없음 (레벨마다 한 칸)
    f[big]++;
    const n = reducedCount(dimsList[big], f[big]);
    total += n - counts[big];
    counts[big] = n;
  }
  return f;
}

/**
 * f 배로 묶은 레벨의 격자: 칸 수 = ceil(dims / 묶음), 간격 = 간격 × 묶음, origin(셀 (0,0,0) 의 중심) = 첫 묶음의 가운데.
 * 텍스처 상자의 아래 모서리(origin − 간격/2)는 원래와 같다. 끝 묶음이 모자라도 같은 간격이라 위쪽 끝은 최대 묶음 하나 덜 찬 만큼 넓다.
 */
export function reducedGrid(dims: Vec3i, origin: Vec3i, spacing: Vec3i, f: number): { dims: Vec3i; origin: Vec3i; spacing: Vec3i; factors: Vec3i } {
  const a = axisFactors(dims, f);
  return {
    dims: [Math.ceil(dims[0] / a[0]), Math.ceil(dims[1] / a[1]), Math.ceil(dims[2] / a[2])],
    origin: [origin[0] + (a[0] - 1) / 2 * spacing[0], origin[1] + (a[1] - 1) / 2 * spacing[1], origin[2] + (a[2] - 1) / 2 * spacing[2]],
    spacing: [spacing[0] * a[0], spacing[1] * a[1], spacing[2] * a[2]],
    factors: a,
  };
}

/**
 * 레벨 하나의 텍스처 값을 out(묶은 뒤 칸 수)에 채운다. 원래 칸마다 — 그 레벨이 차지한 칸(occ 1)이고 남은 셀(keep)이고 값이 있으면 그 값 ·
 * 차지했는데 사슬(조상 Clip·Threshold)로 빠졌거나 값이 결측(NaN 또는 1e29 이상 결측 표시값 — Surface·Points 셰이더도 버린다)이면 VOLUME_CUT ·
 * 차지하지 않은 칸은 VOLUME_EMPTY. 결측 표시값을 그대로 넣으면 셰이더가 '이 레벨에 값 없음'으로 읽어 굵은 레벨로 내려가므로 값으로 넣지 않는다.
 * 묶음(factors > 1)이면 묶음 하나가 한 칸: 남은 셀 값의 평균(하나라도 남으면 남김), 남은 셀이 없고 잘린 칸이 있으면 VOLUME_CUT(차지한 칸 — 굵은 레벨로 내려가지 않음),
 * 모두 비었으면 VOLUME_EMPTY. 돌려주는 값은 원래 셀 값의 최소·최대(색 범위 — 묶어도 Surface 와 같은 범위, 결측 표시값은 뺀다). 남은 값이 없으면 [Infinity, −Infinity].
 */
export function fillVolumeLevel(out: Float32Array, dims: Vec3i, factors: Vec3i, occ: Uint8Array, keep: Uint8Array, values: Float32Array): [number, number] {
  let lo = Infinity, hi = -Infinity;
  const [nx, ny, nz] = dims, [fx, fy, fz] = factors;
  if (fx === 1 && fy === 1 && fz === 1) {
    for (let k = 0; k < out.length; k++) {
      if (occ[k] !== 1) { out[k] = VOLUME_EMPTY; continue; }
      const v = keep[k] ? values[k] : NaN;
      if (v === v && v < VALUE_MAX) { out[k] = v; if (v < lo) lo = v; if (v > hi) hi = v; } else out[k] = VOLUME_CUT;
    }
    return [lo, hi];
  }
  const mx = Math.ceil(nx / fx), my = Math.ceil(ny / fy), mz = Math.ceil(nz / fz);
  let o = 0;
  for (let bz = 0; bz < mz; bz++) {
    const k0 = bz * fz, k1 = Math.min(nz, k0 + fz);
    for (let by = 0; by < my; by++) {
      const j0 = by * fy, j1 = Math.min(ny, j0 + fy);
      for (let bx = 0; bx < mx; bx++, o++) {
        const i0 = bx * fx, i1 = Math.min(nx, i0 + fx);
        let sum = 0, n = 0, cut = false;
        for (let k = k0; k < k1; k++) {
          for (let j = j0; j < j1; j++) {
            let c = i0 + nx * (j + ny * k);
            for (let i = i0; i < i1; i++, c++) {
              if (occ[c] !== 1) continue;
              const v = keep[c] ? values[c] : NaN;
              if (v === v && v < VALUE_MAX) { sum += v; n++; if (v < lo) lo = v; if (v > hi) hi = v; } else cut = true;
            }
          }
        }
        out[o] = n ? sum / n : cut ? VOLUME_CUT : VOLUME_EMPTY;
      }
    }
  }
  return [lo, hi];
}

/**
 * 레벨 하나 (고운 것부터 넘긴다 — 이 순서가 셰이더의 우선순위). origin = 셀 (0,0,0) 의 중심, 셀 번호 = i + nx*(j + ny*k) (gridDataset 과 같음).
 * spacing 은 한 층짜리 축도 두께가 있어야 하므로 AppCore surfaceGrid 의 간격(한 층짜리 축 = 다른 축 간격)을 넘긴다.
 */
export interface VolumeLevel {
  dims: [number, number, number];
  origin: [number, number, number];
  spacing: [number, number, number];
  values: Float32Array<ArrayBuffer>; // 칸마다 값 또는 약속값. levelBuffer 로 받은 배열을 채워 넘기면 텍스처 자리를 그대로 두고 값만 다시 올린다
}

/**
 * 마지막 계산에서 Volume 으로 그린 셀 (Opacity 곡선 편집기의 히스토그램이 센다 — AppCore.volumeCellsOf). 레벨마다 원래 셀 값(줄여 올리기 전)과
 * 그 계산의 남은 셀 표시(keep — 조상 Clip·Threshold 와 Clip·Threshold 노드 자기 자신까지 거른 것, 차지하지 않은 칸은 0. 사슬이 없는 데이터 노드는 그와 같은 격자 occupancy 를 그대로 — 사본 없음). keep 이 1 이고 값이 있는 셀이 그린 셀이다
 * (fillVolumeLevel 과 같은 기준). 계산할 때마다 새 객체라, 객체가 같으면 같은 셀이다(히스토그램 캐시 열쇠).
 * fieldKey·mapping = 그 값을 꺼낸 배열·성분 — 지금 색칠과 다르면 아직 다시 계산 전이다. 칠할 배열이 그 저장 시점에 없으면 sets 가 빈 배열.
 */
export interface DrawnCells {
  fieldKey: string;
  mapping: string;
  sets: { values: Float32Array; keep: Uint8Array }[];
}

/** 셀 번호 범위 (양 끝 포함) */
interface CellRange { lo: [number, number, number]; hi: [number, number, number] }

/** 레벨 버퍼에서 차지한 칸(값·잘림 — 이 레벨을 읽어야 하는 곳)과 값 칸(쌓을 것이 있는 곳)의 셀 번호 범위. 없으면 null */
function cellRanges(L: VolumeLevel): { occupied: CellRange | null; valued: CellRange | null } {
  const [nx, ny, nz] = L.dims, a = L.values;
  const occ: CellRange = { lo: [nx, ny, nz], hi: [-1, -1, -1] }, val: CellRange = { lo: [nx, ny, nz], hi: [-1, -1, -1] };
  const grow = (r: CellRange, i0: number, i1: number, j: number, k: number) => {
    if (i0 < r.lo[0]) r.lo[0] = i0; if (i1 > r.hi[0]) r.hi[0] = i1;
    if (j < r.lo[1]) r.lo[1] = j; if (j > r.hi[1]) r.hi[1] = j;
    if (k < r.lo[2]) r.lo[2] = k; if (k > r.hi[2]) r.hi[2] = k;
  };
  let c = 0;
  for (let k = 0; k < nz; k++) {
    for (let j = 0; j < ny; j++) {
      let o0 = -1, o1 = -1, v0 = -1, v1 = -1; // 이 줄(x 방향)의 처음·끝 칸
      for (let i = 0; i < nx; i++, c++) {
        const s = a[c];
        if (s < VALUE_MAX) { if (v0 < 0) v0 = i; v1 = i; if (o0 < 0) o0 = i; o1 = i; }
        else if (s >= CUT_MIN) { if (o0 < 0) o0 = i; o1 = i; }
      }
      if (o0 >= 0) grow(occ, o0, o1, j, k);
      if (v0 >= 0) grow(val, v0, v1, j, k);
    }
  }
  return { occupied: occ.hi[0] >= 0 ? occ : null, valued: val.hi[0] >= 0 ? val : null };
}

/** 셀 번호 범위 → 세계 좌표 상자 (셀 중심 ± 반 칸) */
function rangeBox(L: VolumeLevel, r: CellRange, min: THREE.Vector3, max: THREE.Vector3): void {
  min.set(L.origin[0] + (r.lo[0] - 0.5) * L.spacing[0], L.origin[1] + (r.lo[1] - 0.5) * L.spacing[1], L.origin[2] + (r.lo[2] - 0.5) * L.spacing[2]);
  max.set(L.origin[0] + (r.hi[0] + 0.5) * L.spacing[0], L.origin[1] + (r.hi[1] + 0.5) * L.spacing[1], L.origin[2] + (r.hi[2] + 0.5) * L.spacing[2]);
}

const VERT = /* glsl */ `
varying vec3 vWorld;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
  // far 면보다 먼 뒷면도 잘리지 않게 깊이를 far 면에 붙인다 (깊이 검사·쓰기를 끄므로 z 는 잘림에만 쓰인다. 화면 자리·vWorld 보간은 그대로)
  if (gl_Position.w > 0.0) gl_Position.z = min(gl_Position.z, gl_Position.w);
}`;

/** 레벨 n 개짜리 프래그먼트 셰이더 (레벨 읽기를 펼쳐 쓴다) */
function fragmentShader(n: number): string {
  const samplers = Array.from({ length: n }, (_, i) => `uniform sampler3D vol${i};`).join('\n');
  // 고운 레벨부터: 차지한 칸 상자 안이면 그 레벨 간격으로 걸음을 잡고, 값이 있으면 그림(1), 잘린 칸이면 비우고 더 내려가지 않음(2), 값이 없으면 다음 레벨로
  const probes = Array.from({ length: n }, (_, i) => `
  if (all(greaterThanEqual(p, levelBoxMin[${i}])) && all(lessThan(p, levelBoxMax[${i}]))) {
    float s = textureLod(vol${i}, (p - levelLo[${i}]) / levelSize[${i}], 0.0).r;
    dt = levelStep[${i}];
    if (s < 1.0e29) { v = s; lv = ${i}.0; return 1; }
    if (s >= 2.0e30) return 2;
  }`).join('');
  return /* glsl */ `
${samplers}
uniform vec3 levelLo[${n}];     // 레벨 텍스처 상자의 아래 모서리 (origin − h/2)
uniform vec3 levelSize[${n}];   // 레벨 텍스처 상자 크기 (dims·h)
uniform vec3 levelBoxMin[${n}]; // 레벨이 차지한 칸(값·잘림)의 상자 — 밖이면 그 레벨을 읽지 않는다
uniform vec3 levelBoxMax[${n}];
uniform float levelStep[${n}];  // 레벨 간격의 0.5배
uniform float emptyStep;        // 어느 레벨 상자에도 들지 않는 자리의 걸음 (가장 굵은 간격의 0.5배)
uniform vec3 boxMin;            // 광선을 걷는 상자 (값이 있는 칸 상자들의 합)
uniform vec3 boxMax;
uniform sampler2D tfTex;
uniform float rangeMin;
uniform float rangeMax;
uniform float unitDistance;
uniform float levelDebug;       // 1 이면 색 대신 고른 레벨 번호로 칠한다 (콘솔 확인용)
uniform sampler2D sceneDepth;   // Volume·위치 표시를 뺀 장면의 깊이 (선행 패스, 그리기 버퍼와 같은 크기)
uniform float depthNear;        // 그 패스 카메라의 near·far (직교는 near 가 음수)
uniform float depthFar;
varying vec3 vWorld;

#include <packing>

// 자리 p 를 읽는다. 1 = 값 v 를 그림(lv = 고른 레벨 번호), 2 = 잘린 칸(비움), 0 = 어느 레벨에도 값이 없음. dt = 그 자리의 걸음
int probe(vec3 p, out float v, out float dt, out float lv) {
  v = 0.0;
  lv = 0.0;
  dt = emptyStep;
  ${probes}
  return 0;
}

// 레벨 번호마다 다른 색 (levelDebug)
vec3 levelColor(float lv) {
  return 0.5 + 0.5 * cos(6.28318 * (lv / ${n}.0 + vec3(0.0, 0.333, 0.667)));
}

// 픽셀마다 고정된 0..1 난수 (Dave Hoskins hash12)
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  vec3 fwd = normalize(-vec3(viewMatrix[0][2], viewMatrix[1][2], viewMatrix[2][2])); // 카메라가 보는 방향 (월드)
  vec3 ro, rd;
  if (isOrthographic) {
    rd = fwd;
    ro = vWorld - rd * (2.0 * length(boxMax - boxMin));
  } else {
    ro = cameraPosition;
    rd = normalize(vWorld - cameraPosition);
  }
  vec3 sd = vec3(abs(rd.x) < 1.0e-8 ? 1.0e-8 : rd.x, abs(rd.y) < 1.0e-8 ? 1.0e-8 : rd.y, abs(rd.z) < 1.0e-8 ? 1.0e-8 : rd.z);
  vec3 ta = (boxMin - ro) / sd, tb = (boxMax - ro) / sd;
  vec3 tn = min(ta, tb), tx = max(ta, tb);
  float t = max(max(tn.x, tn.y), tn.z);
  float tEnd = min(min(tx.x, tx.y), tx.z);
  if (!isOrthographic) t = max(t, 0.0);
  // 장면 깊이에서 멈춘다: 이 픽셀의 불투명 물체(깊이를 쓰는 것)의 view z(카메라 앞이 음수)를 광선 위 거리로 바꾼다. 깊이 1 = 아무것도 없음 → far 면에서
  // 멈춘다(다른 물체도 거기서 잘린다). 그 물체는 카메라에서 보는 방향으로 −viewZ 만큼 떨어져 있으므로 dot(ro + rd·t − 카메라, fwd) = −viewZ 인 t
  float zd = texelFetch(sceneDepth, ivec2(gl_FragCoord.xy), 0).r;
  float viewZ = zd >= 1.0 ? -depthFar
    : isOrthographic ? orthographicDepthToViewZ(zd, depthNear, depthFar) : perspectiveDepthToViewZ(zd, depthNear, depthFar);
  tEnd = min(tEnd, (-viewZ - dot(ro - cameraPosition, fwd)) / dot(rd, fwd));
  if (t >= tEnd) discard;
  float jit = hash12(gl_FragCoord.xy);
  float v, dt, lv;
  probe(ro + rd * t, v, dt, lv);
  // 앞 표본(자리·결과). 처음은 상자 입구 — 아무것도 쌓지 않은 자리로 본다
  float tPrev = t;
  int rPrev = 0;
  // 아직 어느 표본도 세지 않은 구간의 시작. 표본마다 [tCover, 다음 표본과의 가운데](다음 표본이 광선 끝 밖이면 광선 끝까지)를 세므로 광선의 각 자리는
  // 가장 가까운 표본이 맡고 표본들이 광선 [입구, 끝]을 빈틈·겹침 없이 나눠 갖는다 (첫 표본은 입구부터 — 흔든 만큼 빠지지 않는다. 마지막 표본은 광선 끝에서 잘린다.
  // 안쪽 경계(빈 칸 ↔ 값 칸)에서도 평균 반 걸음씩 치우치지 않는다)
  float tCover = t;
  t += min(dt * jit, 0.5 * (tEnd - t)); // 시작점은 그 자리 걸음 안에서 흔든다 (광선이 아주 짧으면 그 가운데까지만 — 표본이 하나는 들게)
  float tRefine = -1.0e30; // 이 자리까지는 다시 걷는 중 (걸음을 dtRefine 이하로)
  float dtRefine = 0.0;
  vec3 C = vec3(0.0);
  float A = 0.0;
  for (int s = 0; s < ${MAX_STEPS}; s++) {
    if (t > tEnd || A >= 0.99) break;
    int r = probe(ro + rd * t, v, dt, lv);
    if (t < tRefine) dt = min(dt, dtRefine);
    else if (r != 0 && rPrev != 1 && t - tPrev > 1.5 * dt) {
      // 아무것도 쌓지 않은 큰 걸음 끝이 더 고운 칸에 닿음: 그 걸음 구간을 이 자리 걸음으로 다시 걷는다 (건너뛴 고운 칸을 빠뜨리지 않게).
      // 세는 구간도 앞 표본과 다시 걷는 첫 표본의 가운데부터 다시 (앞 표본은 아무것도 쌓지 않았으므로 두 번 쌓이지 않는다. 첫 표본에서 다시 걸으면 앞 자리는
      // 표본이 아닌 상자 입구라 tCover 가 입구에 그대로 남는다 — min)
      tRefine = t;
      dtRefine = dt;
      tCover = min(tCover, tPrev + 0.5 * dt * jit);
      t = tPrev + dt * jit;
      continue;
    }
    float tSeg = t + dt >= tEnd ? tEnd : t + 0.5 * dt; // 이 표본이 맡는 구간의 끝 (다음 표본 = t + dt)
    if (r == 1) {
      vec4 tf = textureLod(tfTex, vec2(clamp((v - rangeMin) / max(rangeMax - rangeMin, 1.0e-12), 0.0, 1.0), 0.5), 0.0);
      float a = 1.0 - pow(1.0 - min(tf.a, 0.9999), (tSeg - tCover) / unitDistance);
      C += (1.0 - A) * a * (levelDebug > 0.5 ? levelColor(lv) : tf.rgb);
      A += (1.0 - A) * a;
    }
    tCover = tSeg;
    tPrev = t;
    rPrev = r;
    t += dt;
  }
  if (A < 1.0e-4) discard;
  gl_FragColor = vec4(C / A, A);
  #include <colorspace_fragment>
}`;
}

function makeMaterial(n: number): THREE.ShaderMaterial {
  const uniforms: Record<string, THREE.IUniform> = {
    levelLo: { value: Array.from({ length: n }, () => new THREE.Vector3()) },
    levelSize: { value: Array.from({ length: n }, () => new THREE.Vector3(1, 1, 1)) },
    levelBoxMin: { value: Array.from({ length: n }, () => new THREE.Vector3()) },
    levelBoxMax: { value: Array.from({ length: n }, () => new THREE.Vector3()) },
    levelStep: { value: new Array<number>(n).fill(1) },
    emptyStep: { value: 1 },
    boxMin: { value: new THREE.Vector3() }, boxMax: { value: new THREE.Vector3(1, 1, 1) },
    tfTex: { value: null }, rangeMin: { value: 0 }, rangeMax: { value: 1 }, unitDistance: { value: 1 },
    levelDebug: { value: VolumeRenderer.levelDebug ? 1 : 0 },
    sceneDepth: { value: null }, depthNear: { value: 0.1 }, depthFar: { value: 1000 }, // AppCore.renderScene 이 그리기 전마다 채운다
  };
  for (let i = 0; i < n; i++) uniforms[`vol${i}`] = { value: null };
  return new THREE.ShaderMaterial({
    uniforms, vertexShader: VERT, fragmentShader: fragmentShader(n),
    side: THREE.BackSide, transparent: true, depthTest: false, depthWrite: false,
  });
}

/** 레벨 하나의 3D 텍스처: R32F 원래 값, NEAREST, 가장자리 늘이기 */
function makeLevelTexture(L: VolumeLevel): THREE.Data3DTexture {
  const t = new THREE.Data3DTexture(L.values, L.dims[0], L.dims[1], L.dims[2]);
  t.format = THREE.RedFormat;
  t.type = THREE.FloatType;
  t.minFilter = THREE.NearestFilter;
  t.magFilter = THREE.NearestFilter;
  t.wrapS = t.wrapT = t.wrapR = THREE.ClampToEdgeWrapping;
  t.unpackAlignment = 1;
  t.generateMipmaps = false;
  t.needsUpdate = true;
  return t;
}

export class VolumeRenderer {
  /** 콘솔 확인용: 색 대신 고른 레벨 번호로 칠한다 (모든 볼륨 노드 공통 — AppCore.debugVolumeLevels 가 켜고 끈다) */
  static levelDebug = false;
  readonly group = new THREE.Group();
  private mesh: THREE.Mesh | null = null;
  private material: THREE.ShaderMaterial | null = null;
  private textures: THREE.Data3DTexture[] = [];
  private tfTex: THREE.DataTexture | null = null;
  private tfKey: { colormap: ColormapId; curve: OpacityCurve } | null = null; // 지금 전달함수 텍스처를 만든 Preset·곡선
  private colormapId: ColormapId = 'coolwarm';
  private curve: OpacityCurve = DEFAULT_OPACITY_CURVE;
  private rangeMin = 0;
  private rangeMax = 1;
  private unitDistance = 1;
  /** 올린 3D 텍스처 크기의 합 (바이트, 노드 요약용) */
  textureBytes = 0;
  /** 줄여 올린 배율 가운데 가장 큰 것 (1 = 원래 해상도, 노드 요약용 — AppCore.rebuildVolume 이 넣는다) */
  reduction = 1;
  /** 마지막 계산에서 그린 셀 (히스토그램용 — AppCore.rebuildVolume 이 넣는다). 지우면(clear) 함께 놓는다 */
  drawnCells: DrawnCells | null = null;

  constructor() { this.group.name = 'volume'; }

  /** 레벨 i 의 값 버퍼. 칸 수가 같으면 지금 그 레벨 텍스처가 쓰는 배열을 돌려준다 — 다시 채워 set 에 넘기면 텍스처 자리를 그대로 두고 값만 올린다 */
  levelBuffer(i: number, count: number): Float32Array<ArrayBuffer> {
    const cur = this.textures[i]?.image.data;
    return cur instanceof Float32Array && cur.length === count ? (cur as Float32Array<ArrayBuffer>) : new Float32Array(count);
  }

  /**
   * 레벨들(고운 것부터)을 올리고 상자를 맞춘다. 레벨이 없으면 지운다.
   * 값이 있는 칸이 하나도 없으면(모두 잘림·값 없음) 텍스처는 그대로 두고(다음 계산에서 다시 씀) 상자만 숨긴다.
   */
  set(levels: VolumeLevel[]): void {
    if (!levels.length) { this.clear(); return; }
    for (let i = 0; i < levels.length; i++) {
      const L = levels[i], old = this.textures[i];
      // 같은 배열·같은 크기면 자리는 그대로 두고 값만 다시 올린다(three: texSubImage3D). 배열 객체가 같아 바뀜을 알 수 없으므로 매번 올린다
      if (old && old.image.data === L.values && old.image.width === L.dims[0] && old.image.height === L.dims[1] && old.image.depth === L.dims[2]) { old.needsUpdate = true; continue; }
      old?.dispose();
      this.textures[i] = makeLevelTexture(L);
    }
    for (let i = levels.length; i < this.textures.length; i++) this.textures[i].dispose();
    this.textures.length = levels.length;
    if (!this.material || this.material.uniforms.levelStep.value.length !== levels.length) {
      this.material?.dispose();
      this.material = makeMaterial(levels.length);
    }
    const u = this.material.uniforms;
    const boxMin = new THREE.Vector3(Infinity, Infinity, Infinity), boxMax = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
    const vMin = new THREE.Vector3(), vMax = new THREE.Vector3();
    let coarsest = 0, bytes = 0, anyValue = false;
    levels.forEach((L, i) => {
      // 텍스처 상자: 셀 중심 = origin + i·h 이므로 origin − h/2 부터 dims·h. 텍스처 좌표 = (p − 상자 아래) / 상자 크기
      (u.levelLo.value as THREE.Vector3[])[i].set(L.origin[0] - L.spacing[0] / 2, L.origin[1] - L.spacing[1] / 2, L.origin[2] - L.spacing[2] / 2);
      (u.levelSize.value as THREE.Vector3[])[i].set(L.dims[0] * L.spacing[0], L.dims[1] * L.spacing[1], L.dims[2] * L.spacing[2]);
      // 차지한 칸 상자 (없으면 뒤집힌 상자 — 셰이더가 그 레벨을 읽지 않는다). 광선 상자는 값 칸 상자들의 합
      const { occupied, valued } = cellRanges(L);
      const oMin = (u.levelBoxMin.value as THREE.Vector3[])[i], oMax = (u.levelBoxMax.value as THREE.Vector3[])[i];
      if (occupied) rangeBox(L, occupied, oMin, oMax); else { oMin.setScalar(1e30); oMax.setScalar(-1e30); }
      if (valued) { rangeBox(L, valued, vMin, vMax); boxMin.min(vMin); boxMax.max(vMax); anyValue = true; }
      const h = Math.min(L.spacing[0], L.spacing[1], L.spacing[2]);
      (u.levelStep.value as number[])[i] = 0.5 * h;
      coarsest = Math.max(coarsest, h);
      u[`vol${i}`].value = this.textures[i];
      bytes += L.values.byteLength;
    });
    u.emptyStep.value = 0.5 * coarsest;
    u.unitDistance.value = this.unitDistance;
    this.textureBytes = bytes;
    if (!this.mesh) {
      this.mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), this.material);
      this.mesh.renderOrder = 2; // Streamline(1) 다음, 위치 표시의 테두리·화살표·Box Clip 상자(10·11) 앞
      this.mesh.frustumCulled = false;
      this.group.add(this.mesh);
    } else this.mesh.material = this.material;
    this.mesh.visible = anyValue;
    if (anyValue) {
      (u.boxMin.value as THREE.Vector3).copy(boxMin);
      (u.boxMax.value as THREE.Vector3).copy(boxMax);
      this.mesh.position.copy(boxMin).add(boxMax).multiplyScalar(0.5);
      this.mesh.scale.copy(boxMax).sub(boxMin);
    }
    this.syncColor();
  }

  /** 이번 그리기에 들어가는지: 메시가 있고(값 칸이 있음) 장면까지 모든 조상이 보인다 — AppCore.renderScene 이 장면 깊이 패스를 할지 이것으로 정한다 */
  drawn(): boolean {
    for (let o: THREE.Object3D | null = this.mesh; o; o = o.parent) {
      if (!o.visible) return false;
      if (o instanceof THREE.Scene) return true;
    }
    return false;
  }

  /** 장면 깊이(Volume·위치 표시를 뺀 선행 패스, 그리기 버퍼와 같은 크기)와 그 패스 카메라의 near·far. 광선은 그 깊이의 물체에서 멈춘다 (AppCore.renderScene 이 그리기 전마다) */
  setSceneDepth(tex: THREE.Texture, near: number, far: number): void {
    const u = this.material?.uniforms;
    if (!u) return;
    u.sceneDepth.value = tex;
    u.depthNear.value = near;
    u.depthFar.value = far;
  }

  /** 콘솔 확인용: 색 대신 고른 레벨 번호로 칠하기 (VolumeRenderer.levelDebug 를 이 노드의 재질에 반영) */
  syncLevelDebug(): void {
    if (this.material) this.material.uniforms.levelDebug.value = VolumeRenderer.levelDebug ? 1 : 0;
  }

  /**
   * Preset·Range·Opacity 곡선 (값을 다시 올리지 않고 uniform 만. 전달함수 텍스처는 Preset·곡선이 바뀔 때만 새로 — 곡선은 배열 객체로 비교하므로
   * 색 지도의 곡선은 늘 새 배열로 바꿔 넣는다: ColorMap.opacity)
   */
  setColor(spec: CellColorSpec, curve: OpacityCurve = DEFAULT_OPACITY_CURVE): void {
    this.colormapId = spec.colormap;
    this.rangeMin = spec.rangeMin;
    this.rangeMax = spec.rangeMax;
    this.curve = curve;
    this.syncColor();
  }

  /** Scalar Opacity Unit Distance (m) */
  setUnitDistance(d: number): void {
    this.unitDistance = Math.max(d, 1e-9);
    if (this.material) this.material.uniforms.unitDistance.value = this.unitDistance;
  }

  /** 그리는 중일 때만(메시가 있을 때) 전달함수 텍스처를 만든다 (지운 뒤에는 재질이 남아 있어도 만들지 않는다) */
  private syncColor(): void {
    const m = this.material;
    if (!m || !this.mesh) return;
    if (!this.tfTex || !this.tfKey || this.tfKey.colormap !== this.colormapId || this.tfKey.curve !== this.curve) {
      this.tfTex?.dispose();
      this.tfTex = makeTransferTexture(this.colormapId, this.curve);
      this.tfKey = { colormap: this.colormapId, curve: this.curve };
    }
    m.uniforms.tfTex.value = this.tfTex;
    m.uniforms.rangeMin.value = this.rangeMin;
    m.uniforms.rangeMax.value = this.rangeMax;
  }

  /**
   * 메시·3D 텍스처·전달함수 텍스처를 놓는다 (GPU 메모리와 JS 값 버퍼 반납). Volume 이 아닐 때는 늘 이 상태다.
   * 재질은 텍스처 자리만 비우고 남긴다 — 놓으면 three 가 셰이더 프로그램까지 지워, Surface ↔ Volume 을 오갈 때마다 레벨 수만큼 펼친 긴 셰이더를 다시 컴파일한다.
   * 재질 자체는 GPU 메모리를 거의 쓰지 않는다. 노드를 지울 때(dispose)는 재질도 놓는다
   */
  clear(): void {
    if (this.mesh) { this.group.remove(this.mesh); this.mesh.geometry.dispose(); this.mesh = null; }
    for (const t of this.textures) t.dispose();
    this.textures = [];
    if (this.material) {
      const u = this.material.uniforms;
      for (let i = 0; i < u.levelStep.value.length; i++) u[`vol${i}`].value = null; // 놓은 텍스처·값 버퍼를 붙잡지 않게
      u.tfTex.value = null;
      u.sceneDepth.value = null; // 깊이 그림판은 보이는 Volume 이 없으면 AppCore 가 놓는다
    }
    this.tfTex?.dispose();
    this.tfTex = null;
    this.tfKey = null;
    this.textureBytes = 0;
    this.reduction = 1;
    this.drawnCells = null; // 남은 셀 표시(레벨마다 격자 칸 수만큼)와 값 배열을 붙잡지 않게
  }

  /** 노드를 지울 때: clear 에 더해 재질(셰이더 프로그램)도 놓는다 */
  dispose(): void {
    this.clear();
    this.material?.dispose();
    this.material = null;
  }
}

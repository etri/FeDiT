// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   colormap.ts

컬러맵 정의. 점 셰이더(1D 텍스처)와 화살표 색·범례(CPU 함수)가 같은 정의를 쓴다. Volume 은 색에 Opacity 곡선을 알파로 합친 전달함수 텍스처를 쓴다.
'coolwarm'은 자사 후처리기 점 셰이더의 scalarToColor(파랑→흰색→빨강)와 동일하다.
viridis 는 외부 공개 근사식이다(출처·라이선스는 함수 위 주석과 THIRD_PARTY_NOTICES.md). jet 는 여기서 직접 쓴 식이다.
*/
/******************************************************************************/
import * as THREE from 'three';

export type ColormapId = 'coolwarm' | 'viridis' | 'jet';
export type RGB = [number, number, number];

export interface Colormap {
  id: ColormapId;
  label: string;
  at(t: number): RGB; // t: 0..1
}

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

function coolwarm(t: number): RGB {
  t = clamp01(t);
  const blue: RGB = [0.0, 0.4, 1.0];
  const white: RGB = [1.0, 1.0, 1.0];
  const red: RGB = [1.0, 0.1, 0.0];
  const mix = (a: RGB, b: RGB, s: number): RGB => [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s, a[2] + (b[2] - a[2]) * s];
  return t < 0.5 ? mix(blue, white, t * 2) : mix(white, red, (t - 0.5) * 2);
}

// viridis 다항식 근사 — Matt Zucker(2019), https://www.shadertoy.com/view/WlfXRN 의 계수를 그대로 옮김.
// 원 색 지도는 matplotlib viridis(Stéfan van der Walt, Nathaniel Smith). SPDX-License-Identifier: CC0-1.0
function viridis(t: number): RGB {
  t = clamp01(t);
  const c0 = [0.2777273272234177, 0.005407344544966578, 0.334099805335306];
  const c1 = [0.1050930431085774, 1.404613529898575, 1.384590162594685];
  const c2 = [-0.3308618287255563, 0.214847559468213, 0.09509516302823659];
  const c3 = [-4.634230498983486, -5.799100973351585, -19.33244095627987];
  const c4 = [6.228269936347081, 14.17993336680509, 56.69055260068105];
  const c5 = [4.776384997670288, -13.74514537774601, -65.35303263337234];
  const c6 = [-5.435455855934631, 4.645852612178535, 26.3124352495832];
  const out: RGB = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    out[i] = c0[i] + t * (c1[i] + t * (c2[i] + t * (c3[i] + t * (c4[i] + t * (c5[i] + t * c6[i])))));
    out[i] = clamp01(out[i]);
  }
  return out;
}

// jet 무지개: 짙은 파랑 → 파랑 → 청록 → 노랑 → 빨강 → 짙은 빨강. 채널마다 꼭짓점 하나인 구간별 직선(봉우리 t = 1/4, 2/4, 3/4)
function jet(t: number): RGB {
  const x = 4 * clamp01(t);
  return [clamp01(1.5 - Math.abs(x - 3)), clamp01(1.5 - Math.abs(x - 2)), clamp01(1.5 - Math.abs(x - 1))];
}

export const COLORMAPS: Colormap[] = [
  { id: 'coolwarm', label: 'Cool-Warm (파랑-흰-빨강)', at: coolwarm },
  { id: 'viridis', label: 'Viridis', at: viridis },
  { id: 'jet', label: 'Jet (무지개)', at: jet },
];

export function getColormap(id: ColormapId): Colormap {
  return COLORMAPS.find((c) => c.id === id) ?? COLORMAPS[0];
}

/** 셰이더용 256x1 RGBA 텍스처 */
export function makeColormapTexture(id: ColormapId): THREE.DataTexture {
  const cm = getColormap(id);
  const n = 256;
  const data = new Uint8Array(n * 4);
  for (let i = 0; i < n; i++) {
    const [r, g, b] = cm.at(i / (n - 1));
    data[i * 4] = Math.round(r * 255);
    data[i * 4 + 1] = Math.round(g * 255);
    data[i * 4 + 2] = Math.round(b * 255);
    data[i * 4 + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, n, 1, THREE.RGBAFormat);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Opacity 곡선 (ParaView 불투명도 전달함수의 제어점 목록): [x, Opacity] 꺾은선. x 는 색 지도 범위 기준 0~1(범위 최소 = 0, 최대 = 1)이라
 * Rescale 로 범위가 바뀌어도 점을 옮길 필요가 없다. x 오름차순, 양 끝 0·1. 곡선은 늘 새 배열로 바꿔 넣고 제자리에서 고치지 않는다(렌더러가 배열 객체로 바뀜을 안다).
 */
export type OpacityCurve = [number, number][];
/** 기본 Opacity 곡선: 범위 최소에서 0, 최대에서 1 로 가는 직선 (ParaView 기본 PiecewiseFunction 과 같음). 고치지 말고 copyOpacityCurve 로 복사해 쓴다 */
export const DEFAULT_OPACITY_CURVE: OpacityCurve = [[0, 0], [1, 1]];

/** 기본 곡선과 같은지 (점마다 같은 값 — 화면의 곡선 상태 줄이 쓴다) */
export function isDefaultOpacityCurve(curve: OpacityCurve): boolean {
  return curve.length === DEFAULT_OPACITY_CURVE.length && curve.every(([x, y], i) => x === DEFAULT_OPACITY_CURVE[i][0] && y === DEFAULT_OPACITY_CURVE[i][1]);
}

/** Opacity 곡선의 새 배열 (점까지 새로 — 공유 지도와 Separate 지도가 같은 배열을 나눠 갖지 않게) */
export function copyOpacityCurve(curve: OpacityCurve): OpacityCurve {
  return curve.map(([x, y]): [number, number] => [x, y]);
}

/**
 * 장면 JSON·콘솔에서 받은 Opacity 곡선을 확인해 새 배열로 돌려준다. 점 2개 이상, 점마다 [x, Opacity] 숫자 둘, x 는 0 에서 시작해 1 에서 끝나며
 * 늘 커지고(같은 x 두 번은 안 됨 — ParaView 도 같은 x 의 점은 하나), Opacity 는 0~1. 하나라도 어긋나면 null (부르는 쪽이 기본 곡선이나 무시로)
 */
export function parseOpacityCurve(raw: unknown): OpacityCurve | null {
  if (!Array.isArray(raw) || raw.length < 2) return null;
  const out: OpacityCurve = [];
  for (const p of raw) {
    if (!Array.isArray(p) || p.length !== 2) return null;
    const [x, y] = p;
    if (typeof x !== 'number' || typeof y !== 'number' || !Number.isFinite(x) || !Number.isFinite(y)) return null;
    if (y < 0 || y > 1 || (out.length && x <= out[out.length - 1][0])) return null;
    out.push([x, y]);
  }
  return out[0][0] === 0 && out[out.length - 1][0] === 1 ? out : null;
}

/** Opacity 곡선의 t(0..1) 자리 값 (꺾은선 보간, 양 끝 밖은 끝 값) */
export function opacityAt(curve: OpacityCurve, t: number): number {
  if (!curve.length) return 1;
  if (t <= curve[0][0]) return curve[0][1];
  for (let i = 1; i < curve.length; i++) {
    const [x1, y1] = curve[i];
    if (t <= x1) {
      const [x0, y0] = curve[i - 1];
      return x1 - x0 > 1e-12 ? y0 + (y1 - y0) * (t - x0) / (x1 - x0) : y1;
    }
  }
  return curve[curve.length - 1][1];
}

/** Volume 셰이더용 256x1 RGBA 전달함수 텍스처: RGB = Preset 색(sRGB), A = Opacity 곡선 (sRGB 텍스처라도 알파는 선형 그대로 읽힌다) */
export function makeTransferTexture(id: ColormapId, curve: OpacityCurve): THREE.DataTexture {
  const tex = makeColormapTexture(id);
  const data = tex.image.data as Uint8Array;
  const n = tex.image.width;
  for (let i = 0; i < n; i++) data[i * 4 + 3] = Math.round(Math.min(1, Math.max(0, opacityAt(curve, i / (n - 1)))) * 255);
  tex.needsUpdate = true;
  return tex;
}

const scratch = new THREE.Color();

/** three.js 정점색·재질용 선형(linear) RGB. 컬러맵 정의는 sRGB이므로 변환해서 넘긴다. */
export function colormapLinear(id: ColormapId, t: number): RGB {
  const [r, g, b] = getColormap(id).at(t);
  scratch.setRGB(r, g, b, THREE.SRGBColorSpace);
  return [scratch.r, scratch.g, scratch.b];
}

/** 범례 등 2D 캔버스용 CSS 색 문자열 */
export function colormapCss(id: ColormapId, t: number): string {
  const [r, g, b] = getColormap(id).at(t);
  return `rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)})`;
}

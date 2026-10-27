// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   sliceRenderer.ts

Slice 를 색상 면과 Contour lines 로 그린다. 면은 조명 없이 값 색 그대로 표시한다.

색상 면: 정점에는 값만 싣고, 색은 프래그먼트 셰이더에서 Colormap 텍스처로 입힌다. 그래서 "Contour lines 사이를 단색으로
채움"(구간형)의 경계가 픽셀 단위로 또렷하고, 같은 삼각형 분할로 뽑은 Contour lines 와 정확히 겹친다.
조상 Clip 은 면(ShaderMaterial, clipping: true)·선(LineMaterial) 재질의 clippingPlanes 로 건다(setClips).
조상 Threshold 는 AppCore 가 다시 뜰 때 꼭짓점마다 값을 NaN 으로 만들어 넘긴다 — 면 attribute 로 올릴 때 NaN → 1e30 으로 바꾸고
프래그먼트에서 discard 한다. contourLines 는 NaN 삼각형을 이미 건너뛴다.

Contour lines: 굵기 있는 선(LineSegments2). 반드시 면 다음에 그리고(renderOrder) 깊이는 쓰지 않는다 — three.js는 반투명
물체를 지오메트리 중심 거리로 정렬하므로, 순서를 고정하지 않으면 시점에 따라 선이 면보다 먼저 그려져 배경과 섞이고
(불투명도가 안 먹는 것처럼 보임) 그 자리의 면까지 가린다. 반투명일 때 선분 이음새가 두 번 칠해지는 것은 유선과
같은 방식(스텐실 비트로 픽셀당 한 번만 섞기)으로 막는다.
*/
/******************************************************************************/
import * as THREE from 'three';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { SliceSurface } from '../analysis/sliceSurface';
import { ColormapId, makeColormapTexture } from '../utils/colormap';
import { ClipParams } from '../core/layers';
import { applyClips } from './clipping';

const SURFACE_VERT = /* glsl */ `
#include <clipping_planes_pars_vertex>
attribute float value;
varying float vValue;
void main() {
  vValue = value;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <clipping_planes_vertex>
}`;

const SURFACE_FRAG = /* glsl */ `
#include <clipping_planes_pars_fragment>
uniform sampler2D colormapTex;
uniform float rangeMin;
uniform float rangeMax;
uniform float bands;    // 0 = 연속, n = n개 구간 (경계가 Contour line 값과 같다)
uniform float opacity;
varying float vValue;
void main() {
  #include <clipping_planes_fragment>
  if (vValue > 1.0e29) discard; // 결측·Threshold 밖(NaN → 1e30)
  float t = clamp((vValue - rangeMin) / max(rangeMax - rangeMin, 1.0e-12), 0.0, 1.0);
  if (bands > 0.5) t = (min(bands - 1.0, floor(t * bands)) + 0.5) / bands;
  gl_FragColor = vec4(texture2D(colormapTex, vec2(t, 0.5)).rgb, opacity);
  #include <colorspace_fragment>
}`;

export interface SliceColorSpec { colormap: ColormapId; rangeMin: number; rangeMax: number }
export interface ContourStyle { color: 'black' | 'white' | 'field'; width: number; opacity: number; stencilBit: number }

/** 면(0) 다음, 유선(1) 앞 */
const CONTOUR_RENDER_ORDER = 0.5;

export class SliceRenderer {
  readonly group = new THREE.Group();
  private mesh: THREE.Mesh | null = null;
  private lines: LineSegments2 | null = null;
  private colormapId: ColormapId = 'coolwarm';
  private colormapTex = makeColormapTexture('coolwarm');
  private readonly meshMaterial = new THREE.ShaderMaterial({
    uniforms: {
      colormapTex: { value: this.colormapTex },
      rangeMin: { value: 0 }, rangeMax: { value: 1 }, bands: { value: 0 }, opacity: { value: 1 },
    },
    vertexShader: SURFACE_VERT, fragmentShader: SURFACE_FRAG,
    clipping: true, // clippingPlanes 를 셰이더에 넣는다 (clipping_planes 청크)
    side: THREE.DoubleSide, transparent: true,
    polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1, // Contour lines 가 면에 묻히지 않게 면을 뒤로 민다
  });
  private readonly lineMaterial = new LineMaterial({ color: 0x111827, linewidth: 1.0, worldUnits: false, transparent: true, opacity: 0.55, depthWrite: false });
  triangleCount = 0;
  segmentCount = 0;

  constructor() { this.group.name = 'slice-surface'; this.lineMaterial.resolution.set(1, 1); }

  /** 레이어 순서(0부터)에 따라 면을 뒤로 미는 정도를 달리한다. 같은 평면의 Slice 가 겹쳐도 순서가 정해져 깜빡이지 않는다 */
  setDepthBias(order: number): void {
    const units = 1 - 2 * Math.max(0, order); // 뒤 레이어일수록 덜 밀어(= 앞에) 그린다
    if (this.meshMaterial.polygonOffsetUnits !== units) { this.meshMaterial.polygonOffsetUnits = units; this.meshMaterial.needsUpdate = true; }
  }

  setResolution(w: number, h: number): void { this.lineMaterial.resolution.set(w, h); }

  clear(): void {
    this.clearSurface();
    this.setContours(null);
  }

  /** 노드를 지울 때: 형상·재질·Colormap 텍스처까지 버린다 */
  dispose(): void {
    this.clear();
    this.meshMaterial.dispose();
    this.lineMaterial.dispose();
    this.colormapTex.dispose();
  }

  private clearSurface(): void {
    if (this.mesh) { this.group.remove(this.mesh); this.mesh.geometry.dispose(); this.mesh = null; }
    this.triangleCount = 0;
  }

  /** bands: 0 = 연속 색, n = n개 구간으로 끊어 칠함 */
  setSurface(s: SliceSurface | null, spec: SliceColorSpec, bands: number, opacity: number): void {
    this.clearSurface();
    if (!s || s.triangleCount === 0) return;
    if (spec.colormap !== this.colormapId) {
      this.colormapTex.dispose();
      this.colormapTex = makeColormapTexture(spec.colormap);
      this.colormapId = spec.colormap;
      this.meshMaterial.uniforms.colormapTex.value = this.colormapTex;
    }
    const u = this.meshMaterial.uniforms;
    u.rangeMin.value = spec.rangeMin; u.rangeMax.value = spec.rangeMax; u.bands.value = bands;
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(s.positions, 3));
    // NaN(구멍·Threshold 밖)은 셰이더가 비교할 수 있게 1e30 으로 올린다 (원본 배열은 Contour lines 계산에 그대로 쓰이므로 복사)
    const values = new Float32Array(s.values.length);
    for (let i = 0; i < values.length; i++) { const v = s.values[i]; values[i] = v === v ? v : 1e30; }
    geom.setAttribute('value', new THREE.BufferAttribute(values, 1));
    geom.setIndex(new THREE.BufferAttribute(s.indices, 1));
    // 값에 NaN(구멍)이 섞여 있어도 경계 구는 위치만으로 계산된다
    geom.computeBoundingSphere();
    this.mesh = new THREE.Mesh(geom, this.meshMaterial);
    this.mesh.frustumCulled = false;
    this.group.add(this.mesh);
    this.triangleCount = s.triangleCount;
    this.setSurfaceOpacity(opacity);
  }

  /** 면 불투명도 (다시 계산 없이 바로) */
  setSurfaceOpacity(opacity: number): void {
    this.meshMaterial.uniforms.opacity.value = opacity;
    this.meshMaterial.depthWrite = opacity > 0.5;
  }

  /** 조상 Clip 목록 — 면·선 재질 모두 (다시 계산 없이 바로) */
  setClips(clips: ClipParams[]): void { applyClips([this.meshMaterial, this.lineMaterial], clips); }

  /** colors: 선분마다 시작·끝 색(선형 RGB 6개) — 선 색이 'Colormap'일 때 쓴다 */
  setContours(segments: Float32Array | null, colors: Float32Array | null = null): void {
    if (this.lines) { this.group.remove(this.lines); this.lines.geometry.dispose(); this.lines = null; }
    this.segmentCount = 0;
    if (!segments || segments.length < 6) return;
    const geom = new LineSegmentsGeometry();
    geom.setPositions(segments);
    if (colors && colors.length === segments.length) geom.setColors(colors);
    this.lines = new LineSegments2(geom, this.lineMaterial);
    this.lines.frustumCulled = false;
    this.lines.renderOrder = CONTOUR_RENDER_ORDER; // 항상 면 다음에
    this.group.add(this.lines);
    this.segmentCount = segments.length / 6;
  }

  /** Contour lines 색·굵기·불투명도 (다시 계산 없이 바로). stencilBit ≥ 0이면 반투명일 때 픽셀당 한 번만 섞는다 */
  setLineStyle(s: ContourStyle): void {
    const m = this.lineMaterial;
    const byField = s.color === 'field';
    if (m.vertexColors !== byField) m.vertexColors = byField;
    m.color.set(byField ? 0xffffff : s.color === 'black' ? 0x111827 : 0xf9fafb);
    m.linewidth = s.width;
    m.opacity = s.opacity;
    const on = s.opacity < 0.999 && s.stencilBit >= 0 && s.stencilBit < 8;
    m.stencilWrite = on;
    if (on) {
      const mask = 1 << s.stencilBit;
      m.stencilRef = mask; m.stencilFunc = THREE.NotEqualStencilFunc; m.stencilFuncMask = mask; m.stencilWriteMask = mask;
      m.stencilFail = THREE.KeepStencilOp; m.stencilZFail = THREE.KeepStencilOp; m.stencilZPass = THREE.ReplaceStencilOp;
    }
    m.needsUpdate = true;
  }
}

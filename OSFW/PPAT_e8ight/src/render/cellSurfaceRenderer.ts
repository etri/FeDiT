// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   cellSurfaceRenderer.ts

볼륨 노드의 Surface 표현을 그린다: 남은 셀 집합의 바깥 면(cellSurface.ts)을 셀 값 색으로.
색은 SliceRenderer 와 같은 방식(정점에는 값만, 프래그먼트에서 Colormap 텍스처)이라 Colormap·Range 를 바꿔도 형상을 다시 올리지 않는다.
면이 상자처럼 읽히게 헤드라이트 음영을 조금 준다(시선과 법선의 각도). 값이 없는 셀(NaN → 1e30)은 버리고, 칠할 Field 가 없으면 단색.
GPU clippingPlanes 는 쓰지 않는다 — 볼륨 노드의 Clip·Threshold 는 셀 단위로 이미 걸러 면을 뽑는다.
*/
/******************************************************************************/
import * as THREE from 'three';
import { CellSurface } from '../analysis/cellSurface';
import { ColormapId, makeColormapTexture } from '../utils/colormap';

const VERT = /* glsl */ `
attribute float value;
varying float vValue;
varying vec3 vNormal;
varying vec3 vView;
void main() {
  vValue = value;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vNormal = normalize(normalMatrix * normal);
  vView = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}`;

const FRAG = /* glsl */ `
uniform sampler2D colormapTex;
uniform float rangeMin;
uniform float rangeMax;
uniform float opacity;
uniform bool useColormap;
uniform vec3 solidColor;
uniform bool ortho;
varying float vValue;
varying vec3 vNormal;
varying vec3 vView;
void main() {
  if (useColormap && vValue > 1.0e29) discard; // 값 없는 셀
  float t = clamp((vValue - rangeMin) / max(rangeMax - rangeMin, 1.0e-12), 0.0, 1.0);
  vec3 base = useColormap ? texture2D(colormapTex, vec2(t, 0.5)).rgb : solidColor;
  vec3 v = ortho ? vec3(0.0, 0.0, 1.0) : normalize(vView);
  float lit = 0.55 + 0.45 * abs(dot(normalize(vNormal), v));
  gl_FragColor = vec4(base * lit, opacity);
  #include <colorspace_fragment>
}`;

export interface CellColorSpec { colormap: ColormapId; rangeMin: number; rangeMax: number }

export class CellSurfaceRenderer {
  readonly group = new THREE.Group();
  private mesh: THREE.Mesh | null = null;
  private colormapId: ColormapId = 'coolwarm';
  private colormapTex = makeColormapTexture('coolwarm');
  private readonly material = new THREE.ShaderMaterial({
    uniforms: {
      colormapTex: { value: this.colormapTex }, rangeMin: { value: 0 }, rangeMax: { value: 1 }, opacity: { value: 1 },
      useColormap: { value: true }, solidColor: { value: new THREE.Color(0xb8c2cf) }, ortho: { value: false },
    },
    vertexShader: VERT, fragmentShader: FRAG,
    side: THREE.DoubleSide, transparent: true,
    // 데이터 바깥 면은 용기 벽(형상)과 같은 자리에 놓이는 일이 많다 — 면을 조금 앞으로 당겨 벽과 번갈아 깜빡이지 않고 데이터가 보이게
    polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
  });
  triangleCount = 0;

  constructor() { this.group.name = 'cell-surface'; }

  clear(): void {
    if (this.mesh) { this.group.remove(this.mesh); this.mesh.geometry.dispose(); this.mesh = null; }
    this.triangleCount = 0;
  }

  /** hasValues = false 면 칠할 Field 가 없다 → 단색 */
  set(s: CellSurface | null, hasValues: boolean): void {
    this.clear();
    this.material.uniforms.useColormap.value = hasValues;
    if (!s || s.triangleCount === 0) return;
    const values = new Float32Array(s.values.length);
    for (let i = 0; i < values.length; i++) { const v = s.values[i]; values[i] = v === v ? v : 1e30; }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(s.positions, 3));
    geom.setAttribute('normal', new THREE.BufferAttribute(s.normals, 3));
    geom.setAttribute('value', new THREE.BufferAttribute(values, 1));
    geom.computeBoundingSphere();
    this.mesh = new THREE.Mesh(geom, this.material);
    this.mesh.frustumCulled = false;
    this.group.add(this.mesh);
    this.triangleCount = s.triangleCount;
  }

  /** Colormap·Range (형상을 다시 올리지 않고 uniform 만) */
  setColor(spec: CellColorSpec): void {
    if (spec.colormap !== this.colormapId) {
      this.colormapTex.dispose();
      this.colormapTex = makeColormapTexture(spec.colormap);
      this.colormapId = spec.colormap;
      this.material.uniforms.colormapTex.value = this.colormapTex;
    }
    this.material.uniforms.rangeMin.value = spec.rangeMin;
    this.material.uniforms.rangeMax.value = spec.rangeMax;
  }

  setOpacity(o: number): void {
    this.material.uniforms.opacity.value = o;
    this.material.depthWrite = o >= 0.999;
  }

  /** 직교 투영이면 시선 방향이 화면 어디서나 같다 */
  setOrtho(on: boolean): void { this.material.uniforms.ortho.value = on; }

  dispose(): void {
    this.clear();
    this.material.dispose();
    this.colormapTex.dispose();
  }
}

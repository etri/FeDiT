// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   pointRenderer.ts

볼륨 노드(데이터·Clip·Threshold) 하나의 Points 표현을 THREE.Points + ShaderMaterial 로 그린다 (DataViewRenderer 안).
위치·반지름은 AppCore 가 데이터셋마다 하나 만드는 공유 속성(PointAttrs)을 그대로 붙인다 — three.js 는 BufferAttribute 단위로
GPU 버퍼를 캐시하므로 Points 로 그리는 볼륨 노드가 여럿이어도 한 번만 올라간다.
이 렌더러가 따로 가지는 것은 색칠 값(`fieldScalar`, 노드마다 칠하는 배열이 다를 수 있다 — setValues)·`hidden` 속성(Clip·Threshold 판정 결과, 0/1)과
재질(uniform: colormap · range · size · sphere · camera)이다.
*/
/******************************************************************************/
import * as THREE from 'three';
import vertexShader from '../shaders/points.vert?raw';
import fragmentShader from '../shaders/points.frag?raw';
import { ColormapId, makeColormapTexture } from '../utils/colormap';

/** 데이터셋마다 하나 만드는 공유 속성 (위치·반지름) */
export interface PointAttrs {
  position: THREE.BufferAttribute;
  pointRadius: THREE.BufferAttribute;
  useRadiusAttr: boolean;  // 점마다 반지름이 다르면(다중 레벨) 속성으로, 아니면 worldRadius 하나로
  worldRadius: number;     // 점의 실제 반지름 (m)
  count: number;
}

export class PointRenderer {
  readonly group = new THREE.Group();
  readonly object: THREE.Points;
  private readonly material: THREE.ShaderMaterial;
  private readonly geometry = new THREE.BufferGeometry();
  private readonly hidden: THREE.BufferAttribute;
  private readonly fieldScalar: THREE.BufferAttribute; // 자기 색칠 값 (NaN = 1e30 은 셰이더가 숨김)
  private colormapTex: THREE.DataTexture;
  /** Clip·Threshold 사슬을 통과해 그려지는 점 수 */
  visibleCount = 0;
  readonly count: number;

  constructor(attrs: PointAttrs) {
    this.count = attrs.count;
    this.colormapTex = makeColormapTexture('coolwarm');
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        colormapTex: { value: this.colormapTex },
        rangeMin: { value: 0 },
        rangeMax: { value: 1 },
        colorMode: { value: 0 },
        baseColor: { value: new THREE.Color(0x8fa3bf) },
        pointSize: { value: 1.0 },
        pointWorldRadius: { value: attrs.worldRadius },
        useRadiusAttr: { value: attrs.useRadiusAttr },
        cameraFov: { value: 45 },
        orthoHeight: { value: 0 },
        viewportHeight: { value: 800 },
        sphereShading: { value: true },
      },
      transparent: false,
      depthTest: true,
      depthWrite: true,
    });
    // 공유 속성은 같은 BufferAttribute 객체를 붙인다 (복사하지 않음)
    this.geometry.setAttribute('position', attrs.position);
    this.geometry.setAttribute('pointRadius', attrs.pointRadius);
    this.fieldScalar = new THREE.BufferAttribute(new Float32Array(attrs.count), 1);
    this.geometry.setAttribute('fieldScalar', this.fieldScalar);
    this.hidden = new THREE.BufferAttribute(new Float32Array(attrs.count), 1);
    this.geometry.setAttribute('hidden', this.hidden);
    this.geometry.computeBoundingSphere();
    this.object = new THREE.Points(this.geometry, this.material);
    this.object.frustumCulled = false;
    this.object.visible = attrs.count > 0;
    this.object.name = 'cfd-points';
    this.group.name = 'cfd-points-node';
    this.group.add(this.object);
    this.visibleCount = attrs.count;
  }

  /**
   * 색칠 값을 올린다 (점마다; NaN 은 결측 → 1e30 으로 셰이더가 숨긴다). null 이면 단색(baseColor)으로 칠하고 아무 점도 숨기지 않는다
   */
  setValues(values: Float32Array | null): void {
    const arr = this.fieldScalar.array as Float32Array;
    if (!values) arr.fill(0);
    else for (let i = 0; i < arr.length; i++) { const v = values[i]; arr[i] = v === v ? v : 1e30; }
    this.fieldScalar.needsUpdate = true;
    this.material.uniforms.colorMode.value = values ? 0 : 1;
  }

  /** Clip·Threshold 판정 결과를 올린다. mask[i] = 1 이면 숨김. null 이면 전부 보임 */
  setHidden(mask: Float32Array | null): void {
    const arr = this.hidden.array as Float32Array;
    // 셰이더가 숨기는 결측값(fieldScalar = 1e30)도 '그린 점 수'에서 뺀다 — 상태 칩·통계가 화면과 맞게
    const fs = this.fieldScalar.array as Float32Array;
    if (mask) arr.set(mask); else arr.fill(0);
    let n = 0;
    for (let i = 0; i < arr.length; i++) if (arr[i] < 0.5 && (!fs || fs[i] < 1e29)) n++;
    this.visibleCount = n;
    this.hidden.needsUpdate = true;
    this.object.visible = this.count > 0;
  }

  /** 데이터가 없을 때: 아무것도 그리지 않는다 */
  clear(): void { this.object.visible = false; this.visibleCount = 0; }

  setRange(min: number, max: number): void {
    this.material.uniforms.rangeMin.value = min;
    this.material.uniforms.rangeMax.value = max;
  }

  setColormap(id: ColormapId): void {
    this.colormapTex.dispose();
    this.colormapTex = makeColormapTexture(id);
    this.material.uniforms.colormapTex.value = this.colormapTex;
  }

  setColorMode(mode: 'colormap' | 'base', baseColor?: string): void {
    this.material.uniforms.colorMode.value = mode === 'colormap' ? 0 : 1;
    if (baseColor) (this.material.uniforms.baseColor.value as THREE.Color).set(baseColor);
  }

  setPointSize(mult: number): void {
    this.material.uniforms.pointSize.value = mult;
  }

  setSphereShading(on: boolean): void {
    this.material.uniforms.sphereShading.value = on;
  }

  /** orthoHeight > 0이면 직교 투영: 화면 세로에 보이는 길이(m). 0이면 원근 */
  updateViewport(fovDeg: number, heightPx: number, orthoHeight = 0): void {
    this.material.uniforms.cameraFov.value = fovDeg;
    this.material.uniforms.orthoHeight.value = orthoHeight;
    this.material.uniforms.viewportHeight.value = heightPx;
  }

  /**
   * 노드를 지울 때. geometry.dispose() 는 붙어 있는 모든 attribute 의 GPU 버퍼까지 지우므로 공유 속성 처리를 둘로 나눈다:
   * - shared = 'keep': 다른 볼륨 노드가 아직 공유 속성(position·pointRadius)을 쓰고 있다. deleteAttribute 로 떼어낸 뒤
   *   dispose 해서 자기 것인 fieldScalar·hidden 속성·재질·컬러맵 텍스처만 버린다.
   * - shared = 'free': 이 노드가 마지막이다. 공유 속성을 붙인 채 dispose 해서 GPU 버퍼까지 지운다. 같은 PointAttrs 로 나중에
   *   볼륨 노드를 다시 만들면 three.js 가 다음 그리기에서 버퍼를 새로 올린다 (BufferAttribute 객체는 그대로 쓸 수 있다).
   */
  dispose(shared: 'keep' | 'free'): void {
    if (shared === 'keep') {
      this.geometry.deleteAttribute('position');
      this.geometry.deleteAttribute('pointRadius');
    }
    this.geometry.dispose();
    this.material.dispose();
    this.colormapTex.dispose();
  }
}

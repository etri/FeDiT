// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   isosurfaceRenderer.ts

Isosurface(등값면) 삼각형을 조명 있는 면으로 그린다. 정점색으로 다른 Field 값을 입힐 수 있다.
조상 Clip 은 재질 clippingPlanes 로 건다 (setClips). 조상 Threshold 는 AppCore 가 삼각형을 골라 낸 뒤 넘긴다.
*/
/******************************************************************************/
import * as THREE from 'three';
import { IsoResult } from '../analysis/isosurface';
import { RGB } from '../utils/colormap';
import { ClipParams } from '../core/layers';
import { applyClips } from './clipping';

export class IsosurfaceRenderer {
  readonly group = new THREE.Group();
  private mesh: THREE.Mesh | null = null;
  private readonly material = new THREE.MeshStandardMaterial({
    vertexColors: true, side: THREE.DoubleSide, roughness: 0.55, metalness: 0.0, transparent: true, opacity: 0.85,
  });
  triangleCount = 0;

  constructor() { this.group.name = 'isosurface'; }

  setOpacity(o: number): void {
    this.material.opacity = o;
    this.material.transparent = o < 0.999;
    this.material.depthWrite = o > 0.5;
    // 늘 양면을 그린다. 앞면만 그리면 법선이 카메라 반대쪽인 면(닫힌 등값면의 한쪽)이 통째로 사라진다.
    // three.js 는 반투명 양면 재질을 뒷면 → 앞면 두 번에 나눠 그리므로(forceSinglePass = false) 앞뒷면 겹침 무늬도 생기지 않는다
  }
  /** 조상 Clip 목록 (다시 계산 없이 바로) */
  setClips(clips: ClipParams[]): void { applyClips([this.material], clips); }

  clear(): void {
    if (this.mesh) { this.group.remove(this.mesh); this.mesh.geometry.dispose(); this.mesh = null; }
    this.triangleCount = 0;
  }

  /** 노드를 지울 때: 형상·재질까지 버린다 */
  dispose(): void { this.clear(); this.material.dispose(); }

  /** colorAt: 정점의 색 필드 값 → 선형 RGB. values가 없으면 solid를 쓴다. */
  set(result: IsoResult, colorAt: (value: number) => RGB, solid: RGB): void {
    this.clear();
    if (result.triangleCount === 0) return;
    const n = result.positions.length / 3;
    const colors = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const c = result.values ? colorAt(result.values[i]) : solid;
      colors[i * 3] = c[0]; colors[i * 3 + 1] = c[1]; colors[i * 3 + 2] = c[2];
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(result.positions, 3));
    geom.setAttribute('normal', new THREE.BufferAttribute(result.normals, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.mesh = new THREE.Mesh(geom, this.material);
    this.mesh.frustumCulled = false;
    this.group.add(this.mesh);
    this.triangleCount = result.triangleCount;
  }
}

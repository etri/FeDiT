// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   featureEdgesRenderer.ts

볼륨 노드의 Feature Edges 표현: 남은 셀 집합의 모양이 꺾이는 모서리 선(analysis/featureEdges.ts 가 뽑은 선분)을 단색으로 그린다.
색은 Outline 과 같다(데이터 노드 옅은 회색, Clip·Threshold 노드 주황 — outlineRenderer.applyLineTone).
*/
/******************************************************************************/
import * as THREE from 'three';
import { applyLineTone } from './outlineRenderer';

export class FeatureEdgesRenderer {
  readonly group = new THREE.Group();
  private lines: THREE.LineSegments | null = null;
  private readonly material = new THREE.LineBasicMaterial({ transparent: true });
  /** 지금 그린 선분 수 */
  segmentCount = 0;

  constructor() {
    this.group.name = 'feature-edges';
    applyLineTone(this.material, 'data');
  }

  setTone(tone: 'data' | 'filter'): void { applyLineTone(this.material, tone); }

  clear(): void {
    if (this.lines) { this.group.remove(this.lines); this.lines.geometry.dispose(); this.lines = null; }
    this.segmentCount = 0;
  }

  /** 선분 꼭짓점 xyz 의 연속(선분 하나 = 6개 수). 비면 아무것도 그리지 않는다 */
  set(segments: Float32Array): void {
    this.clear();
    if (!segments.length) return;
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(segments, 3));
    geom.computeBoundingSphere();
    this.lines = new THREE.LineSegments(geom, this.material);
    this.segmentCount = segments.length / 6;
    this.group.add(this.lines);
  }

  dispose(): void { this.clear(); this.material.dispose(); }
}

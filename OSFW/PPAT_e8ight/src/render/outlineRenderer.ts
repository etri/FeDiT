// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   outlineRenderer.ts

볼륨 노드의 Outline 표현: 남은 셀 집합의 경계 상자 테두리(모서리 12개). ParaView 의 Outline 처럼 값으로 칠하지 않고 단색 선이다.
색: 데이터 노드는 옅은 회색, Clip·Threshold 노드는 주황(setTone). PV와 다름(ParaView 는 모두 흰색) — 데이터를 꽉 채운 결과(유체-입자 등)에서
Clip 상자가 데이터 상자와 모서리 대부분을 겹쳐 구별되지 않았다(2026-11-05 사용자 "아웃라인은 왜 동작 안하는지").
*/
/******************************************************************************/
import * as THREE from 'three';
import { Bounds } from '../data/pointDataset';

const OUTLINE_DATA = 0xcbd5e1; // 데이터 노드: 옅은 회색(바닥 격자와 구별되는 밝기)
const OUTLINE_FILTER = 0xf59e0b; // Clip·Threshold 노드: 주황 — 데이터 상자·파란 평면 위치 표시와 구별

/** 단색 선 표현(Outline·Feature Edges)의 색·불투명도 — 데이터 노드 옅은 회색, Clip·Threshold 노드 주황 */
export function applyLineTone(m: THREE.LineBasicMaterial, tone: 'data' | 'filter'): void {
  m.color.setHex(tone === 'filter' ? OUTLINE_FILTER : OUTLINE_DATA);
  m.opacity = tone === 'filter' ? 0.95 : 0.85;
}

export class OutlineRenderer {
  readonly group = new THREE.Group();
  private lines: THREE.LineSegments | null = null;
  private readonly material = new THREE.LineBasicMaterial({ color: OUTLINE_DATA, transparent: true, opacity: 0.85 });

  constructor() { this.group.name = 'outline'; }

  /** 'data' = 데이터 노드(옅은 회색), 'filter' = Clip·Threshold 노드(주황) */
  setTone(tone: 'data' | 'filter'): void { applyLineTone(this.material, tone); }

  clear(): void {
    if (this.lines) { this.group.remove(this.lines); this.lines.geometry.dispose(); this.lines = null; }
  }

  /** 경계 상자. null 이면 아무것도 그리지 않는다 (남은 셀이 없음) */
  set(b: Bounds | null): void {
    this.clear();
    if (!b) return;
    const [x0, y0, z0] = b.min, [x1, y1, z1] = b.max;
    const c = [
      [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0],
      [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1],
    ];
    const edges = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
    const pos = new Float32Array(edges.length * 6);
    edges.forEach(([a, b2], i) => { pos.set(c[a], i * 6); pos.set(c[b2], i * 6 + 3); });
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.lines = new THREE.LineSegments(geom, this.material);
    this.lines.frustumCulled = false;
    this.group.add(this.lines);
  }

  dispose(): void { this.clear(); this.material.dispose(); }
}

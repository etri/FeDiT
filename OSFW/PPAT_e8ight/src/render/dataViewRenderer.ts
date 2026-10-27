// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   dataViewRenderer.ts

볼륨 노드(데이터·볼륨 위의 Clip·Threshold) 하나의 그리기 객체. 표현 방식(Surface | Outline | Points | Volume | 없음)마다 렌더러를 하나씩 들고
지금 표현의 것만 보인다. 계산(남은 셀·면·점 마스크·Volume 값 버퍼)은 AppCore 가 지금 표현에 필요한 것만 해서 넣는다.
Points 는 데이터셋 공유 속성(PointAttrs)을 붙인 PointRenderer 라서, 지울 때 다른 볼륨 노드가 공유 속성을 쓰는지에 따라 dispose('keep'|'free').
Volume 의 3D 텍스처는 크기가 커서 Volume 이 아닌 표현으로 바꾸는 순간 놓는다(setRepresentation).
*/
/******************************************************************************/
import * as THREE from 'three';
import { Representation } from '../core/layers';
import { CellColorSpec, CellSurfaceRenderer } from './cellSurfaceRenderer';
import { OutlineRenderer } from './outlineRenderer';
import { PointAttrs, PointRenderer } from './pointRenderer';
import { VolumeRenderer } from './volumeRenderer';
import { OpacityCurve } from '../utils/colormap';

export class DataViewRenderer {
  readonly group = new THREE.Group();
  readonly surface = new CellSurfaceRenderer();
  readonly outline = new OutlineRenderer();
  readonly volume = new VolumeRenderer();
  readonly points: PointRenderer;
  representation: Representation = 'outline';
  /** 남은 셀 수 (마지막 계산) */
  keptCells = 0;
  /** Surface·Volume 을 고른 노드가 격자가 없어 점으로 대신 그렸는지 */
  surfaceFallback = false;

  constructor(attrs: PointAttrs) {
    this.points = new PointRenderer(attrs);
    this.group.name = 'data-view';
    this.group.add(this.surface.group, this.outline.group, this.points.group, this.volume.group);
    this.setRepresentation('outline');
  }

  /** 보일 렌더러를 고른다. Surface·Volume 인데 격자가 없으면(surfaceFallback) Points 를 보인다. Volume 이 아니면 3D 텍스처를 놓는다 */
  setRepresentation(rep: Representation): void {
    this.representation = rep;
    if (rep !== 'volume') this.volume.clear();
    this.applyVisibility();
  }

  applyVisibility(): void {
    const rep = this.shownRepresentation();
    this.surface.group.visible = rep === 'surface';
    this.outline.group.visible = rep === 'outline';
    this.points.group.visible = rep === 'points';
    this.volume.group.visible = rep === 'volume';
  }

  /** 실제로 그려지는 표현 (Surface·Volume 대신 Points 로 그리는 경우 'points') */
  shownRepresentation(): Representation {
    return (this.representation === 'surface' || this.representation === 'volume') && this.surfaceFallback ? 'points' : this.representation;
  }

  private pointsColormap: string | null = null;

  /** 색 지도(Colormap·Range, Volume 은 Opacity 곡선도)를 Surface·Points·Volume 에 (형상·값을 다시 올리지 않고 uniform 만). 단색이면 바꿀 것이 없다 */
  setColor(spec: (CellColorSpec & { opacity?: OpacityCurve }) | null): void {
    if (!spec) return;
    this.surface.setColor(spec);
    this.volume.setColor(spec, spec.opacity); // 곡선이 없으면 기본 직선
    this.points.setRange(spec.rangeMin, spec.rangeMax);
    if (spec.colormap !== this.pointsColormap) { this.pointsColormap = spec.colormap; this.points.setColormap(spec.colormap); } // 텍스처는 바뀔 때만 새로
  }

  clear(): void {
    this.surface.clear();
    this.outline.clear();
    this.points.clear();
    this.volume.clear();
    this.keptCells = 0;
  }

  dispose(shared: 'keep' | 'free'): void {
    this.surface.dispose();
    this.outline.dispose();
    this.points.dispose(shared);
    this.volume.dispose();
  }
}

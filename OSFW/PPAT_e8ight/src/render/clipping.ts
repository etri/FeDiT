// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   clipping.ts

사슬의 Clip 목록을 three.js 의 재질 clippingPlanes 로 옮기는 공통 도우미. Slice 면·선, Streamline, Isosurface 가 같이 쓴다.
three.js 평면 규칙: clippingPlanes 의 각 평면은 n·p + c >= 0 인 쪽을 남긴다. 여러 Clip 은 AND 이므로 평면을 전부 모아
clipIntersection = false (어느 한 평면에라도 잘리면 버림). 그래서 GPU 로는 '반공간들의 교집합'만 표현된다:
- Plane(법선 +axis, 원점 position): Invert 켬 = position 이하를 남김 → n = -e_axis, c = +position. 끔 → n = +e_axis, c = -position.
- Box Invert 켬(안을 남김) = 평면 6개.
- Box Invert 끔(밖을 남김)·Scalar 는 교집합이 아니므로 여기서 건너뛰고, AppCore 가 면·선을 다시 만들 때 CPU 로 판정한다(isGpuClip).
renderer.localClippingEnabled = true 는 AppCore 가 켠다.
*/
/******************************************************************************/
import * as THREE from 'three';
import { ClipParams, isGpuClip } from '../core/layers';

/** Clip 목록 → 절단 평면 목록 (GPU 로 걸 수 있는 것만: Plane 1개, 안을 남기는 Box 6개) */
export function clipPlanes(clips: ClipParams[]): THREE.Plane[] {
  const planes: THREE.Plane[] = [];
  for (const c of clips) {
    if (!isGpuClip(c)) continue;
    if (c.clipType === 'plane') {
      const e = new THREE.Vector3().setComponent(c.axis, 1);
      planes.push(c.invert ? new THREE.Plane(e.negate(), c.position) : new THREE.Plane(e, -c.position));
      continue;
    }
    for (let a = 0; a < 3; a++) {
      const e = new THREE.Vector3().setComponent(a, 1);
      planes.push(new THREE.Plane(e.clone(), -c.boxMin[a]));          // p[a] >= 하한 인 쪽을 남김
      planes.push(new THREE.Plane(e.clone().negate(), c.boxMax[a]));  // p[a] <= 상한 인 쪽을 남김
    }
  }
  return planes;
}

/** 재질들에 Clip 목록을 건다 (clippingPlanes·clipIntersection·needsUpdate). 걸 평면이 없으면 clippingPlanes = null */
export function applyClips(materials: THREE.Material[], clips: ClipParams[]): void {
  const planes = clipPlanes(clips);
  for (const m of materials) {
    m.clippingPlanes = planes.length ? planes : null;
    m.clipIntersection = false;
    m.needsUpdate = true;
  }
}

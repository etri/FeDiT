// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   stl_loader.ts

건물 등 형상 파일(STL) 로더. three.js STLLoader를 감싼다.
*/
/******************************************************************************/
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

const loader = new STLLoader();

export function parseStl(buffer: ArrayBuffer): THREE.BufferGeometry {
  const geometry = loader.parse(buffer);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  return geometry;
}

export async function fetchStl(url: string, axes?: string[], offset?: number[]): Promise<THREE.BufferGeometry> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`STL 파일을 가져오지 못했습니다 (HTTP ${res.status}): ${url}`);
  const geometry = parseStl(await res.arrayBuffer());
  if (axes || offset) applyAxes(geometry, axes, offset);
  return geometry;
}

/**
 * 형상 파일의 축을 해석 좌표계에 맞춘다. axes = 세계 축(x,y,z)마다 어느 파일 축을 쓸지.
 * 예: ["x","z","y"] → 세계 x=파일 x, 세계 y=파일 z, 세계 z=파일 y (y-up 파일을 z-up으로). "-z"처럼 부호도 된다.
 */
export function applyAxes(geometry: THREE.BufferGeometry, axes?: string[], offset?: number[]): void {
  const m = new THREE.Matrix4();
  if (axes && axes.length === 3) {
    const e = new Array(16).fill(0);
    for (let row = 0; row < 3; row++) {
      const spec = axes[row].trim();
      const sign = spec.startsWith('-') ? -1 : 1;
      const col = 'xyz'.indexOf(spec.replace('-', '').toLowerCase());
      if (col >= 0) e[row * 4 + col] = sign;
    }
    e[15] = 1;
    m.set(e[0], e[1], e[2], e[3], e[4], e[5], e[6], e[7], e[8], e[9], e[10], e[11], e[12], e[13], e[14], e[15]);
  }
  if (offset && offset.length === 3) m.premultiply(new THREE.Matrix4().makeTranslation(offset[0], offset[1], offset[2]));
  geometry.applyMatrix4(m);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
}

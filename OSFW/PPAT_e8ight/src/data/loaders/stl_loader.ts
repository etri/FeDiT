// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   stl_loader.ts

건물 등 형상 파일(STL) 로더. three.js STLLoader를 감싼다.
못 읽으면 한국어 한 줄(STL_PARSE_ERROR)을 던진다 — three 의 예외는 브라우저의 영어 글('Offset is outside the bounds of the DataView' 등)이라
화면([STL 추가] 빨간 줄 · 데이터 화면 안내 글 · 데이터 열기 창 결과 줄)에 그대로 보이지 않게. 부르는 쪽은 지금처럼 예외를 받는다.
*/
/******************************************************************************/
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

const loader = new STLLoader();

/** STL 을 못 읽었을 때의 글 (84바이트보다 짧은 파일 · 내용이 잘린 바이너리 STL 등, 형상으로 더할 때는 삼각형이 없는 STL 도 — requireTriangles) */
export const STL_PARSE_ERROR = 'STL 파일을 읽지 못했습니다. 파일이 잘렸거나 STL 형식이 아닙니다.';

export function parseStl(buffer: ArrayBuffer): THREE.BufferGeometry {
  let geometry: THREE.BufferGeometry;
  try { geometry = loader.parse(buffer); }
  catch { throw new Error(STL_PARSE_ERROR); }
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  return geometry;
}

/**
 * 형상으로 더할 수 있는가 — 삼각형이 1개 이상이고 좌표가 모두 유한한 수. 아니면 STL_PARSE_ERROR 를 던진다.
 * three STLLoader 는 숫자가 아닌 꼭짓점('vertex a b c')을 예외 없이 건너뛰어(콘솔 오류만) 삼각형 0개인 빈 형상을 돌려주고,
 * 그 형상은 경계 상자가 비어 위치가 NaN·무한이 된다(2026-11-05 브라우저 확인). 후처리에서 더하는 길(AppCore.loadStlBuffer)만 부른다 —
 * 전처리 입력·예제·결과 폴더 형상은 지금 동작 그대로(parseStl 안에서 막으면 그 길들까지 바뀐다).
 */
export function requireTriangles(geometry: THREE.BufferGeometry): void {
  const a = geometry.getAttribute('position')?.array as ArrayLike<number> | undefined;
  let ok = !!a && a.length >= 9;
  for (let i = 0; ok && i < a!.length; i++) ok = Number.isFinite(a![i]);
  if (!ok) throw new Error(STL_PARSE_ERROR);
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

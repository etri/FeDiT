// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   fitFrame.ts

화면 맞춤(AppCore.frameView)의 거리 계산. 상자의 꼭짓점 8개를 카메라 방향으로 옮겨 놓고,
원근이면 모든 꼭짓점이 보이는 시야(가로는 패널에 가려지지 않은 부분만) 안에 드는 가장 가까운 거리를,
직교면 그 꼭짓점들이 들어오는 화면 세로 길이를 구한다.
예전에는 가장 긴 변 하나로 거리를 정해(× 0.9) 세 변이 비슷한 작은 영역(유체-입자 0.2 m)을 비스듬히 보면
상자 안까지 들어갈 만큼 가까웠다(2026-11-05).
*/
/******************************************************************************/

type V3 = [number, number, number];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V3): V3 => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

export interface FitResult {
  /** 원근: 가운데에서 카메라까지 거리 */
  dist: number;
  /** 직교: 화면 세로 길이(보이는 부분 안에 다 들어오게) */
  orthoHeight: number;
}

/**
 * @param min,max 맞출 상자
 * @param toCamera 가운데에서 카메라 쪽 방향(정규화 안 해도 됨)
 * @param up 화면 위쪽 축 벡터(카메라 up)
 * @param tanHalfV 세로 시야 반각의 tan
 * @param tanHalfH 가로 시야 반각의 tan — 패널에 가려지지 않은 부분만(AppCore 의 visFrac 반영)
 * @param margin 여유 배율(1 = 꼭짓점이 화면 끝에 닿음)
 */
export function fitBox(min: V3, max: V3, toCamera: V3, up: V3, tanHalfV: number, tanHalfH: number, margin: number): FitResult {
  const d = norm(toCamera);
  const f: V3 = [-d[0], -d[1], -d[2]]; // 카메라가 보는 방향
  let right = cross(f, up);
  if (Math.hypot(right[0], right[1], right[2]) < 1e-9) right = cross(f, Math.abs(f[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0]); // up 과 나란할 때
  right = norm(right);
  const trueUp = cross(right, f);
  const c: V3 = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2];
  let dist = 0, halfW = 0, halfH = 0;
  for (let i = 0; i < 8; i++) {
    const p: V3 = [i & 1 ? max[0] : min[0], i & 2 ? max[1] : min[1], i & 4 ? max[2] : min[2]];
    const v: V3 = [p[0] - c[0], p[1] - c[1], p[2] - c[2]];
    const x = Math.abs(dot(v, right)), y = Math.abs(dot(v, trueUp)), z = dot(v, d); // z: 카메라 쪽으로 얼마나 나와 있나
    dist = Math.max(dist, z + x / tanHalfH, z + y / tanHalfV);
    halfW = Math.max(halfW, x); halfH = Math.max(halfH, y);
  }
  const size = Math.max(max[0] - min[0], max[1] - min[1], max[2] - min[2], 1e-6);
  const aspectVis = tanHalfH / tanHalfV; // 보이는 부분의 가로/세로 비
  return {
    dist: Math.max(dist * margin, size * 0.05),
    orthoHeight: Math.max(2 * halfH, (2 * halfW) / aspectVis, size * 0.01) * margin,
  };
}

// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   streamline.ts

유선(streamline) 계산. 벡터장을 RK4(4차 룽게-쿠타)로 따라가며 선을 만든다.
정상 유동에서는 유선 = 유적선(pathline). 격자 밖, 결측(고체), 정체 지점, 그리고 stopAt(조상 Threshold 구간 밖)에서 멈춘다.
샘플러를 받으므로 단일 격자든 다중 레벨이든 같은 코드로 동작한다.
*/
/******************************************************************************/
import { VectorSampler } from '../data/gridDataset';

export interface StreamlineOptions {
  direction: 'forward' | 'backward' | 'both';
  step: number;      // 적분 간격 (m). 보통 가장 세밀한 격자 간격의 절반
  maxLength: number; // 한 방향 최대 길이 (m)
  minSpeed: number;  // 이보다 느리면 정체로 보고 멈춤
  stopAt?: (x: number, y: number, z: number) => boolean; // true 를 돌려주는 자리에 들어가면 적분을 멈춘다 (조상 Threshold). 시작점이 그 자리면 그 시작점은 뺀다
}

export interface Streamline {
  points: Float32Array; // xyz
  speeds: Float32Array; // 각 점의 벡터 크기
}

const vec = [0, 0, 0];

/** 위치 p의 단위 방향을 out에 넣고 속력을 돌려준다. 유효하지 않으면 -1. */
function unitDir(sample: VectorSampler, p: number[], minSpeed: number, out: number[]): number {
  if (!sample(p[0], p[1], p[2], vec)) return -1;
  const m = Math.hypot(vec[0], vec[1], vec[2]);
  if (m < minSpeed) return -1;
  out[0] = vec[0] / m; out[1] = vec[1] / m; out[2] = vec[2] / m;
  return m;
}

function integrate(sample: VectorSampler, seed: number[], sign: number, h: number, maxSteps: number, minSpeed: number, stopAt?: (x: number, y: number, z: number) => boolean): { pts: number[]; spd: number[] } {
  const pts: number[] = [], spd: number[] = [];
  const p = [seed[0], seed[1], seed[2]];
  const k1 = [0, 0, 0], k2 = [0, 0, 0], k3 = [0, 0, 0], k4 = [0, 0, 0], q = [0, 0, 0];
  let m = unitDir(sample, p, minSpeed, k1);
  if (m < 0) return { pts, spd };
  pts.push(p[0], p[1], p[2]); spd.push(m);
  const hs = h * sign;
  for (let s = 0; s < maxSteps; s++) {
    if (unitDir(sample, p, minSpeed, k1) < 0) break;
    for (let c = 0; c < 3; c++) q[c] = p[c] + 0.5 * hs * k1[c];
    if (unitDir(sample, q, minSpeed, k2) < 0) break;
    for (let c = 0; c < 3; c++) q[c] = p[c] + 0.5 * hs * k2[c];
    if (unitDir(sample, q, minSpeed, k3) < 0) break;
    for (let c = 0; c < 3; c++) q[c] = p[c] + hs * k3[c];
    if (unitDir(sample, q, minSpeed, k4) < 0) break;
    for (let c = 0; c < 3; c++) p[c] += (hs / 6) * (k1[c] + 2 * k2[c] + 2 * k3[c] + k4[c]);
    if (stopAt && stopAt(p[0], p[1], p[2])) break; // 새 점이 구간 밖이면 거기서 멈춘다
    m = unitDir(sample, p, minSpeed, k1);
    if (m < 0) break;
    pts.push(p[0], p[1], p[2]); spd.push(m);
  }
  return { pts, spd };
}

export function computeStreamlines(sample: VectorSampler, seeds: number[][], opts: StreamlineOptions): Streamline[] {
  const h = Math.max(opts.step, 1e-9);
  const maxSteps = Math.max(1, Math.min(50000, Math.ceil(opts.maxLength / h)));
  const out: Streamline[] = [];
  for (const seed of seeds) {
    if (opts.stopAt && opts.stopAt(seed[0], seed[1], seed[2])) continue; // 시작점이 구간 밖이면 뺀다
    const fwd = opts.direction !== 'backward' ? integrate(sample, seed, 1, h, maxSteps, opts.minSpeed, opts.stopAt) : null;
    const bwd = opts.direction !== 'forward' ? integrate(sample, seed, -1, h, maxSteps, opts.minSpeed, opts.stopAt) : null;
    const pts: number[] = [], spd: number[] = [];
    if (bwd) {
      for (let i = bwd.spd.length - 1; i >= 1; i--) { pts.push(bwd.pts[i * 3], bwd.pts[i * 3 + 1], bwd.pts[i * 3 + 2]); spd.push(bwd.spd[i]); }
    }
    if (fwd) { for (let i = 0; i < fwd.spd.length; i++) { pts.push(fwd.pts[i * 3], fwd.pts[i * 3 + 1], fwd.pts[i * 3 + 2]); spd.push(fwd.spd[i]); } }
    else if (bwd && bwd.spd.length) { pts.push(bwd.pts[0], bwd.pts[1], bwd.pts[2]); spd.push(bwd.spd[0]); }
    if (spd.length >= 2) out.push({ points: Float32Array.from(pts), speeds: Float32Array.from(spd) });
  }
  return out;
}

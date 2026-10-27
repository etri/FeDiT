// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   vectorGlyphs.ts

벡터 Field(풍속 등)를 화살표(Glyph, InstancedMesh)로 그린다. 바깥에서 받은 판정 함수(조상 Clip·Threshold 사슬, 평면 위 배치면 얇은 층)를 통과한 점에서 고른다.
고르는 법(ParaView Glyph Mode):
- uniform: 통과한 점들의 경계 상자 안에 고정 시드 난수로 최대 N개 자리를 흩고, 자리마다 가장 가까운 점을 고른다(같은 점은 한 번). 화살표 수 ≤ N.
  (PV Uniform Spatial Distribution (Bounds Based) — 기본 N 5000, 시드 10339. 빈 곳(건물 안 등)에 떨어진 자리는 그 가장자리 점으로 가므로 벽 근처에 조금 몰린다 — PV 도 같음)
- stride: 점 목록에서 n개마다 1개 (PV Every Nth Point). 3만 개를 넘으면 간격을 두 배씩 키운다.
길이 = 벡터 크기 × scaleFactor (PV: Scale Array = 벡터 크기, 원형 길이 1). 길이를 일정으로 두면 scaleFactor 그대로(PV 'No scale array' — 저장 시점이 바뀌어도 같은 길이).
길이만 바뀌면(setLength) 고른 점은 그대로 두고 화살표 행렬만 다시 쓴다.
*/
/******************************************************************************/
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { PointDataset, VectorField } from '../data/pointDataset';
import { ColormapId, getColormap } from '../utils/colormap';
import { Axis } from '../core/layers';

export type GlyphSampling = { kind: 'uniform'; maxSamples: number } | { kind: 'stride'; stride: number };

export interface GlyphOptions {
  sampling: GlyphSampling;
  scaleFactor: number; // 길이 = 벡터 크기 × scaleFactor (uniformLength 면 scaleFactor)
  colormap: ColormapId;
  rangeMin: number;    // 색 범위(현재 색 매핑 값 기준)
  rangeMax: number;
  solidColor?: string; // 지정하면 Colormap 대신 단색으로 그린다 (바탕 점과 구분하기 위해)
  planeOffset?: { axis: Axis; sign: number }; // 평면 위 배치: 점 스프라이트에 가리지 않게 축 방향으로 한 칸 띄운다 (sign +1/-1 = 카메라 쪽)
  uniformLength?: boolean; // true면 길이를 일정하게 두고 색으로만 크기를 나타낸다
}

const UNIFORM_SEED = 10339; // ParaView Glyph 의 Seed 기본값 — 시점이 바뀌어도 같은 자리를 흩는다

/** 고정 시드 난수 (Park–Miller 최소 표준 생성기, 0~1) */
function lcg(seed: number): () => number {
  let x = seed % 2147483647; if (x <= 0) x += 2147483646;
  return () => { x = (x * 16807) % 2147483647; return x / 2147483647; };
}

/**
 * 균일 샘플: cand(통과한 점 번호)의 경계 상자 안에 n개 자리를 흩고 자리마다 가장 가까운 점을 고른다(중복 제거).
 * 가까운 점 찾기는 상자를 칸(해시 격자)으로 나눠 자리의 칸부터 껍질을 넓혀 가며 찾는다 — 찾은 거리가 다음 껍질까지의 최소 거리 이하면 멈춘다.
 */
export function uniformSample(pos: Float32Array, cand: Int32Array, n: number, seed = UNIFORM_SEED): number[] {
  const m = cand.length;
  if (!m || n <= 0) return [];
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (let k = 0; k < m; k++) { const i = cand[k] * 3; for (let a = 0; a < 3; a++) { const v = pos[i + a]; if (v < lo[a]) lo[a] = v; if (v > hi[a]) hi[a] = v; } }
  const ext = [0, 1, 2].map((a) => hi[a] - lo[a]);
  const maxExt = Math.max(ext[0], ext[1], ext[2]);
  // 칸 크기: 점 4개당 칸 하나쯤. 얇은 축(칸보다 얇음)은 한 칸으로 두고 나머지 축으로 다시 나눈다
  const target = Math.max(1, Math.min(m / 4, 1 << 21));
  let axes = [0, 1, 2].filter((a) => ext[a] > maxExt * 1e-9), h = maxExt || 1;
  for (let it = 0; it < 3 && axes.length; it++) {
    h = Math.pow(axes.reduce((p, a) => p * ext[a], 1) / target, 1 / axes.length);
    const keep = axes.filter((a) => ext[a] >= h);
    if (keep.length === axes.length) break;
    axes = keep;
  }
  if (!(h > 0)) h = maxExt || 1;
  const dims = ext.map((e) => Math.max(1, Math.ceil(e / h)));
  const cellOf = (v: number, a: number) => Math.min(dims[a] - 1, Math.max(0, Math.floor((v - lo[a]) / h)));
  const cells = dims[0] * dims[1] * dims[2];
  const start = new Int32Array(cells + 1);
  const cellIdx = new Int32Array(m);
  for (let k = 0; k < m; k++) {
    const i = cand[k] * 3;
    const c = cellOf(pos[i], 0) + dims[0] * (cellOf(pos[i + 1], 1) + dims[1] * cellOf(pos[i + 2], 2));
    cellIdx[k] = c; start[c + 1]++;
  }
  for (let c = 0; c < cells; c++) start[c + 1] += start[c];
  const fill = start.slice(0, cells), items = new Int32Array(m);
  for (let k = 0; k < m; k++) items[fill[cellIdx[k]]++] = cand[k];

  const rnd = lcg(seed);
  const picked = new Set<number>();
  const out: number[] = [];
  const maxR = Math.max(dims[0], dims[1], dims[2]);
  for (let s = 0; s < n; s++) {
    const q = [lo[0] + rnd() * ext[0], lo[1] + rnd() * ext[1], lo[2] + rnd() * ext[2]];
    const cx = cellOf(q[0], 0), cy = cellOf(q[1], 1), cz = cellOf(q[2], 2);
    let best = -1, bestD2 = Infinity;
    const scan = (x: number, y: number, z: number) => {
      if (x < 0 || y < 0 || z < 0 || x >= dims[0] || y >= dims[1] || z >= dims[2]) return;
      const c = x + dims[0] * (y + dims[1] * z);
      for (let t = start[c]; t < start[c + 1]; t++) {
        const i = items[t], j = i * 3;
        const dx = pos[j] - q[0], dy = pos[j + 1] - q[1], dz = pos[j + 2] - q[2];
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < bestD2) { bestD2 = d2; best = i; }
      }
    };
    for (let r = 0; r <= maxR; r++) {
      // 껍질(가운데 칸에서 r칸 떨어진 칸들)을 격자 안으로 잘라 훑는다 — 격자 밖 칸을 하나씩 거르면 점이 한쪽에 몰린 자료에서 몇 배 느리다
      const x0 = Math.max(cx - r, 0), x1 = Math.min(cx + r, dims[0] - 1), y0 = Math.max(cy - r, 0), y1 = Math.min(cy + r, dims[1] - 1);
      const z0 = Math.max(cz - r, 0), z1 = Math.min(cz + r, dims[2] - 1);
      for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) {
        if (Math.abs(x - cx) === r || Math.abs(y - cy) === r) { for (let z = z0; z <= z1; z++) scan(x, y, z); }
        else { if (cz - r >= 0) scan(x, y, cz - r); if (r > 0 && cz + r < dims[2]) scan(x, y, cz + r); }
      }
      if (best >= 0 && Math.sqrt(bestD2) <= r * h) break; // 다음 껍질의 칸은 적어도 r칸 떨어져 있다
    }
    if (best >= 0 && !picked.has(best)) { picked.add(best); out.push(best); }
  }
  return out;
}

const UP = new THREE.Vector3(0, 0, 1);

function makeArrowGeometry(): THREE.BufferGeometry {
  const shaft = new THREE.CylinderGeometry(0.07, 0.07, 0.65, 6, 1);
  shaft.translate(0, 0.325, 0);
  const head = new THREE.ConeGeometry(0.2, 0.35, 8, 1);
  head.translate(0, 0.825, 0);
  const merged = mergeGeometries([shaft, head], false)!;
  merged.rotateX(Math.PI / 2); // +y → +z 방향으로 향하게
  return merged;
}

export class VectorGlyphs {
  readonly group = new THREE.Group();
  private mesh: THREE.InstancedMesh | null = null;
  private readonly geometry = makeArrowGeometry();
  private readonly material = new THREE.MeshLambertMaterial({ color: 0xffffff });
  private dataset: PointDataset | null = null;
  private field: VectorField | null = null;
  visibleCount = 0;
  effectiveStride = 1;
  private lastIdx: number[] = [];               // 마지막으로 고른 점 (setLength 가 다시 쓴다)
  private readonly lastOffset = new THREE.Vector3();

  constructor() {
    this.group.name = 'cfd-vector-glyphs';
  }

  setDataset(ds: PointDataset | null): void {
    this.dataset = ds;
    this.field = null;
    this.clear();
  }

  setField(field: VectorField | null): void {
    this.field = field;
  }

  clear(): void {
    if (this.mesh) {
      this.group.remove(this.mesh);
      this.mesh.dispose();
      this.mesh = null;
    }
    this.visibleCount = 0;
  }

  /** 노드를 지울 때: 화살표 형상·재질까지 버린다 */
  dispose(): void { this.clear(); this.geometry.dispose(); this.material.dispose(); }

  /**
   * 화살표를 다시 만든다.
   * @param test   i번째 점이 보이는지 — 조상 Clip·Threshold 사슬 판정 (filter.ts makeChainTester)
   * @param values 점마다의 색 Field 값 (색에 쓴다; NaN 이면 그 점은 뺀다)
   */
  rebuild(test: (i: number) => boolean, opts: GlyphOptions, values: Float32Array): void {
    this.clear();
    const ds = this.dataset, field = this.field;
    if (!ds || !field) return;

    const pos = ds.positions;
    const ok = (i: number) => { const v = values[i]; return v === v && v < 1e29 && test(i); }; // NaN·결측 표시값(1e30)은 뺀다
    let idx: number[] = [];
    if (opts.sampling.kind === 'uniform') {
      const cand = new Int32Array(ds.count); // 셀이 수백만 개라도 일반 배열을 거치지 않게
      let m = 0;
      for (let i = 0; i < ds.count; i++) if (ok(i)) cand[m++] = i;
      idx = uniformSample(pos, cand.subarray(0, m), Math.max(1, Math.floor(opts.sampling.maxSamples)));
      this.effectiveStride = 1;
    } else {
      let stride = Math.max(1, Math.floor(opts.sampling.stride));
      // 화살표가 너무 많으면(3만 개 초과) 간격을 두 배씩 키운다. 간격이 점 수를 넘으면 많아야 1개이므로 반드시 끝난다
      for (;;) {
        idx = [];
        for (let i = 0; i < ds.count; i += stride) if (ok(i)) idx.push(i);
        if (idx.length <= 30000) break;
        stride *= 2;
      }
      this.effectiveStride = stride; // 화살표를 만든 그 간격
    }
    if (idx.length === 0) return;

    const cm = getColormap(opts.colormap);
    // 평면 위 배치에서는 점 스프라이트에 가리지 않도록 카메라 쪽으로 한 칸 띄운다.
    this.lastOffset.set(0, 0, 0);
    if (opts.planeOffset) this.lastOffset.setComponent(opts.planeOffset.axis, ds.spacing * 1.0 * (opts.planeOffset.sign >= 0 ? 1 : -1));
    this.lastIdx = idx;
    const mesh = new THREE.InstancedMesh(this.geometry, this.material, idx.length);
    this.writeMatrices(mesh, ds, field, opts.scaleFactor, !!opts.uniformLength);
    const color = new THREE.Color();
    const span = Math.max(opts.rangeMax - opts.rangeMin, 1e-12);

    for (let k = 0; k < idx.length; k++) {
      const i = idx[k];
      if (opts.solidColor) {
        color.set(opts.solidColor);
      } else {
        const t = THREE.MathUtils.clamp((values[i] - opts.rangeMin) / span, 0, 1);
        const [r, g, b] = cm.at(t);
        color.setRGB(r, g, b, THREE.SRGBColorSpace);
      }
      mesh.setColorAt(k, color);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.frustumCulled = false;
    this.mesh = mesh;
    this.group.add(mesh);
    this.visibleCount = idx.length;
  }

  /** 화살표 길이만 바꾼다 (Scale Factor · 길이 모드). 고른 점·색은 그대로 — 아직 그린 적이 없으면 아무것도 하지 않는다 */
  setLength(scaleFactor: number, uniformLength: boolean): void {
    const mesh = this.mesh, ds = this.dataset, field = this.field;
    if (!mesh || !ds || !field || mesh.count !== this.lastIdx.length) return;
    this.writeMatrices(mesh, ds, field, scaleFactor, uniformLength);
  }

  /** 고른 점마다 위치·방향(벡터)·길이 행렬. 길이 = 크기 × scaleFactor, 일정이면 scaleFactor */
  private writeMatrices(mesh: THREE.InstancedMesh, ds: PointDataset, field: VectorField, scaleFactor: number, uniformLength: boolean): void {
    const sf = Math.max(scaleFactor, 0), pos = ds.positions, idx = this.lastIdx;
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3(), dir = new THREE.Vector3();
    for (let k = 0; k < idx.length; k++) {
      const i = idx[k];
      dir.set(field.values[i * 3], field.values[i * 3 + 1], field.values[i * 3 + 2]);
      const mag = dir.length();
      if (mag < 1e-9) { dir.copy(UP); } else { dir.divideScalar(mag); }
      q.setFromUnitVectors(UP, dir);
      const len = (uniformLength ? 1 : mag) * sf;
      s.set(len * 0.9, len * 0.9, len);
      p.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]).add(this.lastOffset);
      m.compose(p, q, s);
      mesh.setMatrixAt(k, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }
}

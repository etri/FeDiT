// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   streamlineRenderer.ts

Streamline 을 그린다. 조상 Clip 은 선·면 재질의 clippingPlanes 로 건다 (setClips). 모양은 넷 중 하나:
- 선(line):   화면 굵기(px) 또는 미터 굵기의 굵은 선(LineSegments2).
- 튜브(tube): 원형 단면(12각)을 선을 따라 쓸어 만든 면. 지름은 미터.
- 각기둥(prism): 3~8각형 단면, 면마다 평평하게 음영.
- 리본(ribbon): 납작한 띠. 수평(흐름에 직각, 지면과 나란히) 또는 수직(위아래로 세움).

반투명일 때의 이음새 처리: 굵은 선은 선분마다 따로 그려져 이음새(둥근 끝)가 겹치고, 그 자리가 두 번
칠해져 동그란 무늬가 생긴다. 이를 없애려고 스텐실 버퍼를 쓴다 — 이 레이어에 배정된 스텐실 비트가
아직 0인 픽셀(샘플)에만 그리고 그리면서 그 비트를 1로 만든다. 그래서 한 레이어는 픽셀마다 한 번만
섞이고, 깊이 버퍼는 건드리지 않으므로(depthWrite=false) 뒤에 있는 반투명 건물·단면·등값면이 유선을
통해 그대로 비쳐 보인다. (깊이를 쓰는 방식은 뒤의 반투명 물체를 지워 버려서 쓰지 않는다.)
그리는 순서: 유선 물체는 renderOrder를 1로 두어 다른 반투명 물체(깊이를 쓰는 85% 건물·단면·등값면)보다
뒤에 그린다. 그래야 유선 앞의 물체는 깊이 검사로 유선을 가리고, 유선 뒤의 물체는 유선을 통해 비친다.
유선 레이어끼리는 지오메트리 중심을 물체 위치로 삼아(꼭짓점은 중심 기준 상대 좌표) 먼 것부터 그린다.
*/
/******************************************************************************/
import * as THREE from 'three';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { Streamline } from '../analysis/streamline';
import { RGB } from '../utils/colormap';
import { ClipParams, StreamShape } from '../core/layers';
import { applyClips } from './clipping';

export interface StreamStyle {
  shape: StreamShape;
  width: number;                        // 선 굵기 (px 또는 m)
  units: 'px' | 'm';
  meshWidth: number;                    // 튜브·각기둥 지름, 리본 너비 (m)
  sides: number;                        // 각기둥 면 수 (3~8)
  ribbonDir: 'horizontal' | 'vertical';
  opacity: number;
  dash: 'solid' | 'dashed' | 'dotted';  // 선 모양에만 적용
  dashUnit: number;                     // 파선 길이의 기준 (보통 격자 간격, m)
  stencilBit: number;                   // 0~7: 반투명 한 번 섞기용 스텐실 비트. 음수면 스텐실 없이 그냥 섞음
}

type ColorAt = (line: Streamline, i: number) => RGB;

const TUBE_SIDES = 12;
const STREAM_RENDER_ORDER = 1; // 다른 반투명 물체(renderOrder 0) 다음에 그린다

export class StreamlineRenderer {
  readonly group = new THREE.Group();
  private line: LineSegments2 | null = null;
  private mesh: THREE.Mesh | null = null;
  private readonly lineMat = new LineMaterial({ vertexColors: true, linewidth: 2, worldUnits: false });
  private readonly meshMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0 });
  private lines: Streamline[] = [];
  private colorAt: ColorAt | null = null;
  private center = new THREE.Vector3();
  private style: StreamStyle = { shape: 'line', width: 2, units: 'px', meshWidth: 1, sides: 4, ribbonDir: 'horizontal', opacity: 1, dash: 'solid', dashUnit: 1, stencilBit: -1 };
  private geomKey = '';
  lineCount = 0;
  pointCount = 0;
  triangleCount = 0;

  constructor() {
    this.group.name = 'streamlines';
    this.lineMat.resolution.set(1, 1);
  }

  setResolution(w: number, h: number): void { this.lineMat.resolution.set(w, h); }

  /** 모양·굵기·투명도·선 종류. 지오메트리를 새로 만들어야 하는 항목(모양·지름·면 수·리본 방향)이 바뀌면 다시 쓸어 만든다 (유선 계산은 다시 하지 않음). */
  setStyle(s: StreamStyle): void {
    this.style = s;
    const translucent = s.opacity < 0.999;

    this.lineMat.worldUnits = s.units === 'm';
    this.lineMat.linewidth = s.width;
    const dashed = s.dash !== 'solid';
    this.lineMat.dashed = dashed;
    if (dashed) {
      const u = Math.max(s.dashUnit, 1e-6);
      this.lineMat.dashSize = s.dash === 'dashed' ? u * 2 : u * 0.5;
      this.lineMat.gapSize = s.dash === 'dashed' ? u : u * 0.7;
      this.lineMat.dashScale = 1;
      this.line?.computeLineDistances();
    }
    this.lineMat.needsUpdate = true;

    const side = s.shape === 'ribbon' ? THREE.DoubleSide : THREE.FrontSide;
    const flat = s.shape === 'prism';
    if (this.meshMat.side !== side || this.meshMat.flatShading !== flat) { this.meshMat.side = side; this.meshMat.flatShading = flat; this.meshMat.needsUpdate = true; }

    for (const m of [this.lineMat, this.meshMat]) {
      m.opacity = s.opacity;
      m.transparent = translucent;
      m.depthWrite = !translucent;
      applyStencil(m, translucent ? s.stencilBit : -1);
    }

    const key = `${s.shape}|${s.meshWidth}|${s.sides}|${s.ribbonDir}`;
    if (key !== this.geomKey) { this.geomKey = key; this.build(); }
  }

  /** 조상 Clip 목록 (다시 계산 없이 바로). LineMaterial 도 clippingPlanes 를 지원한다 */
  setClips(clips: ClipParams[]): void { applyClips([this.lineMat, this.meshMat], clips); }

  clear(): void {
    this.dropObjects();
    this.lines = []; this.colorAt = null;
    this.lineCount = 0; this.pointCount = 0; this.triangleCount = 0;
  }

  /** 노드를 지울 때: 형상·재질까지 버린다 */
  dispose(): void { this.clear(); this.lineMat.dispose(); this.meshMat.dispose(); }

  private dropObjects(): void {
    if (this.line) { this.group.remove(this.line); this.line.geometry.dispose(); this.line = null; }
    if (this.mesh) { this.group.remove(this.mesh); this.mesh.geometry.dispose(); this.mesh = null; }
    this.triangleCount = 0;
  }

  /** 계산된 유선과 점 색 함수를 받아 현재 모양으로 그린다 */
  set(lines: Streamline[], colorAt: ColorAt): void {
    this.lines = lines.filter((l) => l.speeds.length >= 2);
    this.colorAt = colorAt;
    this.lineCount = this.lines.length;
    this.pointCount = 0;
    const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
    for (const l of this.lines) {
      const n = l.speeds.length;
      this.pointCount += n;
      for (let i = 0; i < n * 3; i++) { const k = i % 3, v = l.points[i]; if (v < lo[k]) lo[k] = v; if (v > hi[k]) hi[k] = v; }
    }
    this.center = this.lines.length ? new THREE.Vector3((lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2) : new THREE.Vector3();
    this.build();
  }

  private build(): void {
    this.dropObjects();
    if (!this.lines.length || !this.colorAt) return;
    if (this.style.shape === 'line') this.buildLine(this.colorAt);
    else this.buildMesh(this.colorAt);
  }

  private buildLine(colorAt: ColorAt): void {
    const c = this.center;
    let segs = 0;
    for (const l of this.lines) segs += l.speeds.length - 1;
    const pos = new Float32Array(segs * 6), col = new Float32Array(segs * 6);
    let o = 0;
    for (const l of this.lines) {
      const n = l.speeds.length;
      let prev = colorAt(l, 0);
      for (let i = 0; i < n - 1; i++) {
        const next = colorAt(l, i + 1);
        pos[o] = l.points[i * 3] - c.x; pos[o + 1] = l.points[i * 3 + 1] - c.y; pos[o + 2] = l.points[i * 3 + 2] - c.z;
        pos[o + 3] = l.points[i * 3 + 3] - c.x; pos[o + 4] = l.points[i * 3 + 4] - c.y; pos[o + 5] = l.points[i * 3 + 5] - c.z;
        col[o] = prev[0]; col[o + 1] = prev[1]; col[o + 2] = prev[2];
        col[o + 3] = next[0]; col[o + 4] = next[1]; col[o + 5] = next[2];
        o += 6;
        prev = next;
      }
    }
    const geom = new LineSegmentsGeometry();
    geom.setPositions(pos);
    geom.setColors(col);
    this.line = new LineSegments2(geom, this.lineMat);
    this.line.position.copy(c);
    this.line.renderOrder = STREAM_RENDER_ORDER;
    this.line.frustumCulled = false;
    if (this.lineMat.dashed) this.line.computeLineDistances();
    this.group.add(this.line);
  }

  /** 단면(원·다각형·띠)을 선을 따라 쓸어 면을 만든다. 프레임은 평행 이동(parallel transport)으로 꼬임 없이 옮긴다. */
  private buildMesh(colorAt: ColorAt): void {
    const s = this.style;
    const ctr = this.center;
    const ribbon = s.shape === 'ribbon';
    const ring = ribbon ? 2 : s.shape === 'tube' ? TUBE_SIDES : Math.min(8, Math.max(3, Math.round(s.sides)));
    const half = Math.max(s.meshWidth, 1e-6) / 2;
    let nv = 0, ntri = 0;
    for (const l of this.lines) { const n = l.speeds.length; nv += n * ring; ntri += (n - 1) * (ribbon ? 2 : ring * 2); }
    const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), col = new Float32Array(nv * 3);
    const idx = nv > 65535 ? new Uint32Array(ntri * 3) : new Uint16Array(ntri * 3);
    const t = new THREE.Vector3(), n = new THREE.Vector3(), b = new THREE.Vector3(), r = new THREE.Vector3(), p = new THREE.Vector3();
    const up = new THREE.Vector3(0, 0, 1);
    const angleOffset = s.shape === 'prism' ? Math.PI / ring : 0; // 각기둥은 윗면이 평평하게
    let vo = 0, io = 0;
    for (const l of this.lines) {
      const cnt = l.speeds.length, P = l.points, base = vo;
      for (let i = 0; i < cnt; i++) {
        p.set(P[i * 3] - ctr.x, P[i * 3 + 1] - ctr.y, P[i * 3 + 2] - ctr.z);
        const i0 = Math.max(0, i - 1), i1 = Math.min(cnt - 1, i + 1);
        t.set(P[i1 * 3] - P[i0 * 3], P[i1 * 3 + 1] - P[i0 * 3 + 1], P[i1 * 3 + 2] - P[i0 * 3 + 2]);
        if (t.lengthSq() < 1e-18) t.set(1, 0, 0); else t.normalize();
        if (i === 0) {
          // 첫 프레임: 위쪽(Z)에 가장 가까운 수직 방향. 수직 흐름이면 Y로 대신
          n.copy(up).addScaledVector(t, -t.dot(up));
          if (n.lengthSq() < 1e-6) n.set(0, 1, 0).addScaledVector(t, -t.y);
          n.normalize();
        } else {
          n.addScaledVector(t, -n.dot(t));
          if (n.lengthSq() < 1e-8) { n.copy(up).addScaledVector(t, -t.dot(up)); if (n.lengthSq() < 1e-6) n.set(0, 1, 0).addScaledVector(t, -t.y); }
          n.normalize();
        }
        b.crossVectors(t, n);
        const c = colorAt(l, i);
        if (ribbon) {
          // 수평: 흐름에 직각이면서 지면과 나란한 방향(b). 수직: 위쪽에 가까운 방향(n)
          const d = s.ribbonDir === 'horizontal' ? b : n;
          const nrm = s.ribbonDir === 'horizontal' ? n : b;
          for (let k = 0; k < 2; k++) {
            const sg = k === 0 ? -1 : 1;
            pos[vo * 3] = p.x + d.x * half * sg; pos[vo * 3 + 1] = p.y + d.y * half * sg; pos[vo * 3 + 2] = p.z + d.z * half * sg;
            nor[vo * 3] = nrm.x; nor[vo * 3 + 1] = nrm.y; nor[vo * 3 + 2] = nrm.z;
            col[vo * 3] = c[0]; col[vo * 3 + 1] = c[1]; col[vo * 3 + 2] = c[2];
            vo++;
          }
        } else {
          for (let k = 0; k < ring; k++) {
            const a = angleOffset + (2 * Math.PI * k) / ring;
            r.copy(n).multiplyScalar(Math.cos(a)).addScaledVector(b, Math.sin(a));
            pos[vo * 3] = p.x + r.x * half; pos[vo * 3 + 1] = p.y + r.y * half; pos[vo * 3 + 2] = p.z + r.z * half;
            nor[vo * 3] = r.x; nor[vo * 3 + 1] = r.y; nor[vo * 3 + 2] = r.z;
            col[vo * 3] = c[0]; col[vo * 3 + 1] = c[1]; col[vo * 3 + 2] = c[2];
            vo++;
          }
        }
      }
      // 이웃 고리끼리 사각형(삼각형 둘)으로 잇는다. 바깥쪽이 앞면이 되도록 감는다.
      for (let i = 0; i < cnt - 1; i++) {
        const r0 = base + i * ring, r1 = r0 + ring;
        if (ribbon) {
          idx[io++] = r0; idx[io++] = r0 + 1; idx[io++] = r1;
          idx[io++] = r0 + 1; idx[io++] = r1 + 1; idx[io++] = r1;
        } else {
          for (let k = 0; k < ring; k++) {
            const k1 = (k + 1) % ring;
            idx[io++] = r0 + k; idx[io++] = r0 + k1; idx[io++] = r1 + k;
            idx[io++] = r0 + k1; idx[io++] = r1 + k1; idx[io++] = r1 + k;
          }
        }
      }
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geom.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geom.setIndex(new THREE.BufferAttribute(idx, 1));
    geom.computeBoundingSphere();
    this.mesh = new THREE.Mesh(geom, this.meshMat);
    this.mesh.position.copy(ctr);
    this.mesh.renderOrder = STREAM_RENDER_ORDER;
    this.mesh.frustumCulled = false;
    this.triangleCount = ntri;
    this.group.add(this.mesh);
  }
}

/** 스텐실 비트 bit가 0인 곳에만 그리고, 그리면 그 비트를 1로 세운다. bit가 음수면 스텐실을 끈다. */
function applyStencil(m: THREE.Material, bit: number): void {
  const on = bit >= 0 && bit < 8;
  m.stencilWrite = on;
  if (on) {
    const mask = 1 << bit;
    m.stencilRef = mask;
    m.stencilFunc = THREE.NotEqualStencilFunc;
    m.stencilFuncMask = mask;
    m.stencilWriteMask = mask;
    m.stencilFail = THREE.KeepStencilOp;
    m.stencilZFail = THREE.KeepStencilOp;
    m.stencilZPass = THREE.ReplaceStencilOp;
  }
  m.needsUpdate = true;
}

// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   planeGizmo.ts

평면이 어디에 걸려 있는지 3D에서 바로 알아보게 하는 표시.
- 데이터 영역의 옅은 상자 테두리
- 평면 사각 테두리 + 옅은 면 (데이터 영역을 조금 넘게 덮는다)
- Clip 모드: position(하한)에서 남는 쪽(keepPositive)을 가리키는 화살표. position2(상한)가 있으면 같은 축의 두 번째 사각 테두리와
  두 테두리 사이의 옅은 면(네 옆면)을 그려 [하한, 상한] 구간을 보여 준다.
- 시작면(seed) 모드(Streamline): 시작점들과 그 범위 사각형, 추적 방향(평균 흐름) 화살표. 색을 다르게(녹색) 쓴다.
- Box 모드(Box Clip): 데이터 영역 상자 + Clip 상자(clipBox)의 테두리.
위치·축을 바꾸면 잠깐 진해졌다가(flash) 가라앉는다. PNG 캡처에는 넣지 않는다 (AppCore.captureBlob).
*/
/******************************************************************************/
import * as THREE from 'three';

export interface PlaneGizmoInput {
  bounds: { min: number[]; max: number[] };
  axis: 0 | 1 | 2;
  position: number;
  mode: 'clip' | 'slice' | 'seed' | 'box';
  keepPositive: boolean;                 // Clip 모드에서 +법선 쪽을 남기는지
  position2?: number;                    // Clip 모드: 구간 상한. 있으면 두 번째 테두리와 사이 면을 그린다
  seeds?: number[][];                    // 시작면 모드: 시작점 좌표
  flowDir?: [number, number, number] | null; // 시작면 모드: 시작점들의 평균 흐름 방향 (단위 벡터)
  direction?: 'forward' | 'backward' | 'both';
  clipBox?: { min: number[]; max: number[] }; // Box 모드: Clip 상자
}

const FRAME = 0x93c5fd; // 파랑 300
const FILL = 0x60a5fa;  // 파랑 400
const SEED = 0x34d399;  // 초록 400
const SEED_FILL = 0x10b981;
const BOX = 0x94a3b8;   // 회색 400
const FLASH_MS = 900;

export class PlaneGizmo {
  readonly group = new THREE.Group();
  private readonly frame: THREE.LineSegments;
  private readonly fill: THREE.Mesh;
  private readonly frame2: THREE.LineSegments; // Clip 구간 상한의 테두리
  private readonly band: THREE.Mesh;           // 두 테두리 사이의 옅은 옆면
  private readonly box: THREE.LineSegments;
  private readonly clipBox: THREE.LineSegments; // Box Clip 의 상자 테두리
  private readonly arrow: Arrow;
  private readonly arrow2: Arrow;
  private readonly seedRect: THREE.LineSegments;
  private readonly seedPts: THREE.Points;
  private readonly frameMat = new THREE.LineBasicMaterial({ color: FRAME, transparent: true, opacity: 0.6, depthTest: false });
  private readonly fillMat = new THREE.MeshBasicMaterial({ color: FILL, transparent: true, opacity: 0.08, side: THREE.DoubleSide, depthWrite: false });
  private readonly boxMat = new THREE.LineBasicMaterial({ color: BOX, transparent: true, opacity: 0.18 });
  private readonly seedRectMat = new THREE.LineBasicMaterial({ color: SEED, transparent: true, opacity: 0.9, depthTest: false });
  private readonly seedPtsMat = new THREE.PointsMaterial({ color: SEED, size: 6, sizeAttenuation: false, transparent: true, opacity: 0.95, depthTest: false });
  private flashUntil = 0;

  constructor() {
    this.group.name = 'plane-gizmo';
    this.frame = new THREE.LineSegments(new THREE.BufferGeometry(), this.frameMat);
    this.fill = new THREE.Mesh(new THREE.BufferGeometry(), this.fillMat);
    this.frame2 = new THREE.LineSegments(new THREE.BufferGeometry(), this.frameMat);
    this.band = new THREE.Mesh(new THREE.BufferGeometry(), this.fillMat);
    this.box = new THREE.LineSegments(new THREE.BufferGeometry(), this.boxMat);
    this.clipBox = new THREE.LineSegments(new THREE.BufferGeometry(), this.frameMat);
    this.arrow = new Arrow(FRAME);
    this.arrow2 = new Arrow(SEED);
    this.seedRect = new THREE.LineSegments(new THREE.BufferGeometry(), this.seedRectMat);
    this.seedPts = new THREE.Points(new THREE.BufferGeometry(), this.seedPtsMat);
    // 늘 보여야 하는 테두리·화살표(깊이 검사 끔)는 반투명 물체와 Volume(renderOrder 2) 뒤에 그린다 — 앞에 그리면 그 위로 섞여 흐려진다
    this.frame.renderOrder = 10;
    this.frame2.renderOrder = 10;
    this.clipBox.renderOrder = 10;
    this.arrow.renderOrder = 10;
    this.arrow2.renderOrder = 10;
    this.seedRect.renderOrder = 11;
    this.seedPts.renderOrder = 11;
    this.group.add(this.box, this.clipBox, this.fill, this.frame, this.frame2, this.band, this.arrow, this.arrow2, this.seedRect, this.seedPts);
    this.group.visible = false;
  }

  update(input: PlaneGizmoInput | null): void {
    if (!input) { this.group.visible = false; return; }
    const { bounds, axis, position, mode, keepPositive } = input;
    const min = bounds.min, max = bounds.max;
    const size = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
    const pad = Math.max(size[0], size[1], size[2]) * 0.02;
    const seed = mode === 'seed';
    this.frameMat.color.set(seed ? SEED : FRAME);
    this.fillMat.color.set(seed ? SEED_FILL : FILL);

    this.box.geometry.dispose();
    this.box.geometry = boxEdges(min, max);

    // Box 모드: 상자 테두리만 (평면·화살표·시작점은 숨김)
    const isBox = mode === 'box' && !!input.clipBox;
    this.clipBox.visible = isBox;
    for (const o of [this.frame, this.fill, this.frame2, this.band, this.arrow, this.arrow2, this.seedRect, this.seedPts]) o.visible = !isBox;
    if (isBox) {
      this.clipBox.geometry.dispose();
      this.clipBox.geometry = boxEdges(input.clipBox!.min, input.clipBox!.max);
      this.frameMat.color.set(FRAME);
      this.group.visible = true;
      return;
    }

    // 평면 사각형: axis를 뺀 두 축 방향으로 영역을 덮는다
    const u = (axis + 1) % 3, v = (axis + 2) % 3;
    const cornersAt = (at: number): number[][] => {
      const corner = (i: number, j: number): number[] => {
        const out = [0, 0, 0];
        out[axis] = at;
        out[u] = i ? max[u] + pad : min[u] - pad;
        out[v] = j ? max[v] + pad : min[v] - pad;
        return out;
      };
      return [corner(0, 0), corner(1, 0), corner(1, 1), corner(0, 1)];
    };
    const c = cornersAt(position);
    this.frame.geometry.dispose();
    this.frame.geometry = quadEdges(c);
    this.fill.geometry.dispose();
    this.fill.geometry = quadFill(c);

    // Clip 구간: 상한의 두 번째 테두리(같은 색)와 두 테두리 사이의 옅은 옆면
    const p2 = mode === 'clip' ? input.position2 : undefined;
    this.frame2.visible = this.band.visible = p2 !== undefined;
    if (p2 !== undefined) {
      const c2 = cornersAt(p2);
      this.frame2.geometry.dispose();
      this.frame2.geometry = quadEdges(c2);
      this.band.geometry.dispose();
      this.band.geometry = sideFill(c, c2);
    }

    // Clip 모드: 남는 쪽을 가리키는 화살표
    this.arrow.visible = mode === 'clip';
    if (mode === 'clip') {
      const dir = new THREE.Vector3();
      dir.setComponent(axis, keepPositive ? 1 : -1);
      const center = new THREE.Vector3((min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2);
      center.setComponent(axis, position);
      // 점 구름에 가려지지 않게 상자 밖에 둔다: 수직 평면이면 위쪽, 수평 평면이면 옆쪽
      if (axis !== 2) center.z = max[2] + pad * 1.5; else center.x = min[0] - pad * 2;
      const len = Math.max(size[0], size[1], size[2]) * 0.12;
      this.arrow.position.copy(center);
      this.arrow.set(dir, len);
    }

    // 시작면 모드: 시작점 · 그 범위 사각형 · 추적 방향 화살표 (앞/뒤/양쪽)
    const seeds = seed ? (input.seeds ?? []) : [];
    this.seedRect.visible = this.seedPts.visible = seeds.length > 0;
    this.arrow2.visible = false;
    if (seeds.length) {
      const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
      const flat = new Float32Array(seeds.length * 3);
      seeds.forEach((s, i) => {
        for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], s[k]); hi[k] = Math.max(hi[k], s[k]); }
        flat[i * 3] = s[0]; flat[i * 3 + 1] = s[1]; flat[i * 3 + 2] = s[2];
      });
      const pg = new THREE.BufferGeometry();
      pg.setAttribute('position', new THREE.BufferAttribute(flat, 3));
      this.seedPts.geometry.dispose();
      this.seedPts.geometry = pg;
      const m = pad * 0.5;
      const rc = (i: number, j: number): number[] => { const o = [0, 0, 0]; o[axis] = position; o[u] = i ? hi[u] + m : lo[u] - m; o[v] = j ? hi[v] + m : lo[v] - m; return o; };
      this.seedRect.geometry.dispose();
      this.seedRect.geometry = quadEdges([rc(0, 0), rc(1, 0), rc(1, 1), rc(0, 1)]);
      const fd = input.flowDir;
      if (fd) {
        const center = new THREE.Vector3((lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2);
        const len = Math.max(size[0], size[1], size[2]) * 0.14;
        const d = new THREE.Vector3(fd[0], fd[1], fd[2]);
        const dirMode = input.direction ?? 'forward';
        this.arrow.visible = dirMode !== 'backward';
        this.arrow2.visible = dirMode !== 'forward';
        if (this.arrow.visible) { this.arrow.position.copy(center); this.arrow.set(d, len); }
        if (this.arrow2.visible) { this.arrow2.position.copy(center); this.arrow2.set(d.clone().negate(), len); }
      }
    }
    // 화살표 색·깊이: 시작면은 녹색이고 항상 보이게, Clip 은 파랑
    for (const a of [this.arrow, this.arrow2]) { a.setColor(seed ? SEED : FRAME); a.setDepthTest(!seed); }
    this.group.visible = true;
  }

  /** 위치·축을 바꿨을 때 잠깐 진하게 */
  flash(): void { this.flashUntil = performance.now() + FLASH_MS; }

  tick(now: number): void {
    const t = Math.max(0, Math.min(1, (this.flashUntil - now) / FLASH_MS));
    this.frameMat.opacity = 0.6 + 0.35 * t;
    this.fillMat.opacity = 0.08 + 0.14 * t;
  }
}

/** 굵은 화살표(원기둥 몸통 + 원뿔 머리). ArrowHelper는 몸통이 1px 선이라 멀리서 잘 안 보여 대신 쓴다. */
class Arrow extends THREE.Group {
  private readonly shaft: THREE.Mesh;
  private readonly head: THREE.Mesh;
  private readonly mat: THREE.MeshBasicMaterial;
  constructor(color: number) {
    super();
    this.mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 });
    this.shaft = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 12), this.mat);
    this.head = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 16), this.mat);
    this.shaft.renderOrder = 10; this.head.renderOrder = 10;
    this.add(this.shaft, this.head);
  }
  /** 방향(단위 벡터)과 전체 길이. 머리는 길이의 35%, 굵기는 길이의 5% */
  set(dir: THREE.Vector3, len: number): void {
    const headLen = len * 0.35, shaftLen = len - headLen, r = len * 0.05;
    this.shaft.scale.set(r, shaftLen, r); this.shaft.position.y = shaftLen / 2;
    this.head.scale.set(r * 2.6, headLen, r * 2.6); this.head.position.y = shaftLen + headLen / 2;
    this.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  }
  setColor(c: number): void { this.mat.color.set(c); }
  setDepthTest(v: boolean): void { if (this.mat.depthTest !== v) { this.mat.depthTest = v; this.mat.needsUpdate = true; } }
}

function quadEdges(c: number[][]): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([...c[0], ...c[1], ...c[1], ...c[2], ...c[2], ...c[3], ...c[3], ...c[0]], 3));
  return g;
}

/** 사각형 하나를 삼각형 둘로 채운 면 */
function quadFill(c: number[][]): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([...c[0], ...c[1], ...c[2], ...c[0], ...c[2], ...c[3]], 3));
  return g;
}

/** 같은 축의 두 사각형(c, c2) 사이 네 옆면 (Clip 구간 표시) */
function sideFill(c: number[][], c2: number[][]): THREE.BufferGeometry {
  const arr: number[] = [];
  for (let k = 0; k < 4; k++) {
    const a = c[k], b = c[(k + 1) % 4], a2 = c2[k], b2 = c2[(k + 1) % 4];
    arr.push(...a, ...b, ...b2, ...a, ...b2, ...a2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
  return g;
}

function boxEdges(min: number[], max: number[]): THREE.BufferGeometry {
  const c = (i: number) => [i & 1 ? max[0] : min[0], i & 2 ? max[1] : min[1], i & 4 ? max[2] : min[2]];
  const edges = [[0, 1], [1, 3], [3, 2], [2, 0], [4, 5], [5, 7], [7, 6], [6, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
  const arr: number[] = [];
  for (const [a, b] of edges) arr.push(...c(a), ...c(b));
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
  return g;
}

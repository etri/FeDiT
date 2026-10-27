// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   objects.ts

편집 대상 객체(건물·몸체 같은 형상)의 자료형과 저장소. 렌더러 안에서 형상을 고르고 옮기고 만들고 지우는
"오브젝트 편집"의 바탕이며, 예전 편집기 코드는 쓰지 않고 새로 만들었다.
- SceneObject: 지역 좌표 형상(바닥 중심이 원점, z가 위) + 위치 · z축 회전 · 크기 배율
- ObjectStore: 목록 · 선택 · 되돌리기(스냅샷) · 자동 인식(연결 요소 나누기) · 합치기 · STL/JSON 내보내기·불러오기
*/
/******************************************************************************/
import * as THREE from 'three';

export type ObjectKind = 'mesh' | 'box' | 'cylinder';
export type Vec3 = [number, number, number];

export interface SceneObject {
  id: string;
  name: string;
  kind: ObjectKind;
  geometry: THREE.BufferGeometry; // 지역 좌표: 바닥 중심이 원점
  position: Vec3;                 // 바닥 중심의 세계 좌표
  rotationZ: number;              // 도(°), 연직축 회전
  scale: Vec3;
  size: Vec3;                     // 배율 1일 때의 가로(x) · 세로(y) · 높이(z)
  visible: boolean;
  translucent?: boolean;          // 부피 표시용 영역(초기 유체·격자 세분화 상자 등): 반투명으로 그려 안이 보이게
}

/** 이름 붙이기용 발자국 (예: sample_city_buildings.json) */
export interface Footprint { name: string; x0: number; y0: number; x1: number; y1: number; height?: number }

interface Snapshot { objects: SceneObject[]; selection: Set<string> }

interface JsonObject {
  name?: string; kind: ObjectKind; position?: number[]; rotationZ?: number; scale?: number[]; size?: number[]; visible?: boolean;
}

let nextId = 1;
const newId = () => `obj-${Date.now().toString(36)}-${(nextId++).toString(36)}`;
const vec3 = (a: number[] | undefined, d: Vec3): Vec3 => (a && a.length === 3 ? [a[0], a[1], a[2]] : d);
const clone = (o: SceneObject): SceneObject => ({ ...o, position: [...o.position], scale: [...o.scale], size: [...o.size] });

export function objectMatrix(o: SceneObject): THREE.Matrix4 {
  return new THREE.Matrix4().compose(
    new THREE.Vector3().fromArray(o.position),
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), THREE.MathUtils.degToRad(o.rotationZ)),
    new THREE.Vector3().fromArray(o.scale),
  );
}

/** 삼각형 묶음을 바닥 중심이 원점이 되게 옮기고 객체로 만든다 */
function objectFromGeometry(geometry: THREE.BufferGeometry, name: string): SceneObject {
  geometry.computeBoundingBox();
  const bb = geometry.boundingBox!;
  const cx = (bb.min.x + bb.max.x) / 2, cy = (bb.min.y + bb.max.y) / 2, z0 = bb.min.z;
  geometry.translate(-cx, -cy, -z0);
  geometry.computeBoundingBox();
  geometry.computeVertexNormals();
  return {
    id: newId(), name, kind: 'mesh', geometry, position: [cx, cy, z0], rotationZ: 0, scale: [1, 1, 1],
    size: [bb.max.x - bb.min.x, bb.max.y - bb.min.y, bb.max.z - bb.min.z], visible: true,
  };
}

export function makePrimitiveGeometry(kind: 'box' | 'cylinder', size: Vec3): THREE.BufferGeometry {
  const [w, d, h] = size;
  const g = kind === 'box' ? new THREE.BoxGeometry(w, d, h) : new THREE.CylinderGeometry(w / 2, w / 2, h, 32).rotateX(Math.PI / 2);
  g.translate(0, 0, h / 2); // 바닥이 z = 0
  g.computeBoundingBox();
  return g;
}

/** 서로 붙어 있지 않은 삼각형 덩어리(연결 요소)로 나눈다 — "객체 자동 인식". 너무 잘게 나뉘면 하나로 둔다. */
export function splitComponents(geometry: THREE.BufferGeometry, maxParts = 500): THREE.BufferGeometry[] {
  const src = geometry.index ? geometry.toNonIndexed() : geometry;
  const pos = src.getAttribute('position').array as Float32Array;
  const nVert = pos.length / 3;
  src.computeBoundingBox();
  const bb = src.boundingBox!;
  const eps = Math.max(1e-9, bb.min.distanceTo(bb.max) * 1e-6);
  // 같은 자리의 꼭짓점을 하나로 본다
  const keyToId = new Map<string, number>();
  const vid = new Int32Array(nVert);
  for (let i = 0; i < nVert; i++) {
    const k = `${Math.round(pos[i * 3] / eps)},${Math.round(pos[i * 3 + 1] / eps)},${Math.round(pos[i * 3 + 2] / eps)}`;
    let id = keyToId.get(k);
    if (id === undefined) { id = keyToId.size; keyToId.set(k, id); }
    vid[i] = id;
  }
  const parent = new Int32Array(keyToId.size);
  for (let i = 0; i < parent.length; i++) parent[i] = i;
  const find = (a: number): number => { while (parent[a] !== a) { parent[a] = parent[parent[a]]; a = parent[a]; } return a; };
  const union = (a: number, b: number) => { a = find(a); b = find(b); if (a !== b) parent[a] = b; };
  const nTri = nVert / 3;
  for (let t = 0; t < nTri; t++) { union(vid[t * 3], vid[t * 3 + 1]); union(vid[t * 3], vid[t * 3 + 2]); }
  const groups = new Map<number, number[]>();
  for (let t = 0; t < nTri; t++) {
    const r = find(vid[t * 3]);
    let g = groups.get(r);
    if (!g) { g = []; groups.set(r, g); }
    g.push(t);
  }
  if (groups.size <= 1 || groups.size > maxParts) return [src];
  const out: THREE.BufferGeometry[] = [];
  for (const tris of groups.values()) {
    const arr = new Float32Array(tris.length * 9);
    for (let i = 0; i < tris.length; i++) arr.set(pos.subarray(tris[i] * 9, tris[i] * 9 + 9), i * 9);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    out.push(g);
  }
  out.sort((a, b) => b.getAttribute('position').count - a.getAttribute('position').count); // 큰 덩어리부터
  return out;
}

/** STL 등에서 읽은 형상들을 객체 목록으로. 발자국 목록이 있으면 가까운 이름을 붙인다. */
/** 객체들을 세계 좌표(위치·회전·배율 적용)로 구워 이진 STL 바이트로. 전처리 페이지의 영역 STL 내보내기도 이것을 쓴다 */
export function stlBufferOf(objects: SceneObject[], header = 'union-twin-cfd-renderer scene'): ArrayBuffer {
  const tris: Float32Array[] = [];
  let count = 0;
  for (const o of objects) {
    const a = (o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone()).applyMatrix4(objectMatrix(o)).getAttribute('position').array as Float32Array;
    tris.push(a);
    count += a.length / 9;
  }
  const buf = new ArrayBuffer(84 + count * 50);
  const dv = new DataView(buf);
  new Uint8Array(buf, 0, 80).set(new TextEncoder().encode(header).subarray(0, 80));
  dv.setUint32(80, count, true);
  let p = 84;
  const n = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), ac = new THREE.Vector3();
  for (const arr of tris) {
    for (let i = 0; i < arr.length; i += 9) {
      a.fromArray(arr, i); b.fromArray(arr, i + 3); c.fromArray(arr, i + 6);
      n.subVectors(b, a).cross(ac.subVectors(c, a)).normalize();
      for (const v of [n, a, b, c]) { dv.setFloat32(p, v.x, true); dv.setFloat32(p + 4, v.y, true); dv.setFloat32(p + 8, v.z, true); p += 12; }
      dv.setUint16(p, 0, true); p += 2;
    }
  }
  return buf;
}

/** 조각으로 나누지 않고 지오메트리 하나를 객체 하나로 (전처리 영역 STL처럼 한 덩어리로 다뤄야 할 때) */
export function objectFromWholeGeometry(geometry: THREE.BufferGeometry, name: string): SceneObject {
  return objectFromGeometry(geometry, name);
}

export function objectsFromGeometries(geometries: THREE.BufferGeometry[], footprints?: Footprint[]): SceneObject[] {
  const objs: SceneObject[] = [];
  for (const geometry of geometries) {
    for (const part of splitComponents(geometry)) objs.push(objectFromGeometry(part, ''));
  }
  const used = new Set<string>();
  objs.forEach((o, i) => {
    let name = '';
    if (footprints?.length) {
      let best: Footprint | null = null, bestD = Infinity;
      for (const f of footprints) {
        if (used.has(f.name)) continue;
        const d = Math.hypot((f.x0 + f.x1) / 2 - o.position[0], (f.y0 + f.y1) / 2 - o.position[1]);
        if (d < bestD) { bestD = d; best = f; }
      }
      if (best && bestD < Math.max(o.size[0], o.size[1])) { name = best.name; used.add(best.name); }
    }
    o.name = name || `형상 ${i + 1}`;
  });
  return objs;
}

export class ObjectStore {
  list: SceneObject[] = [];
  selection = new Set<string>();
  private undoStack: Snapshot[] = [];
  private redoStack: Snapshot[] = [];
  private dragSnapshot: Snapshot | null = null;
  private listeners: (() => void)[] = [];

  subscribe(cb: () => void): void { this.listeners.push(cb); }
  private emit(): void { for (const cb of this.listeners) cb(); }

  // ---- 되돌리기 ----
  private snapshot(): Snapshot { return { objects: this.list.map(clone), selection: new Set(this.selection) }; }
  private push(): void { this.undoStack.push(this.snapshot()); if (this.undoStack.length > 50) this.undoStack.shift(); this.redoStack = []; }
  private restore(s: Snapshot): void { this.list = s.objects.map(clone); this.selection = new Set(s.selection); this.emit(); }
  get canUndo(): boolean { return this.undoStack.length > 0; }
  get canRedo(): boolean { return this.redoStack.length > 0; }
  undo(): void { const s = this.undoStack.pop(); if (!s) return; this.redoStack.push(this.snapshot()); this.restore(s); }
  redo(): void { const s = this.redoStack.pop(); if (!s) return; this.undoStack.push(this.snapshot()); this.restore(s); }

  // ---- 목록 ----
  /** 데이터셋을 새로 불러올 때: 목록을 통째로 바꾸고 되돌리기 기록을 비운다 */
  replaceAll(objects: SceneObject[]): void { this.list = objects; this.selection.clear(); this.undoStack = []; this.redoStack = []; this.emit(); }
  append(objects: SceneObject[]): void {
    if (!objects.length) return;
    this.push();
    this.list.push(...objects);
    this.selection = new Set(objects.map((o) => o.id));
    this.emit();
  }
  addPrimitive(kind: 'box' | 'cylinder', at: Vec3): void {
    const size: Vec3 = kind === 'box' ? [20, 20, 30] : [16, 16, 30];
    const n = this.list.filter((o) => o.kind === kind).length + 1;
    this.append([{
      id: newId(), name: `${kind === 'box' ? '상자' : '원기둥'} ${n}`, kind, geometry: makePrimitiveGeometry(kind, size),
      position: [...at], rotationZ: 0, scale: [1, 1, 1], size, visible: true,
    }]);
  }
  byId(id: string): SceneObject | undefined { return this.list.find((o) => o.id === id); }
  selectedObjects(): SceneObject[] { return this.list.filter((o) => this.selection.has(o.id)); }
  selectedOne(): SceneObject | null { const s = this.selectedObjects(); return s.length === 1 ? s[0] : null; }

  // ---- 선택 ----
  select(ids: string[], mode: 'replace' | 'toggle' | 'add' = 'replace'): void {
    if (mode === 'replace') this.selection = new Set(ids);
    else for (const id of ids) { if (mode === 'toggle' && this.selection.has(id)) this.selection.delete(id); else this.selection.add(id); }
    this.emit();
  }
  clearSelection(): void { if (this.selection.size) { this.selection.clear(); this.emit(); } }

  // ---- 편집 ----
  update(id: string, patch: Partial<Pick<SceneObject, 'name' | 'position' | 'rotationZ' | 'scale' | 'visible' | 'size' | 'translucent'>>): void {
    const o = this.byId(id);
    if (!o) return;
    this.push();
    Object.assign(o, patch);
    if (patch.size && o.kind !== 'mesh') o.geometry = makePrimitiveGeometry(o.kind, o.size);
    this.emit();
  }
  /** 주어진 객체들을 지운다 (전처리의 영역 삭제가 쓴다). 되돌리기 기록에 남긴다 */
  remove(ids: string[]): void {
    const set = new Set(ids);
    if (!this.list.some((o) => set.has(o.id))) return;
    this.push();
    this.list = this.list.filter((o) => !set.has(o.id));
    for (const id of ids) this.selection.delete(id);
    this.emit();
  }

  removeSelected(): void {
    if (!this.selection.size) return;
    this.push();
    this.list = this.list.filter((o) => !this.selection.has(o.id));
    this.selection.clear();
    this.emit();
  }
  duplicateSelected(): void {
    const sel = this.selectedObjects();
    if (!sel.length) return;
    this.push();
    const clones = sel.map((o) => { const c = clone(o); c.id = newId(); c.name = `${o.name} 사본`; c.position[0] += o.size[0] * o.scale[0] * 1.2; return c; });
    this.list.push(...clones);
    this.selection = new Set(clones.map((c) => c.id));
    this.emit();
  }
  /** 핸들로 끄는 동안: 시작할 때 스냅샷을 잡아 두고 끝날 때 되돌리기 기록에 넣는다 */
  beginDrag(): void { this.dragSnapshot = this.snapshot(); }
  setTransformLive(id: string, position: Vec3, rotationZ: number, scale: Vec3): void {
    const o = this.byId(id);
    if (!o) return;
    o.position = position; o.rotationZ = rotationZ; o.scale = scale;
    this.emit();
  }
  endDrag(): void {
    if (!this.dragSnapshot) return;
    this.undoStack.push(this.dragSnapshot);
    if (this.undoStack.length > 50) this.undoStack.shift();
    this.redoStack = [];
    this.dragSnapshot = null;
    this.emit();
  }
  /** 선택한 형상을 연결 요소로 나눈다 (세계 좌표로 구운 뒤 나눔) */
  splitSelected(): void {
    const sel = this.selectedObjects().filter((o) => o.kind === 'mesh');
    if (!sel.length) return;
    this.push();
    const added: SceneObject[] = [];
    for (const o of sel) {
      const parts = splitComponents(o.geometry.clone().applyMatrix4(objectMatrix(o)));
      if (parts.length <= 1) continue;
      this.list = this.list.filter((x) => x.id !== o.id);
      parts.forEach((p, i) => added.push(objectFromGeometry(p, `${o.name}-${i + 1}`)));
    }
    this.list.push(...added);
    this.selection = new Set(added.map((a) => a.id));
    this.emit();
  }
  /** 선택한 객체들을 하나의 형상으로 합친다 */
  mergeSelected(): void {
    const sel = this.selectedObjects();
    if (sel.length < 2) return;
    this.push();
    const arrays = sel.map((o) => (o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone()).applyMatrix4(objectMatrix(o)).getAttribute('position').array as Float32Array);
    const merged = new Float32Array(arrays.reduce((n, a) => n + a.length, 0));
    let off = 0;
    for (const a of arrays) { merged.set(a, off); off += a.length; }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(merged, 3));
    const obj = objectFromGeometry(g, `${sel[0].name} 병합`);
    this.list = this.list.filter((x) => !this.selection.has(x.id));
    this.list.push(obj);
    this.selection = new Set([obj.id]);
    this.emit();
  }

  /** 보이는 객체 전체의 세계 좌표 경계 (없으면 null) */
  bounds(): { min: Vec3; max: Vec3 } | null {
    const box = new THREE.Box3();
    for (const o of this.list) {
      if (!o.visible) continue;
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      box.union(o.geometry.boundingBox!.clone().applyMatrix4(objectMatrix(o)));
    }
    return box.isEmpty() ? null : { min: box.min.toArray() as Vec3, max: box.max.toArray() as Vec3 };
  }

  // ---- 내보내기 · 불러오기 ----
  /** 보이는 객체 전체를 세계 좌표로 구워 이진 STL로 (솔버 입력용) */
  exportStl(): Blob {
    return new Blob([stlBufferOf(this.list.filter((o) => o.visible))], { type: 'model/stl' });
  }

  toJSON(): string {
    const objects = this.list.map((o) => ({ name: o.name, kind: o.kind, position: o.position, rotationZ: o.rotationZ, scale: o.scale, size: o.size, visible: o.visible }));
    return JSON.stringify({ version: 1, objects }, null, 2);
  }

  /** JSON 장면: 상자·원기둥은 다시 만들고, 형상(mesh)은 같은 이름의 현재 객체에 위치·배율을 입힌다 */
  loadJSON(text: string): { applied: number; skipped: number } {
    const data = JSON.parse(text) as { objects?: JsonObject[] };
    if (!Array.isArray(data.objects)) throw new Error('objects 목록이 없는 장면 파일입니다.');
    this.push();
    let applied = 0, skipped = 0;
    const keep: SceneObject[] = [];
    const meshByName = new Map(this.list.filter((o) => o.kind === 'mesh').map((o) => [o.name, o] as const));
    for (const d of data.objects) {
      if (d.kind === 'mesh') {
        const o = d.name ? meshByName.get(d.name) : undefined;
        if (!o) { skipped++; continue; }
        o.position = vec3(d.position, o.position); o.rotationZ = d.rotationZ ?? 0; o.scale = vec3(d.scale, [1, 1, 1]); o.visible = d.visible ?? true;
        keep.push(o); applied++;
      } else if (d.kind === 'box' || d.kind === 'cylinder') {
        const size = vec3(d.size, [20, 20, 30]);
        keep.push({
          id: newId(), name: d.name ?? d.kind, kind: d.kind, geometry: makePrimitiveGeometry(d.kind, size),
          position: vec3(d.position, [0, 0, 0]), rotationZ: d.rotationZ ?? 0, scale: vec3(d.scale, [1, 1, 1]), size, visible: d.visible ?? true,
        });
        applied++;
      } else skipped++;
    }
    this.list = keep;
    this.selection.clear();
    this.emit();
    return { applied, skipped };
  }
}

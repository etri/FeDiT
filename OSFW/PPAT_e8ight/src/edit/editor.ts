// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   editor.ts

3D 화면 안에서 객체를 고르고(클릭, Ctrl+클릭으로 여러 개) 핸들로 옮기고 돌리고 키우는 편집 조작.
three.js TransformControls를 쓰며, 편집 탭이 열려 있을 때만 동작한다.
단축키: V 선택 · T 이동 · R 회전 · S 크기 · Esc 선택 해제 · Delete 삭제 · Ctrl+D 복제 · Ctrl+Z / Ctrl+Y 되돌리기 · 다시 실행
*/
/******************************************************************************/
import * as THREE from 'three';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ObjectStore } from './objects';
import { Scenery } from '../render/scenery';

export type EditMode = 'select' | 'translate' | 'rotate' | 'scale';

export class Editor {
  mode: EditMode = 'select';
  snap = false;
  active = false;
  private readonly controls: TransformControls;
  private readonly helper: THREE.Object3D;
  private readonly raycaster = new THREE.Raycaster();
  private downAt: [number, number] | null = null;
  private downOnGizmo = false;
  private listeners: (() => void)[] = [];

  constructor(
    private readonly store: ObjectStore,
    private readonly scenery: Scenery,
    private camera: THREE.Camera,
    private readonly dom: HTMLElement,
    private readonly orbit: OrbitControls,
    scene: THREE.Scene,
  ) {
    this.controls = new TransformControls(camera, dom);
    this.controls.space = 'world';
    this.controls.size = 0.8;
    this.helper = this.controls.getHelper();
    this.helper.visible = false;
    scene.add(this.helper);
    this.controls.addEventListener('dragging-changed', (e) => {
      const dragging = !!(e as unknown as { value: boolean }).value;
      this.orbit.enabled = !dragging; // 핸들을 끄는 동안 화면 회전을 멈춘다
      if (dragging) this.store.beginDrag(); else this.store.endDrag();
    });
    this.controls.addEventListener('objectChange', () => this.readBack());
    dom.addEventListener('pointerdown', (e) => {
      if (!this.active || e.button !== 0) return;
      this.downAt = [e.clientX, e.clientY];
      this.downOnGizmo = this.controls.axis !== null;
    });
    dom.addEventListener('pointerup', (e) => this.onPointerUp(e));
    window.addEventListener('keydown', (e) => this.onKey(e));
    store.subscribe(() => this.syncAttach());
  }

  subscribe(cb: () => void): void { this.listeners.push(cb); }
  private emit(): void { for (const cb of this.listeners) cb(); }

  setActive(v: boolean): void { this.active = v; this.syncAttach(); this.emit(); }
  setMode(m: EditMode): void { this.mode = m; this.syncAttach(); this.emit(); }
  /** 원근 ↔ 직교 전환 때 핸들과 클릭 선택이 새 카메라를 쓰게 한다 */
  setCamera(camera: THREE.Camera): void { this.camera = camera; this.controls.camera = camera; }
  setSnap(v: boolean): void { this.snap = v; this.applySnap(); this.emit(); }
  /** 캡처할 때 핸들을 잠깐 숨긴다 */
  setHelperVisible(v: boolean): void { this.helper.visible = v && this.controls.object !== undefined; }

  private applySnap(): void {
    this.controls.translationSnap = this.snap ? 1 : null;
    this.controls.rotationSnap = this.snap ? THREE.MathUtils.degToRad(15) : null;
    this.controls.scaleSnap = this.snap ? 0.1 : null;
  }

  private syncAttach(): void {
    const one = this.store.selectedOne();
    const group = one && this.active && this.mode !== 'select' ? this.scenery.groupOf(one.id) : null;
    if (group) {
      if (this.controls.object !== group) this.controls.attach(group);
      this.controls.mode = this.mode as 'translate' | 'rotate' | 'scale';
      const rot = this.mode === 'rotate';
      this.controls.showX = !rot; this.controls.showY = !rot; this.controls.showZ = true; // 회전은 연직축만
      this.applySnap();
      this.helper.visible = true;
    } else if (this.controls.object) {
      this.controls.detach();
      this.helper.visible = false;
    }
  }

  /** 핸들이 움직인 결과를 저장소에 되돌려 쓴다 */
  private readBack(): void {
    const g = this.controls.object;
    const id = g?.userData.id as string | undefined;
    if (!g || !id) return;
    this.store.setTransformLive(id, [g.position.x, g.position.y, g.position.z], THREE.MathUtils.radToDeg(g.rotation.z), [g.scale.x, g.scale.y, g.scale.z]);
  }

  private onPointerUp(e: PointerEvent): void {
    if (!this.active || !this.downAt || e.button !== 0) { this.downAt = null; return; }
    const moved = Math.hypot(e.clientX - this.downAt[0], e.clientY - this.downAt[1]);
    const onGizmo = this.downOnGizmo;
    this.downAt = null;
    if (moved > 4 || onGizmo || this.controls.dragging) return; // 회전·드래그는 선택이 아니다
    const rect = this.dom.getBoundingClientRect();
    const ndc = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera);
    const hit = this.raycaster.intersectObjects(this.scenery.pickables(), false)[0];
    const id = hit ? (hit.object.userData.id as string) : null;
    const multi = e.ctrlKey || e.metaKey;
    if (id) this.store.select([id], multi ? 'toggle' : 'replace');
    else if (!multi) this.store.clearSelection();
  }

  private onKey(e: KeyboardEvent): void {
    if (!this.active) return;
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    const k = e.key.toLowerCase();
    const mod = e.ctrlKey || e.metaKey;
    if (mod && k === 'z') { e.preventDefault(); if (e.shiftKey) this.store.redo(); else this.store.undo(); return; }
    if (mod && k === 'y') { e.preventDefault(); this.store.redo(); return; }
    if (mod && k === 'd') { e.preventDefault(); this.store.duplicateSelected(); return; }
    if (mod || e.altKey) return;
    if (k === 'escape') this.store.clearSelection();
    else if (k === 'delete' || k === 'backspace') this.store.removeSelected();
    else if (k === 't') this.setMode('translate');
    else if (k === 'r') this.setMode('rotate');
    else if (k === 's') this.setMode('scale');
    else if (k === 'v') this.setMode('select');
  }
}

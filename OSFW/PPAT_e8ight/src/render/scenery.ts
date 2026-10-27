// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   scenery.ts

조명, 지면 격자, 좌표축, 형상 객체(건물·몸체) 등 데이터가 아닌 장면 요소.
형상은 편집 저장소(edit/objects.ts)의 객체 목록을 그대로 그린다: 객체마다 그룹(위치·회전·배율) 안에
메시 + 외곽선. 고른 객체는 파란 색조로 강조한다. 좌표계는 CFD 관례대로 z가 위쪽이다.

형상 재질(클레이): 데이터가 아닌 맥락 요소라서 채도 없는 밝은 회색으로 두고, 장면 조명과 무관하게
면의 방향만으로 밝기를 정한다(윗면 밝게 · 옆면 두 단계 · 뒷면 어둡게 — 아이소메트릭 그림의 3톤 음영).
면 법선은 화면 미분(dFdx/dFdy)으로 구해 어떤 메시든 각진 음영이 되고, 아래로 갈수록 살짝 어두워지는
높이 그라데이션으로 땅에 붙어 보이게 한다. 색이 값을 뜻하는 데이터 레이어에는 영향을 주지 않는다.

조명: 반구 조명 + 헤드라이트(카메라를 따라다니는 방향광). 등값면·튜브 유선 같은 입체 데이터는 어느
각도에서 봐도 음영이 약하고 일정해야 색을 읽기 쉽다. 정면광은 밋밋하므로 어깨 너머(왼쪽 위)에서 비춘다.
*/
/******************************************************************************/
import * as THREE from 'three';
import { Bounds } from '../data/pointDataset';
import { SceneObject } from '../edit/objects';

const CLAY_VERT = /* glsl */ `
varying vec3 vWorldPos;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const CLAY_FRAG = /* glsl */ `
uniform vec3 baseColor;
uniform float opacity;
uniform vec3 lightDir;
uniform float groundZ;
uniform float gradH;
varying vec3 vWorldPos;
void main() {
  // 면 법선: 화면 미분의 외적은 항상 보는 쪽을 향한다 → 메시 법선 없이도 면마다 한 가지 밝기
  vec3 n = normalize(cross(dFdx(vWorldPos), dFdy(vWorldPos)));
  float d = dot(n, lightDir);
  float tone = d > 0.0 ? 0.62 + 0.38 * d : 0.62 + 0.10 * d;          // 눈에 보이는 밝기(감마 공간) 기준의 3톤
  tone *= mix(0.88, 1.0, smoothstep(0.0, gradH, vWorldPos.z - groundZ)); // 아래쪽은 살짝 어둡게
  gl_FragColor = vec4(baseColor * pow(tone, 2.2), opacity);              // 선형 공간으로 옮겨 곱한다
  #include <colorspace_fragment>
}`;

function clayMaterial(color: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      baseColor: { value: new THREE.Color(color) },
      opacity: { value: 1 },
      lightDir: { value: new THREE.Vector3(-0.33, -0.5, 0.8).normalize() },
      groundZ: { value: 0 },
      gradH: { value: 30 },
    },
    vertexShader: CLAY_VERT,
    fragmentShader: CLAY_FRAG,
    side: THREE.DoubleSide,
    // 모서리 선(EdgesGeometry)이 면과 같은 깊이에 놓인다 — 면을 조금 뒤로 밀어 선이 면에 묻혔다 나왔다 하지 않게(카메라가 관성으로 미세하게 움직이는 동안 깜빡임)
    polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1,
  });
}

export class Scenery {
  readonly group = new THREE.Group();
  readonly buildings = new THREE.Group();
  private grid: THREE.GridHelper | null = null;
  private axes: THREE.AxesHelper | null = null;
  private readonly objectGroups = new Map<string, THREE.Group>();
  private readonly edgeCache = new Map<THREE.BufferGeometry, THREE.EdgesGeometry>();
  private readonly buildingMaterial = clayMaterial(0xdfe3e8);
  private readonly selectedMaterial = clayMaterial(0x93b4f5);
  private readonly volumeMaterial = clayMaterial(0xa7c8f2);          // 반투명 부피 영역
  private readonly selectedVolumeMaterial = clayMaterial(0x6fa0ea);
  private readonly edgeMaterial = new THREE.LineBasicMaterial({ color: 0x1f2937, transparent: true, opacity: 0.5 });
  private readonly selectedEdgeMaterial = new THREE.LineBasicMaterial({ color: 0x2563eb, transparent: true, opacity: 0.95 });
  private domainBox: THREE.LineSegments | null = null;
  private readonly domainMaterial = new THREE.LineBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.9 });
  private readonly headlight = new THREE.DirectionalLight(0xffffff, 1.0);

  constructor() {
    this.group.name = 'scenery';
    const hemi = new THREE.HemisphereLight(0xffffff, 0x8a94a3, 0.95);
    hemi.position.set(0, 0, 1);
    this.headlight.position.set(-0.4, -0.6, 0.7);
    this.headlight.target.position.set(0, 0, 0);
    this.group.add(hemi, this.headlight, this.headlight.target, this.buildings);
    this.buildings.name = 'buildings';
    this.setBuildingOpacity(1); // 부피 영역 재질의 반투명 설정을 처음부터 맞춘다
  }

  /** 헤드라이트를 카메라 방향에 맞춘다 (매 프레임). 보는 방향에서 위·왼쪽으로 조금 비껴 비춘다. */
  updateHeadlight(camera: THREE.Camera, target: THREE.Vector3): void {
    const view = _v1.subVectors(target, camera.position);
    if (view.lengthSq() < 1e-12) return;
    view.normalize();
    const right = _v2.crossVectors(view, camera.up).normalize();
    const up = _v3.crossVectors(right, view);
    // 방향광은 위치→표적 방향만 쓰므로 표적은 원점, 위치는 "빛이 오는 쪽" 단위 벡터면 된다
    this.headlight.position.copy(view).negate().addScaledVector(up, 0.35).addScaledVector(right, -0.25).normalize();
  }

  /** 데이터 범위에 맞춰 지면 격자와 좌표축을 다시 만든다. */
  fitTo(bounds: Bounds): void {
    if (this.grid) { this.group.remove(this.grid); this.grid.dispose(); }
    if (this.axes) { this.group.remove(this.axes); this.axes.dispose(); }
    const sx = bounds.max[0] - bounds.min[0], sy = bounds.max[1] - bounds.min[1];
    const size = Math.max(sx, sy) * 1.3;
    const divisions = Math.max(4, Math.round(size / niceStep(size / 12)));
    this.grid = new THREE.GridHelper(size, divisions, 0x7d8a99, 0x4a5563);
    this.grid.rotation.x = Math.PI / 2; // xz 평면 → xy 평면
    this.grid.position.set((bounds.min[0] + bounds.max[0]) / 2, (bounds.min[1] + bounds.max[1]) / 2, bounds.min[2] - 0.01);
    (this.grid.material as THREE.Material).transparent = true;
    (this.grid.material as THREE.Material).opacity = 0.5;
    // 격자는 맨 먼저, 깊이 없이 그린다 — 지면 단면(깊이를 뒤로 미는 polygonOffset 사용) 위로 격자선이 비쳐 올라오지 않게
    (this.grid.material as THREE.Material).depthWrite = false;
    this.grid.renderOrder = -1;
    this.axes = new THREE.AxesHelper(Math.max(sx, sy) * 0.15);
    this.axes.position.set(bounds.min[0], bounds.min[1], bounds.min[2]);
    this.group.add(this.grid, this.axes);
    // 형상의 높이 그라데이션 기준: 데이터 바닥에서 높이의 절반까지
    for (const m of [this.buildingMaterial, this.selectedMaterial]) {
      m.uniforms.groundZ.value = bounds.min[2];
      m.uniforms.gradH.value = Math.max((bounds.max[2] - bounds.min[2]) * 0.5, 1e-6);
    }
  }

  setGridVisible(v: boolean): void {
    if (this.grid) this.grid.visible = v;
    if (this.axes) this.axes.visible = v;
  }

  /** 계산 영역(해석기 입력의 base_region) 테두리 상자. null이면 지운다 (전처리 페이지에서 쓴다) */
  setDomainBox(bounds: Bounds | null): void {
    if (this.domainBox) { this.group.remove(this.domainBox); this.domainBox.geometry.dispose(); this.domainBox = null; }
    if (!bounds) return;
    const size = [0, 1, 2].map((i) => Math.max(bounds.max[i] - bounds.min[i], 1e-9));
    const geom = new THREE.EdgesGeometry(new THREE.BoxGeometry(size[0], size[1], size[2]));
    this.domainBox = new THREE.LineSegments(geom, this.domainMaterial);
    this.domainBox.position.set((bounds.min[0] + bounds.max[0]) / 2, (bounds.min[1] + bounds.max[1]) / 2, (bounds.min[2] + bounds.max[2]) / 2);
    this.domainBox.name = 'domain-box';
    this.group.add(this.domainBox);
  }

  /** 객체 목록을 장면에 맞춘다. 있는 그룹은 자리만 고치고, 새 객체는 만들고, 사라진 객체는 지운다. */
  setObjects(objects: SceneObject[], selection: Set<string>): void {
    const seen = new Set<string>();
    for (const o of objects) {
      seen.add(o.id);
      let g = this.objectGroups.get(o.id);
      if (!g || g.userData.geometry !== o.geometry) {
        if (g) this.buildings.remove(g);
        g = new THREE.Group();
        g.userData = { id: o.id, geometry: o.geometry };
        const mesh = new THREE.Mesh(o.geometry, this.buildingMaterial);
        mesh.userData.id = o.id;
        g.add(mesh, new THREE.LineSegments(this.edgesFor(o.geometry), this.edgeMaterial));
        this.buildings.add(g);
        this.objectGroups.set(o.id, g);
      }
      g.name = o.name;
      g.position.fromArray(o.position);
      g.rotation.set(0, 0, THREE.MathUtils.degToRad(o.rotationZ));
      g.scale.fromArray(o.scale);
      g.visible = o.visible;
      const sel = selection.has(o.id);
      (g.children[0] as THREE.Mesh).material = o.translucent ? (sel ? this.selectedVolumeMaterial : this.volumeMaterial) : (sel ? this.selectedMaterial : this.buildingMaterial);
      (g.children[1] as THREE.LineSegments).material = sel ? this.selectedEdgeMaterial : this.edgeMaterial;
    }
    for (const [id, g] of this.objectGroups) {
      if (!seen.has(id)) { this.buildings.remove(g); this.objectGroups.delete(id); }
    }
  }

  groupOf(id: string): THREE.Group | null { return this.objectGroups.get(id) ?? null; }

  /** 클릭으로 고를 수 있는 메시들 (보이는 객체만) */
  pickables(): THREE.Mesh[] {
    const out: THREE.Mesh[] = [];
    for (const g of this.objectGroups.values()) if (g.visible) out.push(g.children[0] as THREE.Mesh);
    return out;
  }

  private edgesFor(geometry: THREE.BufferGeometry): THREE.EdgesGeometry {
    let e = this.edgeCache.get(geometry);
    if (!e) { e = new THREE.EdgesGeometry(geometry, 30); this.edgeCache.set(geometry, e); }
    return e;
  }

  /** 형상 전체의 경계 상자 (없으면 null) */
  shapeBounds(): THREE.Box3 | null {
    if (this.buildings.children.length === 0) return null;
    return new THREE.Box3().setFromObject(this.buildings);
  }

  setBuildingsVisible(v: boolean): void {
    this.buildings.visible = v;
  }

  setBuildingOpacity(o: number): void {
    for (const m of [this.buildingMaterial, this.selectedMaterial]) {
      m.uniforms.opacity.value = o;
      m.transparent = o < 0.999;
      m.depthWrite = o > 0.6;
      m.needsUpdate = true;
    }
    // 부피 영역은 전체 불투명도와 무관하게 늘 비친다 (최대 0.3)
    for (const m of [this.volumeMaterial, this.selectedVolumeMaterial]) {
      m.uniforms.opacity.value = Math.min(0.3, o);
      m.transparent = true;
      m.depthWrite = false;
      m.needsUpdate = true;
    }
    this.edgeMaterial.opacity = 0.5 * Math.max(o, 0.4);
  }
}

const _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3();

function niceStep(raw: number): number {
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const m = raw / p;
  return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
}

// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   scenery.ts

조명, 지면 격자, 좌표축(끝에 X·Y·Z 글자), 형상 객체(건물·몸체) 등 데이터가 아닌 장면 요소.
형상은 편집 저장소(edit/objects.ts)의 객체 목록을 그대로 그린다: 객체마다 그룹(위치·회전·배율) 안에
메시 + 외곽선. 고른 객체는 파란 색조로 강조한다.
위쪽(setUp, core/upAxis.ts): 처음은 CFD 관례대로 +Z. 지면 격자는 위쪽 축과 직각인 평면에서 그 축의 바닥에 눕고,
형상의 '윗면 밝게'·높이 그라데이션과 반구 조명도 위쪽을 따른다. 형상의 회전축(rotationZ)은 위쪽과 무관하게 데이터 Z 다.

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
import { DEFAULT_UP, UpAxis, fromZUp, horizontalAxes, upIndex, upSign, upVector } from '../core/upAxis';

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
uniform vec3 upDir;
uniform float ground;
uniform float gradH;
varying vec3 vWorldPos;
void main() {
  // 면 법선: 화면 미분의 외적은 항상 보는 쪽을 향한다 → 메시 법선 없이도 면마다 한 가지 밝기
  vec3 n = normalize(cross(dFdx(vWorldPos), dFdy(vWorldPos)));
  float d = dot(n, lightDir);
  float tone = d > 0.0 ? 0.62 + 0.38 * d : 0.62 + 0.10 * d;          // 눈에 보이는 밝기(감마 공간) 기준의 3톤
  tone *= mix(0.88, 1.0, smoothstep(0.0, gradH, dot(vWorldPos, upDir) - ground)); // 아래쪽(위쪽 축 기준)은 살짝 어둡게
  gl_FragColor = vec4(baseColor * pow(tone, 2.2), opacity);              // 선형 공간으로 옮겨 곱한다
  #include <colorspace_fragment>
}`;

/** 형상 재질의 빛이 오는 방향 (+Z 가 위일 때 · 왼쪽 위 앞). 위쪽을 바꾸면 회전표로 옮긴다 */
const CLAY_LIGHT = [-0.33, -0.5, 0.8];

/** 좌표축 끝 글자 (AxesHelper 색 빨강·초록·파랑을 어두운 배경에서 읽히게 밝힌 색) */
const AXIS_LABELS: { text: string; color: string }[] = [
  { text: 'X', color: '#f87171' }, { text: 'Y', color: '#4ade80' }, { text: 'Z', color: '#60a5fa' },
];
const AXIS_LABEL_PX = 18; // 화면에서 글자 칸 높이(CSS px, 글자는 그 70% 쯤). 확대·투영과 무관하게 이 크기로 (updateLabels)

function clayMaterial(color: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      baseColor: { value: new THREE.Color(color) },
      opacity: { value: 1 },
      lightDir: { value: new THREE.Vector3().fromArray(CLAY_LIGHT).normalize() },
      upDir: { value: new THREE.Vector3(0, 0, 1) },
      ground: { value: 0 },
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
  private readonly hemi = new THREE.HemisphereLight(0xffffff, 0x8a94a3, 0.95);
  private readonly labels: THREE.Sprite[] = [];
  private up: UpAxis = DEFAULT_UP;
  private lastBounds: Bounds | null = null; // 위쪽을 바꾸면 이 범위로 격자·좌표축을 다시 만든다

  constructor() {
    this.group.name = 'scenery';
    this.hemi.position.set(0, 0, 1);
    this.headlight.position.set(-0.4, -0.6, 0.7);
    this.headlight.target.position.set(0, 0, 0);
    this.group.add(this.hemi, this.headlight, this.headlight.target, this.buildings);
    this.buildings.name = 'buildings';
    this.setBuildingOpacity(1); // 부피 영역 재질의 반투명 설정을 처음부터 맞춘다
    for (const l of AXIS_LABELS) this.labels.push(axisLabel(l.text, l.color));
  }

  /** 위쪽 축. 반구 조명·형상 재질의 빛 방향을 옮기고, 격자·좌표축은 마지막 범위로 다시 만든다 */
  setUp(up: UpAxis): void {
    this.up = up;
    this.hemi.position.fromArray(upVector(up));
    const light = new THREE.Vector3().fromArray(fromZUp(up, CLAY_LIGHT)).normalize();
    const upDir = new THREE.Vector3().fromArray(upVector(up));
    for (const m of [this.buildingMaterial, this.selectedMaterial, this.volumeMaterial, this.selectedVolumeMaterial]) {
      m.uniforms.lightDir.value.copy(light);
      m.uniforms.upDir.value.copy(upDir);
    }
    if (this.lastBounds) this.fitTo(this.lastBounds);
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

  /**
   * 데이터 범위에 맞춰 지면 격자와 좌표축을 다시 만든다. 격자는 위쪽 축과 직각인 평면에, 그 축의 바닥(+ 위쪽이면 최솟값, - 면 최댓값)에서
   * 조금 아래로 띄운다(크기에 비례하되 0.01 m 넘지 않게 — 0.15 m 영역에서 0.01 m 는 7% 다). 크기는 수평 두 축 폭 기준.
   */
  fitTo(bounds: Bounds): void {
    this.lastBounds = { min: [...bounds.min], max: [...bounds.max] };
    if (this.grid) { this.group.remove(this.grid); this.grid.dispose(); }
    if (this.axes) { this.group.remove(this.axes); this.axes.dispose(); }
    const k = upIndex(this.up), s = upSign(this.up);
    const [h1, h2] = horizontalAxes(this.up);
    const w1 = bounds.max[h1] - bounds.min[h1], w2 = bounds.max[h2] - bounds.min[h2];
    const size = Math.max(w1, w2) * 1.3;
    const divisions = Math.max(4, Math.round(size / niceStep(size / 12)));
    this.grid = new THREE.GridHelper(size, divisions, 0x7d8a99, 0x4a5563);
    // GridHelper 는 xz 평면(법선 Y). 위쪽 축과 직각인 평면으로 눕힌다
    if (k === 2) this.grid.rotation.x = Math.PI / 2;      // xz → xy
    else if (k === 0) this.grid.rotation.z = Math.PI / 2; // xz → yz
    const lift = Math.min(0.01, size * 1e-4);
    const bottom = s > 0 ? bounds.min[k] : bounds.max[k];
    const gp = [0, 0, 0];
    gp[h1] = (bounds.min[h1] + bounds.max[h1]) / 2;
    gp[h2] = (bounds.min[h2] + bounds.max[h2]) / 2;
    gp[k] = bottom - s * lift;
    this.grid.position.fromArray(gp);
    (this.grid.material as THREE.Material).transparent = true;
    (this.grid.material as THREE.Material).opacity = 0.5;
    // 격자는 맨 먼저, 깊이 없이 그린다 — 지면 단면(깊이를 뒤로 미는 polygonOffset 사용) 위로 격자선이 비쳐 올라오지 않게
    (this.grid.material as THREE.Material).depthWrite = false;
    this.grid.renderOrder = -1;
    // 좌표축: 수평 두 축의 작은 쪽 모서리, 위쪽 축 바닥에서 시작한다. 끝에 X·Y·Z 글자
    const len = Math.max(w1, w2) * 0.15;
    const ap = [0, 0, 0];
    ap[h1] = bounds.min[h1]; ap[h2] = bounds.min[h2]; ap[k] = bottom;
    this.axes = new THREE.AxesHelper(len);
    this.axes.position.fromArray(ap);
    this.labels.forEach((l, i) => {
      l.position.set(0, 0, 0).setComponent(i, len * 1.14);
      this.axes!.add(l);
    });
    this.group.add(this.grid, this.axes);
    // 형상의 높이 그라데이션 기준: 데이터 바닥에서 높이(위쪽 축 방향)의 절반까지. 부피 영역 재질은 예전처럼 맞추지 않는다
    // (기준 0 · 폭 30 그대로 — +Z 에서 고치기 전과 같게. 빛 방향·위쪽 벡터만 setUp 이 옮긴다)
    for (const m of [this.buildingMaterial, this.selectedMaterial]) {
      m.uniforms.ground.value = s * bottom;
      m.uniforms.gradH.value = Math.max((bounds.max[k] - bounds.min[k]) * 0.5, 1e-6);
    }
  }

  /** 좌표축 글자를 화면에서 늘 같은 높이(AXIS_LABEL_PX)로 (매 프레임). heightPx = 3D 화면의 CSS 높이 */
  updateLabels(camera: THREE.Camera, heightPx: number): void {
    if (!this.axes || !this.axes.visible || heightPx <= 0) return;
    camera.updateMatrixWorld(); // 이번 프레임의 조작기 움직임까지 (matrixWorldInverse)
    for (const l of this.labels) {
      let worldPerPx: number;
      if (camera instanceof THREE.PerspectiveCamera) {
        const depth = -l.getWorldPosition(_v1).applyMatrix4(camera.matrixWorldInverse).z;
        worldPerPx = (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * Math.max(depth, 1e-9)) / heightPx;
      } else if (camera instanceof THREE.OrthographicCamera) {
        worldPerPx = (camera.top - camera.bottom) / camera.zoom / heightPx;
      } else continue;
      l.scale.setScalar(AXIS_LABEL_PX * worldPerPx);
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

/**
 * 좌표축 끝 글자 하나 (캔버스에 그린 글자를 붙인 스프라이트 — 늘 화면을 향한다). 크기는 매 프레임 updateLabels 가 정한다.
 * 깊이 검사를 끄고 늦게 그려, 축 끝이 단면·형상에 묻혀도 글자는 읽힌다.
 */
function axisLabel(text: string, color: string): THREE.Sprite {
  const px = 64;
  const canvas = document.createElement('canvas');
  canvas.width = px; canvas.height = px;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.font = `700 ${Math.round(px * 0.72)}px system-ui, -apple-system, 'Segoe UI', sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = px * 0.12;
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.85)'; // 밝은 배경·데이터 위에서도 읽히게 어두운 테두리
    ctx.strokeText(text, px / 2, px / 2 + px * 0.03);
    ctx.fillStyle = color;
    ctx.fillText(text, px / 2, px / 2 + px * 0.03);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false }));
  sprite.name = `axis-label-${text}`;
  sprite.renderOrder = 10;
  return sprite;
}

function niceStep(raw: number): number {
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const m = raw / p;
  return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
}

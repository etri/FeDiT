// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   state.ts

전처리 페이지의 상태: 고른 해석기, 입력 문서(템플릿이나 사용자가 연 JSON), 핵심 파라미터(CoreParams),
영역(STL) 목록과 3D 형상 객체의 짝. 화면(panel.ts)은 이 상태를 읽어 그리고, 바꿀 때는 여기 메서드를 부른다.

영역과 형상의 관계
- 영역 하나 = 형상 객체 하나(AppCore.objects). 3D 화면의 형상 편집(이동·회전·크기)이 그대로 영역의 기하가 된다.
- 내보낼 때 각 형상을 세계 좌표로 구워(stlBufferOf) STL로 쓰고, 영역의 scale·translate·origin은 항등값으로 둔다.
  (해석기 입력의 scale·translate로는 회전을 표현할 수 없으므로 STL 자체에 굽는 쪽이 일반적이다.)
- 형상 편집에서 객체를 지우면 영역도 빠진다. 영역이 없는 형상(상자·원기둥 추가 등)은 "영역으로 추가"로 영역이 된다.
*/
/******************************************************************************/
import { AppCore, coversBounds } from '../core/AppCore';
import { SceneObject, stlBufferOf } from '../edit/objects';
import {
  CoreParams, CoreRegion, JsonObject, RegionOrigin, SOLVER_INFO, SolverInputDoc, SolverKind, applyCore, cloneDoc, engineFor, isJsonObject,
  readCore, setRegions, solverKindOf,
} from './solverInput';
import { loadTemplate, parseSolverInput } from './templates';
import { ValidationIssue, validateInput } from './validate';
import { exportJson, exportPackageZip } from './exporter';
import { fetchLibraryStl } from './library';

export interface RegionEntry extends CoreRegion {
  objectId: string | null;    // 3D 형상 객체 (없으면 STL을 못 찾은 영역)
}

export type Vec3 = [number, number, number];

const vec3 = (v: unknown, d: Vec3): Vec3 => (Array.isArray(v) && v.length === 3 && v.every((x) => typeof x === 'number') ? [v[0], v[1], v[2]] : d);
/** 부피 표시용 영역 종류(초기 유체·자유표면·격자 세분화 상자): 벽이 아니므로 반투명으로 그린다 */
const VOLUME_TYPES = new Set(['region_ref', 'free_surface', 'subdivision_ref']);
export const isVolumeRegion = (regionType: string): boolean => VOLUME_TYPES.has(regionType);
const stemOf = (name: string) => name.replace(/\.(json|stl)$/i, '');

export class PreState {
  kind: SolverKind | null = null;
  doc: SolverInputDoc | null = null;        // 연 문서 (핵심 값은 core에, 나머지 키는 여기 그대로)
  template: SolverInputDoc | null = null;   // 같은 해석기의 템플릿 (새 영역의 기본 키 출처)
  core: CoreParams | null = null;
  regions: RegionEntry[] = [];
  fileStem = '';                            // 내보낼 파일 이름 (확장자 없이) = meta.title
  sourceName = '';                          // 무엇에서 시작했는지 (템플릿 / 연 파일 이름)
  missingStl: string[] = [];                // 문서가 가리키지만 찾지 못한 STL
  version = 0;
  docSerial = 0;                            // 새 입력(템플릿·파일)을 열 때마다 1씩 — 화면이 칸을 다시 만들 기준
  private listeners: (() => void)[] = [];
  private adoptListeners: (() => void)[] = [];

  constructor(readonly app: AppCore) {
    // 형상 편집에서 객체가 사라지면 영역도 뺀다. 이름을 바꾸면 영역 이름도 따라간다
    app.objects.subscribe(() => this.syncFromObjects());
  }

  subscribe(cb: () => void): void { this.listeners.push(cb); }
  /** 새 입력을 열었을 때만 (값을 고칠 때는 부르지 않는다) */
  onAdopt(cb: () => void): void { this.adoptListeners.push(cb); }
  private emit(): void { this.version++; for (const cb of this.listeners) cb(); }

  get engineLabel(): string { return this.doc ? (engineFor(this.doc) === 'lbm_dem' ? 'LBM_DEM (유체-입자)' : 'LBM') : ''; }

  /** 템플릿(예제 입력)으로 시작한다. 템플릿이 가리키는 STL은 내장 라이브러리에서 가져온다 */
  async startFromTemplate(kind: SolverKind): Promise<void> {
    const doc = await loadTemplate(kind);
    await this.adopt(doc, kind, `${SOLVER_INFO[kind].label} 템플릿`, stemOf(SOLVER_INFO[kind].template), new Map());
  }

  /** 사용자가 만든 입력 JSON을 연다. 함께 고른 STL이 있으면 그 이름으로 먼저 찾고, 없으면 라이브러리에서 찾는다 */
  async openJson(jsonText: string, fileName: string, stls: Map<string, Uint8Array>): Promise<void> {
    const doc = parseSolverInput(jsonText);
    const kind = solverKindOf(doc);
    await this.adopt(doc, kind, fileName, stemOf(fileName), stls);
  }

  private async adopt(doc: SolverInputDoc, kind: SolverKind | null, sourceName: string, stem: string, stls: Map<string, Uint8Array>): Promise<void> {
    this.doc = doc;
    this.kind = kind;
    this.template = kind ? await loadTemplate(kind) : null;
    this.core = readCore(doc);
    this.fileStem = stem;
    this.sourceName = sourceName;
    this.missingStl = [];
    this.app.objects.replaceAll([]);
    this.regions = [];
    this.docSerial++;
    for (const r of this.core.regions) {
      const bytes = stls.get(r.meshPath) ?? await fetchLibraryStl(r.meshPath).catch(() => null); // 내장 목록을 못 읽어도 입력은 열린다
      const entry: RegionEntry = { ...r, objectId: null };
      if (bytes) {
        const o = this.app.addStlObject(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer, r.name || stemOf(r.meshPath),
          vec3(r.extra.scale, [1, 1, 1]), vec3(r.extra.translate, [0, 0, 0]));
        this.app.objects.update(o.id, { translucent: isVolumeRegion(r.regionType) }); // 전처리에서는 모든 영역을 보여 주되 부피 영역은 반투명
        entry.objectId = o.id;
      } else {
        this.missingStl.push(r.meshPath);
      }
      this.regions.push(entry);
    }
    this.applyDomain();
    this.app.fitView('iso', 'all');
    for (const cb of this.adoptListeners) cb();
    this.emit();
  }

  /** 핵심 값을 고친다 (화면의 모든 입력이 쓴다). 계산 영역이 바뀌면 3D의 영역 상자도 맞춘다 */
  update(mutate: (core: CoreParams) => void): void {
    if (!this.core) return;
    mutate(this.core);
    this.applyDomain();
    this.emit();
  }

  private applyDomain(): void {
    if (!this.core) return;
    const { min, max } = this.core.domain;
    this.app.setDomainBox({ min: [min[0], min[1], min[2]], max: [max[0], max[1], max[2]] });
    this.syncOpacity();
  }

  /** 보이는 고체 영역이 계산 영역의 절반 넘게 덮으면(용기 벽 등) 안이 보이게 형상을 반투명으로, 아니면 불투명으로 */
  private syncOpacity(): void {
    const d = this.app.domain;
    if (!d) return;
    const enclosed = this.app.objects.list.some((o) => o.visible && !o.translucent && coversBounds(o, d));
    const want = enclosed ? 0.35 : 1;
    if (this.app.display.buildingOpacity !== want) this.app.setDisplay({ buildingOpacity: want });
  }

  /** 계산 영역의 격자 셀 수 어림 (base_dx 기준, 세분화 전) */
  cellEstimate(): number {
    if (!this.core) return 0;
    const { baseDx, min, max } = this.core.domain;
    if (!(baseDx > 0)) return 0;
    return [0, 1, 2].reduce((n, i) => n * Math.max(1, Math.round((max[i] - min[i]) / baseDx)), 1);
  }

  // ---- 영역 ----
  /** STL 바이트로 영역을 더한다 (라이브러리·올린 파일). 기본은 고정 고체(fixed) + 주 재질 */
  addRegionFromBytes(bytes: Uint8Array, fileName: string, patch: Partial<Pick<RegionEntry, 'name' | 'material' | 'regionType' | 'origin' | 'group'>> = {}): RegionEntry {
    const name = patch.name ?? stemOf(fileName);
    const o = this.app.addStlObject(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer, name);
    return this.pushRegion(o, this.uniqueMeshName(fileName.replace(/\.stl$/i, '') + '.stl'), patch);
  }

  /** 이미 있는 형상(상자·원기둥·끌어다 놓은 STL)을 영역으로 삼는다 */
  addRegionFromObject(objectId: string, patch: Partial<Pick<RegionEntry, 'name' | 'material' | 'regionType' | 'origin' | 'group'>> = {}): RegionEntry | null {
    const o = this.app.objects.byId(objectId);
    if (!o || this.regions.some((r) => r.objectId === objectId)) return null;
    // STL 파일 이름은 영문·숫자만 (ZIP·해석기 쪽 글자 집합 문제를 피한다). 한글 이름이면 region-<번호>
    const ascii = o.name.replace(/[^A-Za-z0-9_-]+/g, '');
    return this.pushRegion(o, this.uniqueMeshName(`${ascii || `region-${this.regions.length + 1}`}.stl`), patch);
  }

  private pushRegion(o: SceneObject, meshPath: string, patch: Partial<Pick<RegionEntry, 'name' | 'material' | 'regionType' | 'origin' | 'group'>>): RegionEntry {
    const mainMat = this.core?.materials.find((m) => m.isMain) ?? this.core?.materials[0];
    const entry: RegionEntry = {
      name: patch.origin === 'particle' ? '' : (patch.name ?? o.name),
      meshPath,
      material: patch.material ?? mainMat?.name ?? '',
      regionType: patch.regionType ?? 'fixed',
      origin: patch.origin ?? 'lattice',
      group: patch.group ?? 0,
      extra: {},
      objectId: o.id,
    };
    this.app.objects.update(o.id, { name: entry.name || o.name, translucent: isVolumeRegion(entry.regionType) });
    this.regions.push(entry);
    this.syncOpacity();
    this.emit();
    return entry;
  }

  updateRegion(index: number, patch: Partial<Pick<RegionEntry, 'name' | 'meshPath' | 'material' | 'regionType' | 'origin' | 'group'>>): void {
    const r = this.regions[index];
    if (!r) return;
    Object.assign(r, patch);
    if (patch.meshPath !== undefined) r.meshPath = this.uniqueMeshName(/\.stl$/i.test(r.meshPath) ? r.meshPath : `${r.meshPath}.stl`, index);
    if (patch.origin === 'particle') r.name = '';
    if (patch.name !== undefined && r.objectId) this.app.objects.update(r.objectId, { name: patch.name || this.app.objects.byId(r.objectId)!.name });
    if (patch.regionType !== undefined && r.objectId) this.app.objects.update(r.objectId, { translucent: isVolumeRegion(r.regionType) });
    this.syncOpacity();
    this.emit();
  }

  removeRegion(index: number): void {
    const r = this.regions[index];
    if (!r) return;
    this.regions.splice(index, 1);
    if (r.objectId) this.app.objects.remove([r.objectId]); // 객체 구독에서 syncFromObjects가 한 번 더 돌지만 이미 빠져 있다
    this.syncOpacity();
    this.emit();
  }

  /** 영역이 아닌 형상 (영역으로 삼을 후보) */
  unassignedObjects(): SceneObject[] {
    const used = new Set(this.regions.map((r) => r.objectId));
    return this.app.objects.list.filter((o) => !used.has(o.id));
  }

  private syncFromObjects(): void {
    let changed = false;
    const alive = new Set(this.app.objects.list.map((o) => o.id));
    for (let i = this.regions.length - 1; i >= 0; i--) {
      const r = this.regions[i];
      if (r.objectId && !alive.has(r.objectId)) { this.regions.splice(i, 1); changed = true; continue; }
      const o = r.objectId ? this.app.objects.byId(r.objectId) : undefined;
      if (o && r.origin === 'lattice' && r.name !== o.name) { r.name = o.name; changed = true; }
    }
    if (changed) this.emit();
  }

  private uniqueMeshName(name: string, keepIndex = -1): string {
    const taken = new Set(this.regions.filter((_, i) => i !== keepIndex).map((r) => r.meshPath));
    if (!taken.has(name)) return name;
    const stem = name.replace(/\.stl$/i, '');
    for (let n = 2; ; n++) if (!taken.has(`${stem}-${n}.stl`)) return `${stem}-${n}.stl`;
  }

  /** 입자 설정(particle_generation)의 그룹 수. 0이면 입자 영역을 둘 수 없다 */
  particleGroups(): number {
    const g = this.doc?.config.particle_generation;
    return Array.isArray(g) ? g.length : 0;
  }

  // ---- 내보내기 ----
  /** 영역을 내보낼 모양으로: 형상이 있는 영역은 STL을 세계 좌표로 굽고 scale·translate·origin은 항등값 */
  private exportRegions(): CoreRegion[] {
    return this.regions.map((r) => {
      const { objectId, ...core } = r;
      if (!objectId) return core;
      const extra: JsonObject = { ...core.extra };
      if ('scale' in extra || this.template) extra.scale = [1, 1, 1];
      if ('translate' in extra || this.template) extra.translate = [0, 0, 0];
      if ('origin' in extra) extra.origin = [0, 0, 0];
      return { ...core, extra };
    });
  }

  /** 내보낼 STL 파일들 (형상이 있는 영역마다 하나) */
  exportFiles(): { name: string; bytes: Uint8Array }[] {
    const out: { name: string; bytes: Uint8Array }[] = [];
    for (const r of this.regions) {
      const o = r.objectId ? this.app.objects.byId(r.objectId) : undefined;
      if (!o) continue;
      out.push({ name: r.meshPath, bytes: new Uint8Array(stlBufferOf([o], `${r.meshPath} (union-twin-cfd pre)`)) });
    }
    return out;
  }

  /** 지금 값으로 만든 입력 문서. 핵심 값을 쓰고(applyCore) 새 영역의 기본 키를 채운다(setRegions) */
  buildDoc(): SolverInputDoc {
    if (!this.doc || !this.core) throw new Error('먼저 해석기를 고르거나 입력 JSON을 여세요.');
    const regions = this.exportRegions();
    const withCore = applyCore(this.doc, { ...this.core, regions });
    const doc = setRegions(withCore, regions, this.template ?? undefined);
    doc.meta = { ...doc.meta, title: this.fileStem || doc.meta.title };
    return doc;
  }

  validate(): ValidationIssue[] {
    try {
      const issues = validateInput(this.buildDoc(), this.exportFiles().map((f) => f.name), undefined, this.fileStem || undefined);
      for (const r of this.regions) if (!r.objectId) issues.unshift({ level: 'error', message: `영역 '${r.name || r.meshPath}'의 STL(${r.meshPath})이 없습니다. 라이브러리에서 고르거나 STL을 올려 영역을 다시 만드세요.`, path: 'regions' });
      return issues;
    } catch (e) {
      return [{ level: 'error', message: (e as Error).message }];
    }
  }

  exportJsonText(): { fileName: string; text: string } { return exportJson(this.buildDoc(), this.fileStem || 'input'); }

  exportZipBlob(): { fileName: string; blob: Blob } {
    const stem = this.fileStem || 'input';
    return { fileName: `${stem}.zip`, blob: exportPackageZip(this.buildDoc(), stem, this.exportFiles()) };
  }

  /** 해석기별 설정 블록·바깥 경계의 추가 키처럼 모양이 열린 객체를 화면에서 고칠 때 쓴다 */
  static isPlain(v: unknown): v is JsonObject { return isJsonObject(v); }
  static clone<T>(v: T): T { return cloneDoc(v); }
  static originLabel(o: RegionOrigin, group: number): string { return o === 'lattice' ? '격자 영역' : `입자 그룹 ${group + 1}`; }
}

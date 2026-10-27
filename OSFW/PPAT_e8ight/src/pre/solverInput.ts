// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   solverInput.ts

전처리 페이지가 쓰는 '해석기 입력 JSON'의 자료형과 핵심 파라미터 읽기·쓰기.
해석기(자사 LBM·LBM_DEM)는 입력 JSON 하나와 JSON이 가리키는 STL을 읽는다(modeling_simulation_engines/doc/input_json.md).
- SolverInputDoc: JSON 전체. 모르는 키는 건드리지 않고 그대로 보존한다(pass-through).
- CoreParams: 화면에서 고치는 핵심 값만 모은 보기(계산 영역·시간·중력·초기값·재질·바깥 경계·STL 영역·해석기 설정).
  readCore로 뽑고 applyCore로 되돌려 쓰면, 값을 안 바꿨을 때 원본과 깊은 비교가 같다(키 순서도 유지).
- setRegions: STL 영역 목록(lattice_generation[0]과 particle_generation[*]의 regional_segment)을 바꾼다.
- engineFor: 실행 파일 판별(입자 설정이 있으면 lbm_dem). solverKindOf: 다섯 해석기 중 어느 것인지.
*/
/******************************************************************************/
import type { Vec3 } from '../edit/objects';

export type { Vec3 };
export type JsonObject = Record<string, unknown>;

export type SolverKind = 'multi_component' | 'multiphase' | 'concentration_diffusion' | 'thermal' | 'fluid_dem';
export type EngineKind = 'lbm' | 'lbm_dem';

export interface SolverInfo {
  label: string;              // 한국어 이름
  description: string;        // 일반인용 한 문장
  engine: EngineKind;         // 실행 파일
  solverType: string;         // JSON의 solver_common.solver_type 값
  template: string;           // public/templates/ 안의 파일 이름
  settingsKey: string | null; // 해석기별 설정 블록(config 바로 아래 키). 유체-DEM은 *_settings 블록이 없다
}

export const SOLVER_INFO: Record<SolverKind, SolverInfo> = {
  multi_component: {
    label: '다성분',
    description: '밀도가 다른 두 유체가 맞닿아 섞이거나 경계면이 움직이는 흐름을 계산합니다.',
    engine: 'lbm', solverType: 'Multi_component', template: 'multi_component.json', settingsKey: 'multi_component_settings',
  },
  multiphase: {
    label: '다상',
    description: '액체와 기체가 함께 있는 흐름을 계산합니다.',
    engine: 'lbm', solverType: 'multiphase', template: 'multiphase.json', settingsKey: 'multiphase_settings',
  },
  concentration_diffusion: {
    label: '농도확산',
    description: '흐르는 유체 안에서 녹은 물질의 농도가 퍼지는 과정을 계산합니다.',
    engine: 'lbm', solverType: 'concentration_diffusion', template: 'concentration_diffusion.json', settingsKey: 'concentration_diffusion_settings',
  },
  thermal: {
    label: '복합 열전달',
    description: '고체 안의 열전도와 유체의 열 흐름을 함께 계산합니다.',
    engine: 'lbm', solverType: 'thermal', template: 'thermal.json', settingsKey: 'thermal_settings',
  },
  fluid_dem: {
    label: '유체-입자 (DEM)',
    description: '물의 흐름과 그 안에서 밀려 움직이는 알갱이 입자를 함께 계산합니다.',
    engine: 'lbm_dem', solverType: 'free_surface', template: 'fluid_dem.json', settingsKey: null,
  },
};

export const SOLVER_KINDS = Object.keys(SOLVER_INFO) as SolverKind[];

/** 입력 JSON 전체. meta·config의 알려진 키 외에는 모두 pass-through */
export interface SolverInputDoc {
  meta: { version: number; title: string; [key: string]: unknown };
  config: JsonObject;
}

// ---------------------------------------------------------------------------
// 공통 도우미
// ---------------------------------------------------------------------------
export const isJsonObject = (v: unknown): v is JsonObject => typeof v === 'object' && v !== null && !Array.isArray(v);
const obj = (v: unknown): JsonObject => (isJsonObject(v) ? v : {});
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const num = (v: unknown, d = 0): number => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const str = (v: unknown, d = ''): string => (typeof v === 'string' ? v : d);
const vec3 = (v: unknown, d: Vec3): Vec3 =>
  (Array.isArray(v) && v.length === 3 && v.every((x) => typeof x === 'number') ? [v[0], v[1], v[2]] : [...d]);

/** JSON 값의 깊은 복사 (입력 JSON은 순수 데이터이므로 JSON 왕복으로 충분하다) */
export function cloneDoc<T>(v: T): T {
  return v === undefined ? v : (JSON.parse(JSON.stringify(v)) as T);
}

/** original의 키 순서를 지키며 fields로 다시 만든다. fields에 없는 키는 버리고, 새 키는 뒤에 붙인다. */
function rebuild(original: unknown, fields: JsonObject): JsonObject {
  const out: JsonObject = {};
  for (const k of Object.keys(obj(original))) if (k in fields && fields[k] !== undefined) out[k] = fields[k];
  for (const [k, v] of Object.entries(fields)) if (!(k in out) && v !== undefined) out[k] = v;
  return out;
}

function ensureObj(parent: JsonObject, key: string): JsonObject {
  if (!isJsonObject(parent[key])) parent[key] = {};
  return parent[key] as JsonObject;
}
function ensureArr(parent: JsonObject, key: string): unknown[] {
  if (!Array.isArray(parent[key])) parent[key] = [];
  return parent[key] as unknown[];
}

// ---------------------------------------------------------------------------
// 해석기 종류 · 실행 파일
// ---------------------------------------------------------------------------
/** 입자 설정(particle_generation) 유무. run_case.sh와 같은 기준 */
export const hasParticles = (doc: SolverInputDoc): boolean => doc.config.particle_generation !== undefined;

/** 실행 파일: 입자 설정이 있으면 lbm_dem, 없으면 lbm */
export function engineFor(doc: SolverInputDoc): EngineKind {
  return hasParticles(doc) ? 'lbm_dem' : 'lbm';
}

/** solver_common.solver_type(대소문자 무시)과 입자 설정으로 해석기 종류를 정한다. 다섯 종류에 없으면 null */
export function solverKindOf(doc: SolverInputDoc): SolverKind | null {
  const st = str(obj(doc.config.solver_common).solver_type).toLowerCase();
  if (st === 'free_surface') return hasParticles(doc) ? 'fluid_dem' : null;
  for (const kind of SOLVER_KINDS) if (kind !== 'fluid_dem' && SOLVER_INFO[kind].solverType.toLowerCase() === st) return kind;
  return null;
}

// ---------------------------------------------------------------------------
// 핵심 파라미터 보기
// ---------------------------------------------------------------------------
export type BoundaryFace = 'xmin' | 'xmax' | 'ymin' | 'ymax' | 'zmin' | 'zmax';
export const BOUNDARY_FACES: readonly BoundaryFace[] = ['xmin', 'xmax', 'ymin', 'ymax', 'zmin', 'zmax'];

export interface CoreMaterial {
  name: string;
  phase: string;                  // gas | liquid | solid
  isMain: boolean | undefined;    // is_main_material. 원본에 키가 없으면 undefined(쓸 때도 만들지 않는다)
  props: Record<string, number>;  // density·dynamic_viscosity 같은 숫자 물성을 키 그대로
  extra: JsonObject;              // 숫자가 아닌 나머지 키(재질과 함께 움직인다)
}

export interface CoreBoundary {
  type: string;        // wall | periodic | inlet | outflow_neumann ...
  extra: JsonObject;   // scheme·velocity·temperature 등 type 외의 키 전부
}

export type RegionOrigin = 'lattice' | 'particle';

export interface CoreRegion {
  name: string;          // 없는 영역(05의 입자 영역)은 ''. 쓸 때 ''이면 name 키를 만들지 않는다
  meshPath: string;      // STL 파일 이름 (실행 폴더 기준)
  material: string;      // materials의 이름
  regionType: string;    // region_ref | fixed | cht | subdivision_ref | free_surface
  origin: RegionOrigin;  // lattice: lattice_generation[0].regional_segment / particle: particle_generation[group].regional_segment
  group: number;         // particle이면 particle_generation의 번호, lattice면 0
  extra: JsonObject;     // 위 네 키를 뺀 나머지(invert_normal·origin·scale·translate·boundary·initial_condition_id·local_source_term_id 등)
}

export interface CoreParams {
  domain: { baseDx: number; min: Vec3; max: Vec3 };
  time: { endTime: number; timeStep: number; saveStart: number; saveEnd: number; saveInterval: number };
  gravity: Vec3;
  initial: { pressure: number; velocity: Vec3 };
  materials: CoreMaterial[];
  boundaries: Record<BoundaryFace, CoreBoundary>;
  regions: CoreRegion[];
  solverSettings: JsonObject;  // 해석기별 *_settings 블록 그대로 (유체-DEM은 {})
}

const MATERIAL_FIXED = new Set(['name', 'phase', 'is_main_material']);
const REGION_FIXED = new Set(['name', 'mesh_path', 'material', 'region_type']);

/** 주 초기조건의 번호(is_main_initial_condition이 true인 것, 없으면 0) */
function mainInitialIndex(list: unknown[]): number {
  const i = list.findIndex((e) => isJsonObject(e) && e.is_main_initial_condition === true);
  return i >= 0 ? i : 0;
}

interface RawRegion { origin: RegionOrigin; group: number; raw: JsonObject }

/** 문서의 STL 영역 객체를 원래 자리 정보와 함께 나열한다 */
function listRawRegions(c: JsonObject): RawRegion[] {
  const out: RawRegion[] = [];
  for (const s of arr(obj(arr(c.lattice_generation)[0]).regional_segment)) if (isJsonObject(s)) out.push({ origin: 'lattice', group: 0, raw: s });
  arr(c.particle_generation).forEach((g, gi) => {
    for (const s of arr(obj(g).regional_segment)) if (isJsonObject(s)) out.push({ origin: 'particle', group: gi, raw: s });
  });
  return out;
}

function readRegion({ origin, group, raw }: RawRegion): CoreRegion {
  const extra: JsonObject = {};
  for (const [k, v] of Object.entries(raw)) if (!REGION_FIXED.has(k)) extra[k] = cloneDoc(v);
  return { name: str(raw.name), meshPath: str(raw.mesh_path), material: str(raw.material), regionType: str(raw.region_type), origin, group, extra };
}

function readMaterial(m: unknown): CoreMaterial {
  const o = obj(m);
  const props: Record<string, number> = {};
  const extra: JsonObject = {};
  for (const [k, v] of Object.entries(o)) {
    if (MATERIAL_FIXED.has(k)) continue;
    if (typeof v === 'number') props[k] = v;
    else extra[k] = cloneDoc(v);
  }
  const isMain = 'is_main_material' in o ? o.is_main_material === true : undefined;
  return { name: str(o.name), phase: str(o.phase), isMain, props, extra };
}

/** 문서에서 핵심 파라미터를 뽑는다. 돌려주는 값은 문서와 참조를 공유하지 않는다 */
export function readCore(doc: SolverInputDoc): CoreParams {
  const c = doc.config;
  const common = obj(c.solver_common);
  const report = obj(c.result_report);
  const lat = obj(arr(c.lattice_generation)[0]);
  const region = obj(lat.base_region);
  const inits = arr(c.initial_conditions);
  const init = obj(inits[mainInitialIndex(inits)]);
  const bc = obj(c.outer_boundary_condition);
  const kind = solverKindOf(doc);
  const settingsKey = kind ? SOLVER_INFO[kind].settingsKey : null;

  const boundaries = {} as Record<BoundaryFace, CoreBoundary>;
  for (const face of BOUNDARY_FACES) {
    const { type, ...extra } = obj(bc[face]);
    boundaries[face] = { type: str(type), extra: cloneDoc(extra) };
  }

  return {
    domain: { baseDx: num(lat.base_dx, 1), min: vec3(region.min, [0, 0, 0]), max: vec3(region.max, [1, 1, 1]) },
    time: {
      endTime: num(common.simulation_end_time), timeStep: num(common.time_step, 1),
      saveStart: num(report.save_start_time), saveEnd: num(report.save_end_time), saveInterval: num(report.save_time_interval),
    },
    gravity: vec3(obj(c.source_terms).gravity, [0, 0, 0]),
    initial: { pressure: num(init.pressure), velocity: vec3(init.velocity, [0, 0, 0]) },
    materials: arr(c.materials).map(readMaterial),
    boundaries,
    regions: listRawRegions(c).map(readRegion),
    solverSettings: settingsKey ? cloneDoc(obj(c[settingsKey])) : {},
  };
}

/** 영역 하나를 JSON 객체 필드로 (name은 비어 있으면 만들지 않는다) */
function regionFields(r: CoreRegion): JsonObject {
  const f: JsonObject = {};
  if (r.name) f.name = r.name;
  f.mesh_path = r.meshPath;
  f.material = r.material;
  f.region_type = r.regionType;
  return { ...f, ...r.extra };
}

/**
 * 영역 목록을 문서의 자리(lattice_generation[0] / particle_generation[group])에 써 넣는다.
 * finish가 영역 하나를 JSON 객체로 만든다(old는 같은 자리에 있던 옛 객체, 키 순서용).
 */
function writeRegions(c: JsonObject, regions: CoreRegion[], finish: (r: CoreRegion, old: unknown) => JsonObject): void {
  const latRegions = regions.filter((r) => r.origin === 'lattice');
  const lats = arr(c.lattice_generation);
  if (latRegions.length || isJsonObject(lats[0])) {
    if (!Array.isArray(c.lattice_generation)) c.lattice_generation = lats;
    if (!isJsonObject(lats[0])) lats[0] = {};
    const lat = lats[0] as JsonObject;
    const old = arr(lat.regional_segment);
    if (latRegions.length || lat.regional_segment !== undefined) lat.regional_segment = latRegions.map((r, i) => finish(r, old[i]));
  }

  const partRegions = regions.filter((r) => r.origin === 'particle');
  const groups = arr(c.particle_generation);
  const orphan = partRegions.find((r) => !isJsonObject(groups[r.group]));
  if (orphan) throw new Error(`입자 영역 '${orphan.meshPath}'이 가리키는 particle_generation 번호 ${orphan.group}이 문서에 없습니다.`);
  groups.forEach((g, gi) => {
    if (!isJsonObject(g)) return;
    const mine = partRegions.filter((r) => r.group === gi);
    const old = arr(g.regional_segment);
    if (mine.length || g.regional_segment !== undefined) g.regional_segment = mine.map((r, i) => finish(r, old[i]));
  });
}

/** 문서를 복사해 핵심 값만 덮어쓴다. 나머지 키와 키 순서는 그대로 */
export function applyCore(doc: SolverInputDoc, core: CoreParams): SolverInputDoc {
  const out = cloneDoc(doc);
  const c = out.config;

  const common = ensureObj(c, 'solver_common');
  common.simulation_end_time = core.time.endTime;
  common.time_step = core.time.timeStep;
  const report = ensureObj(c, 'result_report');
  report.save_start_time = core.time.saveStart;
  report.save_end_time = core.time.saveEnd;
  report.save_time_interval = core.time.saveInterval;

  ensureObj(c, 'source_terms').gravity = [...core.gravity];

  const inits = ensureArr(c, 'initial_conditions');
  const ii = mainInitialIndex(inits);
  if (!isJsonObject(inits[ii])) inits[ii] = { is_main_initial_condition: true };
  const init = inits[ii] as JsonObject;
  init.pressure = core.initial.pressure;
  init.velocity = [...core.initial.velocity];

  const oldMats = arr(c.materials);
  c.materials = core.materials.map((m, i) => {
    const fields: JsonObject = { name: m.name };
    if (m.isMain !== undefined) fields.is_main_material = m.isMain;
    fields.phase = m.phase;
    Object.assign(fields, cloneDoc(m.extra), m.props);
    return rebuild(oldMats[i], fields); // 같은 자리의 옛 객체는 키 순서에만 쓴다
  });

  const bc = ensureObj(c, 'outer_boundary_condition');
  for (const face of BOUNDARY_FACES) {
    const b = core.boundaries[face];
    if (!b) continue;
    const old = bc[face];
    if (!isJsonObject(old) && !b.type && Object.keys(b.extra).length === 0) continue; // 원래 없던 면은 만들지 않는다
    // type 키는 원래 있었거나 값이 비어 있지 않을 때만 쓴다(없던 키를 ''로 만들지 않는다)
    const fields: JsonObject = b.type || (isJsonObject(old) && 'type' in old) ? { type: b.type, ...cloneDoc(b.extra) } : cloneDoc(b.extra);
    bc[face] = rebuild(old, fields);
  }

  const lats = ensureArr(c, 'lattice_generation');
  if (!isJsonObject(lats[0])) lats[0] = {};
  const lat = lats[0] as JsonObject;
  lat.base_dx = core.domain.baseDx;
  lat.base_region = { ...obj(lat.base_region), min: [...core.domain.min], max: [...core.domain.max] };

  writeRegions(c, core.regions, (r, old) => rebuild(old, regionFields(r)));

  const kind = solverKindOf(out);
  const key = kind ? SOLVER_INFO[kind].settingsKey : null;
  if (key) c[key] = rebuild(c[key], cloneDoc(core.solverSettings));

  return out;
}

// ---------------------------------------------------------------------------
// 영역 관리
// ---------------------------------------------------------------------------
/** 문서 예시(doc/input_json.md)의 기본 키. 본보기 영역이 없을 때만 쓴다 */
const BUILTIN_REGION_DEFAULTS: Record<RegionOrigin, () => JsonObject> = {
  lattice: () => ({ invert_normal: false, origin: [0, 0, 0], scale: [1, 1, 1], translate: [0, 0, 0], boundary: [] }),
  particle: () => ({ boundary: [] }),
};
// 영역 종류에 따라 있고 없고가 갈리는 번호 키(04의 cht에는 initial_condition_id가 있고 subdivision_ref에는 없다).
// 같은 region_type의 본보기에서만 복사한다. lattice 쪽 region_ref는 복사하지 않고 아래 규칙(0)으로 넣는다
// (02 템플릿의 region_ref는 initial_condition_id 1이라, 다른 문서에 그대로 옮기면 없는 초기조건을 가리킬 수 있다).
const REGION_ID_KEYS = new Set(['initial_condition_id', 'local_source_term_id']);

/** 새 영역의 본보기: 같은 자리(origin)·같은 region_type인 영역을 먼저, 없으면 같은 자리의 첫 영역 */
function sampleRegion(docs: (SolverInputDoc | undefined)[], origin: RegionOrigin, regionType: string): JsonObject | null {
  let fallback: JsonObject | null = null;
  for (const d of docs) {
    if (!d) continue;
    for (const r of listRawRegions(d.config)) {
      if (r.origin !== origin) continue;
      if (r.raw.region_type === regionType) return r.raw;
      fallback ??= r.raw;
    }
  }
  return fallback;
}

/** 0 소스 하나 (복합 열전달은 열원도 0) */
function zeroSource(kind: SolverKind | null): JsonObject {
  return kind === 'thermal' ? { momentum_source: [0, 0, 0], heat_source: 0 } : { momentum_source: [0, 0, 0] };
}

/**
 * STL 영역 목록을 바꾼 문서 사본을 돌려준다.
 * - 새 영역의 기본 키는 template(같은 해석기의 템플릿)의 영역, 없으면 문서 자신의 영역, 그마저 없으면 문서 예시에서 가져온다.
 *   region의 extra에 이미 있는 키가 우선이다. 같은 region_type의 본보기면 번호 키(initial_condition_id 등)도 함께 복사한다.
 * - lattice 쪽 region_ref 영역에는 initial_condition_id 0·local_source_term_id 0을 넣고, local_source_terms가 없으면 0 소스 하나를 만든다
 *   (입자 쪽 region_ref는 05 예제처럼 번호 없이 둔다).
 * - 기존 영역은 제 키 순서를 지키고, 새 영역만 본보기의 키 순서를 따른다.
 */
export function setRegions(doc: SolverInputDoc, regions: CoreRegion[], template?: SolverInputDoc): SolverInputDoc {
  const out = cloneDoc(doc);
  const kind = solverKindOf(out);
  const sources = [template, doc];
  let needSource = false;

  writeRegions(out.config, regions, (r, old) => {
    const sample = sampleRegion(sources, r.origin, r.regionType);
    const latticeRef = r.origin === 'lattice' && r.regionType === 'region_ref';
    const defaults: JsonObject = {};
    if (sample) {
      const copyIds = sample.region_type === r.regionType && !latticeRef;
      for (const [k, v] of Object.entries(sample)) {
        if (REGION_FIXED.has(k) || (REGION_ID_KEYS.has(k) && !copyIds)) continue;
        defaults[k] = cloneDoc(v);
      }
    } else Object.assign(defaults, BUILTIN_REGION_DEFAULTS[r.origin]());
    const fields = regionFields({ ...r, extra: { ...defaults, ...r.extra } });
    if (latticeRef) {
      fields.initial_condition_id ??= 0;
      fields.local_source_term_id ??= 0;
      needSource = true;
    }
    return rebuild(isJsonObject(old) ? old : sample, fields);
  });

  if (needSource && arr(out.config.local_source_terms).length === 0) out.config.local_source_terms = [zeroSource(kind)];
  return out;
}

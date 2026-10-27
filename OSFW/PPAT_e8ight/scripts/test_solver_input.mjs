// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
// 해석기 입력 JSON 모듈(src/pre) 시험. Node로 돌린다:
//   node scripts/test_solver_input.mjs
// TS는 esbuild(vite의 의존성)로 메모리에서 묶어 data: URL로 불러온다. 파일을 만들지 않는다.
// 예제 폴더(1세부 해석엔진 examples)는 ENGINE_EXAMPLES 환경 변수로 꼭 알려 준다:
//   ENGINE_EXAMPLES=<FeDiT 저장소>/OPFW/modeling_simulation_engines/examples node scripts/test_solver_input.mjs
import * as esbuild from 'esbuild';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXAMPLES = process.env.ENGINE_EXAMPLES;
if (!EXAMPLES) {
  console.error('ENGINE_EXAMPLES 환경 변수에 1세부 해석엔진 examples 폴더 경로를 적으세요.');
  process.exit(2);
}

const built = await esbuild.build({
  entryPoints: [path.join(ROOT, 'src/pre/index.ts')],
  bundle: true, format: 'esm', platform: 'node', write: false, logLevel: 'silent',
});
const pre = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString('base64')}`);
const { SOLVER_INFO, parseTemplate, readCore, applyCore, setRegions, validateInput, engineFor, solverKindOf, exportJson } = pre;

let pass = 0, fail = 0;
function check(name, fn) {
  try { fn(); pass++; console.log(`  ok   ${name}`); }
  catch (e) { fail++; console.log(`  FAIL ${name}\n       ${String(e.message ?? e).split('\n').slice(0, 6).join('\n       ')}`); }
}

// 예제 12개 (폴더 이름 → 기대하는 해석기 종류)
const KIND_BY_DIR = {
  '01_multi_component': 'multi_component', '02_multiphase': 'multiphase', '03_concentration_diffusion': 'concentration_diffusion',
  '04_conjugate_heat_transfer': 'thermal', '05_fluid_dem': 'fluid_dem',
};
const examples = [];
for (const dir of Object.keys(KIND_BY_DIR)) {
  const base = path.join(EXAMPLES, dir);
  for (const sub of ['', 'variants']) {
    const d = path.join(base, sub);
    if (!fs.existsSync(d)) continue;
    for (const f of fs.readdirSync(d).filter((n) => n.endsWith('.json')).sort()) examples.push({ dir, file: path.join(d, f), name: f });
  }
}
// 2026-10-07 기준 13개: 폴더별 원래 길이 5 + 짧은 실행 4 + 03의 variants 4
console.log(`예제 ${examples.length}개 (${EXAMPLES})`);
assert.ok(examples.length >= 12, `예제 JSON이 12개 이상이어야 한다 (지금 ${examples.length}개)`);

// 바뀐 잎(leaf) 경로를 센다 (값을 바꾼 뒤 그 자리만 달라졌는지 확인용)
function changedLeaves(a, b, p = '') {
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return [p];
    return a.flatMap((x, i) => changedLeaves(x, b[i], `${p}[${i}]`));
  }
  if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    return [...keys].flatMap((k) => changedLeaves(a[k], b[k], p ? `${p}.${k}` : k));
  }
  return Object.is(a, b) ? [] : [p];
}

console.log('\n[1] readCore -> applyCore 왕복 (값을 안 바꿨을 때 원본과 같은가)');
const docs = new Map();
for (const ex of examples) {
  const text = fs.readFileSync(ex.file, 'utf8');
  const original = JSON.parse(text);
  const doc = parseTemplate(text);
  docs.set(ex.name, doc);
  check(`${ex.name}: 깊은 비교 같음`, () => {
    const core = readCore(doc);
    const back = applyCore(doc, core);
    assert.deepStrictEqual(back, original);
    assert.deepStrictEqual(doc, original, 'applyCore가 입력 문서를 바꾸면 안 된다');
  });
  check(`${ex.name}: 키 순서까지 같음`, () => {
    assert.equal(JSON.stringify(applyCore(doc, readCore(doc))), JSON.stringify(original));
  });
  check(`${ex.name}: readCore 결과가 문서와 참조를 공유하지 않음`, () => {
    const core = readCore(doc);
    core.regions.forEach((r) => { r.extra.__touched = 1; });
    for (const face of Object.keys(core.boundaries)) core.boundaries[face].extra.__touched = 1;
    core.solverSettings.__touched = 1;
    assert.deepStrictEqual(doc, original);
  });
}

console.log('\n[2] 값을 하나 바꾸면 그 자리만 바뀌는가');
for (const name of ['01_multi_component.json', '04_conjugate_heat_transfer.json', '05_fluid_dem.json']) {
  const doc = docs.get(name);
  check(`${name}: time.endTime`, () => {
    const core = readCore(doc);
    core.time.endTime = 12345;
    const changed = changedLeaves(doc, applyCore(doc, core));
    assert.deepStrictEqual(changed, ['config.solver_common.simulation_end_time']);
  });
  check(`${name}: materials[0].props.density + boundaries.xmin.type`, () => {
    const core = readCore(doc);
    core.materials[0].props.density += 1;
    core.boundaries.xmin.type = core.boundaries.xmin.type === 'wall' ? 'periodic' : 'wall';
    const changed = changedLeaves(doc, applyCore(doc, core)).sort();
    assert.deepStrictEqual(changed, ['config.materials[0].density', 'config.outer_boundary_condition.xmin.type']);
  });
}
check('05_fluid_dem: 입자 영역의 STL 이름을 바꾸면 particle_generation[1] 자리만 바뀜', () => {
  const doc = docs.get('05_fluid_dem.json');
  const core = readCore(doc);
  const r = core.regions.find((x) => x.origin === 'particle' && x.group === 1);
  r.meshPath = 'granular2.stl';
  assert.deepStrictEqual(changedLeaves(doc, applyCore(doc, core)), ['config.particle_generation[1].regional_segment[0].mesh_path']);
});
check('재질 순서를 바꿔도 숫자가 아닌 키(note)가 제 재질을 따라감', () => {
  const d = structuredClone(docs.get('01_multi_component.json'));
  d.config.materials[0].note = 'from-material-0';
  d.config.materials[1].tags = ['a', 'b'];
  const core = readCore(d);
  assert.deepStrictEqual(core.materials[0].extra, { note: 'from-material-0' });
  [core.materials[0], core.materials[1]] = [core.materials[1], core.materials[0]];
  const mats = applyCore(d, core).config.materials;
  const [m0, m1, m2] = d.config.materials;
  assert.deepStrictEqual(mats.map((m) => [m.name, m.note, m.tags]), [[m1.name, undefined, ['a', 'b']], [m0.name, 'from-material-0', undefined], [m2.name, undefined, undefined]]);
  assert.deepStrictEqual(mats[1], { ...d.config.materials[0] }, '값 전체가 함께 옮겨간다');
  assert.deepStrictEqual(applyCore(d, readCore(d)), d, '안 바꾸면 그대로');
});
check('원본에 없던 키(xmin.type, is_main_material)를 왕복이 만들어 내지 않음', () => {
  const d = structuredClone(docs.get('05_fluid_dem.json'));
  delete d.config.outer_boundary_condition.xmin.type;
  delete d.config.materials[1].is_main_material;
  const core = readCore(d);
  assert.equal(core.boundaries.xmin.type, '');
  assert.equal(core.materials[1].isMain, undefined);
  assert.equal(core.materials[0].isMain, true);
  const back = applyCore(d, core);
  assert.deepStrictEqual(back, d);
  assert.equal(JSON.stringify(back), JSON.stringify(d));
  core.materials[1].isMain = false;
  assert.deepStrictEqual(changedLeaves(d, applyCore(d, core)), ['config.materials[1].is_main_material'], '값을 주면 그때 만든다');
});

console.log('\n[3] 해석기 종류 · 실행 파일');
for (const ex of examples) {
  const doc = docs.get(ex.name);
  check(`${ex.name}: solverKindOf=${KIND_BY_DIR[ex.dir]} / engineFor=${SOLVER_INFO[KIND_BY_DIR[ex.dir]].engine}`, () => {
    assert.equal(solverKindOf(doc), KIND_BY_DIR[ex.dir]);
    assert.equal(engineFor(doc), ex.dir === '05_fluid_dem' ? 'lbm_dem' : 'lbm');
    assert.equal(doc.config.solver_common.solver_type, SOLVER_INFO[KIND_BY_DIR[ex.dir]].solverType);
  });
}

console.log('\n[4] 템플릿 복사본이 예제 원본과 바이트까지 같은가');
for (const [kind, info] of Object.entries(SOLVER_INFO)) {
  check(`public/templates/${info.template}`, () => {
    const dir = Object.keys(KIND_BY_DIR).find((d) => KIND_BY_DIR[d] === kind);
    const src = fs.readFileSync(path.join(EXAMPLES, dir, `${dir}.json`));
    const dst = fs.readFileSync(path.join(ROOT, 'public/templates', info.template));
    assert.ok(src.equals(dst), '내용이 다르다');
    assert.equal(parseTemplate(dst.toString('utf8')).meta.version, JSON.parse(src.toString('utf8')).meta.version);
  });
}

console.log('\n[5] validateInput');
const d05 = docs.get('05_fluid_dem.json');
const STL05 = ['water.stl', 'wall.stl', 'granular.stl'];
const errorsOf = (issues) => issues.filter((i) => i.level === 'error');
check('05 + STL 3개: 오류 0', () => {
  const issues = validateInput(d05, STL05, 'case_001');
  assert.deepStrictEqual(errorsOf(issues), []);
  console.log(`       경고 ${issues.length}건: ${issues.map((i) => i.message).join(' | ') || '없음'}`);
});
check('05에서 wall.stl을 빼면 오류', () => {
  const errs = errorsOf(validateInput(d05, ['water.stl', 'granular.stl']));
  assert.equal(errs.length, 1);
  assert.match(errs[0].message, /wall\.stl/);
  assert.equal(errs[0].path, 'config.particle_generation[0].regional_segment[0].mesh_path');
});
check('대소문자가 다르면(Wall.stl) 오류', () => {
  assert.equal(errorsOf(validateInput(d05, ['water.stl', 'Wall.stl', 'granular.stl'])).length, 1);
});
check('job_id 형식', () => {
  assert.equal(errorsOf(validateInput(d05, STL05, 'ok_ID-1')).length, 0);
  assert.equal(errorsOf(validateInput(d05, STL05, 'bad id')).length, 1);
  assert.equal(errorsOf(validateInput(d05, STL05, 'a'.repeat(65))).length, 1);
  assert.equal(errorsOf(validateInput(d05, STL05, '')).length, 1);
});
check('meta.title 경로 문자 · 파일 이름 안내', () => {
  const bad = structuredClone(d05); bad.meta.title = '../x';
  assert.equal(errorsOf(validateInput(bad, STL05)).length, 1);
  const issues = validateInput(d05, STL05, undefined, 'other_name');
  assert.equal(errorsOf(issues).length, 0);
  assert.ok(issues.some((i) => i.level === 'warning' && i.path === 'meta.title'));
});
check('내보낼 파일 이름: .json이 붙어도 같은 이름, 경로 문자는 오류(core.py config file name 검사)', () => {
  assert.deepStrictEqual(validateInput(d05, STL05, 'j1', '05_fluid_dem.json'), [], "'.json'을 붙인 이름은 meta.title과 같다고 본다");
  assert.deepStrictEqual(validateInput(d05, STL05, 'j1', '05_fluid_dem.JSON'), []);
  const dup = errorsOf(validateInput(d05, [...STL05, '05_fluid_dem.json'], 'j1', '05_fluid_dem.json'));
  assert.equal(dup.length, 1, 'JSON과 같은 이름의 파일은 .json 유무와 상관없이 잡는다');
  for (const bad of ['../evil', 'a/b', 'a\\b', '', '.json']) {
    const errs = errorsOf(validateInput(d05, STL05, 'j1', bad));
    assert.equal(errs.length, 1, `'${bad}'`);
    assert.equal(errs[0].path, 'file_name');
  }
});
check('mesh_path가 meta 아래에 있어도 잡는다(core.py는 문서 전체를 훑는다)', () => {
  const d = structuredClone(d05); d.meta.mesh_path = 'ghost.stl';
  const errs = errorsOf(validateInput(d, STL05));
  assert.equal(errs.length, 1);
  assert.equal(errs[0].path, 'meta.mesh_path');
});
check('올리는 파일 이름: 경로 문자 · 예약 이름 · 중복 · JSON과 같은 이름', () => {
  const errs = errorsOf(validateInput(d05, [...STL05, 'a/b.stl', 'run.log', 'water.stl', '05_fluid_dem.json']));
  assert.equal(errs.length, 4, JSON.stringify(errs));
});
check('export_path가 비어 있지 않으면 경고', () => {
  const d = structuredClone(d05); d.config.result_report.export_path = 'C:/out';
  const issues = validateInput(d, STL05);
  assert.equal(errorsOf(issues).length, 0);
  assert.ok(issues.some((i) => i.path === 'config.result_report.export_path'));
});
check('lattice 쪽 region_ref에 local_source_term_id가 없으면 경고, 입자 쪽은 경고하지 않음', () => {
  const d01 = structuredClone(docs.get('01_multi_component.json'));
  assert.equal(validateInput(d01, ['RTI_region.stl']).length, 0);
  delete d01.config.lattice_generation[0].regional_segment[0].local_source_term_id;
  const issues = validateInput(d01, ['RTI_region.stl']);
  assert.equal(issues.length, 1);
  assert.equal(issues[0].level, 'warning');
  assert.equal(validateInput(d05, STL05).length, 0, '05의 입자 region_ref는 번호가 없어도 경고가 없어야 한다');
});
check('예제 5개(원래 길이) + 각자의 STL: 오류·경고 0', () => {
  const stl = {
    '01_multi_component.json': ['RTI_region.stl'], '02_multiphase.json': ['corrected_left.stl', 'solid.stl'], '03_concentration_diffusion.json': [],
    '04_conjugate_heat_transfer.json': ['CHT_natural_convection_in_a_finned.stl', 'natural_convection_MB.stl'], '05_fluid_dem.json': STL05,
  };
  for (const [name, files] of Object.entries(stl)) assert.deepStrictEqual(validateInput(docs.get(name), files), [], name);
});

console.log('\n[6] setRegions');
check('03(영역 없음)에 01 템플릿으로 region_ref 영역 추가: 기본 키 복사 + id 0 + 0 소스 생성', () => {
  const d03 = docs.get('03_concentration_diffusion.json');
  const t01 = docs.get('01_multi_component.json');
  const out = setRegions(d03, [{ name: 'heavy', meshPath: 'heavy.stl', material: 'fluid', regionType: 'region_ref', origin: 'lattice', group: 0, extra: {} }], t01);
  const seg = out.config.lattice_generation[0].regional_segment;
  assert.equal(seg.length, 1);
  assert.deepStrictEqual(Object.keys(seg[0]), ['name', 'mesh_path', 'invert_normal', 'material', 'region_type', 'initial_condition_id', 'origin', 'scale', 'translate', 'boundary', 'local_source_term_id']);
  assert.deepStrictEqual(seg[0].boundary, t01.config.lattice_generation[0].regional_segment[0].boundary);
  assert.equal(seg[0].initial_condition_id, 0);
  assert.equal(seg[0].local_source_term_id, 0);
  assert.deepStrictEqual(out.config.local_source_terms, [{ momentum_source: [0, 0, 0] }]);
  assert.deepStrictEqual(changedLeaves(d03, out).filter((p) => !p.startsWith('config.lattice_generation[0].regional_segment') && !p.startsWith('config.local_source_terms')), []);
});
check('템플릿 없이: 문서 자신의 영역을 본보기로, extra의 값이 우선, 같은 종류(cht)의 번호 키도 복사', () => {
  const d04 = docs.get('04_conjugate_heat_transfer.json');
  const core = readCore(d04);
  const out = setRegions(d04, [...core.regions, { name: 'fin2', meshPath: 'fin2.stl', material: 'CHT_finned', regionType: 'cht', origin: 'lattice', group: 0, extra: { translate: [1, 2, 3] } }]);
  const seg = out.config.lattice_generation[0].regional_segment;
  assert.equal(seg.length, 3);
  assert.deepStrictEqual(seg[2].translate, [1, 2, 3]);
  assert.deepStrictEqual(seg[2].boundary, seg[0].boundary);
  assert.equal(seg[2].initial_condition_id, seg[0].initial_condition_id, '템플릿의 cht 영역에 있는 initial_condition_id를 빠뜨리면 안 된다');
  assert.deepStrictEqual(Object.keys(seg[2]), Object.keys(seg[0]), '키 집합·순서가 본보기와 같다');
  assert.deepStrictEqual(seg.slice(0, 2), d04.config.lattice_generation[0].regional_segment, '기존 영역은 그대로');
  assert.equal(out.config.local_source_terms.length, 1, '기존 0 소스는 그대로');
});
check('같은 해석기의 템플릿(04)을 주고 cht 추가: 템플릿 cht 영역의 키를 하나도 빠뜨리지 않음', () => {
  const d04 = docs.get('04_conjugate_heat_transfer_short.json');
  const t04 = docs.get('04_conjugate_heat_transfer.json');
  const out = setRegions(d04, [...readCore(d04).regions, { name: 'fin3', meshPath: 'fin3.stl', material: 'CHT_finned', regionType: 'cht', origin: 'lattice', group: 0, extra: {} }], t04);
  const tpl = t04.config.lattice_generation[0].regional_segment[0];
  const added = out.config.lattice_generation[0].regional_segment[2];
  assert.deepStrictEqual(Object.keys(added), Object.keys(tpl));
  const { name, mesh_path, material, ...rest } = tpl;
  assert.deepStrictEqual(added, { name: 'fin3', mesh_path: 'fin3.stl', material: 'CHT_finned', ...rest });
  // 다른 종류(subdivision_ref)를 본보기로 쓸 때는 번호 키를 가져오지 않는다
  const sub = setRegions(d04, [{ name: 'mb2', meshPath: 'mb2.stl', material: 'Duralumin A6061', regionType: 'subdivision_ref', origin: 'lattice', group: 0, extra: {} }], t04)
    .config.lattice_generation[0].regional_segment[0];
  assert.equal(sub.initial_condition_id, undefined);
  assert.deepStrictEqual(Object.keys(sub), Object.keys(t04.config.lattice_generation[0].regional_segment[1]));
});
check('lattice 쪽 region_ref는 템플릿 값(02의 initial_condition_id 1)을 베끼지 않고 0·0을 넣음', () => {
  const d03 = docs.get('03_concentration_diffusion.json');
  const t02 = docs.get('02_multiphase.json');
  const seg = setRegions(d03, [{ name: 'liq', meshPath: 'liq.stl', material: 'fluid', regionType: 'region_ref', origin: 'lattice', group: 0, extra: {} }], t02)
    .config.lattice_generation[0].regional_segment[0];
  assert.equal(t02.config.lattice_generation[0].regional_segment[0].initial_condition_id, 1, '전제: 02의 region_ref는 1을 가리킨다');
  assert.equal(seg.initial_condition_id, 0);
  assert.equal(seg.local_source_term_id, 0);
  assert.deepStrictEqual(Object.keys(seg), Object.keys(t02.config.lattice_generation[0].regional_segment[0]), '키 순서는 본보기를 따른다');
});
check('기존 영역의 키 순서는 다른 템플릿(01)을 줘도 그대로', () => {
  const d02 = docs.get('02_multiphase.json');
  const out = setRegions(d02, readCore(d02).regions, docs.get('01_multi_component.json'));
  assert.equal(JSON.stringify(out.config.lattice_generation[0].regional_segment), JSON.stringify(d02.config.lattice_generation[0].regional_segment));
  assert.equal(JSON.stringify(out), JSON.stringify(d02), '영역을 그대로 두면 문서 전체가 글자까지 같다');
});
check('본보기가 전혀 없으면 문서 예시 기본값', () => {
  const d03 = docs.get('03_concentration_diffusion.json');
  const out = setRegions(d03, [{ name: 'box', meshPath: 'box.stl', material: 'fluid', regionType: 'fixed', origin: 'lattice', group: 0, extra: {} }]);
  const seg = out.config.lattice_generation[0].regional_segment[0];
  assert.deepStrictEqual(seg, { name: 'box', mesh_path: 'box.stl', material: 'fluid', region_type: 'fixed', invert_normal: false, origin: [0, 0, 0], scale: [1, 1, 1], translate: [0, 0, 0], boundary: [] });
  assert.equal(out.config.local_source_terms, undefined, 'region_ref가 아니면 소스를 만들지 않는다');
});
check('05 입자 영역 추가·삭제 (particle_generation[1]에 하나 더, 번호 키 없음)', () => {
  const core = readCore(d05);
  const out = setRegions(d05, [...core.regions, { name: '', meshPath: 'sand.stl', material: 'granule', regionType: 'region_ref', origin: 'particle', group: 1, extra: {} }]);
  const seg = out.config.particle_generation[1].regional_segment;
  assert.equal(seg.length, 2);
  assert.deepStrictEqual(seg[1], { mesh_path: 'sand.stl', material: 'granule', region_type: 'region_ref', boundary: [] });
  assert.equal(out.config.local_source_terms, undefined);
  const removed = setRegions(d05, core.regions.filter((r) => r.origin === 'lattice'));
  assert.deepStrictEqual(removed.config.particle_generation.map((g) => g.regional_segment), [[], []]);
  assert.throws(() => setRegions(d05, [{ name: '', meshPath: 'x.stl', material: 'granule', regionType: 'fixed', origin: 'particle', group: 7, extra: {} }]), /particle_generation 번호 7/);
});

console.log('\n[7] exportJson');
check('meta.title을 파일 이름으로 맞추고 export_path를 비움, 들여쓰기 2칸, 원본은 그대로', () => {
  const d = structuredClone(d05); d.config.result_report.export_path = 'somewhere';
  const { fileName, text } = exportJson(d, 'my_case.json');
  assert.equal(fileName, 'my_case.json');
  const back = JSON.parse(text);
  assert.equal(back.meta.title, 'my_case');
  assert.equal(back.meta.version, 202505);
  assert.equal(back.config.result_report.export_path, '');
  assert.ok(text.startsWith('{\n  "meta": {\n    "version"'));
  assert.deepStrictEqual(changedLeaves(d, back).sort(), ['config.result_report.export_path', 'meta.title']);
  assert.equal(d.meta.title, '05_fluid_dem');
  assert.throws(() => exportJson(d, 'a/b'), /경로 문자/);
  assert.throws(() => exportJson(d, '.json'), /경로 문자/);
  assert.equal(exportJson(d, 'plain').fileName, 'plain.json');
});

console.log('\n[8] 핵심 파라미터가 JSON의 어느 키에서 오는지 (보고용)');
for (const name of ['01_multi_component.json', '02_multiphase.json', '03_concentration_diffusion.json', '04_conjugate_heat_transfer.json', '05_fluid_dem.json']) {
  const core = readCore(docs.get(name));
  console.log(`  ${name}: dx=${core.domain.baseDx} min=${JSON.stringify(core.domain.min)} max=${JSON.stringify(core.domain.max)} end=${core.time.endTime} dt=${core.time.timeStep} save=[${core.time.saveStart},${core.time.saveEnd},${core.time.saveInterval}] g=${JSON.stringify(core.gravity)} p0=${core.initial.pressure} v0=${JSON.stringify(core.initial.velocity)}`);
  console.log(`      materials: ${core.materials.map((m) => `${m.name}(${m.phase}${m.isMain ? ',main' : ''}: ${Object.keys(m.props).join(',')})`).join(' / ')}`);
  console.log(`      boundaries: ${Object.entries(core.boundaries).map(([f, b]) => `${f}=${b.type}${Object.keys(b.extra).length ? `+${Object.keys(b.extra).join(',')}` : ''}`).join(' ')}`);
  console.log(`      regions: ${core.regions.map((r) => `${r.origin}[${r.group}] ${r.name || '(이름 없음)'} ${r.meshPath} ${r.regionType} ${r.material} extra=${Object.keys(r.extra).join(',')}`).join(' / ') || '(없음)'}`);
  console.log(`      solverSettings(${solverKindOf(docs.get(name))}): ${Object.keys(core.solverSettings).join(',') || '{}'}`);
}

console.log(`\n결과: ${pass} 통과, ${fail} 실패`);
process.exit(fail ? 1 : 0);

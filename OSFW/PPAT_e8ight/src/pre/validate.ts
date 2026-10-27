// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   validate.ts

해석기 입력을 엔진 API에 보내기 전에 미리 검사한다.
오류(error)는 엔진 API(integration/api/engine_api/core.py의 prepare_job)가 400으로 거절하는 조건을 그대로 옮긴 것이고,
경고(warning)는 거절되지는 않지만 결과가 달라지거나 동작이 보장되지 않는 것이다.
*/
/******************************************************************************/
import { BOUNDARY_FACES, isJsonObject, type JsonObject, type SolverInputDoc } from './solverInput';

export interface ValidationIssue {
  level: 'error' | 'warning';
  message: string;  // 한국어
  path?: string;    // JSON 안의 위치(예: config.lattice_generation[0].regional_segment[1].mesh_path) 또는 files[i]·job_id
}

const JOB_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
const RESERVED_NAMES = new Set(['engine_job.json', 'run.log', 'run.err.log']);

/** core.py _check_plain_name: 비어 있거나 '/', '\', '..', NUL이 있으면 안 된다 */
export const isPlainName = (name: string): boolean =>
  name !== '' && !name.includes('/') && !name.includes('\\') && !name.includes('..') && !name.includes('\0');

/** 파일 이름에서 확장자 .json(대소문자 무시)을 뗀 줄기. 'case.json'과 'case'를 같은 이름으로 본다 */
export const stemOf = (fileName: string): string => fileName.replace(/\.json$/i, '');

const obj = (v: unknown): JsonObject => (isJsonObject(v) ? v : {});
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

/**
 * JSON 어디에 있든 비어 있지 않은 mesh_path 글자값을 위치와 함께 모은다(core.py _mesh_paths와 같은 규칙).
 * 문서 전체를 넘기면 위치는 'config.…'·'meta.…'로 나온다.
 */
export function collectMeshPaths(value: unknown, path = ''): { value: string; path: string }[] {
  const found: { value: string; path: string }[] = [];
  const at = (k: string) => (path ? `${path}.${k}` : k);
  if (isJsonObject(value)) {
    for (const [k, v] of Object.entries(value)) {
      if (k === 'mesh_path' && typeof v === 'string' && v) found.push({ value: v, path: at('mesh_path') });
      else found.push(...collectMeshPaths(v, at(k)));
    }
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => found.push(...collectMeshPaths(v, `${path}[${i}]`)));
  }
  return found;
}

/**
 * @param doc            검사할 입력 문서
 * @param uploadedFiles  함께 올릴 파일 이름 목록(STL 등). mesh_path는 이 목록에 대소문자까지 같게 있어야 한다
 * @param jobId          작업 ID(있으면 형식 검사)
 * @param fileStem       내보낼 JSON 파일 이름(확장자 .json은 있어도 없어도 된다). 경로 문자는 오류, meta.title과 다르면 안내한다
 */
export function validateInput(doc: SolverInputDoc, uploadedFiles: string[], jobId?: string, fileStem?: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const error = (message: string, path?: string) => issues.push({ level: 'error', message, path });
  const warning = (message: string, path?: string) => issues.push({ level: 'warning', message, path });

  if (jobId !== undefined && !JOB_ID_RE.test(jobId)) {
    error('작업 ID는 영문·숫자·밑줄(_)·붙임표(-)로 1~64자여야 합니다.', 'job_id');
  }

  // 내보낼 파일 이름: core.py가 config file name에도 _check_plain_name을 적용한다
  const stem = fileStem !== undefined ? stemOf(fileStem) : undefined;
  if (stem !== undefined && !isPlainName(stem)) {
    error(`내보낼 파일 이름 '${fileStem}'에는 경로 문자('/', '\\', '..')를 쓸 수 없고 비어 있어서도 안 됩니다.`, 'file_name');
  }

  // meta.title: 결과 파일 이름 앞에 그대로 붙으므로 경로 문자가 있으면 거절된다
  const title = obj(doc.meta).title;
  if (typeof title === 'string' && title) {
    if (!isPlainName(title)) error("meta.title에 '/', '\\', '..'을 쓸 수 없습니다(결과 파일 이름 앞에 붙습니다).", 'meta.title');
  } else {
    warning('meta.title이 비어 있습니다. 결과 파일 이름의 앞부분이 정해지지 않습니다.', 'meta.title');
  }
  if (stem !== undefined && title !== stem) {
    warning(`meta.title('${typeof title === 'string' ? title : ''}')과 내보낼 파일 이름('${stem}.json')이 다릅니다. 내보낼 때 meta.title을 파일 이름으로 맞춥니다.`, 'meta.title');
  }

  // 올릴 파일 이름
  const configName = stem !== undefined ? `${stem}.json` : (typeof title === 'string' && title ? `${title}.json` : null);
  const seen = new Set<string>();
  uploadedFiles.forEach((name, i) => {
    const path = `files[${i}]`;
    if (!isPlainName(name)) error(`파일 이름 '${name}'에는 경로 문자('/', '\\', '..')를 쓸 수 없습니다.`, path);
    if (RESERVED_NAMES.has(name)) error(`파일 이름 '${name}'은 엔진 API가 쓰는 이름이라 올릴 수 없습니다.`, path);
    if (configName !== null && name === configName) error(`파일 '${name}'은 입력 JSON과 이름이 같습니다.`, path);
    if (seen.has(name)) error(`파일 '${name}'이 두 번 올라갔습니다.`, path);
    seen.add(name);
  });

  // mesh_path: 경로 문자 금지, 올린 파일에 정확히 있어야 함. core.py처럼 meta까지 문서 전체를 훑는다
  for (const { value, path } of collectMeshPaths(doc)) {
    if (!isPlainName(value)) error(`mesh_path '${value}'에는 경로 문자를 쓸 수 없습니다. 파일 이름만 적습니다.`, path);
    else if (!uploadedFiles.includes(value)) error(`STL '${value}'이 올릴 파일 목록에 없습니다(대소문자까지 같아야 합니다).`, path);
  }

  // result_report.export_path: 엔진 API가 빈 값으로 덮어쓴다
  const report = obj(doc.config.result_report);
  if ('export_path' in report && report.export_path !== '') {
    warning('result_report.export_path가 비어 있지 않습니다. 엔진 API가 빈 값으로 덮어쓰므로 결과는 작업 폴더 안에 생깁니다.', 'config.result_report.export_path');
  }

  // 영역: 재질 이름, local_source_term_id (lattice 쪽 region_ref에는 번호가 꼭 있어야 한다)
  const materialNames = new Set(arr(doc.config.materials).map((m) => obj(m).name).filter((n): n is string => typeof n === 'string'));
  const sourceCount = arr(doc.config.local_source_terms).length;
  const checkMaterial = (seg: JsonObject, path: string) => {
    if (typeof seg.material === 'string' && !materialNames.has(seg.material)) {
      warning(`영역의 재질 '${seg.material}'이 materials 목록에 없습니다.`, `${path}.material`);
    }
  };
  arr(doc.config.lattice_generation).forEach((lat, li) => {
    arr(obj(lat).regional_segment).forEach((s, si) => {
      const seg = obj(s);
      const path = `config.lattice_generation[${li}].regional_segment[${si}]`;
      const label = typeof seg.name === 'string' && seg.name ? seg.name : String(seg.mesh_path ?? si);
      checkMaterial(seg, path);
      if (seg.region_type === 'region_ref') {
        if (seg.local_source_term_id === undefined) {
          warning(`region_ref 영역 '${label}'에 local_source_term_id가 없습니다. 번호가 없을 때의 동작은 보장되지 않습니다. local_source_terms에 0 소스를 하나 두고 그 번호(0)를 적으세요.`, `${path}.local_source_term_id`);
        } else if (typeof seg.local_source_term_id === 'number' && seg.local_source_term_id >= sourceCount) {
          warning(`영역 '${label}'의 local_source_term_id ${seg.local_source_term_id}에 해당하는 local_source_terms 항목이 없습니다(현재 ${sourceCount}개).`, `${path}.local_source_term_id`);
        }
      }
    });
  });
  arr(doc.config.particle_generation).forEach((g, gi) => {
    arr(obj(g).regional_segment).forEach((s, si) => checkMaterial(obj(s), `config.particle_generation[${gi}].regional_segment[${si}]`));
  });

  // 바깥 경계 6면
  const bc = obj(doc.config.outer_boundary_condition);
  for (const face of BOUNDARY_FACES) {
    if (typeof obj(bc[face]).type !== 'string') warning(`바깥 경계 ${face}의 type이 없습니다.`, `config.outer_boundary_condition.${face}.type`);
  }

  return issues;
}

// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   resultSet.ts

해석엔진 결과 폴더를 훑어 "무엇이 들어 있는지"를 정리한다. 사용자가 고른 폴더가
- 결과 폴더 자체(안에 <title>_<n>.vtm 들이 있음)이거나
- 작업 폴더(안에 입력 JSON과 결과 폴더가 있음; 엔진 ZIP을 푼 모양)
어느 쪽이든 된다. 결과 형식은 1세부 해석엔진(FeDiT OPFW/modeling_simulation_engines)의 doc/output_format.md 기준:
  <title>_<n>.vtm, bin/LEVEL_xx/<title>_<n>.vtu, (유체-DEM) <title>_grid<g>_<n>.vtk, continue/, divergence/
저장 시각은 .vtm에 없으므로 입력 JSON(result_report.save_start_time + n × save_time_interval)에서 계산한다.
*/
/******************************************************************************/
import { FolderSource, FolderEntry, baseName, parentPath, readText } from './source';
import { VtmBlock, VtuArrayInfo, readVtmBlocks, readVtuHeader } from './loaders/vtu_loader';

export interface ResultStep { n: number; time: number | null; vtm: string }

export interface ResultBlock {
  index: number;
  name: string;
  numCells: number;            // 첫 저장 기준. 0이면 빈 블록(건너뜀)
  arrays: VtuArrayInfo[];      // CellData 배열 (이름·형식·성분 수)
}

export interface ResultInput {
  path: string;                // 작업 폴더 기준 경로
  doc: unknown;                // 입력 JSON 전체
  title: string;
  saveStart: number | null;
  saveInterval: number | null;
  timeUnit: string;            // '시간' 또는 '스텝' (time_step이 1이면 스텝으로 본다)
}

export interface ResultScan {
  root: FolderSource;          // 사용자가 고른 폴더
  job: FolderSource;           // 작업 폴더: 입력 JSON·STL·run.log가 있는 곳 (결과 폴더의 부모, 결과 폴더를 바로 골랐으면 root와 같음)
  folder: FolderSource;        // 결과 폴더(.vtm 들이 있는 곳)
  folderPath: string;          // root 기준 경로 ('' = 같음)
  title: string;
  steps: ResultStep[];
  blocks: ResultBlock[];
  particles: { grid: number; steps: Map<number, string> }[]; // 유체-DEM 입자 파일 (아직 읽지 않음)
  input: ResultInput | null;
  logPath: string | null;
  notes: string[];             // 사용자에게 보여 줄 특이 사항
}

const VTM_RE = /^(.+)_(\d+)\.vtm$/i;
const VTK_RE = /^(.+)_grid(\d+)_(\d+)\.vtk$/i;
const SKIP_DIRS = new Set(['continue', 'divergence', 'bin', '__MACOSX']);

async function listOrEmpty(f: FolderSource, path = ''): Promise<FolderEntry[]> { return (await f.list(path)) ?? []; }

/**
 * .vtm이 있는 폴더를 root부터 2단계 아래까지 너비 우선으로 찾는다.
 * 깊이 0: 결과 폴더를 바로 고른 경우 · 1: 작업 폴더(<이름>.json + <이름>/, 엔진 ZIP을 푼 모양) · 2: 작업 폴더를 담은 폴더(<job_id>/<이름>/, 작업 루트 등)
 */
async function findResultFolder(root: FolderSource): Promise<{ path: string; entries: FolderEntry[]; vtms: FolderEntry[] } | null> {
  let queue: string[] = [''];
  for (let depth = 0; depth <= 2 && queue.length; depth++) {
    const next: string[] = [];
    for (const p of queue) {
      const entries = await listOrEmpty(root, p);
      const vtms = entries.filter((e) => e.kind === 'file' && VTM_RE.test(e.name));
      if (vtms.length) return { path: p, entries, vtms };
      for (const d of entries) if (d.kind === 'dir' && !SKIP_DIRS.has(d.name)) next.push(p ? `${p}/${d.name}` : d.name);
    }
    queue = next;
  }
  return null;
}

/** 폴더(또는 작업 폴더, ZIP을 푼 폴더)를 훑어 결과 구성을 정리한다. .vtm이 하나도 없으면 오류 */
export async function scanResultFolder(root: FolderSource): Promise<ResultScan> {
  const notes: string[] = [];
  const found = await findResultFolder(root);
  if (!found) throw new Error('이 폴더에서 결과 묶음 파일(<이름>_<번호>.vtm)을 찾지 못했습니다. 해석 결과 폴더나 결과 ZIP을 푼 폴더를 골라 주세요.');
  const { path: folderPath, entries, vtms } = found;
  const folder = folderPath ? root.sub(folderPath) : root;
  const jobPath = parentPath(folderPath);
  const job = folderPath ? (jobPath ? root.sub(jobPath) : root) : root;

  // 제목(파일 이름 앞부분)별로 묶고, 가장 많은 쪽을 쓴다
  const byTitle = new Map<string, { n: number; vtm: string }[]>();
  for (const e of vtms) {
    const m = VTM_RE.exec(e.name)!;
    const list = byTitle.get(m[1]) ?? [];
    list.push({ n: Number(m[2]), vtm: e.name });
    byTitle.set(m[1], list);
  }
  const [title, list] = Array.from(byTitle.entries()).sort((a, b) => b[1].length - a[1].length)[0];
  if (byTitle.size > 1) notes.push(`묶음 파일 이름이 여러 가지입니다. 가장 많은 "${title}"을 씁니다.`);
  list.sort((a, b) => a.n - b.n);

  // 입력 JSON: 작업 폴더에 <결과 폴더 이름>.json, 없으면 meta.title이 같은 .json
  const input = await findInput(job, folderPath ? baseName(folderPath) : '', title, notes);

  const steps: ResultStep[] = list.map((s) => ({
    n: s.n,
    time: input?.saveStart !== null && input?.saveInterval !== null && input ? input.saveStart! + s.n * input.saveInterval! : null,
    vtm: s.vtm,
  }));

  // 블록: 첫 저장의 .vtm에서 목록을 읽고, 블록마다 헤더로 셀 수·배열을 본다
  const firstBlocks: VtmBlock[] = await readVtmBlocks(folder, steps[0].vtm);
  const blocks: ResultBlock[] = [];
  for (const b of firstBlocks) {
    const src = await folder.file(b.path);
    if (!src) { notes.push(`${b.name}: 파일이 없습니다 (${b.path})`); continue; }
    const h = await readVtuHeader(src);
    blocks.push({ index: b.index, name: b.name, numCells: h.numCells, arrays: h.arrays.filter((a) => a.location === 'cells') });
    if (h.numCells === 0) notes.push(`${b.name}은 셀이 0개인 빈 블록이라 건너뜁니다.`);
  }
  if (!blocks.some((b) => b.numCells > 0)) throw new Error('모든 블록이 비어 있습니다.');

  // 유체-DEM 입자 파일
  const particles = new Map<number, Map<number, string>>();
  for (const e of entries) {
    const m = e.kind === 'file' ? VTK_RE.exec(e.name) : null;
    if (!m || m[1] !== title) continue;
    const g = Number(m[2]), n = Number(m[3]);
    const map = particles.get(g) ?? new Map<number, string>();
    map.set(n, e.name);
    particles.set(g, map);
  }
  if (particles.size) notes.push(`입자 결과 파일 ${Array.from(particles.values()).reduce((s, m) => s + m.size, 0)}개가 있습니다 (아직 표시하지 않습니다).`);
  if (entries.some((e) => e.kind === 'dir' && e.name === 'divergence')) notes.push('divergence 폴더가 있습니다. 계산이 발산해 멈춘 결과일 수 있습니다.');

  const logPath = (await listOrEmpty(job)).some((e) => e.kind === 'file' && e.name === 'run.log') ? 'run.log' : null;

  return { root, job, folder, folderPath, title, steps, blocks, particles: Array.from(particles, ([grid, s]) => ({ grid, steps: s })), input, logPath, notes };
}

/** 작업 폴더(job)에서 입력 JSON을 찾는다. folderName은 결과 폴더 이름(작업 폴더에는 <folderName>.json이 있는 것이 보통) */
async function findInput(job: FolderSource, folderName: string, title: string, notes: string[]): Promise<ResultInput | null> {
  const rootEntries = await listOrEmpty(job);
  const jsons = rootEntries.filter((e) => e.kind === 'file' && /\.json$/i.test(e.name) && e.name !== 'engine_job.json' && e.name !== 'result.json');
  const preferred = folderName ? `${folderName}.json` : null;
  const order = [...jsons.filter((e) => e.name === preferred), ...jsons.filter((e) => e.name !== preferred)];
  for (const e of order) {
    try {
      const src = await job.file(e.name);
      if (!src) continue;
      const doc = JSON.parse(await readText(src, 8 * 1024 * 1024)) as { meta?: { title?: string }; config?: Record<string, unknown> };
      if (!doc?.config || typeof doc.config !== 'object') continue;
      const docTitle = String(doc.meta?.title ?? '');
      if (e.name !== preferred && docTitle !== title) continue;
      const report = (doc.config.result_report ?? {}) as Record<string, unknown>;
      const common = (doc.config.solver_common ?? {}) as Record<string, unknown>;
      const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
      const timeStep = num(common.time_step);
      if (docTitle && docTitle !== title) notes.push(`입력 JSON의 제목(${docTitle})과 결과 파일 이름(${title})이 다릅니다.`);
      return {
        path: e.name, doc, title: docTitle || title,
        saveStart: num(report.save_start_time), saveInterval: num(report.save_time_interval),
        timeUnit: timeStep === 1 ? '스텝' : '시간',
      };
    } catch { /* 다음 후보 */ }
  }
  notes.push('입력 JSON을 찾지 못해 저장 시각 대신 저장 번호를 씁니다.');
  return null;
}

/** 블록의 CellData 가운데 표시할 만한 숫자 배열 이름 (셀 중심·플래그 제외) */
export function displayableArrays(blocks: ResultBlock[]): string[] {
  const out = new Set<string>();
  for (const b of blocks) {
    if (b.numCells === 0) continue;
    for (const a of b.arrays) {
      if (!/^Float/.test(a.type)) continue;
      if (a.name === 'position' || (a.components !== 1 && a.components !== 3)) continue;
      out.add(a.name);
    }
  }
  return Array.from(out);
}

/** 플래그(UInt8) 배열 중 고체 표시로 쓸 만한 것 */
export function solidArrayOf(blocks: ResultBlock[]): string | undefined {
  return blocks.some((b) => b.arrays.some((a) => a.name === 'solid')) ? 'solid' : undefined;
}

export const stepLabel = (scan: ResultScan, step: ResultStep): string =>
  step.time === null ? `저장 ${step.n}` : `${scan.input?.timeUnit === '스텝' ? '스텝' : 't ='} ${Number(step.time.toPrecision(6))}`;

export const resultName = (scan: ResultScan): string => `${scan.root.name}${scan.folderPath ? '/' + baseName(scan.folderPath) : ''}`;

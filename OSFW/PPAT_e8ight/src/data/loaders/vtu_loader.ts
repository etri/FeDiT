// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   vtu_loader.ts

VTK XML UnstructuredGrid(.vtu, 원시 이진 appended) 로더와 다중블록(.vtm) 목록 읽기.
자사 LBM 솔버 결과(레벨별 정육면체 셀)를 대상으로 한다.
- 파일이 어디 있든(서버 주소, 사용자 PC 폴더, 메모리) ByteSource로 읽는다. XML 헤더만 먼저 읽고,
  필요한 배열만 바이트 구간으로 골라 읽는다 (자사 후처리기 방식).
- 셀 중심을 점으로 바꾼 PointDataset을 만든다. solid=1(고체 내부) 셀은 뺀다.
- 시간축용으로 두 단계로 나뉜다: 위상(셀 위치·남길 셀)은 한 번만(readVtuTopology), 값은 저장 시점마다(readVtuFields).
- 해석엔진 결과의 알려진 특성에 대비한다: offsets 배열의 길이 머리값이 실제의 2배인 것(배열별 길이 상한),
  셀 0개인 빈 레벨 파일(빈 데이터셋으로 돌려줌), CellData에 셀 중심 position 배열이 있으면 Points·connectivity를 읽지 않음.
*/
/******************************************************************************/
import { PointDataset, ScalarField, VectorField, computeBounds, computeStats, estimateSpacing, vectorFieldFromInterleaved } from '../pointDataset';
import { ByteSource, FolderSource, HttpFolder, HttpSource, baseName, parentPath, readText } from '../source';

export interface VtuArrayInfo { name: string; type: string; components: number; offset: number; location: 'points' | 'cells' | 'grid' }
export interface VtuHeader { source: ByteSource; numPoints: number; numCells: number; arrays: VtuArrayInfo[]; base: number; header64: boolean; text: string }

export interface VtuLoadOptions {
  arrays: string[];            // 읽을 셀 배열 이름
  solidArray?: string;         // 1이면 제외할 배열 (예: 'solid')
  /** CellData에 셀 중심 배열이 있으면 그것으로 위치를 잡는다 (Points·connectivity를 읽지 않아 전송량이 1/3). 기본 켬 */
  preferCellPosition?: boolean;
  positionArray?: string;      // 셀 중심 배열 이름 (기본 'position')
  onProgress?: (msg: string) => void;
}

/** 시간축용 위상: 위치·남긴 셀 번호. 저장 시점이 바뀌어도 그대로 쓴다 */
export interface VtuTopology {
  name: string;
  numCells: number;
  kept: Int32Array;            // 남긴 셀 번호(원본 셀 순서)
  count: number;
  positions: Float32Array;     // 남긴 셀의 중심 xyz
  spacing: number;
  bounds: PointDataset['bounds'];
  columns: string[];
}

const ELEMENT_SIZE: Record<string, number> = { Float32: 4, Float64: 8, Int8: 1, UInt8: 1, Int16: 2, UInt16: 2, Int32: 4, UInt32: 4, Int64: 8, UInt64: 8 };

export async function readVtuHeader(src: ByteSource): Promise<VtuHeader> {
  let size = 65536, text = '', base = -1;
  for (let attempt = 0; attempt < 6 && base < 0; attempt++) {
    text = new TextDecoder('latin1').decode(await src.read(0, size - 1));
    const m = /<AppendedData\s+encoding="raw"\s*>\s*_/.exec(text);
    if (m) base = m.index + m[0].length;
    else size *= 4;
  }
  if (base < 0) throw new Error(`${src.name}: VTU 파일에서 AppendedData(raw) 블록을 찾지 못했습니다. 압축 형식과 base64 형식은 아직 지원하지 않습니다.`);
  const head = text.slice(0, base);
  if (!/byte_order="LittleEndian"/.test(head)) throw new Error(`${src.name}: BigEndian VTU는 지원하지 않습니다.`);
  // 압축한 VTU도 AppendedData는 raw로 적히므로 위 검사를 지나간다. 블록 머리를 바이트 길이로 읽으면 값이 틀리므로 여기서 멈춘다
  if (/compressor="[^"]+"/.test(head)) throw new Error(`${src.name}: 압축한 VTU는 아직 지원하지 않습니다. 압축 없이 저장한 VTU를 쓰세요.`);
  const numPoints = Number(/NumberOfPoints="(\d+)"/.exec(head)?.[1] ?? 0);
  const numCells = Number(/NumberOfCells="(\d+)"/.exec(head)?.[1] ?? 0);
  const header64 = /header_type="UInt64"/.test(head);
  const arrays: VtuArrayInfo[] = [];
  // 어느 구획(PointData / CellData / Points / Cells)에 있는지 같이 적는다
  const re = /<(PointData|CellData|Points|Cells)\b[^>]*>|<DataArray\s+([^>]*?)\/?>/g;
  let m: RegExpExecArray | null;
  let location: VtuArrayInfo['location'] = 'grid';
  while ((m = re.exec(head))) {
    if (m[1]) { location = m[1] === 'PointData' ? 'points' : m[1] === 'CellData' ? 'cells' : 'grid'; continue; }
    const attrs = m[2];
    const get = (k: string) => new RegExp(`\\b${k}="([^"]*)"`).exec(attrs)?.[1];
    if (get('format') !== 'appended') continue;
    arrays.push({ name: get('Name') ?? '', type: get('type') ?? 'Float32', components: Number(get('NumberOfComponents') ?? 1), offset: Number(get('offset') ?? 0), location });
  }
  return { source: src, numPoints, numCells, arrays, base, header64, text: head };
}

/** 배열의 바이트 길이 상한. 머리값이 틀린 파일(offsets가 2배)에 대비한다. 모르면 Infinity */
function expectedBytes(h: VtuHeader, info: VtuArrayInfo): number {
  const es = ELEMENT_SIZE[info.type];
  if (!es) return Infinity;
  if (info.location === 'points' || (info.location === 'grid' && info.name !== 'connectivity' && info.name !== 'offsets' && info.name !== 'types')) return h.numPoints * info.components * es;
  if (info.name === 'connectivity') return Infinity; // 셀당 꼭짓점 수를 모른다
  return h.numCells * info.components * es;
}

export async function readVtuArray(h: VtuHeader, info: VtuArrayInfo): Promise<ArrayBuffer> {
  const hs = h.header64 ? 8 : 4;
  const start = h.base + info.offset;
  const dv = new DataView(await h.source.read(start, start + hs - 1));
  const declared = h.header64 ? Number(dv.getBigUint64(0, true)) : dv.getUint32(0, true);
  const nbytes = Math.min(declared, expectedBytes(h, info));
  if (nbytes <= 0) return new ArrayBuffer(0);
  return h.source.read(start + hs, start + hs + nbytes - 1);
}

function asFloat32(buf: ArrayBuffer, type: string): Float32Array {
  switch (type) {
    case 'Float32': return new Float32Array(buf);
    case 'Float64': return Float32Array.from(new Float64Array(buf));
    case 'Int32': return Float32Array.from(new Int32Array(buf));
    case 'UInt32': return Float32Array.from(new Uint32Array(buf));
    case 'Int16': return Float32Array.from(new Int16Array(buf));
    case 'UInt16': return Float32Array.from(new Uint16Array(buf));
    case 'Int8': return Float32Array.from(new Int8Array(buf));
    case 'UInt8': return Float32Array.from(new Uint8Array(buf));
    case 'Int64': return Float32Array.from(new BigInt64Array(buf), Number);
    case 'UInt64': return Float32Array.from(new BigUint64Array(buf), Number);
    default: throw new Error(`지원하지 않는 배열 형식: ${type}`);
  }
}

function asInt(buf: ArrayBuffer, type: string): Int32Array {
  if (type === 'Int32') return new Int32Array(buf);
  if (type === 'Int64') return Int32Array.from(new BigInt64Array(buf), Number);
  if (type === 'UInt32') return Int32Array.from(new Uint32Array(buf));
  return Int32Array.from(asFloat32(buf, type));
}

const findArray = (h: VtuHeader, name: string, location?: VtuArrayInfo['location']) =>
  h.arrays.find((a) => a.name === name && (!location || a.location === location));

/** 셀 중심을 구한다: CellData의 셀 중심 배열이 있으면 그것, 없으면 꼭짓점 평균 */
async function cellCenters(h: VtuHeader, name: string, opts: VtuLoadOptions): Promise<{ centers: Float32Array; spacing: number }> {
  const nC = h.numCells;
  const posInfo = opts.preferCellPosition !== false ? findArray(h, opts.positionArray ?? 'position', 'cells') : undefined;
  if (posInfo && posInfo.components === 3) {
    opts.onProgress?.(`${name}: 셀 중심 읽는 중 (셀 ${nC.toLocaleString()}개)`);
    const centers = asFloat32(await readVtuArray(h, posInfo), posInfo.type);
    const bounds = computeBounds(centers, nC);
    return { centers, spacing: estimateSpacing(centers, nC, bounds) };
  }
  const ptsInfo = h.arrays.find((a) => a.location === 'grid' && a.components === 3 && a.name !== 'connectivity');
  const connInfo = findArray(h, 'connectivity'), offInfo = findArray(h, 'offsets');
  if (!ptsInfo || !connInfo || !offInfo) throw new Error(`${name}: Points/connectivity/offsets 배열이 없습니다.`);
  opts.onProgress?.(`${name}: 셀 좌표 읽는 중 (셀 ${nC.toLocaleString()}개)`);
  const [P, conn, offs] = await Promise.all([
    readVtuArray(h, ptsInfo).then((b) => asFloat32(b, ptsInfo.type)),
    readVtuArray(h, connInfo).then((b) => asInt(b, connInfo.type)),
    readVtuArray(h, offInfo).then((b) => asInt(b, offInfo.type)),
  ]);
  // 셀 중심 = 꼭짓점 평균. 첫 셀의 크기를 격자 간격으로 본다.
  const centers = new Float32Array(nC * 3);
  let cellSize = 0;
  for (let c = 0, start = 0; c < nC; c++) {
    const end = offs[c];
    const n = Math.max(1, end - start);
    let sx = 0, sy = 0, sz = 0;
    let minx = Infinity, maxx = -Infinity;
    for (let k = start; k < end; k++) {
      const p = conn[k] * 3;
      sx += P[p]; sy += P[p + 1]; sz += P[p + 2];
      if (c === 0) { if (P[p] < minx) minx = P[p]; if (P[p] > maxx) maxx = P[p]; }
    }
    centers[c * 3] = sx / n; centers[c * 3 + 1] = sy / n; centers[c * 3 + 2] = sz / n;
    if (c === 0) cellSize = maxx - minx;
    start = end;
  }
  return { centers, spacing: cellSize || 1 };
}

/** 위상(남길 셀과 그 중심)을 읽는다. 셀이 0개인 빈 파일이면 count 0 */
export async function readVtuTopology(src: ByteSource, name: string, opts: VtuLoadOptions): Promise<VtuTopology> {
  const h = await readVtuHeader(src);
  const nC = h.numCells;
  const columns = h.arrays.filter((a) => a.location !== 'grid').map((a) => a.name);
  if (nC === 0) return { name, numCells: 0, kept: new Int32Array(0), count: 0, positions: new Float32Array(0), spacing: 1, bounds: computeBounds(new Float32Array(0), 0), columns };
  const { centers, spacing } = await cellCenters(h, name, opts);
  const keep = new Uint8Array(nC).fill(1);
  const solidInfo = opts.solidArray ? findArray(h, opts.solidArray, 'cells') : undefined;
  if (solidInfo) {
    const s = asFloat32(await readVtuArray(h, solidInfo), solidInfo.type);
    for (let c = 0; c < nC; c++) if (s[c] > 0) keep[c] = 0;
  }
  let count = 0;
  for (let c = 0; c < nC; c++) if (keep[c]) count++;
  const kept = new Int32Array(count);
  const positions = new Float32Array(count * 3);
  for (let c = 0, i = 0; c < nC; c++) {
    if (!keep[c]) continue;
    kept[i] = c;
    positions[i * 3] = centers[c * 3]; positions[i * 3 + 1] = centers[c * 3 + 1]; positions[i * 3 + 2] = centers[c * 3 + 2];
    i++;
  }
  return { name, numCells: nC, kept, count, positions, spacing, bounds: computeBounds(positions, count), columns };
}

/** 한 저장 시점의 값 배열들을 읽어 위상에 맞춘다 (남긴 셀만). 없는 배열은 건너뛴다 */
export async function readVtuFields(src: ByteSource, topo: VtuTopology, arrays: string[], onProgress?: (msg: string) => void): Promise<{ scalars: ScalarField[]; vectors: VectorField[] }> {
  const scalars: ScalarField[] = [], vectors: VectorField[] = [];
  if (topo.count === 0) return { scalars, vectors };
  const h = await readVtuHeader(src);
  if (h.numCells !== topo.numCells) throw new Error(`${src.name}: 셀 수(${h.numCells})가 첫 저장(${topo.numCells})과 다릅니다.`);
  const { kept, count } = topo;
  for (const nm of arrays) {
    const info = findArray(h, nm, 'cells');
    if (!info) continue;
    onProgress?.(`${topo.name}: ${nm} 읽는 중`);
    const data = asFloat32(await readVtuArray(h, info), info.type);
    if (info.components === 1) {
      const v = new Float32Array(count);
      for (let i = 0; i < count; i++) v[i] = data[kept[i]];
      scalars.push({ kind: 'scalar', name: nm, values: v, stats: computeStats(v) });
    } else if (info.components === 3) {
      const v = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) { const c = kept[i] * 3; v[i * 3] = data[c]; v[i * 3 + 1] = data[c + 1]; v[i * 3 + 2] = data[c + 2]; }
      vectors.push(vectorFieldFromInterleaved(nm, [`${nm}_x`, `${nm}_y`, `${nm}_z`], v));
    }
  }
  return { scalars, vectors };
}

/** 위상 + 값 → 점 데이터셋 */
export function datasetFrom(topo: VtuTopology, fields: { scalars: ScalarField[]; vectors: VectorField[] }): PointDataset {
  return {
    name: topo.name, count: topo.count, positions: topo.positions, bounds: topo.bounds, spacing: topo.spacing,
    scalars: fields.scalars, vectors: fields.vectors, columns: topo.columns, coordColumns: ['x', 'y', 'z'],
  };
}

/** .vtu를 읽어 셀 중심 점 데이터셋으로 만든다 (저장 1회분). */
export async function loadVtuAsCellPoints(src: ByteSource | string, name: string, opts: VtuLoadOptions): Promise<PointDataset> {
  const source = typeof src === 'string' ? new HttpSource(src) : src;
  const topo = await readVtuTopology(source, name, opts);
  const fields = await readVtuFields(source, topo, opts.arrays, opts.onProgress);
  return datasetFrom(topo, fields);
}

/**
 * .vti(ImageData, 원시 이진 appended)를 읽어 셀 중심 점 데이터셋으로 만든다.
 * downsample_vtu.py가 만든 축소본용. NaN 셀(빈 칸)은 뺀다.
 */
export async function loadVtiAsCellPoints(src: ByteSource | string, name: string, opts: VtuLoadOptions): Promise<PointDataset> {
  const source = typeof src === 'string' ? new HttpSource(src) : src;
  const h = await readVtuHeader(source);
  const text = h.text;
  const ext = /WholeExtent="([^"]+)"/.exec(text)?.[1].trim().split(/\s+/).map(Number);
  const origin = /Origin="([^"]+)"/.exec(text)?.[1].trim().split(/\s+/).map(Number);
  const spacing = /Spacing="([^"]+)"/.exec(text)?.[1].trim().split(/\s+/).map(Number);
  if (!ext || !origin || !spacing || ext.length < 6) throw new Error(`${name}: ImageData 헤더(WholeExtent/Origin/Spacing)를 읽지 못했습니다.`);
  const nx = ext[1] - ext[0], ny = ext[3] - ext[2], nz = ext[5] - ext[4];
  const nC = nx * ny * nz;
  const hh: VtuHeader = { ...h, numCells: nC, numPoints: (nx + 1) * (ny + 1) * (nz + 1) };
  const find = (n: string) => hh.arrays.find((a) => a.name === n);

  // 유체 비율(있으면)로 빈 칸을 거른다. 없으면 첫 배열의 NaN으로 판단.
  const keep = new Uint8Array(nC).fill(1);
  const ff = find('fluid_fraction');
  if (ff) {
    const f = asFloat32(await readVtuArray(hh, ff), ff.type);
    for (let c = 0; c < nC; c++) if (!(f[c] > 0)) keep[c] = 0;
  }
  const loaded = new Map<string, Float32Array>();
  for (const nm of opts.arrays) {
    const info = find(nm);
    if (!info) continue;
    opts.onProgress?.(`${name}: ${nm} 읽는 중`);
    loaded.set(nm, asFloat32(await readVtuArray(hh, info), info.type));
  }
  if (!ff && loaded.size) {
    const [first, arr] = loaded.entries().next().value as [string, Float32Array];
    const nc = find(first)!.components;
    for (let c = 0; c < nC; c++) if (arr[c * nc] !== arr[c * nc]) keep[c] = 0;
  }
  const kept: number[] = [];
  for (let c = 0; c < nC; c++) if (keep[c]) kept.push(c);
  const count = kept.length;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const c = kept[i];
    const ci = c % nx, cj = Math.floor(c / nx) % ny, ck = Math.floor(c / (nx * ny));
    positions[i * 3] = origin[0] + (ci + 0.5) * spacing[0];
    positions[i * 3 + 1] = origin[1] + (cj + 0.5) * spacing[1];
    positions[i * 3 + 2] = origin[2] + (ck + 0.5) * spacing[2];
  }
  const scalars: ScalarField[] = [], vectors: VectorField[] = [];
  for (const [nm, data] of loaded) {
    const nc = find(nm)!.components;
    if (nc === 1) {
      const v = new Float32Array(count);
      for (let i = 0; i < count; i++) v[i] = data[kept[i]];
      scalars.push({ kind: 'scalar', name: nm, values: v, stats: computeStats(v) });
    } else if (nc === 3) {
      const v = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) { const c = kept[i] * 3; v[i * 3] = data[c]; v[i * 3 + 1] = data[c + 1]; v[i * 3 + 2] = data[c + 2]; }
      vectors.push(vectorFieldFromInterleaved(nm, [`${nm}_x`, `${nm}_y`, `${nm}_z`], v));
    }
  }
  return {
    name, count, positions, bounds: computeBounds(positions, count), spacing: spacing[0], scalars, vectors,
    columns: hh.arrays.map((a) => a.name), coordColumns: ['x', 'y', 'z'],
  };
}

export interface VtmBlock { index: number; path: string; name: string }

/** .vtm(다중블록) 본문에서 블록 파일 목록을 읽는다. 경로는 vtm 파일이 있는 폴더 기준, 역슬래시는 슬래시로 */
export function parseVtmBlocks(text: string): VtmBlock[] {
  const out: VtmBlock[] = [];
  const re = /<DataSet\s+([^>]*)>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const attrs = m[1];
    const file = /\bfile="([^"]+)"/.exec(attrs)?.[1];
    if (!file) continue;
    const index = Number(/\bindex="(\d+)"/.exec(attrs)?.[1] ?? out.length);
    const rel = file.replace(/\\/g, '/');
    const lvl = /LEVEL_(\d+)/i.exec(rel);
    out.push({ index, path: rel, name: lvl ? `LEVEL_${lvl[1]}` : `block${index}` });
  }
  return out;
}

/** 폴더 안의 .vtm을 읽어 블록 목록을 돌려준다 (path는 그 폴더 기준) */
export async function readVtmBlocks(folder: FolderSource, vtmPath: string): Promise<VtmBlock[]> {
  const src = await folder.file(vtmPath);
  if (!src) throw new Error(`VTM 파일이 없습니다: ${vtmPath}`);
  const dir = parentPath(vtmPath);
  return parseVtmBlocks(await readText(src)).map((b) => ({ ...b, path: dir ? `${dir}/${b.path}` : b.path }));
}

/** 서버 주소의 .vtm → 블록 URL 목록 (datasets.json 항목용) */
export async function readVtmDatasets(vtmUrl: string): Promise<{ index: number; url: string; name: string }[]> {
  const cut = vtmUrl.lastIndexOf('/');
  const folder = new HttpFolder(cut >= 0 ? vtmUrl.slice(0, cut) : '.'); // 파일 이름만 적은 주소는 페이지와 같은 폴더 ('' 이면 사이트 맨 위가 된다)
  const blocks = await readVtmBlocks(folder, decodeURIComponent(baseName(vtmUrl)));
  return blocks.map((b) => ({ index: b.index, name: b.name, url: `${folder.baseUrl}/${b.path.split('/').map(encodeURIComponent).join('/')}` }));
}

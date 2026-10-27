// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   timeSeries.ts

저장 시점이 여러 개인 결과를 다룬다. 위상(셀 위치·남긴 셀)은 첫 저장에서 한 번만 읽고,
시점마다 값 배열만 읽어 같은 점 순서로 맞춘다. 읽은 시점은 메모리 예산 안에서 캐시하고,
넘치면 가장 오래 안 쓴 것부터 버린다(LRU). 재생 중에는 다음 시점을 미리 읽는다.
*/
/******************************************************************************/
import { PointDataset } from './pointDataset';
import { ResultScan } from './resultSet';
import { VtuTopology, datasetFrom, readVtmBlocks, readVtuFields, readVtuTopology } from './loaders/vtu_loader';

export interface TimeSeriesOptions {
  arrays: string[];
  solidArray?: string;
  blocks?: number[];           // 읽을 블록 index (기본: 셀이 있는 블록 전부)
  cacheBytes?: number;         // 캐시 예산 (기본 768 MB)
  onProgress?: (msg: string) => void;
}

interface StepCache { datasets: PointDataset[]; bytes: number }

export class TimeSeries {
  readonly scan: ResultScan;
  private readonly opts: TimeSeriesOptions;
  private topologies: VtuTopology[] = [];
  private blockIndices: number[] = [];
  private readonly cache = new Map<number, StepCache>(); // 삽입 순서 = 최근 사용 순서
  private cacheBytes = 0;
  private readonly inflight = new Map<number, Promise<PointDataset[]>>();
  private vtmBlocks = new Map<number, { index: number; path: string }[]>();

  constructor(scan: ResultScan, opts: TimeSeriesOptions) {
    this.scan = scan;
    this.opts = { ...opts };
    this.blockIndices = opts.blocks ?? scan.blocks.filter((b) => b.numCells > 0).map((b) => b.index);
  }

  get arrays(): string[] { return this.opts.arrays; }
  get stepCount(): number { return this.scan.steps.length; }
  get budget(): number { return this.opts.cacheBytes ?? 768 * 1024 * 1024; }
  get cachedBytes(): number { return this.cacheBytes; }
  cachedSteps(): number[] { return Array.from(this.cache.keys()); }
  /** 캐시된 n번 저장의 값 (읽지 않고, 최근 사용 순서도 바꾸지 않는다). 없으면 null. 받은 쪽은 값을 고치지 않는다 */
  peek(n: number): readonly PointDataset[] | null { return this.cache.get(n)?.datasets ?? null; }

  /** 위상을 읽고 첫 시점의 값을 돌려준다 */
  async init(): Promise<PointDataset[]> {
    const first = this.scan.steps[0];
    const blocks = await this.blocksAt(first.n);
    this.topologies = [];
    for (const b of blocks) {
      const src = await this.scan.folder.file(b.path);
      if (!src) throw new Error(`블록 파일이 없습니다: ${b.path}`);
      const name = this.scan.blocks.find((x) => x.index === b.index)?.name ?? `block${b.index}`;
      this.topologies.push(await readVtuTopology(src, name, { arrays: [], solidArray: this.opts.solidArray, onProgress: this.opts.onProgress }));
    }
    return this.step(first.n);
  }

  /** 읽을 배열을 바꾼다 (캐시는 비운다). 다음 step() 호출 때 새 배열로 읽는다 */
  setArrays(arrays: string[]): void {
    this.opts.arrays = [...arrays];
    this.cache.clear();
    this.cacheBytes = 0;
  }

  /** n번 저장의 값 (캐시되면 바로) */
  step(n: number): Promise<PointDataset[]> {
    // 돌려주는 데이터셋은 얕은 복사본이다: 받는 쪽(레벨 데이터셋)이 scalars·vectors를 바꿔 끼워도 캐시가 더럽혀지지 않게
    const hit = this.cache.get(n);
    if (hit) { this.cache.delete(n); this.cache.set(n, hit); return Promise.resolve(hit.datasets.map((d) => ({ ...d }))); } // 최근 사용으로 옮김
    const running = this.inflight.get(n);
    if (running) return running.then((ds) => ds.map((d) => ({ ...d })));
    const p = this.load(n).finally(() => this.inflight.delete(n));
    this.inflight.set(n, p);
    return p.then((ds) => ds.map((d) => ({ ...d })));
  }

  /** 미리 읽기 (결과는 캐시에만) */
  prefetch(n: number): void {
    if (this.cache.has(n) || this.inflight.has(n) || !this.scan.steps.some((s) => s.n === n)) return;
    void this.step(n).catch(() => { /* 재생 중 미리 읽기 실패는 조용히 */ });
  }

  private async blocksAt(n: number): Promise<{ index: number; path: string }[]> {
    let list = this.vtmBlocks.get(n);
    if (!list) {
      const step = this.scan.steps.find((s) => s.n === n);
      if (!step) throw new Error(`저장 ${n}이 없습니다.`);
      list = (await readVtmBlocks(this.scan.folder, step.vtm)).filter((b) => this.blockIndices.includes(b.index));
      this.vtmBlocks.set(n, list);
    }
    return list;
  }

  private async load(n: number): Promise<PointDataset[]> {
    const blocks = await this.blocksAt(n);
    const datasets: PointDataset[] = [];
    let bytes = 0;
    for (let i = 0; i < this.topologies.length; i++) {
      const topo = this.topologies[i];
      const b = blocks.find((x) => this.scan.blocks.find((sb) => sb.index === x.index)?.name === topo.name) ?? blocks[i];
      if (!b) throw new Error(`저장 ${n}에 ${topo.name} 블록이 없습니다.`);
      const src = await this.scan.folder.file(b.path);
      if (!src) throw new Error(`블록 파일이 없습니다: ${b.path}`);
      const fields = await readVtuFields(src, topo, this.opts.arrays, (m) => this.opts.onProgress?.(`저장 ${n} · ${m}`));
      for (const s of fields.scalars) bytes += s.values.byteLength;
      for (const v of fields.vectors) bytes += v.values.byteLength + v.magnitude.byteLength;
      datasets.push(datasetFrom(topo, fields));
    }
    this.cache.set(n, { datasets, bytes });
    this.cacheBytes += bytes;
    this.evict(n);
    return datasets;
  }

  /** 예산을 넘으면 가장 오래 안 쓴 시점부터 버린다 (방금 읽은 것은 남긴다) */
  private evict(keep: number): void {
    for (const [n, c] of this.cache) {
      if (this.cacheBytes <= this.budget) break;
      if (n === keep) continue;
      this.cache.delete(n);
      this.cacheBytes -= c.bytes;
    }
  }
}

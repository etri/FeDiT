// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   timeSeries.ts

저장 시점이 여러 개인 결과를 다룬다. 위상(셀 위치·남긴 셀)은 첫 저장에서 한 번만 읽고,
시점마다 값 배열만 읽어 같은 점 순서로 맞춘다. 읽는 배열은 '지금 쓰는 배열'(opts.arrays · useArrays — 칠하거나 거르는 데 쓰는 배열)뿐이다(2026-11-06).
캐시는 (시점, 배열) 단위로 메모리 예산 안에 두고, 넘치면 안 쓰는 배열부터, 그다음 가장 오래 안 쓴 것부터 버린다(LRU — 방금 읽은 시점은 남김).
그 시점 파일에 없는 배열은 '없음'으로 적어 두어 다시 읽지 않는다. step(n) 은 쓰는 배열이 모두 든 데이터셋을 돌려준다: 캐시에 있는 배열은 꺼내고,
같은 (시점, 배열)을 읽는 중이면 그 읽기를 기다리고, 빠진 배열만 한 묶음으로 읽는다. 데이터셋의 배열 차례는 첫 저장 헤더 차례로 고정.
블록 파일의 헤더(앞 64 KB — 배열 위치·형식)와 그 파일(ByteSource — 서버면 HEAD 로 연다)은 (시점, 블록 파일)마다 한 번만 읽어 들고 있다가 같은 시점의 다음 묶음이
다시 쓴다(배열을 더할 때마다 HEAD 와 헤더를 다시 받지 않게 — 위상을 읽을 때 읽은 첫 저장 헤더도). 그 시점 항목이 모두 버려지면 함께 지운다.
다만 서버가 바이트 범위 요청을 무시해 파일 전체를 받아 둔 원본(HttpSource.whole)은 그 묶음이 끝나면 놓는다 — 들고 있으면 읽은 시점마다 블록 파일 전체가
캐시 예산(값 바이트만 셈) 밖에 쌓인다(검증 2026-11-06: 12 장면에 예산이 세는 값 9.5 MB · 붙잡은 파일 134.6 MB). 그런 서버는 다음 묶음에서 파일을 다시 연다.
다른 데이터를 열면 dispose() — Worker 에 보내 둔 위상 사본을 바로 지우고, 읽던 묶음의 요청(파일 열기 · .vtm · 헤더 · 배열)을 끊는다(decodeClient releaseTopology).
재생 중에는 앞으로 볼 시점들을 예산의 60% 안에서 차례로 미리 읽는다(prefetchAhead, 2026-11-06 — 시점 크기는 쓰는 배열 기준).
시점 하나를 읽는 동안 진행(읽은 배열 바이트 / 읽을 바이트 — onStepProgress · loadProgress)과 캐시 목록이 바뀜(onCacheChange)을 알린다:
재생 막대의 진행 원 · '읽어 둔 장면' 띠(ui/timeBar.ts)가 쓴다. '읽어 둔 장면'(cachedSteps)은 쓰는 배열이 모두 캐시에 있는 시점이다.
'전 시점 범위'(scanRange)는 모든 저장 시점에서 배열 하나의 최소~최대만 읽는다: 캐시에 있거나 읽는 중인 (시점, 배열)은 그 값을 쓰고, 없으면 파일에서
그 배열 바이트만 읽는다. 읽은 것은 캐시에 넣지 않는다(재생용 캐시를 밀어내지 않게). 한꺼번에 1~4 시점, 멈춤 신호, 못 읽은 시점 모음.
모든 시점을 읽는 점은 ParaView 'Rescale to Data Range over All Timesteps' 와 같고, 읽는 것은 데이터 전체 배열이다(PV와 다름 — PV 는 그 표현의 입력,
곧 필터 출력의 전 시점 정보. 명세 §3).
받기 줄 차례(2026-11-06 밤 — rangeGovernor 의 우선 줄, 서버가 끊기거나 느려져 단계를 낮춘 뒤 자리가 모자랄 때): 보는 장면(step — setStep · Field 를 바꿔
지금 장면에 배열 더 읽기 · 처음 열기)이 미리 읽기(prefetch · prefetchAhead)보다, 미리 읽기가 전 시점 범위(scanRange)보다 먼저 선다. 미리 읽던 묶음을 보는 장면이
기다리게 되면 그 묶음의 남은 요청을 앞당긴다(묶음마다 { level, turn } 하나 — 헤더 읽기는 기다리는 묶음 가운데 가장 앞 차례). 보는 장면끼리는 나중에 부른
묶음이 먼저 받는다(turn — 밀대를 끌다 멈춘 마지막 장면이 먼저 오게, 지나간 장면의 읽기는 끊지 않고 뒤로).
*/
/******************************************************************************/
import { PointDataset, ScalarField, VectorField, VectorMapping } from './pointDataset';
import { ResultScan } from './resultSet';
import { ByteSource, HttpSource } from './source';
import { minMaxMapped } from './rangeScan';
import { scanConcurrency } from '../core/colorRange';
import { VtuHeader, VtuTopology, datasetFrom, elementSize, readVtmBlocks, readVtuArrayMinMax, readVtuFields, readVtuHeader, readVtuTopology } from './loaders/vtu_loader';
import { releaseTopology } from './decodeClient';
import { PRIORITY_PREFETCH, PRIORITY_SCAN, PRIORITY_VIEW, ReadPriority, nextReadTurn, priorityLevel, priorityTurn } from './rangeGovernor';

export interface TimeSeriesOptions {
  /** 지금 쓰는 배열 — 저장 시점마다 읽을 값 배열 이름(첫 값 = init 이 읽는 배열). 바꾸려면 useArrays */
  arrays: string[];
  solidArray?: string;
  blocks?: number[];           // 읽을 블록 index (기본: 셀이 있는 블록 전부)
  cacheBytes?: number;         // 캐시 예산 (기본 768 MB)
  onProgress?: (msg: string) => void;
  /**
   * 저장 시점 하나의 값 읽기 진행(기다리는 읽기 · 미리 읽기 모두). done · total = 다 읽은 · 읽을 배열 바이트(첫 저장 헤더의 셀 수 × 성분 × 원소 크기, 블록 합) —
   * 그 시점에서 빠진 배열 묶음만 센다(캐시에 있는 배열은 세지 않음). 같은 시점에 다른 묶음이 또 붙으면 그 몫을 total 에 더한다.
   * 읽기를 시작할 때(done 0), 배열 하나를 읽기 시작할 때마다(그 앞 배열까지의 합), 묶음을 다 읽었을 때(마지막 묶음이면 done = total) 부른다. total 0 = 모름
   */
  onStepProgress?: (n: number, done: number, total: number) => void;
  /** 읽어 둔 시점 목록(cachedSteps)이 바뀔 수 있을 때 (배열 묶음 하나를 넣음 · 예산을 넘어 버림 · 쓰는 배열을 바꿈 · 캐시를 비움) — 묶음 하나에 한 번 */
  onCacheChange?: () => void;
}

/** (시점, 배열) 캐시 항목. perBlock = 위상(블록) 차례의 값 — null 은 그 블록 파일에 그 배열이 없음(또는 셀이 없는 블록): 다시 읽지 않는다 */
interface ArrayEntry { n: number; array: string; perBlock: (ScalarField | VectorField | null)[]; bytes: number }
/** 빠진 배열 묶음 하나의 읽기 — 끝나면 배열 이름 → 항목 (그 묶음의 배열마다 inflight 에 같은 약속으로 걸린다) */
type Batch = Promise<Map<string, ArrayEntry>>;
/**
 * 묶음 하나의 줄 차례(바이트 구간 받기 — rangeGovernor). 미리 읽던 묶음을 보는 장면이 기다리게 되면 올린다(stepAt).
 * turn = 부른 차례(nextReadTurn) — 보는 장면끼리는 나중에 부른 묶음이 먼저 받는다(밀대를 끌다 멈춘 마지막 장면). 보는 장면이 다시 부르면 새로 매긴다
 */
interface BatchPriority { level: number; turn: number }
const entryKey = (n: number, array: string): string => `${n}|${array}`;
/** 서버가 바이트 범위 요청을 무시해 파일 전체를 받아 둔 원본인가 (HttpSource.whole — 헤더 표가 들고 있으면 파일 전체가 캐시 예산 밖에 남는다) */
const holdsWholeFile = (src: ByteSource): boolean => src instanceof HttpSource && src.wholeFile;

/** 미리 읽기가 쓸 수 있는 캐시 예산 몫 — 나머지는 지금 보는 시점과 지난 시점 몫 */
export const PREFETCH_BUDGET_SHARE = 0.6;

/** 전 시점 범위 읽기 (scanRange) */
export interface RangeScanOptions {
  array: string;                       // VTU 배열 이름 (fieldKey 'vector:velocity' → 'velocity')
  mapping: VectorMapping;              // 벡터면 크기·X·Y·Z (스칼라면 무시)
  masks?: Map<string, Uint8Array>;     // 블록(레벨) 이름 → 그 위상의 점마다 쓸지(다중 레벨에서 고운 레벨이 덮은 굵은 셀을 뺌 — LevelData.keep). 없으면 남긴 셀 전부
  concurrency?: number;                // 한꺼번에 읽는 시점 수 (기본: 시점당 배열 바이트로 정함 — colorRange.ts scanConcurrency)
  signal?: AbortSignal;
  onStep?: (p: RangeScanProgress) => void; // 시점 하나가 끝날 때마다 (못 읽은 것 포함)
}
export interface RangeScanProgress { done: number; total: number; failed: number; wholeFiles: boolean }
export interface RangeScanResult {
  min: number; max: number;            // 읽은 시점 전체의 최소·최대 (used 0 이면 Infinity · -Infinity)
  magMax: number;                      // 읽은 시점 전체의 벡터 크기 최대 — 성분(X·Y·Z)일 때 '모두 같음' 문턱 하한(colorRange.ts componentFlatFloor). 스칼라·크기로 칠하면 -Infinity 일 수 있다
  used: number; total: number;
  failed: { n: number; reason: string }[];          // 저장 번호 순
  steps: { n: number; min: number; max: number }[]; // 읽은 시점마다 (저장 번호 순)
  aborted: boolean;
  wholeFiles: boolean;                 // 서버가 바이트 범위 읽기를 받지 않아 파일 전체를 받았다 (그 뒤로는 한 번에 한 시점)
}

export class TimeSeries {
  readonly scan: ResultScan;
  private readonly opts: TimeSeriesOptions;
  private topologies: VtuTopology[] = [];
  private blockIndices: number[] = [];
  private readonly cache = new Map<string, ArrayEntry>(); // 열쇠 entryKey(시점, 배열), 삽입 순서 = 최근 사용 순서
  private cacheBytes = 0;
  private readonly inflight = new Map<string, Batch>();   // 열쇠 entryKey — 읽는 중인 (시점, 배열)
  /** 읽는 중인 시점의 진행 (묶음이 시작할 때 넣거나 더하고, 그 시점의 묶음이 모두 끝나면 뺀다) */
  private readonly progress = new Map<number, { done: number; total: number; runs: number }>();
  private vtmBlocks = new Map<number, { index: number; path: string }[]>();
  /** 배열 이름 → 첫 저장 헤더 차례 (읽는 블록을 차례로 훑어 처음 나온 자리) — 데이터셋의 배열 차례 */
  private readonly headerOrder = new Map<string, number>();
  /** 쓰는 배열을 바꾼 횟수 (미리 읽기 고리가 이미 지난 시점도 새 배열로 다시 보게) */
  private arraysGen = 0;
  /** 미리 읽을 차례 (prefetchAhead 가 바꾼다) · 그 고리가 도는 중인지 · 미리 읽다 실패한 시점(다시 미리 읽지 않음) */
  private wanted: number[] = [];
  private prefetching = false;
  private readonly prefetchFailed = new Set<number>();
  /**
   * (시점, 블록 파일 경로) → 그 파일의 헤더 (source = 연 파일). 묶음마다 HEAD 와 헤더(앞 64 KB)를 다시 받지 않게 들고 있다가 다시 쓴다.
   * 같은 때 두 묶음이 같은 파일을 찾으면 같은 약속을 기다린다. 실패한 약속은 빼고(다음에 다시 읽음), 그 시점 항목이 모두 버려지면 그 시점 것을 지운다(dropHeadsIfUnused).
   * 파일 전체를 받아 둔 원본(holdsWholeFile — 바이트 범위를 무시하는 서버)과 셀이 없는 블록의 헤더는 쓴 뒤 바로 뺀다(forgetHead)
   */
  private readonly heads = new Map<number, Map<string, Promise<VtuHeader>>>();
  /** 읽는 중인 헤더를 기다리는 묶음들의 줄 차례 — 헤더 읽기는 그 가운데 가장 앞 차례로 선다(나중에 보는 장면 묶음이 기다리면 앞당겨짐) */
  private readonly headWaiters = new WeakMap<Promise<VtuHeader>, ReadPriority[]>();
  /** 묶음 → 그 줄 차례 (보는 장면이 미리 읽던 묶음을 기다리게 되면 올린다) */
  private readonly batchPriority = new WeakMap<Batch, BatchPriority>();
  /** 더 쓰지 않는 시간축 (dispose) */
  private disposed = false;
  /** dispose 때 끊는다 — 묶음 읽기(.vtm · 파일 열기 · 헤더 · 배열)가 이 signal 을 쓴다. 닫은 뒤에는 읽던 요청도 끊기고 다시 보내지 않는다 */
  private readonly life = new AbortController();

  constructor(scan: ResultScan, opts: TimeSeriesOptions) {
    this.scan = scan;
    this.opts = { ...opts };
    this.blockIndices = opts.blocks ?? scan.blocks.filter((b) => b.numCells > 0).map((b) => b.index);
    for (const b of scan.blocks) {
      if (!this.blockIndices.includes(b.index)) continue;
      for (const a of b.arrays) if (!this.headerOrder.has(a.name)) this.headerOrder.set(a.name, this.headerOrder.size);
    }
    this.opts.arrays = this.inHeaderOrder(opts.arrays);
  }

  /** 지금 쓰는 배열 (첫 저장 헤더 차례) */
  get arrays(): readonly string[] { return this.opts.arrays; }
  get stepCount(): number { return this.scan.steps.length; }
  get budget(): number { return this.opts.cacheBytes ?? 768 * 1024 * 1024; }
  get cachedBytes(): number { return this.cacheBytes; }

  /**
   * 쓰는 배열이 모두 캐시에 있는 저장 번호 (최근 사용 순서 — 그 시점의 쓰는 배열 가운데 가장 최근에 쓴 것 기준). 재생 막대의 '읽어 둔 장면' 띠 · setStep 의 캐시 판정.
   * 쓰는 배열이 하나도 없으면 읽을 것이 없으므로 모든 시점
   */
  cachedSteps(): number[] {
    if (!this.opts.arrays.length) return this.scan.steps.map((s) => s.n);
    const used = new Set(this.opts.arrays);
    const last = new Map<number, number>();
    let i = 0;
    for (const e of this.cache.values()) if (used.has(e.array)) last.set(e.n, i++);
    return Array.from(last).filter(([n]) => this.hasArrays(n)).sort((a, b) => a[1] - b[1]).map(([n]) => n);
  }
  /** n번 저장에 그 배열들(기본: 쓰는 배열)이 모두 캐시에 있는가 (그 파일에 없다고 적어 둔 배열도 '있음' — 더 읽을 것이 없다) */
  hasArrays(n: number, arrays: readonly string[] = this.opts.arrays): boolean {
    return arrays.every((a) => this.cache.has(entryKey(n, a)));
  }
  /** n번 저장에서 아직 캐시에 없는 배열 (읽는 중인 것 포함, 기본: 쓰는 배열 가운데) — 기다리는 동안 '<배열> 읽는 중' 을 띄울 때 */
  missingArrays(n: number, arrays: readonly string[] = this.opts.arrays): string[] {
    return arrays.filter((a) => !this.cache.has(entryKey(n, a)));
  }
  /** 캐시된 n번 저장의 값 — 쓰는 배열(또는 arrays)이 모두 있을 때만 (읽지 않고, 최근 사용 순서도 바꾸지 않는다). 없으면 null. 받은 쪽은 값을 고치지 않는다 */
  peek(n: number, arrays: readonly string[] = this.opts.arrays): readonly PointDataset[] | null {
    const list = this.inHeaderOrder(arrays);
    if (!this.hasArrays(n, list)) return null;
    return this.assemble(list, new Map(list.map((a) => [a, this.cache.get(entryKey(n, a))!])));
  }
  /**
   * 캐시에 있는 저장 시점 모두에서 그 배열·성분의 최소~최대를 합친 것 (파일은 읽지 않고 최근 사용 순서도 바꾸지 않는다. 셀은 전 시점 범위 읽기와 같다 — masks).
   * (시점, 배열) 항목을 바로 본다 — 쓰는 배열이 아니어도 캐시에 남아 있으면 센다. 그 배열이 없는 시점은 건너뛰고, 값이 하나도 없으면 null.
   * AppCore.knownRangeOf 가 값 밀대의 양 끝을 정할 때 부른다(노드를 만들 때 · Field·Component 를 바꿀 때 · 미정 끝을 정할 때 — 장면마다 부르지 않는다).
   * 훑는 양은 캐시 예산이 묶는다(768 MB 안의 그 배열 하나)
   */
  cachedRange(array: string, mapping: VectorMapping, masks: Map<string, Uint8Array>): { min: number; max: number } | null {
    let min = Infinity, max = -Infinity;
    for (const e of this.cache.values()) {
      if (e.array !== array) continue;
      const r = this.minMaxOfEntry(e, { array, mapping, masks });
      if (!r) continue;
      if (r.min < min) min = r.min;
      if (r.max > max) max = r.max;
    }
    return min <= max ? { min, max } : null;
  }
  /** 읽는 중인 n번 저장의 진행 (onStepProgress 와 같은 값). 읽는 중이 아니면 null. step(n) 을 부른 바로 뒤부터 있다(묶음이 기다리기 전에 넣는다) */
  loadProgress(n: number): { done: number; total: number } | null {
    const p = this.progress.get(n);
    return p ? { done: p.done, total: p.total } : null;
  }

  /**
   * 위상을 읽고 첫 시점의 값(쓰는 배열만 — 생성자 opts.arrays)을 돌려준다. 위상을 읽을 때 읽은 헤더는 첫 시점 값 읽기가 다시 쓴다
   * (셀이 없는 블록의 헤더는 값을 읽지 않으므로 바로 놓고, 파일 전체를 받아 둔 원본은 첫 시점 값 읽기가 끝나면 놓는다)
   */
  async init(): Promise<PointDataset[]> {
    const first = this.scan.steps[0];
    const blocks = await this.blocksAt(first.n, this.life.signal);
    this.topologies = [];
    const whole: [string, Promise<VtuHeader>][] = [];
    try {
      for (const b of blocks) {
        const hp = this.headerAt(first.n, b.path);
        const h = await hp;
        const name = this.scan.blocks.find((x) => x.index === b.index)?.name ?? `block${b.index}`;
        const topo = await readVtuTopology(h.source, name, { arrays: [], solidArray: this.opts.solidArray, onProgress: this.opts.onProgress }, h);
        this.topologies.push(topo);
        if (topo.count === 0) this.forgetHead(first.n, b.path, hp);
        else if (holdsWholeFile(h.source)) whole.push([b.path, hp]);
      }
      return await this.step(first.n);
    } finally {
      for (const [path, hp] of whole) this.forgetHead(first.n, path, hp); // 묶음이 없었어도(쓰는 배열 없음 · 실패) 파일 전체를 들고 있지 않는다
    }
  }

  /**
   * 이 시간축을 더 쓰지 않는다 (다른 데이터를 열 때 — AppCore). 미리 읽기를 멈추고, Worker 에 보내 둔 위상(남긴 셀 번호) 사본을 바로 지우고(FinalizationRegistry 를
   * 기다리지 않게), 값 캐시 · 헤더를 비운다. 읽는 중인 묶음은 지금 받던 요청(.vtm · 파일 열기 · 헤더 · 배열)을 끊고(다시 보내지 않음) '닫은 시간축입니다.'로 끝난다
   * (그때 Worker 에 다시 보낸 위상도 지운다)
   */
  dispose(): void {
    this.disposed = true;
    this.life.abort(new Error('닫은 시간축입니다.'));
    this.stopPrefetch();
    for (const t of this.topologies) releaseTopology(t.kept);
    this.cache.clear();
    this.cacheBytes = 0;
    this.heads.clear();
    this.prefetchFailed.clear();
  }

  /**
   * (시점, 블록 파일)의 헤더 — 들고 있으면 그것, 없으면 파일을 열어(HEAD) 헤더를 읽고 든다. XML 글(text)은 버린다(배열 위치·형식·셀 수만 쓴다).
   * 여는 요청은 시간축이 닫히면 끊긴다(life). priority = 부른 묶음의 줄 차례 — 읽는 중인 헤더를 다른 묶음이 또 기다리면 그 차례도 더한다(가장 앞 차례로 섬)
   */
  private headerAt(n: number, path: string, priority: ReadPriority = PRIORITY_VIEW): Promise<VtuHeader> {
    let m = this.heads.get(n);
    if (!m) { m = new Map(); this.heads.set(n, m); }
    const had = m.get(path);
    if (had) { this.headWaiters.get(had)?.push(priority); return had; }
    const signal = this.life.signal;
    const waiters: ReadPriority[] = [priority];
    const levelOf = (): number => Math.min(...waiters.map(priorityLevel));
    const shared = {
      get level(): number { return levelOf(); },
      /** 가장 앞 차례로 기다리는 묶음 가운데 가장 나중에 부른 것의 turn (보는 장면끼리는 나중에 부른 것이 먼저) */
      get turn(): number | undefined {
        const lv = levelOf();
        let t: number | undefined;
        for (const w of waiters) { const wt = priorityTurn(w); if (priorityLevel(w) === lv && wt !== undefined && (t === undefined || wt > t)) t = wt; }
        return t;
      },
    };
    const p = (async (): Promise<VtuHeader> => {
      const src = await this.scan.folder.file(path, signal);
      if (!src) throw new Error(`블록 파일이 없습니다: ${path}`);
      return { ...(await readVtuHeader(src, signal, shared)), text: '' };
    })();
    m.set(path, p);
    this.headWaiters.set(p, waiters);
    const done = (): void => { this.headWaiters.delete(p); };
    p.then(done, done);
    p.catch(() => this.forgetHead(n, path, p)); // 실패한 헤더는 들고 있지 않는다 (다음 묶음이 다시 읽는다)
    return p;
  }

  /** (시점, 블록 파일)의 헤더 표 항목을 뺀다 — 그 자리가 아직 이 약속일 때만(그 사이 새로 연 것은 둔다). 그 시점이 비면 시점 자리도 */
  private forgetHead(n: number, path: string, p: Promise<VtuHeader>): void {
    const m = this.heads.get(n);
    if (!m || m.get(path) !== p) return;
    m.delete(path);
    if (!m.size) this.heads.delete(n);
  }

  /** n번 저장의 헤더를 더 쓸 데가 없으면(그 시점 항목이 하나도 없고 읽는 중인 다른 묶음도 없음) 지운다. except = 지금 끝나는 묶음의 배열(아직 '읽는 중'에 걸려 있다) */
  private dropHeadsIfUnused(n: number, except: readonly string[] = []): void {
    if (!this.heads.has(n)) return;
    for (const e of this.cache.values()) if (e.n === n) return;
    const prefix = `${n}|`;
    for (const k of this.inflight.keys()) if (k.startsWith(prefix) && !except.includes(k.slice(prefix.length))) return;
    this.heads.delete(n);
  }

  /**
   * 지금 쓰는 배열을 바꾼다 (캐시는 둔다 — 안 쓰게 된 배열은 예산을 넘을 때 먼저 버린다). 다음 step() · 미리 읽기부터 새 배열 기준으로 읽는다.
   * 미리 읽다 실패한 시점 목록을 비우고(새 배열로 다시 미리 읽어 본다) 캐시 바뀜을 알린다('읽어 둔 장면'이 달라진다). 같은 배열 목록이면 아무것도 하지 않는다
   */
  useArrays(arrays: readonly string[]): void {
    const next = this.inHeaderOrder(arrays);
    const cur = new Set(this.opts.arrays);
    if (next.length === cur.size && next.every((a) => cur.has(a))) return;
    this.opts.arrays = next;
    this.arraysGen++;
    this.prefetchFailed.clear();
    this.opts.onCacheChange?.();
  }

  /** 캐시를 비운다 (값만 — 블록 목록 .vtm 은 남는다). 미리 읽다 실패한 시점 목록도 비운다. 비울 것이 있었으면 캐시 바뀜을 알린다 */
  clearCache(): void {
    const had = this.cache.size > 0;
    this.dropCache();
    if (had) this.opts.onCacheChange?.();
  }

  /** 쓰는 배열을 바꾸고 캐시를 비운다 (useArrays + clearCache — 시험이 '캐시 비우기'로 쓴다). 비울 것이 있었을 때만 캐시 바뀜을 한 번 알린다 */
  setArrays(arrays: readonly string[]): void {
    const had = this.cache.size > 0;
    this.opts.arrays = this.inHeaderOrder(arrays);
    this.arraysGen++;
    this.dropCache();
    if (had) this.opts.onCacheChange?.();
  }

  private dropCache(): void {
    this.cache.clear();
    this.cacheBytes = 0;
    this.heads.clear(); // 헤더도 그 시점 항목과 함께 (읽는 중인 묶음은 이미 받은 헤더를 그대로 쓴다)
    this.prefetchFailed.clear(); // 비운 뒤에는 다시 미리 읽어 본다
  }

  /**
   * n번 저장의 값 — 쓰는 배열(arrays 를 주면 그 배열)이 모두 든 블록별 데이터셋 (배열 차례는 첫 저장 헤더 차례, 그 블록 파일에 없는 배열은 빠진다).
   * 캐시에 있는 배열은 바로 꺼내고(최근 사용으로 옮김), 같은 (시점, 배열)을 읽는 중이면 그 읽기를 기다리고, 빠진 배열만 한 묶음으로 읽는다.
   * 모두 캐시에 있으면 파일을 읽지 않는다. 돌려주는 데이터셋은 부를 때마다 새로 짠 것이다: 받는 쪽(레벨 데이터셋)이 scalars·vectors를 바꿔 끼워도
   * 캐시가 더럽혀지지 않게. 기다리는 동안 그 항목이 예산 때문에 버려져도 돌려주는 값은 갖춰져 있다(읽은 묶음의 항목을 그대로 쓴다).
   * 지금 보는 장면의 읽기다(setStep · Field 를 바꿔 지금 장면에 배열 더 읽기 · 처음 열기) — 받기 줄에서 미리 읽기 · 전 시점 범위보다 먼저 서고,
   * 미리 읽던 묶음을 기다리게 되면 그 묶음도 앞당긴다
   */
  step(n: number, arrays: readonly string[] = this.opts.arrays): Promise<PointDataset[]> {
    return this.stepAt(n, arrays, PRIORITY_VIEW);
  }

  /** step 의 몸통. level = 이 읽기의 줄 차례 (보는 장면 PRIORITY_VIEW · 미리 읽기 PRIORITY_PREFETCH) */
  private stepAt(n: number, arrays: readonly string[], level: number): Promise<PointDataset[]> {
    if (!this.scan.steps.some((s) => s.n === n)) return Promise.reject(new Error(`저장 ${n}이 없습니다.`));
    const list = this.inHeaderOrder(arrays);
    const got = new Map<string, ArrayEntry>();
    const waits: Promise<void>[] = [];
    const missing: string[] = [];
    for (const a of list) {
      const k = entryKey(n, a);
      const hit = this.cache.get(k);
      if (hit) { this.cache.delete(k); this.cache.set(k, hit); got.set(a, hit); continue; } // 최근 사용으로 옮김
      const running = this.inflight.get(k);
      if (running) {
        const p = this.batchPriority.get(running);
        if (p && level < p.level) p.level = level; // 보는 장면이 미리 읽던 묶음을 기다린다 — 그 묶음의 남은 요청을 앞당긴다
        if (p && level === PRIORITY_VIEW) p.turn = nextReadTurn(); // 보는 장면이 지금 부름 — 보는 장면끼리는 나중에 부른 것이 먼저
        waits.push(running.then((m) => { const e = m.get(a); if (e) got.set(a, e); }));
      } else missing.push(a);
    }
    if (missing.length) waits.push(this.startBatch(n, missing, level).then((m) => { for (const [a, e] of m) got.set(a, e); }));
    if (!waits.length) return Promise.resolve(this.assemble(list, got));
    return Promise.all(waits).then(() => this.assemble(list, got));
  }

  /** 미리 읽기 (결과는 캐시에만 — 받기 줄에서 보는 장면 뒤에 선다). 쓰는 배열이 모두 캐시에 있거나 읽는 중이면 아무것도 하지 않는다 */
  prefetch(n: number): void {
    if (!this.scan.steps.some((s) => s.n === n)) return;
    if (this.opts.arrays.every((a) => { const k = entryKey(n, a); return this.cache.has(k) || this.inflight.has(k); })) return;
    void this.stepAt(n, this.opts.arrays, PRIORITY_PREFETCH).catch(() => { /* 재생 중 미리 읽기 실패는 조용히 */ });
  }

  /** 시점 하나의 값 바이트 (쓰는 배열 합, 첫 저장 헤더 기준 — 캐시 예산으로 미리 읽을 수를 정할 때) */
  stepBytes(): number {
    let sum = 0;
    for (const a of this.opts.arrays) sum += this.arrayBytesPerStep(a);
    return sum;
  }

  /**
   * 앞으로 볼 시점들(저장 번호, 볼 차례대로)을 차례로 미리 읽는다 — 한 번에 하나씩(서버 연결을 다 쓰지 않게), 부를 때마다 차례를 새로 바꾼다.
   * 캐시 예산의 PREFETCH_BUDGET_SHARE 안에 드는 수만 읽는다(넘게 읽으면 아직 안 본 미리 읽은 시점을 서로 밀어낸다). 읽는 것은 쓰는 배열뿐이다.
   * 2026-11-06 사용자: 다음 하나만 미리 읽어서는 망이 잠깐 멈출 때 도움이 안 된다 → 재생 중에는 예산 안에서 앞으로 볼 시점을 계속 읽어 둔다
   */
  prefetchAhead(ns: number[]): void {
    // 시점 하나의 바이트: 쓰는 배열을 첫 저장 헤더로 센 값과 실제로 캐시에 든 그 배열들의 평균(벡터 크기 배열 등이 더해진다) 중 큰 것
    const per = Math.max(this.stepBytes(), this.cachedStepBytes());
    const cap = per > 0 ? Math.max(1, Math.floor((this.budget * PREFETCH_BUDGET_SHARE) / per)) : ns.length;
    const known = new Set(this.scan.steps.map((s) => s.n));
    this.wanted = ns.filter((n) => known.has(n)).slice(0, cap);
    void this.pumpPrefetch();
  }

  /** 미리 읽기를 멈춘다 (다른 데이터를 열 때). 읽는 중인 시점 하나는 끝까지 읽는다 */
  stopPrefetch(): void { this.wanted = []; }

  /** 이제까지의 미리 읽기 차례 (시험용) */
  get prefetchQueue(): readonly number[] { return this.wanted; }
  /** 미리 읽기 고리가 도는 중인가 (시험용) */
  get prefetchRunning(): boolean { return this.prefetching; }

  /** 캐시에 든 쓰는 배열의 시점당 평균 바이트 합 (배열마다 그 배열 항목의 평균 — 아직 없는 배열은 0) */
  private cachedStepBytes(): number {
    const used = new Set(this.opts.arrays);
    const acc = new Map<string, { sum: number; count: number }>();
    for (const e of this.cache.values()) {
      if (!used.has(e.array)) continue;
      const s = acc.get(e.array) ?? { sum: 0, count: 0 };
      s.sum += e.bytes; s.count++;
      acc.set(e.array, s);
    }
    let per = 0;
    for (const s of acc.values()) per += s.sum / s.count;
    return per;
  }

  /**
   * 미리 읽기 차례를 앞에서부터 하나씩 읽는다 (이미 돌고 있으면 그 고리가 새 차례를 이어 읽는다).
   * 한 고리 안에서는 같은 시점을 두 번 읽지 않는다 — 시점 크기를 낮게 어림해 예산을 넘으면 읽어 둔 것이 서로 밀어내며 끝없이 다시 읽을 수 있어서.
   * 다만 쓰는 배열이 바뀌면(useArrays) 이미 지난 시점도 새 배열로 다시 본다. 고리는 읽을 것이 없으면 끝나고, 다음 prefetchAhead 가 새 고리를 연다
   */
  private async pumpPrefetch(): Promise<void> {
    if (this.prefetching) return;
    this.prefetching = true;
    let gen = this.arraysGen;
    let done = new Set<number>();
    try {
      for (;;) {
        if (gen !== this.arraysGen) { gen = this.arraysGen; done = new Set<number>(); }
        const n = this.wanted.find((x) => !this.hasArrays(x) && !this.prefetchFailed.has(x) && !done.has(x));
        if (n === undefined) return;
        done.add(n);
        try { await this.stepAt(n, this.opts.arrays, PRIORITY_PREFETCH); } // 이미 읽는 중(재생이 기다리는 읽기)이면 그것을 기다린다
        catch { this.prefetchFailed.add(n); } // 실패한 시점은 미리 읽기에서 뺀다(재생이 그 시점에 닿으면 다시 읽고 실패를 알린다)
      }
    } finally {
      this.prefetching = false;
    }
  }

  /** n번 저장의 블록 목록 (.vtm — 한 번 읽으면 든다). signal: 멈추면 .vtm 열기(HEAD) · 읽기를 버린다(전 시점 범위 [취소] · 닫은 시간축). priority: 읽기의 줄 차례 */
  private async blocksAt(n: number, signal?: AbortSignal, priority: ReadPriority = PRIORITY_VIEW): Promise<{ index: number; path: string }[]> {
    let list = this.vtmBlocks.get(n);
    if (!list) {
      const step = this.scan.steps.find((s) => s.n === n);
      if (!step) throw new Error(`저장 ${n}이 없습니다.`);
      list = (await readVtmBlocks(this.scan.folder, step.vtm, signal, priority)).filter((b) => this.blockIndices.includes(b.index));
      this.vtmBlocks.set(n, list);
    }
    return list;
  }

  /** 저장 시점의 블록 목록에서 위상 하나의 파일 (이름으로 짝짓고, 없으면 같은 차례) — 묶음 읽기와 scanRange 가 같은 파일을 읽게 함께 쓴다 */
  private blockFor(blocks: { index: number; path: string }[], topo: VtuTopology, i: number): { index: number; path: string } | undefined {
    return blocks.find((x) => this.scan.blocks.find((sb) => sb.index === x.index)?.name === topo.name) ?? blocks[i];
  }

  /** 배열 하나의 시점당 바이트 (첫 저장 헤더의 셀 수 × 성분 수 × 원소 크기, 읽는 블록 합) */
  arrayBytesPerStep(name: string): number {
    let sum = 0;
    for (const b of this.scan.blocks) {
      if (b.numCells === 0 || !this.blockIndices.includes(b.index)) continue;
      const a = b.arrays.find((x) => x.name === name);
      if (a) sum += b.numCells * a.components * elementSize(a.type);
    }
    return sum;
  }

  /**
   * 전 시점 범위: 모든 저장 시점에서 배열 하나(opts.array, 성분 opts.mapping)의 최소~최대. 값은 화면과 같은 float32, 고체 셀은 위상에서 이미 빠지고
   * 다중 레벨의 가려진 굵은 셀은 opts.masks 로 뺀다 — 시간축이 1장면이면 '데이터 범위'(합친 데이터셋)와 같다.
   * 시점마다: 그 (시점, 배열)이 캐시에 있으면 그 값(쓰는 배열이 아니어도), 다른 곳(setStep·미리 읽기)이 읽는 중이면 그것을 기다려 쓰고, 아니면 파일에서 헤더 + 그 배열만.
   * 한 시점의 어느 블록이든 실패하면 그 시점 전체를 '못 읽음'으로 센다(반쪽 값을 쓰지 않게). 멈추면 새 읽기를 내지 않고 나가 있던 것은 버린다.
   * 시점 하나가 끝날 때마다 한 번 양보한다(캐시에서만 꺼내도 진행 글이 그려지고 화면이 멈추지 않게).
   * 서버가 바이트 범위를 받는지는 첫 파일 읽기에서 안다: 첫 일꾼이 파일에서 읽는 시점 하나를 끝낼 때까지(캐시에서 꺼낸 시점은 세지 않음) 다른 일꾼은 기다린다 —
   * 받지 않는 서버에서 처음부터 여러 파일 전체가 한꺼번에 메모리에 오르지 않게. 일꾼 하나가 예외로 끝나면(진행 알림 onStep 의 예외 등) 다른 일꾼도 새 시점을 맡지 않는다.
   */
  async scanRange(opts: RangeScanOptions): Promise<RangeScanResult> {
    if (!this.topologies.length) throw new Error('위상을 아직 읽지 않았습니다.');
    const steps = this.scan.steps, total = steps.length;
    const got: { n: number; min: number; max: number; magMax: number }[] = [];
    const failed: { n: number; reason: string }[] = [];
    const aborted = () => !!opts.signal?.aborted;
    const conc = Math.max(1, Math.floor(opts.concurrency ?? scanConcurrency(this.arrayBytesPerStep(opts.array))));
    let next = 0, done = 0, wholeFiles = false, broken = false;
    let releaseOthers!: () => void;
    const probed = new Promise<void>((r) => { releaseOthers = r; });
    const worker = async (w: number): Promise<void> => {
      try {
        if (w > 0) await probed;
        // 서버가 바이트 범위를 받지 않으면(파일 전체를 받음) 첫 일꾼만 남는다 — 파일 전체가 여럿 메모리에 올라가지 않게
        while (next < total && !aborted() && !broken && !(wholeFiles && w > 0)) {
          const n = steps[next++].n;
          let fromFile = true;
          try {
            const r = await this.scanStep(n, opts, () => { wholeFiles = true; });
            if (aborted()) return;
            fromFile = r.fromFile;
            got.push({ n, min: r.min, max: r.max, magMax: r.magMax });
          } catch (e) {
            if (aborted()) return;
            failed.push({ n, reason: e instanceof Error ? e.message : String(e) });
          }
          if (w === 0 && fromFile) releaseOthers();
          done++;
          opts.onStep?.({ done, total, failed: failed.length, wholeFiles });
          await new Promise((r) => setTimeout(r, 0));
        }
      } catch (e) {
        broken = true;
        throw e;
      } finally {
        if (w === 0) releaseOthers(); // 첫 일꾼이 끝나면(모두 캐시였거나 멈춤·예외) 기다리는 일꾼을 푼다 — 그들은 남은 시점이 없거나 멈춤을 보고 바로 나간다
      }
    };
    await Promise.all(Array.from({ length: Math.min(conc, total) }, (_, w) => worker(w)));
    got.sort((a, b) => a.n - b.n);
    failed.sort((a, b) => a.n - b.n);
    let min = Infinity, max = -Infinity, magMax = -Infinity;
    for (const s of got) { if (s.min < min) min = s.min; if (s.max > max) max = s.max; if (s.magMax > magMax) magMax = s.magMax; }
    return { min, max, magMax, used: got.length, total, failed, steps: got.map(({ n, min: a, max: b }) => ({ n, min: a, max: b })), aborted: aborted(), wholeFiles };
  }

  /** 시점 하나의 최소~최대 (+ 벡터 크기 최대 — minMaxMapped). fromFile = 파일에서 읽음(캐시·읽는 중인 값을 쓰면 거짓). 값이 하나도 없으면 예외 */
  private async scanStep(n: number, opts: RangeScanOptions, markWhole: () => void): Promise<{ min: number; max: number; magMax: number; fromFile: boolean }> {
    const k = entryKey(n, opts.array);
    let e: ArrayEntry | null = this.cache.get(k) ?? null; // 최근 사용 순서는 바꾸지 않는다(peek 과 같음)
    if (!e) { const running = this.inflight.get(k); if (running) e = (await running.catch(() => null))?.get(opts.array) ?? null; }
    const fromCache = e ? this.minMaxOfEntry(e, opts) : null;
    if (fromCache) return { ...fromCache, fromFile: false };
    const blocks = await this.blocksAt(n, opts.signal, PRIORITY_SCAN); // [취소]면 .vtm 열기 · 읽기도 끊는다 (뒤에서 다시 보내지 않게). 받기 줄에서는 보는 장면 · 미리 읽기 뒤
    let min = Infinity, max = -Infinity, magMax = -Infinity, count = 0;
    for (let i = 0; i < this.topologies.length; i++) {
      const topo = this.topologies[i];
      if (topo.count === 0) continue;
      opts.signal?.throwIfAborted();
      const b = this.blockFor(blocks, topo, i);
      if (!b) throw new Error(`저장 ${n}에 ${topo.name} 블록이 없습니다.`);
      const src = await this.scan.folder.file(b.path, opts.signal); // 서버면 HEAD — [취소]면 끊는다
      if (!src) throw new Error(`블록 파일이 없습니다: ${b.path}`);
      const r = await readVtuArrayMinMax(src, topo, opts.array, opts.mapping, opts.masks?.get(topo.name) ?? null, opts.signal, PRIORITY_SCAN);
      if (src instanceof HttpSource && src.wholeFile) markWhole();
      if (r.min < min) min = r.min;
      if (r.max > max) max = r.max;
      if (r.magMax > magMax) magMax = r.magMax;
      count += r.count;
    }
    if (!count) throw new Error(`${opts.array} 값이 모두 비어 있습니다.`);
    return { min, max, magMax, fromFile: true };
  }

  /** 캐시된(또는 막 읽힌) (시점, 배열) 항목에서 최소~최대 (+ 벡터 크기 최대). 셀이 있는 블록 가운데 하나라도 그 배열이 없으면 null(파일에서 읽는다) */
  private minMaxOfEntry(e: ArrayEntry, opts: RangeScanOptions): { min: number; max: number; magMax: number } | null {
    let min = Infinity, max = -Infinity, magMax = -Infinity, count = 0;
    for (let i = 0; i < this.topologies.length; i++) {
      const topo = this.topologies[i];
      if (topo.count === 0) continue;
      const f = e.perBlock[i];
      if (!f) return null;
      const mask = opts.masks?.get(topo.name) ?? null;
      // 캐시 값은 이미 float32 · 남긴 셀 순서다. 벡터 크기는 들고 있는 magnitude 를 그대로(같은 식으로 만든 값)
      const r = f.kind === 'vector' ? (opts.mapping === 'magnitude' ? minMaxMapped(f.magnitude, 1, 'magnitude', null, mask) : minMaxMapped(f.values, 3, opts.mapping, null, mask))
        : minMaxMapped(f.values, 1, 'magnitude', null, mask);
      if (r.min < min) min = r.min;
      if (r.max > max) max = r.max;
      if (r.magMax > magMax) magMax = r.magMax;
      count += r.count;
    }
    return count ? { min, max, magMax } : null;
  }

  /** 겹친 이름을 빼고 첫 저장 헤더 차례로 (헤더에 없는 이름은 뒤에, 받은 차례대로) */
  private inHeaderOrder(list: readonly string[]): string[] {
    const uniq = Array.from(new Set(list));
    const rank = (a: string, i: number): number => this.headerOrder.get(a) ?? this.headerOrder.size + i;
    return uniq.map((a, i) => ({ a, r: rank(a, i) })).sort((x, y) => x.r - y.r).map((x) => x.a);
  }

  /** 항목들로 위상(블록)마다 데이터셋을 짠다 (배열 차례 = list 차례 — 헤더 차례로 정렬해 넘긴다) */
  private assemble(list: readonly string[], got: Map<string, ArrayEntry>): PointDataset[] {
    return this.topologies.map((topo, i) => {
      const scalars: ScalarField[] = [], vectors: VectorField[] = [];
      for (const a of list) {
        const f = got.get(a)?.perBlock[i];
        if (!f) continue;
        if (f.kind === 'scalar') scalars.push(f); else vectors.push(f);
      }
      return datasetFrom(topo, { scalars, vectors });
    });
  }

  /** 위상 하나(블록)에서 읽을 배열마다 바이트 (첫 저장 헤더의 셀 수 × 성분 × 원소 크기 — 읽기 진행의 몫). 셀이 없거나 블록 정보가 없으면 빈 지도 */
  private arraySizes(topo: VtuTopology, arrays: readonly string[]): Map<string, number> {
    const out = new Map<string, number>();
    const block = this.scan.blocks.find((b) => b.name === topo.name);
    if (!block || topo.count === 0) return out;
    for (const name of arrays) {
      const a = block.arrays.find((x) => x.name === name);
      if (a) out.set(name, block.numCells * a.components * elementSize(a.type));
    }
    return out;
  }

  /** 빠진 배열 묶음을 읽기 시작하고, 그 배열마다 '읽는 중'(inflight)에 건다 — 같은 (시점, 배열)을 또 부르면 이 묶음을 기다린다. level = 묶음의 줄 차례(올릴 수 있음) */
  private startBatch(n: number, arrays: string[], level: number): Batch {
    const priority: BatchPriority = { level, turn: nextReadTurn() };
    const batch = this.loadBatch(n, arrays, priority);
    this.batchPriority.set(batch, priority);
    const keys = arrays.map((a) => entryKey(n, a));
    for (const k of keys) this.inflight.set(k, batch);
    const off = (): void => { for (const k of keys) if (this.inflight.get(k) === batch) this.inflight.delete(k); };
    batch.then(off, off);
    return batch;
  }

  /**
   * 빠진 배열 묶음 하나를 읽어 캐시에 넣는다: 블록마다 그 배열들(readVtuFields) — 헤더는 그 시점에 이미 읽었으면 다시 쓰고(headerAt), 없으면 한 번.
   * 셀이 없는 위상은 파일을 열지 않는다. 그 블록 파일에 없는 배열은 '없음'(null)으로 적는다. 파일 전체를 받아 둔 원본(바이트 범위를 무시하는 서버)의 헤더는
   * 그 블록을 다 읽으면 놓는다(forgetHead). 요청은 모두 시간축이 닫히면 끊긴다(life).
   * 넣은 뒤 예산을 넘으면 버리고(방금 읽은 시점은 남김) 캐시 바뀜을 한 번 알린다. 바이트 구간 받기는 priority(묶음의 줄 차례 — 올릴 수 있음)로 줄을 선다
   */
  private async loadBatch(n: number, arrays: string[], priority: BatchPriority): Promise<Map<string, ArrayEntry>> {
    // 진행은 기다리기 전에 넣는다 — step(n) 을 부른 쪽이 바로 loadProgress(n) 으로 읽을 수 있게. 같은 시점에 읽는 묶음이 있으면 그 진행에 더한다
    const sizes = this.topologies.map((t) => this.arraySizes(t, arrays));
    let total = 0;
    for (const m of sizes) for (const v of m.values()) total += v;
    const had = this.progress.get(n);
    const prog = had ?? { done: 0, total: 0, runs: 0 };
    prog.total += total; prog.runs++;
    if (!had) this.progress.set(n, prog);
    let mine = 0; // 이 묶음이 done 에 더한 몫
    const add = (bytes: number): void => { prog.done += bytes; mine += bytes; };
    const report = () => this.opts.onStepProgress?.(n, prog.done, prog.total);
    report();
    try {
      const signal = this.life.signal;
      const blocks = await this.blocksAt(n, signal, priority);
      const perArray = new Map(arrays.map((a) => [a, this.topologies.map((): ScalarField | VectorField | null => null)]));
      for (let i = 0; i < this.topologies.length; i++) {
        if (this.disposed) throw new Error('닫은 시간축입니다.'); // 다른 데이터를 열었다 — 다음 블록 파일을 읽지 않는다
        const topo = this.topologies[i];
        const b = this.blockFor(blocks, topo, i);
        if (!b) throw new Error(`저장 ${n}에 ${topo.name} 블록이 없습니다.`);
        if (topo.count === 0) continue; // 남긴 셀이 없는 위상 — 읽을 값이 없다
        const hp = this.headerAt(n, b.path, priority);
        const h = await hp;
        let reading = 0; // 읽기 시작한 배열의 몫 — 다음 배열을 시작하거나 블록이 끝나면 done 에 더한다
        let fields: Awaited<ReturnType<typeof readVtuFields>>;
        try {
          fields = await readVtuFields(h.source, topo, arrays, (m, array) => {
            add(reading);
            reading = (array && sizes[i].get(array)) || 0;
            this.opts.onProgress?.(`저장 ${n} · ${m}`);
            report();
          }, h, signal, priority);
        } finally {
          // 바이트 범위를 무시하는 서버: 파일 전체를 든 원본은 들고 있지 않는다(캐시 예산 밖에 쌓이지 않게 — 같은 때 다른 묶음은 이미 받은 헤더를 그대로 쓴다)
          if (holdsWholeFile(h.source)) this.forgetHead(n, b.path, hp);
        }
        add(reading);
        for (const f of [...fields.scalars, ...fields.vectors]) { const slot = perArray.get(f.name); if (slot) slot[i] = f; }
      }
      add(total - mine); // 첫 저장 헤더에 있던 배열이 이 시점에 없으면 덜 셀 수 있다 — 끝은 늘 이 묶음 몫만큼 가득
      report();
      const out = new Map<string, ArrayEntry>();
      for (const [a, perBlock] of perArray) {
        let bytes = 0;
        for (const f of perBlock) if (f) bytes += f.values.byteLength + (f.kind === 'vector' ? f.magnitude.byteLength : 0);
        const e: ArrayEntry = { n, array: a, perBlock, bytes };
        out.set(a, e);
        if (this.disposed) continue; // 닫은 시간축의 캐시에는 넣지 않는다 (기다리던 쪽에는 돌려준다)
        const k = entryKey(n, a), old = this.cache.get(k);
        if (old) { this.cache.delete(k); this.cacheBytes -= old.bytes; }
        this.cache.set(k, e);
        this.cacheBytes += bytes;
      }
      if (this.disposed) return out;
      this.evict(n);
      this.opts.onCacheChange?.();
      return out;
    } catch (e) {
      add(total - mine); // 같은 시점의 다른 묶음이 아직 읽는 중이면 그 진행이 끝에 가득 차게(늘기만 하게) 이 몫을 채워 둔다
      this.dropHeadsIfUnused(n, arrays); // 이 시점을 하나도 읽지 못했으면 헤더도 들고 있지 않는다 (다음에 새로)
      throw e;
    } finally {
      prog.runs--;
      if (prog.runs === 0 && this.progress.get(n) === prog) this.progress.delete(n);
      if (this.disposed) for (const t of this.topologies) releaseTopology(t.kept); // 닫은 뒤 이 묶음이 Worker 에 다시 보낸 위상도 지운다
    }
  }

  /**
   * 예산을 넘으면 버린다: 안 쓰는 배열부터, 그다음 쓰는 배열 — 각각 가장 오래 안 쓴 것부터. 방금 읽은 시점(keep)의 배열은 남긴다.
   * '없음' 항목(0 B)은 버려도 줄지 않으므로 남긴다(다시 읽지 않게). 항목이 모두 버려진 시점은 들고 있던 헤더도 지운다
   */
  private evict(keep: number): void {
    if (this.cacheBytes <= this.budget) return;
    const used = new Set(this.opts.arrays);
    const dropped = new Set<number>();
    sweep: for (const unusedOnly of [true, false]) {
      for (const [k, e] of this.cache) {
        if (this.cacheBytes <= this.budget) break sweep;
        if (e.n === keep || e.bytes === 0 || (unusedOnly && used.has(e.array))) continue;
        this.cache.delete(k);
        this.cacheBytes -= e.bytes;
        dropped.add(e.n);
      }
    }
    for (const n of dropped) this.dropHeadsIfUnused(n);
  }
}

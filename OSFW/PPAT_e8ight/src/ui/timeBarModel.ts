// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   timeBarModel.ts

재생 막대(timeBar.ts)의 순수 계산 — scripts/test_time_bar.mjs 가 시험한다. DOM 을 쓰지 않는다.
- 진행 원을 보일지(stepLoadView · LoadRing): 저장 시점 읽기가 STEP_LOAD_DELAY_MS(300 ms) 넘게 걸릴 때만. 짧은 기다림(대개 캐시·미리 읽기로 곧 끝남)은
  아무것도 띄우지 않는다. 채움 = 읽은 배열 바이트 / 읽을 바이트(TimeSeries onStepProgress). 읽을 바이트를 모르거나 아직 0 이면 null → 도는 원.
  보이는 중에 읽기가 끝나면 재생 중에는 재생 간격 + STEP_LOAD_LINGER_EXTRA_MS 동안 그대로 두고, 그 사이 다음 읽기가 시작되면 기다리지 않고 이어 보인다 —
  느린 서버에서 첫 바퀴를 돌 때 원이 장면마다 꺼졌다 켜지며 깜빡이고 화면 읽기 프로그램이 장면마다 말하지 않게(2026-11-05 검토).
- 읽어 둔 장면 띠(bufferedRuns · bufferStops · bufferGradient): 캐시에 있는 저장 시점 자리 → 이어진 구간 → 트랙 위 퍼센트 구간 → CSS linear-gradient.
  자리 i 의 손잡이는 트랙의 i/(N-1) 에 있으므로 구간은 그 앞뒤 반 칸씩(양 끝은 0 · 100% 에서 자른다).
*/
/******************************************************************************/

/** 저장 시점 읽기가 이보다 오래 걸릴 때만 진행 원을 띄운다 (ms) */
export const STEP_LOAD_DELAY_MS = 300;

/** 보이는 진행 원을 읽기가 끝난 뒤 재생 중에 더 두는 시간 = 재생 간격 + 이것 (ms) — 다음 장면 읽기가 시작되기까지의 여유 */
export const STEP_LOAD_LINGER_EXTRA_MS = 150;

export interface StepLoadLike { done: number; total: number; startedAt: number }
/** show = 진행 원을 보임 · fraction = 채움 0~1(null = 모름 → 도는 원) · recheckIn = 이만큼 뒤에 다시 보아야 함(보이기 시작 · 남겨 둔 원 내리기, ms. 없으면 -1 또는 0) */
export interface StepLoadView { show: boolean; fraction: number | null; recheckIn: number }
/** 진행 원이 지금 보이는 중일 때의 상태: endedAt = 보이는 중에 읽기가 끝난 때(읽는 중이면 null) · lingerMs = 끝난 뒤 더 둘 시간(재생 중이 아니면 0) */
export interface ShownRing { endedAt: number | null; lingerMs: number }

/**
 * 진행 원을 보일지. shown = 지금 보이는 중이면 그 상태(아니면 null).
 * 안 보이는 중: 읽기가 delayMs 넘게 걸릴 때 보인다. 보이는 중: 읽기가 있으면 그대로(앞 읽기에 이어진 다음 읽기도 기다리지 않는다),
 * 읽기가 끝났으면 endedAt + lingerMs 까지 다 채운 원으로 둔다
 */
export function stepLoadView(load: StepLoadLike | null, now: number, delayMs = STEP_LOAD_DELAY_MS, shown: ShownRing | null = null): StepLoadView {
  if (!load) {
    const left = shown && shown.endedAt !== null ? shown.endedAt + shown.lingerMs - now : 0;
    return left > 0 ? { show: true, fraction: 1, recheckIn: left } : { show: false, fraction: null, recheckIn: -1 };
  }
  // 아직 아무것도 못 읽었으면(0) 빈 고리 대신 도는 원 — 첫 배열을 다 읽어야 바이트가 오른다
  const fraction = load.total > 0 && load.done > 0 && Number.isFinite(load.done) ? Math.min(1, load.done / load.total) : null;
  if (shown) return { show: true, fraction, recheckIn: 0 };
  const waited = now - load.startedAt;
  return waited >= delayMs ? { show: true, fraction, recheckIn: 0 } : { show: false, fraction, recheckIn: delayMs - waited };
}

/** 진행 원 한 번 그리기 (LoadRing.update) */
export interface RingFrame {
  show: boolean;
  fraction: number | null;
  /** 채움을 움직임 없이 바로 맞출지 — 새로 보임 · 기다리는 시점이 바뀜 · 도는 원 ↔ 채움 (지난 채움에서 거꾸로 감기는 움직임이 보이지 않게) */
  snap: boolean;
  /** 이번에 새로 보이기 시작함 (화면 읽기 프로그램 글은 이때만 넣는다 — 이어지는 읽기마다 말하지 않게) */
  appeared: boolean;
  recheckIn: number;
}

/** 진행 원의 상태 (보이는 중인지 · 읽기가 끝난 때 · 지금 채우는 시점 · 도는 원인지)를 들고 stepLoadView 로 한 번씩 그릴 것을 정한다 (재생 막대가 하나 둔다) */
export class LoadRing {
  private shown = false;
  private endedAt: number | null = null;
  private label: string | null = null;
  private spinning = false;

  /** load = 지금 읽는 시점(없으면 null) · lingerMs = 읽기가 끝난 뒤 더 둘 시간(재생 중이 아니면 0) */
  update(load: (StepLoadLike & { label: string }) | null, now: number, lingerMs: number, delayMs = STEP_LOAD_DELAY_MS): RingFrame {
    if (load) this.endedAt = null;
    else if (this.shown && this.endedAt === null) this.endedAt = now;
    const v = stepLoadView(load, now, delayMs, this.shown ? { endedAt: this.endedAt, lingerMs } : null);
    if (!v.show) {
      this.shown = false; this.endedAt = null; this.label = null; this.spinning = false;
      return { show: false, fraction: null, snap: false, appeared: false, recheckIn: v.recheckIn };
    }
    const appeared = !this.shown;
    const label = load ? load.label : null; // 끝난 뒤 남겨 둔 원은 시점 없음 — 다음 읽기는 늘 바로 맞춘다
    const spinning = v.fraction === null;
    const snap = appeared || label !== this.label || spinning !== this.spinning;
    this.shown = true; this.label = label; this.spinning = spinning;
    return { show: true, fraction: v.fraction, snap, appeared, recheckIn: v.recheckIn };
  }
}

/** 저장 시점 자리 목록(순서·겹침 무관) → 이어진 구간 [처음, 끝] (둘 다 포함, 오름차순). 0 ~ count-1 밖·정수가 아닌 자리는 뺀다 */
export function bufferedRuns(indices: Iterable<number>, count: number): [number, number][] {
  const sorted = Array.from(new Set(Array.from(indices).filter((i) => Number.isInteger(i) && i >= 0 && i < count))).sort((a, b) => a - b);
  const runs: [number, number][] = [];
  for (const i of sorted) {
    const last = runs[runs.length - 1];
    if (last && i === last[1] + 1) last[1] = i;
    else runs.push([i, i]);
  }
  return runs;
}

/** 구간 → 트랙 위 퍼센트 [from, to] (0~100). 트랙 밖으로 나가 폭이 없어진 구간은 뺀다. 시점이 하나뿐이면(밀대 없음) 빈 목록 */
export function bufferStops(runs: readonly [number, number][], count: number): { from: number; to: number }[] {
  if (count < 2) return [];
  const step = 100 / (count - 1);
  const clamp = (v: number) => Math.min(100, Math.max(0, v));
  return runs.map(([a, b]) => ({ from: clamp((a - 0.5) * step), to: clamp((b + 0.5) * step) })).filter((s) => s.to > s.from);
}

/** 띠를 그리는 CSS 배경(왼→오른 linear-gradient, 띠 밖은 투명). 띠가 없으면 'none' */
export function bufferGradient(runs: readonly [number, number][], count: number, color: string): string {
  const stops = bufferStops(runs, count);
  if (!stops.length) return 'none';
  const pct = (v: number) => `${Number(v.toFixed(3))}%`;
  const parts: string[] = [];
  for (const s of stops) parts.push(`transparent ${pct(s.from)}`, `${color} ${pct(s.from)}`, `${color} ${pct(s.to)}`, `transparent ${pct(s.to)}`);
  return `linear-gradient(90deg, ${parts.join(', ')})`;
}

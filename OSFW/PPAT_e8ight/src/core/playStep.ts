// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   playStep.ts

재생이 다음에 보일 저장 시점(AppCore.play 가 쓴다, scripts/test_time_bar.mjs 가 시험한다). ParaView 의 재생과 같다(vtkAnimationPlayer::Play):
- 반복 재생(Loop)은 처음에 꺼져 있다. 꺼져 있으면 마지막 장면까지 보이고 멈춘다. 켜져 있으면 마지막 다음은 처음 장면.
- 마지막 장면에서 재생을 누르면 처음 장면부터 다시 재생한다(반복 여부와 상관없이).
*/
/******************************************************************************/

/** 재생을 누른 직후 보일 장면: 마지막 장면이면 처음(0), 아니면 다음 장면 */
export function firstPlayStep(index: number, count: number): number {
  return index >= count - 1 ? 0 : index + 1;
}

/** 재생 중 다음 장면. 마지막 장면 다음은 반복이면 처음(0), 아니면 null(멈춤) */
export function nextPlayStep(index: number, count: number, loop: boolean): number | null {
  if (index + 1 < count) return index + 1;
  return loop ? 0 : null;
}

/** 재생 중 미리 읽을 장면 수의 위 한계 (실제 수는 캐시 예산이 더 줄인다 — TimeSeries.prefetchAhead) */
export const PREFETCH_AHEAD_MAX = 100;

/**
 * 지금 장면(index) 다음으로 볼 장면들을 볼 차례대로, 많아야 max 개(지금 장면은 빼고, 같은 장면은 한 번만).
 * 반복이면 끝 다음에 처음으로 돌아가고, 아니면 마지막 장면에서 끝난다. 미리 읽기 차례로 쓴다
 */
export function aheadSteps(index: number, count: number, loop: boolean, max: number): number[] {
  const out: number[] = [];
  let i = index;
  while (out.length < max) {
    const next = nextPlayStep(i, count, loop);
    if (next === null || next === index) break;
    out.push(next);
    i = next;
  }
  return out;
}

#!/usr/bin/env node
// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   test_time_bar.mjs

src/ui/timeBarModel.ts(재생 막대의 순수 계산)의 Node 시험. esbuild 로 메모리에서 묶어(파일을 쓰지 않음) data: 주소로 불러 쓴다.
확인: 진행 원을 보일지 — 읽기가 없으면 안 보임 · 300 ms 전에는 안 보이고 남은 시간을 알려 줌 · 300 ms 부터 보임 · 채움 = done/total(1 로 자름) ·
total 0 이거나 아직 0 바이트면 모름(null → 도는 원) · 재생 흉내(장면 읽기 230~320 ms — 리허설 서버에서 잰 값)에서 300 ms 를 넘는 읽기만 보임 ·
보이는 중: 이어지는 읽기는 기다리지 않음 · 끝난 뒤 lingerMs 동안 다 채운 원으로 둠 · LoadRing(새로 보일 때만 appeared · 시점이 바뀌거나 도는 원 ↔ 채움이면 snap ·
느린 서버 재생 흉내에서 원이 한 번만 켜짐 — 고치기 전처럼 바로 내리면 장면마다 켜짐 · 재생이 아니면 바로 내림).
읽어 둔 장면 띠 — 구간 묶기(순서·겹침·범위 밖·정수 아님) · 트랙 퍼센트(손잡이 자리 i/(N-1) 앞뒤 반 칸, 양 끝 자름, 시점 하나면 없음) ·
CSS linear-gradient 글(띠가 없으면 'none', 띠 밖은 투명) · 첫 바퀴(앞쪽만)·두 번째 바퀴(전부).

실행: node scripts/test_time_bar.mjs
*/
/******************************************************************************/

import { build } from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bundle = async (rel) => {
  const res = await build({ entryPoints: [path.join(ROOT, rel)], bundle: true, platform: 'neutral', format: 'esm', target: 'es2022', write: false, logLevel: 'silent' });
  return import(`data:text/javascript;base64,${Buffer.from(res.outputFiles[0].text).toString('base64')}`);
};
const { STEP_LOAD_DELAY_MS, STEP_LOAD_LINGER_EXTRA_MS, stepLoadView, LoadRing, bufferedRuns, bufferStops, bufferGradient } = await bundle('src/ui/timeBarModel.ts');

let fail = 0, pass = 0;
const ok = (cond, name, extra = '') => { if (cond) { pass++; console.log(`PASS ${name}`); } else { fail++; console.log(`FAIL ${name} ${extra}`); } };
const near = (a, b) => Math.abs(a - b) < 1e-9;

// ---- 진행 원을 보일지 ----
{
  ok(STEP_LOAD_DELAY_MS === 300, `기다림 문턱 300 ms (${STEP_LOAD_DELAY_MS})`);
  const none = stepLoadView(null, 1000);
  ok(!none.show && none.fraction === null && none.recheckIn === -1, '읽기가 없으면 안 보임 · 다시 볼 시각 없음');
  const early = stepLoadView({ done: 100, total: 400, startedAt: 1000 }, 1120);
  ok(!early.show && near(early.recheckIn, 180) && near(early.fraction, 0.25), `120 ms: 안 보임 · 180 ms 뒤 다시 봄 · 채움 0.25 (${JSON.stringify(early)})`);
  const at = stepLoadView({ done: 0, total: 400, startedAt: 1000 }, 1300);
  ok(at.show && at.fraction === null, '딱 300 ms 부터 보임 · 아직 0 바이트면 빈 고리 대신 도는 원(null)');
  const late = stepLoadView({ done: 300, total: 400, startedAt: 1000 }, 1800);
  ok(late.show && near(late.fraction, 0.75), '800 ms: 보임 · 채움 0.75');
  ok(stepLoadView({ done: 0, total: 0, startedAt: 0 }, 500).fraction === null, '읽을 양을 모르면(total 0) 채움 없음 → 도는 원');
  ok(stepLoadView({ done: 900, total: 400, startedAt: 0 }, 500).fraction === 1 && stepLoadView({ done: -5, total: 400, startedAt: 0 }, 500).fraction === null, '채움은 1 로 자르고, 0 이하면 도는 원');
  ok(stepLoadView({ done: 0, total: 400, startedAt: 0 }, 500, 1000).show === false, '문턱을 바꿔 줄 수 있음 (1000 ms)');
  // 재생 흉내: 리허설 서버에서 잰 새 장면 읽기 230~320 ms (재생 간격 250 ms). 300 ms 넘는 읽기만 보이고, 보이는 시간은 넘은 만큼뿐
  const loads = [230, 250, 280, 299, 300, 310, 320];
  const shown = loads.filter((ms) => stepLoadView({ done: 0, total: 1, startedAt: 0 }, ms).show);
  ok(shown.join(',') === '300,310,320', `230~320 ms 읽기 가운데 보이는 것: ${shown.join(',')} (300 ms 이상만 — 고치기 전에는 모두 3D 화면을 덮음)`);
}

// ---- 보이는 중: 이어 보이기 · 끝난 뒤 남겨 두기 ----
{
  ok(STEP_LOAD_LINGER_EXTRA_MS === 150, `남겨 두는 여유 150 ms (${STEP_LOAD_LINGER_EXTRA_MS})`);
  const cont = stepLoadView({ done: 0, total: 400, startedAt: 1000 }, 1010, 300, { endedAt: null, lingerMs: 400 });
  ok(cont.show && cont.fraction === null, '보이는 중이면 새 읽기를 300 ms 기다리지 않고 바로 이어 보임');
  const linger = stepLoadView(null, 1100, 300, { endedAt: 1000, lingerMs: 400 });
  ok(linger.show && linger.fraction === 1 && near(linger.recheckIn, 300), `끝난 뒤 100 ms: 다 채운 원으로 남김 · 300 ms 뒤 다시 봄 (${JSON.stringify(linger)})`);
  ok(!stepLoadView(null, 1400, 300, { endedAt: 1000, lingerMs: 400 }).show, '남겨 두는 시간이 지나면 내림');
  ok(!stepLoadView(null, 1001, 300, { endedAt: 1000, lingerMs: 0 }).show, '재생이 아니면(lingerMs 0) 바로 내림');

  const r = new LoadRing();
  const L = (label, done = 0, startedAt = 0) => ({ label, done, total: 400, startedAt });
  const a = r.update(L('t = 0.1'), 100, 400);
  ok(!a.show && near(a.recheckIn, 200), '300 ms 전: 안 보임 · 200 ms 뒤 다시');
  const b = r.update(L('t = 0.1'), 300, 400);
  ok(b.show && b.appeared && b.snap && b.fraction === null, '300 ms: 새로 보임(appeared · snap) · 0 바이트라 도는 원');
  const c = r.update(L('t = 0.1', 100), 350, 400);
  ok(c.show && !c.appeared && c.snap && near(c.fraction, 0.25), '도는 원 → 채움으로 바뀌면 snap (거꾸로 감기지 않게)');
  const d = r.update(L('t = 0.1', 300), 400, 400);
  ok(d.show && !d.snap && near(d.fraction, 0.75), '같은 시점에서 채움이 늘면 움직임 그대로(snap 아님)');
  const e = r.update(L('t = 0.2', 100, 400), 410, 400);
  ok(e.show && !e.appeared && e.snap && near(e.fraction, 0.25), '보이는 중에 기다리는 시점이 바뀌면 snap (70% → 25% 되감기 안 보이게 — 검토 1의 3)');
  const f = r.update(null, 500, 400);
  ok(f.show && f.fraction === 1 && near(f.recheckIn, 400), '읽기 끝(재생 중): 다 채운 원으로 400 ms 남김');
  const g = r.update(L('t = 0.3', 0, 750), 750, 400);
  ok(g.show && !g.appeared && g.snap && g.fraction === null, '남겨 둔 사이 다음 읽기: 300 ms 안 기다리고 이어 보임 · 다시 말하지 않음(appeared 아님)');
  r.update(null, 900, 0);
  const h = r.update(null, 901, 0);
  ok(!h.show && h.recheckIn === -1, '재생이 아니면(lingerMs 0) 읽기가 끝나면 바로 내림');
  const i2 = r.update(L('t = 0.4', 0, 1000), 1100, 400);
  ok(!i2.show, '내린 뒤 새 읽기는 다시 300 ms 를 기다림');
}

// ---- 재생 흉내: 느린 서버(장면 읽기 400~700 ms) · 초당 4장(간격 250 ms) · 51장면 첫 바퀴 — 진행 원이 몇 번 켜지나 ----
{
  const N = 51, interval = 250;
  const loadMs = (k) => 400 + ((k * 37) % 7) * 50; // 400~700 ms
  /** 시각표: [시작, 끝] 읽기 구간 (끝 뒤 interval 쉬고 다음) */
  const spans = [];
  let t = 0;
  for (let k = 0; k < N; k++) { spans.push([t, t + loadMs(k), `t = ${k}`]); t += loadMs(k) + interval; }
  const loadAt = (now) => { const sp = spans.find(([a, b]) => now >= a && now < b); return sp ? { label: sp[2], done: 0, total: 400, startedAt: sp[0] } : null; };
  const run = (lingerMs) => {
    const ring = new LoadRing();
    let said = 0, wasShown = false, ons = 0;
    for (let now = 0; now < t + 1000; now += 10) {
      const fr = ring.update(loadAt(now), now, lingerMs);
      if (fr.appeared) said++; // 화면 읽기 프로그램 글을 넣는 때
      if (fr.show && !wasShown) ons++;
      wasShown = fr.show;
    }
    return { ons, said };
  };
  const before = run(0); // 고치기 전처럼 끝나면 바로 내림
  const after = run(interval + STEP_LOAD_LINGER_EXTRA_MS);
  ok(before.ons >= N - 1, `바로 내리면: 원이 ${before.ons}번 켜짐 (장면마다 깜빡임 · 음성 ${before.said}번)`);
  ok(after.ons === 1 && after.said === 1, `재생 간격 + 150 ms 남기면: ${after.ons}번 켜지고 음성 ${after.said}번 (첫 바퀴 내내 이어 보임)`);
}

// ---- 읽어 둔 장면 띠 ----
{
  ok(JSON.stringify(bufferedRuns([3, 0, 1, 2, 7, 8, 10], 51)) === '[[0,3],[7,8],[10,10]]', `구간 묶기 (${JSON.stringify(bufferedRuns([3, 0, 1, 2, 7, 8, 10], 51))})`);
  ok(JSON.stringify(bufferedRuns([5, 5, 4, -1, 51, 2.5, NaN], 51)) === '[[4,5]]', '겹침·범위 밖·정수 아님은 뺌');
  ok(bufferedRuns([], 51).length === 0, '읽어 둔 것이 없으면 구간 없음');
  const s = bufferStops([[0, 3], [10, 10], [50, 50]], 51);
  ok(s[0].from === 0 && near(s[0].to, 7) && near(s[1].from, 19) && near(s[1].to, 21) && near(s[2].from, 99) && s[2].to === 100,
    `트랙 퍼센트: 손잡이 자리 i/(N-1) 앞뒤 반 칸, 양 끝은 0 · 100 에서 자름 (${JSON.stringify(s)})`);
  ok(bufferStops([[0, 0]], 1).length === 0, '시점 하나면 띠 없음 (재생 막대도 없음)');
  const all = bufferStops(bufferedRuns(Array.from({ length: 51 }, (_, i) => i), 51), 51);
  ok(all.length === 1 && all[0].from === 0 && all[0].to === 100, '모두 읽어 두면 트랙 전체 한 띠 (두 번째 바퀴)');
  ok(bufferGradient([], 51, 'red') === 'none', '띠가 없으면 none');
  const g = bufferGradient([[0, 3]], 51, 'var(--track-buffered)');
  ok(g === 'linear-gradient(90deg, transparent 0%, var(--track-buffered) 0%, var(--track-buffered) 7%, transparent 7%)', `CSS 글: ${g}`);
  const g2 = bufferGradient([[0, 1], [5, 5]], 3, 'c');
  ok(g2 === 'linear-gradient(90deg, transparent 0%, c 0%, c 75%, transparent 75%)', `N=3 · 트랙 밖 구간(5번)은 폭이 없어 빠짐 (${g2})`);
  // 첫 바퀴: 0~k 장면을 읽었고 k+1 을 미리 읽는 중 → 앞쪽 한 띠
  const firstLoop = bufferStops(bufferedRuns(Array.from({ length: 26 }, (_, i) => i), 51), 51);
  ok(firstLoop.length === 1 && firstLoop[0].from === 0 && near(firstLoop[0].to, 51), `첫 바퀴 25번째 장면까지: 앞쪽 0~51% (${JSON.stringify(firstLoop)})`);
}

// ---- 재생이 다음에 보일 장면 (core/playStep.ts — ParaView: 반복은 처음에 꺼짐, 끝에서 재생을 누르면 처음부터) ----
{
  const { firstPlayStep, nextPlayStep, aheadSteps, PREFETCH_AHEAD_MAX } = await bundle('src/core/playStep.ts');
  ok(PREFETCH_AHEAD_MAX === 100, `미리 읽기 위 한계 100 (${PREFETCH_AHEAD_MAX})`);
  ok(aheadSteps(2, 6, false, 100).join() === '3,4,5', `반복 꺼짐: 끝까지만 (${aheadSteps(2, 6, false, 100)})`);
  ok(aheadSteps(2, 6, true, 100).join() === '3,4,5,0,1', `반복 켜짐: 처음으로 돌아가 지금 장면 앞까지, 지금 장면은 빼고 (${aheadSteps(2, 6, true, 100)})`);
  ok(aheadSteps(2, 6, true, 2).join() === '3,4' && aheadSteps(0, 6, false, 1).join() === '1', '많아야 max 개 (멈춰 있을 때 1 = 다음 장면 하나)');
  ok(aheadSteps(5, 6, false, 100).length === 0 && aheadSteps(5, 6, true, 3).join() === '0,1,2', '마지막 장면: 반복 꺼짐 → 없음, 켜짐 → 처음부터');
  ok(aheadSteps(0, 1, true, 5).length === 0, '장면 하나면 없음');
  ok(firstPlayStep(0, 5) === 1 && firstPlayStep(3, 5) === 4, '재생을 누르면 다음 장면부터');
  ok(firstPlayStep(4, 5) === 0 && firstPlayStep(9, 5) === 0, '마지막 장면에서 누르면 처음 장면부터');
  ok(nextPlayStep(2, 5, false) === 3 && nextPlayStep(2, 5, true) === 3, '중간에서는 반복과 상관없이 다음 장면');
  ok(nextPlayStep(4, 5, false) === null, '반복 꺼짐: 마지막 장면 다음은 멈춤(null)');
  ok(nextPlayStep(4, 5, true) === 0, '반복 켜짐: 마지막 장면 다음은 처음 장면');
  ok(firstPlayStep(0, 2) === 1 && nextPlayStep(1, 2, false) === null && firstPlayStep(1, 2) === 0, '장면 둘: 1 → 멈춤, 다시 누르면 0');
}

console.log(fail ? `\n실패 ${fail} · 통과 ${pass}` : `\n모두 통과 (${pass})`);
process.exit(fail ? 1 : 0);

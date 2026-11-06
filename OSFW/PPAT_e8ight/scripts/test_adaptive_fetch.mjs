#!/usr/bin/env node
// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   test_adaptive_fetch.mjs

src/data/rangeGovernor.ts(결과 파일 받기의 자동 단계 조절기 — 2026-11-06 밤, 같은 날 Node 실측 뒤 고침)와, resilientFetch.ts fetchRange · source.ts HttpSource.read 가
그것과 함께 도는 길의 Node 시험. esbuild 로 메모리에서 묶어(파일을 쓰지 않음) data: 주소로 불러 쓴다.
1. 조절기 혼자(가짜 시계 · 가짜 저장소 — 요청은 자리를 받아 '머리 옴 · 받은 바이트 · 멈춤 · 끊김 · 끝'만 흉내):
   0단계는 제약 없음 · 끊김 → 1단계(2 MB · 동시 1) · 같은 사건(낮추기 전에 보낸 요청 · 10 초 안 · 낮춘 뒤 바이트를 못 받은 동안 — 3 분 한도) ·
   실제 속도 재기(받은 바이트 ÷ 바쁜 시간 — 첫 바이트 기다림 · 토큰 기다림은 넣고, 쉬는 시간 · 끊긴 뒤 5 초 · 낮춘 뒤 첫 머리 전은 뺌, 1 초 안 되면 못 잼 — 0단계만 0.3 초 넘게 4 MB 넘게 받았으면 잼) ·
   단계 규칙(2단계 = 1단계 실제 속도의 절반, 못 쟀으면 5 MB/s · 그 뒤 '잰 속도와 상한 가운데 작은 것'의 절반, 못 쟀으면 상한의 절반 · 조각 2 MB → 1 MB →
   512 KB → 256 KB · 바닥 1 MB/s) · 신호(받는 도중 끊김 · 응답 머리 전 기다림은 다른 요청에서 바이트가 흐르면 세지 않음) ·
   느려짐(상한이 없으면 잰 속도 표본의 중앙값, 상한이 있으면 상한과 견줌) · 우선 줄(보는 장면끼리는 나중에 부른 것 먼저 · 미리 읽기 · 전 시점 범위는 부른 차례) ·
   올리지 않음 · 하루 기억 · origin 분리 · 다른 탭 기록 · 기다리다 취소 · NaN 거부 · 저장소를 못 쓸 때.
   1단계 상한(Chrome 실측 A · C 뒤): 0단계에서 잰 실제 속도의 절반(못 쟀으면 상한 없음 · 바닥 1 MB/s) · 콘솔 줄 · 토큰 · 하루 기억과 되살리기 ·
   2단계 = min(1단계 실제, 1단계 상한)의 절반(못 쟀으면 상한의 절반) · 0단계는 실제 속도를 재도 여전히 상한 없음.
   느려짐으로 낮출 때(같은 날): 상한의 근거는 느려지기 전 속도 — 0 → 1단계는 0단계 표본 중앙값의 절반, 상한이 있으면 상한의 절반, 상한 없는
   1단계면 1단계 표본 중앙값의 절반(바닥 1 MB/s) — 그때 잰 느린 실제 속도가 아님. 끊김은 전과 같음(잰 실제 속도 — 끊기기 전 속도). 다른 탭이 적은 같은
   단계의 더 엄격한 기록(상한이 더 낮음)은 덮지 않음(기한만 늘림).
2. fetchRange 와 함께(가짜 서버 · 실제 시계 · 조각 100 B 로 줄인 조절기): 0단계는 나누지 않음 · 큰 요청이 멈추면 1단계 조각으로 이어 받음 · 1단계 동시 1개 ·
   2단계부터 조각 절반 · 받는 도중 끊김(TypeError) · 덜 받음은 끊김 신호 · 응답 머리 전 연결 실패 · 502/503 · 서버가 줄여 준 구간은 신호 아님 ·
   Content-Range 를 못 읽을 때 약속한 양은 Content-Length, 그것도 없으면 덜 받음 신호 없음 · 바깥 signal 로 끊은 것(사유가 TypeError 여도)은 신호 아님
   (본문이 일찍 닫히는 바로 그때의 취소 — 덜 받음 판정 전 틈 — 도) · Content-Range 를 못 읽는 206 이 Content-Length 만큼 다 왔는데 요청보다 적으면 파일 끝에서
   줄여 준 것으로 보고 거기까지 돌려줌(다시 보내지 않음 · 신호 없음 — 작은 파일의 HttpSource.read · readVtuHeader 끝까지) ·
   연결 6개 서버에서 차례를 기다린 요청은 끊김 아님(재현) · 우선 줄 · 기다린 뒤 취소 · fetchWhole · HttpSource.read 의 NaN · 함께 쓰는 rangeGovernor.
3. 운영 서버 꼴 가짜 서버(가짜 시계 · 기본 상수 그대로): 최근 1 초 동안 보낸 양이 초당 20 MB 를 넘으면 30 초 통째 끊고, 요청마다 첫 바이트 10 ms 뒤
   100 MiB/s 로 보낸다. 16.8 MB 구간 20 개를 차례로 받아(직전 Node 실측과 같은 꼴) 끊김 횟수가 직전 규칙(1단계 상한 없음)의 2 번보다 많지 않은지.
   Chrome 실측 A 꼴 가짜 서버(줄 속도 21 MiB/s · 첫 바이트 5 ms · 최근 3 초에 초당 16 MiB 를 넘으면 30 초 끊음): 16.8 MiB 구간 12 개 — 직전 규칙은 끊김 2 번
   (저장소 밖 견주기), 1단계 상한이면 1 번인지.

실행: node scripts/test_adaptive_fetch.mjs
*/
/******************************************************************************/

import { build } from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const res = await build({
  stdin: { contents: "export * from './src/data/rangeGovernor'; export { fetchRange, fetchWhole, STALL_MS } from './src/data/resilientFetch'; export { HttpSource } from './src/data/source'; export { readVtuHeader } from './src/data/loaders/vtu_loader';", resolveDir: ROOT, loader: 'ts' },
  bundle: true, platform: 'neutral', format: 'esm', target: 'es2022', write: false, logLevel: 'silent',
});
const m = await import(`data:text/javascript;base64,${Buffer.from(res.outputFiles[0].text).toString('base64')}`);
const {
  RangeGovernor, rangeGovernor, fetchRange, fetchWhole, HttpSource, readVtuHeader, STALL_MS, STORAGE_KEY,
  CHUNK_BYTES, MIN_CHUNK_BYTES, LOWERED_PARALLEL, SAME_EVENT_MS, SAME_EVENT_MAX_MS, SLOW_MIN_BYTES, SLOW_RATIO, SLOW_RUN, BASE_SAMPLES,
  RATE_WINDOW_MS, MIN_MEASURE_MS, MIN_MEASURE_BYTES, MIN_MEASURE_SHORT_MS, MIN_RATE, STAGE2_FALLBACK_RATE, REMEMBER_MS,
  PRIORITY_VIEW, PRIORITY_PREFETCH, PRIORITY_SCAN, nextReadTurn,
} = m;

let fail = 0, pass = 0;
const ok = (cond, name, extra = '') => { if (cond) { pass++; console.log(`PASS ${name}`); } else { fail++; console.log(`FAIL ${name} ${extra}`); } };
const KiB = 1024;
const MiB = 1024 * KiB;
const DAY = 24 * 60 * 60 * 1000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
/** 약속 사슬이 다 돌 때까지 (setImmediate 몇 번) */
const flush = async (n = 4) => { for (let i = 0; i < n; i++) await new Promise((r) => setImmediate(r)); };
/** 거의 같은가 (rel = 상대 오차) */
const near = (a, b, rel = 1e-9) => typeof a === 'number' && Math.abs(a - b) <= rel * Math.max(1, Math.abs(b));
const mbs = (x) => (typeof x === 'number' ? `${Number((x / MiB).toFixed(3))} MiB/s` : String(x));

// ---------- 가짜 시계 · 가짜 저장소 ----------
/** now = 단조 ms, wall = 달력 ms (wallOffset + now — 시험이 하루를 건너뛸 때 wallOffset 을 옮긴다). 타이머는 advance · step 으로만 돈다 */
function fakeClock(wall0 = Date.UTC(2026, 10, 6, 12, 0, 0)) {
  const c = {
    t: 0, wallOffset: wall0, timers: [], id: 0,
    now: () => c.t,
    wall: () => c.wallOffset + c.t,
    setTimer(fn, ms) { const id = ++c.id; c.timers.push({ id, at: c.t + (Number.isFinite(ms) ? Math.max(0, ms) : 0), fn }); return id; },
    clearTimer(id) { c.timers = c.timers.filter((x) => x.id !== id); },
    async advance(ms) {
      const end = c.t + ms;
      for (;;) {
        c.timers.sort((a, b) => a.at - b.at || a.id - b.id);
        const x = c.timers[0];
        if (!x || x.at > end) break;
        c.timers.shift();
        c.t = x.at;
        x.fn();
        await flush();
      }
      c.t = end;
      await flush();
    },
    /** 가장 이른 타이머 하나까지 옮겨 돌린다 (없으면 false) */
    async step() {
      c.timers.sort((a, b) => a.at - b.at || a.id - b.id);
      const x = c.timers.shift();
      if (!x) return false;
      c.t = Math.max(c.t, x.at);
      x.fn();
      await flush(2);
      return true;
    },
  };
  return c;
}
/** localStorage 와 같은 모양 (init = STORAGE_KEY 의 처음 값) */
function memStore(init) {
  const mm = new Map(init === undefined ? [] : [[STORAGE_KEY, init]]);
  return { mm, getItem: (k) => (mm.has(k) ? mm.get(k) : null), setItem: (k, v) => { mm.set(k, String(v)); }, removeItem: (k) => { mm.delete(k); } };
}
const ORIGIN = 'https://cfd.fedit.or.kr';
const FILE = `${ORIGIN}/results/cfd-20261027-120608-4be2/bin/LEVEL_00/fluid_dem_8.vtu`;
/** 시험 환경: 가짜 시계 · 저장소 · 콘솔 줄을 모으는 조절기 하나와 그 주소의 OriginGovernor */
function env({ store = memStore(), clock = fakeClock(), tuning } = {}) {
  const lines = [];
  const gov = new RangeGovernor({ clock, store, log: (l) => lines.push(l), tuning });
  return { clock, store, lines, gov, o: gov.forUrl(FILE) };
}
const stored = (store) => { const raw = store.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : null; };
/** 자리를 받을 때까지 가짜 시계를 10 ms 씩 옮긴다 (2단계부터 토큰을 기다릴 수 있다 — 기다리는 동안도 바쁜 시간) */
async function acquireSoon(e, bytes, priority) {
  let t = null;
  e.o.acquire(bytes, priority).then((x) => { t = x; });
  await flush();
  for (let waited = 0; !t && waited < 120000; waited += 10) await e.clock.advance(10);
  return t;
}
/** 요청 하나를 흉내: 자리 받고 · head ms 뒤 응답 머리 · 그 뒤 body ms 동안 받아 bytes 를 다 받고 끝 */
async function transfer(e, bytes, body, head = 0) {
  const t = await acquireSoon(e, bytes);
  if (head) await e.clock.advance(head);
  t.responded();
  if (body) await e.clock.advance(body);
  t.received(bytes);
  t.release(true);
  await flush();
}
/** 요청 하나가 응답 머리도 못 받고 멈춤 (그동안 다른 요청에서 바이트가 흐르지 않음 — 끊김 신호) */
async function stallOne(e) {
  const t = await acquireSoon(e, MiB);
  t.stalled(); t.release(false);
  await flush();
}
/** 새 사건 하나: 같은 사건 묶음 시간(10 초)을 넘기고, 그 주소에서 바이트가 다시 흐른 뒤(작은 요청 — 실제 속도는 못 잼) 멈춤 */
async function nextEvent(e) {
  await e.clock.advance(SAME_EVENT_MS + 1);
  await transfer(e, 64 * KiB, 10);
  await stallOne(e);
}

// ===================== 1. 조절기 혼자 =====================
console.log('\n== 상수');
ok(STALL_MS === 5000 && CHUNK_BYTES === 2 * MiB && MIN_CHUNK_BYTES === 256 * KiB && LOWERED_PARALLEL === 1 && SAME_EVENT_MS === 10000 && SAME_EVENT_MAX_MS === 180000
  && SLOW_MIN_BYTES === MiB && SLOW_RATIO === 0.25 && SLOW_RUN === 3 && BASE_SAMPLES === 3 && RATE_WINDOW_MS === 4000 && MIN_MEASURE_MS === 1000
  && MIN_MEASURE_BYTES === 4 * MiB && MIN_MEASURE_SHORT_MS === 300 && MIN_RATE === MiB && STAGE2_FALLBACK_RATE === 5 * MiB && REMEMBER_MS === DAY,
  `끊김 ${STALL_MS} ms · 1단계 조각 ${CHUNK_BYTES / MiB} MB(바닥 ${MIN_CHUNK_BYTES / KiB} KB) · 동시 ${LOWERED_PARALLEL} · 같은 사건 ${SAME_EVENT_MS} ms(바이트 규칙 ${SAME_EVENT_MAX_MS / 60000} 분까지) · 느려짐 ${SLOW_MIN_BYTES / MiB} MB 마다 표본이 기준의 ${SLOW_RATIO} 아래로 ${SLOW_RUN}번 (기준 표본 ${BASE_SAMPLES}개부터) · 실제 속도 창 ${RATE_WINDOW_MS} ms · 최소 ${MIN_MEASURE_MS} ms · 바닥 ${MIN_RATE / MiB} MB/s · 2단계 대신 ${STAGE2_FALLBACK_RATE / MiB} MB/s · 기억 하루`);
ok(PRIORITY_VIEW < PRIORITY_PREFETCH && PRIORITY_PREFETCH < PRIORITY_SCAN, '줄 차례: 보는 장면 < 미리 읽기 < 전 시점 범위');

console.log('\n== 0단계는 제약 없음 · 끊김 → 1단계 · 같은 사건 (바이트 규칙 3 분 한도)');
{
  const e = env();
  ok(e.o.stage === 0 && e.o.chunkBytes === Infinity && e.o.parallel === Infinity && e.o.rate === null && e.lines.length === 0 && e.store.getItem(STORAGE_KEY) === null,
    '0단계로 시작: 나누지 않음 · 동시 수 · 속도 제한 없음 · 콘솔 줄 없음 · 기억 없음 (낮은 속도에서 시작해 올려 보지 않음)');
  const ts = await Promise.all(Array.from({ length: 8 }, () => e.o.acquire(16.8 * MiB)));
  ok(e.o.inFlight === 8 && e.o.waiting === 0 && e.clock.timers.length === 0, `0단계: 16.8 MB 요청 8개가 기다리지 않고 함께 나감 (나가 있음 ${e.o.inFlight} · 타이머 ${e.clock.timers.length})`);
  for (const t of ts) { t.responded(); t.received(4 * MiB); }
  await e.clock.advance(5000);
  ts[0].stalled();
  ok(e.o.stage === 1 && e.o.chunkBytes === 2 * MiB && e.o.parallel === 1 && e.o.rate === null,
    `0단계에서 큰 요청 하나의 끊김 → 1단계 (조각 ${e.o.chunkBytes / MiB} MB · 그 주소 전체에서 동시 ${e.o.parallel} · 속도 제한 없음)`);
  ok(e.lines.length === 1 && e.lines[0] === '[결과 읽기] cfd.fedit.or.kr: 끊김 → 1단계(2 MB씩 · 동시 1개)', `콘솔 한 줄: ${e.lines[0]}`);
  for (const t of ts) { t.stalled(); t.release(false); }
  ok(e.o.stage === 1 && e.lines.length === 1, '같은 사건: 낮추기 전에 보낸 요청 7개가 함께 멈춰도 한 번만 셈');
  const rec = stored(e.store)?.[ORIGIN];
  ok(rec && rec.stage === 1 && rec.rate === null && rec.until === e.clock.wall() + DAY && Object.keys(stored(e.store) ?? {}).length === 1,
    `하루 기억: 그 주소만 {단계 1, 기한 낮춘 때부터 하루} (${JSON.stringify(rec)})`);
}
{
  // 낮추기 전에 보낸 요청은 늦게 멈춰도 같은 사건: 0단계에서 보낸 큰 요청이, 낮춘 뒤 (그 요청에서) 바이트가 다시 흐르고 10 초가 지나서 멈춰도 다시 세지 않는다
  const e = env();
  const old = await e.o.acquire(16.8 * MiB);
  old.responded(); old.received(MiB);
  await stallOne(e); // 다른 요청의 끊김 → 1단계 (그 요청은 바이트를 못 받았고 그새 다른 요청에서도 흐르지 않음)
  ok(e.o.stage === 1, '응답 머리 전 끊김이라도 그동안 바이트가 흐르지 않았으면 끊김 신호');
  for (let i = 0; i < 15; i++) { await e.clock.advance(1000); old.received(MiB); } // 낮춘 뒤에도 그 요청에서 바이트가 흐름 (1단계 자리 1개를 그 요청이 쥐고 있음)
  old.stalled(); old.release(false);
  ok(e.o.stage === 1 && e.lines.length === 1, '같은 사건: 낮추기 전(0단계)에 보낸 요청이 낮춘 뒤 바이트를 받다가 15 초 뒤에 멈춰도 다시 세지 않음');
}
{
  // 10 초 규칙: 낮춘 뒤 바이트가 다시 흘렀어도 10 초 안의 멈춤은 같은 사건 (여러 요청이 함께 멈출 때)
  const e = env();
  await stallOne(e);
  await e.clock.advance(1000);
  await transfer(e, 64 * KiB, 10);
  await e.clock.advance(1000);
  await stallOne(e);
  ok(e.o.stage === 1 && e.lines.length === 1, '같은 사건: 낮춘 뒤 10 초 안(2 초)의 멈춤은 바이트가 다시 흘렀어도 다시 세지 않음');
  await e.clock.advance(SAME_EVENT_MS);
  await stallOne(e);
  ok(e.o.stage === 2 && e.lines.length === 2, '10 초가 지나고 바이트가 흐른 뒤의 멈춤은 새 사건 → 2단계');
}
{
  // 바이트 규칙: 10 초가 지났어도 낮춘 뒤 한 바이트도 못 받았으면 같은 사건 (30~55 초 끊김 내내) — 3 분까지
  const e = env();
  await stallOne(e);
  await e.clock.advance(2000);
  await stallOne(e);
  await e.clock.advance(10000);
  await stallOne(e);
  ok(e.o.stage === 1 && e.lines.length === 1, '같은 사건: 10 초가 지났어도 낮춘 뒤 그 주소에서 한 바이트도 못 받았으면(30~55 초 끊김 내내 다시 보내는 요청) 다시 세지 않음');
  await e.clock.advance(SAME_EVENT_MAX_MS - 12000 - 1); // 낮춘 뒤 2 분 59.999 초
  await stallOne(e);
  ok(e.o.stage === 1 && e.lines.length === 1, '바이트를 못 받은 채 2 분 59.999 초: 아직 같은 사건');
  await e.clock.advance(1); // 낮춘 뒤 3 분
  await stallOne(e);
  ok(e.o.stage === 2 && e.o.measured === null && e.o.rate === STAGE2_FALLBACK_RATE && e.o.parallel === 1 && e.o.chunkBytes === MiB,
    `바이트 없이 3 분이 지나면 새 사건 → 2단계 (1단계에서 못 쟀으니 초당 ${e.o.rate / MiB} MB · 조각 ${e.o.chunkBytes / MiB} MB · 동시 ${e.o.parallel})`);
  ok(e.lines[1] === '[결과 읽기] cfd.fedit.or.kr: 끊김 → 2단계(1 MB씩 · 초당 5 MB · 동시 1개)', `콘솔 한 줄: ${e.lines[1]}`);
}
{
  const e = env();
  await stallOne(e);
  await e.clock.advance(12000);
  await transfer(e, 64 * KiB, 20); // 다시 흐름 (작은 요청)
  await stallOne(e);
  ok(e.o.stage === 2 && e.lines.length === 2, '바이트가 다시 흐른 뒤(3 분 전이어도)의 끊김은 새 사건');
}

console.log('\n== 실제 속도 재기: 받은 바이트 ÷ 바쁜 시간 (검증 high)');
{
  const e = env();
  await stallOne(e); // 1단계 — 낮춘 뒤 첫 응답 머리부터 잰다
  for (let i = 0; i < 20; i++) await transfer(e, 2 * MiB, 20, 300); // 머리까지 0.3 초 + 본문 0.02 초 — 요청 하나의 머리 뒤 속도는 100 MiB/s
  ok(near(e.o.realRate, 6.25 * MiB), `첫 바이트 기다림을 넣어 잰다: 2 MB ÷ 0.32 초 = ${mbs(e.o.realRate)} (예전 '머리 뒤 속도'로는 100 MiB/s)`);
  await e.clock.advance(SAME_EVENT_MS);
  await stallOne(e);
  ok(e.o.stage === 2 && near(e.o.measured, 6.25 * MiB) && near(e.o.rate, 3.125 * MiB) && e.o.chunkBytes === MiB && e.o.parallel === 1,
    `끊김 → 2단계 상한 = 1단계 실제 속도 ${mbs(e.o.measured)} 의 절반 ${mbs(e.o.rate)} · 조각 1 MB · 동시 1`);
  ok(e.lines[1] === '[결과 읽기] cfd.fedit.or.kr: 끊김 → 2단계(1 MB씩 · 초당 3.1 MB · 동시 1개)', `콘솔 한 줄: ${e.lines[1]}`);
}
{
  const e = env();
  await stallOne(e);
  for (let i = 0; i < 8; i++) { await transfer(e, 2 * MiB, 250); await e.clock.advance(5000); } // 요청 사이에 5 초씩 아무것도 부르지 않음
  ok(near(e.o.realRate, 8 * MiB), `쉬는 시간(나가 있거나 기다리는 요청이 없음)은 빼고 잰다: 2 MB ÷ 0.25 초 = ${mbs(e.o.realRate)}`);
}
{
  const e = env();
  await stallOne(e);
  for (let i = 0; i < 4; i++) await transfer(e, 2 * MiB, 20); // 0.08 초 만에 8 MB — 몰려 들어온 속도(Node 실측 1단계는 0.6 초 만에 끊김)
  ok(e.o.realRate === null, `그 단계의 바쁜 시간이 ${MIN_MEASURE_MS} ms 안 되면 못 잼 (0.08 초)`);
  await e.clock.advance(SAME_EVENT_MS);
  await stallOne(e);
  ok(e.o.stage === 2 && e.o.measured === null && e.o.rate === STAGE2_FALLBACK_RATE, `1단계에서 못 쟀으면 2단계는 초당 ${STAGE2_FALLBACK_RATE / MiB} MB`);
}
{
  // 끊긴 요청의 마지막 바이트 뒤 5 초(사건 자체)는 낮출 때 쓰는 값에 넣지 않는다
  const e = env();
  await stallOne(e);
  await e.clock.advance(SAME_EVENT_MS); // (쉬는 시간 — 재지 않음)
  for (let i = 0; i < 8; i++) await transfer(e, 2 * MiB, 250); // 8 MiB/s · 바쁜 2 초
  const t = await acquireSoon(e, 2 * MiB);
  t.responded(); await e.clock.advance(125); t.received(MiB); // 1 MB 받고
  await e.clock.advance(STALL_MS); // 5 초 동안 아무것도 오지 않음
  const at = e.o.realRate;
  t.stalled(); t.release(false);
  ok(near(at, 8 * MiB) && e.o.stage === 2 && near(e.o.measured, 8 * MiB) && near(e.o.rate, 4 * MiB),
    `마지막 바이트까지의 창으로 잼 — 끊긴 뒤 5 초는 빼고 ${mbs(e.o.measured)} → 2단계 ${mbs(e.o.rate)}`);
}
{
  // 낮춘 뒤에는 첫 응답 머리부터 새로 잰다 — 끊김이 이어지는 동안 다시 보낸 요청이 머리를 기다린 시간은 빼고
  const e = env();
  await stallOne(e);
  const t = await acquireSoon(e, 2 * MiB);
  await e.clock.advance(4000); t.responded(); await e.clock.advance(250); t.received(2 * MiB); t.release(true); await flush();
  for (let i = 0; i < 7; i++) await transfer(e, 2 * MiB, 250);
  ok(near(e.o.realRate, 8 * MiB), `낮춘 뒤 첫 응답 머리 전 4 초(끊김 동안)는 빼고 잰다: ${mbs(e.o.realRate)}`);
}
{
  // 2단계부터는 토큰을 기다린 시간도 바쁜 시간 — 실제 속도는 상한 근처 (예전 '머리 뒤 속도'라면 100 MiB/s)
  const e = env();
  await stallOne(e); await nextEvent(e); // 2단계 5 MB/s (1단계에서 못 잼)
  for (let i = 0; i < 40; i++) await transfer(e, MiB, 10); // 망은 1 MB 를 0.01 초에 주지만 상한 5 MB/s
  const r2 = e.o.realRate;
  ok(r2 > 4.9 * MiB && r2 <= 5.001 * MiB, `2단계 실제 속도 = 상한 근처 ${mbs(r2)} (토큰 기다림 포함)`);
  await e.clock.advance(SAME_EVENT_MS);
  await stallOne(e);
  ok(e.o.stage === 3 && near(e.o.measured, r2) && near(e.o.rate, Math.min(r2, 5 * MiB) / 2) && e.o.chunkBytes === 512 * KiB,
    `끊김 → 3단계 상한 = 2단계에서 잰 ${mbs(e.o.measured)} 의 절반 ${mbs(e.o.rate)} · 조각 512 KB`);
}

console.log('\n== 단계 규칙: 1단계 동시 1 · 속도 제한 없음 · 2단계부터 조각 절반 · 토큰 · 바닥');
{
  const e = env();
  await stallOne(e); // 1단계
  const got = [];
  for (let i = 0; i < 5; i++) e.o.acquire(2 * MiB, PRIORITY_SCAN).then((t) => got.push([i, t]));
  await flush();
  ok(got.length === 1 && e.o.inFlight === 1 && e.o.waiting === 4, `1단계: 그 주소의 바이트 구간 요청은 모두 합쳐 동시에 1개 (나감 ${e.o.inFlight} · 기다림 ${e.o.waiting})`);
  got[0][1].responded(); got[0][1].received(2 * MiB);
  await flush();
  ok(got.length === 1, '자리는 응답 머리 · 본문을 받는 동안 그대로 (본문을 다 받고 끝나야 풂)');
  got[0][1].release(true);
  await flush();
  ok(got.length === 2 && got[1][0] === 1, '하나가 끝나면 줄의 다음 하나 (전 시점 범위끼리는 부른 차례)');
  for (let i = 1; i < 5; i++) { got[i][1].release(true); await flush(); }
  const before = e.clock.t;
  for (let i = 0; i < 50; i++) { const t = await e.o.acquire(2 * MiB); t.responded(); t.received(2 * MiB); t.release(true); }
  ok(e.clock.t === before && e.clock.timers.length === 0, '1단계는 속도 제한 없음: 2 MB 50개를 시간이 흐르지 않아도 차례로 바로 보냄 (토큰 타이머 없음)');
}
{
  // 2단계 토큰: 통 = 그 단계 조각 하나(1 MB). 쉬던 통의 1 MB 는 바로, 다음 1 MB 는 앞 요청을 보낸 지 0.2 초(1 MB ÷ 5 MB/s) 뒤
  const e = env();
  await stallOne(e); await nextEvent(e);
  const a = await acquireSoon(e, MiB);
  a.responded(); a.received(MiB);
  await e.clock.advance(100);
  a.release(true);
  let b = null;
  e.o.acquire(MiB).then((t) => { b = t; });
  await e.clock.advance(99);
  ok(b === null, '2단계 토큰: 앞 1 MB 를 보낸 지 0.199 초에는 다음 1 MB 를 보내지 않음');
  await e.clock.advance(1);
  ok(b !== null, '2단계 토큰: 0.2 초에 보냄 (1 MB ÷ 초당 5 MB)');
  b.release(false); // 한 바이트도 못 받고 끝남 → 꺼낸 1 MB 를 통에 돌려준다
  let c = null;
  e.o.acquire(MiB).then((t) => { c = t; });
  await flush();
  ok(c !== null, '2단계 토큰: 받지 못한 몫은 돌려줌 — 다음 1 MB 를 바로 보냄');
  c.responded(); c.received(512 * KiB); c.release(false);
  let d = null;
  e.o.acquire(MiB).then((t) => { d = t; });
  await e.clock.advance(99);
  ok(d === null, '2단계 토큰: 반만(512 KB) 받고 끝나면 그 반만 돌려줌 — 512 KB 몫 0.1 초를 기다림');
  await e.clock.advance(1);
  ok(d !== null, '2단계 토큰: 0.1 초 뒤 보냄');
  d.release(false);
  // 단계마다 조각 절반 · 상한 절반(못 쟀으면), 바닥 256 KB · 1 MB/s, 둘 다 바닥이면 더 낮추지 않음
  const seen = [];
  for (let i = 0; i < 4; i++) { await nextEvent(e); seen.push(`${e.o.stage}단계 ${e.o.chunkBytes / KiB} KB ${e.o.rate / MiB} MB/s`); }
  ok(seen.join(' → ') === '3단계 512 KB 2.5 MB/s → 4단계 256 KB 1.25 MB/s → 5단계 256 KB 1 MB/s → 5단계 256 KB 1 MB/s',
    `사건마다 조각 · 상한 절반, 바닥 256 KB · 1 MB/s 에서 멈춤 (${seen.join(' → ')})`);
  ok(e.lines.length === 5 && e.lines[4] === '[결과 읽기] cfd.fedit.or.kr: 끊김 → 5단계(256 KB씩 · 초당 1 MB · 동시 1개)' && e.o.parallel === 1,
    `바닥에서는 콘솔 줄도 더 없음 (줄 ${e.lines.length}개 — 마지막: ${e.lines[4]})`);
}
{
  // 속도는 바닥이어도 조각이 바닥이 아니면 조각만 줄인다 (2단계 1 MB/s → 3단계 512 KB · 1 MB/s)
  const e = env({ tuning: { fallbackRate: MiB } });
  await stallOne(e); await nextEvent(e);
  ok(e.o.stage === 2 && e.o.rate === MiB && e.o.chunkBytes === MiB, '2단계: 바닥 속도 1 MB/s · 조각 1 MB');
  await nextEvent(e);
  ok(e.o.stage === 3 && e.o.rate === MiB && e.o.chunkBytes === 512 * KiB, '속도가 바닥이어도 조각이 바닥이 아니면 한 단계 더 (조각만 512 KB 로)');
}
{
  // 잰 속도가 상한보다 높게 잡혀도(쉬는 동안 통이 차서 몰아 받음 — 쉬는 시간은 재지 않음) 다음 상한은 앞 상한의 절반 — 올리지 않음
  const e = env();
  await stallOne(e); await nextEvent(e); // 2단계 5 MB/s
  for (let i = 0; i < 120; i++) { await transfer(e, MiB, 10); await e.clock.advance(1000); }
  const r = e.o.realRate;
  await stallOne(e);
  ok(r > 50 * MiB && e.o.stage === 3 && e.o.rate === 2.5 * MiB, `2단계에서 잰 속도 ${mbs(r)} 가 상한보다 높아도 3단계는 상한 5 MB/s 의 절반 ${mbs(e.o.rate)}`);
}

console.log('\n== 1단계 상한: 0단계에서 잰 실제 속도의 절반 (Chrome 실측 A · C) · 0단계는 그대로 제약 없음');
/** 0단계에서 2 MB 를 bodyMs 씩 n 번 받고(바쁜 시간 n × bodyMs), 큰 요청이 2 MB 를 bodyMs 에 받은 뒤 5 초 멈춤 → 끊김 */
async function stallAfterStage0(e, n, bodyMs) {
  for (let i = 0; i < n; i++) await transfer(e, 2 * MiB, bodyMs);
  const t = await acquireSoon(e, 16.8 * MiB);
  t.responded(); await e.clock.advance(bodyMs); t.received(2 * MiB);
  await e.clock.advance(STALL_MS);
  t.stalled(); t.release(false);
  await flush();
}
{
  const e = env();
  for (let i = 0; i < 12; i++) await transfer(e, 2 * MiB, 100); // 0단계 20 MB/s · 바쁜 1.2 초
  const ts = [];
  for (let i = 0; i < 8; i++) e.o.acquire(16.8 * MiB).then((t) => ts.push(t)); // 기다리게 되면 멈추지 않고 FAIL 로 잡히게 (await 하지 않음)
  await flush();
  ok(e.o.stage === 0 && near(e.o.realRate, 20 * MiB) && e.o.rate === null && e.o.chunkBytes === Infinity && ts.length === 8 && e.o.inFlight === 8 && e.o.waiting === 0 && e.clock.timers.length === 0,
    `0단계는 실제 속도(${mbs(e.o.realRate)})를 재도 상한 없음: 16.8 MB 요청 8개가 기다리지 않고 함께 나감 (나감 ${ts.length} · 토큰 타이머 ${e.clock.timers.length})`);
  for (const t of ts) t.release(false);
}
{
  const store = memStore();
  const e = env({ store });
  await stallAfterStage0(e, 12, 100); // 0단계 20 MB/s 로 받다가 끊김
  ok(e.o.stage === 1 && near(e.o.measured, 20 * MiB) && near(e.o.rate, 10 * MiB) && e.o.chunkBytes === 2 * MiB && e.o.parallel === 1 && e.o.slowBase === e.o.rate,
    `끊김 → 1단계 상한 = 0단계에서 잰 ${mbs(e.o.measured)} 의 절반 ${mbs(e.o.rate)} · 조각 2 MB · 동시 1 · 느려짐 기준도 상한`);
  ok(e.lines.length === 1 && e.lines[0] === '[결과 읽기] cfd.fedit.or.kr: 끊김 → 1단계(2 MB씩 · 초당 10 MB · 동시 1개)', `콘솔 한 줄에 1단계 상한: ${e.lines[0]}`);
  const rec = stored(store)[ORIGIN];
  ok(rec.stage === 1 && near(rec.rate, 10 * MiB) && rec.until === e.clock.wall() + DAY, `하루 기억에 1단계 상한도 (${JSON.stringify(rec)})`);
  // 토큰: 통 = 2 MB 조각 하나 — 낮출 때 찬 통의 2 MB 는 바로, 다음 2 MB 는 0.2 초 뒤 (2 MB ÷ 초당 10 MB)
  const a = await acquireSoon(e, 2 * MiB);
  a.responded(); a.received(2 * MiB); a.release(true);
  let b = null;
  e.o.acquire(2 * MiB).then((t) => { b = t; });
  await e.clock.advance(199);
  const early = b === null;
  await e.clock.advance(1);
  ok(early && b !== null, '1단계 토큰: 2 MB 다음 2 MB 는 0.2 초 뒤 (초당 10 MB — 상한 없던 앞 규칙은 바로 보냄)');
  b.release(false);
  const e2 = env({ store, clock: fakeClock(e.clock.wall() + 3600 * 1000) });
  ok(e2.o.stage === 1 && near(e2.o.rate, 10 * MiB) && e2.o.chunkBytes === 2 * MiB && e2.o.parallel === 1 && e2.o.slowBase === e2.o.rate
    && e2.lines.length === 1 && e2.lines[0].startsWith('[결과 읽기] cfd.fedit.or.kr: 기억한 1단계(2 MB씩 · 초당 10 MB · 동시 1개)로 시작 ('),
    `1 시간 뒤 새 페이지: 기억한 1단계 상한으로 시작 — ${e2.lines[0]}`);
  const a2 = await acquireSoon(e2, 2 * MiB);
  a2.responded(); a2.received(2 * MiB); a2.release(true);
  let b2 = null;
  e2.o.acquire(2 * MiB).then((t) => { b2 = t; });
  await e2.clock.advance(199);
  const early2 = b2 === null;
  await e2.clock.advance(1);
  ok(early2 && b2 !== null, '되살린 1단계 상한도 토큰으로 묶음 (다음 2 MB 는 0.2 초 뒤)');
  b2.release(false);
}
{
  const e = env();
  await stallAfterStage0(e, 1, 100); // 0단계 바쁜 0.2 초 · 4 MB — 못 잼 (1 초도, 0.3 초 넘게 4 MB 넘게도 아님)
  ok(e.o.stage === 1 && e.o.measured === null && e.o.rate === null && e.o.slowBase === null && stored(e.store)[ORIGIN].rate === null
    && e.lines[0] === '[결과 읽기] cfd.fedit.or.kr: 끊김 → 1단계(2 MB씩 · 동시 1개)',
    `0단계에서 못 잼(바쁜 0.2 초 · 4 MB) → 1단계는 상한 없음 — ${e.lines[0]}`);
  const before = e.clock.t;
  for (let i = 0; i < 10; i++) { const t = await e.o.acquire(2 * MiB); t.responded(); t.received(2 * MiB); t.release(true); }
  ok(e.clock.t === before && e.clock.timers.length === 0, '상한 없는 1단계: 2 MB 10개를 시간이 흐르지 않아도 차례로 바로 보냄 (토큰 타이머 없음)');
}
{
  // Chrome 실측 D 꼴: 구간 1 은 응답 머리 0.47 초 · 본문 16.8 MB 0.22 초, 구간 2 는 응답 머리 36 ms · 7.6 MB 받은 뒤 멈춤 — 바쁜 0.956 초(1 초 미만)
  const e = env();
  await transfer(e, 16.8 * MiB, 220, 470);
  const t = await acquireSoon(e, 16.8 * MiB);
  await e.clock.advance(36); t.responded(); await e.clock.advance(230); t.received(7.6 * MiB);
  await e.clock.advance(STALL_MS); t.stalled(); t.release(false); await flush();
  const want = (24.4 * MiB * 1000) / 956;
  ok(e.o.stage === 1 && near(e.o.measured, want, 1e-6) && near(e.o.rate, want / 2, 1e-6)
    && e.lines[0] === `[결과 읽기] cfd.fedit.or.kr: 끊김 → 1단계(2 MB씩 · 초당 ${Number((want / 2 / MiB).toFixed(1))} MB · 동시 1개)`,
    `1 초 전이라도 0.3 초 넘게 4 MB 넘게 받았으면 잼 (Chrome 실측 D: 바쁜 0.956 초 · 24.4 MB → ${mbs(e.o.measured)}, 1단계 상한 ${mbs(e.o.rate)}) — ${e.lines[0]}`);
}
{
  const e = env();
  await transfer(e, 3 * MiB, 500); // 0.5 초 · 3 MB — 0.3 초는 넘었지만 4 MB 안 됨
  ok(e.o.realRate === null, '1 초 전에 4 MB 를 못 받았으면 못 잼 (0.5 초 · 3 MB)');
  await transfer(e, 1 * MiB, 100); // 0.6 초 · 4 MB
  ok(near(e.o.realRate, (4 * MiB * 1000) / 600), `0.3 초 넘게 4 MB 를 받으면 잼 (0.6 초 · 4 MB → ${mbs(e.o.realRate)})`);
}
{
  const e = env();
  await transfer(e, 4 * MiB, 300); // 딱 0.3 초 · 4 MB — 경계 값은 잼
  ok(near(e.o.realRate, (4 * MiB * 1000) / 300), `0단계 바쁜 딱 0.3 초 · 4 MB 면 잼 (경계 — ${mbs(e.o.realRate)})`);
}
{
  // 짧은 규칙은 0단계만: 0단계가 못 잰 채 끊겨 상한 없는 1단계 → 끊김이 풀린 뒤 2 MB 조각 17 개를 0.6 초에 몰아 받고(34 MB) 끊김
  const e = env();
  await stallAfterStage0(e, 1, 100); // 0단계 바쁜 0.2 초 — 못 잼 → 상한 없는 1단계
  await e.clock.advance(SAME_EVENT_MS);
  for (let i = 0; i < 17; i++) { const t = await e.o.acquire(2 * MiB); await e.clock.advance(10); t.responded(); await e.clock.advance(25); t.received(2 * MiB); t.release(true); }
  const burst = e.o.realRate;
  await stallOne(e);
  ok(e.o.stage === 2 && burst === null && e.o.measured === null && e.o.rate === STAGE2_FALLBACK_RATE,
    `상한 없는 1단계의 0.6 초 · 34 MB 몰림은 못 잼(짧은 규칙은 0단계만) → 2단계 초당 ${STAGE2_FALLBACK_RATE / MiB} MB (몰린 속도의 절반이 아님 — ${e.lines[e.lines.length - 1]})`);
}
{
  const e = env();
  await stallAfterStage0(e, 6, 1500); // 0단계 2 MB ÷ 1.5 초 = 1.33 MB/s
  ok(e.o.stage === 1 && near(e.o.measured, (4 / 3) * MiB, 1e-6) && e.o.rate === MIN_RATE && e.lines[0] === '[결과 읽기] cfd.fedit.or.kr: 끊김 → 1단계(2 MB씩 · 초당 1 MB · 동시 1개)',
    `바닥: 0단계에서 잰 ${mbs(e.o.measured)} 의 절반은 1 MB/s 아래라 1단계 상한 1 MB/s — ${e.lines[0]}`);
}
{
  // 2단계 = min(1단계 실제 속도, 1단계 상한)의 절반 — 실제가 상한보다 느릴 때
  const e = env();
  await stallAfterStage0(e, 12, 100); // 1단계 상한 10 MB/s
  await e.clock.advance(SAME_EVENT_MS);
  for (let i = 0; i < 20; i++) await transfer(e, 2 * MiB, 20, 300); // 머리까지 0.3 초 + 본문 0.02 초 — 실제 6.25 MB/s (상한 10 MB/s 아래)
  await stallOne(e);
  ok(e.o.stage === 2 && near(e.o.measured, 6.25 * MiB) && near(e.o.rate, 3.125 * MiB) && e.o.chunkBytes === MiB,
    `1단계 실제 ${mbs(e.o.measured)} < 상한 10 MB/s → 2단계 = 실제의 절반 ${mbs(e.o.rate)}`);
}
{
  // 실제가 상한보다 높게 잡혀도(쉬는 동안 통이 차서 2 MB 를 몰아 받음 — 쉬는 시간은 재지 않음) 2단계는 1단계 상한의 절반 — 올리지 않음
  const e = env();
  await stallAfterStage0(e, 12, 100); // 1단계 상한 10 MB/s
  for (let i = 0; i < 120; i++) { await transfer(e, 2 * MiB, 10); await e.clock.advance(1000); }
  const r1 = e.o.realRate;
  await stallOne(e);
  ok(r1 > 100 * MiB && e.o.stage === 2 && near(e.o.measured, r1) && near(e.o.rate, 5 * MiB),
    `1단계에서 잰 ${mbs(r1)} 가 상한보다 높아도 2단계는 1단계 상한 10 MB/s 의 절반 ${mbs(e.o.rate)} (상한과 견주지 않으면 ${mbs(r1 / 2)})`);
}
{
  // 기억한 1단계 상한(8 MB/s)에서 못 잰 채 끊김 → 2단계 = 상한의 절반 4 MB/s (상한 없던 1단계의 5 MB/s 가 아님)
  const W = Date.UTC(2026, 10, 6, 12);
  const store = memStore(JSON.stringify({ [ORIGIN]: { stage: 1, rate: 8 * MiB, until: W + 3600 * 1000 } }));
  const e = env({ store, clock: fakeClock(W) });
  const startLine = e.lines[0];
  await stallOne(e);
  ok(startLine.startsWith('[결과 읽기] cfd.fedit.or.kr: 기억한 1단계(2 MB씩 · 초당 8 MB · 동시 1개)로 시작 (') && e.o.stage === 2 && e.o.measured === null && e.o.rate === 4 * MiB
    && stored(store)[ORIGIN].rate === 4 * MiB && e.lines[1] === '[결과 읽기] cfd.fedit.or.kr: 끊김 → 2단계(1 MB씩 · 초당 4 MB · 동시 1개)',
    `기억한 1단계 상한 8 MB/s 에서 못 잰 채 끊김 → ${e.lines[1]}`);
  const eN = env({ store: memStore(JSON.stringify({ [ORIGIN]: { stage: 1, rate: null, until: W + 3600 * 1000 } })), clock: fakeClock(W) });
  const eL = env({ store: memStore(JSON.stringify({ [ORIGIN]: { stage: 1, rate: 0.25 * MiB, until: W + 3600 * 1000 } })), clock: fakeClock(W) });
  ok(eN.o.stage === 1 && eN.o.rate === null && eN.lines[0].startsWith('[결과 읽기] cfd.fedit.or.kr: 기억한 1단계(2 MB씩 · 동시 1개)로 시작 (') && eL.o.stage === 1 && eL.o.rate === MIN_RATE,
    '기억한 상한 없는 1단계는 그대로 상한 없음 · 바닥 아래로 적힌 1단계 상한(0.25 MB/s)은 바닥 1 MB/s 로');
}

console.log('\n== 신호: 받는 도중 끊김 · 응답 머리 전 기다림 (검증 medium 둘)');
{
  const e = env();
  const t = await e.o.acquire(16.8 * MiB);
  t.responded(); t.received(MiB); t.dropped(); t.release(false);
  ok(e.o.stage === 1 && e.lines[0] === '[결과 읽기] cfd.fedit.or.kr: 끊김 → 1단계(2 MB씩 · 동시 1개)', `응답 머리 · 본문을 받은 뒤 연결이 끊김(dropped) → 끊김 신호: ${e.lines[0]}`);
}
{
  const e = env();
  const flowing = await e.o.acquire(16.8 * MiB); flowing.responded();
  const queued = await e.o.acquire(16.8 * MiB); // 브라우저 안에서 연결 차례를 기다림 — 응답 머리가 오지 않음
  for (let i = 0; i < 10; i++) { await e.clock.advance(500); flowing.received(MiB); }
  queued.stalled(); queued.release(false);
  ok(e.o.stage === 0 && e.lines.length === 0, '응답 머리 전에 5 초 넘게 기다렸어도 그동안 같은 주소의 다른 요청에서 바이트가 흘렀으면 세지 않음 (연결 차례 기다림)');
  const body = await e.o.acquire(16.8 * MiB); body.responded(); body.received(MiB);
  for (let i = 0; i < 10; i++) { await e.clock.advance(500); flowing.received(MiB); }
  body.stalled(); body.release(false);
  ok(e.o.stage === 1 && e.lines.length === 1, '본문을 받다 멈춘 요청은 다른 요청에서 바이트가 흘러도 셈');
  flowing.release(false);
}
{
  const e = env();
  const q = await e.o.acquire(MiB);
  await e.clock.advance(STALL_MS);
  q.stalled(); q.release(false);
  ok(e.o.stage === 1, '응답 머리 전 기다림이라도 그동안 그 주소에서 바이트가 흐르지 않았으면 셈 (운영 서버의 통째 끊김)');
}

console.log('\n== 우선 줄: 보는 장면끼리는 나중에 부른 것 먼저 (검증 low)');
{
  const e = env();
  await stallOne(e); // 1단계: 동시 1개
  const hold = await acquireSoon(e, 1);
  const order = [];
  const tickets = [];
  const enq = (name, p) => e.o.acquire(1, p).then((t) => { order.push(name); tickets.push(t); });
  enq('전 시점 범위 1', PRIORITY_SCAN); enq('보는 장면 1', PRIORITY_VIEW); enq('미리 읽기 1', PRIORITY_PREFETCH); enq('보는 장면 2', undefined);
  enq('미리 읽기 2', PRIORITY_PREFETCH); enq('전 시점 범위 2', PRIORITY_SCAN); enq('보는 장면 3', PRIORITY_VIEW);
  await flush();
  let cur = hold;
  for (let i = 0; i < 7; i++) { cur.release(true); await flush(); cur = tickets[tickets.length - 1]; }
  cur.release(true);
  ok(order.join(' → ') === '보는 장면 3 → 보는 장면 2 → 보는 장면 1 → 미리 읽기 1 → 미리 읽기 2 → 전 시점 범위 1 → 전 시점 범위 2',
    `보는 장면끼리는 나중에 부른 것 먼저, 미리 읽기 · 전 시점 범위는 부른 차례 (${order.join(' → ')}) · 차례를 주지 않으면 보는 장면`);
}
{
  // 재현: 밀대를 끌어 장면 8개 읽기를 잇달아 부름(장면마다 조각 3개) — 마지막 장면이 먼저 다 온다
  const e = env();
  await stallOne(e);
  const hold = await acquireSoon(e, 1);
  const done = [];
  const scene = async (k) => {
    let t = await e.o.acquire(1, PRIORITY_VIEW);
    for (let c = 0; c < 2; c++) t = await t.handoff(1);
    t.release(true);
    done.push(k);
  };
  const all = [];
  for (let k = 1; k <= 8; k++) { all.push(scene(k)); await flush(); }
  hold.release(true);
  await Promise.all(all);
  ok(done.join() === '8,7,6,5,4,3,2,1', `장면 8개를 잇달아 부르면 마지막 장면이 먼저 (끝난 차례 ${done.join(',')}, 예전에는 1 → 8)`);
}
{
  // 묶음의 turn: 지나간 장면의 다음 읽기가 마지막 장면의 읽기보다 나중에 불려도 마지막 장면 묶음이 먼저 · 미리 읽던 묶음을 보게 되면 앞당김
  const e = env();
  await stallOne(e);
  const hold = await acquireSoon(e, 1);
  const s3 = { level: PRIORITY_VIEW, turn: nextReadTurn() }; // 지나간 장면 (먼저 부름)
  const s8 = { level: PRIORITY_VIEW, turn: nextReadTurn() }; // 마지막 장면
  const pf = { level: PRIORITY_PREFETCH, turn: nextReadTurn() }; // 미리 읽던 묶음
  const got = [];
  const enq = (name, p) => e.o.acquire(1, p).then((t) => { got.push(name); t.release(true); });
  enq('장면 8', s8); await flush();
  enq('장면 3', s3); await flush(); // 읽기는 나중에 불렸지만 묶음은 먼저 부름
  enq('미리 읽기', pf); await flush();
  hold.release(true); await flush(8);
  ok(got.join(' → ') === '장면 8 → 장면 3 → 미리 읽기', `보는 장면끼리는 묶음을 부른 차례(turn)로 — 나중에 부른 묶음 먼저 (${got.join(' → ')})`);
  const hold2 = await acquireSoon(e, 1);
  const got2 = [];
  const enq2 = (name, p) => e.o.acquire(1, p).then((t) => { got2.push(name); t.release(true); });
  enq2('장면 8', s8); await flush();
  enq2('미리 읽던 장면', pf); await flush();
  pf.level = PRIORITY_VIEW; pf.turn = nextReadTurn(); // 보는 장면이 미리 읽던 묶음을 기다리게 됨 (TimeSeries.stepAt)
  hold2.release(true); await flush(8);
  ok(got2.join(' → ') === '미리 읽던 장면 → 장면 8', `미리 읽던 묶음을 보게 되면(차례 · turn 올림) 앞섬 (${got2.join(' → ')})`);
}
{
  // 조각 넘기기: 같은 묶음(같은 turn)이면 먼저 시작한 읽기의 다음 조각 먼저 · 나중에 부른 보는 장면은 조각 사이에서 앞섬 · 미리 읽기끼리는 먼저 부른 읽기의 다음 조각 먼저
  const e = env();
  await stallOne(e);
  const batch = { level: PRIORITY_VIEW, turn: nextReadTurn() };
  const seen = [];
  const a1 = await acquireSoon(e, 1, batch);
  e.o.acquire(1, batch).then((t) => { seen.push('같은 묶음의 다른 읽기'); t.release(true); });
  await flush();
  const a2 = await a1.handoff(1); seen.push('먼저 시작한 읽기의 다음 조각');
  a2.release(true); await flush();
  ok(seen.join(' → ') === '먼저 시작한 읽기의 다음 조각 → 같은 묶음의 다른 읽기', `같은 묶음 안에서는 먼저 시작한 읽기를 이어 받음 (${seen.join(' → ')})`);
  const seen2 = [];
  const b1 = await acquireSoon(e, 1, PRIORITY_VIEW);
  e.o.acquire(1, PRIORITY_VIEW).then((t) => { seen2.push('나중에 부른 보는 장면'); t.release(true); });
  await flush();
  const b2 = await b1.handoff(1); seen2.push('먼저 부른 보는 장면의 다음 조각');
  b2.release(true); await flush();
  ok(seen2.join(' → ') === '나중에 부른 보는 장면 → 먼저 부른 보는 장면의 다음 조각', `나중에 부른 보는 장면은 조각 사이에서 앞섬 (${seen2.join(' → ')})`);
  const seen3 = [];
  const c1 = await acquireSoon(e, 1, PRIORITY_PREFETCH);
  e.o.acquire(1, PRIORITY_PREFETCH).then((t) => { seen3.push('나중 미리 읽기'); t.release(true); });
  await flush();
  const c2 = await c1.handoff(1); seen3.push('먼저 미리 읽기의 다음 조각');
  c2.release(true); await flush();
  ok(seen3.join(' → ') === '먼저 미리 읽기의 다음 조각 → 나중 미리 읽기', `미리 읽기끼리는 부른 차례 — 조각 사이에 끼어들지 못함 (${seen3.join(' → ')})`);
  const seen4 = [];
  const s1 = await acquireSoon(e, 1, PRIORITY_SCAN);
  e.o.acquire(1, PRIORITY_VIEW).then((t) => { seen4.push('보는 장면'); t.release(true); });
  await flush();
  const s2 = await s1.handoff(1); seen4.push('전 시점 범위 다음 조각');
  s2.release(true); await flush();
  ok(seen4.join(' → ') === '보는 장면 → 전 시점 범위 다음 조각', `조각 사이에서 보는 장면을 앞세움 (${seen4.join(' → ')})`);
}
{
  const e = env();
  await stallOne(e); // 1단계
  const h1 = await e.o.acquire(1);
  const ac = new AbortController();
  const p = e.o.acquire(1, PRIORITY_VIEW, ac.signal);
  let after = null;
  e.o.acquire(1, PRIORITY_SCAN).then((t) => { after = t; });
  await flush();
  const waitingBefore = e.o.waiting;
  ac.abort(new DOMException('사용자가 끊음', 'AbortError'));
  let err = null;
  try { await p; } catch (x) { err = x; }
  ok(waitingBefore === 2 && err?.name === 'AbortError' && err.message === '사용자가 끊음' && e.o.waiting === 1, '줄에서 기다리다 끊기면 그 이유로 끝나고 줄에서 빠짐');
  h1.release(true); await flush();
  ok(after !== null && e.o.inFlight === 1, '끊긴 요청 대신 다음 요청이 자리를 받음');
  const msgs = [];
  for (const bad of [NaN, -1, Infinity]) { try { await e.o.acquire(bad); msgs.push('받음'); } catch (x) { msgs.push(x.message); } }
  ok(msgs.every((s) => s.startsWith('받을 바이트 수가 잘못되었습니다 (')) && e.o.inFlight === 1 && e.o.waiting === 0, `NaN · 음수 · 무한 바이트는 줄에 서지 않고 거부 (${msgs[0]})`);
  after.release(true);
}

console.log('\n== 느려짐: 기준은 그 단계에서 잰 실제 속도 · 상한이 있으면 상한 (검증 low)');
{
  const e = env();
  for (let i = 0; i < 10; i++) await transfer(e, 2 * MiB, 200); // 0단계 10 MB/s · 바쁜 2 초
  ok(near(e.o.typicalRate, 10 * MiB) && e.o.stage === 0 && e.o.slowBase === e.o.typicalRate, `0단계 느려짐 기준 = 잰 실제 속도 표본의 중앙값 ${mbs(e.o.typicalRate)}`);
  // 동시 6개가 1 MB 씩 0.6 초: 하나씩 보면 1.7 MB/s(기준의 4분의 1 아래)지만 그동안 이 주소의 실제 속도는 10 MB/s
  for (let k = 0; k < 3; k++) {
    const ts = await Promise.all(Array.from({ length: 6 }, () => e.o.acquire(MiB)));
    for (const t of ts) t.responded();
    await e.clock.advance(600);
    for (const t of ts) t.received(MiB);
    for (const t of ts) t.release(true);
  }
  ok(e.o.stage === 0 && e.lines.length === 0 && near(e.o.realRate, 10 * MiB), '나눠 받기는 느려짐이 아님: 동시 6개 × 3번 — 그 주소의 실제 속도 10 MB/s');
  const slow = () => transfer(e, 2 * MiB, 2000); // 1 MB/s < 10 / 4
  await slow(); await slow(); await slow();
  ok(e.o.stage === 0, '느린 받기 3번: 창(최근 4 초)에 앞의 빠른 받기가 남은 첫 표본은 느리지 않음 — 느린 표본 2번이라 그대로');
  const typ = e.o.typicalRate;
  await slow();
  ok(near(typ, 10 * MiB) && e.o.stage === 1 && near(e.o.measured, MiB) && near(e.o.rate, 5 * MiB) && near(stored(e.store)[ORIGIN].rate, 5 * MiB)
    && e.lines[0] === '[결과 읽기] cfd.fedit.or.kr: 느려짐 → 1단계(2 MB씩 · 초당 5 MB · 동시 1개)',
    `느린 표본 잇달아 3번 → 느려짐 · 1단계 상한은 느려지기 전 0단계 표본 중앙값 ${mbs(typ)} 의 절반 ${mbs(e.o.rate)} — 그때 잰 느린 실제 속도 ${mbs(e.o.measured)} 의 절반(바닥 1 MB/s)이 아님 · 하루 기억도: ${e.lines[0]}`);
}
{
  const e = env();
  for (let i = 0; i < 10; i++) await transfer(e, 2 * MiB, 200);
  const slow = () => transfer(e, 2 * MiB, 2000);
  await slow(); await slow(); await slow(); // 느린 표본 2번
  await transfer(e, 40 * MiB, 500); // 빠른 받기 — 느리지 않은 표본
  await slow(); await slow(); await slow();
  ok(e.o.stage === 0, '느린 표본 사이에 느리지 않은 표본이 끼면 처음부터 다시 셈');
  await slow();
  ok(e.o.stage === 1, '다시 잇달아 3번이면 느려짐');
}
{
  const e = env();
  for (let i = 0; i < 10; i++) await transfer(e, 2 * MiB, 200);
  const base = e.o.typicalRate;
  for (let i = 0; i < 20; i++) await transfer(e, 4 * KiB, 500); // 헤더 같은 작은 요청 20개 (아주 느림)
  ok(e.o.stage === 0 && e.o.typicalRate === base, '표본은 1 MB 를 받을 때마다 하나 — 작은 요청 20개(80 KB)로는 표본이 생기지 않음');
}
{
  // 상한 없는 1단계에서 느려짐 → 2단계 상한 = 느려지기 전 1단계 표본 중앙값의 절반 (그때 잰 느린 실제 속도의 절반이 아님)
  const e = env();
  await stallOne(e);
  const cap1 = e.o.rate;
  await e.clock.advance(SAME_EVENT_MS);
  for (let i = 0; i < 10; i++) await transfer(e, 2 * MiB, 250); // 1단계 8 MB/s
  const typ = e.o.typicalRate;
  for (let i = 0; i < 4; i++) await transfer(e, 2 * MiB, 4000); // 0.5 MB/s
  ok(cap1 === null && near(typ, 8 * MiB) && e.o.stage === 2 && near(e.o.measured, 0.5 * MiB) && near(e.o.rate, 4 * MiB)
    && e.lines[1] === '[결과 읽기] cfd.fedit.or.kr: 느려짐 → 2단계(1 MB씩 · 초당 4 MB · 동시 1개)',
    `상한 없는 1단계에서도 느려짐 → 2단계 상한 = 1단계 표본 중앙값 ${mbs(typ)} 의 절반 ${mbs(e.o.rate)} — 잰 ${mbs(e.o.measured)} 의 절반(바닥 1 MB/s)이 아님: ${e.lines[1]}`);
}
{
  // 상한 있는 1단계에서 느려짐 → 2단계 = 1단계 상한의 절반 (느린 순간 속도를 쓰지 않음). 같은 길에서 느려짐 대신 끊기면 전과 같이 잰 실제 속도와 상한 가운데 작은 것의 절반
  const mk = async () => {
    const e = env();
    await stallAfterStage0(e, 12, 100); // 1단계 상한 10 MB/s
    await e.clock.advance(SAME_EVENT_MS);
    for (let i = 0; i < 20; i++) await transfer(e, 2 * MiB, 100); // 상한 10 MB/s 에 묶여 받음
    return e;
  };
  const slow = (e) => transfer(e, 2 * MiB, 2000); // 1 MB/s < 상한 10 MB/s 의 4분의 1
  const a = await mk();
  let n = 0;
  while (a.o.stage === 1 && n < 10) { await slow(a); n++; }
  ok(a.o.stage === 2 && near(a.o.measured, MiB) && near(a.o.rate, 5 * MiB) && a.o.chunkBytes === MiB
    && a.lines[1] === '[결과 읽기] cfd.fedit.or.kr: 느려짐 → 2단계(1 MB씩 · 초당 5 MB · 동시 1개)',
    `상한 있는 1단계(10 MB/s)에서 느려짐(느린 받기 ${n}번) → 2단계 상한 = 1단계 상한의 절반 ${mbs(a.o.rate)} — 잰 ${mbs(a.o.measured)} 의 절반이 아님: ${a.lines[1]}`);
  const b = await mk();
  await slow(b); await slow(b); await slow(b); // 느린 표본 2번 (첫 표본은 창에 빠른 받기가 남아 느리지 않음) — 아직 느려짐 아님
  const seen = b.o.realRate;
  const still = b.o.stage;
  await stallOne(b);
  ok(still === 1 && near(seen, MiB) && b.o.stage === 2 && near(b.o.measured, seen) && b.o.rate === Math.max(MIN_RATE, Math.min(seen, 10 * MiB) / 2)
    && b.lines[1] === '[결과 읽기] cfd.fedit.or.kr: 끊김 → 2단계(1 MB씩 · 초당 1 MB · 동시 1개)',
    `끊김은 전과 같음: 같은 길에서 느려짐 전에 끊기면 2단계 = min(잰 ${mbs(seen)}, 상한 10 MB/s)의 절반 → 바닥 ${mbs(b.o.rate)}: ${b.lines[1]}`);
}
{
  // 끊김은 전과 같음 — 0단계에서도 잰 실제 속도(마지막 바이트까지 — 끊기기 전 속도)의 절반: 표본 중앙값이 20 MB/s 여도 끊기기 전 4 초가 4 MB/s 면 1단계 상한 2 MB/s
  const e = env();
  for (let i = 0; i < 20; i++) await transfer(e, 2 * MiB, 100); // 0단계 20 MB/s · 바쁜 2 초
  const typ = e.o.typicalRate;
  await transfer(e, 16 * MiB, 4000); // 4 MB/s — 느린 표본 하나(20 MB/s 의 4분의 1 아래), 아직 느려짐 아님
  const seen = e.o.realRate;
  await stallOne(e);
  ok(near(typ, 20 * MiB) && near(seen, 4 * MiB) && e.o.stage === 1 && near(e.o.measured, 4 * MiB) && near(e.o.rate, 2 * MiB)
    && e.lines[0] === '[결과 읽기] cfd.fedit.or.kr: 끊김 → 1단계(2 MB씩 · 초당 2 MB · 동시 1개)',
    `끊김은 전과 같음: 0단계 표본 중앙값 ${mbs(typ)} 가 아니라 잰 ${mbs(e.o.measured)} 의 절반 ${mbs(e.o.rate)}: ${e.lines[0]}`);
}
{
  // 느려짐도 바닥 1 MB/s · 속도 · 조각이 모두 바닥이면 느려짐이어도 더 낮추지 않음
  const W = Date.UTC(2026, 10, 6, 12);
  const e = env({ store: memStore(JSON.stringify({ [ORIGIN]: { stage: 2, rate: 1.5 * MiB, until: W + 3600 * 1000 } })), clock: fakeClock(W) });
  let n = 0;
  while (e.o.stage === 2 && n < 10) { await transfer(e, MiB, 4000); n++; } // 0.25 MB/s < 상한 1.5 MB/s 의 4분의 1
  ok(e.o.stage === 3 && e.o.rate === MIN_RATE && e.lines[1] === '[결과 읽기] cfd.fedit.or.kr: 느려짐 → 3단계(512 KB씩 · 초당 1 MB · 동시 1개)',
    `기억한 2단계 상한 1.5 MB/s 에서 느려짐 → 그 절반 0.75 MB/s 는 바닥 아래라 1 MB/s: ${e.lines[1]}`);
  const f = env({ store: memStore(JSON.stringify({ [ORIGIN]: { stage: 5, rate: MIN_RATE, until: W + 3600 * 1000 } })), clock: fakeClock(W) });
  for (let i = 0; i < 6; i++) await transfer(f, MiB, 8000); // 0.125 MB/s < 1 MB/s 의 4분의 1 — 느린 표본 6번
  ok(f.o.stage === 5 && f.o.rate === MIN_RATE && f.o.chunkBytes === 256 * KiB && f.lines.length === 1, `속도 · 조각 모두 바닥(5단계 256 KB · 1 MB/s)이면 느려짐이어도 그대로 · 콘솔 줄 없음 (줄 ${f.lines.length}개)`);
}
{
  // 2단계부터 기준은 상한: 상한에 묶여 느린 것은 느려짐이 아니고, 상한의 4분의 1 아래로 잇달아 3번이면 느려짐
  const e = env();
  await stallOne(e); await nextEvent(e); // 2단계 5 MB/s
  for (let i = 0; i < 40; i++) await transfer(e, MiB, 10); // 망은 빠르지만 상한 5 MB/s 에 묶임
  ok(e.o.stage === 2 && e.o.slowBase === 5 * MiB && e.lines.length === 2, `상한에 묶여 실제 속도 ${mbs(e.o.realRate)} — 느려짐 아님 (기준 = 상한 ${mbs(e.o.slowBase)})`);
  const slow = () => transfer(e, MiB, 2000); // 0.5 MB/s < 5 / 4
  await slow(); await slow(); await slow();
  ok(e.o.stage === 2, '상한 아래 느린 받기 3번 (첫 표본은 창에 앞의 받기가 남아 느리지 않음)');
  await slow();
  ok(e.o.stage === 3 && near(e.o.rate, 2.5 * MiB) && e.o.chunkBytes === 512 * KiB && e.lines[2] === '[결과 읽기] cfd.fedit.or.kr: 느려짐 → 3단계(512 KB씩 · 초당 2.5 MB · 동시 1개)',
    `상한의 4분의 1 아래로 잇달아 3번 → 느려짐 · 3단계 상한 = 앞 상한 5 MB/s 의 절반 ${mbs(e.o.rate)} — 잰 ${mbs(e.o.measured)} 의 절반(바닥 1 MB/s)이 아님: ${e.lines[2]}`);
}

console.log('\n== 올리지 않음 · 하루 기억 · origin 분리');
{
  const e = env();
  await stallOne(e);
  for (let i = 0; i < 60; i++) await transfer(e, 2 * MiB, 20); // 100 MB/s 로 아주 빨라도
  e.clock.wallOffset += DAY + 3600 * 1000; // 페이지를 연 채 하루가 지나도
  await transfer(e, 2 * MiB, 20);
  ok(e.o.stage === 1 && e.o.parallel === 1 && e.o.chunkBytes === 2 * MiB && e.o.rate === null && e.lines.length === 1, '한 번 낮춘 단계는 그 페이지에서 올리지 않음 (100 MB/s 60번 · 페이지를 연 채 25 시간)');
  await e.clock.advance(SAME_EVENT_MS); await stallOne(e);
  const r2 = e.o.rate;
  for (let i = 0; i < 60; i++) await transfer(e, MiB, 5);
  await e.clock.advance(SAME_EVENT_MS); await stallOne(e);
  ok(near(r2, 50 * MiB) && e.o.stage === 3 && e.o.rate <= r2 / 2, `다음 상한은 앞 상한을 넘지 않음 (2단계 ${mbs(r2)} → 3단계 ${mbs(e.o.rate)})`);
}
{
  const store = memStore();
  const e = env({ store });
  await stallOne(e);
  await nextEvent(e); // 2단계 5 MB/s
  const W = e.clock.wall();
  const e2 = env({ store, clock: fakeClock(W + 23 * 3600 * 1000) });
  ok(e2.o.stage === 2 && e2.o.rate === 5 * MiB && e2.o.parallel === 1 && e2.o.chunkBytes === MiB && e2.lines.length === 1
    && e2.lines[0].startsWith('[결과 읽기] cfd.fedit.or.kr: 기억한 2단계(1 MB씩 · 초당 5 MB · 동시 1개)로 시작 ('),
    `23 시간 뒤 새 페이지: 기억한 단계로 시작 — ${e2.lines[0]}`);
  const e3 = env({ store, clock: fakeClock(W + DAY + 1) });
  ok(e3.o.stage === 0 && e3.o.parallel === Infinity && e3.o.chunkBytes === Infinity && e3.lines.length === 0 && store.getItem(STORAGE_KEY) === null, '하루가 지난 새 페이지: 다시 제약 없음부터 · 지난 기록은 지움');
}
{
  // 기억한 단계에서 또 사건 → 그 단계에서 못 쟀으니 상한의 절반 · 조각 절반 · 기한 새로 (다른 저장소 사본)
  const W = Date.UTC(2026, 10, 6, 12);
  const store = memStore(JSON.stringify({ [ORIGIN]: { stage: 2, rate: 6 * MiB, until: W + 3600 * 1000 } }));
  const e = env({ store, clock: fakeClock(W) });
  await stallOne(e);
  const rec = stored(store)[ORIGIN];
  ok(e.o.stage === 3 && e.o.rate === 3 * MiB && e.o.chunkBytes === 512 * KiB && rec.stage === 3 && rec.rate === 3 * MiB && rec.until === e.clock.wall() + DAY,
    `기억한 2단계(6 MB/s)에서 끊김 → 3단계 ${e.o.rate / MiB} MB/s · 조각 512 KB · 기한은 낮춘 때부터 하루`);
  const store4 = memStore(JSON.stringify({ [ORIGIN]: { stage: 4, rate: 2 * MiB, until: W + 3600 * 1000 } }));
  const e4 = env({ store: store4, clock: fakeClock(W) });
  ok(e4.o.stage === 4 && e4.o.rate === 2 * MiB && e4.o.chunkBytes === 256 * KiB && e4.o.parallel === 1, '기억한 4단계로 시작하면 조각 256 KB · 동시 1');
}
{
  const e = env();
  await stallOne(e);
  const other = e.gov.forUrl('http://127.0.0.1:8090/__data/e2e-05/a.vtu');
  const sameOrigin = e.gov.forUrl(`${ORIGIN}/results/another-job/b.vtu`);
  ok(other.stage === 0 && other.parallel === Infinity && sameOrigin === e.o && sameOrigin.stage === 1, 'origin 분리: 다른 서버(개발 서버)는 0단계 그대로 · 같은 서버의 다른 파일은 같은 단계');
  ok(Object.keys(stored(e.store)).join() === ORIGIN, `기억도 그 주소만 (${Object.keys(stored(e.store)).join()})`);
  // 다른 탭이 그 사이 더 낮춰 둔 기록(3단계)은 이 페이지의 2단계로 덮지 않음 (기한도 그대로 — 더 얕은 단계의 사건으로 더 센 제약을 늘리지 않음)
  const deeperUntil = e.clock.wall() + DAY;
  e.store.setItem(STORAGE_KEY, JSON.stringify({ [ORIGIN]: { stage: 3, rate: 2 * MiB, until: deeperUntil } }));
  await nextEvent(e);
  const deeper = stored(e.store)[ORIGIN];
  ok(e.o.stage === 2 && deeper.stage === 3 && deeper.rate === 2 * MiB && deeper.until === deeperUntil, '다른 탭이 더 낮춰 둔 기록은 그대로 둠 (기한도 그대로)');
}
{
  // 같은 단계의 더 엄격한 기록(다른 탭 — 상한이 있고 더 낮음)도 덮지 않음 (검증 low): 단계 · 상한은 그대로 두고 기한만 이번 낮춘 때부터 하루로
  const e = env();
  e.store.setItem(STORAGE_KEY, JSON.stringify({ [ORIGIN]: { stage: 1, rate: 4 * MiB, until: e.clock.wall() + 3600 * 1000 } })); // 이 페이지를 연 뒤 다른 탭이 적음
  await stallAfterStage0(e, 12, 100); // 이 페이지는 1단계 상한 10 MB/s
  const rec = stored(e.store)[ORIGIN];
  ok(e.o.stage === 1 && near(e.o.rate, 10 * MiB) && rec.stage === 1 && rec.rate === 4 * MiB && rec.until === e.clock.wall() + DAY,
    `같은 1단계의 더 낮은 상한(다른 탭 4 MB/s)은 이 페이지의 10 MB/s 로 덮지 않음 · 기한은 이번 낮춘 때부터 하루 · 이 페이지는 제 상한 그대로 (${JSON.stringify(rec)})`);
  const next = env({ store: e.store, clock: fakeClock(e.clock.wall() + 1000) });
  ok(next.o.stage === 1 && next.o.rate === 4 * MiB, '다음에 여는 페이지는 지켜 둔 더 엄격한 기록(1단계 · 4 MB/s)으로 시작');
  const n = env();
  n.store.setItem(STORAGE_KEY, JSON.stringify({ [ORIGIN]: { stage: 1, rate: 4 * MiB, until: n.clock.wall() + 3600 * 1000 } }));
  await stallAfterStage0(n, 1, 100); // 0단계에서 못 잼(바쁜 0.2 초) → 이 페이지는 상한 없는 1단계
  ok(n.o.rate === null && stored(n.store)[ORIGIN].rate === 4 * MiB && stored(n.store)[ORIGIN].until === n.clock.wall() + DAY, '상한 없는 1단계로도 같은 단계의 상한 기록(4 MB/s)을 덮지 않음');
  const lower = env();
  lower.store.setItem(STORAGE_KEY, JSON.stringify({ [ORIGIN]: { stage: 1, rate: 12 * MiB, until: lower.clock.wall() + 3600 * 1000 } }));
  await stallAfterStage0(lower, 12, 100);
  const nul = env();
  nul.store.setItem(STORAGE_KEY, JSON.stringify({ [ORIGIN]: { stage: 1, rate: null, until: nul.clock.wall() + 3600 * 1000 } }));
  await stallAfterStage0(nul, 12, 100);
  ok(near(stored(lower.store)[ORIGIN].rate, 10 * MiB) && near(stored(nul.store)[ORIGIN].rate, 10 * MiB),
    '이 페이지의 상한이 더 낮으면(10 < 12 MB/s) · 앞 기록에 상한이 없으면(상한 없는 1단계) 이 페이지 기록으로 덮음');
  const s2 = env();
  await stallOne(s2); // 상한 없는 1단계
  s2.store.setItem(STORAGE_KEY, JSON.stringify({ [ORIGIN]: { stage: 2, rate: 3 * MiB, until: s2.clock.wall() + 3600 * 1000 } }));
  await nextEvent(s2); // 이 페이지는 2단계 5 MB/s (1단계에서 못 잼)
  const r2 = stored(s2.store)[ORIGIN];
  ok(s2.o.stage === 2 && s2.o.rate === 5 * MiB && r2.stage === 2 && r2.rate === 3 * MiB && r2.until === s2.clock.wall() + DAY, `2단계에서도 같은 단계의 더 낮은 상한(3 MB/s)을 지킴 (${JSON.stringify(r2)})`);
}
{
  const throwing = { getItem() { throw new Error('SecurityError'); }, setItem() { throw new Error('QuotaExceededError'); }, removeItem() { throw new Error('SecurityError'); } };
  const e = env({ store: throwing });
  await stallOne(e);
  ok(e.o.stage === 1 && e.lines.length === 1, '저장소를 못 쓰면(사생활 창 · 막힌 iframe) 예외 없이 이 페이지 메모리에서만');
  const junk = memStore('{"https://cfd.fedit.or.kr":{"stage":"two","until":1}}');
  const e2 = env({ store: junk });
  ok(e2.o.stage === 0 && junk.getItem(STORAGE_KEY) === null, '깨진 기록은 무시하고 지움');
}

// ===================== 2. fetchRange 와 함께 (가짜 서버 · 실제 시계) =====================
const SIZE = 1000;
const DATA = Uint8Array.from({ length: SIZE }, (_, i) => (i * 7 + 3) % 251);
const URL_ = 'https://srv/results/job/f.bin';
const sameBytes = (a, b) => a && b && a.byteLength === b.byteLength && a.every((v, i) => v === b[i]);
/**
 * 가짜 서버 (바이트 구간을 앎). plan: 요청 순서대로의 동작(모자라면 'ok') 또는 (n, req) => 동작.
 * 동작: 'ok' · 'hang' · 'neterr'(응답 머리 전 연결 실패 — TypeError) · { delay } · { stallAfter }(그만큼 주고 멈춤) · { resetAfter }(그만큼 주고 TypeError) ·
 * { closeAfter }(그만큼 주고 오류 없이 닫음 — 덜 받음) · { capTo }(서버가 구간을 그만큼으로 줄여 Content-Range 에 적음) · { status }(본문 없는 상태 코드) ·
 * { slowBody: ms }(본문 앞 절반을 주고 ms 뒤 나머지). 함께 줄 수 있는 것: hideRange(Content-Range 를 브라우저 코드가 못 읽음 — 다른 출처에서
 * Access-Control-Expose-Headers 가 없을 때) · noLength(Content-Length 도 없음). inflight 는 본문을 다 보낼 때까지 센다
 */
function fakeServer(plan = []) {
  const log = [];
  let inflight = 0, maxInflight = 0;
  const impl = (url, init = {}) => {
    const n = log.length;
    const range = init.headers?.Range ?? null;
    const method = init.method ?? 'GET';
    log.push({ method, range, url, cache: init.cache, t: performance.now() });
    const act = typeof plan === 'function' ? plan(n, { method, range, url }) : (plan[n] ?? 'ok');
    const signal = init.signal;
    inflight++; maxInflight = Math.max(maxInflight, inflight);
    let closed = false;
    const done = () => { if (!closed) { closed = true; inflight--; } };
    return new Promise((resolve, reject) => {
      const onAbort = () => { done(); reject(signal.reason ?? new DOMException('Aborted', 'AbortError')); };
      if (signal?.aborted) { onAbort(); return; }
      if (act === 'hang') { signal?.addEventListener('abort', onAbort, { once: true }); return; }
      if (act === 'neterr') { done(); reject(new TypeError('Failed to fetch')); return; }
      if (act?.status) { done(); resolve(new Response(null, { status: act.status })); return; }
      let a = 0, b = SIZE - 1, status = 200;
      const hdr = { 'content-length': String(SIZE), 'accept-ranges': 'bytes' };
      if (range) {
        const mm = /bytes=(\d+)-(\d+)/.exec(range);
        a = Number(mm[1]); b = Math.min(Number(mm[2]), SIZE - 1);
        if (act?.capTo) b = Math.min(b, a + act.capTo - 1);
        status = 206;
        if (!act?.hideRange) hdr['content-range'] = `bytes ${a}-${b}/${SIZE}`;
        hdr['content-length'] = String(b - a + 1);
      }
      if (act?.noLength) delete hdr['content-length'];
      if (method === 'HEAD') { done(); resolve(new Response(null, { status: 200, headers: hdr })); return; }
      const bytes = DATA.slice(a, b + 1);
      const makeBody = () => new ReadableStream({ // 응답할 때 만든다 (그때부터 보내기 시작 — inflight 는 본문을 다 보낼 때까지)
        start(c) {
          signal?.addEventListener('abort', () => { try { c.error(signal.reason); } catch { /* 닫힘 */ } done(); }, { once: true });
          if (act?.stallAfter !== undefined) { c.enqueue(bytes.slice(0, act.stallAfter)); return; }
          if (act?.resetAfter !== undefined) { c.enqueue(bytes.slice(0, act.resetAfter)); setTimeout(() => { try { c.error(new TypeError('network error')); } catch { /* 닫힘 */ } done(); }, 2); return; }
          if (act?.closeAfter !== undefined) { c.enqueue(bytes.slice(0, act.closeAfter)); c.close(); done(); return; }
          const mid = Math.floor(bytes.length / 2);
          if (act?.slowBody) {
            c.enqueue(bytes.slice(0, mid));
            setTimeout(() => { try { c.enqueue(bytes.slice(mid)); c.close(); } catch { /* 끊김 */ } done(); }, act.slowBody);
            return;
          }
          c.enqueue(bytes); c.close(); done();
        },
      });
      const respond = () => resolve(new Response(makeBody(), { status, headers: hdr }));
      if (act?.delay) setTimeout(respond, act.delay); else respond();
    });
  };
  return { impl, log, get maxInflight() { return maxInflight; } };
}
const fopts = (srv, governor, extra = {}) => ({ fetchImpl: srv.impl, stallMs: 30, delays: [0], onRetry: () => {}, governor, ...extra });
/** 조각 100 B 로 줄인 조절기 (기억하지 않음 · 조각 바닥 25 B) */
const smallGov = (tuning = {}, lines = []) => new RangeGovernor({ store: null, log: (l) => lines.push(l), tuning: { chunkBytes: 100, minChunkBytes: 25, ...tuning } });
const ranges = (s) => s.log.map((x) => x.range).join();

console.log('\n== fetchRange 와 함께');
{
  const s = fakeServer(() => ({ delay: 10 }));
  const g = smallGov();
  const rs = await Promise.all(Array.from({ length: 5 }, () => fetchRange(URL_, 0, 999, undefined, fopts(s, g))));
  ok(rs.every((r) => r.status === 206 && sameBytes(r.body, DATA)) && s.log.length === 5 && s.log.every((x) => x.range === 'bytes=0-999') && s.maxInflight === 5,
    `0단계: 구간을 큰 요청 한 번으로 (조각 100 B 조절기여도 나누지 않음) · 읽기 5개가 함께 (동시 최대 ${s.maxInflight})`);
  ok(s.log.every((x) => x.cache === 'no-store'),
    `바이트 구간 요청은 브라우저 HTTP 캐시를 거치지 않음(cache no-store — 캐시에서 꺼낸 본문을 망 속도로 세지 않게): ${[...new Set(s.log.map((x) => x.cache))].join()}`);
}
const lines1 = [];
const g1 = smallGov({}, lines1);
{
  const s = fakeServer([{ stallAfter: 300 }]);
  const r = await fetchRange(URL_, 0, 999, undefined, fopts(s, g1));
  const want = ['bytes=0-999', ...Array.from({ length: 7 }, (_, i) => `bytes=${300 + i * 100}-${399 + i * 100}`)].join();
  ok(r.status === 206 && sameBytes(r.body, DATA) && ranges(s) === want,
    `0단계 큰 요청이 300 B 에서 멈춤 → 1단계가 되어 남은 700 B 를 100 B 조각 7개로 이어 받음 (${s.log.map((x) => x.range).join(' → ')})`);
  ok(g1.forUrl(URL_).stage === 1 && lines1.join('|') === '[결과 읽기] srv: 끊김 → 1단계(100 B씩 · 동시 1개)', `콘솔 한 줄: ${lines1.join('|')}`);
}
{
  const s = fakeServer(() => ({ slowBody: 15 })); // 머리는 바로, 본문 나머지는 15 ms 뒤
  const rs = await Promise.all(Array.from({ length: 4 }, () => fetchRange(URL_, 0, 299, undefined, fopts(s, g1))));
  ok(rs.every((r) => sameBytes(r.body, DATA.slice(0, 300))) && s.log.length === 12 && s.maxInflight === 1,
    `1단계: 읽기 4개(조각 12개)를 합쳐 그 주소에서 동시에 1개 — 본문을 다 받을 때까지 자리 (동시 최대 ${s.maxInflight})`);
}
/** 실제 시계 조절기를 2단계로 (같은 사건 묶음 0 ms · 2단계 속도는 사실상 무제한 — 줄 차례 · 조각만 보려고) */
async function toStage2(o) {
  const t1 = await o.acquire(1); t1.stalled(); t1.release(false);
  const t2 = await o.acquire(1); t2.responded(); t2.received(1); t2.stalled(); t2.release(false);
  return o.stage;
}
{
  const g = smallGov({ sameEventMs: 0, fallbackRate: 1e12 });
  const o = g.forUrl(URL_);
  await toStage2(o);
  const s = fakeServer();
  const r = await fetchRange(URL_, 0, 299, undefined, fopts(s, g));
  const t3 = await o.acquire(1); t3.responded(); t3.received(1); t3.stalled(); t3.release(false);
  const s3 = fakeServer();
  const r3 = await fetchRange(URL_, 0, 99, undefined, fopts(s3, g));
  ok(sameBytes(r.body, DATA.slice(0, 300)) && ranges(s) === 'bytes=0-49,bytes=50-99,bytes=100-149,bytes=150-199,bytes=200-249,bytes=250-299'
    && o.stage === 3 && sameBytes(r3.body, DATA.slice(0, 100)) && ranges(s3) === 'bytes=0-24,bytes=25-49,bytes=50-74,bytes=75-99',
    `2단계부터 조각 절반: 1단계 100 B → 2단계 50 B (${s.log.length}개) → 3단계 25 B (${s3.log.length}개)`);
}
{
  const lines = [];
  const g = smallGov({}, lines);
  const s = fakeServer([{ resetAfter: 150 }]);
  const r = await fetchRange(URL_, 0, 999, undefined, fopts(s, g));
  const want = ['bytes=0-999', ...Array.from({ length: 9 }, (_, i) => `bytes=${150 + i * 100}-${Math.min(999, 249 + i * 100)}`)].join();
  ok(sameBytes(r.body, DATA) && g.forUrl(URL_).stage === 1 && lines.join('|') === '[결과 읽기] srv: 끊김 → 1단계(100 B씩 · 동시 1개)' && ranges(s) === want,
    `받는 도중 연결이 끊김(응답 머리 · 150 B 뒤 TypeError) → 끊김 신호 → 1단계, 남은 850 B 를 조각으로 (${lines.join('|')})`);
}
{
  const lines = [];
  const g = smallGov({}, lines);
  const s = fakeServer([{ closeAfter: 300 }]);
  const r = await fetchRange(URL_, 0, 999, undefined, fopts(s, g));
  ok(sameBytes(r.body, DATA) && g.forUrl(URL_).stage === 1 && lines.length === 1 && s.log[1]?.range === 'bytes=300-399',
    `덜 받음(Content-Range 1000 B 를 약속하고 300 B 에서 닫힘) → 끊김 신호 → 1단계 (${ranges(s)})`);
}
{
  const lines = [];
  const g = smallGov({}, lines);
  const s = fakeServer(['neterr', 'neterr', 'neterr']);
  const r = await fetchRange(URL_, 0, 999, undefined, fopts(s, g));
  const s2 = fakeServer([{ status: 503 }, { status: 503 }, { status: 502 }]);
  const r2 = await fetchRange(URL_, 0, 999, undefined, fopts(s2, g));
  ok(sameBytes(r.body, DATA) && s.log.length === 4 && sameBytes(r2.body, DATA) && s2.log.length === 4 && g.forUrl(URL_).stage === 0 && lines.length === 0,
    '응답 머리 전 연결 실패(TypeError) 3번 · 503 · 503 · 502 는 다시 보내기만 — 끊김 신호 아님 (단계 0 그대로)');
}
{
  const lines = [];
  const g = smallGov({}, lines);
  const s = fakeServer(() => ({ capTo: 400 }));
  const r = await fetchRange(URL_, 0, 999, undefined, fopts(s, g));
  ok(sameBytes(r.body, DATA) && ranges(s) === 'bytes=0-999,bytes=400-999,bytes=800-999' && g.forUrl(URL_).stage === 0 && lines.length === 0,
    `서버가 구간을 줄여 준 것(Content-Range 400 B 를 약속하고 다 줌)은 신호 아님 (${ranges(s)})`);
}
{
  // 다른 출처 배포에서 Content-Range 를 못 읽을 때(앞 검증 low): 약속한 양은 Content-Length — 요청한 크기와 견주지 않는다
  const lines = [];
  const g = smallGov({}, lines);
  const s = fakeServer(() => ({ capTo: 400, hideRange: true }));
  const r = await fetchRange(URL_, 0, 999, undefined, fopts(s, g));
  // 같은 날: Content-Range 가 없으면 '파일 끝에서 줄여 준 구간'과 '파일 중간에서 줄여 준 구간'을 가릴 수 없어, Content-Length 만큼 다 온 짧은 206 은
  // 파일 끝으로 보고 거기까지 돌려준다(전에는 나머지를 다시 받음 — 작은 파일의 끝을 넘는 읽기가 416 으로 실패). 구간을 파일 중간에서 줄이는 서버는 짧게 받는다
  ok(r.status === 206 && sameBytes(r.body, DATA.slice(0, 400)) && ranges(s) === 'bytes=0-999' && g.forUrl(URL_).stage === 0 && lines.length === 0,
    `Content-Range 숨김 · Content-Length 400 B 를 약속하고 다 줌(요청은 1000 B) → 덜 받음 신호 아님 · 파일 끝에서 줄여 준 것으로 보고 400 B 를 결과로, 다시 보내지 않음 (${ranges(s)})`);
  const s2 = fakeServer([{ closeAfter: 300, hideRange: true }]);
  const r2 = await fetchRange(URL_, 0, 999, undefined, fopts(s2, g));
  ok(sameBytes(r2.body, DATA) && g.forUrl(URL_).stage === 1 && lines.length === 1 && s2.log[1]?.range === 'bytes=300-399',
    `Content-Range 숨김 · Content-Length 1000 B 를 약속하고 300 B 에서 닫힘 → 덜 받음 신호 → 1단계 (${lines[0]})`);
}
{
  const lines = [];
  const g = smallGov({}, lines);
  const s = fakeServer([{ closeAfter: 300, hideRange: true, noLength: true }, { capTo: 400, hideRange: true, noLength: true }]);
  const r = await fetchRange(URL_, 0, 999, undefined, fopts(s, g));
  ok(sameBytes(r.body, DATA) && ranges(s) === 'bytes=0-999,bytes=300-999,bytes=700-999' && g.forUrl(URL_).stage === 0 && lines.length === 0,
    `Content-Range · Content-Length 를 둘 다 못 읽으면 덜 받음 신호를 내지 않음 — 나머지 다시 받기는 그대로 (${ranges(s)})`);
}
{
  // 취소는 끊김이 아니다(앞 검증 low): 응답 머리 · 본문 300 B 를 받은 뒤 바깥 signal 로 끊음 — 사유가 TypeError 여도 · 기본 AbortError 여도 단계 그대로
  const lines = [];
  const g = smallGov({}, lines);
  const errs = [];
  let sent = 0;
  for (const reason of [new TypeError('사용자가 끊음'), undefined]) {
    const s = fakeServer([{ stallAfter: 300 }]);
    const ac = new AbortController();
    const p = fetchRange(URL_, 0, 999, ac.signal, fopts(s, g, { stallMs: 5000 }));
    await sleep(20); // 응답 머리와 본문 300 B 를 받는 중
    ac.abort(reason);
    try { await p; errs.push('받음'); } catch (x) { errs.push(x); }
    sent += s.log.length;
  }
  ok(errs[0] instanceof TypeError && errs[0].message === '사용자가 끊음' && errs[1]?.name === 'AbortError' && sent === 2 && g.forUrl(URL_).stage === 0 && lines.length === 0,
    `받는 도중 바깥 signal 로 끊음(TypeError 사유 · AbortError) → 그 사유로 끝나고 다시 보내지 않으며 단계 그대로 (요청 ${sent}번 · 단계 ${g.forUrl(URL_).stage} · 콘솔 줄 ${lines.length})`);
  const g1 = smallGov({ sameEventMs: 0 }, lines); // 같은 사건 10 초 묶음 없이 — 취소를 신호로 세면 바로 2단계가 되게
  const o1 = g1.forUrl(URL_);
  { const t = await o1.acquire(1); t.stalled(); t.release(false); } // 1단계
  const s = fakeServer(() => ({ stallAfter: 50 }));
  const ac = new AbortController();
  const p = fetchRange(URL_, 0, 999, ac.signal, fopts(s, g1, { stallMs: 5000 }));
  await sleep(20);
  ac.abort(new TypeError('사용자가 끊음'));
  let err = null;
  try { await p; } catch (x) { err = x; }
  ok(err instanceof TypeError && o1.stage === 1 && o1.inFlight === 0 && lines.length === 1, `1단계 조각을 받는 도중의 취소(TypeError 사유)도 단계 그대로 · 자리는 돌려줌 (단계 ${o1.stage} · 나가 있음 ${o1.inFlight})`);
}
{
  // 취소 가드 — 덜 받음 쪽(검증 low): 본문 스트림이 약속(1000 B)보다 일찍 오류 없이 닫히는 바로 그 순간 바깥 signal 을 끊는다. 그러면 본문 읽기는 정상으로
  // 끝나고(attemptOnce 는 던지지 않음) fetchRange 가 덜 받음을 판정하기 전 틈에 signal 이 끊겨 있다 — 취소라 끊김 신호가 아니다(Content-Range · Content-Length 둘 다)
  for (const hide of [false, true]) {
    const lines = [];
    const g = smallGov({}, lines);
    const ac = new AbortController();
    let sent = 0, readEnd = false;
    const impl = (url, init = {}) => {
      sent++;
      const mm = /bytes=(\d+)-(\d+)/.exec(init.headers.Range);
      const a = Number(mm[1]), b = Math.min(Number(mm[2]), SIZE - 1);
      const hdr = { 'content-length': String(b - a + 1) };
      if (!hide) hdr['content-range'] = `bytes ${a}-${b}/${SIZE}`;
      let step = 0;
      const body = new ReadableStream({
        pull(c) {
          if (step++ === 0) { c.enqueue(DATA.slice(a, a + 300)); return; }
          c.close();   // 약속보다 일찍 오류 없이 닫힘 (덜 받음)
          ac.abort();  // 본문이 끝나는 바로 그때 — 판정 전 틈
          readEnd = true;
        },
      });
      return Promise.resolve(new Response(body, { status: 206, headers: hdr }));
    };
    let err = null;
    try { await fetchRange(URL_, 0, 999, ac.signal, { fetchImpl: impl, stallMs: 5000, delays: [0], onRetry: () => {}, governor: g }); } catch (x) { err = x; }
    const o = g.forUrl(URL_);
    ok(readEnd && err?.name === 'AbortError' && sent === 1 && o.stage === 0 && lines.length === 0 && o.inFlight === 0,
      `본문이 일찍 닫히는 바로 그때 끊은 취소(${hide ? 'Content-Range 숨김 · Content-Length' : 'Content-Range'} 1000 B 약속 · 300 B)는 덜 받음 신호 아님 — 그 사유로 끝나고 다시 보내지 않음 (요청 ${sent}번 · 단계 ${o.stage} · 콘솔 줄 ${lines.length})`);
  }
}
{
  // Content-Range 를 못 읽는 다른 출처 배포의 작은 파일(직전 검증 걱정 · 재현 check_eof_hidden_range): 끝을 넘는 헤더 읽기(0~65535)에 서버가 파일 끝까지 줄여 준
  // 206 을 주고 Content-Length(1000 B)만큼 다 오면 거기까지를 결과로 — 다시 보내지 않음 · 신호 없음. 서버는 nginx 처럼 끝을 넘는 시작점이면 416
  const eofServer = ({ hideRange = true, noLength = false } = {}) => {
    const log = [];
    const impl = async (url, init = {}) => {
      const mm = /bytes=(\d+)-(\d+)/.exec(init.headers.Range);
      const a = Number(mm[1]), b = Math.min(Number(mm[2]), SIZE - 1);
      log.push(init.headers.Range);
      if (a >= SIZE) return new Response(null, { status: 416 });
      const hdr = {};
      if (!noLength) hdr['content-length'] = String(b - a + 1);
      if (!hideRange) hdr['content-range'] = `bytes ${a}-${b}/${SIZE}`;
      return new Response(DATA.slice(a, b + 1), { status: 206, headers: hdr });
    };
    return { impl, log };
  };
  const run = async (srv, a, b, g) => fetchRange(URL_, a, b, undefined, { fetchImpl: srv.impl, stallMs: 1000, delays: [0], onRetry: () => {}, governor: g });
  const lines = [];
  const g = smallGov({}, lines);
  const s1 = eofServer();
  const r1 = await run(s1, 0, 65535, g);
  ok(r1.status === 206 && sameBytes(r1.body, DATA) && s1.log.join() === 'bytes=0-65535' && g.forUrl(URL_).stage === 0 && lines.length === 0,
    `Content-Range 숨김 · Content-Length 1000 B 를 다 줌(요청 65536 B) → 1000 B 를 결과로 · 다시 보내지 않음 · 신호 없음 (${s1.log.join(' → ')} · 전에는 → bytes=1000-65535 의 416 으로 실패)`);
  const s2 = eofServer({ noLength: true });
  const r2 = await run(s2, 0, 65535, g);
  ok(r2.status === 416 && r2.body === null && s2.log.join() === 'bytes=0-65535,bytes=1000-65535' && g.forUrl(URL_).stage === 0 && lines.length === 0,
    `Content-Range · Content-Length 를 둘 다 못 읽으면 지금 그대로 — 나머지를 다시 요청해 416 (${s2.log.join(' → ')}) · 신호 없음`);
  const s3 = eofServer({ hideRange: false });
  const r3 = await run(s3, 0, 65535, g);
  ok(r3.status === 206 && sameBytes(r3.body, DATA) && s3.log.join() === 'bytes=0-65535', `Content-Range 를 읽으면 전과 같이 전체 길이로 줄여 1000 B (${s3.log.join(' → ')})`);
  // Content-Length(400 B)보다 덜 오고(300 B) 닫히면 파일 끝이 아니라 덜 받음 — 지금 그대로 끊김 신호 · 나머지 다시 받기
  const gd = smallGov({}, []);
  const s5 = fakeServer([{ capTo: 400, closeAfter: 300, hideRange: true }]);
  const r5 = await fetchRange(URL_, 0, 999, undefined, fopts(s5, gd));
  ok(sameBytes(r5.body, DATA) && gd.forUrl(URL_).stage === 1 && s5.log[1]?.range === 'bytes=300-399',
    `Content-Range 숨김 · Content-Length 400 B 에 300 B 에서 닫힘 → 파일 끝으로 보지 않고 덜 받음 신호 → 1단계 · 나머지 다시 (${ranges(s5)})`);
  // 1단계 조각(100 B): 파일 끝이 조각 안에 있으면 그 조각에서 끝 — 850~1149 를 읽으면 850~949 · 950~1049(50 B 를 줌)에서 150 B
  const g1 = smallGov({}, lines);
  { const t = await g1.forUrl(URL_).acquire(1); t.stalled(); t.release(false); }
  const s4 = eofServer();
  const r4 = await run(s4, 850, 1149, g1);
  ok(r4.status === 206 && sameBytes(r4.body, DATA.slice(850)) && s4.log.join() === 'bytes=850-949,bytes=950-1049' && g1.forUrl(URL_).stage === 1 && lines.length === 1 && g1.forUrl(URL_).inFlight === 0,
    `1단계 조각에서도 파일 끝이 든 조각에서 끝 (${s4.log.join(' → ')} · ${r4.body?.byteLength} B · 단계 그대로 · 자리는 돌려줌)`);
  // 받는 쪽: HttpSource.read 는 짧은 결과를 그대로 넘기고, readVtuHeader(0~65535)는 끝까지 읽어 머리를 푼다 (전에는 'HTTP 416' 으로 실패)
  const vtu = new TextEncoder().encode('<?xml version="1.0"?>\n<VTKFile type="UnstructuredGrid" version="1.0" byte_order="LittleEndian" header_type="UInt64">\n'
    + '<UnstructuredGrid><Piece NumberOfPoints="3" NumberOfCells="2">\n<CellData><DataArray type="Float32" Name="T" format="appended" offset="0"/></CellData>\n'
    + '<Points><DataArray type="Float32" Name="Points" NumberOfComponents="3" format="appended" offset="16"/></Points>\n</Piece></UnstructuredGrid>\n'
    + '<AppendedData encoding="raw">\n_' + 'x'.repeat(16 + 44) + '\n</AppendedData></VTKFile>\n');
  const realFetch = globalThis.fetch;
  const vlog = [];
  globalThis.fetch = async (url, init = {}) => {
    const mm = /bytes=(\d+)-(\d+)/.exec(init.headers?.Range ?? '');
    vlog.push(init.headers?.Range ?? init.method ?? 'GET');
    if (!mm) return new Response(null, { status: 405 });
    const a = Number(mm[1]), b = Math.min(Number(mm[2]), vtu.byteLength - 1);
    if (a >= vtu.byteLength) return new Response(null, { status: 416 });
    return new Response(vtu.slice(a, b + 1), { status: 206, headers: { 'content-length': String(b - a + 1) } }); // Content-Range 는 못 읽음 (다른 출처)
  };
  try {
    const U = 'https://other-origin.test/results/job/small.vtu';
    let buf = null, h = null, msg = '';
    try { buf = await new HttpSource(U).read(0, 65535); h = await readVtuHeader(new HttpSource(U)); } catch (x) { msg = x.message; }
    ok(buf?.byteLength === vtu.byteLength && h?.numCells === 2 && h.arrays.map((x) => `${x.name}@${x.offset}`).join() === 'T@0,Points@16' && vlog.every((x) => x === 'bytes=0-65535')
      && rangeGovernor.forUrl(U).stage === 0,
      `작은 VTU(${vtu.byteLength} B): HttpSource.read(0, 65535) 는 ${buf?.byteLength} B · readVtuHeader 는 배열 ${h?.arrays.length}개를 풂 (요청 ${vlog.join(' → ')} · 단계 ${rangeGovernor.forUrl(U).stage}${msg ? ` · 오류 ${msg}` : ''})`);
  } finally { globalThis.fetch = realFetch; }
}
{
  // 재현: 연결 자리 6개인 서버(HTTP/1.1 브라우저와 같은 꼴). 자리를 기다린 2개는 응답 머리 없이 멈춤 문턱을 넘지만, 그동안 다른 요청에서 바이트가 흐른다
  const lines = [];
  const g = smallGov({}, lines);
  let busy = 0, maxBusy = 0;
  const waiting = [];
  const log = [];
  const impl = (url, init = {}) => new Promise((resolve, reject) => {
    const mm = /bytes=(\d+)-(\d+)/.exec(init.headers.Range);
    const a = Number(mm[1]), b = Math.min(Number(mm[2]), SIZE - 1);
    log.push(init.headers.Range);
    const signal = init.signal;
    let ctrl = null, timer = null, slot = false, over = false;
    const free = () => { if (slot && !over) { over = true; busy--; const nx = waiting.shift(); if (nx) nx(); } };
    const start = () => {
      slot = true; busy++; maxBusy = Math.max(maxBusy, busy);
      let at = a;
      resolve(new Response(new ReadableStream({ start(c) { ctrl = c; } }), { status: 206, headers: { 'content-range': `bytes ${a}-${b}/${SIZE}` } }));
      const tick = () => {
        const n = Math.min(50, b - at + 1);
        ctrl.enqueue(DATA.slice(at, at + n)); at += n;
        if (at > b) { ctrl.close(); free(); return; }
        timer = setTimeout(tick, 10);
      };
      timer = setTimeout(tick, 10);
    };
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      const i = waiting.indexOf(start);
      if (i >= 0) waiting.splice(i, 1);
      const r = signal.reason ?? new DOMException('Aborted', 'AbortError');
      if (ctrl) { try { ctrl.error(r); } catch { /* 닫힘 */ } } else reject(r);
      free();
    }, { once: true });
    if (busy < 6) start(); else waiting.push(start);
  });
  let headStalls = 0;
  const rs = await Promise.all(Array.from({ length: 8 }, () => fetchRange(URL_, 0, 999, undefined, { fetchImpl: impl, stallMs: 60, delays: [0], governor: g, onRetry: (n, why) => { if (why === '응답 멈춤') headStalls++; } })));
  ok(rs.every((r) => sameBytes(r.body, DATA)) && maxBusy === 6 && headStalls >= 2 && g.forUrl(URL_).stage === 0 && lines.length === 0,
    `연결 6개 서버에 0단계 읽기 8개: 자리를 기다린 요청이 응답 머리 없이 ${headStalls}번 멈췄지만 그동안 다른 요청에서 바이트가 흘러 끊김으로 세지 않음 (단계 0 · 콘솔 줄 ${lines.length})`);
}
{
  // 1단계 우선 줄: 전 시점 범위가 받는 중에 보는 장면 1 · 2 를 차례로 부름 → 나중에 부른 보는 장면 2 먼저, 그다음 1, 전 시점 범위는 뒤로
  const g = smallGov();
  const o = g.forUrl(URL_);
  { const t = await o.acquire(1); t.stalled(); t.release(false); }
  const s = fakeServer(() => ({ delay: 8 }));
  const SCAN = 'https://srv/results/job/scan.bin', V1 = 'https://srv/results/job/v1.bin', V2 = 'https://srv/results/job/v2.bin';
  const scan = fetchRange(SCAN, 0, 999, undefined, fopts(s, g, { priority: PRIORITY_SCAN }));
  await flush(); // 전 시점 범위의 첫 조각이 나감
  const v1 = fetchRange(V1, 0, 299, undefined, fopts(s, g, { priority: PRIORITY_VIEW }));
  const v2 = fetchRange(V2, 0, 299, undefined, fopts(s, g, { priority: PRIORITY_VIEW }));
  const [rs, r1, r2] = await Promise.all([scan, v1, v2]);
  const names = s.log.map((x) => (x.url === SCAN ? 's' : x.url === V1 ? '1' : '2')).join('');
  ok(o.stage === 1 && sameBytes(rs.body, DATA) && sameBytes(r1.body, DATA.slice(0, 300)) && sameBytes(r2.body, DATA.slice(0, 300)) && names === 's222111sssssssss' && s.maxInflight === 1,
    `우선 줄: 보낸 차례 ${names} (s = 전 시점 범위 · 1 · 2 = 먼저 · 나중에 부른 보는 장면, 동시 ${s.maxInflight})`);
}
{
  const g = smallGov();
  const o = g.forUrl(URL_);
  { const t = await o.acquire(1); t.stalled(); t.release(false); } // 1단계 — 자리 1개
  const h1 = await o.acquire(1);
  const s = fakeServer();
  const ac = new AbortController();
  const p = fetchRange(URL_, 0, 99, ac.signal, fopts(s, g));
  await sleep(5);
  const queued = o.waiting === 1 && s.log.length === 0;
  h1.release(true); // 줄의 요청이 자리를 받고
  ac.abort();       // 같은 흐름에서(보내기 직전) 끊김
  let err = null;
  try { await p; } catch (x) { err = x; }
  ok(queued && err?.name === 'AbortError' && s.log.length === 0 && o.inFlight === 0 && o.waiting === 0,
    `줄에서 기다린 뒤 보내기 직전에 끊기면 보내지 않고 자리도 돌려줌 (요청 ${s.log.length}번 · 나가 있음 ${o.inFlight})`);
  // 0단계에서도 조절기 줄의 await 틈에서 끊기면 보내지 않음 (검증 지적 4 재현: 부르고 같은 흐름에서 abort)
  const g0 = smallGov();
  const ac2 = new AbortController();
  const p2 = fetchRange(URL_, 0, 99, ac2.signal, fopts(s, g0));
  ac2.abort();
  let err2 = null;
  try { await p2; } catch (x) { err2 = x; }
  ok(err2?.name === 'AbortError' && s.log.length === 0 && g0.forUrl(URL_).inFlight === 0, `부르고 같은 흐름에서 끊으면 요청이 나가지 않음 — AbortError (요청 ${s.log.length}번)`);
}
{
  // fetchWhole(HEAD · 폴더 목록 · 작은 파일)은 줄을 서지 않는다 — 2단계에서 자리가 다 차 있어도 바로
  const g = smallGov({ sameEventMs: 0, fallbackRate: 1e12 });
  const o = g.forUrl(URL_);
  await toStage2(o);
  const hold = await o.acquire(1);
  const s = fakeServer();
  const t0 = performance.now();
  const h = await fetchWhole(URL_, { method: 'HEAD' }, undefined, fopts(s, g));
  const w = await fetchWhole(URL_, {}, undefined, fopts(s, g));
  ok(h.ok && sameBytes(w.body, DATA) && s.log.length === 2 && performance.now() - t0 < 200 && o.waiting === 0, 'HEAD · 전체 받기(fetchWhole)는 자리가 다 차 있어도 줄을 서지 않음');
  hold.release(true);
}
{
  // HttpSource.read: NaN 구간은 요청 전에 거부 (검증 지적 3 — offset 속성이 숫자가 아닌 VTU 에서 start 가 NaN)
  const realFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls++; return new Response('', { status: 500 }); };
  try {
    const U = 'https://nan.test/results/x.vtu';
    const src = new HttpSource(U);
    const msgs = [];
    for (const [a, b] of [[NaN, NaN], [10, NaN], [NaN, 10]]) { try { await src.read(a, b); msgs.push('받음'); } catch (x) { msgs.push(x.message); } }
    const o = rangeGovernor.forUrl(U);
    ok(calls === 0 && msgs[0] === '바이트 구간이 잘못되었습니다 (NaN~NaN): x.vtu' && msgs.every((x) => x.startsWith('바이트 구간이 잘못되었습니다')) && o.inFlight === 0 && o.waiting === 0 && o.stage === 0,
      `HttpSource.read(NaN, …) 는 요청 전에 한 줄로 거부 · 조절기 상태 그대로 (fetch ${calls}번 · ${msgs[0]})`);
    // 바이트 범위를 무시하는 서버(파일 전체를 받아 둠 — whole)에서도 NaN 은 잘라 쓰지 않고 거부
    globalThis.fetch = async () => { calls++; return new Response(DATA, { status: 200, headers: { 'content-length': String(SIZE) } }); };
    const w = new HttpSource('https://nan.test/results/whole.vtu');
    const first = new Uint8Array(await w.read(0, 9));
    const before = calls;
    let wmsg = null;
    try { await w.read(NaN, NaN); wmsg = '받음'; } catch (x) { wmsg = x.message; }
    ok(w.wholeFile && sameBytes(first, DATA.slice(0, 10)) && calls === before && wmsg === '바이트 구간이 잘못되었습니다 (NaN~NaN): whole.vtu', `파일 전체를 받아 둔 원본에서도 NaN 구간은 거부 (${wmsg})`);
  } finally { globalThis.fetch = realFetch; }
}
{
  // governor 를 주지 않으면 모듈이 함께 쓰는 rangeGovernor — 그 주소만 낮추고 콘솔(console.warn)에 한 줄
  const U = 'https://adaptive-default.test/results/a.bin';
  const warn = console.warn;
  const warned = [];
  console.warn = (...a) => warned.push(a.join(' '));
  try {
    const s = fakeServer([{ stallAfter: 10 }]);
    const r = await fetchRange(U, 0, 99, undefined, { fetchImpl: s.impl, stallMs: 30, delays: [0], onRetry: () => {} });
    ok(sameBytes(r.body, DATA.slice(0, 100)) && rangeGovernor.forUrl(U).stage === 1 && rangeGovernor.forUrl('https://other.test/a.bin').stage === 0
      && warned.join('|') === '[결과 읽기] adaptive-default.test: 끊김 → 1단계(2 MB씩 · 동시 1개)',
      `governor 를 주지 않으면 rangeGovernor: 그 주소만 1단계 · 콘솔 한 줄 (${warned.join('|')})`);
  } finally { console.warn = warn; }
}

// ===================== 3. 운영 서버 꼴 가짜 서버 (가짜 시계 · 기본 상수 그대로) =====================
const SIZE_BIG = 319_958_664; // 운영 서버 thermal_0.vtu 크기 (직전 Node 실측)
const SPAN = 17_616_077;      // 구간 하나 16.8 MB
const GAP = 15 * MiB;         // 구간 시작 간격
/**
 * 운영 서버 꼴 가짜 서버 (가짜 시계): 요청마다 latencyMs 뒤 응답 머리, 본문은 lineRate 로 piece 씩. 최근 windowMs 동안 보낸 바이트가 초당 limit 을 넘게 되면
 * 그때부터 blockMs 동안 모든 응답 머리 · 본문을 멈춘다(통째 끊김 — 그 사이 온 요청도 머리를 받지 못하고, 끊김이 끝나면 다시 흐른다)
 */
function burstServer(clock, { latencyMs = 10, lineRate = 100 * MiB, windowMs = 1000, limit = 20 * MiB, blockMs = 30_000, piece = 256 * KiB } = {}) {
  const sentLog = [];
  let blockedUntil = -Infinity;
  const st = { blocks: 0, blockAt: [], requests: 0, inflight: 0, maxInflight: 0 };
  const zero = new Uint8Array(piece);
  const windowBytes = (now) => { while (sentLog.length && sentLog[0][0] <= now - windowMs) sentLog.shift(); let s = 0; for (const x of sentLog) s += x[1]; return s; };
  const impl = (url, init = {}) => {
    st.requests++;
    const signal = init.signal;
    const mm = /bytes=(\d+)-(\d+)/.exec(init.headers?.Range ?? '');
    const a = Number(mm[1]), b = Math.min(Number(mm[2]), SIZE_BIG - 1);
    st.inflight++; st.maxInflight = Math.max(st.maxInflight, st.inflight);
    return new Promise((resolve, reject) => {
      let timer = null, ctrl = null, over = false;
      const end = () => { if (!over) { over = true; st.inflight--; signal?.removeEventListener('abort', onAbort); } };
      const later = (ms, fn) => { timer = clock.setTimer(() => { timer = null; if (!over) fn(); }, ms); };
      function onAbort() {
        if (timer !== null) clock.clearTimer(timer);
        const r = signal.reason ?? new DOMException('Aborted', 'AbortError');
        if (ctrl) { try { ctrl.error(r); } catch { /* 닫힘 */ } } else reject(r);
        end();
      }
      if (signal?.aborted) { onAbort(); return; }
      signal?.addEventListener('abort', onAbort, { once: true });
      let left = b - a + 1;
      const pieceMs = () => (Math.min(piece, left) * 1000) / lineRate;
      const send = () => {
        const now = clock.now();
        if (now < blockedUntil) { later(blockedUntil - now, send); return; }
        const n = Math.min(piece, left);
        if (windowBytes(now) + n > (limit * windowMs) / 1000) { blockedUntil = now + blockMs; st.blocks++; st.blockAt.push(now); later(blockMs, send); return; }
        sentLog.push([now, n]);
        ctrl.enqueue(zero.subarray(0, n));
        left -= n;
        if (left <= 0) { ctrl.close(); end(); return; }
        later(pieceMs(), send);
      };
      const head = () => {
        const now = clock.now();
        if (now < blockedUntil) { later(blockedUntil - now, head); return; }
        resolve(new Response(new ReadableStream({ start(c) { ctrl = c; } }), { status: 206, headers: { 'content-range': `bytes ${a}-${b}/${SIZE_BIG}`, 'content-length': String(b - a + 1) } }));
        later(pieceMs(), send);
      };
      later(latencyMs, head);
    });
  };
  return { impl, st };
}
/** 전역 setTimeout · clearTimeout 을 가짜 시계로 바꿔 fn 을 끝까지 돌린다 (fetchRange 의 멈춤 시계 · 다시 보내기 쉼도 가짜 시계에서) */
async function runOnFakeTimers(clock, fn) {
  const st = globalThis.setTimeout, ct = globalThis.clearTimeout;
  globalThis.setTimeout = (f, ms, ...args) => clock.setTimer(() => f(...args), ms ?? 0);
  globalThis.clearTimeout = (id) => { if (id !== undefined && id !== null) clock.clearTimer(id); };
  try {
    let settled = false;
    const p = fn();
    p.then(() => { settled = true; }, () => { settled = true; });
    for (;;) {
      await flush(3);
      if (settled) break;
      if (!(await clock.step())) throw new Error('타이머 없이 멈춤');
    }
    return await p;
  } finally { globalThis.setTimeout = st; globalThis.clearTimeout = ct; }
}

console.log('\n== 운영 서버 꼴 가짜 서버: 직전 Node 실측(16.8 MB × 20 · 끊김 5번)과 같은 받기 — 1단계 상한 없던 직전 규칙은 끊김 2번');
{
  const clock = fakeClock();
  const lines = [];
  const g = new RangeGovernor({ clock, store: null, log: (l) => lines.push(`${(clock.t / 1000).toFixed(1)} 초 ${l}`) });
  const srv = burstServer(clock);
  const got = [];
  await runOnFakeTimers(clock, async () => {
    for (let i = 0; i < 20; i++) {
      const start = i * GAP;
      const r = await fetchRange(`https://cfd.fedit.or.kr/results/live/thermal_0.vtu`, start, start + SPAN - 1, undefined, { fetchImpl: srv.impl, governor: g, onRetry: () => {} });
      got.push(r.status === 206 && r.body.byteLength === SPAN);
    }
  });
  const o = g.forOrigin('https://cfd.fedit.or.kr');
  console.log(`    가짜 서버 끊김 ${srv.st.blocks}번 (${srv.st.blockAt.map((t) => `${(t / 1000).toFixed(1)} 초`).join(' · ')}) · 요청 ${srv.st.requests}번 · 걸린 시간 ${(clock.t / 1000).toFixed(1)} 초 · 끝 단계 ${o.describe()}`);
  for (const l of lines) console.log(`    ${l}`);
  ok(got.length === 20 && got.every(Boolean), `구간 20개 모두 길이 맞음 (${got.filter(Boolean).length}/20)`);
  ok(srv.st.blocks <= 2 && lines.length === srv.st.blocks, `끊김 횟수가 직전 규칙(1단계 상한 없음)의 2번보다 많지 않음 (Node 실측은 5번): ${srv.st.blocks}번 · 콘솔 줄 ${lines.length}개 (끊김 하나에 한 줄)`);
  ok(o.rate !== null && o.rate * 1 + o.chunkBytes <= 20 * MiB, `끝 단계는 가짜 서버 문턱 아래 (1 초에 많아야 상한 ${mbs(o.rate)} + 조각 ${o.chunkBytes / KiB} KB < 20 MB)`);
}

console.log('\n== Chrome 실측 A 꼴 가짜 서버: 0단계 · 상한 없는 1단계(약 20 MB/s)는 끊기고 초당 10 MB 근처는 끊기지 않는 서버');
{
  // 꾸민 규칙: 줄 속도 21 MiB/s · 첫 바이트 5 ms · 최근 3 초 동안 보낸 양이 초당 16 MiB 를 넘으면 30 초 통째 끊음. 16.8 MiB 구간 12개를 차례로(실측 A 와 같은 꼴).
  // 저장소 밖 견주기: 직전 규칙(1단계 상한 없음)은 7.3 초에 1단계 · 39.7 초에 2단계(초당 10 MB)로 끊김 2번, 75.3 초 — 실측 A(7.1 · 44.2 초, 2단계 9.2 MB/s, 90.4 초)와 같은 꼴
  const clock = fakeClock();
  const lines = [];
  const g = new RangeGovernor({ clock, store: null, log: (l) => lines.push(`${(clock.t / 1000).toFixed(1)} 초 ${l}`) });
  const srv = burstServer(clock, { lineRate: 21 * MiB, latencyMs: 5, windowMs: 3000, limit: 16 * MiB });
  const got = [];
  await runOnFakeTimers(clock, async () => {
    for (let i = 0; i < 12; i++) {
      const start = i * GAP;
      const r = await fetchRange(`https://cfd.fedit.or.kr/results/live/thermal_0.vtu`, start, start + SPAN - 1, undefined, { fetchImpl: srv.impl, governor: g, onRetry: () => {} });
      got.push(r.status === 206 && r.body.byteLength === SPAN);
    }
  });
  const o = g.forOrigin('https://cfd.fedit.or.kr');
  console.log(`    가짜 서버 끊김 ${srv.st.blocks}번 (${srv.st.blockAt.map((t) => `${(t / 1000).toFixed(1)} 초`).join(' · ')}) · 요청 ${srv.st.requests}번 · 걸린 시간 ${(clock.t / 1000).toFixed(1)} 초 · 끝 단계 ${o.describe()}`);
  for (const l of lines) console.log(`    ${l}`);
  ok(got.length === 12 && got.every(Boolean), `구간 12개 모두 길이 맞음 (${got.filter(Boolean).length}/12)`);
  ok(srv.st.blocks === 1 && lines.length === 1 && o.stage === 1, `끊김 1번 — 직전 규칙(1단계 상한 없음)은 2번 (이번 ${srv.st.blocks}번 · 콘솔 줄 ${lines.length}개 · 끝 ${o.stage}단계)`);
  ok(o.measured > 18 * MiB && o.measured < 22 * MiB && near(o.rate, o.measured / 2) && /끊김 → 1단계\(2 MB씩 · 초당 \d+(\.\d)? MB · 동시 1개\)$/.test(lines[0] ?? ''),
    `1단계 상한 = 0단계에서 잰 ${mbs(o.measured)} 의 절반 ${mbs(o.rate)} — ${lines[0]}`);
}

console.log(fail ? `\n실패 ${fail} · 통과 ${pass}` : `\n모두 통과 (${pass})`);
process.exit(fail ? 1 : 0);

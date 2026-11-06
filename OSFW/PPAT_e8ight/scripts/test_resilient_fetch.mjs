#!/usr/bin/env node
// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   test_resilient_fetch.mjs

src/data/resilientFetch.ts(멈추거나 끊긴 결과 파일 요청을 끊고 다시 보내기 · 이어 받기 · 조각 나눠 받기)의 Node 시험.
esbuild 로 메모리에서 묶어(파일을 쓰지 않음) data: 주소로 불러 쓴다. 서버 대신 바이트 구간을 아는 가짜 fetch 를 쓴다 —
요청마다 계획(정상 · 응답 없음 · 연결 실패 · 본문 도중 멈춤 · 본문 도중 끊김 · 일찍 닫힘 · 상태 코드 · Range 무시)을 정할 수 있다.
멈춤 문턱은 30 ms, 쉬는 시간은 0 으로 줄여 빨리 돈다. 여기 시험은 받기 단계 조절기 없이(governor: null) 받기 자체를 보고, 조각 크기는 opts.chunk 로 준다
(2026-11-06 밤 — 고정 속도 조절기 RateLimiter · 읽기 안 동시 받기를 빼고 자동 단계 조절기로 바꿈. 조절기와 함께 도는 시험은 test_adaptive_fetch.mjs).

실행: node scripts/test_resilient_fetch.mjs
*/
/******************************************************************************/

import { build } from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const res = await build({
  stdin: { contents: "export * from './src/data/resilientFetch'; export { CHUNK_BYTES } from './src/data/rangeGovernor';", resolveDir: ROOT, loader: 'ts' },
  bundle: true, platform: 'neutral', format: 'esm', target: 'es2022', write: false, logLevel: 'silent',
});
const m = await import(`data:text/javascript;base64,${Buffer.from(res.outputFiles[0].text).toString('base64')}`);
const { fetchWhole, fetchRange, toArrayBuffer, STALL_MS, MAX_TRIES, RETRY_DELAYS_MS, CHUNK_BYTES } = m;

let fail = 0, pass = 0;
const ok = (cond, name, extra = '') => { if (cond) { pass++; console.log(`PASS ${name}`); } else { fail++; console.log(`FAIL ${name} ${extra}`); } };
const sameBytes = (a, b) => a && b && a.byteLength === b.byteLength && a.every((v, i) => v === b[i]);

// ---------- 가짜 서버 ----------
const SIZE = 1000;
const DATA = Uint8Array.from({ length: SIZE }, (_, i) => (i * 7 + 3) % 251);
const URL_ = 'https://srv/results/job/f.bin';

/**
 * plan: 요청 순서대로의 동작. 모자라면 'ok'. 함수면 (n, req) => 동작.
 * 동작: 'ok' · 'hang'(응답 없음) · 'neterr'(연결 실패) · 'ignoreRange'(200 전체) · { status } · { stallAfter: n } · { resetAfter: n } · { shortBy: n }(오류 없이 n 바이트 덜 주고 닫음)
 */
function fakeServer(plan = []) {
  const log = [];
  let inflight = 0, maxInflight = 0;
  const impl = (url, init = {}) => {
    const n = log.length;
    const range = init.headers?.Range ?? null;
    const method = init.method ?? 'GET';
    log.push({ method, range, url, t: performance.now() }); // t = 보낸 시각 (속도 조절 시험)
    const act = typeof plan === 'function' ? plan(n, { method, range }) : (plan[n] ?? 'ok');
    const signal = init.signal;
    inflight++; maxInflight = Math.max(maxInflight, inflight);
    const done = () => { inflight--; };
    return new Promise((resolve, reject) => {
      const onAbort = () => { done(); reject(signal.reason ?? new DOMException('Aborted', 'AbortError')); };
      if (signal?.aborted) { onAbort(); return; }
      if (act === 'hang') { signal?.addEventListener('abort', onAbort, { once: true }); return; }
      if (act === 'neterr') { done(); reject(new TypeError('Failed to fetch')); return; }
      if (act && typeof act === 'object' && 'status' in act) { done(); resolve(new Response(method === 'HEAD' ? null : 'err', { status: act.status })); return; }
      // 본문 구간
      let a = 0, b = SIZE - 1, status = 200;
      const hdr = { 'content-length': String(SIZE), 'accept-ranges': 'bytes' };
      if (range && act !== 'ignoreRange') {
        const mm = /bytes=(\d+)-(\d+)/.exec(range);
        a = Number(mm[1]); b = Math.min(Number(mm[2]), SIZE - 1);
        if (a >= SIZE) { done(); resolve(new Response('', { status: 416, headers: { 'content-range': `bytes */${SIZE}` } })); return; }
        status = 206;
        hdr['content-range'] = `bytes ${a}-${b}/${SIZE}`;
        hdr['content-length'] = String(b - a + 1);
      }
      if (method === 'HEAD') { done(); resolve(new Response(null, { status: 200, headers: hdr })); return; }
      const bytes = DATA.slice(a, b + 1);
      const stallAfter = act?.stallAfter, resetAfter = act?.resetAfter, shortBy = act?.shortBy;
      const makeBody = () => new ReadableStream({
        start(c) {
          signal?.addEventListener('abort', () => { try { c.error(signal.reason); } catch { /* 이미 닫힘 */ } done(); }, { once: true });
          if (stallAfter !== undefined) { c.enqueue(bytes.slice(0, stallAfter)); return; } // 그 뒤로 아무것도 안 옴
          if (resetAfter !== undefined) { c.enqueue(bytes.slice(0, resetAfter)); setTimeout(() => { try { c.error(new TypeError('network error')); } catch { /* */ } done(); }, 1); return; }
          const end = shortBy ? bytes.length - shortBy : bytes.length;
          // 두 조각으로 나눠 보낸다
          const mid = Math.floor(end / 2);
          if (mid > 0) c.enqueue(bytes.slice(0, mid));
          if (end - mid > 0) c.enqueue(bytes.slice(mid, end));
          c.close(); done();
        },
      });
      const respond = () => resolve(new Response(makeBody(), { status, headers: hdr })); // 본문은 응답할 때 만든다(그때부터 보내기 시작)
      if (act?.delay) setTimeout(respond, act.delay); else respond();
    });
  };
  return { impl, log, get maxInflight() { return maxInflight; } };
}

const retries = [];
/** 시험 옵션: 받기 단계 조절기 없이(governor: null — 모듈이 함께 쓰는 rangeGovernor 의 상태를 시험이 바꾸지 않게) */
const opts = (srv, extra = {}) => ({ fetchImpl: srv.impl, stallMs: 30, delays: [0], onRetry: (n, why) => retries.push([n, why]), governor: null, ...extra });
const clear = () => { retries.length = 0; };

// ---------- 상수 ----------
// 1단계부터의 조각 2 MB (2026-11-06 — 운영 서버에서 큰 응답을 한꺼번에 빠르게 받으면 30~55 초 끊김, 2 MB 를 차례로 받으면 멈춤 0). 0단계는 나누지 않는다(test_adaptive_fetch)
ok(STALL_MS === 5000 && MAX_TRIES === 16 && CHUNK_BYTES === 2 * 1024 * 1024, `상수 (멈춤 ${STALL_MS} ms · ${MAX_TRIES}번 · 1단계부터 조각 ${CHUNK_BYTES} B)`);
{
  // 다시 보내기 예산: 멈춤만 이어질 때 MAX_TRIES × 멈춤 문턱 + 쉬는 시간 합 (n 번째 다시 보내기 전 쉼 = RETRY_DELAYS_MS[n-1], 모자라면 마지막 값).
  // 운영 서버에서 잰 30~55 초 끊김(2026-11-06 오후)을 넘겨야 한다 — 2 분 남짓
  let rest = 0;
  for (let a = 1; a < MAX_TRIES; a++) rest += RETRY_DELAYS_MS[Math.min(a - 1, RETRY_DELAYS_MS.length - 1)];
  const budget = MAX_TRIES * STALL_MS + rest;
  ok(RETRY_DELAYS_MS.join() === '300,1000,2000,3000,4000' && rest === 50300 && budget === 130300 && budget >= 120000,
    `예산: 멈춤만 이어지면 ${MAX_TRIES} × ${STALL_MS} ms + 쉼 ${rest} ms = ${budget} ms (2 분 넘음 — 55 초 끊김 두 번 남짓) · 쉼은 4 초까지 그대로`);
}

// ---------- fetchWhole ----------
console.log('\n== fetchWhole');
{
  clear(); const s = fakeServer();
  const r = await fetchWhole(URL_, {}, undefined, opts(s));
  ok(r.status === 200 && r.ok && sameBytes(r.body, DATA) && s.log.length === 1 && !retries.length, '정상: 본문 전체 · 한 번');
}
{
  clear(); const s = fakeServer();
  const r = await fetchWhole(URL_, { method: 'HEAD' }, undefined, opts(s));
  ok(r.ok && r.body === null && r.headers.get('content-length') === String(SIZE), 'HEAD: 본문 없음 · 머리 있음');
}
{
  clear(); const s = fakeServer(['hang', 'ok']);
  const t0 = Date.now();
  const r = await fetchWhole(URL_, {}, undefined, opts(s));
  ok(sameBytes(r.body, DATA) && s.log.length === 2 && retries.length === 1 && retries[0][0] === 2 && retries[0][1] === '응답 멈춤', `응답 없음 → 30 ms 뒤 끊고 다시 → 성공 (${JSON.stringify(retries)}, ${Date.now() - t0} ms)`);
}
{
  clear(); const s = fakeServer(['neterr', 'neterr', 'ok']);
  const r = await fetchWhole(URL_, {}, undefined, opts(s));
  ok(sameBytes(r.body, DATA) && s.log.length === 3 && retries.map((x) => x[1]).join() === '연결 끊김,연결 끊김', '연결 실패 두 번 → 세 번째 성공');
}
{
  clear(); const s = fakeServer([{ stallAfter: 10 }, 'ok']);
  const r = await fetchWhole(URL_, {}, undefined, opts(s));
  ok(sameBytes(r.body, DATA) && s.log.length === 2, '본문 도중 멈춤 → 처음부터 다시 받아 성공 (전체 요청은 이어 받지 않음)');
}
{
  clear(); const s = fakeServer([{ status: 503 }, { status: 502 }, 'ok']);
  const r = await fetchWhole(URL_, {}, undefined, opts(s));
  ok(r.ok && s.log.length === 3 && retries.map((x) => x[1]).join() === 'HTTP 503,HTTP 502', '503 · 502 → 다시 보내 성공');
}
{
  clear(); const s = fakeServer([{ status: 404 }]);
  const r = await fetchWhole(URL_, {}, undefined, opts(s));
  ok(r.status === 404 && !r.ok && s.log.length === 1 && !retries.length, '404 는 다시 보내지 않고 그대로 돌려줌');
}
{
  clear(); const s = fakeServer([{ status: 503 }, { status: 503 }, { status: 503 }]);
  const r = await fetchWhole(URL_, {}, undefined, opts(s, { tries: 3 }));
  ok(r.status === 503 && s.log.length === 3, '503 이 끝까지 오면 마지막 응답(503)을 돌려줌');
}
{
  clear(); const s = fakeServer(['hang', 'hang', 'hang']);
  let msg = null;
  try { await fetchWhole(URL_, {}, undefined, opts(s, { tries: 3 })); } catch (e) { msg = e.message; }
  ok(msg === '서버 응답이 3번 모두 멈췄습니다: f.bin' && s.log.length === 3, `세 번 모두 멈춤 → 한국어 한 줄 (${msg})`);
}
{
  clear(); const s = fakeServer(['neterr', 'neterr', 'neterr']);
  let msg = null;
  try { await fetchWhole(URL_, {}, undefined, opts(s, { tries: 3 })); } catch (e) { msg = e.message; }
  ok(msg === '서버와 연결이 3번 모두 끊겼습니다: f.bin', `세 번 모두 연결 실패 → 한국어 한 줄 (${msg})`);
}
{
  // 실패가 섞이면 마지막 것만 보고 '모두 멈춤'이라 하지 않는다 — 까닭마다 횟수
  clear(); const s = fakeServer(['neterr', { status: 503 }, 'hang']);
  let msg = null;
  try { await fetchWhole(URL_, {}, undefined, opts(s, { tries: 3 })); } catch (e) { msg = e.message; }
  ok(msg === '서버에서 3번 모두 받지 못했습니다 (연결 끊김 1번 · HTTP 503 1번 · 응답 멈춤 1번): f.bin' && s.log.length === 3, `섞인 실패 → 까닭마다 횟수 (${msg})`);
}
{
  // 기본 횟수(MAX_TRIES)로 연결 실패가 끝까지 이어지면 그 횟수가 문구에 그대로 (쉼은 0)
  clear(); const s = fakeServer(() => 'neterr');
  let msg = null;
  try { await fetchWhole(URL_, {}, undefined, opts(s, { tries: undefined })); } catch (e) { msg = e.message; }
  ok(msg === `서버와 연결이 ${MAX_TRIES}번 모두 끊겼습니다: f.bin` && s.log.length === MAX_TRIES && retries.length === MAX_TRIES - 1, `기본 ${MAX_TRIES}번 모두 끊김 → 요청 ${s.log.length}번 · 다시 보내기 ${retries.length}번 (${msg})`);
}
{
  clear(); const s = fakeServer(['hang']);
  const ac = new AbortController();
  setTimeout(() => ac.abort(new DOMException('사용자가 끊음', 'AbortError')), 10);
  let err = null;
  try { await fetchWhole(URL_, {}, ac.signal, opts(s, { stallMs: 5000 })); } catch (e) { err = e; }
  ok(err?.name === 'AbortError' && err.message === '사용자가 끊음' && s.log.length === 1 && !retries.length, '바깥에서 끊으면 다시 보내지 않고 그 이유로 끝남');
}
{
  clear(); const s = fakeServer(['neterr', 'ok']);
  const ac = new AbortController();
  setTimeout(() => ac.abort(), 15);
  let err = null;
  try { await fetchWhole(URL_, {}, ac.signal, opts(s, { delays: [1000] })); } catch (e) { err = e; }
  ok(err?.name === 'AbortError' && s.log.length === 1, '쉬는 동안 바깥에서 끊어도 바로 끝남');
}
{
  clear(); const s = fakeServer();
  const ac = new AbortController(); ac.abort();
  let err = null;
  try { await fetchWhole(URL_, {}, ac.signal, opts(s)); } catch (e) { err = e; }
  ok(err?.name === 'AbortError' && s.log.length === 0, '이미 끊긴 signal 이면 보내지도 않음');
}

// ---------- fetchRange ----------
console.log('\n== fetchRange (이어 받기)');
{
  clear(); const s = fakeServer();
  const r = await fetchRange(URL_, 100, 299, undefined, opts(s));
  ok(r.status === 206 && sameBytes(r.body, DATA.slice(100, 300)) && s.log[0].range === 'bytes=100-299', '정상: 그 구간만');
}
{
  clear(); const s = fakeServer([{ stallAfter: 50 }, 'ok']);
  const r = await fetchRange(URL_, 100, 299, undefined, opts(s));
  ok(sameBytes(r.body, DATA.slice(100, 300)) && s.log[1].range === 'bytes=150-299', `도중 멈춤 → 받은 50 B 다음부터 이어 받음 (${s.log.map((x) => x.range).join(' → ')})`);
}
{
  clear(); const s = fakeServer([{ resetAfter: 30 }, { resetAfter: 20 }, 'ok']);
  const r = await fetchRange(URL_, 0, 199, undefined, opts(s));
  ok(sameBytes(r.body, DATA.slice(0, 200)) && s.log.map((x) => x.range).join() === 'bytes=0-199,bytes=30-199,bytes=50-199', `도중 끊김 두 번 → 두 번 이어 받음 (${s.log.map((x) => x.range).join(' → ')})`);
}
{
  clear(); const s = fakeServer([{ shortBy: 40 }, 'ok']);
  const r = await fetchRange(URL_, 0, 199, undefined, opts(s));
  ok(sameBytes(r.body, DATA.slice(0, 200)) && s.log[1].range === 'bytes=160-199' && retries[0][1] === '덜 받음 160/200 B', '오류 없이 일찍 닫힘 → 모자란 만큼만 다시');
}
{
  clear(); const s = fakeServer();
  const r = await fetchRange(URL_, SIZE - 10, SIZE + 100, undefined, opts(s));
  ok(r.status === 206 && sameBytes(r.body, DATA.slice(SIZE - 10)) && s.log.length === 1, '파일 끝을 넘는 구간 → 있는 데까지만(10 B), 다시 보내지 않음');
}
{
  clear(); const s = fakeServer();
  const r = await fetchRange(URL_, SIZE + 5, SIZE + 10, undefined, opts(s));
  ok(r.status === 416 && r.body === null && s.log.length === 1, '파일 밖 구간 → 416 그대로');
}
{
  clear(); const s = fakeServer(['ignoreRange']);
  const r = await fetchRange(URL_, 100, 199, undefined, opts(s));
  ok(r.status === 200 && sameBytes(r.body, DATA), 'Range 무시 서버 → 200 전체를 돌려줌(부른 쪽이 자름)');
}
{
  clear(); const s = fakeServer([{ stallAfter: 5 }, { stallAfter: 5 }, { stallAfter: 5 }]);
  let msg = null;
  try { await fetchRange(URL_, 0, 99, undefined, opts(s, { tries: 3 })); } catch (e) { msg = e.message; }
  ok(msg === '서버 응답이 3번 모두 멈췄습니다: f.bin' && s.log.map((x) => x.range).join() === 'bytes=0-99,bytes=5-99,bytes=10-99', `세 번 모두 멈춤 → 오류 (이어 받기는 계속: ${s.log.map((x) => x.range).join(' → ')})`);
}
{
  // 마지막 시도가 '덜 받음'(오류 없이 일찍 닫힘)으로 끝나도 한국어 한 줄 (예전에는 'null')
  clear(); const s = fakeServer([{ stallAfter: 5 }, { shortBy: 10 }, { shortBy: 10 }]);
  let msg = null;
  try { await fetchRange(URL_, 0, 99, undefined, opts(s, { tries: 3 })); } catch (e) { msg = e.message; }
  ok(msg === '서버에서 3번 모두 받지 못했습니다 (응답 멈춤 1번 · 덜 받음 2번): f.bin', `마지막이 덜 받음 → 까닭마다 횟수 (${msg})`);
}

// ---------- 조각 나눠 받기 (opts.chunk — 1단계부터는 조절기가 정하는 크기) ----------
console.log('\n== fetchRange 조각 나눠 받기');
{
  clear(); const s = fakeServer();
  const r = await fetchRange(URL_, 0, 999, undefined, opts(s, { chunk: 100 }));
  ok(r.status === 206 && sameBytes(r.body, DATA) && s.log.length === 10, `1000 B 를 100 B 조각 10개로 (${s.log.length}번 요청)`);
  ok(s.log.map((x) => x.range).join() === Array.from({ length: 10 }, (_, i) => `bytes=${i * 100}-${i * 100 + 99}`).join(), '첫 조각부터 차례로 (0-99 · 100-199 · …)');
}
{
  clear(); const s = fakeServer(() => ({ delay: 15 })); // 응답을 늦춰 동시에 몇 개가 도는지 본다
  const r = await fetchRange(URL_, 0, 999, undefined, opts(s, { chunk: 100 }));
  ok(sameBytes(r.body, DATA) && s.log.length === 10 && s.maxInflight === 1, `읽기 하나 안에서는 조각을 차례로 — 늦은 서버에서도 동시 최대 ${s.maxInflight} (예전 '동시 2개씩'은 없앰)`);
}
{
  clear(); let stalledOnce = false;
  const s = fakeServer((n, req) => { if (req.range === 'bytes=500-599' && !stalledOnce) { stalledOnce = true; return { stallAfter: 20 }; } return 'ok'; });
  const r = await fetchRange(URL_, 0, 999, undefined, opts(s, { chunk: 100 }));
  // 이어 받기는 받은 데(520)부터 다시 조각 하나만큼(520-619) — 요청 하나는 늘 조각 크기 이하
  ok(sameBytes(r.body, DATA) && s.log.some((x) => x.range === 'bytes=520-619') && s.log.length === 11,
    `조각 하나가 멈춤 → 받은 데부터 이어 받고 전체는 맞음 (요청 ${s.log.length}번: … ${s.log.slice(5, 8).map((x) => x.range).join(' → ')} …)`);
}
{
  clear(); const s = fakeServer(['ignoreRange']);
  const r = await fetchRange(URL_, 0, 999, undefined, opts(s, { chunk: 100 }));
  ok(r.status === 200 && sameBytes(r.body, DATA) && s.log.length === 1, 'Range 무시 서버 → 첫 요청의 전체를 돌려주고 더 보내지 않음');
}
{
  clear(); const s = fakeServer();
  const r = await fetchRange(URL_, 0, 1500, undefined, opts(s, { chunk: 300 }));
  ok(r.status === 206 && sameBytes(r.body, DATA) && s.log.length === 4 && s.log[3].range === 'bytes=900-999',
    `파일 끝을 넘는 큰 구간 → 있는 데(1000 B)까지, 조각 4개 — 마지막은 파일 끝까지만 요청 (${s.log.map((x) => x.range).join(' ')})`);
}
{
  clear(); const s = fakeServer();
  const r = await fetchRange(URL_, 950, 1500, undefined, opts(s, { chunk: 100 }));
  ok(sameBytes(r.body, DATA.slice(950)) && s.log.length === 1, '첫 조각 안에서 파일이 끝남 → 그것만');
}
{
  clear(); const s = fakeServer((n, req) => (req.range === 'bytes=300-399' ? { status: 404 } : 'ok'));
  const r = await fetchRange(URL_, 0, 999, undefined, opts(s, { chunk: 100 }));
  ok(r.status === 404 && !r.ok && r.body === null && s.log.length === 4, `조각 하나가 404 → 반쪽 본문 없이 404 를 돌려주고 더 보내지 않음 (요청 ${s.log.length}번 — HttpSource.read 가 '파일을 가져오지 못했습니다' 한 줄)`);
}
{
  // 다시 보내기 횟수는 조각마다 새로: 조각마다 두 번 끊긴 뒤 세 번째에 받는다 — tries 3 이면 읽기 전체로 세면 실패, 조각마다 세면 성공
  clear(); const seen = new Map();
  const s = fakeServer((n, req) => { const k = req.range; const c = (seen.get(k) ?? 0) + 1; seen.set(k, c); return c <= 2 ? 'neterr' : 'ok'; });
  let r = null, msg = '';
  try { r = await fetchRange(URL_, 0, 999, undefined, opts(s, { chunk: 250, tries: 3 })); } catch (e) { msg = e.message; }
  ok(r?.status === 206 && sameBytes(r.body, DATA) && s.log.length === 12 && retries.length === 8, `다시 보내기 횟수는 조각마다 새로 — 조각 4개 × (끊김 2 + 받음 1) = 요청 ${s.log.length}번 · 다시 보내기 ${retries.length}번 ${msg}`);
}
{
  clear(); const s = fakeServer((n) => (n === 0 ? 'ok' : 'hang'));
  const ac = new AbortController();
  setTimeout(() => ac.abort(), 20);
  let err = null;
  try { await fetchRange(URL_, 0, 999, ac.signal, opts(s, { stallMs: 5000, chunk: 100 })); } catch (e) { err = e; }
  await new Promise((r) => setTimeout(r, 10));
  ok(err?.name === 'AbortError' && s.log.length === 2 && s.maxInflight <= 1, '조각을 받는 중 바깥에서 끊음 → AbortError · 더 보내지 않음');
}
{
  clear(); const s = fakeServer();
  const r = await fetchRange(URL_, 10, 59, undefined, opts(s, { chunk: 100 }));
  ok(sameBytes(r.body, DATA.slice(10, 60)) && s.log.length === 1, '조각보다 작은 구간은 한 번에');
}
{
  // 바이트 구간이 유한한 정수가 아니면 보내기 전에 거부 (검증 지적 3 — 예전에는 NaN 이 속도 조절기를 망가뜨렸다)
  clear(); const s = fakeServer();
  const errs = [];
  for (const [a, b] of [[NaN, NaN], [0, NaN], [Infinity, 10], [1.5, 10], [-1, 10]]) {
    try { await fetchRange(URL_, a, b, undefined, opts(s)); errs.push('보냄'); } catch (e) { errs.push(e.message); }
  }
  ok(s.log.length === 0 && errs.every((e) => /^바이트 구간이 잘못되었습니다 \(.+\): f\.bin$/.test(e)), `NaN · 무한 · 소수 · 음수 구간은 보내기 전에 거부 — 요청 ${s.log.length}번 (${errs[0]})`);
}
{
  // 이미 끊긴 signal: 조절기 없이도 요청을 보내지 않음 (attemptOnce 첫머리 — 검증 지적 4)
  clear(); const s = fakeServer();
  const ac = new AbortController(); ac.abort();
  let err = null;
  try { await fetchRange(URL_, 0, 99, ac.signal, opts(s)); } catch (e) { err = e; }
  ok(err?.name === 'AbortError' && s.log.length === 0, '이미 끊긴 signal 이면 바이트 구간도 보내지 않음');
}

// ---------- toArrayBuffer ----------
console.log('\n== toArrayBuffer');
{
  const u = new Uint8Array([1, 2, 3]);
  ok(toArrayBuffer(u) === u.buffer, '딱 맞으면 그대로');
  const big = new Uint8Array([9, 8, 7, 6, 5]);
  const ab = toArrayBuffer(big.subarray(1, 3));
  ok(ab.byteLength === 2 && new Uint8Array(ab)[0] === 8 && ab !== big.buffer, '일부분이면 그 길이로 복사');
}

console.log(fail ? `\n실패 ${fail} · 통과 ${pass}` : `\n모두 통과 (${pass})`);
process.exit(fail ? 1 : 0);

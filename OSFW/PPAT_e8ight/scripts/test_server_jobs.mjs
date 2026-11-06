#!/usr/bin/env node
// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   test_server_jobs.mjs

src/data/serverJobs.ts(서버에 쌓인 해석 목록 읽기)의 Node 시험. TS 를 바로 못 돌리므로 esbuild(vite 가 깔아 둔 것)로
메모리에서 ES 모듈 하나로 묶어(파일을 쓰지 않음) data: 주소로 불러 쓴다. fetch 는 가짜로 바꿔 서버 없이 돈다.
확인: parseJobFolders(폴더만 · 점 이름 빼기 · 작업 번호 형식 아닌 이름 빼기 · 낱개 파일 빼기 · 최근 활동순 · mtime 없음 = 맨 뒤),
parseJobRecord(완료 · 실패(result_path null) · 대기 · 실행 중 · 모르는 status · 배열·null), listJobFolders(200 · 404 · 500 · 깨진 JSON · 연결 실패 → 한국어 한 줄 · 끊기),
readJobs(200 · 404 · 403 · 깨진 JSON · 연결 실패 → '상태 모름' 줄(404 만 '없습니다'), 순서 유지, 동시 요청 수, 끊기(abort)만 예외),
durationMs · fmtDur · fmtWhen · jobWhenText · canOpenResult · isActive.
시각은 서울 시간대(TZ=Asia/Seoul)로 맞춰 본다.

실행: node scripts/test_server_jobs.mjs
*/
/******************************************************************************/

// 시각 표시(fmtWhen)가 보는 PC 의 시간대를 따르므로 서울로 고정한다(Date 를 쓰기 전에)
process.env.TZ = 'Asia/Seoul';

import { build } from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ---------- 묶기(메모리) ----------
const res = await build({
  entryPoints: [path.join(ROOT, 'src/data/serverJobs.ts')],
  bundle: true, platform: 'neutral', format: 'esm', target: 'es2022', write: false, logLevel: 'silent',
});
const code = res.outputFiles[0].text;
const m = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);

let fail = 0, pass = 0;
const check = (ok, msg) => { console.log(`${ok ? 'PASS' : 'FAIL'} ${msg}`); if (ok) pass++; else fail++; };
const eq = (got, want, msg) => check(isDeepStrictEqual(got, want), isDeepStrictEqual(got, want) ? msg : `${msg} — 기대 ${JSON.stringify(want)}, 실제 ${JSON.stringify(got)}`);
const throwsMsg = async (fn, want, msg) => {
  try { await fn(); check(false, `${msg} — 예외가 없음`); }
  catch (e) { eq(e?.message, want, msg); }
};

check(new Date(0).getTimezoneOffset() === -540, '시간대가 서울(UTC+9)로 맞춰짐');

// ---------- 상수 ----------
console.log('\n== 상수');
eq(m.JOB_PAGE, 20, 'JOB_PAGE = 20');
eq(m.STATE_LABEL, { queued: '대기 중', running: '실행 중', completed: '완료', failed: '실패', unknown: '상태 모름' }, 'STATE_LABEL');
eq(m.STATE_TAG, { queued: '', running: 'run', completed: 'ok', failed: 'err', unknown: '' }, 'STATE_TAG');
eq(['cfd-20261104-140427-4bc7', 'smoke_20261021_152518', 'a'.repeat(64)].map((s) => m.JOB_ID_RE.test(s)), [true, true, true], 'JOB_ID_RE: 작업 번호 꼴 · 64자');
eq(['', 'a'.repeat(65), 'a.b', 'a b', '../x', 'x/y', '한글'].map((s) => m.JOB_ID_RE.test(s)), [false, false, false, false, false, false, false], 'JOB_ID_RE: 빈 이름 · 65자 · 점 · 빈칸 · 경로 · 한글은 아님');

// ---------- parseJobFolders ----------
console.log('\n== parseJobFolders (nginx 폴더 목록 JSON)');
const T = (s) => Date.parse(s);
const listing = [
  { name: 'cfd-20261103-103419-1a5b', type: 'directory', mtime: 'Tue, 03 Nov 2026 02:26:03 GMT' },
  { name: 'cfd-20261104-140427-4bc7', type: 'directory', mtime: 'Wed, 04 Nov 2026 05:09:14 GMT' },
  { name: '.removed-20261103', type: 'directory', mtime: 'Wed, 04 Nov 2026 06:00:00 GMT' },
  { name: '.hidden_file', type: 'file', mtime: 'Wed, 04 Nov 2026 06:00:00 GMT', size: 6 },
  { name: 'bad name', type: 'directory', mtime: 'Wed, 04 Nov 2026 06:00:00 GMT' },
  { name: 'a.b', type: 'directory', mtime: 'Wed, 04 Nov 2026 06:00:00 GMT' },
  { name: 'x'.repeat(65), type: 'directory', mtime: 'Wed, 04 Nov 2026 06:00:00 GMT' },
  { name: 'stray.txt', type: 'file', mtime: 'Wed, 04 Nov 2026 06:00:00 GMT', size: 5 },
  { name: 'smoke_20261021_152518', type: 'directory', mtime: 'Wed, 21 Oct 2026 06:30:00 GMT' },
  { name: 'no-mtime', type: 'directory' },
  { name: 'bad-mtime', type: 'directory', mtime: 'not a date' },
  { name: 'same-b', type: 'directory', mtime: 'Mon, 02 Nov 2026 00:00:00 GMT' },
  { name: 'same-a', type: 'directory', mtime: 'Mon, 02 Nov 2026 00:00:00 GMT' },
  { name: 'link', type: 'other', mtime: 'Wed, 04 Nov 2026 06:00:00 GMT' },
  { name: 42, type: 'directory' },
  null,
  7,
];
const folders = m.parseJobFolders(listing);
eq(folders.map((f) => f.id), [
  'cfd-20261104-140427-4bc7', 'cfd-20261103-103419-1a5b', 'same-b', 'same-a', 'smoke_20261021_152518', 'no-mtime', 'bad-mtime',
], '폴더만 · 점 이름 · 형식 아닌 이름 · 낱개 파일 · 이상한 항목을 빼고 최근 활동순(같으면 번호 역순, mtime 없음은 맨 뒤)');
eq(folders[0], { id: 'cfd-20261104-140427-4bc7', mtime: T('2026-11-04T05:09:14Z') }, 'mtime 을 ms 로 읽음');
eq(folders.filter((f) => f.id === 'no-mtime' || f.id === 'bad-mtime').map((f) => f.mtime), [0, 0], 'mtime 이 없거나 깨지면 0');
eq(m.parseJobFolders([]), [], '빈 목록 → 빈 배열');
for (const bad of [null, {}, 'x', 3]) {
  await throwsMsg(() => m.parseJobFolders(bad), '해석 목록 응답이 목록 형식이 아닙니다.', `목록이 아닌 응답(${JSON.stringify(bad)}) → 오류`);
}

// ---------- parseJobRecord ----------
console.log('\n== parseJobRecord (상태 파일 engine_job.json)');
const F = { id: 'cfd-20261104-140427-4bc7', mtime: T('2026-11-04T05:09:14Z') };
const completed = {
  job_id: 'cfd-20261104-140427-4bc7', engine: 'lbm', config: 'multi_component.json', inputs: ['RTI_region.stl'],
  status: 'completed', message: 'Analysis done.',
  created_at: '2026-11-04T14:04:33+09:00', started_at: '2026-11-04T14:04:33+09:00', finished_at: '2026-11-04T14:09:14+09:00',
  exit_code: 0, result_path: 'cfd-20261104-140427-4bc7/multi_component/',
  callback: { sent: false, reason: 'FEDIT_RESULT_URL is not set.', at: '2026-11-04T14:09:14+09:00' },
};
const jc = m.parseJobRecord(F, completed);
eq(jc, {
  id: F.id, name: 'multi_component', config: 'multi_component.json', engine: 'lbm', status: 'completed', message: 'Analysis done.',
  createdAt: T('2026-11-04T05:04:33Z'), startedAt: T('2026-11-04T05:04:33Z'), finishedAt: T('2026-11-04T05:09:14Z'), activity: F.mtime,
}, '완료: 이름 = config 에서 .json 뺀 것, 시각(+09:00) ms, activity = 폴더 mtime');

const F2 = { id: 'cfd-20261103-103419-1a5b', mtime: T('2026-11-03T02:26:03Z') };
const jf = m.parseJobRecord(F2, {
  job_id: F2.id, engine: 'lbm', config: 'thermal.json', status: 'failed', message: 'Engine API restarted while the job was running.',
  created_at: '2026-11-03T10:34:19+09:00', started_at: '2026-11-03T10:34:19+09:00', finished_at: '2026-11-03T11:26:03+09:00', exit_code: null, result_path: null,
});
eq([jf.status, jf.name, jf.message], ['failed', 'thermal', 'Engine API restarted while the job was running.'], '실패(result_path null): 상태·이름·까닭');
check(m.canOpenResult(jf) && !m.isActive(jf), '실패도 열어 볼 수 있음(끊긴 시점까지 저장된 것), 끝난 해석');

const jq = m.parseJobRecord(F, { status: 'queued', config: 'video.json', created_at: '2026-11-04T15:00:00+09:00', started_at: null, finished_at: null, message: 'Queued.' });
eq([jq.status, Number.isNaN(jq.startedAt), Number.isNaN(jq.finishedAt), jq.createdAt], ['queued', true, true, T('2026-11-04T06:00:00Z')], '대기: started/finished null → NaN');
check(!m.canOpenResult(jq) && m.isActive(jq), '대기는 열지 않음, 아직 안 끝남');
const jr = m.parseJobRecord(F, { status: 'running', config: 'video.json', engine: 'lbm_dem', started_at: '2026-11-04T15:00:05+09:00' });
eq([jr.status, jr.engine, m.canOpenResult(jr), m.isActive(jr)], ['running', 'lbm_dem', false, true], '실행 중: 열지 않음, 아직 안 끝남');
check(m.canOpenResult(jc) && !m.isActive(jc), '완료: 열 수 있음');

const ju = m.parseJobRecord(F, { status: 'cancelled', config: 'x.json' });
eq([ju.status, ju.name, m.canOpenResult(ju), m.isActive(ju)], ['unknown', 'x', true, false], '모르는 status → 상태 모름(열어 보고 안 되면 그 줄에 오류)');
eq(m.parseJobRecord(F, { status: 5, message: 3, engine: '', config: '' }), {
  id: F.id, name: F.id, config: null, engine: null, status: 'unknown', message: '', createdAt: NaN, startedAt: NaN, finishedAt: NaN, activity: F.mtime,
}, '글자가 아닌 칸·빈 글자 → null·빈 글, config 없으면 이름 = 작업 번호');
for (const bad of [[], [completed], null, 'x', 3]) {
  const j = m.parseJobRecord(F, bad);
  eq([j.status, j.name, j.message, j.activity], ['unknown', F.id, '상태 파일 형식이 맞지 않습니다.', F.mtime], `객체가 아닌 내용(${JSON.stringify(bad)?.slice(0, 20)}) → 상태 모름`);
}
eq([m.displayName('thermal.json', 'id'), m.displayName('THERMAL.JSON', 'id'), m.displayName('.json', 'id'), m.displayName('a.json.json', 'id'), m.displayName(null, 'id')],
  ['thermal', 'THERMAL', '.json', 'a.json', 'id'], 'displayName: .json 하나만 뗌(대소문자 무관), 다 지워지면 그대로, 없으면 작업 번호');
eq(m.unknownJob(F, '까닭'), { id: F.id, name: F.id, config: null, engine: null, status: 'unknown', message: '까닭', createdAt: NaN, startedAt: NaN, finishedAt: NaN, activity: F.mtime }, 'unknownJob');

// ---------- 가짜 fetch ----------
const realFetch = globalThis.fetch;
const calls = [];
let inFlight = 0, maxInFlight = 0;
const routes = new Map();
const json = (v) => new Response(JSON.stringify(v), { status: 200, headers: { 'Content-Type': 'application/json' } });
globalThis.fetch = async (url, opts = {}) => {
  calls.push({ url: String(url), opts });
  inFlight++; maxInFlight = Math.max(maxInFlight, inFlight);
  try {
    const r = routes.get(String(url));
    // 응답 순서가 요청 순서와 달라지게 조금씩 다르게 늦춘다
    await new Promise((ok, no) => {
      const t = setTimeout(ok, r?.delay ?? 1);
      opts.signal?.addEventListener('abort', () => { clearTimeout(t); no(new DOMException('aborted', 'AbortError')); }, { once: true });
      if (opts.signal?.aborted) { clearTimeout(t); no(new DOMException('aborted', 'AbortError')); }
    });
    if (!r) return new Response('not found', { status: 404 });
    if (r.throws) throw new TypeError('fetch failed');
    return r.make();
  } finally { inFlight--; }
};
const route = (url, make, delay = 1) => routes.set(url, { make, delay });

// ---------- listJobFolders ----------
console.log('\n== listJobFolders (GET results/)');
route('results/', () => json(listing));
calls.length = 0;
eq((await m.listJobFolders()).map((f) => f.id), folders.map((f) => f.id), '200 → 거른 폴더 목록');
eq([calls[0]?.url, calls[0]?.opts.cache, calls[0]?.opts.credentials], ['results/', 'no-store', 'same-origin'], '주소 results/ · 캐시 안 씀 · 같은 주소 쿠키');
route('results/', () => new Response('<html>404</html>', { status: 404 }));
await throwsMsg(() => m.listJobFolders(), '이 서버는 해석 목록을 내주지 않습니다.', '404(옛 앞단) → 목록을 내주지 않는다는 오류');
route('results/', () => new Response('x', { status: 500 }));
await throwsMsg(() => m.listJobFolders(), '해석 목록을 읽지 못했습니다 (HTTP 500).', '500 → HTTP 번호가 든 오류');
route('results/', () => new Response('{broken', { status: 200 }));
await throwsMsg(() => m.listJobFolders(), '해석 목록 응답을 읽지 못했습니다.', '깨진 JSON → 오류');
route('results/', () => json({ not: 'array' }));
await throwsMsg(() => m.listJobFolders(), '해석 목록 응답이 목록 형식이 아닙니다.', '배열이 아닌 JSON → 오류');
routes.set('results/', { throws: true, delay: 0 });
await throwsMsg(() => m.listJobFolders(), '서버에 연결하지 못했습니다.', "연결 실패 → 한국어 한 줄(브라우저의 'Failed to fetch' 아님)");
const acList = new AbortController(); acList.abort();
try { await m.listJobFolders(acList.signal); check(false, '끊긴 신호로 listJobFolders → 예외 — 예외 없음'); }
catch (e) { eq(e?.name, 'AbortError', '끊긴 신호로 listJobFolders → AbortError 그대로(연결 실패 글로 바꾸지 않음)'); }

// ---------- readJob · readJobs ----------
console.log('\n== readJob · readJobs (results/<작업 번호>/engine_job.json)');
const mk = (id, mtime = 0) => ({ id, mtime });
const st = (id) => `results/${id}/engine_job.json`;
const many = [];
for (let i = 0; i < 15; i++) {
  const id = `job-${String(i).padStart(2, '0')}`;
  many.push(mk(id, 1000 - i));
  const kind = i % 5;
  if (kind === 0) route(st(id), () => json({ status: 'completed', config: `${id}.json` }), 15 - i);
  else if (kind === 1) route(st(id), () => new Response('nf', { status: 404 }), (i * 7) % 11);
  else if (kind === 2) route(st(id), () => new Response('forbidden', { status: 403 }), (i * 5) % 9);
  else if (kind === 3) route(st(id), () => new Response('{"status":', { status: 200 }), (i * 3) % 7);
  else routes.set(st(id), { throws: true, delay: i % 4 });
}
calls.length = 0; maxInFlight = 0;
const jobs = await m.readJobs(many, undefined, 4);
eq(jobs.map((j) => j.id), many.map((f) => f.id), '순서는 넘긴 순서 그대로(응답이 늦게 와도)');
eq(jobs.map((j) => j.status), many.map((_, i) => (i % 5 === 0 ? 'completed' : 'unknown')), '200 은 상태, 나머지는 상태 모름');
eq(jobs[0].name, 'job-00', '200: 이름 = config');
eq([jobs[1].message, jobs[2].message, jobs[3].message, jobs[4].message],
  ['상태 파일이 없습니다 (HTTP 404).', '상태 파일을 읽지 못했습니다 (HTTP 403).', '상태 파일을 읽지 못했습니다.', '상태 파일을 읽지 못했습니다.'],
  '404 · 403 · 깨진 JSON · 연결 실패의 까닭 글');
eq(jobs.map((j) => j.activity), many.map((f) => f.mtime), '상태 모름 줄도 폴더 mtime 을 activity 로');
check(maxInFlight <= 4 && maxInFlight >= 2, `동시 요청은 넘긴 수(4) 이하: 최대 ${maxInFlight}`);
eq(calls.length, many.length, '작업마다 한 번씩만 요청');
check(calls.every((c) => c.opts.cache === 'no-store' && c.opts.credentials === 'same-origin'), '상태 파일도 캐시 안 씀 · 같은 주소 쿠키');
maxInFlight = 0;
await m.readJobs(many);
check(maxInFlight <= 6, `기본 동시 요청 수 6 이하: 최대 ${maxInFlight}`);
eq(await m.readJobs([]), [], '빈 목록 → 요청 없이 빈 배열');
eq((await m.readJob(mk('job-00'))).status, 'completed', 'readJob 하나');

// 끊기(abort)는 예외로 올라온다
const ac = new AbortController();
for (const f of many) routes.set(st(f.id), { make: () => json({ status: 'completed' }), delay: 50 });
const p = m.readJobs(many, ac.signal, 3);
setTimeout(() => ac.abort(), 5);
try { await p; check(false, '끊으면 readJobs 가 예외로 끝남 — 예외 없음'); }
catch (e) { eq(e?.name, 'AbortError', '끊으면 readJobs 가 AbortError 로 끝남(상태 모름 줄로 바꾸지 않음)'); }
const ac2 = new AbortController(); ac2.abort();
routes.set(st('job-x'), { make: () => new Response('{broken', { status: 200 }), delay: 0 });
try { await m.readJob(mk('job-x'), ac2.signal); check(false, '이미 끊긴 신호 → 예외 — 예외 없음'); }
catch (e) { eq(e?.name, 'AbortError', '이미 끊긴 신호로 readJob → AbortError'); }
globalThis.fetch = realFetch;

// ---------- 시간 ----------
console.log('\n== durationMs · fmtDur · fmtWhen · jobWhenText');
eq(m.durationMs(jc), 281000, 'durationMs: 끝 - 시작 = 4분 41초');
eq(m.durationMs(jr), null, 'durationMs: 끝난 시각이 없으면 null');
eq(m.durationMs({ ...jc, startedAt: NaN }), null, 'durationMs: 시작 시각이 없으면 null');
eq(m.durationMs({ ...jc, startedAt: jc.finishedAt + 5000 }), 0, 'durationMs: 거꾸로면 0');
eq([0, 400, 10000, 59499, 59500, 281000, 3599000, 3600000, 4080000, 4139000, 90061000].map(m.fmtDur),
  ['0초', '0초', '10초', '59초', '1분 0초', '4분 41초', '59분 59초', '1시간 0분', '1시간 8분', '1시간 8분', '25시간 1분'], 'fmtDur: 초 반올림 · 분 초 · 시간 분');
eq(m.fmtDur(-5000), '0초', 'fmtDur: 음수는 0초');
eq(m.fmtWhen(T('2026-11-04T14:04:33+09:00')), '11-04 14:04', 'fmtWhen: MM-DD HH:mm (서울)');
eq(m.fmtWhen(T('2026-01-02T03:05:00+09:00')), '01-02 03:05', 'fmtWhen: 앞자리 0 채움');
eq([m.fmtWhen(NaN), m.fmtWhen(Infinity)], ['-', '-'], 'fmtWhen: 모르면 -');
eq(m.jobWhenText(jc), '11-04 14:04 · 4분 41초', 'jobWhenText: 완료 = 시작 시각 · 걸린 시간');
eq(m.jobWhenText(jf), '11-03 10:34 · 51분 44초', 'jobWhenText: 실패도 걸린 시간');
eq(m.jobWhenText(jr), '11-04 15:00', 'jobWhenText: 실행 중 = 시작 시각만');
eq(m.jobWhenText({ ...jr, finishedAt: T('2026-11-04T15:10:00+09:00') }), '11-04 15:00', 'jobWhenText: 실행 중이면 끝난 시각이 있어도 걸린 시간 없음');
eq(m.jobWhenText(jq), '11-04 15:00', 'jobWhenText: 시작 전이면 만든 시각');
eq(m.jobWhenText(m.unknownJob({ id: 'x', mtime: T('2026-11-04T16:20:00+09:00') }, '')), '11-04 16:20', 'jobWhenText: 상태 모름 = 폴더 mtime');
eq(m.jobWhenText(m.unknownJob({ id: 'x', mtime: 0 }, '')), '-', 'jobWhenText: 아무 시각도 모르면 -');

console.log(`\n${fail ? `실패 ${fail}건` : '모두 통과'} (통과 ${pass})`);
process.exit(fail ? 1 : 0);

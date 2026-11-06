#!/usr/bin/env node
// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   test_post_url.mjs

src/post/openedData.ts(후처리에서 열린 데이터의 출처 · 주소의 ?data= · ?job= 맞추기 판정)의 Node 시험.
TS 를 바로 못 돌리므로 esbuild(vite 가 깔아 둔 것)로 메모리에서 ES 모듈 하나로 묶어(파일을 쓰지 않음) data: 주소로 불러 쓴다.
확인: openedDataOf(데이터 없음 → null · 서버 결과 · 예제 · 사용자 파일(CSV 아이디 null · 결과 폴더 'result:…' · 목록에 없는 아이디)),
syncedPostUrl(예제 → data 만 · 서버 결과 → job 만 · 사용자 파일 → 둘 다 지움 · 아무것도 안 열림 → 그대로(null) · 이미 맞으면 null ·
tab · scene · 그 밖의 매개변수와 순서 보존 · # 뒤 보존 · 하위 경로 보존 · 빈 값 '?data' 지움 · 특수 문자 아이디 왕복),
여는 차례 흉내(예제 → 서버 결과 → 여는 중 → 사용자 파일 → 예제),
sceneDroppedUrl(창 안에서 연 뒤 scene · tab 지움 · 지울 것 없으면 null · 그 밖의 매개변수 순서 · 하위 경로 · # 뒤 보존 · ?scene= 실패 → 창에서 예제 차례), 꼬리표 글.

실행: node scripts/test_post_url.mjs
*/
/******************************************************************************/

import { build } from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ---------- 묶기(메모리) ----------
const res = await build({
  entryPoints: [path.join(ROOT, 'src/post/openedData.ts')],
  bundle: true, platform: 'neutral', format: 'esm', target: 'es2022', write: false, logLevel: 'silent',
});
const code = res.outputFiles[0].text;
const m = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);

let fail = 0, pass = 0;
const check = (ok, msg) => { console.log(`${ok ? 'PASS' : 'FAIL'} ${msg}`); if (ok) pass++; else fail++; };
const eq = (got, want, msg) => check(isDeepStrictEqual(got, want), isDeepStrictEqual(got, want) ? msg : `${msg} — 기대 ${JSON.stringify(want)}, 실제 ${JSON.stringify(got)}`);

/** 'pathname?search#hash' 를 syncedPostUrl 이 받는 꼴로 */
const loc = (href) => {
  const u = new URL(href, 'http://x');
  return { pathname: u.pathname, search: u.search, hash: u.hash };
};
/** 돌려받은 주소의 매개변수를 [이름, 값] 배열로 (순서까지 본다) */
const paramsOf = (href) => [...new URL(href, 'http://x').searchParams.entries()];

const EX = ['city-synthetic', 'ahmed', 'e2e-03'];
const example = (id) => ({ kind: 'example', id });
const server = (job) => ({ kind: 'server', job });
const file = { kind: 'file' };

// ---------- openedDataOf ----------
console.log('\n[1] openedDataOf — 열린 데이터의 출처');
eq(m.openedDataOf(false, null, EX, null), null, '데이터 없음 → null');
eq(m.openedDataOf(false, 'city-synthetic', EX, null), null, '아이디가 남아 있어도 데이터가 없으면 null');
eq(m.openedDataOf(true, 'server:job_01', EX, 'job_01'), server('job_01'), '서버 결과 → server');
eq(m.openedDataOf(true, 'city-synthetic', EX, null), example('city-synthetic'), '목록 항목 → example');
eq(m.openedDataOf(true, 'ahmed', EX, null), example('ahmed'), '해상도 항목도 example (해상도는 주소에 넣지 않음)');
eq(m.openedDataOf(true, null, EX, null), file, '사용자 CSV(아이디 null) → file');
eq(m.openedDataOf(true, 'result:job/multiphase', EX, null), file, "사용자 결과 폴더('result:…') → file");
eq(m.openedDataOf(true, 'e2e-05', EX, null), file, '목록에 없는 아이디(빌드한 페이지에서 빠진 항목 등) → file');
eq(m.openedDataOf(true, 'city-synthetic', [], null), file, '목록이 비어 있으면 example 이 아님');

// ---------- syncedPostUrl ----------
console.log('\n[2] syncedPostUrl — 아무것도 안 열림');
eq(m.syncedPostUrl(loc('/post.html?job=7&data=ahmed&tab=slice'), null), null, '여는 중·못 엶(null) → 주소를 건드리지 않음');
eq(m.syncedPostUrl(loc('/post.html'), null), null, '빈 주소도 그대로');

console.log('\n[3] syncedPostUrl — 예제를 열면 data 만');
{
  const got = m.syncedPostUrl(loc('/post.html'), example('city-synthetic'));
  eq(got, '/post.html?data=city-synthetic', '빈 주소 → ?data=<아이디>');
  const got2 = m.syncedPostUrl(loc('/post.html?job=job_01&tab=slice&scene=city-layers'), example('city-synthetic'));
  eq(paramsOf(got2), [['tab', 'slice'], ['scene', 'city-layers'], ['data', 'city-synthetic']], 'job 지우고 data 넣음, tab · scene 순서대로 보존');
  eq(m.syncedPostUrl(loc('/post.html?data=city-synthetic&scene=city-layers'), example('city-synthetic')), null, '이미 맞으면 null');
  const got3 = m.syncedPostUrl(loc('/post.html?data=ahmed&tab=color'), example('city-synthetic'));
  eq(paramsOf(got3), [['data', 'city-synthetic'], ['tab', 'color']], '다른 예제로 바꾸면 data 값만 바뀌고 자리는 그대로');
  const got4 = m.syncedPostUrl(loc('/post.html?data=city-synthetic&job=job_01'), example('city-synthetic'));
  eq(paramsOf(got4), [['data', 'city-synthetic']], 'data 가 맞아도 job 이 남아 있으면 지운다');
}

console.log('\n[4] syncedPostUrl — 서버 결과를 열면 job 만');
{
  const got = m.syncedPostUrl(loc('/post.html?data=city-synthetic&scene=city-layers'), server('job_01'));
  eq(paramsOf(got), [['scene', 'city-layers'], ['job', 'job_01']], 'data 지우고 job 넣음, scene 보존');
  eq(m.syncedPostUrl(loc('/post.html?job=job_01&tab=slice'), server('job_01')), null, '이미 맞으면 null');
  const got2 = m.syncedPostUrl(loc('/post.html?job=job_01&data=ahmed'), server('job_01'));
  eq(paramsOf(got2), [['job', 'job_01']], '?job= 과 ?data= 가 함께 왔다가 job 이 열리면 data 를 지운다');
  const got3 = m.syncedPostUrl(loc('/post.html?job=old_job'), server('new_job'));
  eq(got3, '/post.html?job=new_job', '다른 서버 결과로 바꾸면 job 값이 바뀜');
}

console.log('\n[5] syncedPostUrl — 사용자 파일을 열면 둘 다 지움');
{
  eq(m.syncedPostUrl(loc('/post.html?data=city-synthetic&job=job_01&tab=display'), file), '/post.html?tab=display', 'data · job 지우고 tab 보존');
  eq(m.syncedPostUrl(loc('/post.html?job=job_01'), file), '/post.html', '남는 매개변수가 없으면 ? 도 없앤다');
  eq(m.syncedPostUrl(loc('/post.html?tab=display'), file), null, '지울 것이 없으면 null');
  eq(m.syncedPostUrl(loc('/post.html'), file), null, '빈 주소면 null');
  eq(m.syncedPostUrl(loc('/post.html?data'), file), '/post.html', "값이 빈 '?data' 도 지운다");
  eq(m.syncedPostUrl(loc('/post.html?data=&tab=x'), file), '/post.html?tab=x', "'data=' 도 지운다");
}

console.log('\n[6] syncedPostUrl — # 뒤 · 하위 경로 · 특수 문자');
{
  eq(m.syncedPostUrl(loc('/post.html?job=1#view'), example('city-synthetic')), '/post.html?data=city-synthetic#view', '# 뒤 보존');
  eq(m.syncedPostUrl(loc('/cfd/post.html?data=ahmed'), file), '/cfd/post.html', '하위 경로(/cfd/) 보존');
  const odd = 'a b&c=d/한글';
  const got = m.syncedPostUrl(loc('/post.html'), example(odd));
  eq(new URL(got, 'http://x').searchParams.get('data'), odd, '특수 문자 아이디가 그대로 되읽힘');
  eq(m.syncedPostUrl(loc(got), example(odd)), null, '되읽은 주소로 다시 맞추면 null');
  const got2 = m.syncedPostUrl(loc('/post.html?select=a,b&tool=rotate&data=x'), file);
  eq(new URL(got2, 'http://x').searchParams.get('select'), 'a,b', '?select= 값 보존(부호 매김이 바뀌어도 같은 값)');
  eq(new URL(got2, 'http://x').searchParams.get('tool'), 'rotate', '?tool= 보존');
}

console.log('\n[7] 여는 차례 흉내 — 주소가 열린 데이터를 따라감');
{
  let href = '/post.html?tab=slice';
  const step = (opened, want, msg) => {
    const next = m.syncedPostUrl(loc(href), opened);
    if (next) href = next;
    eq(href, want, msg);
  };
  step(example('city-synthetic'), '/post.html?tab=slice&data=city-synthetic', '예제 열기 → data');
  step(server('job_01'), '/post.html?tab=slice&job=job_01', '서버 결과 열기 → job 만');
  step(null, '/post.html?tab=slice&job=job_01', '다른 것을 여는 중(아무것도 안 열린 셈) → 그대로');
  step(file, '/post.html?tab=slice', '사용자 파일 → 둘 다 지움');
  step(example('ahmed'), '/post.html?tab=slice&data=ahmed', '다시 예제 → data');
}

console.log('\n[8] sceneDroppedUrl — 창 안에서 다른 데이터를 열면 장면 매개변수(scene · tab)를 지움');
{
  eq(m.sceneDroppedUrl(loc('/post.html?scene=city-layers&data=city-synthetic')), '/post.html?data=city-synthetic', '?scene= 실패 뒤 창에서 예제를 엶 → scene 지우고 data 는 그대로');
  eq(m.sceneDroppedUrl(loc('/post.html?scene=city-layers&tab=slice&job=job_01')), '/post.html?job=job_01', 'scene · tab 둘 다 지움');
  eq(m.sceneDroppedUrl(loc('/post.html?tab=clip')), '/post.html', 'tab 만 있어도 지우고, 남는 것이 없으면 ? 도 없앤다');
  eq(m.sceneDroppedUrl(loc('/post.html?data=ahmed')), null, '지울 것이 없으면 null (주소를 건드리지 않음)');
  eq(m.sceneDroppedUrl(loc('/post.html')), null, '빈 주소면 null');
  eq(m.sceneDroppedUrl(loc('/post.html?scene=')), '/post.html', "값이 빈 'scene=' 도 지운다");
  eq(paramsOf(m.sceneDroppedUrl(loc('/post.html?select=a,b&scene=x&view=iso&data=y'))), [['select', 'a,b'], ['view', 'iso'], ['data', 'y']], 'select · view 등 그 밖의 매개변수는 순서대로 보존');
  eq(m.sceneDroppedUrl(loc('/cfd/post.html?scene=x&data=y#v')), '/cfd/post.html?data=y#v', '하위 경로 · # 뒤 보존');
  // 차례: ?scene= 만 주고 열기(데이터 없음 → 창) → 창에서 예제를 엶(주소가 data 를 따름) → 장면 매개변수를 지움 → 새로 고쳐도 장면이 얹히지 않는다
  let href = '/post.html?scene=city-layers';
  href = m.syncedPostUrl(loc(href), example('city-synthetic')) ?? href;
  href = m.sceneDroppedUrl(loc(href)) ?? href;
  eq(href, '/post.html?data=city-synthetic', '차례: ?scene= 만 → 창에서 예제 → ?data= 만 남음');
  eq(m.SCENE_PARAMS, ['scene', 'tab'], '지우는 매개변수는 scene · tab');
}

console.log('\n[9] 꼬리표 글');
eq(m.SOURCE_LABEL, { example: '예제', server: '서버 결과', file: '사용자 파일' }, "도구막대 꼬리표 '예제' · '서버 결과' · '사용자 파일'");

console.log(`\n${fail ? 'FAIL' : 'OK'} — 통과 ${pass} · 실패 ${fail}`);
process.exit(fail ? 1 : 0);

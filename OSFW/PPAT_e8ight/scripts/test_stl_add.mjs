#!/usr/bin/env node
// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   test_stl_add.mjs

후처리에서 STL 을 형상으로 더하는 길(AppCore.loadStlBuffer — 형상 편집의 [STL 추가] · 3D 화면에 놓기)의 순수 부분 Node 시험.
TS 를 바로 못 돌리므로 esbuild(vite 가 깔아 둔 것)로 메모리에서 ES 모듈 하나로 묶어(파일을 쓰지 않음) data: 주소로 불러 쓴다.
확인: stlPieceNames(src/edit/objects.ts — 파일 이름 줄기, 겹치면 ' 2' · ' 3', 조각이 여럿이면 '줄기 1' · '줄기 2' 에서 겹치는 번호 건너뜀, 이름이 없으면 '형상 n');
requireTriangles(src/data/loaders/stl_loader.ts — 숫자가 아닌 꼭짓점의 ASCII STL · facet 없는 ASCII STL · NaN 좌표 바이너리 STL 은 STL_PARSE_ERROR 로 거절,
정상 ASCII · 바이너리는 통과); 84바이트보다 짧은 파일은 parseStl 이 같은 글로 거절; 서로 붙지 않은 덩어리 둘 → 조각 둘 · 이름 '줄기 1' · '줄기 2'.

실행: node scripts/test_stl_add.mjs
*/
/******************************************************************************/

import { build } from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ---------- 묶기(메모리) ----------
const res = await build({
  stdin: { contents: "export * from './src/data/loaders/stl_loader'; export { stlPieceNames, objectsFromGeometries } from './src/edit/objects';", resolveDir: ROOT, loader: 'ts' },
  bundle: true, platform: 'neutral', format: 'esm', target: 'es2022', write: false, logLevel: 'silent',
});
const M = await import(`data:text/javascript;base64,${Buffer.from(res.outputFiles[0].text).toString('base64')}`);
const { stlPieceNames, requireTriangles, parseStl, STL_PARSE_ERROR, objectsFromGeometries } = M;

let fail = 0, pass = 0;
const check = (ok, msg) => { console.log(`${ok ? 'PASS' : 'FAIL'} ${msg}`); if (ok) pass++; else fail++; };
const eq = (got, want, msg) => check(isDeepStrictEqual(got, want), isDeepStrictEqual(got, want) ? msg : `${msg} — 기대 ${JSON.stringify(want)}, 실제 ${JSON.stringify(got)}`);
/** fn 이 던진 글 (안 던지면 null). three STLLoader 가 숫자 아닌 꼭짓점에 찍는 콘솔 오류는 잠시 막는다 */
const thrown = (fn) => {
  const err = console.error; console.error = () => {};
  try { fn(); return null; } catch (e) { return e instanceof Error ? e.message : String(e); } finally { console.error = err; }
};
const enc = (s) => new TextEncoder().encode(s).buffer;

// ---------- 이름 (stlPieceNames) ----------
console.log('\n== 이름');
eq(stlPieceNames('building.stl', 1, []), ['building'], '파일 이름 줄기 (전처리 영역 이름과 같은 규칙)');
eq(stlPieceNames('building.stl', 1, ['building']), ['building 2'], '같은 파일을 또 더함 → building 2');
eq(stlPieceNames('building.STL', 1, ['building', 'building 2', '상자 1']), ['building 3'], '확장자 대소문자 · 다음 빈 번호');
eq(stlPieceNames('city.stl', 3, ['city 2']), ['city 1', 'city 3', 'city 4'], '조각 셋 → 줄기 1 · 2 · 3 에서 겹치는 번호 건너뜀');
eq(stlPieceNames('', 1, ['형상 1']), ['형상 2'], '파일 이름 없음 → 형상 n (겹치지 않게)');
eq(stlPieceNames(' .stl', 2, []), ['형상 1', '형상 2'], '줄기가 비면 형상 1 · 2');
eq(stlPieceNames('a.b.stl', 1, []), ['a.b'], '끝의 .stl 만 뺌');

// ---------- 형상으로 더할 수 있는가 (requireTriangles) ----------
console.log('\n== 삼각형 확인');
const facet = (a, b, c) => `facet normal 0 0 1\n outer loop\n  vertex ${a}\n  vertex ${b}\n  vertex ${c}\n endloop\nendfacet\n`;
const okAscii = enc(`solid ok\n${facet('0 0 0', '1 0 0', '0 1 0')}endsolid ok\n`);
check(thrown(() => requireTriangles(parseStl(okAscii))) === null, '정상 ASCII STL(삼각형 1개) → 통과');
const badAscii = enc(`solid bad\n${facet('a b c', 'd e f', 'g h i')}endsolid bad\n`);
let g = null;
check(thrown(() => { g = parseStl(badAscii); }) === null && g.getAttribute('position').count === 0, '숫자가 아닌 꼭짓점 ASCII STL → three 는 예외 없이 삼각형 0개 (고치기 전에는 빈 형상이 더해짐)');
eq(thrown(() => requireTriangles(parseStl(badAscii))), STL_PARSE_ERROR, `  → requireTriangles 가 거절: '${STL_PARSE_ERROR}'`);
const noFacet = enc(`solid empty\n${' '.repeat(100)}\nendsolid empty\n`);
eq(thrown(() => requireTriangles(parseStl(noFacet))), STL_PARSE_ERROR, 'facet 없는 ASCII STL(84바이트 넘음) → 거절');
eq(thrown(() => parseStl(enc('solid x\nendsolid x\n'))), STL_PARSE_ERROR, '84바이트보다 짧은 파일 → parseStl 이 같은 글로 거절');
/** 바이너리 STL: 삼각형마다 꼭짓점 9개 숫자 */
const binary = (tris) => {
  const buf = new ArrayBuffer(84 + tris.length * 50), dv = new DataView(buf);
  dv.setUint32(80, tris.length, true);
  tris.forEach((t, i) => { const p = 84 + i * 50; t.forEach((v, k) => dv.setFloat32(p + 12 + k * 4, v, true)); });
  return buf;
};
check(thrown(() => requireTriangles(parseStl(binary([[0, 0, 0, 1, 0, 0, 0, 1, 0]])))) === null, '정상 바이너리 STL → 통과');
eq(thrown(() => requireTriangles(parseStl(binary([[0, 0, 0, NaN, 0, 0, 0, 1, 0]])))), STL_PARSE_ERROR, 'NaN 좌표 바이너리 STL → 거절');
eq(thrown(() => requireTriangles(parseStl(binary([[0, 0, 0, Infinity, 0, 0, 0, 1, 0]])))), STL_PARSE_ERROR, '무한 좌표 바이너리 STL → 거절');

// ---------- 조각 나누기 + 이름 (AppCore.loadStlBuffer 흉내) ----------
console.log('\n== 조각과 이름');
{
  const two = parseStl(binary([[0, 0, 0, 1, 0, 0, 0, 1, 0], [10, 0, 0, 11, 0, 0, 10, 1, 0]])); // 서로 붙지 않은 삼각형 둘
  requireTriangles(two);
  const objs = objectsFromGeometries([two]);
  const names = stlPieceNames('parts.stl', objs.length, ['parts 1']);
  eq(objs.length, 2, '붙지 않은 덩어리 둘 → 조각 둘');
  eq(names, ['parts 2', 'parts 3'], '  이름: 이미 있는 parts 1 을 건너뜀');
  const one = objectsFromGeometries([parseStl(okAscii)]);
  eq([one.length, stlPieceNames('ok.stl', one.length, names)], [1, ['ok']], '덩어리 하나 → 줄기 그대로');
  check(one.every((o) => o.position.every(Number.isFinite) && o.size.every(Number.isFinite)), '정상 STL 의 형상 위치·크기는 유한한 수');
}

console.log(fail ? `\n실패 ${fail} · 통과 ${pass}` : `\n모두 통과 (통과 ${pass})`);
process.exit(fail ? 1 : 0);

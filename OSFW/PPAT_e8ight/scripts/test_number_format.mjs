#!/usr/bin/env node
// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   test_number_format.mjs

src/ui/dom.ts fmtRangeValue(범위 끝값·Threshold·Clip 기준값·범례 숫자 표시)의 Node 시험. esbuild 로 메모리에서 묶어(파일을 쓰지 않음) data: 주소로 불러 쓴다.
확인: 0 이 아닌 작은 값이 '0' 으로 보이지 않음(폭 0~1.41 의 0.00282 → '0.00282') · 폭에 맞는 값은 예전 자릿수 그대로(0.705 → '0.71', 1.41 → '1.41') ·
좁은 폭의 두 끝 구별(0.99995~1.00005) · 지수 표기의 가수 끝 0 빼기(-5e-13) · 0·무한·폭 0.

실행: node scripts/test_number_format.mjs
*/
/******************************************************************************/

import { build } from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const res = await build({ entryPoints: [path.join(ROOT, 'src/ui/dom.ts')], bundle: true, platform: 'neutral', format: 'esm', target: 'es2022', write: false, logLevel: 'silent', loader: { '.css': 'empty', '.svg': 'text' } });
const { fmtRangeValue } = await import(`data:text/javascript;base64,${Buffer.from(res.outputFiles[0].text).toString('base64')}`);

let fail = 0, pass = 0;
const eq = (v, span, want, name) => {
  const got = fmtRangeValue(v, span);
  if (got === want) { pass++; console.log(`PASS ${name}: ${v} (폭 ${span}) → ${got}`); } else { fail++; console.log(`FAIL ${name}: ${v} (폭 ${span}) → ${got} (기대 ${want})`); }
};

// 사용자 사례: 속도 크기 0~1.41, Threshold Upper 를 한 칸(폭/500) 움직인 값
eq(0.0028217248916626, 1.41, '0.00282', '폭에 견줘 작은 값은 유효숫자 3자리(0 으로 안 보임)');
eq(-0.0028217248916626, 1.41, '-0.00282', '음수도 같음');
eq(0.0128, 1.41, '0.0128', '폭 기준 두 자리면 0.01 로 뭉개지던 값');
eq(0.05, 1.41, '0.05', '끝의 0 은 빼고 보임');
// 폭에 맞는 값은 예전과 같음
eq(0.7054, 1.41, '0.71', '가운데 값: 예전 자릿수(소수 둘째)');
eq(1.41, 1.41, '1.41', '끝값');
eq(0, 1.41, '0', '0 은 0');
eq(0.016, 0.104, '0.016', 'Clip 위치(폭 0.104 m)');
eq(0.09999999951105565, 0.2, '0.1', '부동소수 찌꺼기는 폭 자릿수로 걷힘');
eq(101325, 50, '101325', '압력 큰 값·좁은 폭');
// 좁은 폭의 두 끝이 구별됨 (예전 목적)
eq(0.99995, 0.0001, '0.99995', '좁은 폭 아래 끝');
eq(1.00005, 0.0001, '1.00005', '좁은 폭 위 끝');
// 지수 표기
eq(-5e-13, 1e-12, '-5e-13', '한 점 범위로 넓힌 끝(예전 -5.000000e-13)');
eq(2.5e-13, 1.41, '2.5e-13', '아주 작은 값');
eq(1500123, 1000, '1.50012e+6', '아주 큰 값·좁은 폭은 자릿수 늘림');
eq(1500000, 1e6, '1.5e+6', '아주 큰 값의 가수 끝 0 빼기');
// 그 밖
eq(Infinity, 1, '-', '무한은 -');
eq(0.5, 0, '0.5', '폭 0 이면 fmtNum');

console.log(fail ? `\n실패 ${fail} · 통과 ${pass}` : `\n모두 통과 (통과 ${pass})`);
process.exit(fail ? 1 : 0);

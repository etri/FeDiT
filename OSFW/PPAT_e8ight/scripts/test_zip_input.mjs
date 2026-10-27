// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
// 결과 ZIP 열기 층(src/data/zipInput.ts → zipExtract.ts) 시험: 목록 읽기 · 메모리에 풀기 · 결과 폴더 탐색.
// 사용: node scripts/test_zip_input.mjs <zip 파일> [기대 목록 json]
// 기대 목록은 python zipfile의 infolist()를 [{name,size,compressed}]로 적은 것. 없으면 목록만 찍는다.
// (큰 ZIP을 폴더에 푸는 경로는 브라우저 전용(File System Access API)이라 여기서는 메모리 경로만 본다.)
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [zipPath, expectedPath] = process.argv.slice(2);
if (!zipPath) { console.error('zip 파일 경로가 필요합니다'); process.exit(2); }

// 브라우저용 TS를 Node에서 돌리려고 메모리에서 번들한다 (window 참조는 typeof로 막혀 있다)
const entry = `
  export * from './src/data/zipInput.ts';
  export { listZipEntries } from './src/data/zipExtract.ts';
  export * from './src/data/resultSet.ts';
`;
fs.writeFileSync(path.join(ROOT, '.ziptest-entry.ts'), entry);
const out = path.join(ROOT, '.ziptest-bundle.mjs');
try {
  await build({ entryPoints: [path.join(ROOT, '.ziptest-entry.ts')], bundle: true, platform: 'node', format: 'esm', outfile: out, logLevel: 'silent', target: 'node18' });
} finally { fs.unlinkSync(path.join(ROOT, '.ziptest-entry.ts')); }
const mod = await import(pathToFileURL(out).href);
fs.unlinkSync(out);

const bytes = fs.readFileSync(zipPath);
const file = new File([bytes], path.basename(zipPath));
let fail = 0;
const check = (ok, msg) => { console.log(`${ok ? 'PASS' : 'FAIL'} ${msg}`); if (!ok) fail++; };

const t0 = performance.now();
const entries = await mod.listZipEntries(file);
const files = entries.filter((e) => !e.isDir);
console.log(`listZipEntries: ${files.length} files, ${files.reduce((s, e) => s + e.usize, 0)} bytes, ${Math.round(performance.now() - t0)} ms`);
if (expectedPath) {
  const expected = JSON.parse(fs.readFileSync(expectedPath, 'utf8'));
  const expFiles = expected.filter((e) => !e.name.endsWith('/'));
  check(files.length === expFiles.length, `파일 수 ${files.length} == ${expFiles.length}`);
  let bad = 0;
  for (const e of expected) {
    const got = entries.find((x) => x.name === e.name);
    if (!got || got.usize !== e.size || got.csize !== e.compressed) { bad++; if (bad <= 5) console.log(`  다름: ${e.name} size ${got?.usize}/${e.size} compressed ${got?.csize}/${e.compressed}`); }
  }
  check(bad === 0, `목록의 이름·크기가 python zipfile과 같음 (다른 항목 ${bad}개)`);
}

const t1 = performance.now();
let last = null;
const r = await mod.openResultZip(file, { memoryLimit: 512 * 1024 * 1024, onProgress: (p) => { last = p; } });
console.log(`openResultZip: where=${r.where} files=${r.files} unpacked=${r.unpackedBytes} bytes, ${Math.round(performance.now() - t1)} ms, last progress ${last?.entries}/${last?.totalFiles}`);
check(r.files === files.length, '푼 파일 수가 목록과 같음');
let sizeBad = 0;
for (const e of files) {
  const src = await r.folder.file(e.name);
  if (!src || (await src.size()) !== e.usize) sizeBad++;
  if (e.name === 'big/a.bin' && src) {
    const buf = new Uint8Array(await src.read(0, e.usize - 1));
    let ok = true;
    for (let i = 0; i < buf.length; i += 997) if (buf[i] !== (i & 255)) { ok = false; break; }
    check(ok, 'big/a.bin 내용이 0..255 반복');
  }
}
check(sizeBad === 0, `푼 파일 크기가 목록과 같음 (다른 파일 ${sizeBad}개)`);

// 결과 폴더 탐색 (엔진 ZIP 모양이면 <job>/<stem>/ 에서 .vtm을 찾고 입력 JSON을 <job>/에서 찾는다)
try {
  const scan = await mod.scanResultFolder(r.folder);
  console.log(`scan: title=${scan.title} folderPath=${scan.folderPath} steps=${scan.steps.length} blocks=${scan.blocks.map((b) => `${b.name}:${b.numCells}`).join(',')} input=${scan.input?.path ?? null} times=${scan.steps.slice(0, 3).map((s) => s.time).join(',')}… notes=${JSON.stringify(scan.notes)}`);
  check(scan.steps.length > 0, '저장 시점을 찾음');
  check(!!scan.input, '입력 JSON을 작업 폴더에서 찾음');
} catch (e) {
  console.log(`scan: ${e.message}`);
}
console.log(fail ? `실패 ${fail}건` : '모두 통과');
process.exit(fail ? 1 : 0);

#!/usr/bin/env node
/**
 * 생성된 예제 VTK 파일을 앱이 실제로 쓰는 파서/스트림라인 코드로 왕복 검증합니다.
 *
 *   node tools/verify-vtk-samples.mjs [dir]
 *
 * 검증 항목
 *  1) src/lib/vtk-legacy.mjs 로 파싱 성공 (헤더 순서 / BINARY / big-endian)
 *  2) manifest.json 의 dims/spacing/origin/scalarRange 와 일치
 *  3) 00_tiny_smoke 는 scalars=i+10j+100k, vectors=(i,j,k) 를 정확히 복원
 *     → 바이트 순서(big-endian)와 x-fastest 인덱싱을 동시에 검증
 *  4) 벡터가 있으면 src/lib/streamlines.mjs 로 실제 스트림라인이 생성되는지 확인
 */

import {readFileSync, readdirSync, existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {parseLegacyStructuredPoints, idx} from '../src/lib/vtk-legacy.mjs';
import {generateStreamlineRibbons} from '../src/lib/streamlines.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const dir = path.resolve(process.argv[2] || path.join(ROOT, 'data', 'samples'));

if (!existsSync(dir)) {
    console.error(`디렉터리가 없습니다: ${dir}\n먼저 node tools/gen-vtk-samples.mjs 를 실행하세요.`);
    process.exit(1);
}

const manifestPath = path.join(dir, 'manifest.json');
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {cases: []};
const byFile = new Map(manifest.cases.map((c) => [c.file, c]));

const files = readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.vtk')).sort();
let failures = 0;

const eq = (a, b, tol = 1e-4) => Math.abs(a - b) <= tol;
const eqArr = (a, b, tol = 1e-4) => a.length === b.length && a.every((v, i) => eq(v, b[i], tol));

for (const file of files) {
    const full = path.join(dir, file);
    const problems = [];
    let info = '';
    try {
        const buf = readFileSync(full);
        const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
        const vtk = parseLegacyStructuredPoints(ab);
        const [nx, ny, nz] = vtk.dims;

        if (vtk.count !== nx * ny * nz) problems.push(`POINT_DATA(${vtk.count}) != nx*ny*nz(${nx * ny * nz})`);

        const m = byFile.get(file);
        if (m) {
            if (!eqArr(vtk.dims, m.dims)) problems.push(`dims ${vtk.dims} != manifest ${m.dims}`);
            if (!eqArr(vtk.spacing, m.spacing)) problems.push(`spacing ${vtk.spacing} != manifest ${m.spacing}`);
            if (!eqArr(vtk.origin, m.origin)) problems.push(`origin ${vtk.origin} != manifest ${m.origin}`);
            if (!!vtk.scalars !== !!m.scalars) problems.push(`scalars 존재 여부 불일치`);
            if (!!vtk.vectors !== !!m.vectors) problems.push(`vectors 존재 여부 불일치`);
            if (m.scalars && vtk.scalarsName !== m.scalars) problems.push(`scalars 이름 ${vtk.scalarsName} != ${m.scalars}`);
            if (m.vectors && vtk.vectorsName !== m.vectors) problems.push(`vectors 이름 ${vtk.vectorsName} != ${m.vectors}`);
        }

        // 스칼라 범위
        let smin = Infinity, smax = -Infinity;
        if (vtk.scalars) {
            for (let i = 0; i < vtk.scalars.length; i++) {
                const v = vtk.scalars[i];
                if (!Number.isFinite(v)) {
                    problems.push(`scalars[${i}] 가 유한하지 않음`);
                    break;
                }
                if (v < smin) smin = v;
                if (v > smax) smax = v;
            }
            if (m && m.scalarRange && !eqArr([smin, smax], m.scalarRange, Math.max(1e-3, Math.abs(m.scalarRange[1]) * 1e-5))) {
                problems.push(`scalar range [${smin.toFixed(3)}, ${smax.toFixed(3)}] != manifest [${m.scalarRange.map((v) => v.toFixed(3))}]`);
            }
            info += `${vtk.scalarsName}∈[${smin.toFixed(2)}, ${smax.toFixed(2)}]  `;
        }

        // 벡터 유한성 + 최대 속력
        let vmax = 0;
        if (vtk.vectors) {
            for (let i = 0; i < vtk.vectors.length; i += 3) {
                const s = Math.hypot(vtk.vectors[i], vtk.vectors[i + 1], vtk.vectors[i + 2]);
                if (!Number.isFinite(s)) {
                    problems.push(`vectors[${i / 3}] 가 유한하지 않음`);
                    break;
                }
                if (s > vmax) vmax = s;
            }
            if (vmax <= 0) problems.push('벡터장이 전부 0');
            info += `|v|max=${vmax.toFixed(2)}  `;
        }

        // 초소형 케이스는 값 자체를 정확히 대조 (엔디안 + 인덱싱 동시 검증)
        if (file.startsWith('00_tiny_smoke') && manifest.upAxis !== 'y') {
            let bad = 0;
            for (let k = 0; k < nz && bad === 0; k++) {
                for (let j = 0; j < ny && bad === 0; j++) {
                    for (let i = 0; i < nx; i++) {
                        const id = idx(i, j, k, nx, ny, nz);
                        if (vtk.scalars[id] !== i + 10 * j + 100 * k) {
                            problems.push(`scalars(${i},${j},${k})=${vtk.scalars[id]} != ${i + 10 * j + 100 * k}`);
                            bad++;
                            break;
                        }
                        if (vtk.vectors[id * 3] !== i || vtk.vectors[id * 3 + 1] !== j || vtk.vectors[id * 3 + 2] !== k) {
                            problems.push(`vectors(${i},${j},${k}) 불일치`);
                            bad++;
                            break;
                        }
                    }
                }
            }
            if (!bad) info += 'index-encoding OK  ';
        }

        // 스트림라인 생성 확인
        if (vtk.vectors && nx > 8 && ny > 8 && nz > 4) {
            const r = generateStreamlineRibbons(
                {dims: vtk.dims, spacing: vtk.spacing, origin: vtk.origin, vectors: vtk.vectors},
                {seedStride: 6, maxSteps: 300, seedPlane: 'XY', seedOffset: 0.35}
            );
            if (!r.stats.ribbons) problems.push('스트림라인이 하나도 생성되지 않음');
            info += `ribbons=${r.stats.ribbons}/${r.stats.seeds} tris=${r.triCount}`;
        }
    } catch (e) {
        problems.push(`파싱 실패: ${e.message}`);
    }

    if (problems.length) {
        failures++;
        console.log(`✗ ${file}`);
        for (const p of problems) console.log(`    - ${p}`);
    } else {
        console.log(`✓ ${file.padEnd(28)} ${info}`);
    }
}

console.log(`\n${files.length - failures}/${files.length} 통과`);
process.exitCode = failures ? 1 : 0;

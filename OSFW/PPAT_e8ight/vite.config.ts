// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
import { defineConfig, Plugin } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));

/** 개발 서버 전용: 브라우저가 POST한 PNG를 captures/ 폴더에 저장한다 (보고서용 고해상도 캡처). */
function capturePlugin(): Plugin {
  return {
    name: 'capture-endpoint',
    configureServer(server) {
      server.middlewares.use('/__capture', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(); return; }
        const url = new URL(req.url ?? '/', 'http://localhost');
        const name = (url.searchParams.get('name') ?? `capture-${Date.now()}`).replace(/[^\w.-]/g, '_');
        const chunks: Buffer[] = [];
        req.on('data', (c: Buffer) => chunks.push(c));
        req.on('end', () => {
          const dir = path.join(ROOT, 'captures');
          fs.mkdirSync(dir, { recursive: true });
          const file = path.join(dir, `${name}.png`);
          fs.writeFileSync(file, Buffer.concat(chunks));
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ file }));
        });
      });
    },
  };
}

/**
 * 개발 서버 전용: 프로젝트 밖의 큰 데이터 폴더를 /__data/<이름>/... 으로 서빙한다.
 * 매핑은 data-roots.json ({ "ahmed": "C:/data/Ahmed_body" }). HTTP Range(바이트 범위) 요청을 지원해
 * VTU 로더가 필요한 배열만 골라 읽을 수 있다.
 */
function dataRootsPlugin(): Plugin {
  const cfgPath = path.join(ROOT, 'data-roots.json');
  // 요청마다 다시 읽는다 (파일을 나중에 만들거나 고쳐도 서버 재시작 없이 반영)
  const readRoots = (): Record<string, string> => {
    try { return fs.existsSync(cfgPath) ? JSON.parse(fs.readFileSync(cfgPath, 'utf8')) : {}; } catch { return {}; }
  };
  return {
    name: 'external-data-roots',
    configureServer(server) {
      // 폴더 목록: /__list/<이름>/<경로> → [{name, kind}] (결과 폴더를 서버 주소로 열 때 씀)
      server.middlewares.use('/__list', (req, res) => {
        const url = new URL(req.url ?? '/', 'http://localhost');
        const parts = decodeURIComponent(url.pathname).split('/').filter(Boolean);
        const root = readRoots()[parts[0]];
        if (!root) { res.statusCode = 404; res.end(`unknown data root: ${parts[0]}`); return; }
        const dir = path.resolve(root, parts.slice(1).join('/'));
        if (!dir.startsWith(path.resolve(root)) || !fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) { res.statusCode = 404; res.end('not found'); return; }
        const entries = fs.readdirSync(dir, { withFileTypes: true }).map((d) => ({ name: d.name, kind: d.isDirectory() ? 'dir' : 'file' }));
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(entries));
      });
      server.middlewares.use('/__data', (req, res) => {
        const url = new URL(req.url ?? '/', 'http://localhost');
        const parts = decodeURIComponent(url.pathname).split('/').filter(Boolean);
        const root = readRoots()[parts[0]];
        if (!root) { res.statusCode = 404; res.end(`unknown data root: ${parts[0]}`); return; }
        const file = path.resolve(root, parts.slice(1).join('/'));
        if (!file.startsWith(path.resolve(root))) { res.statusCode = 403; res.end(); return; }
        if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { res.statusCode = 404; res.end('not found'); return; }
        const size = fs.statSync(file).size;
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Type', file.endsWith('.vtm') ? 'text/xml' : 'application/octet-stream');
        const range = req.headers.range;
        if (range) {
          const m = /bytes=(\d*)-(\d*)/.exec(range);
          const start = m && m[1] ? Number(m[1]) : 0;
          let end = m && m[2] ? Number(m[2]) : size - 1;
          if (start >= size) { res.statusCode = 416; res.setHeader('Content-Range', `bytes */${size}`); res.end(); return; }
          end = Math.min(end, size - 1);
          res.statusCode = 206;
          res.setHeader('Content-Range', `bytes ${start}-${end}/${size}`);
          res.setHeader('Content-Length', String(end - start + 1));
          fs.createReadStream(file, { start, end }).pipe(res);
          return;
        }
        res.statusCode = 200;
        res.setHeader('Content-Length', String(size));
        fs.createReadStream(file).pipe(res);
      });
    },
  };
}

export default defineConfig({
  // 배포 기준 경로: 페이지(index·pre·post.html)와 같은 폴더 기준 상대 주소로 빌드한다 — 서버의 하위 경로(예: /cfd/)에 올려도 화면 파일을 찾는다
  base: './',
  plugins: [capturePlugin(), dataRootsPlugin()],
  server: { port: 5177, host: true },
  // 페이지 넷: index.html(시작) · pre.html(전처리) · sim.html(물리 시뮬레이션) · post.html(후처리). 호스트 앱은 시작 화면(/) 하나를 iframe 탭으로 띄우고, 페이지 사이는 우리 화면 안에서 오간다
  build: {
    sourcemap: false,
    rollupOptions: { input: { index: path.join(ROOT, 'index.html'), pre: path.join(ROOT, 'pre.html'), sim: path.join(ROOT, 'sim.html'), post: path.join(ROOT, 'post.html') } },
  },
});

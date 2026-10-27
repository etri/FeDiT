// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   main.ts (후처리 페이지 진입점, post.html)

해석 결과를 읽어 가시화한다: 결과 폴더·결과 ZIP·데이터 목록(public/datasets.json)을 열고,
데이터 → 표현 방식(Surface·Outline·Points·Volume) → Clip·Threshold·Slice·Glyph·Streamline·Isosurface 노드를 ParaView 파이프라인처럼 트리로 쌓고, 저장 시점을 슬라이더로 재생한다.
공통 틀(3D 화면·패널·도구막대)은 app/shell.ts, 속성 화면은 ui/panel.ts, 장면 트리는 ui/sceneTree.ts.
post.html?job=<작업 번호>: 물리 시뮬레이션 페이지의 '가시화'가 여는 주소. 서버의 엔진 작업 폴더(results/<작업 번호>/)를 바로 읽는다(목록 첫 항목은 열지 않음).
알림창(alert)은 쓰지 않는다 — 호스트 iframe 에 allow-modals 가 없으면 말없이 막힌다.
*/
/******************************************************************************/
import { mountShell } from '../app/shell';
import { AppCore } from '../core/AppCore';
import { DirectoryHandleFolder, HttpFolder, folderFromDataTransfer } from '../data/source';
import { resultFolderUrl } from '../data/engineApi';
import { openZipFile } from '../ui/openZip';
import { mountPanel } from '../ui/panel';
import { mountSceneTree } from '../ui/sceneTree';
import { el } from '../ui/dom';

const shell = mountShell({
  title: '연합트윈 CFD 후처리',
  fitTargets: [{ value: 'data', label: '데이터에 맞춤' }, { value: 'shapes', label: '형상에 맞춤' }],
});
const { app, viewport, fitTarget, views } = shell;
const panelApi = mountPanel(app, shell.panelBody, { storageKey: 'utcfd.post.tab' });
mountSceneTree(app, shell.tree, panelApi);

// 도구막대 왼쪽: 데이터 종류 배지와 이름
const badgeData = el('span', 'badge', '');
const datasetName = el('span', 'dataset', '');
shell.toolbarLeft.append(badgeData, datasetName, el('span', 'sep'));

app.subscribe(() => {
  const entry = app.catalog.find((c) => c.id === app.currentId);
  const badge = entry ? (entry.badge ?? '') : (app.dataset ? '사용자 파일' : ''); // 목록에 없는(끌어다 놓은) 파일만 '사용자 파일'
  badgeData.textContent = badge;
  badgeData.hidden = !badge;
  badgeData.classList.toggle('real', !!entry?.badge && entry.kind === 'vtm');
  datasetName.textContent = entry ? entry.label : (app.dataset ? app.dataset.name : '데이터 없음');
  if (app.dataset && app.currentId && entry?.view?.fit === 'shapes') fitTarget.value = 'shapes';
});

// 3D 화면에 끌어다 놓기: 폴더·.vtm 묶음 → 결과 폴더, .zip → 결과 ZIP, 그 밖에는 CSV/STL
viewport.addEventListener('dragover', (e) => { e.preventDefault(); viewport.classList.add('drop'); });
viewport.addEventListener('dragleave', () => viewport.classList.remove('drop'));
viewport.addEventListener('drop', async (e) => {
  e.preventDefault();
  viewport.classList.remove('drop');
  const dt = e.dataTransfer;
  if (!dt) return;
  const folderPromise = folderFromDataTransfer(dt); // 핸들은 이벤트 안에서 잡아야 한다
  const dropped = Array.from(dt.files ?? []);
  const folder = await folderPromise;
  try {
    const zip = dropped.find((f) => /\.zip$/i.test(f.name));
    if (zip && dropped.length === 1) { await openZipFile(app, zip); return; }
    // 폴더를 놓았거나 결과 묶음 파일(.vtm)이 섞여 있으면 결과 폴더로 연다
    if (folder && (folder instanceof DirectoryHandleFolder || dropped.some((f) => /\.vtm$/i.test(f.name)))) { await app.loadResultFolder(folder); return; }
    for (const f of dropped) {
      const lower = f.name.toLowerCase();
      if (lower.endsWith('.stl')) app.loadStlBuffer(await f.arrayBuffer());
      else app.loadCsvText(await f.text(), f.name);
    }
  } catch (err) {
    // 알림창 대신 데이터 화면의 안내 글에 덧붙이고 그 화면을 연다
    app.notify((err as Error).message);
    panelApi.showTab('data');
  }
});

/** 시연·캡처용 주소 매개변수 (?scene= ?tab= ?select= ?tool= ?view=). 데이터를 연 뒤에 부른다 */
async function applyUrlParams(): Promise<void> {
  const params = new URLSearchParams(location.search);
  // ?scene=이름 → public/scenes/이름.json (레이어·색·표시·시점)을 얹는다
  const scene = params.get('scene');
  if (scene) {
    const res = await fetch(`scenes/${encodeURIComponent(scene)}.json`); // 페이지 기준 상대 주소
    if (!res.ok) throw new Error(`장면 파일을 찾을 수 없습니다: ${scene}`);
    app.sceneFromJSON(await res.text());
    // ?tab=clip|threshold|points|slice|glyph|stream|iso 이면 장면의 첫 그 노드를 골라 속성 화면을 연다
    const tab = params.get('tab');
    const first = app.layers.find((l) => l.type === tab);
    if (first) { app.selectLayer(first.id); panelApi.showTab(first.type); }
  }
  // ?select=이름,이름 → 그 형상을 골라 편집 화면을 연다. ?tool=translate|rotate|scale 로 핸들 종류
  const select = params.get('select');
  if (select) {
    const names = select.split(',');
    const ids = app.objects.list.filter((o) => names.includes(o.name)).map((o) => o.id);
    if (ids.length) { app.objects.select(ids, 'replace'); panelApi.showTab('edit'); }
  }
  const tool = params.get('tool');
  if (tool === 'translate' || tool === 'rotate' || tool === 'scale') app.editor.setMode(tool);
  // ?view=iso|top|front|side → 그 방향으로 화면 맞춤 (캡처용)
  const view = params.get('view');
  if (view === 'iso' || view === 'top' || view === 'front' || view === 'side') { views.value = view; shell.fit(view); }
}

/** 작업 번호 규칙 (엔진과 같음: 영문·숫자·_·- 64자 이하) */
const JOB_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

/** ?job=<작업 번호> → 서버의 엔진 작업 폴더(results/<작업 번호>/: <이름>.json + <이름>/…vtm)를 결과 폴더로 연다 */
async function openServerJob(jobId: string): Promise<void> {
  await app.loadCatalog().catch(() => []); // 데이터 목록 칸을 채우기만 하고 첫 항목은 열지 않는다
  try {
    if (!JOB_ID_RE.test(jobId)) throw new Error('작업 번호 형식이 맞지 않습니다.');
    const url = resultFolderUrl(jobId);
    const folder = new HttpFolder(url, url, { autoindex: true });
    if (!(await folder.list())) throw new Error(`서버에 작업 폴더가 없습니다: ${jobId}`); // 없는 번호·results/ 길이 없는 서버
    await app.loadResultFolder(folder);
  } catch (e) {
    const msg = `서버 결과를 열지 못했습니다: ${e instanceof Error ? e.message : e}`;
    // 읽기 덮개는 다음 화면 갱신(1초마다 emit)에 내려가므로, 데이터 화면의 안내 글에도 남기고 그 화면을 연다
    shell.overlay.show(msg);
    app.notify(msg);
    panelApi.showTab('data');
    return;
  }
  await applyUrlParams().catch((e) => shell.overlay.show(`불러오지 못했습니다: ${e}`));
}

const jobParam = new URLSearchParams(location.search).get('job');
if (jobParam !== null) {
  void openServerJob(jobParam);
} else {
  app.loadCatalog()
    .then((cat) => {
      // ?data=아이디 → 그 데이터셋으로 시작 (없거나 못 찾으면 첫 항목)
      const want = new URLSearchParams(location.search).get('data');
      const entry = (want ? cat.find((c) => c.id === want) : undefined) ?? cat[0];
      return entry ? app.loadEntry(entry) : Promise.reject(new Error('datasets.json에 항목이 없습니다.'));
    })
    .then(applyUrlParams)
    .catch((e) => shell.overlay.show(`불러오지 못했습니다: ${e}`));
}

// 디버깅용
(window as unknown as { app: AppCore }).app = app;

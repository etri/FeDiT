// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   main.ts (후처리 페이지 진입점, post.html)

해석 결과를 읽어 가시화한다: 서버 결과·결과 폴더·결과 ZIP·CSV·예제(public/datasets.json)를 열고,
데이터 → 표현 방식(Surface·Outline·Points·Volume) → Clip·Threshold·Slice·Glyph·Streamline·Isosurface 노드를 ParaView 파이프라인처럼 트리로 쌓고, 저장 시점을 슬라이더로 재생한다.
공통 틀(3D 화면·패널·도구막대)은 app/shell.ts, 속성 화면은 ui/panel.ts, 장면 트리는 ui/sceneTree.ts.
여는 일은 '데이터 열기' 창(openDataDialog.ts, 2026-11-05): 맨 위 '서버 결과'(serverResults.ts — 이 서버에 쌓인 해석 결과) → '파일'(fileOpen.ts) →
'예제'(examples.ts — 함께 실린 예제 데이터). 데이터가 없으면 창을 닫을 수 없다(나갈 길은 창 안 '처음 화면'). 데이터 화면 맨 위 [데이터 열기]로 다시 띄운다.
페이지를 처음 열 때(2026-11-04, 2026-11-05 창으로 바꿈):
- post.html?job=<작업 번호>: 물리 시뮬레이션 페이지의 '가시화'가 여는 주소. 창 없이 서버의 엔진 작업 폴더(results/<작업 번호>/)를 바로 연다(서버 결과 줄 [열기]와 같은 함수).
  실패하고 데이터가 없으면 창을 띄운다(오류는 '서버 결과' 묶음 맨 위 한 줄).
- post.html?data=<아이디>: 예제의 그 줄 [열기]와 같다(창 없이). 목록에 없거나 못 열면 아무것도 열지 않고 '예제' 묶음에 알리고 창을 띄운다. ?job= 과 함께 오면 ?job= 이 이긴다.
- 둘 다 없으면 아무것도 열지 않고 창을 띄운다(뒤의 패널은 데이터 화면). 목록 파일의 줄 순서는 처음 동작을 정하지 않는다.
- ?scene= 은 데이터가 열린 뒤에만 얹는다(장면 파일에 데이터 아이디가 없으므로 시연 주소는 ?data=city-synthetic&scene=city-layers 처럼 함께 쓴다).
  데이터가 없으면 창의 제목 아래 안내 한 줄('장면을 얹을 데이터가 없습니다: <이름>'). 창 안에서 다른 데이터를 열면 주소에서 ?scene= · ?tab= 을 지운다.
끌어다 놓기: 3D 화면과 창이 같은 함수(dropOpen.ts). 3D 화면에 STL 을 놓으면 형상으로 더한다(형상 편집 화면의 [STL 추가]와 같다).
주소의 ?data= · ?job= 은 열린 데이터를 따른다(판정은 openedData.ts): 예제 → data, 서버 결과 → job, 사용자 파일 → 둘 다 지움 — 새로 고치면 보던 것이 열린다.
알림창(alert)은 쓰지 않는다 — 호스트 iframe 에 allow-modals 가 없으면 말없이 막힌다.
*/
/******************************************************************************/
import { mountShell } from '../app/shell';
import { AppCore } from '../core/AppCore';
import { mountPanel } from '../ui/panel';
import { mountSceneTree } from '../ui/sceneTree';
import { button, el } from '../ui/dom';
import { openDropped, takeDrop } from './dropOpen';
import { mountOpenDataDialog } from './openDataDialog';
import { OpenedData, SOURCE_LABEL, openedDataOf, sceneDroppedUrl, syncedPostUrl } from './openedData';
import { serverJobOf } from './openServerJob';

const shell = mountShell({
  title: '연합트윈 CFD 후처리',
  fitTargets: [{ value: 'data', label: '데이터에 맞춤' }, { value: 'shapes', label: '형상에 맞춤' }],
});
const { app, viewport, fitTarget, views } = shell;
const errText = (e: unknown): string => (e instanceof Error ? e.message : String(e));

// 목록 파일(datasets.json)은 페이지를 열 때 한 번 읽는다. '예제' 줄을 채우는 데만 쓰고, 처음에 무엇을 열지는 정하지 않는다.
// 못 읽으면 '예제' 묶음이 그 자리에 '예제 목록을 읽지 못했습니다.'를 보인다(examples.ts)
const catalogReady = app.loadCatalog();
catalogReady.catch(() => { /* 위 설명대로 */ });

/** 주소의 장면 매개변수(?scene= · ?tab=)를 지운다 — 창 안에서 다른 데이터를 열었을 때. 장면은 주소로 처음 연 데이터에만 얹으므로(applyUrlParams),
 *  남기면 새로 고칠 때 창에서 고른 데이터에 그 장면이 얹혀 보던 것과 다른 화면이 열린다(판정은 openedData.ts sceneDroppedUrl) */
const dropSceneParams = () => {
  const next = sceneDroppedUrl(location);
  if (next) history.replaceState(history.state, '', next);
};

// '데이터 열기' 창: 서버 결과(페이지를 열 때 목록을 한 번 읽는다) · 파일 · 예제. 창 안에서 연 것이 열리면 패널을 데이터 화면으로 돌리고 장면 매개변수를 지운 뒤 닫는다
const dialog = mountOpenDataDialog(app, { catalog: catalogReady, onOpened: () => { panelApi.showTab('data'); dropSceneParams(); } });
const { serverResults, examples } = dialog;
// 데이터 화면 맨 위의 다시 여는 입구. 글은 상태와 상관없이 늘 '데이터 열기'
const openBtn = button('데이터 열기', () => dialog.open(openBtn), 'normal', 'folder');
openBtn.setAttribute('aria-haspopup', 'dialog');
const panelApi = mountPanel(app, shell.panelBody, { storageKey: 'utcfd.post.tab', dataTop: [openBtn], addStl: true });
mountSceneTree(app, shell.tree, panelApi); // 장면 트리의 데이터 줄은 데이터 화면을 열기만 한다(창을 바로 띄우지 않음)

// 도구막대 왼쪽: 열린 데이터의 출처 꼬리표(예제 · 서버 결과 · 사용자 파일)와 이름
const badgeData = el('span', 'badge', '');
const datasetName = el('span', 'dataset', '');
shell.toolbarLeft.append(badgeData, datasetName, el('span', 'sep'));

/** 지금 열린 데이터의 출처 (없으면 null) */
const openedNow = (): OpenedData | null => openedDataOf(!!app.dataset, app.currentId, app.catalog.map((c) => c.id), serverJobOf(app.currentId));

let urlFor: string | undefined; // 주소를 맞춰 둔 열린 데이터 (undefined = 아직 맞춘 적 없음)
/** 주소의 ?data= · ?job= 을 열린 데이터에 맞춘다. 아무것도 안 열렸으면(여는 중 · 못 엶) 그대로 둔다 */
const syncUrl = (opened: OpenedData | null) => {
  if (!opened) return;
  const key = JSON.stringify(opened);
  if (key === urlFor) return;
  urlFor = key;
  const next = syncedPostUrl(location, opened);
  if (next) history.replaceState(history.state, '', next);
};

let fitFor: unknown = undefined; // 맞춤 칸을 맞춰 둔 데이터 (새로 열 때마다 app.dataset 이 새 것이 된다)
/** 도구막대 꼬리표·이름과 주소를 열린 데이터에 맞춘다 */
const syncOpened = () => {
  const opened = openedNow();
  const badge = opened ? SOURCE_LABEL[opened.kind] : '';
  if (badgeData.textContent !== badge) badgeData.textContent = badge;
  badgeData.hidden = !badge;
  // 장면 트리 맨 윗줄과 같은 이름 (sceneTree.ts)
  const name = app.currentLabel ?? (app.dataset ? app.dataset.name : '데이터 없음');
  if (datasetName.textContent !== name) datasetName.textContent = name;
  // 형상에 맞춰 보는 예제(view.fit 'shapes')는 연 순간에만 맞춤 칸을 '형상에 맞춤'으로 — 그 뒤 사용자가 고른 값은 화면 갱신마다 되돌리지 않는다
  if (app.dataset !== fitFor) {
    fitFor = app.dataset;
    const entry = opened?.kind === 'example' ? app.catalog.find((c) => c.id === opened.id) : undefined;
    if (entry?.view?.fit === 'shapes') fitTarget.value = 'shapes';
  }
  syncUrl(opened);
};
app.subscribe(syncOpened);
syncOpened(); // 첫 화면: 꼬리표 숨김 · '데이터 없음'

// 3D 화면에 끌어다 놓기: 폴더·.vtm 묶음 → 결과 폴더, .zip → 결과 ZIP, 그 밖에는 CSV/STL(형상으로 더함). 창이 떠 있으면 뒤판이 덮고 창(층 전체)이 받는다(openDataDialog.ts).
// 다른 데이터를 여는 중(app.opening)이면 열지 않는다(dropOpen.ts — 늦게 끝난 쪽이 이기지 않게). 저장 시점을 읽는 중(재생)은 막지 않는다
viewport.addEventListener('dragover', (e) => { e.preventDefault(); viewport.classList.add('drop'); });
viewport.addEventListener('dragleave', () => viewport.classList.remove('drop'));
viewport.addEventListener('drop', (e) => {
  e.preventDefault();
  viewport.classList.remove('drop');
  const dt = e.dataTransfer;
  if (!dt) return;
  openDropped(app, takeDrop(dt), 'viewport').catch((err) => {
    const msg = errText(err);
    // 알림창 대신: 데이터가 있으면 데이터 화면의 안내 글에 덧붙이고 그 화면을 연다. 데이터가 없으면(주소의 ?data= 목록을 기다리는 사이 등) 창의 '파일' 결과 줄에.
    // 창을 먼저 띄운 뒤 오류를 쓴다 — 창을 열 때 지난 결과 줄을 지우므로(openDataDialog.ts open)
    if (!app.dataset && !app.opening) { dialog.open(null); dialog.showFileError(msg); return; }
    app.notify(msg);
    panelApi.showTab('data');
  });
});

/** 시연·캡처용 주소 매개변수 (?scene= ?tab= ?select= ?tool= ?view=). 처음 데이터를 열고 난 뒤(또는 열 것이 없을 때) 부른다 */
async function applyUrlParams(): Promise<void> {
  const params = new URLSearchParams(location.search);
  // ?scene=이름 → public/scenes/이름.json (레이어·색·표시·시점)을 얹는다. 데이터가 열린 뒤에만
  const scene = params.get('scene');
  if (scene && !app.dataset) {
    dialog.showUrlNote(`장면을 얹을 데이터가 없습니다: ${scene}`); // 창의 제목 아래 안내 (데이터를 열면 지워진다)
  } else if (scene) {
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
// 주소 매개변수 오류: 데이터가 없으면 창의 제목 아래 안내 줄(읽기 덮개는 창에 가려진다), 있으면 읽기 덮개
const applyUrlParamsSafe = () => applyUrlParams().catch((e) => {
  const msg = `불러오지 못했습니다: ${errText(e)}`;
  if (!app.dataset) dialog.showUrlNote(msg);
  else shell.overlay.show(msg);
});

/** 주소로 연 것이 실패한 뒤: 데이터가 없고 다른 것을 여는 중도 아니면(app.opening · 창의 '파일' 묶음) 창을 띄운다(닫은 뒤 초점은 3D 화면). 뒤의 패널은 데이터 화면 */
const openDialogIfEmpty = () => {
  if (app.dataset || dialog.isBusy()) return;
  panelApi.showTab('data');
  dialog.open(null);
};

/** ?job=<작업 번호> → 서버의 엔진 작업 폴더를 결과 폴더로 연다 (서버 결과 목록의 [열기]와 같은 함수, 목록에 그 줄이 있으면 '여는 중…'·'열림'·오류가 그 줄에도 보인다) */
async function openJobParam(jobId: string): Promise<void> {
  // 목록 파일을 기다리지 않고 바로 연다 — 기다리는 사이 목록의 다른 줄을 누르면 이 열기가 '여는 중' 오류로 끝난다.
  // 이름은 결과 폴더의 끝 이름(목록 줄보다 먼저 열리므로). 진행은 읽기 덮개에 보인다(창을 띄우지 않으므로)
  try {
    await serverResults.open(jobId);
  } catch (e) {
    // 오류는 창의 '서버 결과' 묶음 맨 위 한 줄에 남긴다(그 작업이 읽은 줄 안에 없어도 보이게)
    serverResults.showJobError(jobId, errText(e));
    if (app.dataset || dialog.isBusy()) { // 그사이 사용자가 다른 데이터를 열었거나 여는 중이면 화면·장면은 건드리지 않는다(openDataParam 과 같다)
      if (app.dataset) app.notify(`서버 결과를 열지 못했습니다(작업 ${jobId}): ${errText(e)}`); // 데이터 화면의 안내 글
      return;
    }
    openDialogIfEmpty();
  }
  await applyUrlParamsSafe(); // 못 열었으면 ?scene= 은 창의 '장면을 얹을 데이터가 없습니다' 한 줄만 (?data= 가 실패했을 때와 같다)
}

/** ?data=<아이디> → 목록을 읽은 뒤 예제의 그 줄 [열기]와 같이 연다. 목록에 없거나 못 열면 아무것도 열지 않고 '예제' 묶음에 알린 뒤 창을 띄운다 */
async function openDataParam(id: string): Promise<void> {
  let ids: string[] | null = null;
  try {
    ids = (await catalogReady).map((c) => c.id);
  } catch { /* '예제' 묶음이 '예제 목록을 읽지 못했습니다.'를 보인다 */ }
  // 목록 파일을 기다리는 사이 사용자가 다른 데이터를 열었거나 여는 중이면(창의 폴더 선택 창이 떠 있는 동안 포함 — dialog.isBusy) 주소의 ?data= (와 장면 등)는 버린다 — 누른 것이 이긴다.
  // 버리지 않으면 사용자가 연 것을 예제로 덮어쓰거나, 여는 중이라 말없이 못 열고 장면 안내만 뜬다
  if (app.dataset || dialog.isBusy()) return;
  if (!ids) {
    openDialogIfEmpty();
  } else if (!ids.includes(id)) {
    examples.notFound(id);
    openDialogIfEmpty();
  } else {
    try {
      await examples.open(id); // 해상도 선택지가 있으면 그 항목의 기본 해상도
    } catch {
      openDialogIfEmpty(); // 오류는 그 줄에 보인다
    }
  }
  await applyUrlParamsSafe();
}

const startParams = new URLSearchParams(location.search);
const jobParam = startParams.get('job');
const dataParam = startParams.get('data');
if (jobParam !== null) {
  void openJobParam(jobParam);
} else if (dataParam) {
  void openDataParam(dataParam);
} else {
  // 아무것도 열지 않는다: 3D 화면은 빈 격자, '데이터 열기' 창을 띄운다(뒤의 패널은 데이터 화면 — 창을 닫으면 보이는 화면)
  panelApi.showTab('data');
  dialog.open(null);
  void applyUrlParamsSafe();
}

// 디버깅용
(window as unknown as { app: AppCore }).app = app;

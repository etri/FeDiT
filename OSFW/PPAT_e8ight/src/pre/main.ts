// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   main.ts (전처리 페이지 진입점, pre.html)

해석기 입력을 만든다: 해석기(템플릿) 고르기 → 형상(STL)과 계산 영역 → 핵심 값 수정 → '해석 실행'(물리 시뮬레이션 페이지로 넘김) 또는 입력 JSON(+STL ZIP) 내려받기.
3D 화면·형상 편집·보기 설정은 후처리와 같은 틀(app/shell.ts, ui/panel.ts)을 쓰고, 전처리만의 구획은 pre/panel.ts에 있다.
*/
/******************************************************************************/
import { mountShell } from '../app/shell';
import { AppCore } from '../core/AppCore';
import { mountPanel } from '../ui/panel';
import { TreeNode, mountSceneTree } from '../ui/sceneTree';
import { el } from '../ui/dom';
import { PreState } from './state';
import { PRE_TABS, PreTab, mountPrePanel } from './panel';
import { IconName } from '../ui/icons';

const shell = mountShell({
  title: '연합트윈 CFD 전처리',
  markIcon: 'flask',
  fitTargets: [{ value: 'all', label: '전체에 맞춤' }, { value: 'domain', label: '계산 영역에 맞춤' }, { value: 'shapes', label: '형상에 맞춤' }],
  legend: false,
  statusBar: false,
});
const { app, viewport } = shell;
const state = new PreState(app);
// 전처리 내용은 메모리에만 있다 — 입력을 열어 둔 상태에서 '처음 화면'을 누르면 한 번 묻는다
shell.setHomeGuard(() => (state.doc ? '열어 둔 해석 설정이 사라집니다.' : null));
const pre = mountPrePanel(app, state); // 구획들은 mountPanel이 한 호스트에 함께 놓는다
const panelApi = mountPanel(app, shell.panelBody, {
  only: ['edit', 'display'],
  extra: pre.sections.map((s) => ({ id: s.id, sec: s.sec, front: true })),
  initial: 'solver',
  storageKey: 'utcfd.pre.tab',
});
panelApi.onTabChange(() => pre.refresh()); // 숨어 있던 구획은 보일 때 그린다

const TAB_ROWS: { id: PreTab; label: string; icon: IconName }[] = [
  { id: 'solver', label: '해석기', icon: 'flask' }, { id: 'domain', label: '계산 영역과 시간', icon: 'box' }, { id: 'materials', label: '재질', icon: 'droplet' },
  { id: 'boundaries', label: '바깥 경계', icon: 'layers2' }, { id: 'regions', label: '영역 (STL)', icon: 'building' }, { id: 'settings', label: '해석기 설정', icon: 'sliders' },
  { id: 'export', label: '내보내기', icon: 'export' },
];
mountSceneTree(app, shell.tree, panelApi, {
  groups: ['shapes', 'screen'],
  before: (collapsed) => {
    const list: TreeNode[] = [{ id: 'setup', label: '해석 설정', icon: 'flask', depth: 0, group: true, tab: 'solver', meta: state.sourceName ? '' : '시작 전' }];
    if (!collapsed.has('setup')) for (const t of TAB_ROWS) list.push({ id: `pre:${t.id}`, label: t.label, icon: t.icon, depth: 1, tab: t.id, meta: pre.meta(t.id) });
    return list;
  },
  tabNodes: Object.fromEntries(PRE_TABS.map((t) => [t, `pre:${t}`])),
  subscribe: (cb) => state.subscribe(cb),
});

// 도구막대 왼쪽: 문서 이름
const docName = el('span', 'dataset', '');
shell.toolbarLeft.append(docName, el('span', 'sep'));
// 내보낼 파일 이름 · 시작한 곳(템플릿 / 연 파일). 연 파일과 내보낼 이름이 같으면 한 번만
state.subscribe(() => {
  const out = `${state.fileStem}.json`;
  docName.textContent = !state.sourceName ? '해석기를 고르세요' : state.sourceName === out ? out : `${out} · ${state.sourceName}`;
});
docName.textContent = '해석기를 고르세요';

// 끌어다 놓기: .json(+.stl) → 문서 열기, .stl만 → 영역으로 더하기
viewport.addEventListener('dragover', (e) => { e.preventDefault(); viewport.classList.add('drop'); });
viewport.addEventListener('dragleave', () => viewport.classList.remove('drop'));
viewport.addEventListener('drop', async (e) => {
  e.preventDefault();
  viewport.classList.remove('drop');
  const files = Array.from(e.dataTransfer?.files ?? []);
  const json = files.find((f) => /\.json$/i.test(f.name));
  try {
    if (json) {
      const stls = new Map<string, Uint8Array>();
      for (const f of files) if (/\.stl$/i.test(f.name)) stls.set(f.name, new Uint8Array(await f.arrayBuffer()));
      await state.openJson(await json.text(), json.name, stls);
      pre.setSolverStatus('');
      panelApi.showTab('solver');
      return;
    }
    // 알림창 대신 해석기 구획의 상태 줄에 (호스트 iframe 에서는 alert 가 막힌다)
    if (!state.core) { pre.setSolverStatus('먼저 해석기를 골라 템플릿으로 시작하거나 입력 JSON을 여세요. 그 뒤에 STL을 영역으로 더할 수 있습니다.', true); panelApi.showTab('solver'); return; }
    for (const f of files) if (/\.stl$/i.test(f.name)) state.addRegionFromBytes(new Uint8Array(await f.arrayBuffer()), f.name);
    panelApi.showTab('regions');
  } catch (err) {
    pre.setSolverStatus((err as Error).message, true);
    panelApi.showTab('solver');
  }
});

// ?solver=thermal 같은 주소로 바로 시작 (시연·캡처용)
const want = new URLSearchParams(location.search).get('solver');
if (want && (['multi_component', 'multiphase', 'concentration_diffusion', 'thermal', 'fluid_dem'] as string[]).includes(want)) {
  void state.startFromTemplate(want as 'thermal').catch((e) => shell.overlay.show(`템플릿을 열지 못했습니다: ${e}`));
}

// 디버깅용
(window as unknown as { app: AppCore; pre: PreState }).app = app;
(window as unknown as { app: AppCore; pre: PreState }).pre = state;

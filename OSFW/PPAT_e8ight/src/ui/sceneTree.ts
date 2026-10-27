// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   sceneTree.ts

장면 트리 — ParaView의 파이프라인 브라우저 역할. 화면에 있는 것들을 한 목록으로 보여 주고 켜고 끈다.
  데이터셋 → Color Map(지금 쓰이는 색 지도 목록) · [노드 트리…] · 레이어 추가
  형상     → 객체들 (편집 저장소)
  보기     → 격자와 좌표축 · 범례 · 평면 위치 표시
노드는 중첩해 그린다(depth = 1 + 조상 수). 트리의 중첩이 곧 파이프라인이다(ParaView Pipeline Browser): 아래에 매단 노드는 조상 Clip·Threshold 를 이어받는다.
데이터 줄: 눈 단추 = 데이터(원본) 표현의 보이기 · meta(파일 종류 · 표현 방식). 누르면 데이터 화면을 열고 노드 고르기를 푼다.
노드 줄: 더하기 단추(그 노드 아래에 레이어 추가) · 눈 단추(그 노드 자기 표현의 보이기, 자식과 무관) · 접기 화살표(자식이 있을 때) ·
meta(Clip `X 0.05~0.12 m` · Threshold `fraction 0~0.6` · Slice 위치 · Isosurface 값 · Glyph/Streamline 개수).
이 트리가 곧 탐색이다: 줄을 누르면 아래에 그 속성 화면이 열리고, 노드 줄은 그 노드를 고른다.
레이어를 더하는 자리는 '누른 자리'가 정한다(2026-10-14 결정 — 고른 노드에 따라 붙는 곳이 달라지는 숨은 규칙을 없앰. ParaView 는 활성 소스에 붙인다):
  맨 아래 "레이어 추가" 줄 = 언제나 데이터 아래(여섯 가지 전부), 노드 줄의 더하기 단추 = 그 노드 아래(그 노드에 붙일 수 있는 것만 —
  Slice·Isosurface·Streamline·Glyph 는 볼륨 노드 아래에만 붙으므로 면·선·Glyph 노드에서는 Clip·Threshold 만 나온다).
메뉴는 '필터' 한 묶음(여섯이 모두 필터)이고 맨 위에 "○○ 아래에 추가", 항목마다 오른쪽에 결과 종류(셀 · 면 · 선 · 화살표 — layers.ts OUTPUT_LABEL)를 적는다.
*/
/******************************************************************************/
import { AppCore } from '../core/AppCore';
import { LAYER_LABEL, LAYER_TYPES, Layer, LayerType, OUTPUT_LABEL, REPRESENTATION_LABEL, isFilterType, viewOutputKind } from '../core/layers';
import { el, fmtInt, fmtNum } from './dom';
import { icon, IconName } from './icons';
import { filterSummary, type PanelApi } from './panel';

const LAYER_ICON: Record<LayerType, IconName> = { clip: 'split', threshold: 'filter', slice: 'slice', glyph: 'arrow', stream: 'wind', iso: 'cube' };
/** '레이어 추가' 메뉴 순서: 결과 종류 순 (셀 → 면 → 선 → 화살표) */
const MENU_ORDER: LayerType[] = ['clip', 'threshold', 'slice', 'iso', 'stream', 'glyph'];

export interface TreeNode {
  id: string;
  label: string;
  icon: IconName;
  depth: number;
  meta?: string;
  on?: boolean;          // 눈 단추 상태 (없으면 단추 없음)
  group?: boolean;       // 접을 수 있는 묶음
  tab?: string;          // 누르면 열 화면
  objectId?: string;     // 형상 객체 줄
  layer?: Layer;         // 후처리 레이어 줄
  add?: boolean;         // "레이어 추가" 줄
  toggle?: (on: boolean) => void;
}
type Node = TreeNode;

export type TreeGroup = 'dataset' | 'shapes' | 'screen';

export interface SceneTreeOptions {
  /** 보일 묶음 (기본: 셋 다). 전처리 페이지는 ['shapes', 'screen'] */
  groups?: TreeGroup[];
  /** 페이지가 맨 앞에 덧붙이는 줄들. collapsed에 묶음 id가 있으면 그 묶음은 접힌 상태이니 자식을 빼고 돌려준다 */
  before?: (collapsed: Set<string>) => TreeNode[];
  /** 덧붙인 줄의 화면(tab) id → 트리 줄 id (어느 줄을 강조할지) */
  tabNodes?: Record<string, string>;
  /** 덧붙인 줄에 바뀜을 알리는 구독 (예: 전처리 상태). 부르면 트리를 다시 그린다 */
  subscribe?: (cb: () => void) => void;
}

export function mountSceneTree(app: AppCore, host: HTMLElement, panel: PanelApi, opts: SceneTreeOptions = {}): void {
  const groups = new Set<TreeGroup>(opts.groups ?? ['dataset', 'shapes', 'screen']);
  const head = el('div', 'tree-head');
  head.append(icon('layers'), el('span', 'title', '장면'), icon('chevron', 'sec-chevron'));
  head.setAttribute('role', 'button');
  head.tabIndex = 0;
  head.addEventListener('click', () => host.classList.toggle('collapsed'));
  const body = el('div', 'tree-body');
  host.append(head, body);

  const collapsed = new Set<string>();
  let lastLegend: 'sm' | 'md' | 'lg' = 'sm';
  let lastSig = '';

  const layerMeta = (l: Layer): string => {
    if (app.isFilterNode(l)) return filterSummary(app, l);
    const st = app.layerStats(l.id);
    switch (l.type) {
      case 'slice': return `${'XYZ'[l.params.axis]} = ${fmtNum(l.params.position)} m`;
      case 'iso': return fmtNum(l.params.value);
      default: return st && l.visible ? `${fmtInt(st.count)}` : '';
    }
  };
  /** 노드를 중첩해 줄로 편다. 모든 노드에 눈 단추가 있고, 자식이 있으면 접을 수 있다 */
  const pushLayerRows = (list: Node[], parentId: string | null, depth: number) => {
    for (const l of app.childrenOf(parentId)) {
      const id = `layer:${l.id}`;
      const kids = app.childrenOf(l.id).length > 0;
      list.push({ id, layer: l, label: l.name, icon: LAYER_ICON[l.type], depth, on: l.visible, meta: layerMeta(l), group: kids, toggle: (v) => app.setLayerVisible(l.id, v) });
      if (kids && !collapsed.has(id)) pushLayerRows(list, l.id, depth + 1);
    }
  };

  const buildNodes = (): Node[] => {
    const ds = app.dataset;
    const entry = app.catalog.find((c) => c.id === app.currentId);
    const list: Node[] = opts.before ? opts.before(collapsed) : [];
    // 파일 종류: 결과 폴더·ZIP(목록 항목이든 사용자가 연 것이든) = VTU, 목록의 그 밖의 항목은 그 종류, 사용자가 연 그 밖의 데이터 = CSV
    const kind = app.scan || entry?.kind === 'result' ? 'VTU' : entry ? entry.kind.toUpperCase() : ds ? 'CSV' : '';
    if (groups.has('dataset')) list.push({
      id: 'dataset', label: entry ? entry.label : ds ? ds.name : '데이터 없음', icon: 'database', depth: 0, group: true, tab: 'data',
      meta: ds ? `${kind} · ${REPRESENTATION_LABEL[app.root.view.representation]}` : '',
      ...(ds ? { on: app.root.visible, toggle: (v: boolean) => app.setRootVisible(v) } : {}),
    });
    if (groups.has('dataset') && ds && !collapsed.has('dataset')) {
      list.push({ id: 'color', label: 'Color Map', icon: 'droplet', depth: 1, tab: 'color', meta: app.dataset && app.colorMapsInUse() ? `색 지도 ${app.colorMapsInUse()}개` : '' });
      pushLayerRows(list, null, 1);
      list.push({ id: 'add', label: '레이어 추가', icon: 'plus', depth: 1, add: true });
    }
    if (groups.has('shapes')) list.push({ id: 'shapes', label: '형상', icon: 'building', depth: 0, group: true, on: app.display.buildingsVisible, tab: 'edit', meta: `${app.objects.list.length}개`, toggle: (v) => app.setDisplay({ buildingsVisible: v }) });
    if (groups.has('shapes') && !collapsed.has('shapes')) {
      for (const o of app.objects.list) {
        list.push({ id: `obj:${o.id}`, objectId: o.id, label: o.name, icon: o.kind === 'box' ? 'cube' : o.kind === 'cylinder' ? 'cylinder' : 'building', depth: 1, on: o.visible, toggle: (v) => app.objects.update(o.id, { visible: v }) });
      }
    }
    if (groups.has('screen')) list.push({ id: 'screen', label: '보기', icon: 'monitor', depth: 0, group: true, tab: 'display' });
    if (groups.has('screen') && !collapsed.has('screen')) {
      list.push({ id: 'grid', label: '격자와 좌표축', icon: 'grid', depth: 1, on: app.display.gridVisible, tab: 'display', toggle: (v) => app.setDisplay({ gridVisible: v }) });
      if (groups.has('dataset')) list.push({
        id: 'legend', label: '범례', icon: 'legend', depth: 1, on: app.display.legendSize !== 'off', tab: 'display',
        toggle: (v) => {
          if (v) app.setDisplay({ legendSize: lastLegend });
          else { if (app.display.legendSize !== 'off') lastLegend = app.display.legendSize; app.setDisplay({ legendSize: 'off' }); }
        },
      });
      if (groups.has('dataset')) list.push({ id: 'frame', label: '평면 위치 표시', icon: 'slice', depth: 1, on: app.display.planeFrame, tab: 'display', toggle: (v) => app.setDisplay({ planeFrame: v }) });
    }
    return list;
  };

  /** 지금 열린 화면·고른 레이어·고른 객체에 해당하는 줄 */
  const activeIds = (): Set<string> => {
    const tab = panel.activeTab();
    if (tab === 'edit') {
      const sel = [...app.objects.selection].map((id) => `obj:${id}`);
      return new Set(sel.length ? sel : ['shapes']);
    }
    if ((LAYER_TYPES as string[]).includes(tab) && app.selectedLayerId) return new Set([`layer:${app.selectedLayerId}`]);
    const map: Record<string, string> = { data: 'dataset', color: 'color', display: 'screen', ...(opts.tabNodes ?? {}) };
    return new Set([map[tab] ?? 'dataset']);
  };

  // ---- '레이어 추가' 메뉴: 줄 아래에 고정 위치로 띄우고, 바깥 클릭·Esc·트리 스크롤에 닫는다 ----
  let menu: HTMLElement | null = null;
  let menuPid: string | null | undefined; // 메뉴가 떠 있는 자리 (null = 데이터, undefined = 닫힘)
  let menuKind = '';                      // 메뉴를 열 때 그 자리의 결과 종류 (바뀌면 메뉴의 항목이 틀리므로 닫는다)
  /** 메뉴를 여는 단추로 초점을 돌려준다 (Esc 로 닫을 때). 트리가 다시 그려졌어도 자리로 찾는다 */
  const focusTrigger = (pid: string | null) => {
    const t = pid === null ? body.querySelector<HTMLElement>('.tree-add') : body.querySelector<HTMLElement>(`.tree-row .add[data-pid="${CSS.escape(pid)}"]`);
    t?.focus();
  };
  const closeAddMenu = () => {
    if (!menu) return;
    menu.remove(); menu = null; menuPid = undefined;
    window.removeEventListener('pointerdown', onMenuDown, true);
    window.removeEventListener('keydown', onMenuKey);
    body.removeEventListener('scroll', closeAddMenu);
  };
  const onMenuDown = (e: PointerEvent) => {
    const t = e.target as globalThis.Node; // 파일 안의 Node(트리 줄 자료형)와 DOM Node 를 구분
    // 메뉴를 여는 단추(노드 줄의 더하기 · 맨 아래 '레이어 추가' 줄)를 누른 것은 그 단추의 click 이 정한다 — 트리가 다시 그려져 단추가 새 요소여도 같다
    if (menu && !menu.contains(t) && !(t instanceof Element && t.closest('.tree-row .add, .tree-add'))) closeAddMenu();
  };
  const onMenuKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeAddMenu(); };
  /** pid = 붙일 자리 (null = 데이터). 같은 자리의 단추를 다시 누르면 닫고, 다른 자리면 그쪽으로 다시 연다 */
  const toggleAddMenu = (anchor: HTMLElement, pid: string | null) => {
    if (menu) { const same = menuPid === pid; closeAddMenu(); if (same) return; }
    menu = el('div', 'tree-menu');
    menu.setAttribute('role', 'menu');
    const parentName = pid ? app.layerById(pid)?.name ?? '데이터' : '데이터';
    menu.append(el('div', 'tree-menu-note', `${parentName} 아래에 추가`));
    const item = (t: LayerType) => {
      const b = el('button', 'tree-menu-item');
      b.type = 'button';
      b.setAttribute('role', 'menuitem');
      b.append(icon(LAYER_ICON[t]), el('span', undefined, LAYER_LABEL[t]), el('span', 'menu-meta', OUTPUT_LABEL[isFilterType(t) ? app.outputKind(pid) : viewOutputKind(t)])); // Clip·Threshold 의 결과는 붙는 자리의 종류 그대로
      b.tabIndex = -1; // 메뉴 안에서는 화살표로 옮겨 다닌다
      b.addEventListener('click', (e) => {
        e.stopPropagation(); closeAddMenu();
        if (!app.canAttach(t, pid)) return; // 메뉴를 연 뒤 그 자리가 사라졌거나 바뀜
        if (pid) collapsed.delete(`layer:${pid}`); // 접어 둔 노드에 더하면 펼쳐서 새 줄이 보이게
        const l = app.addLayer(t, undefined, true, pid);
        panel.showTab(l.type);
      });
      return b;
    };
    // 그 자리에 붙일 수 있는 것만 보인다 (꺼진 항목을 두지 않는다). 결과 종류 순: 셀이 남는 Clip·Threshold → 면 → 선 → 화살표
    menu.append(el('div', 'tree-menu-group', '필터'));
    for (const t of MENU_ORDER) if (app.canAttach(t, pid)) menu.append(item(t));
    // 키보드: 위·아래 화살표·Home·End 로 옮기고 Enter·Space 로 고른다. Esc 는 닫고 여는 단추로 돌아간다, Tab 은 닫고 그대로 넘어간다.
    // 여기서 끊어 재생(Space)·형상 편집 단축키에 닿지 않게 한다
    const items = Array.from(menu.querySelectorAll<HTMLButtonElement>('.tree-menu-item'));
    menu.addEventListener('keydown', (e) => {
      const i = items.indexOf(document.activeElement as HTMLButtonElement);
      const go = (k: number) => items[(k + items.length) % items.length]?.focus();
      if (e.key === 'ArrowDown') go(i + 1);
      else if (e.key === 'ArrowUp') go(i < 0 ? items.length - 1 : i - 1);
      else if (e.key === 'Home') go(0);
      else if (e.key === 'End') go(items.length - 1);
      else if (e.key === 'Enter' || e.key === ' ') { if (i >= 0) items[i].click(); }
      else if (e.key === 'Escape') { closeAddMenu(); focusTrigger(pid); }
      else { if (e.key === 'Tab') closeAddMenu(); return; }
      e.preventDefault(); e.stopPropagation();
    });
    const rect = anchor.getBoundingClientRect();
    document.body.append(menu);
    // 줄 바로 아래에. 아래 자리가 모자라면 줄 위로
    const h = menu.offsetHeight;
    menu.style.left = `${Math.round(rect.left + 28)}px`;
    menu.style.top = `${Math.round(rect.bottom + 2 + h <= window.innerHeight - 8 ? rect.bottom + 2 : Math.max(8, rect.top - 2 - h))}px`;
    menuPid = pid;
    menuKind = app.outputKind(pid);
    items[0]?.focus({ preventScroll: true }); // 키보드로 열었으면 바로 항목을 고를 수 있게 (마우스로 열면 초점 고리는 보이지 않는다)
    window.addEventListener('pointerdown', onMenuDown, true);
    window.addEventListener('keydown', onMenuKey);
    body.addEventListener('scroll', closeAddMenu);
  };

  const render = () => {
    // 열린 메뉴의 자리가 사라졌거나(지우기·새 데이터) 결과 종류가 바뀌었으면 메뉴 글과 항목이 틀리므로 닫는다
    if (typeof menuPid === 'string' && (!app.layerById(menuPid) || app.outputKind(menuPid) !== menuKind)) closeAddMenu();
    const nodes = buildNodes();
    const active = activeIds();
    // depth·group 도 서명에 넣는다: 상위 바꾸기로 줄 순서는 그대로인데 들여쓰기·접기 화살표만 바뀌는 경우를 잡기 위해
    const sig = nodes.map((n) => `${n.id}|${n.label}|${n.meta ?? ''}|${n.on}|${n.depth}|${n.group ? 1 : 0}|${active.has(n.id) ? 1 : 0}`).join('\n') + [...collapsed].join(',');
    if (sig === lastSig) return;
    lastSig = sig;
    body.innerHTML = '';
    for (const n of nodes) {
      const r = el('div', `tree-row${n.on === false ? ' off' : ''}${active.has(n.id) ? ' active' : ''}${n.add ? ' tree-add' : ''}`);
      r.style.setProperty('--depth', String(n.depth));
      const tw = el('span', 'tw');
      if (n.group) {
        tw.append(icon('chevron', collapsed.has(n.id) ? 'rot' : ''));
        tw.addEventListener('click', (e) => { e.stopPropagation(); if (collapsed.has(n.id)) collapsed.delete(n.id); else collapsed.add(n.id); lastSig = ''; render(); });
      }
      r.append(tw, icon(n.icon), el('span', 'label', n.label));
      if (n.add) {
        // '레이어 추가' 줄을 누르면 종류 메뉴가 뜬다 (종류 단추 넷을 한 줄에 두면 좁은 패널에서 넘친다).
        // 꺾쇠 표시는 두지 않는다 — 트리에서 꺾쇠는 '펼치기'로 읽히고, 줄 앞의 + 가 이미 하는 일을 보여 준다
        r.addEventListener('click', (e) => { e.stopPropagation(); toggleAddMenu(r, null); }); // 맨 아래 줄 = 언제나 데이터 아래
        r.tabIndex = 0; // 키보드로도 연다
        r.setAttribute('role', 'button');
        r.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); toggleAddMenu(r, null); } });
        body.append(r);
        continue;
      }
      if (n.meta) r.append(el('span', 'meta', n.meta));
      if (n.layer) {
        // 이 노드 아래에 레이어 추가 — 테두리·배경 없이 + 만 (누른 줄이 곧 붙는 자리)
        const layerId = n.layer.id;
        const add = el('button', 'add');
        add.type = 'button';
        add.title = `${n.label} 아래에 레이어 추가`;
        add.setAttribute('aria-label', add.title);
        add.dataset.pid = layerId;
        add.append(icon('plus'));
        add.addEventListener('click', (e) => { e.stopPropagation(); toggleAddMenu(r, layerId); });
        r.append(add);
      }
      if (n.toggle) {
        const eye = el('button', `eye${n.on ? '' : ' off'}`);
        eye.type = 'button';
        eye.title = n.on ? '숨기기' : '보이기';
        eye.append(icon(n.on ? 'eye' : 'eye-off'));
        eye.addEventListener('click', (e) => { e.stopPropagation(); n.toggle!(!n.on); });
        r.append(eye);
      }
      r.addEventListener('click', (e) => {
        if (n.objectId) { app.objects.select([n.objectId], e.ctrlKey || e.metaKey ? 'toggle' : 'replace'); panel.showTab('edit'); }
        else if (n.layer) { app.selectLayer(n.layer.id); panel.showTab(n.layer.type); }
        else if (n.id === 'dataset') { app.selectLayer(null); panel.showTab('data'); } // 데이터를 고른다
        else if (n.tab) panel.showTab(n.tab);
      });
      body.append(r);
    }
  };

  app.subscribe(render);
  opts.subscribe?.(render);
  panel.onTabChange(render);
  render();
}

// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   shell.ts

전처리·후처리 두 페이지가 같이 쓰는 화면 틀. 창 전체가 3D 화면이고, 그 위에
왼쪽 패널 카드(머리 · 장면 트리 · 손잡이 · 속성 화면 · 상태 줄) · 도구막대(투영 · 시점 · 맞춤 대상 · PNG 캡처) · 읽기 덮개가 뜬다.
3D 화면 위에는 두 가지만 둔다: 위 가운데 = 도구막대, 맨 아래 한 줄(.vp-dock) = 재생 막대 + 범례(아래 끝을 맞춘다).
창이 좁아 한 줄에 못 들어가면 범례가 재생 막대 위로 올라간다. 상태 줄(셀 수 · 보이는 노드 요약 · 격자 · fps)은 패널 맨 아래에 있다.
페이지마다 다른 것(장면 트리의 묶음, 속성 화면의 구획, 도구막대 왼쪽 칸, 끌어다 놓기)은 돌려준 자리에 각 페이지가 채운다.
*/
/******************************************************************************/
import '../styles.css';
import { AppCore, FitTarget } from '../core/AppCore';
import { mountLegend } from '../ui/legend';
import { mountStatusBar } from '../ui/panel';
import { mountScaleBar } from '../ui/scaleBar';
import { mountTimeBar } from '../ui/timeBar';
import { Segmented, button, el, homeLink, segmented, select } from '../ui/dom';
import { IconName, icon } from '../ui/icons';

export type ViewDirection = 'iso' | 'top' | 'front' | 'side';

export interface ShellOptions {
  title: string;
  badge?: string;
  markIcon?: IconName;
  fitTargets: { value: FitTarget; label: string }[];
  /** 범례(색 막대)와 상태 칩 줄. 후처리에서만 뜻이 있다 */
  legend?: boolean;
  statusBar?: boolean;
  /** 3D 화면 아래 재생 막대 (저장 시점이 여러 개일 때만 보인다). 후처리에서만 뜻이 있다 */
  timeBar?: boolean;
}

export interface Shell {
  app: AppCore;
  root: HTMLElement;
  viewport: HTMLElement;
  panel: HTMLElement;
  tree: HTMLElement;
  panelBody: HTMLElement;
  toolbar: HTMLElement;
  /** 도구막대 맨 왼쪽 칸 (페이지가 데이터 이름 등을 넣는다) */
  toolbarLeft: HTMLElement;
  views: Segmented<ViewDirection>;
  fitTarget: HTMLSelectElement;
  projection: Segmented<'perspective' | 'orthographic'>;
  overlay: { show(msg: string): void; hide(): void };
  /** 지금 고른 맞춤 대상으로 화면 맞춤 */
  fit(direction?: ViewDirection): void;
  /** '처음 화면' 링크를 누를 때 떠나면 잃는 것이 있으면 그 안내 글을 돌려주는 함수(없으면 null → 바로 옮김) */
  setHomeGuard(guard: () => string | null): void;
}

export function mountShell(opts: ShellOptions): Shell {
  const root = document.getElementById('app')!;
  const viewport = el('div', 'viewport');
  const panel = el('aside', 'panel');
  const panelHead = el('div', 'panel-head');
  const mark = el('span', 'mark');
  mark.append(icon(opts.markIcon ?? 'wind'));
  panelHead.append(mark, el('span', 'title', opts.title));
  if (opts.badge) panelHead.append(el('span', 'badge dev', opts.badge));
  // 페이지 사이는 '처음 화면'(index) 단추 하나로만 오간다(2026-10-22 결정: FeDiT 에는 탭 하나·주소 하나로 붙이고 우리 화면 안에서 고른다).
  // 전처리·후처리를 바로 잇는 단추는 두지 않는다 — 페이지를 옮기면 작업이 사라지고, 작업 보관·세션 관리까지는 하지 않는다(2026-10-14)
  let homeGuard: (() => string | null) | null = null;
  panelHead.append(homeLink(() => homeGuard?.() ?? null));
  const tree = el('div', 'scene-tree');
  const splitter = el('div', 'splitter');
  splitter.title = '드래그하여 높이 조절';
  const panelBody = el('div', 'panel-body');
  panel.append(panelHead, tree, splitter, panelBody);
  root.append(viewport, panel);

  const app = new AppCore(viewport);
  viewport.append(el('div', 'vignette'));

  // 트리와 속성 화면 사이의 손잡이: 끌어서 높이를 바꾸고 기억한다
  {
    let saved = 260;
    try { saved = Number(localStorage.getItem('utcfd.treeH')) || 260; } catch { /* 비공개 창 등 */ }
    tree.style.setProperty('--tree-h', `${saved}px`);
    splitter.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const startY = e.clientY, startH = tree.getBoundingClientRect().height;
      const move = (ev: PointerEvent) => {
        const h = Math.max(80, Math.min(panel.clientHeight - 220, startH + ev.clientY - startY));
        tree.style.setProperty('--tree-h', `${h}px`);
      };
      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        try { localStorage.setItem('utcfd.treeH', String(Math.round(tree.getBoundingClientRect().height))); } catch { /* 무시 */ }
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    });
  }
  // 맨 아래 한 줄: 재생 막대(왼쪽, 남는 폭을 채움) + 범례(오른쪽). 배치는 styles.css 의 .vp-dock (flex) 가 한다
  const dock = el('div', 'vp-dock');
  viewport.append(dock);
  if (opts.timeBar !== false) mountTimeBar(app, dock);
  if (opts.legend !== false) mountLegend(app, dock);
  if (opts.statusBar !== false) mountStatusBar(app, panel); // 패널 맨 아래 상태 줄
  mountScaleBar(app, viewport);

  // 패널이 덮는 너비만큼 장면 중심을 오른쪽으로 민다
  const syncInset = () => app.setViewInset(panel.getBoundingClientRect().right + 16);
  new ResizeObserver(syncInset).observe(panel);
  syncInset();

  // ---- 도구막대 ----
  const toolbar = el('div', 'vp-toolbar');
  const toolbarLeft = el('span', 'toolbar-left');
  const fitTarget = select<FitTarget>(opts.fitTargets, opts.fitTargets[0].value, () => {});
  const fit = (direction: ViewDirection = views.value) => app.fitView(direction, fitTarget.value as FitTarget);
  const views = segmented<ViewDirection>([
    { value: 'iso', label: '등각', icon: 'cube' },
    { value: 'top', label: '평면', icon: 'view-top' },
    { value: 'front', label: '정면', icon: 'view-front' },
    { value: 'side', label: '측면', icon: 'view-side' },
  ], 'iso', (v) => fit(v), true);
  // 투영: 원근(눈으로 보는 것처럼 멀수록 작게) / 직교(거리와 무관하게 같은 크기 — 도면·비교용, 축척 막대가 함께 나온다)
  const projection = segmented<'perspective' | 'orthographic'>([
    { value: 'perspective', label: '원근' }, { value: 'orthographic', label: '직교' },
  ], 'perspective', (v) => app.setDisplay({ projection: v }));
  projection.root.title = '직교: 거리와 무관하게 같은 크기로 보여 위치·크기 비교에 적합합니다';
  const captureBtn = button('PNG 캡처', async () => {
    captureBtn.disabled = true;
    const label = captureBtn.querySelector('span')!;
    label.textContent = '캡처 중…';
    try { captureBtn.title = `저장한 파일: ${await app.saveCapture()}`; label.textContent = '저장됨'; }
    catch (e) { label.textContent = (e as Error).message; }
    setTimeout(() => { label.textContent = 'PNG 캡처'; captureBtn.disabled = false; }, 1800);
  }, 'primary', 'camera');
  toolbar.append(toolbarLeft, projection.root, views.root, fitTarget, el('span', 'sep'), captureBtn);
  viewport.append(toolbar);

  // ---- 읽기 덮개 ----
  const overlayEl = el('div', 'loading-overlay');
  const overlayMsg = el('span', 'msg', '');
  const loadingCard = el('div', 'loading-card');
  loadingCard.append(el('span', 'spinner'), overlayMsg);
  overlayEl.append(loadingCard);
  overlayEl.hidden = true;
  viewport.append(overlayEl);
  const overlay = {
    show(msg: string) { overlayEl.hidden = false; overlayMsg.textContent = msg; },
    hide() { overlayEl.hidden = true; },
  };

  app.subscribe(() => {
    if (app.loading) overlay.show(app.loading); else overlay.hide();
    projection.value = app.display.projection;
  });

  return { app, root, viewport, panel, tree, panelBody, toolbar, toolbarLeft, views, fitTarget, projection, overlay, fit, setHomeGuard: (g) => { homeGuard = g; } };
}

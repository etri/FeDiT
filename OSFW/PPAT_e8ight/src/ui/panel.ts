// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   panel.ts

왼쪽 제어 패널의 속성 화면. 장면 트리(sceneTree.ts)에서 줄을 고르면 그 화면(탭) 하나만 보인다:
데이터 · 형상 편집 · Color Map · 보기 설정, 그리고 고른 노드의 속성 — Clip·Threshold 노드(Clip · Threshold)와 Slice·Isosurface·Streamline·Glyph 노드(Slice · Glyph · Streamline · Isosurface).
노드 화면은 AppCore.selectedLayer()의 매개변수를 읽고 updateLayer로 쓴다. 화면 순서는 ParaView Properties / Display 구분을 따른다:
layerHead → 공통 두 줄(parentBlock: '상위' select → setParent · '적용 중인 Clip·Threshold' = 조상 Clip·Threshold 요약) → 속성 → 표시 → Color Map(그 색 지도 편집).
데이터·색 낱말(2026-10-14 결정): 'Field' = 그 노드가 보여 줄 데이터(배열)로, 노드 화면 맨 위에 둔다. Slice 는 Field 가 곧 칠할 배열이다.
Glyph·Streamline·Isosurface 는 Field(방향·적분·등값을 정하는 배열)와 따로 '표시' 묶음에 '색'(단색 | 배열) 칸을 두고, 데이터·Clip·Threshold 는 '표시'의 표현 방식 아래에 '색'.
Color Map = 값을 색으로 바꾸는 규칙(배열마다 하나를 공유), Preset = 미리 만들어 둔 색 배합(Cool-Warm 등). ('Field'·'색' 칸은 ParaView Display 의 Coloring 에 해당)
설명 글(그 기능이 무엇이고 어떻게 쓰는지)은 화면에 줄 글로 두지 않고 물음표에 넣는다: 화면 설명은 제목 옆(section.setHelp), 칸 설명은 그 칸 이름 옆(withHelp).
화면에 남기는 한 줄(.hint)은 지금 상태·결과·오류뿐이다. 화면 글에 'ParaView 는 …' 같은 근거·비교는 적지 않는다(그것은 주석·README 의 몫).
데이터·Clip·Threshold(볼륨 노드)의 '표시'는 표현 방식(Surface | Outline | Points | Volume | 없음)이다(viewBlock → setNodeView). 구획 스위치 = 그 노드의 보이기.
Clip·Threshold 는 어느 노드 아래에도 붙고(트리의 중첩이 곧 파이프라인; UI 에서는 "상위"), Slice·Isosurface·Streamline·Glyph 노드는 볼륨 노드 아래에만 붙는다.
용어는 영문 원어(Clip, Slice, Isosurface, Threshold, Glyph, Streamline, Surface, Outline, Points, Volume, Color Map, Preset, Opacity, Field, Range, Scale Factor, Scalar Opacity Unit Distance), 일반 낱말은 한글.
*/
/******************************************************************************/
import { AppCore, ColorTarget, DatasetEntry, ROOT_ID } from '../core/AppCore';
import { DirectoryHandleFolder, FileListFolder } from '../data/source';
import { openZipFile } from './openZip';
import { folderPickerBlocked } from '../data/zipInput';
import {
  Axis, CLIP_TYPE_LABEL, ChainItem, ClipParams, ClipType, ColorMap, DataView, FilterLayer, GlyphMode, LAYER_LABEL, LAYER_TYPES, Layer, LayerPatch, RANGE_MODE_LABEL, REPRESENTATION_LABEL,
  Representation, StreamShape, THRESHOLD_METHOD_LABEL, ThresholdMethod, ThresholdParams,
} from '../core/layers';
import { VectorMapping } from '../data/pointDataset';
import { COLORMAPS, ColormapId, DEFAULT_OPACITY_CURVE, colormapCss, copyOpacityCurve, isDefaultOpacityCurve } from '../utils/colormap';
import { button, callout, checkbox, el, fmtInt, fmtNum, fmtRangeValue, numberInput, row, Section, section, segmented, select, setOptions, slider, withHelp } from './dom';
import { CellSet, HistogramCells, opacityEditor } from './opacityEditor';
import { EditMode } from '../edit/editor';

type AxisKey = '0' | '1' | '2';
const AXIS_OPTS: { value: AxisKey; label: string }[] = [{ value: '0', label: 'X' }, { value: '1', label: 'Y' }, { value: '2', label: 'Z' }];
const MAPPING_OPTS: { value: VectorMapping; label: string }[] = [
  { value: 'magnitude', label: '크기' }, { value: 'x', label: 'X 성분' }, { value: 'y', label: 'Y 성분' }, { value: 'z', label: 'Z 성분' },
];
const COLORMAP_OPTS = COLORMAPS.map((c) => ({ value: c.id, label: c.label }));
const pct = (v: number) => `${Math.round(v * 100)}%`;

/** 브라우저 다운로드로 파일을 내려준다 */
function download(blob: Blob, name: string): void {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

/** Threshold 의 Field 이름 (벡터면 성분까지). Field 가 데이터에 없으면 '-' */
function thresholdFieldName(app: AppCore, fieldKey: string | null, mapping: VectorMapping): string {
  const f = app.fieldByKey(fieldKey);
  if (!f) return '-';
  return f.kind === 'vector' ? `${f.name} ${MAPPING_OPTS.find((o) => o.value === mapping)?.label ?? ''}` : f.name;
}

/**
 * Clip·Threshold 노드 한 줄 요약 — 트리 meta·'적용 중인 Clip·Threshold'·구획 요약이 함께 쓴다. 남는 쪽을 적는다:
 * Clip Plane `Plane X ≤ 0.1 m` · Box `Box 안 X 0.05~0.12 m`(데이터 범위보다 좁힌 축만) · Scalar `fraction ≤ 0.5` ·
 * Threshold `fraction 0~0.6` / `fraction ≤ 0.2` / `fraction ≥ 0.6` (+ ` (Invert)`). 자릿수는 그 축의 데이터 범위 폭·그 Field 값 범위 폭에 맞춤
 */
export function filterSummary(app: AppCore, f: ChainItem | FilterLayer): string {
  const item: ChainItem = 'kind' in f ? f : f.type === 'clip' ? { kind: 'clip', params: f.params } : { kind: 'threshold', params: f.params };
  const b = app.dataset?.bounds;
  const span = (a: number) => (b ? b.max[a] - b.min[a] : 1);
  if (item.kind === 'clip') {
    const c = item.params;
    if (c.clipType === 'plane') return `Plane ${'XYZ'[c.axis]} ${c.invert ? '≤' : '≥'} ${fmtRangeValue(c.position, span(c.axis))} m`;
    if (c.clipType === 'box') {
      const tight = [0, 1, 2].filter((a) => !b || c.boxMin[a] > b.min[a] + span(a) * 1e-6 || c.boxMax[a] < b.max[a] - span(a) * 1e-6);
      const parts = tight.map((a) => `${'XYZ'[a]} ${fmtRangeValue(c.boxMin[a], span(a))}~${fmtRangeValue(c.boxMax[a], span(a))}`);
      return `Box ${c.invert ? '안' : '밖'}${parts.length ? ` ${parts.join(' · ')} m` : ''}`;
    }
    if (!app.fieldByKey(c.fieldKey)) return 'Field 없음';
    const st = app.statsFor(c.fieldKey, c.mapping);
    return `${thresholdFieldName(app, c.fieldKey, c.mapping)} ${c.invert ? '≤' : '≥'} ${fmtRangeValue(c.value, st.max - st.min)}`;
  }
  const t = item.params;
  if (!app.fieldByKey(t.fieldKey)) return 'Field 없음'; // 트리 meta·상위 선택지·구획 요약이 같은 글을 쓴다
  const st = app.statsFor(t.fieldKey, t.mapping);
  const vs = Number.isFinite(st.max - st.min) && st.max > st.min ? st.max - st.min : t.upper - t.lower;
  const lo = fmtRangeValue(t.lower, vs), hi = fmtRangeValue(t.upper, vs);
  const rule = t.method === 'between' ? `${lo}~${hi}` : t.method === 'below' ? `≤ ${lo}` : `≥ ${hi}`;
  return `${thresholdFieldName(app, t.fieldKey, t.mapping)} ${rule}${t.invert ? ' (Invert)' : ''}`;
}

/** 장면 트리 등 바깥에서 탭을 열고 현재 탭을 묻는 데 쓴다 */
export interface PanelApi {
  showTab(id: string): void;
  activeTab(): string;
  onTabChange(cb: (id: string) => void): void;
}

export interface PanelOptions {
  /** 보일 구획만 고른다 (기본: 전부). 예: 전처리 페이지는 ['edit', 'display'] */
  only?: string[];
  /** 페이지가 덧붙이는 구획 (같은 탭 전환을 쓴다). 데이터 구획 자리(맨 앞)에 놓으려면 front: true */
  extra?: { id: string; sec: Section; front?: boolean }[];
  /** 처음 열 화면 (주소의 ?tab=, 지난번 화면보다 뒤) */
  initial?: string;
  /** 지난번 화면을 기억할 localStorage 키 (페이지마다 다르게) */
  storageKey?: string;
}

export function mountPanel(app: AppCore, host: HTMLElement, opts: PanelOptions = {}): PanelApi {
  host.innerHTML = '';
  const isFocused = (e: Element) => document.activeElement === e;
  /** 고른 레이어의 매개변수를 바꾼다 (레이어 화면의 모든 조작 요소가 쓴다) */
  const upd = (patch: LayerPatch) => { const l = app.selectedLayer(); if (l) app.updateLayer(l.id, patch); };
  /** 노드 id → 화면 이름 (데이터 = ROOT_ID) */
  const nodeName = (id: string): string => (id === ROOT_ID ? '데이터' : app.layerById(id)?.name ?? id);

  // ---------- 색 지도 편집 (ParaView Color Map Editor 의 Preset · 불투명도 편집기 · Rescale · 자동 범위) ----------
  /**
   * 색 지도 하나를 고친다. 대상은 노드가 쓰는 지도({nodeId} — 공유 또는 Separate) 또는 배열의 공유 지도({fieldKey}). 노드 화면의 Color Map 묶음(scope 'node')과
   * Color Map 화면(scope 'page')이 함께 쓴다.
   * Component(벡터일 때) · Preset(색 배합) · Opacity 곡선 편집기 · Range 숫자 칸 · Rescale 네 단추(데이터 범위 / 사용자 지정 / 전 시점 범위 / 보이는 범위) · 자동 넓히기.
   * Opacity 곡선이 보이는 규칙(누른 자리가 결과 자리): 노드 화면은 그 노드 자신이 실제로 Volume 으로 그릴 때만(같은 지도를 쓰는 다른 노드가 Volume 이어도
   * Slice 화면 등에는 없다 — 거기서 고치면 그 화면의 노드는 그대로이고 다른 노드의 안개만 바뀌므로), Color Map 화면은 그 지도로 칠하는 노드 가운데 실제로
   * Volume 으로 그리는 것이 있을 때(그 노드들을 'Opacity 곡선을 쓰는 노드' 한 줄로 적는다).
   * Range 를 직접 넣으면 '사용자 지정'이 되고 자동 넓히기가 꺼진다(ParaView 사용자 지정 범위와 같음). 공유 지도면 같은 배열로 칠하는 노드가 모두 함께 바뀐다.
   */
  const mapEditor = (target: () => ColorTarget | null, scope: 'node' | 'page') => {
    const root = el('div', 'blk');
    const put = (patch: Partial<ColorMap>) => { const t = target(); if (t) app.updateColorMap(t, patch); };
    const mapping = select<VectorMapping>(MAPPING_OPTS, 'magnitude', (v) => put({ mapping: v }));
    const mappingRow = row('Component', mapping);
    const cm = select<ColormapId>(COLORMAP_OPTS, 'coolwarm', (v) => put({ colormap: v }));
    const min = numberInput(0, (v) => put({ rangeMin: v }), { exact: true });
    const max = numberInput(1, (v) => put({ rangeMax: v }), { exact: true });
    const pair = el('div', 'pair'); pair.append(min, el('span', 'pair-sep', '~'), max);
    const note = el('div', 'hint');
    const rescale = (mode: 'data' | 'visible' | 'alltime') => async () => {
      const t = target(); if (!t) return;
      note.textContent = await app.rescaleColorMap(t, mode);
    };
    const btns = el('div', 'btn-row');
    const allBtn = button('전 시점 범위', rescale('alltime'));
    btns.append(
      button('데이터 범위', rescale('data'), 'primary'),
      button('사용자 지정', () => { min.focus(); min.select(); }),
      allBtn,
      button('보이는 범위', rescale('visible')),
    );
    const grow = checkbox('자동으로 넓히기', true, (v) => put({ autoGrow: v }));
    withHelp(grow.root, ['노드를 만들거나 바꿀 때 그 노드가 그린 값이 범위 밖이면 범위를 넓힙니다. 줄이지는 않습니다.', '저장 시점을 넘길 때는 범위를 그대로 둡니다. Range 에 숫자를 직접 넣으면 꺼집니다.']);
    const state = el('div', 'hint');
    const rescaleTitle = withHelp(el('div', 'sub', 'Rescale'), [
      '범위를 한 번 다시 잡습니다.',
      '데이터 범위: 노드 화면과 Color Map 화면의 Separate 줄에서는 그 노드가 그린 값의 최소~최대, Color Map 화면의 그 밖의 줄에서는 지금 시점 데이터 전체의 최소~최대.',
      '사용자 지정: Range 칸에 숫자를 직접 넣습니다.',
      '전 시점 범위: 지금까지 읽어 둔 저장 시점들의 최소~최대. 아직 넘겨 보지 않은 시점은 빠집니다. 저장 시점이 둘 이상일 때만 단추가 보입니다.',
      '보이는 범위: 이 색 지도로 칠하는 보이는 노드들이 그린 값의 최소~최대.',
    ]);
    const rangeRow = withHelp(row('Range', pair), [
      "'범위: 아직 정하지 않음'일 때 칸의 숫자는 임시 값입니다. 이 색 지도로 칠하는 노드가 처음 그려질 때 그 노드의 값 범위로 정해집니다.",
      "숨긴 노드는 다시 보이게 할 때 그려집니다. Rescale 의 '데이터 범위'를 누르면 바로 정해집니다.",
    ]);
    // Opacity 곡선 (Volume 만 쓴다, ParaView 불투명도 전달함수 편집기): 이름 줄(상태 '직선 증가 (기본)' / '점 n개' + 기본이 아니면 '기본값' — Unit Distance 와 같은 자리)
    // 아래에 편집기(opacityEditor.ts — 히스토그램 위 제어점 꺾은선, 고른 점 숫자 칸, 시작 곡선). 보이는 규칙은 위 머리말(scope). '실제로 Volume 으로 그린다' =
    // AppCore.drawsVolume (격자가 없어 점으로 대신 그리면 곡선이 쓰이지 않으므로 Unit Distance 줄처럼 숨는다).
    // 곡선은 늘 새 배열로 넣고(updateColorMap 의 opacity 만 바꾸면 Volume 노드만 다시 칠함), 대상은 이 편집기의 target(노드 화면 {nodeId}, Color Map 화면 그 줄의 지도)
    const curveState = el('span', 'row-value');
    const curveReset = el('button', 'btn btn-normal btn-mini', '기본값');
    curveReset.type = 'button';
    curveReset.addEventListener('click', () => put({ opacity: copyOpacityCurve(DEFAULT_OPACITY_CURVE) }));
    const curveHead = el('div', 'field-head');
    curveHead.append(el('label', 'field-label', 'Opacity 곡선'), curveState, curveReset);
    const curveUsers = el('div', 'hint'); // Color Map 화면만: 이 곡선을 쓰는(Volume 으로 그리는) 노드
    const curveRow = el('div', 'field');
    curveRow.append(curveHead, curveUsers);
    withHelp(curveRow, [
      'Volume 에서 값마다 얼마나 불투명할지 정하는 꺾은선입니다. 가로는 Color Map 범위(최소 ~ 최대), 세로는 Opacity(0 ~ 1)입니다. 곡선 아래는 그 값의 색으로 칠해집니다.',
      '빈 곳을 누르면 그 자리에 점이 생기고, 그대로 끌거나 점을 끌면 옮겨집니다. 안쪽 점은 이웃 점을 넘지 못하고, 양 끝 점은 위아래로만 움직이며 지울 수 없습니다.',
      "누른 점이 '고른 점'이 되어 아래 칸에서 값과 Opacity 를 숫자로 고칩니다. Delete·Backspace 또는 '점 삭제'로 지웁니다. 화살표 키로 조금씩(Shift 와 함께 크게) 옮기고, Tab 으로 다음 점, Home·End 로 첫·끝 점, Esc 로 고르기를 풉니다.",
      '터치 화면에서는 빈 곳을 짧게 누르면 점이 생깁니다. 그림 위를 쓸어도 점이 생기지 않고 패널도 스크롤되지 않습니다.',
      scope === 'node'
        ? '회색 막대(히스토그램)는 이 노드가 Volume 으로 그리는 셀의 값이 범위의 각 칸에 몇 개 있는지 보여 줍니다. Clip·Threshold 는 남은 셀만 셉니다. 숨긴 노드는 세지 않습니다.'
        : '회색 막대(히스토그램)는 이 Color Map 으로 Volume 을 그리는 보이는 노드들의 셀을 더해 셉니다. 두 노드가 같은 셀을 그리면 두 번 셉니다. Volume 으로 그리지 않는 노드(Slice, Surface 로 그리는 Clip 등)는 세지 않습니다.',
      "칠할 값이 비어 있는 셀은 세지 않으므로, 센 수가 '표시'의 셀 수보다 적을 수 있습니다.",
      "범위 밖 값은 양 끝 칸에 넣습니다. '로그 높이'를 켜면 적은 칸도 보입니다.",
      "시작 곡선을 고르면 지금 곡선을 그 모양으로 바꿉니다. '기본값'은 '직선 증가 (기본)'(범위 최소에서 투명, 최대에서 Opacity 1)로 되돌립니다.",
    ]);
    const curveEditor = opacityEditor((c) => put({ opacity: c }));
    curveRow.append(curveEditor.root);
    /** 노드 하나의 히스토그램 이름 (상태 줄 '히스토그램: 데이터의 셀 45,889개' · 'Clip 1 의 남은 셀 17,784개') */
    const cellsName = (id: string) => (id === ROOT_ID ? '데이터의 셀' : `${nodeName(id)} 의 남은 셀`);
    /**
     * 히스토그램 대상 (편집기가 보이고 셀 때만 부른다 — 매초 불려도 싸게: 노드 목록과 AppCore 가 들고 있는 그린 셀만 본다).
     * 노드 화면 = 그 노드가 Volume 으로 그리는 셀, Color Map 화면 = 그 지도로 Volume 을 그리는 보이는 노드들의 셀을 모두(ParaView: 이 지도로 칠하는 보이는 표현들의 입력을 모아 셈).
     * 둘 이상이면 이름 대신 수만 적는다('노드 2개의 셀을 더해 N개') — 이름은 바로 위 'Opacity 곡선을 쓰는 노드' 줄에 있다(숨김 표시 없는 것이 센 노드)
     */
    const histogramCells = (ids: string[]): HistogramCells => {
      const what = ids.length > 1 ? `노드 ${ids.length}개의 셀을 더해` : ids.length ? cellsName(ids[0]) : '셀';
      const sets: CellSet[] = [];
      for (const id of ids) {
        const s = app.volumeCellsOf(id);
        if (!s) return { what, sets: [], empty: '히스토그램: 아직 계산 전입니다.' };
        sets.push(...s);
      }
      return { what, sets, empty: '히스토그램: 칠할 배열이 지금 시점 데이터에 없습니다.' };
    };
    root.append(mappingRow, row('Preset', cm), curveRow, rangeRow, rescaleTitle, btns, grow.root, state, note);
    let lastTarget = '';
    return {
      root,
      sync() {
        const t = target();
        const m = t ? app.colorMapFor(t) : null;
        root.hidden = !m;
        if (!t || !m) return;
        const key = JSON.stringify(t);
        if (key !== lastTarget) { lastTarget = key; note.textContent = ''; } // 대상이 바뀌면 지난 안내는 지운다
        const fk = 'nodeId' in t ? app.coloringOf(t.nodeId)?.fieldKey ?? null : t.fieldKey;
        const f = app.fieldByKey(fk);
        mappingRow.hidden = !f || f.kind !== 'vector';
        mapping.value = m.mapping;
        cm.value = m.colormap;
        // 곡선을 쓰는 노드: 노드 화면은 그 노드 자신(Volume 일 때만), Color Map 화면은 그 지도로 Volume 을 그리는 노드 전부
        const volumeUsers = scope === 'node'
          ? ('nodeId' in t && app.drawsVolume(t.nodeId) ? [t.nodeId] : [])
          : app.colorMapUsers(t).filter((id) => app.drawsVolume(id));
        curveRow.hidden = volumeUsers.length === 0;
        const defaultCurve = isDefaultOpacityCurve(m.opacity);
        curveState.textContent = defaultCurve ? '직선 증가 (기본)' : `점 ${m.opacity.length}개`; // 시작 곡선 목록의 첫째와 같은 이름
        curveReset.hidden = defaultCurve;
        curveUsers.hidden = scope === 'node';
        if (scope === 'page') curveUsers.textContent = `Opacity 곡선을 쓰는 노드: ${volumeUsers.map((id) => `${nodeName(id)}${app.nodeVisible(id) ? '' : ' (숨김)'}`).join(', ')}`;
        // 편집기는 이 줄이 보일 때만 맞추고, 편집기도 자기 그림이 숨어 있으면(다른 화면) 맞추기·히스토그램 세기를 보일 때로 미룬다.
        // 히스토그램 = 곡선을 쓰는 노드 가운데 보이는 것이 Volume 으로 그리는 셀(histogramCells) — 셀 때만 묻도록 함수로 넘긴다.
        // key = 고치는 지도: 노드 화면의 대상 {nodeId} 는 그대로여도 '색' 배열·Separate 를 바꾸면 다른 지도라 지도 key(colorMapKeyOf)를 붙인다
        if (!curveRow.hidden) {
          curveEditor.sync({
            key: 'nodeId' in t ? `${key}|${app.colorMapKeyOf(t.nodeId) ?? ''}` : key,
            curve: m.opacity, colormap: m.colormap, rangeMin: m.rangeMin, rangeMax: m.rangeMax, rangeReady: !m.fresh,
            unit: app.unitFor(fk),
            cells: () => {
              const shown = volumeUsers.filter((id) => app.nodeVisible(id));
              if (shown.length) return histogramCells(shown);
              return { what: '셀', sets: [], empty: scope === 'node' ? '히스토그램: 이 노드를 숨겨 세지 않았습니다.' : '히스토그램: Volume 으로 그리는 노드가 모두 숨겨져 세지 않았습니다.' };
            },
          });
        }
        const span = m.rangeMax - m.rangeMin;
        if (!isFocused(min)) min.value = fmtRangeValue(m.rangeMin, span);
        if (!isFocused(max)) max.value = fmtRangeValue(m.rangeMax, span);
        grow.input.checked = m.autoGrow;
        allBtn.hidden = app.stepCount() < 2;
        const unit = app.unitFor(fk);
        state.textContent = m.fresh ? '범위: 아직 정하지 않음' : `범위 기준: ${RANGE_MODE_LABEL[m.rangeMode]}${unit ? ` · 단위 ${unit}` : ''}`;
      },
    };
  };

  // ---------- 노드 색칠 (ParaView Display 의 Coloring + 그 색 지도) ----------
  /**
   * 노드 하나의 색칠을 두 조각으로 만든다 (노드 화면의 서로 다른 자리에 놓는다). target = 노드 id (데이터 = ROOT_ID).
   * - top 한 줄 = 무엇으로 칠할지. 단색 선택지와 배열 목록을 한 칸에 둔다(ParaView 배열 칸의 'Solid Color' 처럼). 칸 이름은 Slice 만 'Field'
   *   (화면 맨 위 — 보여 줄 데이터가 곧 칠할 배열), 나머지는 '색'('표시' 묶음 안; 볼륨 노드는 '표현 방식' 바로 아래). Streamline·Isosurface 는 단색을 고르면 색 고르는 칸이 그 아래에 뜬다.
   * - map 'Color Map' 묶음 = 그 배열의 색 지도 편집: Separate Color Map · 함께 쓰는 노드 안내 · mapEditor. 값으로 칠하지 않으면(단색·Outline·없음) 숨는다.
   * kind 는 단색 선택지와 단색을 켜는 방법을 정한다: volume(데이터·볼륨 위 Clip·Threshold — 색칠의 배열을 비움) · slice(단색 없음) ·
   * glyph(흰색·검정 — params.color) · stream(params.color = 'solid') · iso(params.colorMode = 'solid'). 단색 선택지의 값은 'solid:…', 배열은 그 key.
   */
  type ColoringKind = 'volume' | 'slice' | 'glyph' | 'stream' | 'iso';
  const SOLID_OPTS: Record<ColoringKind, { value: string; label: string }[]> = {
    volume: [{ value: 'solid:', label: '단색' }],
    slice: [],
    glyph: [{ value: 'solid:white', label: '단색 (흰색)' }, { value: 'solid:black', label: '단색 (검정)' }],
    stream: [{ value: 'solid:', label: '단색' }],
    iso: [{ value: 'solid:', label: '단색' }],
  };
  const coloring = (target: () => string | null, kind: ColoringKind) => {
    const pick = (v: string) => {
      const id = target(); if (!id) return;
      const solid = v.startsWith('solid:');
      if (kind === 'volume' || kind === 'slice') { app.setNodeColoring(id, { fieldKey: solid ? null : v }); return; }
      // Glyph·Streamline·Isosurface: 단색/배열 전환은 노드 매개변수가, 칠할 배열은 색칠이 맡는다
      if (kind === 'glyph') app.updateLayer(id, { color: solid ? (v.slice(6) as 'white' | 'black') : 'field' });
      else if (kind === 'stream') app.updateLayer(id, { color: solid ? 'solid' : 'field' });
      else app.updateLayer(id, { colorMode: solid ? 'solid' : 'field' });
      if (!solid) app.setNodeColoring(id, { fieldKey: v });
    };
    const field = select<string>([], null, pick);
    const solidIn = el('input'); solidIn.type = 'color'; solidIn.className = 'color';
    solidIn.addEventListener('input', () => { const id = target(); if (id) app.updateLayer(id, { solidColor: solidIn.value }); });
    const solidRow = row('단색', solidIn);
    const note = el('div', 'hint');
    const top = el('div', 'blk');
    top.append(row(kind === 'slice' ? 'Field' : '색', field), solidRow, note);

    const separate = checkbox('Separate Color Map', false, (v) => { const id = target(); if (id) app.setNodeColoring(id, { separate: v }); });
    withHelp(separate.root, ['같은 배열로 칠하는 노드는 색 지도(값을 색으로 바꾸는 규칙) 하나를 함께 씁니다.', '켜면 이 노드만 따로 된 색 지도를 써서, 여기서 바꿔도 다른 노드의 색은 그대로입니다.']);
    const editor = mapEditor(() => { const id = target(); return id ? { nodeId: id } : null; }, 'node');
    const share = el('div', 'hint');
    const map = el('div', 'blk');
    map.append(el('div', 'sub', 'Color Map'), separate.root, share, editor.root);
    return {
      top, map,
      setFieldOptions(opts: { value: string; label: string }[]) { setOptions(field, [...SOLID_OPTS[kind], ...opts], null); },
      sync() {
        const id = target();
        const c = id ? app.coloringOf(id) : null;
        top.hidden = !c;
        if (!id || !c) { map.hidden = true; return; }
        const l = app.layerById(id);
        // 단색이면 그 선택지의 값, 배열로 칠하면 null
        let solid: string | null = null;
        if (kind === 'volume') solid = c.fieldKey ? null : 'solid:';
        else if (l?.type === 'glyph') solid = l.params.color === 'field' ? null : `solid:${l.params.color}`;
        else if (l?.type === 'stream') solid = l.params.color === 'field' ? null : 'solid:';
        else if (l?.type === 'iso') solid = l.params.colorMode === 'field' ? null : 'solid:';
        const want = solid ?? c.fieldKey ?? '';
        if (!isFocused(field) && field.value !== want) field.value = want;
        const picker = solid !== null && (l?.type === 'stream' || l?.type === 'iso') ? l.params.solidColor : null;
        solidRow.hidden = picker === null;
        if (picker !== null && !isFocused(solidIn) && solidIn.value !== picker) solidIn.value = picker;
        const view = app.nodeView(id);
        if (kind === 'volume') {
          // Volume 은 늘 배열로 칠한다 — 단색 선택지를 숨긴다. 선택지는 데이터를 불러올 때 한 번 넣고 데이터·Clip·Threshold 화면의 노드가 바뀌어도 같은 select 라 여기서 켜고 끈다
          const solidOpt = field.querySelector<HTMLOptionElement>('option[value="solid:"]');
          if (solidOpt) solidOpt.hidden = solidOpt.disabled = view?.representation === 'volume';
        }
        const drawn = !view || view.representation === 'surface' || view.representation === 'points' || view.representation === 'volume';
        note.textContent = solid === null && !drawn
          ? `${view?.representation === 'outline' ? 'Outline 은 단색 선으로 그립니다' : "표현 방식이 '없음'이라 그리지 않습니다"}. 고른 배열은 Surface·Points·Volume 일 때 칠해집니다.`
          : '';
        const active = solid === null && !!c.fieldKey && drawn; // 지금 값으로 칠하는가
        map.hidden = !active;
        if (!active) return;
        separate.input.checked = c.separate;
        editor.sync();
        // 함께 쓰는 노드가 있을 때만 알린다 (여기서 바꾸면 그 노드들도 바뀐다는 경고 — 설명은 Separate Color Map 의 물음표에)
        const others = c.separate ? [] : app.colorMapUsers({ nodeId: id }).filter((u) => u !== id).map(nodeName);
        share.textContent = others.length ? `함께 쓰는 노드: ${others.join(', ')} (여기서 바꾸면 함께 바뀝니다)` : '';
      },
    };
  };

  // ---------- 볼륨 노드 공통: '표시' 묶음 (표현 방식 · Opacity · 크기 · 구 음영) ----------
  /**
   * 데이터·Clip·Threshold 화면의 '표시' (ParaView Display 의 Representation). 대상은 화면마다 다르다(데이터 = ROOT_ID, Clip·Threshold 노드 = 고른 노드).
   * 표현 방식 바로 아래에 '색'(무엇으로 칠할지 — 단색 선택지 있음, Volume 이면 단색이 숨는다), 맨 아래에 Color Map 묶음(coloring).
   * Opacity 는 Surface 일 때, Scalar Opacity Unit Distance 와 그 '기본값'은 Volume 일 때, 크기·구 음영은 Points 일 때(격자가 없어 Surface·Volume 대신 점으로 그릴 때도)만 보인다.
   * Volume 은 칠할 배열이 없는 데이터에서는 고를 수 없다(선택지가 꺼진다). Clip·Threshold 노드를 Volume 으로 그리면 남은 셀만 보인다(명세 §2.1).
   * 면·선·Glyph 위의 Clip·Threshold 노드는 입력 노드의 모양을 그대로 그리므로
   * 표현 방식 대신 안내 한 줄만 보인다.
   */
  const viewBlock = (target: () => string | null) => {
    const root = el('div', 'blk');
    const set = (patch: Partial<DataView>) => { const id = target(); if (id) app.setNodeView(id, patch); };
    const REPS: Representation[] = ['surface', 'outline', 'points', 'volume', 'none'];
    const rep = select<Representation>(REPS.map((r) => ({ value: r, label: REPRESENTATION_LABEL[r] })), 'outline', (v) => set({ representation: v }));
    const volumeOpt = rep.querySelector<HTMLOptionElement>('option[value="volume"]');
    const repRow = withHelp(row('표현 방식', rep), [
      'Surface: 남은 셀 집합의 바깥 면을 셀 값 색으로 그립니다.',
      'Outline: 경계 상자를 단색 선으로 그립니다.',
      'Points: 셀 중심마다 점을 그립니다.',
      'Volume: 남은 셀의 값을 시선을 따라 반투명하게 쌓아 안쪽까지 비쳐 보이게 그립니다. 처음에는 Color Map 범위의 최소에서 투명하고 최대로 갈수록 진하며, 전체 진하기는 Scalar Opacity Unit Distance 로 조절합니다.',
      "Volume 은 늘 배열로 칠하므로 '색'에 단색이 없습니다. 단색인 채로 Volume 을 고르면 기본 배열로 칠하고, 칠할 배열이 없는 데이터에서는 Volume 을 고를 수 없습니다.",
      "없음: 이 노드는 그리지 않고 아래 노드만 보입니다.",
    ]);
    const op = slider({ min: 0.05, max: 1, step: 0.05, value: 1, format: pct }, (v) => set({ opacity: v }));
    const size = slider({ min: 0.2, max: 4, step: 0.1, value: 1, format: (v) => `×${v.toFixed(1)}` }, (v) => set({ pointSize: v }));
    const sphere = checkbox('구 형태로 음영 처리', true, (v) => set({ sphereShading: v }));
    const opRow = row('Opacity', op.input, op.value), sizeRow = row('크기', size.input, size.value);
    // Scalar Opacity Unit Distance (Volume 일 때만): 숫자 칸(m) + 이름 줄 오른쪽 '기본값'(app.volumeUnitDefault — Glyph Scale Factor 의 '기본값'과 같은 자리).
    // 이름이 길어 슬라이더처럼 이름 줄을 위에 둔다. 바꾸면 다시 계산 없이 셰이더 상수만 바뀐다(AppCore.setNodeView). 0·음수는 받지 않는다
    const unit = numberInput(1, (v) => set({ volumeUnitDistance: v }));
    const unitReset = el('button', 'btn btn-normal btn-mini', '기본값');
    unitReset.type = 'button';
    unitReset.addEventListener('click', () => set({ volumeUnitDistance: null }));
    const unitHead = el('div', 'field-head');
    unitHead.append(el('label', 'field-label', 'Scalar Opacity Unit Distance'), unitReset);
    const unitRow = el('div', 'field');
    unitRow.append(unitHead, unit);
    withHelp(unitRow, [
      'Opacity 곡선의 값은 시선이 이 거리(m)를 지날 때 가려지는 정도입니다. 키우면 같은 곡선이 더 옅게, 줄이면 더 진하게 보입니다.',
      "'기본값'은 데이터 경계 상자의 대각선 길이 ÷ ∛(셀 수)로, 대략 셀 한 칸 크기입니다.",
    ]);
    const colorBlk = coloring(target, 'volume');
    const controls = el('div', 'blk');
    controls.append(repRow, colorBlk.top, opRow, unitRow, sizeRow, sphere.root, colorBlk.map);
    const srcHint = el('div', 'hint');
    const hint = el('div', 'hint');
    root.append(el('div', 'sub', '표시'), controls, srcHint, hint);
    return {
      root,
      setFieldOptions: colorBlk.setFieldOptions,
      /** statText: 계산 결과 요약 (남은 셀 수 등) */
      sync(statText: string) {
        const id = target();
        const v = id ? app.nodeView(id) : null;
        controls.hidden = !v;
        srcHint.hidden = !!v;
        if (!v) {
          const src = id ? app.sourceOf(id) : null;
          const own = id ? app.layerById(id) : null;
          const act = own?.type === 'threshold' ? '이 Threshold 로 거릅니다' : '이 Clip 으로 자릅니다';
          srcHint.textContent = src ? `입력(${src.name})의 모양을 그대로 그리고 ${act}. 모양과 색은 ${src.name} 화면에서 바꿉니다.` : '';
          hint.textContent = statText;
          return;
        }
        if (!isFocused(rep)) rep.value = v.representation;
        if (volumeOpt) volumeOpt.disabled = !v.color.fieldKey && !app.defaultFieldKey && v.representation !== 'volume'; // setNodeView 가 Volume 을 받지 않는 조건과 같다
        // 격자가 없는 레벨이 있으면 Surface·Volume 대신 Points 로 그린다
        const fallback = (v.representation === 'surface' || v.representation === 'volume') && !app.canDrawSurface();
        opRow.hidden = v.representation !== 'surface' || fallback;
        unitRow.hidden = v.representation !== 'volume' || fallback;
        sizeRow.hidden = sphere.root.hidden = v.representation !== 'points' && !fallback;
        if (!isFocused(op.input)) op.set(v.opacity);
        if (!unitRow.hidden && !isFocused(unit)) unit.value = fmtNum(v.volumeUnitDistance ?? app.volumeUnitDefault());
        if (!isFocused(size.input)) size.set(v.pointSize);
        sphere.input.checked = v.sphereShading;
        colorBlk.sync();
        const fallbackText = fallback ? `격자를 복원하지 못해 ${v.representation === 'volume' ? 'Volume' : '면'} 대신 점으로 그립니다.` : '';
        hint.textContent = [fallbackText, statText].filter(Boolean).join(' ');
      },
    };
  };

  // ---------- 데이터 ----------
  const data = section('database', '데이터', (v) => app.setRootVisible(v));
  const rootView = viewBlock(() => ROOT_ID);
  const dsSel = select<string>([], null, () => refreshLevelChoices());
  const lvSel = select<string>([], null, () => {});
  const lvRow = row('해상도', lvSel);
  const loadBtn = button('불러오기', async () => {
    const entry = currentEntry();
    if (!entry) return;
    try { await app.loadEntry(entry, entry.levelChoices ? Number(lvSel.value) : undefined); setStatus(''); }
    catch (e) { setStatus((e as Error).message, true); }
  }, 'primary', 'download');
  loadBtn.classList.add('btn-block');
  const csvInput = el('input'); csvInput.type = 'file'; csvInput.accept = '.csv,.txt,.tsv'; csvInput.hidden = true;
  const stlInput = el('input'); stlInput.type = 'file'; stlInput.accept = '.stl'; stlInput.hidden = true;
  csvInput.addEventListener('change', async () => {
    const f = csvInput.files?.[0]; if (!f) return;
    setStatus(`${f.name} 불러오는 중…`);
    try { app.loadCsvText(await f.text(), f.name); setStatus(''); }
    catch (e) { setStatus((e as Error).message, true); }
    csvInput.value = '';
  });
  stlInput.addEventListener('change', async () => {
    const f = stlInput.files?.[0]; if (!f) return;
    try { app.loadStlBuffer(await f.arrayBuffer()); setStatus(''); }
    catch (e) { setStatus((e as Error).message, true); }
    stlInput.value = '';
  });
  const fileBtns = el('div', 'btn-row');
  fileBtns.append(button('CSV 열기', () => csvInput.click(), 'normal', 'file'), button('STL 열기', () => stlInput.click(), 'normal', 'cube'));
  // 해석엔진 결과 폴더: 폴더 선택 창(Chrome·Edge), 없으면 폴더째 올리기
  const dirInput = el('input'); dirInput.type = 'file'; dirInput.hidden = true; dirInput.setAttribute('webkitdirectory', ''); dirInput.setAttribute('multiple', '');
  dirInput.addEventListener('change', async () => {
    const files = Array.from(dirInput.files ?? []); if (!files.length) return;
    try { await app.loadResultFolder(new FileListFolder(files)); setStatus(''); }
    catch (e) { setStatus((e as Error).message, true); }
    dirInput.value = '';
  });
  // 폴더 선택 창이 없거나 막힌 화면(다른 주소에서 띄운 iframe)이면 폴더째 올리기 — 파일 입력은 iframe 안에서도 열린다.
  // 막힘을 미리 알 수 있으면 클릭 안에서 바로 연다(기다린 뒤에 열면 브라우저가 사용자 동작으로 보지 않을 수 있다)
  const openResultFolder = async () => {
    if (!window.showDirectoryPicker || folderPickerBlocked()) { dirInput.click(); return; }
    let handle: FileSystemDirectoryHandle;
    try { handle = await window.showDirectoryPicker({ id: 'cfd-result', mode: 'read' }); }
    catch (e) {
      if ((e as { name?: unknown } | null)?.name === 'AbortError') return; // 사용자가 창을 닫음
      // 그 밖의 거절(SecurityError 등): 클릭 허가가 남아 있으면 폴더째 올리기 창으로 대신 열고, 없으면 그 사실만 알린다
      const canOpen = (navigator as { userActivation?: { isActive: boolean } }).userActivation?.isActive ?? true;
      if (canOpen) { dirInput.click(); return; }
      setStatus("폴더 선택 창을 열지 못했습니다. '결과 폴더 열기'를 다시 누르거나 폴더를 3D 화면에 끌어다 놓아 주세요.", true);
      return;
    }
    try { await app.loadResultFolder(new DirectoryHandleFolder(handle)); setStatus(''); }
    catch (e) { setStatus((e as Error).message, true); }
  };
  // 결과 ZIP: 작으면 메모리에, 크면 사용자가 고른 폴더에 풀어서 연다 (openZip.ts)
  const zipInput = el('input'); zipInput.type = 'file'; zipInput.accept = '.zip'; zipInput.hidden = true;
  zipInput.addEventListener('change', async () => {
    const f = zipInput.files?.[0]; if (!f) return;
    try { await openZipFile(app, f); setStatus(''); }
    catch (e) { setStatus((e as Error).message, true); }
    zipInput.value = '';
  });
  const resultBtns = el('div', 'btn-row');
  resultBtns.append(button('결과 폴더 열기', () => void openResultFolder(), 'primary', 'folder'), button('결과 ZIP 열기', () => zipInput.click(), 'normal', 'archive'));
  // 시간축(저장 시점 슬라이더·재생)은 3D 화면 아래 재생 막대(ui/timeBar.ts)에 있다
  const status = el('div', 'status');
  const setStatus = (msg: string, isError = false) => { status.textContent = msg; status.classList.toggle('error', isError); status.hidden = !msg; };
  setStatus('');
  const dsInfo = el('div', 'kv');
  const note = callout('warn');
  data.body.append(row('데이터셋', dsSel), lvRow, loadBtn, fileBtns, resultBtns, csvInput, stlInput, dirInput, zipInput, status, dsInfo, rootView.root, note.root);
  data.setHelp([
    '3D 화면에 CSV·STL 파일, 결과 폴더, 결과 ZIP을 끌어다 놓아도 열립니다.',
    folderPickerBlocked() // 다른 주소에서 띄운 iframe 안이면 폴더를 고를 수 없다 (페이지가 떠 있는 동안 바뀌지 않음)
      ? '결과 ZIP은 해석엔진이 내려준 파일 그대로 열리며(안에 작업 폴더가 있어도 찾습니다), 풀면 256 MB를 넘는 ZIP은 PC에서 먼저 푼 뒤 "결과 폴더 열기"로 그 폴더를 고릅니다.'
      : '결과 ZIP은 해석엔진이 내려준 파일 그대로 열리며(안에 작업 폴더가 있어도 찾습니다), 풀면 256 MB를 넘는 ZIP은 풀어 둘 폴더를 고릅니다(Chrome·Edge).',
    '저장 시점이 여러 개인 결과는 3D 화면 아래 재생 막대로 넘깁니다(Space: 재생/정지).',
  ]);

  const currentEntry = (): DatasetEntry | null => app.catalog.find((c) => c.id === dsSel.value) ?? null;
  const refreshLevelChoices = () => {
    const entry = currentEntry();
    const choices = entry?.levelChoices ?? [];
    lvRow.hidden = choices.length === 0;
    setOptions(lvSel, choices.map((c, i) => ({ value: String(i), label: c.label })), null);
    if (choices.length) {
      let i = entry?.defaultChoice ?? -1;
      if (i < 0 && entry?.defaultLevels) i = choices.findIndex((c) => c.levels.join(',') === entry.defaultLevels!.join(',') && !(c.extra?.length));
      lvSel.value = String(i >= 0 ? i : 0);
    }
  };

  // ---------- 형상 편집 ----------
  const edit = section('edit', '형상 편집');
  const toolSeg = segmented<EditMode>([
    { value: 'select', label: '선택', icon: 'cursor' }, { value: 'translate', label: '이동', icon: 'move' },
    { value: 'rotate', label: '회전', icon: 'rotate-cw' }, { value: 'scale', label: '크기', icon: 'scale' },
  ], 'select', (v) => app.editor.setMode(v));
  const snapCheck = checkbox('스냅 (1 m, 15°, 0.1배 단위)', false, (v) => app.editor.setSnap(v));
  const addRow = el('div', 'btn-row');
  addRow.append(
    button('상자 추가', () => app.objects.addPrimitive('box', app.placementPoint()), 'normal', 'cube'),
    button('원기둥 추가', () => app.objects.addPrimitive('cylinder', app.placementPoint()), 'normal', 'cylinder'),
    button('복제', () => app.objects.duplicateSelected(), 'normal', 'copy'),
    button('삭제', () => app.objects.removeSelected(), 'danger', 'trash'),
  );
  const histRow = el('div', 'btn-row');
  const undoBtn = button('실행 취소', () => app.objects.undo(), 'normal', 'undo');
  const redoBtn = button('다시 실행', () => app.objects.redo(), 'normal', 'redo');
  const splitBtn = button('분리', () => app.objects.splitSelected(), 'normal', 'split');
  const mergeBtn = button('병합', () => app.objects.mergeSelected(), 'normal', 'merge');
  histRow.append(undoBtn, redoBtn, splitBtn, mergeBtn);
  const props = el('div', 'props');
  const nameIn = el('input', 'num text');
  nameIn.type = 'text';
  nameIn.addEventListener('change', () => { const o = app.objects.selectedOne(); if (o) app.objects.update(o.id, { name: nameIn.value.trim() || o.name }); });
  const posIn = [0, 1, 2].map((i) => numberInput(0, (v) => {
    const o = app.objects.selectedOne(); if (!o) return;
    const p: [number, number, number] = [...o.position]; p[i] = v; app.objects.update(o.id, { position: p });
  }));
  const sizeIn = [0, 1, 2].map((i) => numberInput(0, (v) => {
    const o = app.objects.selectedOne(); if (!o || v <= 0) return;
    if (o.kind === 'mesh') { const s: [number, number, number] = [...o.scale]; s[i] = v / o.size[i]; app.objects.update(o.id, { scale: s }); }
    else { const s: [number, number, number] = [...o.size]; s[i] = v; if (o.kind === 'cylinder' && i < 2) { s[0] = v; s[1] = v; } app.objects.update(o.id, { size: s }); }
  }));
  const rotIn = numberInput(0, (v) => { const o = app.objects.selectedOne(); if (o) app.objects.update(o.id, { rotationZ: v }); });
  const triple = (inputs: HTMLInputElement[]) => { const w = el('div', 'triple'); w.append(...inputs); return w; };
  props.append(el('div', 'sub', '선택한 형상'), row('이름', nameIn), row('위치 (X, Y, Z)', triple(posIn)), row('크기 (X, Y, Z)', triple(sizeIn)), row('회전 (°)', rotIn));
  const jsonInput = el('input'); jsonInput.type = 'file'; jsonInput.accept = '.json'; jsonInput.hidden = true;
  const editHint = el('div', 'hint');
  jsonInput.addEventListener('change', async () => {
    const f = jsonInput.files?.[0]; if (!f) return;
    try {
      const r = app.sceneFromJSON(await f.text());
      editHint.textContent = `장면을 불러왔습니다. 형상 ${r.objects}개, 레이어 ${r.layers}개${r.skipped ? `, 건너뜀 ${r.skipped}개` : ''}`;
    } catch (e) { editHint.textContent = (e as Error).message; }
    jsonInput.value = '';
  });
  const ioRow = el('div', 'btn-row');
  ioRow.append(
    button('STL 내보내기', () => download(app.objects.exportStl(), 'scene.stl'), 'primary', 'download'),
    button('장면 저장', () => download(new Blob([app.sceneToJSON()], { type: 'application/json' }), 'scene.json'), 'normal', 'file'),
    button('장면 열기', () => jsonInput.click(), 'normal', 'upload'),
  );
  edit.body.append(toolSeg.root, snapCheck.root, el('div', 'sub', '형상'), addRow, histRow, props,
    withHelp(el('div', 'sub', '파일'), ['STL 내보내기: 표시 중인 형상을 월드 좌표로 합쳐 저장합니다(솔버 입력용).', '장면 저장: 형상, 데이터 표현 방식, 레이어 트리, 색 지도(Color Map), 보기 설정을 JSON으로 저장합니다.']),
    ioRow, jsonInput, editHint);
  edit.setHelp([
    '3D 화면에서 형상을 클릭하여 선택하고, Ctrl+클릭으로 여러 개를 선택합니다. 장면 트리에서도 선택하거나 숨길 수 있습니다.',
    '단축키: V 선택, T 이동, R 회전, S 크기, Delete 삭제, Ctrl+D 복제, Ctrl+Z 실행 취소',
  ]);

  // ---------- Color Map: 지금 쓰이는 색 지도의 목록과 편집 (ParaView Color Map Editor) ----------
  /**
   * 무엇으로 칠할지는 여기서 고르지 않는다(노드 화면 — Slice 는 맨 위 'Field', 그 밖은 '표시'의 '색').
   * 이 화면은 지금 쓰이는 색 지도를 한곳에 모아 보여 주고 고친다:
   * 공유 지도는 배열마다 한 줄(그 배열로 칠하는 노드 이름), Separate Color Map 은 그 노드마다 한 줄. 줄을 누르면 아래에서 그 지도를 고친다(mapEditor).
   * 이 화면을 열 때 고른 노드(없으면 데이터)가 값으로 칠하고 있으면 그 노드가 쓰는 지도가 골라진다(showTab) — ParaView Color Map Editor 가 활성 소스의 지도를 따르는 것과 같다.
   * 목록의 줄 단추는 key 별로 한 번만 만들어 두고 글·선택 표시만 고친다 — 다시 만들면 누르는 도중의 클릭이 버려지고 키보드 포커스가 사라진다.
   */
  const color = section('droplet', 'Color Map');
  let mapKey = ''; // 고른 색 지도 (AppCore.colorMapList 의 key)
  const mapList = el('div', 'map-list');
  const mapEmpty = el('div', 'hint', '값으로 칠하는 노드가 없어 쓰이는 색 지도가 없습니다.');
  const mapEditTitle = el('div', 'sub');
  const pageEditor = mapEditor(() => app.colorMapList().find((e) => e.key === mapKey)?.target ?? null, 'page');
  const fieldDesc = el('div', 'hint');
  color.body.append(mapList, mapEmpty, mapEditTitle, pageEditor.root, fieldDesc);
  color.setHelp([
    '지금 쓰이는 색 지도(값을 색으로 바꾸는 규칙)의 목록입니다. 줄을 누르면 그 색 지도를 아래에서 고칩니다.',
    '같은 배열로 칠하는 노드는 색 지도 하나를 함께 씁니다.',
    "무엇으로 칠할지는 각 노드 화면에서 고릅니다. Slice 는 맨 위 'Field', 그 밖의 노드는 '표시'의 '색'입니다. 데이터·Clip·Threshold 는 표현 방식이 Surface·Points·Volume 일 때만 값으로 칠합니다.",
  ]);
  const BAR_STOPS = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1];
  type MapButton = { root: HTMLButtonElement; name: HTMLElement; badge: HTMLElement; range: HTMLElement; bar: HTMLElement; users: HTMLElement };
  const mapButtons = new Map<string, MapButton>();
  let mapOrder = '';
  const mapButton = (key: string): MapButton => {
    let b = mapButtons.get(key);
    if (!b) {
      const root = el('button', 'map-item');
      root.type = 'button';
      const head = el('div', 'map-item-head');
      const name = el('span', 'map-item-name'), badge = el('span', 'badge dev', 'Separate'), range = el('span', 'map-item-range');
      head.append(name, badge, range);
      const bar = el('div', 'map-item-bar'), users = el('div', 'map-item-users');
      root.append(head, bar, users);
      root.addEventListener('click', () => { mapKey = key; syncColorPage(); });
      b = { root, name, badge, range, bar, users };
      mapButtons.set(key, b);
    }
    return b;
  };
  const syncColorPage = () => {
    const list = app.dataset ? app.colorMapList() : [];
    if (!list.some((e) => e.key === mapKey)) mapKey = list[0]?.key ?? '';
    const rows = list.map((e) => {
      const m = app.colorMapFor(e.target);
      const f = app.fieldByKey(e.fieldKey);
      const comp = f?.kind === 'vector' && m ? ` ${MAPPING_OPTS.find((o) => o.value === m.mapping)?.label ?? ''}` : '';
      const span = m ? m.rangeMax - m.rangeMin : 1;
      return {
        e, colormap: m?.colormap ?? 'coolwarm', title: `${f?.name ?? e.fieldKey}${comp}`,
        range: !m || m.fresh ? '범위 미정' : `${fmtRangeValue(m.rangeMin, span)} ~ ${fmtRangeValue(m.rangeMax, span)}`,
        users: e.users.map(nodeName).join(', '),
      };
    });
    // 줄이 생기거나 없어지거나 순서가 바뀔 때만 목록을 다시 짠다. 그 밖(선택·범위·Preset·노드 이름)은 있는 단추의 글만 고친다
    const order = rows.map((r) => r.e.key).join('\n');
    if (order !== mapOrder) {
      mapOrder = order;
      for (const k of [...mapButtons.keys()]) if (!rows.some((r) => r.e.key === k)) mapButtons.delete(k);
      mapList.replaceChildren(...rows.map((r) => mapButton(r.e.key).root));
    }
    for (const r of rows) {
      const b = mapButton(r.e.key), on = r.e.key === mapKey;
      b.root.classList.toggle('selected', on);
      b.root.setAttribute('aria-pressed', String(on));
      if (b.name.textContent !== r.title) { b.name.textContent = r.title; b.root.title = r.title; }
      b.badge.hidden = !r.e.owner;
      if (b.range.textContent !== r.range) b.range.textContent = r.range;
      if (b.bar.dataset.preset !== r.colormap) {
        b.bar.dataset.preset = r.colormap;
        b.bar.style.background = `linear-gradient(to right, ${BAR_STOPS.map((t) => colormapCss(r.colormap, t)).join(', ')})`;
      }
      if (b.users.textContent !== r.users) b.users.textContent = r.users;
    }
    mapList.hidden = rows.length === 0;
    mapEmpty.hidden = rows.length > 0;
    const cur = rows.find((r) => r.e.key === mapKey);
    mapEditTitle.hidden = !cur;
    if (cur) mapEditTitle.textContent = cur.e.owner ? `${nodeName(cur.e.owner)} 의 Separate Color Map` : `${cur.title} 의 Color Map`;
    pageEditor.sync();
    const f = cur ? app.fieldByKey(cur.e.fieldKey) : null;
    if (cur && f) {
      const m = app.colorMapFor(cur.e.target);
      const st = app.statsFor(cur.e.fieldKey, m?.mapping ?? 'magnitude');
      const unit = app.unitFor(cur.e.fieldKey);
      // 배열 설명: 벡터는 고른 성분의 설명만 쓴다 (크기일 때 첫 성분의 설명을 붙이면 틀린 글이 된다)
      const ci = f.kind === 'vector' ? ({ x: 0, y: 1, z: 2 } as Record<string, number>)[m?.mapping ?? ''] : undefined;
      const desc = app.info.descriptions[f.name] ?? (f.kind === 'vector' && ci !== undefined ? app.info.descriptions[f.componentNames[ci]] : '') ?? '';
      fieldDesc.textContent = `${desc ? desc + '. ' : ''}지금 시점 데이터 전체 범위 ${fmtNum(st.min)} ~ ${fmtNum(st.max)}${unit ? ' ' + unit : ''}`;
    } else fieldDesc.textContent = '';
  };

  // ---------- 보기 설정 ----------
  const disp = section('monitor', '보기 설정');
  const bld = checkbox('형상 표시', true, (v) => app.setDisplay({ buildingsVisible: v }));
  const bldOp = slider({ min: 0.05, max: 1, step: 0.05, value: 1, format: pct }, (v) => app.setDisplay({ buildingOpacity: v }));
  const grid = checkbox('격자와 좌표축', true, (v) => app.setDisplay({ gridVisible: v }));
  const frameCheck = checkbox('평면 위치 표시 (Slice·Clip·Streamline 시작면)', true, (v) => app.setDisplay({ planeFrame: v }));
  type LegendSize = 'off' | 'sm' | 'md' | 'lg';
  const legendSeg = segmented<LegendSize>([{ value: 'off', label: '숨김' }, { value: 'sm', label: '작게' }, { value: 'md', label: '보통' }, { value: 'lg', label: '크게' }], 'sm', (v) => {
    app.setDisplay({ legendSize: v });
    try { localStorage.setItem('utcfd.legend', v); } catch { /* 저장 못 해도 됨 */ }
  });
  try { const saved = localStorage.getItem('utcfd.legend') as LegendSize | null; if (saved && ['off', 'sm', 'md', 'lg'].includes(saved)) app.setDisplay({ legendSize: saved }); } catch { /* 비공개 창 등 */ }
  withHelp(frameCheck.root, '화면에서만 보이고 PNG 캡처에는 들어가지 않습니다.');
  disp.body.append(bld.root, row('형상 Opacity', bldOp.input, bldOp.value), grid.root, frameCheck.root, row('범례', legendSeg.root));

  // ---------- 레이어 공통 머리: 이름 · 복제 · 순서 · 삭제 ----------
  const heads: { sync(l: Layer): void }[] = []; // 노드 화면마다 하나씩 있는 layerHead (고른 노드로 '삭제'·'하류까지 삭제'를 맞춘다)
  const layerHead = () => {
    const root = el('div', 'layer-head');
    const name = el('input', 'num text');
    name.type = 'text';
    name.addEventListener('change', () => { const l = app.selectedLayer(); if (l) app.renameLayer(l.id, name.value); });
    const btns = el('div', 'btn-row');
    const afterDelete = () => { const next = app.selectedLayer(); showTab(next ? next.type : 'data'); }; // 지우면 입력 노드를 고른다(ParaView)
    // 아래에 매단 노드가 있으면 '삭제'는 꺼지고 '하류까지 삭제'(그 노드와 아래 전부)가 보인다 — ParaView: 하류가 있는 노드는 지울 수 없고 Delete Downstream Pipeline 이 따로 있다(명세 §1)
    const del = button('삭제', () => { const l = app.selectedLayer(); if (l && !app.childrenOf(l.id).length) { app.removeLayer(l.id); afterDelete(); } }, 'danger', 'trash');
    const delDown = button('하류까지 삭제', () => { const l = app.selectedLayer(); if (l) { app.removeSubtree(l.id); afterDelete(); } }, 'danger', 'trash');
    btns.append(
      button('복제', () => { const l = app.selectedLayer(); if (l) { const c = app.duplicateLayer(l.id); if (c) showTab(c.type); } }, 'normal', 'copy'),
      button('위로', () => { const l = app.selectedLayer(); if (l) app.moveLayer(l.id, -1); }, 'normal', 'arrow-up'),
      button('아래로', () => { const l = app.selectedLayer(); if (l) app.moveLayer(l.id, 1); }, 'normal', 'arrow-down'),
      del, delDown,
    );
    root.append(row('이름', name), btns);
    const head = {
      root, name,
      sync(l: Layer) {
        const n = app.descendantsOf(l.id).length;
        del.disabled = n > 0;
        del.title = n > 0 ? '아래에 매단 레이어가 있어 이 노드만 지울 수 없습니다' : '';
        delDown.hidden = n === 0;
        delDown.querySelector('span')!.textContent = `하류까지 삭제 (${n + 1}개)`;
      },
    };
    heads.push(head);
    return head;
  };

  const selId = () => app.selectedLayer()?.id ?? null;
  const sliceColor = coloring(selId, 'slice'), glyphColorBlk = coloring(selId, 'glyph'), streamColorBlk = coloring(selId, 'stream'), isoColorBlk = coloring(selId, 'iso');

  // ---------- 모든 노드 화면 공통 두 줄: '상위' · '적용 중인 Clip·Threshold' (layerHead 바로 아래) ----------
  /**
   * '상위' select (ParaView Change Input): '데이터' + 옮길 수 있는 노드들(canReparent: 자기·자손 제외, Slice·Isosurface·Streamline·Glyph 노드는 볼륨 노드 아래만,
   * 옮긴 뒤 자손도 규칙에 맞아야 함) → app.setParent. 노드가 추가·삭제·개명되면 선택지를 다시 채운다(서명 비교).
   * '적용 중인 Clip·Threshold' kv: 조상 Clip·Threshold 를 뿌리→잎 순서로 "Clip X 0.05~0.12 m · Threshold fraction 0~0.6". 사슬이 비면 줄 자체를 숨긴다.
   */
  const parentBlock = () => {
    const root = el('div', 'blk');
    const parentSel = select<string>([{ value: '', label: '데이터' }], '', (v) => { const l = app.selectedLayer(); if (l) app.setParent(l.id, v || null); });
    const chainKv = el('div', 'kv');
    const chainV = el('span', 'v');
    chainKv.append(el('span', 'k', '적용 중인 Clip·Threshold'), chainV);
    root.append(row('상위', parentSel), chainKv);
    let lastOpts = '';
    return {
      root,
      sync(l: Layer) {
        const cands = app.layers.filter((x) => x.id === l.parentId || app.canReparent(l.id, x.id));
        const opts = [{ value: '', label: '데이터' }, ...cands.map((x) => ({ value: x.id, label: app.isFilterNode(x) ? `${x.name} (${filterSummary(app, x)})` : x.name }))];
        const key = opts.map((o) => `${o.value}|${o.label}`).join('\n');
        if (key !== lastOpts) { lastOpts = key; setOptions(parentSel, opts, l.parentId ?? ''); }
        else if (!isFocused(parentSel) && parentSel.value !== (l.parentId ?? '')) parentSel.value = l.parentId ?? '';
        const chain = app.chainOf(l.id);
        chainKv.hidden = chain.length === 0;
        chainV.textContent = chain.map((c) => `${LAYER_LABEL[c.kind]} ${filterSummary(app, c)}`).join(' · ');
      },
    };
  };

  /** Clip·Threshold 노드 화면의 '아래에 매단 레이어: Slice 2, Clip 3' 안내 */
  const childrenText = (l: Layer): string => {
    const names = app.childrenOf(l.id).map((c) => c.name);
    return `아래에 매단 레이어: ${names.length ? names.join(', ') : '없음'}`;
  };

  // ---------- Clip 노드 (스위치 = 보이기) ----------
  // ParaView Clip: Clip Type(Plane·Box·Scalar) + 종류별 항목 + Invert(기본 켬). 종류를 바꿔도 다른 종류의 값은 지켜 둔다
  const clip = section('split', LAYER_LABEL.clip, (v) => { const l = app.selectedLayer(); if (l) app.setLayerVisible(l.id, v); });
  const clipView = viewBlock(() => app.selectedLayer()?.id ?? null);
  const clipHead = layerHead();
  const clipParent = parentBlock();
  const selClip = () => { const l = app.selectedLayer(); return l?.type === 'clip' ? l : null; };
  const spanOf = (a: number) => { const b = app.dataset?.bounds; return b ? b.max[a] - b.min[a] : 1; };
  const clipType = segmented<ClipType>((['plane', 'box', 'scalar'] as ClipType[]).map((t) => ({ value: t, label: CLIP_TYPE_LABEL[t] })), 'plane', (v) => { upd({ clipType: v }); syncClipRanges(true); });
  // Plane: 법선 축 + 위치
  const clipAxis = segmented<AxisKey>(AXIS_OPTS, '0', (v) => {
    const l = selClip(); const b = app.dataset?.bounds; if (!l) return;
    const a = Number(v) as Axis;
    upd(b ? { axis: a, position: (b.min[a] + b.max[a]) / 2 } : { axis: a }); // 축을 바꾸면 위치를 그 축의 가운데로
    syncClipRanges(true);
  });
  const clipPos = slider({ min: 0, max: 1, step: 0.01, value: 0.5, format: (v) => { const l = selClip(); return `${fmtRangeValue(v, spanOf(l?.params.axis ?? 0))} m`; } }, (v) => upd({ position: v }));
  const planeRows = el('div', 'blk');
  planeRows.append(row('법선 축', clipAxis.root), row('위치', clipPos.input, clipPos.value));
  // Box: 축마다 하한·상한
  const boxSliders = [0, 1, 2].map((a) => {
    const fmt = (v: number) => `${fmtRangeValue(v, spanOf(a))} m`;
    const set = (k: 'boxMin' | 'boxMax', v: number) => { const l = selClip(); if (!l) return; const arr = [...l.params[k]] as [number, number, number]; arr[a] = v; upd(k === 'boxMin' ? { boxMin: arr } : { boxMax: arr }); };
    return { lo: slider({ min: 0, max: 1, step: 0.01, value: 0, format: fmt }, (v) => set('boxMin', v)), hi: slider({ min: 0, max: 1, step: 0.01, value: 1, format: fmt }, (v) => set('boxMax', v)) };
  });
  const boxRows = el('div', 'blk');
  boxSliders.forEach((s, a) => boxRows.append(row(`${'XYZ'[a]} 하한`, s.lo.input, s.lo.value), row(`${'XYZ'[a]} 상한`, s.hi.input, s.hi.value)));
  // Scalar: Field · Component · 기준값 (Field 를 바꾸면 기준값을 그 Field 값 범위 가운데로 — ParaView 기본)
  let clipValSpan = 1;
  // '(없음)' 은 Field 가 없거나 데이터에서 사라진 상태를 드러내기 위한 것이라 고를 수는 없다 (Threshold 와 같음)
  const clipField = select<string>([], null, (v) => {
    const l = selClip(); if (!l) return;
    if (!v) { clipField.value = l.params.fieldKey ?? ''; return; }
    const st = app.statsFor(v, l.params.mapping); upd({ fieldKey: v, value: (st.min + st.max) / 2 }); syncClipRanges(true);
  });
  const clipMapping = select<VectorMapping>(MAPPING_OPTS, 'magnitude', (v) => { const l = selClip(); if (!l) return; const st = app.statsFor(l.params.fieldKey, v); upd({ mapping: v, value: (st.min + st.max) / 2 }); syncClipRanges(true); });
  const clipMappingRow = row('Component', clipMapping);
  const clipVal = slider({ min: 0, max: 1, step: 0.001, value: 0.5, format: (v) => fmtRangeValue(v, clipValSpan) }, (v) => upd({ value: v }));
  const scalarRows = el('div', 'blk');
  scalarRows.append(row('Field', clipField), clipMappingRow, row('기준값', clipVal.input, clipVal.value));
  const clipInvert = checkbox('Invert', true, (v) => upd({ invert: v }));
  withHelp(clipInvert.root, [
    '어느 쪽을 남길지 뒤집습니다.',
    '켜면 Plane 은 좌표가 위치보다 작은 쪽, Box 는 상자 안, Scalar 는 값이 기준값보다 작은 쪽을 남깁니다. 끄면 그 반대쪽을 남깁니다.',
  ]);
  const clipInvertHint = el('div', 'hint');
  const clipChildren = el('div', 'hint');
  clip.body.append(clipHead.root, clipParent.root,
    row('종류', clipType.root), planeRows, boxRows, scalarRows, clipInvert.root, clipInvertHint, clipChildren, clipView.root);
  clip.setHelp([
    'Plane·Box·Scalar 로 데이터의 한쪽을 버립니다. 이 아래에 매단 레이어 전부에 적용됩니다.',
    '상위가 셀(데이터나, 셀을 거른 Clip·Threshold)이면 셀 중심으로 판정해 셀을 통째로 남기거나 버립니다.',
    '상위가 면·선이면 그 모양을 자르고, 화살표면 화살표를 점마다 남기거나 뺍니다.',
  ]);
  /** 지금 남기는 쪽 한 줄 (Invert 의 뜻은 체크 옆 물음표에). 요약(filterSummary)과 같은 기준이다 */
  const clipInvertText = (c: ClipParams): string => {
    if (c.clipType === 'plane') return `남기는 쪽: ${'XYZ'[c.axis]} ${c.invert ? '≤' : '≥'} ${fmtRangeValue(c.position, spanOf(c.axis))} m`;
    if (c.clipType === 'box') return `남기는 쪽: 상자 ${c.invert ? '안' : '밖'}`;
    if (!app.fieldByKey(c.fieldKey)) return 'Field 가 데이터에 없습니다. Field 를 고르세요.';
    return `남기는 쪽: ${thresholdFieldName(app, c.fieldKey, c.mapping)} ${c.invert ? '≤' : '≥'} ${fmtRangeValue(c.value, clipValSpan)}`;
  };
  let clipRangeKey = ''; // 슬라이더 범위를 잡은 기준 (데이터 범위·축·Field — 바뀔 때만 set(v, min, max, step))
  /** 슬라이더 범위를 데이터 범위·Field 값 범위에 맞춘다. force 면 서명이 같아도 다시 */
  function syncClipRanges(force = false) {
    const l = selClip(); const b = app.dataset?.bounds;
    if (!l || !b) return;
    const c = l.params, st = app.statsFor(c.fieldKey, c.mapping);
    const key = `${b.min.join(',')}|${b.max.join(',')}|${c.axis}|${c.fieldKey}|${c.mapping}|${st.min}|${st.max}`;
    if (key === clipRangeKey && !force) return;
    clipRangeKey = key;
    const step = (a: number) => Math.max((b.max[a] - b.min[a]) / 400, 1e-9);
    clipPos.set(c.position, b.min[c.axis], b.max[c.axis], step(c.axis));
    const cb = app.cellBounds(); // Box 는 셀 가장자리까지 (새 Box 의 기본 상자와 같은 범위)
    boxSliders.forEach((s, a) => { s.lo.set(c.boxMin[a], cb.min[a], cb.max[a], step(a)); s.hi.set(c.boxMax[a], cb.min[a], cb.max[a], step(a)); });
    clipValSpan = st.max - st.min;
    clipVal.set(c.value, st.min, st.max, Math.max((st.max - st.min) / 500, 1e-9));
  }

  // ---------- Threshold 노드 (스위치 = 보이기) ----------
  // ParaView Threshold: Field(+성분) · 방식 Between/Below/Above · Lower(Between·Below) · Upper(Between·Above) · All Scalars(기본 켬) · Invert(기본 끔)
  const thr = section('filter', LAYER_LABEL.threshold, (v) => { const l = app.selectedLayer(); if (l) app.setLayerVisible(l.id, v); });
  const thrView = viewBlock(() => app.selectedLayer()?.id ?? null);
  const thrHead = layerHead();
  const thrParent = parentBlock();
  let thrSpan = 1;
  const fmtT = (v: number) => fmtRangeValue(v, thrSpan);
  // Field·Component 를 바꾸면 Lower·Upper 를 그 Field 값 범위 전체로 되돌린다 (옛 구간은 새 Field 의 단위와 무관하므로)
  // '(없음)' 선택지는 Field 가 없거나 데이터에서 사라진 상태를 드러내기 위한 것이라 고를 수는 없다 (고르면 되돌린다)
  const thrField = select<string>([], null, (v) => {
    const l = app.selectedLayer(); if (l?.type !== 'threshold') return;
    if (!v) { thrField.value = l.params.fieldKey ?? ''; return; }
    const st = app.statsFor(v, l.params.mapping); upd({ fieldKey: v, lower: st.min, upper: st.max });
  });
  const thrMapping = select<VectorMapping>(MAPPING_OPTS, 'magnitude', (v) => { const l = app.selectedLayer(); if (l?.type !== 'threshold') return; const st = app.statsFor(l.params.fieldKey, v); upd({ mapping: v, lower: st.min, upper: st.max }); });
  const thrMappingRow = row('Component', thrMapping);
  const thrMethod = segmented<ThresholdMethod>((['between', 'below', 'above'] as ThresholdMethod[]).map((m) => ({ value: m, label: THRESHOLD_METHOD_LABEL[m] })), 'between', (v) => upd({ method: v }));
  const thrMin = slider({ min: 0, max: 1, step: 0.001, value: 0, format: fmtT }, (v) => upd({ lower: v }));
  const thrMax = slider({ min: 0, max: 1, step: 0.001, value: 1, format: fmtT }, (v) => upd({ upper: v }));
  const thrMinRow = row('Lower', thrMin.input, thrMin.value), thrMaxRow = row('Upper', thrMax.input, thrMax.value);
  const thrAll = checkbox('All Scalars', true, (v) => upd({ allScalars: v }));
  withHelp(thrAll.root, ['면·선(Slice·Isosurface·Streamline) 아래에 걸 때만 뜻이 있습니다.', '켜면 삼각형(유선은 한 줄)의 모든 꼭짓점이 조건을 만족해야 남기고, 끄면 하나라도 만족하면 남깁니다.']);
  const thrInvert = checkbox('Invert', false, (v) => upd({ invert: v }));
  const thrRuleHint = el('div', 'hint');
  const thrFieldHint = el('div', 'hint');
  const thrChildren = el('div', 'hint');
  thr.body.append(thrHead.root, thrParent.root,
    row('Field', thrField), thrMappingRow, row('방식', thrMethod.root), thrMinRow, thrMaxRow, thrRuleHint, thrAll.root, thrInvert.root, thrFieldHint, thrChildren, thrView.root);
  thr.setHelp('Field 값이 조건을 만족하는 셀만 통째로 남깁니다. 이 아래에 매단 레이어 전부에 적용됩니다.');
  /** 지금 조건을 한 줄로 (경계 포함, Invert 반영) */
  const thrRuleText = (t: ThresholdParams): string => {
    const lo = fmtT(t.lower), hi = fmtT(t.upper);
    const rule = t.method === 'between' ? `${lo} ≤ 값 ≤ ${hi}` : t.method === 'below' ? `값 ≤ ${lo}` : `값 ≥ ${hi}`;
    return t.invert ? `남기는 셀: ${rule} 이 아닌 셀 (Invert)` : `남기는 셀: ${rule}`;
  };
  let thrRangeKey = '';
  function syncThrSliders() {
    const l = app.selectedLayer();
    if (l?.type !== 'threshold') return;
    const t = l.params, st = app.statsFor(t.fieldKey, t.mapping);
    const key = `${t.fieldKey}|${t.mapping}|${st.min}|${st.max}`;
    if (key === thrRangeKey) return;
    thrRangeKey = key; thrSpan = st.max - st.min;
    const step = Math.max((st.max - st.min) / 500, 1e-9);
    thrMin.set(t.lower, st.min, st.max, step); thrMax.set(t.upper, st.min, st.max, step);
  }

  // ---------- Slice 레이어 ----------
  const slice = section('slice', LAYER_LABEL.slice, (v) => { const l = app.selectedLayer(); if (l) app.setLayerVisible(l.id, v); });
  const sliceHead = layerHead();
  const slAxis = segmented<AxisKey>(AXIS_OPTS, '2', (v) => {
    const l = app.selectedLayer(); if (l?.type !== 'slice' || !app.dataset) return;
    const axis = Number(v) as Axis;
    const b = app.dataset.bounds;
    app.updateLayer(l.id, { axis, position: (b.min[axis] + b.max[axis]) / 2 });
    syncSlicePos();
  });
  const slPos = slider({ min: 0, max: 1, step: 0.1, value: 0 }, (v) => upd({ position: v }));
  const sliceParent = parentBlock();
  // 면·Contour lines 둘 다 끄는 것은 막는다 (체크를 되돌리고 안내)
  const slShowHint = el('div', 'hint');
  const BOTH_OFF = '면과 Contour lines 중 하나는 켜 두어야 합니다';
  const slSurface = checkbox('면 표시', true, (v) => {
    const l = app.selectedLayer(); if (l?.type !== 'slice') return;
    if (!v && !l.params.lines) { slSurface.input.checked = true; slShowHint.textContent = BOTH_OFF; return; }
    slShowHint.textContent = '';
    // 면 없이 Contour lines 만 볼 때 검은 선은 어두운 배경에 묻히므로 Color Map 색으로 바꿔 준다
    upd(!v && l.params.lineColor === 'black' ? { surface: v, lineColor: 'field' } : { surface: v });
  });
  const slLines = checkbox('Contour lines 표시', true, (v) => {
    const l = app.selectedLayer(); if (l?.type !== 'slice') return;
    if (!v && !l.params.surface) { slLines.input.checked = true; slShowHint.textContent = BOTH_OFF; return; }
    slShowHint.textContent = '';
    upd({ lines: v });
  });
  const slLevels = slider({ min: 2, max: 30, step: 1, value: 10, format: (v) => `${v}개` }, (v) => upd({ levels: v }));
  const slRes = select<'1' | '2'>([{ value: '1', label: '격자 간격' }, { value: '2', label: '격자 간격의 1/2 (더 매끄러움)' }], '2', (v) => upd({ resolution: Number(v) as 1 | 2 }));
  const slOp = slider({ min: 0.1, max: 1, step: 0.05, value: 1, format: pct }, (v) => upd({ opacity: v }));
  const slBanded = checkbox('Contour lines 사이를 단색으로 채움', false, (v) => upd({ banded: v }));
  const slClipObj = checkbox('형상 경계에 맞춤', true, (v) => upd({ clipToObjects: v }));
  withHelp(slClipObj.root, '벽까지 채우고 형상 안쪽은 비웁니다.');
  const slLineColor = segmented<'black' | 'white' | 'field'>([{ value: 'black', label: '검정' }, { value: 'white', label: '흰색' }, { value: 'field', label: 'Color Map' }], 'black', (v) => upd({ lineColor: v }));
  const slLineWidth = slider({ min: 0.5, max: 6, step: 0.25, value: 1, format: (v) => `${v}px` }, (v) => upd({ lineWidth: v }));
  const slLineOp = slider({ min: 0.1, max: 1, step: 0.05, value: 0.55, format: pct }, (v) => upd({ lineOpacity: v }));
  const slLevelsRow = row('Contour lines 개수', slLevels.input, slLevels.value);
  const slLevelsLabel = slLevelsRow.querySelector('.field-label, .row-label') as HTMLElement;
  const slResRow = row('해상도', slRes);
  const slOpRow = row('면 Opacity', slOp.input, slOp.value);
  const slLineColorRow = row('Contour lines 색', slLineColor.root);
  const slLineWidthRow = row('Contour lines 굵기', slLineWidth.input, slLineWidth.value);
  const slLineOpRow = row('Contour lines Opacity', slLineOp.input, slLineOp.value);
  const slHint = el('div', 'hint');
  slice.setHelp('평면 하나로 데이터를 잘라 그 면 위의 값을 색과 Contour lines 로 보여 줍니다.');
  slice.body.append(sliceHead.root, sliceParent.root,
    sliceColor.top, el('div', 'sub', 'Plane'), row('축', slAxis.root), row('위치', slPos.input, slPos.value),
    el('div', 'sub', '표시'), slSurface.root, slLines.root, slShowHint, slLevelsRow, slResRow, slOpRow, slBanded.root, slClipObj.root, slLineColorRow, slLineWidthRow, slLineOpRow,
    sliceColor.map, slHint);

  // ---------- Glyph 레이어 ----------
  const glyph = section('arrow', LAYER_LABEL.glyph, (v) => { const l = app.selectedLayer(); if (l) app.setLayerVisible(l.id, v); });
  const glyphHead = layerHead();
  const glyphField = select<string>([], null, (v) => upd({ fieldName: v }));
  // 배치(ParaView Glyph Mode): 균일 샘플(기본) | N개마다 | 평면 위(우리 고유)
  const glMode = segmented<GlyphMode>([{ value: 'uniform', label: '균일 샘플' }, { value: 'stride', label: 'N개마다' }, { value: 'plane', label: '평면 위' }], 'uniform', (v) => upd({ mode: v }));
  const glModeRow = withHelp(row('배치', glMode.root), [
    '균일 샘플: 영역 안에 고르게 흩은 자리마다 가장 가까운 점에 화살표를 그립니다. 화살표 수는 최대 개수보다 적을 수 있습니다.',
    'N개마다: 점 N개마다 하나씩 그립니다. 격자가 촘촘한 곳에 화살표가 몰립니다.',
    '평면 위: 고른 평면 근처의 점만 N개마다 하나씩 그립니다.',
  ]);
  const glAxis = segmented<AxisKey>(AXIS_OPTS, '2', (v) => {
    const l = app.selectedLayer(); if (l?.type !== 'glyph' || !app.dataset) return;
    const axis = Number(v) as Axis;
    const b = app.dataset.bounds;
    app.updateLayer(l.id, { axis, position: (b.min[axis] + b.max[axis]) / 2 });
    syncGlyphPos();
  });
  const glPos = slider({ min: 0, max: 1, step: 0.1, value: 0 }, (v) => upd({ position: v }));
  const glAxisRow = row('축', glAxis.root);
  const glPosRow = row('위치', glPos.input, glPos.value);
  const glMax = slider({ min: 500, max: 30000, step: 500, value: 5000, format: (v) => `${fmtInt(v)}곳`, commit: true }, (v) => upd({ maxSamples: v }));
  const glMaxRow = row('최대 개수', glMax.input, glMax.value);
  const stride = slider({ min: 1, max: 30, step: 1, value: 4, format: (v) => `${v}개마다 1개` }, (v) => upd({ stride: v }));
  const strideRow = row('간격', stride.input, stride.value);
  const glyphParent = parentBlock();
  // 길이: 크기에 비례(길이 = 크기 × Scale Factor) | 일정(길이 = Scale Factor). 바꾸는 순간 가장 긴 화살표의 길이가 그대로이도록 Scale Factor 를
  // 벡터 크기 최대값만큼 곱하거나 나눈다 (두 기본값의 비 = 최대값)
  const lenMode = segmented<'magnitude' | 'uniform'>([{ value: 'magnitude', label: '크기에 비례' }, { value: 'uniform', label: '일정' }], 'magnitude', (v) => {
    const l = app.selectedLayer(); if (l?.type !== 'glyph' || l.params.lengthMode === v) return;
    const k = app.glyphScaleDefault(l.params.fieldName, 'uniform') / app.glyphScaleDefault(l.params.fieldName, 'magnitude');
    upd({ lengthMode: v, scaleFactor: v === 'uniform' ? l.params.scaleFactor * k : l.params.scaleFactor / k });
    syncGlyphScale(true);
  });
  // Scale Factor: 화살표 길이 = 벡터 크기 × Scale Factor (일정이면 Scale Factor). '기본값' = ParaView 리셋 규칙(app.glyphScaleDefault). 슬라이더 범위는 그 기본값의 5배까지.
  // 길이만 바뀌므로 끄는 동안 바로 보인다(AppCore GLYPH_STYLE_KEYS — 다시 고르지 않음)
  const glSf = slider({ min: 0, max: 1, step: 0.001, value: 0.1, format: (v) => fmtNum(v) }, (v) => upd({ scaleFactor: v }));
  const glSfReset = el('button', 'btn btn-normal btn-mini', '기본값');
  glSfReset.type = 'button';
  glSfReset.addEventListener('click', () => { const l = app.selectedLayer(); if (l?.type === 'glyph') { upd({ scaleFactor: app.glyphScaleDefault(l.params.fieldName, l.params.lengthMode) }); syncGlyphScale(true); } });
  const glSfRow = withHelp(row('Scale Factor', glSf.input, glSf.value), [
    '화살표 길이 = 벡터 크기 × Scale Factor 입니다. 길이를 일정으로 두면 모든 화살표가 Scale Factor 와 같은 길이(m)입니다.',
    "'기본값'은 가장 큰 벡터의 화살표(일정이면 모든 화살표)가 영역 최장변의 10% 길이가 되는 값입니다. Field 를 바꾼 뒤 눌러 길이를 다시 맞춥니다.",
  ]);
  glSfRow.querySelector('.field-head')!.append(glSfReset);
  const glyphInfo = el('div', 'hint');
  glyph.setHelp('벡터 필드를 화살표로 보여 줍니다.');
  glyph.body.append(glyphHead.root, glyphParent.root,
    row('Field', glyphField), glModeRow, glMaxRow, glAxisRow, glPosRow, strideRow,
    el('div', 'sub', '표시'), glyphColorBlk.top, row('길이', lenMode.root), glSfRow, glyphColorBlk.map, glyphInfo);

  // ---------- Streamline 레이어 ----------
  const stream = section('wind', LAYER_LABEL.stream, (v) => { const l = app.selectedLayer(); if (l) app.setLayerVisible(l.id, v); });
  const streamHead = layerHead();
  const stField = select<string>([], null, (v) => upd({ fieldName: v }));
  const stAxis = segmented<AxisKey>(AXIS_OPTS, '0', (v) => {
    const l = app.selectedLayer(); if (l?.type !== 'stream') return;
    const seedAxis = Number(v) as Axis;
    const box = app.seedBoxFor({ ...l.params, seedAxis });
    app.updateLayer(l.id, { seedAxis, seedPos: box ? box.min[seedAxis] + app.finestSpacing() : 0 });
    syncSeedSlider();
  });
  const stPos = slider({ min: 0, max: 1, step: 0.01, value: 0, commit: true }, (v) => upd({ seedPos: v }));
  const stBounds = segmented<'data' | 'finest'>([{ value: 'data', label: '전체 영역' }, { value: 'finest', label: '세밀 격자 영역' }], 'data', (v) => { upd({ seedBounds: v }); syncSeedSlider(); });
  const stBoundsRow = row('범위', stBounds.root);
  const stNU = slider({ min: 1, max: 40, step: 1, value: 14, format: (v) => `${v}`, commit: true }, (v) => upd({ nU: v }));
  const stNV = slider({ min: 1, max: 20, step: 1, value: 6, format: (v) => `${v}`, commit: true }, (v) => upd({ nV: v }));
  const stVF = slider({ min: 0.05, max: 1, step: 0.05, value: 0.5, format: pct, commit: true }, (v) => upd({ vFrac: v }));
  const stDir = segmented<'forward' | 'backward' | 'both'>([{ value: 'forward', label: '순방향' }, { value: 'backward', label: '역방향' }, { value: 'both', label: '양방향' }], 'both', (v) => upd({ direction: v }));
  const stLen = slider({ min: 1, max: 1000, step: 1, value: 400, format: (v) => `${fmtNum(v)} m`, commit: true }, (v) => upd({ maxLength: v }));
  const streamParent = parentBlock();
  const stShape = segmented<StreamShape>([{ value: 'line', label: '선' }, { value: 'tube', label: '튜브' }, { value: 'prism', label: '각기둥' }, { value: 'ribbon', label: '리본' }], 'line', (v) => upd({ shape: v }));
  const stWidth = slider({ min: 0.25, max: 12, step: 0.25, value: 2, format: (v) => { const l = app.selectedLayer(); return `${v} ${l?.type === 'stream' ? l.params.widthUnits : 'px'}`; } }, (v) => upd({ width: v }));
  const stUnits = segmented<'px' | 'm'>([{ value: 'px', label: '픽셀' }, { value: 'm', label: '미터' }], 'px', (v) => upd({ widthUnits: v }));
  const stMeshW = slider({ min: 0.01, max: 10, step: 0.01, value: 1, format: (v) => `${fmtNum(v)} m` }, (v) => upd({ meshWidth: v }));
  const stSides = select<string>([{ value: '3', label: '3 (삼각기둥)' }, { value: '4', label: '4 (사각기둥)' }, { value: '5', label: '5' }, { value: '6', label: '6 (육각기둥)' }, { value: '8', label: '8' }], '4', (v) => upd({ sides: Number(v) }));
  const stRibbon = segmented<'horizontal' | 'vertical'>([{ value: 'horizontal', label: '수평' }, { value: 'vertical', label: '수직' }], 'horizontal', (v) => upd({ ribbonDir: v }));
  const stOpacity = slider({ min: 0.1, max: 1, step: 0.05, value: 1, format: pct }, (v) => upd({ opacity: v }));
  const stDash = segmented<'solid' | 'dashed' | 'dotted'>([{ value: 'solid', label: '실선' }, { value: 'dashed', label: '파선' }, { value: 'dotted', label: '점선' }], 'solid', (v) => upd({ dash: v }));
  const stWidthRow = row('굵기', stWidth.input, stWidth.value);
  const stUnitsRow = row('굵기 단위', stUnits.root);
  const stMeshWRow = row('굵기', stMeshW.input, stMeshW.value);
  const stSidesRow = row('면 수', stSides);
  const stRibbonRow = row('리본 방향', stRibbon.root);
  const stDashRow = row('선 종류', stDash.root);
  const stInfo = el('div', 'hint');
  stream.setHelp('시작점에서 벡터 필드를 따라간 선입니다.');
  stream.body.append(streamHead.root, streamParent.root, row('Field', stField),
    withHelp(el('div', 'sub', '시작점'), '시작점은 시작 평면 위 가로×세로 격자에 놓입니다. 3D 화면의 녹색 표시가 시작면과 추적 방향입니다.'), row('시작 평면 축', stAxis.root), row('시작 평면 위치', stPos.input, stPos.value), stBoundsRow,
    row('가로 개수', stNU.input, stNU.value), row('세로 개수', stNV.input, stNV.value), withHelp(row('세로 범위', stVF.input, stVF.value), '아래에서부터 사용할 높이 비율입니다.'),
    el('div', 'sub', '추적'), row('방향', stDir.root), row('최대 길이', stLen.input, stLen.value),
    el('div', 'sub', '표시'), row('모양', stShape.root), streamColorBlk.top, stWidthRow, stUnitsRow, stMeshWRow, stSidesRow, stRibbonRow, row('Opacity', stOpacity.input, stOpacity.value), stDashRow,
    streamColorBlk.map, stInfo);

  // ---------- Isosurface 레이어 ----------
  const iso = section('cube', LAYER_LABEL.iso, (v) => { const l = app.selectedLayer(); if (l) app.setLayerVisible(l.id, v); });
  const isoHead = layerHead();
  const isoField = select<string>([], null, (v) => { const st = app.statsFor(v); upd({ fieldKey: v, value: (st.p2 + st.p98) / 2 }); syncIsoSlider(); });
  const isoVal = slider({ min: 0, max: 1, step: 0.001, value: 0.5, commit: true }, (v) => upd({ value: v }));
  const isoNum = numberInput(0.5, (v) => { upd({ value: v }); isoVal.set(v); });
  const isoParent = parentBlock();
  const isoOp = slider({ min: 0.1, max: 1, step: 0.05, value: 0.85, format: pct }, (v) => upd({ opacity: v }));
  const isoInfo = el('div', 'hint');
  iso.setHelp('한 필드가 지정한 값인 면을 만듭니다.');
  iso.body.append(isoHead.root, isoParent.root,
    row('Field', isoField), row('값', isoVal.input, isoVal.value), row('직접 입력', isoNum),
    el('div', 'sub', '표시'), isoColorBlk.top, row('Opacity', isoOp.input, isoOp.value), isoColorBlk.map, isoInfo);

  // ---------- 화면(탭) 전환 — 장면 트리가 연다 ----------
  const builtIn: { id: string; sec: Section }[] = [
    { id: 'data', sec: data }, { id: 'edit', sec: edit }, { id: 'color', sec: color },
    { id: 'display', sec: disp },
    { id: 'clip', sec: clip }, { id: 'threshold', sec: thr }, { id: 'slice', sec: slice }, { id: 'glyph', sec: glyph }, { id: 'stream', sec: stream }, { id: 'iso', sec: iso },
  ];
  const chosen = opts.only ? builtIn.filter((t) => opts.only!.includes(t.id)) : builtIn;
  const extra = opts.extra ?? [];
  const tabs: { id: string; sec: Section }[] = [...extra.filter((t) => t.front), ...chosen, ...extra.filter((t) => !t.front)];
  host.append(...tabs.map((t) => t.sec.root));
  const defaultTab = tabs[0]?.id ?? 'data';
  let activeTab = defaultTab;
  const tabListeners: ((id: string) => void)[] = [];
  const showTab = (id: string) => {
    if (id === 'color') { // 고른 노드(없으면 데이터)가 값으로 칠하고 있으면 그 노드의 색 지도를 연다 (ParaView Color Map Editor 는 활성 소스의 지도를 따른다)
      const k = app.colorMapKeyOf(app.selectedLayer()?.id ?? ROOT_ID);
      if (k) { mapKey = k; syncColorPage(); }
    }
    activeTab = id;
    for (const t of tabs) t.sec.root.hidden = t.id !== id;
    host.scrollTop = 0;
    app.editor.setActive(id === 'edit'); // 편집 화면이 열려 있을 때만 클릭 선택·핸들이 동작
    for (const cb of tabListeners) cb(id);
    try { localStorage.setItem(storageKey, id); } catch { /* 저장 못 해도 동작에는 지장 없음 */ }
  };
  const storageKey = opts.storageKey ?? 'utcfd.tab';
  for (const t of tabs) t.sec.root.classList.add('page');
  // 처음 보일 화면: 주소의 ?tab= → 지난번 화면 → 페이지 기본값(initial) → 첫 구획. 레이어 화면은 고른 레이어가 있어야 열린다.
  let initial = new URLSearchParams(location.search).get('tab');
  if (!initial) { try { initial = localStorage.getItem(storageKey); } catch { initial = null; } }
  if (!initial) initial = opts.initial ?? null;
  const isLayerTab = (id: string) => (LAYER_TYPES as string[]).includes(id);
  showTab(initial && tabs.some((t) => t.id === initial) && !isLayerTab(initial) ? initial : defaultTab);
  let pendingInitialLayer = initial && isLayerTab(initial) ? initial : null; // 데이터가 들어오면 첫 레이어를 연다

  // ---------- 상태 동기화 ----------
  let lastDataset: unknown = null;
  let lastCatalog: unknown = null;
  let lastSelId: string | null | undefined;

  function syncSlicePos() {
    const l = app.selectedLayer();
    if (l?.type !== 'slice' || !app.dataset) return;
    const b = app.dataset.bounds, a = l.params.axis;
    slPos.set(l.params.position, b.min[a], b.max[a], (b.max[a] - b.min[a]) / 400);
    slAxis.value = String(a) as AxisKey;
  }
  function syncGlyphPos() {
    const l = app.selectedLayer();
    if (l?.type !== 'glyph' || !app.dataset) return;
    const b = app.dataset.bounds, a = l.params.axis;
    glPos.set(l.params.position, b.min[a], b.max[a], (b.max[a] - b.min[a]) / 400);
    glAxis.value = String(a) as AxisKey;
  }
  let glSfKey = ''; // Scale Factor 슬라이더 범위를 잡은 기준 (노드·Field·기본값 — 바뀔 때만 범위를 다시)
  function syncGlyphScale(force = false) {
    const l = app.selectedLayer();
    if (l?.type !== 'glyph') return;
    const d = app.glyphScaleDefault(l.params.fieldName, l.params.lengthMode), sf = l.params.scaleFactor;
    const key = `${l.id}|${l.params.fieldName}|${l.params.lengthMode}|${d}`;
    if (force || key !== glSfKey) {
      glSfKey = key;
      const hi = Math.max(d * 5, sf * 1.5, 1e-9);
      glSf.set(sf, Math.max(0, Math.min(hi / 500, sf)), hi, hi / 500); // 최소값이 값보다 크면 막대가 값을 잘라 보이므로 값까지 내린다
    } else if (!isFocused(glSf.input)) glSf.set(sf);
  }
  function syncSeedSlider() {
    const l = app.selectedLayer();
    if (l?.type !== 'stream') return;
    const box = app.seedBoxFor(l.params);
    if (!box) return;
    const a = l.params.seedAxis;
    stPos.set(l.params.seedPos, box.min[a], box.max[a], (box.max[a] - box.min[a]) / 400);
    stAxis.value = String(a) as AxisKey;
  }
  function syncIsoSlider() {
    const l = app.selectedLayer();
    if (l?.type !== 'iso') return;
    const st = app.statsFor(l.params.fieldKey);
    isoVal.set(l.params.value, st.min, st.max, Math.max((st.max - st.min) / 500, 1e-9));
    if (!isFocused(isoNum)) isoNum.value = fmtNum(l.params.value);
  }

  function sync() {
    if (app.catalog !== lastCatalog) {
      lastCatalog = app.catalog;
      setOptions(dsSel, app.catalog.map((c) => ({ value: c.id, label: c.label })), app.currentId ?? app.catalog[0]?.id ?? null);
      refreshLevelChoices();
    }
    loadBtn.disabled = !!app.loading;
    loadBtn.querySelector('span')!.textContent = app.loading ? '불러오는 중…' : '불러오기';
    if (app.info.note !== note.text.textContent) { note.text.textContent = app.info.note ?? ''; note.root.hidden = !app.info.note; }
    if (app.loading) setStatus(app.loading);
    else if (!status.classList.contains('error')) setStatus('');

    const ds = app.dataset;
    if (ds !== lastDataset) {
      lastDataset = ds;
      if (ds) {
        dsInfo.innerHTML = '';
        const lines: string[] = [];
        if (app.levels.length > 1) {
          lines.push(`레벨 ${app.levels.length}개, 셀 ${fmtInt(ds.count)}개`);
        } else {
          const l = app.levels[0];
          lines.push(`파일: ${ds.name}`, `셀: ${fmtInt(ds.count)}개`, `격자: ${l?.grid ? `${l.grid.dims.join('×')}, 간격 ${fmtNum(l.grid.spacing[0])} m, 채움률 ${Math.round(l.grid.coverage * 100)}%` : '복원 실패 (Slice·Streamline·Isosurface 사용 불가)'}`);
        }
        lines.push(`벡터: ${ds.vectors.map((v) => v.name).join(', ') || '없음'}`, `스칼라: ${ds.scalars.map((s) => s.name).join(', ') || '없음'}`);
        if (app.timings.load) lines.push(`소요 시간: 불러오기 ${fmtNum(app.timings.load / 1000)}초, 격자 복원 ${fmtNum((app.timings.grid ?? 0) / 1000)}초`);
        if (app.lastLoad.skippedRows) lines.push(`건너뛴 행: ${app.lastLoad.skippedRows}`);
        if (app.lastLoad.droppedColumns.length) lines.push(`제외한 열 (숫자 아님): ${app.lastLoad.droppedColumns.join(', ')}`);
        for (const l of lines) {
          const i = l.indexOf(': ');
          if (i > 0) dsInfo.append(el('span', 'k', l.slice(0, i)), el('span', 'v', l.slice(i + 2)));
          else dsInfo.append(el('span', 'v wide', l));
        }
        if (app.levels.length > 1) {
          const table = el('table');
          const head = el('tr'); for (const h of ['레벨', '간격', '셀']) head.append(el('th', undefined, h)); table.append(head);
          for (const l of app.levels) {
            const tr = el('tr');
            tr.append(el('td', undefined, l.name), el('td', undefined, `${fmtNum(l.spacing)} m`), el('td', undefined, `${fmtInt(l.keptCount)}${l.grid ? '' : ' (격자 없음)'}`));
            table.append(tr);
          }
          dsInfo.append(table);
        }
        note.text.textContent = app.info.note ?? '';
        note.root.hidden = !app.info.note;
        const vecOpts = ds.vectors.map((v) => ({ value: v.name, label: v.name }));
        setOptions(glyphField, vecOpts, null);
        setOptions(stField, vecOpts, null);
        setOptions(isoField, app.fieldOptions().map((o) => ({ value: o.key, label: o.kind === 'vector' ? `${o.label.replace(/ \(벡터\)$/, '')} 크기` : o.label })), null);
        const fieldOpts = app.fieldOptions().map((o) => ({ value: o.key, label: o.label }));
        setOptions(thrField, [{ value: '', label: '(없음)' }, ...fieldOpts], null);
        setOptions(clipField, [{ value: '', label: '(없음)' }, ...fieldOpts], null);
        for (const blk of [sliceColor, glyphColorBlk, streamColorBlk, isoColorBlk, rootView, clipView, thrView]) blk.setFieldOptions(fieldOpts);
        const sp = app.finestSpacing();
        stMeshW.set(sp * 0.5, sp * 0.05, sp * 4, sp * 0.05);
        const diag = Math.hypot(ds.bounds.max[0] - ds.bounds.min[0], ds.bounds.max[1] - ds.bounds.min[1], ds.bounds.max[2] - ds.bounds.min[2]);
        stLen.set(diag, diag * 0.01, diag * 3, diag * 0.01); // 기본 = 경계 대각선 (ParaView Maximum Streamline Length)
        stBoundsRow.hidden = app.levels.length <= 1;
        if (dsSel.value !== (app.currentId ?? '') && app.currentId) dsSel.value = app.currentId;
        lastSelId = undefined;
        if (pendingInitialLayer) {
          const first = app.layers.find((l) => l.type === pendingInitialLayer);
          if (first) { app.selectLayer(first.id); showTab(first.type); }
          pendingInitialLayer = null;
        }
      } else {
        dsInfo.innerHTML = '';
        dsInfo.append(el('span', 'v wide', '데이터가 없습니다.'));
      }
    }
    syncColorPage();

    // 보기 설정
    bld.input.checked = app.display.buildingsVisible;
    if (!isFocused(bldOp.input)) bldOp.set(app.display.buildingOpacity);
    grid.input.checked = app.display.gridVisible;
    legendSeg.value = app.display.legendSize;
    frameCheck.input.checked = app.display.planeFrame;

    // 레이어 화면
    const sel = app.selectedLayer();
    if (isLayerTab(activeTab) && (!sel || sel.type !== activeTab)) showTab(defaultTab);
    if ((sel?.id ?? null) !== lastSelId) {
      lastSelId = sel?.id ?? null;
      slShowHint.textContent = '';
      syncClipRanges(true); syncThrSliders(); syncSlicePos(); syncGlyphPos(); syncGlyphScale(true); syncSeedSlider(); syncIsoSlider();
    }
    if (sel) {
      const stats = app.layerStats(sel.id);
      const gridNote = !app.hasGrid ? '격자를 복원하지 못해 이 레이어를 계산할 수 없습니다.' : '';
      const statText = stats ? `${stats.detail} · ${fmtNum(stats.ms)} ms` : '';
      // 공통 두 줄('상위' · '적용 중인 Clip·Threshold')은 종류마다 하나씩 있으니 고른 노드의 것만 맞춘다
      const parents = { clip: clipParent, threshold: thrParent, slice: sliceParent, glyph: glyphParent, stream: streamParent, iso: isoParent };
      parents[sel.type].sync(sel);
      for (const h of heads) h.sync(sel);
      if (sel.type === 'clip') {
        const p = sel.params;
        clip.setOn(sel.visible);
        if (!isFocused(clipHead.name)) clipHead.name.value = sel.name;
        syncClipRanges(); // 데이터 범위·축·Field 가 바뀌었을 때만 슬라이더 범위를 다시 잡는다 (안에서 서명 비교)
        clipType.value = p.clipType;
        planeRows.hidden = p.clipType !== 'plane'; boxRows.hidden = p.clipType !== 'box'; scalarRows.hidden = p.clipType !== 'scalar';
        if (clipAxis.value !== String(p.axis)) clipAxis.value = String(p.axis) as AxisKey;
        if (!isFocused(clipPos.input)) clipPos.set(p.position);
        boxSliders.forEach((bs, a) => { if (!isFocused(bs.lo.input)) bs.lo.set(p.boxMin[a]); if (!isFocused(bs.hi.input)) bs.hi.set(p.boxMax[a]); });
        const cf = app.fieldByKey(p.fieldKey);
        const wantField = cf ? p.fieldKey! : ''; // Field 가 없으면 '(없음)' 을 보여 화면과 모델을 맞춘다
        if (clipField.value !== wantField) clipField.value = wantField;
        clipMappingRow.hidden = !cf || cf.kind !== 'vector';
        clipMapping.value = p.mapping;
        if (!isFocused(clipVal.input)) clipVal.set(p.value);
        clipInvert.input.checked = p.invert;
        clipInvertHint.textContent = clipInvertText(p);
        clipChildren.textContent = childrenText(sel);
        clipView.sync(statText);
        clip.summary.textContent = filterSummary(app, sel);
      } else if (sel.type === 'threshold') {
        const p = sel.params;
        thr.setOn(sel.visible);
        if (!isFocused(thrHead.name)) thrHead.name.value = sel.name;
        syncThrSliders(); // Field·Component·데이터가 바뀌었을 때만 범위를 다시 잡는다 (안에서 서명 비교)
        const f = app.fieldByKey(p.fieldKey);
        const want = f ? p.fieldKey! : ''; // Field 가 없거나 사라졌으면 '(없음)' 을 보여 화면과 모델을 맞춘다
        if (thrField.value !== want) thrField.value = want;
        thrMappingRow.hidden = !f || f.kind !== 'vector';
        thrMapping.value = p.mapping;
        thrMethod.value = p.method;
        thrMinRow.hidden = p.method === 'above'; thrMaxRow.hidden = p.method === 'below'; // ParaView XML Hints 와 같음
        if (!isFocused(thrMin.input)) thrMin.set(p.lower);
        if (!isFocused(thrMax.input)) thrMax.set(p.upper);
        thrAll.input.checked = p.allScalars;
        thrInvert.input.checked = p.invert;
        thrRuleHint.textContent = thrRuleText(p);
        thrFieldHint.textContent = f ? '' : 'Field 가 데이터에 없어 지금은 아무것도 거르지 않습니다. Field 를 고르세요.';
        thrChildren.textContent = childrenText(sel);
        thrView.sync(statText);
        thr.summary.textContent = filterSummary(app, sel);
      } else if (sel.type === 'slice') {
        const p = sel.params;
        slice.setOn(sel.visible);
        if (!isFocused(sliceHead.name)) sliceHead.name.value = sel.name;
        if (slAxis.value !== String(p.axis)) syncSlicePos();
        if (!isFocused(slPos.input)) slPos.set(p.position);
        slSurface.input.checked = p.surface;
        slLines.input.checked = p.lines;
        if (!isFocused(slLevels.input)) slLevels.set(p.levels);
        slRes.value = String(p.resolution) as '1' | '2';
        if (!isFocused(slOp.input)) slOp.set(p.opacity);
        slBanded.input.checked = p.banded;
        slClipObj.input.checked = p.clipToObjects;
        slClipObj.root.hidden = app.objects.list.length === 0;
        slLineColor.value = p.lineColor;
        if (!isFocused(slLineWidth.input)) slLineWidth.set(p.lineWidth);
        if (!isFocused(slLineOp.input)) slLineOp.set(p.lineOpacity);
        slLevelsRow.hidden = !(p.lines || p.banded);
        slLevelsLabel.textContent = p.lines ? 'Contour lines 개수' : '색 구간 수'; // 선이 꺼지고 단색 채움만 켜졌을 때는 구간 수로 읽힌다
        slOpRow.hidden = slBanded.root.hidden = !p.surface;
        slLineColorRow.hidden = slLineWidthRow.hidden = slLineOpRow.hidden = !p.lines;
        sliceColor.sync();
        slHint.textContent = gridNote || statText;
        slice.summary.textContent = `${'XYZ'[p.axis]} = ${fmtNum(p.position)} m`;
      } else if (sel.type === 'glyph') {
        const p = sel.params;
        glyph.setOn(sel.visible);
        if (!isFocused(glyphHead.name)) glyphHead.name.value = sel.name;
        if (glAxis.value !== String(p.axis)) syncGlyphPos();
        if (p.fieldName && glyphField.value !== p.fieldName) glyphField.value = p.fieldName;
        glMode.value = p.mode;
        glAxisRow.hidden = glPosRow.hidden = p.mode !== 'plane';
        glMaxRow.hidden = p.mode !== 'uniform';
        strideRow.hidden = p.mode === 'uniform';
        if (!isFocused(glPos.input)) glPos.set(p.position);
        if (!isFocused(glMax.input)) glMax.set(p.maxSamples);
        if (!isFocused(stride.input)) stride.set(p.stride);
        lenMode.value = p.lengthMode;
        syncGlyphScale();
        glyphColorBlk.sync();
        glyphInfo.textContent = statText;
        glyph.summary.textContent = stats ? `${fmtInt(stats.count)}개` : '';
      } else if (sel.type === 'stream') {
        const p = sel.params;
        stream.setOn(sel.visible);
        if (!isFocused(streamHead.name)) streamHead.name.value = sel.name;
        if (stAxis.value !== String(p.seedAxis) || stBounds.value !== p.seedBounds) { stBounds.value = p.seedBounds; syncSeedSlider(); }
        if (p.fieldName && stField.value !== p.fieldName) stField.value = p.fieldName;
        stBounds.value = p.seedBounds;
        if (!isFocused(stPos.input)) stPos.set(p.seedPos);
        if (!isFocused(stNU.input)) stNU.set(p.nU);
        if (!isFocused(stNV.input)) stNV.set(p.nV);
        if (!isFocused(stVF.input)) stVF.set(p.vFrac);
        stDir.value = p.direction;
        if (!isFocused(stLen.input)) stLen.set(p.maxLength);
        stShape.value = p.shape;
        const isLine = p.shape === 'line';
        stWidthRow.hidden = stUnitsRow.hidden = stDashRow.hidden = !isLine;
        stMeshWRow.hidden = isLine;
        stSidesRow.hidden = p.shape !== 'prism';
        stRibbonRow.hidden = p.shape !== 'ribbon';
        stSides.value = String(p.sides);
        stRibbon.value = p.ribbonDir;
        if (!isFocused(stMeshW.input)) stMeshW.set(p.meshWidth);
        stUnits.value = p.widthUnits;
        stDash.value = p.dash;
        if (!isFocused(stOpacity.input)) stOpacity.set(p.opacity);
        if (!isFocused(stWidth.input)) stWidth.set(p.width);
        streamColorBlk.sync();
        stInfo.textContent = gridNote || statText;
        stream.summary.textContent = stats ? `${fmtInt(stats.count)}개` : '';
      } else if (sel.type === 'iso') {
        const p = sel.params;
        iso.setOn(sel.visible);
        if (!isFocused(isoHead.name)) isoHead.name.value = sel.name;
        if (p.fieldKey && isoField.value !== p.fieldKey) { isoField.value = p.fieldKey; syncIsoSlider(); }
        if (!isFocused(isoVal.input)) isoVal.set(p.value);
        if (!isFocused(isoNum)) isoNum.value = fmtNum(p.value);
        if (!isFocused(isoOp.input)) isoOp.set(p.opacity);
        isoColorBlk.sync();
        isoInfo.textContent = gridNote || statText;
        iso.summary.textContent = fmtNum(p.value);
      }
    }

    // 형상 편집
    const one = app.objects.selectedOne();
    props.hidden = !one;
    if (one) {
      if (!isFocused(nameIn)) nameIn.value = one.name;
      for (let i = 0; i < 3; i++) {
        if (!isFocused(posIn[i])) posIn[i].value = fmtNum(one.position[i]);
        if (!isFocused(sizeIn[i])) sizeIn[i].value = fmtNum(one.size[i] * one.scale[i]);
      }
      if (!isFocused(rotIn)) rotIn.value = fmtNum(one.rotationZ);
    }
    undoBtn.disabled = !app.objects.canUndo;
    redoBtn.disabled = !app.objects.canRedo;
    const selCount = app.objects.selection.size;
    splitBtn.disabled = !app.objects.selectedObjects().some((o) => o.kind === 'mesh');
    mergeBtn.disabled = selCount < 2;
    toolSeg.value = app.editor.mode;
    snapCheck.input.checked = app.editor.snap;
    edit.summary.textContent = app.objects.list.length ? `${app.objects.list.length}개${selCount ? `, 선택 ${selCount}개` : ''}` : '';

    // 데이터의 '표시' (표현 방식)
    rootView.root.hidden = !ds;
    if (ds) {
      data.setOn(app.root.visible);
      const rs = app.layerStats(ROOT_ID);
      rootView.sync(rs ? `${rs.detail} · ${fmtNum(rs.ms)} ms` : '');
    }

    // 구획 제목 옆 상태 요약
    data.summary.textContent = ds ? `${fmtInt(ds.count)}개` : '';
    const maps = ds ? app.colorMapsInUse() : 0;
    color.summary.textContent = maps ? `색 지도 ${maps}개` : '';
  }
  app.subscribe(sync);
  app.editor.subscribe(sync);
  sync();
  return { showTab, activeTab: () => activeTab, onTabChange: (cb) => { tabListeners.push(cb); } };
}

/** 왼쪽 패널 맨 아래 상태 줄의 칩: 데이터(셀 수) · 보이는 노드마다 하나(Clip 1 셀 17,784 · Slice Y = 0.076 m …) · 격자 · fps */
export function mountStatusBar(app: AppCore, host: HTMLElement): void {
  const bar = el('div', 'statusbar');
  host.append(bar);
  const chip = (text: string, dim = false) => el('span', dim ? 'chip dim' : 'chip', text);
  // AppCore 는 fps 갱신으로 매초 emit 하므로, 칩 글의 서명(sig)이 같으면 DOM 을 다시 만들지 않는다(sceneTree.render 와 같은 방식).
  // fps 는 서명에서 빼고 마지막 dim 칩의 글만 따로 바꾼다.
  let lastSig = '';
  let fpsChip: HTMLElement | null = null;
  const fpsText = () => `격자 ${fmtNum(app.finestSpacing())} m${app.fps ? ` · ${app.fps} fps` : ''}`; // 헤드리스 캡처에서는 fps가 0이라 뺀다
  const draw = () => {
    const ds = app.dataset;
    const texts: string[] = [];
    if (ds) {
      texts.push(`셀 ${fmtInt(ds.count)}`);
      for (const l of app.layers) {
        if (!l.visible) continue;
        const st = app.layerStats(l.id);
        if (app.isFilterNode(l)) { // 볼륨 위 Clip·Threshold 노드는 남은 셀 수, 선·Glyph 위 Clip·Threshold 노드는 그린 개수, 면 위는 이름만 (면은 GPU 로 잘라 삼각형 수가 그대로다)
          const kind = app.outputKind(l.id);
          const what = !st || !st.count || kind === 'surface' ? '' : kind === 'volume' ? ` 셀 ${fmtInt(st.count)}` : ` ${fmtInt(st.count)}개`;
          texts.push(`${l.name}${what}`);
          continue;
        }
        const what = l.type === 'slice' ? `${'XYZ'[l.params.axis]} = ${fmtNum(l.params.position)} m`
          : l.type === 'iso' ? fmtNum(l.params.value)
          : st ? `${fmtInt(st.count)}개` : '';
        texts.push(`${LAYER_LABEL[l.type]} ${what}`);
      }
    }
    const sig = (ds ? 'ds' : app.loading || '데이터 없음') + '\n' + texts.join('\n');
    if (sig === lastSig) { if (fpsChip) fpsChip.textContent = fpsText(); return; }
    lastSig = sig;
    bar.innerHTML = '';
    fpsChip = null;
    if (!ds) { bar.append(chip(app.loading || '데이터 없음', true)); return; }
    for (const t of texts) bar.append(chip(t));
    fpsChip = chip(fpsText(), true);
    bar.append(fpsChip);
  };
  app.subscribe(draw);
  draw();
}

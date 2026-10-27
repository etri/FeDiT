// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   legend.ts

3D 화면 오른쪽 아래 Color 범례. 패널 하나에 항목이 세로로 쌓인다: 색 지도마다 하나(ParaView 와 같음) —
배열마다 하나인 공유 지도(그 배열로 칠하는 보이는 노드들) + Separate Color Map 을 쓰는 노드마다 하나.
면·선 위에 붙은 Clip·Threshold 는 입력 노드(Slice 등)의 색으로 그리므로 그 노드의 색칠을 따른다(AppCore.nodeSpec).
Field·성분·Colormap·Range·구간 수가 완전히 같은 항목은 하나로 합쳐 노드 이름만 나란히 적는다.
항목마다: 노드 이름(항목이 둘 이상일 때) / Field 이름 + 성분 [단위] / 가로 색 막대 / 최소·중간·최대.
Slice 가 면을 그리면서 "Contour lines 사이를 단색으로 채움"(구간형)이면 막대도 같은 구간 수로 끊어 그리고 경계선을 넣는다 —
화면의 색 띠와 범례의 칸이 일대일로 대응해 값을 읽기 쉽다.
그 항목의 보이는 노드 가운데 실제로 Volume 으로 그리는 것(AppCore.drawsVolume — 격자가 없어 점으로 대신 그리는 것은 빼고)이 있으면 막대를 조금 높이고 그 지도의 Opacity 곡선을 막대 위에 옅은 선으로 겹친다
(막대 아래 끝 = Opacity 0, 위 끝 = 1) — 화면의 진하기를 값으로 읽게. 우리 고유(ParaView 범례에는 없음).
*/
/******************************************************************************/
import { AppCore, ColorState, ROOT_ID } from '../core/AppCore';
import { Layer } from '../core/layers';
import { OpacityCurve, colormapCss } from '../utils/colormap';
import { el, fmtRangeValue } from './dom';

/** curve: 그 지도로 Volume 을 그리는 보이는 노드가 있으면 그 지도의 Opacity 곡선 (막대 위에 겹친다), 없으면 null */
interface Entry { layers: string[]; name: string; sub: string; spec: ColorState; bands: number; curve: OpacityCurve | null }
const SVG_NS = 'http://www.w3.org/2000/svg';

const MAX_ENTRIES = 4; // 너무 많으면 화면을 가리므로

/** 구간형(색 띠)으로 면을 그리는 Slice 면 구간 수, 아니면 0 */
const bandsOf = (l: Layer): number => (l.type === 'slice' && l.params.banded && l.params.surface ? l.params.levels + 1 : 0); // Contour lines n개 → 구간 n+1개

export function mountLegend(app: AppCore, host: HTMLElement): void {
  const root = el('div', 'legend-panel');
  host.append(root);
  let lastSig = '';

  const subOf = (spec: ColorState): string => {
    const f = app.fieldByKey(spec.fieldKey);
    const mapName = f?.kind === 'vector' ? (spec.mapping === 'magnitude' ? '크기' : `${spec.mapping.toUpperCase()} 성분`) : '';
    const unit = app.unitFor(spec.fieldKey);
    return [mapName, unit ? `[${unit}]` : ''].filter(Boolean).join(' ');
  };
  const keyOf = (s: ColorState, bands: number, curve: OpacityCurve | null) =>
    `${s.fieldKey}|${s.mapping}|${s.colormap}|${s.rangeMin}|${s.rangeMax}|${bands}|${curve ? curve.map((p) => p.join(':')).join(' ') : ''}`;

  const nodeName = (id: string) => (id === ROOT_ID ? '데이터' : app.layerById(id)?.name ?? id);

  const entries = (): Entry[] => {
    // 보이는 노드 가운데 값으로 칠하는 것을 색 지도별로 모은다: 공유 지도는 배열, Separate 는 색칠 주인 노드(볼륨 노드는 자기, 그 밖은 모양을 만든 노드)
    const groups = new Map<string, Entry>();
    for (const id of [ROOT_ID, ...app.layers.map((l) => l.id)]) {
      if (!app.nodeVisible(id)) continue;
      const spec = app.nodeSpec(id);
      const c = app.coloringOf(id);
      const f = spec && app.fieldByKey(spec.fieldKey);
      if (!spec || !c || !f) continue;
      const src = app.nodeView(id) ? null : app.sourceOf(id);
      const key = c.separate ? `sep:${src?.id ?? id}` : `field:${c.fieldKey}`;
      // 공유 지도를 쓰는 Slice 가운데 구간형이 있으면 막대도 그 구간 수로 끊는다 (같은 지도의 연속 색도 이 막대로 읽는 데 지장이 없다)
      const bands = src ? bandsOf(src) : 0;
      const curve = app.drawsVolume(id) ? spec.opacity : null; // 한 항목은 한 지도라 곡선도 하나. 격자가 없어 점으로 대신 그리면 곡선이 쓰이지 않으므로 겹치지 않는다
      const g = groups.get(key);
      if (g) { g.layers.push(nodeName(id)); if (!g.bands) g.bands = bands; if (!g.curve) g.curve = curve; }
      else groups.set(key, { layers: [nodeName(id)], name: f.name, sub: subOf(spec), spec, bands, curve });
    }
    // 그림이 같은 항목(배열·성분·Colormap·범위·구간·겹칠 Opacity 곡선)은 하나로
    const out: Entry[] = [];
    for (const e of groups.values()) {
      const same = out.find((o) => keyOf(o.spec, o.bands, o.curve) === keyOf(e.spec, e.bands, e.curve));
      if (same) same.layers.push(...e.layers); else out.push(e);
    }
    return out.slice(0, MAX_ENTRIES);
  };

  const draw = () => {
    const size = app.display.legendSize;
    const list = size === 'off' ? [] : entries();
    root.hidden = list.length === 0;
    root.className = `legend-panel legend-${size}`;
    const sig = list.map((e) => `${e.layers.join(',')}|${e.name}|${e.sub}|${keyOf(e.spec, e.bands, e.curve)}`).join('\n') + size;
    if (sig === lastSig) return;
    lastSig = sig;
    root.innerHTML = '';
    for (const e of list) {
      const item = el('div', 'legend-item');
      // 항목이 하나뿐이면 누가 쓰는지 줄은 군더더기라 뺀다
      if (list.length > 1) item.append(el('div', 'legend-layer', e.layers.join(' · ')));
      const head = el('div', 'legend-head');
      head.append(el('span', 'legend-name', e.name));
      if (e.sub) head.append(el('span', 'legend-sub', e.sub));
      const bar = el('canvas', 'legend-bar');
      bar.width = 512; bar.height = 1;
      const ctx = bar.getContext('2d')!;
      for (let x = 0; x < bar.width; x++) {
        let t = x / (bar.width - 1);
        if (e.bands > 0) t = (Math.min(e.bands - 1, Math.floor(t * e.bands)) + 0.5) / e.bands; // 화면의 색 띠와 같은 식
        ctx.fillStyle = colormapCss(e.spec.colormap, t);
        ctx.fillRect(x, 0, 1, 1);
      }
      const wrap = el('div', 'legend-barwrap');
      wrap.append(bar);
      if (e.bands > 0) {
        const lines = el('div', 'legend-bands');
        lines.style.setProperty('--n', String(e.bands));
        wrap.append(lines);
      }
      if (e.curve) { // Volume 이 쓰는 지도: Opacity 곡선을 막대 위에 (가로 = 범위, 세로 = Opacity 0~1)
        wrap.classList.add('has-opacity');
        const svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('class', 'legend-opacity');
        svg.setAttribute('viewBox', '0 0 100 10');
        svg.setAttribute('preserveAspectRatio', 'none');
        const pts = e.curve.map(([x, y]) => `${(x * 100).toFixed(2)},${(10 - y * 10).toFixed(2)}`).join(' ');
        for (const cls of ['halo', 'line']) { // 밝은 테두리 위에 어두운 선 — 어떤 Preset 색 위에서도 보이게
          const pl = document.createElementNS(SVG_NS, 'polyline');
          pl.setAttribute('class', cls);
          pl.setAttribute('points', pts);
          svg.append(pl);
        }
        wrap.append(svg);
      }
      const ticks = el('div', 'legend-ticks');
      const span = e.spec.rangeMax - e.spec.rangeMin;
      ticks.append(el('span', undefined, fmtRangeValue(e.spec.rangeMin, span)), el('span', undefined, fmtRangeValue((e.spec.rangeMin + e.spec.rangeMax) / 2, span)), el('span', undefined, fmtRangeValue(e.spec.rangeMax, span)));
      item.append(head, wrap, ticks);
      root.append(item);
    }
  };
  app.subscribe(draw);
  draw();
}

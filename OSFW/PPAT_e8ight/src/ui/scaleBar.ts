// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   scaleBar.ts

축척 막대. 직교 투영에서는 화면 어디서나 1픽셀이 같은 길이이므로 "이 막대 = 50 m" 같은 기준을 그릴 수 있다.
원근 투영에서는 거리마다 길이가 달라 축척이 성립하지 않으므로 숨긴다.
막대 길이는 1·2·5 × 10^n m 가운데 화면에서 80~160px쯤 되는 값을 고른다.
*/
/******************************************************************************/
import { AppCore } from '../core/AppCore';
import { el } from './dom';

const TARGET_PX = 120;

function niceLength(raw: number): number {
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const m = raw / p;
  return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
}

function formatLength(m: number): string {
  if (m >= 1000) return `${+(m / 1000).toPrecision(3)} km`;
  if (m >= 1) return `${+m.toPrecision(3)} m`;
  if (m >= 0.01) return `${+(m * 100).toPrecision(3)} cm`;
  return `${+(m * 1000).toPrecision(3)} mm`;
}

export function mountScaleBar(app: AppCore, host: HTMLElement): void {
  const root = el('div', 'scalebar');
  const bar = el('div', 'scalebar-bar');
  const label = el('div', 'scalebar-label');
  root.append(bar, label);
  root.hidden = true;
  host.append(root);
  let last = -1;

  const tick = () => {
    const mpp = app.dataset ? app.metersPerPixel() : null;
    if (mpp === null || !(mpp > 0)) {
      if (!root.hidden) { root.hidden = true; last = -1; }
    } else if (Math.abs(mpp - last) > last * 0.002) {
      last = mpp;
      const length = niceLength(TARGET_PX * mpp);
      bar.style.width = `${(length / mpp).toFixed(1)}px`;
      label.textContent = formatLength(length);
      root.hidden = false;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

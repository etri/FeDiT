// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   timeBar.ts

3D 화면 맨 아래 줄(.vp-dock)의 재생 막대. 결과 폴더·ZIP처럼 저장 시점이 여러 개일 때만 보인다:
[재생/일시 정지] [저장 시점 슬라이더] [시각 글자] [n / N] [초당 장수]
자리(범례 왼쪽까지, 좁으면 범례 아래 줄 전체)는 .vp-dock 의 flex 배치가 정하고, 여기서는 자기 폭이 좁을 때 장수 표시·속도 칸을 숨기기만 한다.
데이터 구획 안에 묻혀 있던 시간축을 꺼낸 것이다. 동작은 AppCore의 setStep/play/pause/setPlayFps 그대로.
*/
/******************************************************************************/
import { AppCore } from '../core/AppCore';
import { el, select, slider } from './dom';
import { icon } from './icons';

export function mountTimeBar(app: AppCore, host: HTMLElement): void {
  const viewport = host.closest<HTMLElement>('.viewport') ?? host;
  const bar = el('div', 'timebar');
  bar.hidden = true;

  const playBtn = el('button', 'btn btn-primary timebar-play');
  playBtn.type = 'button';
  playBtn.append(icon('play'));
  playBtn.title = '재생 (Space)';
  playBtn.addEventListener('click', () => app.togglePlay());

  const sl = slider({ min: 0, max: 1, step: 1, value: 0, format: (v) => app.stepLabelAt(v) || String(v) }, (v) => { void app.setStep(v); });
  sl.input.classList.add('timebar-slider');
  sl.input.title = '저장 시점';
  const label = el('span', 'timebar-time', '');
  const count = el('span', 'timebar-count', '');
  const fps = select<string>([{ value: '1', label: '초당 1장' }, { value: '2', label: '초당 2장' }, { value: '4', label: '초당 4장' }, { value: '8', label: '초당 8장' }], '4', (v) => app.setPlayFps(Number(v)));
  fps.classList.add('timebar-fps');
  fps.title = '재생 속도';
  bar.append(playBtn, sl.input, label, count, fps);
  host.append(bar);

  // 막대가 좁으면 장수 표시·속도 칸을 숨긴다 (폭은 창 크기·범례 폭에 따라 flex 가 정한다)
  const fit = () => { if (!bar.hidden) bar.classList.toggle('compact', bar.getBoundingClientRect().width < 380); };
  new ResizeObserver(fit).observe(bar);

  // 3D 화면에 초점이 있을 때 Space로 재생/정지 (입력 칸에서는 제외)
  window.addEventListener('keydown', (e) => {
    if (e.key !== ' ' || bar.hidden) return;
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
    if (t instanceof Element && t.closest('button, [role="button"], [role="menuitem"]')) return; // 단추에 초점이 있으면 Space 는 그 단추를 누른다 (브라우저 기본)
    e.preventDefault();
    app.togglePlay();
  });

  const draw = () => {
    const on = !!app.series && app.stepCount() > 1;
    bar.hidden = !on;
    viewport.classList.toggle('has-timebar', on);
    if (!on) return;
    const n = app.stepCount();
    if (document.activeElement !== sl.input) sl.set(app.stepIndex, 0, n - 1, 1);
    label.textContent = app.stepLabelAt(app.stepIndex);
    count.textContent = `${app.stepIndex + 1} / ${n}`;
    playBtn.replaceChildren(icon(app.playing ? 'pause' : 'play'));
    playBtn.title = app.playing ? '일시 정지 (Space)' : '재생 (Space)';
    playBtn.classList.toggle('btn-primary', !app.playing);
    if (fps.value !== String(app.playFps)) fps.value = String(app.playFps);
    fit();
  };
  app.subscribe(draw);
  draw();
}

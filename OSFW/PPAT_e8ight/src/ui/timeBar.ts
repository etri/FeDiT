// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   timeBar.ts

3D 화면 맨 아래 줄(.vp-dock)의 재생 막대. 결과 폴더·ZIP처럼 저장 시점이 여러 개일 때만 보인다:
[재생/일시 정지] [저장 시점 슬라이더] [시각 글자] [읽기 진행 원] [n / N] [초당 장수] [반복 재생]
반복 재생은 ParaView 의 Loop 와 같이 처음에 꺼져 있고, 꺼져 있으면 마지막 장면에서 멈춘다(core/playStep.ts, 2026-11-06 사용자 요청).
자리(범례 왼쪽까지, 좁으면 범례 아래 줄 전체)는 .vp-dock 의 flex 배치가 정하고, 여기서는 자기 폭이 좁을 때 장수 표시·속도 칸을 숨기기만 한다.
데이터 구획 안에 묻혀 있던 시간축을 꺼낸 것이다. 동작은 AppCore의 setStep/play/pause/setPlayFps 그대로.
저장 시점을 읽는 동안 3D 화면은 덮지 않는다(2026-11-05 사용자: 재생 중 읽기 덮개가 번쩍임). 읽기가 300 ms 넘게 걸릴 때만 시각 글 옆에 작은 진행 원
(읽은 배열 바이트만큼 채움, 모르거나 아직 0 이면 도는 원)을 띄우고 끝나면 내린다 — 재생 중에는 다음 장면 읽기가 곧 이어지므로 재생 간격만큼 더 두어
장면마다 깜빡이지 않게 한다. 슬라이더 트랙에는 읽어 둔(캐시에 있는) 장면을 옅은 띠로 보인다 — 동영상의 버퍼 표시처럼.
계산(언제 보일지 · 띠 구간)은 timeBarModel.ts, 상태는 AppCore.stepLoad · cachedStepIndices(subscribeSteps 로 바뀔 때만 온다).
*/
/******************************************************************************/
import { AppCore } from '../core/AppCore';
import { el, select, slider } from './dom';
import { icon } from './icons';
import { LoadRing, STEP_LOAD_LINGER_EXTRA_MS, bufferGradient, bufferedRuns } from './timeBarModel';

const SVG_NS = 'http://www.w3.org/2000/svg';
/** 진행 원 반지름 (viewBox 16 × 16) — 둘레가 채움 길이의 기준 */
const RING_R = 6;
const RING_C = 2 * Math.PI * RING_R;

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
  // 저장 시점 읽기 진행 원. 자리는 늘 차지한다(보이고 숨을 때 슬라이더 폭이 바뀌어 손잡이가 움직이지 않게) — 숨김은 투명도로
  const load = el('span', 'timebar-load');
  const ring = document.createElementNS(SVG_NS, 'svg');
  ring.setAttribute('viewBox', '0 0 16 16');
  ring.setAttribute('aria-hidden', 'true');
  const ringCircle = (cls: string) => {
    const c = document.createElementNS(SVG_NS, 'circle');
    c.setAttribute('class', cls); c.setAttribute('cx', '8'); c.setAttribute('cy', '8'); c.setAttribute('r', String(RING_R));
    return c;
  };
  const arc = ringCircle('arc');
  arc.setAttribute('stroke-dasharray', String(RING_C));
  arc.setAttribute('stroke-dashoffset', String(RING_C));
  ring.append(ringCircle('track'), arc);
  load.append(ring);
  // 화면 읽기 프로그램용 글: 진행 원이 보이기 시작할 때 '장면 읽는 중' 한 번 (시각 · 진행 % 는 자주 바뀌므로 풍선 도움말에만 — 재생 중 장면마다 말하지 않게)
  const loadText = el('span', 'sr-only');
  loadText.setAttribute('aria-live', 'polite');
  // 반복 재생 켜기·끄기. 켜짐은 눌린 모양(aria-pressed)과 강조색으로 보인다 — 막대가 좁아도 숨기지 않는다
  const loopBtn = el('button', 'btn timebar-loop');
  loopBtn.type = 'button';
  loopBtn.setAttribute('aria-label', '반복 재생');
  loopBtn.append(icon('repeat'));
  loopBtn.addEventListener('click', () => app.setLoopPlay(!app.loopPlay));
  bar.append(playBtn, sl.input, label, load, count, fps, loopBtn, loadText);
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

  // 진행 원: 읽기가 300 ms 넘게 걸릴 때만 보이고(그 전에는 그 시각에 다시 본다) 끝나면 내린다 — 재생 중에는 재생 간격 + 여유만큼 다 채운 채로 두고
  // 그 사이 다음 읽기가 시작되면 이어 보인다(LoadRing). 보이는 동안 채움 · 풍선 도움말을 고친다
  let loadTimer: number | null = null;
  const loadRing = new LoadRing();
  const drawLoad = () => {
    if (loadTimer !== null) { clearTimeout(loadTimer); loadTimer = null; }
    const s = bar.hidden ? null : app.stepLoad;
    const linger = !bar.hidden && app.playing ? 1000 / app.playFps + STEP_LOAD_LINGER_EXTRA_MS : 0;
    const f = loadRing.update(s, performance.now(), linger);
    if (f.recheckIn > 0) loadTimer = window.setTimeout(drawLoad, f.recheckIn);
    if (!f.show) {
      if (load.classList.contains('on')) {
        load.classList.remove('on', 'spin');
        load.removeAttribute('title');
        loadText.textContent = '';
      }
      return;
    }
    const offset = String(RING_C * (1 - (f.fraction ?? 0.25))); // 모르면 4분의 1 호가 돈다
    if (f.snap) {
      // 새로 보임 · 기다리는 시점이 바뀜 · 도는 원 ↔ 채움: 지난 채움에서 거꾸로 감기는 것이 보이지 않게 움직임 없이 바로 맞춘다
      arc.style.transition = 'none';
      arc.setAttribute('stroke-dashoffset', offset);
      void arc.getBoundingClientRect();
      arc.style.transition = '';
    } else arc.setAttribute('stroke-dashoffset', offset);
    if (f.appeared) loadText.textContent = '장면 읽는 중';
    load.classList.add('on');
    load.classList.toggle('spin', f.fraction === null);
    if (s) load.title = f.fraction === null ? `${s.label} 읽는 중` : `${s.label} 읽는 중 · ${Math.round(f.fraction * 100)}%`;
  };

  // 읽어 둔 장면 띠: 캐시 목록이 바뀔 때(subscribeSteps)와 시간축이 바뀔 때만 다시 그린다 (구간이 같으면 그대로)
  let bufSig = '';
  let bufSeries: unknown = undefined;
  const drawBuffer = () => {
    const n = app.stepCount();
    const runs = n > 1 ? bufferedRuns(app.cachedStepIndices(), n) : [];
    const sig = `${n}:${runs.map((r) => `${r[0]}-${r[1]}`).join(',')}`;
    if (sig === bufSig) return;
    bufSig = sig;
    sl.input.style.setProperty('--buf', bufferGradient(runs, n, 'var(--track-buffered)'));
  };
  app.subscribeSteps(() => { drawLoad(); drawBuffer(); });

  // 재생 중에는 화면 갱신(emit)이 1초에 여러 번 온다. 그때마다 단추 속 아이콘을 새로 끼우면 누르는 사이 아이콘이 바뀌어
  // 브라우저가 클릭을 놓친다(한 번 눌러서 안 멈춤, 2026-11-05) → 재생·정지 상태가 바뀔 때만 아이콘을 바꾼다
  let shownPlaying: boolean | null = null;
  let shownLoop: boolean | null = null;
  const draw = () => {
    if (shownLoop !== app.loopPlay) {
      shownLoop = app.loopPlay;
      loopBtn.setAttribute('aria-pressed', String(app.loopPlay));
      loopBtn.title = app.loopPlay ? '반복 재생 켜짐' : '반복 재생 꺼짐';
    }
    const on = !!app.series && app.stepCount() > 1;
    bar.hidden = !on;
    viewport.classList.toggle('has-timebar', on);
    if (app.series !== bufSeries) { bufSeries = app.series; drawBuffer(); }
    if (!on) { if (load.classList.contains('on')) drawLoad(); return; }
    const n = app.stepCount();
    if (document.activeElement !== sl.input) sl.set(app.stepIndex, 0, n - 1, 1);
    label.textContent = app.stepLabelAt(app.stepIndex);
    count.textContent = `${app.stepIndex + 1} / ${n}`;
    if (shownPlaying !== app.playing) {
      shownPlaying = app.playing;
      playBtn.replaceChildren(icon(app.playing ? 'pause' : 'play'));
      playBtn.title = app.playing ? '일시 정지 (Space)' : '재생 (Space)';
      playBtn.setAttribute('aria-label', app.playing ? '일시 정지' : '재생');
      playBtn.classList.toggle('btn-primary', !app.playing);
    }
    if (fps.value !== String(app.playFps)) fps.value = String(app.playFps);
    fit();
  };
  app.subscribe(draw);
  draw();
}

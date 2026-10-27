// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   dom.ts

패널을 만드는 작은 DOM 도우미 = 디자인 시스템의 부품 층. (자사 후처리기는 React지만, 이 시제품은 프레임워크 없이 만든다.)
모양은 components.css, 값은 tokens.css, 아이콘은 icons.ts가 맡는다. 이모지는 쓰지 않는다.
- section: 접히는 구획. 제목 옆 상태 요약, 필요하면 켜기/끄기 스위치.
- row/slider: 라벨 + 조작 요소. 슬라이더는 라벨·값을 위에, 채워지는 막대를 아래에.
- segmented: 선택지가 몇 개 안 될 때 나란히 붙은 버튼.
*/
/******************************************************************************/
import { icon, IconName } from './icons';

export function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

export interface Section {
  root: HTMLElement;
  body: HTMLElement;
  /** 제목 오른쪽의 짧은 상태 글 (접혀 있어도 보인다) */
  summary: HTMLElement;
  /** onToggle을 주면 제목 줄에 켜기/끄기 스위치가 생긴다 */
  toggle: HTMLInputElement | null;
  /** 스위치 상태와 아이콘 강조를 함께 맞춘다 */
  setOn(on: boolean): void;
  /** 제목 옆에 물음표를 단다 — 그 화면이 무엇이고 어떻게 쓰는지 (줄 글로 늘어놓지 않는다) */
  setHelp(text: string | string[]): void;
}

export function section(iconName: IconName, title: string, onToggle?: (on: boolean) => void): Section {
  const root = el('section', 'sec');
  const head = el('div', 'sec-head');
  head.setAttribute('role', 'button');
  head.tabIndex = 0;
  const summary = el('span', 'sec-summary');
  head.append(icon(iconName), el('span', 'sec-title', title), summary);
  let toggle: HTMLInputElement | null = null;
  if (onToggle) {
    const sw = el('label', 'switch');
    toggle = el('input');
    toggle.type = 'checkbox';
    toggle.addEventListener('change', () => { root.classList.toggle('on', toggle!.checked); onToggle(toggle!.checked); });
    sw.append(toggle, el('span', 'switch-track'));
    sw.addEventListener('click', (e) => e.stopPropagation()); // 스위치를 눌러도 구획이 접히지 않게
    head.append(sw);
  }
  head.append(icon('chevron', 'sec-chevron'));
  const body = el('div', 'sec-body');
  const flip = () => { if (!root.classList.contains('page')) root.classList.toggle('collapsed'); };
  head.addEventListener('click', flip);
  head.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } });
  root.append(head, body);
  let helpBtn: HTMLElement | null = null;
  return {
    root, body, summary, toggle,
    setOn(on) { if (toggle) toggle.checked = on; root.classList.toggle('on', on); },
    setHelp(text) { helpBtn?.remove(); helpBtn = help(text); head.insertBefore(helpBtn, summary); },
  };
}

// ---- 도움말: 물음표에 마우스를 올리거나 누르면 뜨는 설명 창 ----
// 설명 글(그 기능이 무엇이고 어떻게 쓰는지)은 화면에 줄 글로 늘어놓지 않고 여기에 둔다. 지금 상태·결과·오류를 알리는 한 줄(.hint)만 화면에 남긴다.
// 창은 하나를 body 에 두고 돌려쓴다(position: fixed) — 패널 안에 두면 패널의 overflow 에 잘린다.
let helpPop: HTMLElement | null = null;
let helpFor: HTMLElement | null = null; // 지금 설명을 띄운 물음표
let helpPinned = false;                 // 눌러서 고정했는지 (올려서 뜬 것은 마우스를 떼면 닫힌다)
let helpWatch = 0;                      // 떠 있는 동안 물음표가 아직 보이는지 살피는 타이머

function closeHelp(): void {
  if (!helpPop || !helpFor) return;
  helpPop.hidden = true;
  helpFor.setAttribute('aria-expanded', 'false');
  helpFor = null;
  helpPinned = false;
  window.clearInterval(helpWatch);
}

/**
 * 물음표 바로 아래에 놓는다. 아래 자리가 모자라면 위로, 둘 다 모자라면 넓은 쪽에 높이를 줄여(안에서 스크롤) — 물음표를 덮지 않는다
 * (덮으면 마우스가 창 위에 놓여 닫힘·열림이 되풀이된다). 물음표가 더는 보이지 않으면 닫는다: 화면 전환·다시 그리기로 사라졌거나,
 * 패널의 스크롤 영역 밖으로 밀렸거나, 붙박이 제목 줄(.sec-head) 밑으로 들어간 경우.
 */
function placeHelp(): void {
  if (!helpPop || !helpFor) return;
  const r = helpFor.getBoundingClientRect();
  let visTop = 0, visBottom = window.innerHeight;
  const clip = helpFor.closest('.panel-body')?.getBoundingClientRect();
  if (clip) { visTop = Math.max(visTop, clip.top); visBottom = Math.min(visBottom, clip.bottom); }
  if (helpFor.closest('.sec-body')) { // 제목 줄 안의 물음표(Section.setHelp)는 제목 줄에 가려지지 않는다
    const head = helpFor.closest('.sec')?.querySelector('.sec-head');
    if (head) visTop = Math.max(visTop, head.getBoundingClientRect().bottom);
  }
  if (!helpFor.isConnected || r.width === 0 || r.bottom <= visTop || r.top >= visBottom) { closeHelp(); return; }
  helpPop.style.maxHeight = '';
  const w = helpPop.offsetWidth, h = helpPop.offsetHeight, m = 8, gap = 6;
  const left = Math.max(m, Math.min(r.left - 10, window.innerWidth - w - m));
  const roomBelow = window.innerHeight - m - (r.bottom + gap), roomAbove = r.top - gap - m;
  let top: number;
  if (h <= roomBelow) top = r.bottom + gap;
  else if (h <= roomAbove) top = r.top - gap - h;
  else if (roomBelow >= roomAbove) { helpPop.style.maxHeight = `${Math.max(40, roomBelow)}px`; top = r.bottom + gap; }
  else { helpPop.style.maxHeight = `${Math.max(40, roomAbove)}px`; top = m; }
  helpPop.style.left = `${Math.round(left)}px`;
  helpPop.style.top = `${Math.round(top)}px`;
}

function openHelp(btn: HTMLElement, lines: string[], pinned: boolean): void {
  if (!helpPop) {
    helpPop = el('div', 'help-pop');
    helpPop.id = 'help-pop';
    helpPop.setAttribute('role', 'tooltip');
    document.body.append(helpPop);
    // 바깥을 누르거나 Esc 면 닫고, 스크롤·창 크기가 바뀌면 자리를 다시 잡는다.
    // Esc 는 창이 떠 있을 때만, 다른 단축키(형상 편집의 선택 풀기 등)보다 먼저 받아 여기서 끝낸다 — 설명 창만 닫히게
    document.addEventListener('pointerdown', (e) => { const t = e.target as Node; if (helpFor && !helpFor.contains(t) && !helpPop!.contains(t)) closeHelp(); }, true);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && helpFor) { closeHelp(); e.stopPropagation(); } }, true);
    window.addEventListener('scroll', placeHelp, true);
    window.addEventListener('resize', placeHelp);
  }
  if (helpFor && helpFor !== btn) helpFor.setAttribute('aria-expanded', 'false');
  helpPop.replaceChildren(...lines.map((t) => el('p', undefined, t)));
  helpPop.hidden = false;
  helpFor = btn;
  helpPinned = pinned;
  btn.setAttribute('aria-expanded', 'true');
  placeHelp();
  // 떠 있는 동안 물음표가 사라지거나 가려지면(화면 전환, 구획을 다시 그림, 스크롤 이벤트 없는 자리 이동) 닫는다
  window.clearInterval(helpWatch);
  if (helpFor) helpWatch = window.setInterval(placeHelp, 250);
}

/**
 * 물음표 하나. 마우스를 올리거나 초점이 가면 설명이 뜨고(떼면 닫힘), 누르면 고정된다(다시 누르거나 바깥을 누르거나 Esc 로 닫음).
 * <button> 이 아니라 role="button" 인 span 이다 — 라벨(<label>) 안에 넣어도 라벨 글을 누를 때 대신 눌리지 않게.
 * 구획 머리·체크 라벨 안에서 눌러도 접기·체크가 일어나지 않게 이벤트를 여기서 끊는다.
 */
export function help(text: string | string[]): HTMLElement {
  const lines = Array.isArray(text) ? text : [text];
  const btn = el('span', 'help');
  btn.setAttribute('role', 'button');
  btn.tabIndex = 0;
  btn.setAttribute('aria-label', '설명 보기');
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-description', lines.join(' ')); // 설명 창은 하나를 돌려쓰므로 글은 물음표마다 따로 단다
  btn.append(icon('help'));
  const toggle = () => { if (helpFor === btn && helpPinned) closeHelp(); else openHelp(btn, lines, true); };
  btn.addEventListener('mouseenter', () => { if (helpFor !== btn) openHelp(btn, lines, false); });
  btn.addEventListener('mouseleave', () => { if (helpFor === btn && !helpPinned) closeHelp(); });
  // 마우스로 눌렀을 때는 초점을 옮기지 않는다 — 초점이 남으면 Space(재생/정지) 같은 단축키가 이 물음표로 가고, 창으로 돌아올 때 설명이 저절로 다시 뜬다
  btn.addEventListener('mousedown', (e) => e.preventDefault());
  btn.addEventListener('focus', () => { if (helpFor !== btn && btn.matches(':focus-visible')) openHelp(btn, lines, false); }); // 키보드로 옮겨 왔을 때만
  btn.addEventListener('blur', () => { if (helpFor === btn && !helpPinned) closeHelp(); });
  btn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); toggle(); });
  btn.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault(); e.stopPropagation();
    toggle();
  });
  return btn;
}

/** 줄(row)·체크·소제목의 이름 옆에 물음표를 단다. 줄이면 그 라벨에, 아니면 그 요소 끝에 */
export function withHelp<T extends HTMLElement>(target: T, text: string | string[]): T {
  const label = target.querySelector<HTMLElement>('.row-label, .field-label') ?? target;
  label.classList.add('has-help');
  label.append(help(text));
  return target;
}

/** 라벨 + 조작 요소 한 줄. 슬라이더는 라벨·값을 위에, 슬라이더를 아래에 놓는다. */
export function row(label: string, control: HTMLElement, value?: HTMLElement): HTMLElement {
  if (control instanceof HTMLInputElement && control.type === 'range') {
    const r = el('div', 'field');
    const head = el('div', 'field-head');
    head.append(el('label', 'field-label', label));
    if (value) head.append(value);
    r.append(head, control);
    return r;
  }
  const r = el('div', value ? 'row has-value' : 'row');
  r.append(el('label', 'row-label', label), control);
  if (value) r.append(value);
  return r;
}

export interface SliderOpts {
  min: number; max: number; step: number; value: number;
  format?: (v: number) => string;
  commit?: boolean; // true면 손을 뗄 때(change) 적용 — 계산이 무거운 항목용
}

export function slider(opts: SliderOpts, onInput: (v: number) => void): { input: HTMLInputElement; value: HTMLSpanElement; set(v: number, min?: number, max?: number, step?: number): void } {
  const input = el('input');
  input.type = 'range';
  input.min = String(opts.min); input.max = String(opts.max); input.step = String(opts.step); input.value = String(opts.value);
  const value = el('span', 'row-value');
  const fmt = opts.format ?? ((v: number) => fmtNum(v));
  // 채워진 구간(--p)을 값에 맞춘다
  const paint = () => {
    const lo = Number(input.min), hi = Number(input.max), v = Number(input.value);
    const p = hi > lo ? Math.min(100, Math.max(0, ((v - lo) / (hi - lo)) * 100)) : 0;
    input.style.setProperty('--p', `${p.toFixed(2)}%`);
    value.textContent = fmt(v);
  };
  paint();
  input.addEventListener('input', () => { paint(); if (!opts.commit) onInput(Number(input.value)); });
  if (opts.commit) input.addEventListener('change', () => onInput(Number(input.value)));
  return {
    input, value,
    set(v, min, max, step) {
      if (min !== undefined) input.min = String(min);
      if (max !== undefined) input.max = String(max);
      if (step !== undefined) input.step = String(step);
      input.value = String(v);
      paint();
    },
  };
}

export function select<T extends string>(options: { value: T; label: string }[], value: T | null, onChange: (v: T) => void): HTMLSelectElement {
  const s = el('select');
  setOptions(s, options, value);
  s.addEventListener('change', () => onChange(s.value as T));
  return s;
}

export function setOptions<T extends string>(s: HTMLSelectElement, options: { value: T; label: string }[], value: T | null): void {
  s.innerHTML = '';
  for (const o of options) {
    const opt = el('option'); opt.value = o.value; opt.textContent = o.label; s.append(opt);
  }
  if (value !== null) s.value = value;
}

export interface SegOption<T extends string> { value: T; label: string; icon?: IconName }
export interface Segmented<T extends string> { root: HTMLElement; value: T; set(v: T): void }

/** 나란히 붙은 선택 버튼. repeat가 true면 이미 눌린 것을 다시 눌러도 onChange를 부른다 (시점 버튼용). */
export function segmented<T extends string>(options: SegOption<T>[], value: T, onChange: (v: T) => void, repeat = false): Segmented<T> {
  const root = el('div', 'seg');
  root.setAttribute('role', 'group');
  const buttons = new Map<T, HTMLButtonElement>();
  let current = value;
  const paint = () => { for (const [v, b] of buttons) b.setAttribute('aria-pressed', String(v === current)); };
  for (const o of options) {
    const b = el('button', 'seg-btn');
    b.type = 'button';
    if (o.icon) b.append(icon(o.icon));
    b.append(el('span', undefined, o.label));
    b.addEventListener('click', () => {
      const same = o.value === current;
      current = o.value; paint();
      if (!same || repeat) onChange(o.value);
    });
    buttons.set(o.value, b);
    root.append(b);
  }
  paint();
  return {
    root,
    get value() { return current; },
    set value(v: T) { current = v; paint(); },
    set(v: T) { current = v; paint(); },
  };
}

export function checkbox(label: string, checked: boolean, onChange: (v: boolean) => void): { root: HTMLLabelElement; input: HTMLInputElement } {
  const root = el('label', 'check');
  const input = el('input'); input.type = 'checkbox'; input.checked = checked;
  input.addEventListener('change', () => onChange(input.checked));
  root.append(input, el('span', undefined, label));
  return { root, input };
}

export function button(label: string, onClick: () => void, kind: 'primary' | 'normal' | 'danger' = 'normal', iconName?: IconName): HTMLButtonElement {
  const b = el('button', `btn btn-${kind}`);
  b.type = 'button';
  if (iconName) b.append(icon(iconName));
  b.append(el('span', undefined, label));
  b.addEventListener('click', onClick);
  return b;
}

/**
 * '처음 화면'(시작 화면, index) 링크. 전처리·물리 시뮬레이션·후처리 머리에 하나씩 둔다.
 * guard 가 글을 돌려주면(떠나면 잃는 것이 있을 때) 바로 옮기지 않고 링크 아래에 확인 상자를 띄운다.
 * FeDiT iframe 은 allow-modals 가 없어 confirm·beforeunload 창이 막히므로 화면 안에서 묻는다.
 */
export function homeLink(guard?: () => string | null): HTMLAnchorElement {
  const a = el('a', 'btn btn-home');
  a.href = './';
  a.append(icon('home'), el('span', undefined, '처음 화면'));
  let pop: HTMLElement | null = null;
  const close = (): void => {
    pop?.remove();
    pop = null;
    a.setAttribute('aria-expanded', 'false');
    document.removeEventListener('pointerdown', onOutside, true);
    document.removeEventListener('keydown', onKey, true);
  };
  const onOutside = (e: PointerEvent): void => { const t = e.target as Node; if (pop && !pop.contains(t) && !a.contains(t)) close(); };
  const onKey = (e: KeyboardEvent): void => { if (e.key === 'Escape' && pop) { close(); e.stopPropagation(); a.focus(); } };
  a.addEventListener('click', (e) => {
    const msg = guard?.();
    if (!msg) return;
    e.preventDefault();
    if (pop) { close(); return; }
    pop = el('div', 'leave-pop');
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-label', '처음 화면으로 가기');
    const go = button('처음 화면으로', () => { close(); location.href = a.href; }, 'primary');
    const cancel = button('취소', () => { close(); a.focus(); });
    const btns = el('div', 'leave-pop-actions');
    btns.append(cancel, go);
    pop.append(el('p', undefined, msg), btns);
    document.body.append(pop);
    // 링크 바로 아래, 오른쪽 끝을 링크에 맞춘다(화면 밖으로 나가지 않게)
    const r = a.getBoundingClientRect(), m = 8;
    const left = Math.max(m, Math.min(r.right - pop.offsetWidth, window.innerWidth - pop.offsetWidth - m));
    pop.style.left = `${Math.round(left)}px`;
    pop.style.top = `${Math.round(r.bottom + 6)}px`;
    a.setAttribute('aria-expanded', 'true');
    document.addEventListener('pointerdown', onOutside, true);
    document.addEventListener('keydown', onKey, true);
    go.focus();
  });
  return a;
}

/** 아이콘 + 글 안내 상자 (kind: 'info' | 'warn') */
export function callout(kind: 'info' | 'warn'): { root: HTMLElement; text: HTMLElement } {
  const root = el('div', `callout ${kind}`);
  const text = el('span');
  root.append(icon(kind === 'warn' ? 'alert' : 'info'), text);
  return { root, text };
}

/**
 * 숫자 입력. 값은 바꾸었을 때만(change) 넘긴다 — Enter는 칸을 떠나게 할 뿐이라, 표시용으로 반올림된 글자가 그대로 값이 되는 일이 없다.
 * exact를 주면 반올림 없이 그대로 보여 준다(전처리처럼 값 자체를 편집하는 칸). 기본은 표시용 반올림(fmtNum).
 */
export function numberInput(value: number, onCommit: (v: number) => void, opts: { exact?: boolean } = {}): HTMLInputElement {
  const i = el('input', 'num');
  i.type = 'number'; i.step = 'any'; i.value = opts.exact ? fmtExact(value) : fmtNum(value);
  let shown = i.value; // 마지막으로 보여 준(또는 받아들인) 글자. 비우거나 숫자가 아니면 여기로 되돌린다
  i.addEventListener('change', () => {
    const v = i.value.trim() === '' ? NaN : Number(i.value);
    if (!Number.isFinite(v)) { i.value = shown; return; }
    shown = i.value; onCommit(v);
  });
  i.addEventListener('keydown', (e) => { if (e.key === 'Enter') i.blur(); });
  return i;
}

/** 범위 끝값 표시: 범위 폭에 맞는 자릿수로 (폭이 좁으면 자릿수를 늘려 두 끝이 구별되게 — 1~1로 보이던 밀도 범위가 0.99995~1.00005로 보인다) */
export function fmtRangeValue(v: number, span: number): string {
  if (!Number.isFinite(v)) return '-';
  if (!(span > 0)) return fmtNum(v);
  const decimals = Math.min(10, Math.max(0, Math.ceil(-Math.log10(span)) + 2));
  const a = Math.abs(v);
  if (a >= 1e6 || (a > 0 && a < 1e-6)) return v.toExponential(Math.min(6, decimals));
  return Number(v.toFixed(decimals)).toString();
}

/** 편집용 숫자 글자: 반올림하지 않되 부동소수 찌꺼기(0.30000000000000004)는 걷어 낸다 */
export function fmtExact(v: number): string {
  if (!Number.isFinite(v)) return '';
  return String(Number(v.toPrecision(12)));
}

export function fmtNum(v: number): string {
  if (!isFinite(v)) return '-';
  const a = Math.abs(v);
  if (a === 0) return '0';
  if (a >= 1e5 || a < 1e-4) return v.toExponential(2);
  if (a >= 100) return v.toFixed(1);
  if (a >= 1) return v.toFixed(2);
  return Number(v.toPrecision(3)).toString(); // 0.0125 → "0.0125"
}

export function fmtInt(v: number): string {
  return v.toLocaleString('ko-KR');
}

// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   icons.ts

UI 아이콘 모음. 이모지는 쓰지 않는다. 24×24 선 아이콘(획 1.75, 둥근 끝)이며 currentColor로 그려져
둘러싼 글자색을 그대로 따른다. 크기는 CSS `.icon`(기본 16px)이 정한다.
*/
/******************************************************************************/

const PATHS = {
  // 구획
  database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  droplet: '<path d="M12 3s6.5 6.6 6.5 11a6.5 6.5 0 0 1-13 0C5.5 9.6 12 3 12 3z"/>',
  filter: '<path d="M3 5h18l-7 8.5V19l-4 2v-7.5L3 5z"/>',
  slice: '<path d="M3 9l9-4.5L21 9l-9 4.5L3 9z"/><path d="M3 9v6l9 4.5 9-4.5V9"/><path d="M12 13.5V19.5"/>',
  arrow: '<path d="M4 12h15"/><path d="M13 6l6 6-6 6"/>',
  wind: '<path d="M3 8h9.5a2.5 2.5 0 1 0-2.5-2.5"/><path d="M3 12h13.5a2.5 2.5 0 1 1-2.5 2.5"/><path d="M3 16h6.5a2 2 0 1 1-2 2"/>',
  cube: '<path d="M12 2.5l8.5 4.75v9.5L12 21.5l-8.5-4.75v-9.5L12 2.5z"/><path d="M3.5 7.25L12 12l8.5-4.75"/><path d="M12 12v9.5"/>',
  monitor: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8"/><path d="M12 16v4"/>',
  // 도구막대
  camera: '<path d="M4 8h3.5l1.5-3h6l1.5 3H20a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/>',
  'view-top': '<rect x="4" y="4" width="16" height="16" rx="2"/>',
  'view-front': '<rect x="3" y="6" width="18" height="12" rx="2"/>',
  'view-side': '<rect x="6" y="3" width="12" height="18" rx="2"/>',
  maximize: '<path d="M8 3H3v5"/><path d="M16 3h5v5"/><path d="M8 21H3v-5"/><path d="M16 21h5v-5"/>',
  // 버튼·안내
  file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6z"/><path d="M14 3v6h6"/>',
  download: '<path d="M12 4v11"/><path d="M6.5 9.5L12 15l5.5-5.5"/><path d="M4 20h16"/>',
  rotate: '<path d="M3 12a9 9 0 1 0 2.9-6.6"/><path d="M3 4v5h5"/>',
  alert: '<path d="M12 3.5L21.5 20h-19L12 3.5z"/><path d="M12 10v4.5"/><path d="M12 17.5h.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 8h.01"/><path d="M11 12h1v4h1"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  chevron: '<path d="M6 9l6 6 6-6"/>',
  // 편집
  edit: '<path d="M4 20l4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20z"/><path d="M13.5 6.5l3 3"/>',
  cursor: '<path d="M5 3l14 8-6 2-2 6-6-16z"/>',
  move: '<path d="M12 2v20"/><path d="M2 12h20"/><path d="M9 5l3-3 3 3"/><path d="M9 19l3 3 3-3"/><path d="M5 9l-3 3 3 3"/><path d="M19 9l3 3-3 3"/>',
  'rotate-cw': '<path d="M21 12a9 9 0 1 1-2.9-6.6"/><path d="M21 4v5h-5"/>',
  scale: '<path d="M21 3l-7 7"/><path d="M14 3h7v7"/><path d="M3 21l7-7"/><path d="M10 21H3v-7"/>',
  cylinder: '<ellipse cx="12" cy="5" rx="7" ry="2.5"/><path d="M5 5v14c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V5"/>',
  building: '<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M9 7h2"/><path d="M13 7h2"/><path d="M9 11h2"/><path d="M13 11h2"/><path d="M9 15h2"/><path d="M13 15h2"/><path d="M10 21v-3h4v3"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
  trash: '<path d="M4 7h16"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M6 7l1 13h10l1-13"/><path d="M9 7V4h6v3"/>',
  undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
  redo: '<path d="M15 14l5-5-5-5"/><path d="M20 9H10a6 6 0 0 0 0 12h3"/>',
  split: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.5 15.5"/><path d="M14.5 14.5L20 20"/><path d="M8.5 8.5l3.5 3.5"/>',
  merge: '<circle cx="6" cy="5" r="2.5"/><circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="12" r="2.5"/><path d="M6 7.5v9"/><path d="M6 7.5c0 4 3 4.5 9.5 4.5"/>',
  eye: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  'eye-off': '<path d="M3 3l18 18"/><path d="M10.6 6.3A10 10 0 0 1 12 6c6.5 0 10 6 10 6a16 16 0 0 1-3.2 3.7"/><path d="M6.6 6.6A16 16 0 0 0 2 12s3.5 6 10 6a10 10 0 0 0 4.4-1"/>',
  upload: '<path d="M12 16V4"/><path d="M6.5 9.5L12 4l5.5 5.5"/><path d="M4 20h16"/>',
  // 장면 트리 · 레이어
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  'arrow-up': '<path d="M12 19V5"/><path d="M6 11l6-6 6 6"/>',
  'arrow-down': '<path d="M12 5v14"/><path d="M6 13l6 6 6-6"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/><path d="M3 17l9 5 9-5"/>',
  points: '<circle cx="6" cy="7" r="1.6"/><circle cx="14" cy="5" r="1.6"/><circle cx="9" cy="14" r="1.6"/><circle cx="17.5" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/>',
  grid: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/>',
  legend: '<rect x="4" y="3" width="6" height="18" rx="1"/><path d="M14 5h6"/><path d="M14 12h6"/><path d="M14 19h6"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4.5l2 2H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/>',
  archive: '<path d="M3 5h18v4H3z"/><path d="M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9"/><path d="M10 13h4"/>',
  flask: '<path d="M9 3h6"/><path d="M10 3v6L4.5 18a2 2 0 0 0 1.7 3h11.6a2 2 0 0 0 1.7-3L14 9V3"/><path d="M7.5 15h9"/>',
  box: '<path d="M3 8l9-5 9 5v8l-9 5-9-5z"/><path d="M3 8l9 5 9-5"/><path d="M12 13v8"/>',
  sliders: '<path d="M4 6h10"/><path d="M18 6h2"/><path d="M4 12h4"/><path d="M12 12h8"/><path d="M4 18h12"/><path d="M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  layers2: '<path d="M4 7h16v4H4z"/><path d="M4 13h16v4H4z"/>',
  export: '<path d="M12 3v12"/><path d="M7 8l5-5 5 5"/><path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/>',
  book: '<path d="M4 4h11a3 3 0 0 1 3 3v13H7a3 3 0 0 0-3 3z"/><path d="M4 4v16"/><path d="M8 8h6"/>',
  play: '<path d="M7 4.5v15l12-7.5-12-7.5z"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 1 1 3.7 2.2c-.8.5-1.3 1-1.3 2"/><path d="M12 16.8v.2"/>',
  pause: '<path d="M7 4.5h3.5v15H7z"/><path d="M13.5 4.5H17v15h-3.5z"/>',
  // 페이지 사이
  home: '<path d="M3.5 11L12 4l8.5 7"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5.5h4V20"/>',
} as const;

export type IconName = keyof typeof PATHS;

export function icon(name: IconName, cls = ''): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.75');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', cls ? `icon ${cls}` : 'icon');
  svg.innerHTML = PATHS[name];
  return svg;
}

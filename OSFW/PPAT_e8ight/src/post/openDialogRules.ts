// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   openDialogRules.ts

'데이터 열기' 창(post/openDataDialog.ts)과 끌어다 놓기(post/dropOpen.ts)의 규칙만 모은 순수 함수. DOM·AppCore 를 모른다 — scripts/test_open_dialog.mjs 가 시험한다.
- dialogView: 데이터 없음 / 있음 / 여는 중 → 닫을 수 있나 · 머리 오른쪽에 무엇('처음 화면' 링크 또는 닫기 x) · 닫기 단추 막힘 · 여는 단추 막힘 · 레이어 경고 글.
  '막기'(2026-11-05): 데이터가 없으면 창을 닫을 수 없다(나갈 길은 창 안 '처음 화면'). 데이터가 있으면 x · Esc · 뒤판으로 닫힌다.
  여는 동안은 어떤 길로도 닫히지 않는다(실패 오류가 닫힌 창 안에만 남지 않게).
- 레이어 경고: 데이터를 연 직후의 장면 서명(sceneMark)과 지금을 견줘(editsSince) 사용자가 바꾼 것이 있을 때만 띄운다(editsWarning).
  데이터를 열면 저절로 생기는 기본 레이어(Slice 1, 격자가 없으면 Clip 1)만 그대로 있으면 잃을 것이 없으므로 띄우지 않는다.
  바뀐 것 = 레이어 더함·지움·매개변수·표시(표현 방식 · Opacity · 점 크기 · 칠할 배열 등) 바꿈, 데이터 노드의 표시 바꿈, 형상(상자·원기둥·STL) 더함·옮김·크기 바꿈.
  이름·보이기·색 지도 내용은 넣지 않는다. 데이터 노드의 표시는 레이어와 따로 센다(레이어가 0개여도 경고, 글은 '바꾼 데이터 표시').
- fileLineView: '파일' 묶음 결과 줄(회색 진행 글 한 줄 + 빨간 오류 한 줄)에 무엇을 보일지.
- dropPlan: 놓은 것을 무엇으로 열지. 폴더·.vtm 묶음 → 결과 폴더, ZIP 하나 → 결과 ZIP, 그 밖 → 낱개 파일(.stl 은 형상, 나머지는 CSV).
  창에 STL 만 놓으면 아무것도 열지 않는다(STL 은 데이터가 아니다 — 형상은 형상 편집 화면의 [STL 추가], 데이터가 있으면 3D 화면에 놓아도 된다). 글은 stlNotDataText.
'여는 중'은 데이터를 여는 중(app.opening)이다. 저장 시점을 읽는 중(재생 · 슬라이더)은 넣지 않는다 — 창을 닫고 다른 데이터를 여는 일을 막지 않는다.
*/
/******************************************************************************/

export interface DialogInput {
  /** 데이터가 열려 있는가 (app.dataset) */
  hasData: boolean;
  /** 무엇이든 데이터를 여는 중인가 (app.opening, 또는 창 안에서 시작한 열기가 아직 안 끝남) */
  busy: boolean;
  /** 다른 데이터를 열면 잃는 것 — 데이터를 연 직후와 견줘 사용자가 바꾼 것만(editsSince). 없으면 바꾼 것 없음 */
  edits?: Edits;
}

/** 데이터를 연 직후와 지금을 견주는 장면 서명 (sceneMark — post/openDataDialog.ts 가 AppCore 의 공개 상태로 만든다) */
export interface SceneMark {
  /** 데이터 노드의 표시 서명 (viewSignature) */
  root: string;
  /** 레이어 서명 (layerSignature) */
  layers: string;
  /** 레이어(노드) 수 */
  layerCount: number;
  /** 형상 아이디 → 배치 서명 (shapeSignature) */
  shapes: Record<string, string>;
}

/** 다른 데이터를 열면 잃는 것 — 데이터를 연 직후와 견줘 사용자가 바꾼 것만 */
export interface Edits {
  /** 지워질 레이어 수: 레이어를 더하거나 지우거나 매개변수·표시를 바꿨으면 지금 레이어 수, 연 직후 그대로면 0 */
  layers: number;
  /** 데이터 노드의 표시(표현 방식 · Opacity · 칠할 배열 등)를 바꿨는가 — 다른 데이터를 열면 기본(Outline)으로 돌아간다 */
  dataView: boolean;
  /** 연 뒤에 더한 형상 수 (상자 · 원기둥 · STL) */
  addedShapes: number;
  /** 연 직후부터 있던 형상 가운데 옮기거나 돌리거나 크기·모양을 바꾼 것의 수 */
  changedShapes: number;
}

export const NO_EDITS: Edits = { layers: 0, dataView: false, addedShapes: 0, changedShapes: 0 };

/** sceneMark 가 읽는 표시 설정의 꼴 (core/layers.ts DataView — 서명에는 표현 방식 말고도 Opacity · 점 크기 · 구 음영 · Unit Distance · 색칠이 모두 들어간다) */
export interface ViewLike { representation: string }
/** sceneMark 가 읽는 레이어의 꼴 (core/layers.ts Layer 의 일부) */
export interface LayerLike { id: string; type: string; parentId: string | null; params: unknown; view?: ViewLike }
/** sceneMark 가 읽는 형상의 꼴 (edit/objects.ts SceneObject 의 일부) */
export interface ShapeLike { id: string; geometry: { uuid: string }; position: readonly number[]; rotationZ: number; scale: readonly number[]; size?: readonly number[] }

/** 색 지도 내용(map — 이 노드만의 지도의 색·범위·Opacity 곡선)은 서명에서 뺀다(색 범위는 저절로 넓어지기도 하고, 색 지도는 레이어가 아니다) */
const withoutMap = (k: string, v: unknown): unknown => (k === 'map' ? undefined : v);

/**
 * 표시 서명 (데이터 노드 · Clip · Threshold 의 view): 표현 방식 · Opacity · 점 크기 · 구 음영 · Unit Distance · 칠할 배열(fieldKey) · 이 노드만의 지도를 쓰는지(separate).
 * Slice 등은 같은 것(Opacity · 색칠)이 매개변수 안에 있어 매개변수로 센다 — 노드마다 같은 조작이 같이 세지게
 */
export function viewSignature(view: ViewLike | null | undefined): string {
  return JSON.stringify(view ?? null, withoutMap);
}

/**
 * 레이어 서명: 레이어마다 차례 · 아이디 · 종류 · 위 노드 · 매개변수 · 표시(볼륨 노드의 view — viewSignature 와 같은 것).
 * 이름 · 보이기(트리의 눈) · 고른 노드는 넣지 않는다. 매개변수·표시 안의 색 지도 내용(map)도 넣지 않는다. 데이터 노드의 표시는 따로(SceneMark.root)
 */
export function layerSignature(layers: readonly LayerLike[]): string {
  const rows = layers.map((l) => ({ id: l.id, type: l.type, parentId: l.parentId, params: l.params, view: l.view ?? null }));
  return JSON.stringify(rows, withoutMap);
}

/** 형상의 배치 서명: 모양(geometry uuid — 크기를 바꾸면 새로 만든다) · 위치 · 회전 · 배율 · 크기. 이름 · 보이기 · 고름은 넣지 않는다 */
export const shapeSignature = (o: ShapeLike): string =>
  `${o.geometry.uuid}|${o.position.join(',')}|${o.rotationZ}|${o.scale.join(',')}|${o.size ? o.size.join(',') : ''}`;

/** 장면 서명 (데이터를 연 직후에 한 번, 창을 그릴 때마다 한 번 만들어 견준다). rootView = 데이터 노드의 표시(app.root.view) */
export function sceneMark(layers: readonly LayerLike[], rootView: ViewLike | null | undefined, shapes: readonly ShapeLike[]): SceneMark {
  const out: Record<string, string> = {};
  for (const o of shapes) out[o.id] = shapeSignature(o);
  return { root: viewSignature(rootView), layers: layerSignature(layers), layerCount: layers.length, shapes: out };
}

/** 연 직후(base)와 지금(now)을 견줘 다른 데이터를 열면 잃는 것. base 가 없으면(아직 연 데이터가 없음) 없음. 연 직후에 있다가 지운 형상은 잃을 것이 아니므로 세지 않는다 */
export function editsSince(base: SceneMark | null, now: SceneMark): Edits {
  if (!base) return NO_EDITS;
  const layers = now.layers !== base.layers ? Math.max(0, Math.floor(now.layerCount) || 0) : 0;
  let addedShapes = 0, changedShapes = 0;
  for (const [id, sig] of Object.entries(now.shapes)) {
    if (!Object.prototype.hasOwnProperty.call(base.shapes, id)) addedShapes++;
    else if (base.shapes[id] !== sig) changedShapes++;
  }
  return { layers, dataView: now.root !== base.root, addedShapes, changedShapes };
}

/** 레이어 경고 글. 잃을 것이 없으면 빈 글. 예: '열면 지금 레이어 2개와 더한 형상 1개가 지워집니다.' · '열면 지금 바꾼 데이터 표시가 지워집니다.' (해당하는 것만) */
export function editsWarning(e: Edits): string {
  const n = (x: number) => Math.max(0, Math.floor(x) || 0);
  const parts = [
    n(e.layers) ? `레이어 ${n(e.layers)}개` : '',
    e.dataView ? '바꾼 데이터 표시' : '',
    n(e.addedShapes) ? `더한 형상 ${n(e.addedShapes)}개` : '',
    n(e.changedShapes) ? `바꾼 형상 ${n(e.changedShapes)}개` : '',
  ].filter(Boolean);
  if (!parts.length) return '';
  // 모두 받침 없는 글자('…개' · '…표시')로 끝나므로 잇는 말은 '와', 끝은 '가'
  const joined = parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(', ')}와 ${parts[parts.length - 1]}`;
  return `열면 지금 ${joined}가 지워집니다.`;
}

export interface DialogView {
  /** Esc · 뒤판 · 닫기 단추로 닫히는가 */
  canClose: boolean;
  /** 머리 오른쪽: 'home' = '처음 화면' 링크(데이터 없음), 'close' = 닫기 아이콘 x(데이터 있음) */
  head: 'home' | 'close';
  /** 닫기 단추가 막혔는가 (여는 동안) */
  closeDisabled: boolean;
  /** 창 안의 여는 단추(파일 단추)와 놓기가 막혔는가 (여는 동안). 목록의 [열기]는 각 묶음이 app.opening 으로 같이 막는다 */
  openDisabled: boolean;
  /** 제목 아래 한 줄. 빈 글이면 숨김 (데이터가 있고 연 직후와 견줘 바꾼 것이 있을 때만 — editsWarning) */
  layerWarning: string;
}

export function dialogView(s: DialogInput): DialogView {
  return {
    canClose: s.hasData && !s.busy,
    head: s.hasData ? 'close' : 'home',
    closeDisabled: s.busy,
    openDisabled: s.busy,
    layerWarning: s.hasData ? editsWarning(s.edits ?? NO_EDITS) : '',
  };
}

export interface FileLineInput {
  /** '파일' 묶음(단추 · 창에 놓기)에서 시작한 열기가 아직 안 끝남 */
  fileBusy: boolean;
  /** 앱이 데이터를 여는 중 (app.opening) */
  opening: boolean;
  /** 그 열기가 목록 줄([열기] · 주소의 ?job= · ?data=)의 것 — 진행 글은 그 묶음이 보인다 */
  listBusy: boolean;
  /** 여는 중에 또 열려고 해서 거절했음 (BUSY_TEXT 를 보일 차례) */
  busyNotice: boolean;
  /** '파일' 묶음의 마지막 오류 (무엇이든 새로 열면 창이 지운다) */
  fileMsg: string;
}

export interface FileLineView {
  /** 회색 진행 글(app.loading)을 보이는가 — '파일' 묶음의 열기, 또는 창 밖에서 시작한 열기(3D 화면에 놓기 등 — 다른 어디에도 진행 글이 없으므로) */
  showProgress: boolean;
  /** 빨간 오류 줄 (빈 글이면 숨김) */
  error: string;
  /** 거절 알림을 다음에도 남기는가 (여는 일이 끝나면 지운다 — 앞의 열기가 실패해도 '불러오는 중'이 남지 않게) */
  keepNotice: boolean;
}

/** '파일' 결과 줄 */
export function fileLineView(s: FileLineInput): FileLineView {
  const busy = s.fileBusy || s.opening;
  const keepNotice = s.busyNotice && busy;
  return {
    showProgress: s.fileBusy || (s.opening && !s.listBusy),
    error: keepNotice ? BUSY_TEXT : s.fileBusy ? '' : s.fileMsg,
    keepNotice,
  };
}

/** 놓은 것의 처리 방법 */
export type DropPlan =
  | { kind: 'none' }                              // 놓은 파일이 없다 (글자 등)
  | { kind: 'zip'; index: number }                // 결과 ZIP 하나 (files[index])
  | { kind: 'folder'; label?: string }            // 결과 폴더 (폴더 핸들, 또는 .vtm 이 섞인 낱개 파일 묶음 — 이름은 그 .vtm 이름)
  | { kind: 'stl-only' }                          // 창에 STL 만 놓음 → 열지 않고 알린다
  | { kind: 'files'; csv: number[]; stl: number[] }; // 낱개 파일: CSV(데이터)와 STL(형상)의 순번 (놓은 차례 그대로 — dropOpen 은 CSV 를 다 연 뒤 STL 을 더한다)

/** 창(뒤판 포함)에 STL 만 놓았을 때의 글. '형상 편집' · [STL 추가]는 패널 화면 이름 · 단추 글과 같다(ui/panel.ts) */
export function stlNotDataText(hasData: boolean): string {
  return hasData
    ? 'STL은 데이터가 아니라 형상입니다. 형상 편집의 [STL 추가]로 넣어 주세요.'
    : 'STL은 데이터가 아니라 형상입니다. 데이터를 연 뒤 형상 편집의 [STL 추가]로 넣어 주세요.';
}
/** 다른 데이터를 여는 중에 열려고 할 때의 글 (서버 결과·예제 줄과 같은 글) */
export const BUSY_TEXT = '다른 데이터를 불러오는 중입니다.';

/**
 * names = 놓은 파일 이름(놓은 차례). dirHandle = 폴더 핸들을 받았는가(폴더를 놓음), hasFolder = 폴더(핸들 또는 파일 목록)를 만들었는가.
 * where = 'dialog'(데이터 열기 창) | 'viewport'(3D 화면)
 */
export function dropPlan(names: string[], dirHandle: boolean, hasFolder: boolean, where: 'dialog' | 'viewport'): DropPlan {
  if (names.length === 1 && /\.zip$/i.test(names[0]) && !dirHandle) return { kind: 'zip', index: 0 };
  const vtm = names.find((n) => /\.vtm$/i.test(n));
  if (hasFolder && (dirHandle || vtm)) {
    // 낱개 파일을 놓으면 폴더 이름이 없으므로(기본 '폴더') 결과 묶음 파일 이름을 연 뒤의 이름으로: 'xxx_10.vtm' → 'xxx'
    const label = !dirHandle && vtm ? vtm.replace(/(_\d+)?\.vtm$/i, '') || vtm : undefined;
    return label === undefined ? { kind: 'folder' } : { kind: 'folder', label };
  }
  if (!names.length) return { kind: 'none' };
  const stl: number[] = [], csv: number[] = [];
  names.forEach((n, i) => (/\.stl$/i.test(n) ? stl : csv).push(i));
  if (where === 'dialog' && !csv.length) return { kind: 'stl-only' };
  return { kind: 'files', csv, stl };
}

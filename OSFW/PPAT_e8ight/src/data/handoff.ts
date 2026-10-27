// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   handoff.ts

전처리 → 물리 시뮬레이션 페이지로 해석기 입력 묶음(JSON + STL)을 넘기는 자리.
두 페이지는 같은 주소(origin)에서 뜨고 한 화면 안에서 페이지만 바뀌므로, 브라우저 안 저장소(IndexedDB)에 묶음을 잠깐 두고 넘긴다.
- 전처리: putHandoff(묶음) 뒤 sim.html?from=pre 로 이동한다. 전처리는 해석기를 부르지 않는다.
- 물리 시뮬레이션: takeHandoff()로 꺼내고(꺼내면 지운다) 바로 실행한다. 사용자가 JSON·STL을 직접 올리는 경우와 같은 입력 형태다.
STL이 수십 MB가 될 수 있어 sessionStorage(문자열·수 MB 한도)가 아니라 IndexedDB(Blob·바이트 그대로)를 쓴다.
*/
/******************************************************************************/

export type EngineKind = 'lbm' | 'lbm_dem';

/** 해석기 입력 묶음. 직접 올리기와 전처리 넘김이 같은 모양을 쓴다 */
export interface InputPackage {
  /** lbm: 다성분·다상·농도확산·복합 열전달 / lbm_dem: 유체-입자(DEM) */
  engine: EngineKind;
  /** 해석기 입력 JSON. name 은 엔진 작업 폴더에 저장될 파일 이름(<이름>.json) */
  config: { name: string; text: string };
  /** JSON 의 mesh_path 가 가리키는 STL 등. name 은 mesh_path 와 같아야 한다 */
  files: { name: string; bytes: Uint8Array }[];
}

export interface HandoffRecord extends InputPackage {
  version: 1;
  source: 'pre';
  createdAt: number;
}

const DB_NAME = 'utcfd-handoff';
const STORE = 'pkg';
const KEY = 'pending';
/** 넘긴 지 이만큼 지난 묶음은 버린다(다른 날 남은 묶음을 실수로 실행하지 않게) */
const MAX_AGE_MS = 30 * 60 * 1000;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => { req.result.createObjectStore(STORE); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('브라우저 저장소(IndexedDB)를 열 수 없습니다.'));
  });
}

function run<T>(mode: IDBTransactionMode, body: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then((db) => new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = body(tx.objectStore(STORE));
    let result: T;
    req.onsuccess = () => { result = req.result; };
    tx.oncomplete = () => { db.close(); resolve(result); };
    tx.onerror = tx.onabort = () => { db.close(); reject(tx.error ?? new Error('브라우저 저장소에 쓰지 못했습니다.')); };
  }));
}

/** 전처리가 묶음을 맡긴다. 앞에 남아 있던 묶음은 덮어쓴다 */
export async function putHandoff(pkg: InputPackage): Promise<void> {
  const rec: HandoffRecord = { ...pkg, version: 1, source: 'pre', createdAt: Date.now() };
  await run('readwrite', (s) => s.put(rec, KEY));
}

/** 물리 시뮬레이션 페이지가 묶음을 꺼낸다. 꺼내면 지운다(새로 고침해도 같은 해석을 두 번 넣지 않게). 없거나 오래됐으면 null */
export async function takeHandoff(): Promise<HandoffRecord | null> {
  const rec = await run<HandoffRecord | undefined>('readonly', (s) => s.get(KEY) as IDBRequest<HandoffRecord | undefined>);
  await run('readwrite', (s) => s.delete(KEY));
  if (!rec || rec.version !== 1 || Date.now() - rec.createdAt > MAX_AGE_MS) return null;
  return rec;
}

// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   exporter.ts

입력 JSON을 파일로 내보낸다.
- exportJson: meta.title을 파일 이름(확장자 없이)과 같게 맞추고 result_report.export_path를 비운다(엔진 API가 그렇게 덮어쓴다).
  들여쓰기 2칸. 글자(string)로 돌려주며, 파일로 쓸 때 UTF-8로 넣는다.
- exportPackageZip: JSON + STL들을 ZIP 하나로 묶는다(fflate zipSync). 브라우저 전용 Blob은 이 함수 안에서만 만든다.
*/
/******************************************************************************/
import { strToU8, zipSync } from 'fflate';
import { cloneDoc, isJsonObject, type SolverInputDoc } from './solverInput';
import { isPlainName, stemOf } from './validate';

/** fileStem은 확장자 .json이 있어도 없어도 된다(validateInput과 같은 규칙). 경로 문자가 있으면 거부 */
export function exportJson(doc: SolverInputDoc, fileStem: string): { fileName: string; text: string } {
  const stem = stemOf(fileStem);
  if (!isPlainName(stem)) throw new Error(`파일 이름 '${fileStem}'에는 경로 문자('/', '\\', '..')를 쓸 수 없고 비어 있어서도 안 됩니다.`);
  const out = cloneDoc(doc);
  out.meta = { ...out.meta, title: stem };
  if (isJsonObject(out.config.result_report)) out.config.result_report.export_path = '';
  return { fileName: `${stem}.json`, text: `${JSON.stringify(out, null, 2)}\n` };
}

/** JSON과 입력 파일(STL 등)을 ZIP으로. 같은 이름이 겹치면 뒤의 것이 남는다(겹침은 validateInput이 잡는다) */
export function exportPackageZip(doc: SolverInputDoc, fileStem: string, files: { name: string; bytes: Uint8Array }[]): Blob {
  const { fileName, text } = exportJson(doc, fileStem);
  const entries: Record<string, Uint8Array> = { [fileName]: strToU8(text) };
  for (const f of files) entries[f.name] = f.bytes;
  // 압축 수준 1: 엔진 API의 결과 ZIP과 같은 선택(수준 6은 크기가 1%p 남짓 줄고 시간은 2.6~3.5배)
  const bytes = zipSync(entries, { level: 1 });
  return new Blob([bytes as BlobPart], { type: 'application/zip' });
}

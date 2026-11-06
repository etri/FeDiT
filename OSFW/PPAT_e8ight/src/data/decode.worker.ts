// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   decode.worker.ts

값 변환 Worker 껍데기: 받은 VTU 배열 바이트를 Float32 로 바꾸고 남긴 셀만 고르고 벡터 크기·통계를 센다(화면이 멈추지 않게 메인 밖에서).
처리는 decodeCore.ts createDecodeHandler 가 하고(메인 스레드 대체 길과 같은 함수), 여기는 메시지를 잇기만 한다. 부르는 쪽: decodeClient.ts
*/
/******************************************************************************/
import { DecodeMessage, createDecodeHandler } from './decodeCore';

interface WorkerScope {
  onmessage: ((e: { data: DecodeMessage }) => void) | null;
  postMessage(msg: unknown, transfer: Transferable[]): void;
}
const scope = self as unknown as WorkerScope;
const handle = createDecodeHandler((msg, transfer) => scope.postMessage(msg, transfer));
scope.onmessage = (e) => handle(e.data);

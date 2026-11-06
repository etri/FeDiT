// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
/******************************************************************************/
/*!
\file   rangeGovernor.ts

결과 파일 바이트 구간 받기의 '자동 단계 조절기'. resilientFetch.ts fetchRange 가 요청(조각)마다 여기서 줄을 서고, 응답 머리가 옴 · 받은 바이트 · 멈춤 ·
받는 도중 끊김 · 끝을 알린다.
원칙(2026-11-06): 기본은 제약 없음(해피 패스 — 다른 서버에 배포했을 때 묶이면 안 된다. 설정 파일 · 앞단 nginx 묶기는 넣지 않는다).
끊김 · 느려짐을 스스로 알아채 단계를 낮춘다(스트리밍 서비스처럼 — 묻지 않음 · 알림 창 없음). 낮은 속도에서 시작해 올려 보지 않고, 한 번 낮춘 단계는
그 페이지에서 다시 올리지 않는다. 낮춘 단계는 그 서버 주소(origin)에만, 브라우저(localStorage)에 하루 동안 기억한다 — 하루가 지나면 다시 제약 없음부터.
근거(운영 서버 cfd.fedit.or.kr 에서 잰 것): 순간적으로 빠르게(초당 20 MB 이상) 몰려 들어오면 그 서버에서 이 PC 로 오는 데이터 전체가
30~55 초 끊긴다(새 연결 · HTTP/1.1 도 함께 멈춤). curl 로 받기 속도를 매끈하게 5 · 10 MB/s 로 묶으면 멈춤 0, 1 · 3 MB 를 1 초마다 1 분 받기도 0.
Chrome(HTTP/2)에서 2 MB 요청을 하나씩 차례로 받으면 약 13 MB/s 로 100 MB 멈춤 0. 같은 PC 에서 nodejs.org 는 늘 빠르다 — 서버 쪽 길의 문제이고
우리가 고칠 수 없다(화면 쪽에서 처리할 수 있는 것만 한다).
같은 날 Node(HTTP/1.1) 실측(앞 규칙 — 1단계 2 MB 조각 · 동시 2, 2단계부터 '요청 하나의 머리 뒤 속도'의 절반): 머리 뒤 속도가 88 MiB/s 로 잡혀
2단계 44 · 3단계 22 · 4단계 11 MB/s 로 내려가는 동안 끊김 5 번(각 약 36 초). 4단계도 평균은 11 MB/s 지만 2 MB 를 약 100 MiB/s 로 몰아 받고 쉬어서
190 MB 뒤 끊겼다. 머리 뒤 속도는 첫 바이트 기다림 · 요청 사이 틈을 빼 실제로 받는 속도보다 몇 배 높다. 그래서 지금 규칙은
(1) 속도를 그 주소에서 실제로 받은 바이트 ÷ 바쁜 시간으로 재고 (2) 1단계부터 동시 1개 (3) 2단계부터 단계마다 조각도 절반으로 줄여 한 번에 몰려 들어오는
양 자체를 줄인다.
그 뒤 Chrome(HTTP/2) 운영 서버 실측(2026-11-06, 같은 파일의 16.8 MiB 구간 12개 차례로 · 캐시 no-store): (A) 기억 없이 0단계에서 시작 — 0단계 실제 약 20.5 MB/s 로
구간 3 에서 끊김 → 1단계(상한 없음)가 끊김(약 36 초)이 풀린 뒤 초당 약 19 MB 로 받다 곧 다시 끊김 → 2단계(초당 9.2 MB)부터 끊김 0 (90.4 초 · 끊김 2 번).
(C) 2 MB 조각 · 초당 9.2 MB 상한 · 동시 1 로 시작하면 12개 모두 끊김 0. 그래서 1단계에도 '0단계에서 잰 실제 속도의 절반' 상한을 둔다 — 첫 끊김 한 번으로
자리 잡게(추정 — 운영 서버에서 다시 재야 함). 0단계는 그대로 제약 없음.

단계 (서버 주소마다 하나):
- 0단계(처음 · 제약 없음): 구간을 큰 요청 한 번으로(조각 나누기 없음), 동시 수 · 속도 제한 없음. 이때도 실제 속도는 잰다(1단계 상한에 씀).
- 1단계(첫 사건 뒤): 큰 구간을 CHUNK_BYTES(2 MB) 조각으로 나눠 읽기 하나 안에서 차례로 받고, 그 주소의 바이트 구간 요청은 모두 합쳐 동시에
  LOWERED_PARALLEL(1)개만 나가 있게 한다(자리는 본문을 다 받으면 풂 — Chrome 에서 멈춤 0 이던 꼴). 속도 상한 = 끊김이면 낮출 때 0단계에서 잰 실제 속도의
  절반(바닥 MIN_RATE 1 MB/s — 0단계에서 못 쟀으면(바쁜 1 초도, 0.3 초 넘게 4 MB 넘게도 못 받음) 상한 없음), 느려짐이면 느려지기 전 0단계 표본의 중앙값(typicalRate)의 절반.
- 2단계부터(또 사건): 동시 1개 + 속도 상한 = 끊김이면 앞 단계에서 잰 실제 속도와 앞 상한 가운데 작은 것의 절반(올리지 않음 — 앞 상한이 없으면 잰 속도의
  절반). 앞 단계에서 못 쟀으면 앞 상한의 절반, 앞 상한도 없으면(상한 없는 1단계) STAGE2_FALLBACK_RATE(5 MB/s). 느려짐이면 앞 상한의 절반(상한 없는
  1단계면 1단계 표본 중앙값의 절반, 없으면 5 MB/s). 바닥 MIN_RATE(1 MB/s). 조각도 단계마다 절반(1 MB → 512 KB → 바닥 MIN_CHUNK_BYTES 256 KB).
  속도 · 조각이 모두 바닥이면 더 낮추지 않는다.
- 끊김과 느려짐의 근거가 다른 까닭(2026-11-06): 끊김 때 잰 실제 속도는 마지막 바이트까지의 창이라 끊긴 시간이 들어가지 않아 끊기기 전 속도다.
  느려짐 때 잰 실제 속도는 이미 느려진 속도라, 그 절반을 상한으로 삼으면 잠깐 느린 망(무선 등)에서 그 주소가 하루 동안 바닥(1 MB/s) 근처에 묶인다 —
  그래서 느려짐은 느려짐 판정의 기준(slowBase — 상한, 없으면 그 단계 표본 중앙값)을 근거로 삼는다.
- 상한이 있으면(1단계부터) 토큰 통(통 = 그 단계 조각 하나)으로 묶는다: 보낼 때 그 요청 바이트를 꺼내고 끝날 때 받지 못한 몫을 돌려준다.
실제 속도: 그 주소의 바이트 구간 요청이 하나라도 나가 있거나 이 줄에서 기다리던 동안(바쁜 시간 — 첫 바이트 기다림 · 토큰 기다림 · 조각 사이 틈 포함,
아무것도 부르지 않은 쉬는 시간은 뺌)의 최근 RATE_WINDOW_MS(4 초) 창에서 받은 바이트 ÷ 그 시간. 바이트를 받을 때마다 다시 잰다 — 그래서 끊긴 요청의
마지막 바이트 뒤 5 초(사건 자체)는 낮출 때 쓰는 값에 들어가지 않는다. 단계를 낮춘 뒤에는 첫 응답 머리부터 새로 잰다(끊김 동안 다시 보내던 시간은 뺌).
창의 바쁜 시간이 MIN_MEASURE_MS(1 초) 넘었거나, 0단계에서만 MIN_MEASURE_SHORT_MS(0.3 초) 넘게 MIN_MEASURE_BYTES(4 MB) 넘게 받았으면 '잼' —
아니면 '못 잼'(조각 한두 개가 몰려 들어온 속도라).
신호:
- 끊김: (가) 응답 머리 · 본문 바이트를 STALL_MS(5 초 — resilientFetch) 동안 받지 못해 끊었다. 단, 응답 머리 전에 기다리다 끊은 것은 그동안 같은 주소의
  다른 요청에서 바이트가 흘렀으면 세지 않는다(브라우저 안에서 연결 차례를 기다린 것 — HTTP/1.1 은 주소당 연결 6개, 서버는 멈추지 않았다).
  (나) 응답 머리 · 본문 바이트를 받은 뒤 연결이 끊김(fetch 의 TypeError). (다) 덜 받음 — 응답 머리가 약속한 만큼(Content-Range, 못 읽으면 Content-Length
  — 둘 다 못 읽으면 세지 않음) 오기 전에 연결이 닫힘. 0단계에서는 큰 요청 하나의 끊김이 곧 사건이다. 502/503/504 · 응답 머리 전 연결 실패 · 바깥 signal 로
  끊은 것(취소 — 사유가 TypeError 여도)은 세지 않는다(resilientFetch — 서버 · 앞단이 바쁘거나 다시 뜨는 중 · 주소 · 망의 문제 · 사용자의 취소라 받는 속도를
  낮춰도 낫지 않고, 그 주소를 하루 동안 묶게 된다).
- 느려짐: SLOW_MIN_BYTES(1 MB)를 받을 때마다(요청이 끝날 때) 잰 실제 속도 표본이 기준의 SLOW_RATIO(4분의 1) 아래로 SLOW_RUN(3)번 잇달아.
  기준 = 상한이 있으면 상한(상한에 묶여 느린 것은 느려짐이 아님), 없으면(0단계 · 상한 없는 1단계) 그 단계 표본의 중앙값(표본 BASE_SAMPLES(3)개부터).
같은 사건(한 번만 셈): 단계를 낮춘 뒤 SAME_EVENT_MS(10 초) 안의 신호 · 낮추기 전에 보낸 요청의 신호 · 낮춘 뒤 그 주소에서 아직 한 바이트도 받지 못한
동안의 신호(30~55 초 끊김 내내 다시 보내는 요청들이 멈출 때마다 한 단계씩 내려가지 않게) — 마지막 규칙은 낮춘 뒤 SAME_EVENT_MAX_MS(3 분)까지만.
우선 줄: 자리가 모자라면(1단계부터) 줄 차례(작을수록 먼저 — PRIORITY_VIEW 지금 보는 장면 · PRIORITY_PREFETCH 미리 읽기 · PRIORITY_SCAN 전 시점 범위)로
보낸다. 같은 차례 안에서 보는 장면끼리는 나중에 부른 것을 먼저(밀대를 끌다 멈춘 마지막 장면이 먼저 오게 — 차례 값의 turn, 없으면 읽기를 부른 차례),
미리 읽기 · 전 시점 범위는 부른 차례(읽기마다 — 다음 조각 · 다시 보내기는 첫 요청의 차례를 그대로). 읽기 하나의 다음 조각은 앞 조각의 자리를 풀기 전에
줄에 세운다(handoff) — 먼저 부른 같은 차례 읽기 · 뒤 차례 읽기는 조각 사이에 끼어들지 못하고, 앞 차례나 나중에 부른 보는 장면은 조각 사이에서 앞선다.
차례는 기다리는 동안 올릴 수 있다({ level, turn } — 미리 읽던 장면을 보게 되면 TimeSeries 가 올림).
단계가 바뀌면 콘솔에 한 줄(`[결과 읽기] cfd.fedit.or.kr: 끊김 → 1단계(2 MB씩 · 초당 10.3 MB · 동시 1개)` — 0단계에서 못 쟀으면 초당 값 없이).
화면에는 새 글을 넣지 않는다.
fetchWhole(HEAD · 폴더 목록 · 작은 파일)은 여기를 거치지 않는다(작은 요청 — 큰 값 받기 뒤에 줄 서지 않게).
시험: scripts/test_adaptive_fetch.mjs (가짜 시계 · 가짜 저장소 · 가짜 서버 — 운영 서버 꼴을 흉내 낸 가짜 서버로 끊김 횟수도 잰다).
*/
/******************************************************************************/

const KiB = 1024;
const MiB = 1024 * 1024;

/** 1단계 조각 — 측정: Chrome(HTTP/2)에서 2 MB 요청을 하나씩 차례로 받으면 조절 없이 약 13 MB/s 로 100 MB 멈춤 0 */
export const CHUNK_BYTES = 2 * MiB;
/**
 * 조각의 바닥. 2단계부터 단계마다 조각을 절반으로 줄인다(2 MB → 1 MB → 512 KB → 256 KB) — 한 번에 몰려 들어오는 양 자체를 줄이려고
 * (Node 실측 4단계: 평균 11 MB/s 여도 2 MB 를 약 100 MiB/s 로 몰아 받고 쉬어서 190 MB 뒤 끊김). 256 KB 아래는 요청 수만 늘고,
 * 요청마다 첫 바이트 기다림(실측 수십 ms, Chrome 은 더 김)이 들어 바닥 속도(1 MB/s)에서도 받는 시간보다 기다림이 커진다
 */
export const MIN_CHUNK_BYTES = 256 * KiB;
/** 1단계부터 그 주소의 바이트 구간 요청이 동시에 나가 있을 수 있는 수 — Chrome 에서 2 MB 를 하나씩 차례로 받을 때 멈춤 0 이던 꼴 (앞 규칙의 1단계 동시 2개는 Node 실측에서 50~60 MB/s 로 몰려 끊겼다) */
export const LOWERED_PARALLEL = 1;
/** 단계를 낮춘 뒤 이 시간 안의 신호는 같은 사건 (ms) */
export const SAME_EVENT_MS = 10_000;
/** 같은 사건 셋째 규칙(낮춘 뒤 그 주소에서 바이트를 하나도 못 받은 동안)의 한도 (ms) — 운영 서버 끊김(30~55 초) · 다시 보내기 예산(약 2 분 10 초)을 넘는 3 분 뒤의 신호는 새 사건 */
export const SAME_EVENT_MAX_MS = 3 * 60_000;
/** 느려짐 표본 하나 사이에 받는 최소 바이트 (작은 요청 · 헤더 몇 개로 표본을 만들지 않게) */
export const SLOW_MIN_BYTES = 1 * MiB;
/** 기준의 이 몫 아래면 느린 표본 */
export const SLOW_RATIO = 0.25;
/** 느린 표본이 잇달아 이만큼이면 느려짐 */
export const SLOW_RUN = 3;
/** 상한이 없을 때(0단계 · 상한 없는 1단계)의 느려짐 기준(표본 중앙값)을 정하는 데 드는 표본 수 */
export const BASE_SAMPLES = 3;
/** 기준을 셀 때 남기는 최근 표본 수 */
const MAX_SAMPLES = 20;
/** 실제 속도를 재는 창 — 바쁜 시간 최근 4 초 (Chrome 13 MB/s 면 약 50 MB · 2 MB 조각 25개, 바닥 1 MB/s 여도 4 MB) */
export const RATE_WINDOW_MS = 4000;
/** 실제 속도를 쟀다고 보는 그 단계의 최소 바쁜 시간 — 이보다 짧으면 조각 한두 개가 몰려 들어온 속도라 '못 잼' (Node 실측의 1단계는 약 0.6 초 만에 끊겼다) */
export const MIN_MEASURE_MS = 1000;
/**
 * 1 초 전이라도 쟀다고 보는 받은 양과 그 최소 바쁜 시간 — Chrome 실측 D: 0단계가 16.8 MB 를 0.69 초에 받고(응답 머리 0.47 초 포함) 다음 요청에서
 * 7.6 MB 뒤 끊겨, 바쁜 0.95 초 · 약 24 MB 를 받고도 '못 잼' → 1단계 상한 없이 한 번 더 끊겼다. 0.3 초 · 4 MB 면 조각 두 개(0.08 초에 8 MB 같은
 * 몰린 속도)는 여전히 '못 잼'
 */
export const MIN_MEASURE_BYTES = 4 * MiB;
export const MIN_MEASURE_SHORT_MS = 300;
/** 재기 점 사이의 최소 간격 (ms) — 창(4 초)의 앞 끝이 이만큼 어긋날 수 있다 */
const RATE_GRAIN_MS = 50;
/** 묶는 속도의 바닥 (바이트/초) — 이보다 낮추지 않는다 */
export const MIN_RATE = 1 * MiB;
/**
 * 1단계에 상한이 없었고(0단계에서 못 잼) 1단계에서도 실제 속도를 못 쟀을 때 2단계 속도 (바이트/초). 측정: curl 로 초당 5 MB 로 묶어 3/3 멈춤 없음
 * — 시험한 것 가운데 가장 낮은 안전한 값 (2단계는 1단계로도 끊긴 뒤라 조심스러운 쪽)
 */
export const STAGE2_FALLBACK_RATE = 5 * MiB;
/** 낮춘 단계를 기억하는 시간 (ms) — 하루 */
export const REMEMBER_MS = 24 * 60 * 60 * 1000;
/** localStorage 열쇠 — 값은 { [origin]: { stage, rate, until } } (rate = 상한 — 상한 없는 1단계는 null) */
export const STORAGE_KEY = 'union-twin-cfd.rangeStage';

/** 줄 차례: 지금 보는 장면(setStep · Field 를 바꿔 지금 장면에 배열 더 읽기 · 처음 열기 — 기본) */
export const PRIORITY_VIEW = 0;
/** 줄 차례: 재생 중 미리 읽기 */
export const PRIORITY_PREFETCH = 1;
/** 줄 차례: 전 시점 범위 */
export const PRIORITY_SCAN = 2;
/**
 * 줄 차례 (작을수록 먼저). 숫자, 또는 기다리는 동안 올릴 수 있는 값 — 줄에서 보낼 것을 고를 때마다 그때의 level · turn 을 본다.
 * turn = 부른 차례(nextReadTurn — 클수록 나중에 부름). 보는 장면끼리는 turn 이 큰 것이 먼저다. 없으면 그 읽기를 부른 차례
 */
export type ReadPriority = number | { readonly level: number; readonly turn?: number };
/** 줄 차례의 지금 값 (없으면 PRIORITY_VIEW) */
export const priorityLevel = (p?: ReadPriority): number => (p === undefined ? PRIORITY_VIEW : typeof p === 'number' ? p : p.level);
/** 줄 차례의 부른 차례 (숫자 차례 · 없으면 undefined — 그 읽기를 부른 차례를 쓴다) */
export const priorityTurn = (p?: ReadPriority): number | undefined => (p !== undefined && typeof p === 'object' ? p.turn : undefined);
let turnSeq = 0;
/** 부른 차례 번호 하나 (이 모듈에서 늘기만 함 — 읽기의 부른 차례와 TimeSeries 가 보는 장면마다 매기는 turn 을 같은 줄에서 견줄 수 있게) */
export const nextReadTurn = (): number => ++turnSeq;

/** 시험이 바꾸는 숫자 (없으면 위 상수) */
export interface GovernorTuning {
  chunkBytes: number;
  minChunkBytes: number;
  sameEventMs: number;
  sameEventMaxMs: number;
  slowMinBytes: number;
  slowRatio: number;
  slowRun: number;
  baseSamples: number;
  minRate: number;
  fallbackRate: number;
  rememberMs: number;
  rateWindowMs: number;
  minMeasureMs: number;
  minMeasureBytes: number;
  minMeasureShortMs: number;
}
export const DEFAULT_TUNING: Readonly<GovernorTuning> = {
  chunkBytes: CHUNK_BYTES, minChunkBytes: MIN_CHUNK_BYTES, sameEventMs: SAME_EVENT_MS, sameEventMaxMs: SAME_EVENT_MAX_MS, slowMinBytes: SLOW_MIN_BYTES,
  slowRatio: SLOW_RATIO, slowRun: SLOW_RUN, baseSamples: BASE_SAMPLES, minRate: MIN_RATE, fallbackRate: STAGE2_FALLBACK_RATE, rememberMs: REMEMBER_MS,
  rateWindowMs: RATE_WINDOW_MS, minMeasureMs: MIN_MEASURE_MS, minMeasureBytes: MIN_MEASURE_BYTES, minMeasureShortMs: MIN_MEASURE_SHORT_MS,
};

/** 조절기의 시계. now = 단조 ms(속도 · 사건 묶음 · 토큰), wall = 달력 ms(하루 기억의 기한). 시험은 가짜 시계를 넣는다 */
export interface GovernorClock {
  now(): number;
  wall(): number;
  setTimer(fn: () => void, ms: number): unknown;
  clearTimer(timer: unknown): void;
}
/** 기억 저장소 (localStorage 와 같은 모양). 시험은 가짜를 넣는다 */
export interface StageStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
export interface GovernorEnv {
  clock?: GovernorClock;
  /** 없으면(undefined) 브라우저 localStorage(못 쓰면 메모리만), null 이면 기억하지 않음 */
  store?: StageStore | null;
  /** 단계가 바뀔 때 한 줄 (없으면 console.warn) */
  log?: (line: string) => void;
  tuning?: Partial<GovernorTuning>;
}

/** 요청 한 번(조각 하나 · 이어 받기 한 번)의 자리. fetchRange 가 응답 머리가 옴 · 받은 바이트 · 멈춤 · 끊김 · 끝을 알린다 */
export interface RangeTicket {
  /** 줄에서의 부른 차례 — 같은 읽기의 다음 요청(다음 조각 · 다시 보내기)은 이 차례를 그대로 쓴다(acquire 의 order) */
  readonly order: number;
  /** 응답 머리가 왔다 (단계를 낮춘 뒤 첫 응답 머리부터 실제 속도를 새로 잰다) */
  responded(): void;
  /** 본문 바이트를 받았다 */
  received(bytes: number): void;
  /** 응답 머리 · 본문이 STALL_MS 동안 오지 않아 끊었다 — 끊김 신호 (응답 머리 전 기다림은 그동안 같은 주소의 다른 요청에서 바이트가 흘렀으면 세지 않음) */
  stalled(): void;
  /** 응답 머리 · 본문을 받은 뒤 연결이 끊겼다(TypeError) · 응답 머리(Content-Range, 못 읽으면 Content-Length)가 약속한 만큼 오기 전에 닫혔다(덜 받음) — 끊김 신호 */
  dropped(): void;
  /** 끝 (한 번만 — 두 번째부터는 무시). 자리를 풀고, 요청한 바이트를 다 받았으면(complete) 느려짐 표본을 볼 때 */
  release(complete: boolean): void;
  /**
   * 다 받고(complete) 같은 읽기의 다음 조각을 줄에 세운다 — 같은 줄 차례 · 부른 차례로, 자리를 풀기 전에 세워 둔다. 그래서 읽기 하나의 조각들은 먼저 부른
   * 같은 차례 · 뒤 차례 읽기에 끼어들기를 당하지 않고, 앞 차례 · 나중에 부른 보는 장면이 기다리고 있으면 그쪽이 먼저 간다(조각 사이에서 앞당김)
   */
  handoff(bytes: number, signal?: AbortSignal): Promise<RangeTicket>;
}

interface Remembered { stage: number; rate: number | null; until: number }
interface Waiter { bytes: number; priority: ReadPriority | undefined; order: number; resolve: (t: RangeTicket) => void; signal?: AbortSignal; onAbort?: () => void }
/**
 * 나가 있는 요청 하나 (gen = 보낼 때까지 이 페이지에서 낮춘 횟수 — 낮추기 전에 보낸 요청을 가린다,
 * bytesAtSend = 보낼 때 그 주소에서 받은 바이트 합 — 응답 머리 전 끊김 동안 다른 요청에서 바이트가 흘렀는지)
 */
interface Sent { gen: number; bytesAtSend: number; respondedAt: number | null; received: number; debit: number; done: boolean }
/** 실제 속도 재기의 점: b = 바쁜 시계(ms), n = 그때까지 그 주소에서 받은 바이트 합 */
interface RatePoint { b: number; n: number }

const realClock: GovernorClock = {
  now: () => performance.now(),
  wall: () => Date.now(),
  setTimer: (fn, ms) => setTimeout(fn, ms),
  clearTimer: (t) => clearTimeout(t as ReturnType<typeof setTimeout>),
};
const abortReason = (signal: AbortSignal): unknown => signal.reason ?? new DOMException('Aborted', 'AbortError');

function median(xs: readonly number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
/** 바이트를 사람이 읽는 꼴 (1 MB 부터 MB, 10 KB 부터 KB, 아래는 B — 시험의 작은 조각) */
function fmtBytes(n: number): string {
  if (n >= MiB) return `${Number((n / MiB).toFixed(1))} MB`;
  if (n >= 10 * KiB) return `${Math.round(n / KiB)} KB`;
  return `${Math.round(n)} B`;
}

/** 줄에서 a 가 b 보다 먼저 나가는가: 줄 차례 → (보는 장면끼리는 나중에 부른 것 먼저) → 부른 차례 */
function before(a: Waiter, b: Waiter): boolean {
  const la = priorityLevel(a.priority), lb = priorityLevel(b.priority);
  if (la !== lb) return la < lb;
  if (la <= PRIORITY_VIEW) { // 밀대를 끌다 멈춘 마지막 장면이 먼저 (지나간 장면의 읽기는 끊기지 않고 뒤로)
    const ta = priorityTurn(a.priority) ?? a.order, tb = priorityTurn(b.priority) ?? b.order;
    if (ta !== tb) return ta > tb;
  }
  return a.order < b.order; // 같은 읽기 · 같은 부름 안에서는 먼저 시작한 것 (미리 읽기 · 전 시점 범위는 늘 부른 차례)
}

/** 주소의 origin (상대 주소는 페이지 주소 기준). 알 수 없으면 '(상대 주소)' */
export function originOf(url: string): string {
  try { return new URL(url, (globalThis as { location?: { href?: string } }).location?.href).origin; } catch { return '(상대 주소)'; }
}
const hostOf = (origin: string): string => { try { return new URL(origin).host || origin; } catch { return origin; } };

/** 브라우저 localStorage — 없거나 막혀 있으면(사생활 창 · 막힌 iframe — 접근만으로 예외) null: 이 페이지 메모리에서만 */
function browserStore(): StageStore | null {
  try { return (globalThis as { localStorage?: StageStore }).localStorage ?? null; } catch { return null; }
}
const validRecord = (v: unknown): v is Remembered => {
  const r = v as Partial<Remembered> | null;
  return !!r && typeof r === 'object' && Number.isInteger(r.stage) && (r.stage as number) >= 1 && (r.stage as number) <= 64
    && (r.rate === null || (typeof r.rate === 'number' && Number.isFinite(r.rate) && r.rate > 0)) && typeof r.until === 'number' && Number.isFinite(r.until);
};
/** 기억한 기록 모두 (기한이 지났거나 깨진 것은 빼고 저장소에서도 지운다). 저장소를 못 쓰면 빈 기록 */
function readAll(store: StageStore, wall: number): Record<string, Remembered> {
  let raw: string | null;
  try { raw = store.getItem(STORAGE_KEY); } catch { return {}; }
  if (!raw) return {};
  let data: unknown;
  try { data = JSON.parse(raw); } catch { data = null; }
  const out: Record<string, Remembered> = {};
  let dropped = !data || typeof data !== 'object';
  for (const [origin, v] of Object.entries((data && typeof data === 'object' ? data : {}) as Record<string, unknown>)) {
    if (validRecord(v) && v.until > wall) out[origin] = { stage: v.stage, rate: v.rate, until: v.until };
    else dropped = true;
  }
  if (dropped) writeAll(store, out);
  return out;
}
function writeAll(store: StageStore, all: Record<string, Remembered>): void {
  try {
    if (Object.keys(all).length) store.setItem(STORAGE_KEY, JSON.stringify(all));
    else store.removeItem(STORAGE_KEY);
  } catch { /* 저장하지 못하면 이 페이지에서만 */ }
}

/** 서버 주소(origin) 하나의 단계 · 줄 · 자리 · 잰 속도 */
export class OriginGovernor {
  /** 지금 단계 (0 = 제약 없음). 이 페이지에서는 올라가지 않는다 */
  stage = 0;
  /** 묶은 받기 속도 상한 (바이트/초). 0단계는 null, 1단계는 0단계에서 실제 속도를 쟀을 때만(못 쟀으면 null), 2단계부터는 늘 있음 */
  rate: number | null = null;
  /** 마지막으로 낮출 때 '앞 단계에서 잰 실제 속도' (0단계 → 1단계도 — 못 쟀으면 null). 끊김이면 상한의 근거, 느려짐이면 근거가 아님(이미 느려진 속도 — 기록만) */
  measured: number | null = null;
  private samples: number[] = [];
  private slowRun = 0;
  private lowered = 0;
  private loweredAt = -Infinity;
  private bytesAtLower = 0;
  /** 이 주소의 바이트 구간 요청으로 받은 본문 바이트 합 */
  private bytes = 0;
  private active = 0;
  private readonly queue: Waiter[] = [];
  private tokens = 0;
  private last = 0;
  private timer: unknown = null;
  /** 바쁜 시계: 지난 바쁜 시간의 합(ms)과, 지금 바쁘면 바빠진 때 */
  private busyAcc = 0;
  private busyFrom: number | null = null;
  /** 이 단계의 실제 속도 재기 — 낮춘 뒤 첫 응답 머리 전에는 재지 않는다(false) */
  private measuring = true;
  /** 재기 점 (첫 점 = 재기 시작 · 창 앞에 있는 점 하나만 남김) */
  private pts: RatePoint[] = [{ b: 0, n: 0 }];
  /** 마지막 바이트를 받은 때까지의 창으로 잰 실제 속도 (바이트/초 — 못 쟀으면 null) */
  private rateNow: number | null = null;
  /** 마지막 느려짐 표본 때의 bytes */
  private sampledBytes = 0;

  constructor(readonly origin: string, private readonly clock: GovernorClock, private readonly store: StageStore | null,
    private readonly log: (line: string) => void, private readonly t: Readonly<GovernorTuning>) {
    if (!store) return;
    const rec = readAll(store, clock.wall())[origin];
    if (!rec) return;
    this.stage = rec.stage;
    // 1단계는 상한이 있었을 때만(0단계에서 잰 실제 속도의 절반) 되살린다. 2단계부터는 늘 상한(깨져 없으면 5 MB/s)
    this.rate = rec.stage >= 2 ? Math.max(t.minRate, rec.rate ?? t.fallbackRate) : rec.rate !== null ? Math.max(t.minRate, rec.rate) : null;
    this.fillBucket();
    this.log(`[결과 읽기] ${hostOf(origin)}: 기억한 ${this.describe()}로 시작 (${new Date(rec.until).toLocaleString()}까지)`);
  }

  /** 읽기 하나 안에서 한 요청이 받는 바이트 — 0단계는 나누지 않음(Infinity), 1단계 2 MB, 그 뒤 단계마다 절반(바닥 256 KB) */
  get chunkBytes(): number { return this.chunkFor(this.stage); }
  /** 이 주소의 바이트 구간 요청이 동시에 나가 있을 수 있는 수 */
  get parallel(): number { return this.stage === 0 ? Infinity : LOWERED_PARALLEL; }
  /** 나가 있는 요청 수 (시험) */
  get inFlight(): number { return this.active; }
  /** 줄에서 기다리는 요청 수 (시험) */
  get waiting(): number { return this.queue.length; }
  /** 이 단계에서 잰 실제 속도 (바이트/초 — 마지막 바이트를 받은 때까지의 창, 못 쟀으면 null) */
  get realRate(): number | null { return this.rateNow; }
  /** 상한이 없을 때(0단계 · 상한 없는 1단계)의 느려짐 기준 (바이트/초 — 이 단계 표본의 중앙값, 표본이 모자라면 null) */
  get typicalRate(): number | null { return this.samples.length >= this.t.baseSamples ? median(this.samples) : null; }
  /** 느려짐 기준 — 상한이 있으면(1단계부터) 상한(상한에 묶여 느린 것은 느려짐이 아님), 없으면(0단계 · 상한 없는 1단계) typicalRate */
  get slowBase(): number | null { return this.rate ?? this.typicalRate; }

  /** 그 단계의 조각 크기 (시험이 조각을 줄였으면 바닥도 그 아래로 내려가지 않게 — 늘 1단계 조각 이하) */
  private chunkFor(stage: number): number {
    if (stage === 0) return Infinity;
    const t = this.t;
    return Math.max(Math.min(t.minChunkBytes, t.chunkBytes), Math.floor(t.chunkBytes / 2 ** (stage - 1)));
  }

  /** 지금 단계를 한 마디로 (콘솔 줄) */
  describe(): string {
    if (this.stage === 0) return '0단계(제약 없음)';
    const chunk = `${fmtBytes(this.chunkBytes)}씩`;
    if (this.rate === null) return `${this.stage}단계(${chunk} · 동시 ${LOWERED_PARALLEL}개)`;
    return `${this.stage}단계(${chunk} · 초당 ${fmtBytes(this.rate)} · 동시 ${LOWERED_PARALLEL}개)`;
  }

  /**
   * 바이트 구간 요청 하나를 보내도 될 때까지 줄을 선다 → 자리(RangeTicket). 받은 쪽은 끝날 때 반드시 release(또는 handoff) 한다.
   * bytes = 이 요청이 받을 바이트(유한한 0 이상 — 아니면 거부). order = 같은 읽기의 앞 요청 차례(RangeTicket.order — 다시 보내기가 줄 뒤로 밀리지 않게).
   * 기다리다 signal 로 끊기면 줄에서 빠지고 그 이유로 끝난다.
   */
  acquire(bytes: number, priority?: ReadPriority, signal?: AbortSignal, order?: number): Promise<RangeTicket> {
    return this.enqueue(bytes, priority, signal, order ?? nextReadTurn(), true);
  }

  private enqueue(bytes: number, priority: ReadPriority | undefined, signal: AbortSignal | undefined, order: number, pump: boolean): Promise<RangeTicket> {
    if (!Number.isFinite(bytes) || bytes < 0) return Promise.reject(new Error(`받을 바이트 수가 잘못되었습니다 (${bytes}): ${hostOf(this.origin)}`));
    if (signal?.aborted) return Promise.reject(abortReason(signal));
    return new Promise<RangeTicket>((resolve, reject) => {
      const w: Waiter = { bytes, priority, order, resolve, signal };
      if (signal) {
        w.onAbort = (): void => {
          const i = this.queue.indexOf(w);
          if (i < 0) return; // 이미 보냈다 — 부른 쪽이 signal 을 다시 본다
          this.queue.splice(i, 1);
          reject(abortReason(signal));
          this.pump();
        };
        signal.addEventListener('abort', w.onAbort, { once: true });
      }
      this.queue.push(w);
      this.track();
      if (pump) this.pump();
    });
  }

  /** 줄에서 보낼 수 있는 만큼 보낸다: 자리가 있으면 차례가 가장 앞인 요청(before), 상한이 있으면(1단계부터) 토큰이 모자라면 그만큼 기다렸다가 */
  private pump(): void {
    if (this.timer !== null) { this.clock.clearTimer(this.timer); this.timer = null; }
    while (this.queue.length && this.active < this.parallel) {
      let bi = 0;
      for (let i = 1; i < this.queue.length; i++) if (before(this.queue[i], this.queue[bi])) bi = i;
      const w = this.queue[bi];
      let debit = 0;
      if (this.rate !== null) {
        this.refill();
        const need = Math.min(w.bytes, this.chunkBytes); // 통보다 큰 요청(시험의 큰 조각 · 낮추기 전에 정한 조각)은 통이 가득 찼을 때
        if (this.tokens < need) {
          this.timer = this.clock.setTimer(() => { this.timer = null; this.pump(); }, Math.ceil(((need - this.tokens) * 1000) / this.rate));
          break;
        }
        this.tokens -= w.bytes;
        debit = w.bytes;
      }
      this.queue.splice(bi, 1);
      if (w.signal && w.onAbort) w.signal.removeEventListener('abort', w.onAbort);
      this.active++;
      w.resolve(this.ticket(debit, w));
    }
    this.track();
  }

  private refill(): void {
    const now = this.clock.now();
    if (this.rate !== null) this.tokens = Math.min(this.chunkBytes, this.tokens + ((now - this.last) * this.rate) / 1000);
    this.last = now;
  }
  private fillBucket(): void { this.tokens = this.chunkBytes; this.last = this.clock.now(); }

  /** 바쁜 시계 (ms) — 바이트 구간 요청이 하나라도 나가 있거나 줄에서 기다리던 시간의 합 */
  private busyNow(): number { return this.busyAcc + (this.busyFrom !== null ? this.clock.now() - this.busyFrom : 0); }
  /** 나가 있음 · 기다림이 바뀐 뒤 바쁜 시계를 맞춘다 */
  private track(): void {
    const busy = this.active > 0 || this.queue.length > 0;
    if (busy && this.busyFrom === null) this.busyFrom = this.clock.now();
    else if (!busy && this.busyFrom !== null) { this.busyAcc += this.clock.now() - this.busyFrom; this.busyFrom = null; }
  }

  /** 이 단계의 실제 속도를 지금부터 새로 잰다 */
  private startMeasure(): void {
    this.measuring = true;
    this.pts = [{ b: this.busyNow(), n: this.bytes }];
    this.rateNow = null;
    this.sampledBytes = this.bytes;
  }
  /** 바이트를 받은 뒤: 최근 창(바쁜 시간 rateWindowMs)의 받은 바이트 ÷ 바쁜 시간 */
  private measure(): void {
    if (!this.measuring) return;
    const b = this.busyNow();
    const pts = this.pts;
    // 점은 RATE_GRAIN_MS 마다 하나 — 그 안에 온 본문 조각은 마지막 점을 옮긴다(빠른 망에서 조각마다 점이 쌓이지 않게)
    if (pts.length >= 2 && b - pts[pts.length - 2].b < RATE_GRAIN_MS) { const p = pts[pts.length - 1]; p.b = b; p.n = this.bytes; }
    else pts.push({ b, n: this.bytes });
    const from = b - this.t.rateWindowMs;
    while (pts.length >= 2 && pts[1].b <= from) pts.shift(); // 창 앞에 있는 점은 하나만 남긴다
    const span = b - pts[0].b;
    const got = this.bytes - pts[0].n;
    // 짧은 규칙(0.3 초 · 4 MB)은 0단계만 — 1단계부터 동시 1 개로 2 MB 조각을 틈 없이 몰아 받은 0.3~1 초의 속도는 문턱 위로 부푼다
    // (Node 실측 1단계는 약 0.6 초 만에 끊겼다 — 짧은 규칙을 걸면 2단계가 5 MB/s 대신 그 몰린 속도의 절반이 된다. 재현)
    const enough = span >= this.t.minMeasureMs || (this.stage === 0 && span >= this.t.minMeasureShortMs && got >= this.t.minMeasureBytes);
    this.rateNow = enough ? (got * 1000) / span : null;
  }

  private ticket(debit: number, w: Waiter): RangeTicket {
    const s: Sent = { gen: this.lowered, bytesAtSend: this.bytes, respondedAt: null, received: 0, debit, done: false };
    const finish = (complete: boolean): boolean => {
      if (s.done) return false;
      s.done = true;
      this.active--;
      if (s.debit > 0 && s.gen === this.lowered && this.rate !== null) { // 받지 못한 몫은 돌려준다 (같은 단계일 때 — 낮추면 통을 새로 채운다)
        this.refill();
        this.tokens = Math.min(this.chunkBytes, this.tokens + Math.max(0, s.debit - s.received));
      }
      if (complete) this.sample();
      this.track();
      return true;
    };
    return {
      order: w.order,
      responded: () => {
        if (s.done || s.respondedAt !== null) return;
        s.respondedAt = this.clock.now();
        if (!this.measuring) this.startMeasure(); // 낮춘 뒤 다시 흐른다 — 끊김 동안 다시 보내던 시간은 재지 않는다
      },
      received: (n) => { if (s.done || !(n > 0)) return; s.received += n; this.bytes += n; this.measure(); },
      stalled: () => {
        if (s.done) return;
        if (s.respondedAt === null && this.bytes > s.bytesAtSend) return; // 응답 머리를 기다리는 동안 같은 주소의 다른 요청에서 바이트가 흘렀다 — 브라우저 안 연결 차례 기다림
        this.signal('끊김', s.gen);
      },
      dropped: () => { if (!s.done) this.signal('끊김', s.gen); },
      release: (complete) => { if (finish(complete)) this.pump(); },
      handoff: (bytes, signal) => {
        const next = this.enqueue(bytes, w.priority, signal, w.order, false); // 자리를 풀기 전에 줄에 세운다
        finish(true);
        this.pump();
        return next;
      },
    };
  }

  /** 요청이 다 끝났을 때 — 그새 SLOW_MIN_BYTES 이상 받았으면 실제 속도 표본 하나: 기준의 4분의 1 아래면 느림 셈, 아니면(상한이 없을 때) 기준 표본 */
  private sample(): void {
    if (!this.measuring || this.rateNow === null || this.bytes - this.sampledBytes < this.t.slowMinBytes) return;
    this.sampledBytes = this.bytes;
    const speed = this.rateNow;
    const base = this.slowBase;
    if (base !== null && speed < base * this.t.slowRatio) {
      if (++this.slowRun >= this.t.slowRun) { this.slowRun = 0; this.signal('느려짐', this.lowered); }
      return;
    }
    this.slowRun = 0;
    if (this.rate !== null) return; // 상한이 있으면 기준은 상한
    this.samples.push(speed);
    if (this.samples.length > MAX_SAMPLES) this.samples.shift();
  }

  /** 신호 하나 (gen = 그 요청을 보낼 때의 낮춘 횟수) — 같은 사건이 아니면 단계를 낮춘다 */
  private signal(why: '끊김' | '느려짐', gen: number): void {
    if (gen !== this.lowered) return; // 낮추기 전에 보낸 요청 — 같은 사건
    if (this.lowered > 0) {
      const since = this.clock.now() - this.loweredAt;
      if (since < this.t.sameEventMs) return;
      if (this.bytes === this.bytesAtLower && since < this.t.sameEventMaxMs) return; // 낮춘 뒤 아직 한 바이트도 못 받음 — 그 끊김이 이어지는 중 (3 분까지)
    }
    this.lower(why);
  }

  private lower(why: '끊김' | '느려짐'): void {
    const t = this.t;
    // 이 단계에서 잰 실제 속도 (마지막 바이트까지의 창 — 끊긴 뒤 기다린 시간은 사건이라 뺌). 0단계면 그때 함께 받던 요청을 합친 그 주소의 속도
    const measured = this.rateNow;
    const cur = this.rate; // 지금 상한 (0단계 · 상한 없는 1단계는 null)
    // 상한의 근거 = 사건 전 속도. 끊김: 잰 실제 속도(끊긴 시간이 들어가지 않아 끊기기 전 속도). 느려짐: 느려짐 판정의 기준(slowBase — 상한, 없으면 그 단계
    // 표본 중앙값 typicalRate. 느린 표본은 표본에 넣지 않으므로 느려지기 전 속도) — 이미 느려진 실제 속도의 절반으로 하루 묶지 않게.
    // 느려짐 신호는 기준이 있어야 나므로(sample) 느려짐의 basis 는 늘 있다 — 아래 null 갈래는 끊김의 '못 잼'
    const basis = why === '느려짐' ? this.slowBase : measured;
    let rate: number | null;
    if (this.stage === 0) {
      // 1단계 상한 = 근거의 절반, 못 쟀으면 상한 없음. Chrome 실측 A: 상한 없는 1단계가 초당 약 19 MB 로 받다 한 번 더 끊겼고,
      // 실측 C(2 MB 조각 · 초당 9.2 MB · 동시 1)는 끊김 0 — 0단계 약 20.5 MB/s 의 절반이면 그 근처
      rate = basis !== null ? basis / 2 : null;
    } else {
      if (cur !== null && cur <= t.minRate && this.chunkFor(this.stage + 1) >= this.chunkBytes) return; // 속도 · 조각 모두 바닥 — 더 낮추지 않는다
      // 올리지 않는다 — 잰 속도가 상한보다 높게 잡혀도(토큰 통 한 칸) 상한의 절반(느려짐은 늘 상한의 절반). 상한이 없던 1단계는 근거의 절반,
      // 그것도 없으면 5 MB/s
      if (cur === null) rate = basis !== null ? basis / 2 : t.fallbackRate;
      else rate = Math.min(basis ?? cur, cur) / 2;
    }
    if (rate !== null) rate = Math.max(t.minRate, rate);
    this.stage++;
    this.rate = rate;
    this.measured = measured;
    this.lowered++;
    this.loweredAt = this.clock.now();
    this.bytesAtLower = this.bytes;
    this.samples = [];
    this.slowRun = 0;
    this.measuring = false;
    this.pts = [];
    this.rateNow = null;
    if (this.rate !== null) this.fillBucket();
    this.remember();
    this.log(`[결과 읽기] ${hostOf(this.origin)}: ${why} → ${this.describe()}`);
    this.pump();
  }

  /**
   * 지금 단계 · 상한(1단계 상한도)을 하루 동안 기억한다. 다른 탭이 그새 적어 둔 더 엄격한 기록은 느슨한 쪽으로 덮지 않는다:
   * - 더 깊은 단계 기록: 그대로 둔다(기한도 그대로 — 이번 사건은 더 얕은 단계에서 난 것이라 더 센 제약을 늘릴 근거가 아니다).
   * - 같은 단계에 상한이 있고 이번 상한이 없거나 더 높으면(검증 low): 그 단계 · 상한을 두고 기한만 이번 낮춘 때부터 하루로 늘린다. 같은 단계로 낮춘
   *   사건이 이 주소에서 방금 또 났으니 '낮출 때마다 그때 + 하루' 규칙대로 그 단계를 기억하고, 상한은 그 단계에서 다른 탭이 잰 더 낮은 값을 지킨다.
   *   이 페이지의 단계 · 상한은 그대로다(탭끼리는 다음에 열 때만 따름).
   */
  private remember(): void {
    if (!this.store) return;
    const wall = this.clock.wall();
    const all = readAll(this.store, wall);
    const prev = all[this.origin];
    const until = wall + this.t.rememberMs;
    if (prev && prev.stage > this.stage) return;
    if (prev && prev.stage === this.stage && prev.rate !== null && (this.rate === null || this.rate > prev.rate)) {
      all[this.origin] = { stage: prev.stage, rate: prev.rate, until: Math.max(prev.until, until) };
    } else {
      all[this.origin] = { stage: this.stage, rate: this.rate, until };
    }
    writeAll(this.store, all);
  }
}

/** 서버 주소(origin)마다 OriginGovernor 하나 */
export class RangeGovernor {
  private readonly origins = new Map<string, OriginGovernor>();
  private store: StageStore | null | undefined;
  private readonly clock: GovernorClock;
  private readonly log: (line: string) => void;
  private readonly tuning: Readonly<GovernorTuning>;
  constructor(env: GovernorEnv = {}) {
    this.store = env.store;
    this.clock = env.clock ?? realClock;
    this.log = env.log ?? ((line) => console.warn(line));
    this.tuning = { ...DEFAULT_TUNING, ...env.tuning };
  }
  /** 그 주소(파일 주소 — origin 으로 묶음)의 조절기 */
  forUrl(url: string): OriginGovernor { return this.forOrigin(originOf(url)); }
  forOrigin(origin: string): OriginGovernor {
    let g = this.origins.get(origin);
    if (!g) {
      if (this.store === undefined) this.store = browserStore();
      g = new OriginGovernor(origin, this.clock, this.store, this.log, this.tuning);
      this.origins.set(origin, g);
    }
    return g;
  }
}

/** 모든 바이트 구간 받기가 함께 쓰는 조절기 (FetchOpts.governor 가 없을 때 — resilientFetch) */
export const rangeGovernor = new RangeGovernor();

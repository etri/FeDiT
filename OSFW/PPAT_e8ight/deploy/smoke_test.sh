#!/usr/bin/env bash
# SPDX-License-Identifier: LGPL-2.1-only
# Copyright (c) 2026 E8IGHT Co., Ltd.
# 띄운 뒤 확인: 엔진 상태 → 페이지 → 해석 1건 실행 → (앞단을 거치면) 결과 폴더 읽기 → 결과 ZIP 받기.
# 물리 시뮬레이션 페이지가 할 일(POST engine/jobs, 상태 조회)과 후처리가 할 일(results/ 읽기)을 curl 로 대신한다.
#
# 사용: bash smoke_test.sh <입력 JSON> [STL ...]
#   예: bash smoke_test.sh <해석엔진 패키지 폴더>/examples/03_concentration_diffusion/03_concentration_diffusion.json
#   앞단을 거쳐: PROXY=http://127.0.0.1:8090 bash smoke_test.sh <입력 JSON>   (engine/ · results/ · 페이지를 모두 앞단으로)
# 환경 변수: ENGINE_KIND(lbm|lbm_dem, 기본 lbm) JOB_ID RANGE(last|all, 기본 all) OUT(ZIP 둘 폴더, 기본 .) TIMEOUT_S(기본 1800)
#            PROXY(앞단 주소. 주면 아래 셋의 기본값이 됨) ENGINE·RENDERER·RESULTS(각각 따로 줄 때) ACCESS_KEY(앞단에 접근 키를 넣었을 때)
#            ENGINE·RENDERER 기본은 같은 폴더 .env 의 ENGINE_PORT·RENDERER_PORT(없으면 18080·8088)로 바로 부른다. RESULTS 는 없으면 건너뜀
set -euo pipefail
HERE=$(cd "$(dirname "$0")" && pwd)
# 같은 폴더 .env 에서 포트 숫자 하나만 읽는다(.env 전체를 셸로 읽지 않는다)
port() { local v=""; [ -f "$HERE/.env" ] && v=$(sed -n "s/^$1=\([0-9][0-9]*\)[[:space:]]*\$/\1/p" "$HERE/.env" | tail -n 1); echo "${v:-$2}"; }
PROXY=${PROXY:-}
PROXY=${PROXY%/}
if [ -n "$PROXY" ]; then
  ENGINE=${ENGINE:-$PROXY/engine}
  RENDERER=${RENDERER:-$PROXY}
  RESULTS=${RESULTS:-$PROXY/results}
else
  ENGINE=${ENGINE:-http://127.0.0.1:$(port ENGINE_PORT 18080)}
  RENDERER=${RENDERER:-http://127.0.0.1:$(port RENDERER_PORT 8088)}
  RESULTS=${RESULTS:-}
fi
# 주소 끝의 / 는 뗀다(아래에서 /health, /jobs 처럼 붙인다). 주소에 하위 경로(…/engine)가 있어도 된다
ENGINE=${ENGINE%/}; RENDERER=${RENDERER%/}; RESULTS=${RESULTS%/}
ENGINE_KIND=${ENGINE_KIND:-lbm}
RANGE=${RANGE:-all}
OUT=${OUT:-.}
TIMEOUT_S=${TIMEOUT_S:-1800}
ACCESS_KEY=${ACCESS_KEY:-}
[ $# -ge 1 ] || { sed -n '2,10p' "$0"; exit 2; }
CONFIG=$1; shift
JOB_ID=${JOB_ID:-smoke_$(date +%Y%m%d_%H%M%S)}

step() { printf '\n== %s\n' "$*"; }
fail() { printf '\n실패: %s\n' "$*" >&2; exit 1; }
# 응답 JSON 에서 맨 앞의 "키": 값 하나를 꺼낸다(작업 상태의 status 는 callback 안의 status 보다 앞에 온다).
# 키가 없으면(대기 중이라 progress 가 null 등) 빈 값 — 실패로 끝내지 않는다
field() { { printf '%s' "$1" | grep -o "\"$2\": *\"\\{0,1\\}[^\",}]*" || true; } | head -1 | sed 's/^[^:]*: *"\{0,1\}//'; }
# 응답 코드만
code_of() { curl -s -o /dev/null -w '%{http_code}' "$@" || true; }

for f in "$CONFIG" "$@"; do [ -f "$f" ] || fail "입력 파일이 없습니다: $f"; done

step "1. 엔진 상태 (GET $ENGINE/health)"
health=$(curl -fsS "$ENGINE/health") || fail "엔진이 응답하지 않습니다(503 이면 컨테이너 안에서 GPU가 안 보이는 것, 502 면 앞단이 엔진을 못 찾는 것)"
echo "$health"

step "2. 페이지 ($RENDERER)"
for p in healthz index.html pre.html sim.html post.html datasets.json models/library.json templates/concentration_diffusion.json; do
  # 연결이 안 되면 curl 이 000 을 쓰고 실패 코드로 끝난다 — 여기서 멈추지 않고 아래 줄에서 알린다
  code=$(code_of "$RENDERER/$p")
  echo "$code  /$p"
  [ "$code" = 200 ] || fail "/$p 응답이 $code"
done

step "3. 해석 실행 (POST $ENGINE/jobs, job_id=$JOB_ID, engine=$ENGINE_KIND)"
args=(-F "job_id=$JOB_ID" -F "engine=$ENGINE_KIND" -F "config=@$CONFIG")
for f in "$@"; do args+=(-F "files=@$f"); done
[ -z "$ACCESS_KEY" ] || args+=(-b "cfd_key=$ACCESS_KEY")
resp=$(curl -sS -w '\n%{http_code}' "${args[@]}" "$ENGINE/jobs" || true)
code=${resp##*$'\n'}; body=${resp%$'\n'*}
echo "$code $body"
[ "$code" != 401 ] || fail "앞단이 접근 키를 요구합니다(ACCESS_KEY 환경 변수로 주세요)"
[ "$code" = 202 ] || fail "POST /jobs 응답이 $code"

step "4. 끝나기를 기다림 (GET $ENGINE/jobs/$JOB_ID, 5초마다)"
start=$(date +%s)
while :; do
  st=$(curl -fsS "$ENGINE/jobs/$JOB_ID") || fail "상태 조회 실패: $ENGINE/jobs/$JOB_ID"
  status=$(field "$st" status); pct=$(field "$st" percent)
  printf '\r  %-9s %6s%%  %5ds ' "$status" "${pct:--}" $(( $(date +%s) - start ))
  case $status in
    completed) echo; break ;;
    failed) echo; echo "$st"; fail "해석 실패: $(field "$st" message)" ;;
  esac
  [ $(( $(date +%s) - start )) -lt "$TIMEOUT_S" ] || fail "${TIMEOUT_S}초 안에 끝나지 않음"
  sleep 5
done
echo "$st"

if [ -n "$RESULTS" ]; then
  step "5. 결과 폴더 읽기 ($RESULTS/$JOB_ID/)"
  list=$(curl -fsS "$RESULTS/$JOB_ID/") || fail "작업 폴더 목록을 읽지 못함: $RESULTS/$JOB_ID/"
  { printf '%s\n' "$list" | grep -o '"name":"[^"]*"' || true; } | sed 's/^/  /'
  rpath=$(field "$st" result_path)
  case $rpath in ""|null) fail "상태에 result_path 가 없습니다" ;; esac
  rlist=$(curl -fsS "$RESULTS/${rpath%/}/") || fail "결과 폴더 목록을 읽지 못함: $RESULTS/${rpath%/}/"
  vtm=$(printf '%s' "$rlist" | grep -o '"name":"[^"]*\.vtm"' | head -1 | sed 's/^"name":"//; s/"$//')
  [ -n "$vtm" ] || fail "결과 폴더에 .vtm 이 없습니다: $RESULTS/${rpath%/}/"
  echo "  .vtm $(printf '%s' "$rlist" | grep -c '\.vtm"' || true)개, 첫 파일 $vtm"
  # 후처리는 큰 .vtu 를 바이트 범위로 읽는다 — 앞단이 Range 를 지원하는지
  code=$(code_of -H 'Range: bytes=0-15' "$RESULTS/${rpath%/}/$vtm")
  echo "  $code  Range bytes=0-15  ${rpath%/}/$vtm"
  [ "$code" = 206 ] || fail "바이트 범위 읽기 응답이 $code (206 이어야 함)"
  # .vtm 이 가리키는 첫 .vtu 도 바이트 범위로 읽히는지(해석기가 만든 bin/LEVEL_xx 폴더·파일을 앞단이 읽을 수 있는지까지).
  # .vtm 은 경로를 역슬래시로 적을 수 있어 / 로 바꾼다
  vtu=$(curl -fsS "$RESULTS/${rpath%/}/$vtm" | { grep -o 'file="[^"]*"' || true; } | head -1 | sed 's/^file="//; s/"$//' | tr '\\' '/')
  if [ -n "$vtu" ]; then
    code=$(code_of -H 'Range: bytes=0-15' "$RESULTS/${rpath%/}/$vtu")
    echo "  $code  Range bytes=0-15  ${rpath%/}/$vtu"
    [ "$code" = 206 ] || fail ".vtu 바이트 범위 읽기 응답이 $code (206 이어야 함. 403 이면 해석기가 만든 파일·폴더를 앞단이 못 읽음)"
  fi
  # 재시작 파일 폴더는 열리지 않아야 한다
  if printf '%s' "$rlist" | grep -q '"name":"continue"'; then
    code=$(code_of "$RESULTS/${rpath%/}/continue/")
    echo "  $code  ${rpath%/}/continue/ (404 이어야 함)"
    [ "$code" = 404 ] || fail "continue/ 가 열립니다($code)"
  fi
else
  step "5. 결과 폴더 읽기 — 건너뜀(RESULTS 나 PROXY 를 주면 확인)"
fi

step "6. 결과 ZIP 받기 (range=$RANGE)"
mkdir -p "$OUT"
zip="$OUT/${JOB_ID}_${RANGE}.zip"
curl -fsS -o "$zip" "$ENGINE/jobs/$JOB_ID/download?range=$RANGE" || fail "다운로드 실패"
ls -l "$zip"
if command -v unzip >/dev/null; then unzip -l "$zip" | tail -n 12; fi

printf '\n완료. 후처리 페이지에서 확인: %s/post.html?job=%s (앞단을 거칠 때) 또는 이 ZIP 을 연다.\n' "$RENDERER" "$JOB_ID"
# 앞단은 DELETE 를 막으므로 지우기는 서버 안에서 엔진 포트로 직접 한다
printf '시험 작업 지우기(서버 안에서): curl -X DELETE http://127.0.0.1:%s/jobs/%s\n' "$(port ENGINE_PORT 18080)" "$JOB_ID"

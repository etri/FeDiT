#!/usr/bin/env bash
# SPDX-License-Identifier: LGPL-2.1-only
# Copyright (c) 2026 E8IGHT Co., Ltd.
# 새로 빌드한 페이지·앞단 이미지를 서버에 올리기 전에 이 PC 에서 시험한다(bundle/make_bundle.sh 가 빌드 직후 부른다).
#   시험용 컨테이너 둘(cfd-imgtest-*)을 따로 이름·포트로 띄워 확인하고 지운다. 연습용 컨테이너(union-twin-cfd-*-1)는 건드리지 않는다.
#   확인하는 것: 설정 검사(nginx -t) · 네 페이지 응답(페이지 직접·앞단 http·앞단 https) · 결과 폴더(전체 목록 숨김·파일·부분 받기)
#     · https 머리말(nginx 판 숨김, iframe 허용 출처) · 세션 티켓을 내지 않음(TLS 1.2 티켓 없음, TLS 1.3 은 캐시 번호만 담은 짧은 표)
#     · 서버 쪽 캐시로 다시 접속 · 페이지 이미지가 root 가 아닌 사용자(101)로 돎 · 저장소 최신판보다 뒤처진 Alpine 부품이 없음
#     · 해석엔진(engine) 조회 — 이 PC 에 compose 로 띄운 engine 이 있을 때만
#   화면이 실제로 그려지는지는 이 스크립트가 보지 못한다. KEEP=1 로 남겨 두고 브라우저로 네 화면을 한 번 열어 본다.
#   인증서는 시험용 자체 서명을 임시 폴더에 만들어 쓰고 지운다(진짜 인증서를 쓰지 않는다).
#
# 사용: bash deploy/test_images.sh            시험하고 정리
#       KEEP=1 bash deploy/test_images.sh     시험한 컨테이너를 남김(브라우저 확인용) → 다 보면 bash deploy/test_images.sh --clean
# 환경 변수: RENDERER_IMAGE(기본 union-twin-cfd-renderer:local) PROXY_IMAGE(기본 union-twin-cfd-proxy:local)
#   ENGINE_NETWORK(엔진이 붙은 Docker 네트워크. 비우면 이 PC 리허설(compose 프로젝트 union-twin-cfd)의 engine 이 떠 있을 때만 그 네트워크를 쓰고,
#     none 이면 엔진 확인을 건너뜀. 시험용 앞단이 그 네트워크에 잠시 붙는다 — 서버에서는 저절로 붙지 않는다)
#   TEST_PORT_RENDERER(18188) TEST_PORT_HTTP(18190) TEST_PORT_HTTPS(18443) — 모두 127.0.0.1 에만 연다
#   TMPDIR: 시험용 인증서·결과 폴더를 만들 곳(기본 /tmp). Docker 가 /tmp 를 못 보는 곳(snap 판 docker 등)에서는 TMPDIR=$HOME/tmp
# 끝 상태: 실패가 하나라도 있으면 1 ('주의'는 실패로 세지 않는다)
set -uo pipefail
export MSYS_NO_PATHCONV=1 # Windows Git Bash 가 /etc/... 같은 컨테이너 안 경로를 Windows 경로로 바꾸지 않게
R_IMG=${RENDERER_IMAGE:-union-twin-cfd-renderer:local}
P_IMG=${PROXY_IMAGE:-union-twin-cfd-proxy:local}
PR=${TEST_PORT_RENDERER:-18188}
PH=${TEST_PORT_HTTP:-18190}
PS=${TEST_PORT_HTTPS:-18443}
H=cfd.fedit.or.kr
C_R=cfd-imgtest-renderer
C_P=cfd-imgtest-proxy
NET=cfd-imgtest-net
JOB=imgtest-job

remove_all() {
  local tmp
  tmp=$(docker inspect -f '{{index .Config.Labels "cfd-imgtest.tmp"}}' "$C_P" 2>/dev/null || true)
  docker rm -f "$C_R" "$C_P" >/dev/null 2>&1 || true
  docker network rm "$NET" >/dev/null 2>&1 || true
  # 이 스크립트가 만든 임시 폴더만 지운다(이름에 cfd-imgtest 가 든 것)
  case "$tmp" in *cfd-imgtest.*) rm -rf "$tmp" ;; esac
}
if [ "${1:-}" = "--clean" ]; then remove_all; echo "시험용 컨테이너·네트워크·임시 폴더를 지웠습니다"; exit 0; fi

command -v docker >/dev/null 2>&1 || { echo "docker 가 없습니다"; exit 1; }
for img in "$R_IMG" "$P_IMG"; do
  docker image inspect "$img" >/dev/null 2>&1 || { echo "이미지가 없습니다: $img (먼저 빌드: cd deploy && docker compose build --pull --no-cache renderer proxy)"; exit 1; }
done
# 컨테이너에 붙일 폴더 경로: Windows Git Bash 에서는 C:/... 꼴로 바꿔야 Docker 가 찾는다
hostpath() { if command -v cygpath >/dev/null 2>&1; then cygpath -m "$1"; else printf '%s' "$1"; fi; }
# curl 이 응답 본문을 버릴 곳: Windows 의 curl 은 /dev/null 을 모른다(위 MSYS_NO_PATHCONV 때문에 바꿔 주지도 않음)
if command -v cygpath >/dev/null 2>&1; then NULL=NUL; else NULL=/dev/null; fi

pass=0 fail=0 skip=0 warn=0
ok() { pass=$((pass + 1)); printf '  통과    %s\n' "$*"; }
ng() { fail=$((fail + 1)); printf '  실패    %s\n' "$*"; }
sk() { skip=$((skip + 1)); printf '  건너뜀  %s\n' "$*"; }
wn() { warn=$((warn + 1)); printf '  주의    %s\n' "$*"; }
expect() { if [ "$2" = "$3" ]; then ok "$1: $3"; else ng "$1: 기대 $2, 실제 $3"; fi; }

remove_all
TMP=$(mktemp -d "${TMPDIR:-/tmp}/cfd-imgtest.XXXXXX") || TMP=""
# Windows Git Bash 의 openssl·curl·docker 는 /tmp/... 꼴을 못 알아듣는다 → 처음부터 C:/... 꼴로 쓴다(Linux 에서는 그대로)
[ -n "$TMP" ] && TMP=$(hostpath "$TMP")
case "$TMP" in *cfd-imgtest.*) [ -d "$TMP" ] || TMP="" ;; *) TMP="" ;; esac
[ -n "$TMP" ] || { echo "임시 폴더를 만들지 못했습니다(TMPDIR=${TMPDIR:-/tmp} 확인)"; exit 1; }
# 끝나면(중간에 실패해도) 컨테이너·네트워크와 이번 임시 폴더를 지운다. KEEP=1 이면 남긴다(--clean 이 앞단 컨테이너의 이름표로 폴더를 찾아 지움)
cleanup() { remove_all; case "$TMP" in *cfd-imgtest.*) rm -rf "$TMP" ;; esac; }
if [ "${KEEP:-}" != 1 ]; then trap cleanup EXIT; fi

echo "== 준비: 시험용 인증서·결과 폴더 (임시 폴더 $TMP)"
mkdir -p "$TMP/certs" "$TMP/jobs/$JOB"
if command -v openssl >/dev/null 2>&1; then
  openssl req -x509 -newkey rsa:2048 -nodes -days 1 -subj "/CN=$H" -addext "subjectAltName=DNS:$H" \
    -keyout "$TMP/certs/privkey.pem" -out "$TMP/certs/fullchain.pem" >/dev/null 2>&1 || { echo "시험용 인증서를 만들지 못했습니다"; exit 1; }
else
  echo "openssl 이 없어 시험용 인증서를 만들 수 없습니다"; exit 1
fi
head -c 4096 /dev/zero | tr '\0' 'a' > "$TMP/jobs/$JOB/result.txt"
# 서버(Linux)에서 돌려도 nginx 작업 프로세스(uid 101)가 읽게 한다
chmod 755 "$TMP" "$TMP/jobs" "$TMP/jobs/$JOB" "$TMP/certs"
chmod 644 "$TMP/jobs/$JOB/result.txt" "$TMP/certs/fullchain.pem" "$TMP/certs/privkey.pem"

# 엔진: 직접 주지 않으면 이 PC 리허설(compose 프로젝트 union-twin-cfd)의 engine 이 정상(healthy)으로 떠 있을 때만 그 네트워크를 쓴다.
# 다른 프로젝트의 engine(서버의 1세부 엔진 등)에는 저절로 붙지 않는다
ENGINE_NET=${ENGINE_NETWORK:-}
if [ -z "$ENGINE_NET" ]; then
  eng=$(docker ps --filter 'label=com.docker.compose.project=union-twin-cfd' --filter 'label=com.docker.compose.service=engine' --filter 'health=healthy' --format '{{.Names}}' | head -n 1)
  [ -n "$eng" ] && ENGINE_NET=$(docker inspect "$eng" --format '{{range $k, $v := .NetworkSettings.Networks}}{{$k}} {{end}}' | awk '{print $1}')
fi
[ "$ENGINE_NET" = none ] && ENGINE_NET=""

echo "== 띄우기: $R_IMG · $P_IMG"
docker network create "$NET" >/dev/null
# 페이지: compose 와 같은 제한(권한 모두 빼기, 권한 상승 막기)
docker run -d --name "$C_R" --network "$NET" -p "127.0.0.1:$PR:8080" \
  --cap-drop ALL --security-opt no-new-privileges:true \
  -e FRAME_ANCESTORS="'self' https://service.fedit.or.kr" "$R_IMG" >/dev/null || { ng "페이지 컨테이너를 띄우지 못함"; exit 1; }
# 앞단: 안쪽 페이지 주소는 시험 컨테이너 이름으로 준다(엔진 네트워크의 다른 renderer 와 헷갈리지 않게)
docker run -d --name "$C_P" --network "$NET" -p "127.0.0.1:$PH:8080" -p "127.0.0.1:$PS:443" \
  --label "cfd-imgtest.tmp=$TMP" \
  -e PUBLIC_HOST="$H" -e ACCESS_KEY= -e RENDERER_UPSTREAM="$C_R:8080" -e ENGINE_UPSTREAM=engine:8000 \
  -v "$TMP/certs:/etc/nginx/certs:ro" -v "$TMP/jobs:/srv/jobs:ro" \
  "$P_IMG" >/dev/null || { ng "앞단 컨테이너를 띄우지 못함"; exit 1; }
if [ -n "$ENGINE_NET" ] && ! docker network connect "$ENGINE_NET" "$C_P" >/dev/null 2>&1; then
  echo "  엔진 네트워크($ENGINE_NET)에 붙지 못해 엔진 확인을 건너뜁니다"; ENGINE_NET=""
fi

# 두 컨테이너의 상태 확인(HEALTHCHECK)이 healthy 가 될 때까지 최대 60초
for i in $(seq 1 60); do
  a=$(docker inspect -f '{{.State.Health.Status}}' "$C_R" 2>/dev/null)
  b=$(docker inspect -f '{{.State.Health.Status}}' "$C_P" 2>/dev/null)
  [ "$a" = healthy ] && [ "$b" = healthy ] && break
  [ "$(docker inspect -f '{{.State.Running}}' "$C_P" 2>/dev/null)" = true ] || break
  sleep 1
done

echo "== 1. 컨테이너 · 설정"
expect "페이지 컨테이너 상태" healthy "$(docker inspect -f '{{.State.Health.Status}}' "$C_R" 2>/dev/null)"
expect "앞단 컨테이너 상태" healthy "$(docker inspect -f '{{.State.Health.Status}}' "$C_P" 2>/dev/null || echo 멈춤)"
if [ "$(docker inspect -f '{{.State.Running}}' "$C_P" 2>/dev/null)" != true ]; then
  echo "  앞단이 멈췄습니다. 로그:"; docker logs --tail 20 "$C_P" 2>&1 | sed 's/^/    /'
fi
for c in "$C_R" "$C_P"; do
  if docker exec "$c" nginx -t >/dev/null 2>&1; then ok "설정 검사(nginx -t): $c"; else ng "설정 검사(nginx -t): $c"; fi
done
expect "페이지 이미지 실행 사용자(root 가 아님)" 101 "$(docker image inspect -f '{{.Config.User}}' "$R_IMG")"

echo "== 2. 페이지 응답 (페이지 직접 / 앞단 http / 앞단 https)"
code() { curl -s -o "$NULL" -w '%{http_code}' --max-time 10 "$@"; }
for p in index.html pre.html sim.html post.html healthz; do
  a=$(code "http://127.0.0.1:$PR/$p")
  b=$(code "http://127.0.0.1:$PH/$p")
  c=$(code --cacert "$TMP/certs/fullchain.pem" --resolve "$H:$PS:127.0.0.1" "https://$H:$PS/$p")
  expect "/$p" "200 200 200" "$a $b $c"
done

echo "== 3. 결과 폴더 (results/)"
expect "전체 목록은 숨김" 404 "$(code "http://127.0.0.1:$PH/results/")"
expect "작업 결과 파일 읽기" 200 "$(code "http://127.0.0.1:$PH/results/$JOB/result.txt")"
expect "부분 받기(Range)" 206 "$(code -H 'Range: bytes=0-9' "http://127.0.0.1:$PH/results/$JOB/result.txt")"

echo "== 4. https 머리말"
hdr=$(curl -s -I --max-time 10 --cacert "$TMP/certs/fullchain.pem" --resolve "$H:$PS:127.0.0.1" "https://$H:$PS/pre.html" | tr -d '\r')
# HTTP/2 로 붙는 curl 은 머리말 이름을 소문자로 찍으므로 소문자로 맞춰 비교한다
expect "Server 머리말(nginx 판 숨김)" "server: nginx" "$(printf '%s\n' "$hdr" | grep -i '^server:' | head -n 1 | tr 'A-Z' 'a-z')"
if printf '%s\n' "$hdr" | grep -qi "^content-security-policy: frame-ancestors 'self' https://service.fedit.or.kr"; then
  ok "iframe 허용 출처(frame-ancestors)"
else
  ng "iframe 허용 출처(frame-ancestors) 머리말이 없거나 다름"
fi

echo "== 5. TLS 세션 티켓 (티켓 키 교체 결함 CVE-2026-97629 대비로 끔)"
t12=$(openssl s_client -connect "127.0.0.1:$PS" -servername "$H" -tls1_2 </dev/null 2>/dev/null | grep -c 'TLS session ticket lifetime hint')
expect "TLS 1.2 에서 티켓을 내지 않음(티켓 안내 줄 수)" 0 "$t12"
openssl s_client -connect "127.0.0.1:$PS" -servername "$H" -tls1_2 -sess_out "$TMP/sess.pem" </dev/null >/dev/null 2>&1
r=$(openssl s_client -connect "127.0.0.1:$PS" -servername "$H" -tls1_2 -sess_in "$TMP/sess.pem" </dev/null 2>/dev/null | grep -o -E '^(Reused|New),' | head -n 1)
expect "다시 접속할 때 서버 쪽 캐시로 이어짐" "Reused," "$r"
# TLS 1.3 은 티켓을 꺼도 표(NewSessionTicket)를 준다. 캐시 번호만 담은 짧은 표(32바이트 안팎)여야 하고, 암호화한 긴 표(150바이트 넘음)면 실패.
# 3초 동안 표를 받은 뒤 입력이 끝나면 openssl 이 스스로 끝나며 출력을 모두 내보낸다(강제로 끊으면 출력이 버려질 수 있음). 표를 하나도 못 읽으면 실패로 센다
sizes=$(timeout 15 openssl s_client -connect "127.0.0.1:$PS" -servername "$H" -tls1_3 < <(sleep 3) 2>/dev/null | awk '
  /TLS session ticket:/ { on = 1; n = 0; next }
  on && /^ *[0-9a-f][0-9a-f][0-9a-f][0-9a-f] - / { l = $0; sub(/^ *[0-9a-f]+ - /, "", l); sub(/   .*$/, "", l); gsub(/-/, " ", l); n += split(l, a, " "); next }
  on { print n; on = 0 }')
sizes=$(echo $sizes) # 여러 줄을 한 줄로
if [ -z "$sizes" ]; then
  ng "TLS 1.3 표를 읽지 못함(openssl 이 TLS 1.3 을 지원하는지, 접속이 되는지 확인)"
else
  long=0
  for s in $sizes; do [ "$s" -gt 64 ] && long=$((long + 1)); done
  expect "TLS 1.3 표가 짧음(64바이트 넘는 표 수, 표 길이: $sizes)" 0 "$long"
fi

echo "== 6. 저장소 최신판보다 뒤처진 Alpine 부품 (빌드 때 apk upgrade 가 됐는지)"
for img in "$R_IMG" "$P_IMG"; do
  n=$(docker run --rm --user root --entrypoint sh "$img" -c 'out=$(apk upgrade --simulate --no-cache 2>&1) || { echo FAIL; exit 0; }; printf "%s\n" "$out" | grep -c Upgrading' 2>/dev/null)
  case "$n" in
    FAIL | '') sk "$img: Alpine 저장소에 닿지 못해 확인 못 함" ;;
    *) expect "$img 뒤처진 부품 수(0 이 아니면 --no-cache 로 다시 빌드)" 0 "$n" ;;
  esac
done

echo "== 7. 해석엔진 (앞단 경유, 조회만)"
if [ -n "$ENGINE_NET" ]; then
  health=$(curl -s --max-time 10 "http://127.0.0.1:$PH/engine/health")
  case "$health" in *'"status":"ok"'*) ok "engine/health ($ENGINE_NET)" ;; *) ng "engine/health ($ENGINE_NET): ${health:0:120} — 엔진 상태와 상관없이 이미지만 보려면 ENGINE_NETWORK=none" ;; esac
else
  sk "엔진 확인(이 PC 리허설 engine 이 없거나 ENGINE_NETWORK=none)"
fi

echo "== 판"
nv_r=$(docker run --rm --entrypoint nginx "$R_IMG" -v 2>&1 | sed 's/^nginx version: //')
nv_p=$(docker run --rm --entrypoint nginx "$P_IMG" -v 2>&1 | sed 's/^nginx version: //')
for img in "$R_IMG" "$P_IMG"; do
  printf '  %s: %s\n' "$img" "$(docker run --rm --entrypoint sh "$img" -c 'echo "$(nginx -v 2>&1 | sed "s/^nginx version: //"), Alpine $(cat /etc/alpine-release), $(apk info -v 2>/dev/null | grep -E "^libssl3-" | sed "s/^libssl3-/OpenSSL /")"')"
done
# nginx 는 apk upgrade 로 올라가지 않는다(바탕 이미지가 판을 고정). 두 바탕 이미지 중 하나가 새 nginx 판을 늦게 내면 판이 갈린다
if [ "$nv_r" = "$nv_p" ]; then ok "두 이미지의 nginx 판이 같음: $nv_r"; else wn "두 이미지의 nginx 판이 다름(페이지 $nv_r, 앞단 $nv_p) — 한쪽 바탕 이미지가 새 판을 아직 안 냄. 며칠 뒤 다시 빌드하면 맞춰진다"; fi

echo
echo "결과: 통과 $pass · 실패 $fail · 건너뜀 $skip · 주의 $warn"
if [ "${KEEP:-}" = 1 ]; then
  echo "컨테이너를 남겼습니다. 브라우저로 확인: http://127.0.0.1:$PH/  (전처리 pre.html · 물리 시뮬레이션 sim.html · 후처리 post.html)"
  echo "다 보면 정리: bash deploy/test_images.sh --clean"
fi
[ "$fail" -eq 0 ]

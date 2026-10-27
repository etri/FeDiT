#!/usr/bin/env bash
# SPDX-License-Identifier: LGPL-2.1-only
# Copyright (c) 2026 E8IGHT Co., Ltd.
# E8IGHT 서버에서 실행한다(묶음 폴더 안에서, 파일을 올린 배포 계정 또는 root 로).
#   설정(.env) 준비 → 1세부 해석엔진 찾기 → 이미지 불러오기 → 인증서 권한 → 페이지·앞단 띄우기 → 확인
# 해석엔진은 1세부 compose 가 띄운 것을 그대로 쓴다. 이 스크립트는 엔진을 건드리지 않는다.
# 다시 실행해도 된다: 이미지를 다시 불러오고, 이미지·.env 가 바뀐 컨테이너만 다시 만든다. 인증서는 5단계에서 다시 읽힌다.
set -euo pipefail
cd "$(dirname "$0")"
say() { printf '\n== %s\n' "$*"; }
fail() { printf '\n실패: %s\n' "$*" >&2; exit 1; }
COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.server.yml)
IMAGES="union-twin-cfd-renderer union-twin-cfd-proxy"

say "0. 준비"
[ -w . ] || fail "이 폴더에 쓸 수 없습니다. 파일을 올린 계정(또는 root)으로 실행하세요(주인 확인: ls -ln)"
docker info >/dev/null 2>&1 || fail "docker 를 쓸 수 없습니다. 이 계정이 docker 그룹인지(id), docker 가 도는지(systemctl status docker) 확인하세요"
# 서버 설정 .env: 처음이면 묶음의 env.server 를 복사한다. 이미 있으면 서버에서 고친 값을 그대로 두고, 새 판에서 늘어난 항목만 더한다
if [ ! -f .env ]; then
  [ -f env.server ] || fail "env.server 가 없습니다. 묶음 폴더의 파일을 모두 올리세요"
  cp env.server .env
  echo "  설정 .env 를 새로 만들었습니다(env.server 복사)"
elif [ -f env.server ]; then
  [ -z "$(tail -c 1 .env)" ] || echo >> .env
  while IFS= read -r line; do
    case "$line" in '' | '#'*) continue ;; esac
    k=${line%%=*}
    grep -q "^$k=" .env || { printf '%s\n' "$line" >> .env; echo "  .env 에 새 항목을 더했습니다: $k"; }
  done < env.server
fi
[ -w .env ] || fail ".env 에 쓸 수 없습니다. 파일을 올린 계정(또는 root)으로 실행하세요(주인 확인: ls -ln)"
set_env() { # .env 의 KEY=값 한 줄을 바꾼다(없으면 끝에 더함). 값의 특수문자(/ \ & |)를 그대로 둔다. 파일 주인·권한은 유지
  K=$1 V=$2 awk -F= '$1 == ENVIRON["K"] { print ENVIRON["K"] "=" ENVIRON["V"]; done = 1; next } { print } END { if (!done) print ENVIRON["K"] "=" ENVIRON["V"] }' .env > .env.tmp
  cat .env.tmp > .env && rm -f .env.tmp
}

say "1. 1세부 해석엔진 찾기"
# 1세부 compose 프로젝트(기본 integration)의 engine 서비스. 다른 프로젝트의 engine 을 잘못 잡지 않게 둘 다 맞춰 본다
ENGINE_PROJECT=${ENGINE_PROJECT:-integration}
eng=$(docker ps --filter "label=com.docker.compose.project=$ENGINE_PROJECT" --filter 'label=com.docker.compose.service=engine' --format '{{.Names}}')
n=$(printf '%s\n' "$eng" | grep -c . || true)
[ "$n" -ge 1 ] || fail "1세부 해석엔진 컨테이너(compose 프로젝트 $ENGINE_PROJECT, 서비스 engine)가 떠 있지 않습니다. 상태 확인: docker ps -a | grep engine — 1세부와 맞춘 뒤 다시 실행하세요"
[ "$n" -eq 1 ] || fail "1세부 해석엔진 후보가 여럿입니다: $(echo $eng)"
net=$(docker inspect "$eng" --format '{{range $k, $v := .NetworkSettings.Networks}}{{$k}} {{end}}' | awk '{print $1}')
jobs=$(docker inspect "$eng" --format '{{range .Mounts}}{{if eq .Destination "/jobs"}}{{.Source}}{{end}}{{end}}')
echo "엔진 컨테이너: $eng"
echo "Docker 네트워크: ${net:-(못 찾음)}"
echo "작업 폴더: ${jobs:-(못 찾음)}"
[ -n "$net" ] || fail "엔진의 Docker 네트워크를 찾지 못했습니다"
[ -n "$jobs" ] && [ -d "$jobs" ] || fail "엔진의 작업 폴더(/jobs 에 붙인 서버 폴더)를 찾지 못했습니다"
# 찾은 값을 .env 에 적는다(앞단이 그 네트워크에 붙어 'engine' 을 찾고, 작업 폴더를 읽기 전용으로 붙인다)
set_env ENGINE_NETWORK "$net"
set_env JOBS_HOST_DIR "$jobs"

say "2. 이미지 불러오기 (페이지·앞단)"
[ -f images.tar.gz ] || fail "images.tar.gz 가 없습니다"
# 판이 바뀌면 바로 앞 판을 :prev 로 남긴다(되돌리기는 README.txt). 그보다 오래된 판은 지운다
declare -A cur=() prev=()
for i in $IMAGES; do
  cur[$i]=$(docker image inspect -f '{{.Id}}' "$i:local" 2>/dev/null || true)
  prev[$i]=$(docker image inspect -f '{{.Id}}' "$i:prev" 2>/dev/null || true)
done
gunzip -c images.tar.gz | docker load
for i in $IMAGES; do
  now=$(docker image inspect -f '{{.Id}}' "$i:local")
  if [ -n "${cur[$i]}" ] && [ "${cur[$i]}" != "$now" ]; then
    docker tag "${cur[$i]}" "$i:prev"
    echo "  이전 판을 $i:prev 로 남겼습니다"
    if [ -n "${prev[$i]}" ] && [ "${prev[$i]}" != "${cur[$i]}" ] && [ "${prev[$i]}" != "$now" ]; then
      docker image rm "${prev[$i]}" >/dev/null 2>&1 || true
    fi
  fi
done

say "3. 인증서"
[ -f certs/fullchain.pem ] && [ -f certs/privkey.pem ] || fail "certs/ 에 fullchain.pem 과 privkey.pem 이 있어야 합니다"
[ "$(id -u)" = 0 ] || [ -O certs/privkey.pem ] || fail "certs/ 의 주인이 이 계정이 아니라 권한을 바꿀 수 없습니다. 파일을 올린 계정이나 root 로 실행하세요"
chmod 700 certs
chmod 600 certs/privkey.pem
chmod 644 certs/fullchain.pem
echo "  비밀 키는 주인($(stat -c %U certs/privkey.pem 2>/dev/null || echo '?'))만 읽게 했습니다(600)"
if command -v openssl >/dev/null 2>&1; then
  echo "  인증서 만료: $(openssl x509 -noout -enddate -in certs/fullchain.pem | cut -d= -f2)"
fi

say "4. 띄우기"
for p in 80 443; do
  if ss -ltn 2>/dev/null | grep -q ":$p " && ! docker ps --format '{{.Names}}' | grep -q '^union-twin-cfd-proxy'; then
    fail "$p 포트를 이미 다른 프로그램이 쓰고 있습니다: ss -ltnp | grep :$p 로 확인하세요"
  fi
done
"${COMPOSE[@]}" up -d --no-build renderer proxy

say "5. 확인"
ok=0
for i in $(seq 1 20); do
  if curl -fsS -o /dev/null http://127.0.0.1:8090/pre.html 2>/dev/null; then ok=1; break; fi
  sleep 2
done
[ "$ok" = 1 ] || { "${COMPOSE[@]}" ps; "${COMPOSE[@]}" logs --tail 30 proxy; fail "앞단이 응답하지 않습니다(위 로그 참고)"; }
# 인증서만 바꾸고 다시 돌리면 compose 는 컨테이너를 다시 만들지 않는다 → 설정·인증서를 다시 읽힌다(검사에 실패하면 옛 설정으로 계속 돈다)
"${COMPOSE[@]}" exec -T proxy nginx -t >/dev/null 2>&1 || { "${COMPOSE[@]}" exec -T proxy nginx -t || true; fail "앞단 설정·인증서 검사에 실패했습니다(지금은 옛 설정으로 돌고 있습니다)"; }
"${COMPOSE[@]}" exec -T proxy nginx -s reload >/dev/null 2>&1
sleep 2
for p in index.html pre.html sim.html post.html; do
  printf '  %s  /%s\n' "$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:8090/$p")" "$p"
done
health=$(curl -s http://127.0.0.1:8090/engine/health || true)
echo "  해석엔진(앞단 경유): ${health:0:160}"
case "$health" in *'"status":"ok"'*) ;; *) fail "앞단에서 해석엔진에 닿지 않습니다. 네트워크($net)를 확인하세요" ;; esac
code=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:8090/results/")
echo "  작업 폴더 전체 목록(results/): $code (404 가 정상 — 전체 목록은 일부러 숨김)"
tls=$(curl -s -o /dev/null -w '%{http_code}' --resolve cfd.fedit.or.kr:443:127.0.0.1 https://cfd.fedit.or.kr/pre.html || true)
echo "  https(인증서 확인 포함, 서버 안에서): $tls"
[ "$tls" = 200 ] || fail "https 확인 실패. 인증서 파일을 확인하세요: ${COMPOSE[*]} logs proxy"

printf '\n완료. 서버 안에서는 모두 정상입니다.\n'
printf '밖에서 열리려면 제주TP 가 DNS(cfd.fedit.or.kr → 이 서버)를 등록하고 443 포트를 열어야 합니다.\n'
printf '443 이 열린 뒤, DNS 등록 전에 밖에서 확인: curl -I --resolve cfd.fedit.or.kr:443:<서버 공인 IP> https://cfd.fedit.or.kr/\n'

#!/usr/bin/env bash
# 3단계: NDXPro — 코어 서비스 + 파일 서비스 + FDT 뷰어
source "$(dirname "$0")/_common.sh"

echo "== 3. NDXPro 기동 =="
$DC -f ndxpro/compose.yml up -d
echo "-- 코어 기동 대기 (스프링 부트, 1~2분) --"
sleep 60

$DC -f ndxpro/compose-file.yml up -d
$DC -f ndxpro/compose-fdt.yml  up -d
sleep 20

show 'eureka|gateway|data-|ngsi|translator|file-service|fdt-service|context'

echo
echo "-- Eureka 등록 서비스 --"
curl -s -H 'Accept: application/json' "http://${HOST}:${PORT_EUREKA}/eureka/apps" \
  | grep -o '"name":"[^"]*"' | sort -u | sed 's/^/   /' || echo "   (조회 실패 — 아직 기동 중일 수 있음)"

echo
echo "[완료] 다음: cd ../fdt-service-frontend && ./install/1-front.sh"

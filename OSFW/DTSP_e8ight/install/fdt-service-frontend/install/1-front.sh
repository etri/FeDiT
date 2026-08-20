#!/usr/bin/env bash
# 프론트 기동 — 연합트윈 화면(fe) + 자체 서버(BFF)
#   ./install/1-front.sh            프록시 뒤에서 동작 (포트 비공개)
#   ./install/1-front.sh --expose   프록시 없이 화면 포트를 호스트에 공개
#   ./install/1-front.sh --nginx    리버스 프록시까지 함께 올린다
#
# 백엔드(0~3단계)가 먼저 떠 있어야 한다. BFF 가 백엔드의 PostgreSQL 을 쓴다.
source "$(dirname "$0")/_common.sh"

echo "== 프론트 기동 =="

# 백엔드 DB 확인
if ! docker ps --format '{{.Names}}' | grep -qx postgres; then
  echo "[x] postgres 컨테이너가 없습니다. 백엔드를 먼저 올리세요:"
  echo "    cd ../fdt-service-backend && ./install/1-db.sh"
  exit 1
fi

EXTRA=""; USE_NGINX=0
for a in "$@"; do
  case "$a" in
    --expose) EXTRA="-f front/compose-expose.yml" ;;
    --nginx)  USE_NGINX=1 ;;
    *) echo "[x] 알 수 없는 옵션: $a"; exit 1 ;;
  esac
done

$DC -f front/compose.yml $EXTRA up -d
[[ -n "$EXTRA" ]] && echo "   화면 포트 ${PORT_UNION_TWIN_FE} 를 호스트에 공개"

if [[ $USE_NGINX -eq 1 ]]; then
  $DC -f nginx/compose.yml up -d
  echo "   nginx 기동 (80 포트)"
fi

echo "-- 준비 대기 --"
wait_healthy union-twin-be union-twin-fe
show 'union-twin|nginx'

echo
echo "   접속: ${PUBLIC_URL}/signin"
echo "   계정: admin@e8ight.co.kr / ${ADMIN_SEED_PASSWORD}"
echo "[완료] 확인: ../fdt-service-backend/scripts/health.sh"

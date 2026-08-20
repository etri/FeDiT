#!/usr/bin/env bash
# 프론트 정리
#   ./install/9-clean.sh          컨테이너 삭제
#   ./install/9-clean.sh --data   로컬 개발용 볼륨(union-twin-pgdata)까지 삭제
source "$(dirname "$0")/_common.sh"

echo "== 프론트 정리 =="
for f in nginx/compose.yml front/compose-watchtower.yml front/compose.yml front/compose-local.yml; do
  [[ -f "$f" ]] && $DC -f "$f" down -v --remove-orphans 2>/dev/null || true
done
docker rm -f union-twin-fe union-twin-be nginx watchtower \
             union-twin-fe-local union-twin-be-local union-twin-postgres-local 2>/dev/null || true
echo "   컨테이너 삭제 완료"

if [[ "${1:-}" == "--data" ]]; then
  docker volume rm union-twin-pgdata 2>/dev/null && echo "   로컬 개발 볼륨 삭제" || true
fi

echo
docker ps -a --format '   {{.Names}}\t{{.Status}}' | grep -E "union-twin|nginx" || echo "   남은 컨테이너 없음"

#!/usr/bin/env bash
# 백엔드 정리
#   ./install/9-clean.sh          컨테이너·네트워크만 삭제 (데이터는 보존)
#   ./install/9-clean.sh --data   ${REPO} 의 DB·로그·볼륨까지 전부 삭제
#   ./install/9-clean.sh --all    --data + 내려받은 이미지까지 삭제
#
# 프론트는 ../fdt-service-frontend/install/9-clean.sh 로 따로 내린다.
source "$(dirname "$0")/_common.sh" 2>/dev/null || {
  set -euo pipefail; cd "$(dirname "$0")/.."
  ENV_FILE="${ENV_FILE:-.env}"; set -a; source "$ENV_FILE"; set +a
  DC="docker compose --env-file $ENV_FILE"
}

DEL_DATA=0; DEL_IMAGES=0
for a in "$@"; do
  case "$a" in
    --data) DEL_DATA=1 ;;
    --all)  DEL_DATA=1; DEL_IMAGES=1 ;;
    *) echo "[x] 알 수 없는 옵션: $a"; exit 1 ;;
  esac
done

echo "== 컨테이너 정리 =="
for f in ndxpro/compose-fdt.yml ndxpro/compose-file.yml ndxpro/compose.yml \
         kafka/compose.yml db/compose.yml; do
  [[ -f "$f" ]] || continue
  $DC -f "$f" down -v --remove-orphans 2>/dev/null || true
done

# 이름으로 남은 컨테이너 정리
docker rm -f eureka gateway data-ingest translator-builder ngsi-translator \
  data-broker-1 data-service data-manager data-auth ndxpro-core-context \
  file-service fdt-service postgres mongodb redis \
  pipeline-zookeeper-a pipeline-kafka-1 kafka-ui 2>/dev/null || true
echo "   컨테이너 삭제 완료"

if [[ $DEL_DATA -eq 1 ]]; then
  echo
  echo "== 데이터 삭제 =="
  # 안전장치: 위험한 경로는 거부한다
  case "${REPO:-}" in
    ""|"/"|"/usr"|"/etc"|"/var"|"/home"|"/Users"|"/tmp")
      echo "[x] REPO 값이 위험합니다: '${REPO:-비어있음}'. 삭제하지 않습니다."; exit 1 ;;
  esac
  echo "   대상: $REPO"
  du -sh "$REPO" 2>/dev/null | sed 's/^/   /' || true
  rm -rf "${REPO:?}/docker-volumes" "${REPO:?}/logs" "${REPO:?}/translatorJars" \
         "${REPO:?}/file-service" "${REPO:?}/ngsi-context"
  rmdir "$REPO" 2>/dev/null || true
  echo "   DB·로그·볼륨 삭제 완료"

  docker volume rm flume 2>/dev/null || true
  docker network rm "$DOCKER_NETWORK" 2>/dev/null && echo "   네트워크 $DOCKER_NETWORK 삭제" \
    || echo "   네트워크는 프론트가 아직 쓰고 있습니다. 프론트를 먼저 내리세요."
fi

if [[ $DEL_IMAGES -eq 1 ]]; then
  echo
  echo "== 이미지 삭제 =="
  docker images --format '{{.Repository}}:{{.Tag}}' \
    | grep -E "^${IMAGE_REPO_URL}/|^pipeline-(kafka|zookeeper):" \
    | xargs -r docker rmi -f 2>/dev/null || true
  echo "   삭제 완료"
fi

echo
echo "[완료] 남은 컨테이너:"
docker ps -a --format '   {{.Names}}\t{{.Status}}' | head -10 || true

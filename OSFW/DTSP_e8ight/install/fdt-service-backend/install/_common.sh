# 단계별 스크립트 공통 부분. 직접 실행하지 않는다.
set -euo pipefail
cd "$(dirname "$0")/.."          # 각 저장소 루트 (fdt-service-backend / fdt-service-frontend)

# .env 는 백엔드/프론트가 같이 쓰는 파일이라 한 단계 위에 둔다.
ENV_FILE="${ENV_FILE:-../.env}"
[[ -f "$ENV_FILE" ]] || {
  echo "[x] $ENV_FILE 이 없습니다."
  echo "    상위 디렉터리에서: cp .env.example .env  후 주소를 고치세요."
  exit 1; }
set -a; source "$ENV_FILE"; set +a

DC="docker compose --env-file $ENV_FILE"

docker network inspect "$DOCKER_NETWORK" >/dev/null 2>&1 || {
  echo "[x] 도커 네트워크 $DOCKER_NETWORK 이 없습니다."
  echo "    백엔드에서 먼저: ./install/0-init.sh"; exit 1; }

# wait_healthy <컨테이너...> : healthcheck 통과까지 최대 120초 대기
wait_healthy() {
  local timeout=120 t=0
  while (( t < timeout )); do
    local pending=0
    for c in "$@"; do
      local st
      st=$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$c" 2>/dev/null || echo "none")
      [[ "$st" == "healthy" || "$st" == "running" ]] || pending=1
    done
    (( pending == 0 )) && { echo "   준비 완료 (${t}초)"; return 0; }
    sleep 5; t=$((t+5)); printf '.'
  done
  echo; echo "   [!] ${timeout}초 안에 준비되지 않았습니다. docker logs 로 확인하세요."
  return 0
}

# show <grep 패턴> : 해당 컨테이너들의 상태 출력
show() { echo; docker ps --format '{{.Names}}\t{{.Status}}' | grep -E "$1" | sed 's/^/   /' || true; }

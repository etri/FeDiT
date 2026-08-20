#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# 설치에 필요한 이미지가 로컬에 다 있는지, 아키텍처가 이 서버와 맞는지 확인한다.
#   ./scripts/check-images.sh
# 목록은 compose 파일에서 직접 뽑으므로 .env 를 고쳐도 항상 최신이다.
# -----------------------------------------------------------------------------
set -uo pipefail
cd "$(dirname "$0")/.."
ENV_FILE="${ENV_FILE:-../.env}"
[[ -f "$ENV_FILE" ]] || { echo "[x] $ENV_FILE 이 없습니다."; exit 1; }

DC="docker compose --env-file $ENV_FILE"
HOST_ARCH=$($DC -f db/compose.yml config >/dev/null 2>&1; docker info --format '{{.Architecture}}')
case "$HOST_ARCH" in x86_64|amd64) WANT=amd64 ;; aarch64|arm64) WANT=arm64 ;; *) WANT="$HOST_ARCH" ;; esac

required() {
  $DC -f db/compose.yml -f kafka/compose.yml -f ndxpro/compose.yml \
      -f ndxpro/compose-file.yml -f ndxpro/compose-fdt.yml config --images 2>/dev/null
  ( cd ../fdt-service-frontend 2>/dev/null && \
    docker compose --env-file ../.env -f front/compose.yml config --images 2>/dev/null )
}

echo "필요 이미지 점검 (호스트 아키텍처: $WANT)"
missing=0; fatal=0; emulated=0; tobuild=0; total=0
while read -r img; do
  [[ -z "$img" ]] && continue
  total=$((total+1))
  arch=$(docker image inspect "$img" --format '{{.Architecture}}' 2>/dev/null)
  if [[ -z "$arch" ]]; then
    # kafka/zookeeper 는 묶음에 없을 수 있다. 2-kafka.sh 가 Dockerfile 로 빌드하므로 오류가 아니다.
    if [[ "$img" == pipeline-* ]]; then
      printf "  [빌드예정] %-52s 2-kafka.sh 가 빌드한다\n" "$img"; tobuild=$((tobuild+1))
    else
      printf "  [없음] %s\n" "$img"; missing=$((missing+1))
    fi
  elif [[ "$arch" == "$WANT" ]]; then
    printf "  [OK]   %s\n" "$img"
  elif [[ "$WANT" == "arm64" && "$arch" == "amd64" ]]; then
    # 맥(Apple Silicon)은 Rosetta 로 amd64 를 돌린다. 느리지만 동작한다.
    printf "  [에뮬] %-56s %s\n" "$img" "$arch"; emulated=$((emulated+1))
  else
    # 리눅스 x86_64 에서 arm64 이미지 → 실행 불가
    printf "  [불가] %-56s %s (이 서버는 %s)\n" "$img" "$arch" "$WANT"; fatal=$((fatal+1))
  fi
done < <(required | sort -u)

echo
(( emulated > 0 )) && echo "[!] $emulated 개가 에뮬레이션으로 동작합니다(맥에서는 정상, 기동이 느림)."
(( tobuild  > 0 )) && echo "[=] $tobuild 개는 2-kafka.sh 가 빌드합니다(인터넷 필요). 지금 없어도 정상입니다."
if (( missing == 0 && fatal == 0 )); then
  echo "[✓] $total 개 전부 실행 가능"
  exit 0
fi
(( missing > 0 )) && echo "[!] $missing 개가 없습니다. ./scripts/images-load.sh 로 적재하거나 ./install/0-init.sh --build 로 빌드하세요."
(( fatal   > 0 )) && echo "[x] $fatal 개는 이 서버에서 실행할 수 없습니다(exec format error). 올바른 아키텍처로 다시 말아야 합니다."
exit 1

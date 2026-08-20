#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# 컨테이너 1개만 최신 이미지로 재생성한다.
#   ./scripts/remake_container.sh <service> <compose-file>
#   예) ./scripts/remake_container.sh union-twin-fe compose/50-union-twin.yml
#
# 주의: images 조회에도 -f $FILE 이 필요하다. 빠지면 현재 디렉터리의 기본 compose
#       파일을 보게 되어 IMAGE 가 빈 값이 되고 docker rmi 가 실패한다.
# -----------------------------------------------------------------------------
set -uo pipefail
cd "$(dirname "$0")/.."

SERVICE=$1
FILE=$2
DC="docker compose --env-file ${ENV_FILE:-../.env} -f $FILE"

IMAGE=$($DC images -q "$SERVICE")

$DC stop "$SERVICE"
$DC rm -f "$SERVICE"
[ -n "$IMAGE" ] && docker rmi "$IMAGE"
$DC pull "$SERVICE"
$DC up -d --no-deps "$SERVICE"
$DC ps

#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# 최초 1회 실행: .env 검증 → 도커 네트워크 생성 → 데이터/로그 디렉터리 생성
#   ./scripts/bootstrap.sh
# -----------------------------------------------------------------------------
set -euo pipefail

cd "$(dirname "$0")/.."
ENV_FILE="${ENV_FILE:-../.env}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "[!] $ENV_FILE 이 없습니다. 상위 디렉터리에서 'cp .env.example .env' 후 주소를 고치세요." >&2
  exit 1
fi

# .env 읽기 (주석/빈 줄 무시)
set -a; source "$ENV_FILE"; set +a

fail=0
for v in HOST PUBLIC_URL IMAGE_REPO_URL REPO DOCKER_NETWORK; do
  if [[ -z "${!v:-}" ]]; then echo "[!] $v 값이 비어 있습니다." >&2; fail=1; fi
done

# 비밀번호를 바꿔 쓰는 경우에만 걸리는 검사
for v in POSTGRES_PASSWORD MONGO_PASSWORD REDIS_PASSWORD; do
  if [[ "${!v}" == *"'"* || "${!v}" == *"@"* || "${!v}" == *":"* || "${!v}" == *"/"* ]]; then
    echo "[!] $v 에 ' @ : / 중 하나가 들어 있습니다. 접속 URL 파싱이 깨집니다." >&2
    fail=1
  fi
done

[[ $fail -eq 0 ]] || { echo "[x] .env 를 수정한 뒤 다시 실행하세요."; exit 1; }

# 포트 선점 검사
# 리눅스·맥 모두 임시 포트 범위(리눅스 32768~60999 / 맥 49152~65535)가 우리 포트와 겹친다.
# 다른 프로그램의 통신이 그 포트를 먼저 잡고 있으면 컨테이너가 뜨지 못한다.
# 도커가 잡고 있는 포트(이미 우리가 띄운 컨테이너)는 정상이므로 제외한다.
echo
echo "[=] 포트 점검"
busy=""
for v in $(compgen -A variable | grep '^PORT_'); do
  port="${!v}"
  [[ -z "$port" ]] && continue
  # grep 이 못 찾으면 1 을 돌려주고 set -e 에 걸리므로 || true 로 막는다
  holder=$(lsof -nP -i:"$port" 2>/dev/null | awk 'NR>1 {print $1}' \
           | grep -viE '^(com\.docke|docker|vpnkit)' | head -1 || true)
  [[ -n "$holder" ]] && busy="$busy $port($holder)"
done
if [[ -n "$busy" ]]; then
  echo "    [!] 다른 프로그램이 쓰는 중:$busy"
  echo "        일시적 연결이면 잠시 뒤 사라진다. 계속되면 .env 의 해당 PORT_* 를 바꾸거나,"
  echo "        리눅스에서는 포트를 예약해 재발을 막는다:"
  echo "          sudo sysctl -w net.ipv4.ip_local_reserved_ports=\$(grep '^PORT_' $ENV_FILE | cut -d= -f2 | paste -sd, -)"
else
  echo "    충돌 없음"
fi

# 도커 네트워크
if docker network inspect "$DOCKER_NETWORK" >/dev/null 2>&1; then
  echo "[=] 네트워크 $DOCKER_NETWORK 이미 존재"
else
  docker network create "$DOCKER_NETWORK"
  echo "[+] 네트워크 $DOCKER_NETWORK 생성"
fi

# 영속 디렉터리
dirs=(
  "$REPO/docker-volumes/postgres-data"
  "$REPO/docker-volumes/mongodb-data"
  "$REPO/docker-volumes/redis-data"
  "$REPO/docker-volumes/pipeline-zookeeper-a-volume"
  "$REPO/docker-volumes/pipeline-kafka-1-volume"
  "$REPO/logs/data-ingest" "$REPO/logs/translator-builder" "$REPO/logs/ngsi-translator"
  "$REPO/logs/data-broker-1" "$REPO/logs/data-service" "$REPO/logs/data-manager"
  "$REPO/logs/data-auth"
  "$REPO/translatorJars"
  "$REPO/ngsi-context"
  "$REPO/file-service/data" "$REPO/file-service/logs"
)
for d in "${dirs[@]}"; do mkdir -p "$d"; done
echo "[+] 데이터/로그 디렉터리 생성 완료 ($REPO)"

# NGSI-LD 컨텍스트 파일 배치
if compgen -G "ndxpro/ngsi-context/*.jsonld" >/dev/null; then
  cp -n ndxpro/ngsi-context/*.jsonld "$REPO/ngsi-context/"
  echo "[+] @context 파일 복사: $(ls "$REPO"/ngsi-context/*.jsonld | xargs -n1 basename | tr '\n' ' ')"
else
  echo "[=] ngsi-context 비어 있음 (플랫폼에서 새로 만들 예정이면 정상)"
fi

echo
echo "[✓] bootstrap 완료. 다음: ./install/1-db.sh"

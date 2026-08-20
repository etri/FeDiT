#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# 설치 검증: 컨테이너 상태 + 주요 엔드포인트 응답 확인 (백엔드·프론트 전체)
#   ./scripts/health.sh
# -----------------------------------------------------------------------------
set -uo pipefail
cd "$(dirname "$0")/.."
set -a; source "${ENV_FILE:-../.env}"; set +a

printf '%-24s %-10s %s\n' "CONTAINER" "STATE" "STATUS"
for c in postgres mongodb redis pipeline-zookeeper-a pipeline-kafka-1 kafka-ui \
         eureka gateway data-ingest translator-builder ngsi-translator \
         data-broker-1 data-service data-manager data-auth ndxpro-core-context \
         file-service fdt-service union-twin-be union-twin-fe; do
  line=$(docker inspect -f '{{.State.Status}}|{{if .State.Health}}{{.State.Health.Status}}{{else}}-{{end}}' "$c" 2>/dev/null) \
    || { printf '%-24s %-10s %s\n' "$c" "없음" "-"; continue; }
  printf '%-24s %-10s %s\n' "$c" "${line%%|*}" "${line##*|}"
done

echo
echo "── HTTP 점검 ──"
# 각 서비스가 실제로 응답하는 경로와 코드. 401 은 "살아 있고 인증을 요구한다"는 뜻이라 정상으로 본다.
check() { # check <이름> <URL> <기대코드...>
  local name="$1" url="$2"; shift 2
  local code
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "$url" 2>/dev/null)
  for want in "$@"; do
    [[ "$code" == "$want" ]] && { echo "  [O] $name ($code)"; return; }
  done
  echo "  [X] $name (기대 $*, 실제 ${code:-무응답}) $url"
}
check "Eureka 대시보드"  "http://${HOST}:${PORT_EUREKA}/"                                200
check "Gateway"          "http://${HOST}:${PORT_GATEWAY}/ndxpro/v1/manager/data-models"  401 200
check "Data Manager"     "http://${HOST}:${PORT_DATA_MANAGER}/ndxpro/v1/manager/data-models" 200
check "Data Broker"      "http://${HOST}:${PORT_DATA_BROKER}/ndxpro/v1/broker/entities"  200
check "Data Auth"        "http://${HOST}:${PORT_DATA_AUTH}/"                             401 200
check "File Service"     "http://${HOST}:${PORT_FILE_SERVICE}/"                          404 200
# @context 는 플랫폼에서 나중에 등록할 수도 있어 404 여도 설치 실패는 아니다
check "@context (선택)"   "http://${HOST}:${PORT_CONTEXT}/${CONTEXT_FILE}"                200 404
check "FDT 뷰어"          "http://${HOST}:${PORT_FDT_SERVICE}/"                           200
check "Kafka UI"         "http://${HOST}:${PORT_KAFKA_UI}/"                              200
check "연합트윈 화면"      "http://${HOST}:${PORT_UNION_TWIN_FE}/signin"                    200

echo
echo "── Kafka 토픽 ──"
docker exec pipeline-kafka-1 /usr/local/kafka/bin/kafka-topics.sh \
  --bootstrap-server pipeline-kafka-1:9092 --list 2>/dev/null | sed 's/^/  /' || echo "  (조회 실패)"

echo
echo "── Eureka 등록 서비스 ──"
curl -s -H 'Accept: application/json' "http://${HOST}:${PORT_EUREKA}/eureka/apps" \
  | grep -o '"name":"[^"]*"' | sed 's/"name":"//; s/"//' | sort -u | sed 's/^/  /' || echo "  (조회 실패)"

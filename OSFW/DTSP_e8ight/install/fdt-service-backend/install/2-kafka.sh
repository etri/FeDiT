#!/usr/bin/env bash
# 2단계: Kafka — Zookeeper / Kafka / Kafka UI
#   이미지가 이미 있으면(묶음으로 적재했거나 이전에 빌드했으면) 빌드하지 않는다.
#   없을 때만 직접 빌드한다. 최초 1회 5~10분 걸리고 인터넷이 필요하다.
#   ./install/2-kafka.sh --rebuild 이미지가 있어도 다시 빌드한다
source "$(dirname "$0")/_common.sh"

REBUILD=0
for a in "$@"; do
  case "$a" in
    --rebuild) REBUILD=1 ;;
    *) echo "[x] 알 수 없는 옵션: $a"; exit 1 ;;
  esac
done

echo "== 2. Kafka 기동 =="

build_if_needed() {   # build_if_needed <이미지명> <빌드경로>
  if [[ $REBUILD -eq 0 ]] && docker image inspect "$1" >/dev/null 2>&1; then
    echo "-- $1 이미지 있음, 빌드 생략 --"
  else
    echo "-- $1 빌드 (수 분 소요, 인터넷 필요) --"
    # 리눅스 서버에서 쓸 이미지를 맥에서 빌드한다면 --platform linux/amd64 가 필요하다.
    docker build ${BUILD_PLATFORM:+--platform $BUILD_PLATFORM} -t "$1" "$2"
  fi
}
build_if_needed "$IMG_ZOOKEEPER" kafka/build/zookeeper
build_if_needed "$IMG_KAFKA"     kafka/build/kafka

echo
$DC -f kafka/compose.yml up -d

echo "-- 브로커 기동 대기 (40초 내외) --"
# 주의: docker logs | grep -q 는 grep 이 먼저 끝나면서 SIGPIPE 가 나고,
# pipefail 때문에 성공해도 실패로 잡힌다. 파이프 대신 변수에 담아 비교한다.
t=0
while :; do
  logs=$(docker logs pipeline-kafka-1 2>&1 || true)
  case "$logs" in
    *"started (kafka.server.KafkaServer)"*) echo " 완료 (${t}초)"; break ;;
  esac
  (( t >= 180 )) && { echo; echo "   [!] 브로커가 뜨지 않았습니다: docker logs pipeline-kafka-1"; exit 1; }
  sleep 3; t=$((t+3)); printf '.'
done

# 이 클러스터는 auto.create.topics.enable=false 다. NDXPro 가 쓰는 토픽을 미리 만들어 둔다.
echo "-- 토픽 확인 --"
KBIN=/usr/local/kafka/bin
existing=$(docker exec pipeline-kafka-1 $KBIN/kafka-topics.sh --bootstrap-server pipeline-kafka-1:9092 --list 2>/dev/null)
for topic in ngsild.topic observedAt.topic; do
  if echo "$existing" | grep -qx "$topic"; then
    echo "   $topic (있음)"
  else
    docker exec pipeline-kafka-1 $KBIN/kafka-topics.sh --bootstrap-server pipeline-kafka-1:9092 \
      --create --topic "$topic" --partitions 1 --replication-factor 1 >/dev/null 2>&1 \
      && echo "   $topic (생성)" || echo "   [!] $topic 생성 실패"
  fi
done

show 'pipeline-|kafka-ui'

echo
echo "   Kafka UI: http://${HOST}:${PORT_KAFKA_UI}"
echo "[완료] 다음: ./install/3-ndxpro.sh"

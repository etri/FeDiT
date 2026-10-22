#!/usr/bin/env bash
# 폐쇄망 서버에서 반입한 이미지 묶음을 적재한다.
#   ./scripts/images-load.sh [파일]     (기본 ../images/union-twin-service-images.tar.gz)
#
# 인자는 조각을 뺀 기준 경로를 준다. 통짜 tar.gz 이 없고 "<경로>.part-aa" 식 조각만
# 있으면 자동으로 합쳐서 읽는다 (합친 파일을 디스크에 만들지 않는다).
set -euo pipefail
FILE="${1:-../images/union-twin-service-images.tar.gz}"

# 분할해서 올린 경우 조각(.part-aa, .part-ab ...)이 대신 있다. 자동으로 합쳐서 읽는다.
if [[ ! -f "$FILE" ]] && compgen -G "$FILE.part-*" >/dev/null; then
  n=$(ls -1 "$FILE".part-* | wc -l | tr -d ' ')
  echo "== 조각 ${n}개를 합쳐서 적재 =="
  cat "$FILE".part-* | gunzip -c | docker load
elif [[ -f "$FILE" ]]; then
  echo "== 적재 중 (수 분 소요) =="
  gunzip -c "$FILE" | docker load
else
  echo "[x] $FILE 도 $FILE.part-* 도 없습니다."
  exit 1
fi

echo
echo "== 아키텍처 확인 =="
HOST_ARCH=$(docker info --format '{{.Architecture}}')
echo "   호스트: $HOST_ARCH"
docker images --format '{{.Repository}}:{{.Tag}}' \
  | grep -E "ndxpro|fdt-service|union-twin|pipeline-|postgres|mongo|redis|httpd|nginx|kafka-ui" \
  | sort -u | while read -r i; do
      a=$(docker image inspect "$i" --format '{{.Os}}/{{.Architecture}}' 2>/dev/null || echo "?")
      printf "   %-56s %s\n" "$i" "$a"
    done

echo
echo "[완료] 다음: ./install/1-db.sh  (0-init.sh 는 이미지가 이미 있으므로 pull 을 건너뛴다)"

#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# 로컬 이미지를 tar.gz 묶음으로 만든다.
#
#   ./pack.sh                        전체 묶음  → out/union-twin-service-images.tar.gz
#   ./pack.sh --only <이미지...>      일부만     → out/union-twin-service-images-delta.tar.gz
#   ./pack.sh --name <파일명>         출력 파일명 지정
#   ./pack.sh --split                95MB 조각으로 나눈다 (Git LFS 를 못 쓰는 저장소용)
#                                    SPLIT_SIZE=50m 처럼 크기를 바꿀 수 있다
#   ./pack.sh --no-kafka             kafka/zookeeper 를 빼고 묶는다 (설치 서버에 인터넷이 있을 때)
#                                    2-kafka.sh 가 Dockerfile 로 직접 빌드한다
#   ./pack.sh --private-only         사내 레지스트리 이미지 13개만 묶는다 (가장 작음)
#                                    공개 이미지는 0-init.sh 가 Docker Hub 에서 받는다
#
# 압축 수준은 GZIP_LEVEL 로 바꾼다 (기본 9). docker save 는 레이어를 압축하지 않고
# 내보내므로 바깥 gzip 이 실제로 크기를 좌우한다. 낮추면 빨라지지만 파일이 커진다.
#
# 저장 직전에 모든 이미지의 아키텍처를 검사하고, 대상 플랫폼과 다르면 중단한다.
# 맥에서 만들어도 리눅스 서버에서 exec format error 가 나지 않도록 하는 장치다.
# -----------------------------------------------------------------------------
source "$(dirname "$0")/_common.sh"

ONLY=(); NAME=""; SPLIT=0; NO_KAFKA=0; PRIVATE_ONLY=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --only) shift; while [[ $# -gt 0 && "$1" != --* ]]; do ONLY+=("$1"); shift; done ;;
    --name) NAME="$2"; shift 2 ;;
    --split) SPLIT=1; shift ;;
    --no-kafka) NO_KAFKA=1; shift ;;
    --private-only) PRIVATE_ONLY=1; shift ;;
    *) echo "[x] 알 수 없는 옵션: $1"; exit 1 ;;
  esac
done

if [[ ${#ONLY[@]} -gt 0 ]]; then
  IMAGES=( "${ONLY[@]}" )
  FILE="$OUT/${NAME:-union-twin-service-images-delta.tar.gz}"
  KIND="일부 갱신"
else
  IMAGES=()
  if [[ $PRIVATE_ONLY -eq 1 ]]; then
    # 사내 레지스트리 이미지만. 공개 이미지와 kafka 는 설치 서버가 각각 받거나 빌드한다.
    while IFS= read -r line; do [[ -n "$line" ]] && IMAGES+=("$line"); done \
      < <(required_images | sort -u | grep "^$IMAGE_REPO_URL/")
    KIND="사내 이미지만"
  elif [[ $NO_KAFKA -eq 1 ]]; then
    # kafka/zookeeper 는 설치 서버에서 Dockerfile 로 빌드한다 (인터넷 필요)
    while IFS= read -r line; do [[ -n "$line" ]] && IMAGES+=("$line"); done \
      < <(required_images | sort -u | grep -v '^pipeline-')
    KIND="전체(kafka 제외)"
  else
    while IFS= read -r line; do [[ -n "$line" ]] && IMAGES+=("$line"); done \
      < <(required_images | sort -u)
    KIND="전체"
  fi
  FILE="$OUT/${NAME:-union-twin-service-images.tar.gz}"
fi

WANT="${PLATFORM#*/}"

echo "== 1. 아키텍처 검사 ($KIND, ${#IMAGES[@]}개, 대상 $PLATFORM) =="
bad=0; missing=0
for i in "${IMAGES[@]}"; do
  a=$(arch_of "$i")
  if [[ "$a" == "없음" ]]; then
    printf "   [없음] %s\n" "$i"; missing=$((missing+1))
  elif [[ "$a" == "$PLATFORM" ]]; then
    printf "   [OK]   %-56s %s\n" "$i" "$a"
  else
    printf "   [X]    %-56s %s\n" "$i" "$a"; bad=$((bad+1))
  fi
done

if (( missing > 0 )); then
  echo
  echo "[x] $missing 개가 로컬에 없습니다. 먼저 받거나 빌드하세요."
  echo "    ./fetch-from-registry.sh   (사내 레지스트리)"
  echo "    ./build-from-source.sh     (소스코드)"
  exit 1
fi
if (( bad > 0 )); then
  echo
  echo "[x] $bad 개가 $PLATFORM 이 아닙니다. 이대로 말면 설치 서버에서 exec format error 가 납니다."
  echo "    --platform $PLATFORM 을 붙여 다시 받거나 빌드하세요."
  exit 1
fi

echo
echo "== 2. 저장 (gzip -${GZIP_LEVEL:-9}) =="
# docker save 는 레이어를 압축하지 않은 tar 로 내보낸다. 바깥 gzip 이 실제로 일을 하므로
# 압축 수준이 파일 크기를 크게 좌우한다. (-1 은 빠르지만 결과가 10~15% 더 크다)
docker save "${IMAGES[@]}" | gzip -"${GZIP_LEVEL:-9}" > "$FILE"

BASE="${FILE%.tar.gz}"
printf '%s\n' "${IMAGES[@]}" > "$BASE.images.txt"
{
  echo "생성: $(date '+%Y-%m-%d %H:%M')"
  echo "종류: $KIND"
  echo "플랫폼: $PLATFORM"
  echo
  for i in "${IMAGES[@]}"; do
    printf "%-58s %s %s\n" "$i" "$(arch_of "$i")" "$(docker image inspect "$i" --format '{{.Id}}' | cut -c1-19)"
  done
} > "$BASE.manifest.txt"

if [[ $SPLIT -eq 1 ]]; then
  echo
  echo "== 3. 분할 (95MB 조각) =="
  # git 은 파일당 100MB 를 넘기면 거부하는 곳이 많다. LFS 를 못 쓸 때 이 방식을 쓴다.
  split -b "${SPLIT_SIZE:-95m}" "$FILE" "$FILE.part-"
  rm -f "$FILE"
  ls -1 "$FILE".part-* | wc -l | xargs -I{} echo "   조각 {}개 생성 (원본 파일은 삭제)"
  echo "   적재할 때 images-load.sh 가 자동으로 합친다."
fi

echo
ls -lh "$OUT"/$(basename "${FILE%.tar.gz}")* 2>/dev/null | sed 's/^/   /' | head -5
echo "   목록: $BASE.images.txt"
echo "   내역: $BASE.manifest.txt"
echo
echo "[완료] 설치 서버로 옮긴 뒤:"
echo "   fdt-service-backend/scripts/images-load.sh <파일 또는 첫 조각>"

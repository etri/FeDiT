#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# 0단계: 최초 준비 — .env 확인, 포트 점검, 네트워크·디렉터리 생성, 이미지 준비
#
#   ./install/0-init.sh            이미지 묶음(tar.gz)을 적재한다        [기본]
#   ./install/0-init.sh --build    소스코드에서 이미지를 빌드한다
#
# 이 서버는 이미지 레지스트리에 접속하지 않는다.
# 이미지는 ../image-bundle 에서 만든 tar.gz 을 가져오거나, 소스코드에서 직접 빌드한다.
# -----------------------------------------------------------------------------
set -euo pipefail
cd "$(dirname "$0")/.."
ENV_FILE="${ENV_FILE:-../.env}"

MODE=bundle
for a in "$@"; do
  case "$a" in
    --build)  MODE=build ;;
    --bundle) MODE=bundle ;;
    *) echo "[x] 알 수 없는 옵션: $a"; exit 1 ;;
  esac
done

echo "== 0. 초기 준비 =="
./scripts/bootstrap.sh

set -a; source "$ENV_FILE"; set +a

# IMAGE_BUNDLE 의 상대경로는 .env 가 있는 곳(저장소 루트) 기준으로 푼다.
# 스크립트는 fdt-service-backend/ 에서 도는데 묶음은 그 한 단계 위에 있다.
BUNDLE="${IMAGE_BUNDLE:-./images/union-twin-service-images.tar.gz}"
if [[ "$BUNDLE" != /* ]]; then
  BUNDLE="$(cd "$(dirname "$ENV_FILE")" && pwd)/${BUNDLE#./}"
fi

case "$MODE" in
  bundle)
    echo
    echo "-- 이미지 묶음 적재 --"
    # 저장소에는 95MB 조각(.part-aa, .part-ab ...)으로 올라가 있다.
    # 통짜 tar.gz 이든 조각이든 둘 중 하나만 있으면 된다. 합치는 일은 images-load.sh 가 한다.
    if [[ ! -f "$BUNDLE" ]] && ! compgen -G "$BUNDLE.part-*" >/dev/null; then
      echo "[x] 이미지 묶음이 없습니다: $BUNDLE"
      echo "    (조각 $(basename "$BUNDLE").part-aa ... 도 없습니다)"
      echo
      echo "    다음 중 하나로 준비하세요."
      echo "    1) 저장소를 git 으로 내려받으면 조각이 함께 들어온다"
      echo "    2) 사내에서 만든 tar.gz 을 $(dirname "$BUNDLE")/ 에 둔다"
      echo "         (만드는 방법: ../image-bundle/README.md)"
      echo "    3) 소스코드가 있다면 여기서 직접 빌드한다"
      echo "         ./install/0-init.sh --build"
      exit 1
    fi
    ./scripts/images-load.sh "$BUNDLE"
    ;;
  build)
    echo
    echo "-- 소스코드에서 이미지 빌드 --"
    [[ -x ../image-bundle/build-from-source.sh ]] || {
      echo "[x] ../image-bundle/build-from-source.sh 이 없습니다."; exit 1; }
    ( cd ../image-bundle && ./build-from-source.sh )
    ;;
esac

# 공개 이미지(postgres·mongo·redis·httpd·nginx·kafka-ui)는 묶음에 없을 수 있다.
# Docker Hub 에서 받는다. 사내 레지스트리와 무관하고 로그인도 필요 없다.
echo
echo "-- 공개 이미지 확인 --"
PUBLIC=( "$IMG_POSTGRES" "$IMG_MONGO" "$IMG_REDIS" "$IMG_HTTPD" "$IMG_KAFKA_UI" "$IMG_NGINX" )
need=()
for i in "${PUBLIC[@]}"; do
  docker image inspect "$i" >/dev/null 2>&1 || need+=("$i")
done
if [[ ${#need[@]} -eq 0 ]]; then
  echo "   전부 있음"
else
  echo "   ${#need[@]}개를 Docker Hub 에서 받습니다 (인터넷 필요)"
  for i in "${need[@]}"; do
    echo "   -- $i"
    if ! docker pull --platform "${TARGET_PLATFORM:-linux/amd64}" "$i"; then
      echo
      echo "[x] $i 를 받지 못했습니다."
      echo "    인터넷이 없는 서버라면 사내에서 공개 이미지까지 포함해 묶어야 합니다:"
      echo "      image-bundle/pack.sh          (--private-only 없이)"
      exit 1
    fi
  done
fi

echo
./scripts/check-images.sh || {
  echo
  echo "[x] 이미지가 준비되지 않았습니다. 위 내용을 확인하세요."
  exit 1
}

echo
echo "[완료] 다음: ./install/1-db.sh"

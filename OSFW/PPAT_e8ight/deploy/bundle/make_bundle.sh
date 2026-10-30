#!/usr/bin/env bash
# SPDX-License-Identifier: LGPL-2.1-only
# Copyright (c) 2026 E8IGHT Co., Ltd.
# 이 PC에서: E8IGHT 서버로 올릴 묶음 폴더를 만든다.
#   이미지(페이지·앞단) 빌드 → 시험(deploy/test_images.sh, 실패하면 묶음을 만들지 않음)
#   → images.tar.gz · compose 설정 · 서버 설정 처음 값(env.server) · 인증서 · 실행 스크립트를 한 폴더에
# 인증서 비밀 키가 들어갈 수 있으므로 저장소 밖에 만든다(기본: git 저장소 맨 위 폴더 옆 cfd-deploy-<날짜>. FeDiT 안에 있으면 FeDiT 폴더 옆). 서버에 올린 뒤 이 PC의 사본은 지운다.
#
# 사용: bash deploy/bundle/make_bundle.sh <인증서 폴더(fullchain.pem·privkey.pem) | --no-certs> [출력 폴더]
#   --no-certs: 인증서를 넣지 않는다. 서버 ~/cfd-deploy/certs 에 이미 인증서가 있을 때(새 판으로 바꾸기). 같은 폴더에 덮어 올리면 서버 인증서가 그대로 남는다
set -euo pipefail
HERE=$(cd "$(dirname "$0")" && pwd)
DEPLOY=$(cd "$HERE/.." && pwd)
REPO=$(cd "$DEPLOY/.." && pwd)
CERTS=${1:?사용: bash deploy/bundle/make_bundle.sh <인증서 폴더 | --no-certs> [출력 폴더]}
TOP=$(git -C "$REPO" rev-parse --show-toplevel 2>/dev/null || echo "$REPO")
OUT=${2:-$(cd "$TOP/.." && pwd)/cfd-deploy-$(date +%Y%m%d)}
fail() { printf '실패: %s\n' "$*" >&2; exit 1; }
if [ "$CERTS" = --no-certs ]; then
  CERTS=""
else
  [ -f "$CERTS/fullchain.pem" ] && [ -f "$CERTS/privkey.pem" ] || fail "$CERTS 에 fullchain.pem 과 privkey.pem 이 있어야 합니다(서버에 인증서가 이미 있으면 --no-certs)"
fi
case "$(cd "$(dirname "$OUT")" 2>/dev/null && pwd)/" in "$REPO"/*) fail "출력 폴더가 저장소 안입니다(비밀 키가 들어갈 수 있습니다): $OUT" ;; esac
# 위 비교는 대소문자만 다른 경로나 아직 없는 하위 폴더를 놓친다 → 가장 가까운 '있는' 상위 폴더가 git 저장소 안인지 git 에게 묻는다
anc=$(dirname "$OUT"); while [ ! -d "$anc" ]; do anc=$(dirname "$anc"); done
if git -C "$anc" rev-parse --is-inside-work-tree >/dev/null 2>&1; then fail "출력 폴더가 git 저장소 안입니다(비밀 키가 들어갈 수 있습니다): $OUT"; fi
[ ! -e "$OUT" ] || fail "출력 폴더가 이미 있습니다: $OUT (지우거나 다른 이름을 주세요)"

echo "== 1. 이미지 빌드 (페이지·앞단)"
# --pull: 바탕 이미지 새 판 받기, --no-cache: 옛 빌드 결과를 다시 쓰지 않아 Dockerfile 의 apk upgrade 가 매번 최신 부품을 받게 함
(cd "$DEPLOY" && docker compose build --pull --no-cache renderer proxy)
rev=$(git -C "$REPO" rev-parse --short HEAD 2>/dev/null || echo unknown)
# 이미지·묶음에 들어가는 경로만 본다. git 이 아직 추적하지 않는 새 파일(??)도 센다(그 파일도 이미지에 들어가므로)
dirty=$(git -C "$REPO" status --porcelain -- src public deploy Dockerfile .dockerignore index.html pre.html sim.html post.html vite.config.ts package.json package-lock.json tsconfig.json 2>/dev/null | head -n 1 || true)

echo "== 2. 시험 (deploy/test_images.sh)"
# 묶음에 넣을 :local 이미지를 시험한다(밖에서 정해 둔 RENDERER_IMAGE·PROXY_IMAGE·KEEP 이 새어 들지 않게 못 박음).
# 이 PC 리허설 엔진의 상태는 올리는 이미지와 상관없으므로 엔진 확인은 뺀다(따로 볼 때: bash deploy/test_images.sh)
RENDERER_IMAGE=union-twin-cfd-renderer:local PROXY_IMAGE=union-twin-cfd-proxy:local KEEP= ENGINE_NETWORK=none \
  bash "$DEPLOY/test_images.sh" || fail "시험에 실패했습니다. 위의 '실패' 줄을 보고 고친 뒤 다시 만드세요(묶음은 만들지 않았습니다)"
echo "   화면이 실제로 그려지는지는 이 시험이 보지 못한다. 올리기 전에 한 번: KEEP=1 bash deploy/test_images.sh → 브라우저로 네 화면 → bash deploy/test_images.sh --clean"

echo "== 3. 묶음 폴더: $OUT"
mkdir -p "$OUT/proxy"
docker save union-twin-cfd-renderer:local union-twin-cfd-proxy:local | gzip -1 > "$OUT/images.tar.gz"
cp "$DEPLOY/docker-compose.yml" "$DEPLOY/docker-compose.server.yml" "$DEPLOY/smoke_test.sh" "$OUT/"
cp -r "$DEPLOY/proxy/." "$OUT/proxy/"
cp "$HERE/run.sh" "$HERE/README.txt" "$OUT/"
if [ -n "$CERTS" ]; then
  mkdir -p "$OUT/certs"
  cp "$CERTS/fullchain.pem" "$CERTS/privkey.pem" "$OUT/certs/"
fi

# 서버 설정의 처음 값. run.sh 가 서버에 .env 가 없을 때만 이것을 .env 로 복사한다(다시 올려도 서버에서 고친 .env 는 덮이지 않음).
# 점으로 시작하지 않는 이름이라 파일질라에서 숨은 파일로 빠질 일도 없다. ENGINE_NETWORK·JOBS_HOST_DIR 은 run.sh 가 1세부 엔진에서 찾아 채운다
cat > "$OUT/env.server" <<'EOF'
# E8IGHT 서버용 처음 값. run.sh 가 .env 로 복사하고 ENGINE_NETWORK · JOBS_HOST_DIR 을 1세부 엔진 컨테이너에서 찾아 채운다.
# 값을 바꿀 때는 이 파일이 아니라 서버의 .env 를 고치고 bash run.sh 를 다시 실행한다.
PUBLIC_HOST=cfd.fedit.or.kr
CERT_DIR=./certs
# 해석 실행 접근 키. 비우면 열려 있다. 넣으면 16자 이상(영문·숫자·_·-), 다시 run.sh
ACCESS_KEY=
PROXY_BIND=0.0.0.0
HTTP_PORT=80
HTTPS_PORT=443
PROXY_LOCAL_PORT=8090
RENDERER_BIND=127.0.0.1
RENDERER_PORT=8088
# 이 페이지를 iframe 으로 띄울 수 있는 사이트
FRAME_ANCESTORS="'self' https://service.fedit.or.kr"
JOBS_HOST_DIR=
ENGINE_NETWORK=
# 이 서버에서는 우리 engine 을 띄우지 않는다(1세부 compose 가 띄움). compose 가 값을 요구해서 둔다
ENGINE_DIR=/not-used
EOF

{
  echo "만든 날: $(date '+%Y-%m-%d %H:%M')"
  echo "저장소 커밋: $rev${dirty:+ (커밋 전 변경 포함)}"
  echo "시험: deploy/test_images.sh 통과"
  if [ -n "$CERTS" ]; then echo "인증서: 들어 있음(certs/)"; else echo "인증서: 넣지 않음 — 서버 ~/cfd-deploy/certs 에 있는 것을 그대로 쓴다(같은 폴더에 덮어 올리면 남는다)"; fi
  for i in union-twin-cfd-renderer union-twin-cfd-proxy; do
    printf '%s %s (%s)\n' "$i:local" "$(docker image inspect -f '{{.Id}}' "$i:local")" "$(docker run --rm --entrypoint nginx "$i:local" -v 2>&1 | sed 's/^nginx version: //')"
  done
  (cd "$OUT" && sha256sum images.tar.gz docker-compose.yml docker-compose.server.yml run.sh env.server smoke_test.sh)
} > "$OUT/BUILD.txt"

echo "== 완료"
ls -la "$OUT"
du -sh "$OUT"
echo "서버에 ~/cfd-deploy 폴더(배포 계정의 홈 아래)를 만들고 이 폴더 안의 파일을 모두 그 안에 올린 뒤(파일질라, SFTP, 배포 계정), 서버에서: cd ~/cfd-deploy && bash run.sh"
if [ -n "$CERTS" ]; then
  echo "서버에 올린 뒤 이 PC 에서: rm -rf \"$OUT/certs\"   (images.tar.gz·BUILD.txt 는 되돌리기용으로 다음 판이 안정될 때까지 둔다)"
else
  echo "인증서는 넣지 않았다: 서버 ~/cfd-deploy/certs 가 있어야 한다(처음 설치라면 인증서 폴더를 주고 다시 만든다)"
fi

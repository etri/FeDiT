# 묶음 제작 스크립트 공통. 직접 실행하지 않는다.
set -euo pipefail
cd "$(dirname "$0")"

INSTALL_ENV="${INSTALL_ENV:-../.env}"
[[ -f "$INSTALL_ENV" ]] || { echo "[x] $INSTALL_ENV 이 없습니다. 상위에서 cp .env.example .env 하세요."; exit 1; }
set -a; source "$INSTALL_ENV"; set +a

BUNDLE_ENV="${BUNDLE_ENV:-./bundle.env}"
if [[ -f "$BUNDLE_ENV" ]]; then
  set -a; source "$BUNDLE_ENV"; set +a
else
  echo "[!] $BUNDLE_ENV 이 없습니다. cp bundle.env.example bundle.env 후 값을 채우세요."
fi

PLATFORM="${TARGET_PLATFORM:-linux/amd64}"
OUT="${OUT:-./out}"
mkdir -p "$OUT"

# 설치에 필요한 이미지 목록을 compose 파일에서 직접 뽑는다 (수동 목록 관리 불필요)
required_images() {
  ( cd ../fdt-service-backend && docker compose --env-file ../.env \
      -f db/compose.yml -f kafka/compose.yml -f ndxpro/compose.yml \
      -f ndxpro/compose-file.yml -f ndxpro/compose-fdt.yml config --images 2>/dev/null )
  ( cd ../fdt-service-frontend && docker compose --env-file ../.env \
      -f front/compose.yml -f nginx/compose.yml config --images 2>/dev/null )
}

# 이미지 이름 → SRC_ 변수명  (예: .../ndxpro-core-databroker:v1.1.2 → SRC_NDXPRO_CORE_DATABROKER)
src_var_for() {
  # 순서 주의: 레지스트리 주소에 포트(:12000)가 있으므로 슬래시부터 잘라낸 뒤 태그를 뗀다
  local img="${1##*/}"      # 172.16.28.217:12000/ndxpro-x:v1 → ndxpro-x:v1
  img="${img%%:*}"          # ndxpro-x:v1 → ndxpro-x
  echo "SRC_$(echo "$img" | tr 'a-z-' 'A-Z_')"
}

# 이 레지스트리에 로그인돼 있는지 확인한다.
# docker system info 에는 로그인과 무관하게 주소가 나오므로 config.json 의 auths 를 본다.
registry_logged_in() {
  local reg="$1" cfg="${DOCKER_CONFIG:-$HOME/.docker}/config.json"
  [[ -f "$cfg" ]] || return 1
  python3 - "$cfg" "$reg" <<'PYEOF' 2>/dev/null
import json, sys
try:
    auths = (json.load(open(sys.argv[1])) or {}).get("auths") or {}
except Exception:
    sys.exit(1)
sys.exit(0 if sys.argv[2] in auths else 1)
PYEOF
}

arch_of() { docker image inspect "$1" --format '{{.Os}}/{{.Architecture}}' 2>/dev/null || echo "없음"; }

# 이미지 이름 → OPT_ 변수명 (docker build 추가 인자)
opt_var_for() {
  local img="${1##*/}"; img="${img%%:*}"
  echo "OPT_$(echo "$img" | tr 'a-z-' 'A-Z_')"
}

# 소스 디렉터리의 빌드 방식을 판별한다: dockerfile | jib | 없음
build_kind() {
  local dir="$1"
  [[ -f "$dir/Dockerfile" ]] && { echo dockerfile; return; }
  if [[ -f "$dir/gradlew" ]] && grep -qs "com.google.cloud.tools.jib" "$dir/build.gradle" "$dir/build.gradle.kts" 2>/dev/null; then
    echo jib; return
  fi
  echo none
}

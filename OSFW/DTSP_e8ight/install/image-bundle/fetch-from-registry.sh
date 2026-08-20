#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# 사내 레지스트리에서 이미지를 받아온다. **사내망이 닿는 담당자 PC 에서만 실행한다.**
#
#   ./fetch-from-registry.sh              전부 받기
#   ./fetch-from-registry.sh <이미지...>   지정한 것만 받기 (새 버전 갱신용)
#   ./fetch-from-registry.sh -u admin     아이디를 미리 지정 (비밀번호만 입력)
#
# 계정은 파일에 저장하지 않는다. 실행할 때 직접 입력한다.
# 설치 서버는 이 스크립트를 쓰지 않는다 — 만들어진 tar.gz 만 가져간다.
# -----------------------------------------------------------------------------
source "$(dirname "$0")/_common.sh"

REG_USER=""
TARGETS=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    -u|--user) REG_USER="$2"; shift 2 ;;
    -*) echo "[x] 알 수 없는 옵션: $1"; exit 1 ;;
    *) TARGETS+=("$1"); shift ;;
  esac
done

echo "== 레지스트리에서 이미지 받기 ($PLATFORM) =="
echo "   레지스트리: $IMAGE_REPO_URL"
echo

# --- 로그인 ------------------------------------------------------------------
# 이미 로그인돼 있으면 다시 묻지 않는다.
if registry_logged_in "$IMAGE_REPO_URL"; then
  echo "-- 이미 로그인돼 있습니다 (다시 입력하려면 docker logout $IMAGE_REPO_URL) --"
else
  if [[ -z "$REG_USER" ]]; then
    read -r -p "레지스트리 아이디: " REG_USER || true
  else
    echo "레지스트리 아이디: $REG_USER"
  fi
  # 터미널이면 입력을 감추고, 파이프로 넘어온 경우에도 그대로 읽는다
  if [[ -t 0 ]]; then
    read -rs -p "비밀번호: " REG_PASS || true; echo
  else
    read -r REG_PASS || true
  fi
  if [[ -z "$REG_USER" || -z "$REG_PASS" ]]; then
    echo "[x] 아이디와 비밀번호가 필요합니다. 터미널에서 직접 실행하세요."
    exit 1
  fi

  # --password-stdin 을 써서 비밀번호가 프로세스 목록이나 히스토리에 남지 않게 한다
  if ! printf '%s' "$REG_PASS" | docker login "$IMAGE_REPO_URL" -u "$REG_USER" --password-stdin; then
    echo "[x] 로그인 실패. 아이디/비밀번호와 사내망 연결을 확인하세요."
    exit 1
  fi
  unset REG_PASS
fi

# --- 대상 목록 ---------------------------------------------------------------
if [[ ${#TARGETS[@]} -eq 0 ]]; then
  # kafka/zookeeper 는 레지스트리에 없다. build-from-source.sh 또는 2-kafka.sh 가 빌드한다.
  while IFS= read -r line; do [[ -n "$line" ]] && TARGETS+=("$line"); done \
    < <(required_images | sort -u | grep -v '^pipeline-')
fi

echo
echo "-- ${#TARGETS[@]}개 받기 --"
for i in "${TARGETS[@]}"; do
  echo
  echo "-- $i"
  if ! docker pull --platform "$PLATFORM" "$i"; then
    echo
    echo "[x] $i 를 받지 못했습니다."
    echo "    인증 오류라면 로그인 정보가 오래된 것입니다:"
    echo "      docker logout $IMAGE_REPO_URL   후 다시 실행"
    exit 1
  fi
done

echo
echo "== 결과 =="
for i in "${TARGETS[@]}"; do printf "   %-58s %s\n" "$i" "$(arch_of "$i")"; done

echo
echo "[완료] 다음: ./pack.sh"
echo "   보안을 위해 작업이 끝나면 로그아웃해 두는 것을 권합니다:"
echo "     docker logout $IMAGE_REPO_URL"

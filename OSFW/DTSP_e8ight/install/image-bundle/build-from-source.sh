#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# 소스코드에서 이미지를 빌드한다. 레지스트리가 없어도 된다.
#
#   ./build-from-source.sh              bundle.env 에 경로가 적힌 것 전부
#   ./build-from-source.sh <이미지...>   지정한 것만
#
# 각 이미지의 소스 위치는 bundle.env 의 SRC_* 에 적는다. 빌드 방식은 자동 판별한다.
#   Dockerfile 있음  → docker build --platform (OPT_* 로 --target 등 추가 인자 전달)
#   gradlew + jib    → ./gradlew jibDockerBuild (NDXPro 코어 9개가 이 방식)
# postgres·mongo·redis 같은 공개 이미지는 소스가 없으므로 Docker Hub 에서 받는다.
# -----------------------------------------------------------------------------
source "$(dirname "$0")/_common.sh"
set +e   # 개별 빌드 실패를 모아서 마지막에 보고한다

# Jib(gradle) 빌드용 JDK.
# NDXPro 코어는 gradle 7.4~7.5.1 을 쓰는데 이 버전은 Java 21 을 지원하지 않는다
# (Unsupported class file major version 65). Java 17 로 빌드해야 한다.
JHOME="${JAVA_HOME_FOR_BUILD:-}"
if [[ -z "$JHOME" && -x /usr/libexec/java_home ]]; then
  JHOME=$(/usr/libexec/java_home -v 17 2>/dev/null || true)
fi

echo "== 소스코드에서 이미지 빌드 ($PLATFORM) =="
[[ -n "$JHOME" ]] && echo "   Jib 빌드 JDK: $JHOME"

if [[ $# -gt 0 ]]; then
  TARGETS=( "$@" )
else
  TARGETS=()
  while IFS= read -r line; do [[ -n "$line" ]] && TARGETS+=("$line"); done \
    < <(required_images | sort -u)
fi

built=0; pulled=0; skipped=0; failed=0
for img in "${TARGETS[@]}"; do
  var=$(src_var_for "$img")
  src="${!var:-}"

  # 사내 이미지가 아니고 소스 경로도 없으면 공개 이미지다 → Docker Hub 에서 받는다
  if [[ -z "$src" && "$img" != "$IMAGE_REPO_URL"/* && "$img" != pipeline-* ]]; then
    echo
    echo "-- 공개 이미지: $img (Docker Hub)"
    docker pull --platform "$PLATFORM" "$img"
    pulled=$((pulled+1)); continue
  fi

  if [[ -z "$src" ]]; then
    printf "   [건너뜀] %-52s %s 가 비어 있음\n" "$img" "$var"
    skipped=$((skipped+1)); continue
  fi
  if [[ ! -d "$src" ]]; then
    printf "   [없음]   %-52s %s\n" "$img" "$src"
    failed=$((failed+1)); continue
  fi
  kind=$(build_kind "$src")
  if [[ "$kind" == "none" ]]; then
    printf "   [오류]   %-52s Dockerfile 도 jib 설정도 없음\n" "$img"
    failed=$((failed+1)); continue
  fi

  echo
  echo "-- 빌드($kind): $img  ←  $src"

  ok=0
  if [[ "$kind" == "dockerfile" ]]; then
    optvar=$(opt_var_for "$img")
    # 모노레포처럼 --target/--build-arg 가 필요하면 OPT_* 에 적는다 (단어 분리가 필요해 따옴표 없이 전달)
    # shellcheck disable=SC2086
    DOCKER_BUILDKIT=1 docker build --platform "$PLATFORM" ${!optvar:-} -t "$img" "$src" && ok=1
  else
    # Jib 은 Dockerfile 없이 gradle 에서 이미지를 만든다. jibDockerBuild 는 로컬 도커로 넣는다.
    # 맥에서는 --platform 이 아니라 -Djib.from.platforms 로 대상 아키텍처를 지정해야 한다.
    name="${img%:*}"; tag="${img##*:}"
    [[ "$name" == "$img" ]] && tag="$IMAGE_TAG"
    # gradlew 에 실행 권한이 없는 경우가 흔하다. 소스를 건드리지 않고 sh 로 실행한다.
    if [[ -z "$JHOME" ]]; then
      echo "   [!] Java 17 을 찾지 못했습니다. bundle.env 의 JAVA_HOME_FOR_BUILD 에 경로를 적으세요."
    fi
    ( cd "$src" && JAVA_HOME="${JHOME:-$JAVA_HOME}" sh ./gradlew --no-daemon jibDockerBuild \
        -Djib.from.platforms="$PLATFORM" \
        -Djib.to.image="$name" -Djib.to.tags="$tag" ) && ok=1
  fi

  if (( ok == 1 )); then
    built=$((built+1))
  else
    printf "   [실패]   %s\n" "$img"
    failed=$((failed+1))
  fi
done

echo
echo "== 결과: 빌드 $built / 받기 $pulled / 건너뜀 $skipped / 실패 $failed =="
for img in "${TARGETS[@]}"; do printf "   %-58s %s\n" "$img" "$(arch_of "$img")"; done

if (( failed > 0 )); then
  echo
  echo "[!] 실패한 항목이 있습니다. bundle.env 의 SRC_* 경로를 확인하세요."
  exit 1
fi
if (( skipped > 0 )); then
  echo
  echo "[!] $skipped 개는 소스 경로가 없어 만들지 못했습니다."
  echo "    bundle.env 의 해당 SRC_* 에 경로를 적거나, 그 이미지들은 tar 묶음으로 받아야 합니다."
fi
echo
echo "[완료] 다음: ./pack.sh"

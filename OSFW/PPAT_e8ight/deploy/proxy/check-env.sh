#!/bin/sh
# SPDX-License-Identifier: LGPL-2.1-only
# Copyright (c) 2026 E8IGHT Co., Ltd.
# 앞단이 시작하기 전에 값을 확인한다. 하나라도 틀리면 컨테이너를 멈춘다(설정 만들기(20-envsubst) 전에 돈다).
# 기본값(ACCESS_KEY="", RENDERER_UPSTREAM, ENGINE_UPSTREAM)은 Dockerfile 의 ENV 에 있다 — 이 스크립트는 따로 도는 프로세스라 여기서 export 해도 설정 만들기에 닿지 않는다.
set -eu
fail() { echo "proxy: $*" >&2; exit 1; }

[ -n "${PUBLIC_HOST:-}" ] || fail "PUBLIC_HOST(페이지 주소 이름, 예: cfd.fedit.or.kr)가 비어 있습니다"
case "$PUBLIC_HOST" in *[!A-Za-z0-9.-]*) fail "PUBLIC_HOST 에는 영문·숫자·.·- 만 씁니다: $PUBLIC_HOST" ;; esac

# 접근 키: 비우면 해석 실행이 열려 있다. 넣으면 16자 이상, 쿠키에 그대로 담기는 글자만
key=${ACCESS_KEY:-}
if [ -n "$key" ]; then
  [ "${#key}" -ge 16 ] || fail "ACCESS_KEY(해석 실행 접근 키)는 16자 이상이어야 합니다(비우면 열림)"
  case "$key" in *[!A-Za-z0-9_-]*) fail "ACCESS_KEY 에는 영문·숫자·_·- 만 씁니다" ;; esac
fi

# 안쪽 주소: 컨테이너이름:포트
for name in RENDERER_UPSTREAM ENGINE_UPSTREAM; do
  eval "v=\${$name:-}"
  [ -n "$v" ] || fail "$name 이 비어 있습니다(예: renderer:8080, engine:8000)"
  case "$v" in *[!A-Za-z0-9._:-]*) fail "$name 은 이름:포트 형식이어야 합니다: $v" ;; esac
done

[ -r /etc/nginx/certs/fullchain.pem ] && [ -r /etc/nginx/certs/privkey.pem ] \
  || fail "인증서가 없습니다: CERT_DIR 폴더에 fullchain.pem(인증서 묶음)과 privkey.pem(비밀 키)을 두세요"

if [ -n "$key" ]; then
  echo "proxy: ${PUBLIC_HOST} — 해석 실행은 접근 키가 있어야 합니다"
else
  echo "proxy: ${PUBLIC_HOST} — 해석 실행이 열려 있습니다(ACCESS_KEY 비움)"
fi

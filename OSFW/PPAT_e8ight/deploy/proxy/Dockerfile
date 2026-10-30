# SPDX-License-Identifier: LGPL-2.1-only
# Copyright (c) 2026 E8IGHT Co., Ltd.
# 앞단 이미지: 공식 nginx + 이 서버용 설정(틀 + 길 나누기) + 시작 전 값 확인.
# 인증서는 이미지에 넣지 않고 실행할 때 CERT_DIR 폴더를 읽기 전용으로 붙인다(deploy/docker-compose.yml 의 proxy).
# 빌드: deploy 폴더에서 docker compose build proxy
# 지원이 이어지는 안정판 계열(1.30)을 쓴다 — 1.28 계열은 지원이 끝나 다시 빌드해도 보안 수정이 들어오지 않는다(2026-10-29)
FROM nginx:1.30-alpine
# 바탕 이미지가 만들어진 뒤에 나온 Alpine 부품 수정판을 빌드할 때 받는다(nginx 꾸러미는 판이 고정돼 있어 바뀌지 않는다)
RUN apk upgrade --no-cache
# 시작할 때 정의된 환경 변수만 바꿔 /etc/nginx/conf.d/default.conf 를 만든다(공식 이미지의 20-envsubst-on-templates.sh)
COPY default.conf.template /etc/nginx/templates/default.conf.template
# 환경 변수를 쓰지 않는 길 나누기. 위 설정의 두 server 가 include 한다
COPY locations.conf /etc/nginx/cfd/locations.conf
# 공식 이미지의 시작 스크립트가 /docker-entrypoint.d/ 를 이름 순서로 돌린다 — 설정 만들기(20-) 전에 값을 확인한다
COPY check-env.sh /docker-entrypoint.d/05-check-env.sh
RUN chmod 755 /docker-entrypoint.d/05-check-env.sh
# 기본값. 설정 틀의 ${...} 는 정의된 변수만 바뀌므로 ACCESS_KEY 도 빈 값으로 정의해 둔다(비움 = 해석 실행 열림)
ENV ACCESS_KEY="" \
    RENDERER_UPSTREAM=renderer:8080 \
    ENGINE_UPSTREAM=engine:8000
# 80 → https 되돌림, 443 https, 8080 안쪽 확인용(compose 가 127.0.0.1 에만 연다)
EXPOSE 80 443 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1

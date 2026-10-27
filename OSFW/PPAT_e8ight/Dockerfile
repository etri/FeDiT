# SPDX-License-Identifier: LGPL-2.1-only
# Copyright (c) 2026 E8IGHT Co., Ltd.
# 연합트윈 CFD 렌더러 이미지: 전처리·후처리 페이지를 빌드해 정적 파일 서버(nginx)로 내준다.
# 정적 파일만 내준다. 해석엔진 호출(engine/)과 결과 읽기(results/)는 앞단(deploy/proxy)이 같은 주소 아래로 이어 준다.
#
# 빌드(이 Dockerfile 이 있는 폴더에서):  docker build -t union-twin-cfd-renderer .
# 실행: deploy/docker-compose.yml, deploy/README.md 참고
FROM node:22.18.0-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY tsconfig.json vite.config.ts index.html pre.html sim.html post.html ./
COPY src ./src
COPY public ./public
# 큰 정적 파일은 미리 압축해 둔다(nginx gzip_static이 .gz를 그대로 보냄). 내장 STL 21 MB, 도시 예제 CSV 3 MB가 여기 든다
RUN npm run build \
 && find dist -type f \( -name '*.js' -o -name '*.css' -o -name '*.html' -o -name '*.json' -o -name '*.csv' -o -name '*.stl' -o -name '*.svg' \) -size +1k -exec gzip -k -9 {} +

# nginx를 root가 아닌 사용자(uid 101)로, 8080 포트에서 돌리는 공식 이미지
FROM nginxinc/nginx-unprivileged:1.28-alpine
# 시작할 때 환경 변수(FRAME_ANCESTORS)를 넣어 /etc/nginx/conf.d/default.conf를 만든다
COPY deploy/nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
# 이 페이지를 iframe으로 띄울 수 있는 출처. * = 제한 없음(호스트 주소가 정해지면 좁힌다)
ENV FRAME_ANCESTORS="*"
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1

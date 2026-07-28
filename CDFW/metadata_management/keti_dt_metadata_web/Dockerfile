# Metadata Web (Vue 3 -> nginx)
# 소스에서 바로 빌드한다. 서버에 Node 를 설치할 필요가 없다.
#
# Vue 는 환경변수를 빌드 시점에 코드에 넣기 때문에, 아래 값은 실행 시가 아니라
# 빌드 시 --build-arg 로 넘겨야 한다.
#
#   docker build \
#     --build-arg SERVER_HOST=203.0.113.10 \
#     --build-arg WEB_SERVER_URL=http://203.0.113.10:8084 \
#     -t keti-dt-metadata-web:latest .
#
# WEB_SERVER_URL 은 DB(application.redirect_uri)에 넣은 값과 반드시 같아야 한다.
# 다르면 로그인 후 redirect_uri mismatch 로 실패한다.

# 1단계: 빌드
FROM node:lts-alpine AS build-stage

# 브라우저가 접속하는 주소 (컨테이너명이 아니라 실제 서버 주소여야 한다)
ARG SERVER_HOST=localhost
ARG WEB_SERVER_URL=http://localhost:8084

# 인증 서버에 등록된 OAuth 앱 정보 (dml_hubsecurity_public_data.sql 의 security 앱)
ARG CLIENT_ID=3eRofhrl6wPWauX2u0GT
ARG CLIENT_SECRET=yFu9svjeJvCY3PLkkpFYF1CvWo7McL7F

# 지도 기능을 쓸 때만 지정한다. 카카오 개발자 사이트에서 직접 발급받은 키를 넣는다.
# 값을 비워 두면 지도만 동작하지 않고 나머지 기능은 정상이다.
ARG KAKAO_JS_KEY=

ENV VUE_APP_N2M_AUTH_URI=http://${SERVER_HOST}:33000 \
    VUE_APP_N2M_REDIRECT_URI=${WEB_SERVER_URL}/redirect \
    VUE_APP_N2M_AUTH_CLIENT_ID=${CLIENT_ID} \
    VUE_APP_N2M_AUTH_CLIENT_SECRET=${CLIENT_SECRET} \
    VUE_APP_PLATFORMADMIN_SERVER_URL=http://${SERVER_HOST}:6998 \
    VUE_APP_METADATA_API_SERVER_URL=http://${SERVER_HOST}:16997 \
    VUE_APP_KAKAO_JS_KEY=${KAKAO_JS_KEY}

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build-linux

# 2단계: 실행
FROM nginx:stable-alpine AS production-stage

RUN rm -rf /etc/nginx/conf.d/default.conf /usr/share/nginx/html/*

COPY nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build-stage /app/dist /usr/share/nginx/html

EXPOSE 8084
CMD ["nginx", "-g", "daemon off;"]

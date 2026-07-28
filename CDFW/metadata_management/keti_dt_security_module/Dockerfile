# 인증 서버 (Node.js)
# 설정값은 환경변수로 주입한다. 환경변수를 주지 않으면 server_conf.js 의 기본값을 쓴다.
#   SERVER_HOST / SECURITY_PORT / WEB_SERVER_URL
#   DB_HOST / DB_PORT / HUBSECURITY_DBNAME / HUBSECURITY_USERNAME / HUBSECURITY_PASSWORD

FROM node:lts-alpine

WORKDIR /usr/src/app

# bcrypt 등 네이티브 모듈 빌드에 필요한 도구 (설치 후 제거)
RUN apk add --no-cache --virtual .build-deps python3 make g++

COPY package*.json ./
RUN npm install && apk del .build-deps

COPY . .

EXPOSE 33000
CMD ["node", "bin/www"]

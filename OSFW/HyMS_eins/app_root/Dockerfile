# =============================================================================
#  참고 : docker_setup/docker-compose.yaml 은 이 Dockerfile 을 쓰지 않는다.
#
#  npm 레지스트리에 닿지 못하는 환경에서도 `docker-compose up -d` 만으로
#  기동되도록, compose 는 node:20-alpine 이미지에 app_root 를 바인드 마운트하고
#  패키지에 함께 넣어둔 node_modules 로 바로 실행한다.
#
#  이미지로 굽고 싶을 때만 아래를 사용한다(빌드 시 npm 접속 필요).
#    docker build -t hyms-node ./app_root
# =============================================================================
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund

COPY . .

EXPOSE 8081

CMD ["node", "index.js"]

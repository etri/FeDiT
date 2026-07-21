FROM node:16-bullseye

RUN apt-get update \
 && apt-get install -y netcat-openbsd curl \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY ./federatedDigitalBrain/ /app/

RUN npm install

COPY ./docker/digital-brain/config.index.js /app/config/index.js
COPY ./docker/digital-brain/docker-entrypoint.sh /docker-entrypoint.sh

RUN chmod +x /docker-entrypoint.sh

EXPOSE 1213

ENTRYPOINT ["/docker-entrypoint.sh"]
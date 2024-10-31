
FROM node:20.11.1-alpine

ARG WORKDIR
ENV WORKDIR ${WORKDIR}
WORKDIR ${WORKDIR}
COPY . ./

RUN chmod 755 entrypoint.sh

RUN apk update
RUN apk upgrade

RUN apk add --no-cache udev ttf-freefont chromium

RUN apk --no-cache add tzdata && \
	cp /usr/share/zoneinfo/Asia/Seoul /etc/localtime && \
	echo "Asia/Seoul" > /etc/timezone \
	apk del tzdata

RUN npm install

RUN npm i -g pm2

RUN pm2 install pm2-logrotate

RUN npm run build 
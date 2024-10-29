FROM node:lts-alpine as build-stage

LABEL name djko
LABEL email djko@n2m.co.kr


# COPY package*.json ./
# RUN npm install --production
# COPY . .

# ENV GENERATE_SOURCEMAP=false
# ENV NODE_OPTIONS=--max_old_space_size=2048

# RUN npm run build

FROM nginx:stable-alpine as production-stage

RUN rm -rf /etc/nginx/conf.d/default.conf
RUN rm -rf /usr/share/nginx/html/*

RUN mkdir /usr/share/nginx/html/fonts
RUN mkdir /usr/share/nginx/html/img
RUN mkdir /usr/share/nginx/html/js
#RUN mkdir /usr/share/nginx/html/files

COPY ./nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf

COPY ./dist/index.html /usr/share/nginx/html/index.html
COPY ./dist/favicon.ico /usr/share/nginx/html/favicon.ico
COPY ./dist/fonts /usr/share/nginx/html/fonts
COPY ./dist/img /usr/share/nginx/html/img
COPY ./dist/js /usr/share/nginx/html/js
#COPY ./dist/files /usr/share/nginx/html/files

CMD ["nginx", "-g", "daemon off;"]




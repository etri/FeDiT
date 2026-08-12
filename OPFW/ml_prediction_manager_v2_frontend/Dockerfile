FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY build/ /usr/share/nginx/html/
COPY env.sh /docker-entrypoint.d/40-runtime-env.sh
RUN chmod 755 /docker-entrypoint.d/40-runtime-env.sh
EXPOSE 80

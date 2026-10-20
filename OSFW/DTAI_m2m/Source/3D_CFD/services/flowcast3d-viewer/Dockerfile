# syntax=docker/dockerfile:1.7
FROM node:24-alpine AS build
WORKDIR /opt/viewer
COPY services/flowcast3d-viewer/package.json services/flowcast3d-viewer/package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY services/flowcast3d-viewer/index.html services/flowcast3d-viewer/vite.config.ts services/flowcast3d-viewer/tsconfig*.json ./
COPY services/flowcast3d-viewer/src ./src
COPY services/flowcast3d-viewer/public ./public
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.29-alpine
ENV FLOWCAST_VIEWER_PORT=8090 \
    FLOWCAST_MANAGEMENT_PORT=8082 \
    NGINX_ENVSUBST_FILTER="^(FLOWCAST_VIEWER_PORT|FLOWCAST_MANAGEMENT_PORT)$"
RUN rm -f /etc/nginx/conf.d/default.conf
COPY services/flowcast3d-viewer/nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /opt/viewer/dist /usr/share/nginx/html
COPY LICENSE NOTICE /usr/share/licenses/flowcast3d/
EXPOSE ${FLOWCAST_VIEWER_PORT}
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -q -O /dev/null "http://127.0.0.1:${FLOWCAST_VIEWER_PORT}/health" || exit 1

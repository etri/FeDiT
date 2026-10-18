# ============================================
# Stage 1: Build the React application
# ============================================
FROM node:22 AS build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . ./

ENV VITE_API_URL=IITP_ENV_API_URL
ENV VITE_ENV_MODE=IITP_ENV_ENV_MODE

RUN npm run build

# ============================================
# Stage 2: Serve the React application from Nginx
# ============================================
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY ./docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY ./docker/env.sh /docker-entrypoint.d/env.sh

RUN chmod +x /docker-entrypoint.d/env.sh && \
    sed -i 's/\r$//' /docker-entrypoint.d/env.sh
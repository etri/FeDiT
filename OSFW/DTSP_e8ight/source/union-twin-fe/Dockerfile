# 두 앱 공용. `--target union-twin-fe|union-twin-be` + `--build-arg PKG=<워크스페이스 이름>` 으로 고른다.
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat && corepack enable && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs nodejs
WORKDIR /app

# ---- Stage 1: Prune monorepo (turbo prune) ----
FROM base AS pruner
ARG PKG
RUN npm i -g turbo@2
COPY . .
RUN turbo prune "$PKG" --docker

# ---- Stage 2: Install + Build ----
FROM base AS builder
ARG PKG
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV HUSKY=0
RUN corepack install -g pnpm@11.17.0

# turbo prune 결과물: package.json + pnpm-workspace.yaml + pruned lockfile
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

# dev 의존성 포함 설치 (nest build / next build 필요)
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# 소스 복사 + 빌드
COPY --from=pruner /app/out/full/ .
RUN --mount=type=cache,target=/app/.turbo --mount=type=cache,target=/app/client/.next/cache \
    pnpm exec turbo run build --filter="$PKG"

# prod 전용 배포 번들 추출 (dev 의존성 제외). server 만 쓴다.
FROM builder AS deployer
ARG PKG
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm --filter="$PKG" deploy --prod --legacy /app/deploy

# ---- Stage 3: Runtime ----
FROM base AS union-twin-be
ENV NODE_ENV=production
# pnpm deploy 산출물: dist + prod node_modules + package.json (self-contained)
COPY --from=deployer --chown=nodejs:nodejs /app/deploy ./
USER nodejs
EXPOSE 4000
ENV PORT=4000
CMD ["node", "dist/main.js"]

FROM base AS union-twin-fe
ENV NODE_ENV=production
# Standalone 결과물 복사
COPY --from=builder --chown=nodejs:nodejs /app/client/.next/standalone ./
COPY --from=builder --chown=nodejs:nodejs /app/client/.next/static ./client/.next/static
COPY --from=builder --chown=nodejs:nodejs /app/client/public ./client/public
USER nodejs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "client/server.js"]

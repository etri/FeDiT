#!/usr/bin/env bash
# DB 백업 — PostgreSQL 전체 덤프 + MongoDB 아카이브
#   ./scripts/backup.sh [출력디렉터리]     (기본 ./backup)
set -euo pipefail
cd "$(dirname "$0")/.."
ENV_FILE="${ENV_FILE:-../.env}"
set -a; source "$ENV_FILE"; set +a

OUT="${1:-./backup}"
mkdir -p "$OUT"
STAMP=$(date +%Y%m%d-%H%M)

echo "-- PostgreSQL --"
docker exec postgres pg_dumpall -U "$POSTGRES_ADMIN_USER" > "$OUT/postgres-$STAMP.sql"

echo "-- MongoDB --"
docker exec mongodb sh -c 'mongodump --archive --gzip -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin' \
  > "$OUT/mongo-$STAMP.archive.gz"

ls -lh "$OUT" | tail -3
echo
echo "함께 백업할 것: $REPO/file-service/data, $REPO/ngsi-context, $REPO/translatorJars, 그리고 $ENV_FILE"

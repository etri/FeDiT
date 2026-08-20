#!/bin/bash
# 로컬 개발용 Postgres 초기화. union_twin DB 만 만든다.
# (운영에서는 백엔드의 db/init/postgres/01-init.sh 가 ndxpro 와 함께 생성한다)
set -e
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres <<SQL
create user "${APP_USER}" with password '${APP_PASSWORD}';
create database "${UNION_TWIN_DB}" owner "${APP_USER}";
SQL
echo "[init] ${UNION_TWIN_DB} 생성 완료"

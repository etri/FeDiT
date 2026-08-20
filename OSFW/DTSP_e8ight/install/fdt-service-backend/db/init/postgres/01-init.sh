#!/bin/bash
# -----------------------------------------------------------------------------
# PostgreSQL 최초 기동(데이터 디렉터리가 비어 있을 때) 1회만 실행된다.
# .env 의 POSTGRES_USER / POSTGRES_PASSWORD / POSTGRES_DB / UNION_TWIN_DB 값으로
# 애플리케이션 계정과 DB, 스키마를 생성한다.
#   - 기존 infra/postgresql/schema.sql 의 하드코딩된 계정/비밀번호를 대체한다.
#   - union_twin DB 도 여기서 함께 만든다(과거에는 로컬 전용 SQL 로 따로 만들었음).
# -----------------------------------------------------------------------------
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres <<SQL
create user "${APP_USER}" with password '${APP_PASSWORD}';

create database "${APP_DB}" owner "${APP_USER}";
create database "${UNION_TWIN_DB}" owner "${APP_USER}";
SQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$APP_DB" <<SQL
create schema agent_manager;
alter schema agent_manager owner to "${APP_USER}";

create schema ngsi_translator;
alter schema ngsi_translator owner to "${APP_USER}";

create schema member;
alter schema member owner to "${APP_USER}";

-- file-service 가 기동 시 이 스키마를 요구한다. 없으면 컨테이너가 재시작을 반복한다.
create schema file_service;
alter schema file_service owner to "${APP_USER}";
SQL

echo "[init] postgres: ${APP_DB}, ${UNION_TWIN_DB} 생성 완료 (owner=${APP_USER})"

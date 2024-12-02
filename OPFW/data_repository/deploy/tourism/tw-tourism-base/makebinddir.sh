#!/bin/bash
source loadenv.sh
loadEnv .env

mkdir -p ./docker-bind/generated-data/db/mysql
mkdir -p ./docker-bind/generated-data/mimir-grafana/minio-data
mkdir -p ./docker-bind/generated-data/mimir-grafana/grafana-data
mkdir -p ./docker-bind/generated-data/logs/nginx
mkdir -p ./docker-bind/generated-data/mimir-grafana/mimir-1-data
mkdir -p ./docker-bind/generated-data/mimir-grafana/mimir-2-data
mkdir -p ./docker-bind/generated-data/mimir-grafana/mimir-3-data
mkdir -p ./docker-bind/generated-data/logs/${TW_DATA_INTERFACE__APP_NAME}

chmod 755 ./docker-bind
#!/bin/bash
source ./loadenv.sh
loadEnv .env

mkdir -p ./docker-bind/init-data/${TW_REPOSITORY__APP_NAME}/svc/webapps
mkdir -p ./docker-bind/generated-data/files
mkdir -p ./docker-bind/generated-data/db/mysql
mkdir -p ./docker-bind/generated-data/logs/${TW_REPOSITORY__APP_NAME}

chmod -R 775 ./docker-bind